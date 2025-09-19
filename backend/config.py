import os
from dotenv import load_dotenv


def configure_app(app):
    # Load .env from project root
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
    env_path = os.path.join(root_dir, ".env")
    load_dotenv(env_path)

    app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "change-me")
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        abs_db = os.path.join(root_dir, "backend", "app.db")
        db_url = f"sqlite:///{abs_db}"
    elif db_url.startswith("sqlite:///"):
        rel = db_url.replace("sqlite:///", "", 1)
        if not os.path.isabs(rel):
            db_url = f"sqlite:///{os.path.join(root_dir, rel)}"
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    app.config["GOOGLE_GEMINI_API_KEY"] = os.getenv("GOOGLE_GEMINI_API_KEY", "")

    # JWT
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", app.config["SECRET_KEY"])
    app.config["JWT_EXPIRES_HOURS"] = int(os.getenv("JWT_EXPIRES_HOURS", "24"))

    # Logging
    app.config["LOG_LEVEL"] = os.getenv("LOG_LEVEL", "INFO")
    app.config["LOG_JSON"] = os.getenv("LOG_JSON", "false")
    app.config["LOG_WERKZEUG"] = os.getenv("LOG_WERKZEUG", "false")
