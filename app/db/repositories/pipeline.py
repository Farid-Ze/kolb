from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.db.repositories.base import Repository
from app.models.klsi.instrument import Instrument, ScoringPipeline, ScoringPipelineNode


@dataclass
class InstrumentRepository(Repository[Session]):
    """Repository for accessing instrument metadata."""

    def get_by_code(self, code: str, version: Optional[str] = None) -> Optional[Instrument]:
        query = self.db.query(Instrument).filter(Instrument.code == code)
        if version:
            query = query.filter(Instrument.version == version)
        else:
            query = query.order_by(Instrument.version.desc())
        return query.first()


@dataclass
class PipelineRepository(Repository[Session]):
    """Repository for scoring pipeline operations."""

    def list_with_nodes(self, instrument_id: int) -> List[ScoringPipeline]:
        return (
            self.db.query(ScoringPipeline)
            .options(joinedload(ScoringPipeline.nodes))
            .filter(ScoringPipeline.instrument_id == instrument_id)
            .order_by(ScoringPipeline.pipeline_code.asc(), ScoringPipeline.version.asc())
            .all()
        )

    def get(self, pipeline_id: int, instrument_id: int, *, with_nodes: bool = False) -> Optional[ScoringPipeline]:
        query = self.db.query(ScoringPipeline).filter(
            ScoringPipeline.id == pipeline_id,
            ScoringPipeline.instrument_id == instrument_id,
        )
        if with_nodes:
            query = query.options(joinedload(ScoringPipeline.nodes))
        return query.first()

    def exists_version(self, instrument_id: int, pipeline_code: str, version: str) -> bool:
        return (
            self.db.query(ScoringPipeline)
            .filter(
                ScoringPipeline.instrument_id == instrument_id,
                ScoringPipeline.pipeline_code == pipeline_code,
                ScoringPipeline.version == version,
            )
            .count()
            > 0
        )

    def deactivate_all_except(self, instrument_id: int, pipeline_id: int) -> None:
        (
            self.db.query(ScoringPipeline)
            .filter(
                ScoringPipeline.instrument_id == instrument_id,
                ScoringPipeline.id != pipeline_id,
            )
            .update({"is_active": False}, synchronize_session=False)
        )

    def clone(self, source: ScoringPipeline, **data) -> ScoringPipeline:
        cloned = ScoringPipeline(**data)
        self.db.add(cloned)
        self.db.flush()
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
        self.db.flush()
        self.db.refresh(cloned)
        return cloned

    def delete(self, pipeline: ScoringPipeline) -> None:
        self.db.delete(pipeline)
