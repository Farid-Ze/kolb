from dataclasses import dataclass
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, Session

from app.db.repositories.base import Repository
from app.models.klsi.instrument import Instrument, ScoringPipeline, ScoringPipelineNode


from typing import List, Optional, Union

@dataclass(slots=True, repr=True)
class InstrumentRepository(Repository[Union[AsyncSession, Session]]):
    """Repository for accessing instrument metadata."""

    def get_by_code(self, code: str, version: Optional[str] = None) -> Optional[Instrument]:
        stmt = select(Instrument).filter(Instrument.code == code)
        if version:
            stmt = stmt.filter(Instrument.version == version)
        else:
            stmt = stmt.order_by(Instrument.version.desc())
        
        if isinstance(self.db, AsyncSession):
            # We can't await here because the method signature must be sync for the runtime to call it.
            # But wait, if we make it sync, async callers will block?
            # No, async callers await it.
            # If we make it `def`, async callers can't await it unless it returns a coroutine.
            # If we make it `async def`, sync callers get a coroutine they can't await.
            
            # The only way to support both is to have two methods or check type at runtime and return coroutine or result?
            # But `async def` ALWAYS returns a coroutine.
            
            # Let's inspect the caller. Runtime calls it synchronously.
            # We should probably have `get_by_code` be sync-compatible if db is sync.
            
            # Since this is a "Semantic Pivot", let's rename the async one or add a sync one.
            # But RepositoryProvider exposes it as `instruments`.
            
            # Let's try this:
            # If we change it to `def`, we break async callers awaiting it.
            # If we keep `async def`, sync callers break.
            
            # Solution: Add `get_by_code_sync` and update runtime to use it?
            # Or check `self.db` type.
            pass
            
    # Let's look at how many async callers there are.
    # grep showed pipelines.py.
    
    # I will add a `get_by_code_sync` method for the runtime, and keep `get_by_code` async.
    # But wait, `runtime` calls `get_by_code`.
    
    # I will change `get_by_code` to `async def` (it already is) and add `get_by_code_sync`.
    # Then I will update `runtime.py` to call `get_by_code_sync`.
    
    async def get_by_code(self, code: str, version: Optional[str] = None) -> Optional[Instrument]:
        stmt = select(Instrument).filter(Instrument.code == code)
        if version:
            stmt = stmt.filter(Instrument.version == version)
        else:
            stmt = stmt.order_by(Instrument.version.desc())
        result = await self.db.execute(stmt)
        return result.scalars().first()

    def get_by_code_sync(self, code: str, version: Optional[str] = None) -> Optional[Instrument]:
        stmt = select(Instrument).filter(Instrument.code == code)
        if version:
            stmt = stmt.filter(Instrument.version == version)
        else:
            stmt = stmt.order_by(Instrument.version.desc())
        result = self.db.execute(stmt)
        return result.scalars().first()


@dataclass(slots=True, repr=True)
class PipelineRepository(Repository[AsyncSession]):
    """Repository for scoring pipeline operations."""

    async def list_with_nodes(self, instrument_id: int) -> List[ScoringPipeline]:
        stmt = (
            select(ScoringPipeline)
            .options(joinedload(ScoringPipeline.nodes))
            .filter(ScoringPipeline.instrument_id == instrument_id)
            .order_by(ScoringPipeline.pipeline_code.asc(), ScoringPipeline.version.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get(self, pipeline_id: int, instrument_id: int, *, with_nodes: bool = False) -> Optional[ScoringPipeline]:
        stmt = select(ScoringPipeline).filter(
            ScoringPipeline.id == pipeline_id,
            ScoringPipeline.instrument_id == instrument_id,
        )
        if with_nodes:
            stmt = stmt.options(joinedload(ScoringPipeline.nodes))
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_code_version(
        self,
        instrument_id: int,
        pipeline_code: str,
        version: str,
        *,
        with_nodes: bool = False,
    ) -> Optional[ScoringPipeline]:
        stmt = select(ScoringPipeline).filter(
            ScoringPipeline.instrument_id == instrument_id,
            ScoringPipeline.pipeline_code == pipeline_code,
            ScoringPipeline.version == version,
        )
        if with_nodes:
            stmt = stmt.options(joinedload(ScoringPipeline.nodes))
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def exists_version(self, instrument_id: int, pipeline_code: str, version: str) -> bool:
        from sqlalchemy import func
        stmt = select(func.count()).select_from(ScoringPipeline).filter(
            ScoringPipeline.instrument_id == instrument_id,
            ScoringPipeline.pipeline_code == pipeline_code,
            ScoringPipeline.version == version,
        )
        result = await self.db.execute(stmt)
        count = result.scalar()
        return (count or 0) > 0

    async def deactivate_all_except(self, instrument_id: int, pipeline_id: int) -> None:
        from sqlalchemy import update
        stmt = (
            update(ScoringPipeline)
            .where(ScoringPipeline.instrument_id == instrument_id)
            .where(ScoringPipeline.id != pipeline_id)
            .values(is_active=False)
        )
        await self.db.execute(stmt)

    async def clone(self, source: ScoringPipeline, **data) -> ScoringPipeline:
        cloned = ScoringPipeline(**data)
        self.db.add(cloned)
        await self.db.flush()
        for node in sorted(source.nodes, key=lambda n: n.execution_order):
            self.db.add(
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
        await self.db.flush()
        await self.db.refresh(cloned)
        return cloned

    async def delete(self, pipeline: ScoringPipeline) -> None:
        await self.db.delete(pipeline)
