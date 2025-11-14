"""
Test suite for migration environment fixes.

This test validates:
1. env.py correctly sets up sys.path for app imports
2. env.py sets default JWT_SECRET_KEY
3. Migration 0020 guards PostgreSQL-specific postgresql_include parameter
"""

from pathlib import Path

import pytest


def test_env_py_has_sys_path_injection():
    """Verify that env.py injects project root into sys.path."""
    env_py_path = Path(__file__).resolve().parents[1] / "migrations" / "env.py"
    content = env_py_path.read_text()
    
    # Check for sys import
    assert "import sys" in content, "env.py should import sys"
    
    # Check for Path import
    assert "from pathlib import Path" in content, "env.py should import Path"
    
    # Check for sys.path injection
    assert "sys.path.insert" in content or "sys.path" in content, \
        "env.py should inject project root into sys.path"
    
    # Check for Path(__file__).resolve().parents usage
    assert "Path(__file__).resolve().parents" in content, \
        "env.py should use Path to find project root"


def test_env_py_sets_jwt_secret_key_default():
    """Verify that env.py sets a default JWT_SECRET_KEY for migration context."""
    env_py_path = Path(__file__).resolve().parents[1] / "migrations" / "env.py"
    content = env_py_path.read_text()
    
    # Check for JWT_SECRET_KEY default
    assert "JWT_SECRET_KEY" in content, "env.py should reference JWT_SECRET_KEY"
    assert "os.environ.setdefault" in content, \
        "env.py should use os.environ.setdefault"
    assert "alembic-migrate-secret" in content, \
        "env.py should provide a migration-specific default value"


def test_migration_0020_guards_postgresql_include():
    """Verify that migration 0020 guards postgresql_include parameter for non-PostgreSQL databases."""
    migration_path = Path(__file__).resolve().parents[1] / "migrations" / "versions" / "0020_add_session_lookup_indexes.py"
    content = migration_path.read_text()
    
    # Check that dialect detection is present
    assert "bind = op.get_bind()" in content, \
        "Migration 0020 should get bind to check dialect"
    assert "dialect = bind.dialect.name" in content or "dialect.name" in content, \
        "Migration 0020 should check dialect name"
    
    # Check that postgresql_include is conditionally applied
    assert "postgresql" in content.lower(), \
        "Migration 0020 should reference PostgreSQL"
    assert "postgresql_include" in content, \
        "Migration 0020 should use postgresql_include parameter"
    
    # Check that there's conditional logic (if statement or kwargs dict)
    assert 'if dialect == "postgresql"' in content or "index_kwargs" in content, \
        "Migration 0020 should conditionally apply postgresql_include"


def test_migration_0013_syntax_fixed():
    """Verify that migration 0013 no longer has the invalid syntax at end of file."""
    migration_path = Path(__file__).resolve().parents[1] / "migrations" / "versions" / "0013_add_instruments.py"
    content = migration_path.read_text()
    
    # Check that the invalid syntax marker is removed
    assert "*** End of File" not in content, \
        "Migration 0013 should not have '*** End of File' comment"
    
    # Verify the file is valid Python syntax
    try:
        compile(content, str(migration_path), 'exec')
    except SyntaxError as e:
        pytest.fail(f"Migration 0013 has syntax error: {e}")


def test_env_py_import_order():
    """Verify that env.py sets up environment before importing from app."""
    env_py_path = Path(__file__).resolve().parents[1] / "migrations" / "env.py"
    content = env_py_path.read_text()
    
    lines = content.split('\n')
    
    # Find the line numbers of key operations
    sys_path_line = next((i for i, line in enumerate(lines) if 'sys.path.insert' in line or ('sys.path' in line and 'append' in line)), -1)
    jwt_line = next((i for i, line in enumerate(lines) if 'JWT_SECRET_KEY' in line and 'setdefault' in line), -1)
    app_import_line = next((i for i, line in enumerate(lines) if 'from app.db.database import Base' in line), -1)
    
    # Verify order: sys.path setup, then JWT_SECRET_KEY, then app import
    assert sys_path_line > 0, "sys.path injection should be present"
    assert jwt_line > 0, "JWT_SECRET_KEY default should be present"
    assert app_import_line > 0, "app.db.database import should be present"
    
    assert sys_path_line < app_import_line, \
        "sys.path injection should come before app import"
    assert jwt_line < app_import_line, \
        "JWT_SECRET_KEY default should come before app import"
