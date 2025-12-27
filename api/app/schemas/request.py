from pydantic import Field

from app.schemas.common import APIModel


class RequestOut(APIModel):
    id: str
    type: str
    subject: str
    description: str
    equipment_id: str
    equipment_category: str
    maintenance_team_id: str
    scheduled_date: str | None = None
    duration_hours: float | None = None
    assigned_to_id: str | None = None
    created_by_id: str
    stage: str
    created_at: str | None = None
    updated_at: str | None = None


class RequestCreate(APIModel):
    type: str = Field(pattern="^(corrective|preventive)$")
    subject: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=1200)
    equipment_id: str
    equipment_category: str
    maintenance_team_id: str
    scheduled_date: str | None = None
    assigned_to_id: str | None = None
    created_by_id: str


class RequestUpdate(APIModel):
    type: str | None = None
    subject: str | None = None
    description: str | None = None
    scheduled_date: str | None = None
    duration_hours: float | None = None
    assigned_to_id: str | None = None
    stage: str | None = None
