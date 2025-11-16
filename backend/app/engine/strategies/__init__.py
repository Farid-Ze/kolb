from __future__ import annotations

from app.engine.strategy_registry import register_strategy

from .klsi4 import KLSI4Strategy

register_strategy(KLSI4Strategy(), is_default=True)
