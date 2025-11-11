from __future__ import annotations

from typing import Protocol, Tuple, Optional, List


class NormProvider(Protocol):
    """Protocol for normative conversions.

    A provider returns a tuple of (percentile, provenance_label, truncated_flag)
    for a given ordered list of candidate norm groups (highest precedence first),
    a scale name, and a raw score.

    Provenance label examples:
    - "DB:EDU:University Degree|v2" (database group with explicit version)
    - "DB:Total" (database default version)
    - "Appendix:ACCE" (appendix fallback for ACCE)
    - "Appendix:LFI" (appendix fallback for LFI)
    """

    def percentile(
        self, group_chain: List[str], scale: str, raw: int | float
    ) -> Tuple[Optional[float], str, bool]:
        ...
