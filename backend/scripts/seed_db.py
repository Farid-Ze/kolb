import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.db.database import SessionLocal
from app.services.seeds import seed_assessment_items, seed_instruments_v2, seed_learning_styles

def main():
    db = SessionLocal()
    try:
        print("Seeding instruments...")
        seed_instruments_v2(db)
        print("Seeding learning styles...")
        seed_learning_styles(db)
        print("Seeding assessment items...")
        seed_assessment_items(db)
        db.commit()
        print("Seeding complete.")
    except Exception as e:
        print(f"Seeding failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
