from __future__ import annotations

import json
from dataclasses import dataclass, field
from importlib import import_module
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

import yaml

from app.i18n.id_messages import AuthoringMessages


class ComponentResolutionError(RuntimeError):
    pass


@dataclass(frozen=True)
class ComponentRef:
    dotted_path: str

    def resolve(self) -> object:
        try:
            module_name, attribute = self.dotted_path.rsplit(".", 1)
        except ValueError as exc:  # pragma: no cover
            raise ComponentResolutionError(
                AuthoringMessages.COMPONENT_PATH_INVALID.format(path=self.dotted_path)
            ) from exc
        module = import_module(module_name)
        try:
            return getattr(module, attribute)
        except AttributeError as exc:
            raise ComponentResolutionError(
                AuthoringMessages.COMPONENT_NOT_FOUND.format(component=self.dotted_path)
            ) from exc

    def ensure_imported(self) -> None:
        _ = self.resolve()


@dataclass
class RegistryBindings:
    definition: Optional[ComponentRef] = None
    plugin: Optional[ComponentRef] = None
    scorer: Optional[ComponentRef] = None
    norm_provider: Optional[ComponentRef] = None
    report_builder: Optional[ComponentRef] = None
    strategy: Optional[ComponentRef] = None

    def references(self) -> Iterable[ComponentRef]:
        for ref in (
            self.definition,
            self.plugin,
            self.scorer,
            self.norm_provider,
            self.report_builder,
            self.strategy,
        ):
            if ref is not None:
                yield ref

    def as_dict(self) -> Dict[str, Optional[str]]:
        return {
            "definition": self.definition.dotted_path if self.definition else None,
            "plugin": self.plugin.dotted_path if self.plugin else None,
            "scorer": self.scorer.dotted_path if self.scorer else None,
            "norm_provider": self.norm_provider.dotted_path if self.norm_provider else None,
            "report_builder": self.report_builder.dotted_path if self.report_builder else None,
            "strategy": self.strategy.dotted_path if self.strategy else None,
        }


@dataclass
class DeliverySpec:
    forced_choice: bool
    sections: List[str] = field(default_factory=list)
    randomize: bool = False
    expected_contexts: Optional[int] = None

    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> "DeliverySpec":
        if not isinstance(payload, dict):  # pragma: no cover
            raise ValueError(AuthoringMessages.DELIVERY_OBJECT_REQUIRED)
        forced_choice = bool(payload.get("forced_choice", False))
        sections = list(payload.get("sections", []) or [])
        randomize = bool(payload.get("randomize", False))
        expected_contexts = payload.get("expected_contexts")
        if expected_contexts is not None:
            expected_contexts = int(expected_contexts)
        return cls(
            forced_choice=forced_choice,
            sections=sections,
            randomize=randomize,
            expected_contexts=expected_contexts,
        )

    def summary(self) -> Dict[str, Any]:
        return {
            "forced_choice": self.forced_choice,
            "sections": self.sections,
            "randomize": self.randomize,
            "expected_contexts": self.expected_contexts,
        }


@dataclass
class ResponseModelSpec:
    model_type: str
    options: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> "ResponseModelSpec":
        if not isinstance(payload, dict):  # pragma: no cover
            raise ValueError(AuthoringMessages.RESPONSE_MODEL_OBJECT_REQUIRED)
        if "type" not in payload:
            raise ValueError(AuthoringMessages.RESPONSE_MODEL_TYPE_REQUIRED)
        options = payload.get("options") or {}
        if not isinstance(options, dict):
            raise ValueError(AuthoringMessages.RESPONSE_MODEL_OPTIONS_OBJECT)
        return cls(model_type=str(payload["type"]), options=dict(options))

    def summary(self) -> Dict[str, Any]:
        return {"type": self.model_type, "options": self.options}


@dataclass
class LocaleResource:
    code: str
    label: Optional[str]
    file_path: Path

    @classmethod
    def from_dict(cls, payload: Dict[str, Any], *, base_path: Path) -> "LocaleResource":
        if not isinstance(payload, dict):
            raise ValueError(AuthoringMessages.LOCALE_RESOURCE_OBJECT)
        code = str(payload.get("code") or "").strip()
        if not code:
            raise ValueError(AuthoringMessages.LOCALE_RESOURCE_CODE_REQUIRED)
        label = payload.get("label")
        file_value = payload.get("file")
        if not file_value:
            raise ValueError(AuthoringMessages.LOCALE_RESOURCE_FILE_REQUIRED)
        if not isinstance(file_value, str):
            raise ValueError(AuthoringMessages.LOCALE_RESOURCE_FILE_STRING)
        file_path = (base_path / file_value).resolve()
        if not file_path.exists():
            raise FileNotFoundError(
                AuthoringMessages.LOCALE_RESOURCE_FILE_NOT_FOUND.format(path=file_path)
            )
        return cls(code=code, label=str(label) if label else None, file_path=file_path)


@dataclass
class InstrumentSpec:
    code: str
    version: str
    name: str
    description: Optional[str]
    default_strategy: Optional[str]
    delivery: DeliverySpec
    contexts: List[str]
    response_models: Dict[str, ResponseModelSpec]
    registry: RegistryBindings
    branching: Dict[str, Any] = field(default_factory=dict)
    base_path: Path = field(default_factory=Path)
    locale_resources: Dict[str, LocaleResource] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, payload: Dict[str, Any], *, base_path: Path) -> "InstrumentSpec":
        if not isinstance(payload, dict):  # pragma: no cover
            raise ValueError(AuthoringMessages.INSTRUMENT_SPEC_OBJECT_REQUIRED)
        instrument = payload.get("instrument")
        if not isinstance(instrument, dict):
            raise ValueError(AuthoringMessages.INSTRUMENT_SECTION_REQUIRED)
        code = str(instrument.get("code") or "").strip()
        version = str(instrument.get("version") or "").strip()
        if not code or not version:
            raise ValueError(AuthoringMessages.INSTRUMENT_CODE_VERSION_REQUIRED)
        name = str(instrument.get("name") or "").strip()
        description = instrument.get("description")
        default_strategy = instrument.get("default_strategy")

        delivery = DeliverySpec.from_dict(payload.get("delivery", {}))
        contexts = list(payload.get("contexts", []) or [])
        response_models_payload = payload.get("response_models", {})
        if not isinstance(response_models_payload, dict):
            raise ValueError(AuthoringMessages.RESPONSE_MODELS_OBJECT_REQUIRED)
        response_models = {
            key: ResponseModelSpec.from_dict(value)
            for key, value in response_models_payload.items()
        }

        registry_payload = payload.get("registry", {})
        if not isinstance(registry_payload, dict):
            raise ValueError(AuthoringMessages.REGISTRY_OBJECT_REQUIRED)
        registry = RegistryBindings(
            definition=_component_ref_or_none(registry_payload, "definition"),
            plugin=_component_ref_or_none(registry_payload, "plugin"),
            scorer=_component_ref_or_none(registry_payload, "scorer"),
            norm_provider=_component_ref_or_none(registry_payload, "norm_provider"),
            report_builder=_component_ref_or_none(registry_payload, "report_builder"),
            strategy=_component_ref_or_none(registry_payload, "strategy"),
        )

        branching_payload = payload.get("branching") or {}
        if not isinstance(branching_payload, dict):
            raise ValueError(AuthoringMessages.BRANCHING_OBJECT_REQUIRED)

        resources_payload = payload.get("resources", {}) or {}
        if not isinstance(resources_payload, dict):
            raise ValueError(AuthoringMessages.RESOURCES_OBJECT_REQUIRED)
        locales_payload = resources_payload.get("locales", []) or []
        if not isinstance(locales_payload, list):
            raise ValueError(AuthoringMessages.RESOURCES_LOCALES_ARRAY_REQUIRED)
        locale_resources = {
            locale_spec.code: locale_spec
            for locale_spec in (
                LocaleResource.from_dict(item, base_path=base_path) for item in locales_payload
            )
        }

        spec = cls(
            code=code,
            version=version,
            name=name or code,
            description=str(description) if description is not None else None,
            default_strategy=str(default_strategy) if default_strategy else None,
            delivery=delivery,
            contexts=contexts,
            response_models=response_models,
            registry=registry,
            branching=dict(branching_payload),
            base_path=base_path,
            locale_resources=locale_resources,
        )
        spec._ensure_bindings()
        return spec

    def _ensure_bindings(self) -> None:
        for ref in self.registry.references():
            ref.ensure_imported()

    def manifest(self) -> Dict[str, Any]:
        return {
            "code": self.code,
            "version": self.version,
            "name": self.name,
            "description": self.description,
            "default_strategy": self.default_strategy,
            "delivery": self.delivery.summary(),
            "contexts": self.contexts,
            "response_models": {
                key: model.summary() for key, model in self.response_models.items()
            },
            "branching": self.branching,
            "resources": {
                "locales": [
                    {
                        "code": resource.code,
                        "label": resource.label,
                    }
                    for resource in self.locale_resources.values()
                ]
            },
            "registry": self.registry.as_dict(),
        }

    def load_locale_resource(self, locale: str) -> Dict[str, Any]:
        try:
            resource = self.locale_resources[locale]
        except KeyError as exc:
            raise KeyError(
                AuthoringMessages.LOCALE_RESOURCE_LOOKUP_FAILED.format(locale=locale)
            ) from exc
        with resource.file_path.open("r", encoding="utf-8") as handle:
            if resource.file_path.suffix.lower() in {".yaml", ".yml"}:
                return yaml.safe_load(handle) or {}
            return json.load(handle)


def _component_ref_or_none(payload: Dict[str, Any], key: str) -> Optional[ComponentRef]:
    value = payload.get(key)
    if not value:
        return None
    if not isinstance(value, str):
        raise ValueError(
            AuthoringMessages.REGISTRY_VALUE_STRING_REQUIRED.format(key=key)
        )
    return ComponentRef(value)


def load_instrument_spec(path: Path) -> InstrumentSpec:
    if not path.exists():
        raise FileNotFoundError(
            AuthoringMessages.INSTRUMENT_SPEC_NOT_FOUND.format(path=path)
        )
    with path.open("r", encoding="utf-8") as fh:
        payload = yaml.safe_load(fh) or {}
    return InstrumentSpec.from_dict(payload, base_path=path.parent)
