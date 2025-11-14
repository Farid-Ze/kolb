from sqlalchemy.orm import Session

from datetime import datetime, timezone

from app.assessments.klsi_v4 import load_config
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

    scale_defs = [
        ("CE", "Concrete Experience", 1),
        ("RO", "Reflective Observation", 2),
        ("AC", "Abstract Conceptualization", 3),
        ("AE", "Active Experimentation", 4),
        ("ACCE", "AC - CE Dialectic", 5),
        ("AERO", "AE - RO Dialectic", 6),
        ("LFI", "Learning Flexibility Index", 7),
    ]
    for code, name, order in scale_defs:
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
        # 12 learning style items from KLSI 4.0 academic publication
        for i in range(1, 13):
            item = AssessmentItem(
                item_number=i, 
                item_type=ItemType.learning_style, 
                item_stem=f"Ketika saya belajar: (Item {i})", 
                language="ID"
            )
            db.add(item)
            db.flush()
            db.add_all([
                ItemChoice(item_id=item.id, learning_mode=LearningMode.CE, choice_text="Saya mengandalkan perasaan saya"),
                ItemChoice(item_id=item.id, learning_mode=LearningMode.RO, choice_text="Saya mengamati dengan cermat"),
                ItemChoice(item_id=item.id, learning_mode=LearningMode.AC, choice_text="Saya berpikir tentang gagasan"),
                ItemChoice(item_id=item.id, learning_mode=LearningMode.AE, choice_text="Saya mencoba melakukannya")
            ])
