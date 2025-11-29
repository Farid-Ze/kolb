"""
QA Protocol A: Bank Vault Test - Race Condition & Transactional Integrity
Tests grant redemption system under extreme concurrency (100x simultaneous requests).
"""
import asyncio
import pytest
import pytest_asyncio
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text, select
from typing import List

from app.core.config import settings
from app.models.klsi.grant import AccessGrant
from app.models.klsi.user import User
from app.services.grant_service import GrantService, InsufficientCreditsError
from app.db.repositories.grant import GrantRepository

# Standalone fixtures to avoid class-based async issues

@pytest_asyncio.fixture
async def async_engine(db_setup):
    """Create async engine for testing."""
    from sqlalchemy.engine import make_url
    url = make_url(settings.database_url)
    async_url = url.render_as_string(hide_password=False)
    if url.get_backend_name() == "postgresql":
        async_url = async_url.replace("postgresql://", "postgresql+psycopg://")
    elif url.get_backend_name() == "sqlite":
        async_url = async_url.replace("sqlite://", "sqlite+aiosqlite://")
    
    engine = create_async_engine(async_url, pool_pre_ping=True)
    yield engine
    await engine.dispose()

@pytest_asyncio.fixture
async def session_factory(async_engine):
    """Create session factory."""
    return async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

@pytest_asyncio.fixture
async def test_user(session_factory):
    """Create test user with known ID."""
    async with session_factory() as session:
        # Check if test user exists
        result = await session.execute(
            select(User).where(User.email == "race_test_standalone@test.com")
        )
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                full_name="Race Test User Standalone",
                email="race_test_standalone@test.com",
                password_hash="test_hash",
                role="MEDIATOR"
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
    
    return user

@pytest_asyncio.fixture
async def single_credit_grant(session_factory, test_user):
    """Create grant with exactly 1 credit for race testing."""
    async with session_factory() as session:
        grant = AccessGrant(
            id=uuid.uuid4(),
            grantee_id=test_user.id,
            instrument_id=1,  # KLSI
            credits_total=1,
            credits_consumed=0,
            source_ref="QA_PROTOCOL_A_TEST_STANDALONE",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        session.add(grant)
        await session.commit()
        await session.refresh(grant)
    
    return grant

@pytest.mark.asyncio
async def test_100x_concurrent_redemption_single_credit(
    session_factory, test_user, single_credit_grant
):
    """
    CRITICAL TEST: 100 concurrent redemption attempts, only 1 should succeed.
    """
    results = []
    
    async def attempt_redeem(attempt_num):
        """Single redemption attempt."""
        try:
            async with session_factory() as session:
                grant_service = GrantService(session)
                await grant_service.redeem_credit(
                    user_id=test_user.id,
                    instrument_id=1
                )
            return {"attempt": attempt_num, "status": "success"}
        except InsufficientCreditsError:
            return {"attempt": attempt_num, "status": "insufficient_credits"}
        except Exception as e:
            return {"attempt": attempt_num, "status": "error", "error": str(e), "type": type(e).__name__}
    tasks = [attempt_redeem(i) for i in range(100)]
    results = await asyncio.gather(*tasks)

    # Analyze results
    successes = [r for r in results if r["status"] == "success"]
    failures_insufficient = [r for r in results if r["status"] == "insufficient_credits"]
    errors = [r for r in results if r["status"] == "error"]

    print(f"\nDEBUG: Successes: {len(successes)}")
    print(f"DEBUG: Insufficient Credits: {len(failures_insufficient)}")
    print(f"DEBUG: Errors: {len(errors)}")
    if errors:
        print(f"DEBUG: First error: {errors[0]}")

    # PASS CRITERIA
    assert len(successes) == 1, f"Expected exactly 1 success, got {len(successes)}"
    assert len(failures_insufficient) >= 95, f"Expected ~99 insufficient_credits, got {len(failures_insufficient)}"
    assert len(errors) <= 4, f"Too many errors ({len(errors)}), check for deadlocks or connection issues"
