from datetime import datetime
from .. import db


class FileAuditLog(db.Model):
    __tablename__ = "file_audit_log"
    id = db.Column(db.Integer, primary_key=True)
    file_path = db.Column(db.String(255), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    change_summary = db.Column(db.Text, nullable=True)
