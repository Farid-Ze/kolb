from __future__ import annotations

"""Domain-specific exception hierarchy for the KLSI engine."""

__all__ = [
    "DomainError",
    "ValidationError",
    "InvalidAssessmentData",
    "SessionNotFoundError",
    "NormLookupError",
]


class DomainError(Exception):
    """Base class for recoverable domain-level errors."""


class ValidationError(ValueError, DomainError):
    """Raised when user-provided assessment data fails validation."""


class InvalidAssessmentData(ValidationError):
    """Raised when assessment inputs violate ipsative or contextual rules."""


class SessionNotFoundError(KeyError, DomainError):
    """Raised when an assessment session cannot be located."""


class NormLookupError(LookupError, DomainError):
    """Raised when normative conversions cannot be resolved."""
