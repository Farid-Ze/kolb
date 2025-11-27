# Kolb API Documentation

**Version:** 4.0  
**Last Updated:** 2025-11-28  
**Base URL:** `https://api.kolb.example.com`

---

## Overview

The Kolb API provides two distinct surfaces:

1. **Public API** (`/sessions`) - For client applications (web, mobile)
2. **Internal API** (`/engine`) - For admin tools, metrics, and advanced operations

This document focuses on the **Public API** for assessment workflows.

---

## Authentication

All endpoints require authentication via Bearer token:

```http
Authorization: Bearer <your_access_token>
```

**Exception:** `/sessions/start` supports guest sessions (no token required).

---

## Public API: Assessment Workflow

### Base Path: `/sessions`

The `/sessions` endpoints provide a complete assessment lifecycle:

1. Start session
2. Fetch assessment items
3. Submit responses
4. Finalize and get results

---

## Endpoints

### 1. Start Assessment Session

Create a new assessment session for a user.

**Endpoint:** `POST /sessions/start`

**Request:**
```json
{
  "instrumentCode": "KLSI",
  "instrumentVersion": "4.0"
}
```

**Parameters:**
- `instrumentCode` (string, optional) - Assessment instrument code. Default: `"KLSI"`
- `instrumentVersion` (string, optional) - Instrument version. Default: `"4.0"`

**Response:**
```json
{
  "sessionId": 12345,
  "guestToken": "abc123..." // Only for guest sessions
}
```

**Example:**
```typescript
const response = await fetch('/sessions/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    instrumentCode: 'KLSI',
    instrumentVersion: '4.0'
  })
})
const { sessionId } = await response.json()
```

---

### 2. Fetch Assessment Items

Retrieve the full delivery package including items, manifest, and locale resources.

**Endpoint:** `GET /sessions/{sessionId}/delivery`

**Parameters:**
- `sessionId` (integer, path) - Session ID from start response
- `locale` (string, query, optional) - Locale code (e.g., `"id"`, `"en"`)

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "number": 1,
      "type": "learning_style",
      "stem": "When I learn...",
      "options": [
        {
          "id": 101,
          "learning_mode": "CE",
          "text": "I like to deal with my feelings"
        },
        // ... 3 more options
      ]
    }
    // ... 11 more items
  ],
  "manifest": { /* instrument metadata */ },
  "locale": { /* translated strings */ }
}
```

**Example:**
```typescript
const response = await fetch(`/sessions/${sessionId}/delivery?locale=id`, {
  headers: { 'Authorization': 'Bearer <token>' }
})
const { items } = await response.json()
```

---

### 3. Submit All Responses (Batch)

Submit all 12 learning-style items and 8 LFI contexts in a single atomic transaction.

**Endpoint:** `POST /sessions/{sessionId}/submit_all_responses`

**Request:**
```json
{
  "items": [
    {
      "itemId": 1,
      "ranks": {
        "101": 1,  // CE: rank 1 (most like me)
        "102": 2,  // RO: rank 2
        "103": 3,  // AC: rank 3
        "104": 4   // AE: rank 4 (least like me)
      }
    }
    // ... 11 more items
  ],
  "contexts": [
    {
      "contextName": "Starting_Something_New",
      "CE": 1,
      "RO": 2,
      "AC": 3,
      "AE": 4
    }
    // ... 7 more contexts
  ],
  "clientDurationMs": 180000  // Optional: client-side duration
}
```

**Response:**
```json
{
  "result": {
    "ACCE": 45,
    "AERO": 32,
    "stylePrimaryId": 3,
    "LFI": 0.65,
    "percentileSources": { /* provenance data */ },
    "normGroupUsed": "General_2024",
    "normVersionUsed": "v4.2",
    "validation": {
      "ready": true,
      "issues": []
    },
    "override": false
  }
}
```

**Example:**
```typescript
const response = await fetch(`/sessions/${sessionId}/submit_all_responses`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({ items, contexts })
})
const { result } = await response.json()
```

---

### 4. Finalize Session

Finalize a session and compute results (if not already finalized via batch submission).

**Endpoint:** `POST /sessions/{sessionId}/finalize`

**Request:** Empty body `{}`

**Response:** Same as submit_all_responses

**Example:**
```typescript
const response = await fetch(`/sessions/${sessionId}/finalize`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: '{}'
})
const { result } = await response.json()
```

---

### 5. Get Session Items (State)

Retrieve current session state including responses and progress.

**Endpoint:** `GET /sessions/{sessionId}/items`

**Response:**
```json
{
  "sessionId": 12345,
  "instrumentCode": "KLSI",
  "instrumentVersion": "4.0",
  "status": "started",
  "delivery": { /* items, manifest, locale */ },
  "responses": [
    {
      "itemId": 1,
      "ranks": { "CE": 1, "RO": 2, "AC": 3, "AE": 4 }
    }
  ],
  "contexts": [ /* LFI context responses */ ],
  "totalItems": 12,
  "completedItems": 5,
  "progress": 41.67,
  "currentItemIndex": 5
}
```

---

### 6. Autosave Responses

Save partial responses without finalizing (for UX/progress preservation).

**Endpoint:** `POST /sessions/{sessionId}/autosave`

**Request:**
```json
{
  "responses": [
    {
      "itemId": 1,
      "ranks": { "CE": 1, "RO": 2, "AC": 3, "AE": 4 }
    }
  ],
  "contexts": []
}
```

**Response:**
```json
{
  "savedCount": 1
}
```

---

### 7. Submit Single Response (Real-time)

Submit a single item response in real-time (Walking Skeleton pattern).

**Endpoint:** `POST /sessions/{sessionId}/response`

**Request:**
```json
{
  "itemId": 1,
  "responseMap": {
    "101": 1,
    "102": 2,
    "103": 3,
    "104": 4
  }
}
```

**Response:**
```json
{
  "ok": true
}
```

---

### 8. Validation Snapshot

Check session completion status before finalizing.

**Endpoint:** `GET /sessions/{sessionId}/validation`

**Response:**
```json
{
  "ready": true,
  "issues": [],
  "diagnostics": {
    "itemsComplete": true,
    "contextsComplete": true,
    "itemCount": 12,
    "contextCount": 8
  }
}
```

---

## Deprecated Endpoints

The following `/engine/sessions/*` endpoints are deprecated and will be removed on **January 31, 2026**:

| Deprecated Endpoint | Replacement | Status |
|---------------------|-------------|--------|
| `POST /engine/sessions/start` | `POST /sessions/start` | ⚠️ Deprecated |
| `POST /engine/sessions/{id}/submit_all` | `POST /sessions/{id}/submit_all_responses` | ⚠️ Deprecated |
| `POST /engine/sessions/{id}/finalize` | `POST /sessions/{id}/finalize` | ⚠️ Deprecated |
| `POST /engine/sessions/{id}/force-finalize` | `POST /sessions/{id}/force_finalize` | ⚠️ Deprecated |

**Migration:** Update your API calls to use the `/sessions` equivalents. See [Migration Guide](#migration-guide) below.

---

## Migration Guide

### From `/engine/sessions` to `/sessions`

**Before:**
```typescript
// Old: /engine/sessions/start
const { data } = await apiClient.post('/engine/sessions/start', {
  instrumentCode: 'KLSI'
})
```

**After:**
```typescript
// New: /sessions/start
const { data } = await apiClient.post('/sessions/start', {
  instrumentCode: 'KLSI',
  instrumentVersion: '4.0'
})
```

**Changes:**
1. Remove `/engine` prefix
2. Add `instrumentVersion` parameter (optional, defaults to `"4.0"`)
3. Update endpoint paths:
   - `submit_all` → `submit_all_responses`
   - `force-finalize` → `force_finalize` (underscore, not hyphen)

---

## Error Handling

All endpoints return standard HTTP status codes:

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid payload, validation failed |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Session not found |
| 410 | Gone | Endpoint deprecated and disabled |
| 422 | Unprocessable Entity | Validation error (detailed) |
| 500 | Internal Server Error | Server-side error |

**Error Response Format:**
```json
{
  "detail": "Validation failed",
  "issues": [
    {
      "code": "ITEMS_INCOMPLETE",
      "message": "Not all items have been answered"
    }
  ],
  "diagnostics": {
    "itemCount": 10,
    "expectedCount": 12
  }
}
```

---

## Rate Limiting

- **Rate Limit:** 100 requests per minute per user
- **Headers:**
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 1638360000`

---

## Best Practices

### 1. Use Batch Submission
Prefer `POST /sessions/{id}/submit_all_responses` over individual submissions for:
- Atomicity (all-or-nothing)
- Reduced network chattiness (1 call vs 20+)
- Better performance

### 2. Implement Autosave
Use `POST /sessions/{id}/autosave` to preserve user progress:
- Save every 30 seconds or on item completion
- Prevents data loss on browser crash/refresh

### 3. Validate Before Finalize
Check `GET /sessions/{id}/validation` before calling finalize:
- Provides clear error messages
- Better UX than finalize rejection

### 4. Handle Deprecation Headers
Monitor `Deprecation` and `Sunset` headers:
```typescript
if (response.headers.get('Deprecation') === 'true') {
  const successor = response.headers.get('Link')
  console.warn(`Endpoint deprecated. Use: ${successor}`)
}
```

---

## Internal API: `/engine`

The `/engine` endpoints are for internal use only (admin tools, metrics, advanced operations).

**Access:** Restricted to `MEDIATOR` and `ADMIN` roles.

**Key Endpoints:**
- `GET /engine/sessions/` - List all sessions (admin)
- `GET /engine/instruments` - Instrument catalog
- `GET /engine/metrics` - Performance metrics
- `GET /engine/sessions/{id}/report` - Generate detailed report
- `POST /engine/sessions/{id}/force-finalize` - Override validation (mediator only)

**Documentation:** See [Internal API Documentation](./internal-api.md) (admin access required).

---

## Support

- **API Issues:** support@kolb.example.com
- **Documentation:** https://docs.kolb.example.com
- **Status Page:** https://status.kolb.example.com

---

## Changelog

### 2025-11-28
- ✅ Unified public API under `/sessions`
- ⚠️ Deprecated `/engine/sessions/*` endpoints (sunset: 2026-01-31)
- ✨ Added flexible instrument selection to `/sessions/start`
- ✨ Added `/sessions/{id}/delivery` endpoint
- ✨ Added `/sessions/{id}/autosave` endpoint

### 2024-11-15
- Initial API documentation
