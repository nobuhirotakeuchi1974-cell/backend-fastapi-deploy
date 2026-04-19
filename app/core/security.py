from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain: str, hashed: str) -> bool:
    """平文パスワードとハッシュを照合する。"""
    return _pwd_context.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    """パスワードをbcryptでハッシュ化する。"""
    return _pwd_context.hash(password)


def create_access_token(subject: str) -> str:
    """subject（ユーザーID）を sub クレームに持つJWTを生成する。"""
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
