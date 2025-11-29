import pytest
from app.assessments.klsi_v4.logic import assign_learning_style

class TestKiteTopology:
    """Validate 9-Kite Topology assignments."""

    def test_all_nine_styles_reachable(self):
        """Boundary test: Every style in 9-Kite should be assignable."""
        # Boundaries in logic.py are 40th and 60th percentiles.
        # Low < 40, Mid 40-60, High > 60
        
        test_cases = {
            # Corners
            (10, 10): "Imagining",       # Low AC-CE, Low AE-RO
            (10, 90): "Initiating",      # Low AC-CE, High AE-RO
            (90, 10): "Analyzing",       # High AC-CE, Low AE-RO
            (90, 90): "Deciding",        # High AC-CE, High AE-RO
            
            # Edges
            (10, 50): "Experiencing",    # Low AC-CE, Mid AE-RO
            (90, 50): "Thinking",        # High AC-CE, Mid AE-RO
            (50, 10): "Reflecting",      # Mid AC-CE, Low AE-RO
            (50, 90): "Acting",          # Mid AC-CE, High AE-RO
            
            # Center
            (50, 50): "Balancing",       # Mid AC-CE, Mid AE-RO
        }
        
        for (ac_ce, ae_ro), expected_style in test_cases.items():
            # logic.py: determine_style_from_percentiles(acce_pct, aero_pct)
            # Note: assign_learning_style takes a CombinationScore, but we can test the logic function directly
            from app.assessments.klsi_v4.logic import determine_style_from_percentiles
            
            result = determine_style_from_percentiles(ac_ce, ae_ro)
            # Result is an enum, compare with value or name
            assert result.value == expected_style, f"Expected {expected_style} for ({ac_ce}, {ae_ro}), got {result.value}"

    def test_percentile_boundaries(self):
        """Verify boundaries (40/60) are respected."""
        from app.assessments.klsi_v4.logic import determine_style_from_percentiles
        
        # 39.9 -> Low
        assert determine_style_from_percentiles(39.9, 39.9).value == "Imagining"
        # 40.0 -> Mid (Mid is >= 40? logic says < 40 is Low, so 40 is Mid)
        # elif acce_pct > 60: High. else Mid. So 40 is Mid.
        assert determine_style_from_percentiles(40.0, 40.0).value == "Balancing"
        
        # 60.0 -> Mid
        assert determine_style_from_percentiles(60.0, 60.0).value == "Balancing"
        # 60.1 -> High
        assert determine_style_from_percentiles(60.1, 60.1).value == "Deciding"

    def test_algorithm_sha_exists(self):
        """Verify algorithm SHA is computed."""
        from app.assessments.klsi_v4.logic import ALGORITHM_VERSION_SHA
        assert ALGORITHM_VERSION_SHA is not None
        assert len(ALGORITHM_VERSION_SHA) == 64  # SHA-256 hex digest length
        assert ALGORITHM_VERSION_SHA != "unknown"
