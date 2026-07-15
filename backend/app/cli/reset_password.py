"""Redefine a senha de um usuário existente (recuperação de acesso).

Uso:

    # Reseta a senha do admin definido em INITIAL_ADMIN_EMAIL, pedindo a nova
    # senha de forma interativa (não ecoa no terminal):
    python -m app.cli.reset_password

    # Informando email e/ou senha por argumento:
    python -m app.cli.reset_password \\
        --email "admin@clinic.com.br" \\
        --password "nova-senha-forte-123"

A nova senha passa pela MESMA validação de força usada na API
(mínimo 8 caracteres, com letras e números, sem espaços nas pontas) e é
gravada com o mesmo esquema de hash configurado no sistema.

Segurança: não imprime a senha e nunca a registra em log.
"""
from __future__ import annotations

import argparse
import getpass
import sys
from typing import Optional

from app.core.config import settings
from app.core.security import hash_password
from app.database.connection import SessionLocal
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserUpdate


def _resolve(value: Optional[str], env_value: Optional[str], prompt: str, secret: bool = False) -> str:
    if value:
        return value
    if env_value:
        return env_value
    if secret:
        return getpass.getpass(prompt)
    return input(prompt).strip()


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Redefine a senha de um usuário existente."
    )
    parser.add_argument("--email", help="Email do usuário (padrão: INITIAL_ADMIN_EMAIL).")
    parser.add_argument("--password", help="Nova senha (se omitida, é pedida no terminal).")
    args = parser.parse_args(argv)

    email = _resolve(args.email, settings.initial_admin_email, "Email do usuário: ").lower()
    # Senha nunca vem de env: sempre argumento explícito ou prompt secreto.
    password = _resolve(args.password, None, "Nova senha: ", secret=True)

    # Reaproveita a validação de força de senha da API.
    try:
        UserUpdate(password=password)
    except Exception as exc:  # pydantic ValidationError
        print(f"Senha inválida: {exc}", file=sys.stderr)
        return 2

    with SessionLocal() as db:
        repo = UserRepository(db)
        user = repo.get_by_email(email)
        if user is None:
            print(f"Nenhum usuário encontrado com o email {email!r}.", file=sys.stderr)
            return 1

        user.password_hash = hash_password(password)
        repo.save(user)
        db.commit()

        print(f"Senha redefinida com sucesso para {user.email} (id={user.id}).")
        return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
