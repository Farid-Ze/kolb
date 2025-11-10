from __future__ import annotations

from typing import Dict, List, Optional, Tuple

from app.data import norms as appendix_norms

_NORM_VERSION_DELIM = "|"
_DEFAULT_NORM_VERSION = "default"


def _split_norm_token(token: str) -> Tuple[str, str]:
    if _NORM_VERSION_DELIM in token:
        base, version = token.split(_NORM_VERSION_DELIM, 1)
        return base, version or _DEFAULT_NORM_VERSION
    return token, _DEFAULT_NORM_VERSION


class InMemoryNormRepository:
    """Hybrid norm lookup that favors DB entries then Appendix fallbacks."""

    def __init__(self, db_lookup) -> None:
        self.db_lookup = db_lookup

    def percentile(
        self, group_chain: List[str], scale: str, raw: int | float
    ) -> Tuple[Optional[float], str, bool]:
        """Return percentile, provenance label, and truncation flag."""

        for group_token in group_chain:
            base_group, requested_version = _split_norm_token(group_token)
            token_has_version = _NORM_VERSION_DELIM in group_token
            lookup_result = self.db_lookup(group_token, scale, raw)
            value: Optional[float]
            version: Optional[str]
            if isinstance(lookup_result, tuple):
                value = lookup_result[0]
                version = lookup_result[1] if len(lookup_result) > 1 else None
            else:
                value = lookup_result
                version = None
            if value is not None:
                version_token = version or requested_version or _DEFAULT_NORM_VERSION
                include_version = token_has_version or version_token != _DEFAULT_NORM_VERSION
                normalized_group = (
                    f"{base_group}{_NORM_VERSION_DELIM}{version_token}"
                    if include_version
                    else base_group
                )
                label = f"DB:{normalized_group}"
                return value, label, False

        # Appendix fallback tables differ per scale
        if scale == "CE":
            return appendix_norms.lookup_percentile(int(raw), appendix_norms.CE_PERCENTILES), "Appendix:CE", self._is_truncated(raw, appendix_norms.CE_PERCENTILES)
        if scale == "RO":
            return appendix_norms.lookup_percentile(int(raw), appendix_norms.RO_PERCENTILES), "Appendix:RO", self._is_truncated(raw, appendix_norms.RO_PERCENTILES)
        if scale == "AC":
            return appendix_norms.lookup_percentile(int(raw), appendix_norms.AC_PERCENTILES), "Appendix:AC", self._is_truncated(raw, appendix_norms.AC_PERCENTILES)
        if scale == "AE":
            return appendix_norms.lookup_percentile(int(raw), appendix_norms.AE_PERCENTILES), "Appendix:AE", self._is_truncated(raw, appendix_norms.AE_PERCENTILES)
        if scale == "ACCE":
            return appendix_norms.lookup_percentile(int(raw), appendix_norms.ACCE_PERCENTILES), "Appendix:ACCE", self._is_truncated(raw, appendix_norms.ACCE_PERCENTILES)
        if scale == "AERO":
            return appendix_norms.lookup_percentile(int(raw), appendix_norms.AERO_PERCENTILES), "Appendix:AERO", self._is_truncated(raw, appendix_norms.AERO_PERCENTILES)
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
