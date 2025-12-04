from datetime import date, datetime, time
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Security

from app.db.database import get_db
from app.db.repositories import (
    ReliabilityRepository,
    ResearchStudyRepository,
    ValidityRepository,
)
from app.schemas.research import (
    ReliabilityCreate,
    ReliabilityOut,
    ResearchStudyCreate,
    ResearchStudyDataOut,
    ResearchStudyDataCursorOut,
    ResearchStudyOut,
    ResearchStudyUpdate,
    StudyDataFilter,
    ValidityCreate,
    ValidityOut,
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
    
    from app.services.research_service import ResearchService
    service = ResearchService(db)
    return service.create_study(payload, current_user)


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
    return study_repo.list_sync(skip, limit, q)


from app.utils.ids import decode_public_id

@router.get("/studies/{study_id}", response_model=ResearchStudyOut)
def get_study(
    study_id: str,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)
    
    internal_id = decode_public_id(study_id)
    study_repo = ResearchStudyRepository(db)
    study = study_repo.get_sync(internal_id)
    if not study:
        raise HTTPException(status_code=404, detail=ResearchMessages.NOT_FOUND)
    return study


@router.patch("/studies/{study_id}", response_model=ResearchStudyOut)
def update_study(
    study_id: str,
    payload: ResearchStudyUpdate,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)
    
    from app.services.research_service import ResearchService
    service = ResearchService(db)
    return service.update_study(study_id, payload, current_user)


@router.delete("/studies/{study_id}", response_model=dict)
def delete_study(
    study_id: str,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)
    
    from app.services.research_service import ResearchService
    service = ResearchService(db)
    service.delete_study(study_id, current_user)
    return {"ok": True}


@router.post("/studies/{study_id}/reliability", response_model=dict)
def add_reliability(
    study_id: str,
    payload: ReliabilityCreate,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)
    
    from app.services.research_service import ResearchService
    service = ResearchService(db)
    row = service.add_reliability(study_id, payload, current_user)
    return {"id": row.id, "metric_name": row.metric_name, "value": row.value}


@router.post("/studies/{study_id}/validity", response_model=dict)
def add_validity(
    study_id: str,
    payload: ValidityCreate,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)
    
    from app.services.research_service import ResearchService
    service = ResearchService(db)
    row = service.add_validity(study_id, payload, current_user)
    return {"id": row.id, "evidence_type": row.evidence_type}


@router.get("/studies/{study_id}/reliability", response_model=list[ReliabilityOut])
def list_reliability(
    study_id: str,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)
    
    internal_id = decode_public_id(study_id)
    repo = ReliabilityRepository(db)
    rows = repo.list_by_study_sync(internal_id)
    return [
        ReliabilityOut.model_validate(r)
        for r in rows
    ]


@router.get("/studies/{study_id}/validity", response_model=list[ValidityOut])
def list_validity(
    study_id: str,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)
    
    internal_id = decode_public_id(study_id)
    repo = ValidityRepository(db)
    rows = repo.list_by_study_sync(internal_id)
    return [
        ValidityOut.model_validate(r)
        for r in rows
    ]


@router.post("/studies/{study_id}/data", response_model=ResearchStudyDataOut | ResearchStudyDataCursorOut)
def get_study_data(
    study_id: str,
    filters: StudyDataFilter,
    db: Any = Depends(get_db),
    current_user: Any = Security(get_current_user, scopes=["research:read"]),
):
    require_mediator(current_user, AuthorizationMessages.MEDIATOR_REQUIRED)

    internal_id = decode_public_id(study_id)
    study_repo = ResearchStudyRepository(db)
    study = study_repo.get_sync(internal_id)
    if not study:
        raise HTTPException(status_code=404, detail=ResearchMessages.NOT_FOUND)
    
    start_at = filters.start_date
    end_at = filters.end_date
    
    service_filters = StudyDataFilters(
        start_at=start_at,
        end_at=end_at,
        learning_style=filters.learning_style,
        norm_group=filters.norm_group,
        page=filters.page,
        size=filters.size,
        cursor=filters.cursor,
    )
    
    if start_at and end_at and start_at > end_at:
        raise HTTPException(status_code=400, detail="Invalid date range")

    return build_study_dataset(db, study, service_filters)
