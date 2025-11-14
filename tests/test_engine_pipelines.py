from __future__ import annotations

from types import SimpleNamespace

from app.engine.pipelines import get_klsi_pipeline_definition, resolve_klsi_pipeline_from_nodes


class DummyPipeline:
    def __init__(self, code: str = "KLSI4.0", version: str = "v1") -> None:
        self.pipeline_code = code
        self.version = version


def test_get_klsi_pipeline_definition_uses_canonical_order():
    definition = get_klsi_pipeline_definition()
    stage_names = [s.__name__ for s in definition.stages]
    assert stage_names == [
        "compute_raw_scale_scores",
        "compute_combination_scores",
        "assign_learning_style",
        "compute_lfi",
    ]


def test_resolve_klsi_pipeline_from_nodes_maps_node_keys():
    pipeline = DummyPipeline()
    nodes = [
        SimpleNamespace(node_key="COMBINATIONS", execution_order=2, pipeline=pipeline),
        SimpleNamespace(node_key="RAW_SCALES", execution_order=1, pipeline=pipeline),
        SimpleNamespace(node_key="LFI", execution_order=4, pipeline=pipeline),
        SimpleNamespace(node_key="STYLE_ASSIGNMENT", execution_order=3, pipeline=pipeline),
    ]

    definition = resolve_klsi_pipeline_from_nodes(nodes)

    assert definition.code == "KLSI4.0"
    assert definition.version == "v1"
    stage_names = [s.__name__ for s in definition.stages]
    assert stage_names == [
        "compute_raw_scale_scores",
        "compute_combination_scores",
        "assign_learning_style",
        "compute_lfi",
    ]


def test_resolve_klsi_pipeline_from_nodes_raises_on_unknown_key():
    pipeline = DummyPipeline()
    nodes = [
        SimpleNamespace(node_key="UNKNOWN", execution_order=1, pipeline=pipeline),
    ]

    import pytest

    with pytest.raises(ValueError) as excinfo:
        resolve_klsi_pipeline_from_nodes(nodes)

    assert "Unsupported pipeline node_key" in str(excinfo.value)
