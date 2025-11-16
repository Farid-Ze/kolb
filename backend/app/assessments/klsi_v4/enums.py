from __future__ import annotations

from enum import StrEnum

__all__ = ["LearningStyleCode"]


class LearningStyleCode(StrEnum):
    """Enumerates the nine Kolb learning styles using canonical labels."""

    IMAGINING = "Imagining"
    EXPERIENCING = "Experiencing"
    REFLECTING = "Reflecting"
    BALANCING = "Balancing"
    ANALYZING = "Analyzing"
    THINKING = "Thinking"
    DECIDING = "Deciding"
    ACTING = "Acting"
    INITIATING = "Initiating"
