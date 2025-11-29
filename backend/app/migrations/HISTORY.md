# Migration History - Context & Evolution

## Overview
This document explains the migration history evolution for Zenotika V4.0, particularly the "store → grants" transition that created overlapping migrations 0024-aca106.

## Timeline

### Early Phase: E-Commerce Model (0024)
- **Migration**: `0024_store_init.py`
- **Purpose**: Initial implementation of store/orders system
- **Tables**: `store_orders`, `store_products`, etc.
- **Rationale**: Originally designed as e-commerce platform

### Pivot Phase: Semantic Shift (6ba1949)
- **Migration**: `6ba1949ddf0c_migrate_store_to_grants.py`
- **Purpose**: Transition from "Store" (commercial) to "Grants" (academic) model
- **Action**: Data migration from `store_orders` → `access_grants`
- **Status**: **Incomplete** - Target tables already removed by subsequent migration

### Cleanup Phase: Demolition (aca106)
- **Migration**: `aca106f5b211_remove_store_tables.py`
- **Purpose**: Remove legacy store infrastructure
- **Action**: Drop `store_orders`, `store_products`, related tables
- **Issue**: Created migration conflict with 6ba1949

### Resolution Phase: Schema Finalization (8684d42)
- **Migration**: `8684d42d6e93_update_access_grant_schema.py`
- **Purpose**: Finalize `access_grants` schema
- **Changes**:
  - Rename `credits_used` → `credits_consumed`
  - Add `source_ref`, `study_id` columns
  - Add check constraint: `credits_consumed <= credits_total`
- **Note**: Data migration skipped (source tables absent)

## Current State

**Schema**: Clean `access_grants` table with correct structure
**Migrations**: Linear history (conflicts resolved)
**Status**: All store artifacts removed

## Lessons Learned

1. **Sequential Cleanup**: Should have removed store BEFORE creating grant migration
2. **Data Migration Timing**: Ensure source tables exist before data migration
3. **Testing**: Verify migration order in clean database before production

## Best Practices Going Forward

- **Freeze Old Migrations**: Do NOT modify migrations 0024-aca106
- **Fix Forward**: New issues require new migrations, not edits
- **Documentation**: Keep this file updated for future reference

## Migration Commands

```bash
# Verify current state
docker-compose exec api alembic current

# Check for conflicts
docker-compose exec api alembic heads

# Upgrade to latest
docker-compose exec api alembic upgrade head
```

## Notes

The migration chaos is historical artifact. Current production deployments should start from clean state with all migrations applied sequentially. The `access_grants` table is correctly structured and operational.

---

**Last Updated**: 2025-11-29
**Maintainer**: Zenotika Development Team
