import math

import pytest

from app.core.metrics import get_last_runs, get_metrics, metrics_registry, timer, timeit


def test_timer_records_last_run():
    metrics_registry.reset()
    with timer("metrics.test.timer"):
        pass
    last_runs = get_last_runs()
    assert "metrics.test.timer" in last_runs
    payload = last_runs["metrics.test.timer"]
    assert "duration_ms" in payload
    assert payload["duration_ms"] >= 0.0


def test_timeit_records_last_run():
    metrics_registry.reset()

    @timeit("metrics.test.decorator")
    def _fn() -> None:
        return None

    _fn()
    last_runs = get_last_runs()
    assert "metrics.test.decorator" in last_runs
    assert "timestamp" in last_runs["metrics.test.decorator"]


def test_metrics_registry_tracks_variance_and_stddev():
    metrics_registry.reset()
    metrics_registry.record("metrics.var", 10.0)
    metrics_registry.record("metrics.var", 30.0)

    snapshot = get_metrics()
    assert "metrics.var" in snapshot
    entry = snapshot["metrics.var"]
    assert entry["count"] == 2.0
    assert entry["avg_ms"] == pytest.approx(20.0, rel=1e-3)
    assert entry["variance_ms"] == pytest.approx(200.0, rel=1e-3)
    assert entry["stddev_ms"] == pytest.approx(math.sqrt(200.0), rel=1e-3)
