from __future__ import annotations

from typing import Final, Tuple

__all__ = [
    "PRIMARY_MODE_CODES",
    "COMBINATION_SCALE_CODES",
    "ALL_SCALE_CODES",
]

PRIMARY_MODE_CODES: Final[Tuple[str, str, str, str]] = ("CE", "RO", "AC", "AE")
COMBINATION_SCALE_CODES: Final[Tuple[str, str]] = ("ACCE", "AERO")
ALL_SCALE_CODES: Final[Tuple[str, ...]] = PRIMARY_MODE_CODES + COMBINATION_SCALE_CODES
