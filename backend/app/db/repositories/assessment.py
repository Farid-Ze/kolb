from __future__ import annotations

from dataclasses import dataclass
from typing import List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session, joinedload

from app.db.repositories.base import Repository
from app.models.klsi.enums import ItemType
from app.models.klsi.items import AssessmentItem, ItemChoice, UserResponse
from app.models.klsi.learning import LFIContextScore


@dataclass
class ItemRankAggregate:
    item_id: int
    rank_value: int
    count: int


@dataclass
class AssessmentItemRepository(Repository[Session]):
    """Repository providing access to assessment item metadata."""

    def get_learning_item_ids(self) -> List[int]:
        rows = (
            self.db.query(AssessmentItem.id)
            .filter(AssessmentItem.item_type == ItemType.learning_style)
            .all()
        )
        return [row[0] for row in rows]


@dataclass
class AsyncAssessmentItemRepository:
    """Async Repository providing access to assessment item metadata."""
    db: AsyncSession

    async def get_learning_item_ids(self) -> List[int]:
        result = await self.db.execute(
            select(AssessmentItem.id)
            .filter(AssessmentItem.item_type == ItemType.learning_style)
        )
        return [row[0] for row in result.all()]


@dataclass
class UserResponseRepository(Repository[Session]):
    """Repository exposing aggregate computations on user responses."""

    def record_response(
        self,
        *,
        session_id: int,
        item_id: int,
        choice_id: int,
        rank_value: int,
    ) -> UserResponse:
        entity = UserResponse(
            session_id=session_id,
            item_id=item_id,
            choice_id=choice_id,
            rank_value=rank_value,
        )
        self.db.add(entity)
        return entity

    def aggregate_ranks_by_item(self, session_id: int) -> List[ItemRankAggregate]:
        rows = (
            self.db.query(
                UserResponse.item_id,
                UserResponse.rank_value,
                func.count().label("cnt"),
            )
            .filter(UserResponse.session_id == session_id)
            .group_by(UserResponse.item_id, UserResponse.rank_value)
            .all()
        )
        return [
            ItemRankAggregate(
                item_id=row.item_id,
                rank_value=int(row.rank_value),
                count=int(row.cnt or 0),
            )
            for row in rows
        ]

    def find_duplicate_choices(self, session_id: int) -> List[int]:
        rows = (
            self.db.query(UserResponse.choice_id, func.count().label("c"))
            .filter(UserResponse.session_id == session_id)
            .group_by(UserResponse.choice_id)
            .having(func.count() > 1)
            .all()
        )
        return [row.choice_id for row in rows]

    def list_with_choices(self, session_id: int) -> List[UserResponse]:
        """Return responses with choice and item relationships eager-loaded."""
        return (
            self.db.query(UserResponse)
            .options(
                joinedload(UserResponse.choice).joinedload(ItemChoice.item),
            )
            .filter(UserResponse.session_id == session_id)
            .all()
        )


@dataclass
class AsyncUserResponseRepository:
    """Async Repository exposing aggregate computations on user responses."""
    db: AsyncSession

    def record_response(
        self,
        *,
        session_id: int,
        item_id: int,
        choice_id: int,
        rank_value: int,
    ) -> UserResponse:
        entity = UserResponse(
            session_id=session_id,
            item_id=item_id,
            choice_id=choice_id,
            rank_value=rank_value,
        )
        self.db.add(entity)
        return entity

    async def aggregate_ranks_by_item(self, session_id: int) -> List[ItemRankAggregate]:
        result = await self.db.execute(
            select(
                UserResponse.item_id,
                UserResponse.rank_value,
                func.count().label("cnt"),
            )
            .filter(UserResponse.session_id == session_id)
            .group_by(UserResponse.item_id, UserResponse.rank_value)
        )
        rows = result.all()
        return [
            ItemRankAggregate(
                item_id=row.item_id,
                rank_value=int(row.rank_value),
                count=int(row.cnt or 0),
            )
            for row in rows
        ]

    async def find_duplicate_choices(self, session_id: int) -> List[int]:
        result = await self.db.execute(
            select(UserResponse.choice_id, func.count().label("c"))
            .filter(UserResponse.session_id == session_id)
            .group_by(UserResponse.choice_id)
            .having(func.count() > 1)
        )
        rows = result.all()
        return [row.choice_id for row in rows]

    async def list_with_choices(self, session_id: int) -> List[UserResponse]:
        """Return responses with choice and item relationships eager-loaded."""
        result = await self.db.execute(
            select(UserResponse)
            .options(
                joinedload(UserResponse.choice).joinedload(ItemChoice.item),
            )
            .filter(UserResponse.session_id == session_id)
        )
        return list(result.scalars().all())


@dataclass
class LFIContextRepository(Repository[Session]):
    """Repository for accessing LFI context scores."""

    def record_context(
        self,
        *,
        session_id: int,
        context_name: str,
        CE: int,
        RO: int,
        AC: int,
        AE: int,
    ) -> LFIContextScore:
        entity = LFIContextScore(
            session_id=session_id,
            context_name=context_name,
            CE_rank=CE,
            RO_rank=RO,
            AC_rank=AC,
            AE_rank=AE,
        )
        self.db.add(entity)
        return entity

    def list_for_session(self, session_id: int) -> List[LFIContextScore]:
        return (
            self.db.query(LFIContextScore)
            .filter(LFIContextScore.session_id == session_id)
            .all()
        )


@dataclass
class AsyncLFIContextRepository:
    """Async Repository for accessing LFI context scores."""
    db: AsyncSession

    def record_context(
        self,
        *,
        session_id: int,
        context_name: str,
        CE: int,
        RO: int,
        AC: int,
        AE: int,
    ) -> LFIContextScore:
        entity = LFIContextScore(
            session_id=session_id,
            context_name=context_name,
            CE_rank=CE,
            RO_rank=RO,
            AC_rank=AC,
            AE_rank=AE,
        )
        self.db.add(entity)
        return entity

    async def list_for_session(self, session_id: int) -> List[LFIContextScore]:
        result = await self.db.execute(
            select(LFIContextScore)
            .filter(LFIContextScore.session_id == session_id)
        )
        return list(result.scalars().all())
