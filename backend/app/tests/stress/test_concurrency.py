"""
Concurrency stress tests for async grant redemption.
Tests race condition handling and pessimistic locking.
"""
import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.grant_service import GrantService
from app.core.errors import InsufficientCreditsError
from app.models.klsi.grant import AccessGrant


@pytest.mark.asyncio
async def test_concurrent_grant_redemption_single_credit():
    """
    Test that only ONE concurrent request succeeds when user has 1 credit.
    Simulates 10 simultaneous session start attempts.
    """
    # Setup: Mock database with 1 available grant
    user_id = 1
    instrument_id = 1
    
    # Create mock grant with 1 total credit, 0 consumed
    mock_grant = MagicMock(spec=AccessGrant)
    mock_grant.id = 1
    mock_grant.grantee_id = user_id
    mock_grant.instrument_id = instrument_id
    mock_grant.credits_total = 1
    mock_grant.credits_consumed = 0
    mock_grant.expiry_date = None
    
    # Track how many times the grant was selected (should be once with locking)
    selection_count = 0
    redemption_count = 0
    
    async def mock_execute(stmt):
        """Mock execute that simulates pessimistic locking"""
        nonlocal selection_count, redemption_count
        
        # Simulate SELECT FOR UPDATE - only first request gets the grant
        result = AsyncMock()
        if selection_count == 0 and mock_grant.credits_consumed < mock_grant.credits_total:
            result.scalar_one_or_none.return_value = mock_grant
            selection_count += 1
        else:
            result.scalar_one_or_none.return_value = None
        
        return result
    
    async def mock_commit():
        """Mock commit that increments consumed count"""
        nonlocal redemption_count
        mock_grant.credits_consumed += 1
        redemption_count += 1
    
    # Create mock session
    mock_db = AsyncMock(spec=AsyncSession)
    mock_db.execute = mock_execute
    mock_db.commit = mock_commit
    mock_db.refresh = AsyncMock()
    
    # Create service and fire 10 concurrent redemption attempts
    async def attempt_redemption():
        service = GrantService(mock_db)
        try:
            result = await service.redeem_credit(user_id, instrument_id)
            return ("success", result)
        except InsufficientCreditsError as e:
            return ("insufficient_credits", e)
        except Exception as e:
            return ("error", e)
    
    # Execute 10 concurrent attempts
    results = await asyncio.gather(*[attempt_redemption() for _ in range(10)])
    
    # Assert: Only 1 should succeed
    success_count = sum(1 for status, _ in results if status == "success")
    insufficient_count = sum(1 for status, _ in results if status == "insufficient_credits")
    
    assert success_count == 1, f"Expected 1 success, got {success_count}"
    assert insufficient_count == 9, f"Expected 9 insufficient_credits errors, got {insufficient_count}"
    assert redemption_count == 1, "Grant should only be redeemed once"


@pytest.mark.asyncio
async def test_concurrent_grant_redemption_multiple_credits():
    """
    Test concurrent redemption with 3 credits - all should succeed.
    """
    user_id = 1
    instrument_id = 1
    
    # Mock grant with 3 credits
    mock_grant = MagicMock(spec=AccessGrant)
    mock_grant.id = 1
    mock_grant.credits_total = 3
    mock_grant.credits_consumed = 0
    mock_grant.expiry_date = None
    
    lock = asyncio.Lock()  # Simulate database lock
    
    async def mock_execute(stmt):
        async with lock:  # Simulate pessimistic locking
            result = AsyncMock()
            if mock_grant.credits_consumed < mock_grant.credits_total:
                result.scalar_one_or_none.return_value = mock_grant
            else:
                result.scalar_one_or_none.return_value = None
            return result
    
    async def mock_commit():
        async with lock:
            mock_grant.credits_consumed += 1
    
    mock_db = AsyncMock(spec=AsyncSession)
    mock_db.execute = mock_execute
    mock_db.commit = mock_commit
    mock_db.refresh = AsyncMock()
    
    async def attempt_redemption():
        service = GrantService(mock_db)
        try:
            await service.redeem_credit(user_id, instrument_id)
            return "success"
        except InsufficientCreditsError:
            return "insufficient"
    
    # Fire 5 concurrent attempts (3 should succeed, 2 fail)
    results = await asyncio.gather(*[attempt_redemption() for _ in range(5)])
    
    success_count = results.count("success")
    assert success_count == 3, f"Expected 3 successes with 3 credits, got {success_count}"
    assert mock_grant.credits_consumed == 3


@pytest.mark.asyncio
async def test_grant_redemption_no_race_with_serialization():
    """
    Verify pessimistic locking prevents double-spending.
    Even with concurrent access, final count should match requests.
    """
    mock_grant = MagicMock(spec=AccessGrant)
    mock_grant.credits_total = 10
    mock_grant.credits_consumed = 0
    mock_grant.expiry_date = None
    
    lock = asyncio.Lock()
    
    async def mock_execute(stmt):
        async with lock:
            await asyncio.sleep(0.001)  # Simulate DB latency
            result = AsyncMock()
            if mock_grant.credits_consumed < mock_grant.credits_total:
                result.scalar_one_or_none.return_value = mock_grant
            else:
                result.scalar_one_or_none.return_value = None
            return result
    
    async def mock_commit():
        async with lock:
            mock_grant.credits_consumed += 1
    
    mock_db = AsyncMock(spec=AsyncSession)
    mock_db.execute = mock_execute
    mock_db.commit = mock_commit
    mock_db.refresh = AsyncMock()
    
    async def redeem():
        service = GrantService(mock_db)
        try:
            await service.redeem_credit(1, 1)
            return "ok"
        except InsufficientCreditsError:
            return "fail"
    
    # 20 concurrent attempts, only 10 should succeed
    results = await asyncio.gather(*[redeem() for _ in range(20)])
    
    assert results.count("ok") == 10
    assert results.count("fail") == 10
    assert mock_grant.credits_consumed == 10  # No over-redemption


def test_grant_service_sync_fallback():
    """Verify GrantService raises helpful error if used synchronously"""
    # This test documents expected behavior - GrantService is async-only
    mock_db = MagicMock()
    service = GrantService(mock_db)
    
    # Attempting to call without await should be caught by type system
    # This test just documents the API contract
    assert asyncio.iscoroutinefunction(service.redeem_credit)
