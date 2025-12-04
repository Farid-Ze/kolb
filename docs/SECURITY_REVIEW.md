# Security Review Report

## Overview
A comprehensive security review was conducted on the codebase, including a deep dive into authentication, access control, and configuration. The review identified critical logic vulnerabilities that need immediate attention.

**Last Updated**: December 4, 2025

## Resolved Issues ✅

### 1. Privilege Escalation in Registration
**Severity: CRITICAL** → **RESOLVED**
- **Location**: `backend/app/routers/auth.py`
- **Resolution**: Role is now server-calculated from email domain (`calculated_role = Role.MAHASISWA if domain == settings.allowed_student_domain else Role.USER`). Client-provided role is ignored.
- **Fixed in**: `auth.py:36-37`

### 2. IDOR on Anonymous Sessions
**Severity: HIGH** → **RESOLVED**
- **Location**: `backend/app/routers/reports.py`
- **Resolution**: Anonymous sessions now require exact `guest_token` match. The fix validates `viewer_guest_token != session.guest_token` before granting access.
- **Fixed in**: `reports.py:51-64`

### 3. Missing CORS Configuration & Configuration Bug
**Severity: HIGH** → **RESOLVED**
- **Location**: `backend/app/core/config.py`
- **Resolution**: Added `backend_cors_origins: List[str]` with proper `@field_validator` that parses comma-separated strings and provides secure defaults.
- **Fixed in**: `config.py:29-47`

### 4. Denial of Service (DoS) in Admin Import
**Severity: HIGH** → **RESOLVED**
- **Location**: `backend/app/routers/admin.py`
- **Resolution**: Added `Content-Length` header validation with 10MB limit. Double-checks actual bytes read.
- **Fixed in**: `admin.py:34-41`

## Open Findings

*No critical open findings at this time.*

## Recently Resolved

### 5. Rate Limiting on Auth Endpoints
**Severity: MEDIUM** → **RESOLVED**
- **Location**: `backend/app/routers/auth.py`, `backend/app/core/rate_limit.py`
- **Resolution**: Implemented `slowapi` rate limiting (5 requests/minute per IP) on `/auth/login` and `/auth/register` endpoints.
- **Fixed in**: `rate_limit.py`, `auth.py:31-32, 56-57`, `main.py:42,198-199`

## Accepted Risks

### 6. Token Storage in localStorage
**Severity: LOW** → **ACCEPTED**
- **Location**: `frontend/src/shared/api/client.ts`
- **Issue**: JWTs are stored in `localStorage`.
- **Mitigation**: Strict CSP headers, input sanitization in React components.
- **Roadmap**: Migrate refresh tokens to `HttpOnly` cookies (documented in code comments).

## Secure by Design ✅

### SQL Injection & Command Injection
**Status: SECURE**
- The codebase consistently uses SQLAlchemy ORM and Pydantic.
- No evidence of raw SQL injection or command injection vectors was found in the deep scan.

### Secret Management
**Status: SECURE**
- Secrets are loaded via `pydantic-settings` from environment variables.
- No hardcoded keys were found.
- Production validation ensures `JWT_SECRET_KEY` is not the default value.

## Action Plan

### Completed ✅
1.  ~~**Fix Auth Logic**: Modify `backend/app/routers/auth.py` to prevent auto-Mediator assignment.~~
2.  ~~**Fix Report ACL**: Update `backend/app/routers/reports.py` to check guest tokens for anonymous sessions.~~
3.  ~~**Configure CORS**: Add `backend_cors_origins` to `config.py` and ensure middleware is active.~~
4.  ~~**Fix DoS Vulnerability**: Add size limits to `import_norms` in `backend/app/routers/admin.py`.~~
5.  ~~**Add Rate Limiting**: Implement rate limiting on `/auth/login` and `/auth/register` using `slowapi`.~~

### Roadmap 📋
6.  **HttpOnly Cookies**: Migrate refresh token to `HttpOnly` cookies for enhanced XSS protection.
