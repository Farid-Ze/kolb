import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.db.database import AsyncSessionLocal
from app.engine.runtime import runtime
from app.models.klsi.user import User
from sqlalchemy import select
import app.instruments.klsi4.plugin # Register plugin

async def main():
    async with AsyncSessionLocal() as db:
        # Get a user
        result = await db.execute(select(User))
        user = result.scalars().first()
        if not user:
            print("No user found")
            return

        print(f"Starting session for user {user.email}...")
        try:
            session = await runtime.start_session(
                db=db,
                user=user,
                instrument_code="KLSI4",
                instrument_version="4.0"
            )
            print(f"Session started: {session.id}")
            
            print("Fetching delivery package...")
            delivery = await runtime.delivery_package(db, session.id)
            print("Delivery package fetched successfully")
            print(f"Items count: {len(delivery['items'])}")
            
        except Exception as e:
            print(f"Failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
