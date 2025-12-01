import asyncio
import logging
import sys
import os
import uuid
from datetime import datetime

# Add parent directory to path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.db.database import async_engine, AsyncSessionLocal
from app.models.klsi.grant import AccessGrant
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
    async with AsyncSessionLocal() as session:
        # Clean up existing test data
        await session.execute(
            select(AccessGrant).where(AccessGrant.grantee_id == USER_ID)
        )
        # In a real scenario we'd delete, but for safety let's just create a new one
        # or ensure we have a clean slate. For this script, let's assume we can create a new grant.
        
        grant = AccessGrant(
            id=uuid.uuid4(),
            grantee_id=USER_ID,
            instrument_id=INSTRUMENT_ID,
            credits_total=INITIAL_CREDITS,
            credits_consumed=0,
            source_ref="CONCURRENCY_TEST",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        session.add(grant)
        await session.commit()
        logger.info(f"Created test grant for User {USER_ID} with {INITIAL_CREDITS} credit(s).")
        return grant.id

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

    # 4. Cleanup (Optional, inspect DB manually if needed)
    # await cleanup_test_data()

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run_concurrency_test())
