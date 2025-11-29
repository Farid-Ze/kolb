"""
Scientific Validity Test - The Professor Test
Property-based testing for algorithmic integrity
"""
import pytest
from hypothesis import given, strategies as st, settings
from decimal import Decimal

from app.assessments.klsi_v4.calculations import (
    aggregate_mode_scores,
    calculate_lfi_variance,
    calculate_style_intensity
)
from app.assessments.klsi_v4.rules import get_rules


# Property-based test strategies
ranking_strategy = st.lists(
    st.integers(min_value=1, max_value=4),
    min_size=12,
    max_size=12
)

percentile_strategy = st.floats(min_value=0.0, max_value=100.0)


class TestAlgorithmicIntegrity:
    """B.1 - Algorithmic Integrity & Regression Verification"""
    
    def _transform_to_contexts(self, flat_ranks):
        # 12 items -> 3 contexts * 4 modes
        contexts = []
        modes = ["CE", "RO", "AC", "AE"]
        # Ensure we have enough items
        if len(flat_ranks) < 12:
            return []
            
        for i in range(0, 12, 4):
            ctx_ranks = flat_ranks[i:i+4]
            # Normalize to 1-4 range if needed, but strategy gives 1-4
            contexts.append({m: r for m, r in zip(modes, ctx_ranks)})
        return contexts

    @given(rankings=ranking_strategy)
    @settings(max_examples=1000, deadline=None)
    def test_lfi_variance_range(self, rankings):
        """
        Property: LFI variance must always be between 0.0 and max theoretical variance
        """
        contexts = self._transform_to_contexts(rankings)
        variance = calculate_lfi_variance(contexts)
        assert 0.0 <= variance <= 100.0, f"Variance {variance} out of valid range"
    
    @given(rankings=ranking_strategy)
    def test_lfi_determinism(self, rankings):
        """
        Property: Same input MUST produce same output (no randomness)
        """
        contexts = self._transform_to_contexts(rankings)
        result1 = calculate_lfi_variance(contexts)
        result2 = calculate_lfi_variance(contexts)
        assert result1 == result2, "Non-deterministic results detected!"
    
    def test_perfect_consistency_lfi(self):
        """
        Edge Case: All rankings identical = Zero variance
        """
        # User ranks CE=1, RO=2, AC=3, AE=4 across all 3 contexts
        perfect_consistency = [1, 2, 3, 4] * 3
        contexts = self._transform_to_contexts(perfect_consistency)
        variance = calculate_lfi_variance(contexts)
        assert variance == 0.0, f"Perfect consistency should yield 0 variance, got {variance}"
    
    def test_maximum_inconsistency_lfi(self):
        """
        Edge Case: Maximum variance scenario
        """
        # Context 1: CE=1, RO=2, AC=3, AE=4
        # Context 2: AE=1, AC=2, RO=3, CE=4 (complete reversal)
        # Context 3: Random permutation
        max_variance_input = [1, 2, 3, 4, 4, 3, 2, 1, 2, 1, 4, 3]
        contexts = self._transform_to_contexts(max_variance_input)
        variance = calculate_lfi_variance(contexts)
        assert variance > 2.0, "Max variance should be significant"


class TestKiteTopologyBoundaries:
    """B.2 - Norms Boundary & Versioning Consistency"""

    def test_boundary_20_percentile(self):
        """Critical boundary: 19.9 vs 20.0 vs 20.1"""
        rules = get_rules("4.0.0")

        # Below cutoff
        region1 = rules.determine_kite_region(ac_ce_percentile=19.9, ae_ro_percentile=50.0)
        assert region1 == "SOUTHERN", "19.9 should be LOW (concrete)"

        # At cutoff (exclusive lower bound)
        region2 = rules.determine_kite_region(ac_ce_percentile=20.0, ae_ro_percentile=50.0)
        assert region2 == "BALANCED", "20.0 should be MID (balanced)"

    def test_boundary_80_percentile(self):
        """Critical boundary: 79.9 vs 80.0 vs 80.1"""
        rules = get_rules("4.0.0")

        # At cutoff (inclusive upper bound)
        region1 = rules.determine_kite_region(ac_ce_percentile=80.0, ae_ro_percentile=50.0)
        assert region1 == "BALANCED", "80.0 should be MID (balanced)"

        # Above cutoff
        region2 = rules.determine_kite_region(ac_ce_percentile=80.1, ae_ro_percentile=50.0)
        assert region2 == "NORTHERN", "80.1 should be HIGH (abstract)"

    def test_all_nine_regions(self):
        """Exhaustive test: All 9 Kite regions reachable"""
        rules = get_rules("4.0.0")

        test_cases = [
            (10, 10, "DIVERGING"),
            (10, 50, "SOUTHERN"),
            (10, 90, "ASSIMILATING"),
            (50, 10, "WESTERN"),
            (50, 50, "BALANCED"),
            (50, 90, "EASTERN"),
            (90, 10, "ACCOMMODATING"),
            (90, 50, "NORTHERN"),
            (90, 90, "CONVERGING"),
        ]

        for ac_ce, ae_ro, expected_region in test_cases:
            result = rules.determine_kite_region(ac_ce, ae_ro)
            assert result == expected_region, \
                f"({ac_ce}, {ae_ro}) should map to {expected_region}, got {result}"
"""
Scientific Validity Test - The Professor Test
Property-based testing for algorithmic integrity
"""
import pytest
from hypothesis import given, strategies as st, settings
from decimal import Decimal

from app.assessments.klsi_v4.calculations import (
    aggregate_mode_scores,
    calculate_lfi_variance,
    calculate_style_intensity
)
from app.assessments.klsi_v4.rules import get_rules


# Property-based test strategies
ranking_strategy = st.lists(
    st.integers(min_value=1, max_value=4),
    min_size=12,
    max_size=12
)

percentile_strategy = st.floats(min_value=0.0, max_value=100.0)


class TestAlgorithmicIntegrity:
    """B.1 - Algorithmic Integrity & Regression Verification"""
    
    def _transform_to_contexts(self, flat_ranks):
        # 12 items -> 3 contexts * 4 modes
        contexts = []
        modes = ["CE", "RO", "AC", "AE"]
        # Ensure we have enough items
        if len(flat_ranks) < 12:
            return []
            
        for i in range(0, 12, 4):
            ctx_ranks = flat_ranks[i:i+4]
            # Normalize to 1-4 range if needed, but strategy gives 1-4
            contexts.append({m: r for m, r in zip(modes, ctx_ranks)})
        return contexts

    @given(rankings=ranking_strategy)
    @settings(max_examples=1000, deadline=None)
    def test_lfi_variance_range(self, rankings):
        """
        Property: LFI variance must always be between 0.0 and max theoretical variance
        """
        contexts = self._transform_to_contexts(rankings)
        variance = calculate_lfi_variance(contexts)
        assert 0.0 <= variance <= 100.0, f"Variance {variance} out of valid range"
    
    @given(rankings=ranking_strategy)
    def test_lfi_determinism(self, rankings):
        """
        Property: Same input MUST produce same output (no randomness)
        """
        contexts = self._transform_to_contexts(rankings)
        result1 = calculate_lfi_variance(contexts)
        result2 = calculate_lfi_variance(contexts)
        assert result1 == result2, "Non-deterministic results detected!"
    
    def test_perfect_consistency_lfi(self):
        """
        Edge Case: All rankings identical = Zero variance
        """
        # User ranks CE=1, RO=2, AC=3, AE=4 across all 3 contexts
        perfect_consistency = [1, 2, 3, 4] * 3
        contexts = self._transform_to_contexts(perfect_consistency)
        variance = calculate_lfi_variance(contexts)
        assert variance == 0.0, f"Perfect consistency should yield 0 variance, got {variance}"
    
    def test_maximum_inconsistency_lfi(self):
        """
        Edge Case: Maximum variance scenario
        """
        # Context 1: CE=1, RO=2, AC=3, AE=4
        # Context 2: AE=1, AC=2, RO=3, CE=4 (complete reversal)
        # Context 3: Random permutation
        max_variance_input = [1, 2, 3, 4, 4, 3, 2, 1, 2, 1, 4, 3]
        contexts = self._transform_to_contexts(max_variance_input)
        variance = calculate_lfi_variance(contexts)
        assert variance > 2.0, "Max variance should be significant"


class TestKiteTopologyBoundaries:
    """B.2 - Norms Boundary & Versioning Consistency"""

    def test_boundary_20_percentile(self):
        """Critical boundary: 19.9 vs 20.0 vs 20.1"""
        rules = get_rules("4.0.0")

        # Below cutoff
        region1 = rules.determine_kite_region(ac_ce_percentile=19.9, ae_ro_percentile=50.0)
        assert region1 == "SOUTHERN", "19.9 should be LOW (concrete)"

        # At cutoff (exclusive lower bound)
        region2 = rules.determine_kite_region(ac_ce_percentile=20.0, ae_ro_percentile=50.0)
        assert region2 == "BALANCED", "20.0 should be MID (balanced)"

    def test_boundary_80_percentile(self):
        """Critical boundary: 79.9 vs 80.0 vs 80.1"""
        rules = get_rules("4.0.0")

        # At cutoff (inclusive upper bound)
        region1 = rules.determine_kite_region(ac_ce_percentile=80.0, ae_ro_percentile=50.0)
        assert region1 == "BALANCED", "80.0 should be MID (balanced)"

        # Above cutoff
        region2 = rules.determine_kite_region(ac_ce_percentile=80.1, ae_ro_percentile=50.0)
        assert region2 == "NORTHERN", "80.1 should be HIGH (abstract)"

    def test_all_nine_regions(self):
        """Exhaustive test: All 9 Kite regions reachable"""
        rules = get_rules("4.0.0")

        test_cases = [
            (10, 10, "DIVERGING"),
            (10, 50, "SOUTHERN"),
            (10, 90, "ASSIMILATING"),
            (50, 10, "WESTERN"),
            (50, 50, "BALANCED"),
            (50, 90, "EASTERN"),
            (90, 10, "ACCOMMODATING"),
            (90, 50, "NORTHERN"),
            (90, 90, "CONVERGING"),
        ]

        for ac_ce, ae_ro, expected_region in test_cases:
            result = rules.determine_kite_region(ac_ce, ae_ro)
            assert result == expected_region, \
                f"({ac_ce}, {ae_ro}) should map to {expected_region}, got {result}"

    def test_deterministic_scoring(self):
        """
        Property: Same raw scores + same norms = same percentile
        No floating point drift
        """
        rules = get_rules("4.0.0")
        
        # Fixed inputs
        ac_ce = 45.5
        ae_ro = 55.5
        
        # Run 1
        region1 = rules.determine_kite_region(ac_ce, ae_ro)
        
        # Run 2 (simulate re-calculation)
        region2 = rules.determine_kite_region(ac_ce, ae_ro)
        
        assert region1 == region2, "Scoring must be deterministic"
        
        # Boundary check
        assert rules.determine_kite_region(20.0, 50.0) == "BALANCED"


class TestPsychometricDistribution:
    """B.3 - Distribution Analysis"""
    
    def test_random_input_distribution(self):
        """
        Statistical Test: 50,000 random inputs should NOT skew to one style
        """
        import random
        from collections import Counter
        
        # Set seed for reproducibility
        random.seed(42)

        results = []
        rules = get_rules("4.0.0")

        # Scale up to 50,000 simulations as per Master Plan
        SIMULATION_COUNT = 50000
        
        for _ in range(SIMULATION_COUNT):
            ac_ce = random.uniform(0, 100)
            ae_ro = random.uniform(0, 100)
            region = rules.determine_kite_region(ac_ce, ae_ro)
            results.append(region)

        distribution = Counter(results)

        # No single region should dominate (> 45% for 9 regions, Balanced is ~36%)
        for region, count in distribution.items():
            percentage = (count / SIMULATION_COUNT) * 100
            # print(f"DEBUG: Region {region}: {percentage:.2f}%")
            assert percentage < 45, \
                f"Region {region} has {percentage:.1f}% (suspicious skew)"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
