"""
Resource database models for managing knowledge base files through Flask-Admin.
"""

import os
from datetime import datetime
from pathlib import Path
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from ..models import db


class Resource(db.Model):
    """Database model for knowledge base resources (markdown files)."""

    __tablename__ = "resources"

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    filepath = db.Column(db.String(500), nullable=False, unique=True, index=True)
    subdirectory = db.Column(db.String(255), nullable=True)
    file_size = db.Column(db.Integer, nullable=False, default=0)
    content_preview = db.Column(db.Text, nullable=True)  # First 500 chars
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    is_indexed = db.Column(db.Boolean, nullable=False, default=False)
    upload_user_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    last_indexed_at = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f"<Resource {self.filename}>"

    @property
    def status_display(self):
        """Get a formatted status display."""
        status = "✅ Active" if self.is_active else "❌ Inactive"
        if self.is_indexed:
            status += " 📚 Indexed"
        else:
            status += " ⏳ Pending"
        if not self.exists_on_disk:
            status += " 🚫 Missing"
        return status

    @property
    def size_display(self):
        """Get human-readable file size."""
        if not self.file_size:
            return "0 bytes"

        size = self.file_size
        for unit in ["bytes", "KB", "MB", "GB"]:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"

    @property
    def path_display(self):
        """Get a formatted path display."""
        return f"📁 {self.filepath}"

    @property
    def full_path(self):
        """Get the absolute file path."""
        from ..routes import _resources_dir

        base = _resources_dir()
        return base / self.filepath

    @property
    def exists_on_disk(self):
        """Check if the file actually exists on disk."""
        return self.full_path.exists()

    @property
    def display_name(self):
        """Get a user-friendly display name."""
        if self.subdirectory:
            return f"{self.subdirectory}/{self.filename}"
        return self.filename

    @property
    def file_extension(self):
        """Get the file extension."""
        return Path(self.filename).suffix.lower()

    def update_from_disk(self):
        """Update metadata from the actual file on disk."""
        if self.exists_on_disk:
            stat = self.full_path.stat()
            self.file_size = stat.st_size
            self.updated_at = datetime.utcfromtimestamp(stat.st_mtime)

            # Update content preview
            try:
                with open(self.full_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    self.content_preview = content[:500] + (
                        "..." if len(content) > 500 else ""
                    )
            except Exception:
                self.content_preview = "Could not read file content"

    @classmethod
    def sync_with_filesystem(cls):
        """Sync database records with actual files in the resources directory."""
        from ..routes import _resources_dir

        base = _resources_dir()
        base.mkdir(parents=True, exist_ok=True)

        # Get all files from filesystem
        disk_files = set()
        for root, dirs, files in os.walk(base):
            for file in files:
                if file.lower().endswith(".md"):
                    full_path = Path(root) / file
                    rel_path = full_path.relative_to(base)
                    disk_files.add(str(rel_path))

        # Get all files from database
        db_files = {r.filepath for r in cls.query.all()}

        # Add new files to database
        for filepath in disk_files - db_files:
            full_path = base / filepath
            path_obj = Path(filepath)

            subdirectory = (
                str(path_obj.parent) if path_obj.parent != Path(".") else None
            )

            resource = cls(
                filename=path_obj.name, filepath=filepath, subdirectory=subdirectory
            )
            resource.update_from_disk()
            db.session.add(resource)

        # Mark missing files as inactive
        for filepath in db_files - disk_files:
            resource = cls.query.filter_by(filepath=filepath).first()
            if resource:
                resource.is_active = False

        db.session.commit()
        return len(disk_files - db_files), len(db_files - disk_files)

    @classmethod
    def get_active_resources(cls):
        """Get all active resources ordered by created date."""
        return cls.query.filter_by(is_active=True).order_by(cls.created_at.desc()).all()

    @classmethod
    def get_unindexed_resources(cls):
        """Get all active resources that haven't been indexed."""
        return cls.query.filter_by(is_active=True, is_indexed=False).all()

    def mark_indexed(self):
        """Mark this resource as indexed."""
        self.is_indexed = True
        self.last_indexed_at = datetime.utcnow()
        db.session.commit()

    def delete_file(self):
        """Delete the actual file from disk and mark as inactive."""
        if self.exists_on_disk:
            self.full_path.unlink()
        self.is_active = False
        db.session.commit()

    def toggle_active(self):
        """Toggle the active status of this resource."""
        self.is_active = not self.is_active
        self.updated_at = datetime.utcnow()
        db.session.commit()
        return self.is_active

    def toggle_indexed(self):
        """Toggle the indexed status of this resource."""
        self.is_indexed = not self.is_indexed
        if self.is_indexed:
            self.last_indexed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        db.session.commit()
        return self.is_indexed

    def read_content(self):
        """Read the full content of the file."""
        if self.exists_on_disk:
            try:
                with open(self.full_path, "r", encoding="utf-8") as f:
                    return f.read()
            except Exception as e:
                return f"Error reading file: {str(e)}"
        return "File not found on disk"

    def write_content(self, content: str):
        """Write content to the file and update metadata."""
        try:
            # Ensure directory exists
            self.full_path.parent.mkdir(parents=True, exist_ok=True)

            # Write content
            with open(self.full_path, "w", encoding="utf-8") as f:
                f.write(content)

            # Update metadata
            self.update_from_disk()
            db.session.commit()
            return True
        except Exception as e:
            return f"Error writing file: {str(e)}"

    def get_size_formatted(self):
        """Get human-readable file size."""
        if not self.file_size:
            return "0 bytes"

        for unit in ["bytes", "KB", "MB", "GB"]:
            if self.file_size < 1024.0:
                return f"{self.file_size:.1f} {unit}"
            self.file_size /= 1024.0
        return f"{self.file_size:.1f} TB"

    @classmethod
    def get_stats(cls):
        """Get statistics about resources."""
        total = cls.query.count()
        active = cls.query.filter_by(is_active=True).count()
        indexed = cls.query.filter_by(is_indexed=True).count()
        total_size = db.session.query(db.func.sum(cls.file_size)).scalar() or 0

        # Get subdirectory statistics
        subdirs = db.session.query(cls.subdirectory).distinct().all()
        subdirectory_count = len([s[0] for s in subdirs if s[0] is not None])

        return {
            "total": total,
            "active": active,
            "inactive": total - active,
            "indexed": indexed,
            "unindexed": active - indexed,
            "total_size": total_size,
            "subdirectories": subdirectory_count,
        }

    @classmethod
    def bulk_sync_filesystem(cls):
        """Enhanced filesystem sync with detailed reporting."""
        stats = cls.sync_with_filesystem()

        # Update content previews for all active resources
        active_resources = cls.get_active_resources()
        updated_count = 0

        for resource in active_resources:
            if resource.exists_on_disk and not resource.content_preview:
                resource.update_from_disk()
                updated_count += 1

        if updated_count > 0:
            db.session.commit()

        return {
            "new_files": stats[0],
            "missing_files": stats[1],
            "updated_previews": updated_count,
            "total_active": len(active_resources),
        }

    @classmethod
    def bulk_reindex(cls):
        """Mark all active resources as needing reindexing."""
        updated = cls.query.filter_by(is_active=True).update(
            {
                "is_indexed": False,
                "last_indexed_at": None,
                "updated_at": datetime.utcnow(),
            }
        )
        db.session.commit()
        return updated
