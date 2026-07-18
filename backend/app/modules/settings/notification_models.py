from __future__ import annotations

from sqlalchemy import BigInteger, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import expression

from app.database.base import Base, TimestampMixin


def _bool(default: bool) -> Mapped[bool]:
    server = expression.true() if default else expression.false()
    return mapped_column(Boolean, nullable=False, default=default, server_default=server)


class NotificationSettings(Base, TimestampMixin):
    """Preferências de notificação da clínica (linha única / singleton).

    Política operacional compartilhada — quais avisos o sistema dispara — gerida
    pelo ADMIN, no mesmo molde de ``SecuritySettings``. Campos fortemente
    tipados (nunca JSON); os padrões espelham ``defaultNotificationSettings`` do
    frontend: avisos clínicos/críticos ligados, opcionais desligados.
    """

    __tablename__ = "notification_settings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    # ----- Agendamentos -----
    appt_remind_24h: Mapped[bool] = _bool(True)
    appt_remind_2h: Mapped[bool] = _bool(False)
    appt_remind_30min: Mapped[bool] = _bool(False)
    appt_confirmation_message: Mapped[bool] = _bool(True)

    # ----- Financeiro -----
    finance_payment_overdue: Mapped[bool] = _bool(True)
    finance_payment_received: Mapped[bool] = _bool(False)
    finance_new_budget: Mapped[bool] = _bool(True)
    finance_reminder_cancelled: Mapped[bool] = _bool(True)

    # ----- Estoque -----
    inventory_low_stock: Mapped[bool] = _bool(True)
    inventory_product_expiring: Mapped[bool] = _bool(True)
    inventory_auto_replenishment: Mapped[bool] = _bool(False)

    # ----- Sistema -----
    system_updates: Mapped[bool] = _bool(False)
    system_critical_failures: Mapped[bool] = _bool(True)
    system_backup_completed: Mapped[bool] = _bool(False)
    system_integrations: Mapped[bool] = _bool(False)
