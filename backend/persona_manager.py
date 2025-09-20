"""
Persona Management System for Dynamic AI Mode Switching

This module provides a flexible persona system that allows switching between
different AI expert modes (business analyst, career consultant, etc.) to
provide specialized responses based on user needs.

Now supports database-backed persona management through Flask-Admin.
"""

import os
import time
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class PersonaConfig:
    """Configuration for an AI persona/mode."""

    name: str
    display_name: str
    description: str
    file_path: str  # Relative to the personas directory
    expertise_areas: List[str]
    default_temperature: float = 0.3
    max_tokens: int = 2048


class PersonaManager:
    """Manages AI personas and their configurations."""

    def __init__(self, personas_dir: Optional[str] = None):
        """Initialize the persona manager.

        Args:
            personas_dir: Path to the personas directory. If None, uses backend/resources/docs/personas
        """
        if personas_dir is None:
            current_dir = Path(__file__).parent
            self.personas_dir = current_dir / "resources" / "docs" / "personas"
        else:
            self.personas_dir = Path(personas_dir)

        self._personas_cache: Dict[str, PersonaConfig] = {}
        self._cache_timestamp = 0
        self._cache_ttl = 300  # Cache for 5 minutes
        self._current_persona = "business_data_analyst"  # Default persona

        # Initialize with database personas
        self._load_personas_from_db()

    def _load_personas_from_db(self) -> None:
        """Load personas from database with caching."""
        current_time = time.time()

        # Check if cache is still valid
        if (
            current_time - self._cache_timestamp
        ) < self._cache_ttl and self._personas_cache:
            return

        try:
            # Import here to avoid circular imports
            from .models.persona_models import Persona

            # Get all active personas from database
            db_personas = Persona.get_active_personas()

            # Clear cache and rebuild
            self._personas_cache.clear()

            for persona in db_personas:
                # Convert database model to PersonaConfig
                persona_config = PersonaConfig(
                    name=persona.name,
                    display_name=persona.display_name,
                    description=persona.description,
                    file_path=f"{persona.name}.md",
                    expertise_areas=persona.expertise_areas or [],
                    default_temperature=persona.default_temperature,
                    max_tokens=persona.max_tokens,
                )
                self._personas_cache[persona.name] = persona_config

            # Set default persona if specified in database
            default_persona = Persona.get_default_persona()
            if default_persona:
                self._current_persona = default_persona.name

            self._cache_timestamp = current_time

            print(f"✅ Loaded {len(self._personas_cache)} personas from database")

        except Exception as e:
            print(f"Warning: Failed to load personas from database: {e}")
            # Fallback to hardcoded personas if database fails
            self._load_fallback_personas()

    def _load_fallback_personas(self) -> None:
        """Fallback to hardcoded personas if database is not available."""
        print("🔄 Using fallback hardcoded personas...")

        # Hardcoded persona configurations (fallback)
        persona_definitions = [
            {
                "name": "business_data_analyst",
                "display_name": "Business Data Analyst",
                "description": "Expert in analyzing business data for strategic insights.",
                "file_path": "business_data_analyst.md",
                "expertise_areas": [
                    "Data Analysis",
                    "Business Intelligence",
                    "Market Trends",
                ],
            },
            {
                "name": "career_consultant",
                "display_name": "Career Consultant",
                "description": "Provides guidance on career development and job searching.",
                "file_path": "career_consultant.md",
                "expertise_areas": [
                    "Resume Building",
                    "Interview Skills",
                    "Career Pathing",
                ],
            },
            {
                "name": "marketing_consultant",
                "display_name": "Marketing Consultant",
                "description": "Specializes in creating and analyzing marketing strategies.",
                "file_path": "marketing_consultant.md",
                "expertise_areas": ["Digital Marketing", "Brand Strategy", "SEO/SEM"],
            },
            {
                "name": "project_manager",
                "display_name": "Project Manager",
                "description": "Expert in planning, executing, and overseeing projects.",
                "file_path": "project_manager.md",
                "expertise_areas": [
                    "Agile/Scrum",
                    "Risk Management",
                    "Stakeholder Communication",
                ],
            },
            {
                "name": "accountant",
                "display_name": "Accountant",
                "description": "Manages financial records and ensures compliance.",
                "file_path": "accountant.md",
                "expertise_areas": [
                    "Financial Reporting",
                    "Tax Preparation",
                    "Auditing",
                ],
            },
            {
                "name": "seo_specialist",
                "display_name": "SEO Specialist",
                "description": "Improves website visibility on search engines.",
                "file_path": "seo_specialist.md",
                "expertise_areas": ["Keyword Research", "On-Page SEO", "Link Building"],
            },
            {
                "name": "blog_post_specialist",
                "display_name": "Blog Post Specialist",
                "description": "Creates engaging and informative blog content.",
                "file_path": "blog_post_specialist.md",
                "expertise_areas": [
                    "Content Writing",
                    "Storytelling",
                    "SEO Copywriting",
                ],
            },
            {
                "name": "tech_business_intelligence_expert",
                "display_name": "Tech Business Intelligence Expert",
                "description": "Analyzes data to provide actionable insights for tech businesses.",
                "file_path": "tech_business_intelligence_expert.md",
                "expertise_areas": ["Data Visualization", "SQL", "Strategic Planning"],
            },
        ]

        for config_data in persona_definitions:
            try:
                persona = PersonaConfig(
                    name=config_data["name"],
                    display_name=config_data["display_name"],
                    description=config_data["description"],
                    file_path=config_data["file_path"],
                    expertise_areas=config_data["expertise_areas"],
                )
                self._personas_cache[persona.name] = persona
            except KeyError as e:
                print(
                    f"Warning: Missing key in persona definition {config_data.get('name', 'N/A')}: {e}"
                )
            except Exception as e:
                print(
                    f"Warning: Failed to load persona {config_data.get('name', 'N/A')}: {e}"
                )

    def invalidate_cache(self) -> None:
        """Force cache invalidation on next access."""
        self._cache_timestamp = 0

    def get_available_personas(self) -> List[Dict]:
        """Get list of all available personas with their metadata.

        Returns:
            List of persona information dictionaries
        """
        # Refresh cache if needed
        self._load_personas_from_db()

        return [
            {
                "name": persona.name,
                "display_name": persona.display_name,
                "description": persona.description,
                "expertise_areas": persona.expertise_areas,
                "is_current": persona.name == self._current_persona,
            }
            for persona in self._personas_cache.values()
        ]

    def set_current_persona(self, persona_name: str) -> bool:
        """Set the current active persona.

        Args:
            persona_name: Name of the persona to activate

        Returns:
            True if persona was set successfully, False otherwise
        """
        # Refresh cache if needed
        self._load_personas_from_db()

        if persona_name in self._personas_cache:
            self._current_persona = persona_name
            return True
        return False

    def get_current_persona(self) -> Optional[PersonaConfig]:
        """Get the current active persona configuration.

        Returns:
            PersonaConfig for the current persona, or None if not found
        """
        # Refresh cache if needed
        self._load_personas_from_db()

        return self._personas_cache.get(self._current_persona)

    def get_persona_prompt(self, persona_name: str = None) -> Optional[str]:
        """Load the full prompt content for a persona.

        Args:
            persona_name: Name of the persona. If None, uses current persona.

        Returns:
            The persona prompt content, or None if not found
        """
        if persona_name is None:
            persona_name = self._current_persona

        # Refresh cache if needed
        self._load_personas_from_db()

        persona = self._personas_cache.get(persona_name)
        if not persona:
            return None

        # First try to get from database
        try:
            from .models.persona_models import Persona

            db_persona = Persona.get_by_name(persona_name)
            if db_persona and db_persona.prompt_content:
                return db_persona.prompt_content
        except Exception as e:
            print(f"Warning: Could not load prompt from database: {e}")

        # Fallback to file-based prompt
        persona_file = self.personas_dir / persona.file_path
        if not persona_file.exists():
            print(f"Warning: Persona file not found at {persona_file}")
            return None

        try:
            return persona_file.read_text(encoding="utf-8")
        except Exception as e:
            print(f"Error reading persona file {persona_file}: {e}")
            return None

    def create_analysis_prompt(
        self,
        query: str,
        relevant_data: str,
        chat_history: List[Dict] = None,
        persona_name: str = None,
    ) -> str:
        """Create a comprehensive prompt using the specified persona.

        Args:
            query: User's question
            relevant_data: Context data for the analysis
            chat_history: Previous conversation history
            persona_name: Persona to use (None for current)

        Returns:
            Complete prompt string for the AI
        """
        if persona_name is None:
            persona_name = self._current_persona

        persona_content = self.get_persona_prompt(persona_name)
        if not persona_content:
            # Fallback to a generic prompt
            persona_content = "You are a helpful AI assistant. Provide clear, accurate, and helpful responses."

        # Add conversation context if available
        conversation_context = ""
        if chat_history:
            conversation_context = "\n\nCONVERSATION HISTORY (for context):\n"
            for i, chat in enumerate(
                chat_history[-5:], 1
            ):  # Last 5 messages for context
                conversation_context += f"{i}. USER: {chat['message']}\n"
                conversation_context += f"   AI: {chat['response'][:200]}{'...' if len(chat['response']) > 200 else ''}\n\n"
            conversation_context += "---\n"

        return f"""{persona_content}

USER QUESTION: "{query}"{conversation_context}

AVAILABLE DATA:
{relevant_data}

IMPORTANT: Base your response ONLY on the data provided above. If the data doesn't contain what they're asking for, say so clearly and suggest what information is available instead.

Provide your comprehensive response with follow-up suggestions:"""

    def get_persona_metadata(self, persona_name: str = None) -> Optional[Dict]:
        """Get metadata for a specific persona.

        Args:
            persona_name: Name of the persona. If None, uses current persona.

        Returns:
            Dictionary with persona metadata, or None if not found
        """
        if persona_name is None:
            persona_name = self._current_persona

        # Refresh cache if needed
        self._load_personas_from_db()

        persona = self._personas_cache.get(persona_name)
        if not persona:
            return None

        return {
            "name": persona.name,
            "display_name": persona.display_name,
            "description": persona.description,
            "expertise_areas": persona.expertise_areas,
            "default_temperature": persona.default_temperature,
            "max_tokens": persona.max_tokens,
            "is_current": persona.name == self._current_persona,
        }

    def refresh_from_database(self) -> None:
        """Force refresh personas from database."""
        self.invalidate_cache()
        self._load_personas_from_db()


# Global persona manager instance
_persona_manager = None


def get_persona_manager() -> PersonaManager:
    """Get the global persona manager instance."""
    global _persona_manager
    if _persona_manager is None:
        _persona_manager = PersonaManager()
    return _persona_manager
