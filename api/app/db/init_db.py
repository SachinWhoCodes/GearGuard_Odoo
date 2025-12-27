from sqlalchemy.exc import OperationalError, ProgrammingError

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.user import User, UserRole


def init_demo_data() -> None:
    if not settings.INIT_DEMO_DATA:
        return

    db = SessionLocal()
    try:
        # If migrations haven't been applied yet, this will fail; ignore safely.
        existing = db.query(User).filter(User.email == settings.DEMO_ADMIN_EMAIL).first()
        if existing:
            return

        admin = User(
            name="Admin",
            email=settings.DEMO_ADMIN_EMAIL,
            role=UserRole.admin,
            password_hash=get_password_hash(settings.DEMO_ADMIN_PASSWORD),
        )
        db.add(admin)
        db.commit()
    except (OperationalError, ProgrammingError):
        # DB not ready / tables not created
        db.rollback()
    finally:
        db.close()
