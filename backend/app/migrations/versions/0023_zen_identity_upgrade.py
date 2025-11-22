"""add zen identity fields

Revision ID: 0023_zen_identity_upgrade
Revises: 0022_score_provenance_versions
Create Date: 2025-11-22
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0023_zen_identity_upgrade"
down_revision = "0022_score_provenance_versions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("users")}

    needs_alter = False
    with op.batch_alter_table("users") as batch_op:
        if "avatar_url" not in columns:
            batch_op.add_column(sa.Column("avatar_url", sa.String(length=255), nullable=True))
            needs_alter = True
        if "zen_points" not in columns:
            batch_op.add_column(sa.Column("zen_points", sa.Integer(), nullable=False, server_default="0"))
            needs_alter = True
        if "current_lvl" not in columns:
            batch_op.add_column(sa.Column("current_lvl", sa.Integer(), nullable=False, server_default="1"))
            needs_alter = True
        if "life_motto" not in columns:
            batch_op.add_column(sa.Column("life_motto", sa.Text(), nullable=True))

    if needs_alter:
        with op.batch_alter_table("users") as batch_op:
            if "zen_points" not in columns:
                batch_op.alter_column("zen_points", server_default=None)
            if "current_lvl" not in columns:
                batch_op.alter_column("current_lvl", server_default=None)


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("life_motto")
        batch_op.drop_column("current_lvl")
        batch_op.drop_column("zen_points")
        batch_op.drop_column("avatar_url")
