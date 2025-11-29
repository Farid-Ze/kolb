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
- **Auth**: Register a new user with a non-student email and verify role is `USER`.
- **IDOR**: Attempt to access an anonymous session without a guest token (should fail). Access with correct token (should succeed).
- **CORS**: Verify `Access-Control-Allow-Origin` headers are present.
- **Concurrency**: Simulate concurrent submissions to `submit_full_batch` (if possible via integration test, otherwise code review verification).
