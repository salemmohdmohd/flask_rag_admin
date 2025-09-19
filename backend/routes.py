import os
import secrets
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify

from . import db
from .models.user_models import User, Role
from .models.chat_models import ChatHistory
from .models.feedback_models import Feedback
from .models.settings_models import UserSettings
from .models.session_models import Session
from .rag_pipeline_simple import answer_query


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
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(days=1)
    sess = Session(user_id=user.id, session_token=token, expires_at=expires)
    db.session.add(sess)
    db.session.commit()
    return {"token": token, "user": {"id": user.id, "username": user.username}}


def _auth_user():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return None
    sess = Session.query.filter_by(session_token=token, is_active=True).first()
    if not sess or sess.expires_at < datetime.utcnow():
        return None
    return User.query.get(sess.user_id)


@api_bp.post("/auth/logout")
def logout():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return {"message": "ok"}
    sess = Session.query.filter_by(session_token=token, is_active=True).first()
    if sess:
        sess.is_active = False
        db.session.commit()
    return {"message": "Logged out"}


@api_bp.post("/chat/message")
def chat_message():
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401
    data = request.get_json() or {}
    message = (data.get("message") or "").strip()
    if not message:
        return {"error": "Message required"}, 400
    resources_dir = os.path.join(os.path.dirname(__file__), "resources")
    response, source_file, context = answer_query(message, resources_dir)
    chat = ChatHistory(
        user_id=user.id,
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
    }


@api_bp.get("/chat/history")
def chat_history():
    user = _auth_user()
    if not user:
        return {"error": "Unauthorized"}, 401
    chats = (
        ChatHistory.query.filter_by(user_id=user.id)
        .order_by(ChatHistory.created_at.desc())
        .limit(50)
        .all()
    )
    return {
        "items": [
            {
                "id": c.id,
                "message": c.message,
                "response": c.response,
                "created_at": c.created_at.isoformat(),
                "source_file": c.source_file,
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
    return {"message": "Reindex triggered"}
