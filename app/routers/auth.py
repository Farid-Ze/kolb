import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.klsi import User
from app.schemas.auth import Role, Token, UserCreate, UserOut
from app.services.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    # domain restriction for mahasiswa accounts
    domain = payload.email.split("@")[-1].lower()
    if domain != settings.allowed_student_domain and payload.nim:
        # Jika mendaftar sebagai mahasiswa (mengisi NIM), wajib domain mahasiswa
        raise HTTPException(status_code=400, detail="Domain email mahasiswa tidak valid untuk NIM")
    role = Role.MAHASISWA if domain == settings.allowed_student_domain else Role.MEDIATOR

    # validate NIM (8 chars) & kelas format IF-<number> & tahun_masuk reasonable
    if role == Role.MAHASISWA:
        if not payload.nim or len(payload.nim) != 8 or not payload.nim.isdigit():
            raise HTTPException(status_code=400, detail="NIM harus 8 digit")
        if not payload.kelas or not re.fullmatch(r"IF-\d+", payload.kelas):
            raise HTTPException(status_code=400, detail="Format kelas harus IF-<nomor>")
        if not payload.tahun_masuk or payload.tahun_masuk < 1990 or payload.tahun_masuk > 2100:
            raise HTTPException(status_code=400, detail="Tahun masuk tidak valid")
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=role.value,
        nim=payload.nim if role == Role.MAHASISWA else None,
        kelas=payload.kelas if role == Role.MAHASISWA else None,
        tahun_masuk=payload.tahun_masuk if role == Role.MAHASISWA else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(email: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.password_hash or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Kredensial salah")
    token = create_access_token(str(user.id))
    return Token(access_token=token)
