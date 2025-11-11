from uuid import uuid4

from app.db.database import SessionLocal
from app.models.klsi.user import User
from app.services.security import create_access_token


def _create_user(role: str = "MAHASISWA") -> tuple[User, str]:
    with SessionLocal() as db:
        email = f"catalog_{uuid4().hex}@mahasiswa.unikom.ac.id"
        user = User(full_name="Catalog Tester", email=email, role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token(subject=str(user.id))
    return user, token


def test_instrument_catalog_listing(client):
    _, token = _create_user()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/engine/instruments", headers=headers)
    assert response.status_code == 200, response.text
    payload = response.json()
    instruments = payload.get("instruments")
    assert isinstance(instruments, list)
    entry = next((inst for inst in instruments if inst["code"] == "KLSI" and inst["version"] == "4.0"), None)
    assert entry is not None
    assert entry["registry"]["plugin"] == "app.instruments.klsi4.plugin.KLSI4Plugin"
    locales = entry["resources"]["locales"]
    assert any(locale["code"] == "id" for locale in locales)


def test_instrument_manifest_detail(client):
    _, token = _create_user(role="MEDIATOR")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/engine/instruments/KLSI/4.0", headers=headers)
    assert response.status_code == 200, response.text
    manifest = response.json()["instrument"]
    assert manifest["code"] == "KLSI"
    assert manifest["delivery"]["expected_contexts"] == 8
    assert "learning_style_item" in manifest["response_models"]
    assert manifest["registry"]["strategy"] == "app.engine.strategies.klsi4.KLSI4Strategy"
    assert any(locale["code"] == "id" for locale in manifest["resources"]["locales"])


def test_instrument_locale_resources(client):
    _, token = _create_user()
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/engine/instruments/KLSI/4.0/resources/id", headers=headers)
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["locale"] == "id"
    resources = payload["resources"]
    assert resources["metadata"]["locale"] == "id"
    assert len(resources["items"]["learning_style"]) == 12
    assert "Starting_Something_New" in resources["contexts"]
