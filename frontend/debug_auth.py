import requests
import random
import os

email = f"test_py_{random.randint(1,10000)}@example.com"
password = os.environ.get("DEBUG_AUTH_PASSWORD", "password123")
payload = {
    "email": email,
    "password": password,
    "full_name": "Py User"
}

try:
    # Use env var for host if needed, default to localhost
    host = os.environ.get("API_HOST", "http://localhost:8000")
    resp = requests.post(f"{host}/auth/register", json=payload)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
