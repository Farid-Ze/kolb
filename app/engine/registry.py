from __future__ import annotations

from typing import Dict, Tuple

from app.engine.interfaces import (
    AssessmentDefinition,
    EngineNormProvider,
    EngineReportBuilder,
    EngineScorer,
    InstrumentId,
    InstrumentPlugin,
)

_registry: Dict[str, AssessmentDefinition] = {}


def register(assessment: AssessmentDefinition) -> None:
    key = f"{assessment.id}:{assessment.version}"
    _registry[key] = assessment


def get(assessment_id: str, version: str) -> AssessmentDefinition:
    key = f"{assessment_id}:{version}"
    if key not in _registry:
        raise KeyError(f"Assessment definition not registered: {key}")
    return _registry[key]


class EngineRegistry:
    def __init__(self) -> None:
        self._plugins: Dict[Tuple[str, str], InstrumentPlugin] = {}
        self._scorers: Dict[Tuple[str, str], EngineScorer] = {}
        self._norms: Dict[Tuple[str, str], EngineNormProvider] = {}
        self._reports: Dict[Tuple[str, str], EngineReportBuilder] = {}

    def _key(self, inst: InstrumentId) -> Tuple[str, str]:
        return (inst.key, inst.version)

    def register_plugin(self, plugin: InstrumentPlugin) -> None:
        self._plugins[self._key(plugin.id())] = plugin

    def register_scorer(self, inst: InstrumentId, scorer: EngineScorer) -> None:
        self._scorers[self._key(inst)] = scorer

    def register_norms(self, inst: InstrumentId, provider: EngineNormProvider) -> None:
        self._norms[self._key(inst)] = provider

    def register_report(self, inst: InstrumentId, builder: EngineReportBuilder) -> None:
        self._reports[self._key(inst)] = builder

    def plugin(self, inst: InstrumentId) -> InstrumentPlugin:
        key = self._key(inst)
        if key not in self._plugins:
            raise KeyError(f"Instrument plugin not registered: {inst.key}:{inst.version}")
        return self._plugins[key]

    def scorer(self, inst: InstrumentId) -> EngineScorer:
        key = self._key(inst)
        if key not in self._scorers:
            raise KeyError(f"Scorer not registered: {inst.key}:{inst.version}")
        return self._scorers[key]

    def norm_provider(self, inst: InstrumentId) -> EngineNormProvider:
        key = self._key(inst)
        if key not in self._norms:
            raise KeyError(f"Norm provider not registered: {inst.key}:{inst.version}")
        return self._norms[key]

    def report_builder(self, inst: InstrumentId) -> EngineReportBuilder:
        key = self._key(inst)
        if key not in self._reports:
            raise KeyError(f"Report builder not registered: {inst.key}:{inst.version}")
        return self._reports[key]


engine_registry = EngineRegistry()
