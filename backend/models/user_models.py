from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.orm import relationship
from sqlalchemy import UniqueConstraint

from .. import db


roles_users = db.Table(
    "roles_users",
    db.Column("id", db.Integer, primary_key=True),
    db.Column("user_id", db.Integer, db.ForeignKey("user.id"), nullable=False),
    db.Column("role_id", db.Integer, db.ForeignKey("role.id"), nullable=False),
    db.Column("assigned_at", db.DateTime, default=datetime.utcnow, nullable=False),
    db.UniqueConstraint("user_id", "role_id", name="uq_user_role"),
)


class User(db.Model):
    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    profile = db.Column(db.JSON, nullable=True)

    roles = relationship("Role", secondary=roles_users, back_populates="users")
    chats = relationship("ChatHistory", back_populates="user", lazy=True)

    def set_password(self, password: str):
        # Use PBKDF2 for broader OpenSSL compatibility
        self.password_hash = generate_password_hash(password, method="pbkdf2:sha256")

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


class Role(db.Model):
    __tablename__ = "role"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    permissions = db.Column(db.JSON, nullable=True)

    users = relationship("User", secondary=roles_users, back_populates="roles")
