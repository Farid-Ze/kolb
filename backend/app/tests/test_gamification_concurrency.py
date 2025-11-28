"""
Concurrency test for GamificationService.add_points()

This test verifies that the race condition fix using SELECT FOR UPDATE
prevents point loss under concurrent access.
"""
import threading
import time
import pytest
from sqlalchemy.orm import Session

from app.db.database import SessionLocal, engine
from app.models.klsi.user import User
from app.services.gamification_service import GamificationService


def test_concurrent_points_addition():
    """Verify that concurrent point additions don't lose updates (race condition test)."""
    
    # Skip if SQLite, as it doesn't support SELECT FOR UPDATE
    if engine.dialect.name == "sqlite":
        pytest.skip("SQLite does not support SELECT FOR UPDATE, skipping concurrency test")

    # Setup: Create a test user with 0 points
    with SessionLocal() as db:
        test_user = User(
            full_name="Concurrency Test User",
            email=f"concurrency_test_{time.time()}@test.com",
            role="MAHASISWA",
            zen_points=0,
            current_lvl=1
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        user_id = test_user.id

    # Test: Spawn 10 threads, each adds 10 points concurrently
    threads = []
    service = GamificationService()
    
    def add_points_worker():
        with SessionLocal() as db:
            service.add_points(db, user_id, 10)
            db.commit()
    
    # Start all threads
    for _ in range(10):
        t = threading.Thread(target=add_points_worker)
        threads.append(t)
        t.start()
    
    # Wait for all threads to complete
    for t in threads:
        t.join()
    
    # Verify: User should have exactly 100 points (10 threads * 10 points)
    with SessionLocal() as db:
        final_user = db.get(User, user_id)
        assert final_user is not None
        assert final_user.zen_points == 100, f"Expected 100 points, got {final_user.zen_points}"
        assert final_user.current_lvl == 1, f"Expected level 1, got {final_user.current_lvl}"
    
    # Cleanup
    with SessionLocal() as db:
        db.delete(db.get(User, user_id))
        db.commit()
    
    print("✓ Concurrency test passed - no race condition detected")


if __name__ == "__main__":
    test_concurrent_points_addition()
