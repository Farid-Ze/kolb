import asyncio
import sys
import uuid
from typing import cast
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.database import Base
from app.models.klsi.user import User
from app.services.engine import EngineSessionService
# Import plugin to register it
import app.instruments.klsi4.plugin
# from app.models.klsi.enums import UserRole

# Setup async DB
if "sqlite" in settings.database_url:
    DATABASE_URL = settings.database_url.replace("sqlite://", "sqlite+aiosqlite://")
else:
    DATABASE_URL = settings.database_url.replace("postgresql://", "postgresql+asyncpg://")
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False) # type: ignore

async def main():
    async with cast(AsyncSession, AsyncSessionLocal()) as db:
        # 1. Create or get a test user
        from sqlalchemy import select
        result = await db.execute(select(User).filter(User.email == "debug_state@example.com"))
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                email="debug_state@example.com",
                full_name="Debug State",
                password_hash="hashed_secret",
                role="STUDENT",
                # is_active=True
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        
        print(f"User ID: {user.id}")

        # 2. Start a session
        service = EngineSessionService(db)
        try:
            session = await service.start_session(user, instrument_code="KLSI4")
            print(f"Session started: {session.id}")
        except Exception as e:
            print(f"Failed to start session: {e}")
            # Try to find an existing session
            from app.models.klsi.assessment import AssessmentSession
            result = await db.execute(select(AssessmentSession).filter(AssessmentSession.user_id == user.id))
            session = result.scalars().first()
            if session:
                print(f"Using existing session: {session.id}")
            else:
                print("No session available.")
                return

        # 3. Call session_state
        print("Calling session_state...")
        try:
            state = await service.session_state(session.id, user)
            print("Session State retrieved successfully.")
            print(f"Items count: {len(state.get('delivery', {}).get('items', []))}")
        except Exception as e:
            print(f"CRASH in session_state: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
