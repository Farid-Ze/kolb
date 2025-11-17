"""Tests for enhanced LFI analytics (contextual profiles, heatmaps, integrative development)."""
import pytest

from app.i18n.id_messages import RegressionMessages
from app.services.regression import (
    analyze_lfi_contexts,
    generate_lfi_heatmap,
    predict_integrative_development,
)


def test_integrative_development_prediction_baseline():
    """Test ID prediction with sample mean demographics."""
    # With all demographics at mean (z=0) and moderate LFI/Acc-Assm
    pred = predict_integrative_development(
        age=None,  # defaults to mean
        gender=None,
        education=None,
        specialization=None,
        acc_assm=0.0,  # near mean (0.29)
        lfi=0.71  # exactly at mean
    )
    # Should be close to mean ID when predictors are at mean
    assert 18.0 <= pred <= 21.0, f"Expected near mean ID (19.42), got {pred}"


def test_integrative_development_lfi_effect():
    """Test that higher LFI leads to higher ID (β=0.25, strongest predictor)."""
    low_lfi_pred = predict_integrative_development(
        age=None, gender=None, education=None, specialization=None,
        acc_assm=0.0, lfi=0.50  # low flexibility
    )
    high_lfi_pred = predict_integrative_development(
        age=None, gender=None, education=None, specialization=None,
        acc_assm=0.0, lfi=0.90  # high flexibility
    )
    assert high_lfi_pred > low_lfi_pred, "Higher LFI should predict higher integrative development"
    # Effect size check: ~2.4 points difference for 0.4 LFI increase (β=0.25 * 0.4 / 0.17 * 3.48)
    diff = high_lfi_pred - low_lfi_pred
    assert 1.5 <= diff <= 4.0, f"Expected 1.5-4 point increase, got {diff:.2f}"


def test_analyze_lfi_contexts_high_flexibility():
    """Test contextual analysis for high flexibility profile (Mark-like, 98th %ile)."""
    # Simulated 8 contexts with varied styles
    contexts = [
        {"CE": 25, "RO": 22, "AC": 18, "AE": 31},  # Initiating (low ACCE, high AERO)
        {"CE": 28, "RO": 24, "AC": 20, "AE": 26},  # Experiencing (low ACCE, mid AERO)
        {"CE": 22, "RO": 26, "AC": 24, "AE": 20},  # Reflecting (mid ACCE, low AERO)
        {"CE": 20, "RO": 24, "AC": 28, "AE": 22},  # Analyzing (high ACCE, low AERO)
        {"CE": 18, "RO": 22, "AC": 30, "AE": 24},  # Thinking (high ACCE, mid AERO)
        {"CE": 20, "RO": 26, "AC": 22, "AE": 28},  # Balancing (mid ACCE, mid AERO)
        {"CE": 24, "RO": 20, "AC": 18, "AE": 32},  # Initiating again
        {"CE": 26, "RO": 22, "AC": 20, "AE": 30},  # Acting (mid ACCE, high AERO)
    ]
    
    result = analyze_lfi_contexts(contexts)
    
    assert "context_styles" in result
    assert len(result["context_styles"]) == 8
    assert "style_frequency" in result
    assert "flexibility_pattern" in result
    
    # High flexibility should use 4+ different styles
    unique_styles = len(result["style_frequency"])
    assert unique_styles >= 4, f"Expected 4+ styles for high flexibility, got {unique_styles}"
    
    # Should be classified as high pattern
    assert result["flexibility_pattern"] in ["high", "moderate"]


def test_analyze_lfi_contexts_low_flexibility():
    """Test contextual analysis for low flexibility profile (Jason-like, 4th %ile)."""
    # Simulated 8 contexts all with Reflecting style (stuck in RO-CE region)
    contexts = [
        {"CE": 26, "RO": 28, "AC": 22, "AE": 18},  # Reflecting
        {"CE": 24, "RO": 30, "AC": 20, "AE": 16},  # Reflecting
        {"CE": 28, "RO": 26, "AC": 20, "AE": 18},  # Reflecting
        {"CE": 25, "RO": 29, "AC": 22, "AE": 16},  # Experiencing (still CE-RO region)
        {"CE": 27, "RO": 27, "AC": 21, "AE": 17},  # Balancing (but CE-RO leaning)
        {"CE": 26, "RO": 28, "AC": 20, "AE": 18},  # Reflecting
        {"CE": 24, "RO": 30, "AC": 22, "AE": 16},  # Reflecting
        {"CE": 28, "RO": 26, "AC": 21, "AE": 17},  # Reflecting
    ]
    
    result = analyze_lfi_contexts(contexts)
    
    # Low flexibility should use 3 or fewer styles
    unique_styles = len(result["style_frequency"])
    assert unique_styles <= 3, f"Expected <=3 styles for low flexibility, got {unique_styles}"
    
    # Should be classified as low pattern
    assert result["flexibility_pattern"] == "low"
    
    # Should show heavy use of CE and RO modes
    mode_usage = result["mode_usage"]
    ce_ro_count = mode_usage["CE"]["count"] + mode_usage["RO"]["count"]
    assert ce_ro_count >= 6, f"Expected 6+ CE/RO contexts, got {ce_ro_count}"


def test_generate_lfi_heatmap_high_lfi():
    """Test heatmap generation for high LFI learner."""
    context_styles = [
        {"style": "Initiating", "context": "Starting_Something_New"},
        {"style": "Experiencing", "context": "Influencing_Someone"},
        {"style": "Reflecting", "context": "Getting_To_Know_Someone"},
        {"style": "Analyzing", "context": "Learning_In_A_Group"},
        {"style": "Thinking", "context": "Planning_Something"},
        {"style": "Balancing", "context": "Analyzing_Something"},
        {"style": "Acting", "context": "Evaluating_An_Opportunity"},
        {"style": "Deciding", "context": "Choosing_Between_Alternatives"},
    ]
    
    heatmap = generate_lfi_heatmap(0.85, context_styles)
    
    assert heatmap["lfi_percentile_band"] == "high"
    assert "style_matrix" in heatmap
    assert "region_coverage" in heatmap
    
    # High LFI should show balanced coverage across regions
    coverage = heatmap["region_coverage"]
    min_coverage = min(coverage.values())
    max_coverage = max(coverage.values())
    # No region should be completely neglected
    assert min_coverage >= 1, f"Expected all regions used, min={min_coverage}"
    # No single region should dominate
    assert max_coverage <= 4, f"Expected balanced coverage, max={max_coverage}"


def test_generate_lfi_heatmap_low_lfi():
    """Test heatmap generation for low LFI learner (concentrated in one region)."""
    context_styles = [
        {"style": "Reflecting", "context": "ctx1"},
        {"style": "Reflecting", "context": "ctx2"},
        {"style": "Balancing", "context": "ctx3"},
        {"style": "Reflecting", "context": "ctx4"},
        {"style": "Experiencing", "context": "ctx5"},
        {"style": "Reflecting", "context": "ctx6"},
        {"style": "Reflecting", "context": "ctx7"},
        {"style": "Balancing", "context": "ctx8"},
    ]
    
    heatmap = generate_lfi_heatmap(0.45, context_styles)
    
    assert heatmap["lfi_percentile_band"] == "low"
    
    # Low LFI should show concentration in one or two regions
    coverage = heatmap["region_coverage"]
    max_coverage = max(coverage.values())
    assert max_coverage >= 5, f"Expected concentration in one region, max={max_coverage}"


def test_contextual_profile_validates_input():
    """Test that analyze_lfi_contexts requires exactly 8 contexts."""
    contexts = [{"CE": 20, "RO": 20, "AC": 20, "AE": 20}]  # only 1 context
    with pytest.raises(ValueError) as exc:
        analyze_lfi_contexts(contexts)
    assert str(exc.value) == RegressionMessages.CONTEXT_COUNT_ERROR.format(
        expected=8,
        received=len(contexts),
    )


def test_integrative_development_reasonable_range():
    """Test that ID predictions stay in reasonable range (typical 13-26)."""
    # Extreme low scenario
    low_pred = predict_integrative_development(
        age=7, gender=1.0, education=1, specialization=1,
        acc_assm=-30, lfi=0.3
    )
    # Extreme high scenario
    high_pred = predict_integrative_development(
        age=1, gender=0.0, education=5, specialization=18,
        acc_assm=30, lfi=0.95
    )
    
    # Both should be within plausible human range
    assert 10 <= low_pred <= 30, f"Low scenario out of range: {low_pred}"
    assert 10 <= high_pred <= 30, f"High scenario out of range: {high_pred}"
    assert high_pred > low_pred, "High flexibility should predict higher ID"


def test_mode_usage_tracking():
    """Test that mode usage correctly identifies which modes are preferred in each context."""
    contexts = [
        {"CE": 30, "RO": 25, "AC": 20, "AE": 15},  # CE highest
        {"CE": 20, "RO": 30, "AC": 25, "AE": 15},  # RO highest
        {"CE": 15, "RO": 20, "AC": 35, "AE": 25},  # AC highest
        {"CE": 15, "RO": 20, "AC": 25, "AE": 35},  # AE highest
        {"CE": 28, "RO": 26, "AC": 22, "AE": 18},  # CE highest
        {"CE": 18, "RO": 32, "AC": 26, "AE": 20},  # RO highest
        {"CE": 16, "RO": 22, "AC": 34, "AE": 24},  # AC highest
        {"CE": 18, "RO": 22, "AC": 24, "AE": 32},  # AE highest
    ]
    
    result = analyze_lfi_contexts(contexts)
    mode_usage = result["mode_usage"]
    
    # Each mode should be used twice (balanced)
    assert mode_usage["CE"]["count"] == 2
    assert mode_usage["RO"]["count"] == 2
    assert mode_usage["AC"]["count"] == 2
    assert mode_usage["AE"]["count"] == 2
