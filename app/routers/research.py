from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.klsi import ReliabilityResult, ResearchStudy, User, ValidityEvidence
from app.schemas.research import (
    ReliabilityCreate,
    ResearchStudyCreate,
    ResearchStudyOut,
    ResearchStudyUpdate,
    ValidityCreate,
)
from app.services.security import get_current_user

router = APIRouter(prefix="/research", tags=["research"])


def _require_mediator(user: User) -> None:
    if user.role != "MEDIATOR":
        raise HTTPException(status_code=403, detail="Hanya MEDIATOR yang diperbolehkan")


@router.post("/studies", response_model=ResearchStudyOut)
def create_study(
    payload: ResearchStudyCreate,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    _require_mediator(user)
    study = ResearchStudy(**payload.model_dump())
    db.add(study)
    db.commit()
    db.refresh(study)
    return study


@router.get("/studies", response_model=List[ResearchStudyOut])
def list_studies(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    q: Optional[str] = Query(None),
):
    qry = db.query(ResearchStudy)
    if q:
        like = f"%{q}%"
        qry = qry.filter(ResearchStudy.title.ilike(like))
    studies = qry.order_by(ResearchStudy.id.desc()).offset(skip).limit(limit).all()
    return studies


@router.get("/studies/{study_id}", response_model=ResearchStudyOut)
def get_study(study_id: int, db: Session = Depends(get_db)):
    study = db.query(ResearchStudy).filter(ResearchStudy.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Studi tidak ditemukan")
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
    study = db.query(ResearchStudy).filter(ResearchStudy.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Studi tidak ditemukan")
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(study, key, value)
    db.commit()
    db.refresh(study)
    return study


@router.delete("/studies/{study_id}", response_model=dict)
def delete_study(
    study_id: int,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    _require_mediator(user)
    study = db.query(ResearchStudy).filter(ResearchStudy.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Studi tidak ditemukan")
    rel_count = db.query(ReliabilityResult).filter(ReliabilityResult.study_id == study_id).count()
    val_count = db.query(ValidityEvidence).filter(ValidityEvidence.study_id == study_id).count()
    if rel_count > 0 or val_count > 0:
        raise HTTPException(
            status_code=409,
            detail="Hapus bukti reliabilitas/validitas terlebih dahulu",
        )
    db.delete(study)
    db.commit()
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
    study = db.query(ResearchStudy).filter(ResearchStudy.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Studi tidak ditemukan")
    row = ReliabilityResult(study_id=study_id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
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
    study = db.query(ResearchStudy).filter(ResearchStudy.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Studi tidak ditemukan")
    row = ValidityEvidence(study_id=study_id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "evidence_type": row.evidence_type}


@router.get("/studies/{study_id}/reliability", response_model=list[dict])
def list_reliability(study_id: int, db: Session = Depends(get_db)):
    rows = db.query(ReliabilityResult).filter(ReliabilityResult.study_id == study_id).all()
    return [
        {"id": r.id, "metric_name": r.metric_name, "value": r.value, "notes": r.notes}
        for r in rows
    ]


@router.get("/studies/{study_id}/validity", response_model=list[dict])
def list_validity(study_id: int, db: Session = Depends(get_db)):
    rows = db.query(ValidityEvidence).filter(ValidityEvidence.study_id == study_id).all()
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
