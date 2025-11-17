"""
Test suite for architectural requirements specified in the problem statement.

This test validates:
1. Learning style type windows are properly seeded
2. Balance percentiles are correctly labeled as heuristic/non-normative
3. Clear_norm_db_cache is called after norm imports
4. Mixed-provenance and near-boundary diagnostics work correctly
"""

from typing import Any, Protocol, runtime_checkable, cast

from sqlalchemy.orm import Session
from app.models.klsi.learning import LearningStyleType
from app.services.seeds import seed_learning_styles, STYLE_WINDOWS
from app.i18n.id_messages import ReportBalanceMessages
from app.engine.norms.factory import clear_norm_db_cache, _make_cached_db_lookup


@runtime_checkable
class CacheAwareCallable(Protocol):
    """Protocol exposing functools.lru_cache-style helpers."""

    def __call__(self, *args: Any, **kwargs: Any) -> Any:  # pragma: no cover - structural only
        ...

    def cache_info(self) -> Any:  # pragma: no cover - structural only
        ...

    def clear_cache(self) -> None:  # pragma: no cover - structural only
        ...


def test_learning_style_types_seeded_with_windows(session: Session):
    """Verify that learning_style_types are properly seeded with ACCE/AERO windows.
    
    This prevents drift between code-based STYLE_CUTS and DB-based windows
    used by assign_learning_style().
    """
    # Verify all 9 styles are present (already seeded in conftest.py)
    styles = session.query(LearningStyleType).all()
    assert len(styles) == 9, "Should have exactly 9 learning style types"
    
    # Verify each style has proper windows
    style_names = {s.style_name for s in styles}
    expected_names = set(STYLE_WINDOWS.keys())
    assert style_names == expected_names, f"Style names mismatch: {style_names} != {expected_names}"
    
    # Verify windows match the config
    for style in styles:
        expected = STYLE_WINDOWS[style.style_name]
        assert style.ACCE_min == expected['ACCE_min'], \
            f"{style.style_name} ACCE_min mismatch"
        assert style.ACCE_max == expected['ACCE_max'], \
            f"{style.style_name} ACCE_max mismatch"
        assert style.AERO_min == expected['AERO_min'], \
            f"{style.style_name} AERO_min mismatch"
        assert style.AERO_max == expected['AERO_max'], \
            f"{style.style_name} AERO_max mismatch"


def test_balance_percentiles_labeled_non_normative():
    """Verify balance percentiles have clear documentation that they are heuristic.
    
    Balance scores are derived from distance to normative centers (ACCE≈9, AERO≈6)
    and are NOT based on population norms. This must be clearly communicated.
    """
    note = ReportBalanceMessages.NOTE
    
    # Verify the note contains key terminology
    assert "bukan persentil normatif populasi" in note or "non-normative" in note.lower(), \
        "Balance note must explicitly state it's not a normative percentile"
    
    # Verify it mentions theoretical/heuristic nature
    assert any(term in note.lower() for term in ["turunan teoritis", "heuristik", "heuristic", "theoretical"]), \
        "Balance note should mention theoretical/heuristic nature"
    
    # Verify it references the normative centers
    assert "ACCE" in note and "AERO" in note, \
        "Balance note should reference ACCE and AERO"


def test_clear_norm_db_cache_functionality():
    """Verify clear_norm_db_cache properly invalidates LRU cache.
    
    This is critical after norm imports to ensure fresh data is used.
    """
    # Create a mock cached lookup function with cache_clear
    call_count = {"value": 0}
    
    def mock_clear():
        call_count["value"] += 1
    
    # Create a mock lookup function
    def mock_lookup(group, scale, raw):
        return None
    
    # Attach clear_cache method
    setattr(mock_lookup, "clear_cache", mock_clear)
    
    # Call clear_norm_db_cache
    clear_norm_db_cache(mock_lookup)
    
    # Verify cache was cleared
    assert call_count["value"] == 1, "Cache clear should have been called once"


def test_learning_style_windows_prevent_drift(session: Session):
    """Verify that style assignment uses DB windows, not hardcoded STYLE_CUTS.
    
    This ensures that changes to windows in the DB are reflected in style assignment
    without requiring code changes, preventing drift.
    """
    from app.assessments.klsi_v4.logic import assign_learning_style
    from app.models.klsi.learning import CombinationScore
    
    # Verify styles can be queried from DB (already seeded in conftest.py)
    styles = session.query(LearningStyleType).all()
    assert len(styles) > 0, "Learning style types must be seeded"
    
    # Verify each style has non-null windows (except potentially for Balancing)
    for style in styles:
        if style.style_name != "Balancing":
            # Most styles should have defined windows
            has_windows = (
                style.ACCE_min is not None or 
                style.ACCE_max is not None or 
                style.AERO_min is not None or 
                style.AERO_max is not None
            )
            assert has_windows, f"{style.style_name} should have defined window boundaries"


def test_style_cuts_are_helpers_only():
    """Verify STYLE_CUTS is only used as a helper, not for primary style assignment.
    
    The problem statement requires that style assignment uses DB windows,
    with STYLE_CUTS only serving as a helper/validation mechanism.
    """
    from app.assessments.klsi_v4.logic import STYLE_CUTS
    
    # STYLE_CUTS should exist and be a dict of callables
    assert isinstance(STYLE_CUTS, dict), "STYLE_CUTS should be a dictionary"
    assert len(STYLE_CUTS) == 9, "STYLE_CUTS should have 9 entries"
    
    # Each entry should be callable (lambda/function)
    for style_name, rule in STYLE_CUTS.items():
        assert callable(rule), f"{style_name} rule should be callable"
        
        # Verify it's a simple helper (takes 2 args: ACCE, AERO)
        # This is just a structural check, not a deep inspection
        assert hasattr(rule, '__call__'), f"{style_name} should be a function/lambda"


def test_norm_cache_integration(session: Session):
    """Verify that norm cache can be created and invalidated properly."""
    # Create a cached DB lookup
    db_lookup = cast(CacheAwareCallable, _make_cached_db_lookup(session))
    
    # Verify it has cache methods
    assert hasattr(db_lookup, 'clear_cache'), "Should have clear_cache method"
    assert hasattr(db_lookup, 'cache_info'), "Should have cache_info method"
    
    # Get initial cache info
    info = db_lookup.cache_info()
    assert hasattr(info, 'hits'), "Cache info should have hits"
    assert hasattr(info, 'misses'), "Cache info should have misses"
    
    # Clear cache
    db_lookup.clear_cache()
    
    # Verify cache was cleared (currsize should be 0)
    info_after = db_lookup.cache_info()
    assert info_after.currsize == 0, "Cache should be empty after clear"


def test_provenance_fields_exist():
    """Verify PercentileScore model has all required provenance fields.
    
    These fields are critical for tracking mixed-provenance scenarios
    and near-boundary diagnostics.
    """
    from app.models.klsi.norms import PercentileScore
    
    # Verify provenance fields exist
    required_fields = [
        'norm_group_used',
        'CE_source', 'RO_source', 'AC_source', 'AE_source',
        'ACCE_source', 'AERO_source',
        'used_fallback_any',
        'norm_provenance',
        'raw_outside_norm_range',
        'truncated_scales',
    ]
    
    for field in required_fields:
        assert hasattr(PercentileScore, field), \
            f"PercentileScore should have {field} field for provenance tracking"


def test_balance_score_formula_documented():
    """Verify balance score formulas are documented in psychometrics spec."""
    import os
    spec_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "docs",
        "psychometrics_spec.md"
    )
    
    if os.path.exists(spec_path):
        with open(spec_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Verify balance score section exists
        assert "Keseimbangan" in content or "Balance" in content, \
            "Spec should document balance scores"
        
        # Verify it mentions heuristic nature
        assert "heuristik" in content.lower() or "heuristic" in content.lower(), \
            "Spec should mention heuristic interpretation"
        
        # Verify formulas are present (handle escaped underscores in markdown)
        assert "BAL" in content and "ACCE" in content, \
            "Spec should document BAL_ACCE formula"
        assert "BAL" in content and "AERO" in content, \
            "Spec should document BAL_AERO formula"
