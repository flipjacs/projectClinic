from __future__ import annotations

from app.modules.audit.models import AuditLog


class AuditLogRepository:
    def __init__(self, db) -> None:
        self.db = db

    def add(self, log: AuditLog) -> AuditLog:
        self.db.add(log)
        self.db.flush()
        return log
