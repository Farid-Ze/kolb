import pytest

from app.core.metrics import (
    measure_time,
    timer,
    count_calls,
    get_metrics,
    get_counters,
    metrics_registry,
    set_instrumentation_enabled,
)


@pytest.fixture(autouse=True)
def _reset_metrics():
    metrics_registry.reset()
    set_instrumentation_enabled(True)
    yield
    metrics_registry.reset()
    set_instrumentation_enabled(True)


def test_measure_time_records_when_enabled():
    @measure_time("tests.metrics.enabled")
    def work(x):
        return x * 2

    result = work(6)

    assert result == 12
    metrics = get_metrics()
    assert "tests.metrics.enabled" in metrics
    assert metrics["tests.metrics.enabled"]["count"] == 1.0


def test_instrumentation_toggle_disables_measure_time():
    set_instrumentation_enabled(False)

    @measure_time("tests.metrics.disabled")
    def work(x):
        return x + 1

    assert work(5) == 6
    assert "tests.metrics.disabled" not in get_metrics()


def test_timer_context_respects_toggle():
    set_instrumentation_enabled(False)
    with timer("tests.timer.disabled"):
        pass
    assert "tests.timer.disabled" not in get_metrics()

    set_instrumentation_enabled(True)
    with timer("tests.timer.enabled"):
        pass
    assert "tests.timer.enabled" in get_metrics()


def test_count_calls_guarded_by_toggle():
    @count_calls("tests.counter.guard")
    def do_work():
        return "ok"

    set_instrumentation_enabled(False)
    do_work()
    assert get_counters() == {}

    set_instrumentation_enabled(True)
    do_work()
    counters = get_counters()
    assert counters["tests.counter.guard"] == 1.0