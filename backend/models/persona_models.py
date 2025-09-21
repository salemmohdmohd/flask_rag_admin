"""
Persona database models for dynamic persona management through Flask-Admin.
"""

from datetime import datetime
from typing import List
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from ..models import db


class Persona(db.Model):
    """Database model for AI personas."""

    __tablename__ = "personas"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    display_name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    expertise_areas = db.Column(
        db.JSON, nullable=False, default=list
    )  # List of strings
    default_temperature = db.Column(db.Float, nullable=False, default=0.3)
    max_tokens = db.Column(db.Integer, nullable=False, default=2048)
    prompt_content = db.Column(
        db.Text, nullable=True
    )  # Store the actual persona prompt
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    is_default = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self):
        return f"<Persona {self.name}: {self.display_name}>"

    @property
    def status_display(self):
        """Get a formatted status display."""
        status = "✅ Active" if self.is_active else "❌ Inactive"
        if self.is_default:
            status += " 🌟 Default"
        return status

    @property
    def expertise_display(self):
        """Get a formatted expertise areas display."""
        if not self.expertise_areas:
            return "No specialization"
        if len(self.expertise_areas) <= 3:
            return ", ".join(self.expertise_areas)
        return f"{', '.join(self.expertise_areas[:3])} (+{len(self.expertise_areas) - 3} more)"

    @property
    def config_summary(self):
        """Get a summary of configuration settings."""
        return f"Temp: {self.default_temperature}, Max tokens: {self.max_tokens}"

    def to_dict(self):
        """Convert persona to dictionary format."""
        return {
            "id": self.id,
            "name": self.name,
            "display_name": self.display_name,
            "description": self.description,
            "expertise_areas": self.expertise_areas or [],
            "default_temperature": self.default_temperature,
            "max_tokens": self.max_tokens,
            "prompt_content": self.prompt_content,
            "is_active": self.is_active,
            "is_default": self.is_default,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def get_active_personas(cls):
        """Get all active personas."""
        return cls.query.filter_by(is_active=True).order_by(cls.display_name).all()

    @classmethod
    def get_default_persona(cls):
        """Get the default persona."""
        return cls.query.filter_by(is_default=True, is_active=True).first()

    @classmethod
    def get_by_name(cls, name: str):
        """Get persona by name."""
        return cls.query.filter_by(name=name, is_active=True).first()

    def set_as_default(self):
        """Set this persona as the default (and unset others)."""
        # First, unset all other default personas
        cls = self.__class__
        cls.query.filter_by(is_default=True).update({"is_default": False})

        # Set this one as default
        self.is_default = True
        db.session.commit()

    def toggle_active(self):
        """Toggle the active status of this persona."""
        self.is_active = not self.is_active
        self.updated_at = datetime.utcnow()
        db.session.commit()
        return self.is_active

    def duplicate(self, new_name: str, new_display_name: str = None):
        """Create a duplicate of this persona with a new name."""
        if not new_display_name:
            new_display_name = f"{self.display_name} (Copy)"

        duplicate = Persona(
            name=new_name,
            display_name=new_display_name,
            description=self.description,
            expertise_areas=self.expertise_areas.copy() if self.expertise_areas else [],
            default_temperature=self.default_temperature,
            max_tokens=self.max_tokens,
            prompt_content=self.prompt_content,
            is_active=True,
            is_default=False,
        )
        db.session.add(duplicate)
        db.session.commit()
        return duplicate

    @classmethod
    def get_stats(cls):
        """Get statistics about personas."""
        total = cls.query.count()
        active = cls.query.filter_by(is_active=True).count()
        default = cls.query.filter_by(is_default=True).first()

        return {
            "total": total,
            "active": active,
            "inactive": total - active,
            "default_persona": default.display_name if default else None,
        }

    @classmethod
    def create_default_personas(cls):
        """Create a set of default personas if none exist."""
        if cls.query.count() > 0:
            return []  # Don't create if personas already exist

        default_personas = [
            {
                "name": "general_assistant",
                "display_name": "General Assistant",
                "description": "A helpful AI assistant for general questions and tasks",
                "expertise_areas": ["general knowledge", "problem solving", "research"],
                "prompt_content": "You are a helpful, knowledgeable assistant ready to help with various tasks.",
                "is_default": True,
            },
            {
                "name": "technical_expert",
                "display_name": "Technical Expert",
                "description": "Specialized in programming, software development, and technical topics",
                "expertise_areas": [
                    "programming",
                    "software development",
                    "debugging",
                    "architecture",
                ],
                "prompt_content": "You are a technical expert with deep knowledge in programming and software development.",
            },
            {
                "name": "creative_writer",
                "display_name": "Creative Writer",
                "description": "Assists with creative writing, storytelling, and content creation",
                "expertise_areas": [
                    "creative writing",
                    "storytelling",
                    "content creation",
                    "editing",
                ],
                "prompt_content": "You are a creative writing assistant, helping with storytelling and content creation.",
            },
        ]

        created_personas = []
        for persona_data in default_personas:
            persona = cls(**persona_data)
            db.session.add(persona)
            created_personas.append(persona)

        db.session.commit()
        return created_personas

    @staticmethod
    def validate_name(name: str) -> bool:
        """Validate persona name format."""
        import re

        # Allow only lowercase letters, numbers, and underscores
        return bool(re.match(r"^[a-z0-9_]+$", name))

    @staticmethod
    def validate_expertise_areas(areas) -> List[str]:
        """Validate and clean expertise areas."""
        if not areas:
            return []

        if isinstance(areas, str):
            # If it's a string, split by comma or newline
            areas = [area.strip() for area in areas.replace("\n", ",").split(",")]

        # Filter out empty strings and return unique values
        return list(set([area.strip() for area in areas if area.strip()]))
