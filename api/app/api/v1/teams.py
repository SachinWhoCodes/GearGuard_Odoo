from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles, get_current_user
from app.crud import team as crud_team
from app.schemas.team import TeamOut, TeamCreate, TeamUpdate
from app.models.user import User

router = APIRouter()


@router.get("", response_model=list[TeamOut])
def list_teams(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return [TeamOut.model_validate(t) for t in crud_team.list_teams(db)]


@router.post("", response_model=TeamOut)
def create_team(
    payload: TeamCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "manager")),
):
    t = crud_team.create(db, payload.name, payload.member_ids)
    return TeamOut.model_validate(t)


@router.get("/{team_id}", response_model=TeamOut)
def get_team(team_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    t = crud_team.get(db, team_id)
    if not t:
        raise HTTPException(status_code=404, detail="Team not found")
    return TeamOut.model_validate(t)


@router.put("/{team_id}", response_model=TeamOut)
def update_team(
    team_id: str,
    payload: TeamUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "manager")),
):
    t = crud_team.get(db, team_id)
    if not t:
        raise HTTPException(status_code=404, detail="Team not found")
    t = crud_team.update(db, t, name=payload.name, member_ids=payload.member_ids)
    return TeamOut.model_validate(t)


@router.delete("/{team_id}")
def delete_team(
    team_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    t = crud_team.get(db, team_id)
    if not t:
        raise HTTPException(status_code=404, detail="Team not found")
    crud_team.delete(db, t)
    return {"ok": True}
