import json
import sys
import os
from dotenv import load_dotenv

# Load .env from root
root_dir = os.path.join(os.path.dirname(__file__), "..", "..")
load_dotenv(os.path.join(root_dir, ".env"))

# Add backend to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.main import app

def dump_openapi():
    openapi_data = app.openapi()
    with open("openapi.json", "w") as f:
        json.dump(openapi_data, f, indent=2)
    print("openapi.json generated successfully.")

if __name__ == "__main__":
    dump_openapi()