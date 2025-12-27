from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles, get_current_user
from app.crud.user import list_users, create_user, get as get_user, update_user
from app.schemas.user import UserOut, UserCreate, UserUpdate
from app.models.user import User

router = APIRouter()


@router.get("", response_model=list[UserOut])
def users_list(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "manager")),
):
    return [UserOut.model_validate(u) for u in list_users(db)]


@router.post("", response_model=UserOut)
def users_create(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    u = create_user(db, payload.name, payload.email, payload.role, payload.password)
    return UserOut.model_validate(u)


@router.put("/{user_id}", response_model=UserOut)
def users_update(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "manager")),
):
    u = get_user(db, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u = update_user(db, u, name=payload.name, role=payload.role, password=payload.password)
    return UserOut.model_validate(u)


@router.get("/me", response_model=UserOut)
def users_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
