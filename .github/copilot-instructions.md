# GitHub Copilot Code Review Instructions

## Review Philosophy
- Only comment when you have HIGH CONFIDENCE (>80%) that an issue exists
- Be concise: one sentence per comment when possible
- Focus on actionable feedback, not observations
- When reviewing text, only comment on clarity issues if the text is genuinely confusing or could lead to errors. "Could be clearer" is not the same as "is confusing" - stay silent unless HIGH confidence it will cause problems

## Priority Areas (Review These)

### Security & Safety
- Unsafe code blocks without justification
- SQL injection risks (ensure ORM usage or parameterized queries)
- Command injection risks (shell commands, user input)
- Path traversal vulnerabilities
- Credential exposure or hardcoded secrets
- Missing input validation on external data (Pydantic models)
- Improper error handling that could leak sensitive info

### Correctness Issues
- Logic errors that could cause crashes or incorrect behavior
- Race conditions in async code (FastAPI/asyncio)
- Resource leaks (DB sessions, file handles)
- Off-by-one errors or boundary conditions
- Incorrect error propagation (swallowing exceptions without logging)
- Optional types that don't need to be optional
- Booleans that should default to false but are set as optional
- Overly defensive code that adds unnecessary checks
- Unnecessary comments that just restate what the code already shows (remove them)

### Architecture & Patterns
- Code that violates existing patterns in the codebase (Service/Repository pattern)
- Missing error handling (should use `HTTPException` or custom domain errors)
- Async/await misuse (blocking operations in `async def` without `run_in_threadpool`)
- Improper Pydantic model usage

## Project-Specific Context

- This is a **Python (FastAPI)** and **TypeScript (React)** project.
- **Backend** (`backend/`):
  - Framework: FastAPI, SQLAlchemy (Sync/Async hybrid), Pydantic V2.
  - Architecture: Router -> Service -> Repository -> Model.
  - Async: Uses `async def` for endpoints, but `def` for synchronous domain logic (often wrapped in threadpool).
  - Caching: Redis via `app.core.cache`.
- **Frontend** (`frontend/`):
  - Framework: React, Vite, TailwindCSS.
  - State: TanStack Query (React Query).
  - Styling: TailwindCSS (Utility-first).
- **Testing**: `pytest` (Backend), `vitest`/`playwright` (Frontend).

## CI Pipeline Context

**Important**: You review PRs immediately, before CI completes. Do not flag issues that CI will catch.

### What Our CI Checks

**Backend checks:**
- `ruff check .` - Linting
- `ruff format --check .` - Formatting (Black compatible)
- `pytest` - Unit and Integration tests
- `mypy` - Type checking

**Frontend checks:**
- `npm ci` - Fresh dependency install
- `npm run lint` - ESLint + Prettier
- `npm run build` - Build verification
- `npx playwright test` - E2E tests

**Key insight**: Don't flag formatting or basic linting issues (unused imports, whitespace) as CI handles them. Focus on logic and architecture.

## Skip These (Low Value)

Do not comment on:
- **Style/formatting** - CI handles this (Ruff, Prettier)
- **Linting warnings** - CI handles this (Ruff, ESLint)
- **Test failures** - CI handles this
- **Missing dependencies** - CI handles this
- **Minor naming suggestions** - unless truly confusing
- **Suggestions to add comments** - for self-documenting code
- **Refactoring suggestions** - unless there's a clear bug or maintainability issue
- **Multiple issues in one comment** - choose the single most critical issue
- **Logging suggestions** - unless for errors or security events
- **Pedantic accuracy in text** - unless it would cause actual confusion or errors.

## Response Format

When you identify an issue:
1. **State the problem** (1 sentence)
2. **Why it matters** (1 sentence, only if not obvious)
3. **Suggested fix** (code snippet or specific action)

Example:
```
This blocking DB call inside an `async def` will freeze the event loop. Use `run_in_threadpool` or `await db.execute(...)`.
```

## When to Stay Silent

If you're uncertain whether something is an issue, don't comment. False positives create noise and reduce trust in the review process.