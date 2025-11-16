from __future__ import annotations

from typing import Dict, List, Tuple

from .spec import InstrumentSpec

_registry: Dict[Tuple[str, str], InstrumentSpec] = {}


def register_instrument_spec(spec: InstrumentSpec) -> None:
    key = (spec.code, spec.version)
    _registry[key] = spec


def get_instrument_spec(code: str, version: str) -> InstrumentSpec:
    key = (code, version)
    if key not in _registry:
        raise KeyError(f"Instrument spec belum terdaftar: {code}:{version}")
    return _registry[key]


def list_instrument_specs() -> List[InstrumentSpec]:
    return list(_registry.values())


def get_instrument_locale_resource(code: str, version: str, locale: str) -> dict:
    spec = get_instrument_spec(code, version)
    return spec.load_locale_resource(locale)
