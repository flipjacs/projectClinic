from __future__ import annotations

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Grupos (leitura e escrita usam a mesma forma — todos os campos booleanos).
# Espelham exatamente o DTO consumido pelo frontend (snake_case).
# ---------------------------------------------------------------------------
class AppointmentsNotifications(BaseModel):
    remind_24h: bool
    remind_2h: bool
    remind_30min: bool
    confirmation_message: bool


class FinanceNotifications(BaseModel):
    payment_overdue: bool
    payment_received: bool
    new_budget: bool
    reminder_cancelled: bool


class InventoryNotifications(BaseModel):
    low_stock: bool
    product_expiring: bool
    auto_replenishment: bool


class SystemNotifications(BaseModel):
    updates: bool
    critical_failures: bool
    backup_completed: bool
    integrations: bool


class NotificationSettingsRead(BaseModel):
    appointments: AppointmentsNotifications
    finance: FinanceNotifications
    inventory: InventoryNotifications
    system: SystemNotifications


class NotificationSettingsUpdate(NotificationSettingsRead):
    """Substituição total: todos os grupos são obrigatórios. A UI sempre envia o
    formulário completo (não há edição parcial), então validamos o payload
    inteiro — nenhum campo booleano pode ficar ambíguo."""
