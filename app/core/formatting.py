"""Formatting helpers for consistent rounding and scaling.

This module centralizes numeric formatting patterns (rounding, clamping,
heuristic percent scaling) so reports and runtime diagnostics follow the same
rules — fulfilling the TODO that called for a dedicated formatting layer.
"""

from __future__ import annotations

from typing import Optional

from app.core.numeric import clamp, safe_div, safe_round

__all__ = ["format_decimal", "distance_to_percent"]


def format_decimal(value: Optional[float], *, decimals: int = 2) -> Optional[float]:
    """Safely round a nullable float value using the shared numeric helpers."""

    if value is None:
        return None
    return safe_round(value, decimals=decimals)


def distance_to_percent(
    distance: Optional[float],
    *,
    max_distance: float,
    decimals: int = 1,
) -> float:
    """Convert a distance-from-center metric into a pseudo-percent score."""

    if max_distance <= 0:
        raise ValueError("max_distance must be > 0")
    normalized = 1.0 - safe_div(distance or 0.0, max_distance, default=0.0)
    scaled = normalized * 100.0
    return clamp(safe_round(scaled, decimals=decimals), 0.0, 100.0)
