---
name: kolb-api
description: |
  KOLB Assessment Platform API integration.
  Covers session management, scoring, reports. 
  Use when working with backend API calls.
---

# KOLB API Integration

## Base Configuration

```typescript
const API_BASE_URL = import.meta.env.VITE_KOLB_API_URL || 'http://localhost:8000/api/v1';
```

## Authentication

```typescript
// Set token after login
kolbAPI.setToken(accessToken);

// Token is included in Authorization header
// Authorization: Bearer <token>

// Clear on logout
kolbAPI.clearToken();
```

## Endpoints Reference

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sessions` | Create new session |
| GET | `/sessions/{id}` | Get session details |
| GET | `/sessions/{id}/validation` | Check validation status |
| GET | `/sessions/{id}/delivery` | Get assessment items |
| POST | `/sessions/{id}/submit` | Submit item response |
| POST | `/sessions/{id}/finalize` | Complete and score |
| GET | `/sessions/{id}/scores` | Get computed scores |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/{session_id}` | Get full report |

## Request/Response Examples

### Create Session

```typescript
// Request
POST /api/v1/sessions
{
  "instrument_code": "KLSI",
  "instrument_version": "4.0",
  "study_id": "optional-study-id"
}

// Response
{
  "id": "uuid",
  "status": "started",
  "instrument_code": "KLSI",
  "instrument_version": "4.0",
  "created_at": "2025-12-07T10:30:00Z",
  "completed_at": null,
  "pipeline_version": "KLSI_STANDARD:4.0"
}
```

### Submit Response

```typescript
// Request
POST /api/v1/sessions/{id}/submit
{
  "item_id": "item-uuid",
  "rankings": [
    { "option_id": "opt-ce", "rank": 1 },
    { "option_id": "opt-ro", "rank": 2 },
    { "option_id": "opt-ac", "rank": 3 },
    { "option_id": "opt-ae", "rank": 4 }
  ],
  "response_time_ms": 5230
}

// Response: 204 No Content
```

### Finalize Session

```typescript
// Request
POST /api/v1/sessions/{id}/finalize

// Response
{
  "ok": true,
  "session_id": "uuid",
  "status": "completed",
  "stages_completed": [
    "compute_raw_scale_scores",
    "compute_combination_scores",
    "assign_learning_style",
    "compute_lfi"
  ],
  "results": {
    "scale_scores": { "CE": 28, "RO": 32, "AC": 36, "AE": 24 },
    "combination_scores": { "ACCE": 8, "AERO": -8 },
    "learning_style": { 
      "primary_style": "Thinking",
      "style_code": "T"
    },
    "lfi": { "score": 0.65, "w_coefficient": 0.72 }
  }
}
```

## Error Handling

```typescript
import { kolbAPI, APIError } from '$lib/api/kolb';

try {
  const session = await kolbAPI.createSession({ instrument_code: 'KLSI' });
} catch (err) {
  if (err instanceof APIError) {
    switch (err.status) {
      case 401:
        // Redirect to login
        break;
      case 404:
        // Session not found
        break;
      case 422:
        // Validation error - check err.message for details
        break;
      case 500:
        // Server error - show generic message
        break;
    }
  }
}
```

## Learning Style Codes

| Code | Name | Grid Position | Dominant Modes |
|------|------|---------------|----------------|
| I | Initiating | (0,0) | CE + AE |
| E | Experiencing | (0,1) | CE |
| C | Creating | (0,2) | CE + RO |
| A | Acting | (1,0) | AE |
| B | Balancing | (1,1) | Balanced |
| R | Reflecting | (1,2) | RO |
| D | Deciding | (2,0) | AC + AE |
| T | Thinking | (2,1) | AC |
| AN | Analyzing | (2,2) | AC + RO |

## Score Interpretation

### Scale Scores (CE, RO, AC, AE)
- Range: 12-48
- Higher = stronger preference for that mode

### Combination Scores (ACCE, AERO)
- Range: -36 to +36
- ACCE positive = Abstract dominant
- ACCE negative = Concrete dominant
- AERO positive = Active dominant
- AERO negative = Reflective dominant

### LFI (Learning Flexibility Index)
- Range: 0-1
- < 0.3 = Low flexibility (specialized)
- 0.3-0.5 = Moderate flexibility
- > 0.5 = High flexibility (adaptable)
