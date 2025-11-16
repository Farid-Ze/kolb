"""Performance profiling utilities for detecting slow operations.

This module provides decorators and utilities for monitoring operation
performance and automatically logging warnings when operations exceed
configured thresholds.

Example:
    >>> from app.core.profiling import slow_operation_logger
    >>> 
    >>> @slow_operation_logger(threshold_seconds=1.0)
    >>> def expensive_function(data):
    >>>     # ... processing
    >>>     return result
    >>> 
    >>> # Automatically logs warning if execution > 1.0 seconds
    >>> result = expensive_function(large_dataset)
"""

import functools
import logging
import time
from typing import Any, Callable, TypeVar

from app.core.formatting import format_decimal

logger = logging.getLogger(__name__)

F = TypeVar("F", bound=Callable[..., Any])


def slow_operation_logger(
    threshold_seconds: float = 1.0,
    operation_name: str | None = None,
) -> Callable[[F], F]:
    """Decorator that logs warnings for operations exceeding a time threshold.
    
    Args:
        threshold_seconds: Time threshold in seconds. Operations taking longer
                          than this will trigger a warning log.
        operation_name: Optional name for the operation. If not provided,
                       uses the function name.
    
    Returns:
        Decorated function that monitors execution time.
    
    Example:
        >>> @slow_operation_logger(threshold_seconds=0.5)
        >>> def compute_scores(session_id):
        >>>     # ... computation
        >>>     return scores
        >>> 
        >>> # Warning logged if execution > 0.5 seconds
        >>> result = compute_scores(123)
    """
    def decorator(func: F) -> F:
        op_name = operation_name or func.__name__
        
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            start = time.perf_counter()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.perf_counter() - start
                if duration > threshold_seconds:
                    logger.warning(
                        "slow_operation_detected",
                        extra={
                            "operation": op_name,
                            "duration_seconds": format_decimal(duration, decimals=3),
                            "threshold_seconds": threshold_seconds,
                            "args_count": len(args),
                            "kwargs_keys": list(kwargs.keys()),
                        }
                    )
        
        return wrapper  # type: ignore
    
    return decorator
