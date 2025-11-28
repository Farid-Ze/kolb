import sys
import os

# Add current directory to sys.path
sys.path.append(os.getcwd())
os.environ["JWT_SECRET_KEY"] = "test-secret"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.db.database import SessionLocal, Base, engine
# Import models to ensure registration
import app.models.klsi 
from app.services.seeds import seed_instruments

print("Creating tables...")
Base.metadata.create_all(bind=engine)

print("Creating session...")
db = SessionLocal()

print("Calling seed_instruments...")
try:
    seed_instruments(db)
    print("seed_instruments finished successfully.")
except Exception as e:
    print(f"Error in seed_instruments: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
