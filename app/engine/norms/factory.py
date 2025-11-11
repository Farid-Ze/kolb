from __future__ import annotations

from sqlalchemy.orm import Session
from typing import List

from app.engine.norms.composite import (
    AppendixNormProvider,
    CompositeNormProvider,
    DatabaseNormProvider,
    ExternalNormProvider,
)
from app.core.config import settings


def build_composite_norm_provider(db: Session):
    """Build the default composite norm provider chain: DB → Appendix → External.

    The DB provider uses the same lookup semantics as existing code
    (norm_group|version support with default fallback).
    """
    from sqlalchemy import text

    def _db_lookup(group_token: str, scale_name: str, raw: int | float):
        # Split token into base and version if present
        delim = "|"
        if delim in group_token:
            base_group, req_version = group_token.split(delim, 1)
        else:
            base_group, req_version = group_token, "default"
        # Try requested version first, then default
        for version in (req_version, "default"):
            row = db.execute(
                text(
                    "SELECT percentile, norm_version FROM normative_conversion_table "
                    "WHERE norm_group=:g AND norm_version=:v AND scale_name=:s AND raw_score=:r LIMIT 1"
                ),
                {"g": base_group, "v": version, "s": scale_name, "r": int(raw)},
            ).fetchone()
            if row:
                return float(row[0]), (row[1] or version)
        return None

    # Precedence: DB → External (optional) → Appendix
    providers: List[object] = [DatabaseNormProvider(_db_lookup)]
    if settings.external_norms_enabled and settings.external_norms_base_url:
        providers.append(
            ExternalNormProvider(
                base_url=settings.external_norms_base_url,
                timeout_ms=settings.external_norms_timeout_ms,
                api_key=settings.external_norms_api_key,
            )
        )
    providers.append(AppendixNormProvider())
    return CompositeNormProvider(providers)  # type: ignore[arg-type]
