import requests
import random

email = f"test_py_{random.randint(1,10000)}@example.com"
payload = {
    "email": email,
    "password": "password123",
    "full_name": "Py User"
}

try:
    resp = requests.post("http://localhost:8000/auth/register", json=payload)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
