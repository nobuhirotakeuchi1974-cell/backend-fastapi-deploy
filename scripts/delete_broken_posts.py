import requests

BASE_URL = "https://tech0-gen-11-step3-2-py-62.azurewebsites.net"

USERNAME = "admin"
PASSWORD = "password123"

login_res = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={
        "username": USERNAME,
        "password": PASSWORD,
    },
)

token = login_res.json()["access_token"]

headers = {
    "Authorization": f"Bearer {token}"
}

posts_res = requests.get(
    f"{BASE_URL}/api/posts",
    headers=headers,
)

posts = posts_res.json()

broken_posts = []

for p in posts:

    values = [
        str(p.get("employee_name", "")),
        str(p.get("department", "")),
        str(p.get("behavior", "")),
    ]

    if "?" in "".join(values):
        broken_posts.append(p)

print("broken:", len(broken_posts))

for p in broken_posts:

    res = requests.delete(
        f"{BASE_URL}/api/posts/{p['id']}",
        headers=headers,
    )

    print(
        p["id"],
        res.status_code
    )