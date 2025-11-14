from __future__ import annotations

import threading
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone
from functools import wraps
from math import sqrt
from time import perf_counter
from typing import Any, Callable, Dict, Mapping, Sequence, TypeVar, cast
_F = TypeVar("_F", bound=Callable[..., Any])

try:  # pragma: no cover - import guard for early initialization
    from app.core.config import settings as _settings
except Exception:  # pragma: no cover - fallback during bootstrap
    _settings = None


@dataclass(slots=True)
class TimingStats:
    """Numerical aggregates for a timing label."""

    count: float = 0.0
    total_ms: float = 0.0
    max_ms: float = 0.0
    avg_ms: float = 0.0
    variance_ms: float = 0.0
    stddev_ms: float = 0.0
    _mean_ms: float = 0.0
    _m2: float = 0.0

    def update(self, elapsed_ms: float) -> None:
        value = float(elapsed_ms)
        self.count += 1.0
        self.total_ms += value
        if value > self.max_ms:
            self.max_ms = value

        delta = value - self._mean_ms
        self._mean_ms += delta / self.count
        delta2 = value - self._mean_ms
        self._m2 += delta * delta2

        variance = self._m2 / (self.count - 1.0) if self.count > 1.0 else 0.0
        self.variance_ms = variance
        self.stddev_ms = sqrt(variance) if variance > 0.0 else 0.0
        self.avg_ms = self._mean_ms

    def snapshot(self) -> Dict[str, float]:
        return {
            "count": self.count,
            "total_ms": self.total_ms,
            "max_ms": self.max_ms,
            "avg_ms": self.avg_ms,
            "variance_ms": self.variance_ms,
            "stddev_ms": self.stddev_ms,
        }


@dataclass(slots=True)
class HistogramBuckets:
    """Histogram counts for a metric label."""

    boundaries: tuple[float, ...]
    counts: Dict[str, float] = field(init=False)

    def __post_init__(self) -> None:
        self.counts = {str(boundary): 0.0 for boundary in self.boundaries}
        self.counts.setdefault("+Inf", 0.0)

    def observe(self, value: float) -> None:
        for boundary in self.boundaries:
            if value <= boundary:
                self.counts[str(boundary)] += 1.0
                return
        self.counts["+Inf"] += 1.0

    def snapshot(self) -> Dict[str, float]:
        return dict(self.counts)


@dataclass(slots=True)
class LastRunMetadata:
    """Structured payload for last execution metadata."""

    timestamp: str
    duration_ms: float
    metadata: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_duration(
        cls, duration_ms: float, *, metadata: Mapping[str, Any] | None = None
    ) -> "LastRunMetadata":
        payload = dict(metadata) if metadata else {}
        return cls(
            timestamp=datetime.now(timezone.utc).isoformat(),
            duration_ms=float(duration_ms),
            metadata=payload,
        )

    def snapshot(self) -> Dict[str, Any]:
        data = {
            "timestamp": self.timestamp,
            "duration_ms": self.duration_ms,
        }
        if self.metadata:
            data.update(self.metadata)
        return data


class _MetricsRegistry:
    """Thread-safe in-process metrics registry.

    Stores simple timing counters per label:
      - count: number of recorded events
      - total_ms: total elapsed milliseconds
      - max_ms: maximum single observation in milliseconds
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._timings: Dict[str, TimingStats] = {}
        self._counters: Dict[str, float] = {}
        self._histograms: Dict[str, HistogramBuckets] = {}
        self._last_runs: Dict[str, LastRunMetadata] = {}

    def record(self, label: str, elapsed_ms: float) -> None:
        if not label:
            return
        with self._lock:
            entry = self._timings.setdefault(label, TimingStats())
            entry.update(elapsed_ms)

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
            histogram = self._histograms.get(label)
            if histogram is None:
                histogram = HistogramBuckets(tuple(bucket_sequence))
                self._histograms[label] = histogram
            histogram.observe(value)

    def snapshot(self, reset: bool = False) -> Dict[str, Dict[str, float]]:
        with self._lock:
            data = {label: stats.snapshot() for label, stats in self._timings.items()}
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
            data = {label: buckets.snapshot() for label, buckets in self._histograms.items()}
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
            self._last_runs[label] = LastRunMetadata.from_duration(
                duration_ms, metadata=metadata
            )

    def last_runs_snapshot(self, reset: bool = False) -> Dict[str, Dict[str, Any]]:
        with self._lock:
            data = {label: payload.snapshot() for label, payload in self._last_runs.items()}
            if reset:
                self._last_runs.clear()
            return data


metrics_registry = _MetricsRegistry()


_INSTRUMENTATION_ENABLED: bool = bool(
    getattr(_settings, "debug_instrumentation_enabled", True) if _settings else True
)


def set_instrumentation_enabled(enabled: bool) -> None:
    global _INSTRUMENTATION_ENABLED
    _INSTRUMENTATION_ENABLED = bool(enabled)


def instrumentation_enabled() -> bool:
    return _INSTRUMENTATION_ENABLED


@contextmanager
def timer(label: str):
    """Context manager to time a code block and record it under `label`."""
    if not instrumentation_enabled():
        yield
        return
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
            if not instrumentation_enabled():
                return func(*args, **kwargs)
            t0 = perf_counter()
            try:
                return func(*args, **kwargs)
            finally:
                dt_ms = (perf_counter() - t0) * 1000.0
                metrics_registry.record(label, dt_ms)
                metrics_registry.set_last_run(label, dt_ms)

        return cast(_F, _inner)

    return _wrap


def measure_time(
    label: str,
    *,
    histogram: bool = False,
    buckets: Sequence[float] | None = None,
    record_last: bool = True,
) -> Callable[[_F], _F]:
    """Decorator variant that optionally records histogram + last-run metadata."""

    def _wrap(func: _F) -> _F:
        @wraps(func)
        def _inner(*args: Any, **kwargs: Any):
            if not instrumentation_enabled():
                return func(*args, **kwargs)
            t0 = perf_counter()
            try:
                return func(*args, **kwargs)
            finally:
                dt_ms = (perf_counter() - t0) * 1000.0
                metrics_registry.record(label, dt_ms)
                if histogram:
                    metrics_registry.observe_histogram(label, dt_ms, buckets=buckets)
                if record_last:
                    metrics_registry.set_last_run(label, dt_ms)

        return cast(_F, _inner)

    return _wrap


def count_calls(label: str) -> Callable[[_F], _F]:
    """Decorator that increments a counter each time the function is invoked."""

    def _wrap(func: _F) -> _F:
        @wraps(func)
        def _inner(*args: Any, **kwargs: Any):
            if instrumentation_enabled():
                metrics_registry.inc(label)
            return func(*args, **kwargs)

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

    if instrumentation_enabled():
        metrics_registry.observe_histogram(label, value, buckets=buckets)


def record_last_run(label: str, duration_ms: float, *, metadata: Mapping[str, Any] | None = None) -> None:
    """Store last execution metadata for a metric label."""

    if instrumentation_enabled():
        metrics_registry.set_last_run(label, duration_ms, metadata=metadata)


def get_last_runs(reset: bool = False) -> Dict[str, Dict[str, Any]]:
    """Retrieve last-run snapshots captured so far."""

    return metrics_registry.last_runs_snapshot(reset=reset)


__all__ = [
    "timer",
    "timeit",
    "measure_time",
    "count_calls",
    "inc_counter",
    "get_metrics",
    "get_counters",
    "get_histograms",
    "observe_histogram",
    "record_last_run",
    "get_last_runs",
    "metrics_registry",
    "set_instrumentation_enabled",
    "instrumentation_enabled",
]
