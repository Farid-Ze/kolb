from __future__ import annotations

from typing import List, Optional, Tuple

from app.data import norms as appendix_norms

_NORM_VERSION_DELIM = "|"
_DEFAULT_NORM_VERSION = "default"


def _split_norm_token(token: str) -> tuple[str, str]:
    if _NORM_VERSION_DELIM in token:
        base, version = token.split(_NORM_VERSION_DELIM, 1)
        return base, version or _DEFAULT_NORM_VERSION
    return token, _DEFAULT_NORM_VERSION


class DatabaseNormProvider:
    """DB-backed norm lookup provider.

    Expects a callable db_lookup(group_token, scale, raw)->(value, resolved_version) or None.
    Returns (percentile, label, truncated=False) when found, else (None, "DB:None", False).
    """

    def __init__(self, db_lookup):
        self.db_lookup = db_lookup

    def percentile(
        self, group_chain: List[str], scale: str, raw: int | float
    ) -> Tuple[Optional[float], str, bool]:
        for group_token in group_chain:
            base_group, requested_version = _split_norm_token(group_token)
            token_has_version = _NORM_VERSION_DELIM in group_token
            result = self.db_lookup(group_token, scale, raw)
            value: Optional[float]
            version: Optional[str]
            if isinstance(result, tuple):
                value = result[0]
                version = result[1] if len(result) > 1 else None
            else:
                value = result
                version = None
            if value is not None:
                version_token = version or requested_version or _DEFAULT_NORM_VERSION
                include_version = token_has_version or version_token != _DEFAULT_NORM_VERSION
                normalized = f"{base_group}{_NORM_VERSION_DELIM}{version_token}" if include_version else base_group
                return value, f"DB:{normalized}", False
        return None, "DB:None", False


class AppendixNormProvider:
    """Appendix fallback provider for KLSI 4.0 norm tables."""

    def percentile(
        self, group_chain: List[str], scale: str, raw: int | float
    ) -> Tuple[Optional[float], str, bool]:
        # Scalar scales
        if scale == "CE":
            val = appendix_norms.lookup_percentile(int(raw), appendix_norms.CE_PERCENTILES)
            return val, "Appendix:CE", self._is_truncated(raw, appendix_norms.CE_PERCENTILES)
        if scale == "RO":
            val = appendix_norms.lookup_percentile(int(raw), appendix_norms.RO_PERCENTILES)
            return val, "Appendix:RO", self._is_truncated(raw, appendix_norms.RO_PERCENTILES)
        if scale == "AC":
            val = appendix_norms.lookup_percentile(int(raw), appendix_norms.AC_PERCENTILES)
            return val, "Appendix:AC", self._is_truncated(raw, appendix_norms.AC_PERCENTILES)
        if scale == "AE":
            val = appendix_norms.lookup_percentile(int(raw), appendix_norms.AE_PERCENTILES)
            return val, "Appendix:AE", self._is_truncated(raw, appendix_norms.AE_PERCENTILES)
        # Combination scales
        if scale == "ACCE":
            val = appendix_norms.lookup_percentile(int(raw), appendix_norms.ACCE_PERCENTILES)
            return val, "Appendix:ACCE", self._is_truncated(raw, appendix_norms.ACCE_PERCENTILES)
        if scale == "AERO":
            val = appendix_norms.lookup_percentile(int(raw), appendix_norms.AERO_PERCENTILES)
            return val, "Appendix:AERO", self._is_truncated(raw, appendix_norms.AERO_PERCENTILES)
        # LFI
        if scale == "LFI":
            # raw passed in may be 0-100 int; convert to 0-1 float if needed
            value = appendix_norms.lookup_lfi(raw / 100 if isinstance(raw, (int, float)) else raw)
            return value, "Appendix:LFI", False
        return None, "Appendix:None", False

    @staticmethod
    def _is_truncated(raw: int | float, table: dict[int, float]) -> bool:
        if not table:
            return False
        keys = sorted(table.keys())
        return bool(raw < keys[0] or raw > keys[-1])


class ExternalNormProvider:
    """Placeholder for an external API/provider. Always returns no result."""

    def percentile(
        self, group_chain: List[str], scale: str, raw: int | float
    ) -> Tuple[Optional[float], str, bool]:
        return None, "External:None", False


class CompositeNormProvider:
    def __init__(self, providers: List[object]):
        self.providers = providers

    def percentile(
        self, group_chain: List[str], scale: str, raw: int | float
    ) -> Tuple[Optional[float], str, bool]:
        for provider in self.providers:
            value, label, truncated = provider.percentile(group_chain, scale, raw)
            if value is not None:
                return value, label, truncated
        return None, "Unknown", False
