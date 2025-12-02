import asyncio
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.models.klsi.instrument import Instrument
from app.models.engine import EngineInstrument
from app.models.klsi.user import User
from app.models.klsi.grant import AccessGrant

from app.models.klsi.items import AssessmentItem

async def check_db():
    async with AsyncSessionLocal() as db:
        # Check Instruments
        result = await db.execute(select(Instrument))
        instruments = result.scalars().all()
        print(f"Instruments found: {len(instruments)}")
        for i in instruments:
            print(f" - {i.code} (v{i.version})")

        # Check AssessmentItems
        result = await db.execute(select(AssessmentItem))
        items = result.scalars().all()
        print(f"AssessmentItems found: {len(items)}")

        # Check EngineInstruments
        try:
            result = await db.execute(select(EngineInstrument))
            engine_instruments = result.scalars().all()
            print(f"EngineInstruments found: {len(engine_instruments)}")
            for i in engine_instruments:
                print(f" - {i.code} (v{i.version})")
        except Exception as e:
            print(f"Error checking EngineInstruments: {e}")

        # Check Users
        result = await db.execute(select(User))
        users = result.scalars().all()
        print(f"Users found: {len(users)}")
        
        # Check Grants
        result = await db.execute(select(AccessGrant))
        grants = result.scalars().all()
        print(f"Grants found: {len(grants)}")

if __name__ == "__main__":
    asyncio.run(check_db())
