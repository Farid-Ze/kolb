"""backfill scale provenance data for existing sessions

Revision ID: 0012_backfill_scale_provenance
Revises: 0011_create_scale_provenance
Create Date: 2025-11-10
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from alembic import op

from app.services.provenance import backfill_scale_provenance

# revision identifiers, used by Alembic.
revision = "0012_backfill_scale_provenance"
down_revision = "0011_create_scale_provenance"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    session = Session(bind=bind)
    try:
        backfill_scale_provenance(session)
        session.commit()
    finally:
        session.close()


def downgrade() -> None:
    bind = op.get_bind()
    session = Session(bind=bind)
    try:
        session.execute("DELETE FROM scale_provenance")
        session.commit()
    finally:
        session.close()
