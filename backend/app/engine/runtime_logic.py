from __future__ import annotations

from dataclasses import dataclass
from types import MappingProxyType
from typing import Any, Iterable, Mapping, MutableMapping

from app.engine.interfaces import InstrumentId

__all__ = [
    "LocalePayload",
    "ValidationReport",
    "FinalizePayload",
    "build_finalize_payload",
    "compose_delivery_payload",
]

LocalePayload = Mapping[str, Any] | None


@dataclass(frozen=True, slots=True)
class ValidationReport:
    """Immutable snapshot of session validation status."""

    ready: bool
    issues: tuple[Mapping[str, Any], ...]
    diagnostics: Mapping[str, Any]

    @classmethod
    def from_mapping(cls, payload: Mapping[str, Any]) -> "ValidationReport":
        ready = bool(payload.get("ready", False))
        raw_issues = payload.get("issues") or ()
        normalized: list[Mapping[str, Any]] = []
        if isinstance(raw_issues, Iterable):
            for entry in raw_issues:
                if isinstance(entry, Mapping):
                    normalized.append(MappingProxyType(dict(entry)))
                else:  # pragma: no cover - defensive fallback for unexpected types
                    normalized.append(MappingProxyType({"detail": entry}))
        diagnostics = payload.get("diagnostics")
        diagnostics_map = MappingProxyType(dict(diagnostics)) if isinstance(diagnostics, Mapping) else MappingProxyType({})
        return cls(ready=ready, issues=tuple(normalized), diagnostics=diagnostics_map)

    def issues_list(self) -> list[dict[str, Any]]:
        return [dict(issue) for issue in self.issues]

    def diagnostics_dict(self) -> dict[str, Any]:
        return dict(self.diagnostics)

    def to_mapping(self) -> dict[str, Any]:
        return {
            "ready": self.ready,
            "issues": self.issues_list(),
            "diagnostics": self.diagnostics_dict(),
        }


@dataclass(frozen=True, slots=True)
class FinalizePayload:
    """Immutable container for finalized scorer result plus metadata."""

    ok: bool
    data: Mapping[str, Any]

    def as_dict(self) -> dict[str, Any]:
        response = {"ok": self.ok}
        response.update(self.data)
        return response


def build_finalize_payload(
    scorer_result: Mapping[str, Any],
    validation: ValidationReport,
    *,
    override: bool,
) -> FinalizePayload:
    base = dict(scorer_result)
    base["validation"] = validation.to_mapping()
    base["override"] = override
    ok = bool(base.get("ok", False))
    body = {key: value for key, value in base.items() if key != "ok"}
    return FinalizePayload(ok=ok, data=MappingProxyType(body))


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
        item_id = getattr(item, "id", None)
        item_number = getattr(item, "number", None)
        entry: dict[str, Any] = {
            "id": item_id,
            "number": item_number,
            "type": getattr(item, "type", None),
            "stem": getattr(item, "stem", None),
        }
        options_payload: Any = getattr(item, "options", None)
        if isinstance(options_payload, list):
            normalized_options: list[Any] = [dict(opt) if isinstance(opt, Mapping) else opt for opt in options_payload]
            entry["options"] = normalized_options
        else:
            entry["options"] = options_payload

        localized_entry = None
        if isinstance(item_number, int):
            localized_entry = localized_items.get(item_number)
        if isinstance(localized_entry, Mapping):
            stem = localized_entry.get("stem")
            if stem:
                entry["stem_localized"] = stem
            options_section = entry.get("options")
            if isinstance(options_section, list):
                for option_payload in options_section:
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
