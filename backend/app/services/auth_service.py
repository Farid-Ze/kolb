from typing import Any
from fastapi import HTTPException

from app.core.config import settings
from app.core.logging import get_logger
from app.db.repositories import UserRepository, SessionRepository
from app.schemas.auth import Role, UserCreate
from app.services.security import hash_password
from app.i18n.id_messages import AuthMessages
from app.services.grant_service import GrantService
from app.db.database import get_repository_provider

logger = get_logger("kolb.services.auth", component="service")

class AuthService:
    def __init__(self, db: Any):
        self.db = db
        self.user_repo = UserRepository(db)

    async def register_user(self, payload: UserCreate, calculated_role: Role) -> Any:
        existing = await self.user_repo.get_by_email(payload.email)
        if existing:
            raise HTTPException(status_code=400, detail=AuthMessages.EMAIL_ALREADY_REGISTERED)
        
        user = await self.user_repo.create(
            full_name=payload.full_name,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role=calculated_role.value,
            nim=payload.nim if calculated_role == Role.MAHASISWA else None,
            kelas=payload.kelas if calculated_role == Role.MAHASISWA else None,
            tahun_masuk=payload.tahun_masuk if calculated_role == Role.MAHASISWA else None,
        )
        
        # [Zenotika V4] Lazy Registration Merge
        if payload.guest_session_id and payload.guest_token:
            session_repo = SessionRepository(self.db)
            session = await session_repo.get_by_id(payload.guest_session_id)
            
            # Verify session exists, is anonymous, and token matches
            if session and session.user_id is None and session.guest_token == payload.guest_token:
                session.user_id = user.id
                # Note: We don't retroactively update AuditLog actor (remains 'ANON' or similar)
                # This preserves the history that it was taken anonymously.

        try:
            await self.db.commit()
            await self.db.refresh(user)

            # [Dev/Test] Auto-grant credits for KLSI4
            if settings.environment in ("development", "test"):
                try:
                    repo_provider = get_repository_provider(self.db)
                    instrument = await repo_provider.instruments.get_by_code("KLSI4")
                    if instrument:
                        grant_service = GrantService(self.db)
                        # Grant 5 credits
                        logger.warning(f"DEBUG: Auto-granting 5 credits for user {user.id} instrument {instrument.id}")
                        await grant_service.grant_credits(user.id, instrument.id, 5)
                        await self.db.commit()
                        logger.warning(f"DEBUG: Auto-grant committed for user {user.id}")
                except Exception as e:
                    logger.warning(f"Failed to auto-grant credits: {e}")

        except Exception:
            await self.db.rollback()
            logger.exception(
                "auth_register_commit_failed",
                extra={"structured_data": {"email": payload.email, "role": calculated_role.value}}
            )
            raise
            
        return user
