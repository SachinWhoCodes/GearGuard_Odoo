from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.equipment import Equipment


def list_equipment(
    db: Session,
    search: str | None = None,
    category: str | None = None,
    department: str | None = None,
    status: str | None = None,  # active|scrapped|all
) -> list[Equipment]:
    q = db.query(Equipment)

    if search:
        s = f"%{search.lower()}%"
        q = q.filter(
            (Equipment.name.ilike(s))
            | (Equipment.serial_number.ilike(s))
            | (Equipment.owner_employee_name.ilike(s))
        )
    if category:
        q = q.filter(Equipment.category == category)
    if department:
        q = q.filter(Equipment.department == department)
    if status and status != "all":
        if status == "active":
            q = q.filter(Equipment.is_scrapped.is_(False))
        elif status == "scrapped":
            q = q.filter(Equipment.is_scrapped.is_(True))

    return q.order_by(Equipment.created_at.desc()).all()


def get(db: Session, equipment_id: str) -> Equipment | None:
    return db.query(Equipment).filter(Equipment.id == equipment_id).first()


def create(db: Session, payload: dict) -> Equipment:
    eq = Equipment(**payload)
    db.add(eq)
    db.commit()
    db.refresh(eq)
    return eq


def update(db: Session, eq: Equipment, payload: dict) -> Equipment:
    for k, v in payload.items():
        setattr(eq, k, v)
    db.add(eq)
    db.commit()
    db.refresh(eq)
    return eq


def scrap(db: Session, eq: Equipment, reason: str | None = None) -> Equipment:
    eq.is_scrapped = True
    eq.scrapped_at = datetime.now(timezone.utc).isoformat()
    if reason:
        eq.scrapped_reason = reason
    db.add(eq)
    db.commit()
    db.refresh(eq)
    return eq


def delete(db: Session, eq: Equipment) -> None:
    db.delete(eq)
    db.commit()
