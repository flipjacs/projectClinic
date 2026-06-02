"""audit log masked diff and request context columns

Revision ID: 0011_audit_log_masked_diff
Revises: 0010_audit_logs_security_indexes
Create Date: 2026-06-01 00:00:02

Adiciona ao audit log o diff mascarado (changed_fields/masked_before/
masked_after) e a origem da requisição (ip_address/user_agent). Nenhum dado
sensível em texto puro é armazenado nessas colunas — ver app.shared.masking.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0011_audit_log_masked_diff"
down_revision: Union[str, None] = "0010_audit_logs_security_indexes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("audit_logs", sa.Column("changed_fields", sa.Text(), nullable=True))
    op.add_column("audit_logs", sa.Column("masked_before", sa.Text(), nullable=True))
    op.add_column("audit_logs", sa.Column("masked_after", sa.Text(), nullable=True))
    op.add_column("audit_logs", sa.Column("ip_address", sa.String(length=45), nullable=True))
    op.add_column("audit_logs", sa.Column("user_agent", sa.String(length=400), nullable=True))


def downgrade() -> None:
    op.drop_column("audit_logs", "user_agent")
    op.drop_column("audit_logs", "ip_address")
    op.drop_column("audit_logs", "masked_after")
    op.drop_column("audit_logs", "masked_before")
    op.drop_column("audit_logs", "changed_fields")
