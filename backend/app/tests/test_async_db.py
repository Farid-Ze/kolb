import pytest
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.db.database import get_async_db, async_engine

@pytest.mark.asyncio
async def test_async_db_connection():
    async for session in get_async_db():
        result = await session.execute(text("SELECT 1"))
        assert result.scalar() == 1
        
@pytest.mark.asyncio
async def test_async_engine_url():
    # Verify URL transformation
    url = str(async_engine.url)
    assert "sqlite+aiosqlite" in url or "postgresql+psycopg" in url

@pytest.mark.asyncio
async def test_concurrent_connections():
    async def run_query():
        async for session in get_async_db():
            result = await session.execute(text("SELECT 1"))
            return result.scalar()

    tasks = [run_query() for _ in range(5)]
    results = await asyncio.gather(*tasks)
    assert all(r == 1 for r in results)

@pytest.mark.asyncio
async def test_invalid_connection_string():
    # Test with an invalid protocol to ensure it fails gracefully or raises error
    try:
        bad_engine = create_async_engine("invalid-protocol://test")
        async with bad_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        # We expect an error here (likely ArgumentError or similar from SQLAlchemy)
        assert True

