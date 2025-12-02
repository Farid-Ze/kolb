import logging
from pathlib import Path
import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_record_replay_events(tmp_path, monkeypatch, caplog):
    # Mock log directory to use tmp_path
    monkeypatch.chdir(tmp_path)
    
    payload = {
        "sessionId": "123e4567-e89b-12d3-a456-426614174000",
        "events": [
            {
                "type": "START_SESSION",
                "payload": {"sessionId": "123e4567-e89b-12d3-a456-426614174000"},
                "timestampMs": 1000
            },
            {
                "type": "SET_ITEM_RANK",
                "payload": {"itemId": 1, "ranks": {1: 1}},
                "timestampMs": 2000
            }
        ]
    }
    
    with caplog.at_level(logging.INFO):
        response = client.post("/telemetry/replay-events", json=payload)
    
    assert response.status_code == 202
    assert response.json() == {"status": "accepted", "count": 2}
    
    # Verify logs are captured (Cloud-Native approach logs to stdout/stderr)
    # We check if the expected log messages are present in the captured logs
    assert "telemetry.replay_event" in caplog.text
    
    # Check structured data in records
    found_start_session = False
    found_set_item_rank = False
    
    for record in caplog.records:
        if record.msg == "telemetry.replay_event":
            data = getattr(record, "structured_data", {})
            if data.get("type") == "START_SESSION":
                found_start_session = True
            if data.get("type") == "SET_ITEM_RANK":
                found_set_item_rank = True
                
    assert found_start_session, "START_SESSION event not found in logs"
    assert found_set_item_rank, "SET_ITEM_RANK event not found in logs"
