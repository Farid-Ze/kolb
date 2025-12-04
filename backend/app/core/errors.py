"""Domain-specific exception hierarchy for the KLSI engine.

All error messages are centralized in app.i18n.id_messages for consistent localization.
"""

from typing import Any

from app.i18n.id_messages import DomainErrorMessages, SessionErrorMessages

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
    "InsufficientCreditsError",
]


class DomainError(Exception):
    """Base class for recoverable domain-level errors.
    
    All error messages use centralized i18n constants for consistent localization.
    """

    status_code: int = 400
    error_code: str = "domain_error"
    default_message: str = DomainErrorMessages.DOMAIN_ERROR

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
    default_message = DomainErrorMessages.VALIDATION_ERROR
    status_code = 400


class InvalidAssessmentData(ValidationError):
    """Raised when assessment inputs violate ipsative or contextual rules."""

    error_code = "invalid_assessment_data"
    default_message = DomainErrorMessages.INVALID_ASSESSMENT_DATA


class PermissionDeniedError(DomainError):
    """Raised when caller lacks the required privilege."""

    error_code = "permission_denied"
    status_code = 403
    default_message = DomainErrorMessages.PERMISSION_DENIED


class NotFoundError(DomainError):
    """Base class for missing domain resources.
    
    Provides diagnostic context for resource lookup failures:
    - resource_type: The type of resource not found (e.g., 'session', 'instrument')
    - resource_id: The identifier that was searched for
    """

    error_code = "not_found"
    status_code = 404
    default_message = DomainErrorMessages.NOT_FOUND

    def __init__(
        self,
        message: str | None = None,
        *,
        detail: Any | None = None,
        status_code: int | None = None,
        resource_type: str | None = None,
        resource_id: str | int | None = None,
    ) -> None:
        super().__init__(message, detail=detail, status_code=status_code)
        self.resource_type = resource_type
        self.resource_id = resource_id
        
        # Build descriptive message with diagnostic context
        context_parts = []
        if resource_type:
            context_parts.append(f"resource={resource_type}")
        if resource_id is not None:
            context_parts.append(f"id={resource_id}")
        if detail:
            context_parts.append(str(detail))
        
        if context_parts:
            self.message = f"{self.message} [{', '.join(context_parts)}]"


class SessionNotFoundError(NotFoundError):
    """Raised when an assessment session cannot be located."""

    error_code = "session_not_found"
    default_message = DomainErrorMessages.NOT_FOUND  # Reuses parent message


class InstrumentNotFoundError(NotFoundError):
    """Raised when an instrument or plugin declaration is missing."""

    error_code = "instrument_not_found"
    default_message = DomainErrorMessages.NOT_FOUND  # Reuses parent message


class ConflictError(DomainError):
    """Base class for domain conflicts.
    
    Provides diagnostic context for state conflicts:
    - resource_type: The type of resource in conflict (e.g., 'session', 'team')
    - resource_id: The identifier of the conflicting resource
    - constraint: The violated constraint name or description
    """

    error_code = "conflict"
    status_code = 409
    default_message = DomainErrorMessages.CONFLICT

    def __init__(
        self,
        message: str | None = None,
        *,
        detail: Any | None = None,
        status_code: int | None = None,
        resource_type: str | None = None,
        resource_id: str | int | None = None,
        constraint: str | None = None,
    ) -> None:
        super().__init__(message, detail=detail, status_code=status_code)
        self.resource_type = resource_type
        self.resource_id = resource_id
        self.constraint = constraint
        
        # Build descriptive message with diagnostic context
        context_parts = []
        if resource_type:
            context_parts.append(f"resource={resource_type}")
        if resource_id is not None:
            context_parts.append(f"id={resource_id}")
        if constraint:
            context_parts.append(f"constraint={constraint}")
        if detail:
            context_parts.append(str(detail))
        
        if context_parts:
            self.message = f"{self.message} [{', '.join(context_parts)}]"


class SessionFinalizedError(ConflictError):
    """Raised when mutating a session that has already been completed."""

    error_code = "session_finalized"
    default_message = DomainErrorMessages.CONFLICT  # Reuses parent message


class NormLookupError(DomainError):
    """Raised when normative conversions cannot be resolved.
    
    Provides diagnostic context for debugging norm lookup failures:
    - scale: The scale name (CE, RO, AC, AE, ACCE, AERO, LFI)
    - raw_score: The raw score value that failed lookup
    - norm_group: The normative group being queried (if applicable)
    """

    error_code = "norm_lookup_failed"
    status_code = 422
    default_message = DomainErrorMessages.NOT_FOUND  # Norm not found

    def __init__(
        self,
        message: str | None = None,
        *,
        detail: Any | None = None,
        status_code: int | None = None,
        scale: str | None = None,
        raw_score: int | float | None = None,
        norm_group: str | None = None,
    ) -> None:
        super().__init__(message, detail=detail, status_code=status_code)
        self.scale = scale
        self.raw_score = raw_score
        self.norm_group = norm_group
        
        # Build descriptive message with diagnostic context
        context_parts = []
        if scale:
            context_parts.append(f"scale={scale}")
        if raw_score is not None:
            context_parts.append(f"raw_score={raw_score}")
        if norm_group:
            context_parts.append(f"norm_group={norm_group}")
        if detail:
            context_parts.append(str(detail))
        
        if context_parts:
            self.message = f"{self.message} [{', '.join(context_parts)}]"


class PipelineNotFoundError(NotFoundError):
    """Raised when an engine pipeline reference is missing."""

    error_code = "pipeline_not_found"
    default_message = DomainErrorMessages.NOT_FOUND


class PipelineConflictError(ConflictError):
    """Raised when pipeline operations would violate uniqueness or state invariants."""

    error_code = "pipeline_conflict"
    default_message = DomainErrorMessages.CONFLICT


class ConfigurationError(DomainError):
    """Raised when server-side configuration is invalid or incomplete."""

    error_code = "configuration_error"
    status_code = 500
    default_message = DomainErrorMessages.CONFIGURATION_ERROR


class InsufficientCreditsError(DomainError):
    """Raised when user has no remaining credits for an instrument."""

    error_code = "insufficient_credits"
    status_code = 402
    default_message = SessionErrorMessages.INSUFFICIENT_CREDITS
