"""
KLSI V4.0 Assessment Rules
Configurable research parameters for Kite topology and learning style determination.
"""
from pydantic import BaseModel, Field
from typing import Tuple


class KLSIRulesV4(BaseModel):
    """Version 4.0 KLSI assessment rules and thresholds"""
    
    version: str = Field(default="4.0.0", description="Rules version identifier")
    
    # Kite Topology Cutoffs (percentile thresholds for 9-region model)
    ac_ce_cutoffs: Tuple[float, float] = Field(
        default=(20.0, 80.0),
        description="AC-CE percentile cutoffs (low, high)"
    )
    ae_ro_cutoffs: Tuple[float, float] = Field(
        default=(20.0, 80.0),
        description="AE-RO percentile cutoffs (low, high)"
    )
    
    # LFI Thresholds
    lfi_high_variance_threshold: float = Field(
        default=10.0,
        description="Threshold for high LFI variance classification"
    )
    
    def determine_kite_region(
        self, 
        ac_ce_percentile: float, 
        ae_ro_percentile: float
    ) -> str:
        """
        Determine Kite topology region based on combination score percentiles.
        
        Args:
            ac_ce_percentile: AC-CE percentile (0-100)
            ae_ro_percentile: AE-RO percentile (0-100)
            
        Returns:
            String identifier for Kite region (DIVERGING, ASSIMILATING, etc.)
            
        Reference:
            Kolb & Kolb (2013) - The Kolb Learning Style Inventory 4.0
        """
        ac_ce_low, ac_ce_high = self.ac_ce_cutoffs
        ae_ro_low, ae_ro_high = self.ae_ro_cutoffs
        
        # Determine AC-CE region (Concrete ← → Abstract)
        if ac_ce_percentile < ac_ce_low:
            ac_ce_region = "concrete"  # Low AC-CE = Concrete Experience dominant
        elif ac_ce_percentile > ac_ce_high:
            ac_ce_region = "abstract"  # High AC-CE = Abstract Conceptualization dominant
        else:
            ac_ce_region = "balanced"
        
        # Determine AE-RO region (Active ← → Reflective)
        if ae_ro_percentile < ae_ro_low:
            ae_ro_region = "active"  # Low AE-RO = Active Experimentation dominant
        elif ae_ro_percentile > ae_ro_high:
            ae_ro_region = "reflective"  # High AE-RO = Reflective Observation dominant
        else:
            ae_ro_region = "balanced"
        
        # Map to Kite topology regions (9-region model)
        region_matrix = {
            ("concrete", "active"): "DIVERGING",
            ("concrete", "reflective"): "ASSIMILATING",
            ("concrete", "balanced"): "SOUTHERN",
            ("abstract", "active"): "ACCOMMODATING",
            ("abstract", "reflective"): "CONVERGING",
            ("abstract", "balanced"): "NORTHERN",
            ("balanced", "active"): "WESTERN",
            ("balanced", "reflective"): "EASTERN",
            ("balanced", "balanced"): "BALANCED",
        }
        
        return region_matrix[(ac_ce_region, ae_ro_region)]


# Singleton instance for version 4.0.0
DEFAULT_RULES = KLSIRulesV4()


def get_rules(version: str = "4.0.0") -> KLSIRulesV4:
    """
    Get assessment rules for a specific version.
    
    Args:
        version: Rules version string (default: "4.0.0")
        
    Returns:
        KLSIRulesV4 instance for the requested version
        
    Raises:
        ValueError: If version is not supported
    """
    if version == "4.0.0":
        return DEFAULT_RULES
    raise ValueError(f"Unsupported rules version: {version}. Supported: ['4.0.0']")
