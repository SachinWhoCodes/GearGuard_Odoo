import io
from fastapi import APIRouter, HTTPException, Response, Query
from sqlalchemy.orm import Session
from fastapi import Depends

from app.api.deps import get_db
from app.core.config import settings
from app.crud import equipment as crud_equipment
from app.schemas.equipment import EquipmentOut
from app.utils.qr import make_qr_png

router = APIRouter()


@router.get("/equipment/{equipment_id}", response_model=EquipmentOut)
def public_equipment_get(equipment_id: str, db: Session = Depends(get_db)):
    eq = crud_equipment.get(db, equipment_id)
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return EquipmentOut.model_validate(eq)


@router.get("/equipment/{equipment_id}/qr")
def public_equipment_qr(
    equipment_id: str,
    mode: str = Query(default="link", pattern="^(link|json)$"),
    db: Session = Depends(get_db),
):
    eq = crud_equipment.get(db, equipment_id)
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")

    if mode == "link":
        payload = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/scan/{equipment_id}"
    else:
        payload = {"equipmentId": equipment_id}

    png_bytes = make_qr_png(payload)
    return Response(content=png_bytes, media_type="image/png")
