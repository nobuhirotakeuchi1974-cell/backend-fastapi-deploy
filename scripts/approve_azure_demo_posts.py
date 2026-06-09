import requests
import random

BASE_URL = "https://human-capital-os-api.onrender.com"

USERNAME = "admin"
PASSWORD = "password123"

comments = [
    "迴ｾ蝣ｴ謾ｹ蝟・ｴｻ蜍輔→縺励※譛牙柑縲らｶ咏ｶ壽耳螂ｨ縲・,
    "讌ｭ蜍吝柑邇・喧縺ｸ縺ｮ雋｢迪ｮ縺檎｢ｺ隱阪〒縺阪ｋ縺溘ａ謇ｿ隱阪・,
    "驛ｨ髢蜀・↓螻暮幕蜿ｯ閭ｽ縺ｪ謾ｹ蝟・｡悟虚縺ｨ縺励※隧穂ｾ｡縲・,
    "鬘ｧ螳｢蟇ｾ蠢懷刀雉ｪ縺ｮ蜷台ｸ翫↓蟇・ｸ弱☆繧玖｡悟虚縺ｨ縺励※謇ｿ隱阪・,
    "莠ｺ逧・ｳ・悽繧､繝ｳ繝代け繝医↓縺､縺ｪ縺後ｋ蜿悶ｊ邨・∩縺ｨ縺励※隧穂ｾ｡縲・,
]

# 1. login
login_res = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"username": USERNAME, "password": PASSWORD},
)

print("login:", login_res.status_code, login_res.text)

login_res.raise_for_status()
token = login_res.json()["access_token"]

headers = {"Authorization": f"Bearer {token}"}

# 2. get posts
posts_res = requests.get(f"{BASE_URL}/api/posts", headers=headers)
print("get posts:", posts_res.status_code)

posts_res.raise_for_status()
posts = posts_res.json()

# 3. pending縺ｮ縺ｿ謇ｿ隱・
pending_posts = [p for p in posts if p.get("status") == "pending"]

print(f"pending count: {len(pending_posts)}")

for p in pending_posts:
    point = random.choice([5, 5, 5, 10, 10])

    payload = {
        "status": "approved",
        "manager_points": point,
        "manager_comment": random.choice(comments),
    }

    res = requests.put(
        f"{BASE_URL}/api/posts/{p['id']}/review",
        json=payload,
        headers=headers,
    )

    print(
        p["id"],
        res.status_code,
        p.get("department"),
        f"{point}P",
        payload["manager_comment"],
    )
