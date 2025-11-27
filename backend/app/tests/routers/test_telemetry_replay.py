from pathlib import Path
import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_record_replay_events(tmp_path, monkeypatch):
    # Mock log directory to use tmp_path
    monkeypatch.chdir(tmp_path)
    
    payload = {
        "sessionId": 123,
        "events": [
            {
                "type": "START_SESSION",
                "payload": {"sessionId": 123},
                "timestampMs": 1000
            },
            {
                "type": "SET_ITEM_RANK",
                "payload": {"itemId": 1, "ranks": {1: 1}},
                "timestampMs": 2000
            }
        ]
    }
    
    response = client.post("/telemetry/replay-events", json=payload)
    assert response.status_code == 202
    assert response.json() == {"status": "recorded", "count": 2}
    
    # Verify log file content
    log_file = Path("logs") / "replay_123.jsonl"
    assert log_file.exists()
    
    lines = log_file.read_text(encoding="utf-8").strip().split("\n")
    assert len(lines) == 2
    
    entry1 = json.loads(lines[0])
    assert entry1["session_id"] == 123
    assert entry1["type"] == "START_SESSION"
    assert entry1["payload"] == {"sessionId": 123}
    
    entry2 = json.loads(lines[1])
    assert entry2["type"] == "SET_ITEM_RANK"
