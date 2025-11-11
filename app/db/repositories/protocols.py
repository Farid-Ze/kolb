from __future__ import annotations

from typing import Iterable, Mapping, Protocol, Sequence

from app.db.repositories.normative import NormativeConversionRow


class NormConversionReader(Protocol):
    """Protocol describing read-only access to normative conversion data."""

    def fetch_batch(
        self,
        norm_group: str,
        versions: Sequence[str],
        scale_to_raws: Mapping[str, Iterable[int]],
    ) -> list[NormativeConversionRow]:
        ...

    def fetch_first_for_versions(
        self,
        norm_group: str,
        versions: Sequence[str],
        scale: str,
        raw: int,
    ) -> tuple[NormativeConversionRow, str] | None:
        ...
