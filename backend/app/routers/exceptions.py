from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.errors import DomainError
from app.core.logging import _CORRELATION_ID


def register_exception_handlers(app: FastAPI) -> None:
    """Register shared HTTP translators for domain-layer exceptions."""

    @app.exception_handler(DomainError)
    async def _handle_domain_error(request: Request, exc: DomainError) -> JSONResponse:
        if isinstance(exc.detail, dict):
            detail_payload: dict[str, Any] = {**exc.detail}
            detail_payload.setdefault("message", exc.message)
        elif exc.detail is not None:
            detail_payload = {"message": exc.message, "extra": exc.detail}
        else:
            detail_payload = {"message": exc.message}
        payload: dict[str, Any] = {
            "error": exc.error_code,
            "detail": detail_payload,
        }
        # Include correlation ID for request tracing
        correlation_id = _CORRELATION_ID.get()
        if correlation_id:
            payload["correlation_id"] = correlation_id
        return JSONResponse(status_code=getattr(exc, "status_code", 400), content=payload)
