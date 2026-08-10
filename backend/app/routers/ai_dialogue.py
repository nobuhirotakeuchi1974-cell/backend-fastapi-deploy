"""
HCOS AI Dialogue Router

POST /api/ai/dialogue — 仕様書 §23
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from openai import APIError, APITimeoutError

from app.schemas.ai_dialogue import HcosAiRequest, HcosAiResponse
from app.services.hcos_ai_service import call_hcos_ai

logger = logging.getLogger("human-capital-os")

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/dialogue", response_model=HcosAiResponse)
async def ai_dialogue(payload: HcosAiRequest, request: Request):
    """
    HCOS 自己決定支援 AI 対話エンドポイント。

    エラー時は内部詳細をフロントへ返さない — 仕様書 §37。
    """
    request_id = getattr(request.state, "request_id", "-")

    try:
        response = await call_hcos_ai(payload)
        return response

    except ValueError as e:
        # OPENAI_API_KEY 未設定など設定エラー
        logger.error(
            "ai_dialogue_config_error session_id=%s error=%s",
            payload.sessionId,
            str(e),
            extra={"request_id": request_id},
        )
        return JSONResponse(
            status_code=503,
            content={"message": "うまく接続できませんでした。もう一度試してください。"},
        )

    except APITimeoutError:
        logger.warning(
            "ai_dialogue_timeout session_id=%s",
            payload.sessionId,
            extra={"request_id": request_id},
        )
        return JSONResponse(
            status_code=504,
            content={"message": "うまく接続できませんでした。もう一度試してください。"},
        )

    except APIError as e:
        logger.error(
            "ai_dialogue_openai_error session_id=%s status=%s",
            payload.sessionId,
            getattr(e, "status_code", "unknown"),
            extra={"request_id": request_id},
        )
        return JSONResponse(
            status_code=502,
            content={"message": "うまく接続できませんでした。もう一度試してください。"},
        )

    except Exception:
        logger.exception(
            "ai_dialogue_unexpected_error session_id=%s",
            payload.sessionId,
            extra={"request_id": request_id},
        )
        return JSONResponse(
            status_code=500,
            content={"message": "うまく接続できませんでした。もう一度試してください。"},
        )
