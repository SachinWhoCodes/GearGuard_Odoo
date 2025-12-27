from pydantic import Field

from app.schemas.common import APIModel


class TeamOut(APIModel):
    id: str
    name: str
    member_ids: list[str] = []


class TeamCreate(APIModel):
    name: str = Field(min_length=1, max_length=120)
    member_ids: list[str] = []


class TeamUpdate(APIModel):
    name: str | None = None
    member_ids: list[str] | None = None
