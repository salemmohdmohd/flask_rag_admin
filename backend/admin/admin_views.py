import os
from flask import current_app
from flask_admin.contrib.sqla import ModelView
from .. import db
from ..models.user_models import User, Role
from ..models.chat_models import ChatHistory
from ..models.feedback_models import Feedback
from ..models.settings_models import UserSettings
from ..models.audit_models import FileAuditLog


def register_admin_views(admin):
    admin.add_view(ModelView(User, db.session))
    admin.add_view(ModelView(Role, db.session))
    admin.add_view(ModelView(ChatHistory, db.session))
    admin.add_view(ModelView(Feedback, db.session))
    admin.add_view(ModelView(UserSettings, db.session))
    admin.add_view(ModelView(FileAuditLog, db.session))
