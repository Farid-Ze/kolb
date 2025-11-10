from __future__ import annotations

from typing import Dict

from app.engine.interfaces import AssessmentDefinition

_registry: Dict[str, AssessmentDefinition] = {}


def register(assessment: AssessmentDefinition) -> None:
    key = f"{assessment.id}:{assessment.version}"
    _registry[key] = assessment


def get(assessment_id: str, version: str) -> AssessmentDefinition:
    key = f"{assessment_id}:{version}"
    if key not in _registry:
        raise KeyError(f"Assessment definition not registered: {key}")
    return _registry[key]
