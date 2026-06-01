from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.modules.users.models import User


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, user_id: int) -> Optional[User]:
        return self.db.get(User, user_id)

    def get_for_update(self, user_id: int) -> Optional[User]:
        """`SELECT ... FOR UPDATE` — serializa operações concorrentes que
        dependem do estado do usuário (ex.: agendamento de consultas
        evitando conflito de horário para o mesmo dentista).
        """
        stmt = select(User).where(User.id == user_id).with_for_update()
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email.lower())
        return self.db.execute(stmt).scalar_one_or_none()

    def list(self, offset: int, limit: int) -> Sequence[User]:
        stmt = select(User).order_by(User.id.asc()).offset(offset).limit(limit)
        return self.db.execute(stmt).scalars().all()

    def count(self) -> int:
        return self.db.execute(select(func.count(User.id))).scalar_one()

    def count_active_admins(self) -> int:
        stmt = select(func.count(User.id)).where(
            User.role == Role.ADMIN,
            User.is_active.is_(True),
        )
        return int(self.db.execute(stmt).scalar_one())

    def add(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        self.db.refresh(user)
        return user

    def save(self, user: User) -> User:
        self.db.flush()
        self.db.refresh(user)
        return user
