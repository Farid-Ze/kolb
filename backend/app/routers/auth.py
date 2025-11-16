import re
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import get_logger
from app.db.database import get_db
from app.db.repositories import UserRepository
from app.schemas.auth import Role, Token, UserCreate, UserOut
from app.services.security import create_access_token, hash_password, verify_password
from app.i18n.id_messages import AuthMessages

router = APIRouter(prefix="/auth", tags=["auth"])
logger = get_logger("kolb.routers.auth", component="router")

_KELAS_PATTERN = re.compile(r"IF-\d+")


def _log_db_failure(event: str, **structured: Any) -> None:
    logger.exception(event, extra={"structured_data": structured})


@router.post("/register", response_model=UserOut)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    # domain restriction for mahasiswa accounts
    domain = payload.email.split("@")[-1].lower()
    if domain != settings.allowed_student_domain and payload.nim:
        # Jika mendaftar sebagai mahasiswa (mengisi NIM), wajib domain mahasiswa
        raise HTTPException(status_code=400, detail=AuthMessages.INVALID_STUDENT_DOMAIN)
    role = Role.MAHASISWA if domain == settings.allowed_student_domain else Role.MEDIATOR

    # validate NIM (8 chars) & kelas format IF-<number> & tahun_masuk reasonable
    if role == Role.MAHASISWA:
        if not payload.nim or len(payload.nim) != 8 or not payload.nim.isdigit():
            raise HTTPException(status_code=400, detail=AuthMessages.INVALID_NIM)
        if not payload.kelas or not _KELAS_PATTERN.fullmatch(payload.kelas):
            raise HTTPException(status_code=400, detail=AuthMessages.INVALID_CLASS_FORMAT)
        if not payload.tahun_masuk or payload.tahun_masuk < 1990 or payload.tahun_masuk > 2100:
            raise HTTPException(status_code=400, detail=AuthMessages.INVALID_ENROLLMENT_YEAR)
    user_repo = UserRepository(db)
    existing = user_repo.get_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=400, detail=AuthMessages.EMAIL_ALREADY_REGISTERED)
    user = user_repo.create(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=role.value,
        nim=payload.nim if role == Role.MAHASISWA else None,
        kelas=payload.kelas if role == Role.MAHASISWA else None,
        tahun_masuk=payload.tahun_masuk if role == Role.MAHASISWA else None,
    )
    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        _log_db_failure(
            "auth_register_commit_failed",
            email=payload.email,
            role=role.value,
        )
        raise
    return user

@router.post("/login", response_model=Token)
def login(email: str, password: str, db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    user = user_repo.get_by_email(email)
    if not user or not user.password_hash or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail=AuthMessages.INVALID_CREDENTIALS)
    token = create_access_token(str(user.id))
    return Token(access_token=token)
