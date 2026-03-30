from functools import lru_cache
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True)

    ENVIRONMENT: str = "development"
    MONGO_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "taskflow"
    JWT_SECRET: str = "dev-only-change-this-secret"

    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: str = "http://localhost:3000"

    SENDGRID_API_KEY: str = ""
    SENDER_EMAIL: str = "noreply@taskflow.app"

    COOKIE_SECURE: Optional[bool] = None
    COOKIE_SAMESITE: Optional[str] = None

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def cors_origins(self) -> List[str]:
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        return origins or [self.FRONTEND_URL]

    @property
    def cookie_secure(self) -> bool:
        if self.COOKIE_SECURE is not None:
            return self.COOKIE_SECURE
        return self.is_production

    @property
    def cookie_samesite(self) -> str:
        if self.COOKIE_SAMESITE:
            return self.COOKIE_SAMESITE
        return "none" if self.is_production else "lax"

    @field_validator("ENVIRONMENT")
    @classmethod
    def validate_environment(cls, value: str) -> str:
        valid = {"development", "production", "staging"}
        lowered = value.lower()
        if lowered not in valid:
            raise ValueError(f"ENVIRONMENT must be one of: {', '.join(sorted(valid))}")
        return lowered

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, value: str, info) -> str:
        environment = (info.data.get("ENVIRONMENT") or "development").lower()
        if environment == "production" and len(value) < 32:
            raise ValueError("JWT_SECRET must be set and at least 32 characters in production")
        return value

    @field_validator("COOKIE_SAMESITE")
    @classmethod
    def validate_cookie_samesite(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        lowered = value.lower()
        if lowered not in {"lax", "strict", "none"}:
            raise ValueError("COOKIE_SAMESITE must be one of: lax, strict, none")
        return lowered


@lru_cache
def get_settings() -> Settings:
    return Settings()
