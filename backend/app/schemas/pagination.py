"""Generic pagination schema for consistent API responses.

This module provides a reusable generic pagination wrapper that can be used
across all endpoints requiring paginated data. It ensures consistency in
pagination metadata (page, size, total, pages) while allowing type-safe
item lists through generics.
"""

from typing import Generic, List, TypeVar

from pydantic import Field

from app.schemas.base import CamelModel


T = TypeVar("T")


class PaginatedResponse(CamelModel, Generic[T]):
    """Generic paginated response wrapper.
    
    Use this as a base class for any endpoint that returns paginated data.
    The generic type T represents the schema of individual items.
    
    Example:
        class UserListResponse(PaginatedResponse[UserOut]):
            pass
    
    This will automatically provide:
    - items: List[UserOut]
    - total: int (total count of all items)
    - page: int (current page number, 1-indexed)
    - size: int (items per page)
    - pages: int (total number of pages)
    """
    
    items: List[T] = Field(..., description="List of items for the current page")
    total: int = Field(..., ge=0, description="Total count of all items across all pages")
    page: int = Field(..., ge=1, description="Current page number (1-indexed)")
    size: int = Field(..., ge=1, description="Number of items per page")
    pages: int = Field(..., ge=0, description="Total number of pages")


class CursorPaginatedResponse(CamelModel, Generic[T]):
    """Generic cursor-based paginated response wrapper.
    
    Use this for high-volume data endpoints where offset pagination is inefficient.
    """
    items: List[T] = Field(..., description="List of items for the current page")
    next_cursor: str | None = Field(None, description="Cursor for the next page. Null if no more items.")
    prev_cursor: str | None = Field(None, description="Cursor for the previous page.")
    size: int = Field(..., ge=1, description="Number of items per page")


__all__ = ["PaginatedResponse", "CursorPaginatedResponse"]
