from __future__ import annotations

from typing import Dict, List, Optional, Tuple

from app.data import norms as appendix_norms


class InMemoryNormRepository:
    """Hybrid norm lookup that favors DB entries then Appendix fallbacks."""

    def __init__(self, db_lookup) -> None:
        self.db_lookup = db_lookup

    def percentile(
        self, group_chain: List[str], scale: str, raw: int | float
    ) -> Tuple[Optional[float], str, bool]:
        """Return percentile, provenance label, and truncation flag."""

        for group in group_chain:
            value = self.db_lookup(group, scale, raw)
            if value is not None:
                return value, f"DB:{group}", False

        # Appendix fallback tables differ per scale
        if scale == "CE":
            return appendix_norms.lookup_percentile(raw, appendix_norms.CE_PERCENTILES), "Appendix:CE", self._is_truncated(raw, appendix_norms.CE_PERCENTILES)
        if scale == "RO":
            return appendix_norms.lookup_percentile(raw, appendix_norms.RO_PERCENTILES), "Appendix:RO", self._is_truncated(raw, appendix_norms.RO_PERCENTILES)
        if scale == "AC":
            return appendix_norms.lookup_percentile(raw, appendix_norms.AC_PERCENTILES), "Appendix:AC", self._is_truncated(raw, appendix_norms.AC_PERCENTILES)
        if scale == "AE":
            return appendix_norms.lookup_percentile(raw, appendix_norms.AE_PERCENTILES), "Appendix:AE", self._is_truncated(raw, appendix_norms.AE_PERCENTILES)
        if scale == "ACCE":
            return appendix_norms.lookup_percentile(raw, appendix_norms.ACCE_PERCENTILES), "Appendix:ACCE", self._is_truncated(raw, appendix_norms.ACCE_PERCENTILES)
        if scale == "AERO":
            return appendix_norms.lookup_percentile(raw, appendix_norms.AERO_PERCENTILES), "Appendix:AERO", self._is_truncated(raw, appendix_norms.AERO_PERCENTILES)
        if scale == "LFI":
            value = appendix_norms.lookup_lfi(raw / 100 if isinstance(raw, (int, float)) else raw)
            return value, "Appendix:LFI", False
        return None, "Unknown", False

    @staticmethod
    def _is_truncated(raw: int | float, table: Dict[int, float]) -> bool:
        if not table:
            return False
        keys = sorted(table.keys())
        if raw < keys[0] or raw > keys[-1]:
            return True
        return False
