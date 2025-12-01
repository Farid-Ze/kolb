import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool, text

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Provide database url via env var fallback
if not config.get_main_option("sqlalchemy.url"):
    db_url = os.getenv("DATABASE_URL", "sqlite:///./klsi.db")
    # [Fix] Replace async driver with sync driver for Alembic
    if db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql+psycopg://")
    config.set_main_option("sqlalchemy.url", db_url)

# Add project root to sys.path for app imports
project_root = Path(__file__).resolve().parents[2]
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Set default JWT_SECRET_KEY for migration context
os.environ.setdefault("JWT_SECRET_KEY", "alembic-migrate-secret")

from app.db.database import Base  # noqa: E402
import app.models.klsi  # noqa: F401, E402
import app.models.klsi.grant  # noqa: F401, E402
import app.models.engine  # noqa: F401, E402
import app.models.research  # noqa: F401, E402
import app.models.team  # noqa: F401, E402

target_metadata = Base.metadata

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        if connection.dialect.name == "postgresql":
            with connection.begin():
                version_table_exists = connection.execute(
                    text(
                        """
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_name = 'alembic_version'
                          AND table_schema = current_schema()
                        """
                    )
                ).scalar()
                if not version_table_exists:
                    connection.execute(text("CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(64) NOT NULL)"))
                else:
                    max_len = connection.execute(
                        text(
                            """
                            SELECT character_maximum_length
                            FROM information_schema.columns
                            WHERE table_name = 'alembic_version'
                              AND table_schema = current_schema()
                              AND column_name = 'version_num'
                            """
                        )
                    ).scalar()
                    if max_len is not None and max_len < 64:
                        connection.execute(text("ALTER TABLE alembic_version ALTER COLUMN version_num TYPE VARCHAR(64)"))

        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
