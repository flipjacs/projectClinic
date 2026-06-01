from __future__ import annotations

from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, Boolean, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import expression

from app.database.base import Base, TimestampMixin


class Procedure(Base, TimestampMixin):
    __tablename__ = "procedures"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Preço base sugerido. Pode ser sobrescrito por item de orçamento.
    base_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        server_default="0.00",
    )

    estimated_duration_minutes: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=expression.true(),
        index=True,
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Procedure id={self.id} name={self.name!r} active={self.is_active}>"
