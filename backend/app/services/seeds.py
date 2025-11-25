import json
from datetime import datetime, timezone
from pathlib import Path

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
from app.models.klsi.challenge import GrowthChallenge
from app.models.klsi.instrument import Instrument, InstrumentScale, ScoringPipeline, ScoringPipelineNode
from app.models.klsi.items import AssessmentItem, ItemChoice
from app.models.klsi.learning import LearningStyleType
from app.i18n.id_styles import STYLE_BRIEF_ID
from app.models.klsi.gamification import GamificationBadge, BadgeRarity
from app.models.klsi.store import StoreProduct


_RESOURCES_DIR = Path(__file__).resolve().parent.parent / "instruments" / "klsi4" / "resources"


def _load_klsi_localization(locale: str = "id") -> dict:
    path = _RESOURCES_DIR / f"{locale}_items.json"
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)

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


_LOCALIZATION = _load_klsi_localization("id")

ITEM_STEMS = _LOCALIZATION["itemStems"]
LFI_CONTEXTS = _LOCALIZATION["lfiContexts"]
LFI_STEMS = _LOCALIZATION["lfiStems"]
CHOICE_TEXT = {
    LearningMode.CE: _LOCALIZATION["choices"]["CE"],
    LearningMode.RO: _LOCALIZATION["choices"]["RO"],
    LearningMode.AC: _LOCALIZATION["choices"]["AC"],
    LearningMode.AE: _LOCALIZATION["choices"]["AE"],
}


STORE_PRODUCT_TEMPLATES = [
    {
        "slug": "klsi-4.0",
        "name": "Kolb Learning Style Inventory 4.0",
        "description": "Official assessment to discover your learning style.",
        "base_price": 1,
        "required_badge_slug": None,
        "meta": {
            "category": "assessment",
            "instrument_code": "KLSI",
            "instrument_version": "4.0",
            "currency": "CREDIT",
        },
    },
    {
        "slug": "zen-reflection-journal",
        "name": "Zen Reflection Journal",
        "description": "Notebook with prompts curated for each learning mode to keep tunnel insights alive.",
        "base_price": 150,
        "required_badge_slug": None,
        "meta": {
            "category": "journaling",
            "image_url": "/static/store/journal.png",
            "includes": ["40 guided pages", "LFI micro-coaching tips"],
            "currency": "IDR",
        },
    },
    {
        "slug": "seeker-momentum-kit",
        "name": "Seeker Momentum Kit",
        "description": "Badge-gated kit with challenge cards and a vinyl sticker for first-time finalists.",
        "base_price": 0,
        "required_badge_slug": "the-seeker",
        "meta": {
            "category": "swag",
            "image_url": "/static/store/momentum-kit.png",
            "contains": ["challenge cards", "limited sticker"],
            "currency": "IDR",
        },
    },
    {
        "slug": "impact-canvas-pack",
        "name": "Impact Canvas Pack",
        "description": "Printable canvases that map CE/RO/AC/AE thinking into squad planning rituals.",
        "base_price": 220,
        "required_badge_slug": None,
        "meta": {
            "category": "toolkit",
            "image_url": "/static/store/impact-canvas.png",
            "filetype": "pdf",
            "currency": "IDR",
        },
    },
]


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
    """Ensure learning_style_types exist with up-to-date windows and descriptions."""

    existing = {
        style.style_name: style
        for style in db.query(LearningStyleType).all()
    }

    for name, code in STYLE_DEFS:
        windows = STYLE_WINDOWS[name]
        description = STYLE_BRIEF_ID.get(name)
        style = existing.get(name)
        if not style:
            db.add(
                LearningStyleType(
                    style_name=name,
                    style_code=code,
                    ACCE_min=windows["ACCE_min"],
                    ACCE_max=windows["ACCE_max"],
                    AERO_min=windows["AERO_min"],
                    AERO_max=windows["AERO_max"],
                    description=description,
                )
            )
            continue

        style.style_code = code
        style.ACCE_min = windows["ACCE_min"]
        style.ACCE_max = windows["ACCE_max"]
        style.AERO_min = windows["AERO_min"]
        style.AERO_max = windows["AERO_max"]
        if description:
            style.description = description


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

    # Seed LFI items if they don't exist
    if db.query(AssessmentItem).filter(AssessmentItem.item_type == ItemType.learning_flex).count() == 0:
        for idx, context_name in enumerate(LFI_CONTEXTS, start=13):
            item = AssessmentItem(
                item_number=idx,
                item_type=ItemType.learning_flex,
                item_stem=LFI_STEMS.get(context_name, context_name),
                item_category=context_name, # Store context name for mapping
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
        .filter(AssessmentItem.item_type == ItemType.learning_style)
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


def seed_gamification_badges(db: Session):
    badges = [
        {"slug": "the-seeker", "name": "The Seeker", "rarity": BadgeRarity.common},
    ]
    
    for b in badges:
        existing = db.query(GamificationBadge).filter_by(slug=b["slug"]).first()
        if not existing:
            badge = GamificationBadge(slug=b["slug"], name=b["name"], rarity=b["rarity"])
            db.add(badge)
    db.commit()


def seed_growth_challenges(db: Session):
    templates = [
        {
            "target_style_deficiency": "CE_low",
            "title": "Empathy Field Notes",
            "description": "Interview two community members about their challenges and document emotions in a shared journal.",
            "societal_impact": "Builds listening muscles and surfaces grassroots issues for the organizing team.",
        },
        {
            "target_style_deficiency": "RO_low",
            "title": "Reflection Sprint",
            "description": "Set aside 15 minutes after each study session to write what worked, what felt unclear, and why.",
            "societal_impact": "Improves collective learning retrospectives across squads.",
        },
        {
            "target_style_deficiency": "AC_low",
            "title": "Framework Remix",
            "description": "Select a national policy issue and map it onto the Kolb cycle to derive at least three hypotheses.",
            "societal_impact": "Encourages data-informed thinking for social innovation.",
        },
        {
            "target_style_deficiency": "AE_low",
            "title": "Micro Pilot",
            "description": "Design and run a 48-hour experiment that tests one hypothesis with real beneficiaries.",
            "societal_impact": "Creates visible momentum and feedback loops for the cohort.",
        },
        # Additional Challenges
        {
            "target_style_deficiency": "CE_low",
            "title": "The Listener's Circle",
            "description": "Host a 30-minute listening circle where you only ask open-ended questions and cannot offer solutions.",
            "societal_impact": "Deepens community trust and psychological safety.",
        },
        {
            "target_style_deficiency": "RO_low",
            "title": "Daily Digest",
            "description": "Keep a daily log of 'Surprises' and 'Confirmations' for one week to train observation skills.",
            "societal_impact": "Reduces reactive decision making in the organization.",
        },
        {
            "target_style_deficiency": "AC_low",
            "title": "Concept Map",
            "description": "Draw a concept map connecting three seemingly unrelated problems in your community.",
            "societal_impact": "Identifies systemic root causes rather than symptoms.",
        },
        {
            "target_style_deficiency": "AE_low",
            "title": "Prototype Tuesday",
            "description": "Build a cardboard or paper prototype of a solution and get feedback from 5 users in one day.",
            "societal_impact": "Accelerates innovation cycles and reduces waste.",
        },
    ]

    for template in templates:
        existing = (
            db.query(GrowthChallenge)
            .filter_by(target_style_deficiency=template["target_style_deficiency"])
            .first()
        )
        if not existing:
            challenge = GrowthChallenge(**template)
            db.add(challenge)
    db.commit()


def seed_store_products(db: Session) -> None:
    """Ensure ZenStore products exist with badge gating metadata."""

    badge_lookup = {
        badge.slug: badge.id
        for badge in db.query(GamificationBadge).all()
    }
    existing_products = {
        product.slug: product
        for product in db.query(StoreProduct).all()
    }

    changed = False
    for template in STORE_PRODUCT_TEMPLATES:
        required_badge_slug = template.get("required_badge_slug")
        required_badge_id = badge_lookup.get(required_badge_slug) if required_badge_slug else None
        meta = template.get("meta") or None
        if meta:
            meta = json.loads(json.dumps(meta))  # defensive copy for JSON columns

        product = existing_products.get(template["slug"])
        if product:
            product.slug = template["slug"]
            product.description = template["description"]
            product.name = template["name"]
            product.base_price = template["base_price"]
            product.required_badge_id = required_badge_id
            product.meta = meta
        else:
            db.add(
                StoreProduct(
                    slug=template["slug"],
                    name=template["name"],
                    description=template["description"],
                    base_price=template["base_price"],
                    required_badge_id=required_badge_id,
                    meta=meta,
                )
            )
        changed = True

    if changed:
        db.commit()
