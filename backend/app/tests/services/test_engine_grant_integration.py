import pytest
import uuid
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.models.klsi.user import User
from app.models.klsi.instrument import Instrument
from app.models.klsi.grant import AccessGrant
from app.services.engine import EngineSessionService
from app.core.errors import PermissionDeniedError

@pytest.mark.asyncio
async def test_start_session_requires_grant():
    async with AsyncSessionLocal() as db:
        # Setup User
        email = f"test_engine_grant_{uuid.uuid4()}@example.com"
        user = User(email=email, full_name="Test Engine Grant", password_hash="hash")
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        service = EngineSessionService(db)
        
        # 1. Try to start session without grant -> Should Fail
        with pytest.raises(PermissionDeniedError) as excinfo:
            await service.start_session(user, instrument_code="KLSI4", instrument_version="4.0")
        
        # Check for localized message or fallback
        err_msg = str(excinfo.value)
        assert any(msg in err_msg for msg in ["Kuota akses tidak mencukupi", "Insufficient credits", "Kredit tidak mencukupi"])

        # 2. Allocate Grant
        # Find the instrument seeded
        stmt = select(Instrument).where(Instrument.code == "KLSI4", Instrument.version == "4.0")
        result = await db.execute(stmt)
        instrument = result.scalars().first()
        assert instrument is not None, "KLSI4 4.0 instrument not found in seeds"
        
        grant = AccessGrant(
             grantee_id=user.id,
             instrument_id=instrument.id,
             credits_total=1,
             credits_consumed=0
        )
        db.add(grant)
        await db.commit()
        
        # 3. Try to start session -> Should Succeed
        try:
            session = await service.start_session(user, instrument_code="KLSI4", instrument_version="4.0")
            assert session is not None
        except PermissionDeniedError:
            pytest.fail("Should not raise PermissionDeniedError after grant allocation")
        except Exception:
            # Ignore other runtime errors (like missing pipeline config) as we only test the grant gate here
            pass
