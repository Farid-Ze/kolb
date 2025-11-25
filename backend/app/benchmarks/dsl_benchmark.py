"""Micro-benchmarks for engine DSL evaluator and KLSI scoring logic."""

import statistics
import time
from dataclasses import dataclass

from app.assessments.klsi_v4.calculations import (
    aggregate_mode_scores,
    calculate_combination_metrics,
    calculate_style_intensity,
)
from app.assessments.klsi_v4.logic import _cfg
from app.db.database import SessionLocal
from app.engine.dsl.evaluator import evaluate_rule
from app.engine.norms.factory import build_composite_norm_provider
from app.models.engine import RuleType


@dataclass
class BenchmarkResult:
    name: str
    iterations: int
    elapsed_sec: float

    @property
    def per_call_us(self) -> float:
        return (self.elapsed_sec / self.iterations) * 1_000_000

    def __str__(self) -> str:
        return (
            f"{self.name}: {self.iterations} iterations in {self.elapsed_sec:.3f}s "
            f"({self.per_call_us:.1f} µs/call)"
        )


def _timer(fn, iterations: int) -> BenchmarkResult:
    start = time.perf_counter()
    for _ in range(iterations):
        fn()
    end = time.perf_counter()
    return BenchmarkResult(name=fn.__name__, iterations=iterations, elapsed_sec=end - start)


def benchmark_dsl_sum(iterations: int = 10_000) -> BenchmarkResult:
    expression = {"inputs": ["a", "b", "c", "d"]}
    context = {"a": 1, "b": 2, "c": 3, "d": 4}

    def run():
        evaluate_rule(RuleType.sum, expression, context)

    return _timer(run, iterations)


def benchmark_klsi_intensity(iterations: int = 5_000) -> BenchmarkResult:
    params = _cfg()
    ranks = (
        ("CE", 3),
        ("RO", 2),
        ("AC", 4),
        ("AE", 1),
    ) * 30  # enough tuples to mimic 120 total points

    def run():
        scores = aggregate_mode_scores(ranks)
        metrics = calculate_combination_metrics(scores, params.balance_medians)
        calculate_style_intensity(metrics.ACCE, metrics.AERO)

    return _timer(run, iterations)


def benchmark_percentile_lookup(iterations: int = 2_000) -> BenchmarkResult:
    session = SessionLocal()
    provider = build_composite_norm_provider(session)
    chain = ["Total"]

    def run():
        provider.percentile(chain, "LFI", 0.65)

    try:
        return _timer(run, iterations)
    finally:
        session.close()


def run_all(iterations_scale: float = 1.0) -> list[BenchmarkResult]:
    results = [
        benchmark_dsl_sum(int(10_000 * iterations_scale)),
        benchmark_klsi_intensity(int(5_000 * iterations_scale)),
        benchmark_percentile_lookup(int(500 * iterations_scale)),
    ]
    return results


def main() -> None:
    results = run_all()
    print("Engine Benchmark Results")
    print("=" * 28)
    per_call = []
    for result in results:
        print(result)
        per_call.append(result.per_call_us)
    print()
    print(f"Median per-call latency: {statistics.median(per_call):.1f} µs")


if __name__ == "__main__":
    main()
