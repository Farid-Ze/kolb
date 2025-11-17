"""Tests for declarative pipeline functionality."""

from typing import cast

import pytest
from sqlalchemy.orm import Session
from app.engine.pipelines import PipelineDefinition


_DUMMY_SESSION = cast(Session, None)


class MockStage:
    """Mock pipeline stage for testing."""
    
    def __init__(self, name: str, return_value: dict | None = None):
        self._name = name
        self._return_value = return_value or {"stage_result": name}
        self.called = False
    
    def __call__(self, db: Session, session_id: int) -> dict:
        self.called = True
        return self._return_value
    
    @property
    def __name__(self):
        return self._name


def test_pipeline_definition_creation():
    """Test creating a pipeline definition."""
    stage1 = MockStage("stage1")
    stage2 = MockStage("stage2")
    
    pipeline = PipelineDefinition(
        code="TEST_PIPELINE",
        version="1.0",
        stages=(stage1, stage2),
        description="Test pipeline"
    )
    
    assert pipeline.code == "TEST_PIPELINE"
    assert pipeline.version == "1.0"
    assert len(pipeline.stages) == 2
    assert pipeline.description == "Test pipeline"


def test_pipeline_execution_sequential():
    """Test that pipeline stages execute sequentially."""
    stage1 = MockStage("stage1", {"stage1_result": "value1"})
    stage2 = MockStage("stage2", {"stage2_result": "value2"})
    
    pipeline = PipelineDefinition(
        code="SEQ_TEST",
        version="1.0",
        stages=(stage1, stage2)
    )
    
    # Mock db and session_id
    result = pipeline.execute(db=_DUMMY_SESSION, session_id=123)
    
    # Both stages should have been called
    assert stage1.called
    assert stage2.called
    
    # Results should include both stage outputs plus ok flag
    assert result["ok"] is True
    assert "stage1_result" in result
    assert "stage2_result" in result
    assert "stages_completed" in result
    assert len(result["stages_completed"]) == 2


def test_pipeline_execution_error_handling():
    """Test that pipeline handles stage failures."""
    stage1 = MockStage("stage1")
    
    def failing_stage(db: Session, session_id: int) -> dict:
        raise ValueError("Stage failed")
    failing_stage.__name__ = "failing_stage"
    
    pipeline = PipelineDefinition(
        code="FAIL_TEST",
        version="1.0",
        stages=(stage1, failing_stage)
    )
    
    with pytest.raises(ValueError):
        pipeline.execute(db=_DUMMY_SESSION, session_id=123)


def test_pipeline_immutability():
    """Test that pipeline definition is immutable."""
    stage1 = MockStage("stage1")
    
    pipeline = PipelineDefinition(
        code="IMMUTABLE_TEST",
        version="1.0",
        stages=(stage1,)
    )
    
    # Should not be able to modify frozen dataclass
    with pytest.raises(AttributeError):
        setattr(pipeline, "code", "MODIFIED")


def test_get_klsi_pipeline_definition():
    """Test that KLSI pipeline definition can be retrieved."""
    from app.engine.pipelines import get_klsi_pipeline_definition
    
    pipeline = get_klsi_pipeline_definition()
    
    assert pipeline.code == "KLSI_STANDARD"
    assert pipeline.version == "4.0"
    assert len(pipeline.stages) == 4  # Expected KLSI stages
    assert pipeline.description != ""
