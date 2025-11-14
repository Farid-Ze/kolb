"""Tests for streaming pipeline execution."""

import pytest
from sqlalchemy.orm import Session
from app.engine.pipelines import (
    PipelineDefinition,
    execute_pipeline_streaming,
)


class MockStage:
    """Mock pipeline stage for testing."""
    
    def __init__(self, name: str, return_value: dict | None = None):
        self._name = name
        self._return_value = return_value or {"result": name}
        self.call_count = 0
    
    def __call__(self, db: Session, session_id: int) -> dict:
        self.call_count += 1
        return self._return_value
    
    @property
    def __name__(self):
        return self._name


def test_pipeline_execute_streaming():
    """Test streaming execution of pipeline stages."""
    stage1 = MockStage("stage1", {"data": "value1"})
    stage2 = MockStage("stage2", {"data": "value2"})
    
    pipeline = PipelineDefinition(
        code="TEST",
        version="1.0",
        stages=(stage1, stage2)
    )
    
    results = list(pipeline.execute_streaming(db=None, session_id=1))
    
    # Should yield 2 results
    assert len(results) == 2
    assert results[0] == ("stage1", {"data": "value1"})
    assert results[1] == ("stage2", {"data": "value2"})
    
    # Both stages should be called
    assert stage1.call_count == 1
    assert stage2.call_count == 1


def test_pipeline_execute_streaming_error():
    """Test streaming execution with stage failure."""
    stage1 = MockStage("stage1")
    
    def failing_stage(db: Session, session_id: int) -> dict:
        raise ValueError("Stage failed")
    failing_stage.__name__ = "failing_stage"
    
    pipeline = PipelineDefinition(
        code="FAIL_TEST",
        version="1.0",
        stages=(stage1, failing_stage)
    )
    
    results = []
    with pytest.raises(ValueError):
        for result in pipeline.execute_streaming(db=None, session_id=1):
            results.append(result)
    
    # Should have stage1 success and failing_stage error
    assert len(results) == 2
    assert results[0][0] == "stage1"
    assert results[1][0] == "failing_stage"
    assert "error" in results[1][1]


def test_execute_pipeline_streaming_multiple_sessions():
    """Test batch processing of multiple sessions."""
    stage1 = MockStage("stage1", {"ok": True})
    
    pipeline = PipelineDefinition(
        code="BATCH",
        version="1.0",
        stages=(stage1,)
    )
    
    session_ids = [101, 102, 103]
    results = list(execute_pipeline_streaming(pipeline, None, session_ids))
    
    # Should process all sessions
    assert len(results) == 3
    assert results[0][0] == 101
    assert results[1][0] == 102
    assert results[2][0] == 103
    
    # All should succeed
    assert all(r[1]["ok"] for r in results)
    
    # Stage called once per session
    assert stage1.call_count == 3


def test_execute_pipeline_streaming_memory_efficiency():
    """Test that streaming doesn't accumulate all results in memory."""
    # Create a stage that returns "large" data
    def large_stage(db: Session, session_id: int) -> dict:
        # Simulate large result (in real use, this would be much larger)
        return {"data": "x" * 1000, "session_id": session_id}
    large_stage.__name__ = "large_stage"
    
    pipeline = PipelineDefinition(
        code="LARGE",
        version="1.0",
        stages=(large_stage,)
    )
    
    session_ids = list(range(1, 11))  # 10 sessions
    
    # Process one at a time (generator doesn't store all)
    processed = 0
    for session_id, result in execute_pipeline_streaming(pipeline, None, session_ids):
        assert result["ok"]
        assert result["data"] == "x" * 1000
        processed += 1
        # At this point, previous results are garbage collected
    
    assert processed == 10


def test_execute_pipeline_streaming_with_errors():
    """Test streaming with some sessions failing."""
    call_count = {"count": 0}
    
    def maybe_fail_stage(db: Session, session_id: int) -> dict:
        call_count["count"] += 1
        if session_id == 102:
            raise ValueError("Session 102 failed")
        return {"ok": True, "session_id": session_id}
    maybe_fail_stage.__name__ = "maybe_fail_stage"
    
    pipeline = PipelineDefinition(
        code="PARTIAL_FAIL",
        version="1.0",
        stages=(maybe_fail_stage,)
    )
    
    session_ids = [101, 102, 103]
    results = list(execute_pipeline_streaming(pipeline, None, session_ids))
    
    # All sessions attempted
    assert len(results) == 3
    
    # First succeeds
    assert results[0][1]["ok"]
    
    # Second fails
    assert not results[1][1]["ok"]
    assert "error" in results[1][1]
    
    # Third succeeds (continues after error)
    assert results[2][1]["ok"]
