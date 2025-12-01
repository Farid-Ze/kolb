from datetime import date
from typing import Any, Optional, TYPE_CHECKING
from sqlalchemy.exc import SQLAlchemyError

from fastapi import APIRouter, Depends, Header, HTTPException, Query

if TYPE_CHECKING:
    import sqlalchemy.orm

from app.core.logging import get_logger
from app.db.database import get_db
from app.db.repositories import (
    TeamMemberRepository,
    TeamRepository,
    TeamRollupRepository,
)
# [Correctness Fix] Import missing classes
from app.db.repositories.team import TeamAnalyticsRepository
from app.db.repositories.user import UserRepository
from app.schemas.team import (
    TeamCreate,
    TeamMemberAdd,
    TeamMemberOut,
    TeamOut,
    TeamRollupDetail,
    TeamRollupOut,
    TeamUpdate,
    TeamMemberAnalyticsResponse,
    TeamListResponse,
    TeamRollupMemberOut,
)
from app.i18n.id_messages import AuthorizationMessages, TeamMessages
from app.services.rollup import get_team_rollup_snapshot
from app.services.security import get_current_user
from app.services.team_service import TeamService

router = APIRouter(prefix="/teams", tags=["teams"])
logger = get_logger("kolb.routers.teams", component="router")

def _require_mediator(user: Any):
    if user.role != 'MEDIATOR':
        raise HTTPException(status_code=403, detail=AuthorizationMessages.MEDIATOR_REQUIRED)


def _log_db_failure(event: str, **structured: Any) -> None:
    logger.exception(event, extra={"structured_data": structured})


@router.post("/", response_model=TeamOut)
def create_team(
    payload: TeamCreate,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    _require_mediator(current_user)
    service = TeamService(db)
    return service.create_team(payload, current_user.id)


@router.get("/", response_model=TeamListResponse)
def list_teams(
    db: Any = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    q: Optional[str] = Query(None),
):
    repo = TeamRepository(db)
    skip = (page - 1) * size
    items = repo.list_sync(skip, size, q)
    total = repo.count_sync(q)
    
    import math
    pages = math.ceil(total / size) if size > 0 else 0
    
    return TeamListResponse(
        items=[TeamOut.model_validate(item) for item in items],
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{team_id}", response_model=TeamOut)
def get_team(team_id: int, db: Any = Depends(get_db)):
    repo = TeamRepository(db)
    team = repo.get_sync(team_id)
    if not team:
        raise HTTPException(status_code=404, detail=TeamMessages.NOT_FOUND)
    return team


@router.patch("/{team_id}", response_model=TeamOut)
def update_team(
    team_id: int,
    payload: TeamUpdate,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    _require_mediator(current_user)
    service = TeamService(db)
    return service.update_team(team_id, payload, current_user.id)


@router.delete("/{team_id}", response_model=dict)
def delete_team(
    team_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    _require_mediator(current_user)
    service = TeamService(db)
    service.delete_team(team_id, current_user.id)
    return {"ok": True}


@router.get("/{team_id}/members", response_model=list[TeamMemberOut])
def list_members(team_id: int, db: Any = Depends(get_db)):
    repo = TeamMemberRepository(db)
    return repo.list_by_team_sync(team_id)


@router.post("/{team_id}/members", response_model=TeamMemberOut)
def add_member(
    team_id: int,
    payload: TeamMemberAdd,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    _require_mediator(current_user)
    service = TeamService(db)
    return service.add_member(team_id, payload.email, payload.role_in_team, current_user.id)


@router.delete("/{team_id}/members/{member_id}", response_model=dict)
def remove_member(
    team_id: int,
    member_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    _require_mediator(current_user)
    service = TeamService(db)
    service.remove_member(team_id, member_id, current_user.id)
    return {"ok": True}


@router.get("/{team_id}/rollups", response_model=list[TeamRollupOut])
def list_rollups(team_id: int, db: Any = Depends(get_db)):
    repo = TeamRollupRepository(db)
    return repo.list_by_team_sync(team_id)


@router.get("/{team_id}/rollup", response_model=TeamRollupDetail)
def get_rollup(team_id: int, db: Any = Depends(get_db)):
    try:
        return get_team_rollup_snapshot(db, team_id)
    except ValueError:
        raise HTTPException(status_code=404, detail=TeamMessages.NOT_FOUND) from None


@router.get("/{team_id}/analytics/members", response_model=TeamMemberAnalyticsResponse)
def get_rollup_members(
    team_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
):
    _require_mediator(current_user)
    
    # Check team existence
    team_repo = TeamRepository(db)
    team = team_repo.get_sync(team_id)
    if not team:
        raise HTTPException(status_code=404, detail=TeamMessages.NOT_FOUND)

    analytics_repo = TeamAnalyticsRepository(db)
    skip = (page - 1) * size
    items, total = analytics_repo.fetch_paginated_member_points_sync(team_id, skip=skip, limit=size)
    
    # Map dataclass to Pydantic model
    mapped_items = [
        TeamRollupMemberOut(
            user_id=item.user_id,
            name=item.name,
            email=item.email,
            session_id=item.session_id,
            generated_at=item.completed_at,
            ac_ce=item.ac_ce,
            ae_ro=item.ae_ro,
            learning_style=item.learning_style,
            style_code=item.style_code,
            raw_scores=item.raw_scores,
            dialectic_scores={"ACCE": item.ac_ce, "AERO": item.ae_ro} if item.ac_ce is not None else None
        )
        for item in items
    ]
    
    import math
    pages = math.ceil(total / size) if size > 0 else 0
    
    return TeamMemberAnalyticsResponse(
        items=mapped_items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.post("/{team_id}/rollups", response_model=TeamRollupOut)
def create_rollup(
    team_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    for_date: Optional[str] = Query(default=None, description="YYYY-MM-DD optional date filter"),
):
    """Create a new rollup snapshot for the team."""
    return run_rollup(team_id, db, current_user, for_date)


@router.post("/{team_id}/rollup/run", response_model=TeamRollupOut, deprecated=True)
def run_rollup(
    team_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    for_date: Optional[str] = Query(default=None, description="YYYY-MM-DD optional date filter"),
):
    _require_mediator(current_user)
    
    d: Optional[date] = None
    if for_date:
        try:
            d = date.fromisoformat(for_date)
        except ValueError:
            raise HTTPException(status_code=400, detail=TeamMessages.INVALID_DATE_FORMAT) from None
    
    service = TeamService(db)
    return service.run_rollup(team_id, d, current_user.id)
