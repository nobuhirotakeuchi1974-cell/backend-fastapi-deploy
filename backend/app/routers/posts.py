import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import verify_token
from app.models import Post
from app.schemas import PostCreate, ReviewRequest

router = APIRouter(
    prefix="/api/posts",
    tags=["posts"],
)

logger = logging.getLogger("human-capital-os")
logger.setLevel(logging.INFO)

POINT_VALUE = 100000
HOURLY_VALUE = 5000


def is_broken_text(value: str | None) -> bool:
    if value is None:
        return False
    return "?" in str(value)


def is_broken_post(post: Post) -> bool:
    return (
        is_broken_text(post.employee_name)
        or is_broken_text(post.department)
        or is_broken_text(post.behavior)
    )


def clean_posts(posts: list[Post]) -> list[Post]:
    return [p for p in posts if not is_broken_post(p)]


def estimate_human_capital(payload: dict):
    behavior = (payload.get("behavior") or "").lower()
    category = payload.get("category") or ""
    base_points = int(payload.get("self_points", 0) or 0)

    human_action = "改善提案"
    organization_impact = "業務標準化"
    business_impact = "業務改善・財務効果"
    confidence_score = 78
    ai_comment_parts = []

    if category == "challenge":
        human_action = "挑戦行動"
        organization_impact = "新施策創出"
        business_impact = "生産性向上・財務効果"
        confidence_score = 82
        ai_comment_parts.append("挑戦行動として、新施策創出や生産性向上への貢献が期待されます。")

    elif category == "improvement":
        human_action = "改善提案"
        organization_impact = "業務標準化"
        business_impact = "時間削減・品質改善"
        confidence_score = 86
        ai_comment_parts.append("改善提案として、業務標準化や時間削減への貢献が期待されます。")

    elif category == "support":
        human_action = "支援・連携"
        organization_impact = "部門連携強化"
        business_impact = "手戻り削減・対応品質向上"
        confidence_score = 83
        ai_comment_parts.append("支援行動として、部門連携強化や対応品質向上への効果が期待されます。")

    elif category == "learning":
        human_action = "学習・共有"
        organization_impact = "教育効率化"
        business_impact = "育成時間短縮・知識共有"
        confidence_score = 80
        ai_comment_parts.append("学習行動として、教育効率化や知識共有への貢献が期待されます。")

    if any(word in behavior for word in ["faq", "マニュアル", "手順", "標準化"]):
        organization_impact = "属人化解消"
        business_impact = "問い合わせ対応の標準化"
        confidence_score += 5
        ai_comment_parts.append("FAQ・手順化により、属人化解消と対応標準化への効果が見込まれます。")

    if any(word in behavior for word in ["新人", "教育", "研修", "ojt", "育成"]):
        organization_impact = "教育効率化"
        business_impact = "育成時間短縮"
        confidence_score += 4
        ai_comment_parts.append("教育・育成に関する行動として、育成時間短縮と品質安定化が期待されます。")

    if any(word in behavior for word in ["共有", "ナレッジ", "横展開", "連携", "展開"]):
        organization_impact = "部門連携強化"
        business_impact = "手戻り削減"
        confidence_score += 4
        ai_comment_parts.append("ナレッジ共有により、部門連携強化と手戻り削減への効果が見込まれます。")

    if any(word in behavior for word in ["ミス", "再発", "チェック", "差戻し", "確認"]):
        organization_impact = "品質安定"
        business_impact = "ミス・差戻し削減"
        confidence_score += 4
        ai_comment_parts.append("再発防止・チェック強化により、品質安定と差戻し削減への効果が期待されます。")

    if any(word in behavior for word in ["時間", "短縮", "効率", "効率化", "自動化"]):
        business_impact = "時間削減・生産性向上"
        confidence_score += 4
        ai_comment_parts.append("作業時間の短縮や効率化により、生産性向上への貢献が期待されます。")

    if any(word in behavior for word in ["顧客", "問い合わせ", "対応", "品質", "満足"]):
        organization_impact = "対応品質向上"
        business_impact = "顧客対応品質の向上"
        confidence_score += 3
        ai_comment_parts.append("顧客対応や問い合わせ品質の改善により、サービス品質向上への効果が見込まれます。")

    if any(word in behavior for word in ["提案", "改善", "課題", "気づき", "工夫"]):
        human_action = "改善提案"
        confidence_score += 3
        ai_comment_parts.append("現場課題の発見と改善提案として、継続的な業務改善サイクルへの貢献が期待されます。")

    confidence_score = min(confidence_score, 95)

    roi_points = round(base_points / 10, 1)
    if roi_points <= 0:
        roi_points = 0.5

    estimated_value = int(roi_points * POINT_VALUE)
    estimated_hours_saved = round(estimated_value / HOURLY_VALUE, 1)

    unique_comments = []
    for comment in ai_comment_parts:
        if comment not in unique_comments:
            unique_comments.append(comment)

    ai_comment = " / ".join(unique_comments[:3])

    return {
        "human_action": human_action,
        "organization_impact": organization_impact,
        "business_impact": business_impact,
        "estimated_hours_saved": estimated_hours_saved,
        "estimated_value": estimated_value,
        "roi_points": roi_points,
        "confidence_score": confidence_score,
        "ai_comment": ai_comment,
    }


def serialize_post(post: Post):
    return {
        "id": post.id,
        "employee_name": post.employee_name,
        "department": post.department,
        "behavior": post.behavior,
        "category": post.category,
        "self_points": post.self_points,
        "manager_points": post.manager_points,
        "manager_comment": post.manager_comment,
        "status": post.status,
        "human_action": post.human_action,
        "organization_impact": post.organization_impact,
        "business_impact": post.business_impact,
        "estimated_hours_saved": post.estimated_hours_saved,
        "estimated_value": post.estimated_value,
        "roi_points": post.roi_points,
        "confidence_score": post.confidence_score,
        "ai_comment": post.ai_comment,
        "created_at": post.created_at,
        "reviewed_at": post.reviewed_at,
    }


@router.get("")
def get_posts(db: Session = Depends(get_db)):
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
    posts = clean_posts(posts)
    return [serialize_post(p) for p in posts]


@router.post("")
def create_post(
    payload: PostCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    payload_dict = payload.model_dump()
    estimate = estimate_human_capital(payload_dict)

    new_post = Post(
        employee_name=payload_dict["employee_name"],
        department=payload_dict["department"],
        behavior=payload_dict["behavior"],
        category=payload_dict["category"],
        self_points=payload_dict["self_points"],
        manager_points=None,
        manager_comment=None,
        status="pending",
        human_action=estimate["human_action"],
        organization_impact=estimate["organization_impact"],
        business_impact=estimate["business_impact"],
        estimated_hours_saved=estimate["estimated_hours_saved"],
        estimated_value=estimate["estimated_value"],
        roi_points=estimate["roi_points"],
        confidence_score=estimate["confidence_score"],
        ai_comment=estimate["ai_comment"],
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    request_id = getattr(request.state, "request_id", "-")

    logger.info(
        "post_created post_id=%s employee_name=%s department=%s category=%s self_points=%s",
        new_post.id,
        new_post.employee_name,
        new_post.department,
        new_post.category,
        new_post.self_points,
        extra={"request_id": request_id},
    )

    return {
        "message": "saved",
        "data": serialize_post(new_post),
    }


@router.put("/{post_id}/review")
def review_post(
    post_id: int,
    payload: ReviewRequest,
    request: Request,
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    payload_dict = payload.model_dump()
    request_id = getattr(request.state, "request_id", "-")

    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        logger.warning(
            "post_review_failed reason=not_found post_id=%s",
            post_id,
            extra={"request_id": request_id},
        )
        raise HTTPException(status_code=404, detail="対象の投稿が見つかりません。")

    post.manager_points = payload_dict.get("manager_points", 0)
    post.manager_comment = payload_dict.get("manager_comment")
    post.status = payload_dict["status"]
    post.reviewed_at = datetime.utcnow()

    if post.status == "approved":
        approved_points = post.manager_points or post.self_points or 0
        post.roi_points = round(approved_points / 10, 1)

        if post.roi_points <= 0:
            post.roi_points = 0.5

        post.estimated_value = int(post.roi_points * POINT_VALUE)
        post.estimated_hours_saved = round(post.estimated_value / HOURLY_VALUE, 1)

    db.commit()
    db.refresh(post)

    logger.info(
        "post_reviewed post_id=%s status=%s manager_points=%s department=%s",
        post.id,
        post.status,
        post.manager_points,
        post.department,
        extra={"request_id": request_id},
    )

    return {
        "message": "reviewed",
        "data": serialize_post(post),
    }


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    posts = db.query(Post).all()
    posts = clean_posts(posts)

    total = len(posts)
    pending_posts = [p for p in posts if p.status == "pending"]
    approved_posts = [p for p in posts if p.status == "approved"]
    rejected_posts = [p for p in posts if p.status == "rejected"]

    target_roi_points = 6000
    target_value = target_roi_points * POINT_VALUE

    total_roi_points = sum(p.roi_points or 0 for p in approved_posts)
    total_estimated_value = sum(p.estimated_value or 0 for p in approved_posts)
    total_hours_saved = sum(p.estimated_hours_saved or 0 for p in approved_posts)

    achievement_rate = round((total_roi_points / target_roi_points) * 100, 4)

    average_confidence = 0
    if posts:
        average_confidence = round(
            sum(p.confidence_score or 0 for p in posts) / len(posts),
            1,
        )

    department_summary = {}
    impact_summary = {
        "人の行動": {},
        "組織能力向上": {},
        "業務改善・財務効果": {},
    }

    department_action_summary = {}
    action_total_summary = {}

    for p in approved_posts:
        department_key = p.department or "未設定"
        action_key = p.human_action or "未分類"

        if department_key not in department_summary:
            department_summary[department_key] = {
                "count": 0,
                "roi_points": 0,
                "estimated_value": 0,
                "estimated_hours_saved": 0,
                "average_confidence": 0,
                "confidence_total": 0,
            }

        department_summary[department_key]["count"] += 1
        department_summary[department_key]["roi_points"] += p.roi_points or 0
        department_summary[department_key]["estimated_value"] += p.estimated_value or 0
        department_summary[department_key]["estimated_hours_saved"] += p.estimated_hours_saved or 0
        department_summary[department_key]["confidence_total"] += p.confidence_score or 0

        if department_key not in department_action_summary:
            department_action_summary[department_key] = {}

        if action_key not in department_action_summary[department_key]:
            department_action_summary[department_key][action_key] = {
                "count": 0,
                "roi_points": 0,
            }

        department_action_summary[department_key][action_key]["count"] += 1
        department_action_summary[department_key][action_key]["roi_points"] += p.roi_points or 0

        if action_key not in action_total_summary:
            action_total_summary[action_key] = {
                "count": 0,
                "roi_points": 0,
            }

        action_total_summary[action_key]["count"] += 1
        action_total_summary[action_key]["roi_points"] += p.roi_points or 0

        for label, value in [
            ("人の行動", p.human_action),
            ("組織能力向上", p.organization_impact),
            ("業務改善・財務効果", p.business_impact),
        ]:
            key = value or "未分類"

            if key not in impact_summary[label]:
                impact_summary[label][key] = {
                    "count": 0,
                    "roi_points": 0,
                    "estimated_value": 0,
                }

            impact_summary[label][key]["count"] += 1
            impact_summary[label][key]["roi_points"] += p.roi_points or 0
            impact_summary[label][key]["estimated_value"] += p.estimated_value or 0

    for dept in department_summary.values():
        if dept["count"] > 0:
            dept["average_confidence"] = round(
                dept["confidence_total"] / dept["count"],
                1,
            )
        del dept["confidence_total"]

    bias_alerts = []

    for department_name, action_map in department_action_summary.items():
        for action_name, dept_data in action_map.items():
            company_data = action_total_summary.get(action_name)

            if not company_data:
                continue

            dept_count = dept_data["count"]
            company_count = company_data["count"]

            if dept_count <= 0 or company_count <= 0:
                continue

            dept_avg = dept_data["roi_points"] / dept_count
            company_avg = company_data["roi_points"] / company_count

            if company_avg <= 0:
                continue

            diff_rate = round(((dept_avg - company_avg) / company_avg) * 100, 1)

            if abs(diff_rate) >= 30:
                risk = "高め評価傾向" if diff_rate > 0 else "低め評価傾向"

                if diff_rate > 0:
                    detail = (
                        f"{department_name}では{action_name}に対する平均ROI-Pが、"
                        f"全社平均より{abs(diff_rate)}%高く、評価が高めに出ている可能性があります。"
                    )
                else:
                    detail = (
                        f"{department_name}では{action_name}に対する平均ROI-Pが、"
                        f"全社平均より{abs(diff_rate)}%低く、評価されにくい可能性があります。"
                    )

                bias_alerts.append(
                    {
                        "department": department_name,
                        "category": action_name,
                        "diff": diff_rate,
                        "risk": risk,
                        "detail": detail,
                        "department_average_roi": round(dept_avg, 2),
                        "company_average_roi": round(company_avg, 2),
                        "count": dept_count,
                    }
                )

    bias_alerts = sorted(
        bias_alerts,
        key=lambda x: abs(x["diff"]),
        reverse=True,
    )

    return {
        "total": total,
        "pending": len(pending_posts),
        "approved": len(approved_posts),
        "rejected": len(rejected_posts),
        "target_roi_points": target_roi_points,
        "target_value": target_value,
        "total_roi_points": round(total_roi_points, 1),
        "total_estimated_value": total_estimated_value,
        "total_hours_saved": round(total_hours_saved, 1),
        "achievement_rate": achievement_rate,
        "average_confidence": average_confidence,
        "departments": department_summary,
        "impacts": impact_summary,
        "bias_alerts": bias_alerts,
    }


@router.get("/roi-trend")
def get_roi_trend(
    db: Session = Depends(get_db),
    token: dict = Depends(verify_token),
):
    posts = db.query(Post).filter(Post.status == "approved").all()
    posts = clean_posts(posts)

    monthly = {}

    for post in posts:
        if not post.created_at:
            continue

        month = post.created_at.strftime("%Y-%m")
        points = post.roi_points or 0
        financial_impact = post.estimated_value or int(points * POINT_VALUE)

        if month not in monthly:
            monthly[month] = {
                "month": month,
                "points": 0,
                "count": 0,
                "financial_impact": 0,
            }

        monthly[month]["points"] += points
        monthly[month]["count"] += 1
        monthly[month]["financial_impact"] += financial_impact

    result = sorted(monthly.values(), key=lambda x: x["month"])

    for item in result:
        item["points"] = round(item["points"], 1)

    return result