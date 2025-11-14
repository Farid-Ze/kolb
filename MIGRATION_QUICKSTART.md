# Alembic Migration Quick Start

This guide shows you how to run Alembic migrations after the recent environment fixes.

## TL;DR

```bash
# PowerShell (Windows)
$Env:PYTHONPATH = (Get-Location).Path
$Env:JWT_SECRET_KEY = "test-secret-key"
alembic upgrade head

# Bash (Linux/Mac)
export PYTHONPATH=$(pwd)
export JWT_SECRET_KEY=test-secret-key
alembic upgrade head

# One-liner
PYTHONPATH=$(pwd) JWT_SECRET_KEY=test-secret-key alembic upgrade head
```

## What Changed?

Three minimal fixes were applied to enable Alembic migrations:

### 1. Fixed `migrations/env.py`
Added sys.path injection and JWT_SECRET_KEY default to enable imports from `app` module.

### 2. Fixed migration 0013
Removed invalid Python syntax that caused parsing errors.

### 3. Guarded PostgreSQL-specific features in migration 0020
The `postgresql_include` parameter is now only used when running on PostgreSQL, not SQLite.

## Required Environment Variables

### PYTHONPATH
- **What**: Path to the project root directory
- **Why**: Allows migrations to `import` from the `app` module
- **How**: Set to your project root (where `app/` directory is located)

### JWT_SECRET_KEY
- **What**: Secret key for JWT authentication
- **Why**: Required by `app.core.config` during initialization
- **Requirements**: Must be at least 8 characters long
- **Value**: Any string ≥8 characters (e.g., `test-secret-key`)

### DATABASE_URL (Optional)
- **What**: Database connection string
- **Default**: `sqlite:///./klsi.db`
- **PostgreSQL example**: `postgresql://user:pass@localhost/dbname`

## Common Commands

```bash
# Set environment (do this first!)
export PYTHONPATH=$(pwd)
export JWT_SECRET_KEY=test-secret-key

# Check current migration
alembic current

# Show migration history
alembic history

# Show latest migration
alembic heads

# Upgrade to latest
alembic upgrade head

# Downgrade one step
alembic downgrade -1

# Create new migration
alembic revision -m "description"

# Auto-generate migration from model changes
alembic revision --autogenerate -m "description"
```

## Common Errors & Solutions

### Error: `ModuleNotFoundError: No module named 'app'`
**Solution**: Set `PYTHONPATH` to project root
```bash
export PYTHONPATH=$(pwd)
```

### Error: `Missing required environment variable: JWT_SECRET_KEY`
**Solution**: Set `JWT_SECRET_KEY` (8+ characters)
```bash
export JWT_SECRET_KEY=test-secret-key
```

### Error: `String should have at least 8 characters`
**Solution**: Use a longer JWT_SECRET_KEY
```bash
export JWT_SECRET_KEY=test-secret-key  # Not just "test"
```

## Development vs Production

### Development
For quick iteration, the app can auto-create tables:
```bash
# .env or environment
RUN_STARTUP_DDL=1
RUN_STARTUP_SEED=1

# Run app (creates tables automatically)
uvicorn app.main:app --reload
```

### Production
Always use Alembic for production:
```bash
# Disable auto-creation
export RUN_STARTUP_DDL=0
export RUN_STARTUP_SEED=0

# Set migration environment
export PYTHONPATH=$(pwd)
export JWT_SECRET_KEY=production-secret-key
export DATABASE_URL=postgresql://user:pass@host/db

# Run migrations
alembic upgrade head

# Start app
uvicorn app.main:app
```

## CI/CD Example

### GitHub Actions
```yaml
- name: Run Migrations
  env:
    PYTHONPATH: ${{ github.workspace }}
    JWT_SECRET_KEY: ci-test-secret-key
    DATABASE_URL: postgresql://postgres:postgres@localhost/testdb
  run: alembic upgrade head
```

### GitLab CI
```yaml
migrate:
  script:
    - export PYTHONPATH=$CI_PROJECT_DIR
    - export JWT_SECRET_KEY=ci-test-secret-key
    - alembic upgrade head
```

## More Information

- **Detailed guide**: See `docs/MIGRATIONS.md`
- **Problem statement**: See GitHub issue/PR description
- **Architecture**: See `docs/17-architecture-engine.md`
- **README**: See `README.md` section 10 and 13

## Quick Verification

Test that your environment is set up correctly:

```bash
# Should show the latest migration
PYTHONPATH=$(pwd) JWT_SECRET_KEY=test-secret-key alembic heads

# Should output: 0020_add_session_lookup_indexes (head)
```

If you see this output, your environment is configured correctly! 🎉
