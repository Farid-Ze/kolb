from dataclasses import dataclass
from typing import List, Optional, Union, cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, Session

from app.db.repositories.base import Repository
from app.models.klsi.instrument import Instrument, ScoringPipeline, ScoringPipelineNode


@dataclass(slots=True, repr=True)
class InstrumentRepository(Repository[Union[AsyncSession, Session]]):
    """Repository for accessing instrument metadata."""

    async def get_by_code(self, code: str, version: Optional[str] = None) -> Optional[Instrument]:
        db = cast(AsyncSession, self.db)
        stmt = select(Instrument).filter(Instrument.code == code)
        if version:
            stmt = stmt.filter(Instrument.version == version)
        else:
            stmt = stmt.order_by(Instrument.version.desc())
        result = await db.execute(stmt)
        return result.scalars().first()

    def get_by_code_sync(self, code: str, version: Optional[str] = None) -> Optional[Instrument]:
        db = cast(Session, self.db)
        stmt = select(Instrument).filter(Instrument.code == code)
        if version:
            stmt = stmt.filter(Instrument.version == version)
        else:
            stmt = stmt.order_by(Instrument.version.desc())
        result = db.execute(stmt)
        return result.scalars().first()


@dataclass(slots=True, repr=True)
class PipelineRepository(Repository[Union[AsyncSession, Session]]):
    """Repository for scoring pipeline operations."""

    async def list_with_nodes(self, instrument_id: int) -> List[ScoringPipeline]:
        db = cast(AsyncSession, self.db)
        stmt = (
            select(ScoringPipeline)
            .options(joinedload(ScoringPipeline.nodes))
            .filter(ScoringPipeline.instrument_id == instrument_id)
            .order_by(ScoringPipeline.pipeline_code.asc(), ScoringPipeline.version.asc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get(self, pipeline_id: int, instrument_id: int, *, with_nodes: bool = False) -> Optional[ScoringPipeline]:
        db = cast(AsyncSession, self.db)
        stmt = select(ScoringPipeline).filter(
            ScoringPipeline.id == pipeline_id,
            ScoringPipeline.instrument_id == instrument_id,
        )
        if with_nodes:
            stmt = stmt.options(joinedload(ScoringPipeline.nodes))
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_by_code_version(
        self,
        instrument_id: int,
        pipeline_code: str,
        version: str,
        *,
        with_nodes: bool = False,
    ) -> Optional[ScoringPipeline]:
        db = cast(AsyncSession, self.db)
        stmt = select(ScoringPipeline).filter(
            ScoringPipeline.instrument_id == instrument_id,
            ScoringPipeline.pipeline_code == pipeline_code,
            ScoringPipeline.version == version,
        )
        if with_nodes:
            stmt = stmt.options(joinedload(ScoringPipeline.nodes))
        result = await db.execute(stmt)
        return result.scalars().first()

    def get_by_code_version_sync(
        self,
        instrument_id: int,
        pipeline_code: str,
        version: str,
        *,
        with_nodes: bool = False,
    ) -> Optional[ScoringPipeline]:
        db = cast(Session, self.db)
        stmt = select(ScoringPipeline).filter(
            ScoringPipeline.instrument_id == instrument_id,
            ScoringPipeline.pipeline_code == pipeline_code,
            ScoringPipeline.version == version,
        )
        if with_nodes:
            stmt = stmt.options(joinedload(ScoringPipeline.nodes))
        result = db.execute(stmt)
        return result.scalars().first()

    async def exists_version(self, instrument_id: int, pipeline_code: str, version: str) -> bool:
        db = cast(AsyncSession, self.db)
        from sqlalchemy import func
        stmt = select(func.count()).select_from(ScoringPipeline).filter(
            ScoringPipeline.instrument_id == instrument_id,
            ScoringPipeline.pipeline_code == pipeline_code,
            ScoringPipeline.version == version,
        )
        result = await db.execute(stmt)
        count = result.scalar()
        return (count or 0) > 0

    async def deactivate_all_except(self, instrument_id: int, pipeline_id: int) -> None:
        db = cast(AsyncSession, self.db)
        from sqlalchemy import update
        stmt = (
            update(ScoringPipeline)
            .where(ScoringPipeline.instrument_id == instrument_id)
            .where(ScoringPipeline.id != pipeline_id)
            .values(is_active=False)
        )
        await db.execute(stmt)

    async def clone(self, source: ScoringPipeline, **data) -> ScoringPipeline:
        db = cast(AsyncSession, self.db)
        cloned = ScoringPipeline(**data)
        db.add(cloned)
        await db.flush()
        for node in sorted(source.nodes, key=lambda n: n.execution_order):
            db.add(
                ScoringPipelineNode(
                    pipeline_id=cloned.id,
                    node_key=node.node_key,
                    node_type=node.node_type,
                    execution_order=node.execution_order,
                    config=node.config,
                    next_node_key=node.next_node_key,
                    is_terminal=node.is_terminal,
                )
            )
        await db.flush()
        await db.refresh(cloned)
        return cloned

    async def delete(self, pipeline: ScoringPipeline) -> None:
        db = cast(AsyncSession, self.db)
        await db.delete(pipeline)
