from typing import Any, Dict, Optional
from fastapi import HTTPException

from app.db.repositories import (
    ReliabilityRepository,
    ResearchStudyRepository,
    ValidityRepository,
)
from app.schemas.research import (
    ReliabilityCreate,
    ResearchStudyCreate,
    ResearchStudyUpdate,
    ValidityCreate,
)
from app.core.logging import get_logger
from app.i18n.id_messages import ResearchMessages
from app.utils.ids import decode_public_id

logger = get_logger("kolb.services.research", component="service")

class ResearchService:
    def __init__(self, db: Any):
        self.db = db
        self.study_repo = ResearchStudyRepository(db)
        self.reliability_repo = ReliabilityRepository(db)
        self.validity_repo = ValidityRepository(db)

    def create_study(self, payload: ResearchStudyCreate, user: Any) -> Any:
        try:
            study = self.study_repo.create_sync(**payload.model_dump())
            self.db.commit()
            self.db.refresh(study)
            return study
        except Exception:
            self.db.rollback()
            logger.exception(
                "research_create_study_failed",
                extra={"structured_data": {
                    "user_id": user.id,
                    "user_email": user.email,
                    "operation": "research_create_study",
                    "title": payload.title,
                }}
            )
            raise

    def update_study(self, study_id: str, payload: ResearchStudyUpdate, user: Any) -> Any:
        internal_id = decode_public_id(study_id)
        try:
            study = self.study_repo.get_sync(internal_id)
            if not study:
                raise HTTPException(status_code=404, detail=ResearchMessages.NOT_FOUND)
            
            data = payload.model_dump(exclude_unset=True)
            for key, value in data.items():
                setattr(study, key, value)
            
            self.db.flush()
            self.db.commit()
            self.db.refresh(study)
            return study
        except Exception:
            self.db.rollback()
            logger.exception(
                "research_update_study_failed",
                extra={"structured_data": {
                    "user_id": user.id,
                    "user_email": user.email,
                    "operation": "research_update_study",
                    "study_id": internal_id,
                    "payload_fields": list(payload.model_dump(exclude_unset=True).keys()),
                }}
            )
            raise

    def delete_study(self, study_id: str, user: Any) -> None:
        internal_id = decode_public_id(study_id)
        try:
            study = self.study_repo.get_sync(internal_id)
            if not study:
                raise HTTPException(status_code=404, detail=ResearchMessages.NOT_FOUND)
            
            rel_count = self.reliability_repo.count_by_study_sync(internal_id)
            val_count = self.validity_repo.count_by_study_sync(internal_id)
            
            if rel_count > 0 or val_count > 0:
                raise HTTPException(
                    status_code=409,
                    detail=ResearchMessages.REMOVE_EVIDENCE_FIRST,
                )
            
            self.study_repo.delete_sync(study)
            self.db.commit()
        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            logger.exception(
                "research_delete_study_failed",
                extra={"structured_data": {
                    "user_id": user.id,
                    "user_email": user.email,
                    "operation": "research_delete_study",
                    "study_id": internal_id,
                }}
            )
            raise

    def add_reliability(self, study_id: str, payload: ReliabilityCreate, user: Any) -> Any:
        internal_id = decode_public_id(study_id)
        try:
            study = self.study_repo.get_sync(internal_id)
            if not study:
                raise HTTPException(status_code=404, detail=ResearchMessages.NOT_FOUND)
            
            row = self.reliability_repo.add_sync(internal_id, **payload.model_dump())
            self.db.commit()
            self.db.refresh(row)
            return row
        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            logger.exception(
                "research_add_reliability_failed",
                extra={"structured_data": {
                    "user_id": user.id,
                    "user_email": user.email,
                    "operation": "research_add_reliability",
                    "study_id": internal_id,
                    "metric_name": payload.metric_name,
                }}
            )
            raise

    def add_validity(self, study_id: str, payload: ValidityCreate, user: Any) -> Any:
        internal_id = decode_public_id(study_id)
        try:
            study = self.study_repo.get_sync(internal_id)
            if not study:
                raise HTTPException(status_code=404, detail=ResearchMessages.NOT_FOUND)
            
            row = self.validity_repo.add_sync(internal_id, **payload.model_dump())
            self.db.commit()
            self.db.refresh(row)
            return row
        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            logger.exception(
                "research_add_validity_failed",
                extra={"structured_data": {
                    "user_id": user.id,
                    "user_email": user.email,
                    "operation": "research_add_validity",
                    "study_id": internal_id,
                    "evidence_type": payload.evidence_type,
                }}
            )
            raise
