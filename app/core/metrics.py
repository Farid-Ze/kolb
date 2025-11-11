from __future__ import annotations

import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from functools import wraps
from time import perf_counter
from typing import Any, Callable, Dict, Mapping, Sequence, TypeVar, cast
_F = TypeVar("_F", bound=Callable[..., Any])


class _MetricsRegistry:
    """Thread-safe in-process metrics registry.

    Stores simple timing counters per label:
      - count: number of recorded events
      - total_ms: total elapsed milliseconds
      - max_ms: maximum single observation in milliseconds
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._timings: Dict[str, Dict[str, float]] = {}
        self._counters: Dict[str, float] = {}
        self._histograms: Dict[str, Dict[str, float]] = {}
        self._last_runs: Dict[str, Dict[str, Any]] = {}

    def record(self, label: str, elapsed_ms: float) -> None:
        if not label:
            return
        with self._lock:
            entry = self._timings.setdefault(
                label,
                {"count": 0.0, "total_ms": 0.0, "max_ms": 0.0, "avg_ms": 0.0},
            )
            entry["count"] += 1.0
            entry["total_ms"] += float(elapsed_ms)
            if elapsed_ms > entry["max_ms"]:
                entry["max_ms"] = float(elapsed_ms)
            entry["avg_ms"] = entry["total_ms"] / entry["count"] if entry["count"] else 0.0

    def observe_histogram(
        self,
        label: str,
        value: float,
        *,
        buckets: Sequence[float] | None = None,
    ) -> None:
        if not label:
            return
        bucket_sequence: Sequence[float] = buckets or (1.0, 5.0, 10.0, 20.0, 50.0)
        with self._lock:
            histogram = self._histograms.setdefault(label, {str(b): 0.0 for b in bucket_sequence})
            histogram.setdefault("+Inf", 0.0)
            recorded = False
            for boundary in bucket_sequence:
                if value <= boundary:
                    histogram[str(boundary)] += 1.0
                    recorded = True
                    break
            if not recorded:
                histogram["+Inf"] += 1.0

    def snapshot(self, reset: bool = False) -> Dict[str, Dict[str, float]]:
        with self._lock:
            data = {k: dict(v) for k, v in self._timings.items()}
            if reset:
                self._timings.clear()
            return data

    def reset(self) -> None:
        with self._lock:
            self._timings.clear()
            self._counters.clear()
            self._histograms.clear()
            self._last_runs.clear()

    # --- Counters ---
    def inc(self, label: str, amount: float = 1.0) -> None:
        if not label:
            return
        with self._lock:
            self._counters[label] = self._counters.get(label, 0.0) + float(amount)

    def counters_snapshot(self, reset: bool = False) -> Dict[str, float]:
        with self._lock:
            data = dict(self._counters)
            if reset:
                self._counters.clear()
            return data

    def histograms_snapshot(self, reset: bool = False) -> Dict[str, Dict[str, float]]:
        with self._lock:
            data = {label: dict(buckets) for label, buckets in self._histograms.items()}
            if reset:
                self._histograms.clear()
            return data

    def set_last_run(
        self,
        label: str,
        duration_ms: float,
        *,
        metadata: Mapping[str, Any] | None = None,
    ) -> None:
        if not label:
            return
        with self._lock:
            payload: Dict[str, Any] = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "duration_ms": float(duration_ms),
            }
            if metadata:
                payload.update(dict(metadata))
            self._last_runs[label] = payload

    def last_runs_snapshot(self, reset: bool = False) -> Dict[str, Dict[str, Any]]:
        with self._lock:
            data = {k: dict(v) for k, v in self._last_runs.items()}
            if reset:
                self._last_runs.clear()
            return data


metrics_registry = _MetricsRegistry()


@contextmanager
def timer(label: str):
    """Context manager to time a code block and record it under `label`."""
    t0 = perf_counter()
    try:
        yield
    finally:
        dt_ms = (perf_counter() - t0) * 1000.0
        metrics_registry.record(label, dt_ms)
    metrics_registry.set_last_run(label, dt_ms)


def timeit(label: str) -> Callable[[_F], _F]:
    """Decorator to time a function and record under `label`."""

    def _wrap(func: _F) -> _F:
        @wraps(func)
        def _inner(*args: Any, **kwargs: Any):
            t0 = perf_counter()
            try:
                return func(*args, **kwargs)
            finally:
                dt_ms = (perf_counter() - t0) * 1000.0
                metrics_registry.record(label, dt_ms)
                metrics_registry.set_last_run(label, dt_ms)

        return cast(_F, _inner)

    return _wrap


def get_metrics(reset: bool = False) -> Dict[str, Dict[str, float]]:
    """Return recorded timing metrics, optionally resetting the registry."""

    return metrics_registry.snapshot(reset=reset)


def inc_counter(label: str, amount: float = 1.0) -> None:
    """Increment a counter metric identified by `label`."""

    metrics_registry.inc(label, amount)


def get_counters(reset: bool = False) -> Dict[str, float]:
    """Return counter metrics, optionally clearing stored values."""

    return metrics_registry.counters_snapshot(reset=reset)


def get_histograms(reset: bool = False) -> Dict[str, Dict[str, float]]:
    """Return histogram buckets recorded so far."""

    return metrics_registry.histograms_snapshot(reset=reset)


def observe_histogram(label: str, value: float, *, buckets: Sequence[float] | None = None) -> None:
    """Record a histogram observation for the given `label`."""

    metrics_registry.observe_histogram(label, value, buckets=buckets)


def record_last_run(label: str, duration_ms: float, *, metadata: Mapping[str, Any] | None = None) -> None:
    """Store last execution metadata for a metric label."""

    metrics_registry.set_last_run(label, duration_ms, metadata=metadata)


def get_last_runs(reset: bool = False) -> Dict[str, Dict[str, Any]]:
    """Retrieve last-run snapshots captured so far."""

    return metrics_registry.last_runs_snapshot(reset=reset)


__all__ = [
    "timer",
    "timeit",
    "inc_counter",
    "get_metrics",
    "get_counters",
    "get_histograms",
    "observe_histogram",
    "record_last_run",
    "get_last_runs",
    "metrics_registry",
]
