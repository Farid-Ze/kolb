# Kolb API Quick Reference

**Base URL:** `https://api.kolb.example.com`  
**Auth:** `Authorization: Bearer <token>`

---

## Public API: `/sessions`

### Session Lifecycle

```typescript
// 1. Start Session
POST /sessions/start
{
  "instrumentCode": "KLSI",
  "instrumentVersion": "4.0"
}
→ { "sessionId": 12345 }

// 2. Fetch Items
GET /sessions/{sessionId}/delivery?locale=id
→ { "items": [...], "manifest": {...}, "locale": {...} }

// 3. Submit All (Batch)
POST /sessions/{sessionId}/submit_all_responses
{
  "items": [{ "itemId": 1, "ranks": {...} }],
  "contexts": [{ "contextName": "...", "CE": 1, ... }]
}
→ { "result": { "ACCE": 45, "AERO": 32, ... } }

// 4. Finalize (if not using batch)
POST /sessions/{sessionId}/finalize
{}
→ { "result": {...} }
```

---

## All Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/sessions/start` | Create session |
| `GET` | `/sessions/{id}/delivery` | Fetch items + manifest |
| `GET` | `/sessions/{id}/items` | Get session state |
| `POST` | `/sessions/{id}/submit_all_responses` | Submit all (batch) |
| `POST` | `/sessions/{id}/response` | Submit single item |
| `POST` | `/sessions/{id}/autosave` | Save progress |
| `POST` | `/sessions/{id}/finalize` | Finalize session |
| `GET` | `/sessions/{id}/validation` | Check completion |
| `POST` | `/sessions/{id}/force_finalize` | Override (mediator) |

---

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request / validation failed |
| 401 | Unauthorized (missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found |
| 410 | Gone (deprecated endpoint) |
| 422 | Unprocessable entity |
| 500 | Internal server error |

---

## Migration from `/engine/sessions`

| Old | New |
|-----|-----|
| `/engine/sessions/start` | `/sessions/start` |
| `/engine/sessions/{id}/delivery` | `/sessions/{id}/delivery` |
| `/engine/sessions/{id}/submit_all` | `/sessions/{id}/submit_all_responses` |
| `/engine/sessions/{id}/finalize` | `/sessions/{id}/finalize` |
| `/engine/sessions/{id}/force-finalize` | `/sessions/{id}/force_finalize` |

**Sunset Date:** January 31, 2026

---

## Best Practices

✅ Use batch submission (`submit_all_responses`)  
✅ Implement autosave every 30s  
✅ Validate before finalize  
✅ Handle deprecation headers  
✅ Implement retry logic with exponential backoff

---

## Full Documentation

See [API Documentation](./README.md) for complete details.
