from __future__ import annotations

from typing import Any, Optional

from sqlalchemy.orm import Session

from app.modules.audit.service import AuditLogService
from app.modules.settings.notification_models import NotificationSettings
from app.modules.settings.notification_repository import NotificationSettingsRepository
from app.modules.settings.notification_schemas import (
    AppointmentsNotifications,
    FinanceNotifications,
    InventoryNotifications,
    NotificationSettingsRead,
    NotificationSettingsUpdate,
    SystemNotifications,
)

# Colunas escalares registradas no diff de auditoria (before/after).
_AUDITED_FIELDS = (
    "appt_remind_24h", "appt_remind_2h", "appt_remind_30min", "appt_confirmation_message",
    "finance_payment_overdue", "finance_payment_received", "finance_new_budget",
    "finance_reminder_cancelled", "inventory_low_stock", "inventory_product_expiring",
    "inventory_auto_replenishment", "system_updates", "system_critical_failures",
    "system_backup_completed", "system_integrations",
)


class NotificationSettingsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = NotificationSettingsRepository(db)
        self.audit = AuditLogService(db)

    # ----- queries -----
    def get(self) -> Optional[NotificationSettings]:
        return self.repo.get()

    @staticmethod
    def serialize(entity: NotificationSettings) -> NotificationSettingsRead:
        return NotificationSettingsRead(
            appointments=AppointmentsNotifications(
                remind_24h=entity.appt_remind_24h,
                remind_2h=entity.appt_remind_2h,
                remind_30min=entity.appt_remind_30min,
                confirmation_message=entity.appt_confirmation_message,
            ),
            finance=FinanceNotifications(
                payment_overdue=entity.finance_payment_overdue,
                payment_received=entity.finance_payment_received,
                new_budget=entity.finance_new_budget,
                reminder_cancelled=entity.finance_reminder_cancelled,
            ),
            inventory=InventoryNotifications(
                low_stock=entity.inventory_low_stock,
                product_expiring=entity.inventory_product_expiring,
                auto_replenishment=entity.inventory_auto_replenishment,
            ),
            system=SystemNotifications(
                updates=entity.system_updates,
                critical_failures=entity.system_critical_failures,
                backup_completed=entity.system_backup_completed,
                integrations=entity.system_integrations,
            ),
        )

    # ----- mutations -----
    def update(
        self, payload: NotificationSettingsUpdate, current_user_id: int
    ) -> NotificationSettings:
        entity = self.repo.get_for_update()
        before = self._snapshot(entity) if entity else None
        created = entity is None
        if entity is None:
            entity = NotificationSettings()
            self.repo.add(entity)

        a = payload.appointments
        entity.appt_remind_24h = a.remind_24h
        entity.appt_remind_2h = a.remind_2h
        entity.appt_remind_30min = a.remind_30min
        entity.appt_confirmation_message = a.confirmation_message

        f = payload.finance
        entity.finance_payment_overdue = f.payment_overdue
        entity.finance_payment_received = f.payment_received
        entity.finance_new_budget = f.new_budget
        entity.finance_reminder_cancelled = f.reminder_cancelled

        inv = payload.inventory
        entity.inventory_low_stock = inv.low_stock
        entity.inventory_product_expiring = inv.product_expiring
        entity.inventory_auto_replenishment = inv.auto_replenishment

        s = payload.system
        entity.system_updates = s.updates
        entity.system_critical_failures = s.critical_failures
        entity.system_backup_completed = s.backup_completed
        entity.system_integrations = s.integrations

        self.repo.save(entity)
        after = self._snapshot(entity)
        self.audit.record(
            actor_user_id=current_user_id,
            action="notification_settings.create" if created else "notification_settings.update",
            entity_type="notification_settings",
            entity_id=entity.id,
            summary="Preferências de notificação salvas",
            before=before,
            after=after,
        )
        self.db.commit()
        self.db.refresh(entity)
        return entity

    @staticmethod
    def _snapshot(entity: NotificationSettings) -> dict[str, Any]:
        return {field: getattr(entity, field) for field in _AUDITED_FIELDS}
