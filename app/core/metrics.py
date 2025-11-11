from __future__ import annotations

import threading
import time
from contextlib import contextmanager
from typing import Dict


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

    def record(self, label: str, elapsed_ms: float) -> None:
        if not label:
            return
        with self._lock:
            entry = self._timings.get(label)
            if entry is None:
                entry = {"count": 0.0, "total_ms": 0.0, "max_ms": 0.0}
                self._timings[label] = entry
            entry["count"] += 1
            entry["total_ms"] += float(elapsed_ms)
            if elapsed_ms > entry["max_ms"]:
                entry["max_ms"] = float(elapsed_ms)

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


metrics_registry = _MetricsRegistry()


@contextmanager
def timer(label: str):
    """Context manager to time a code block and record it under `label`."""
    t0 = time.perf_counter()
    try:
        yield
    finally:
        dt_ms = (time.perf_counter() - t0) * 1000.0
        metrics_registry.record(label, dt_ms)


def record_timing(label: str):
    """Decorator to time a function and record under `label`."""

    def _wrap(func):
        def _inner(*args, **kwargs):
            t0 = time.perf_counter()
            try:
                return func(*args, **kwargs)
            finally:
                dt_ms = (time.perf_counter() - t0) * 1000.0
                metrics_registry.record(label, dt_ms)

        return _inner

    return _wrap


def get_metrics(reset: bool = False) -> Dict[str, Dict[str, float]]:
    return metrics_registry.snapshot(reset=reset)


def inc_counter(label: str, amount: float = 1.0) -> None:
    metrics_registry.inc(label, amount)


def get_counters(reset: bool = False) -> Dict[str, float]:
    return metrics_registry.counters_snapshot(reset=reset)
