"""track norm versions and enrich percentile provenance

Revision ID: 0014_norm_version_tracking
Revises: 0013_add_instruments
Create Date: 2025-11-10
"""
from __future__ import annotations

import json
from typing import Any, Dict

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0014_norm_version_tracking"
down_revision = "0013_add_instruments"
branch_labels = None
depends_on = None

_DEFAULT_VERSION = "default"
_VERSION_DELIM = "|"


def _split_norm_token(payload: str) -> tuple[str, str]:
    if _VERSION_DELIM in payload:
        group, version = payload.split(_VERSION_DELIM, 1)
        return group, version or _DEFAULT_VERSION
    return payload, _DEFAULT_VERSION


def _describe_source(tag: str) -> tuple[str, str | None, str | None]:
    if not tag:
        return "unknown", None, None
    if tag.startswith("DB:"):
        group, version = _split_norm_token(tag[3:])
        return "database", group, version
    if tag.startswith("Appendix:"):
        return "appendix", tag.split(":", 1)[1], None
    return "unknown", None, None


def _detail_entry(
    percentile: float | None,
    source: str,
    raw: Any,
    truncated_flags: Dict[str, Any],
    scale_code: str,
) -> Dict[str, Any]:
    source_kind, norm_group, norm_version = _describe_source(source)
    return {
        "percentile": percentile,
        "raw_score": raw,
        "source": source,
        "source_kind": source_kind,
        "norm_group": norm_group,
        "norm_version": norm_version,
        "used_fallback": source_kind != "database",
        "truncated": bool(truncated_flags.get(scale_code)) if truncated_flags else False,
    }


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # ---- normative_conversion_table ----
    with op.batch_alter_table("normative_conversion_table") as batch_op:
        batch_op.add_column(sa.Column("norm_version", sa.String(length=40), nullable=False, server_default=_DEFAULT_VERSION))
    op.execute(
        sa.text(
            "UPDATE normative_conversion_table SET norm_version = :version WHERE norm_version IS NULL"
        ),
        {"version": _DEFAULT_VERSION},
    )
    uniques = {c["name"] for c in inspector.get_unique_constraints("normative_conversion_table")}
    if "uq_norm_group_scale_raw" in uniques:
        op.drop_constraint("uq_norm_group_scale_raw", "normative_conversion_table", type_="unique")
    if "uq_norm_group_version_scale_raw" not in uniques:
        op.create_unique_constraint(
            "uq_norm_group_version_scale_raw",
            "normative_conversion_table",
            ["norm_group", "norm_version", "scale_name", "raw_score"],
        )
    with op.batch_alter_table("normative_conversion_table") as batch_op:
        batch_op.alter_column("norm_version", server_default=None)

    # ---- percentile_scores.norm_provenance enrichment ----
    metadata = sa.MetaData()
    percentile_tbl = sa.Table("percentile_scores", metadata, autoload_with=bind)
    scale_tbl = sa.Table("scale_scores", metadata, autoload_with=bind)
    combo_tbl = sa.Table("combination_scores", metadata, autoload_with=bind)

    select_stmt = (
        sa.select(
            percentile_tbl.c.id,
            percentile_tbl.c.session_id,
            percentile_tbl.c.CE_percentile,
            percentile_tbl.c.RO_percentile,
            percentile_tbl.c.AC_percentile,
            percentile_tbl.c.AE_percentile,
            percentile_tbl.c.ACCE_percentile,
            percentile_tbl.c.AERO_percentile,
            percentile_tbl.c.CE_source,
            percentile_tbl.c.RO_source,
            percentile_tbl.c.AC_source,
            percentile_tbl.c.AE_source,
            percentile_tbl.c.ACCE_source,
            percentile_tbl.c.AERO_source,
            percentile_tbl.c.truncated_scales,
            percentile_tbl.c.norm_provenance,
            scale_tbl.c.CE_raw,
            scale_tbl.c.RO_raw,
            scale_tbl.c.AC_raw,
            scale_tbl.c.AE_raw,
            combo_tbl.c.ACCE_raw,
            combo_tbl.c.AERO_raw,
        )
        .select_from(percentile_tbl.outerjoin(scale_tbl, percentile_tbl.c.session_id == scale_tbl.c.session_id).outerjoin(combo_tbl, percentile_tbl.c.session_id == combo_tbl.c.session_id))
    )

    result = bind.execute(select_stmt).mappings()
    for row in result:
        current = row["norm_provenance"]
        if isinstance(current, dict) and current and isinstance(next(iter(current.values())), dict):
            # Already in rich form.
            continue
        truncated = row["truncated_scales"]
        if isinstance(truncated, str):
            truncated = json.loads(truncated)
        detail = {
            "CE": _detail_entry(row["CE_percentile"], row["CE_source"], row["CE_raw"], truncated or {}, "CE"),
            "RO": _detail_entry(row["RO_percentile"], row["RO_source"], row["RO_raw"], truncated or {}, "RO"),
            "AC": _detail_entry(row["AC_percentile"], row["AC_source"], row["AC_raw"], truncated or {}, "AC"),
            "AE": _detail_entry(row["AE_percentile"], row["AE_source"], row["AE_raw"], truncated or {}, "AE"),
            "ACCE": _detail_entry(row["ACCE_percentile"], row["ACCE_source"], row["ACCE_raw"], truncated or {}, "ACCE"),
            "AERO": _detail_entry(row["AERO_percentile"], row["AERO_source"], row["AERO_raw"], truncated or {}, "AERO"),
        }
        bind.execute(
            percentile_tbl.update()
            .where(percentile_tbl.c.id == row["id"])
            .values(norm_provenance=detail)
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # percentile_scores rollback (no action needed for JSON structure)

    # normative_conversion_table constraint + column
    uniques = {c["name"] for c in inspector.get_unique_constraints("normative_conversion_table")}
    if "uq_norm_group_version_scale_raw" in uniques:
        op.drop_constraint("uq_norm_group_version_scale_raw", "normative_conversion_table", type_="unique")
    with op.batch_alter_table("normative_conversion_table") as batch_op:
        batch_op.drop_column("norm_version")
    op.create_unique_constraint(
        "uq_norm_group_scale_raw",
        "normative_conversion_table",
        ["norm_group", "scale_name", "raw_score"],
    )