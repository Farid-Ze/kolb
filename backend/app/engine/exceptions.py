from __future__ import annotations

from typing import Any, Mapping, MutableMapping


class ControlledAbort(Exception):
    """Signal that a pipeline should stop without treating it as a crash."""

    __slots__ = ("reason", "payload", "partial_results")

    def __init__(self, reason: str = "", *, payload: Mapping[str, Any] | None = None) -> None:
        super().__init__(reason)
        self.reason = reason
        self.payload: dict[str, Any] = dict(payload or {})
        self.partial_results: MutableMapping[str, Any] | None = None

    def with_partial(self, results: Mapping[str, Any]) -> "ControlledAbort":
        """Attach a snapshot of partial pipeline results before bubbling up."""

        self.partial_results = dict(results)
        return self


__all__ = ["ControlledAbort"]
