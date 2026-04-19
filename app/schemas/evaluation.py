from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.base import BaseSchema, TimestampSchema


class EvaluationCreate(BaseSchema):
    post_id: str = Field(..., description="評価対象の投稿ID（UUID文字列）")
    points: Literal[1, 5, 10] = Field(
        ..., description="配点。1=小改善, 5=仕組み化, 10=定量成果"
    )
    comment: str | None = Field(None, max_length=500, description="評価コメント（任意）")


class EvaluationResponse(TimestampSchema):
    id: str
    post_id: str
    evaluator_id: str
    points: int
    comment: str | None


class WeeklyCapStatus(BaseSchema):
    """週間ポイント上限の使用状況"""

    used_points: int = Field(..., description="今週すでに付与したポイント合計")
    cap_points: int = Field(..., description="今週の上限ポイント（部門人数×5）")
    remaining_points: int = Field(..., description="今週の残りポイント")
