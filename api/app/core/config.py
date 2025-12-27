from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "GearGuard API"
    ENV: str = "dev"

    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    FRONTEND_BASE_URL: str = "http://localhost:5173"
    CORS_ORIGINS: str = "http://localhost:5173"

    INIT_DEMO_DATA: bool = True
    DEMO_ADMIN_EMAIL: str = "admin@gearguard.dev"
    DEMO_ADMIN_PASSWORD: str = "Admin@12345"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in (self.CORS_ORIGINS or "").split(",") if o.strip()]


settings = Settings()
