from __future__ import annotations

class SentinelStr(str):
    """String-like sentinel that retains identity semantics."""

    __slots__ = ()

    def __new__(cls, label: str):
        return super().__new__(cls, label)

    def __repr__(self) -> str:  # pragma: no cover - repr logic trivial
        return f"<Sentinel:{super().__str__()}>"


UNKNOWN = SentinelStr("unknown")

__all__ = ["UNKNOWN", "SentinelStr"]
