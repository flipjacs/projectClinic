from __future__ import annotations

import json
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.modules.audit.models import AuditLog
from app.modules.audit.repository import AuditLogRepository
from app.shared.masking import mask_mapping
from app.shared.request_context import get_request_info


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
        before: Optional[dict[str, Any]] = None,
        after: Optional[dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Registra uma ação sensível.

        ``before``/``after`` são dicionários crus que serão **mascarados** antes
        de gravar (CPF, telefone, e-mail e conteúdo clínico são ofuscados; senha
        e hash são removidos por completo). ``changed_fields`` é derivado da
        diferença entre eles. IP/User-Agent vêm do contexto da request quando
        não informados explicitamente.
        """
        masked_before = mask_mapping(before) if before else None
        masked_after = mask_mapping(after) if after else None
        changed_fields = self._changed_fields(before, after)

        # Enriquecimento automático a partir do contexto da request.
        if ip_address is None or user_agent is None:
            info = get_request_info()
            ip_address = ip_address or info.ip_address
            user_agent = user_agent or info.user_agent

        log = AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            summary=summary,
            metadata_json=json.dumps(metadata, default=str) if metadata else None,
            changed_fields=json.dumps(changed_fields) if changed_fields else None,
            masked_before=json.dumps(masked_before, default=str) if masked_before else None,
            masked_after=json.dumps(masked_after, default=str) if masked_after else None,
            ip_address=ip_address,
            user_agent=(user_agent[:400] if user_agent else None),
        )
        return self.repo.add(log)

    @staticmethod
    def _changed_fields(
        before: Optional[dict[str, Any]],
        after: Optional[dict[str, Any]],
    ) -> Optional[list[str]]:
        if before is None and after is None:
            return None
        before = before or {}
        after = after or {}
        keys = set(before) | set(after)
        changed = [k for k in keys if before.get(k) != after.get(k)]
        return sorted(changed) if changed else None
