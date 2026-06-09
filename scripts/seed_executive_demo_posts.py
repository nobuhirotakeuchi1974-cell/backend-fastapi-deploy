# scripts/seed_executive_demo_posts.py

import requests

BASE_URL = "https://human-capital-os-api.onrender.com"

USERNAME = "admin"
PASSWORD = "password123"


posts = [
    # =========================
    # 営業部：20件 / ROI-P 200P / 好調
    # =========================
    {
        "employee_name": "佐藤 健",
        "department": "営業部",
        "behavior": "既存顧客向けの提案資料を標準化し、若手でも短時間で提案準備できる状態に改善した。",
        "category": "improvement",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "営業生産性の向上に直結している。横展開したい。",
        "status": "approved",
        "created_at": "2026-01-10T09:00:00",
    },
    {
        "employee_name": "鈴木 彩",
        "department": "営業部",
        "behavior": "失注理由を商談ごとに記録し、次回提案時の改善ポイントとしてチームに共有した。",
        "category": "challenge",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "学びを次の行動に変えており、挑戦行動として評価できる。",
        "status": "approved",
        "created_at": "2026-01-18T10:00:00",
    },
    {
        "employee_name": "高橋 誠",
        "department": "営業部",
        "behavior": "商談後のフォロー連絡をテンプレート化し、対応漏れを減らした。",
        "category": "improvement",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "売上機会の損失防止につながる改善。",
        "status": "approved",
        "created_at": "2026-02-03T11:00:00",
    },
    {
        "employee_name": "中村 翔",
        "department": "営業部",
        "behavior": "顧客課題を深掘りし、追加提案につながるヒアリング項目を整備した。",
        "category": "challenge",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "営業行動の質を高めている。",
        "status": "approved",
        "created_at": "2026-02-12T14:00:00",
    },
    {
        "employee_name": "小林 直子",
        "department": "営業部",
        "behavior": "新人向けに営業トーク例をまとめ、提案品質のばらつきを減らした。",
        "category": "support",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "育成面で大きな貢献がある。",
        "status": "approved",
        "created_at": "2026-02-25T10:30:00",
    },
    {
        "employee_name": "渡辺 亮",
        "department": "営業部",
        "behavior": "過去の成功提案を分析し、商談前準備の型を作成した。",
        "category": "improvement",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "営業部全体のROI向上に貢献している。",
        "status": "approved",
        "created_at": "2026-03-04T09:30:00",
    },
    {
        "employee_name": "松本 優",
        "department": "営業部",
        "behavior": "顧客ごとの提案履歴を整理し、再提案のタイミングを見える化した。",
        "category": "improvement",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "再提案機会の創出につながっている。",
        "status": "approved",
        "created_at": "2026-03-11T13:20:00",
    },
    {
        "employee_name": "井上 拓也",
        "department": "営業部",
        "behavior": "若手の商談同席後に振り返りメモを共有し、改善ポイントを具体化した。",
        "category": "support",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "チーム全体の営業力向上に寄与している。",
        "status": "approved",
        "created_at": "2026-03-19T15:10:00",
    },
    {
        "employee_name": "木村 真由",
        "department": "営業部",
        "behavior": "顧客からの質問をFAQ化し、次回以降の回答スピードを上げた。",
        "category": "improvement",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "対応品質と効率の両面で効果がある。",
        "status": "approved",
        "created_at": "2026-03-27T09:40:00",
    },
    {
        "employee_name": "林 大地",
        "department": "営業部",
        "behavior": "商談前に顧客業界の変化を調べ、提案内容に反映した。",
        "category": "learning",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "学習を営業成果に接続している。",
        "status": "approved",
        "created_at": "2026-04-04T16:00:00",
    },
    {
        "employee_name": "清水 葵",
        "department": "営業部",
        "behavior": "受注後の顧客フォロー内容を整理し、継続取引につながる接点を増やした。",
        "category": "challenge",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "継続収益への貢献が期待できる。",
        "status": "approved",
        "created_at": "2026-04-12T11:30:00",
    },
    {
        "employee_name": "山口 航",
        "department": "営業部",
        "behavior": "チーム内の成功事例を週次で共有し、提案活動の再現性を高めた。",
        "category": "support",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "営業組織全体への波及効果がある。",
        "status": "approved",
        "created_at": "2026-04-19T10:10:00",
    },
    {
        "employee_name": "森田 花",
        "department": "営業部",
        "behavior": "顧客の断り文句を分類し、次回提案時の切り返し例を作成した。",
        "category": "improvement",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "失注率低下に向けた実践的な改善。",
        "status": "approved",
        "created_at": "2026-04-25T14:20:00",
    },
    {
        "employee_name": "池田 隼人",
        "department": "営業部",
        "behavior": "商談準備チェックリストを作成し、提案前の抜け漏れを防止した。",
        "category": "improvement",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "営業品質の安定化につながっている。",
        "status": "approved",
        "created_at": "2026-05-02T09:20:00",
    },
    {
        "employee_name": "橋本 玲奈",
        "department": "営業部",
        "behavior": "顧客の導入後課題を聞き取り、追加改善提案につなげた。",
        "category": "challenge",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "顧客理解から次の提案へつなげている。",
        "status": "approved",
        "created_at": "2026-05-09T15:40:00",
    },
    {
        "employee_name": "石井 颯太",
        "department": "営業部",
        "behavior": "営業会議で案件進捗の見える化を提案し、優先順位を共有できるようにした。",
        "category": "challenge",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "組織的な営業活動に貢献している。",
        "status": "approved",
        "created_at": "2026-05-17T10:50:00",
    },
    {
        "employee_name": "近藤 美優",
        "department": "営業部",
        "behavior": "提案後の顧客反応を記録し、次回訪問時の確認事項に反映した。",
        "category": "learning",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "行動改善のサイクルが回っている。",
        "status": "approved",
        "created_at": "2026-05-24T13:30:00",
    },
    {
        "employee_name": "斎藤 悠真",
        "department": "営業部",
        "behavior": "既存顧客への定期接点を整理し、休眠化しそうな顧客を早期に把握した。",
        "category": "improvement",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "売上維持に貢献する行動。",
        "status": "approved",
        "created_at": "2026-06-01T09:10:00",
    },
    {
        "employee_name": "岡田 莉子",
        "department": "営業部",
        "behavior": "他メンバーの成功提案を参考に、自分の提案資料を改善した。",
        "category": "learning",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "学習姿勢と改善行動が見える。",
        "status": "approved",
        "created_at": "2026-06-05T12:20:00",
    },
    {
        "employee_name": "藤井 陽介",
        "department": "営業部",
        "behavior": "商談後の次アクションを即日記録し、案件停滞を防いだ。",
        "category": "improvement",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "成果に直結する基本行動を徹底している。",
        "status": "approved",
        "created_at": "2026-06-08T17:00:00",
    },

    # =========================
    # 本社：8件 / ROI-P 80P / 安定
    # =========================
    {
        "employee_name": "田中 美咲",
        "department": "本社",
        "behavior": "月次報告資料の集計手順を整理し、担当者以外でも確認できるようにした。",
        "category": "support",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "業務の属人化解消に貢献している。",
        "status": "approved",
        "created_at": "2026-02-06T09:30:00",
    },
    {
        "employee_name": "加藤 優",
        "department": "本社",
        "behavior": "問い合わせ対応のFAQを更新し、確認時間を削減した。",
        "category": "improvement",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "地道だが効果のある改善。",
        "status": "approved",
        "created_at": "2026-02-21T16:00:00",
    },
    {
        "employee_name": "吉田 真央",
        "department": "本社",
        "behavior": "稟議資料の確認観点を一覧化し、差し戻しを減らした。",
        "category": "improvement",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "本社業務の効率化に寄与している。",
        "status": "approved",
        "created_at": "2026-03-08T11:10:00",
    },
    {
        "employee_name": "前田 一樹",
        "department": "本社",
        "behavior": "部門横断の依頼事項を整理し、期限管理の見落としを防止した。",
        "category": "support",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "調整業務の安定化につながっている。",
        "status": "approved",
        "created_at": "2026-03-23T13:40:00",
    },
    {
        "employee_name": "長谷川 愛",
        "department": "本社",
        "behavior": "会議資料の事前確認フローを改善し、当日の確認時間を短縮した。",
        "category": "improvement",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "会議運営の質向上に貢献している。",
        "status": "approved",
        "created_at": "2026-04-09T10:00:00",
    },
    {
        "employee_name": "村上 直樹",
        "department": "本社",
        "behavior": "過去の問い合わせ履歴を整理し、同様の質問に短時間で回答できるようにした。",
        "category": "learning",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "学習を業務改善につなげている。",
        "status": "approved",
        "created_at": "2026-04-28T15:30:00",
    },
    {
        "employee_name": "福田 菜々",
        "department": "本社",
        "behavior": "新任者向けに月次業務の流れをまとめ、引き継ぎ負荷を下げた。",
        "category": "support",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "組織知化に貢献している。",
        "status": "approved",
        "created_at": "2026-05-14T09:50:00",
    },
    {
        "employee_name": "太田 翼",
        "department": "本社",
        "behavior": "経費処理のよくある不備を整理し、部門向けに注意点を共有した。",
        "category": "improvement",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "ミス削減に向けた実務的な改善。",
        "status": "approved",
        "created_at": "2026-06-02T14:10:00",
    },

    # =========================
    # 業務運用部門：12件 / 承認9件120P + 未承認3件 / 要支援
    # =========================
    {
        "employee_name": "山本 大輔",
        "department": "業務運用部門",
        "behavior": "日次確認作業のチェックリストを作成し、確認漏れを減らした。",
        "category": "improvement",
        "self_points": 10,
        "manager_points": 15,
        "manager_comment": "現場改善として効果が見える。継続を期待する。",
        "status": "approved",
        "created_at": "2026-01-22T13:00:00",
    },
    {
        "employee_name": "伊藤 蓮",
        "department": "業務運用部門",
        "behavior": "処理遅延の原因を記録し、翌週の改善会議で共有した。",
        "category": "learning",
        "self_points": 10,
        "manager_points": 15,
        "manager_comment": "原因把握から改善提案につながっている。",
        "status": "approved",
        "created_at": "2026-02-15T09:00:00",
    },
    {
        "employee_name": "阿部 翔太",
        "department": "業務運用部門",
        "behavior": "新人が迷いやすい判断基準をメモ化し、確認回数を減らした。",
        "category": "support",
        "self_points": 10,
        "manager_points": 15,
        "manager_comment": "チーム支援として有効。",
        "status": "approved",
        "created_at": "2026-03-02T10:20:00",
    },
    {
        "employee_name": "遠藤 美緒",
        "department": "業務運用部門",
        "behavior": "エラー発生時の初動対応を整理し、一次対応の迷いを減らした。",
        "category": "improvement",
        "self_points": 10,
        "manager_points": 15,
        "manager_comment": "安定運用に貢献している。",
        "status": "approved",
        "created_at": "2026-03-18T15:30:00",
    },
    {
        "employee_name": "青木 大和",
        "department": "業務運用部門",
        "behavior": "繁忙時間帯の作業分担を見直し、特定メンバーへの偏りを軽減した。",
        "category": "challenge",
        "self_points": 10,
        "manager_points": 15,
        "manager_comment": "現場の負荷平準化につながる取り組み。",
        "status": "approved",
        "created_at": "2026-04-06T12:00:00",
    },
    {
        "employee_name": "藤田 彩花",
        "department": "業務運用部門",
        "behavior": "照会が多い処理ルールを一覧化し、確認時間を短縮した。",
        "category": "improvement",
        "self_points": 10,
        "manager_points": 15,
        "manager_comment": "実務改善として評価できる。",
        "status": "approved",
        "created_at": "2026-04-20T11:40:00",
    },
    {
        "employee_name": "西村 拓",
        "department": "業務運用部門",
        "behavior": "過去のミス事例を整理し、朝礼で注意ポイントを共有した。",
        "category": "learning",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "再発防止への意識が見える。",
        "status": "approved",
        "created_at": "2026-05-07T09:10:00",
    },
    {
        "employee_name": "原田 結衣",
        "department": "業務運用部門",
        "behavior": "月末処理の進捗を一覧で確認できるようにし、対応遅れを早期に把握した。",
        "category": "improvement",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "業務遅延の予防に貢献している。",
        "status": "approved",
        "created_at": "2026-05-22T16:20:00",
    },
    {
        "employee_name": "宮崎 亮",
        "department": "業務運用部門",
        "behavior": "複数担当にまたがる確認事項を整理し、二重確認の重複を減らした。",
        "category": "support",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "連携面の改善として評価できる。",
        "status": "approved",
        "created_at": "2026-06-03T13:00:00",
    },
    {
        "employee_name": "坂本 一真",
        "department": "業務運用部門",
        "behavior": "承認待ち案件の滞留理由を整理し、改善案を提出した。",
        "category": "challenge",
        "self_points": 10,
        "status": "pending",
        "created_at": "2026-06-06T09:00:00",
    },
    {
        "employee_name": "森 彩乃",
        "department": "業務運用部門",
        "behavior": "新人からの質問が多い処理を洗い出し、簡易マニュアル案を作成した。",
        "category": "support",
        "self_points": 10,
        "status": "pending",
        "created_at": "2026-06-07T10:30:00",
    },
    {
        "employee_name": "小川 智也",
        "department": "業務運用部門",
        "behavior": "処理件数が集中する時間帯を記録し、シフト配置見直しの材料を作った。",
        "category": "learning",
        "self_points": 10,
        "status": "pending",
        "created_at": "2026-06-08T15:00:00",
    },
]


def login() -> str:
    res = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": USERNAME, "password": PASSWORD},
        timeout=30,
    )
    print("login:", res.status_code, res.text)
    res.raise_for_status()
    return res.json()["access_token"]


def create_post(headers: dict, item: dict) -> int:
    payload = {
        "employee_name": item["employee_name"],
        "department": item["department"],
        "behavior": item["behavior"],
        "category": item["category"],
        "self_points": item["self_points"],
        "created_at": item["created_at"],
    }

    res = requests.post(
        f"{BASE_URL}/api/posts",
        json=payload,
        headers=headers,
        timeout=30,
    )
    print("create:", res.status_code, res.text)
    res.raise_for_status()

    data = res.json()
    post_id = data.get("id") or data.get("data", {}).get("id")

    if not post_id:
        raise RuntimeError(f"投稿IDが取得できません: {data}")

    return post_id


def review_post(headers: dict, post_id: int, item: dict) -> None:
    payload = {
        "status": "approved",
        "manager_points": item["manager_points"],
        "manager_comment": item["manager_comment"],
    }

    res = requests.put(
        f"{BASE_URL}/api/posts/{post_id}/review",
        json=payload,
        headers=headers,
        timeout=30,
    )
    print("review:", res.status_code, res.text)
    res.raise_for_status()


def main():
    print("=== Executive demo seed start ===")

    token = login()
    headers = {"Authorization": f"Bearer {token}"}

    created_count = 0
    approved_count = 0
    pending_count = 0
    total_roi_points = 0

    for item in posts:
        post_id = create_post(headers, item)
        created_count += 1

        if item["status"] == "approved":
            review_post(headers, post_id, item)
            approved_count += 1
            total_roi_points += item["manager_points"]
        else:
            pending_count += 1
            print(f"pending kept: post_id={post_id}")

    print("=== Executive demo seed completed ===")
    print(f"created_count: {created_count}")
    print(f"approved_count: {approved_count}")
    print(f"pending_count: {pending_count}")
    print(f"total_roi_points: {total_roi_points}")
    print(f"financial_impact: {total_roi_points * 100000:,} 円")


if __name__ == "__main__":
    main()