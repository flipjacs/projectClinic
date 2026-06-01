from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import settings
from app.database.base import Base

# Importa os módulos que contêm modelos para popular Base.metadata.
# Conforme novos modelos forem criados, adicione os imports abaixo.
from app.modules.auth import models as auth_models  # noqa: F401
from app.modules.users import models as users_models  # noqa: F401
from app.modules.patients import models as patients_models  # noqa: F401
from app.modules.medical_records import models as medical_records_models  # noqa: F401
from app.modules.appointments import models as appointments_models  # noqa: F401
from app.modules.procedures import models as procedures_models  # noqa: F401
from app.modules.finance import models as finance_models  # noqa: F401
from app.modules.inventory import models as inventory_models  # noqa: F401
from app.modules.reports import models as reports_models  # noqa: F401
from app.modules.audit import models as audit_models  # noqa: F401


config = context.config

# Injeta a URL do banco a partir do settings, garantindo que .env mande.
config.set_main_option("sqlalchemy.url", settings.sqlalchemy_database_uri)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section) or {},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
