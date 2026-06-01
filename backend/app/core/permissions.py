from enum import Enum
from typing import Iterable


class Role(str, Enum):
    """Papéis suportados pelo sistema."""

    ADMIN = "admin"
    DENTIST = "dentist"
    RECEPTIONIST = "receptionist"


# Hierarquia simples: admin > dentist > receptionist.
_ROLE_RANK: dict[Role, int] = {
    Role.ADMIN: 100,
    Role.DENTIST: 50,
    Role.RECEPTIONIST: 10,
}


def has_role(user_role: Role | str, allowed: Iterable[Role | str]) -> bool:
    allowed_set = {Role(r) if not isinstance(r, Role) else r for r in allowed}
    current = Role(user_role) if not isinstance(user_role, Role) else user_role
    return current in allowed_set


def role_at_least(user_role: Role | str, minimum: Role | str) -> bool:
    current = Role(user_role) if not isinstance(user_role, Role) else user_role
    floor = Role(minimum) if not isinstance(minimum, Role) else minimum
    return _ROLE_RANK[current] >= _ROLE_RANK[floor]
