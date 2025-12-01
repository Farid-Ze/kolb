import asyncio
import logging
import sys
import os
import uuid
from datetime import datetime, timezone

# Add parent directory to path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, delete
from app.db.database import async_engine, AsyncSessionLocal, Base, engine
from app.models.klsi.grant import AccessGrant
from app.models.klsi.user import User
from app.models.klsi.instrument import Instrument
from app.services.grant_service import GrantService
from app.core.errors import InsufficientCreditsError

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Test Configuration
CONCURRENT_REQUESTS = 20
INITIAL_CREDITS = 1
INSTRUMENT_ID = 1  # Assuming KLSI 4.0 has ID 1
USER_ID = 99999  # Test user ID

async def setup_test_data():
    """Create a test user grant with 1 credit."""
    logger.info("Starting setup_test_data")
    
    # Initialize DB (Sync)
    # Ensure tables exist for the test
    Base.metadata.create_all(bind=engine)
    
    # 1. Ensure Instrument Exists
    async with AsyncSessionLocal() as session:
        logger.info(f"Checking Instrument {INSTRUMENT_ID}")
        instrument = await session.get(Instrument, INSTRUMENT_ID)
        if not instrument:
            logger.info(f"Instrument {INSTRUMENT_ID} not found. Creating...")
            instrument = Instrument(
                id=INSTRUMENT_ID,
                code="KLSI4",
                name="Kolb Learning Style Inventory 4.0",
                version="4.0",
                description="Test Instrument"
            )
            session.add(instrument)
            await session.commit()
            logger.info(f"Instrument {INSTRUMENT_ID} created.")
        else:
            logger.info(f"Instrument {INSTRUMENT_ID} exists.")

    # 2. Ensure User Exists
    async with AsyncSessionLocal() as session:
        logger.info(f"Checking User {USER_ID}")
        user = await session.get(User, USER_ID)
        if not user:
            logger.info(f"User {USER_ID} not found. Creating...")
            now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
            user = User(
                id=USER_ID,
                full_name="Concurrency Test User",
                email="test_concurrency@example.com",
                role="TEST",
                zen_points=0,
                current_lvl=1,
                created_at=now_naive,
                updated_at=now_naive
            )
            session.add(user)
            await session.commit()
            logger.info(f"User {USER_ID} created.")
        else:
            logger.info(f"User {USER_ID} exists.")

    # 3. Create Access Grant
    async with AsyncSessionLocal() as session:
        logger.info("Creating Access Grant")
        
        # Verify User visibility in this session
        u = await session.get(User, USER_ID)
        if not u:
            logger.error(f"CRITICAL ERROR: User {USER_ID} NOT FOUND in session 3!")
        else:
            logger.info(f"User {USER_ID} found in session 3.")

        # Clean up existing test data
        await session.execute(
            delete(AccessGrant).where(AccessGrant.grantee_id == USER_ID)
        )
        
        grant_id = uuid.uuid4()
        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        grant = AccessGrant(
            id=grant_id,
            grantee_id=USER_ID,
            instrument_id=INSTRUMENT_ID,
            credits_total=INITIAL_CREDITS,
            credits_consumed=0,
            source_ref="CONCURRENCY_TEST",
            created_at=now_naive,
            updated_at=now_naive
        )
        session.add(grant)
        await session.commit()
        logger.info(f"Created test grant {grant_id} for User {USER_ID} with {INITIAL_CREDITS} credit(s).")
        return grant_id

async def attempt_redemption(worker_id: int):
    """Worker function to attempt credit redemption."""
    async with AsyncSessionLocal() as session:
        service = GrantService(session)
        try:
            # Simulate slight jitter to make race condition more realistic
            await asyncio.sleep(0.01 * (worker_id % 5))
            
            grant = await service.redeem_credit(USER_ID, INSTRUMENT_ID, session_id=f"test_session_{worker_id}")
            logger.info(f"Worker {worker_id}: SUCCESS - Redeemed credit from Grant {grant.id}")
            return True
        except InsufficientCreditsError:
            logger.warning(f"Worker {worker_id}: FAILED - Insufficient credits")
            return False
        except Exception as e:
            logger.error(f"Worker {worker_id}: ERROR - {str(e)}")
            return False

async def run_concurrency_test():
    """Run the Bank Vault Test."""
    logger.info(f"Starting Bank Vault Test with {CONCURRENT_REQUESTS} concurrent requests...")
    
    try:
        # 1. Setup
        grant_id = await setup_test_data()
        
        # 2. Attack
        tasks = [attempt_redemption(i) for i in range(CONCURRENT_REQUESTS)]
        results = await asyncio.gather(*tasks)
        
        # 3. Verify
        success_count = sum(1 for r in results if r)
        fail_count = sum(1 for r in results if not r)
        
        logger.info("-" * 40)
        logger.info(f"Test Complete. Results:")
        logger.info(f"Total Requests: {CONCURRENT_REQUESTS}")
        logger.info(f"Successful Redemptions: {success_count}")
        logger.info(f"Failed Redemptions: {fail_count}")
        
        if success_count == INITIAL_CREDITS:
            logger.info("✅ PASSED: Only authorized number of credits were redeemed.")
        else:
            logger.error(f"❌ FAILED: {success_count} credits redeemed (Expected: {INITIAL_CREDITS}). Race condition detected!")
            
    except Exception as e:
        logger.error(f"Test Setup Failed: {e}")
        import traceback
        traceback.print_exc()

    # 4. Cleanup (Optional, inspect DB manually if needed)
    # await cleanup_test_data()

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run_concurrency_test())
