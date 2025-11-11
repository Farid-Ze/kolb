from __future__ import annotations

from typing import Dict, List, Sequence

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.engine.interfaces import (
    DeliveryConfig,
    EngineNormProvider,
    EngineReportBuilder,
    EngineScorer,
    InstrumentId,
    InstrumentPlugin,
    ItemDTO,
)
from app.engine.registry import engine_registry
from app.models.klsi import (
    AssessmentItem,
    AssessmentSession,
    ItemChoice,
    LFIContextScore,
    PercentileScore,
    SessionStatus,
    UserResponse,
)
from app.core.errors import DomainError, InvalidAssessmentData, SessionNotFoundError
from app.services.report import build_report
from app.services.scoring import CONTEXT_NAMES, finalize_session


def _coerce_int(value: object) -> int:
    if isinstance(value, bool):
        raise TypeError("Boolean value not allowed")
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        return int(value)
    if isinstance(value, float):
        if not value.is_integer():
            raise ValueError("Expected integer-compatible float")
        return int(value)
    raise TypeError("Value must be an integer-compatible type")


class KLSI4Plugin(
    InstrumentPlugin,
    EngineScorer,
    EngineNormProvider,
    EngineReportBuilder,
):
    _ID = InstrumentId("KLSI", "4.0")

    def id(self) -> InstrumentId:
        return self._ID

    def delivery(self) -> DeliveryConfig:
        return DeliveryConfig(
            forced_choice=True,
            sections=["learning_style", "learning_flexibility"],
            randomize=False,
            expected_contexts=8,
        )

    def fetch_items(self, db: Session, session_id: int) -> Sequence[ItemDTO]:
        self._ensure_session(db, session_id)
        items = (
            db.query(AssessmentItem)
            .order_by(AssessmentItem.item_number.asc())
            .options(joinedload(AssessmentItem.choices))
            .all()
        )
        result: List[ItemDTO] = []
        for item in items:
            options = [
                {
                    "id": choice.id,
                    "learning_mode": choice.learning_mode.value,
                    "text": choice.choice_text,
                }
                for choice in item.choices
            ]
            result.append(
                ItemDTO(
                    id=item.id,
                    number=item.item_number,
                    type=item.item_type.value,
                    stem=item.item_stem,
                    options=options,
                )
            )
        return result

    def validate_submit(self, db: Session, session_id: int, payload: Dict[str, object]) -> None:
        self._ensure_session(db, session_id)
        kind = payload.get("kind")
        match kind:
            case "item":
                self._submit_item(db, session_id, payload)
            case "context":
                self._submit_context(db, session_id, payload)
            case _:
                raise HTTPException(status_code=400, detail="Jenis payload tidak dikenal")

    def finalize(self, db: Session, session_id: int, *, skip_checks: bool = False) -> Dict[str, object]:
        session = self._ensure_session(db, session_id)
        if session.status != SessionStatus.completed:
            try:
                result = finalize_session(db, session_id, skip_checks=skip_checks)
            except SessionNotFoundError as exc:
                raise HTTPException(status_code=404, detail=str(exc)) from None
            except InvalidAssessmentData as exc:
                raise HTTPException(status_code=400, detail=str(exc)) from None
            except DomainError as exc:
                raise HTTPException(status_code=400, detail=str(exc)) from None
            return result
        return {"ok": True}

    def percentile(
        self, db: Session, session_id: int, scale: str, raw: int | float
    ) -> tuple[float | None, str]:
        self._ensure_session(db, session_id)
        record = (
            db.query(PercentileScore)
            .filter(PercentileScore.session_id == session_id)
            .first()
        )
        if not record:
            return None, "NotComputed"
        field_map = {
            "CE": (record.CE_percentile, record.CE_source),
            "RO": (record.RO_percentile, record.RO_source),
            "AC": (record.AC_percentile, record.AC_source),
            "AE": (record.AE_percentile, record.AE_source),
            "ACCE": (record.ACCE_percentile, record.ACCE_source),
            "AERO": (record.AERO_percentile, record.AERO_source),
        }
        if scale not in field_map:
            raise HTTPException(status_code=400, detail="Skala tidak dikenal untuk KLSI4")
        return field_map[scale]

    def build(self, db: Session, session_id: int, viewer_role: str | None = None) -> Dict[str, object]:
        self._ensure_session(db, session_id)
        return build_report(db, session_id, viewer_role)

    # ──────────────────────────────────────────────────────────────────────────
    # Internal helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _ensure_session(self, db: Session, session_id: int) -> AssessmentSession:
        session = (
            db.query(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail="Session tidak ditemukan")
        return session

    def _submit_item(self, db: Session, session_id: int, payload: Dict[str, object]) -> None:
        item_id_raw = payload.get("item_id")
        ranks_raw = payload.get("ranks")
        if item_id_raw is None or ranks_raw is None:
            raise HTTPException(status_code=400, detail="item_id dan ranks wajib diisi")
        try:
            item_id_int = _coerce_int(item_id_raw)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="item_id harus numerik") from None
        if not isinstance(ranks_raw, dict):
            raise HTTPException(status_code=400, detail="ranks harus berupa objek")
        normalized: Dict[int, int] = {}
        for choice_id, rank in ranks_raw.items():
            try:
                cid = _coerce_int(choice_id)
                rval = _coerce_int(rank)
            except (TypeError, ValueError):
                raise HTTPException(status_code=400, detail="Pilihan dan peringkat harus numerik") from None
            normalized[cid] = rval
        if set(normalized.values()) != {1, 2, 3, 4}:
            raise HTTPException(status_code=400, detail="Harus mengandung peringkat 1,2,3,4 masing-masing sekali")
        valid_choices = {
            c.id
            for c in db.query(ItemChoice).filter(ItemChoice.item_id == item_id_int).all()
        }
        if valid_choices != set(normalized.keys()):
            raise HTTPException(status_code=400, detail="Pilihan tidak cocok dengan item")
        # Upsert semantics: allow re-submission; treat as overwrite not rejection.
        db.query(UserResponse).filter(
            UserResponse.session_id == session_id,
            UserResponse.item_id == item_id_int,
        ).delete(synchronize_session=False)
        for cid, rank in normalized.items():
            db.add(
                UserResponse(
                    session_id=session_id,
                    item_id=item_id_int,
                    choice_id=cid,
                    rank_value=rank,
                )
            )
        db.commit()

    def _submit_context(self, db: Session, session_id: int, payload: Dict[str, object]) -> None:
        context_name = payload.get("context_name")
        if not isinstance(context_name, str):
            raise HTTPException(status_code=400, detail="context_name wajib string")
        if context_name not in CONTEXT_NAMES:
            raise HTTPException(status_code=400, detail="Context name tidak dikenal")
        raw_ce = payload.get("CE")
        raw_ro = payload.get("RO")
        raw_ac = payload.get("AC")
        raw_ae = payload.get("AE")
        if raw_ce is None or raw_ro is None or raw_ac is None or raw_ae is None:
            raise HTTPException(status_code=400, detail="Semua peringkat konteks wajib diisi")
        ranks: Dict[str, int] = {}
        try:
            ranks["CE"] = _coerce_int(raw_ce)
            ranks["RO"] = _coerce_int(raw_ro)
            ranks["AC"] = _coerce_int(raw_ac)
            ranks["AE"] = _coerce_int(raw_ae)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="Semua peringkat konteks harus numerik") from None
        if set(ranks.values()) != {1, 2, 3, 4}:
            raise HTTPException(status_code=400, detail="Context ranks harus kombinasi unik 1..4")
        existing = (
            db.query(LFIContextScore)
            .filter(
                LFIContextScore.session_id == session_id,
                LFIContextScore.context_name == context_name,
            )
            .first()
        )
        overwrite = bool(payload.get("overwrite", False))
        if existing:
            if overwrite:
                # Upsert semantics: allow correction before finalize when client opts-in.
                existing.CE_rank = ranks["CE"]
                existing.RO_rank = ranks["RO"]
                existing.AC_rank = ranks["AC"]
                existing.AE_rank = ranks["AE"]
                db.commit()
                return
            # Maintain legacy behavior (reject duplicates) for default path/parity tests.
            raise HTTPException(
                status_code=400,
                detail="Konteks ini sudah dinilai. Hubungi mediator untuk koreksi.",
            )
        db.add(
            LFIContextScore(
                session_id=session_id,
                context_name=context_name,
                CE_rank=ranks["CE"],
                RO_rank=ranks["RO"],
                AC_rank=ranks["AC"],
                AE_rank=ranks["AE"],
            )
        )
        db.commit()


_plugin = KLSI4Plugin()
engine_registry.register_plugin(_plugin)
engine_registry.register_scorer(_plugin.id(), _plugin)
engine_registry.register_norms(_plugin.id(), _plugin)
engine_registry.register_report(_plugin.id(), _plugin)
