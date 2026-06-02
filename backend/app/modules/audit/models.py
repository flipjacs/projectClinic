from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.modules.users.models import User


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    actor_user_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    entity_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True, index=True)
    summary: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Diff mascarado da operação. Nunca armazena senha/hash; CPF/telefone/e-mail
    # e conteúdo clínico são ofuscados antes de gravar (ver app.shared.masking).
    changed_fields: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    masked_before: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    masked_after: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Origem da requisição (preenchido pelo middleware de contexto).
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(400), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    actor: Mapped[Optional["User"]] = relationship(lazy="selectin")
