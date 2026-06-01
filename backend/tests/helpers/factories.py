"""Data factories for tests.

Arrange-time data is created directly through the model + session layer (fast,
deterministic, free of permission noise). Flows that are themselves *under test*
(e.g. budget total calculation) are driven through the HTTP API in the test
itself, not here.
"""
from __future__ import annotations

import itertools
from datetime import date
from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.core.security import hash_password
from app.modules.inventory.models import InventoryCategory, InventoryItem, UnitOfMeasure
from app.modules.patients.models import Patient
from app.modules.procedures.models import Procedure
from app.modules.users.models import User

DEFAULT_PASSWORD = "Senha12345"  # valid per policy: letters + digits, len >= 8

_cpf_counter = itertools.count(1)
_email_counter = itertools.count(1)


def make_cpf(seed: Optional[int] = None) -> str:
    """Generate a structurally valid CPF (matches app.shared.validators)."""
    if seed is None:
        seed = next(_cpf_counter)
    base = f"{seed:09d}"[-9:]
    digits = [int(c) for c in base]

    s1 = sum(d * (10 - i) for i, d in enumerate(digits))
    dv1 = (s1 * 10) % 11
    dv1 = 0 if dv1 == 10 else dv1
    digits.append(dv1)

    s2 = sum(d * (11 - i) for i, d in enumerate(digits))
    dv2 = (s2 * 10) % 11
    dv2 = 0 if dv2 == 10 else dv2
    digits.append(dv2)

    cpf = "".join(str(d) for d in digits)
    if cpf == cpf[0] * 11:  # all-equal is invalid; retry with a different seed
        return make_cpf(seed + 1)
    return cpf


def create_user(
    db: Session,
    *,
    role: Role,
    email: Optional[str] = None,
    name: str = "Test User",
    active: bool = True,
    password: str = DEFAULT_PASSWORD,
) -> User:
    if email is None:
        email = f"user{next(_email_counter)}@clinic-test.com"
    user = User(
        name=name,
        email=email.lower(),
        role=role,
        password_hash=hash_password(password),
        is_active=active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_patient(
    db: Session,
    *,
    name: str = "Paciente",
    active: bool = True,
    cpf: Optional[str] = None,
    email: Optional[str] = None,
) -> Patient:
    patient = Patient(
        name=name,
        cpf=cpf or make_cpf(),
        birth_date=date(1990, 1, 1),
        phone="11999990000",
        email=email,
        street="Rua A",
        number="100",
        neighborhood="Centro",
        city="Goiania",
        state="GO",
        zip_code="74000000",
        is_active=active,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


def create_procedure(
    db: Session,
    *,
    name: str = "Procedimento",
    base_price: str | Decimal = "100.00",
    active: bool = True,
) -> Procedure:
    proc = Procedure(
        name=name,
        base_price=Decimal(str(base_price)),
        is_active=active,
    )
    db.add(proc)
    db.commit()
    db.refresh(proc)
    return proc


def create_inventory_item(
    db: Session,
    *,
    name: str = "Item",
    current: str | Decimal = "10.000",
    minimum: str | Decimal = "0.000",
    active: bool = True,
    category: InventoryCategory = InventoryCategory.DISPOSABLE,
    unit: UnitOfMeasure = UnitOfMeasure.UNIT,
    expiration_date: Optional[date] = None,
) -> InventoryItem:
    item = InventoryItem(
        name=name,
        category=category,
        unit_of_measure=unit,
        current_quantity=Decimal(str(current)),
        minimum_quantity=Decimal(str(minimum)),
        expiration_date=expiration_date,
        is_active=active,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
