"""create report share links table

Revision ID: 0021_report_share_links
Revises: 0020_add_session_lookup_indexes
Create Date: 2025-11-20
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0021_report_share_links"
down_revision = "0020_add_session_lookup_indexes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "report_share_links",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("session_id", sa.Integer(), sa.ForeignKey("assessment_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("mediator_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("mediator_email", sa.String(length=255), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("note", sa.String(length=255), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("last_accessed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("access_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_report_share_links_token_hash",
        "report_share_links",
        ["token_hash"],
        unique=True,
    )
    op.create_index(
        "ix_report_share_links_session_mediator",
        "report_share_links",
        ["session_id", "mediator_id"],
        unique=False,
    )
    op.create_index(
        "ix_report_share_links_owner",
        "report_share_links",
        ["owner_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_report_share_links_owner", table_name="report_share_links")
    op.drop_index("ix_report_share_links_session_mediator", table_name="report_share_links")
    op.drop_index("ix_report_share_links_token_hash", table_name="report_share_links")
    op.drop_table("report_share_links")
