import uuid
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.db.repositories import ReportShareRepository, SessionRepository, UserRepository
from app.models.klsi.enums import SessionStatus
from app.models.klsi.report_share import ReportShareLink
from app.models.klsi.user import User


class ReportShareError(Exception):
    """Base error for report share failures."""


class SharePermissionError(ReportShareError):
    """Raised when a user attempts an unauthorized share action."""


class ShareValidationError(ReportShareError):
    """Raised when share creation inputs are invalid."""


class ReportShareService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self._shares = ReportShareRepository(db)
        self._sessions = SessionRepository(db)
        self._users = UserRepository(db)


    def create_share(
        self,
        *,
        session_id: uuid.UUID,
        owner: User,
        mediator_email: str,
        expires_in_hours: int,
        note: str | None = None,
    ) -> tuple[ReportShareLink, str]:
        session = self._sessions.get_by_id_sync(session_id)
        if not session:
            raise ShareValidationError("Session tidak ditemukan")
        if session.user_id != owner.id:
            raise SharePermissionError("Anda bukan pemilik sesi ini")
        if session.status != SessionStatus.completed:
            raise ShareValidationError("Laporan belum dapat dibagikan sebelum sesi selesai")

        mediator = self._users.get_by_email_sync(mediator_email)
        if not mediator or mediator.role != "MEDIATOR":
            raise ShareValidationError("Email mediator tidak valid atau belum terdaftar")

        expires_delta = timedelta(hours=expires_in_hours)
        expires_at = datetime.now(timezone.utc) + expires_delta

        # Revoke previous active link for this mediator/session to prevent stale tokens
        self._shares.revoke_existing_sync(session_id=session_id, mediator_id=mediator.id)

        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

        share = self._shares.create_sync(
            session_id=session_id,
            owner_id=owner.id,
            mediator_id=mediator.id,
            mediator_email=mediator.email,
            token_hash=token_hash,
            expires_at=expires_at,
            note=note,
        )
        self.db.flush()
        return share, token

    def resolve_share(
        self,
        *,
        share_token: str,
        viewer: User,
    ) -> ReportShareLink:
        token_hash = hashlib.sha256(share_token.encode("utf-8")).hexdigest()
        share = self._shares.get_active_by_token_sync(token_hash)
        if not share:
            raise ShareValidationError("Link berbagi tidak berlaku atau telah kedaluwarsa")
        if share.mediator_id != viewer.id:
            raise SharePermissionError("Link ini tidak ditujukan untuk akun Anda")
        if viewer.role != "MEDIATOR":
            raise SharePermissionError("Link ini hanya dapat dibuka oleh mediator terotorisasi")

        self._shares.mark_access(share)
        self.db.flush()
        return share
