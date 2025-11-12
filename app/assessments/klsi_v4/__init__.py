from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

import yaml

from app.assessments.klsi_v4.types import KLSIParameters
CONFIG_PATH = Path(__file__).with_name("config.yaml")


def load_config() -> KLSIParameters:
    with CONFIG_PATH.open("r", encoding="utf-8") as fh:
        raw: Dict[str, Any] = yaml.safe_load(fh)
    return KLSIParameters.from_raw(raw)
