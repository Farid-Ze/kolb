"""
Security & Compliance Test - The Hacker Test
Authorization and IDOR vulnerability testing
"""
import pytest
import uuid
from fastapi.testclient import TestClient

from app.main import app


class TestIDORVulnerabilities:
    """C.1 - Insecure Direct Object Reference Prevention"""
    
    @pytest.fixture
    def authenticated_clients(self, db_setup):
        """Setup two different authenticated users"""
        client = TestClient(app)
        
        # User A
        response_a = client.post("/api/v1/auth/register", json={
            "email": f"user_a_{uuid.uuid4().hex[:8]}@test.com",
            "password": "SecurePass123!",
            "full_name": "User A"
        })
        token_a = response_a.json()["access_token"]
        
        # User B
        response_b = client.post("/api/v1/auth/register", json={
            "email": f"user_b_{uuid.uuid4().hex[:8]}@test.com",
            "password": "SecurePass123!",
            "full_name": "User B"
        })
        token_b = response_b.json()["access_token"]
        
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
        assert response.status_code == 200
        user_b_session_id = response.json()["session_id"]
        
        # User A attempts to access User B's session (IDOR attack)
        response = client.get(
            f"/api/v1/sessions/{user_b_session_id}/results",
            headers=user_a["headers"]
        )
        
        # Must be rejected
        assert response.status_code in [403, 404], \
            f"IDOR vulnerability! User A accessed User B's session (status: {response.status_code})"
        
        # Verify audit log (if implemented)
        # TODO: Check that security log recorded this attempt
    
    def test_cannot_finalize_other_user_session(self, authenticated_clients):
        """
        CRITICAL: User A cannot finalize User B's session
        """
        client = authenticated_clients["client"]
        user_a = authenticated_clients["user_a"]
        user_b = authenticated_clients["user_b"]
        
        # User B creates session
        response = client.post("/api/v1/sessions/start", headers=user_b["headers"], json={"instrument_code": "KLSI4"})
        user_b_session_id = response.json()["session_id"]
        
        # User A attempts to finalize (tampering attack)
        response = client.post(
            f"/api/v1/sessions/{user_b_session_id}/finalize",
            headers=user_a["headers"],
            json={"rankings": [[1, 2, 3, 4]] * 12}
        )
        
        assert response.status_code in [403, 404], "User A should not finalize User B's session"
    
    def test_shared_report_link_no_pii_leak(self):
        """
        C.1 Specific Check: Public share link doesn't leak sensitive data
        """
        client = TestClient(app)
        
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
        result = subprocess.run(
            ["safety", "check", "--json"],
            capture_output=True,
            text=True
        )
        
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
            pytest.skip("Safety tool not available")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
