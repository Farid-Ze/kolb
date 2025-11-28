from typing import Dict, List, Sequence
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
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
from app.models.engine import (
    EngineForm,
    EngineInstrument,
    EngineItem,
    EngineItemOption,
    EngineItemType,
    EnginePage,
)
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import ItemType
from app.models.klsi.items import AssessmentItem, ItemChoice, UserResponse
from app.models.klsi.learning import LFIContextScore
from app.models.klsi.norms import PercentileScore
from app.models.klsi.enums import SessionStatus
from app.core.errors import DomainError, InvalidAssessmentData, SessionNotFoundError
from app.services.report import build_report
from app.services.scoring import CONTEXT_NAMES, finalize_session
from app.i18n.id_messages import KLSI4Messages


def _coerce_int(value: object) -> int:
    if isinstance(value, bool):
        raise TypeError(KLSI4Messages.BOOLEAN_NOT_ALLOWED)
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        return int(value)
    if isinstance(value, float):
        if not value.is_integer():
            raise ValueError(KLSI4Messages.FLOAT_MUST_BE_INTEGER)
        return int(value)
    raise TypeError(KLSI4Messages.INTEGER_COMPATIBLE_REQUIRED)


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

    def fetch_items(self, db: Session, session_id: UUID) -> Sequence[ItemDTO]:
        self._ensure_session(db, session_id)
        if settings.engine_authoring_items_enabled:
            return self._fetch_items_from_authoring(db)
        return self._fetch_items_from_legacy(db)

    def validate_submit(self, db: Session, session_id: UUID, payload: Dict[str, object]) -> None:
        self._ensure_session(db, session_id)
        kind = payload.get("kind")
        match kind:
            case "item":
                self._submit_item(db, session_id, payload)
            case "context":
                self._submit_context(db, session_id, payload)
            case _:
                raise HTTPException(status_code=400, detail=KLSI4Messages.UNKNOWN_PAYLOAD_KIND)

    def finalize(self, db: Session, session_id: UUID, *, skip_checks: bool = False) -> Dict[str, object]:
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
        self, db: Session, session_id: UUID, scale: str, raw: int | float
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
            raise HTTPException(status_code=400, detail=KLSI4Messages.UNKNOWN_SCALE)
        return field_map[scale]

    def build(self, db: Session, session_id: UUID, viewer_role: str | None = None) -> Dict[str, object]:
        self._ensure_session(db, session_id)
        return build_report(db, session_id, viewer_role)

    # ──────────────────────────────────────────────────────────────────────────
    # Internal helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _fetch_items_from_legacy(self, db: Session) -> Sequence[ItemDTO]:
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
                    "code": choice.learning_mode.value,
                    "learning_mode": choice.learning_mode.value,
                    "label": choice.choice_text,
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
                    category=item.item_category,
                )
            )
        return result

    def _fetch_items_from_authoring(self, db: Session) -> Sequence[ItemDTO]:
        instrument = (
            db.query(EngineInstrument)
            .filter(
                EngineInstrument.code == self._ID.key,
                EngineInstrument.version == self._ID.version,
            )
            .options(
                joinedload(EngineInstrument.forms)
                .joinedload(EngineForm.pages)
                .joinedload(EnginePage.items)
                .joinedload(EngineItem.options)
            )
            .first()
        )
        if not instrument:
            raise HTTPException(status_code=404, detail=KLSI4Messages.AUTHORING_INSTRUMENT_MISSING)

        payload: List[ItemDTO] = []
        forms = sorted(instrument.forms, key=lambda f: f.ordering)
        for form in forms:
            pages = sorted(form.pages, key=lambda p: p.page_order)
            for page in pages:
                items = sorted(page.items, key=lambda i: i.sequence_order)
                for item in items:
                    metadata = item.metadata_payload or {}
                    legacy_item_id = metadata.get("legacy_item_id")
                    legacy_item_number = metadata.get("legacy_item_number", item.sequence_order)
                    if not isinstance(legacy_item_id, int):
                        raise HTTPException(status_code=500, detail=KLSI4Messages.AUTHORING_METADATA_MISSING)
                    if item.item_type != EngineItemType.forced_choice:
                        continue
                    option_payload: List[Dict[str, object]] = []
                    for option in sorted(item.options, key=lambda o: o.option_code):
                        option_metadata = option.metadata_payload or {}
                        legacy_choice_id = option_metadata.get("legacy_choice_id")
                        if not isinstance(legacy_choice_id, int):
                            raise HTTPException(
                                status_code=500,
                                detail=KLSI4Messages.AUTHORING_OPTION_METADATA_MISSING,
                            )
                        option_payload.append(
                            {
                                "id": legacy_choice_id,
                                "code": option.learning_mode,
                                "learning_mode": option.learning_mode,
                                "label": option.option_text,
                            }
                        )
                    if not option_payload:
                        raise HTTPException(status_code=500, detail=KLSI4Messages.AUTHORING_OPTION_METADATA_MISSING)
                    payload.append(
                        ItemDTO(
                            id=legacy_item_id,
                            number=int(legacy_item_number),
                            type=ItemType.learning_style.value,
                            stem=item.stem,
                            options=option_payload,
                        )
                    )
        # Append LFI context items from legacy table so UI receives the full 12+8 catalog.
        contexts = (
            db.query(AssessmentItem)
            .options(joinedload(AssessmentItem.choices))
            .filter(AssessmentItem.item_type == ItemType.learning_flex)
            .order_by(AssessmentItem.item_number.asc())
            .all()
        )
        for context_item in contexts:
            options = [
                {
                    "id": choice.id,
                    "code": choice.learning_mode.value,
                    "learning_mode": choice.learning_mode.value,
                    "label": choice.choice_text,
                }
                for choice in context_item.choices
            ]
            payload.append(
                ItemDTO(
                    id=context_item.id,
                    number=context_item.item_number,
                    type=context_item.item_type.value,
                    stem=context_item.item_stem,
                    options=options,
                    category=context_item.item_category,
                )
            )
        return payload

    def _ensure_session(self, db: Session, session_id: UUID) -> AssessmentSession:
        session = (
            db.query(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail=KLSI4Messages.SESSION_NOT_FOUND)
        return session

    def _submit_item(self, db: Session, session_id: UUID, payload: Dict[str, object]) -> None:
        item_id_raw = payload.get("item_id")
        ranks_raw = payload.get("ranks")
        if item_id_raw is None or ranks_raw is None:
            raise HTTPException(status_code=400, detail=KLSI4Messages.ITEM_AND_RANKS_REQUIRED)
        try:
            item_id_int = _coerce_int(item_id_raw)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail=KLSI4Messages.ITEM_ID_NUMERIC) from None
        if not isinstance(ranks_raw, dict):
            raise HTTPException(status_code=400, detail=KLSI4Messages.RANKS_MUST_BE_OBJECT)
        normalized: Dict[int, int] = {}
        for choice_id, rank in ranks_raw.items():
            try:
                cid = _coerce_int(choice_id)
                rval = _coerce_int(rank)
            except (TypeError, ValueError):
                raise HTTPException(status_code=400, detail=KLSI4Messages.CHOICE_AND_RANK_NUMERIC) from None
            normalized[cid] = rval
        if set(normalized.values()) != {1, 2, 3, 4}:
            raise HTTPException(status_code=400, detail=KLSI4Messages.RANKS_MUST_BE_UNIQUE)
        valid_choices = {
            c.id
            for c in db.query(ItemChoice).filter(ItemChoice.item_id == item_id_int).all()
        }
        if valid_choices != set(normalized.keys()):
            raise HTTPException(status_code=400, detail=KLSI4Messages.CHOICES_MISMATCH)
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

    def _submit_context(self, db: Session, session_id: UUID, payload: Dict[str, object]) -> None:
        context_name = payload.get("context_name")
        if not isinstance(context_name, str):
            raise HTTPException(status_code=400, detail=KLSI4Messages.CONTEXT_NAME_REQUIRED)
        if context_name not in CONTEXT_NAMES:
            raise HTTPException(status_code=400, detail=KLSI4Messages.CONTEXT_NAME_UNKNOWN)
        raw_ce = payload.get("CE")
        raw_ro = payload.get("RO")
        raw_ac = payload.get("AC")
        raw_ae = payload.get("AE")
        if raw_ce is None or raw_ro is None or raw_ac is None or raw_ae is None:
            raise HTTPException(status_code=400, detail=KLSI4Messages.CONTEXT_RANKS_REQUIRED)
        ranks: Dict[str, int] = {}
        try:
            ranks["CE"] = _coerce_int(raw_ce)
            ranks["RO"] = _coerce_int(raw_ro)
            ranks["AC"] = _coerce_int(raw_ac)
            ranks["AE"] = _coerce_int(raw_ae)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail=KLSI4Messages.CONTEXT_RANKS_NUMERIC) from None
        if set(ranks.values()) != {1, 2, 3, 4}:
            raise HTTPException(status_code=400, detail=KLSI4Messages.CONTEXT_RANKS_UNIQUE)
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
                detail=KLSI4Messages.CONTEXT_ALREADY_SUBMITTED,
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
