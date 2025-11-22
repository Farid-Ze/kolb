from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.security import get_current_user
from app.services.challenge_service import challenge_service
from app.schemas.challenges import UserChallengeOut

router = APIRouter(prefix="/challenges", tags=["challenges"])

@router.get("/user", response_model=list[UserChallengeOut])
def list_user_challenges(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return challenge_service.list_user_challenges(db, current_user.id)
