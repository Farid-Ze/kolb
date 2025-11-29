"""
Locust Load Testing Suite - Bank Vault Test
Tests transaction integrity under extreme concurrency
"""
import uuid
from locust import HttpUser, task, between, events
from locust.runners import MasterRunner


class GrantRedemptionUser(HttpUser):
    """Simulates concurrent grant redemption attempts"""
    wait_time = between(0.1, 0.5)
    
    def on_start(self):
        """Setup: Login and get auth token"""
        # Login
        response = self.client.post("/auth/login", json={
            "email": f"loadtest_{uuid.uuid4().hex[:8]}@test.com",
            "password": "TestPassword123!"
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            # Use guest token for read-only tests
            self.headers = {}
    
    @task(5)
    def start_session_with_grant(self):
        """
        A. RACE CONDITION TEST
        Multiple users try to redeem from same grant pool
        """
        idempotency_key = str(uuid.uuid4())
        self.client.post(
            "/sessions/start",
            headers={**self.headers, "X-Idempotency-Key": idempotency_key},
            json={"instrument_code": "KLSI4"},
            name="/sessions/start (with grant)"
        )
    
    @task(3)
    def check_grant_balance(self):
        """Read-heavy operation to test database connection pool"""
        self.client.get("/grants/me", headers=self.headers, name="/grants/me")
    
    @task(1)
    def view_results(self):
        """Simulate result viewing (cache hit test)"""
        session_id = str(uuid.uuid4())
        self.client.get(
            f"/sessions/{session_id}/results",
            headers=self.headers,
            name="/sessions/{id}/results"
        )


class DeadlockSimulationUser(HttpUser):
    """
    B. DEADLOCK RESILIENCE TEST
    Creates circular dependency patterns to trigger deadlocks
    """
    wait_time = between(0.05, 0.1)
    
    @task
    def concurrent_mutations(self):
        """Trigger mutations in reverse order to create circular wait"""
        user_id_a = 1
        user_id_b = 2
        
        # Randomize locking order to maximize deadlock chance
        import random
        if random.random() > 0.5:
            self.client.post(f"/admin/users/{user_id_a}/grant", json={"credits": 1})
            self.client.post(f"/admin/users/{user_id_b}/revoke", json={"grant_id": 1})
        else:
            self.client.post(f"/admin/users/{user_id_b}/revoke", json={"grant_id": 1})
            self.client.post(f"/admin/users/{user_id_a}/grant", json={"credits": 1})


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Setup test data before load test"""
    if isinstance(environment.runner, MasterRunner):
        print("🏦 BANK VAULT TEST - Integritas Transaksional")
        print("=" * 60)
        print("Objective: Validate pessimistic locking under 100x concurrent load")
        print("Pass Criteria: Zero double-spending, all errors handled gracefully")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Verify data integrity after test"""
    print("\n" + "=" * 60)
    print("📊 POST-TEST VALIDATION")
    print("=" * 60)
    print("TODO: Run SQL query to verify:")
    print("SELECT SUM(credits_consumed) FROM access_grants;")
    print("Must equal count of successful session starts")
