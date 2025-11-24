from datetime import date, datetime, time
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query

from app.db.database import get_db
from app.db.repositories import (
    ReliabilityRepository,
    ResearchStudyRepository,
    ValidityRepository,
)
from app.schemas.research import (
    ReliabilityCreate,
    ResearchStudyCreate,
    ResearchStudyDataOut,
    ResearchStudyOut,
    ResearchStudyUpdate,
    ValidityCreate,
)
from app.core.logging import get_logger
from app.i18n.id_messages import AuthorizationMessages, ResearchMessages
from app.services.research import StudyDataFilters, build_study_dataset
from app.services.security import get_current_user, require_mediator

router = APIRouter(prefix="/research", tags=["research"])
logger = get_logger("kolb.routers.research", component="router")


def _log_db_failure(event: str, *, user: Any, operation: str, **structured: Any) -> None:
    payload = {
        "user_id": user.id,
        "user_email": user.email,
        "operation": operation,
    }
    payload.update(structured)
    logger.exception(event, extra={"structured_data": payload})


def _start_of_day(value: Optional[date]) -> Optional[datetime]:
    if value is None:
        return None
    return datetime.combine(value, time.min)


def _end_of_day(value: Optional[date]) -> Optional[datetime]:
    if value is None:
        return None
    return datetime.combine(value, time.max)


@router.post("/studies", response_model=ResearchStudyOut)
def create_study(
    payload: ResearchStudyCreate,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)

    study_repo = ResearchStudyRepository(db)
    try:
        study = study_repo.create(**payload.model_dump())
        db.commit()
        db.refresh(study)
        return study
    except Exception:
        db.rollback()
        _log_db_failure(
            "research_create_study_failed",
            user=current_user,
            operation="research_create_study",
            title=payload.title,
        )
        raise


@router.get("/studies", response_model=List[ResearchStudyOut])
def list_studies(
    db: Any = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    q: Optional[str] = Query(None),
    current_user: Any = Depends(get_current_user),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)

    study_repo = ResearchStudyRepository(db)
    return study_repo.list(skip, limit, q)


@router.get("/studies/{study_id}", response_model=ResearchStudyOut)
def get_study(
    study_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)

    study_repo = ResearchStudyRepository(db)
    study = study_repo.get(study_id)
    if not study:
        raise HTTPException(status_code=404, detail=ResearchMessages.NOT_FOUND)
    return study


@router.patch("/studies/{study_id}", response_model=ResearchStudyOut)
def update_study(
    study_id: int,
    payload: ResearchStudyUpdate,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)

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
        return study
    except Exception:
        db.rollback()
        _log_db_failure(
            "research_update_study_failed",
            user=current_user,
            operation="research_update_study",
            study_id=study_id,
            payload_fields=list(payload.model_dump(exclude_unset=True).keys()),
        )
        raise


@router.delete("/studies/{study_id}", response_model=dict)
def delete_study(
    study_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)

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
            user=current_user,
            operation="research_delete_study",
            study_id=study_id,
        )
        raise
    return {"ok": True}


@router.post("/studies/{study_id}/reliability", response_model=dict)
def add_reliability(
    study_id: int,
    payload: ReliabilityCreate,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)

    study_repo = ResearchStudyRepository(db)
    reliability_repo = ReliabilityRepository(db)
    try:
        study = study_repo.get(study_id)
        if not study:
            raise HTTPException(status_code=404, detail=ResearchMessages.NOT_FOUND)
        row = reliability_repo.add(study_id, **payload.model_dump())
        db.commit()
        db.refresh(row)
        return {"id": row.id, "metric_name": row.metric_name, "value": row.value}
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        _log_db_failure(
            "research_add_reliability_failed",
            user=current_user,
            operation="research_add_reliability",
            study_id=study_id,
            metric_name=payload.metric_name,
        )
        raise


@router.post("/studies/{study_id}/validity", response_model=dict)
def add_validity(
    study_id: int,
    payload: ValidityCreate,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)

    study_repo = ResearchStudyRepository(db)
    validity_repo = ValidityRepository(db)
    try:
        study = study_repo.get(study_id)
        if not study:
            raise HTTPException(status_code=404, detail=ResearchMessages.NOT_FOUND)
        row = validity_repo.add(study_id, **payload.model_dump())
        db.commit()
        db.refresh(row)
        return {"id": row.id, "evidence_type": row.evidence_type}
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        _log_db_failure(
            "research_add_validity_failed",
            user=current_user,
            operation="research_add_validity",
            study_id=study_id,
            evidence_type=payload.evidence_type,
        )
        raise


@router.get("/studies/{study_id}/reliability", response_model=list[dict])
def list_reliability(
    study_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)

    repo = ReliabilityRepository(db)
    rows = repo.list_by_study(study_id)
    return [
        {"id": r.id, "metric_name": r.metric_name, "value": r.value, "notes": r.notes}
        for r in rows
    ]


@router.get("/studies/{study_id}/validity", response_model=list[dict])
def list_validity(
    study_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)

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


@router.get("/studies/{study_id}/data", response_model=ResearchStudyDataOut)
def get_study_data(
    study_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    learning_style: Optional[str] = Query(default=None),
    norm_group: Optional[str] = Query(default=None),
    user_email: Optional[str] = Query(default=None),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)

    study_repo = ResearchStudyRepository(db)
    study = study_repo.get(study_id)
    if not study:
        raise HTTPException(status_code=404, detail=ResearchMessages.NOT_FOUND)
    start_at = _start_of_day(start_date)
    end_at = _end_of_day(end_date)
    if start_at and end_at and start_at > end_at:
        raise HTTPException(status_code=400, detail="Invalid date range")
    filters = StudyDataFilters(
        start_at=start_at,
        end_at=end_at,
        learning_style=learning_style,
        norm_group=norm_group,
        user_email=user_email,
    )
    return build_study_dataset(db, study, filters)
