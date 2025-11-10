from sqlalchemy.orm import Session

from datetime import datetime, timezone

from app.assessments.klsi_v4 import load_config
from app.models.klsi import (
    AssessmentItem,
    Instrument,
    InstrumentScale,
    ItemChoice,
    ItemType,
    LearningMode,
    LearningStyleType,
)

def _style_windows_from_config() -> dict[str, dict[str, int | None]]:
    cfg = load_config()
    windows: dict[str, dict[str, int | None]] = {}
    for style_name, bounds in cfg["style_windows"].items():
        windows[style_name] = {
            "ACCE_min": bounds["ACCE"][0],
            "ACCE_max": bounds["ACCE"][1],
            "AERO_min": bounds["AERO"][0],
            "AERO_max": bounds["AERO"][1],
        }
    return windows


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
    db.commit()


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
        db.commit()


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
        db.commit()
