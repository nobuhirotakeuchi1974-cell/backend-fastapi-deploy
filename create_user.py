"""
ユーザー作成スクリプト
使い方:
    python create_user.py
"""

import asyncio
import sys

from sqlalchemy import select

from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal, create_tables
from app.models.user import User


async def main() -> None:
    await create_tables()

    print("=== ユーザー作成 ===")
    email = input("メールアドレス: ").strip()
    name = input("名前: ").strip()
    password = input("パスワード: ").strip()
    role = input("ロール (employee / manager / hr / executive / admin) [employee]: ").strip() or "employee"

    if not email or not name or not password:
        print("エラー: メールアドレス、名前、パスワードは必須です", file=sys.stderr)
        sys.exit(1)

    valid_roles = {"employee", "manager", "hr", "executive", "admin"}
    if role not in valid_roles:
        print(f"エラー: ロールは {valid_roles} のいずれかを指定してください", file=sys.stderr)
        sys.exit(1)

    async with AsyncSessionLocal() as session:
        # メールアドレス重複チェック
        result = await session.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none() is not None:
            print(f"エラー: {email} はすでに登録済みです", file=sys.stderr)
            sys.exit(1)

        user = User(
            email=email,
            name=name,
            password_hash=get_password_hash(password),
            role=role,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    print(f"\n作成完了:")
    print(f"  ID   : {user.id}")
    print(f"  Email: {user.email}")
    print(f"  Name : {user.name}")
    print(f"  Role : {user.role}")


if __name__ == "__main__":
    asyncio.run(main())
