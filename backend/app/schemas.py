from typing import Literal, Optional
from pydantic import BaseModel, Field


Category = Literal["challenge", "improvement", "support", "learning"]
ReviewStatus = Literal["approved", "rejected"]


class PostCreate(BaseModel):
    employee_name: str = Field(
        default="テスト社員",
        min_length=1,
        max_length=50,
        description="社員名",
    )
    department: str = Field(
        default="営業",
        min_length=1,
        max_length=50,
        description="部門名",
    )
    behavior: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="人的資本行動の内容",
    )
    category: Category = Field(
        ...,
        description="challenge / improvement / support / learning のいずれか",
    )
    self_points: int = Field(
        default=0,
        ge=0,
        le=100,
        description="自己評価ポイント 0〜100",
    )


class ReviewRequest(BaseModel):
    status: ReviewStatus = Field(
        ...,
        description="approved または rejected",
    )
    manager_points: Optional[int] = Field(
        default=0,
        ge=0,
        le=100,
        description="上司評価ポイント 0〜100",
    )
    manager_comment: Optional[str] = Field(
        default=None,
        max_length=500,
        description="上司コメント 最大500文字",
    )
    
class LoginRequest(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="ログインID",
    )

    password: str = Field(
        ...,
        min_length=4,
        max_length=100,
        description="パスワード",
    )