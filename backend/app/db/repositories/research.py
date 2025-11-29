from dataclasses import dataclass
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.base import Repository
from app.models.klsi.research import ReliabilityResult, ResearchStudy, ValidityEvidence


@dataclass
class ResearchStudyRepository(Repository[AsyncSession]):
    """Repository for research study CRUD operations."""

    async def create(self, **data) -> ResearchStudy:
        study = ResearchStudy(**data)
        self.db.add(study)
        await self.db.flush()
        await self.db.refresh(study)
        return study

    async def list(self, skip: int, limit: int, query: Optional[str]) -> List[ResearchStudy]:
        stmt = select(ResearchStudy)
        if query:
            like = f"%{query}%"
            stmt = stmt.filter(ResearchStudy.title.ilike(like))
        stmt = stmt.order_by(ResearchStudy.id.desc()).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get(self, study_id: int) -> Optional[ResearchStudy]:
        result = await self.db.execute(
            select(ResearchStudy).filter(ResearchStudy.id == study_id)
        )
        return result.scalars().first()

    async def delete(self, study: ResearchStudy) -> None:
        await self.db.delete(study)


@dataclass
class ReliabilityRepository(Repository[AsyncSession]):
    """Repository for reliability results linked to studies."""

    async def count_by_study(self, study_id: int) -> int:
        from sqlalchemy import func
        stmt = select(func.count()).select_from(ReliabilityResult).filter(
            ReliabilityResult.study_id == study_id
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def add(self, study_id: int, **data) -> ReliabilityResult:
        row = ReliabilityResult(study_id=study_id, **data)
        self.db.add(row)
        await self.db.flush()
        await self.db.refresh(row)
        return row

    async def list_by_study(self, study_id: int) -> List[ReliabilityResult]:
        result = await self.db.execute(
            select(ReliabilityResult).filter(ReliabilityResult.study_id == study_id)
        )
        return list(result.scalars().all())


@dataclass
class ValidityRepository(Repository[AsyncSession]):
    """Repository for validity evidence records."""

    async def count_by_study(self, study_id: int) -> int:
        from sqlalchemy import func
        stmt = select(func.count()).select_from(ValidityEvidence).filter(
            ValidityEvidence.study_id == study_id
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def add(self, study_id: int, **data) -> ValidityEvidence:
        row = ValidityEvidence(study_id=study_id, **data)
        self.db.add(row)
        await self.db.flush()
        await self.db.refresh(row)
        return row

    async def list_by_study(self, study_id: int) -> List[ValidityEvidence]:
        result = await self.db.execute(
            select(ValidityEvidence).filter(ValidityEvidence.study_id == study_id)
        )
        return list(result.scalars().all())
