import asyncio
import sys
import os

# Add the parent directory to sys.path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import AsyncSessionLocal
from app.models.klsi.instrument import Instrument
from sqlalchemy import select

async def dump_instruments():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Instrument))
        instruments = result.scalars().all()
        print(f"Found {len(instruments)} instruments:")
        for instr in instruments:
            print(f"  - ID: {instr.id}, Code: '{instr.code}', Version: '{instr.version}', Active: {instr.is_active}")

if __name__ == "__main__":
    asyncio.run(dump_instruments())
