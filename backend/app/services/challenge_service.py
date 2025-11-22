from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.klsi.challenge import GrowthChallenge, UserChallenge
from app.models.klsi.enums import ChallengeStatus
from app.services.gamification_service import gamification_service
from app.services.sphere_service import sphere_service


class ChallengeServiceError(Exception):
    status_code = 400

    def __init__(self, message: str, *, status_code: int | None = None) -> None:
        super().__init__(message)
        if status_code is not None:
            self.status_code = status_code


class ChallengeNotFoundError(ChallengeServiceError):
    status_code = 404


class ChallengeAlreadyCompletedError(ChallengeServiceError):
    status_code = 409


class ChallengeService:
    COMPLETION_AWARD_POINTS = 150

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

    def complete_challenge(
        self,
        db: Session,
        user_id: int,
        challenge_id: int,
        *,
        proof_url: str | None = None,
    ) -> UserChallenge:
        challenge = (
            db.query(UserChallenge)
            .filter_by(id=challenge_id, user_id=user_id)
            .one_or_none()
        )
        if challenge is None:
            raise ChallengeNotFoundError("Challenge not found")
        if challenge.status == ChallengeStatus.completed:
            raise ChallengeAlreadyCompletedError("Challenge already completed")

        challenge.status = ChallengeStatus.completed
        challenge.proof_url = proof_url
        challenge.completed_at = datetime.now(timezone.utc)
        gamification_service.add_points(db, user_id, self.COMPLETION_AWARD_POINTS)

        # Optionally create a sphere node to mark this milestone in the user's Zenosphere.
        try:
            sphere_service.create_node_for_event(
                db,
                user_id,
                "challenge_completed",
                {"challenge_id": challenge.challenge_id},
            )
        except Exception:
            # Sphere creation is non-critical; failure should not block challenge completion.
            pass

        db.flush()
        return challenge

challenge_service = ChallengeService()
