# 設定ファイル
# 環境変数を読み込み、アプリ全体で共有する

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List


class Settings(BaseSettings):
    """
    アプリケーション設定

    - 環境変数を型付きで読み込む
    - Azure App Service / GitHub Actions 前提
    - 本番で「未設定でも落ちない」安全設計
    """

    # --------------------------------------------------
    # 実行環境
    # --------------------------------------------------
    ENV: str = Field(default="production")
    DEBUG: bool = Field(default=False)

    # --------------------------------------------------
    # アプリケーション情報
    # --------------------------------------------------
    APP_NAME: str = Field(default="WealthSupporter")
    APP_VERSION: str = Field(default="1.0.0")

    # --------------------------------------------------
    # データベース設定
    # ※ 本番では Azure の環境変数 DATABASE_URL を使用
    # --------------------------------------------------
    DATABASE_URL: str = Field(
        default="mysql+pymysql://root:password@localhost:3306/wealthsupporter"
    )

    # --------------------------------------------------
    # 認証設定
    # --------------------------------------------------
    SECRET_KEY: str = Field(default="dev-secret-key-change-this")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)

    # --------------------------------------------------
    # CORS 設定
    # --------------------------------------------------
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:3001",
        ]
    )

    # --------------------------------------------------
    # Gemini API 設定
    # --------------------------------------------------
    GEMINI_API_KEY: str = Field(default="")

    # --------------------------------------------------
    # pydantic 設定
    # --------------------------------------------------
    class Config:
        env_file = ".env"
        case_sensitive = True


# --------------------------------------------------
# シングルトン設定インスタンス
# --------------------------------------------------
settings = Settings()
