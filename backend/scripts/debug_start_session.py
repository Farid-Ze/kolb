import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.db.database import AsyncSessionLocal
from app.engine.runtime import runtime
from app.models.klsi.user import User
import app.instruments.klsi4.plugin # Register plugin
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        # Get a user
        result = await db.execute(select(User))
        user = result.scalars().first()
        if not user:
            print("No user found")
            return

        print(f"Attempting to start session for user {user.email} with instrument KLSI4")
        try:
            session = await runtime.start_session(
                db=db,
                user=user,
                instrument_code="KLSI4",
                instrument_version="4.0"
            )
            print(f"Session started successfully: {session.id}")
        except Exception as e:
            print(f"Failed to start session: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
