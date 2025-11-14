# Alembic Migration Guide

This document explains how to use Alembic migrations for the KLSI 4.0 API.

## Prerequisites

The migration environment requires specific setup to work correctly:

### Environment Variables

Alembic requires the following environment variables to be set:

1. **PYTHONPATH**: Path to the project root directory
   - Required for migrations to import from the `app` module
   - Example: `/path/to/kolb` or `$(pwd)` when in project root

2. **JWT_SECRET_KEY**: Secret key for JWT authentication
   - Required by `app.core.config` during module initialization
   - Must be at least 8 characters long
   - Any value ≥8 chars works for migration purposes
   - Example: `alembic-migrate-secret`
   - **Note**: While `env.py` provides a default, migration files that import from `app` at module level are loaded before `env.py` runs, so you must set this environment variable explicitly

3. **DATABASE_URL** (optional): Database connection string
   - Defaults to `sqlite:///./klsi.db` if not set
   - For PostgreSQL: `postgresql://user:pass@localhost/dbname`

## Setup

### PowerShell (Windows)

```powershell
# Navigate to project root
cd path\to\kolb

# Set environment variables
$Env:PYTHONPATH = (Get-Location).Path
$Env:JWT_SECRET_KEY = "alembic-migrate-secret"

# Optional: Set database URL
# $Env:DATABASE_URL = "sqlite:///./klsi.db"
```

### Bash (Linux/Mac)

```bash
# Navigate to project root
cd /path/to/kolb

# Set environment variables
export PYTHONPATH=$(pwd)
export JWT_SECRET_KEY=alembic-migrate-secret

# Optional: Set database URL
# export DATABASE_URL=sqlite:///./klsi.db
```

## Common Commands

Once environment variables are set, you can use standard Alembic commands:

```bash
# Show current migration version
alembic current

# Show migration history
alembic history

# Show pending migrations
alembic heads

# Upgrade to latest migration
alembic upgrade head

# Upgrade to specific migration
alembic upgrade <revision>

# Downgrade one migration
alembic downgrade -1

# Downgrade to specific migration
alembic downgrade <revision>

# Generate new migration (auto-detect changes)
alembic revision --autogenerate -m "description"

# Create empty migration
alembic revision -m "description"
```

## One-Line Commands

For convenience, you can run commands with environment variables inline:

### PowerShell

```powershell
$Env:PYTHONPATH = (Get-Location).Path; $Env:JWT_SECRET_KEY = "test"; alembic upgrade head
```

### Bash

```bash
PYTHONPATH=$(pwd) JWT_SECRET_KEY=test alembic upgrade head
```

## Migration Architecture

### env.py Enhancements

The `migrations/env.py` file has been enhanced to:

1. **Inject project root into sys.path**
   - Allows migrations to import from `app` module
   - Uses `Path(__file__).resolve().parents[1]` to find project root

2. **Set default JWT_SECRET_KEY**
   - Provides `alembic-migrate-secret` as fallback
   - Prevents config initialization errors during migrations

### Database Dialect Support

Migrations are designed to work with both SQLite and PostgreSQL:

- **SQLite**: Default database for development
- **PostgreSQL**: Recommended for production

Some features are PostgreSQL-specific and are guarded by dialect detection:

```python
bind = op.get_bind()
dialect = bind.dialect.name

if dialect == "postgresql":
    # PostgreSQL-specific operations
    pass
```

Example: Migration `0020_add_session_lookup_indexes` uses `postgresql_include` parameter only on PostgreSQL.

## Development vs Production

### Development

For rapid iteration during development, you can use:

```python
# app/main.py
if settings.run_startup_ddl:
    Base.metadata.create_all(bind=engine)
```

This automatically creates tables from ORM models without migrations.

**Environment variables for dev:**
```bash
RUN_STARTUP_DDL=1  # Enable automatic table creation
RUN_STARTUP_SEED=1  # Enable automatic seeding
```

### Production

For production, always use Alembic migrations:

```bash
export RUN_STARTUP_DDL=0
export RUN_STARTUP_SEED=0
export PYTHONPATH=$(pwd)
export JWT_SECRET_KEY=production-secret-key
export DATABASE_URL=postgresql://user:pass@host/db

alembic upgrade head
```

## Troubleshooting

### ModuleNotFoundError: No module named 'app'

**Cause**: PYTHONPATH is not set or incorrect.

**Solution**: 
```bash
export PYTHONPATH=/path/to/kolb  # Use absolute path to project root
```

### RuntimeError: Missing required environment variable: JWT_SECRET_KEY

**Cause**: JWT_SECRET_KEY is not set.

**Solution**:
```bash
export JWT_SECRET_KEY=your-secret-key  # Must be at least 8 characters
```

### ValidationError: String should have at least 8 characters

**Cause**: JWT_SECRET_KEY is too short (less than 8 characters).

**Solution**:
```bash
export JWT_SECRET_KEY=test-secret-key  # Use 8+ characters
```

### sqlite3.OperationalError: no such table

**Cause**: Tables don't exist yet. Migrations assume tables are created by `Base.metadata.create_all()` first.

**Solution**: Either:
1. Run the application once with `RUN_STARTUP_DDL=1` to create tables
2. Or ensure earlier migrations create the required tables

### SyntaxError in migration file

**Cause**: Migration file has invalid Python syntax (e.g., comment markers).

**Solution**: Check the migration file and remove any non-Python syntax. All migrations should be valid Python code.

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
- name: Run Alembic Migrations
  env:
    PYTHONPATH: ${{ github.workspace }}
    JWT_SECRET_KEY: ci-test-secret
    DATABASE_URL: postgresql://postgres:postgres@localhost/testdb
  run: |
    pip install -r requirements.txt
    alembic upgrade head
```

Example GitLab CI:

```yaml
migrate:
  script:
    - export PYTHONPATH=$CI_PROJECT_DIR
    - export JWT_SECRET_KEY=ci-test-secret
    - pip install -r requirements.txt
    - alembic upgrade head
```

## Best Practices

1. **Always set PYTHONPATH**: Required for all Alembic commands
2. **Use descriptive migration names**: `alembic revision -m "add_user_preferences_table"`
3. **Test migrations both ways**: Test both upgrade and downgrade
4. **Review auto-generated migrations**: Always check what `--autogenerate` produces
5. **Use transactions**: Migrations should be atomic when possible
6. **Guard database-specific features**: Use dialect detection for PostgreSQL-only features
7. **Document complex migrations**: Add docstrings explaining the purpose and approach

## Migration History

Current migrations (as of latest):

- `0001_initial`: Initial schema setup
- `0002_materialized_class_stats`: PostgreSQL materialized views
- `0003_add_recommended_indexes`: Performance indexes
- `0004_team_research_schema`: Team and research tables
- `0005_add_lfi_provenance`: LFI provenance tracking
- `0006_add_percentile_provenance`: Per-scale provenance
- `0007_expand_norm_group`: Expand norm group column
- `0008_assessment_engine_scaffold`: Engine architecture tables
- `0009_enforce_lfi_context_catalog`: LFI context constraints
- `0010_allow_null_style_bounds`: Allow open intervals
- `0011_create_scale_provenance`: Scale provenance table
- `0012_backfill_scale_provenance`: Backfill existing data
- `0013_add_instruments`: Instrument metadata tables
- `0014_norm_version_tracking`: Norm version tracking
- `0015_enforce_unique_lfi_context`: Unique LFI contexts
- `0016_add_scoring_pipeline_tables`: Pipeline infrastructure
- `0017_migrate_startup_to_migrations`: Move DDL to migrations
- `0018_perf_indexes`: Additional performance indexes
- `0019_normative_conv_composite_index`: Composite indexes for norms
- `0020_add_session_lookup_indexes`: Session lookup optimization

## Additional Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- Project README: `README.md`
- Architecture docs: `docs/17-architecture-engine.md`
