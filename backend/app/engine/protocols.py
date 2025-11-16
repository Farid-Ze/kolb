"""Protocol definitions for engine interfaces.

This module defines Protocol classes (PEP 544) for structural subtyping.
Protocols enable:
- Duck typing with type checking
- Easy mocking in tests (no need for full implementations)
- Interface documentation without inheritance
- Flexibility in implementation choices

Use these protocols when:
- Defining plugin interfaces
- Mocking dependencies in tests
- Documenting expected behavior
- Enabling structural type compatibility
"""

from __future__ import annotations

from typing import Any, Literal, Mapping, Protocol, runtime_checkable

__all__ = [
    "ScoringStrategy",
    "NormProvider",
    "AssessmentPlugin",
    "ReportGenerator",
]


@runtime_checkable
class ScoringStrategy(Protocol):
    """Protocol for scoring strategy implementations.
    
    A scoring strategy computes scale scores, dialectics, and learning styles
    from raw user responses. Each instrument (KLSI, MBTI, etc.) implements
    its own scoring logic via this protocol.
    
    Example:
        >>> class KLSI4ScoringStrategy:
        ...     def compute_scores(self, responses, context):
        ...         # Implement KLSI 4.0 scoring logic
        ...         return scores
        >>> 
        >>> # Type checker validates the protocol
        >>> strategy: ScoringStrategy = KLSI4ScoringStrategy()
    """
    
    def compute_scores(
        self,
        responses: Mapping[str, Any],
        context: Mapping[str, Any],
    ) -> Mapping[str, Any]:
        """Compute scores from raw responses.
        
        Args:
            responses: User responses to assessment items.
            context: Additional context (user demographics, norms, etc.).
            
        Returns:
            Dictionary containing computed scores, dialectics, and style.
        """
        ...


@runtime_checkable
class NormProvider(Protocol):
    """Protocol for normative data providers.
    
    Norm providers convert raw scores to percentiles using normative
    reference data. Implementations can use database lookups, in-memory
    caches, or external APIs.
    
    Example:
        >>> class DatabaseNormProvider:
        ...     def get_percentile(self, norm_group, scale, raw_score):
        ...         return db.query(...).first()
        >>> 
        >>> provider: NormProvider = DatabaseNormProvider()
    """
    
    def get_percentile(
        self,
        norm_group: str,
        scale_name: Literal["CE", "RO", "AC", "AE", "ACCE", "AERO", "LFI"],
        raw_score: int | float,
    ) -> float | None:
        """Retrieve percentile for given raw score.
        
        Args:
            norm_group: Demographic segment (e.g., "Total", "COUNTRY:Indonesia").
            scale_name: Scale identifier - must be one of the valid KLSI scale names.
            raw_score: Raw score value to convert.
            
        Returns:
            Percentile value (0-100) or None if not found.
        """
        ...
    
    def has_norms_for(self, norm_group: str) -> bool:
        """Check if norms exist for given group.
        
        Args:
            norm_group: Demographic segment to check.
            
        Returns:
            True if norms are available, False otherwise.
        """
        ...


@runtime_checkable
class AssessmentPlugin(Protocol):
    """Protocol for assessment instrument plugins.
    
    Assessment plugins provide instrument definitions, scoring strategies,
    and interpretation logic. New instruments can be added by implementing
    this protocol and registering via entry points.
    
    Example:
        >>> class KLSI4Plugin:
        ...     instrument_id = "KLSI"
        ...     version = "4.0"
        ...     
        ...     def get_scoring_strategy(self):
        ...         return KLSI4ScoringStrategy()
        >>> 
        >>> plugin: AssessmentPlugin = KLSI4Plugin()
    """
    
    instrument_id: str
    """Unique instrument identifier (e.g., "KLSI", "MBTI")."""
    
    version: str
    """Instrument version (e.g., "4.0", "1.2.3")."""
    
    def get_scoring_strategy(self) -> ScoringStrategy:
        """Return scoring strategy for this instrument.
        
        Returns:
            ScoringStrategy implementation for computing scores.
        """
        ...
    
    def get_parameters(self) -> Mapping[str, Any]:
        """Return instrument parameters.
        
        Returns:
            Dictionary containing configuration (item count, style windows,
            balance medians, etc.).
        """
        ...


@runtime_checkable
class ReportGenerator(Protocol):
    """Protocol for report generation implementations.
    
    Report generators transform assessment results into user-facing
    reports. Implementations can produce JSON, PDF, HTML, or other formats.
    
    Example:
        >>> class JSONReportGenerator:
        ...     def generate_report(self, results, user):
        ...         return {"style": results.style, ...}
        >>> 
        >>> generator: ReportGenerator = JSONReportGenerator()
    """
    
    def generate_report(
        self,
        results: Mapping[str, Any],
        user_context: Mapping[str, Any] | None = None,
    ) -> Mapping[str, Any]:
        """Generate report from assessment results.
        
        Args:
            results: Computed assessment results (scores, styles, etc.).
            user_context: Optional user information for personalization.
            
        Returns:
            Report data structure ready for delivery to user.
        """
        ...
    
    def get_format(self) -> str:
        """Return report format identifier.
        
        Returns:
            Format string (e.g., "json", "pdf", "html").
        """
        ...


# Type aliases for common protocol collections
ScoringStrategies = Mapping[str, ScoringStrategy]
NormProviders = Mapping[str, NormProvider]
AssessmentPlugins = Mapping[str, AssessmentPlugin]
