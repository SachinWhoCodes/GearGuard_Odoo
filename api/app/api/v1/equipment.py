from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_roles
from app.crud import equipment as crud_equipment
from app.schemas.equipment import EquipmentOut, EquipmentCreate, EquipmentUpdate
from app.models.user import User

router = APIRouter()


@router.get("", response_model=list[EquipmentOut])
def equipment_list(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    department: str | None = Query(default=None),
    status: str | None = Query(default="all"),  # active|scrapped|all
):
    eqs = crud_equipment.list_equipment(db, search=search, category=category, department=department, status=status)
    return [EquipmentOut.model_validate(e) for e in eqs]


@router.post("", response_model=EquipmentOut)
def equipment_create(
    payload: EquipmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "manager")),
):
    eq = crud_equipment.create(db, payload.model_dump(by_alias=False))
    return EquipmentOut.model_validate(eq)


@router.get("/{equipment_id}", response_model=EquipmentOut)
def equipment_get(
    equipment_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    eq = crud_equipment.get(db, equipment_id)
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return EquipmentOut.model_validate(eq)


@router.put("/{equipment_id}", response_model=EquipmentOut)
def equipment_update(
    equipment_id: str,
    payload: EquipmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "manager")),
):
    eq = crud_equipment.get(db, equipment_id)
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")

    data = payload.model_dump(exclude_unset=True, by_alias=False)
    # If scrapped and reason provided
    if data.get("is_scrapped") is True:
        eq = crud_equipment.scrap(db, eq, reason=data.get("scrapped_reason"))
        return EquipmentOut.model_validate(eq)

    eq = crud_equipment.update(db, eq, data)
    return EquipmentOut.model_validate(eq)


@router.post("/{equipment_id}/scrap", response_model=EquipmentOut)
def equipment_scrap(
    equipment_id: str,
    reason: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "manager")),
):
    eq = crud_equipment.get(db, equipment_id)
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    eq = crud_equipment.scrap(db, eq, reason=reason)
    return EquipmentOut.model_validate(eq)


@router.delete("/{equipment_id}")
def equipment_delete(
    equipment_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    eq = crud_equipment.get(db, equipment_id)
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    crud_equipment.delete(db, eq)
    return {"ok": True}
