from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "OpsDesk - TBO Operations Platform"
    API_V1_PREFIX: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./opsdesk.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
