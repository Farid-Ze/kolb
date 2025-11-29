"""
Unit tests for KLSI V4.0 rules engine.
"""
import pytest
from app.assessments.klsi_v4.rules import KLSIRulesV4, get_rules, DEFAULT_RULES


def test_default_rules_version():
    """Verify default rules version"""
    assert DEFAULT_RULES.version == "4.0.0"
    assert DEFAULT_RULES.ac_ce_cutoffs == (20.0, 80.0)
    assert DEFAULT_RULES.ae_ro_cutoffs == (20.0, 80.0)


def test_get_rules_default():
    """Verify get_rules returns default instance"""
    rules = get_rules()
    assert rules == DEFAULT_RULES


def test_get_rules_invalid_version():
    """Verify get_rules raises error for unknown version"""
    with pytest.raises(ValueError, match="Unsupported rules version"):
        get_rules("999.0.0")


class TestKiteRegionDetermination:
    """Test Kite topology region determination logic"""
    
    def test_diverging_region(self):
        """Concrete + Active = DIVERGING"""
        rules = get_rules()
        region = rules.determine_kite_region(ac_ce_percentile=10, ae_ro_percentile=10)
        assert region == "DIVERGING"
    
    def test_assimilating_region(self):
        """Concrete + Reflective = ASSIMILATING"""
        rules = get_rules()
        region = rules.determine_kite_region(ac_ce_percentile=10, ae_ro_percentile=90)
        assert region == "ASSIMILATING"
    
    def test_converging_region(self):
        """Abstract + Reflective = CONVERGING"""
        rules = get_rules()
        region = rules.determine_kite_region(ac_ce_percentile=90, ae_ro_percentile=90)
        assert region == "CONVERGING"
    
    def test_accommodating_region(self):
        """Abstract + Active = ACCOMMODATING"""
        rules = get_rules()
        region = rules.determine_kite_region(ac_ce_percentile=90, ae_ro_percentile=10)
        assert region == "ACCOMMODATING"
    
    def test_balanced_region(self):
        """Balanced + Balanced = BALANCED"""
        rules = get_rules()
        region = rules.determine_kite_region(ac_ce_percentile=50, ae_ro_percentile=50)
        assert region == "BALANCED"
    
    def test_southern_region(self):
        """Concrete + Balanced = SOUTHERN"""
        rules = get_rules()
        region = rules.determine_kite_region(ac_ce_percentile=10, ae_ro_percentile=50)
        assert region == "SOUTHERN"
    
    def test_northern_region(self):
        """Abstract + Balanced = NORTHERN"""
        rules = get_rules()
        region = rules.determine_kite_region(ac_ce_percentile=90, ae_ro_percentile=50)
        assert region == "NORTHERN"
    
    def test_western_region(self):
        """Balanced + Active = WESTERN"""
        rules = get_rules()
        region = rules.determine_kite_region(ac_ce_percentile=50, ae_ro_percentile=10)
        assert region == "WESTERN"
    
    def test_eastern_region(self):
        """Balanced + Reflective = EASTERN"""
        rules = get_rules()
        region = rules.determine_kite_region(ac_ce_percentile=50, ae_ro_percentile=90)
        assert region == "EASTERN"
    
    def test_boundary_conditions(self):
        """Test cutoff boundary conditions"""
        rules = get_rules()
        
        # Exactly at 20th percentile (still in low region)
        assert rules.determine_kite_region(19.9, 50) == "SOUTHERN"
        assert rules.determine_kite_region(20.0, 50) == "BALANCED"
        
        # Exactly at 80th percentile (transitions to high region)
        assert rules.determine_kite_region(80.0, 50) == "BALANCED"
        assert rules.determine_kite_region(80.1, 50) == "NORTHERN"


def test_custom_cutoffs():
    """Verify custom cutoffs work correctly"""
    custom_rules = KLSIRulesV4(
        version="custom",
        ac_ce_cutoffs=(10.0, 90.0),
        ae_ro_cutoffs=(10.0, 90.0)
    )
    
    # With wider cutoffs, 20th percentile is now in balanced region
    region = custom_rules.determine_kite_region(ac_ce_percentile=20, ae_ro_percentile=50)
    assert region == "BALANCED"
    
    # Need to be below 10 to be concrete
    region = custom_rules.determine_kite_region(ac_ce_percentile=5, ae_ro_percentile=50)
    assert region == "SOUTHERN"
