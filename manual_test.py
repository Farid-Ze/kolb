import sys
import os
import json
from pathlib import Path

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from fastapi.testclient import TestClient
    from app.main import app
    
    client = TestClient(app)
    
    payload = {
        "sessionId": 123,
        "events": [
            {
                "type": "START_SESSION",
                "payload": {"sessionId": 123},
                "timestampMs": 1000
            }
        ]
    }
    
    print("Sending request...")
    response = client.post("/telemetry/replay-events", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 202:
        print("Success!")
    else:
        print("Failed!")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
