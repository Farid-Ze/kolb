"""add norm version tracking to percentile and scale provenance

Revision ID: 0022_score_provenance_versions
Revises: 0021_report_share_links, 15984cc3761d
Create Date: 2025-11-21
"""
from __future__ import annotations

from typing import Optional

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0022_score_provenance_versions"
down_revision = ("0021_report_share_links", "15984cc3761d")
branch_labels = None
depends_on = None

_VERSION_DELIM = "|"
_DEFAULT_VERSION = "default"


def _split_norm_token(payload: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    if not payload:
        return None, None
    if _VERSION_DELIM in payload:
        base, version = payload.split(_VERSION_DELIM, 1)
        return base, version or _DEFAULT_VERSION
    return payload, _DEFAULT_VERSION


def _extract_version(label: Optional[str]) -> Optional[str]:
    if not label:
        return None
    if label.startswith("DB:"):
        _, version = _split_norm_token(label[3:])
        return version or _DEFAULT_VERSION
    if label.startswith("External:"):
        _, version = _split_norm_token(label.split(":", 1)[1])
        return version or _DEFAULT_VERSION
    return None


def upgrade() -> None:
    with op.batch_alter_table("percentile_scores") as batch_op:
        batch_op.add_column(sa.Column("norm_version_used", sa.String(length=40), nullable=True))

    with op.batch_alter_table("scale_provenance") as batch_op:
        batch_op.add_column(sa.Column("norm_version", sa.String(length=40), nullable=True))

    bind = op.get_bind()
    metadata = sa.MetaData()
    percentile_tbl = sa.Table("percentile_scores", metadata, autoload_with=bind)
    scale_prov_tbl = sa.Table("scale_provenance", metadata, autoload_with=bind)

    # Backfill percentile_scores.norm_version_used from norm_group_used label
    rows = bind.execute(sa.select(percentile_tbl.c.id, percentile_tbl.c.norm_group_used)).mappings()
    for row in rows:
        version = _extract_version(row["norm_group_used"])
        bind.execute(
            percentile_tbl.update()
            .where(percentile_tbl.c.id == row["id"])
            .values(norm_version_used=version)
        )

    # Backfill scale_provenance.norm_version from provenance_tag label
    prov_rows = bind.execute(sa.select(scale_prov_tbl.c.id, scale_prov_tbl.c.provenance_tag)).mappings()
    for row in prov_rows:
        tag = row["provenance_tag"]
        version = _extract_version(tag)
        bind.execute(
            scale_prov_tbl.update()
            .where(scale_prov_tbl.c.id == row["id"])
            .values(norm_version=version)
        )


def downgrade() -> None:
    with op.batch_alter_table("scale_provenance") as batch_op:
        batch_op.drop_column("norm_version")

    with op.batch_alter_table("percentile_scores") as batch_op:
        batch_op.drop_column("norm_version_used")
