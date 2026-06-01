from typing import Tuple

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.core.permissions import Role
from app.modules.audit.service import AuditLogService
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserUpdate
from app.shared.exceptions import AlreadyExistsError, NotFoundError, ValidationError
from app.shared.pagination import PaginationParams


class UserService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = UserRepository(db)
        self.audit = AuditLogService(db)

    # ----- queries -----
    def get_by_id(self, user_id: int) -> User:
        user = self.repo.get(user_id)
        if not user:
            raise NotFoundError("Usuário não encontrado")
        return user

    def list_paginated(self, params: PaginationParams) -> Tuple[list[User], int]:
        items = list(self.repo.list(offset=params.offset, limit=params.limit))
        total = self.repo.count()
        return items, total

    # ----- mutations -----
    def create(self, payload: UserCreate, current_user: User | None = None) -> User:
        email = payload.email.lower()
        if self.repo.get_by_email(email):
            raise AlreadyExistsError("Já existe um usuário com este email")

        user = User(
            name=payload.name.strip(),
            email=email,
            role=payload.role,
            password_hash=hash_password(payload.password),
            is_active=True,
        )
        self.repo.add(user)
        self.audit.record(
            actor_user_id=current_user.id if current_user else None,
            action="user.create",
            entity_type="user",
            entity_id=user.id,
            summary=f"Usuário criado com role {user.role.value}",
        )
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user_id: int, payload: UserUpdate, current_user: User) -> User:
        user = self.get_by_id(user_id)
        data = payload.model_dump(exclude_unset=True)

        if "email" in data and data["email"]:
            new_email = data["email"].lower()
            if new_email != user.email:
                existing = self.repo.get_by_email(new_email)
                if existing and existing.id != user.id:
                    raise AlreadyExistsError("Já existe um usuário com este email")
                user.email = new_email

        if "name" in data and data["name"]:
            user.name = data["name"].strip()

        if "role" in data and data["role"] is not None:
            if user.id == current_user.id and data["role"] != user.role:
                raise ValidationError("Você não pode alterar o próprio role")
            if (
                user.role == Role.ADMIN
                and data["role"] != Role.ADMIN
                and user.is_active
                and self.repo.count_active_admins() <= 1
            ):
                raise ValidationError("Não é possível remover o último ADMIN ativo")
            user.role = data["role"]

        if "password" in data and data["password"]:
            user.password_hash = hash_password(data["password"])

        self.repo.save(user)
        self.audit.record(
            actor_user_id=current_user.id,
            action="user.update",
            entity_type="user",
            entity_id=user.id,
            summary="Usuário atualizado",
            metadata={"fields": sorted(data.keys())},
        )
        self.db.commit()
        self.db.refresh(user)
        return user

    def set_active(self, user_id: int, active: bool, current_user_id: int) -> User:
        if user_id == current_user_id and not active:
            raise ValidationError("Você não pode inativar seu próprio usuário")
        user = self.get_by_id(user_id)
        if user.is_active == active:
            return user
        if (
            not active
            and user.role == Role.ADMIN
            and self.repo.count_active_admins() <= 1
        ):
            raise ValidationError("Não é possível inativar o último ADMIN ativo")
        user.is_active = active
        self.repo.save(user)
        self.audit.record(
            actor_user_id=current_user_id,
            action="user.activate" if active else "user.deactivate",
            entity_type="user",
            entity_id=user.id,
            summary="Usuário ativado" if active else "Usuário inativado",
        )
        self.db.commit()
        self.db.refresh(user)
        return user
