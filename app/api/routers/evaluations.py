from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_role
from app.db.session import get_db
from app.models.evaluation import Evaluation
from app.models.points_ledger import PointsLedger
from app.models.post import Post
from app.models.user import User
from app.schemas.evaluation import EvaluationCreate, EvaluationResponse, WeeklyCapStatus

router = APIRouter(prefix="/api/evaluations", tags=["evaluations"])

# -----------------------------------------------------------------------
# 定数
# -----------------------------------------------------------------------
ALLOWED_POINTS = {1, 5, 10}
# 週間ポイント上限 = 部門の社員数 × WEEKLY_CAP_MULTIPLIER
WEEKLY_CAP_MULTIPLIER = 5


# -----------------------------------------------------------------------
# ヘルパー
# -----------------------------------------------------------------------
def _get_week_start() -> datetime:
    """今週の月曜日 00:00:00（timezone-naive）を返す。"""
    now = datetime.now()
    monday = now - timedelta(days=now.weekday())
    return monday.replace(hour=0, minute=0, second=0, microsecond=0)


async def _get_weekly_used_points(db: AsyncSession, evaluator_id: str) -> int:
    """今週、指定した部門長が付与済みのポイント合計を返す。"""
    result = await db.execute(
        select(func.coalesce(func.sum(Evaluation.points), 0)).where(
            Evaluation.evaluator_id == evaluator_id,
            Evaluation.created_at >= _get_week_start(),
        )
    )
    return result.scalar_one()


async def _get_department_member_count(
    db: AsyncSession, department_id: str
) -> int:
    """部門のアクティブ社員数を返す。週間上限の算出に使用。"""
    result = await db.execute(
        select(func.count())
        .select_from(User)
        .where(
            User.department_id == department_id,
            User.is_active.is_(True),
        )
    )
    return result.scalar_one()


# -----------------------------------------------------------------------
# POST /api/evaluations  — 評価登録
# -----------------------------------------------------------------------
@router.post(
    "",
    response_model=EvaluationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="行動ログへの評価登録",
    description="部門長が同部門の行動ログに 1/5/10pt を付与する。週間上限あり。",
)
async def create_evaluation(
    body: EvaluationCreate,
    current_user: User = Depends(require_role("manager")),
    db: AsyncSession = Depends(get_db),
) -> EvaluationResponse:

    # ── 1. 投稿の存在確認 ───────────────────────────────────────────────
    post = await db.get(Post, body.post_id)
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="投稿が見つかりません",
        )

    # ── 2. 投稿者を取得 ────────────────────────────────────────────────
    post_author = await db.get(User, post.user_id)
    if post_author is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="投稿者が見つかりません",
        )

    # ── 3. 自己評価禁止 ────────────────────────────────────────────────
    if post.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="自分の投稿は評価できません",
        )

    # ── 4. 部門長自身の部門が未設定の場合はエラー ─────────────────────
    if current_user.department_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="あなたの部門が設定されていません。管理者に連絡してください",
        )

    # ── 5. 同部門チェック ──────────────────────────────────────────────
    if post_author.department_id != current_user.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="他部門の投稿は評価できません",
        )

    # ── 6. 二重評価禁止 ────────────────────────────────────────────────
    if post.is_evaluated:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="この投稿はすでに評価済みです",
        )

    # ── 7. 週間ポイント上限チェック ────────────────────────────────────
    member_count = await _get_department_member_count(db, current_user.department_id)
    weekly_cap = member_count * WEEKLY_CAP_MULTIPLIER
    used_points = await _get_weekly_used_points(db, current_user.id)

    if used_points + body.points > weekly_cap:
        remaining = max(0, weekly_cap - used_points)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"週間ポイント上限（{weekly_cap}pt）を超えます。"
                f"今週の使用済み: {used_points}pt、残り: {remaining}pt"
            ),
        )

    # ── 8. DB書き込み（同一トランザクション）─────────────────────────
    # 8-a. Evaluation を INSERT
    evaluation = Evaluation(
        post_id=body.post_id,
        evaluator_id=current_user.id,
        points=body.points,
        comment=body.comment,
    )
    db.add(evaluation)

    # 8-b. Post の評価済みフラグを更新
    post.is_evaluated = True

    # 8-c. evaluation.id が Python 側で確定しているため flush 不要だが、
    #       created_at など server_default 値を取得するため flush → refresh する
    await db.flush()

    # 8-d. PointsLedger を INSERT
    ledger = PointsLedger(
        user_id=post.user_id,
        evaluation_id=evaluation.id,
        points=body.points,
        category=post.category,
        department_id=post_author.department_id,
    )
    db.add(ledger)

    # コミットは get_db の依存性が自動実行。ここでは refresh のみ。
    await db.flush()
    await db.refresh(evaluation)

    return EvaluationResponse.model_validate(evaluation)


# -----------------------------------------------------------------------
# GET /api/evaluations/pending  — 未評価投稿一覧
# -----------------------------------------------------------------------
@router.get(
    "/pending",
    response_model=list[dict],
    summary="未評価投稿一覧",
    description="部門長が評価していない同部門の投稿を返す。",
)
async def get_pending_posts(
    current_user: User = Depends(require_role("manager")),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    if current_user.department_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="部門が設定されていません",
        )

    result = await db.execute(
        select(Post, User.name.label("author_name"))
        .join(User, Post.user_id == User.id)
        .where(
            User.department_id == current_user.department_id,
            Post.is_evaluated.is_(False),
            # 自分の投稿は評価できないので除外
            Post.user_id != current_user.id,
        )
        .order_by(Post.created_at.asc())
    )
    rows = result.all()

    return [
        {
            "post_id": row.Post.id,
            "author_name": row.author_name,
            "category": row.Post.category,
            "content": row.Post.content,
            "created_at": row.Post.created_at,
        }
        for row in rows
    ]


# -----------------------------------------------------------------------
# GET /api/evaluations/weekly-cap  — 週間上限ステータス確認
# -----------------------------------------------------------------------
@router.get(
    "/weekly-cap",
    response_model=WeeklyCapStatus,
    summary="週間ポイント上限の使用状況",
)
async def get_weekly_cap_status(
    current_user: User = Depends(require_role("manager")),
    db: AsyncSession = Depends(get_db),
) -> WeeklyCapStatus:
    if current_user.department_id is None:
        raise HTTPException(status_code=403, detail="部門が設定されていません")

    member_count = await _get_department_member_count(db, current_user.department_id)
    weekly_cap = member_count * WEEKLY_CAP_MULTIPLIER
    used_points = await _get_weekly_used_points(db, current_user.id)

    return WeeklyCapStatus(
        used_points=used_points,
        cap_points=weekly_cap,
        remaining_points=max(0, weekly_cap - used_points),
    )
