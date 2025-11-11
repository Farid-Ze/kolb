from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Mapping, Sequence, Tuple

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.db.repositories.base import Repository
from app.models.klsi import NormativeConversionTable


@dataclass(frozen=True, slots=True)
class NormativeConversionRow:
    norm_group: str
    norm_version: str | None
    scale_name: str
    raw_score: int
    percentile: float


@dataclass
class NormativeConversionRepository(Repository[Session]):
    """Repository for normative conversion lookups."""

    def __post_init__(self) -> None:
        bind = None
        try:
            bind = self.db.get_bind()
        except Exception:
            bind = None
        dialect_name = getattr(getattr(bind, "dialect", None), "name", "") if bind else ""
        self._is_sqlite = dialect_name == "sqlite"

    def fetch_batch(
        self,
        norm_group: str,
        versions: Sequence[str],
        scale_to_raws: Mapping[str, Iterable[int]],
    ) -> List[NormativeConversionRow]:
        """Retrieve all rows matching the group, versions, and scale/raw pairs."""
        normalized_versions = list(dict.fromkeys(versions))
        if not normalized_versions:
            return []

        normalized_pairs: Dict[str, List[int]] = {}
        for scale, raws in scale_to_raws.items():
            unique_values = sorted({int(value) for value in raws})
            if unique_values:
                normalized_pairs[scale] = unique_values
        if not normalized_pairs:
            return []

        params: Dict[str, object] = {"g": norm_group}
        version_clauses: List[str] = []
        for idx, version in enumerate(normalized_versions):
            params[f"v{idx}"] = version
            version_clauses.append(f"norm_version=:v{idx}")

        where_clauses: List[str] = []
        for idx, (scale, raw_values) in enumerate(normalized_pairs.items()):
            params[f"s{idx}"] = scale
            if self._is_sqlite:
                joined = ",".join(str(value) for value in raw_values)
                where_clauses.append(
                    f"(scale_name=:s{idx} AND raw_score IN ({joined}))"
                )
            else:
                params[f"rs{idx}"] = tuple(raw_values)
                where_clauses.append(
                    f"(scale_name=:s{idx} AND raw_score = ANY(:rs{idx}))"
                )

        if not where_clauses:
            return []

        sql = f"""
            SELECT norm_group, norm_version, scale_name, raw_score, percentile
            FROM normative_conversion_table
            WHERE norm_group=:g AND ({' OR '.join(version_clauses)})
              AND ({' OR '.join(where_clauses)})
        """
        rows = self.db.execute(text(sql), params).fetchall()
        return [
            NormativeConversionRow(
                norm_group=str(row[0]),
                norm_version=str(row[1]) if row[1] is not None else None,
                scale_name=str(row[2]),
                raw_score=int(row[3]),
                percentile=float(row[4]),
            )
            for row in rows
        ]

    def fetch_one(
        self,
        norm_group: str,
        version: str,
        scale: str,
        raw: int,
    ) -> NormativeConversionRow | None:
        row = self.db.execute(
            text(
                "SELECT percentile, norm_version, scale_name, raw_score, norm_group "
                "FROM normative_conversion_table "
                "WHERE norm_group=:g AND norm_version=:v AND scale_name=:s AND raw_score=:r "
                "LIMIT 1"
            ),
            {"g": norm_group, "v": version, "s": scale, "r": int(raw)},
        ).fetchone()
        if not row:
            return None
        percentile, stored_version, scale_name, raw_score, group_name = row
        return NormativeConversionRow(
            norm_group=str(group_name),
            norm_version=str(stored_version) if stored_version is not None else None,
            scale_name=str(scale_name),
            raw_score=int(raw_score),
            percentile=float(percentile),
        )

    def fetch_first_for_versions(
        self,
        norm_group: str,
        versions: Sequence[str],
        scale: str,
        raw: int,
    ) -> Tuple[NormativeConversionRow, str] | None:
        normalized_versions = list(dict.fromkeys(versions))
        if not normalized_versions:
            return None
        rows = self.fetch_batch(norm_group, normalized_versions, {scale: [raw]})
        if not rows:
            return None
        for version in normalized_versions:
            for entry in rows:
                resolved_version = entry.norm_version or version
                if resolved_version == version:
                    return entry, resolved_version
        entry = rows[0]
        fallback_version = entry.norm_version or normalized_versions[0]
        return entry, fallback_version

    def upsert(
        self,
        norm_group: str,
        norm_version: str,
        scale_name: str,
        raw_score: int,
        percentile: float,
    ) -> Tuple[NormativeConversionTable, bool]:
        stmt = (
            select(NormativeConversionTable)
            .where(NormativeConversionTable.norm_group == norm_group)
            .where(NormativeConversionTable.norm_version == norm_version)
            .where(NormativeConversionTable.scale_name == scale_name)
            .where(NormativeConversionTable.raw_score == raw_score)
            .limit(1)
        )
        existing = self.db.execute(stmt).scalar_one_or_none()
        if existing:
            existing.percentile = percentile
            return existing, False
        entity = NormativeConversionTable(
            norm_group=norm_group,
            norm_version=norm_version,
            scale_name=scale_name,
            raw_score=raw_score,
            percentile=percentile,
        )
        self.db.add(entity)
        return entity, True

    def fetch_all_entries(self) -> List[NormativeConversionRow]:
        """Return all normative conversion entries as lightweight rows."""
        stmt = select(
            NormativeConversionTable.norm_group,
            NormativeConversionTable.norm_version,
            NormativeConversionTable.scale_name,
            NormativeConversionTable.raw_score,
            NormativeConversionTable.percentile,
        )
        rows = self.db.execute(stmt).all()
        return [
            NormativeConversionRow(
                norm_group=str(row[0]),
                norm_version=str(row[1]) if row[1] is not None else None,
                scale_name=str(row[2]),
                raw_score=int(row[3]),
                percentile=float(row[4]),
            )
            for row in rows
        ]
