from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

from sqlalchemy.orm import Session

from app.db.repositories.base import Repository
from app.models.klsi import ReliabilityResult, ResearchStudy, ValidityEvidence


@dataclass
class ResearchStudyRepository(Repository[Session]):
    """Repository for research study CRUD operations."""

    def create(self, **data) -> ResearchStudy:
        study = ResearchStudy(**data)
        self.db.add(study)
        self.db.flush()
        self.db.refresh(study)
        return study

    def list(self, skip: int, limit: int, query: Optional[str]) -> List[ResearchStudy]:
        q = self.db.query(ResearchStudy)
        if query:
            like = f"%{query}%"
            q = q.filter(ResearchStudy.title.ilike(like))
        return (
            q.order_by(ResearchStudy.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get(self, study_id: int) -> Optional[ResearchStudy]:
        return (
            self.db.query(ResearchStudy)
            .filter(ResearchStudy.id == study_id)
            .first()
        )

    def delete(self, study: ResearchStudy) -> None:
        self.db.delete(study)


@dataclass
class ReliabilityRepository(Repository[Session]):
    """Repository for reliability results linked to studies."""

    def count_by_study(self, study_id: int) -> int:
        return (
            self.db.query(ReliabilityResult)
            .filter(ReliabilityResult.study_id == study_id)
            .count()
        )

    def add(self, study_id: int, **data) -> ReliabilityResult:
        row = ReliabilityResult(study_id=study_id, **data)
        self.db.add(row)
        self.db.flush()
        self.db.refresh(row)
        return row

    def list_by_study(self, study_id: int) -> List[ReliabilityResult]:
        return (
            self.db.query(ReliabilityResult)
            .filter(ReliabilityResult.study_id == study_id)
            .all()
        )


@dataclass
class ValidityRepository(Repository[Session]):
    """Repository for validity evidence records."""

    def count_by_study(self, study_id: int) -> int:
        return (
            self.db.query(ValidityEvidence)
            .filter(ValidityEvidence.study_id == study_id)
            .count()
        )

    def add(self, study_id: int, **data) -> ValidityEvidence:
        row = ValidityEvidence(study_id=study_id, **data)
        self.db.add(row)
        self.db.flush()
        self.db.refresh(row)
        return row

    def list_by_study(self, study_id: int) -> List[ValidityEvidence]:
        return (
            self.db.query(ValidityEvidence)
            .filter(ValidityEvidence.study_id == study_id)
            .all()
        )
