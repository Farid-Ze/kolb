from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.errors import DomainError
from app.core.logging import _CORRELATION_ID


def register_exception_handlers(app: FastAPI) -> None:
    """Register shared HTTP translators for domain-layer exceptions.
    
    Implements RFC 7807 Problem Details for HTTP APIs.
    """

    @app.exception_handler(DomainError)
    def _handle_domain_error(request: Request, exc: DomainError) -> JSONResponse:
        status_code = getattr(exc, "status_code", 400)
        
        # Construct RFC 7807 payload
        payload: dict[str, Any] = {
            "type": f"about:blank",  # Ideally a URI to documentation
            "title": exc.error_code,
            "status": status_code,
            "detail": exc.message,
            "instance": str(request.url.path),
        }
        
        # Add extensions
        if isinstance(exc.detail, dict):
             payload.update(exc.detail)
        elif exc.detail is not None:
             payload["extra"] = exc.detail

        # Include correlation ID for request tracing
        correlation_id = _CORRELATION_ID.get()
        if correlation_id:
            payload["correlation_id"] = correlation_id
            
        return JSONResponse(status_code=status_code, content=payload)
