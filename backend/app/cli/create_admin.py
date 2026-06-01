"""Cria (uma única vez) o primeiro usuário ADMIN do sistema.

Uso:

    # Lendo de variáveis de ambiente (INITIAL_ADMIN_NAME/EMAIL/PASSWORD):
    python -m app.cli.create_admin

    # Passando argumentos:
    python -m app.cli.create_admin \\
        --name "Dra. Fulana" \\
        --email "dra@clinic.com" \\
        --password "senha-forte-123"

    # Modo interativo: se faltar algum dado, será pedido no terminal.

Idempotente: se já existir qualquer usuário com role ADMIN, sai sem alterar
nada. Para forçar a criação de um novo admin mesmo com outros existentes,
passe ``--force``.
"""
from __future__ import annotations

import argparse
import getpass
import sys
from typing import Optional

from sqlalchemy import select

from app.core.config import settings
from app.core.permissions import Role
from app.database.connection import SessionLocal
from app.modules.users.models import User
from app.modules.users.schemas import UserCreate
from app.modules.users.service import UserService
from app.shared.exceptions import AlreadyExistsError


def _resolve(value: Optional[str], env_value: Optional[str], prompt: str, secret: bool = False) -> str:
    if value:
        return value
    if env_value:
        return env_value
    if secret:
        return getpass.getpass(prompt)
    return input(prompt).strip()


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Cria o primeiro usuário ADMIN.")
    parser.add_argument("--name")
    parser.add_argument("--email")
    parser.add_argument("--password")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Cria novo admin mesmo que já exista um.",
    )
    args = parser.parse_args(argv)

    with SessionLocal() as db:
        existing_admin = db.execute(
            select(User).where(User.role == Role.ADMIN)
        ).scalars().first()

        if existing_admin and not args.force:
            print(
                f"Já existe um usuário ADMIN ({existing_admin.email}). "
                "Use --force para criar outro.",
                file=sys.stderr,
            )
            return 0

        name = _resolve(args.name, settings.initial_admin_name, "Nome do admin: ")
        email = _resolve(args.email, settings.initial_admin_email, "Email do admin: ")
        password = _resolve(
            args.password,
            settings.initial_admin_password,
            "Senha do admin: ",
            secret=True,
        )

        try:
            payload = UserCreate(name=name, email=email, password=password, role=Role.ADMIN)
        except Exception as exc:  # pydantic ValidationError
            print(f"Dados inválidos: {exc}", file=sys.stderr)
            return 2

        service = UserService(db)
        try:
            user = service.create(payload)
        except AlreadyExistsError as exc:
            print(f"Erro: {exc.message}", file=sys.stderr)
            return 1

        print(f"Admin criado com sucesso: id={user.id} email={user.email}")
        return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
