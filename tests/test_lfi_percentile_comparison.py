"""
Test comparison between existing LFI percentile implementation and alternative approaches.

This test validates that:
1. Existing implementation uses empirical Appendix 7 data (most accurate)
2. Normal approximation is less accurate for bounded [0,1] distributions
3. Demonstrates why empirical lookup is superior for KLSI 4.0
"""

import pytest
import math
from app.data.norms import lookup_lfi, LFI_PERCENTILES


def _require_lfi_percentile(lfi_value: float) -> float:
    result = lookup_lfi(lfi_value)
    assert result is not None, f"Should find percentile for LFI {lfi_value}"
    return result


class TestLFIPercentileApproaches:
    """Compare empirical (existing) vs. normal approximation percentile methods."""
    
    @staticmethod
    def normal_cdf(z: float) -> float:
        """Standard normal cumulative distribution function."""
        return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))
    
    @staticmethod
    def percentile_normal_approx(value: float, mean: float, sd: float) -> float:
        """Normal approximation percentile (as proposed in alternative code)."""
        if sd <= 0:
            raise ValueError("SD must be positive")
        z = (value - mean) / sd
        return 100.0 * TestLFIPercentileApproaches.normal_cdf(z)
    
    def test_existing_uses_empirical_appendix7_data(self):
        """Verify that existing implementation uses actual Appendix 7 percentiles."""
        # Test known values from Appendix 7 (KLSI 4.0 Guide)
        test_cases = [
            (0.07, 0.0),    # Minimum LFI
            (0.50, 11.3),   # Mid-range
            (0.73, 47.3),   # Near mean
            (0.85, 73.0),   # High flexibility
            (0.95, 93.6),   # Very high
            (0.97, 97.5),   # Example from docs
            (1.00, 100.0),  # Maximum
        ]
        
        for lfi_value, expected_percentile in test_cases:
            result = _require_lfi_percentile(lfi_value)
            assert result == expected_percentile, (
                f"LFI={lfi_value} should map to {expected_percentile}th percentile "
                f"(Appendix 7), got {result}"
            )
    
    def test_normal_approx_vs_empirical_for_worked_example(self):
        """Compare normal approx vs. empirical for the worked example (LFI=0.975)."""
        lfi_value = 0.975
        
        # Existing implementation: Empirical lookup from Appendix 7
        empirical_percentile = _require_lfi_percentile(lfi_value)
        
        # Alternative approach: Normal approximation (Total group: mean=0.73, sd=0.17)
        normal_percentile = self.percentile_normal_approx(
            value=lfi_value,
            mean=0.73,
            sd=0.17
        )
        
        print(f"\nLFI = {lfi_value}")
        print(f"  Empirical (Appendix 7): {empirical_percentile}%")
        print(f"  Normal Approximation:   {normal_percentile:.2f}%")
        print(f"  Difference:             {abs(empirical_percentile - normal_percentile):.2f}%")
        
        # Empirical should be more accurate (from actual normative sample)
        assert empirical_percentile == 97.5, "Appendix 7 lookup exact"
        
        # Normal approx is close but not exact (assumes unbounded normal distribution)
        assert 90.0 <= normal_percentile <= 95.0, (
            f"Normal approx should be in reasonable range, got {normal_percentile:.2f}%"
        )
        
        # Empirical is preferred (exact from published norms)
        difference = abs(empirical_percentile - normal_percentile)
        assert difference < 10.0, "Methods should be reasonably close"
    
    def test_normal_approx_fails_at_boundaries(self):
        """Normal approximation breaks down at distribution boundaries [0, 1]."""
        # LFI is bounded [0, 1], but normal distribution is unbounded
        
        # Case 1: Very low LFI (near 0)
        low_lfi = 0.07
        empirical_low = _require_lfi_percentile(low_lfi)
        normal_low = self.percentile_normal_approx(low_lfi, mean=0.73, sd=0.17)
        
        print(f"\nLow LFI = {low_lfi}")
        print(f"  Empirical: {empirical_low}%")
        print(f"  Normal:    {normal_low:.2f}%")
        
        # Empirical correctly shows 0th percentile (minimum in sample)
        assert empirical_low == 0.0
        
        # Normal approx severely underestimates (z = -3.88, CDF ≈ 0.005%)
        assert normal_low < 1.0, "Normal approx should be very low"
        
        # Case 2: Very high LFI (near 1.0)
        high_lfi = 1.00
        empirical_high = _require_lfi_percentile(high_lfi)
        normal_high = self.percentile_normal_approx(high_lfi, mean=0.73, sd=0.17)
        
        print(f"\nHigh LFI = {high_lfi}")
        print(f"  Empirical: {empirical_high}%")
        print(f"  Normal:    {normal_high:.2f}%")
        
        # Empirical correctly shows 100th percentile
        assert empirical_high == 100.0
        
        # Normal approx overestimates (z = 1.59, CDF ≈ 94%)
        assert 90.0 <= normal_high <= 96.0
    
    def test_empirical_handles_granularity_correctly(self):
        """Empirical lookup handles discrete percentile values from Appendix 7."""
        # Appendix 7 has LFI entries covering 0.07 to 1.00
        # (Note: Some duplicate percentile values exist, so unique LFI values < 96)
        assert len(LFI_PERCENTILES) >= 80, "Should have many Appendix 7 entries"
        
        # Test intermediate value not in table (should find nearest)
        lfi_intermediate = 0.74  # Not in table, between 0.73 and 0.75
        result = _require_lfi_percentile(lfi_intermediate)
        
        # Verify it's between the two neighboring values
        perc_73 = LFI_PERCENTILES[0.73]  # 47.3
        perc_75 = LFI_PERCENTILES[0.75]  # 50.0
        assert perc_73 <= result <= perc_75, (
            f"Result {result} should be between {perc_73} and {perc_75}"
        )
    
    def test_why_empirical_is_superior(self):
        """Demonstrate why empirical percentiles are preferred for KLSI 4.0.
        
        Reasons:
        1. LFI distribution is bounded [0, 1], not unbounded normal
        2. Actual distribution may be skewed (not symmetric)
        3. Appendix 7 data comes from N=10,423 normative sample
        4. Published percentiles are authoritative for interpretation
        """
        # Test case: LFI at median (50th percentile should be near mean for normal)
        # In Appendix 7, 50th percentile is at LFI ≈ 0.75 (not 0.73 mean!)
        
        median_lfi = 0.75
        empirical_median = _require_lfi_percentile(median_lfi)
        normal_at_075 = self.percentile_normal_approx(0.75, mean=0.73, sd=0.17)
        
        print(f"\nMedian LFI = {median_lfi}")
        print(f"  Empirical percentile: {empirical_median}%")
        print(f"  Normal approx:        {normal_at_075:.2f}%")
        
        # Empirical shows 50th percentile (exact from data)
        assert empirical_median == 50.0, "Appendix 7 shows 0.75 = 50th percentile"
        
        # Normal approx predicts ~53.5% (assumes symmetry around mean)
        # This difference proves distribution is slightly skewed
        assert abs(normal_at_075 - 50.0) > 2.0, (
            "Normal approx differs from empirical, showing distribution asymmetry"
        )
    
    def test_existing_implementation_completeness(self):
        """Verify existing implementation covers full LFI range."""
        # Check coverage of Appendix 7 data
        lfi_values = sorted(LFI_PERCENTILES.keys())
        
        assert min(lfi_values) == 0.07, "Minimum LFI in norms"
        assert max(lfi_values) == 1.00, "Maximum LFI in norms"
        
        # Check monotonic increase (higher LFI → higher percentile)
        percentiles = [LFI_PERCENTILES[lfi] for lfi in lfi_values]
        for i in range(1, len(percentiles)):
            assert percentiles[i] >= percentiles[i-1], (
                f"Percentiles should increase monotonically at index {i}"
            )
        
        # Verify range [0, 100]
        assert percentiles[0] == 0.0, "First percentile should be 0"
        assert percentiles[-1] == 100.0, "Last percentile should be 100"


class TestLFIPercentilePractical:
    """Practical tests for LFI percentile interpretation."""
    
    def test_flexibility_level_thresholds(self):
        """Test tertile thresholds for Low/Moderate/High flexibility."""
        # These thresholds are used in scoring.py
        test_cases = [
            (0.50, 11.3, "Low"),       # LFI=0.50 → 11.3% → Low flexibility
            (0.73, 47.3, "Moderate"),  # LFI=0.73 → 47.3% → Moderate
            (0.85, 73.0, "High"),      # LFI=0.85 → 73.0% → High flexibility
            (0.97, 97.5, "High"),      # LFI=0.97 → 97.5% → Very high
        ]
        
        for lfi, expected_perc, expected_level in test_cases:
            percentile = _require_lfi_percentile(lfi)
            
            # Assign level based on tertiles
            if percentile < 33.34:
                level = "Low"
            elif percentile <= 66.67:
                level = "Moderate"
            else:
                level = "High"
            
            assert percentile == expected_perc, f"LFI {lfi} should be {expected_perc}%"
            assert level == expected_level, (
                f"LFI {lfi} at {percentile}% should be {expected_level} flexibility"
            )
    
    def test_worked_example_interpretation(self):
        """Interpret the worked example (LFI=0.975) using existing implementation."""
        lfi = 0.975
        percentile = _require_lfi_percentile(lfi)
        
        # Determine flexibility level
        if percentile < 33.34:
            level = "Low"
        elif percentile <= 66.67:
            level = "Moderate"
        else:
            level = "High"
        
        print(f"\nWorked Example Interpretation:")
        print(f"  LFI Score:        {lfi}")
        print(f"  Percentile:       {percentile}%")
        print(f"  Flexibility:      {level}")
        print(f"  Interpretation:   Top 3% of learners in adaptability")
        print(f"  Context:          Varies learning approach significantly across situations")
        
        assert percentile == 97.5, "From Appendix 7"
        assert level == "High", "97.5% is well above 66.67% threshold"


class TestNormGroupStrategyComparison:
    """Compare norm group strategies for percentile conversion."""
    
    def test_single_norm_table_vs_multiple_groups(self):
        """Existing system supports multiple norm groups, alternative uses single."""
        # Existing approach (from scoring.py):
        # - Tries Education → Country → Age → Gender → Total → Appendix 7
        # - Each group can have different percentile mappings
        
        # Alternative approach:
        # - Uses Table 13 mean/SD for different groups
        # - But still requires selecting ONE group (Total, Medical, Law, etc.)
        
        # Example: Compare Total vs. Medical group for same LFI
        lfi = 0.75
        
        # Total group: mean=0.73, sd=0.17
        total_perc = TestLFIPercentileApproaches.percentile_normal_approx(
            lfi, mean=0.73, sd=0.17
        )
        
        # Medical group: mean=0.72, sd=0.17
        medical_perc = TestLFIPercentileApproaches.percentile_normal_approx(
            lfi, mean=0.72, sd=0.17
        )
        
        print(f"\nLFI = {lfi}")
        print(f"  Total group:   {total_perc:.2f}%")
        print(f"  Medical group: {medical_perc:.2f}%")
        print(f"  Difference:    {abs(total_perc - medical_perc):.2f}%")
        
        # Different groups give different percentiles (as expected)
        assert abs(total_perc - medical_perc) > 1.0, (
            "Different norm groups should yield different percentiles"
        )
        
        # Existing system advantage: Can store empirical data per group in DB
        # Alternative limitation: Needs mean/SD per group, assumes normality


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short", "-s"])
