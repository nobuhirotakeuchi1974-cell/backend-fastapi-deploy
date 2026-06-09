import requests

BASE_URL = "https://human-capital-os-api.onrender.com"

USERNAME = "admin"
PASSWORD = "password123"


posts = [
    {
        "employee_name": "営業部 高評価01",
        "department": "営業部",
        "behavior": "既存顧客の利用状況を分析し、追加提案につながる商談リストを作成した。",
        "category": "challenge",
        "self_points": 90,
        "manager_points": 95,
        "manager_comment": "売上機会の創出につながる非常に良い挑戦。",
        "created_at": "2026-03-05T09:00:00",
    },
    {
        "employee_name": "営業部 高評価02",
        "department": "営業部",
        "behavior": "失注理由を整理し、次回提案時の改善ポイントをチームへ共有した。",
        "category": "learning",
        "self_points": 85,
        "manager_points": 90,
        "manager_comment": "学びを組織知に変えている点を評価。",
        "created_at": "2026-03-12T10:00:00",
    },
    {
        "employee_name": "営業部 高評価03",
        "department": "営業部",
        "behavior": "新人向けに商談前チェックリストを作成し、提案品質のばらつきを抑えた。",
        "category": "support",
        "self_points": 90,
        "manager_points": 95,
        "manager_comment": "育成と標準化の両面で貢献度が高い。",
        "created_at": "2026-04-04T09:30:00",
    },
    {
        "employee_name": "営業部 高評価04",
        "department": "営業部",
        "behavior": "顧客課題を起点に提案資料を再構成し、提案内容の説得力を高めた。",
        "category": "improvement",
        "self_points": 95,
        "manager_points": 100,
        "manager_comment": "営業成果に直結する改善。横展開したい。",
        "created_at": "2026-04-15T11:00:00",
    },
    {
        "employee_name": "営業部 高評価05",
        "department": "営業部",
        "behavior": "商談後のフォロー手順を見直し、対応漏れを防ぐ仕組みを作った。",
        "category": "improvement",
        "self_points": 90,
        "manager_points": 95,
        "manager_comment": "継続的な売上機会の創出に貢献。",
        "created_at": "2026-04-25T15:00:00",
    },
    {
        "employee_name": "営業部 高評価06",
        "department": "営業部",
        "behavior": "成功商談の進め方を分解し、チーム内で再現できる型として共有した。",
        "category": "learning",
        "self_points": 95,
        "manager_points": 100,
        "manager_comment": "個人の成果を組織の成果に変換している。",
        "created_at": "2026-05-02T09:00:00",
    },
    {
        "employee_name": "営業部 高評価07",
        "department": "営業部",
        "behavior": "顧客からの相談内容を分類し、次回提案の切り口を整理した。",
        "category": "challenge",
        "self_points": 90,
        "manager_points": 95,
        "manager_comment": "顧客理解を深める行動として高く評価。",
        "created_at": "2026-05-08T10:30:00",
    },
    {
        "employee_name": "営業部 高評価08",
        "department": "営業部",
        "behavior": "営業資料の説明順序を見直し、初回商談でも価値が伝わりやすい構成にした。",
        "category": "improvement",
        "self_points": 95,
        "manager_points": 100,
        "manager_comment": "提案品質の向上に直結している。",
        "created_at": "2026-05-14T13:00:00",
    },
    {
        "employee_name": "営業部 高評価09",
        "department": "営業部",
        "behavior": "若手メンバーの商談準備に同席し、顧客課題の整理方法を支援した。",
        "category": "support",
        "self_points": 90,
        "manager_points": 95,
        "manager_comment": "チーム全体の底上げに貢献。",
        "created_at": "2026-05-21T09:30:00",
    },
    {
        "employee_name": "営業部 高評価10",
        "department": "営業部",
        "behavior": "受注後の顧客フォローを強化し、追加相談につながる接点を増やした。",
        "category": "challenge",
        "self_points": 95,
        "manager_points": 100,
        "manager_comment": "継続取引につながる重要な行動。",
        "created_at": "2026-05-28T16:00:00",
    },
    {
        "employee_name": "営業部 高評価11",
        "department": "営業部",
        "behavior": "商談議事録の要点を標準化し、次アクションの抜け漏れを防いだ。",
        "category": "improvement",
        "self_points": 90,
        "manager_points": 95,
        "manager_comment": "営業活動の精度向上に寄与。",
        "created_at": "2026-06-01T09:00:00",
    },
    {
        "employee_name": "営業部 高評価12",
        "department": "営業部",
        "behavior": "過去の提案成功事例を整理し、顧客業種別の提案パターンを作成した。",
        "category": "learning",
        "self_points": 95,
        "manager_points": 100,
        "manager_comment": "再現性のある営業知に変換できている。",
        "created_at": "2026-06-03T10:00:00",
    },
    {
        "employee_name": "営業部 高評価13",
        "department": "営業部",
        "behavior": "チーム内で商談ロールプレイを実施し、提案前の準備品質を高めた。",
        "category": "support",
        "self_points": 90,
        "manager_points": 95,
        "manager_comment": "周囲を巻き込む良い支援行動。",
        "created_at": "2026-06-04T11:00:00",
    },
    {
        "employee_name": "営業部 高評価14",
        "department": "営業部",
        "behavior": "顧客の未解決課題を一覧化し、次回訪問時の提案テーマを明確にした。",
        "category": "challenge",
        "self_points": 95,
        "manager_points": 100,
        "manager_comment": "提案機会の拡大に直結している。",
        "created_at": "2026-06-05T14:00:00",
    },
    {
        "employee_name": "営業部 高評価15",
        "department": "営業部",
        "behavior": "営業活動の振り返り会を自主的に企画し、成功要因と改善点を共有した。",
        "category": "learning",
        "self_points": 90,
        "manager_points": 95,
        "manager_comment": "行動変容の循環を生む良い取り組み。",
        "created_at": "2026-06-06T09:30:00",
    },
    {
        "employee_name": "業務運用 低評価01",
        "department": "業務運用部門",
        "behavior": "チェックリストを更新したが、運用定着や効果検証までは実施できていない。",
        "category": "improvement",
        "self_points": 60,
        "manager_points": 25,
        "manager_comment": "改善意欲はあるが、実行効果の確認が不足している。",
        "created_at": "2026-06-02T10:00:00",
    },
    {
        "employee_name": "業務運用 低評価02",
        "department": "業務運用部門",
        "behavior": "処理ミスの原因を記録したが、再発防止策の具体化には至っていない。",
        "category": "learning",
        "self_points": 55,
        "manager_points": 20,
        "manager_comment": "学びを改善行動につなげる必要がある。",
        "created_at": "2026-06-03T13:00:00",
    },
    {
        "employee_name": "業務運用 低評価03",
        "department": "業務運用部門",
        "behavior": "業務手順の見直し案を出したが、関係者への共有が限定的だった。",
        "category": "challenge",
        "self_points": 60,
        "manager_points": 30,
        "manager_comment": "提案だけで終わらず、周囲を巻き込む行動が必要。",
        "created_at": "2026-06-04T15:00:00",
    },
]


def login():
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": USERNAME, "password": PASSWORD},
        timeout=30,
    )
    print("login:", response.status_code, response.text)
    response.raise_for_status()
    return response.json()["access_token"]


def create_post(token, item):
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "employee_name": item["employee_name"],
        "department": item["department"],
        "behavior": item["behavior"],
        "category": item["category"],
        "self_points": item["self_points"],
        "created_at": item["created_at"],
    }

    response = requests.post(
        f"{BASE_URL}/api/posts",
        json=payload,
        headers=headers,
        timeout=30,
    )
    print("create:", response.status_code, response.text)
    response.raise_for_status()

    data = response.json()
    post_id = data.get("id") or data.get("data", {}).get("id")

    if not post_id:
        raise RuntimeError(f"投稿IDが取得できません: {data}")

    return post_id


def approve_post(token, post_id, item):
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "status": "approved",
        "manager_points": item["manager_points"],
        "manager_comment": item["manager_comment"],
    }

    response = requests.put(
        f"{BASE_URL}/api/posts/{post_id}/review",
        json=payload,
        headers=headers,
        timeout=30,
    )
    print("review:", response.status_code, response.text)
    response.raise_for_status()


def main():
    token = login()

    for item in posts:
        post_id = create_post(token, item)
        approve_post(token, post_id, item)

    print("Sales high-score and operation low-score posts seeded successfully.")


if __name__ == "__main__":
    main()