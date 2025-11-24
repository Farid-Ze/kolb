from __future__ import annotations

from typing import Callable

from pydantic import BaseModel, ConfigDict


def _snake_to_camel(value: str) -> str:
    """Convert snake_case field names to camelCase for JSON APIs.

    All-uppercase names (e.g., CE, ACCE) are preserved verbatim because they
    represent psychometric abbreviations already shared with the clients.
    """

    if not value:
        return value
    if value.isupper():
        return value
    parts = value.split("_")
    head, *tail = parts
    return head + "".join(word.capitalize() for word in tail)


class CamelModel(BaseModel):
    """Base model that exposes camelCase aliases while keeping snake_case attrs."""

    model_config = ConfigDict(
        alias_generator=_snake_to_camel,
        populate_by_name=True,
    )


__all__ = ["CamelModel"]
