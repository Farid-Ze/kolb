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
from app.services.rollup import get_team_rollup_snapshot, compute_team_rollup
from app.services.security import get_current_user

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
    
    repo = TeamRepository(db)
    try:
        existing = repo.find_by_name(payload.name)
        if existing:
            raise HTTPException(status_code=409, detail=TeamMessages.NAME_EXISTS)
        team = repo.create(payload.name, payload.kelas, payload.description)
        db.commit()
        db.refresh(team)
        return team
    except SQLAlchemyError:
        db.rollback()
        _log_db_failure(
            "teams_create_failed",
            user_id=current_user.id,
            team_name=payload.name,
        )
        raise


@router.get("/", response_model=TeamListResponse)
def list_teams(
    db: Any = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    q: Optional[str] = Query(None),
):
    repo = TeamRepository(db)
    skip = (page - 1) * size
    items = repo.list(skip, size, q)
    total = repo.count(q)
    
    import math
    pages = math.ceil(total / size) if size > 0 else 0
    
    return TeamListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{team_id}", response_model=TeamOut)
def get_team(team_id: int, db: Any = Depends(get_db)):
    repo = TeamRepository(db)
    team = repo.get(team_id)
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
    
    repo = TeamRepository(db)
    try:
        team = repo.get(team_id)
        if not team:
            raise HTTPException(status_code=404, detail=TeamMessages.NOT_FOUND)
        if payload.name and payload.name != team.name:
            existing = repo.find_by_name(payload.name)
            if existing and existing.id != team_id:
                raise HTTPException(status_code=409, detail=TeamMessages.NAME_EXISTS)
            team.name = payload.name
        if payload.kelas is not None:
            team.kelas = payload.kelas
        if payload.description is not None:
            team.description = payload.description
        db.flush()
        db.commit()
        db.refresh(team)
        return team
    except SQLAlchemyError:
        db.rollback()
        _log_db_failure(
            "teams_update_failed",
            team_id=team_id,
            user_id=current_user.id,
            updated_fields=list(payload.model_dump(exclude_unset=True).keys()),
        )
        raise


@router.delete("/{team_id}", response_model=dict)
def delete_team(
    team_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    _require_mediator(current_user)
    
    team_repo = TeamRepository(db)
    member_repo = TeamMemberRepository(db)
    rollup_repo = TeamRollupRepository(db)
    members_count: Optional[int] = None
    rollup_count: Optional[int] = None
    try:
        team = team_repo.get(team_id)
        if not team:
            raise HTTPException(status_code=404, detail=TeamMessages.NOT_FOUND)
        members_count = member_repo.count_by_team(team_id)
        rollup_count = rollup_repo.count_by_team(team_id)
        if members_count > 0 or rollup_count > 0:
            raise HTTPException(status_code=409, detail=TeamMessages.REMOVE_DEPENDENCIES_FIRST)
        team_repo.delete(team)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        _log_db_failure(
            "teams_delete_failed",
            team_id=team_id,
            user_id=current_user.id,
            members_count=members_count,
            rollup_count=rollup_count,
        )
        raise
    return {"ok": True}


@router.get("/{team_id}/members", response_model=list[TeamMemberOut])
def list_members(team_id: int, db: Any = Depends(get_db)):
    repo = TeamMemberRepository(db)
    return repo.list_by_team(team_id)


@router.post("/{team_id}/members", response_model=TeamMemberOut)
def add_member(
    team_id: int,
    payload: TeamMemberAdd,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    _require_mediator(current_user)
    
    repo = TeamMemberRepository(db)
    user_repo = UserRepository(db)
    try:
        user = user_repo.get_by_email(payload.email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        if repo.exists(team_id, user.id):
            raise HTTPException(status_code=409, detail=TeamMessages.MEMBER_EXISTS)
        tm = repo.add(team_id, user.id, payload.role_in_team)
        db.commit()
        db.refresh(tm)
        return tm
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        _log_db_failure(
            "teams_add_member_failed",
            team_id=team_id,
            user_id=current_user.id,
            member_email=payload.email,
        )
        raise


@router.delete("/{team_id}/members/{member_id}", response_model=dict)
def remove_member(
    team_id: int,
    member_id: int,
    db: Any = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    _require_mediator(current_user)
    
    repo = TeamMemberRepository(db)
    try:
        tm = repo.get(team_id, member_id)
        if not tm:
            raise HTTPException(status_code=404, detail=TeamMessages.MEMBER_NOT_FOUND)
        repo.delete(tm)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        _log_db_failure(
            "teams_remove_member_failed",
            team_id=team_id,
            user_id=current_user.id,
            member_id=member_id,
        )
        raise
    return {"ok": True}


@router.get("/{team_id}/rollups", response_model=list[TeamRollupOut])
def list_rollups(team_id: int, db: Any = Depends(get_db)):
    repo = TeamRollupRepository(db)
    return repo.list_by_team(team_id)


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
    team = team_repo.get(team_id)
    if not team:
        raise HTTPException(status_code=404, detail=TeamMessages.NOT_FOUND)

    analytics_repo = TeamAnalyticsRepository(db)
    skip = (page - 1) * size
    items, total = analytics_repo.fetch_paginated_member_points(team_id, skip=skip, limit=size)
    
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
    try:
        roll = compute_team_rollup(db, team_id=team_id, for_date=d)
        db.commit()
        db.refresh(roll)
        return roll
    except SQLAlchemyError:
        db.rollback()
        _log_db_failure(
            "teams_run_rollup_failed",
            team_id=team_id,
            user_id=current_user.id,
            for_date=for_date,
        )
        raise
