from __future__ import annotations

"""Domain-specific exception hierarchy for the KLSI engine."""

from typing import Any

__all__ = [
    "DomainError",
    "ValidationError",
    "InvalidAssessmentData",
    "PermissionDeniedError",
    "NotFoundError",
    "SessionNotFoundError",
    "InstrumentNotFoundError",
    "ConflictError",
    "SessionFinalizedError",
    "NormLookupError",
    "PipelineNotFoundError",
    "PipelineConflictError",
    "ConfigurationError",
]


class DomainError(Exception):
    """Base class for recoverable domain-level errors."""

    status_code: int = 400
    error_code: str = "domain_error"
    default_message: str = "Domain error"

    def __init__(
        self,
        message: str | None = None,
        *,
    detail: Any | None = None,
        status_code: int | None = None,
    ) -> None:
        final_message = message or self.default_message
        super().__init__(final_message)
        self.message = final_message
        self.detail = detail
        if status_code is not None:
            self.status_code = status_code


class ValidationError(DomainError, ValueError):
    """Raised when user-provided assessment data fails validation."""

    error_code = "validation_error"
    default_message = "Data tidak valid"
    status_code = 400


class InvalidAssessmentData(ValidationError):
    """Raised when assessment inputs violate ipsative or contextual rules."""

    error_code = "invalid_assessment_data"
    default_message = "Data asesmen tidak valid"


class PermissionDeniedError(DomainError):
    """Raised when caller lacks the required privilege."""

    error_code = "permission_denied"
    status_code = 403
    default_message = "Akses ditolak"


class NotFoundError(DomainError):
    """Base class for missing domain resources."""

    error_code = "not_found"
    status_code = 404
    default_message = "Resource tidak ditemukan"


class SessionNotFoundError(NotFoundError):
    """Raised when an assessment session cannot be located."""

    error_code = "session_not_found"
    default_message = "Sesi tidak ditemukan"


class InstrumentNotFoundError(NotFoundError):
    """Raised when an instrument or plugin declaration is missing."""

    error_code = "instrument_not_found"
    default_message = "Instrumen tidak ditemukan"


class ConflictError(DomainError):
    """Base class for domain conflicts."""

    error_code = "conflict"
    status_code = 409
    default_message = "Terjadi konflik state"


class SessionFinalizedError(ConflictError):
    """Raised when mutating a session that has already been completed."""

    error_code = "session_finalized"
    default_message = "Sesi sudah selesai"


class NormLookupError(DomainError):
    """Raised when normative conversions cannot be resolved."""

    error_code = "norm_lookup_failed"
    status_code = 422
    default_message = "Konversi norma tidak ditemukan"


class PipelineNotFoundError(NotFoundError):
    """Raised when an engine pipeline reference is missing."""

    error_code = "pipeline_not_found"
    default_message = "Pipeline tidak ditemukan"


class PipelineConflictError(ConflictError):
    """Raised when pipeline operations would violate uniqueness or state invariants."""

    error_code = "pipeline_conflict"
    default_message = "Terjadi konflik pipeline"


class ConfigurationError(DomainError):
    """Raised when server-side configuration is invalid or incomplete."""

    error_code = "configuration_error"
    status_code = 500
    default_message = "Konfigurasi sistem tidak valid"
