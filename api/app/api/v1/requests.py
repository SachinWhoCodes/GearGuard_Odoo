from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_roles
from app.crud import request as crud_request
from app.crud import equipment as crud_equipment
from app.schemas.request import RequestOut, RequestCreate, RequestUpdate
from app.models.user import User

router = APIRouter()


@router.get("", response_model=list[RequestOut])
def requests_list(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    equipment_id: str | None = Query(default=None),
    type: str | None = Query(default=None),
    team_id: str | None = Query(default=None),
    stage: str | None = Query(default=None),
    search: str | None = Query(default=None),
):
    items = crud_request.list_requests(
        db,
        equipment_id=equipment_id,
        type_=type,
        team_id=team_id,
        stage=stage,
        search=search,
    )
    return [RequestOut.model_validate(r) for r in items]


@router.post("", response_model=RequestOut)
def requests_create(
    payload: RequestCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    # Basic validation: preventive requires scheduled_date
    if payload.type == "preventive" and not payload.scheduled_date:
        raise HTTPException(status_code=400, detail="scheduledDate is required for preventive requests")

    req = crud_request.create(db, payload.model_dump(by_alias=False))
    return RequestOut.model_validate(req)


@router.get("/{request_id}", response_model=RequestOut)
def requests_get(
    request_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    req = crud_request.get(db, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return RequestOut.model_validate(req)


@router.put("/{request_id}", response_model=RequestOut)
def requests_update(
    request_id: str,
    payload: RequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = crud_request.get(db, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    data = payload.model_dump(exclude_unset=True, by_alias=False)

    # Business rule: duration required if marking repaired
    if data.get("stage") == "repaired" and not (data.get("duration_hours") or req.duration_hours):
        raise HTTPException(status_code=400, detail="durationHours is required to mark as repaired")

    # If stage becomes scrap, also scrap equipment (manager/admin only)
    if data.get("stage") == "scrap":
        if current_user.role.value not in ("admin", "manager"):
            raise HTTPException(status_code=403, detail="Only admin/manager can scrap equipment via request")
        eq = crud_equipment.get(db, req.equipment_id)
        if eq and not eq.is_scrapped:
            crud_equipment.scrap(db, eq, reason=f"Scrap request: {req.subject}")

    req = crud_request.update(db, req, data)
    return RequestOut.model_validate(req)


@router.delete("/{request_id}")
def requests_delete(
    request_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "manager")),
):
    req = crud_request.get(db, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    crud_request.delete(db, req)
    return {"ok": True}
