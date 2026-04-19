import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class PointsLedger(Base):
    __tablename__ = "points_ledger"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    # 1評価 → 1台帳レコード: UNIQUE制約
    evaluation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("evaluations.id"), unique=True, nullable=False
    )
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    # postsのcategoryを引き継いで集計に使う
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    department_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("departments.id"), nullable=False, index=True
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    evaluation: Mapped["Evaluation"] = relationship(  # type: ignore[name-defined]
        "Evaluation", back_populates="points_ledger"
    )
