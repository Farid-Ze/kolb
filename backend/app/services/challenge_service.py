from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.klsi.challenge import GrowthChallenge, UserChallenge
from app.models.klsi.enums import ChallengeStatus

class ChallengeService:
    def list_user_challenges(self, db: Session, user_id: int):
        return db.query(UserChallenge).filter_by(user_id=user_id).all()

    def assign_challenge(self, db: Session, user_id: int, challenge_id: int):
        existing = db.query(UserChallenge).filter_by(user_id=user_id, challenge_id=challenge_id).first()
        if existing:
            return existing
        
        uc = UserChallenge(
            user_id=user_id,
            challenge_id=challenge_id,
            status=ChallengeStatus.active,
            created_at=datetime.now(timezone.utc),
        )
        db.add(uc)
        return uc

    def assign_challenges_for_deficiencies(
        self,
        db: Session,
        user_id: int,
        deficiencies: list[str],
    ) -> list[UserChallenge]:
        if not deficiencies:
            return []

        challenges = (
            db.query(GrowthChallenge)
            .filter(GrowthChallenge.target_style_deficiency.in_(deficiencies))
            .all()
        )
        assigned: list[UserChallenge] = []
        for challenge in challenges:
            existing = (
                db.query(UserChallenge)
                .filter_by(user_id=user_id, challenge_id=challenge.id)
                .first()
            )
            if existing:
                continue
            assignment = UserChallenge(
                user_id=user_id,
                challenge_id=challenge.id,
                status=ChallengeStatus.active,
                created_at=datetime.now(timezone.utc),
            )
            db.add(assignment)
            assigned.append(assignment)
        return assigned

challenge_service = ChallengeService()
