# Database Layer Documentation

## Overview

The database layer provides abstraction for data access using SQLAlchemy ORM with repository pattern. This document describes the schema, indexes, and best practices for database operations.

## Database Configuration

### Supported Databases

- **SQLite** (Development): `sqlite:///./klsi.db`
- **PostgreSQL** (Production): `postgresql://user:pass@host:5432/klsi`

Configuration via environment variable:
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/klsi"
```

### Connection Pooling

SQLAlchemy manages connection pooling automatically:
- **Pool size**: Default 5 connections
- **Max overflow**: Default 10 additional connections
- **Pool recycle**: 3600 seconds (avoid stale connections)

## Schema Overview

### Core Tables

#### Users & Authentication
- `users` - User accounts (students, mediators)
- `roles` - Role definitions (MAHASISWA, MEDIATOR)

#### Assessments
- `instruments` - Assessment instrument definitions (KLSI 4.0)
- `assessment_sessions` - User assessment attempts
- `assessment_items` - Forced-choice ranking items (12 items)
- `assessment_item_choices` - Choices per item (4 per item)
- `user_responses` - Ipsative rankings submitted by users

#### Scoring & Results
- `scale_scores` - Raw CE/RO/AC/AE scores
- `combination_scores` - Dialectics (ACCE, AERO) and balance metrics
- `user_learning_styles` - Primary and backup learning styles
- `learning_style_types` - Style definitions (9 types)
- `percentile_scores` - Normative conversions

#### Learning Flexibility Index (LFI)
- `lfi_context_scores` - Rankings for 8 contexts
- `learning_flexibility_index` - Kendall's W and LFI scores
- `backup_learning_styles` - Alternative styles used across contexts

#### Normative Data
- `normative_conversion_table` - Raw score → percentile mappings
- `norm_groups` - Demographic segments for norms

#### Teams & Research
- `teams` - Team/class groupings
- `team_members` - Team membership
- `team_rollup_stats` - Aggregate team statistics
- `research_projects` - Research study definitions
- `research_participants` - Study enrollment

#### Audit
- `audit_log` - Audit trail for sensitive operations

## Critical Indexes

### Performance Indexes

```sql
-- Most frequently queried columns
CREATE INDEX idx_sessions_user_status ON assessment_sessions(user_id, status);
CREATE INDEX idx_responses_session_item ON user_responses(session_id, item_id);
CREATE INDEX idx_scale_scores_session ON scale_scores(session_id);
CREATE INDEX idx_percentile_scores_session ON percentile_scores(session_id);

-- Normative conversion lookups (hot path)
CREATE INDEX idx_norm_conversion_lookup ON normative_conversion_table(
    norm_group, scale_name, raw_score
);

-- Team rollup queries
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- Audit queries
CREATE INDEX idx_audit_timestamp ON audit_log(created_at);
CREATE INDEX idx_audit_actor ON audit_log(actor);
```

### Composite Indexes

```sql
-- Session finalization queries
CREATE INDEX idx_session_finalization ON assessment_sessions(
    id, status, instrument_id
) WHERE status IN ('started', 'in_progress');

-- LFI context retrieval
CREATE INDEX idx_lfi_contexts_session ON lfi_context_scores(session_id, context_name);
```

## Query Best Practices

### ✅ DO: Select Specific Columns

```python
# Good - only fetch needed columns
from sqlalchemy import select
stmt = select(User.id, User.email, User.role).where(User.email == email)
user = db.execute(stmt).first()
```

### ❌ DON'T: Use SELECT *

```python
# Bad - fetches all columns unnecessarily
user = db.query(User).filter(User.email == email).first()
```

### ✅ DO: Use Eager Loading

```python
# Good - fetch relationships in single query
from sqlalchemy.orm import joinedload
session = db.query(AssessmentSession).options(
    joinedload(AssessmentSession.user),
    joinedload(AssessmentSession.scale_scores)
).filter(AssessmentSession.id == session_id).first()
```

### ❌ DON'T: N+1 Queries

```python
# Bad - triggers query per iteration
sessions = db.query(AssessmentSession).all()
for session in sessions:
    print(session.user.email)  # N queries!
```

### ✅ DO: Use Repository Pattern

```python
# Good - encapsulated, testable
from app.db.repositories import SessionRepository
repo = SessionRepository(db)
session = repo.get_by_id(session_id)
```

### ✅ DO: Use Transactions for Batch Operations

```python
# Good - atomic batch insert
from app.db.database import transactional_session

with transactional_session() as db:
    for row in bulk_data:
        db.add(NormativeConversionTable(**row))
    # Commits on context exit
```

### ❌ DON'T: Commit Per Row

```python
# Bad - slow, not atomic
for row in bulk_data:
    db.add(NormativeConversionTable(**row))
    db.commit()  # Expensive!
```

## Repository Pattern

### Available Repositories

```python
from app.db.repositories import (
    SessionRepository,
    NormativeConversionRepository,
)

# Session operations
session_repo = SessionRepository(db)
session = session_repo.get_by_id(session_id)
sessions = session_repo.get_by_user_id(user_id)

# Norm lookups
norm_repo = NormativeConversionRepository(db)
percentile = norm_repo.get_percentile(
    norm_group="Total",
    scale_name="CE",
    raw_score=25
)
```

### Benefits

- **Encapsulation**: Database logic isolated from business logic
- **Testability**: Easy to mock for unit tests
- **Consistency**: Standardized query patterns
- **Caching**: Repository layer can implement caching

## Transaction Management

### Context Manager Pattern

```python
from app.db.database import get_db

# FastAPI dependency injection
def my_endpoint(db: Session = Depends(get_db)):
    # db auto-commits on success, rollbacks on exception
    db.add(new_record)
    # No explicit commit needed
```

### Manual Transaction Control

```python
from app.db.database import transactional_session

# Explicit transaction boundary
with transactional_session() as db:
    db.add(record1)
    db.add(record2)
    # Commits on __exit__ if no exception
```

## Migrations

### Alembic Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "add_column_xyz"

# Review generated migration
# Edit migrations/versions/XXXX_add_column_xyz.py if needed

# Apply migration
alembic upgrade head

# Rollback one version
alembic downgrade -1
```

### Migration Best Practices

- ✅ Review auto-generated migrations before applying
- ✅ Test migrations on staging data first
- ✅ Include both upgrade and downgrade logic
- ✅ Add indexes in separate migrations if large table
- ❌ Never edit already-applied migrations
- ❌ Don't mix schema and data changes in same migration

## Performance Tips

### Connection Pooling

```python
# Already configured in database.py
engine = create_engine(
    settings.database_url,
    poolclass=QueuePool,
    pool_size=5,           # Base connections
    max_overflow=10,       # Additional under load
    pool_recycle=3600,     # Recycle every hour
    pool_pre_ping=True,    # Verify connection before use
)
```

### Query Optimization

1. **Use indexes** on frequently queried columns
2. **Limit result sets** with `.limit()`
3. **Avoid N+1 queries** with eager loading
4. **Batch operations** in transactions
5. **Use connection pooling** (already configured)

### Monitoring Queries

```python
import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Shows all SQL queries for debugging
```

## Security Considerations

### SQL Injection Prevention

✅ **SAFE**: SQLAlchemy ORM (parameterized automatically)
```python
db.query(User).filter(User.email == user_input).first()
```

❌ **UNSAFE**: Raw SQL with string formatting
```python
db.execute(f"SELECT * FROM users WHERE email = '{user_input}'")
```

✅ **SAFE**: Raw SQL with parameters
```python
from sqlalchemy import text
db.execute(text("SELECT * FROM users WHERE email = :email"), {"email": user_input})
```

### Sensitive Data

- Passwords: **Never stored plaintext** (uses bcrypt hashing)
- JWT tokens: **Signed with HS256**, secret key in environment
- Audit logs: **Hash sensitive payloads** with SHA-256

## Backup & Restore

### PostgreSQL

```bash
# Backup
pg_dump -h localhost -U user -d klsi > backup.sql

# Restore
psql -h localhost -U user -d klsi < backup.sql
```

### SQLite

```bash
# Backup (simple file copy)
cp klsi.db klsi.db.backup

# Or use SQLite backup command
sqlite3 klsi.db ".backup klsi.db.backup"
```

## Database Maintenance

### Vacuum (PostgreSQL)

```sql
-- Reclaim storage and update statistics
VACUUM ANALYZE;

-- Full vacuum (requires exclusive lock)
VACUUM FULL;
```

### Index Maintenance

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Drop unused indexes
DROP INDEX IF EXISTS idx_unused;
```

## Troubleshooting

### Common Issues

**Issue**: "Too many connections"
- **Solution**: Increase pool_size or add connection pooling

**Issue**: "Database is locked" (SQLite)
- **Solution**: Use PostgreSQL for production, enable WAL mode for SQLite

**Issue**: Slow queries
- **Solution**: Add indexes, use EXPLAIN ANALYZE, optimize query

**Issue**: Connection timeout
- **Solution**: Increase pool_recycle, check network connectivity

### Debug Mode

```python
from app.core.config import settings

if settings.debug:
    import logging
    logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
```

## Related Documentation

- `/docs/02-relational-model.md` - Detailed schema documentation
- `/docs/13-model-fisik-postgres.md` - Physical model for PostgreSQL
- `migrations/` - Alembic migration history

---

**Maintained by**: Farid-Ze  
**Last Updated**: 2025-11-13  
**Database Version**: PostgreSQL 14+ / SQLite 3.35+
