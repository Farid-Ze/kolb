from __future__ import annotations

from types import SimpleNamespace
from typing import TYPE_CHECKING, Sequence, cast

import pytest
from app.engine.pipelines import (
    KLSI_PIPELINE_STAGE_KEYS,
    PipelineFactory,
    get_klsi_pipeline_definition,
    resolve_klsi_pipeline_from_nodes,
)

if TYPE_CHECKING:  # pragma: no cover
    from app.engine.pipelines import PipelineStage
    from app.models.klsi.instrument import ScoringPipelineNode

def _stage_names(stages: Sequence[object]) -> list[str]:
    return [getattr(stage, "__name__", stage.__class__.__name__) for stage in stages]


class DummyPipeline:
    def __init__(self, code: str = "KLSI4.0", version: str = "v1") -> None:
        self.pipeline_code = code
        self.version = version


def test_get_klsi_pipeline_definition_uses_canonical_order():
    definition = get_klsi_pipeline_definition()
    stage_names = _stage_names(definition.stages)
    assert stage_names == [
        "compute_raw_scale_scores",
        "compute_combination_scores",
        "assign_learning_style",
        "compute_lfi",
    ]


def test_resolve_klsi_pipeline_from_nodes_maps_node_keys():
    pipeline = DummyPipeline()
    raw_nodes = [
        SimpleNamespace(node_key="COMBINATIONS", execution_order=2, pipeline=pipeline),
        SimpleNamespace(node_key="RAW_SCALES", execution_order=1, pipeline=pipeline),
        SimpleNamespace(node_key="LFI", execution_order=4, pipeline=pipeline),
        SimpleNamespace(node_key="STYLE_ASSIGNMENT", execution_order=3, pipeline=pipeline),
    ]
    nodes = cast("list[ScoringPipelineNode]", raw_nodes)

    definition = resolve_klsi_pipeline_from_nodes(nodes)

    assert definition.code == "KLSI4.0"
    assert definition.version == "v1"
    stage_names = _stage_names(definition.stages)
    assert stage_names == [
        "compute_raw_scale_scores",
        "compute_combination_scores",
        "assign_learning_style",
        "compute_lfi",
    ]


def test_resolve_klsi_pipeline_from_nodes_raises_on_unknown_key():
    pipeline = DummyPipeline()
    raw_nodes = [
        SimpleNamespace(node_key="UNKNOWN", execution_order=1, pipeline=pipeline),
    ]
    nodes = cast("list[ScoringPipelineNode]", raw_nodes)

    with pytest.raises(ValueError) as excinfo:
        resolve_klsi_pipeline_from_nodes(nodes)

    assert "Unsupported pipeline node_key" in str(excinfo.value)


def test_pipeline_factory_rejects_unknown_stage():
    factory = PipelineFactory({"RAW_SCALES": lambda db, session_id: {}})  # type: ignore[arg-type]

    with pytest.raises(ValueError):
        factory.build(code="X", version="1", stage_keys=("UNKNOWN",))


def test_klsi_stage_keys_are_ordered():
    assert KLSI_PIPELINE_STAGE_KEYS == (
        "RAW_SCALES",
        "COMBINATIONS",
        "STYLE_ASSIGNMENT",
        "LFI",
    )
