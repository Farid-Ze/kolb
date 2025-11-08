from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.klsi import Team, TeamAssessmentRollup, TeamMember, User
from app.schemas.team import (
    TeamCreate,
    TeamMemberAdd,
    TeamMemberOut,
    TeamOut,
    TeamRollupOut,
    TeamUpdate,
)
from app.services.rollup import compute_team_rollup

router = APIRouter(prefix="/teams", tags=["teams"])


def _get_current_user(authorization: str | None, db: Session) -> User:
    if not authorization or not authorization.lower().startswith('bearer '):
        raise HTTPException(status_code=401, detail="Token diperlukan")
    token = authorization.split()[1]
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token tidak valid")
    uid_raw = payload.get('sub')
    if uid_raw is None:
        raise HTTPException(status_code=401, detail="Token tidak memuat sub")
    try:
        uid = int(uid_raw)
    except ValueError:
        raise HTTPException(status_code=401, detail="sub token tidak valid")
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=401, detail="Pengguna tidak ditemukan")
    return user


def _require_mediator(user: User):
    if user.role != 'MEDIATOR':
        raise HTTPException(status_code=403, detail="Hanya MEDIATOR yang diperbolehkan")


@router.post("/", response_model=TeamOut)
def create_team(payload: TeamCreate, db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    user = _get_current_user(authorization, db)
    _require_mediator(user)
    # Unique name
    exists = db.query(Team).filter(Team.name == payload.name).first()
    if exists:
        raise HTTPException(status_code=409, detail="Nama tim sudah digunakan")
    team = Team(name=payload.name, kelas=payload.kelas, description=payload.description)
    db.add(team)
    db.commit(); db.refresh(team)
    return team


@router.get("/", response_model=list[TeamOut])
def list_teams(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    q: Optional[str] = Query(None),
):
    qry = db.query(Team)
    if q:
        # simple contains match on name/kelas
        like = f"%{q}%"
        qry = qry.filter((Team.name.ilike(like)) | (Team.kelas.ilike(like)))
    teams = qry.order_by(Team.id.desc()).offset(skip).limit(limit).all()
    return teams


@router.get("/{team_id}", response_model=TeamOut)
def get_team(team_id: int, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Tim tidak ditemukan")
    return team


@router.patch("/{team_id}", response_model=TeamOut)
def update_team(team_id: int, payload: TeamUpdate, db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    user = _get_current_user(authorization, db)
    _require_mediator(user)
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Tim tidak ditemukan")
    if payload.name and payload.name != team.name:
        exists = db.query(Team).filter(Team.name == payload.name).first()
        if exists:
            raise HTTPException(status_code=409, detail="Nama tim sudah digunakan")
        team.name = payload.name
    if payload.kelas is not None:
        team.kelas = payload.kelas
    if payload.description is not None:
        team.description = payload.description
    db.commit(); db.refresh(team)
    return team


@router.delete("/{team_id}", response_model=dict)
def delete_team(team_id: int, db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    user = _get_current_user(authorization, db)
    _require_mediator(user)
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Tim tidak ditemukan")
    # Safety: refuse delete if members or rollups exist
    members_count = db.query(TeamMember).filter(TeamMember.team_id == team_id).count()
    rollup_count = db.query(TeamAssessmentRollup).filter(TeamAssessmentRollup.team_id == team_id).count()
    if members_count > 0 or rollup_count > 0:
        raise HTTPException(status_code=409, detail="Hapus anggota/rollup terlebih dahulu")
    db.delete(team)
    db.commit()
    return {"ok": True}


@router.get("/{team_id}/members", response_model=list[TeamMemberOut])
def list_members(team_id: int, db: Session = Depends(get_db)):
    rows = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    return rows


@router.post("/{team_id}/members", response_model=TeamMemberOut)
def add_member(team_id: int, payload: TeamMemberAdd, db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    user = _get_current_user(authorization, db)
    _require_mediator(user)
    # Unique per (team,user)
    exists = db.query(TeamMember).filter(TeamMember.team_id == team_id, TeamMember.user_id == payload.user_id).first()
    if exists:
        raise HTTPException(status_code=409, detail="Pengguna sudah menjadi anggota tim")
    tm = TeamMember(team_id=team_id, user_id=payload.user_id, role_in_team=payload.role_in_team)
    db.add(tm); db.commit(); db.refresh(tm)
    return tm


@router.delete("/{team_id}/members/{member_id}", response_model=dict)
def remove_member(team_id: int, member_id: int, db: Session = Depends(get_db), authorization: str | None = Header(default=None)):
    user = _get_current_user(authorization, db)
    _require_mediator(user)
    tm = db.query(TeamMember).filter(TeamMember.id == member_id, TeamMember.team_id == team_id).first()
    if not tm:
        raise HTTPException(status_code=404, detail="Anggota tidak ditemukan")
    db.delete(tm); db.commit()
    return {"ok": True}


@router.get("/{team_id}/rollups", response_model=list[TeamRollupOut])
def list_rollups(team_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(TeamAssessmentRollup)
        .filter(TeamAssessmentRollup.team_id == team_id)
        .order_by(TeamAssessmentRollup.date.desc())
        .all()
    )
    return rows


@router.post("/{team_id}/rollup/run", response_model=TeamRollupOut)
def run_rollup(
    team_id: int,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
    for_date: Optional[str] = Query(default=None, description="YYYY-MM-DD optional date filter"),
):
    user = _get_current_user(authorization, db)
    _require_mediator(user)
    d: Optional[date] = None
    if for_date:
        try:
            d = date.fromisoformat(for_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Format tanggal harus YYYY-MM-DD")
    roll = compute_team_rollup(db, team_id=team_id, for_date=d)
    return roll
