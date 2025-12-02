import pytest
import uuid
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.models.klsi.user import User
from app.models.klsi.instrument import Instrument
from app.services.grant_service import GrantService
from app.core.errors import InsufficientCreditsError

@pytest.mark.asyncio
async def test_allocate_and_redeem_credits():
    async with AsyncSessionLocal() as db:
        # Setup: Create a user with unique email
        email = f"test_grant_{uuid.uuid4()}@example.com"
        user = User(email=email, full_name="Test Grant User", password_hash="hash")
        db.add(user)
        await db.commit()
        await db.refresh(user)

        # Get an instrument (assuming seeded)
        stmt = select(Instrument).limit(1)
        result = await db.execute(stmt)
        instrument = result.scalars().first()
        
        if not instrument:
            # Create a dummy instrument if none exists
            instrument = Instrument(
                code="TEST_INST",
                name="Test Instrument",
                version="1.0",
                description="Test Desc",
                is_active=True
            )
            db.add(instrument)
            await db.commit()
            await db.refresh(instrument)

        service = GrantService(db)

        # 1. Allocate Credits
        grant = await service.grant_credits(
            user_id=user.id,
            instrument_id=instrument.id,
            credits=5
        )
        
        assert grant.id is not None
        assert grant.credits_total == 5
        assert grant.credits_consumed == 0
        
        # 2. Check Balance
        summary = await service.get_grant_summary(user.id)
        assert summary["total_available_credits"] == 5
        
        # 3. Redeem Credit
        used_grant = await service.redeem_credit(user.id, instrument.id)
        assert used_grant.id == grant.id
        assert used_grant.credits_consumed == 1
        
        # 4. Check Balance again
        summary = await service.get_grant_summary(user.id)
        assert summary["total_available_credits"] == 4

@pytest.mark.asyncio
async def test_redeem_insufficient_credits():
    async with AsyncSessionLocal() as db:
        email = f"test_poor_{uuid.uuid4()}@example.com"
        user = User(email=email, full_name="Poor User", password_hash="hash")
        db.add(user)
        await db.commit()
        await db.refresh(user)

        stmt = select(Instrument).limit(1)
        result = await db.execute(stmt)
        instrument = result.scalars().first()
        
        if not instrument:
            instrument = Instrument(
                code="TEST_INST_2",
                name="Test Instrument 2",
                version="1.0",
                description="Test Desc",
                is_active=True
            )
            db.add(instrument)
            await db.commit()
            await db.refresh(instrument)

        service = GrantService(db)

        with pytest.raises(InsufficientCreditsError):
            await service.redeem_credit(user.id, instrument.id)
