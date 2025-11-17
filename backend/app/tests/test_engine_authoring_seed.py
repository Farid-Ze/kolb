import json

from sqlalchemy.orm import Session

from app.models.engine import (
    EngineForm,
    EngineInstrument,
    EngineItem,
    EngineItemOption,
    EngineItemType,
    EnginePage,
    EngineScale,
    EngineScoringRule,
)
from app.models.klsi.enums import LearningMode
from app.models.klsi.items import AssessmentItem
from app.services.seeds import seed_engine_authoring


def _clear_engine_tables(db: Session) -> None:
    db.query(EngineItemOption).delete()
    db.query(EngineItem).delete()
    db.query(EnginePage).delete()
    db.query(EngineForm).delete()
    db.query(EngineScale).delete()
    db.query(EngineScoringRule).delete()
    db.query(EngineInstrument).delete()
    db.flush()


def test_seed_engine_authoring_populates_forced_choice_items(session: Session):
    _clear_engine_tables(session)

    seed_engine_authoring(session)
    session.commit()

    instrument = (
        session.query(EngineInstrument)
        .filter(EngineInstrument.code == "KLSI", EngineInstrument.version == "4.0")
        .first()
    )
    assert instrument is not None

    items = session.query(EngineItem).order_by(EngineItem.sequence_order.asc()).all()
    legacy_count = session.query(AssessmentItem).count()
    assert len(items) == legacy_count == 12

    for item in items:
        assert item.item_type == EngineItemType.forced_choice
        metadata = item.metadata_payload or {}
        assert metadata.get("legacy_item_id") is not None
        assert metadata.get("legacy_item_number") == item.sequence_order
        choice_modes = {opt.learning_mode for opt in item.options}
        assert choice_modes == {mode.value for mode in LearningMode}
        for opt in item.options:
            assert opt.value == opt.learning_mode
            opt_meta = opt.metadata_payload or {}
            assert opt_meta.get("legacy_choice_id") is not None

    scales = session.query(EngineScale).filter(EngineScale.instrument_id == instrument.id).all()
    assert {scale.scale_code for scale in scales} == {"CE", "RO", "AC", "AE", "ACCE", "AERO", "LFI"}

    rules = session.query(EngineScoringRule).filter(EngineScoringRule.instrument_id == instrument.id).all()
    assert len(rules) == 6
    for rule in rules:
        expression_payload = json.loads(rule.expression or "{}")
        assert isinstance(expression_payload, dict)
        assert isinstance(rule.config, dict)


def test_seed_engine_authoring_is_idempotent(session: Session):
    initial_items = session.query(EngineItem).count()
    seed_engine_authoring(session)
    session.commit()
    assert session.query(EngineItem).count() == initial_items
