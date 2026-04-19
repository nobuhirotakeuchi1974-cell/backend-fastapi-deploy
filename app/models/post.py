import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

# 有効なカテゴリ値（DBに保存される英語キー）
VALID_CATEGORIES = ("challenge", "helping", "productivity", "learning")


class Post(Base, TimestampMixin):
    __tablename__ = "posts"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    # challenge / helping / productivity / learning
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(String(200), nullable=False)
    is_evaluated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    author: Mapped["User"] = relationship(  # type: ignore[name-defined]
        "User", foreign_keys="[Post.user_id]", back_populates="posts"
    )
    evaluation: Mapped["Evaluation | None"] = relationship(  # type: ignore[name-defined]
        "Evaluation", back_populates="post", uselist=False
    )
