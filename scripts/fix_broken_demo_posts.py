import requests

BASE_URL = "https://tech0-gen-11-step3-2-py-62.azurewebsites.net"

USERNAME = "admin"
PASSWORD = "password123"

clean_samples = [
    {
        "employee_name": "田中健一",
        "department": "業務運用部門",
        "category": "improvement",
        "behavior": "FAQテンプレートを改善し、問い合わせ対応時間を短縮した",
        "self_points": 5,
        "manager_points": 5,
        "manager_comment": "現場改善活動として有効。継続推奨。",
    },
    {
        "employee_name": "佐藤美咲",
        "department": "営業部",
        "category": "challenge",
        "behavior": "顧客ヒアリング項目を見直し、提案品質の向上に取り組んだ",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "全社展開可能な改善施策として評価。",
    },
    {
        "employee_name": "鈴木拓也",
        "department": "本社",
        "category": "support",
        "behavior": "新人向け業務マニュアルを整備し、教育工数を削減した",
        "self_points": 5,
        "manager_points": 5,
        "manager_comment": "教育効率化に寄与する取り組みとして承認。",
    },
    {
        "employee_name": "高橋優",
        "department": "業務運用部門",
        "category": "learning",
        "behavior": "生成AI活用の勉強会を開催し、部門内の活用理解を高めた",
        "self_points": 10,
        "manager_points": 10,
        "manager_comment": "部門連携強化と生産性向上に繋がる行動として評価。",
    },
    {
        "employee_name": "伊藤彩",
        "department": "営業部",
        "category": "improvement",
        "behavior": "商談記録の入力ルールを統一し、情報共有の質を改善した",
        "self_points": 5,
        "manager_points": 5,
        "manager_comment": "業務標準化につながる改善として承認。",
    },
]

def is_broken(post):
    values = [
        post.get("employee_name", ""),
        post.get("department", ""),
        post.get("behavior", ""),
        post.get("category", ""),
    ]
    return any("?" in str(v) for v in values)

login_res = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"username": USERNAME, "password": PASSWORD},
)
login_res.raise_for_status()

token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

posts_res = requests.get(f"{BASE_URL}/api/posts", headers=headers)
posts_res.raise_for_status()

posts = posts_res.json()
broken_posts = [p for p in posts if is_broken(p)]

print(f"broken posts: {len(broken_posts)}")

for index, post in enumerate(broken_posts):
    sample = clean_samples[index % len(clean_samples)]

    update_payload = {
        "employee_name": sample["employee_name"],
        "department": sample["department"],
        "category": sample["category"],
        "behavior": f"{sample['behavior']} #{index + 1}",
        "self_points": sample["self_points"],
    }

    update_res = requests.put(
        f"{BASE_URL}/api/posts/{post['id']}",
        json=update_payload,
        headers=headers,
    )

    print(
        "update",
        post["id"],
        update_res.status_code,
        update_payload["department"],
        update_payload["behavior"],
    )

    review_payload = {
        "status": "approved",
        "manager_points": sample["manager_points"],
        "manager_comment": sample["manager_comment"],
    }

    review_res = requests.put(
        f"{BASE_URL}/api/posts/{post['id']}/review",
        json=review_payload,
        headers=headers,
    )

    print(
        "review",
        post["id"],
        review_res.status_code,
        f"{sample['manager_points']}P",
        sample["manager_comment"],
    )