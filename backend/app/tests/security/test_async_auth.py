import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_register_async(db_setup):
    import os
    from app.core.config import settings
    print(f"DEBUG: test_register_async CWD: {os.getcwd()}")
    print(f"DEBUG: settings.database_url: {settings.database_url}")
    print(f"DEBUG: test.db exists: {os.path.exists('test.db')}")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        email = f"user_async_{uuid.uuid4().hex[:8]}@test.com"
        response = await client.post("/api/v1/auth/register", json={
            "email": email,
            "password": "SecurePass123!",
            "full_name": "Async User"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == email
        assert "id" in data
