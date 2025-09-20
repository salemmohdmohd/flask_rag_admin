import os
from pathlib import Path
import secrets
from datetime import datetime, timedelta
import jwt
from flask import current_app, g, session
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

from . import db
from .models.user_models import User, Role
from .models.chat_models import ChatHistory
from .models.feedback_models import Feedback
from .models.settings_models import UserSettings
from .models.session_models import Session
from .models.audit_models import FileAuditLog
from .rag_pipeline_llm_driven import answer_query


api_bp = Blueprint("api", __name__)


@api_bp.get("/health")
def health():
    return {"status": "ok"}


@api_bp.post("/auth/register")
def register():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not username or not email or not password:
        return {"error": "Missing fields"}, 400
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return {"error": "User exists"}, 409
    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return {"message": "Registered"}, 201


@api_bp.post("/auth/login")
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return {"error": "Invalid credentials"}, 401
    payload = {
        "sub": str(user.id),
        "username": user.username,
        "exp": datetime.utcnow()
        + timedelta(hours=current_app.config.get("JWT_EXPIRES_HOURS", 24)),
        "iat": datetime.utcnow(),
    }
    token = jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")
    return {"token": token, "user": {"id": user.id, "username": user.username}}


def _auth_user():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        # Fallback to admin session for server-rendered admin UI
        try:
            admin_user_id = session.get("admin_user_id")
            if admin_user_id:
                user = User.query.get(admin_user_id)
                if user:
                    g.current_user_id = user.id
                    return user
        except Exception:
            pass
        return None
    try:
        payload = jwt.decode(
            token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"]
        )
        user_id = int(payload.get("sub"))
        user = User.query.get(user_id)
        if user:
            g.current_user_id = user.id
        return user
    except Exception:
        return None


def _is_admin(user: User) -> bool:
    try:
        return any(getattr(r, "name", None) == "admin" for r in (user.roles or []))
    except Exception:
        return False


@api_bp.post("/auth/logout")
def logout():
    # Stateless JWT: logout is a no-op client side (just drop the token)
    return {"message": "Logged out"}


def _resources_dir() -> Path:
    return Path(os.path.join(os.path.dirname(__file__), "resources")).resolve()


def _is_safe_path(base: Path, candidate: Path) -> bool:
    try:
        base = base.resolve()
        candidate = candidate.resolve()
        return str(candidate).startswith(str(base))
    except Exception:
        return False


@api_bp.get("/admin/resource")
def admin_get_resource():
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401
    if not _is_admin(user):
        return {"error": "Forbidden"}, 403
    rel_path = (request.args.get("path") or "").strip().strip("/\\")
    if not rel_path:
        return {"error": "path required"}, 400
    base = _resources_dir()
    candidate = (base / rel_path).resolve()
    if not _is_safe_path(base, candidate):
        return {"error": "Invalid path"}, 400
    if not candidate.exists() or not candidate.is_file():
        return {"error": "Not found"}, 404
    if not str(candidate).lower().endswith(".md"):
        return {"error": "Only .md files are supported"}, 400
    try:
        content = candidate.read_text(encoding="utf-8")
    except Exception:
        return {"error": "Failed to read file"}, 500
    return {"path": rel_path, "content": content}


@api_bp.put("/admin/resource")
def admin_put_resource():
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401
    if not _is_admin(user):
        return {"error": "Forbidden"}, 403
    data = request.get_json(silent=True) or {}
    rel_path = (data.get("path") or "").strip().strip("/\\")
    content = data.get("content")
    if not rel_path:
        return {"error": "path required"}, 400
    if content is None:
        return {"error": "content required"}, 400
    base = _resources_dir()
    candidate = (base / rel_path).resolve()
    if not _is_safe_path(base, candidate):
        return {"error": "Invalid path"}, 400
    if not str(candidate).lower().endswith(".md"):
        return {"error": "Only .md files are supported"}, 400
    if not candidate.exists():
        # Create parent directories if needed
        candidate.parent.mkdir(parents=True, exist_ok=True)
    try:
        candidate.write_text(content, encoding="utf-8")
        log = FileAuditLog(
            file_path=str(Path(rel_path)),
            user_id=user.id,
            action="edit" if candidate.exists() else "create",
            change_summary=f"Edited {rel_path}",
        )
        db.session.add(log)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return {"error": "Failed to save file"}, 500
    return {"message": "Saved", "path": rel_path}


@api_bp.post("/chat/message")
def chat_message():
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401
    data = request.get_json() or {}
    message = (data.get("message") or "").strip()
    session_id = (data.get("session_id") or "").strip()
    persona_name = (data.get("persona_name") or "").strip() or None
    if not message:
        return {"error": "Message required"}, 400

    # Generate session_id if not provided
    if not session_id:
        import uuid

        session_id = str(uuid.uuid4())

    response, source_file, context = answer_query(
        message, user.id, session_id, persona_name
    )
    chat = ChatHistory(
        user_id=user.id,
        session_id=session_id,
        message=message,
        response=response,
        source_file=source_file,
        context=context,
    )
    db.session.add(chat)
    db.session.commit()
    return {
        "id": chat.id,
        "message": message,
        "response": response,
        "source_file": source_file,
        "session_id": session_id,
        "token_usage": (context or {}).get("token_usage"),
        "follow_up_suggestions": (context or {}).get("follow_up_suggestions", []),
        "persona": (context or {}).get("persona"),
    }


@api_bp.get("/chat/history")
def chat_history():
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401

    session_id = request.args.get("session_id")
    query = ChatHistory.query.filter_by(user_id=user.id)

    if session_id:
        query = query.filter_by(session_id=session_id)

    chats = query.order_by(ChatHistory.created_at.desc()).limit(50).all()
    return {
        "items": [
            {
                "id": c.id,
                "message": c.message,
                "response": c.response,
                "created_at": c.created_at.isoformat(),
                "source_file": c.source_file,
                "session_id": c.session_id,
                "token_usage": (
                    (c.context or {}).get("token_usage") if c.context else None
                ),
            }
            for c in chats
        ]
    }


@api_bp.post("/feedback")
def submit_feedback():
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401
    data = request.get_json() or {}
    chat_id = data.get("chat_history_id")
    rating = data.get("rating")
    comment = data.get("comment")
    if not chat_id or not rating:
        return {"error": "chat_history_id and rating required"}, 400
    fb = Feedback(
        user_id=user.id, chat_history_id=chat_id, rating=rating, comment=comment
    )
    db.session.add(fb)
    db.session.commit()
    return {"message": "Thanks for the feedback"}


@api_bp.get("/settings")
def get_settings():
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401
    s = UserSettings.query.filter_by(user_id=user.id).first()
    return {"settings": s.settings if s else {}}


@api_bp.put("/settings")
def put_settings():
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401
    data = request.get_json() or {}
    s = UserSettings.query.filter_by(user_id=user.id).first()
    if not s:
        s = UserSettings(user_id=user.id, settings=data)
        db.session.add(s)
    else:
        s.settings = data
    db.session.commit()
    return {"settings": s.settings}


@api_bp.post("/admin/reindex")
def admin_reindex():
    # Placeholder for reindex operation. In simple keyword search, no persistent index.
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401
    if not _is_admin(user):
        return {"error": "Forbidden"}, 403
    base = _resources_dir()
    total_md = 0
    if base.exists():
        for _root, _dirs, files in os.walk(base):
            total_md += sum(1 for f in files if f.lower().endswith(".md"))
    return {"message": "Reindex triggered", "resources_markdown": total_md}


@api_bp.get("/admin/resources")
def admin_list_resources():
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401
    if not _is_admin(user):
        return {"error": "Forbidden"}, 403
    base = _resources_dir()
    base.mkdir(parents=True, exist_ok=True)
    items = []
    for root, _dirs, files in os.walk(base):
        for name in files:
            if not name.lower().endswith(".md"):
                continue
            full = Path(root) / name
            rel = full.relative_to(base)
            stat = full.stat()
            items.append(
                {
                    "path": str(rel),
                    "size": stat.st_size,
                    "modified": datetime.utcfromtimestamp(stat.st_mtime).isoformat(),
                }
            )
    items.sort(key=lambda x: x["path"])  # stable listing
    return {"items": items}


@api_bp.post("/admin/resources")
def admin_upload_resource():
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401
    if not _is_admin(user):
        return {"error": "Forbidden"}, 403
    if "file" not in request.files:
        return {"error": "No file provided"}, 400
    file = request.files["file"]
    if file.filename == "":
        return {"error": "Empty filename"}, 400
    filename = secure_filename(file.filename)
    if not filename.lower().endswith(".md"):
        return {"error": "Only .md files are allowed"}, 400
    subdir = request.form.get("subdir", "").strip().strip("/\\")
    base = _resources_dir()
    target_dir = (base / subdir) if subdir else base
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = (target_dir / filename).resolve()
    if not _is_safe_path(base, target_path):
        return {"error": "Invalid path"}, 400
    file.save(str(target_path))
    # Audit log
    try:
        log = FileAuditLog(
            file_path=str(target_path.relative_to(base)),
            user_id=user.id,
            action="upload",
            change_summary=f"Uploaded {filename}",
        )
        db.session.add(log)
        db.session.commit()
    except Exception:
        db.session.rollback()
    return {"message": "Uploaded", "path": str(target_path.relative_to(base))}, 201


@api_bp.delete("/admin/resources")
def admin_delete_resource():
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401
    if not _is_admin(user):
        return {"error": "Forbidden"}, 403
    data = request.get_json(silent=True) or {}
    rel_path = (data.get("path") or "").strip().strip("/\\")
    if not rel_path:
        return {"error": "path required"}, 400
    base = _resources_dir()
    candidate = (base / rel_path).resolve()
    if not _is_safe_path(base, candidate):
        return {"error": "Invalid path"}, 400
    if not candidate.exists() or not candidate.is_file():
        return {"error": "Not found"}, 404
    if not str(candidate).lower().endswith(".md"):
        return {"error": "Only .md files can be deleted"}, 400
    try:
        candidate.unlink()
        log = FileAuditLog(
            file_path=str(Path(rel_path)),
            user_id=user.id,
            action="delete",
            change_summary=f"Deleted {rel_path}",
        )
        db.session.add(log)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return {"error": "Failed to delete"}, 500
    return {"message": "Deleted", "path": rel_path}


@api_bp.get("/admin/audit")
def admin_list_audit():
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401
    if not _is_admin(user):
        return {"error": "Forbidden"}, 403
    logs = FileAuditLog.query.order_by(FileAuditLog.timestamp.desc()).limit(100).all()
    return {
        "items": [
            {
                "id": l.id,
                "file_path": l.file_path,
                "user_id": l.user_id,
                "action": l.action,
                "timestamp": l.timestamp.isoformat(),
                "change_summary": l.change_summary,
            }
            for l in logs
        ]
    }


# Persona Management Endpoints
@api_bp.get("/personas")
def list_personas():
    """Get list of all available AI personas."""
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401

    from .persona_manager import get_persona_manager

    persona_manager = get_persona_manager()
    personas = persona_manager.get_available_personas()

    return {"personas": personas}


@api_bp.get("/personas/current")
def get_current_persona():
    """Get the current active persona."""
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401

    from .persona_manager import get_persona_manager

    persona_manager = get_persona_manager()
    current_persona = persona_manager.get_persona_metadata()

    if not current_persona:
        return {"error": "No active persona found"}, 404

    return {"persona": current_persona}


@api_bp.post("/personas/switch")
def switch_persona():
    """Switch to a different AI persona."""
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401

    data = request.get_json() or {}
    persona_name = (data.get("persona_name") or "").strip()

    if not persona_name:
        return {"error": "persona_name required"}, 400

    from .persona_manager import get_persona_manager

    persona_manager = get_persona_manager()

    success = persona_manager.set_current_persona(persona_name)
    if not success:
        return {"error": f"Persona '{persona_name}' not found"}, 404

    # Get the updated persona info
    current_persona = persona_manager.get_persona_metadata()

    return {
        "message": f"Switched to {current_persona['display_name']}",
        "persona": current_persona,
    }


@api_bp.get("/personas/<persona_name>")
def get_persona_details(persona_name):
    """Get detailed information about a specific persona."""
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401

    from .persona_manager import get_persona_manager

    persona_manager = get_persona_manager()

    persona_metadata = persona_manager.get_persona_metadata(persona_name)
    if not persona_metadata:
        return {"error": f"Persona '{persona_name}' not found"}, 404

    # Also get the full prompt content for advanced users
    persona_prompt = persona_manager.get_persona_prompt(persona_name)

    return {"persona": persona_metadata, "prompt_content": persona_prompt}
