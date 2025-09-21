from datetime import datetime
from .. import db


class FileAuditLog(db.Model):
    __tablename__ = "file_audit_log"
    id = db.Column(db.Integer, primary_key=True)
    file_path = db.Column(db.String(255), nullable=False)
    user_id = db.Column(
        db.Integer, db.ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )
    action = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(
        db.DateTime, default=datetime.utcnow, nullable=False, index=True
    )
    change_summary = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)  # IPv6 support
    user_agent = db.Column(db.String(500), nullable=True)

    # Relationship
    user = db.relationship("User", backref="file_audit_logs")

    def __repr__(self):
        return (
            f"<FileAuditLog {self.action} by user {self.user_id} at {self.timestamp}>"
        )


class UserAuditLog(db.Model):
    """Enhanced audit log for tracking all user actions."""

    __tablename__ = "user_audit_log"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )
    action_type = db.Column(
        db.String(50), nullable=False, index=True
    )  # login, logout, create, update, delete
    entity_type = db.Column(
        db.String(50), nullable=True, index=True
    )  # user, persona, resource, settings
    entity_id = db.Column(db.Integer, nullable=True)
    description = db.Column(db.Text, nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)
    timestamp = db.Column(
        db.DateTime, default=datetime.utcnow, nullable=False, index=True
    )
    additional_data = db.Column(db.JSON, nullable=True)  # Additional contextual data

    # Relationship
    user = db.relationship("User", backref="audit_logs")

    def __repr__(self):
        return f"<UserAuditLog {self.action_type} by user {self.user_id} at {self.timestamp}>"

    @classmethod
    def log_action(
        cls,
        user_id,
        action_type,
        description,
        entity_type=None,
        entity_id=None,
        ip_address=None,
        user_agent=None,
        additional_data=None,
    ):
        """Helper method to create audit log entries."""
        audit_log = cls(
            user_id=user_id,
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
            additional_data=additional_data,
        )
        db.session.add(audit_log)
        return audit_log


class SecurityAuditLog(db.Model):
    """Security-focused audit log for tracking authentication and authorization events."""

    __tablename__ = "security_audit_log"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )
    username = db.Column(
        db.String(80), nullable=True
    )  # Store username even if user is deleted
    event_type = db.Column(
        db.String(50), nullable=False, index=True
    )  # login_success, login_failed, logout, etc.
    ip_address = db.Column(db.String(45), nullable=True, index=True)
    user_agent = db.Column(db.String(500), nullable=True)
    details = db.Column(db.JSON, nullable=True)
    timestamp = db.Column(
        db.DateTime, default=datetime.utcnow, nullable=False, index=True
    )

    # Relationship (optional due to SET NULL)
    user = db.relationship("User", backref="security_logs")

    def __repr__(self):
        return f"<SecurityAuditLog {self.event_type} for {self.username} at {self.timestamp}>"

    @classmethod
    def log_security_event(
        cls,
        event_type,
        username=None,
        user_id=None,
        ip_address=None,
        user_agent=None,
        details=None,
    ):
        """Helper method to create security audit log entries."""
        security_log = cls(
            user_id=user_id,
            username=username,
            event_type=event_type,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details,
        )
        db.session.add(security_log)
        return security_log
