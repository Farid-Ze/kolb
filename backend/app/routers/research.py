from __future__ import annotations

from typing import Any, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.repositories import (
    ReliabilityRepository,
    ResearchStudyRepository,
    ValidityRepository,
)
from app.models.klsi.user import User
from app.schemas.research import (
    ReliabilityCreate,
    ResearchStudyCreate,
    ResearchStudyOut,
    ResearchStudyUpdate,
    ValidityCreate,
)
from app.core.logging import get_logger
from app.i18n.id_messages import AuthorizationMessages, ResearchMessages
from app.services.security import get_current_user

router = APIRouter(prefix="/research", tags=["research"])
logger = get_logger("kolb.routers.research", component="router")


def _log_db_failure(event: str, **structured: Any) -> None:
    logger.exception(event, extra={"structured_data": structured})


def _require_mediator(user: User) -> None:
    if user.role != "MEDIATOR":
        raise HTTPException(status_code=403, detail=AuthorizationMessages.MEDIATOR_REQUIRED)


@router.post("/studies", response_model=ResearchStudyOut)
def create_study(
    payload: ResearchStudyCreate,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    _require_mediator(user)
    study_repo = ResearchStudyRepository(db)
    try:
        study = study_repo.create(**payload.model_dump())
        db.commit()
        db.refresh(study)
    except Exception:
        db.rollback()
        _log_db_failure(
            "research_create_study_failed",
            user_id=user.id,
            title=payload.title,
        )
        raise
    return study


@router.get("/studies", response_model=List[ResearchStudyOut])
def list_studies(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    q: Optional[str] = Query(None),
):
    study_repo = ResearchStudyRepository(db)
    return study_repo.list(skip, limit, q)


@router.get("/studies/{study_id}", response_model=ResearchStudyOut)
def get_study(study_id: int, db: Session = Depends(get_db)):
    study_repo = ResearchStudyRepository(db)
    study = study_repo.get(study_id)
    if not study:
        raise HTTPException(status_code=404, detail=ResearchMessages.NOT_FOUND)
    return study


@router.patch("/studies/{study_id}", response_model=ResearchStudyOut)
def update_study(
    study_id: int,
    payload: ResearchStudyUpdate,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    _require_mediator(user)
    study_repo = ResearchStudyRepository(db)
    try:
        study = study_repo.get(study_id)
        if not study:
            raise HTTPException(status_code=404, detail=ResearchMessages.NOT_FOUND)
        data = payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(study, key, value)
        db.flush()
        db.commit()
        db.refresh(study)
    except Exception:
        db.rollback()
        _log_db_failure(
            "research_update_study_failed",
            study_id=study_id,
            user_id=user.id,
            payload_fields=list(payload.model_dump(exclude_unset=True).keys()),
        )
        raise
    return study


@router.delete("/studies/{study_id}", response_model=dict)
def delete_study(
    study_id: int,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    _require_mediator(user)
    study_repo = ResearchStudyRepository(db)
    reliability_repo = ReliabilityRepository(db)
    validity_repo = ValidityRepository(db)
    try:
        study = study_repo.get(study_id)
        if not study:
            raise HTTPException(status_code=404, detail=ResearchMessages.NOT_FOUND)
        rel_count = reliability_repo.count_by_study(study_id)
        val_count = validity_repo.count_by_study(study_id)
        if rel_count > 0 or val_count > 0:
            raise HTTPException(
                status_code=409,
                detail=ResearchMessages.REMOVE_EVIDENCE_FIRST,
            )
        study_repo.delete(study)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        _log_db_failure(
            "research_delete_study_failed",
            study_id=study_id,
            user_id=user.id,
        )
        raise
    return {"ok": True}


@router.post("/studies/{study_id}/reliability", response_model=dict)
def add_reliability(
    study_id: int,
    payload: ReliabilityCreate,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    _require_mediator(user)
    study_repo = ResearchStudyRepository(db)
    reliability_repo = ReliabilityRepository(db)
    try:
        study = study_repo.get(study_id)
        if not study:
            raise HTTPException(status_code=404, detail=ResearchMessages.NOT_FOUND)
        row = reliability_repo.add(study_id, **payload.model_dump())
        db.commit()
        db.refresh(row)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        _log_db_failure(
            "research_add_reliability_failed",
            study_id=study_id,
            user_id=user.id,
            metric_name=payload.metric_name,
        )
        raise
    return {"id": row.id, "metric_name": row.metric_name, "value": row.value}


@router.post("/studies/{study_id}/validity", response_model=dict)
def add_validity(
    study_id: int,
    payload: ValidityCreate,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    _require_mediator(user)
    study_repo = ResearchStudyRepository(db)
    validity_repo = ValidityRepository(db)
    try:
        study = study_repo.get(study_id)
        if not study:
            raise HTTPException(status_code=404, detail=ResearchMessages.NOT_FOUND)
        row = validity_repo.add(study_id, **payload.model_dump())
        db.commit()
        db.refresh(row)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        _log_db_failure(
            "research_add_validity_failed",
            study_id=study_id,
            user_id=user.id,
            evidence_type=payload.evidence_type,
        )
        raise
    return {"id": row.id, "evidence_type": row.evidence_type}


@router.get("/studies/{study_id}/reliability", response_model=list[dict])
def list_reliability(study_id: int, db: Session = Depends(get_db)):
    repo = ReliabilityRepository(db)
    rows = repo.list_by_study(study_id)
    return [
        {"id": r.id, "metric_name": r.metric_name, "value": r.value, "notes": r.notes}
        for r in rows
    ]


@router.get("/studies/{study_id}/validity", response_model=list[dict])
def list_validity(study_id: int, db: Session = Depends(get_db)):
    repo = ValidityRepository(db)
    rows = repo.list_by_study(study_id)
    return [
        {
            "id": r.id,
            "evidence_type": r.evidence_type,
            "metric_name": r.metric_name,
            "value": r.value,
            "description": r.description,
        }
        for r in rows
    ]
