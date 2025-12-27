import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Equipment(Base):
    __tablename__ = "equipment"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    serial_number: Mapped[str] = mapped_column(String(80), index=True, nullable=False)

    category: Mapped[str] = mapped_column(String(80), nullable=False)
    department: Mapped[str] = mapped_column(String(80), nullable=False)

    owner_employee_name: Mapped[str] = mapped_column(String(120), nullable=False)
    purchase_date: Mapped[str] = mapped_column(String(20), nullable=False)  # ISO date string
    warranty_expiry: Mapped[str] = mapped_column(String(20), nullable=False)  # ISO date string
    location: Mapped[str] = mapped_column(String(200), nullable=False)

    maintenance_team_id: Mapped[str] = mapped_column(String(36), nullable=False)
    default_technician_id: Mapped[str] = mapped_column(String(36), nullable=False)

    is_scrapped: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    scrapped_at: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # ISO datetime string
    scrapped_reason: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
