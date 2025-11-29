import pytest
from sqlalchemy import text
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
