import asyncio
import sys

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.user import Department, User


async def main() -> None:
    print("=== ユーザーに部門を割り当て ===")
    email = input("ユーザーのメールアドレス: ").strip()
    dept_name = input("部門名: ").strip()

    if not email or not dept_name:
        print("エラー: メールアドレスと部門名は必須です", file=sys.stderr)
        sys.exit(1)

    async with AsyncSessionLocal() as session:
        user_result = await session.execute(select(User).where(User.email == email))
        user = user_result.scalar_one_or_none()
        if user is None:
            print(f"エラー: ユーザー {email} が見つかりません", file=sys.stderr)
            sys.exit(1)

        dept_result = await session.execute(select(Department).where(Department.name == dept_name))
        dept = dept_result.scalar_one_or_none()
        if dept is None:
            print(f"エラー: 部門 {dept_name} が見つかりません", file=sys.stderr)
            sys.exit(1)

        user.department_id = dept.id
        await session.commit()
        await session.refresh(user)

    print("\n更新完了:")
    print(f"  Email        : {user.email}")
    print(f"  Department ID: {user.department_id}")
    print(f"  Department   : {dept.name}")


if __name__ == "__main__":
    asyncio.run(main())
