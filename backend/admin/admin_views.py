import os
from flask import current_app, render_template
from flask_admin import expose
from .security import SecuredBaseView
from flask_admin.contrib.sqla import ModelView
from .. import db
from ..models.user_models import User, Role
from ..models.chat_models import ChatHistory
from ..models.feedback_models import Feedback
from ..models.settings_models import UserSettings
from ..models.audit_models import FileAuditLog


def register_admin_views(admin_app, SecuredModelView):
    admin_app.add_view(SecuredModelView(User, db.session))
    admin_app.add_view(SecuredModelView(Role, db.session))
    admin_app.add_view(SecuredModelView(ChatHistory, db.session))
    admin_app.add_view(SecuredModelView(Feedback, db.session))
    admin_app.add_view(SecuredModelView(UserSettings, db.session))
    admin_app.add_view(SecuredModelView(FileAuditLog, db.session))

    class ToolsView(SecuredBaseView):
        @expose("/")
        def index(self):
            return render_template("rag_admin.html")

    class EditorView(SecuredBaseView):
        @expose("/")
        def index(self):
            return render_template("file_editor.html")

    admin_app.add_view(ToolsView(name="Tools", endpoint="tools"))
    admin_app.add_view(EditorView(name="Editor", endpoint="editor"))
