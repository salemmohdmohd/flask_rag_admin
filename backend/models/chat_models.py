from datetime import datetime
from .. import db


class ChatHistory(db.Model):
    __tablename__ = "chat_history"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    session_id = db.Column(db.String(100), nullable=True)  # For conversation memory
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=True)
    source_file = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    context = db.Column(db.JSON, nullable=True)

    # Add constraints for data validation
    __table_args__ = (
        db.CheckConstraint("LENGTH(message) >= 1", name="check_message_not_empty"),
        db.CheckConstraint(
            "session_id IS NULL OR LENGTH(session_id) >= 1",
            name="check_session_id_valid",
        ),
    )

    user = db.relationship("User", back_populates="chats")
