from pydantic import EmailStr, Field

from app.schemas.common import APIModel


class UserOut(APIModel):
    id: str
    name: str
    email: EmailStr
    role: str
    created_at: str | None = None
    updated_at: str | None = None


class UserCreate(APIModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    role: str = "requester"
    password: str = Field(min_length=6, max_length=128)


class UserUpdate(APIModel):
    name: str | None = None
    role: str | None = None
    password: str | None = None
