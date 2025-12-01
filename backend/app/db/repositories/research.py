from dataclasses import dataclass
from typing import List, Optional, Union, cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.db.repositories.base import Repository
from app.models.klsi.research import ReliabilityResult, ResearchStudy, ValidityEvidence


@dataclass
class ResearchStudyRepository(Repository[Union[AsyncSession, Session]]):
    """Repository for research study CRUD operations."""

    async def create(self, **data) -> ResearchStudy:
        db = cast(AsyncSession, self.db)
        study = ResearchStudy(**data)
        db.add(study)
        await db.flush()
        await db.refresh(study)
        return study

    def create_sync(self, **data) -> ResearchStudy:
        """Create a research study - Sync version."""
        db = cast(Session, self.db)
        study = ResearchStudy(**data)
        db.add(study)
        db.flush()
        db.refresh(study)
        return study

    async def list(self, skip: int, limit: int, query: Optional[str]) -> List[ResearchStudy]:
        db = cast(AsyncSession, self.db)
        stmt = select(ResearchStudy)
        if query:
            like = f"%{query}%"
            stmt = stmt.filter(ResearchStudy.title.ilike(like))
        stmt = stmt.order_by(ResearchStudy.id.desc()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    def list_sync(self, skip: int, limit: int, query: Optional[str]) -> List[ResearchStudy]:
        """List research studies - Sync version."""
        db = cast(Session, self.db)
        stmt = select(ResearchStudy)
        if query:
            like = f"%{query}%"
            stmt = stmt.filter(ResearchStudy.title.ilike(like))
        stmt = stmt.order_by(ResearchStudy.id.desc()).offset(skip).limit(limit)
        result = db.execute(stmt)
        return list(result.scalars().all())

    async def get(self, study_id: int) -> Optional[ResearchStudy]:
        db = cast(AsyncSession, self.db)
        result = await db.execute(
            select(ResearchStudy).filter(ResearchStudy.id == study_id)
        )
        return result.scalars().first()

    def get_sync(self, study_id: int) -> Optional[ResearchStudy]:
        """Get a research study - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
            select(ResearchStudy).filter(ResearchStudy.id == study_id)
        )
        return result.scalars().first()

    async def delete(self, study: ResearchStudy) -> None:
        db = cast(AsyncSession, self.db)
        await db.delete(study)

    def delete_sync(self, study: ResearchStudy) -> None:
        """Delete a research study - Sync version."""
        db = cast(Session, self.db)
        db.delete(study)


@dataclass
class ReliabilityRepository(Repository[Union[AsyncSession, Session]]):
    """Repository for reliability results linked to studies."""

    async def count_by_study(self, study_id: int) -> int:
        db = cast(AsyncSession, self.db)
        from sqlalchemy import func
        stmt = select(func.count()).select_from(ReliabilityResult).filter(
            ReliabilityResult.study_id == study_id
        )
        result = await db.execute(stmt)
        return result.scalar() or 0

    def count_by_study_sync(self, study_id: int) -> int:
        """Count reliability results for a study - Sync version."""
        db = cast(Session, self.db)
        from sqlalchemy import func
        stmt = select(func.count()).select_from(ReliabilityResult).filter(
            ReliabilityResult.study_id == study_id
        )
        result = db.execute(stmt)
        return result.scalar() or 0

    async def add(self, study_id: int, **data) -> ReliabilityResult:
        db = cast(AsyncSession, self.db)
        row = ReliabilityResult(study_id=study_id, **data)
        db.add(row)
        await db.flush()
        await db.refresh(row)
        return row

    def add_sync(self, study_id: int, **data) -> ReliabilityResult:
        """Add a reliability result - Sync version."""
        db = cast(Session, self.db)
        row = ReliabilityResult(study_id=study_id, **data)
        db.add(row)
        db.flush()
        db.refresh(row)
        return row

    async def list_by_study(self, study_id: int) -> List[ReliabilityResult]:
        db = cast(AsyncSession, self.db)
        result = await db.execute(
            select(ReliabilityResult).filter(ReliabilityResult.study_id == study_id)
        )
        return list(result.scalars().all())

    def list_by_study_sync(self, study_id: int) -> List[ReliabilityResult]:
        """List reliability results for a study - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
            select(ReliabilityResult).filter(ReliabilityResult.study_id == study_id)
        )
        return list(result.scalars().all())


@dataclass
class ValidityRepository(Repository[Union[AsyncSession, Session]]):
    """Repository for validity evidence records."""

    async def count_by_study(self, study_id: int) -> int:
        db = cast(AsyncSession, self.db)
        from sqlalchemy import func
        stmt = select(func.count()).select_from(ValidityEvidence).filter(
            ValidityEvidence.study_id == study_id
        )
        result = await db.execute(stmt)
        return result.scalar() or 0

    def count_by_study_sync(self, study_id: int) -> int:
        """Count validity evidence for a study - Sync version."""
        db = cast(Session, self.db)
        from sqlalchemy import func
        stmt = select(func.count()).select_from(ValidityEvidence).filter(
            ValidityEvidence.study_id == study_id
        )
        result = db.execute(stmt)
        return result.scalar() or 0

    async def add(self, study_id: int, **data) -> ValidityEvidence:
        db = cast(AsyncSession, self.db)
        row = ValidityEvidence(study_id=study_id, **data)
        db.add(row)
        await db.flush()
        await db.refresh(row)
        return row

    def add_sync(self, study_id: int, **data) -> ValidityEvidence:
        """Add validity evidence - Sync version."""
        db = cast(Session, self.db)
        row = ValidityEvidence(study_id=study_id, **data)
        db.add(row)
        db.flush()
        db.refresh(row)
        return row

    async def list_by_study(self, study_id: int) -> List[ValidityEvidence]:
        db = cast(AsyncSession, self.db)
        result = await db.execute(
            select(ValidityEvidence).filter(ValidityEvidence.study_id == study_id)
        )
        return list(result.scalars().all())

    def list_by_study_sync(self, study_id: int) -> List[ValidityEvidence]:
        """List validity evidence for a study - Sync version."""
        db = cast(Session, self.db)
        result = db.execute(
            select(ValidityEvidence).filter(ValidityEvidence.study_id == study_id)
        )
        return list(result.scalars().all())
