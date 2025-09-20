"""
Flask-Admin views for persona management.
"""

import os
import re
from pathlib import Path
from flask import flash, redirect, url_for, request
from flask_admin import BaseView, expose
from flask_admin.contrib.sqla import ModelView
from wtforms import TextAreaField
from ..models.persona_models import Persona
from ..models import db


class PersonaAdminView(ModelView):
    """Flask-Admin view for managing personas."""

    # Enable create and edit functionality
    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True

    # Column configuration - working list view
    column_list = ["id", "name", "display_name", "is_active", "is_default"]
    column_searchable_list = ["name", "display_name"]
    column_filters = ["is_active", "is_default"]
    column_sortable_list = ["id", "name", "display_name", "is_active", "is_default"]

    # Enable details view to see all data
    column_details_list = [
        "id",
        "name",
        "display_name",
        "description",
        "expertise_areas",
        "default_temperature",
        "max_tokens",
        "prompt_content",
        "is_active",
        "is_default",
        "created_at",
        "updated_at",
    ]

    # Simplified form configuration
    form_excluded_columns = ["id", "created_at", "updated_at"]

    # Custom form creation to avoid tuple errors
    def scaffold_form(self):
        """Override form scaffolding to avoid WTForms tuple issues."""
        from wtforms import (
            Form,
            StringField,
            TextAreaField,
            FloatField,
            IntegerField,
            BooleanField,
        )
        from wtforms.validators import DataRequired, Length, NumberRange

        class PersonaForm(Form):
            name = StringField(
                "Persona Name", validators=[DataRequired(), Length(min=2, max=100)]
            )
            display_name = StringField(
                "Display Name", validators=[DataRequired(), Length(min=2, max=200)]
            )
            description = TextAreaField(
                "Description", validators=[DataRequired(), Length(min=10, max=1000)]
            )
            expertise_areas = TextAreaField(
                "Expertise Areas (one per line or comma-separated)"
            )
            default_temperature = FloatField(
                "Temperature (0.0-1.0)",
                validators=[NumberRange(min=0.0, max=1.0)],
                default=0.3,
            )
            max_tokens = IntegerField(
                "Max Tokens", validators=[NumberRange(min=100, max=4096)], default=2048
            )
            prompt_content = TextAreaField("Persona Prompt")
            is_active = BooleanField("Active", default=True)
            is_default = BooleanField("Default Persona", default=False)

        return PersonaForm  # Validation and processing

    def create_model(self, form):
        """Create new model with default values."""
        try:
            model = self.model()
            form.populate_obj(model)

            # Set default values for new personas
            if (
                not hasattr(model, "default_temperature")
                or model.default_temperature is None
            ):
                model.default_temperature = 0.3
            if not hasattr(model, "max_tokens") or model.max_tokens is None:
                model.max_tokens = 2048
            if not hasattr(model, "is_active"):
                model.is_active = True
            if not hasattr(model, "is_default"):
                model.is_default = False

            self.on_model_change(form, model, True)
            self.session.add(model)
            self._on_model_change(form, model, True)
            self.session.commit()
        except Exception as ex:
            if not self.handle_view_exception(ex):
                flash(f"Failed to create record: {str(ex)}", "error")
            self.session.rollback()
            return False
        else:
            self.after_model_change(form, model, True)

        return model

    def on_model_change(self, form, model, is_created):
        """Process form data before saving."""
        # Validate required fields
        if not model.name or len(model.name.strip()) < 2:
            raise ValueError(
                "Persona name is required and must be at least 2 characters long"
            )

        if not model.display_name or len(model.display_name.strip()) < 2:
            raise ValueError(
                "Display name is required and must be at least 2 characters long"
            )

        if not model.description or len(model.description.strip()) < 10:
            raise ValueError(
                "Description is required and must be at least 10 characters long"
            )

        # Validate name format
        import re

        if not re.match(r"^[a-z0-9_]+$", model.name.strip()):
            raise ValueError(
                "Persona name can only contain lowercase letters, numbers, and underscores"
            )

        # Validate numeric fields
        if model.default_temperature is not None and (
            model.default_temperature < 0.0 or model.default_temperature > 1.0
        ):
            raise ValueError("Temperature must be between 0.0 and 1.0")

        if model.max_tokens is not None and (
            model.max_tokens < 100 or model.max_tokens > 4096
        ):
            raise ValueError("Max tokens must be between 100 and 4096")

        # Validate and process expertise areas
        if hasattr(form, "expertise_areas") and form.expertise_areas.data:
            areas = form.expertise_areas.data
            if isinstance(areas, str):
                # Split by comma or newline and clean up
                areas = [area.strip() for area in areas.replace("\n", ",").split(",")]
                areas = [area for area in areas if area]  # Remove empty strings
            model.expertise_areas = areas

        # Ensure name is lowercase and valid
        if hasattr(form, "name") and form.name.data:
            model.name = form.name.data.lower().strip()

        # Handle default persona logic
        if hasattr(form, "is_default") and form.is_default.data:
            # If setting as default, unset all other defaults
            Persona.query.filter_by(is_default=True).update({"is_default": False})
            db.session.flush()  # Flush to ensure the update happens before commit

        # Auto-generate basic prompt if not provided
        if not model.prompt_content and model.display_name and model.description:
            model.prompt_content = self._generate_basic_prompt(model)

    def _generate_basic_prompt(self, model):
        """Generate a basic prompt template for new personas."""
        expertise_text = ""
        if model.expertise_areas:
            expertise_list = "\n".join([f"- {area}" for area in model.expertise_areas])
            expertise_text = f"\n\n## Expertise Areas\n{expertise_list}"

        return f"""# {model.display_name}

{model.description}

You are a highly experienced {model.display_name.lower()} with deep expertise in your field. You excel at providing clear, actionable advice and insights.{expertise_text}

## Communication Style
- Provide clear, practical guidance
- Use examples when helpful
- Ask clarifying questions when needed
- Offer actionable next steps
- Maintain a professional but approachable tone

Always ground your responses in your expertise while being helpful and accessible."""

    def after_model_change(self, form, model, is_created):
        """Handle post-save operations."""
        try:
            # Create/update persona markdown file
            self._update_persona_file(model)

            if is_created:
                flash(
                    f'Persona "{model.display_name}" created successfully!', "success"
                )
            else:
                flash(
                    f'Persona "{model.display_name}" updated successfully!', "success"
                )

        except Exception as e:
            flash(f"Persona saved but file update failed: {str(e)}", "warning")

    def _update_persona_file(self, model):
        """Create or update the persona markdown file."""
        if not model.prompt_content:
            return

        # Get the personas directory
        current_dir = Path(__file__).parent.parent
        personas_dir = current_dir / "resources" / "docs" / "personas"
        personas_dir.mkdir(parents=True, exist_ok=True)

        # Create the file path
        file_path = personas_dir / f"{model.name}.md"

        # Write the content
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(model.prompt_content)

    def on_model_delete(self, model):
        """Handle persona deletion."""
        # Prevent deletion of default persona
        if model.is_default:
            raise ValueError(
                "Cannot delete the default persona. Please set another persona as default first."
            )

        # Remove the associated file
        try:
            current_dir = Path(__file__).parent.parent
            file_path = (
                current_dir / "resources" / "docs" / "personas" / f"{model.name}.md"
            )
            if file_path.exists():
                file_path.unlink()
        except Exception as e:
            flash(f"Persona deleted but file removal failed: {str(e)}", "warning")


class PersonaManagerView(BaseView):
    """Custom view for persona management operations."""

    @expose("/")
    def index(self):
        """Main persona management dashboard."""
        active_personas = Persona.get_active_personas()
        default_persona = Persona.get_default_persona()

        return self.render(
            "admin/persona_manager.html",
            personas=active_personas,
            default_persona=default_persona,
        )

    @expose("/set-default/<int:persona_id>")
    def set_default(self, persona_id):
        """Set a persona as default."""
        try:
            persona = Persona.query.get_or_404(persona_id)
            persona.set_as_default()
            flash(f'"{persona.display_name}" is now the default persona.', "success")
        except Exception as e:
            flash(f"Error setting default persona: {str(e)}", "error")

        return redirect(url_for(".index"))

    @expose("/toggle-active/<int:persona_id>")
    def toggle_active(self, persona_id):
        """Toggle persona active status."""
        try:
            persona = Persona.query.get_or_404(persona_id)

            if persona.is_default and persona.is_active:
                flash(
                    "Cannot deactivate the default persona. Please set another persona as default first.",
                    "error",
                )
                return redirect(url_for(".index"))

            persona.is_active = not persona.is_active
            db.session.commit()

            status = "activated" if persona.is_active else "deactivated"
            flash(f'Persona "{persona.display_name}" {status}.', "success")

        except Exception as e:
            flash(f"Error updating persona: {str(e)}", "error")

        return redirect(url_for(".index"))
