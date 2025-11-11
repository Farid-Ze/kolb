from __future__ import annotations

from typing import Any, Iterable, Mapping, MutableMapping

from app.engine.interfaces import InstrumentId

LocalePayload = Mapping[str, Any] | None


def _extract_localized_maps(locale_payload: LocalePayload) -> tuple[dict[int, dict[str, Any]], dict[str, str], dict[str, Any]]:
    if not locale_payload:
        return {}, {}, {}
    items_section = locale_payload.get("items") if isinstance(locale_payload, Mapping) else None
    localized_items: dict[int, dict[str, Any]] = {}
    if isinstance(items_section, Mapping):
        learning_items = items_section.get("learning_style")
        if isinstance(learning_items, Iterable):
            for entry in learning_items:
                if not isinstance(entry, Mapping):
                    continue
                number = entry.get("item_number")
                if isinstance(number, int):
                    localized_items[number] = dict(entry)
    contexts = locale_payload.get("contexts") if isinstance(locale_payload, Mapping) else None
    contexts_map = dict(contexts) if isinstance(contexts, Mapping) else {}
    metadata = locale_payload.get("metadata") if isinstance(locale_payload, Mapping) else None
    metadata_map = dict(metadata) if isinstance(metadata, Mapping) else {}
    return localized_items, contexts_map, metadata_map


def _localize_options(option: MutableMapping[str, Any], localized: Mapping[str, Any]) -> None:
    mode = option.get("learning_mode")
    if isinstance(mode, str):
        localized_options = localized.get("options")
        if isinstance(localized_options, Mapping):
            text = localized_options.get(mode)
            if text:
                option["text_localized"] = text


def compose_delivery_payload(
    inst_id: InstrumentId,
    items: Iterable[Any],
    delivery: Any,
    manifest: Mapping[str, Any] | None,
    locale_payload: LocalePayload,
    *,
    locale: str | None = None,
) -> dict[str, Any]:
    """Pure helper that constructs the delivery payload for a session."""
    localized_items, localized_contexts, locale_metadata = _extract_localized_maps(locale_payload)
    items_payload: list[dict[str, Any]] = []
    for item in items:
        entry: dict[str, Any] = {
            "id": getattr(item, "id", None),
            "number": getattr(item, "number", None),
            "type": getattr(item, "type", None),
            "stem": getattr(item, "stem", None),
        }
        options = getattr(item, "options", None)
        if isinstance(options, list):
            entry["options"] = [dict(opt) if isinstance(opt, Mapping) else opt for opt in options]
        else:
            entry["options"] = options
        localized_entry = localized_items.get(entry.get("number")) if entry.get("number") is not None else None
        if isinstance(localized_entry, Mapping):
            stem = localized_entry.get("stem")
            if stem:
                entry["stem_localized"] = stem
            if isinstance(entry.get("options"), list):
                for option_payload in entry["options"]:  # type: ignore[index]
                    if isinstance(option_payload, MutableMapping):
                        _localize_options(option_payload, localized_entry)
        items_payload.append(entry)

    delivery_section = {
        "forced_choice": getattr(delivery, "forced_choice", None),
        "sections": getattr(delivery, "sections", None),
        "randomize": getattr(delivery, "randomize", None),
        "expected_contexts": getattr(delivery, "expected_contexts", None),
    }

    i18n_section = None
    if locale_payload:
        i18n_section = {
            "locale": locale,
            "metadata": locale_metadata,
            "contexts": localized_contexts,
        }

    return {
        "instrument": {
            "code": inst_id.key,
            "version": inst_id.version,
        },
        "delivery": delivery_section,
        "items": items_payload,
        "manifest": manifest,
        "i18n": i18n_section,
    }
