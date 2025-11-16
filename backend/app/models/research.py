from __future__ import annotations

"""Compatibility layer re-exporting research ORM entities."""

from app.models.klsi.research import ReliabilityResult, ResearchStudy, ValidityEvidence

__all__ = ["ResearchStudy", "ReliabilityResult", "ValidityEvidence"]
