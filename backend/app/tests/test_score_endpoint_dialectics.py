from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.score import RawTotalsWrite

client = TestClient(app)

def test_score_raw_assim_accom_sign():
    # Dummy payload to satisfy schema validation
    dummy_items = [
        {"item_id": i, "ranks": [{"choice_id": i*4+j, "rank": j} for j in range(1, 5)]}
        for i in range(1, 13)
    ]
    dummy_contexts = [
        {"context_id": i, "ranks": {1: 1, 2: 2, 3: 3, 4: 4}}
        for i in range(1, 9)
    ]
    
    payload = {
        "items": dummy_items,
        "contexts": dummy_contexts
    }

    # Mock the calculation to return specific raw scores
    # We use values that sum to 120 to be realistic: CE=18, RO=22, AC=40, AE=40
    # (18+22+40+40 = 120)
    mock_totals = RawTotalsWrite(CE=18, RO=22, AC=40, AE=40)
    
    # Mock context resolution to return empty list or dummy data, as we don't test LFI here
    mock_resolved_contexts = []

    with patch("app.services.score_preview._calculate_raw_totals", return_value=mock_totals), \
         patch("app.services.score_preview._resolve_context_ranks", return_value=mock_resolved_contexts):
        r = client.post("/score/raw", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        raw = data["raw"]
        
        # Verify AC-CE and AE-RO
        # AC=40, CE=18 -> ACCE = 22
        # AE=40, RO=22 -> AERO = 18
        assert raw["acce"] == 40 - 18
        assert raw["aero"] == 40 - 22
        
        # Verify derived dimensions
        # acc_assm = (AC + RO) - (AE + CE) = (40 + 22) - (40 + 18) = 62 - 58 = 4
        expected_acc_assm = (40 + 22) - (40 + 18)
        assert raw["accAssm"] == expected_acc_assm
        
        # Opposite orientation available
        assert raw["accomMinusAssim"] == -expected_acc_assm
        
        # conv_div = (AC + AE) - (CE + RO) = (40 + 40) - (18 + 22) = 80 - 40 = 40
        expected_conv_div = (40 + 40) - (18 + 22)
        assert raw["convDiv"] == expected_conv_div

