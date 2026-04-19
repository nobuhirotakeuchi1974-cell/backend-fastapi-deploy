"""
開発用テストスクリプト
- DBにテストデータを投入
- JWT トークンを生成
- POST /api/evaluations を実際に叩いて結果を確認

実行方法:
    cd backend
    python seed_and_test.py
"""

import asyncio
import os
import uuid
from datetime import datetime, timedelta, timezone

import httpx
import requests as req_sync
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

# ── 設定値（config.py と合わせる） ──────────────────────────────────────
# スクリプトファイルの場所（backend/）を基準にした絶対パスを使う
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite+aiosqlite:///{_BACKEND_DIR}/human_capital.db"
SECRET_KEY = "change-me-in-production"
ALGORITHM = "HS256"
BASE_URL = "http://localhost:8000"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── JWT ヘルパー ──────────────────────────────────────────────────────────
def create_token(user_id: str, expire_minutes: int = 60) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── DB セットアップ ───────────────────────────────────────────────────────
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSession = async_sessionmaker(engine, expire_on_commit=False)


async def reset_and_seed():
    """テーブルを作成し、テスト用データを投入する。"""
    # まず全モデルを登録
    import app.models  # noqa: F401
    from app.models.base import Base
    from app.models.evaluation import Evaluation
    from app.models.points_ledger import PointsLedger
    from app.models.post import Post
    from app.models.user import Department, User

    # テーブル作成
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSession() as db:
        # --- 既存テストデータを削除（冪等に実行できるよう） ---
        await db.execute(text("DELETE FROM points_ledger"))
        await db.execute(text("DELETE FROM evaluations"))
        await db.execute(text("DELETE FROM posts"))
        await db.execute(text("DELETE FROM users"))
        await db.execute(text("DELETE FROM departments"))
        await db.commit()

        # --- 部門 ---
        dept_id = str(uuid.uuid4())
        dept = Department(id=dept_id, name="開発部")
        db.add(dept)
        await db.flush()

        # --- 部門長（manager）---
        manager_id = str(uuid.uuid4())
        manager = User(
            id=manager_id,
            email="manager@example.com",
            password_hash=pwd_context.hash("password123"),
            name="山田 太郎（部門長）",
            department_id=dept_id,
            role="manager",
            is_active=True,
        )
        db.add(manager)

        # --- 一般社員（employee）---
        employee_id = str(uuid.uuid4())
        employee = User(
            id=employee_id,
            email="employee@example.com",
            password_hash=pwd_context.hash("password123"),
            name="鈴木 花子",
            department_id=dept_id,
            role="employee",
            is_active=True,
        )
        db.add(employee)
        await db.flush()

        # --- 行動ログ（投稿） ---
        post_id = str(uuid.uuid4())
        post = Post(
            id=post_id,
            user_id=employee_id,
            category="challenge",
            content="新しいCI/CDパイプラインを構築し、デプロイ時間を50%短縮しました。",
        )
        db.add(post)
        await db.commit()

    print(f"✅ テストデータ投入完了")
    print(f"   部門ID     : {dept_id}")
    print(f"   部門長ID   : {manager_id}")
    print(f"   社員ID     : {employee_id}")
    print(f"   投稿ID     : {post_id}")
    return manager_id, post_id


async def test_endpoint(manager_id: str, post_id: str):
    """HTTP クライアントで実際に API を叩く。"""
    token = create_token(manager_id)
    headers = {"Authorization": f"Bearer {token}"}

    # ── デバッグ: トークンをその場でデコードして検証 ─────────────────
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"\n🔍 JWT デコード OK: {decoded}")
    except Exception as e:
        print(f"\n❌ JWT デコード失敗: {e}")
        return

    # ── デバッグ: DB でユーザーが取得できるか確認 ─────────────────────
    async with AsyncSession() as db:
        from app.models.user import User
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.id == manager_id))
        u = result.scalar_one_or_none()
        print(f"🔍 DB ユーザー照合: {'OK — ' + u.name + ' / is_active=' + str(u.is_active) if u else 'NOT FOUND'}")

    # ── デバッグ: まず認証なしで /health を確認 ───────────────────────
    r0 = req_sync.get(f"{BASE_URL}/health")
    print(f"\n[GET /health] (no auth) → {r0.status_code} {r0.json()}")

    # ── デバッグ: requests（同期）でBearer付きリクエスト ─────────────
    print("\n[GET /api/evaluations/weekly-cap] (requests 同期版)")
    rdbg = req_sync.get(
        f"{BASE_URL}/api/evaluations/weekly-cap",
        headers={"Authorization": f"Bearer {token}"},
    )
    print(f"  Status: {rdbg.status_code}")
    print(f"  Body  : {rdbg.json()}")

    async with httpx.AsyncClient(base_url=BASE_URL, headers=headers) as client:
        # ── 1. 週間上限ステータス確認 ─────────────────────────────────
        print("\n[GET /api/evaluations/weekly-cap]")
        r = await client.get("/api/evaluations/weekly-cap")
        print(f"  Status: {r.status_code}")
        print(f"  Body  : {r.json()}")

        # ── 2. 未評価投稿一覧 ─────────────────────────────────────────
        print("\n[GET /api/evaluations/pending]")
        r = await client.get("/api/evaluations/pending")
        print(f"  Status: {r.status_code}")
        print(f"  Body  : {r.json()}")

        # ── 3. 評価登録（正常系） ─────────────────────────────────────
        print("\n[POST /api/evaluations] 正常系")
        payload = {"post_id": post_id, "points": 10, "comment": "素晴らしい取り組みです！"}
        r = await client.post("/api/evaluations", json=payload)
        print(f"  Status: {r.status_code}")
        print(f"  Body  : {r.json()}")

        # ── 4. 二重評価（409 期待）────────────────────────────────────
        print("\n[POST /api/evaluations] 二重評価 → 409 期待")
        r = await client.post("/api/evaluations", json=payload)
        print(f"  Status: {r.status_code}")
        print(f"  Body  : {r.json()}")


async def main():
    print("=" * 60)
    print("Human Capital OS -- Evaluation API Test")
    print("=" * 60)

    manager_id, post_id = await reset_and_seed()

    print(f"\n📡 サーバー {BASE_URL} に接続してテストを実行します...")
    print("   （uvicorn が起動していることを確認してください）")

    try:
        await test_endpoint(manager_id, post_id)
        print("\n✅ テスト完了")
    except httpx.ConnectError:
        print("\n❌ サーバーに接続できません。")
        print("   別ターミナルで以下を実行してください:")
        print("   uvicorn app.main:app --reload")

        # サーバーなしでもトークンだけ表示しておく
        token = create_token(manager_id)
        print(f"\n🔑 Bearer トークン（Swagger UI 用）:")
        print(f"   {token}")
        print(f"\n📋 POST /api/evaluations リクエストボディ:")
        print(f'   {{"post_id": "{post_id}", "points": 10, "comment": "テストコメント"}}')


if __name__ == "__main__":
    asyncio.run(main())
