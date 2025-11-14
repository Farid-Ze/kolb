"""Numeric validation and transformation utilities.

This module provides utilities for safe numeric operations including:
- Range clamping to prevent out-of-bounds values
- Controlled rounding with configurable precision
- Division by zero protection
- Type coercion with validation

These utilities centralize numeric transformations to ensure consistency
across the assessment engine and prevent common numeric errors.
"""

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP, ROUND_DOWN, ROUND_UP, ROUND_HALF_EVEN
from typing import TypeVar, Union

__all__ = [
    "clamp",
    "safe_round",
    "safe_div",
    "to_int_safe",
    "to_float_safe",
]


NumericT = TypeVar("NumericT", int, float, Decimal)


def clamp(value: NumericT, min_value: NumericT, max_value: NumericT) -> NumericT:
    """Clamp a numeric value to be within the specified range.
    
    Args:
        value: The value to clamp.
        min_value: The minimum allowed value.
        max_value: The maximum allowed value.
        
    Returns:
        The clamped value, guaranteed to be in [min_value, max_value].
        
    Example:
        >>> clamp(150, 0, 100)
        100
        >>> clamp(-5, 0, 100)
        0
        >>> clamp(50, 0, 100)
        50
    """
    if min_value > max_value:
        raise ValueError(f"min_value ({min_value}) must be <= max_value ({max_value})")
    return max(min_value, min(value, max_value))


def safe_round(value: float, decimals: int = 2, method: str = "half_up") -> float:
    """Round a float with controlled precision and rounding method.
    
    Uses decimal.Decimal for precise rounding to avoid floating point errors.
    
    Args:
        value: The float value to round.
        decimals: Number of decimal places (default: 2).
        method: Rounding method - "half_up" (default), "down", "up", "half_even".
        
    Returns:
        The rounded float value.
        
    Example:
        >>> safe_round(2.5)
        2.5
        >>> safe_round(2.555, 2)
        2.56
        >>> safe_round(2.125, 2, "half_even")
        2.12
    """
    rounding_methods = {
        "half_up": ROUND_HALF_UP,
        "down": ROUND_DOWN,
        "up": ROUND_UP,
        "half_even": ROUND_HALF_EVEN,
    }
    
    if method not in rounding_methods:
        raise ValueError(f"Invalid rounding method: {method}. Use 'half_up', 'down', 'up', or 'half_even'.")
    
    quantizer = Decimal(10) ** -decimals
    decimal_value = Decimal(str(value))
    rounded = decimal_value.quantize(quantizer, rounding=rounding_methods[method])
    return float(rounded)


def safe_div(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Perform division with protection against division by zero.
    
    Args:
        numerator: The dividend.
        denominator: The divisor.
        default: Value to return if denominator is zero (default: 0.0).
        
    Returns:
        The quotient if denominator is non-zero, otherwise the default value.
        
    Example:
        >>> safe_div(10, 2)
        5.0
        >>> safe_div(10, 0)
        0.0
        >>> safe_div(10, 0, default=float('inf'))
        inf
    """
    if denominator == 0:
        return default
    return numerator / denominator


def to_int_safe(value: Union[str, int, float], default: int = 0) -> int:
    """Convert a value to int with fallback for invalid inputs.
    
    Args:
        value: Value to convert (string, int, or float).
        default: Value to return if conversion fails (default: 0).
        
    Returns:
        The integer value or default if conversion fails.
        
    Example:
        >>> to_int_safe("42")
        42
        >>> to_int_safe("invalid")
        0
        >>> to_int_safe(3.7)
        3
    """
    try:
        if isinstance(value, str):
            # Handle strings with decimals
            return int(float(value))
        return int(value)
    except (ValueError, TypeError):
        return default


def to_float_safe(value: Union[str, int, float], default: float = 0.0) -> float:
    """Convert a value to float with fallback for invalid inputs.
    
    Args:
        value: Value to convert (string, int, or float).
        default: Value to return if conversion fails (default: 0.0).
        
    Returns:
        The float value or default if conversion fails.
        
    Example:
        >>> to_float_safe("42.5")
        42.5
        >>> to_float_safe("invalid")
        0.0
        >>> to_float_safe(42)
        42.0
    """
    try:
        return float(value)
    except (ValueError, TypeError):
        return default
