# Architecture & Patterns Review

## Critical Issues

### 1. Async/Sync Mismatch in Router
- **Location**: `backend/app/routers/sessions.py` (Lines 447-460, `upsert_session_responses`)
- **Issue**: The endpoint uses `get_current_user` dependency (which is `async`) but is defined as `def` instead of `async def`, and calls `repo.get_for_user()` which is an `async` method without `await`.
- **Impact**: This will cause a runtime error - calling an async repository method from a sync function returns a coroutine object instead of the result.
- **Recommendation**: Change the endpoint to `async def` and add `await` before `repo.get_for_user()`.

### 2. Async/Sync Mismatch in List Sessions  
- **Location**: `backend/app/routers/sessions.py` (Lines 44-54, `list_sessions`)
- **Issue**: The endpoint uses `get_current_user` dependency (which is `async`) but is defined as `def` instead of `async def`, and calls `repo.get_by_user()` which is an `async` method without `await`.
- **Impact**: Same as above - will return a coroutine instead of actual sessions.
- **Recommendation**: Change to `async def` and add `await` before repository calls.

### 4. Missing Required Import in Teams Router
- **Location**: `backend/app/routers/teams.py` (Lines 287, 292-307)
- **Issue**: The code uses `TeamAnalyticsRepository` and `TeamRollupMemberOut` without importing them.
- **Impact**: This will cause `NameError` at runtime when the endpoint is called.
- **Recommendation**: Add imports for `TeamAnalyticsRepository` and `TeamRollupMemberOut`.

## Pattern Violations

### 3. Service Layer Bypassing Repository Pattern
- **Location**: `backend/app/services/engine.py` (Multiple lines: 298, 460, 467, 503, 555, 577, etc.)
- **Issue**: `EngineSessionService` directly calls `self.db.query()` instead of using repository methods, violating the Repository pattern.
- **Impact**: Bypasses the abstraction layer, making the service tightly coupled to ORM implementation and harder to test.
- **Recommendation**: Extract these queries into repository methods and call them through `self._sessions`, `self._responses`, or `self._contexts`.

### 5. Router-Level Transaction Management
- **Location**: `backend/app/routers/teams.py`, `backend/app/routers/research.py`, `backend/app/routers/reports.py`, `backend/app/routers/admin.py` (Multiple endpoints)
- **Issue**: Routers directly call `db.commit()` and `db.rollback()`, violating separation of concerns. The `get_db()` dependency provides a plain session, not a transactional one.
- **Impact**: Transaction management is scattered across multiple layers, making it hard to ensure atomicity and maintain consistent error handling.
- **Recommendation**: Use `get_async_db` for async endpoints, or move transaction logic to service layer. Alternatively, use `transactional_session()` context manager from `database.py`.
