from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import auth
from app.api.routers import health
from app.api.routers import evaluations
from app.core.config import settings
from app.db.session import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    """起動時にDBテーブルを自動作成する"""
    await create_tables()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # CORS設定
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ルーター登録
    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(evaluations.router)

    return app


app = create_app()
