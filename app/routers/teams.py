from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.repositories import (
    TeamMemberRepository,
    TeamRepository,
    TeamRollupRepository,
)
from app.models.klsi.user import User
from app.schemas.team import (
    TeamCreate,
    TeamMemberAdd,
    TeamMemberOut,
    TeamOut,
    TeamRollupOut,
    TeamUpdate,
)
from app.services.rollup import compute_team_rollup
from app.services.security import get_current_user

router = APIRouter(prefix="/teams", tags=["teams"])

def _require_mediator(user: User):
    if user.role != 'MEDIATOR':
        raise HTTPException(status_code=403, detail="Hanya MEDIATOR yang diperbolehkan")


@router.post("/", response_model=TeamOut)
def create_team(
    payload: TeamCreate,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    _require_mediator(user)
    repo = TeamRepository(db)
    try:
        existing = repo.find_by_name(payload.name)
        if existing:
            raise HTTPException(status_code=409, detail="Nama tim sudah digunakan")
        team = repo.create(payload.name, payload.kelas, payload.description)
        db.commit()
        db.refresh(team)
    except Exception:
        db.rollback()
        raise
    return team


@router.get("/", response_model=list[TeamOut])
def list_teams(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    q: Optional[str] = Query(None),
):
    repo = TeamRepository(db)
    return repo.list(skip, limit, q)


@router.get("/{team_id}", response_model=TeamOut)
def get_team(team_id: int, db: Session = Depends(get_db)):
    repo = TeamRepository(db)
    team = repo.get(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Tim tidak ditemukan")
    return team


@router.patch("/{team_id}", response_model=TeamOut)
def update_team(
    team_id: int,
    payload: TeamUpdate,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    _require_mediator(user)
    repo = TeamRepository(db)
    try:
        team = repo.get(team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Tim tidak ditemukan")
        if payload.name and payload.name != team.name:
            existing = repo.find_by_name(payload.name)
            if existing and existing.id != team_id:
                raise HTTPException(status_code=409, detail="Nama tim sudah digunakan")
            team.name = payload.name
        if payload.kelas is not None:
            team.kelas = payload.kelas
        if payload.description is not None:
            team.description = payload.description
        db.flush()
        db.commit()
        db.refresh(team)
    except Exception:
        db.rollback()
        raise
    return team


@router.delete("/{team_id}", response_model=dict)
def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    _require_mediator(user)
    team_repo = TeamRepository(db)
    member_repo = TeamMemberRepository(db)
    rollup_repo = TeamRollupRepository(db)
    try:
        team = team_repo.get(team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Tim tidak ditemukan")
        members_count = member_repo.count_by_team(team_id)
        rollup_count = rollup_repo.count_by_team(team_id)
        if members_count > 0 or rollup_count > 0:
            raise HTTPException(status_code=409, detail="Hapus anggota/rollup terlebih dahulu")
        team_repo.delete(team)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"ok": True}


@router.get("/{team_id}/members", response_model=list[TeamMemberOut])
def list_members(team_id: int, db: Session = Depends(get_db)):
    repo = TeamMemberRepository(db)
    return repo.list_by_team(team_id)


@router.post("/{team_id}/members", response_model=TeamMemberOut)
def add_member(
    team_id: int,
    payload: TeamMemberAdd,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    _require_mediator(user)
    # Unique per (team,user)
    repo = TeamMemberRepository(db)
    try:
        if repo.exists(team_id, payload.user_id):
            raise HTTPException(status_code=409, detail="Pengguna sudah menjadi anggota tim")
        tm = repo.add(team_id, payload.user_id, payload.role_in_team)
        db.commit()
        db.refresh(tm)
    except Exception:
        db.rollback()
        raise
    return tm


@router.delete("/{team_id}/members/{member_id}", response_model=dict)
def remove_member(
    team_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    _require_mediator(user)
    repo = TeamMemberRepository(db)
    try:
        tm = repo.get(team_id, member_id)
        if not tm:
            raise HTTPException(status_code=404, detail="Anggota tidak ditemukan")
        repo.delete(tm)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"ok": True}


@router.get("/{team_id}/rollups", response_model=list[TeamRollupOut])
def list_rollups(team_id: int, db: Session = Depends(get_db)):
    repo = TeamRollupRepository(db)
    return repo.list_by_team(team_id)


@router.post("/{team_id}/rollup/run", response_model=TeamRollupOut)
def run_rollup(
    team_id: int,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
    for_date: Optional[str] = Query(default=None, description="YYYY-MM-DD optional date filter"),
):
    user = get_current_user(authorization, db)
    _require_mediator(user)
    d: Optional[date] = None
    if for_date:
        try:
            d = date.fromisoformat(for_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Format tanggal harus YYYY-MM-DD") from None
    try:
        roll = compute_team_rollup(db, team_id=team_id, for_date=d)
        db.commit()
        db.refresh(roll)
    except Exception:
        db.rollback()
        raise
    return roll
