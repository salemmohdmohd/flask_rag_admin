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
from .models.persona_models import Persona
from .models.resource_models import Resource
from .rag_pipeline_llm_driven import answer_query, answer_query_with_client_documents


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

    # Require explicit session_id - no auto-generation
    if not session_id:
        return {"error": "Session ID required. Please create a session first."}, 400

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


@api_bp.post("/chat/message/client-documents")
def chat_message_with_client_documents():
    """
    Chat endpoint that accepts documents from client-side storage
    instead of reading from server files.

    Now supports both full documents and pre-filtered chunks from client-side semantic search.
    """
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401

    data = request.get_json() or {}
    message = (data.get("message") or "").strip()
    session_id = (data.get("session_id") or "").strip()
    persona_name = (data.get("persona_name") or "").strip() or None
    documents = data.get("documents", [])  # Array of {filename, content} objects
    search_method = data.get(
        "search_method", "full_documents"
    )  # "semantic_search" or "full_documents"

    if not message:
        return {"error": "Message required"}, 400

    # Require explicit session_id - no auto-generation
    if not session_id:
        return {"error": "Session ID required. Please create a session first."}, 400

    try:
        # Use client-side RAG function
        response, source_info, context = answer_query_with_client_documents(
            message, documents, user.id, session_id, persona_name
        )

        # Add search method info to context
        if context:
            context["search_method"] = search_method
            context["documents_received"] = len(documents)

        chat = ChatHistory(
            user_id=user.id,
            session_id=session_id,
            message=message,
            response=response,
            source_file=source_info,
            context=context,
        )
        db.session.add(chat)
        db.session.commit()

        return {
            "id": chat.id,
            "message": message,
            "response": response,
            "source_file": source_info,
            "session_id": session_id,
            "token_usage": (context or {}).get("token_usage"),
            "follow_up_suggestions": (context or {}).get("follow_up_suggestions", []),
            "persona": (context or {}).get("persona"),
            "search_method": search_method,
        }
    except Exception as e:
        return {"error": f"Chat processing failed: {str(e)}"}, 500


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


@api_bp.get("/resources")
def get_resources():
    """Get all available knowledge base resources for the current user."""
    user = _auth_user()
    if not user:
        return {"error": "Authentication required"}, 401

    # Get server-side resources (including system defaults with user_id=1)
    resources = Resource.query.filter(
        Resource.is_active == True,
        (Resource.user_id == user.id) | (Resource.user_id == 1),
    ).all()

    resources_list = []
    for resource in resources:
        resources_list.append(
            {
                "id": resource.id,
                "filename": resource.filename,
                "filepath": resource.filepath,
                "subdirectory": resource.subdirectory,
                "file_size": resource.file_size,
                "content_preview": resource.content_preview,
                "is_active": resource.is_active,
                "is_indexed": resource.is_indexed,
                "user_id": resource.user_id,  # Add user_id to identify system vs user resources
                "created_at": (
                    resource.created_at.isoformat() if resource.created_at else None
                ),
                "updated_at": (
                    resource.updated_at.isoformat() if resource.updated_at else None
                ),
                "last_indexed_at": (
                    resource.last_indexed_at.isoformat()
                    if resource.last_indexed_at
                    else None
                ),
            }
        )

    return {"resources": resources_list}


@api_bp.get("/resources/<int:resource_id>/content")
def get_resource_content(resource_id):
    """Get the content of a specific resource."""
    user = _auth_user()
    if not user:
        return {"error": "Authentication required"}, 401

    resource = Resource.query.filter(
        Resource.id == resource_id,
        Resource.is_active == True,
        (Resource.user_id == user.id) | (Resource.user_id == 1),
    ).first()

    if not resource:
        return {"error": "Resource not found"}, 404

    try:
        content = resource.get_content()
        return {
            "id": resource.id,
            "filename": resource.filename,
            "content": content,
            "file_size": resource.file_size,
        }
    except Exception as e:
        current_app.logger.error(f"Error reading resource content: {e}")
        return {"error": "Failed to read resource content"}, 500


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
def get_personas():
    """Get all active personas for the current user, including system defaults."""
    user = _auth_user()
    if not user:
        return {"error": "Authentication required"}, 401

    # Get user-specific personas AND system default personas (user_id=1)
    personas = Persona.query.filter(
        Persona.is_active == True, (Persona.user_id == user.id) | (Persona.user_id == 1)
    ).all()

    personas_list = []
    for persona in personas:
        personas_list.append(
            {
                "id": persona.id,
                "name": persona.name,
                "display_name": persona.display_name,
                "description": persona.description,
                "expertise_areas": persona.expertise_areas or [],
                "is_current": persona.is_default,
                "is_active": persona.is_active,
                "is_default": persona.is_default,
                "user_id": persona.user_id,  # Add user_id to identify system vs user personas
                "temperature": (
                    float(persona.default_temperature)
                    if persona.default_temperature
                    else 0.3
                ),
                "default_temperature": (
                    float(persona.default_temperature)
                    if persona.default_temperature
                    else 0.3
                ),
                "max_tokens": persona.max_tokens or 2048,
                "created_at": (
                    persona.created_at.isoformat() if persona.created_at else None
                ),
            }
        )

    # Set current persona if any persona is marked as default
    current_persona = None
    for persona in personas:
        if persona.is_default:
            current_persona = persona.name
            break

    return {"personas": personas_list, "current": current_persona}


@api_bp.get("/personas/current")
def get_current_persona():
    """Get the current active persona."""
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401

    from .models.persona_models import Persona

    # Get the default/current persona for the user
    current_persona = Persona.query.filter_by(
        is_default=True, is_active=True, user_id=user.id
    ).first()

    if not current_persona:
        # If no default persona, get the first active one for the user
        current_persona = Persona.query.filter_by(
            is_active=True, user_id=user.id
        ).first()

    if not current_persona:
        return {"error": "No active persona found"}, 404

    persona_dict = {
        "name": current_persona.name,
        "display_name": current_persona.display_name,
        "description": current_persona.description,
        "expertise_areas": current_persona.expertise_areas or [],
        "is_current": True,
        "is_active": current_persona.is_active,
        "default_temperature": (
            float(current_persona.default_temperature)
            if current_persona.default_temperature
            else 0.3
        ),
        "max_tokens": current_persona.max_tokens or 2048,
    }

    return {"persona": persona_dict}


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

    from .models.persona_models import Persona

    # Find the requested persona for the current user
    new_persona = Persona.query.filter_by(
        name=persona_name, is_active=True, user_id=user.id
    ).first()
    if not new_persona:
        return {"error": f"Persona '{persona_name}' not found"}, 404

    # Reset all personas to not default for current user only
    Persona.query.filter_by(user_id=user.id).update({Persona.is_default: False})

    # Set the new persona as default
    new_persona.is_default = True
    db.session.commit()

    # Return the updated persona info
    persona_dict = {
        "name": new_persona.name,
        "display_name": new_persona.display_name,
        "description": new_persona.description,
        "expertise_areas": new_persona.expertise_areas or [],
        "is_current": True,
        "is_active": new_persona.is_active,
        "default_temperature": (
            float(new_persona.default_temperature)
            if new_persona.default_temperature
            else 0.3
        ),
        "max_tokens": new_persona.max_tokens or 2048,
    }

    return {
        "message": f"Switched to {new_persona.display_name}",
        "persona": persona_dict,
    }


@api_bp.get("/personas/<persona_name>")
def get_persona_details(persona_name):
    """Get detailed information about a specific persona."""
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401

    from .models.persona_models import Persona

    # Find the requested persona for the current user
    persona = Persona.query.filter_by(
        name=persona_name, is_active=True, user_id=user.id
    ).first()
    if not persona:
        return {"error": f"Persona '{persona_name}' not found for current user"}, 404

    persona_dict = {
        "name": persona.name,
        "display_name": persona.display_name,
        "description": persona.description,
        "expertise_areas": persona.expertise_areas or [],
        "is_current": persona.is_default,
        "is_active": persona.is_active,
        "default_temperature": (
            float(persona.default_temperature) if persona.default_temperature else 0.3
        ),
        "max_tokens": persona.max_tokens or 2048,
        "prompt_content": persona.prompt_content,
    }

    return {"persona": persona_dict, "prompt_content": persona.prompt_content}


@api_bp.post("/personas")
def create_persona():
    """Create a new persona for the current user."""
    user = _auth_user()
    if not user:
        return {"error": "Authentication required"}, 401

    data = request.get_json() or {}

    # Validate required fields
    name = (data.get("name") or "").strip()
    display_name = (data.get("display_name") or "").strip()
    description = (data.get("description") or "").strip()

    if not name or not display_name or not description:
        return {"error": "name, display_name, and description are required"}, 400

    # Check if persona name already exists for this user
    existing_persona = Persona.query.filter_by(name=name, user_id=user.id).first()
    if existing_persona:
        return {"error": f"Persona with name '{name}' already exists"}, 409

    try:
        # Create new persona
        persona = Persona(
            name=name,
            display_name=display_name,
            description=description,
            expertise_areas=data.get("expertise_areas", []),
            default_temperature=data.get("default_temperature", 0.3),
            max_tokens=data.get("max_tokens", 2048),
            prompt_content=data.get("prompt_content", ""),
            is_active=data.get("is_active", True),
            is_default=data.get("is_default", False),
            user_id=user.id,
        )

        # If this is marked as default, unset other defaults for this user
        if persona.is_default:
            Persona.query.filter_by(user_id=user.id).update({Persona.is_default: False})

        db.session.add(persona)
        db.session.commit()

        return {
            "message": "Persona created successfully",
            "persona": {
                "id": persona.id,
                "name": persona.name,
                "display_name": persona.display_name,
                "description": persona.description,
                "expertise_areas": persona.expertise_areas or [],
                "default_temperature": float(persona.default_temperature),
                "max_tokens": persona.max_tokens,
                "is_active": persona.is_active,
                "is_default": persona.is_default,
            },
        }, 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating persona: {e}")
        return {"error": "Failed to create persona"}, 500


@api_bp.put("/personas/<int:persona_id>")
def update_persona(persona_id):
    """Update an existing persona."""
    user = _auth_user()
    if not user:
        return {"error": "Authentication required"}, 401

    persona = Persona.query.filter_by(id=persona_id, user_id=user.id).first()
    if not persona:
        return {"error": "Persona not found"}, 404

    data = request.get_json() or {}

    try:
        # Update fields if provided
        if "display_name" in data:
            persona.display_name = data["display_name"].strip()
        if "description" in data:
            persona.description = data["description"].strip()
        if "expertise_areas" in data:
            persona.expertise_areas = data["expertise_areas"]
        if "default_temperature" in data:
            persona.default_temperature = data["default_temperature"]
        if "max_tokens" in data:
            persona.max_tokens = data["max_tokens"]
        if "prompt_content" in data:
            persona.prompt_content = data["prompt_content"]
        if "is_active" in data:
            persona.is_active = data["is_active"]
        if "is_default" in data:
            persona.is_default = data["is_default"]
            # If setting as default, unset others
            if persona.is_default:
                Persona.query.filter_by(user_id=user.id).filter(
                    Persona.id != persona_id
                ).update({Persona.is_default: False})

        db.session.commit()

        return {
            "message": "Persona updated successfully",
            "persona": {
                "id": persona.id,
                "name": persona.name,
                "display_name": persona.display_name,
                "description": persona.description,
                "expertise_areas": persona.expertise_areas or [],
                "default_temperature": float(persona.default_temperature),
                "max_tokens": persona.max_tokens,
                "is_active": persona.is_active,
                "is_default": persona.is_default,
            },
        }

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating persona: {e}")
        return {"error": "Failed to update persona"}, 500


@api_bp.delete("/personas/<int:persona_id>")
def delete_persona(persona_id):
    """Delete a persona."""
    user = _auth_user()
    if not user:
        return {"error": "Authentication required"}, 401

    persona = Persona.query.filter_by(id=persona_id, user_id=user.id).first()
    if not persona:
        return {"error": "Persona not found"}, 404

    try:
        # Check if this is the default persona
        if persona.is_default:
            return {"error": "Cannot delete the default persona"}, 400

        # Soft delete by setting is_active to False
        persona.is_active = False
        db.session.commit()

        current_app.logger.info(
            f"Persona {persona.name} (ID: {persona.id}) soft deleted by user {user.id}"
        )

        return {"message": "Persona deleted successfully", "persona_id": persona_id}

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting persona: {e}")
        return {"error": "Failed to delete persona"}, 500


@api_bp.post("/upload")
def upload_file():
    """Upload a new document file."""
    user = _auth_user()
    if not user:
        return {"error": "Authentication required"}, 401

    if "file" not in request.files:
        return {"error": "No file provided"}, 400

    file = request.files["file"]
    if file.filename == "":
        return {"error": "No file selected"}, 400

    # Validate file type
    allowed_extensions = {".txt", ".md", ".pdf", ".docx"}
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in allowed_extensions:
        return {
            "error": f"File type {file_ext} not allowed. Allowed types: {', '.join(allowed_extensions)}"
        }, 400

    try:
        # Secure the filename
        filename = secure_filename(file.filename)
        if not filename:
            return {"error": "Invalid filename"}, 400

        # Create upload directory if it doesn't exist
        upload_dir = Path(
            current_app.config.get("UPLOAD_FOLDER", "backend/resources/user")
        )
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename if file already exists
        file_path = upload_dir / filename
        counter = 1
        original_stem = file_path.stem
        while file_path.exists():
            file_path = upload_dir / f"{original_stem}_{counter}{file_ext}"
            counter += 1
            filename = file_path.name

        # Save the file
        file.save(str(file_path))
        file_size = file_path.stat().st_size

        # Create database record
        # Use relative path from the upload directory, not from cwd
        relative_path = f"user/{filename}"

        # Read content for preview
        content_preview = ""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                content_preview = content[:500] + ("..." if len(content) > 500 else "")
        except Exception:
            content_preview = "Could not read file content"

        resource = Resource(
            filename=filename,
            filepath=relative_path,
            subdirectory="user",
            file_size=file_size,
            content_preview=content_preview,
            is_active=True,
            user_id=user.id,
        )

        db.session.add(resource)
        db.session.commit()

        # --- Actual Indexing Step ---
        try:
            from .rag_pipeline_llm_driven import index_resource_document

            # Call your embedding/indexing function (must be implemented)
            indexing_result = index_resource_document(resource)
            if indexing_result is True:
                resource.mark_indexed()  # Only mark as indexed if successful
            else:
                current_app.logger.warning(
                    f"Indexing failed for resource {resource.id}: {indexing_result}"
                )
        except Exception as e:
            current_app.logger.error(
                f"Indexing error for resource {resource.id}: {str(e)}"
            )

        # Log the upload
        audit_log = FileAuditLog(
            user_id=user.id,
            action="upload",
            change_summary=f"Uploaded {filename}",
            file_path=relative_path,
        )
        db.session.add(audit_log)
        db.session.commit()

        return {
            "message": "File uploaded successfully",
            "file": {
                "id": resource.id,
                "filename": filename,
                "filepath": resource.filepath,
                "file_size": file_size,
                "is_active": True,
                "is_indexed": resource.is_indexed,
            },
        }, 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error uploading file: {e}")
        return {"error": "Failed to upload file"}, 500


@api_bp.get("/dashboard/user")
def get_user_info():
    """Get current user information and statistics."""
    user = _auth_user()
    if not user:
        return {"error": "Authentication required"}, 401

    # Get user statistics (including system defaults)
    total_documents = Resource.query.filter(
        Resource.is_active == True,
        (Resource.user_id == user.id) | (Resource.user_id == 1),
    ).count()
    total_personas = Persona.query.filter(
        Persona.is_active == True,
        (Persona.user_id == user.id) | (Persona.user_id == 1),
    ).count()
    total_chat_sessions = ChatHistory.query.filter_by(user_id=user.id).count()

    # Calculate storage used (including system defaults)
    total_storage = (
        db.session.query(db.func.sum(Resource.file_size))
        .filter(
            Resource.is_active == True,
            (Resource.user_id == user.id) | (Resource.user_id == 1),
        )
        .scalar()
        or 0
    )

    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "role": "User",  # Default role
            "stats": {
                "documents": total_documents,
                "personas": total_personas,
                "chat_sessions": total_chat_sessions,
                "storage_used": _format_file_size(total_storage),
            },
        }
    }


# Dashboard API Endpoints
@api_bp.get("/dashboard/documents")
def get_user_documents():
    """Get all documents for the current user."""
    user = _auth_user()
    if not user:
        return {"error": "Authentication required"}, 401

    # Get both user documents and system default resources (user_id=1)
    resources = Resource.query.filter(
        Resource.is_active == True,
        (Resource.user_id == user.id) | (Resource.user_id == 1),
    ).all()

    documents = []
    for resource in resources:
        documents.append(
            {
                "id": resource.id,
                "filename": resource.filename,
                "filepath": resource.filepath,
                "subdirectory": resource.subdirectory,
                "file_size": resource.file_size,
                "size_display": resource.size_display,
                "status_display": resource.status_display,
                "is_active": resource.is_active,
                "is_indexed": resource.is_indexed,
                "user_id": resource.user_id,  # Add user_id to identify system vs user resources
                "created_at": resource.created_at.isoformat(),
                "updated_at": resource.updated_at.isoformat(),
                "last_indexed_at": (
                    resource.last_indexed_at.isoformat()
                    if resource.last_indexed_at
                    else None
                ),
            }
        )

    return {"documents": documents, "total": len(documents)}


@api_bp.delete("/dashboard/documents/<int:document_id>")
def delete_user_document(document_id):
    """Delete a document for the current user."""
    user = _auth_user()
    if not user:
        return {"error": "Authentication required"}, 401

    resource = Resource.query.filter_by(id=document_id, user_id=user.id).first()
    if not resource:
        return {"error": "Document not found"}, 404

    # Delete the actual file if it exists
    try:
        file_path = resource.full_path
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        current_app.logger.warning(f"Could not delete file {resource.filepath}: {e}")

    # Delete the database record
    db.session.delete(resource)
    db.session.commit()

    return {"success": True, "message": "Document deleted successfully"}


@api_bp.get("/dashboard/settings")
def get_user_settings():
    """Get user settings."""
    user = _auth_user()
    if not user:
        return {"error": "Authentication required"}, 401

    settings = UserSettings.query.filter_by(user_id=user.id).first()
    if not settings:
        # Create default settings
        default_settings = {
            "theme": "light",
            "language": "en",
            "notifications": True,
            "auto_save": True,
        }
        settings = UserSettings(
            user_id=user.id,
            settings=default_settings,
        )
        db.session.add(settings)
        db.session.commit()

    return {
        "settings": settings.settings
        or {
            "theme": "light",
            "language": "en",
            "notifications": True,
            "auto_save": True,
        }
    }


@api_bp.put("/dashboard/settings")
def update_user_settings():
    """Update user settings."""
    user = _auth_user()
    if not user:
        return {"error": "Authentication required"}, 401

    data = request.get_json()
    if not data:
        return {"error": "No data provided"}, 400

    settings = UserSettings.query.filter_by(user_id=user.id).first()
    if not settings:
        settings = UserSettings(user_id=user.id, settings={})
        db.session.add(settings)

    # Update settings - merge with existing settings
    current_settings = settings.settings or {}
    settings_data = data.get("settings", data)

    # Update the settings JSON with new values
    current_settings.update(settings_data)
    settings.settings = current_settings
    settings.updated_at = datetime.utcnow()
    db.session.commit()

    return {"success": True, "message": "Settings updated successfully"}


@api_bp.post("/dashboard/settings")
def create_or_update_user_settings():
    """Create or update user settings (same as PUT for frontend compatibility)."""
    return update_user_settings()


@api_bp.delete("/dashboard/user")
def delete_user_account():
    """Delete user account and all associated data (non-reversible)."""
    user = _auth_user()
    if not user:
        return {"error": "Authentication required"}, 401

    data = request.get_json()
    confirmation = data.get("confirmation") if data else ""

    if confirmation != "DELETE MY ACCOUNT":
        return {"error": "Please type 'DELETE MY ACCOUNT' to confirm"}, 400

    try:
        # Delete user's files first
        resources = Resource.query.filter_by(user_id=user.id).all()
        for resource in resources:
            try:
                file_path = resource.full_path
                if file_path.exists():
                    file_path.unlink()
            except Exception as e:
                current_app.logger.warning(
                    f"Could not delete file {resource.filepath}: {e}"
                )

        # Delete all user data (foreign keys will cascade)
        db.session.delete(user)
        db.session.commit()

        return {"success": True, "message": "Account deleted successfully"}
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting user account: {e}")
        return {"error": "Failed to delete account"}, 500


@api_bp.get("/dashboard/analytics")
def get_user_analytics():
    """Get analytics for the current user."""
    user = _auth_user()
    if not user:
        return {"error": "Authentication required"}, 401

    # Get chat statistics
    total_chats = ChatHistory.query.filter_by(user_id=user.id).count()

    # Get document statistics (including system defaults)
    total_documents = Resource.query.filter(
        Resource.is_active == True,
        (Resource.user_id == user.id) | (Resource.user_id == 1),
    ).count()
    indexed_documents = Resource.query.filter(
        Resource.is_active == True,
        Resource.is_indexed == True,
        (Resource.user_id == user.id) | (Resource.user_id == 1),
    ).count()
    active_documents = Resource.query.filter(
        Resource.is_active == True,
        (Resource.user_id == user.id) | (Resource.user_id == 1),
    ).count()

    # Get persona statistics (including system defaults)
    total_personas = Persona.query.filter(
        Persona.is_active == True,
        (Persona.user_id == user.id) | (Persona.user_id == 1),
    ).count()
    active_personas = Persona.query.filter(
        Persona.is_active == True,
        (Persona.user_id == user.id) | (Persona.user_id == 1),
    ).count()

    # Calculate total storage used (including system defaults)
    total_storage = (
        db.session.query(db.func.sum(Resource.file_size))
        .filter(
            Resource.is_active == True,
            (Resource.user_id == user.id) | (Resource.user_id == 1),
        )
        .scalar()
        or 0
    )

    # Chat activity over last 7 days
    from datetime import timedelta

    week_ago = datetime.utcnow() - timedelta(days=7)
    daily_chats = []
    for i in range(7):
        day_start = week_ago + timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        count = ChatHistory.query.filter(
            ChatHistory.user_id == user.id,
            ChatHistory.created_at >= day_start,
            ChatHistory.created_at < day_end,
        ).count()
        daily_chats.append({"date": day_start.strftime("%Y-%m-%d"), "count": count})

    return {
        "analytics": {
            "chats": {"total": total_chats, "daily_activity": daily_chats},
            "documents": {
                "total": total_documents,
                "indexed": indexed_documents,
                "active": active_documents,
                "storage_bytes": total_storage,
                "storage_display": _format_file_size(total_storage),
            },
            "personas": {"total": total_personas, "active": active_personas},
        }
    }


def _format_file_size(size_bytes):
    """Format file size in human readable format."""
    if not size_bytes:
        return "0 bytes"

    for unit in ["bytes", "KB", "MB", "GB"]:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"
