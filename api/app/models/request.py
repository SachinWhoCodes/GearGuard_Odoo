import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime, Enum, Float
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RequestType(str, enum.Enum):
    corrective = "corrective"
    preventive = "preventive"


class RequestStage(str, enum.Enum):
    new = "new"
    in_progress = "in_progress"
    repaired = "repaired"
    scrap = "scrap"


class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    type: Mapped[RequestType] = mapped_column(Enum(RequestType, name="request_type"), nullable=False)
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(String(1200), nullable=False)

    equipment_id: Mapped[str] = mapped_column(String(36), nullable=False)
    equipment_category: Mapped[str] = mapped_column(String(80), nullable=False)

    maintenance_team_id: Mapped[str] = mapped_column(String(36), nullable=False)

    scheduled_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # ISO date string
    duration_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    assigned_to_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    created_by_id: Mapped[str] = mapped_column(String(36), nullable=False)

    stage: Mapped[RequestStage] = mapped_column(Enum(RequestStage, name="request_stage"), nullable=False, default=RequestStage.new)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
