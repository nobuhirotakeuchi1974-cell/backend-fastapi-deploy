import asyncio
import sys

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.post import Post, VALID_CATEGORIES
from app.models.user import User


async def main() -> None:
    print("=== 投稿作成 ===")
    email = input("投稿者のメールアドレス: ").strip()
    category = input(f"カテゴリ {VALID_CATEGORIES}: ").strip()
    content = input("投稿内容: ").strip()

    if not email or not category or not content:
        print("エラー: メールアドレス、カテゴリ、投稿内容は必須です", file=sys.stderr)
        sys.exit(1)

    if category not in VALID_CATEGORIES:
        print(f"エラー: カテゴリは {VALID_CATEGORIES} のいずれかです", file=sys.stderr)
        sys.exit(1)

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user is None:
            print(f"エラー: ユーザー {email} が見つかりません", file=sys.stderr)
            sys.exit(1)

        post = Post(
            user_id=user.id,
            category=category,
            content=content,
            is_evaluated=False,
        )
        session.add(post)
        await session.commit()
        await session.refresh(post)

    print("\n作成完了:")
    print(f"  Post ID : {post.id}")
    print(f"  User ID : {post.user_id}")
    print(f"  Category: {post.category}")
    print(f"  Content : {post.content}")


if __name__ == "__main__":
    asyncio.run(main())
