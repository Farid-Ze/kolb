import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload

from app.assessments.klsi_v4 import load_config
from app.models.engine import (
    EngineInstrument,
    EngineForm,
    EnginePage,
    EngineItem,
    EngineItemOption,
    EngineItemType,
    EngineScale,
    EngineScoringRule,
    InstrumentStatus,
    RuleType,
)
from app.models.klsi.enums import ItemType, LearningMode
from app.models.klsi.instrument import Instrument, InstrumentScale, ScoringPipeline, ScoringPipelineNode
from app.models.klsi.items import AssessmentItem, ItemChoice
from app.models.klsi.learning import LearningStyleType

def _style_windows_from_config() -> dict[str, dict[str, int | None]]:
    cfg = load_config()
    return {
        style_name: {
            "ACCE_min": window.acce_min,
            "ACCE_max": window.acce_max,
            "AERO_min": window.aero_min,
            "AERO_max": window.aero_max,
        }
        for style_name, window in cfg.style_windows.items()
    }


STYLE_WINDOWS = _style_windows_from_config()


def _authoring_catalog_current(instrument: EngineInstrument, expected_items: int) -> bool:
    """Return True when existing engine catalog mirrors legacy definition."""

    forms = instrument.forms or []
    if not forms:
        return False

    item_count = 0
    for form in forms:
        for page in form.pages or []:
            for item in page.items or []:
                item_count += 1
                metadata = item.metadata_payload or {}
                if not isinstance(metadata.get("legacy_item_id"), int):
                    return False
                if len(item.options or []) != 4:
                    return False
                for option in item.options or []:
                    option_meta = option.metadata_payload or {}
                    if not isinstance(option_meta.get("legacy_choice_id"), int):
                        return False

    if item_count != expected_items:
        return False

    if len(instrument.scales or []) != len(SCALE_DEFS):
        return False

    if len(instrument.rules or []) != len(AUTHORING_RULE_DEFS):
        return False

    return True

STYLE_DEFS = [
    ("Initiating", "INIT"),
    ("Experiencing", "EXPR"),
    ("Imagining", "IMAG"),
    ("Reflecting", "REFL"),
    ("Analyzing", "ANAL"),
    ("Thinking", "THNK"),
    ("Deciding", "DECI"),
    ("Acting", "ACTN"),
    ("Balancing", "BALN"),
]


ITEM_STEMS = [
    "Saya belajar paling baik saat mengalami langsung.",
    "Saya memahami ide dengan mengamati refleksi.",
    "Saya menganalisis konsep melalui logika.",
    "Saya menguji ide dengan bertindak.",
    "Saya fokus pada perasaan ketika memulai belajar.",
    "Saya menelaah dari berbagai sudut pandang.",
    "Saya menyusun model konseptual untuk memahami.",
    "Saya mencoba menerapkan ide secara praktis.",
    "Saya menggali pengalaman orang lain.",
    "Saya mencatat pola dan hubungan.",
    "Saya menghubungkan teori dengan praktik.",
    "Saya belajar dengan melakukan eksperimen singkat.",
]


CHOICE_TEXT = {
    LearningMode.CE: "Saya mengandalkan perasaan saya",
    LearningMode.RO: "Saya mengamati dengan cermat",
    LearningMode.AC: "Saya berpikir tentang gagasan",
    LearningMode.AE: "Saya mencoba melakukannya",
}


SCALE_DEFS = [
    ("CE", "Concrete Experience", 1),
    ("RO", "Reflective Observation", 2),
    ("AC", "Abstract Conceptualization", 3),
    ("AE", "Active Experimentation", 4),
    ("ACCE", "AC - CE Dialectic", 5),
    ("AERO", "AE - RO Dialectic", 6),
    ("LFI", "Learning Flexibility Index", 7),
]


AUTHORING_RULE_DEFS = [
    {
        "code": "RAW_SUM_CE",
        "type": RuleType.sum,
        "target": "CE",
        "position": 1,
        "expression": {"inputs": ["CE_raw"]},
        "config": {"source": "forced_choice"},
    },
    {
        "code": "RAW_SUM_RO",
        "type": RuleType.sum,
        "target": "RO",
        "position": 2,
        "expression": {"inputs": ["RO_raw"]},
        "config": {"source": "forced_choice"},
    },
    {
        "code": "RAW_SUM_AC",
        "type": RuleType.sum,
        "target": "AC",
        "position": 3,
        "expression": {"inputs": ["AC_raw"]},
        "config": {"source": "forced_choice"},
    },
    {
        "code": "RAW_SUM_AE",
        "type": RuleType.sum,
        "target": "AE",
        "position": 4,
        "expression": {"inputs": ["AE_raw"]},
        "config": {"source": "forced_choice"},
    },
    {
        "code": "DIFF_ACCE",
        "type": RuleType.diff,
        "target": "ACCE",
        "position": 5,
        "expression": {"minuend": "AC", "subtrahend": "CE"},
        "config": {"source": "dialectic"},
    },
    {
        "code": "DIFF_AERO",
        "type": RuleType.diff,
        "target": "AERO",
        "position": 6,
        "expression": {"minuend": "AE", "subtrahend": "RO"},
        "config": {"source": "dialectic"},
    },
]


def seed_instruments(db: Session) -> None:
    if db.query(Instrument).filter(Instrument.code == "KLSI", Instrument.version == "4.0").first():
        return

    now = datetime.now(timezone.utc)
    instrument = Instrument(
        code="KLSI",
        name="Kolb Learning Style Inventory",
        version="4.0",
        default_strategy_code="KLSI4.0",
        description="Kolb Learning Style Inventory 4.0",
        is_active=True,
        created_at=now,
    )
    db.add(instrument)
    db.flush()

    for code, name, order in SCALE_DEFS:
        db.add(
            InstrumentScale(
                instrument_id=instrument.id,
                scale_code=code,
                display_name=name,
                rendering_order=order,
            )
        )

    if (
        db.query(ScoringPipeline)
        .filter(
            ScoringPipeline.instrument_id == instrument.id,
            ScoringPipeline.pipeline_code == "KLSI4.0",
            ScoringPipeline.version == "v1",
        )
        .first()
        is None
    ):
        pipeline = ScoringPipeline(
            instrument_id=instrument.id,
            pipeline_code="KLSI4.0",
            version="v1",
            description="Default scoring pipeline for KLSI 4.0",
            is_active=True,
            metadata_payload={
                "strategy_code": "KLSI4.0",
                "stages": [
                    "compute_raw_scale_scores",
                    "compute_combination_scores",
                    "assign_learning_style",
                    "compute_lfi",
                    "apply_percentiles",
                ],
            },
        )
        db.add(pipeline)
        db.flush()

        nodes = [
            (
                "RAW_SCALES",
                "service_call",
                1,
                {
                    "callable": "app.assessments.klsi_v4.logic.compute_raw_scale_scores",
                    "artifact_key": "raw_modes",
                },
                "COMBINATIONS",
                False,
            ),
            (
                "COMBINATIONS",
                "service_call",
                2,
                {
                    "callable": "app.assessments.klsi_v4.logic.compute_combination_scores",
                    "artifact_key": "combination",
                },
                "STYLE_ASSIGNMENT",
                False,
            ),
            (
                "STYLE_ASSIGNMENT",
                "service_call",
                3,
                {
                    "callable": "app.assessments.klsi_v4.logic.assign_learning_style",
                    "artifact_key": "style",
                },
                "LFI",
                False,
            ),
            (
                "LFI",
                "service_call",
                4,
                {
                    "callable": "app.assessments.klsi_v4.logic.compute_lfi",
                    "artifact_key": "lfi",
                },
                "apply_percentiles",
                False,
            ),
            (
                "apply_percentiles",
                "service_call",
                5,
                {
                    "callable": "app.assessments.klsi_v4.logic.apply_percentiles",
                    "artifact_key": "percentiles",
                },
                None,
                True,
            ),
        ]
        for key, node_type, order, config, next_key, terminal in nodes:
            db.add(
                ScoringPipelineNode(
                    pipeline_id=pipeline.id,
                    node_key=key,
                    node_type=node_type,
                    execution_order=order,
                    config=config,
                    next_node_key=next_key,
                    is_terminal=terminal,
                )
            )


def seed_learning_styles(db: Session):
    if db.query(LearningStyleType).count() == 0:
        for name, code in STYLE_DEFS:
            w = STYLE_WINDOWS[name]
            db.add(
                LearningStyleType(
                    style_name=name,
                    style_code=code,
                    ACCE_min=w['ACCE_min'],
                    ACCE_max=w['ACCE_max'],
                    AERO_min=w['AERO_min'],
                    AERO_max=w['AERO_max'],
                    description=None,
                )
            )


def seed_assessment_items(db: Session):
    """Seed 12 learning style assessment items from KLSI 4.0.
    
    Items are based on the open-source academic publication by Kolb & Kolb (2013).
    These items represent the 12 forced-choice items that assess preferences across
    the four learning modes: CE (Concrete Experience), RO (Reflective Observation),
    AC (Abstract Conceptualization), and AE (Active Experimentation).
    """
    if db.query(AssessmentItem).count() == 0:
        for idx, stem in enumerate(ITEM_STEMS, start=1):
            item = AssessmentItem(
                item_number=idx,
                item_type=ItemType.learning_style,
                item_stem=stem,
                language="ID",
            )
            db.add(item)
            db.flush()
            for mode in (LearningMode.CE, LearningMode.RO, LearningMode.AC, LearningMode.AE):
                db.add(
                    ItemChoice(
                        item_id=item.id,
                        learning_mode=mode,
                        choice_text=CHOICE_TEXT[mode],
                    )
                )
            db.flush()


def seed_engine_authoring(db: Session) -> None:
    """Mirror legacy KLSI catalog into engine authoring tables."""

    legacy_items = (
        db.query(AssessmentItem)
        .options(joinedload(AssessmentItem.choices))
        .order_by(AssessmentItem.item_number.asc())
        .all()
    )
    if not legacy_items:
        return

    existing = (
        db.query(EngineInstrument)
        .filter(EngineInstrument.code == "KLSI", EngineInstrument.version == "4.0")
        .options(
            joinedload(EngineInstrument.forms)
            .joinedload(EngineForm.pages)
            .joinedload(EnginePage.items)
            .joinedload(EngineItem.options),
            joinedload(EngineInstrument.scales),
            joinedload(EngineInstrument.rules),
        )
        .first()
    )

    expected_item_count = len(legacy_items)
    if existing and _authoring_catalog_current(existing, expected_item_count):
        return
    if existing:
        db.delete(existing)
        db.flush()

    instrument = EngineInstrument(
        code="KLSI",
        version="4.0",
        name="KLSI 4.0",
        status=InstrumentStatus.active,
        description="KLSI 4.0 forced-choice instrument seeded from legacy tables",
    )
    db.add(instrument)
    db.flush()

    form = EngineForm(
        instrument_id=instrument.id,
        form_code="learning_style",
        title="Learning Style Items",
        ordering=1,
    )
    db.add(form)
    db.flush()

    page = EnginePage(
        form_id=form.id,
        page_code="learning_style_page",
        title="Forced Choice",
        page_order=1,
    )
    db.add(page)
    db.flush()

    for legacy_item in legacy_items:
        eng_item = EngineItem(
            page_id=page.id,
            item_code=f"LS_{legacy_item.item_number:02d}",
            item_type=EngineItemType.forced_choice,
            stem=legacy_item.item_stem,
            sequence_order=legacy_item.item_number,
            metadata_payload={
                "legacy_item_id": legacy_item.id,
                "legacy_item_number": legacy_item.item_number,
            },
        )
        db.add(eng_item)
        db.flush()

        for choice in sorted(legacy_item.choices, key=lambda c: c.learning_mode.value):
            db.add(
                EngineItemOption(
                    item_id=eng_item.id,
                    option_code=f"{choice.learning_mode.value}_{legacy_item.item_number:02d}",
                    option_text=choice.choice_text,
                    learning_mode=choice.learning_mode.value,
                    value=choice.learning_mode.value,
                    metadata_payload={"legacy_choice_id": choice.id},
                )
            )

    for code, name, order in SCALE_DEFS:
        db.add(
            EngineScale(
                instrument_id=instrument.id,
                scale_code=code,
                name=name,
                ordering=order,
            )
        )

    for definition in AUTHORING_RULE_DEFS:
        expression_payload = json.dumps(definition["expression"], separators=(",", ":"))
        db.add(
            EngineScoringRule(
                instrument_id=instrument.id,
                rule_code=definition["code"],
                rule_type=definition["type"],
                target=definition["target"],
                position=definition["position"],
                expression=expression_payload,
                config=dict(definition["config"]),
            )
        )
