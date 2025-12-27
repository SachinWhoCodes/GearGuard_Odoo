from pydantic import BaseModel, EmailStr

from app.schemas.common import APIModel
from app.schemas.user import UserOut


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(APIModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
