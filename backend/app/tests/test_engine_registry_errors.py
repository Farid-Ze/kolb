from __future__ import annotations

import pytest
from sqlalchemy.orm import Session

from app.engine.interfaces import DeliveryConfig, InstrumentId, InstrumentPlugin
from app.engine.registry import EngineRegistry, RegistryError


class _DummyPlugin(InstrumentPlugin):
    def __init__(self, key: str = "KLSI", version: str = "4.0") -> None:
        self._id = InstrumentId(key, version)

    def id(self) -> InstrumentId:
        return self._id

    def delivery(self) -> DeliveryConfig:
        return DeliveryConfig(forced_choice=True)

    def fetch_items(self, db: Session, session_id: int):  # pragma: no cover - not needed
        return []

    def validate_submit(self, db: Session, session_id: int, payload: dict) -> None:  # pragma: no cover
        return None


def test_missing_instrument_error_lists_registered_entries():
    registry = EngineRegistry()
    registry.register_plugin(_DummyPlugin("KLSI", "4.0"))

    missing_inst = InstrumentId("XYZ", "1.0")
    with pytest.raises(RegistryError) as excinfo:
        registry.plugin(missing_inst)

    message = str(excinfo.value)
    assert "Instrument components not registered" in message
    assert "XYZ:1.0" in message
    assert "KLSI:4.0" in message


def test_missing_scorer_error_suggests_registration():
    registry = EngineRegistry()
    plugin = _DummyPlugin("KLSI", "4.0")
    registry.register_plugin(plugin)

    with pytest.raises(RegistryError) as excinfo:
        registry.scorer(plugin.id())

    message = str(excinfo.value)
    assert "Scoring strategy not registered" in message
    assert "register_scorer" in message
