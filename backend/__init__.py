import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_admin import Admin

db = SQLAlchemy()
migrate = Migrate()
admin = Admin(template_mode="bootstrap4", name="RAG Admin")


def create_app():
    app = Flask(__name__, static_folder=None)

    # Load config
    from .config import configure_app

    configure_app(app)

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(
        app,
        resources={
            r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}
        },
    )
    admin.init_app(app)

    # Register models with admin (lazy import to avoid circulars)
    with app.app_context():
        # Create tables if they don't exist (MVP convenience)
        from .models import (
            User,
            Role,
            ChatHistory,
            Feedback,
            Session,
            PasswordResetToken,
            UserSettings,
            FileAuditLog,
        )

        db.create_all()
        try:
            from .admin.admin_views import register_admin_views

            register_admin_views(admin)
        except Exception:
            pass

    # Routes
    from .routes import api_bp

    app.register_blueprint(api_bp, url_prefix="/api")

    return app
