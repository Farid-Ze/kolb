import sys
import os

# Add current directory to sys.path
sys.path.append(os.getcwd())
os.environ["JWT_SECRET_KEY"] = "test-secret"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from sqlalchemy.orm import configure_mappers
from app.db.database import Base
# Import all models to register them
try:
    print("Importing app.models.klsi...")
    import app.models.klsi
    print("Imported app.models.klsi.")
except Exception as e:
    print(f"Error importing models: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("Configuring mappers...")
try:
    configure_mappers()
    print("Mappers configured successfully.")
except Exception as e:
    print(f"Error configuring mappers: {e}")
    import traceback
    traceback.print_exc()
