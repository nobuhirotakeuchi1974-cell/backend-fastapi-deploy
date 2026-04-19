from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str


@router.get("/health", response_model=HealthResponse, summary="ヘルスチェック")
async def health_check() -> HealthResponse:
    """サービスの死活確認エンドポイント。常に {"status": "ok"} を返す。"""
    return HealthResponse(status="ok")
