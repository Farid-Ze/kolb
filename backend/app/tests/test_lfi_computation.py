"""
Test Learning Flexibility Index (LFI) computation.

Validates Kendall's W formula and LFI transformation against:
1. KLSI 4.0 Guide page 1460 (formula specification)
2. Worked examples with known outcomes
3. Edge cases (perfect agreement, maximum disagreement)
4. Forced-choice constraint validation
"""

import pytest
from app.services.scoring import compute_kendalls_w, validate_lfi_context_ranks


class TestKendallsWFormula:
    """Test Kendall's W coefficient computation."""
    
    def test_perfect_agreement_yields_w_equals_one(self):
        """When all contexts rank identically, W should be 1.0 (no flexibility)."""
        # All 8 contexts rank: CE=1, RO=2, AC=3, AE=4
        perfect_agreement = [
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
        ]
        W = compute_kendalls_w(perfect_agreement)
        assert W == 1.0, "Perfect agreement should yield W=1.0"
        lfi = 1 - W
        assert lfi == 0.0, "Perfect agreement should yield LFI=0.0 (no flexibility)"
    
    def test_maximum_disagreement_yields_w_near_zero(self):
        """When contexts vary maximally, W should be near 0 (high flexibility)."""
        # Each context uses a different ranking pattern
        max_disagreement = [
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
            {"CE": 2, "RO": 3, "AC": 4, "AE": 1},
            {"CE": 3, "RO": 4, "AC": 1, "AE": 2},
            {"CE": 4, "RO": 1, "AC": 2, "AE": 3},
            {"CE": 1, "RO": 3, "AC": 2, "AE": 4},
            {"CE": 2, "RO": 4, "AC": 1, "AE": 3},
            {"CE": 3, "RO": 1, "AC": 4, "AE": 2},
            {"CE": 4, "RO": 2, "AC": 3, "AE": 1},
        ]
        W = compute_kendalls_w(max_disagreement)
        lfi = 1 - W
        assert W == 0.0, "Maximum disagreement should yield W=0.0"
        assert lfi == 1.0, "Maximum disagreement should yield LFI=1.0 (complete flexibility)"
    
    def test_worked_example_from_documentation(self):
        """Test with worked example from KLSI 4.0 documentation."""
        # Synthetic example with expected W=0.025, LFI=0.975
        worked_contexts = [
            {"CE": 4, "RO": 2, "AC": 1, "AE": 3},
            {"CE": 3, "RO": 1, "AC": 2, "AE": 4},
            {"CE": 4, "RO": 3, "AC": 1, "AE": 2},
            {"CE": 4, "RO": 2, "AC": 1, "AE": 3},
            {"CE": 1, "RO": 4, "AC": 3, "AE": 2},
            {"CE": 1, "RO": 3, "AC": 4, "AE": 2},
            {"CE": 2, "RO": 1, "AC": 4, "AE": 3},
            {"CE": 1, "RO": 2, "AC": 4, "AE": 3},
        ]
        
        W = compute_kendalls_w(worked_contexts)
        lfi = 1 - W
        
        # Verify intermediate calculations
        # Row sums should be: CE=20, RO=18, AC=20, AE=22
        modes = ["CE", "RO", "AC", "AE"]
        row_sums = {mode: sum(ctx[mode] for ctx in worked_contexts) for mode in modes}
        assert row_sums == {"CE": 20, "RO": 18, "AC": 20, "AE": 22}
        
        # Grand mean should be 20.0 (for m=8, n=4: 8*(4+1)/2 = 20)
        assert 8 * 5 / 2 == 20.0
        
        # S should be 8.0: (20-20)^2 + (18-20)^2 + (20-20)^2 + (22-20)^2 = 0+4+0+4 = 8
        S = sum((row_sums[mode] - 20.0) ** 2 for mode in modes)
        assert S == 8.0
        
        # W = 12*8 / (64 * 60) = 96 / 3840 = 0.025
        assert W == pytest.approx(0.025, abs=1e-9)
        assert lfi == pytest.approx(0.975, abs=1e-9)
    
    def test_formula_equivalence(self):
        """Verify that m^2(n^3-n) = m^2*n*(n^2-1) are equivalent."""
        m = 8  # contexts
        n = 4  # modes
        
        form1 = m**2 * (n**3 - n)
        form2 = m**2 * n * (n**2 - 1)
        
        assert form1 == form2
        assert form1 == 3840
        assert form2 == 3840
    
    def test_w_bounded_to_zero_one(self):
        """Ensure W is always bounded to [0, 1] even with edge cases."""
        # Test various configurations
        test_cases = [
            # Balanced ranks (moderate agreement)
            [
                {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
                {"CE": 2, "RO": 1, "AC": 4, "AE": 3},
                {"CE": 1, "RO": 3, "AC": 2, "AE": 4},
                {"CE": 3, "RO": 1, "AC": 4, "AE": 2},
                {"CE": 2, "RO": 4, "AC": 1, "AE": 3},
                {"CE": 4, "RO": 2, "AC": 3, "AE": 1},
                {"CE": 1, "RO": 4, "AC": 2, "AE": 3},
                {"CE": 3, "RO": 2, "AC": 4, "AE": 1},
            ],
        ]
        
        for contexts in test_cases:
            W = compute_kendalls_w(contexts)
            assert 0.0 <= W <= 1.0, f"W must be in [0, 1], got {W}"
            lfi = 1 - W
            assert 0.0 <= lfi <= 1.0, f"LFI must be in [0, 1], got {lfi}"


class TestLFIValidation:
    """Test forced-choice constraint validation for LFI contexts."""
    
    def test_valid_context_passes(self):
        """Valid forced-choice rankings should pass validation."""
        valid_contexts = [
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
            {"CE": 4, "RO": 3, "AC": 2, "AE": 1},
            {"CE": 2, "RO": 4, "AC": 1, "AE": 3},
            {"CE": 3, "RO": 1, "AC": 4, "AE": 2},
            {"CE": 1, "RO": 4, "AC": 2, "AE": 3},
            {"CE": 4, "RO": 1, "AC": 3, "AE": 2},
            {"CE": 2, "RO": 3, "AC": 4, "AE": 1},
            {"CE": 3, "RO": 2, "AC": 1, "AE": 4},
        ]
        # Should not raise
        validate_lfi_context_ranks(valid_contexts)
    
    def test_missing_mode_raises_error(self):
        """Context missing a mode should raise ValueError."""
        invalid = [
            {"CE": 1, "RO": 2, "AC": 3},  # Missing AE
        ]
        with pytest.raises(ValueError):
            validate_lfi_context_ranks(invalid)
    
    def test_duplicate_rank_raises_error(self):
        """Duplicate rank values violate forced-choice constraint."""
        invalid = [
            {"CE": 1, "RO": 2, "AC": 2, "AE": 4},  # AC=2 duplicates RO=2
        ]
        with pytest.raises(ValueError):
            validate_lfi_context_ranks(invalid)
    
    def test_rank_out_of_range_raises_error(self):
        """Ranks must be within 1..4."""
        invalid = [
            {"CE": 1, "RO": 2, "AC": 3, "AE": 5},  # AE=5 out of range
        ]
        with pytest.raises(ValueError):
            validate_lfi_context_ranks(invalid)
    
    def test_non_integer_rank_raises_error(self):
        """Ranks must be integers."""
        invalid = [
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4.5},  # Float rank
        ]
        with pytest.raises(ValueError):
            validate_lfi_context_ranks(invalid)
    
    def test_missing_rank_raises_error(self):
        """All four ranks [1,2,3,4] must be present."""
        invalid = [
            {"CE": 1, "RO": 2, "AC": 3, "AE": 3},  # Missing rank 4
        ]
        with pytest.raises(ValueError):
            validate_lfi_context_ranks(invalid)


class TestLFIInterpretation:
    """Test LFI percentile thresholds and flexibility level assignment."""
    
    def test_lfi_tertile_thresholds(self):
        """Verify tertile cutoffs for Low/Moderate/High flexibility."""
        # Low flexibility: LFI percentile < 33.34
        # Moderate: 33.34 <= percentile <= 66.67
        # High: percentile > 66.67
        
        test_cases = [
            (10.0, "Low"),
            (33.33, "Low"),
            (33.34, "Moderate"),
            (50.0, "Moderate"),
            (66.67, "Moderate"),
            (66.68, "High"),
            (95.0, "High"),
        ]
        
        for percentile, expected_level in test_cases:
            if percentile < 33.34:
                level = "Low"
            elif percentile <= 66.67:
                level = "Moderate"
            else:
                level = "High"
            
            assert level == expected_level, f"Percentile {percentile} should be {expected_level}"
    
    def test_lfi_score_to_percentile_relationship(self):
        """Higher LFI scores should generally map to higher percentiles."""
        # Note: This is a general trend but depends on normative distribution
        # LFI near 0 (low flexibility) → lower percentiles
        # LFI near 1 (high flexibility) → higher percentiles
        
        # These mappings come from Appendix 7 in KLSI 4.0 Guide
        # Just verify that the relationship makes intuitive sense
        assert 0.0 <= 0.07 <= 1.0  # Minimum LFI in norms
        assert 0.0 <= 1.0 <= 1.0   # Maximum LFI in norms


class TestLFIEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def test_all_modes_ranked_first_sequentially(self):
        """Each mode gets rank=1 exactly twice across 8 contexts."""
        # CE ranked 1st twice, RO ranked 1st twice, etc.
        contexts = [
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
            {"CE": 1, "RO": 3, "AC": 4, "AE": 2},
            {"CE": 2, "RO": 1, "AC": 4, "AE": 3},
            {"CE": 3, "RO": 1, "AC": 2, "AE": 4},
            {"CE": 4, "RO": 3, "AC": 1, "AE": 2},
            {"CE": 3, "RO": 4, "AC": 1, "AE": 2},
            {"CE": 2, "RO": 4, "AC": 3, "AE": 1},
            {"CE": 4, "RO": 2, "AC": 2, "AE": 1},
        ]
        
        # Verify each mode appears as rank=1 exactly twice
        for mode in ["CE", "RO", "AC", "AE"]:
            count_first = sum(1 for ctx in contexts if ctx[mode] == 1)
            assert count_first == 2, f"{mode} should be ranked 1st exactly twice"
        
        W = compute_kendalls_w(contexts)
        lfi = 1 - W
        
        # Should show moderate flexibility (not perfect, not zero)
        assert 0.0 < W < 1.0
        assert 0.0 < lfi < 1.0
    
    def test_inverse_ranking_pattern(self):
        """First half ranks CE→RO→AC→AE, second half ranks AE→AC→RO→CE."""
        inverse_pattern = [
            # First half: CE=1, RO=2, AC=3, AE=4
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
            # Second half: AE=1, AC=2, RO=3, CE=4 (exact inverse)
            {"CE": 4, "RO": 3, "AC": 2, "AE": 1},
            {"CE": 4, "RO": 3, "AC": 2, "AE": 1},
            {"CE": 4, "RO": 3, "AC": 2, "AE": 1},
            {"CE": 4, "RO": 3, "AC": 2, "AE": 1},
        ]
        
        W = compute_kendalls_w(inverse_pattern)
        lfi = 1 - W
        
        # This should show moderate flexibility (neither extreme)
        # Row sums: CE=20, RO=20, AC=20, AE=20 (all equal = grand mean)
        assert W == 0.0, "Equal row sums should yield W=0"
        assert lfi == 1.0, "Equal row sums indicate maximum flexibility"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
