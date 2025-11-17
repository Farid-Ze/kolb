from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_score_raw_assim_accom_sign():
    payload = {
        "raw": {"CE": 18, "RO": 22, "AC": 26, "AE": 20},
        # Provide 8 contexts with forced-choice ranks
        "contexts": [
            {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
            {"CE": 2, "RO": 1, "AC": 4, "AE": 3},
            {"CE": 3, "RO": 4, "AC": 1, "AE": 2},
            {"CE": 4, "RO": 3, "AC": 2, "AE": 1},
            {"CE": 1, "RO": 3, "AC": 4, "AE": 2},
            {"CE": 2, "RO": 4, "AC": 1, "AE": 3},
            {"CE": 3, "RO": 1, "AC": 2, "AE": 4},
            {"CE": 4, "RO": 2, "AC": 3, "AE": 1},
        ],
    }
    r = client.post("/score/raw", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    raw = data["raw"]
    # Core spec: (AC + RO) - (AE + CE)
    expected = (payload["raw"]["AC"] + payload["raw"]["RO"]) - (payload["raw"]["AE"] + payload["raw"]["CE"])
    assert raw["ACC_ASSM"] == expected
    # Opposite orientation available
    assert raw["ACCOM_MINUS_ASSIM"] == -expected
