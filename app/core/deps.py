import logging
from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db

# tokenUrl はログインエンドポイントのパス（Swagger UI の Authorize ボタン用）
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

_logger = logging.getLogger(__name__)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """JWTトークンを検証し、DBからアクティブなユーザーを返す。"""
    from app.models.user import User  # 循環インポート回避のため遅延インポート

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="認証情報が無効です",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        # sub にユーザーIDを格納する想定
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError as exc:
        _logger.error("JWT decode failed: %s: %s", type(exc).__name__, exc)
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise credentials_exception

    return user


def require_role(*roles: str) -> Callable:
    """指定ロールのいずれかを持つユーザーのみ許可する依存関数を返す。"""

    async def _check_role(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="この操作を実行する権限がありません",
            )
        return current_user

    return _check_role


def require_role(*roles: str) -> Callable:
    """
    指定ロールのみアクセスを許可する依存性ファクトリ。

    使い方:
        current_user: User = Depends(require_role("manager"))
        current_user: User = Depends(require_role("hr", "executive", "admin"))
    """

    async def _check(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"このエンドポイントには {' / '.join(roles)} ロールが必要です",
            )
        return current_user

    return _check
