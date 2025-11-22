from datetime import datetime

from app.schemas.base import CamelModel
from app.models.klsi.enums import ChallengeStatus

class UserChallengeOut(CamelModel):
    id: int
    challenge_id: int
    status: ChallengeStatus
    proof_url: str | None = None
    created_at: datetime
    completed_at: datetime | None = None


class ChallengeCompletionPayload(CamelModel):
    proof_url: str | None = None
