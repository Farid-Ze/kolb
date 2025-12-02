import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from app.db.database import SessionLocal
from app.services.seeds import (
    seed_instruments_v2,
    seed_learning_styles,
    seed_assessment_items,
    seed_engine_authoring,
    seed_gamification_badges,
    seed_growth_challenges
)

def main():
    db = SessionLocal()
    try:
        print("Seeding instruments...")
        seed_instruments_v2(db)
        print("Seeding learning styles...")
        seed_learning_styles(db)
        print("Seeding assessment items...")
        seed_assessment_items(db)
        print("Seeding engine authoring...")
        seed_engine_authoring(db)
        print("Seeding gamification badges...")
        seed_gamification_badges(db)
        print("Seeding growth challenges...")
        seed_growth_challenges(db)
        db.commit()
        print("Seeding complete.")
    except Exception as e:
        print(f"Seeding failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
