import json
import os
import sys

# Add current directory to sys.path to allow imports
sys.path.append(os.getcwd())

from app.main import app

def generate_openapi():
    openapi_data = app.openapi()
    
    # Output to project root
    output_path = "../openapi.json"
    
    with open(output_path, "w") as f:
        json.dump(openapi_data, f, indent=2)
    
    print(f"OpenAPI spec generated at {os.path.abspath(output_path)}")

if __name__ == "__main__":
    generate_openapi()
