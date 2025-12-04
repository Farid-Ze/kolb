"""Rate limiting configuration for API endpoints.

Uses slowapi to provide per-IP rate limiting on sensitive endpoints
like authentication to prevent brute-force attacks.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Rate limiter: Uses client IP address as the key
# Default limits can be overridden per-endpoint with @limiter.limit()
limiter = Limiter(key_func=get_remote_address)
