from __future__ import annotations

from pathlib import Path

from app.engine.authoring import load_instrument_spec, register_instrument_spec

_SPEC_PATH = Path(__file__).with_name("instrument.yaml")
_SPEC = load_instrument_spec(_SPEC_PATH)
register_instrument_spec(_SPEC)

# Import plugin & strategy modules to ensure engine registrations occur.
from . import plugin  # noqa: F401
from app.engine import strategies  # noqa: F401
