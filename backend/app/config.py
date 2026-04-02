from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./health_logging.db"
    gemini_api_key: str = ""

    google_client_id: str = ""
    google_client_secret: str = ""

    jwt_secret: str = "changeme"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 720  # 30일

    allowed_origins: str = "http://localhost:3000"
    frontend_url: str = "http://localhost:3000"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
