from sqlalchemy.orm import Session

from app.models.klsi import AssessmentItem, ItemChoice, ItemType, LearningMode, LearningStyleType

# ACCE bands: <=5, 6..14, >=15; AERO bands: <=0, 1..11, >=12
STYLE_WINDOWS = {
    "Imagining":  dict(ACCE_min=-999, ACCE_max=5,   AERO_min=-999, AERO_max=0),
    "Experiencing":dict(ACCE_min=-999, ACCE_max=5,   AERO_min=1,    AERO_max=11),
    "Initiating": dict(ACCE_min=-999, ACCE_max=5,   AERO_min=12,   AERO_max=999),
    "Reflecting": dict(ACCE_min=6,    ACCE_max=14,  AERO_min=-999, AERO_max=0),
    "Balancing":  dict(ACCE_min=6,    ACCE_max=14,  AERO_min=1,    AERO_max=11),
    "Acting":     dict(ACCE_min=6,    ACCE_max=14,  AERO_min=12,   AERO_max=999),
    "Analyzing":  dict(ACCE_min=15,   ACCE_max=999, AERO_min=-999, AERO_max=0),
    "Thinking":   dict(ACCE_min=15,   ACCE_max=999, AERO_min=1,    AERO_max=11),
    "Deciding":   dict(ACCE_min=15,   ACCE_max=999, AERO_min=12,   AERO_max=999),
}

STYLE_DEFS = [
    ("Initiating","INIT"),("Experiencing","EXPR"),("Imagining","IMAG"),
    ("Reflecting","REFL"),("Analyzing","ANAL"),("Thinking","THNK"),
    ("Deciding","DECI"),("Acting","ACTN"),("Balancing","BALN")
]


def seed_learning_styles(db: Session):
    if db.query(LearningStyleType).count() == 0:
        for name, code in STYLE_DEFS:
            w = STYLE_WINDOWS[name]
            db.add(LearningStyleType(style_name=name, style_code=code,
                                     ACCE_min=w['ACCE_min'], ACCE_max=w['ACCE_max'],
                                     AERO_min=w['AERO_min'], AERO_max=w['AERO_max'],
                                     description=None))
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
                ItemChoice(item_id=item.id, learning_mode=LearningMode.CE, choice_text=f"Saya mengandalkan perasaan saya"),
                ItemChoice(item_id=item.id, learning_mode=LearningMode.RO, choice_text=f"Saya mengamati dengan cermat"),
                ItemChoice(item_id=item.id, learning_mode=LearningMode.AC, choice_text=f"Saya berpikir tentang gagasan"),
                ItemChoice(item_id=item.id, learning_mode=LearningMode.AE, choice_text=f"Saya mencoba melakukannya")
            ])
        db.commit()
