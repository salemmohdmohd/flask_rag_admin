import os
from datetime import datetime
from flask import session, redirect, request, url_for
from flask_admin import AdminIndexView, BaseView, expose
from flask_admin.contrib.sqla import ModelView
from ..models import User
from .. import db


def _current_admin_user():
    user_id = session.get("admin_user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


def _is_admin():
    user = _current_admin_user()
    if not user:
        return False
    return any(r.name == "admin" for r in user.roles)


class SecuredAdminIndexView(AdminIndexView):
    @expose("/")
    def index(self):
        if not _is_admin():
            return redirect(url_for("admin_login", next=request.url))
        # Lazy imports to avoid circular dependencies
        try:
            from ..models.chat_models import ChatHistory
            from ..models.feedback_models import Feedback
            from ..models.settings_models import UserSettings
            from ..models.audit_models import FileAuditLog
            from ..models.user_models import Role
        except Exception:
            ChatHistory = Feedback = UserSettings = FileAuditLog = Role = None

        users_count = User.query.count()
        admins_count = 0
        if Role is not None:
            try:
                admins_count = (
                    db.session.query(User)
                    .join(User.roles)
                    .filter(Role.name == "admin")
                    .count()
                )
            except Exception:
                admins_count = 0
        chats_count = ChatHistory.query.count() if ChatHistory else 0
        feedback_count = Feedback.query.count() if Feedback else 0
        settings_count = UserSettings.query.count() if UserSettings else 0

        # Resources (.md) count
        resources_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "resources")
        )
        resources_md = 0
        if os.path.isdir(resources_dir):
            for _root, _dirs, files in os.walk(resources_dir):
                resources_md += sum(1 for f in files if f.lower().endswith(".md"))

        recent_audit = []
        if FileAuditLog is not None:
            try:
                q = FileAuditLog.query.order_by(FileAuditLog.timestamp.desc()).limit(5)
                recent_audit = [
                    {
                        "id": a.id,
                        "file_path": a.file_path,
                        "action": a.action,
                        "timestamp": a.timestamp,
                        "user_id": a.user_id,
                    }
                    for a in q
                ]
            except Exception:
                recent_audit = []

        return self.render(
            "admin/index.html",
            metrics={
                "users": users_count,
                "admins": admins_count,
                "chats": chats_count,
                "feedback": feedback_count,
                "settings": settings_count,
                "resources_md": resources_md,
            },
            recent_audit=recent_audit,
        )


class SecuredModelView(ModelView):
    def is_accessible(self):
        return _is_admin()

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for("admin_login", next=request.url))


class SecuredBaseView(BaseView):
    def is_accessible(self):
        return _is_admin()

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for("admin_login", next=request.url))
