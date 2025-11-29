# Security Review Report

## Overview
A comprehensive security review was conducted on the codebase, including a deep dive into authentication, access control, and configuration. The review identified critical logic vulnerabilities that need immediate attention.

## Critical Findings

### 1. Privilege Escalation in Registration
**Severity: CRITICAL**
- **Location**: `backend/app/routers/auth.py` (Line 38)
- **Issue**: The registration logic defaults to the `MEDIATOR` role for any email address that does not match the student domain (`settings.allowed_student_domain`).
- **Impact**: An attacker can register with any public email (e.g., `@gmail.com`) and automatically gain `MEDIATOR` privileges. Mediators have access to:
    - Admin endpoints (Norm imports, Pipeline management).
    - Research data (viewing all study participants).
    - Viewing other users' reports.
- **Recommendation**: 
    - Disable automatic `MEDIATOR` registration.
    - Default to a `GUEST` or `USER` role for non-student emails.
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

### 3. Missing CORS Configuration
**Severity: MEDIUM (Availability/Future Risk)**
- **Location**: `backend/app/main.py`
- **Issue**: The FastAPI application does not explicitly configure `CORSMiddleware`.
- **Impact**: 
    - Frontend requests from a different origin (e.g., `localhost:3000`) will likely fail in a standard browser environment.
    - If developers add it later with `allow_origins=["*"]` while supporting credentials, it introduces a vulnerability.
- **Recommendation**: Explicitly configure `CORSMiddleware` with a whitelist of allowed origins (e.g., `settings.frontend_url`).

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
3.  **Configure CORS**: Add middleware to `backend/app/main.py`.
