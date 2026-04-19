import asyncio
import sys

from sqlalchemy import select

from app.db.session import AsyncSessionLocal, create_tables
from app.models.user import Department


async def main() -> None:
    await create_tables()

    print("=== 部門作成 ===")
    name = input("部門名: ").strip()

    if not name:
        print("エラー: 部門名は必須です", file=sys.stderr)
        sys.exit(1)

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Department).where(Department.name == name))
        if result.scalar_one_or_none() is not None:
            print(f"エラー: {name} はすでに登録済みです", file=sys.stderr)
            sys.exit(1)

        dept = Department(name=name)
        session.add(dept)
        await session.commit()
        await session.refresh(dept)

    print("\n作成完了:")
    print(f"  ID  : {dept.id}")
    print(f"  Name: {dept.name}")


if __name__ == "__main__":
    asyncio.run(main())
