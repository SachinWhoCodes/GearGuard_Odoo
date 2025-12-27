from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.user import User, UserRole


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get(db: Session, user_id: str) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def list_users(db: Session) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


def create_user(db: Session, name: str, email: str, role: str, password: str) -> User:
    user = User(
        name=name,
        email=email,
        role=UserRole(role),
        password_hash=get_password_hash(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, name: str | None = None, role: str | None = None, password: str | None = None) -> User:
    if name is not None:
        user.name = name
    if role is not None:
        user.role = UserRole(role)
    if password is not None:
        user.password_hash = get_password_hash(password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> User | None:
    user = get_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
