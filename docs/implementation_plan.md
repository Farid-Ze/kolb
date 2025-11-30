# Security Remediation Plan

## Goal
Address critical and high-priority security findings identified in `docs/SECURITY_REVIEW.md`.

## User Review Required
> [!IMPORTANT]
> **Breaking Change**: Default registration role will be changed from `MEDIATOR` to `USER` (new role). Users registering with non-student emails will no longer have administrative privileges by default.

## Proposed Changes

### Backend

#### [MODIFY] [auth.py](file:///a:/dev/Kaderisasi/kolb/backend/app/schemas/auth.py)
- Add `USER` to `Role` enum.

#### [MODIFY] [auth.py](file:///a:/dev/Kaderisasi/kolb/backend/app/routers/auth.py)
- Change default role assignment: `Role.MEDIATOR` -> `Role.USER`.

#### [MODIFY] [reports.py](file:///a:/dev/Kaderisasi/kolb/backend/app/routers/reports.py)
- Update `get_report` to use `get_current_user_or_guest`.
- Enforce check: If `session.user_id` is None, `viewer.guest_token` must match `session.guest_token`.

#### [MODIFY] [main.py](file:///a:/dev/Kaderisasi/kolb/backend/app/main.py)
- Add `CORSMiddleware` configuration.

### Correctness & Stability

#### [MODIFY] [engine.py](file:///a:/dev/Kaderisasi/kolb/backend/app/services/engine.py)
- **Fix Race Condition**: Use `with_for_update()` in `submit_full_batch` to lock session before checking status.
- **Fix Error Handling**: Implement missing provenance logging in `finalize_background_task`.

#### [MODIFY] [finalize.py](file:///a:/dev/Kaderisasi/kolb/backend/app/engine/finalize.py)
- **Fix Error Swallowing**: Add logging for failed backup style analysis.

## Verification Plan

### Automated Tests
- [x] Run `pytest` to verify all tests pass.
- [x] Verify `docker-compose up` works without errors.
- [x] Check `curl http://localhost:8000/health` returns 200 OK.

### Manual Verification
- [x] Verify IDOR fix by attempting to access another user's report.
- [x] Verify Role Assignment by registering a new user with a non-student email.
- [x] Verify DoS protection by attempting to upload a large file.
- [x] Verify Resource Leak fix by monitoring background tasks.
- [x] Verify Async/Sync mismatches by checking endpoint responsiveness.
- [x] Verify Missing Imports by checking server logs for NameError.
