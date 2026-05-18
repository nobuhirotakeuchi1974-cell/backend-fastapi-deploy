from sqlalchemy import Column, Integer, String, DateTime, Float
from datetime import datetime

from app.database import Base


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)

    # 社員入力
    employee_name = Column(String, nullable=False)
    department = Column(String, nullable=False)
    behavior = Column(String, nullable=False)
    category = Column(String, nullable=False)
    self_points = Column(Integer, nullable=False)

    # 上司評価
    manager_points = Column(Integer, nullable=True)
    status = Column(String, default="pending")
    manager_comment = Column(String, nullable=True)

    # Human Capital OS ロジック
    human_action = Column(String, nullable=True)
    organization_impact = Column(String, nullable=True)
    business_impact = Column(String, nullable=True)
    estimated_hours_saved = Column(Float, default=0)
    estimated_value = Column(Integer, default=0)
    roi_points = Column(Float, default=0)
    confidence_score = Column(Float, default=0)
    ai_comment = Column(String, nullable=True)

    # 日時
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)