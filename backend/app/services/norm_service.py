import csv
from hashlib import sha256
from io import StringIO
from typing import Any, Dict

from fastapi import HTTPException, UploadFile

from app.db.repositories import NormativeConversionRepository, AuditRepository
from app.engine.norms.factory import (
    build_composite_norm_provider,
    clear_norm_db_cache,
)
from app.assessments.klsi_v4.logic import clear_percentile_cache
from app.core.logging import get_logger
from app.i18n.id_messages import AdminMessages

logger = get_logger("kolb.services.norms", component="service")

class NormService:
    def __init__(self, db: Any):
        self.db = db
        self.norm_repo = NormativeConversionRepository(db)
        self.audit_repo = AuditRepository(db)

    def import_norms(
        self,
        norm_group: str,
        norm_version: str,
        content: str,
        user: Any,
    ) -> Dict[str, Any]:
        nv = norm_version.strip() or "default"
        if not norm_group or len(norm_group.strip()) == 0:
            raise HTTPException(status_code=400, detail=AdminMessages.NORM_GROUP_REQUIRED)
        if len(norm_group) > 150:
            raise HTTPException(status_code=400, detail=AdminMessages.NORM_GROUP_MAX_LENGTH)
        if len(nv) > 40:
            raise HTTPException(status_code=400, detail=AdminMessages.NORM_VERSION_MAX_LENGTH)
        
        reader = csv.DictReader(StringIO(content))
        expected_cols = {"scale_name","raw_score","percentile"}
        if not reader.fieldnames or set(reader.fieldnames) != expected_cols:
            raise HTTPException(status_code=400, detail=AdminMessages.CSV_HEADER_INVALID)
        
        scale_rows: dict[str, list[tuple[int, float]]] = {}
        for row in reader:
            try:
                scale_name = row['scale_name'].strip()
                raw_score = int(row['raw_score'])
                percentile = float(row['percentile'])
            except Exception:
                raise HTTPException(
                    status_code=400,
                    detail=AdminMessages.ROW_FORMAT_INVALID.format(row=row),
                ) from None
            scale_rows.setdefault(scale_name, []).append((raw_score, percentile))

        rows: list[tuple[str, int, float]] = []
        for scale_name, tuples in scale_rows.items():
            tuples.sort(key=lambda t: t[0])  # sort by raw_score
            last = None
            for raw_score, percentile in tuples:
                if last is not None and percentile < last:
                    raise HTTPException(
                        status_code=400,
                        detail=AdminMessages.PERCENTILE_NOT_MONOTONIC.format(
                            scale_name=scale_name,
                            raw_score=raw_score,
                        ),
                    )
                last = percentile
                rows.append((scale_name, raw_score, percentile))
        
        batch_hash = sha256(content.encode('utf-8')).hexdigest()
        inserted = 0
        try:
            for scale_name, raw_score, percentile in rows:
                _, created = self.norm_repo.upsert_sync(
                    norm_group,
                    nv,
                    scale_name,
                    raw_score,
                    percentile,
                )
                if created:
                    inserted += 1
            
            self.audit_repo.log_sync(
                actor=user.email,
                action=f"norm_import:{norm_group}:{nv}",
                payload_hash=batch_hash,
            )
            self.db.commit()
        except Exception:
            self.db.rollback()
            logger.exception(
                "admin_norm_import_failed",
                extra={"structured_data": {
                    "operation": "norm_import",
                    "user_id": user.id,
                    "user_email": user.email,
                    "norm_group": norm_group,
                    "norm_version": nv,
                }}
            )
            raise
        
        # Invalidate in-process normative cache so subsequent lookups see fresh data
        try:
            provider = build_composite_norm_provider(self.db)
            if hasattr(provider, "_db_lookup"):
                clear_norm_db_cache(getattr(provider, "_db_lookup"))
        except Exception as exc:
            logger.exception(
                "norm_cache_invalidation_failed",
                extra={
                    "structured_data": {
                        "norm_group": norm_group,
                        "norm_version": nv,
                        "user_id": user.id,
                    }
                },
            )
        finally:
            clear_percentile_cache()
            
        return {
            "norm_group": norm_group,
            "norm_version": nv,
            "rows_inserted": inserted,
            "rows_processed": len(rows),
            "hash": batch_hash,
        }
