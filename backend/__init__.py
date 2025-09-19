import os
import time
import logging
from flask import Flask, g, request, session
import click
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_admin import Admin
from flask_admin.menu import MenuLink
from .logging_utils import configure_logging

db = SQLAlchemy()
migrate = Migrate()
admin_ext = Admin(
    template_mode="bootstrap4",
    name="RAG Admin",
)


def create_app():
    app = Flask(__name__, static_folder=None)

    # Load config
    from .config import configure_app

    configure_app(app)

    # Configure logging early
    configure_logging(app)

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(
        app,
        resources={
            r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}
        },
    )
    # Import secured views after app is created to avoid circular imports
    from .admin.security import SecuredAdminIndexView, SecuredModelView

    admin_ext.index_view = SecuredAdminIndexView()
    admin_ext.init_app(app)

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

        try:
            from .admin.admin_views import register_admin_views

            register_admin_views(admin_ext, SecuredModelView)
            logging.getLogger(__name__).info(
                "Flask-Admin registered",
                extra={"admin_views": len(getattr(admin_ext, "_views", []))},
            )
        except Exception:
            logging.getLogger(__name__).exception(
                "Failed to register Flask-Admin views"
            )

    # Routes
    from .routes import api_bp

    app.register_blueprint(api_bp, url_prefix="/api")

    @app.route("/admin/editor")
    def admin_editor():
        from flask import redirect

        if not getattr(g, "admin_user", None):
            from flask import url_for

            return redirect(url_for("admin_login", next="/admin/editor"))
        return redirect("/admin/editor/")

    @app.route("/admin/tools")
    def admin_tools():
        from flask import redirect

        # Only show to logged-in admin sessions
        if not getattr(g, "admin_user", None):
            from flask import url_for

            return redirect(url_for("admin_login", next="/admin/tools"))
        return redirect("/admin/tools/")

    @app.route("/admin/login", methods=["GET", "POST"])
    def admin_login():
        from flask import render_template, request, session, redirect, url_for
        from .models import User

        if request.method == "POST":
            username = (request.form.get("username") or "").strip()
            password = request.form.get("password") or ""
            user = User.query.filter_by(username=username).first()
            if (
                user
                and user.check_password(password)
                and any(r.name == "admin" for r in user.roles)
            ):
                session["admin_user_id"] = user.id
                next_url = request.form.get("next") or request.args.get("next")
                return redirect(next_url or url_for("admin.index"))
            error = "Invalid credentials or not an admin user"
        else:
            error = None

        return render_template(
            "admin_login.html", error=error, next=request.args.get("next")
        )

    @app.route("/admin/logout")
    def admin_logout():
        from flask import session, redirect, url_for

        session.pop("admin_user_id", None)
        return redirect(url_for("admin_login"))

    @app.get("/")
    def index():
        html = (
            "<html><head><title>RAG Admin</title><style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:40px;line-height:1.5} code{background:#f5f5f5;padding:2px 6px;border-radius:4px}</style></head><body>"
            "<h1>RAG Admin</h1>"
            "<p>Backend is running. APIs are under <code>/api</code>.</p>"
            "<ul>"
            '<li><a href="/api/health">/api/health</a> (health check)</li>'
            '<li><a href="/admin">/admin</a> (Admin console)</li>'
            "</ul>"
            '<p>Frontend app: start it on port 3000 then open <a href="http://localhost:3000">http://localhost:3000</a>.</p>'
            "</body></html>"
        )
        return html, 200, {"Content-Type": "text/html; charset=utf-8"}

    @app.before_request
    def _bind_request_context():
        g.start_time = time.time()
        g.request_id = request.headers.get("X-Request-ID") or os.urandom(8).hex()
        # Expose admin user for templates
        g.admin_user = None
        try:
            admin_user_id = session.get("admin_user_id")
            if admin_user_id:
                from .models import User

                g.admin_user = User.query.get(admin_user_id)
        except Exception:
            pass

    @app.after_request
    def _log_request(response):
        try:
            duration_ms = int(
                (time.time() - getattr(g, "start_time", time.time())) * 1000
            )
            user_id = getattr(g, "current_user_id", None)
            logging.getLogger("request").info(
                f"{request.method} {request.path}",
                extra={
                    "method": request.method,
                    "path": request.path,
                    "status": response.status_code,
                    "duration_ms": duration_ms,
                    "ip": request.headers.get("X-Forwarded-For", request.remote_addr),
                    "user_id": user_id,
                    "request_id": getattr(g, "request_id", None),
                },
            )
        except Exception:
            logging.getLogger(__name__).exception("failed to log request")
        response.headers["X-Request-ID"] = getattr(g, "request_id", "")
        return response

    @app.before_request
    def _protect_admin():
        try:
            p = request.path or ""
            if not p.startswith("/admin"):
                return
            # Allow login/logout and admin static assets without auth
            if (
                p.startswith("/admin/login")
                or p.startswith("/admin/logout")
                or p.startswith("/admin/static")
            ):
                return
            if not getattr(g, "admin_user", None):
                from flask import redirect, url_for

                return redirect(url_for("admin_login", next=request.url))
        except Exception:
            # Fail safe: if guard fails unexpectedly, do not block non-admin routes
            return

    @app.cli.command("seed-admin")
    @click.option("--force", is_flag=True, help="Update password if user exists")
    def seed_admin(force):
        from .models import User, Role, db as _db
        import os

        username = os.getenv("ADMIN_USERNAME", "admin")
        password = os.getenv("ADMIN_PASSWORD", "admin")
        email = os.getenv("ADMIN_EMAIL", "admin@example.com")

        admin_role = Role.query.filter_by(name="admin").first()
        if not admin_role:
            admin_role = Role(name="admin", description="Administrator")
            _db.session.add(admin_role)
            _db.session.commit()

        user = User.query.filter_by(username=username).first()
        if not user:
            user = User(username=username, email=email, active=True)
            user.set_password(password)
            user.roles.append(admin_role)
            _db.session.add(user)
            _db.session.commit()
            click.echo(f"Created admin user '{username}'.")
        else:
            if force:
                user.set_password(password)
                if admin_role not in user.roles:
                    user.roles.append(admin_role)
                _db.session.commit()
                click.echo(f"Updated password and ensured role for '{username}'.")
            else:
                click.echo("Admin user already exists. Use --force to update password.")

    return app
