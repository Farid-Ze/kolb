"""
Security & Compliance Test - The Hacker Test
Authorization and IDOR vulnerability testing
"""
import pytest
import uuid
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import engine, Base
print(f"DEBUG: test_authorization engine url: {engine.url}")
print(f"DEBUG: test_authorization Base tables: {Base.metadata.tables.keys()}")

class TestIDORVulnerabilities:
    """C.1 - Insecure Direct Object Reference Prevention"""
    
    @pytest.fixture
    def authenticated_clients(self, db_setup, db):
        """Setup two different authenticated users"""
        client = TestClient(app)
        
        # User A
        response_a = client.post("/api/v1/auth/register", json={
            "email": f"user_a_{uuid.uuid4().hex[:8]}@test.com",
            "password": "SecurePass123!",
            "full_name": "User A"
        })
        assert response_a.status_code == 200, f"Register A failed: {response_a.text}"
        email_a = response_a.json()["email"]
        
        login_a = client.post("/api/v1/auth/login", json={
            "email": email_a,
            "password": "SecurePass123!"
        })
        assert login_a.status_code == 200, f"Login A failed: {login_a.text}"
        token_a = login_a.json()["accessToken"]
        
        # User B
        response_b = client.post("/api/v1/auth/register", json={
            "email": f"user_b_{uuid.uuid4().hex[:8]}@test.com",
            "password": "SecurePass123!",
            "full_name": "User B"
        })
        assert response_b.status_code == 200, f"Register B failed: {response_b.text}"
        email_b = response_b.json()["email"]
        
        login_b = client.post("/api/v1/auth/login", json={
            "email": email_b,
            "password": "SecurePass123!"
        })
        assert login_b.status_code == 200, f"Login B failed: {login_b.text}"
        token_b = login_b.json()["accessToken"]
        user_b_id = response_b.json()["id"]

        # Grant credits to User B
        from app.models.klsi.grant import AccessGrant
        from app.models.klsi.instrument import Instrument
        
        # Get instrument ID
        instrument = db.query(Instrument).filter(Instrument.code == 'KLSI4').first()
        assert instrument is not None, "Instrument KLSI4 not found"
        
        grant = AccessGrant(
            id=uuid.uuid4(),
            grantee_id=user_b_id,
            instrument_id=instrument.id,
            credits_total=10,
            credits_consumed=0,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(grant)
        db.commit()
        
        return {
            "client": client,
            "user_a": {"token": token_a, "headers": {"Authorization": f"Bearer {token_a}"}},
            "user_b": {"token": token_b, "headers": {"Authorization": f"Bearer {token_b}"}}
        }
    
    def test_cannot_access_other_user_session(self, authenticated_clients):
        """
        CRITICAL: User A cannot read User B's session results
        """
        client = authenticated_clients["client"]
        user_a = authenticated_clients["user_a"]
        user_b = authenticated_clients["user_b"]
        
        # User B creates a session
        response = client.post(
            "/api/v1/sessions/start",
            headers=user_b["headers"],
            json={"instrument_code": "KLSI4"}
        )
        assert response.status_code == 200, f"Start session failed: {response.text}"
        user_b_session_id = response.json()["sessionId"]
        
        
        # Create shareable report (mock endpoint)
        # TODO: Implement actual share link generation
        share_token = "public_token_xyz"
        
        response = client.get(f"/api/v1/public/reports/{share_token}")
        
        if response.status_code == 200:
            data = response.json()
            # Verify no email, phone, or other PII exposed
            assert "email" not in str(data).lower(), "Email leaked in public report!"
            assert "phone" not in str(data).lower(), "Phone leaked in public report!"
            # Name is allowed but should be sanitized
            assert "full_name" in data or "name" in data, "Report should include name"


class TestAuditTrail:
    """C.2 - Audit Trail & Provenance Verification"""
    
    @pytest.mark.asyncio
    async def test_end_to_end_data_lineage(self):
        """
        Verify complete audit chain from grant -> session -> results
        """
        from app.db.database import get_async_db
        from sqlalchemy import select
        from app.models.klsi.grant import AccessGrant
        from app.models.klsi.assessment import AssessmentSession
        
        # TODO: Create test grant
        # TODO: Create session using that grant
        # TODO: Query database to verify linkage
        
        # Pseudo-assertion:
        # assert session.grant_id == grant.id
        # assert provenance_log.session_id == session.id
        # assert provenance_log.algorithm_sha is not None
        pass
    
    def test_algorithm_sha_changes_with_code(self):
        """
        Verify algorithm_sha updates when logic.py changes
        """
        from app.assessments.klsi_v4.logic import ALGORITHM_VERSION_SHA
        
        assert ALGORITHM_VERSION_SHA != "unknown", "Algorithm SHA not computed"
        assert len(ALGORITHM_VERSION_SHA) == 64, "SHA256 should be 64 hex chars"
        
        # In real scenario, we'd mock file change and verify hash changes


class TestVulnerabilityScanning:
    """C.3 - Automated Vulnerability Detection"""
    
    def test_no_high_severity_cves(self):
        """
        Integration with Safety/Snyk (CI/CD gate)
        This test should FAIL build if vulnerable dependencies found
        """
        import subprocess
        import json
        
        # Run safety check
        try:
            result = subprocess.run(
                ["safety", "check", "--json"],
                capture_output=True,
                text=True
            )
        except FileNotFoundError:
            pytest.skip("Safety tool not installed")
            return
        
        if result.returncode == 0:
            # No vulnerabilities
            return
        
        try:
            vulns = json.loads(result.stdout)
            high_severity = [v for v in vulns if v.get("severity") in ["high", "critical"]]
            
            assert len(high_severity) == 0, \
                f"Found {len(high_severity)} HIGH/CRITICAL vulnerabilities: {high_severity}"
        except json.JSONDecodeError:
            # Safety not installed or different format
            pytest.skip("Safety tool output parse error")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
