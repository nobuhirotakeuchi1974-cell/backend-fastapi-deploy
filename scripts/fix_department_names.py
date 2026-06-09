import requests

BASE_URL = "https://tech0-gen-11-step3-2-py-62.azurewebsites.net"

USERNAME = "admin"
PASSWORD = "password123"

# login
login_res = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={
        "username": USERNAME,
        "password": PASSWORD,
    },
)

login_res.raise_for_status()

token = login_res.json()["access_token"]

headers = {
    "Authorization": f"Bearer {token}"
}

# get posts
posts_res = requests.get(
    f"{BASE_URL}/api/posts",
    headers=headers,
)

posts_res.raise_for_status()

posts = posts_res.json()

print("posts:", len(posts))

# 修正マップ
replace_map = {
    "??": "業務運用部門",
    "???": "営業部",
    "????": "本社",
    "?????": "本社",
    "??????": "業務運用部門",
}

for post in posts:

    dept = post.get("department", "")

    if dept in replace_map:

        new_department = replace_map[dept]

        payload = {
            "employee_name": post["employee_name"],
            "department": new_department,
            "category": post["category"],
            "behavior": post["behavior"],
            "self_points": post["self_points"],
        }

        res = requests.put(
            f"{BASE_URL}/api/posts/{post['id']}",
            json=payload,
            headers=headers,
        )

        print(
            post["id"],
            dept,
            "→",
            new_department,
            res.status_code
        )