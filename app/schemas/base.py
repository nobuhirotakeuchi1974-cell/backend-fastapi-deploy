from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """全スキーマの基底クラス"""

    model_config = ConfigDict(from_attributes=True)


class TimestampSchema(BaseSchema):
    """created_at / updated_at を持つスキーマの基底クラス"""

    created_at: datetime
    updated_at: datetime
