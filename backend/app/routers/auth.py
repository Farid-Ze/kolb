import re
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.core.config import settings
from app.core.logging import get_logger
from app.db.database import get_db
from app.db.repositories import UserRepository
from app.schemas.auth import Role, Token, UserCreate, UserOut
from app.schemas.base import CamelModel
from app.services.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_refresh_token,
)
from app.i18n.id_messages import AuthMessages

router = APIRouter(prefix="/auth", tags=["auth"])
logger = get_logger("kolb.routers.auth", component="router")

_KELAS_PATTERN = re.compile(r"^IF-\d{2}$")


def _log_db_failure(event: str, **structured: Any) -> None:
    logger.exception(event, extra={"structured_data": structured})


@router.post("/register", response_model=UserOut)
def register(payload: UserCreate, db: Any = Depends(get_db)):
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
    
    # [Zenotika V4] Lazy Registration Merge
    if payload.guest_session_id and payload.guest_token:
        from app.db.repositories import SessionRepository
        session_repo = SessionRepository(db)
        session = session_repo.get_by_id(payload.guest_session_id)
        
        # Verify session exists, is anonymous, and token matches
        if session and session.user_id is None and session.guest_token == payload.guest_token:
            session.user_id = user.id
            # Note: We don't retroactively update AuditLog actor (remains 'ANON' or similar)
            # This preserves the history that it was taken anonymously.

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

class LoginRequest(CamelModel):
    email: str
    password: str

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Any = Depends(get_db)):
    user_repo = UserRepository(db)
    user = user_repo.get_by_email(payload.email)
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail=AuthMessages.INVALID_CREDENTIALS)
    token = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))
    expires_in = settings.access_token_expire_minutes * 60
    return Token(access_token=token, refresh_token=refresh, expires_in=expires_in)


class RefreshRequest(CamelModel):
    refresh_token: str


@router.post("/refresh", response_model=Token)
def refresh_token_endpoint(payload: RefreshRequest, db: Any = Depends(get_db)):
    try:
        user_id = verify_refresh_token(payload.refresh_token)
    except ValueError:
        raise HTTPException(status_code=401, detail=AuthMessages.INVALID_REFRESH_TOKEN)
        
    user_repo = UserRepository(db)
    user = user_repo.get(int(user_id))
    if not user:
        raise HTTPException(status_code=401, detail=AuthMessages.USER_NOT_FOUND)
        
    new_access = create_access_token(str(user.id))
    new_refresh = create_refresh_token(str(user.id))
    expires_in = settings.access_token_expire_minutes * 60
    
    return Token(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=expires_in
    )

