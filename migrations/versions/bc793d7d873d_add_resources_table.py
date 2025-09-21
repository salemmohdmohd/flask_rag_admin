"""Add resources table

Revision ID: bc793d7d873d
Revises: c168e7a72cef
Create Date: 2025-09-20 18:51:40.130881

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "bc793d7d873d"
down_revision = "c168e7a72cef"
branch_labels = None
depends_on = None


def upgrade():
    # Create resources table
    op.create_table(
        "resources",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("filepath", sa.String(length=500), nullable=False),
        sa.Column("subdirectory", sa.String(length=255), nullable=True),
        sa.Column("file_size", sa.Integer(), nullable=False, default=0),
        sa.Column("content_preview", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_indexed", sa.Boolean(), nullable=False, default=False),
        sa.Column("upload_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("last_indexed_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes
    op.create_index("ix_resources_filepath", "resources", ["filepath"], unique=True)
    op.create_index("ix_resources_filename", "resources", ["filename"])
    op.create_index("ix_resources_subdirectory", "resources", ["subdirectory"])
    op.create_index("ix_resources_is_indexed", "resources", ["is_indexed"])
    op.create_index("ix_resources_is_active", "resources", ["is_active"])


def downgrade():
    # Drop indexes
    op.drop_index("ix_resources_is_active", table_name="resources")
    op.drop_index("ix_resources_is_indexed", table_name="resources")
    op.drop_index("ix_resources_subdirectory", table_name="resources")
    op.drop_index("ix_resources_filename", table_name="resources")
    op.drop_index("ix_resources_filepath", table_name="resources")

    # Drop table
    op.drop_table("resources")
