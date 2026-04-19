from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.token import TokenResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="ログイン",
    description="メールアドレスとパスワードで認証し、JWTアクセストークンを返す。",
)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    # OAuth2PasswordRequestForm の username フィールドにメールアドレスを入力する
    result = await db.execute(select(User).where(User.email == form.username))
    user: User | None = result.scalar_one_or_none()

    if user is None or not user.is_active or not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    return TokenResponse(access_token=access_token)
