from dataclasses import dataclass
from typing import Dict, Iterable, List, Mapping, Sequence, Tuple

from sqlalchemy import select, text, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.base import Repository
from app.models.klsi.norms import NormativeConversionTable


@dataclass(frozen=True, slots=True)
class NormativeConversionRow:
    norm_group: str
    norm_version: str | None
    scale_name: str
    raw_score: int
    percentile: float


@dataclass(slots=True, repr=True)
class NormativeConversionRepository(Repository[AsyncSession]):
    """Repository for normative conversion lookups."""

    def __post_init__(self) -> None:
        pass

    async def fetch_batch(
        self,
        norm_group: str,
        versions: Sequence[str],
        scale_to_raws: Mapping[str, Iterable[int]],
    ) -> List[NormativeConversionRow]:
        """Retrieve all rows matching the group, versions, and scale/raw pairs."""
        normalized_versions = list(dict.fromkeys(versions))
        if not normalized_versions:
            return []

        # Build OR-conditions for (scale, raw_score) pairs
        pair_conditions = []
        for scale, raws in scale_to_raws.items():
            unique_raws = sorted({int(r) for r in raws})
            if unique_raws:
                pair_conditions.append(
                    and_(
                        NormativeConversionTable.scale_name == scale,
                        NormativeConversionTable.raw_score.in_(unique_raws)
                    )
                )
        
        if not pair_conditions:
            return []

        stmt = (
            select(NormativeConversionTable)
            .where(NormativeConversionTable.norm_group == norm_group)
            .where(NormativeConversionTable.norm_version.in_(normalized_versions))
            .where(or_(*pair_conditions))
        )
        
        result = await self.db.execute(stmt)
        results = result.scalars().all()
        
        return [
            NormativeConversionRow(
                norm_group=row.norm_group,
                norm_version=row.norm_version,
                scale_name=row.scale_name,
                raw_score=row.raw_score,
                percentile=row.percentile,
            )
            for row in results
        ]

    async def fetch_one(
        self,
        norm_group: str,
        version: str,
        scale: str,
        raw: int,
    ) -> NormativeConversionRow | None:
        result = await self.db.execute(
            text(
                "SELECT percentile, norm_version, scale_name, raw_score, norm_group "
                "FROM normative_conversion_table "
                "WHERE norm_group=:g AND norm_version=:v AND scale_name=:s AND raw_score=:r "
                "LIMIT 1"
            ),
            {"g": norm_group, "v": version, "s": scale, "r": int(raw)},
        )
        row = result.fetchone()
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

    async def fetch_first_for_versions(
        self,
        norm_group: str,
        versions: Sequence[str],
        scale: str,
        raw: int,
    ) -> Tuple[NormativeConversionRow, str] | None:
        normalized_versions = list(dict.fromkeys(versions))
        if not normalized_versions:
            return None
        rows = await self.fetch_batch(norm_group, normalized_versions, {scale: [raw]})
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

    async def upsert(
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
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()
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

    async def fetch_all_entries(self) -> List[NormativeConversionRow]:
        """Return all normative conversion entries as lightweight rows."""
        stmt = select(
            NormativeConversionTable.norm_group,
            NormativeConversionTable.norm_version,
            NormativeConversionTable.scale_name,
            NormativeConversionTable.raw_score,
            NormativeConversionTable.percentile,
        )
        result = await self.db.execute(stmt)
        rows = result.all()
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

    async def fetch_scale_chunk(
        self,
        norm_group: str,
        version: str,
        scale_name: str,
        *,
        offset: int = 0,
        limit: int = 100,
    ) -> List[NormativeConversionRow]:
        """Fetch an ordered chunk of rows for a norm group/version/scale."""

        stmt = (
            select(
                NormativeConversionTable.norm_group,
                NormativeConversionTable.norm_version,
                NormativeConversionTable.scale_name,
                NormativeConversionTable.raw_score,
                NormativeConversionTable.percentile,
            )
            .where(NormativeConversionTable.norm_group == norm_group)
            .where(NormativeConversionTable.norm_version == version)
            .where(NormativeConversionTable.scale_name == scale_name)
            .order_by(NormativeConversionTable.raw_score.asc())
            .offset(max(0, offset))
            .limit(max(1, limit))
        )
        result = await self.db.execute(stmt)
        rows = result.all()
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
