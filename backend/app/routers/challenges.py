from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.klsi.user import User
from app.schemas.challenges import ChallengeCompletionPayload, UserChallengeOut
from app.services.challenge_service import (
    ChallengeAlreadyCompletedError,
    ChallengeNotFoundError,
    challenge_service,
)
from app.services.security import get_current_user

router = APIRouter(prefix="/challenges", tags=["challenges"])

@router.get("/user", response_model=list[UserChallengeOut])
async def list_user_challenges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await run_in_threadpool(challenge_service.list_user_challenges, db, current_user.id)


@router.post("/user/{challenge_id}/complete", response_model=UserChallengeOut)
async def complete_user_challenge(
    challenge_id: int,
    payload: ChallengeCompletionPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    def _complete():
        try:
            challenge = challenge_service.complete_challenge(
                db,
                current_user.id,
                challenge_id,
                proof_url=payload.proof_url,
            )
            db.commit()
            db.refresh(challenge)
            return challenge
        except (ChallengeNotFoundError, ChallengeAlreadyCompletedError) as exc:
            db.rollback()
            raise exc

    try:
        return await run_in_threadpool(_complete)
    except (ChallengeNotFoundError, ChallengeAlreadyCompletedError) as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc))
