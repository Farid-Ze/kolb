# Correctness Review Findings

## Critical Issues

### 1. Resource Leak & Unnecessary Complexity in Background Task
- **Location**: `backend/app/services/engine.py` (Lines 117-123, `finalize_background_task`)
- **Issue**: 
    - The function creates a new `asyncio` event loop to run `log_provenance_background_task`.
    - **Leak**: `loop.close()` is placed *after* `loop.run_until_complete()`. If the task raises an exception, `loop.close()` is skipped, leaking the event loop.
    - **Complexity**: It creates a *new* Async DB session (`AsyncSessionLocal`) inside a sync function that *already* holds a valid Sync DB session.
- **Recommendation**: 
    - Reuse the existing sync `db` session.
    - Call `_upsert_scale_provenance_sync` (from `app.services.provenance`) directly instead of spinning up an async loop.

### 2. Unreachable Code (Dead Code)
- **Location**: `backend/app/services/engine.py` (Lines 159-165, `start_session`)
- **Issue**: Lines 159-165 are unreachable because line 157 returns early. This is duplicate code that will never execute.
- **Recommendation**: Remove lines 159-165.

## High Priority

### 3. Incomplete Implementation in Repository
- **Location**: `backend/app/db/repositories/pipeline.py` (Lines 18-47, `InstrumentRepository.get_by_code`)
- **Issue**: The first `get_by_code` method contains only a large comment block and a `pass` statement. It's dead code that does nothing.
- **Recommendation**: Remove this dead method definition. The class already has `get_by_code` (async) and `get_by_code_sync` defined later.

### 4. Incorrect Error Propagation (Swallowing Exceptions)
- **Location**: `backend/app/services/security.py` (Lines 144-145, `verify_refresh_token`)
- **Issue**: The `except Exception:` block catches all exceptions but re-raises a generic `ValueError("Invalid refresh token")`, losing the original error context and not logging the failure.
- **Recommendation**: Log the exception before re-raising, or at minimum catch more specific exceptions to avoid masking programming errors.

## Code Quality

### 5. Unnecessary Comments
- **Location**: `backend/app/services/engine.py` (Various)
- **Issue**: Numerous comments tagged `[Zenotika V4]` (e.g., `# [Zenotika V4] Race Condition Fix`, `# [Zenotika V4] Semantic Pivot`) merely describe the history/versioning rather than the code's intent.
- **Recommendation**: Remove these "tag" comments to reduce noise.
