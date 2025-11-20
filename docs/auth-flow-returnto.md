# Authentication Flow with ReturnTo Parameter

## Overview

This document describes the authentication flow implementation in the KLSI 4.0 application, focusing on how users are redirected after login to their intended destination.

## Architecture

The authentication flow uses a multi-tier approach to preserve the user's intended destination across the login process:

```
User Action → AuthNotice/ProtectedRoute → Login Page → Successful Login → Original Destination
```

## Components

### 1. AuthNotice Component

**Location**: `frontend/src/core/auth/AuthNotice.tsx`

The `AuthNotice` component displays authentication prompts and handles navigation to the login page.

#### Props

- `title` (optional): Title of the notice (default: "Sign in required")
- `message`: Message to display to the user
- `actionLabel` (optional): Label for the action button (default: "Sign In")
- `onActionClick` (optional): Custom click handler
- `autoNavigateToLogin` (optional): When true, automatically navigates to login with returnTo parameter
- `className` (optional): Additional CSS classes

#### Usage

```tsx
// Automatic navigation with returnTo
<AuthNotice 
  message="You must be signed in to start an assessment."
  autoNavigateToLogin={true}
/>

// Custom navigation handler
<AuthNotice 
  message="Sign in to view results."
  onActionClick={() => customHandler()}
/>
```

### 2. ProtectedRoute Component

**Location**: `frontend/src/components/auth/ProtectedRoute.tsx`

Protects routes that require authentication.

#### Behavior

When an unauthenticated user tries to access a protected route:

1. Builds a `returnTo` URL from the current location (pathname + search + hash)
2. Encodes the returnTo URL
3. Redirects to `/auth/login?returnTo=<encoded-url>`
4. Also passes location state for React Router compatibility

#### Usage

```tsx
<ProtectedRoute>
  <AssessmentPage />
</ProtectedRoute>

// With role-based access
<ProtectedRoute allowedRoles={['MEDIATOR']}>
  <TeamDetailPage />
</ProtectedRoute>
```

### 3. LoginPage

**Location**: `frontend/src/pages/LoginPage.tsx`

Handles user authentication and post-login redirection.

#### Redirect Resolution Priority

The `resolveRedirectTarget()` function uses this priority chain:

1. **URL Query Parameter** (`?returnTo=...`)
   - Highest priority
   - Explicit and debuggable
   - Safety check: rejects if pointing to `/auth/login` or `/auth/register`

2. **SessionStorage** (`auth:postLoginRedirect`)
   - Fallback when URL param not available
   - Set by `auth:unauthorized` event handler
   - Safety check: rejects if pointing to any `/auth/*` path

3. **Location State** (`location.state.from`)
   - React Router state
   - Safety check: rejects if pointing to any `/auth/*` path

4. **Default** (`/`)
   - Ultimate fallback to home page

#### Additional Features

- Shows "Continue as Guest" link when user arrives via returnTo parameter
- Displays error messages from expired sessions
- Handles both manual login and quick demo login

### 4. AuthContext

**Location**: `frontend/src/contexts/AuthContext.tsx`

Manages global authentication state.

#### Session Expiry Handling

When the `auth:unauthorized` event is fired:

1. Logs out the user
2. Saves current location to sessionStorage (if not already on auth page)
3. Stores error message for display on login page
4. Builds login URL with returnTo parameter
5. Navigates to login page

**Safety Feature**: Does not create returnTo if user is already on an auth page, preventing infinite loops.

## Flow Diagrams

### Successful Login Flow

```
┌─────────────────────┐
│ User on /assessment │
│    (not logged in)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│ ProtectedRoute detects no auth  │
│ Redirects to:                   │
│ /auth/login?returnTo=%2Fassess  │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────┐
│   User logs in      │
│   successfully      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│ LoginPage.resolveRedirectTarget │
│ Decodes returnTo: /assessment   │
│ Navigates to /assessment        │
└─────────────────────────────────┘
```

### Session Expiry Flow

```
┌──────────────────────────────┐
│ User on /assessment/123      │
│ (logged in, session expires) │
└──────────┬───────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ API call returns 401                │
│ AuthContext.handleUnauthorized      │
│ - Saves /assessment/123 to session  │
│ - Stores error message              │
│ - Navigates to login with returnTo  │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────┐
│ User sees error msg │
│ "Session expired"   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ User logs in again  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Returns to /assessment/123      │
│ Can continue where left off     │
└─────────────────────────────────┘
```

### Guest Continuation Flow

```
┌────────────────────────────┐
│ User clicks "Start Test"   │
│ from public landing page   │
└──────────┬─────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ AuthNotice shows with           │
│ autoNavigateToLogin=true        │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Redirects to login with returnTo│
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ User sees:                      │
│ - Login form                    │
│ - "Continue as Guest" link      │
└──────────┬──────────────────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐  ┌──────────┐
│ Log In  │  │ Continue │
│         │  │ as Guest │
└─────────┘  └──────────┘
     │           │
     ▼           ▼
 Returns to   Goes to
 intended     home page
 page
```

## Security Considerations

### Infinite Loop Prevention

The system prevents infinite loops by rejecting returnTo URLs that point to:
- `/auth/login`
- `/auth/register`
- Any other `/auth/*` path (in some contexts)

### XSS Prevention

All returnTo URLs are properly encoded using `encodeURIComponent()` before being added to URLs or stored.

### Open Redirect Prevention

The system only accepts relative URLs starting with `/`. Absolute URLs (`http://`, `https://`, `//`) should be rejected (implement additional validation if needed).

### Example Attack Prevention

```javascript
// Attack attempt
const maliciousUrl = 'http://evil.com/phishing';

// Prevention
if (maliciousUrl.startsWith('http://') || 
    maliciousUrl.startsWith('https://') || 
    maliciousUrl.startsWith('//')) {
  // Reject and use default redirect
  return '/';
}
```

## Testing

### Test Coverage

1. **Unit Tests** (`AuthNotice.test.tsx`): 9 tests
   - Component rendering
   - Prop handling
   - Navigation behavior

2. **Edge Case Tests** (`authEdgeCases.test.ts`): 24 tests
   - Infinite loop prevention
   - URL encoding/decoding
   - SessionStorage edge cases
   - Race conditions
   - Security considerations
   - Priority chain logic

3. **Integration Tests** (`AuthReturnToFlow.test.tsx`):
   - End-to-end auth flow
   - ReturnTo parameter preservation
   - Complex URLs with query strings and hash

### Running Tests

```bash
# Run all auth-related tests
npm test -- src/tests/components/AuthNotice.test.tsx --run
npm test -- src/tests/unit/authEdgeCases.test.ts --run
npm test -- src/tests/components/ProtectedRoute.test.tsx --run

# Run integration tests
npm test -- src/tests/integration/AuthReturnToFlow.test.tsx --run
```

## Edge Cases Handled

1. **Empty or Invalid ReturnTo**: Falls back to default redirect
2. **Double URL Encoding**: Properly decoded
3. **Special Characters in URL**: Preserved through encoding
4. **SessionStorage Unavailable**: Gracefully degrades to other methods
5. **Race Conditions**: Multiple simultaneous auth events handled
6. **Session Expiry Mid-Assessment**: User can resume after re-login
7. **User Cancels Login**: "Continue as Guest" option available

## Troubleshooting

### User Not Redirected After Login

**Check**:
1. Browser console for errors
2. Network tab for redirect responses
3. SessionStorage for `auth:postLoginRedirect`
4. URL for `returnTo` parameter

**Common Causes**:
- returnTo pointing to auth page (filtered out for safety)
- SessionStorage disabled
- JavaScript error during navigation

### Infinite Redirect Loop

**Symptoms**: Browser keeps navigating between login and another page

**Cause**: returnTo parameter pointing to auth page

**Solution**: The system now prevents this automatically by filtering out auth page URLs

### ReturnTo Not Working

**Debug Steps**:
1. Check if `returnTo` is in URL: `/auth/login?returnTo=%2Fassessment`
2. Check browser console for `resolveRedirectTarget()` output
3. Verify sessionStorage: `sessionStorage.getItem('auth:postLoginRedirect')`
4. Check if URL is being filtered (starts with `/auth/`)

## Future Enhancements

1. **Token Refresh**: Implement automatic token refresh to reduce session expiries
2. **Remember Me**: Option to extend session duration
3. **Multi-Tab Sync**: Synchronize auth state across browser tabs
4. **Progressive Web App**: Handle offline scenarios
5. **OAuth Integration**: Support third-party authentication providers

## References

- React Router Documentation: https://reactrouter.com/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
