from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.auth import verify_token

router = APIRouter()


@router.get("/department-ranking")
def get_department_ranking(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    sql = text("""
        SELECT
            COALESCE(department, '未設定') AS department,
            COUNT(*) AS post_count,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
            SUM(CASE WHEN status = 'approved'
                THEN COALESCE(manager_points, 0)
                ELSE 0 END) AS total_points,
            SUM(CASE WHEN status = 'approved'
                THEN COALESCE(manager_points, 0) * 10000
                ELSE 0 END) AS total_roi
        FROM posts
        GROUP BY COALESCE(department, '未設定')
        ORDER BY total_roi DESC
    """)

    rows = db.execute(sql).mappings().all()

    result = []

    for index, row in enumerate(rows, start=1):
        result.append({
            "rank": index,
            "department": row["department"],
            "post_count": row["post_count"] or 0,
            "approved_count": row["approved_count"] or 0,
            "pending_count": row["pending_count"] or 0,
            "total_points": row["total_points"] or 0,
            "total_roi": row["total_roi"] or 0,
        })

    return {
        "message": "department ranking fetched",
        "data": result
    }


@router.get("/roi-trend")
def get_roi_trend(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    sql = text("""
        SELECT
            DATE(reviewed_at) AS month,
            SUM(COALESCE(manager_points, 0)) AS points,
            COUNT(*) AS count,
            SUM(COALESCE(manager_points, 0) * 10000) AS financial_impact
        FROM posts
        WHERE status = 'approved'
        GROUP BY DATE(reviewed_at)
        ORDER BY DATE(reviewed_at)
    """)

    rows = db.execute(sql).mappings().all()

    result = []

    for row in rows:
        result.append({
            "month": row["month"],
            "points": row["points"] or 0,
            "count": row["count"] or 0,
            "financial_impact": row["financial_impact"] or 0,
        })

    return result


@router.get("/ai-comment")
def get_ai_comment(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    sql = text("""
        SELECT
            COALESCE(department, '未設定') AS department,
            COUNT(*) AS post_count,
            SUM(CASE WHEN status = 'approved'
                THEN COALESCE(manager_points, 0)
                ELSE 0 END) AS total_points,
            SUM(CASE WHEN status = 'approved'
                THEN COALESCE(manager_points, 0) * 10000
                ELSE 0 END) AS total_roi
        FROM posts
        GROUP BY COALESCE(department, '未設定')
        ORDER BY total_roi DESC
    """)

    rows = db.execute(sql).mappings().all()

    if not rows:
        return {
            "message": "ai comment generated",
            "data": {
                "comment": "まだ分析データがありません。"
            }
        }

    top = rows[0]

    comment = (
        f"{top['department']} が現在もっともROI貢献が高い部門です。"
        f"人的資本行動と業務改善が連動しています。"
    )

    return {
        "message": "ai comment generated",
        "data": {
            "comment": comment
        }
    }


@router.get("/attention-departments")
def get_attention_departments(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    sql = text("""
        SELECT
            COALESCE(department, '未設定') AS department,
            COUNT(*) AS post_count,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
            SUM(CASE WHEN status = 'approved'
                THEN COALESCE(manager_points, 0)
                ELSE 0 END) AS total_points,
            SUM(CASE WHEN status = 'approved'
                THEN COALESCE(manager_points, 0) * 10000
                ELSE 0 END) AS total_roi
        FROM posts
        GROUP BY COALESCE(department, '未設定')
    """)

    rows = db.execute(sql).mappings().all()

    result = []

    for row in rows:
        post_count = row["post_count"] or 0
        approved_count = row["approved_count"] or 0
        pending_count = row["pending_count"] or 0
        total_points = row["total_points"] or 0
        total_roi = row["total_roi"] or 0

        attention_score = 0
        reasons = []
        recommended_actions = []

        if pending_count >= 3:
            attention_score += pending_count * 10
            reasons.append(f"未承認投稿が {pending_count} 件あります")
            recommended_actions.append("レビュー優先対応")

        if post_count <= 2:
            attention_score += 20
            reasons.append("投稿数が少なく行動量が不足")
            recommended_actions.append("投稿促進施策")

        if approved_count > 0 and total_points <= 50:
            attention_score += 15
            reasons.append("ROIポイントが低水準")
            recommended_actions.append("高ROI行動共有")

        if attention_score >= 40:
            level = "high"
            label = "要注意"
        elif attention_score >= 20:
            level = "middle"
            label = "注意"
        else:
            level = "low"
            label = "安定"

        result.append({
            "department": row["department"],
            "post_count": post_count,
            "approved_count": approved_count,
            "pending_count": pending_count,
            "total_points": total_points,
            "total_roi": total_roi,
            "attention_score": attention_score,
            "level": level,
            "label": label,
            "reason": " / ".join(reasons) if reasons else "大きな問題なし",
            "recommended_actions": list(set(recommended_actions)),
        })

    result.sort(key=lambda x: x["attention_score"], reverse=True)

    return {
        "message": "attention departments fetched",
        "data": result
    }