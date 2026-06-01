from __future__ import annotations

import json
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.modules.audit.models import AuditLog
from app.modules.audit.repository import AuditLogRepository


class AuditLogService:
    def __init__(self, db: Session) -> None:
        self.repo = AuditLogRepository(db)

    def record(
        self,
        *,
        actor_user_id: Optional[int],
        action: str,
        entity_type: str,
        entity_id: Optional[int],
        summary: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> AuditLog:
        log = AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            summary=summary,
            metadata_json=json.dumps(metadata, default=str) if metadata else None,
        )
        return self.repo.add(log)
