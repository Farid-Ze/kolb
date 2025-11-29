import pytest
from app.assessments.klsi_v4.calculations import calculate_lfi_variance

class TestLFIVariance:
    """Test LFI Variance calculation."""

    def test_perfect_agreement_yields_zero_variance(self):
        """When all contexts rank identically, variance should be 0.0."""
        # All 8 contexts rank: CE=1, RO=2, AC=3, AE=4
        perfect_agreement = [
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4}
            for _ in range(8)
        ]
        variance = calculate_lfi_variance(perfect_agreement)
        assert variance == 0.0

    def test_max_disagreement_variance(self):
        """Test variance with inverse patterns."""
        # 2 contexts with inverse rankings
        contexts = [
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
            {"CE": 4, "RO": 3, "AC": 2, "AE": 1},
        ]
        # Means: CE=2.5, RO=2.5, AC=2.5, AE=2.5
        # C1 deviations: -1.5, -0.5, 0.5, 1.5 -> Sq: 2.25, 0.25, 0.25, 2.25 -> Sum=5
        # C2 deviations: 1.5, 0.5, -0.5, -1.5 -> Sq: 2.25, 0.25, 0.25, 2.25 -> Sum=5
        # Total SSD = 10
        # Variance = 10 / 2 = 5.0
        variance = calculate_lfi_variance(contexts)
        assert variance == 5.0

    def test_empty_input(self):
        """Empty input should return 0.0."""
        assert calculate_lfi_variance([]) == 0.0

    def test_single_context(self):
        """Single context should yield 0.0 variance (no variation across contexts)."""
        contexts = [{"CE": 1, "RO": 2, "AC": 3, "AE": 4}]
        # Means = values. Diffs = 0.
        assert calculate_lfi_variance(contexts) == 0.0

    def test_partial_disagreement(self):
        """Test a mixed case."""
        # C1: 1, 2, 3, 4
        # C2: 1, 2, 4, 3 (Swap AC/AE)
        contexts = [
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
            {"CE": 1, "RO": 2, "AC": 4, "AE": 3},
        ]
        # Means: CE=1, RO=2, AC=3.5, AE=3.5
        # C1 Diffs: 0, 0, -0.5, 0.5 -> Sq: 0, 0, 0.25, 0.25 -> Sum=0.5
        # C2 Diffs: 0, 0, 0.5, -0.5 -> Sq: 0, 0, 0.25, 0.25 -> Sum=0.5
        # Total SSD = 1.0
        # Variance = 1.0 / 2 = 0.5
        variance = calculate_lfi_variance(contexts)
        assert variance == 0.5
