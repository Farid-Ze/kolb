from app.engine.authoring import get_instrument_spec, list_instrument_specs
from app.instruments import klsi4  # noqa: F401  # ensure side effects run


def test_klsi_manifest_registered():
    spec = get_instrument_spec("KLSI", "4.0")
    assert spec.name.startswith("Kolb")
    assert spec.delivery.expected_contexts == 8
    assert "learning_style_item" in spec.response_models
    locales = spec.manifest()["resources"]["locales"]
    assert any(entry["code"] == "id" for entry in locales)


def test_manifest_listing_includes_klsi():
    manifests = list_instrument_specs()
    keys = {(spec.code, spec.version) for spec in manifests}
    assert ("KLSI", "4.0") in keys
