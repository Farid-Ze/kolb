from typing import Any, Optional
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException

from app.db.repositories import (
    TeamRepository,
    TeamMemberRepository,
    TeamRollupRepository,
    UserRepository,
)
from app.schemas.team import TeamCreate, TeamUpdate
from app.services.rollup import compute_team_rollup
from app.core.logging import get_logger
from app.i18n.id_messages import TeamMessages

logger = get_logger("kolb.services.team", component="service")

class TeamService:
    def __init__(self, db: Session):
        self.db = db
        self.team_repo = TeamRepository(db)
        self.member_repo = TeamMemberRepository(db)
        self.rollup_repo = TeamRollupRepository(db)
        self.user_repo = UserRepository(db)

    def create_team(self, payload: TeamCreate, user_id: int) -> Any:
        try:
            existing = self.team_repo.find_by_name_sync(payload.name)
            if existing:
                raise HTTPException(status_code=409, detail=TeamMessages.NAME_EXISTS)
            team = self.team_repo.create_sync(payload.name, payload.kelas, payload.description)
            self.db.commit()
            self.db.refresh(team)
            return team
        except SQLAlchemyError:
            self.db.rollback()
            logger.exception(
                "teams_create_failed",
                extra={"structured_data": {"user_id": user_id, "team_name": payload.name}}
            )
            raise

    def update_team(self, team_id: int, payload: TeamUpdate, user_id: int) -> Any:
        try:
            team = self.team_repo.get_sync(team_id)
            if not team:
                raise HTTPException(status_code=404, detail=TeamMessages.NOT_FOUND)
            
            if payload.name and payload.name != team.name:
                existing = self.team_repo.find_by_name_sync(payload.name)
                if existing and existing.id != team_id:
                    raise HTTPException(status_code=409, detail=TeamMessages.NAME_EXISTS)
                team.name = payload.name
            
            if payload.kelas is not None:
                team.kelas = payload.kelas
            if payload.description is not None:
                team.description = payload.description
            
            self.db.flush()
            self.db.commit()
            self.db.refresh(team)
            return team
        except SQLAlchemyError:
            self.db.rollback()
            logger.exception(
                "teams_update_failed",
                extra={"structured_data": {"team_id": team_id, "user_id": user_id}}
            )
            raise

    def delete_team(self, team_id: int, user_id: int) -> None:
        members_count = None
        rollup_count = None
        try:
            team = self.team_repo.get_sync(team_id)
            if not team:
                raise HTTPException(status_code=404, detail=TeamMessages.NOT_FOUND)
            
            members_count = self.member_repo.count_by_team_sync(team_id)
            rollup_count = self.rollup_repo.count_by_team_sync(team_id)
            
            if members_count > 0 or rollup_count > 0:
                raise HTTPException(status_code=409, detail=TeamMessages.REMOVE_DEPENDENCIES_FIRST)
            
            self.team_repo.delete_sync(team)
            self.db.commit()
        except SQLAlchemyError:
            self.db.rollback()
            logger.exception(
                "teams_delete_failed",
                extra={"structured_data": {
                    "team_id": team_id, 
                    "user_id": user_id,
                    "members_count": members_count,
                    "rollup_count": rollup_count
                }}
            )
            raise

    def add_member(self, team_id: int, email: str, role_in_team: str, user_id: int) -> Any:
        try:
            user = self.user_repo.get_by_email_sync(email)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
                
            if self.member_repo.exists_sync(team_id, user.id):
                raise HTTPException(status_code=409, detail=TeamMessages.MEMBER_EXISTS)
            
            tm = self.member_repo.add_sync(team_id, user.id, role_in_team)
            self.db.commit()
            self.db.refresh(tm)
            return tm
        except HTTPException:
            raise
        except SQLAlchemyError:
            self.db.rollback()
            logger.exception(
                "teams_add_member_failed",
                extra={"structured_data": {"team_id": team_id, "user_id": user_id, "member_email": email}}
            )
            raise

    def remove_member(self, team_id: int, member_id: int, user_id: int) -> None:
        try:
            tm = self.member_repo.get_sync(team_id, member_id)
            if not tm:
                raise HTTPException(status_code=404, detail=TeamMessages.MEMBER_NOT_FOUND)
            self.member_repo.delete_sync(tm)
            self.db.commit()
        except SQLAlchemyError:
            self.db.rollback()
            logger.exception(
                "teams_remove_member_failed",
                extra={"structured_data": {"team_id": team_id, "user_id": user_id, "member_id": member_id}}
            )
            raise

    def run_rollup(self, team_id: int, for_date: Optional[date], user_id: int) -> Any:
        try:
            roll = compute_team_rollup(self.db, team_id=team_id, for_date=for_date)
            self.db.commit()
            self.db.refresh(roll)
            return roll
        except SQLAlchemyError:
            self.db.rollback()
            logger.exception(
                "teams_run_rollup_failed",
                extra={"structured_data": {"team_id": team_id, "user_id": user_id, "for_date": str(for_date) if for_date else None}}
            )
            raise
