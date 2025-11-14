from __future__ import annotations

import json
import logging
from contextlib import contextmanager
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any, Dict, Iterator, Mapping, MutableMapping
from uuid import uuid4


_CORRELATION_ID: ContextVar[str | None] = ContextVar("correlation_id", default=None)


class JsonFormatter(logging.Formatter):
    """Serialize log records into single-line JSON for structured ingestion."""

    def format(self, record: logging.LogRecord) -> str:  # noqa: D401 - override
        payload: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        correlation_id = _CORRELATION_ID.get()
        if correlation_id:
            payload["correlation_id"] = correlation_id
        structured = getattr(record, "structured_data", None)
        if isinstance(structured, Mapping):
            payload.update(structured)
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        if record.stack_info:
            payload["stack_info"] = record.stack_info
        return json.dumps(payload, ensure_ascii=True)


class StructuredAdapter(logging.LoggerAdapter):
    """Logger adapter that merges keyword extra fields into structured JSON."""

    def process(self, msg: str, kwargs: MutableMapping[str, Any]) -> tuple[str, MutableMapping[str, Any]]:
        extra_payload: Dict[str, Any] = dict(self.extra or {})
        existing_extra = kwargs.get("extra")
        if isinstance(existing_extra, dict):
            structured = existing_extra.get("structured_data")
            if isinstance(structured, Mapping):
                extra_payload.update(dict(structured))
        else:
            existing_extra = {}
        existing_extra["structured_data"] = extra_payload
        kwargs["extra"] = existing_extra
        return msg, kwargs


_STRUCTURED_ATTR = "_structured_configured"


def configure_logging(*, level: int = logging.INFO, environment: str = "dev") -> None:
    """Configure root logger with JSON formatter once (idempotent).
    
    Args:
        level: Base logging level (default: INFO).
        environment: Runtime environment ('dev', 'test', 'staging', 'prod').
                     In 'dev' mode, DEBUG level is enabled for detailed output.
                     In 'prod' mode, INFO level with reduced verbosity.
    
    The logger is configured with:
    - JSON structured output for easy parsing
    - Correlation ID tracking across requests
    - Environment-aware log levels
    - Idempotent initialization (safe to call multiple times)
    """
    root = logging.getLogger()
    if bool(getattr(root, _STRUCTURED_ATTR, False)):
        return
    
    # Environment-based log level tuning
    if environment in ("dev", "test"):
        # Development: verbose DEBUG for detailed diagnostics
        effective_level = logging.DEBUG if level == logging.INFO else level
    elif environment == "prod":
        # Production: INFO minimum for stability
        effective_level = max(level, logging.INFO)
    else:
        # Staging or unknown: use provided level
        effective_level = level
    
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(effective_level)
    setattr(root, _STRUCTURED_ATTR, True)


def get_logger(name: str, **defaults: Any) -> StructuredAdapter:
    """Return a structured logger adapter injecting default structured fields."""

    logger = logging.getLogger(name)
    return StructuredAdapter(logger, defaults)


def set_correlation_id(value: str | None) -> None:
    """Set correlation id in context for subsequent log records."""

    _CORRELATION_ID.set(value)


def get_correlation_id() -> str | None:
    """Return current correlation id if any."""

    return _CORRELATION_ID.get()


def clear_correlation_id() -> None:
    """Clear correlation id from context."""

    _CORRELATION_ID.set(None)


@contextmanager
def correlation_context(correlation_id: str | None = None) -> Iterator[str]:
    """Context manager to bind/unbind correlation id automatically."""

    cid = correlation_id or str(uuid4())
    token = _CORRELATION_ID.set(cid)
    try:
        yield cid
    finally:
        _CORRELATION_ID.reset(token)


__all__ = [
    "configure_logging",
    "get_logger",
    "set_correlation_id",
    "get_correlation_id",
    "clear_correlation_id",
    "correlation_context",
]
