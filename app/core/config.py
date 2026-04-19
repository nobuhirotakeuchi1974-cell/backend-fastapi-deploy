from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # アプリ設定
    APP_NAME: str = "Human Capital OS"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # データベース
    DATABASE_URL: str = "sqlite+aiosqlite:///./human_capital.db"

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8時間

    # CORS（カンマ区切りで複数指定可）
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()
