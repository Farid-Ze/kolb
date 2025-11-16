from __future__ import annotations

from functools import lru_cache

from app.i18n.id_styles import STYLE_LABELS_ID


@lru_cache(maxsize=len(STYLE_LABELS_ID) or 32)
def get_style_label(style_name: str | None) -> str | None:
    """Return a localized label for the given style name, memoized for reuse."""

    if style_name is None:
        return None
    return STYLE_LABELS_ID.get(style_name, style_name)


__all__ = ["get_style_label"]
