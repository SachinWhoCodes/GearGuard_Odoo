from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.request import MaintenanceRequest, RequestStage


def list_requests(
    db: Session,
    equipment_id: str | None = None,
    type_: str | None = None,
    team_id: str | None = None,
    stage: str | None = None,
    search: str | None = None,
) -> list[MaintenanceRequest]:
    q = db.query(MaintenanceRequest)

    if equipment_id:
        q = q.filter(MaintenanceRequest.equipment_id == equipment_id)
    if type_ and type_ != "all":
        q = q.filter(MaintenanceRequest.type == type_)
    if team_id and team_id != "all":
        q = q.filter(MaintenanceRequest.maintenance_team_id == team_id)
    if stage:
        q = q.filter(MaintenanceRequest.stage == stage)
    if search:
        s = f"%{search.lower()}%"
        q = q.filter(or_(MaintenanceRequest.subject.ilike(s), MaintenanceRequest.description.ilike(s)))

    return q.order_by(MaintenanceRequest.updated_at.desc()).all()


def get(db: Session, request_id: str) -> MaintenanceRequest | None:
    return db.query(MaintenanceRequest).filter(MaintenanceRequest.id == request_id).first()


def create(db: Session, payload: dict) -> MaintenanceRequest:
    req = MaintenanceRequest(**payload)
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


def update(db: Session, req: MaintenanceRequest, payload: dict) -> MaintenanceRequest:
    for k, v in payload.items():
        setattr(req, k, v)
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


def delete(db: Session, req: MaintenanceRequest) -> None:
    db.delete(req)
    db.commit()
