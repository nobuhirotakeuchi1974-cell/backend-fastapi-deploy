import uuid

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Evaluation(Base, TimestampMixin):
    __tablename__ = "evaluations"
    __table_args__ = (
        CheckConstraint("points IN (1, 5, 10)", name="ck_evaluations_points"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # 1投稿1評価: UNIQUE制約
    post_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("posts.id"), unique=True, nullable=False, index=True
    )
    evaluator_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    # 1 / 5 / 10 のみ許可（CheckConstraintでも担保）
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    post: Mapped["Post"] = relationship(  # type: ignore[name-defined]
        "Post", back_populates="evaluation"
    )
    evaluator: Mapped["User"] = relationship(  # type: ignore[name-defined]
        "User", foreign_keys="[Evaluation.evaluator_id]"
    )
    points_ledger: Mapped["PointsLedger | None"] = relationship(  # type: ignore[name-defined]
        "PointsLedger", back_populates="evaluation", uselist=False
    )
