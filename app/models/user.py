import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id: Mapped[uuid.UUID] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    # manager_id は users テーブルへの FK。循環FK回避のため use_alter=True
    manager_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id", use_alter=True, name="fk_departments_manager_id"),
        nullable=True,
    )

    members: Mapped[list["User"]] = relationship(
        "User",
        foreign_keys="[User.department_id]",
        back_populates="department",
    )


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    department_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("departments.id"), nullable=True, index=True
    )
    # employee / manager / hr / executive / admin
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="employee")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    department: Mapped["Department | None"] = relationship(
        "Department",
        foreign_keys="[User.department_id]",
        back_populates="members",
    )
    posts: Mapped[list["Post"]] = relationship(  # type: ignore[name-defined]
        "Post", back_populates="author"
    )
