"""Enums for assessment-related constants.

This module provides type-safe enumerations for assessment identifiers,
strategy names, and other categorical values used throughout the system.

Using enums instead of magic strings provides:
- Type safety (IDEs can validate values)
- Autocomplete support
- Refactoring safety (rename operations work correctly)
- Clear documentation of allowed values
"""

from __future__ import annotations

from enum import Enum

__all__ = [
    "InstrumentCode",
    "AssessmentVersion",
    "ScoringStrategyName",
    "INSTRUMENT_KLSI",
    "VERSION_KLSI_4_0",
    "STRATEGY_KLSI_4_0",
]


class InstrumentCode(str, Enum):
    """Assessment instrument codes.
    
    These codes identify different assessment instruments in the system.
    Currently only KLSI 4.0 is implemented, but the system is designed
    to support additional instruments in the future.
    
    Usage:
        >>> from app.assessments.enums import InstrumentCode
        >>> code = InstrumentCode.KLSI
        >>> code.value
        'KLSI'
        >>> str(code)
        'KLSI'
    """
    
    KLSI = "KLSI"
    """Kolb Learning Style Inventory"""
    
    # Future instruments can be added here:
    # MBTI = "MBTI"  # Myers-Briggs Type Indicator
    # VARK = "VARK"  # Visual/Auditory/Reading/Kinesthetic
    

class AssessmentVersion(str, Enum):
    """Assessment version identifiers.
    
    Versions are semantic but stored as strings for flexibility.
    
    Usage:
        >>> from app.assessments.enums import AssessmentVersion
        >>> version = AssessmentVersion.KLSI_4_0
        >>> version.value
        '4.0'
    """
    
    KLSI_4_0 = "4.0"
    """Kolb Learning Style Inventory version 4.0"""
    
    # Future versions:
    # KLSI_5_0 = "5.0"


class ScoringStrategyName(str, Enum):
    """Scoring strategy identifiers.
    
    Each strategy implements the scoring logic for a specific instrument.
    The strategy name typically matches the instrument code + version.
    
    Usage:
        >>> from app.assessments.enums import ScoringStrategyName
        >>> strategy = ScoringStrategyName.KLSI_4_0
        >>> strategy.value
        'KLSI_4_0'
    """
    
    KLSI_4_0 = "KLSI_4_0"
    """Scoring strategy for KLSI 4.0 assessment"""
    
    # Future strategies:
    # MBTI_FORM_M = "MBTI_FORM_M"
    # VARK_V8 = "VARK_V8"


# Convenience mappings for backward compatibility
INSTRUMENT_KLSI = InstrumentCode.KLSI.value
VERSION_KLSI_4_0 = AssessmentVersion.KLSI_4_0.value
STRATEGY_KLSI_4_0 = ScoringStrategyName.KLSI_4_0.value
