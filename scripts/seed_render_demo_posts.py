import requests
from datetime import datetime

BASE_URL = "https://human-capital-os-api.onrender.com"

USERNAME = "admin"
PASSWORD = "password123"

posts = [
    {
        "employee_name": "佐藤 健",
        "department": "営業部",
        "behavior": "既存顧客への提案資料を標準化し、若手でも短時間で提案準備できる形に改善した。",
        "category": "improvement",
        "self_points": 80,
        "manager_points": 90,
        "manager_comment": "営業生産性への貢献が大きい。",
        "created_at": "2026-01-15T09:00:00",
    },
    {
        "employee_name": "鈴木 彩",
        "department": "営業部",
        "behavior": "失注理由をチームで共有し、次回提案時の改善ポイントを整理した。",
        "category": "challenge",
        "self_points": 75,
        "manager_points": 85,
        "manager_comment": "挑戦行動として評価できる。",
        "created_at": "2026-02-10T10:00:00",
    },
    {
        "employee_name": "高橋 誠",
        "department": "営業部",
        "behavior": "商談後のフォロー連絡を仕組み化し、対応漏れを減らした。",
        "category": "improvement",
        "self_points": 85,
        "manager_points": 95,
        "manager_comment": "売上貢献につながる良い改善。",
        "created_at": "2026-03-12T11:00:00",
    },
    {
        "employee_name": "田中 美咲",
        "department": "本社",
        "behavior": "月次報告資料の集計手順を整理し、担当者以外でも確認できるようにした。",
        "category": "support",
        "self_points": 60,
        "manager_points": 65,
        "manager_comment": "業務安定化に貢献している。",
        "created_at": "2026-03-20T09:30:00",
    },
    {
        "employee_name": "山本 大輔",
        "department": "業務運用部門",
        "behavior": "日次確認作業のチェックリストを作成した。",
        "category": "improvement",
        "self_points": 50,
        "manager_points": 45,
        "manager_comment": "改善はあるが、効果検証はこれから。",
        "created_at": "2026-04-05T13:00:00",
    },
    {
        "employee_name": "中村 翔",
        "department": "営業部",
        "behavior": "顧客の課題をヒアリングし、追加提案につなげた。",
        "category": "challenge",
        "self_points": 90,
        "manager_points": 100,
        "manager_comment": "非常に高い営業行動。横展開したい。",
        "created_at": "2026-04-18T14:00:00",
    },
    {
        "employee_name": "小林 直子",
        "department": "営業部",
        "behavior": "新人向けに営業トーク例をまとめ、チーム全体の提案品質を底上げした。",
        "category": "support",
        "self_points": 85,
        "manager_points": 90,
        "manager_comment": "育成面で大きな貢献。",
        "created_at": "2026-05-09T10:30:00",
    },
    {
        "employee_name": "加藤 優",
        "department": "本社",
        "behavior": "問い合わせ対応のFAQを更新し、確認時間を削減した。",
        "category": "improvement",
        "self_points": 65,
        "manager_points": 70,
        "manager_comment": "地道だが効果のある改善。",
        "created_at": "2026-05-15T16:00:00",
    },
    {
        "employee_name": "伊藤 蓮",
        "department": "業務運用部門",
        "behavior": "処理遅延の原因を記録し、翌週の改善会議で共有した。",
        "category": "learning",
        "self_points": 45,
        "manager_points": 40,
        "manager_comment": "次は具体的な改善実行まで期待。",
        "created_at": "2026-05-25T09:00:00",
    },
    {
        "employee_name": "渡辺 亮",
        "department": "営業部",
        "behavior": "過去の成功提案を分析し、商談前準備の型を作成した。",
        "category": "improvement",
        "self_points": 90,
        "manager_points": 100,
        "manager_comment": "営業部全体のROI向上に直結する取り組み。",
        "created_at": "2026-06-03T09:30:00",
    },
]


def main():
    login_res = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": USERNAME, "password": PASSWORD},
        timeout=30,
    )
    print("login:", login_res.status_code, login_res.text)
    login_res.raise_for_status()

    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    for item in posts:
        create_payload = {
            "employee_name": item["employee_name"],
            "department": item["department"],
            "behavior": item["behavior"],
            "category": item["category"],
            "self_points": item["self_points"],
            "created_at": item["created_at"],
        }

        create_res = requests.post(
            f"{BASE_URL}/api/posts",
            json=create_payload,
            headers=headers,
            timeout=30,
        )
        print("create:", create_res.status_code, create_res.text)
        create_res.raise_for_status()

        data = create_res.json()
        post_id = data.get("id") or data.get("data", {}).get("id")

        if not post_id:
            raise RuntimeError(f"投稿IDが取得できません: {data}")

        review_payload = {
            "status": "approved",
            "manager_points": item["manager_points"],
            "manager_comment": item["manager_comment"],
        }

        review_res = requests.put(
            f"{BASE_URL}/api/posts/{post_id}/review",
            json=review_payload,
            headers=headers,
            timeout=30,
        )
        print("review:", review_res.status_code, review_res.text)
        review_res.raise_for_status()

    print("Render demo posts seeded successfully.")


if __name__ == "__main__":
    main()