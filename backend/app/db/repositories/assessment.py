from dataclasses import dataclass
from typing import List, Union, cast
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, Session

from app.db.repositories.base import Repository
from app.models.klsi.enums import ItemType, LearningMode
from app.models.klsi.items import AssessmentItem, AssessmentItemResponse, ItemChoice, UserResponse
from app.models.klsi.learning import LFIContextScore


@dataclass
class ItemRankAggregate:
    item_id: int
    rank_value: int
    count: int


@dataclass
class AssessmentItemRepository(Repository[Union[AsyncSession, Session]]):
    """Repository providing access to assessment item metadata."""

    async def get_learning_item_ids(self) -> List[int]:
        db = cast(AsyncSession, self.db)
        stmt = select(AssessmentItem.id).filter(AssessmentItem.item_type == ItemType.learning_style)
        result = await db.execute(stmt)
        rows = result.all()
        return [row[0] for row in rows]

    def get_learning_item_ids_sync(self) -> List[int]:
        """Fetch learning style item IDs - Sync version."""
        db = cast(Session, self.db)
        stmt = select(AssessmentItem.id).filter(AssessmentItem.item_type == ItemType.learning_style)
        result = db.execute(stmt)
        rows = result.all()
        return [row[0] for row in rows]

    def get_choices_sync(self, item_id: int) -> List[ItemChoice]:
        """Fetch choices for an item - Sync version."""
        db = cast(Session, self.db)
        return db.query(ItemChoice).filter(ItemChoice.item_id == item_id).all()


@dataclass
class UserResponseRepository(Repository[Union[AsyncSession, Session]]):
    """Repository exposing aggregate computations on user responses."""

    async def record_response(
        self,
        *,
        session_id: UUID,
        item_id: int,
        choice_id: int,
        rank_value: int,
    ) -> UserResponse:
        db = cast(AsyncSession, self.db)
        entity = UserResponse(
            session_id=session_id,
            item_id=item_id,
            choice_id=choice_id,
            rank_value=rank_value,
        )
        db.add(entity)
        await db.flush()
        await db.refresh(entity)
        return entity

    async def aggregate_ranks_by_item(self, session_id: UUID) -> List[ItemRankAggregate]:
        db = cast(AsyncSession, self.db)
        stmt = (
            select(
                UserResponse.item_id,
                UserResponse.rank_value,
                func.count().label("cnt"),
            )
            .filter(UserResponse.session_id == session_id)
            .group_by(UserResponse.item_id, UserResponse.rank_value)
        )
        result = await db.execute(stmt)
        rows = result.all()
        return [
            ItemRankAggregate(
                item_id=row.item_id,
                rank_value=int(row.rank_value),
                count=int(row.cnt or 0),
            )
            for row in rows
        ]

    def aggregate_ranks_by_item_sync(self, session_id: UUID) -> List[ItemRankAggregate]:
        """Aggregate ranks by item - Sync version."""
        db = cast(Session, self.db)
        stmt = (
            select(
                UserResponse.item_id,
                UserResponse.rank_value,
                func.count().label("cnt"),
            )
            .filter(UserResponse.session_id == session_id)
            .group_by(UserResponse.item_id, UserResponse.rank_value)
        )
        result = db.execute(stmt)
        rows = result.all()
        return [
            ItemRankAggregate(
                item_id=row.item_id,
                rank_value=int(row.rank_value),
                count=int(row.cnt or 0),
            )
            for row in rows
        ]

    async def find_duplicate_choices(self, session_id: UUID) -> List[int]:
        db = cast(AsyncSession, self.db)
        stmt = (
            select(UserResponse.choice_id, func.count().label("c"))
            .filter(UserResponse.session_id == session_id)
            .group_by(UserResponse.choice_id)
            .having(func.count() > 1)
        )
        result = await db.execute(stmt)
        rows = result.all()
        return [row.choice_id for row in rows]

    def find_duplicate_choices_sync(self, session_id: UUID) -> List[int]:
        """Find duplicate choices - Sync version."""
        db = cast(Session, self.db)
        stmt = (
            select(UserResponse.choice_id, func.count().label("c"))
            .filter(UserResponse.session_id == session_id)
            .group_by(UserResponse.choice_id)
            .having(func.count() > 1)
        )
        result = db.execute(stmt)
        rows = result.all()
        return [row.choice_id for row in rows]

    async def list_with_choices(self, session_id: UUID) -> List[UserResponse]:
        """Return responses with choice and item relationships eager-loaded."""
        db = cast(AsyncSession, self.db)
        stmt = (
            select(UserResponse)
            .options(
                joinedload(UserResponse.choice).joinedload(ItemChoice.item),
            )
            .filter(UserResponse.session_id == session_id)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    def list_with_choices_sync(self, session_id: UUID) -> List[UserResponse]:
        """Return responses with choice and item relationships eager-loaded - Sync version."""
        db = cast(Session, self.db)
        stmt = (
            select(UserResponse)
            .options(
                joinedload(UserResponse.choice).joinedload(ItemChoice.item),
            )
            .filter(UserResponse.session_id == session_id)
        )
        result = db.execute(stmt)
        return list(result.scalars().all())

    def get_native_responses_sync(
        self, session_id: UUID
    ) -> List[tuple[UserResponse, int, LearningMode | None]]:
        """Fetch responses with item and choice details - Sync version."""
        db = cast(Session, self.db)
        raw_rows = (
            db.query(
                UserResponse,
                ItemChoice.item_id,
                ItemChoice.learning_mode,
            )
            .join(ItemChoice, ItemChoice.id == UserResponse.choice_id)
            .join(AssessmentItem, AssessmentItem.id == ItemChoice.item_id)
            .filter(
                UserResponse.session_id == session_id,
                AssessmentItem.item_type == ItemType.learning_style,
            )
            .all()
        )
        return [
            (response, int(assessment_item_id), learning_mode)
            for response, assessment_item_id, learning_mode in raw_rows
        ]

    def record_response_sync(
        self,
        *,
        session_id: UUID,
        item_id: int,
        choice_id: int,
        rank_value: int,
    ) -> UserResponse:
        """Record a user response - Sync version."""
        db = cast(Session, self.db)
        entity = UserResponse(
            session_id=session_id,
            item_id=item_id,
            choice_id=choice_id,
            rank_value=rank_value,
        )
        db.add(entity)
        return entity

    def get_response_sync(
        self, session_id: UUID, item_id: int
    ) -> AssessmentItemResponse | None:
        """Fetch a single item response - Sync version."""
        db = cast(Session, self.db)
        return (
            db.query(AssessmentItemResponse)
            .filter(
                AssessmentItemResponse.session_id == session_id,
                AssessmentItemResponse.item_id == item_id,
            )
            .first()
        )

    def count_by_session(self, session_id: UUID) -> int:
        db = cast(Session, self.db)
        return (
            db.query(UserResponse.id)
            .filter(UserResponse.session_id == session_id)
            .distinct()
            .count()
        )


@dataclass
class LFIContextRepository(Repository[Union[AsyncSession, Session]]):
    """Repository for accessing LFI context scores."""

    async def record_context(
        self,
        *,
        session_id: UUID,
        context_name: str,
        CE: int,
        RO: int,
        AC: int,
        AE: int,
    ) -> LFIContextScore:
        db = cast(AsyncSession, self.db)
        entity = LFIContextScore(
            session_id=session_id,
            context_name=context_name,
            CE_rank=CE,
            RO_rank=RO,
            AC_rank=AC,
            AE_rank=AE,
        )
        db.add(entity)
        await db.flush()
        await db.refresh(entity)
        return entity

    async def list_for_session(self, session_id: UUID) -> List[LFIContextScore]:
        db = cast(AsyncSession, self.db)
        stmt = select(LFIContextScore).filter(LFIContextScore.session_id == session_id)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    def list_for_session_sync(self, session_id: UUID) -> List[LFIContextScore]:
        """List LFI context scores for a session - Sync version."""
        db = cast(Session, self.db)
        stmt = select(LFIContextScore).filter(LFIContextScore.session_id == session_id)
        result = db.execute(stmt)
        return list(result.scalars().all())

    def record_context_sync(
        self,
        *,
        session_id: UUID,
        context_name: str,
        CE: int,
        RO: int,
        AC: int,
        AE: int,
    ) -> LFIContextScore:
        """Record LFI context score - Sync version."""
        db = cast(Session, self.db)
        entity = LFIContextScore(
            session_id=session_id,
            context_name=context_name,
            CE_rank=CE,
            RO_rank=RO,
            AC_rank=AC,
            AE_rank=AE,
        )
        db.add(entity)
        db.flush()
        db.refresh(entity)
        return entity

    def count_by_session(self, session_id: UUID) -> int:
        db = cast(Session, self.db)
        return (
            db.query(LFIContextScore.id)
            .filter(LFIContextScore.session_id == session_id)
            .count()
        )



