"""Validation utilities for KLSI assessment data integrity.

This module provides validators for psychometric data constraints:
- Ipsative ranking validation (forced-choice integrity)
- Score range validation (within theoretical bounds)
- Sum integrity checks (CE + RO + AC + AE = 120)
- LFI context validation

All validators return clear error messages when validation fails,
making debugging and user feedback straightforward.
"""

from __future__ import annotations

from typing import Dict, List, Tuple

from app.assessments.constants import (
    RANK_MIN,
    RANK_MAX,
    RANK_SUM_PER_ITEM,
    TOTAL_RANK_SUM,
    ITEM_COUNT_KLSI4,
    CONTEXT_COUNT_LFI,
    ACCE_RANGE_MIN,
    ACCE_RANGE_MAX,
    AERO_RANGE_MIN,
    AERO_RANGE_MAX,
    LFI_MIN,
    LFI_MAX,
    KENDALLS_W_MIN,
    KENDALLS_W_MAX,
)
from app.core.numeric import clamp

__all__ = [
    "validate_ipsative_ranks",
    "validate_score_sum",
    "validate_acce_range",
    "validate_aero_range",
    "validate_lfi_value",
    "validate_kendalls_w",
    "ValidationError",
]


class ValidationError(ValueError):
    """Raised when assessment data fails validation constraints."""
    pass


def validate_ipsative_ranks(ranks: Dict[str, int], item_id: int | None = None) -> None:
    """Validate that ranks form a proper ipsative permutation [1,2,3,4].
    
    Ipsative constraint: Each item must rank all 4 choices exactly once,
    using each rank value (1, 2, 3, 4) exactly once.
    
    Args:
        ranks: Dictionary mapping choice IDs to rank values.
        item_id: Optional item identifier for error messages.
        
    Raises:
        ValidationError: If ranks don't form a valid permutation.
        
    Example:
        >>> validate_ipsative_ranks({"CE": 2, "RO": 1, "AC": 4, "AE": 3})  # OK
        >>> validate_ipsative_ranks({"CE": 2, "RO": 1, "AC": 2, "AE": 3})  # Raises!
        ValidationError: Duplicate rank value 2
    """
    item_label = f" for item {item_id}" if item_id is not None else ""
    
    # Check count
    if len(ranks) != 4:
        raise ValidationError(
            f"Expected 4 ranks{item_label}, got {len(ranks)}"
        )
    
    # Check range
    for choice_id, rank in ranks.items():
        if not isinstance(rank, int):
            raise ValidationError(
                f"Rank for {choice_id}{item_label} must be integer, got {type(rank).__name__}"
            )
        if not (RANK_MIN <= rank <= RANK_MAX):
            raise ValidationError(
                f"Rank for {choice_id}{item_label} must be in [{RANK_MIN}, {RANK_MAX}], got {rank}"
            )
    
    # Check uniqueness (proper permutation)
    rank_values = sorted(ranks.values())
    expected = list(range(RANK_MIN, RANK_MAX + 1))
    if rank_values != expected:
        duplicates = [r for r in rank_values if rank_values.count(r) > 1]
        if duplicates:
            raise ValidationError(
                f"Duplicate rank values{item_label}: {duplicates}. Must use [1,2,3,4] exactly once."
            )
        else:
            raise ValidationError(
                f"Invalid rank permutation{item_label}: {rank_values}. Must be [1,2,3,4]."
            )
    
    # Check sum (additional integrity check)
    total = sum(ranks.values())
    if total != RANK_SUM_PER_ITEM:
        raise ValidationError(
            f"Sum of ranks{item_label} must be {RANK_SUM_PER_ITEM}, got {total}"
        )


def validate_score_sum(ce: int, ro: int, ac: int, ae: int) -> None:
    """Validate that raw mode scores sum to expected total.
    
    Integrity check: For 12 items with ipsative ranking [1,2,3,4],
    the sum CE + RO + AC + AE must equal 120.
    
    Args:
        ce, ro, ac, ae: Raw learning mode scores.
        
    Raises:
        ValidationError: If sum is not 120.
        
    Example:
        >>> validate_score_sum(20, 22, 28, 50)  # Sum = 120, OK
        >>> validate_score_sum(20, 22, 28, 49)  # Sum = 119, Raises!
    """
    total = ce + ro + ac + ae
    if total != TOTAL_RANK_SUM:
        raise ValidationError(
            f"Raw score sum must be {TOTAL_RANK_SUM} for {ITEM_COUNT_KLSI4} items, "
            f"got {total} (CE={ce}, RO={ro}, AC={ac}, AE={ae})"
        )


def validate_acce_range(acce: int, clamp_value: bool = False) -> int:
    """Validate ACCE score is within theoretical range.
    
    Args:
        acce: ACCE dialectic score (AC - CE).
        clamp_value: If True, clamp to valid range instead of raising.
        
    Returns:
        The validated (or clamped) ACCE value.
        
    Raises:
        ValidationError: If out of range and clamp_value=False.
        
    Example:
        >>> validate_acce_range(15)  # OK, returns 15
        15
        >>> validate_acce_range(-50, clamp_value=True)  # Clamped to -29
        -29
    """
    if ACCE_RANGE_MIN <= acce <= ACCE_RANGE_MAX:
        return acce
    
    if clamp_value:
        return clamp(acce, ACCE_RANGE_MIN, ACCE_RANGE_MAX)
    
    raise ValidationError(
        f"ACCE must be in [{ACCE_RANGE_MIN}, {ACCE_RANGE_MAX}], got {acce}"
    )


def validate_aero_range(aero: int, clamp_value: bool = False) -> int:
    """Validate AERO score is within theoretical range.
    
    Args:
        aero: AERO dialectic score (AE - RO).
        clamp_value: If True, clamp to valid range instead of raising.
        
    Returns:
        The validated (or clamped) AERO value.
        
    Raises:
        ValidationError: If out of range and clamp_value=False.
        
    Example:
        >>> validate_aero_range(10)  # OK, returns 10
        10
        >>> validate_aero_range(50, clamp_value=True)  # Clamped to 33
        33
    """
    if AERO_RANGE_MIN <= aero <= AERO_RANGE_MAX:
        return aero
    
    if clamp_value:
        return clamp(aero, AERO_RANGE_MIN, AERO_RANGE_MAX)
    
    raise ValidationError(
        f"AERO must be in [{AERO_RANGE_MIN}, {AERO_RANGE_MAX}], got {aero}"
    )


def validate_lfi_value(lfi: float, clamp_value: bool = False) -> float:
    """Validate LFI score is within theoretical range [0.0, 1.0].
    
    Args:
        lfi: Learning Flexibility Index score.
        clamp_value: If True, clamp to [0.0, 1.0] instead of raising.
        
    Returns:
        The validated (or clamped) LFI value.
        
    Raises:
        ValidationError: If out of range and clamp_value=False.
    """
    if LFI_MIN <= lfi <= LFI_MAX:
        return lfi
    
    if clamp_value:
        return clamp(lfi, LFI_MIN, LFI_MAX)
    
    raise ValidationError(
        f"LFI must be in [{LFI_MIN}, {LFI_MAX}], got {lfi}"
    )


def validate_kendalls_w(w: float, clamp_value: bool = False) -> float:
    """Validate Kendall's W coefficient is within valid range [0.0, 1.0].
    
    Args:
        w: Kendall's coefficient of concordance.
        clamp_value: If True, clamp to [0.0, 1.0] instead of raising.
        
    Returns:
        The validated (or clamped) W value.
        
    Raises:
        ValidationError: If out of range and clamp_value=False.
    """
    if KENDALLS_W_MIN <= w <= KENDALLS_W_MAX:
        return w
    
    if clamp_value:
        return clamp(w, KENDALLS_W_MIN, KENDALLS_W_MAX)
    
    raise ValidationError(
        f"Kendall's W must be in [{KENDALLS_W_MIN}, {KENDALLS_W_MAX}], got {w}"
    )
