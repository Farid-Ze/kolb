# Security Review Report

## Overview
A comprehensive security review was conducted on the codebase, including a deep dive into authentication, access control, and configuration. The review identified critical logic vulnerabilities that need immediate attention.

## Critical Findings

### 1. Privilege Escalation in Registration (OUTDATED - SEE UPDATE BELOW)
**Severity: CRITICAL**
- **Location**: `backend/app/routers/auth.py` (Line 38)
- **Issue**: ~~The registration logic defaults to the `MEDIATOR` role~~ **UPDATE**: The code actually defaults to `Role.USER` for non-student emails. However, there is still no validation preventing users from manually requesting elevated roles.
- **Impact**: While auto-escalation was incorrect, **the registration endpoint does not validate the role field**, potentially allowing users to request `MEDIATOR` role if the Pydantic model accepts it.
- **Recommendation**: 
    - **VERIFY**: Check if `UserCreate` schema includes a `role` field that could be manipulated.
    - Explicitly set role based on business logic, don't allow client-provided role.
    - Default to a `USER` role for non-student emails (already done).
    - Implement an invite-only or whitelist system for Mediators.

### 2. IDOR on Anonymous Sessions
**Severity: HIGH**
- **Location**: `backend/app/routers/reports.py` & `backend/app/services/security.py`
- **Issue**: The access control check `if viewer.id != session.user_id` evaluates to `False` (Access Granted) when both are `None`.
    - Anonymous sessions have `user_id = None`.
    - Guest users (via `X-Guest-Token`) have `viewer.id = None`.
- **Impact**: A user with a valid Guest Token could potentially view the reports of *any* anonymous session if they know the `session_id` (UUID). While UUIDs are hard to guess, this breaks the isolation model.
- **Recommendation**: 
    - For anonymous sessions, verify that `session.guest_token` matches `viewer.guest_token`.

## High Priority Findings

### 3. Missing CORS Configuration & Configuration Bug
**Severity: HIGH (Availability)**
- **Location**: `backend/app/main.py` & `backend/app/core/config.py`
- **Issue**: 
    - `backend/app/main.py` attempts to access `settings.backend_cors_origins`, but this field is **missing** from the `Settings` class in `backend/app/core/config.py`.
    - This will cause the application to crash at startup or fail to configure CORS entirely.
- **Impact**: Application availability failure (CrashLoopBackOff in containerized env) or total inability for frontend to communicate.
- **Recommendation**: Add `backend_cors_origins` to `Settings` in `config.py`.

### 4. Denial of Service (DoS) in Admin Import
**Severity: HIGH**
- **Location**: `backend/app/routers/admin.py` (Line 36)
- **Issue**: The `import_norms` endpoint reads the entire uploaded file into memory (`file.file.read()`) without checking `Content-Length` or using chunked processing.
- **Impact**: An attacker can upload a very large file (e.g., 10GB) to exhaust server memory, causing an OOM crash and denial of service for all users.
- **Recommendation**: 
    - Implement `Content-Length` validation (e.g., max 10MB).
    - Use chunked reading/processing for large files.

## General Findings

### 4. Token Storage
**Severity: LOW**
- **Location**: `frontend/src/shared/api/client.ts`
- **Issue**: JWTs are stored in `localStorage`.
- **Impact**: Vulnerable to XSS attacks (if an attacker can execute JS, they can steal the token).
- **Recommendation**: Consider using `HttpOnly` cookies for the refresh token, or ensure strict Content Security Policy (CSP) to mitigate XSS risks.

### 5. SQL Injection & Command Injection
**Status: SECURE**
- The codebase consistently uses SQLAlchemy ORM and Pydantic.
- No evidence of raw SQL injection or command injection vectors was found in the deep scan.

### 6. Secret Management
**Status: SECURE**
- Secrets are loaded via `pydantic-settings` from environment variables.
- No hardcoded keys were found.

## Action Plan
1.  **Fix Auth Logic**: Modify `backend/app/routers/auth.py` to prevent auto-Mediator assignment.
2.  **Fix Report ACL**: Update `backend/app/routers/reports.py` to check guest tokens for anonymous sessions.
3.  **Configure CORS**: Add `backend_cors_origins` to `config.py` and ensure middleware is active.
4.  **Fix DoS Vulnerability**: Add size limits to `import_norms` in `backend/app/routers/admin.py`.
