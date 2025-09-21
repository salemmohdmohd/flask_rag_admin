import os
from flask import current_app
from flask_admin import expose
from flask_admin.form import BaseForm
from wtforms import (
    Form,
    StringField,
    TextAreaField,
    IntegerField,
    FloatField,
    BooleanField,
    SelectField,
)
from wtforms.validators import DataRequired, Length, NumberRange, Optional
from wtforms.widgets import TextArea
from .security import SecuredBaseView
from flask_admin.contrib.sqla import ModelView
from .. import db
from ..models.user_models import User, Role
from ..models.chat_models import ChatHistory
from ..models.feedback_models import Feedback
from ..models.settings_models import UserSettings
from ..models.audit_models import FileAuditLog
from ..models.persona_models import Persona
from ..models.resource_models import Resource


class ExpertiseAreasField(TextAreaField):
    """Custom field for handling expertise areas as comma-separated text."""

    def process_formdata(self, valuelist):
        if valuelist:
            # Convert comma-separated string to list
            raw_data = valuelist[0] if valuelist[0] else ""
            self.data = [area.strip() for area in raw_data.split(",") if area.strip()]
        else:
            self.data = []

    def _value(self):
        # Convert list back to comma-separated string for display
        if self.data:
            return ", ".join(self.data)
        return ""


class PersonaForm(BaseForm):
    """Custom form for Persona model to avoid WTForms tuple errors."""

    name = StringField("Name", [DataRequired(), Length(min=1, max=100)])
    display_name = StringField("Display Name", [DataRequired(), Length(min=1, max=200)])
    description = TextAreaField("Description", [DataRequired()])
    expertise_areas = ExpertiseAreasField(
        "Expertise Areas (comma-separated)", [Optional()]
    )
    default_temperature = FloatField(
        "Default Temperature",
        [DataRequired(), NumberRange(min=0.0, max=2.0)],
        default=0.3,
    )
    max_tokens = IntegerField(
        "Max Tokens", [DataRequired(), NumberRange(min=1)], default=2048
    )
    prompt_content = TextAreaField("Prompt Content", [Optional()])
    is_active = BooleanField("Is Active", default=True)
    is_default = BooleanField("Is Default", default=False)


class ResourceForm(BaseForm):
    """Custom form for Resource model to avoid WTForms tuple errors."""

    filename = StringField("Filename", [DataRequired(), Length(min=1, max=255)])
    filepath = StringField("File Path", [DataRequired(), Length(min=1, max=500)])
    subdirectory = StringField("Subdirectory", [Optional(), Length(max=255)])
    file_size = IntegerField("File Size", [Optional(), NumberRange(min=0)], default=0)
    content_preview = TextAreaField("Content Preview", [Optional()])
    is_active = BooleanField("Is Active", default=True)
    is_indexed = BooleanField("Is Indexed", default=False)


class FeedbackForm(BaseForm):
    """Custom form for Feedback model to avoid WTForms tuple errors."""

    user_id = IntegerField("User ID", [DataRequired()])
    chat_history_id = IntegerField("Chat History ID", [DataRequired()])
    rating = IntegerField("Rating", [DataRequired(), NumberRange(min=1, max=5)])
    comment = TextAreaField("Comment", [Optional()])


class CustomPersonaModelView(ModelView):
    """Custom ModelView for Persona with explicit form configuration."""

    form = PersonaForm
    column_list = [
        "name",
        "display_name",
        "status_display",
        "expertise_display",
        "config_summary",
    ]
    column_labels = {
        "status_display": "Status",
        "expertise_display": "Expertise",
        "config_summary": "Configuration",
    }
    form_excluded_columns = ["created_at", "updated_at"]
    can_create = True
    can_edit = True
    can_delete = True


class CustomResourceModelView(ModelView):
    """Custom ModelView for Resource with explicit form configuration."""

    form = ResourceForm
    column_list = [
        "filename",
        "subdirectory",
        "status_display",
        "size_display",
        "created_at",
    ]
    column_labels = {"status_display": "Status", "size_display": "Size"}
    form_excluded_columns = [
        "created_at",
        "updated_at",
        "last_indexed_at",
        "upload_user_id",
    ]
    can_create = True
    can_edit = True
    can_delete = True


class CustomFeedbackModelView(ModelView):
    """Custom ModelView for Feedback with explicit form configuration."""

    form = FeedbackForm
    column_list = ["user_id", "chat_history_id", "rating", "comment", "created_at"]
    form_excluded_columns = ["created_at"]
    can_create = True
    can_edit = True
    can_delete = True


def register_admin_views(admin_app, SecuredModelView):
    admin_app.add_view(SecuredModelView(User, db.session))
    admin_app.add_view(SecuredModelView(Role, db.session))
    admin_app.add_view(SecuredModelView(ChatHistory, db.session))
    admin_app.add_view(SecuredModelView(UserSettings, db.session))
    admin_app.add_view(SecuredModelView(FileAuditLog, db.session))

    # Use custom model views for problematic models
    class SecuredPersonaModelView(SecuredModelView, CustomPersonaModelView):
        pass

    class SecuredResourceModelView(SecuredModelView, CustomResourceModelView):
        pass

    class SecuredFeedbackModelView(SecuredModelView, CustomFeedbackModelView):
        pass

    admin_app.add_view(SecuredPersonaModelView(Persona, db.session))
    admin_app.add_view(SecuredResourceModelView(Resource, db.session))
    admin_app.add_view(SecuredFeedbackModelView(Feedback, db.session))
