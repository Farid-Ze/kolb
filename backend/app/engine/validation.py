from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List


@dataclass
class ValidationResult:
    structural: Dict[str, Any] = field(default_factory=dict)
    psychometric: Dict[str, Any] = field(default_factory=dict)
    provenance: Dict[str, Any] = field(default_factory=dict)
    anomalies: List[str] = field(default_factory=list)

    def as_dict(self) -> Dict[str, Any]:
        return {
            "structural": self.structural,
            "psychometric": self.psychometric,
            "provenance": self.provenance,
            "anomalies": self.anomalies,
        }
