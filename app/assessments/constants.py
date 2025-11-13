"""Centralized constants for KLSI assessment calculations.

This module consolidates magic numbers, configuration values, and psychometric
constants used throughout the assessment engine. Centralizing these values:
- Prevents duplicate definitions across modules
- Makes values easier to update and maintain
- Documents the meaning and source of each constant
- Enables easy testing with alternative values

All constants are immutable (Final) to prevent accidental modification.
"""

from __future__ import annotations

from typing import Final, Tuple

__all__ = [
    "LEARNING_MODES",
    "MODE_COUNT",
    "ITEM_COUNT_KLSI4",
    "CONTEXT_COUNT_LFI",
    "RANK_MIN",
    "RANK_MAX",
    "RANK_SUM_PER_ITEM",
    "TOTAL_RANK_SUM",
    "ACCE_RANGE_MIN",
    "ACCE_RANGE_MAX",
    "AERO_RANGE_MIN",
    "AERO_RANGE_MAX",
    "PERCENTILE_MIN",
    "PERCENTILE_MAX",
    "LFI_MIN",
    "LFI_MAX",
    "KENDALLS_W_MIN",
    "KENDALLS_W_MAX",
]

# =============================================================================
# Learning Modes
# =============================================================================

LEARNING_MODES: Final[Tuple[str, str, str, str]] = ("CE", "RO", "AC", "AE")
"""The four learning modes in Kolb's Experiential Learning Theory.

- CE (Concrete Experience): Learning through feeling and direct experience
- RO (Reflective Observation): Learning through watching and reflecting  
- AC (Abstract Conceptualization): Learning through thinking and analyzing
- AE (Active Experimentation): Learning through doing and testing
"""

MODE_COUNT: Final[int] = 4
"""Number of learning modes in KLSI assessment."""

# =============================================================================
# Assessment Structure
# =============================================================================

ITEM_COUNT_KLSI4: Final[int] = 12
"""Number of forced-choice items in KLSI 4.0.

Each item requires ranking 4 choices (one per mode) from 1-4.
Source: Kolb Learning Style Inventory 4.0 specification.
"""

CONTEXT_COUNT_LFI: Final[int] = 8
"""Number of context scenarios in Learning Flexibility Index.

Users rank the 4 learning modes for each of 8 different contexts.
Source: KLSI 4.0 Guide, Appendix 7.
"""

# =============================================================================
# Ipsative Ranking Constraints
# =============================================================================

RANK_MIN: Final[int] = 1
"""Minimum rank value in forced-choice ranking (most preferred)."""

RANK_MAX: Final[int] = 4
"""Maximum rank value in forced-choice ranking (least preferred)."""

RANK_SUM_PER_ITEM: Final[int] = 10
"""Expected sum of ranks per item (1 + 2 + 3 + 4 = 10).

Used to validate ipsative constraint: each item must rank all choices exactly once.
"""

TOTAL_RANK_SUM: Final[int] = 120
"""Expected total sum of all ranks across 12 items (12 * 10 = 120).

Used as integrity check: CE + RO + AC + AE raw scores must equal 120.
"""

# =============================================================================
# Score Ranges
# =============================================================================

ACCE_RANGE_MIN: Final[int] = -29
"""Minimum possible ACCE score (AC - CE dialectic).

Theoretical minimum when AC = 12 and CE = 41 (most CE-oriented).
Source: KLSI 4.0 Guide, Appendix 1.
"""

ACCE_RANGE_MAX: Final[int] = 33
"""Maximum possible ACCE score (AC - CE dialectic).

Theoretical maximum when AC = 45 and CE = 12 (most AC-oriented).
Source: KLSI 4.0 Guide, Appendix 1.
"""

AERO_RANGE_MIN: Final[int] = -33
"""Minimum possible AERO score (AE - RO dialectic).

Theoretical minimum when AE = 12 and RO = 45 (most RO-oriented).
Source: KLSI 4.0 Guide, Appendix 1.
"""

AERO_RANGE_MAX: Final[int] = 33
"""Maximum possible AERO score (AE - RO dialectic).

Theoretical maximum when AE = 45 and RO = 12 (most AE-oriented).
Source: KLSI 4.0 Guide, Appendix 1.
"""

# =============================================================================
# Percentiles and Normalized Scores
# =============================================================================

PERCENTILE_MIN: Final[float] = 0.0
"""Minimum percentile value (0th percentile)."""

PERCENTILE_MAX: Final[float] = 100.0
"""Maximum percentile value (100th percentile)."""

# =============================================================================
# Learning Flexibility Index (LFI)
# =============================================================================

LFI_MIN: Final[float] = 0.0
"""Minimum LFI score indicating maximum consistency (low flexibility).

LFI = 1 - W, where W is Kendall's coefficient of concordance.
When W = 1 (perfect agreement), LFI = 0 (no flexibility).
"""

LFI_MAX: Final[float] = 1.0
"""Maximum LFI score indicating maximum flexibility.

When W = 0 (no agreement across contexts), LFI = 1 (high flexibility).
Source: KLSI 4.0 Guide, Appendix 7.
"""

KENDALLS_W_MIN: Final[float] = 0.0
"""Minimum Kendall's W (coefficient of concordance).

W = 0 indicates no agreement - learner uses different modes across contexts.
"""

KENDALLS_W_MAX: Final[float] = 1.0
"""Maximum Kendall's W (coefficient of concordance).

W = 1 indicates perfect agreement - learner uses same mode preferences across all contexts.
"""

# =============================================================================
# Validation Messages (references to i18n)
# =============================================================================

# Note: Actual validation messages are in app.i18n.id_messages
# These constants are for numeric validation only
