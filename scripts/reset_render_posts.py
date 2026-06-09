# scripts/reset_render_posts.py

import requests

BASE_URL = "https://human-capital-os-api.onrender.com"

LOGIN_USER = "admin"
LOGIN_PASSWORD = "password123"


def login() -> str:
    url = f"{BASE_URL}/api/auth/login"
    payload = {
        "username": LOGIN_USER,
        "password": LOGIN_PASSWORD,
    }

    res = requests.post(url, json=payload, timeout=30)
    print("login:", res.status_code, res.text)

    res.raise_for_status()
    return res.json()["access_token"]


def fetch_posts(token: str) -> list[dict]:
    url = f"{BASE_URL}/api/posts"
    headers = {"Authorization": f"Bearer {token}"}

    res = requests.get(url, headers=headers, timeout=30)
    print("fetch posts:", res.status_code)

    res.raise_for_status()
    data = res.json()

    if isinstance(data, list):
        return data

    if isinstance(data, dict):
        return data.get("data", [])

    return []


def delete_post(token: str, post_id: int) -> None:
    url = f"{BASE_URL}/api/posts/{post_id}"
    headers = {"Authorization": f"Bearer {token}"}

    res = requests.delete(url, headers=headers, timeout=30)
    print(f"delete post_id={post_id}:", res.status_code, res.text)

    res.raise_for_status()


def main():
    print("=== Reset Render posts start ===")

    token = login()
    posts = fetch_posts(token)

    print(f"target posts: {len(posts)}")

    if not posts:
        print("削除対象の投稿はありません。")
        return

    for post in posts:
        post_id = post.get("id")
        if post_id is None:
            continue

        delete_post(token, post_id)

    print("=== Reset Render posts completed ===")


if __name__ == "__main__":
    main()