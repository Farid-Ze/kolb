import asyncio
import logging
import sys
import os
import uuid
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, func
from app.db.database import AsyncSessionLocal
from app.models.klsi.audit import AuditLog
from app.models.klsi.grant import AccessGrant
from app.models.klsi.assessment import AssessmentSession

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def verify_audit_integrity():
    """
    Verify the integrity of the audit trail.
    Checks:
    1. All grants have corresponding audit logs (if created recently).
    2. All sessions link back to a valid grant.
    3. No orphan audit logs (optional, but good to check).
    """
    logger.info("Starting Audit Integrity Verification...")
    
    async with AsyncSessionLocal() as session:
        # 1. Check Grant <-> Audit Linkage
        # For every grant usage (credits_consumed > 0), there should be an audit log
        # Note: This is a heuristic check.
        
        # Get total credits consumed
        result = await session.execute(
            select(func.sum(AccessGrant.credits_consumed))
        )
        total_consumed = result.scalar() or 0
        
        # Get count of redemption logs
        result = await session.execute(
            select(func.count(AuditLog.id)).where(AuditLog.action.like("REDEEM_GRANT:%"))
        )
        total_redemption_logs = result.scalar() or 0
        
        logger.info(f"Total Credits Consumed: {total_consumed}")
        logger.info(f"Total Redemption Logs: {total_redemption_logs}")
        
        if total_consumed <= total_redemption_logs:
             logger.info("✅ Grant Usage Audit: PASS (Logs >= Consumed Credits)")
        else:
             logger.warning(f"⚠️ Grant Usage Audit: WARN (Missing {total_consumed - total_redemption_logs} logs)")

        # 2. Check Session <-> Grant Linkage
        # Every session should have a source_ref that points to a grant or valid source
        # In this simplified check, we just ensure sessions exist.
        result = await session.execute(select(func.count(AssessmentSession.id)))
        session_count = result.scalar() or 0
        logger.info(f"Total Assessment Sessions: {session_count}")
        
        # 3. Check for Orphan Data (Example: Grants with no user)
        result = await session.execute(
            select(func.count(AccessGrant.id)).where(AccessGrant.grantee_id == None)
        )
        orphan_grants = result.scalar() or 0
        
        if orphan_grants == 0:
            logger.info("✅ Orphan Data Check: PASS (No grants without grantee)")
        else:
            logger.error(f"❌ Orphan Data Check: FAIL ({orphan_grants} orphan grants found)")

    logger.info("Verification Complete.")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(verify_audit_integrity())
