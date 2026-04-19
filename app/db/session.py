from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# 非同期エンジンの作成
engine = create_async_engine(
    settings.DATABASE_URL,
    # SQLiteの場合は接続ごとにcheck_same_threadを無効化
    connect_args={"check_same_thread": False}
    if settings.DATABASE_URL.startswith("sqlite")
    else {},
    echo=settings.DEBUG,
)

# セッションファクトリ
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


# FastAPIの依存性注入用DB セッション
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# テーブル作成用（起動時に呼ぶ）
async def create_tables() -> None:
    import app.models  # noqa: F401 全モデルを Base.metadata に登録するために必要
    from app.models.base import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
