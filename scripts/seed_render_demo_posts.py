import requests

BASE_URL = "https://human-capital-os-api.onrender.com"

USERNAME = "admin"
PASSWORD = "password123"

posts = [
    # 1月
    {"employee_name": "佐藤 健", "department": "営業部", "behavior": "既存顧客への提案資料を標準化し、若手でも短時間で提案準備できる形に改善した。", "category": "improvement", "self_points": 5, "manager_points": 5, "manager_comment": "営業準備時間の削減に貢献している。", "created_at": "2026-01-08T09:00:00"},
    {"employee_name": "鈴木 彩", "department": "営業部", "behavior": "失注理由をチームで共有し、次回提案時の改善ポイントを整理した。", "category": "learning", "self_points": 1, "manager_points": 1, "manager_comment": "小さな学習行動として評価できる。", "created_at": "2026-01-12T10:00:00"},
    {"employee_name": "田中 美咲", "department": "本社", "behavior": "月次報告資料の確認手順を整理し、担当者以外でも確認できるようにした。", "category": "support", "self_points": 1, "manager_points": 1, "manager_comment": "属人化解消に向けた良い取り組み。", "created_at": "2026-01-15T09:30:00"},
    {"employee_name": "山本 大輔", "department": "業務運用部門", "behavior": "日次確認作業のチェックリストを作成した。", "category": "improvement", "self_points": 1, "manager_points": 1, "manager_comment": "ミス防止に役立つ基礎的な改善。", "created_at": "2026-01-18T13:00:00"},
    {"employee_name": "高橋 誠", "department": "営業部", "behavior": "商談後のフォロー連絡を仕組み化し、対応漏れを減らした。", "category": "improvement", "self_points": 5, "manager_points": 5, "manager_comment": "営業活動の品質安定に貢献している。", "created_at": "2026-01-23T11:00:00"},

    # 2月
    {"employee_name": "加藤 優", "department": "本社", "behavior": "問い合わせ対応のFAQを更新し、確認時間を削減した。", "category": "improvement", "self_points": 5, "manager_points": 5, "manager_comment": "問い合わせ対応の標準化に効果がある。", "created_at": "2026-02-03T10:00:00"},
    {"employee_name": "伊藤 蓮", "department": "業務運用部門", "behavior": "処理遅延の原因を記録し、翌週の改善会議で共有した。", "category": "learning", "self_points": 1, "manager_points": 1, "manager_comment": "改善の入口として評価できる。", "created_at": "2026-02-06T09:00:00"},
    {"employee_name": "中村 翔", "department": "営業部", "behavior": "顧客の課題をヒアリングし、追加提案につなげた。", "category": "challenge", "self_points": 5, "manager_points": 10, "manager_comment": "売上機会創出につながる大きな挑戦行動。", "created_at": "2026-02-10T14:00:00"},
    {"employee_name": "小林 直子", "department": "営業部", "behavior": "新人向けに営業トーク例をまとめ、チーム全体の提案品質を底上げした。", "category": "support", "self_points": 5, "manager_points": 5, "manager_comment": "育成面での部門貢献がある。", "created_at": "2026-02-14T10:30:00"},
    {"employee_name": "渡辺 亮", "department": "営業部", "behavior": "過去の成功提案を分析し、商談前準備の型を作成した。", "category": "improvement", "self_points": 5, "manager_points": 5, "manager_comment": "横展開しやすい改善。", "created_at": "2026-02-18T09:30:00"},
    {"employee_name": "森 由香", "department": "本社", "behavior": "定例会議の議事録フォーマットを見直し、決定事項が追いやすい形にした。", "category": "improvement", "self_points": 1, "manager_points": 1, "manager_comment": "小さな改善だが会議品質向上に寄与。", "created_at": "2026-02-24T15:00:00"},

    # 3月
    {"employee_name": "橋本 拓也", "department": "業務運用部門", "behavior": "差戻しが多い処理について、確認ポイントを一覧化した。", "category": "improvement", "self_points": 5, "manager_points": 5, "manager_comment": "差戻し削減に効果が見込める。", "created_at": "2026-03-02T09:00:00"},
    {"employee_name": "清水 愛", "department": "営業部", "behavior": "提案前の確認項目を整理し、商談準備の抜け漏れを減らした。", "category": "improvement", "self_points": 1, "manager_points": 1, "manager_comment": "営業品質の安定につながる。", "created_at": "2026-03-05T10:00:00"},
    {"employee_name": "前田 航", "department": "営業部", "behavior": "大型顧客向けの提案資料を再構成し、他メンバーも活用できる形にした。", "category": "challenge", "self_points": 10, "manager_points": 10, "manager_comment": "部門横断で活用できる高い貢献。", "created_at": "2026-03-09T11:00:00"},
    {"employee_name": "藤井 千尋", "department": "本社", "behavior": "経費精算のよくある不備を整理し、申請前チェック資料を作成した。", "category": "improvement", "self_points": 5, "manager_points": 5, "manager_comment": "手戻り削減に貢献している。", "created_at": "2026-03-12T16:00:00"},
    {"employee_name": "岡田 真", "department": "業務運用部門", "behavior": "新人が迷いやすい処理手順をまとめ、OJTで使える資料にした。", "category": "support", "self_points": 5, "manager_points": 5, "manager_comment": "育成時間短縮に効果がある。", "created_at": "2026-03-16T13:00:00"},
    {"employee_name": "長谷川 葵", "department": "営業部", "behavior": "顧客からの質問を整理し、提案時の回答例としてチームに共有した。", "category": "learning", "self_points": 1, "manager_points": 1, "manager_comment": "ナレッジ共有として評価できる。", "created_at": "2026-03-20T09:30:00"},
    {"employee_name": "石井 健太", "department": "本社", "behavior": "社内申請の締切リマインド方法を改善し、遅延を減らした。", "category": "improvement", "self_points": 1, "manager_points": 1, "manager_comment": "地道だが運用安定に貢献。", "created_at": "2026-03-25T10:00:00"},

    # 4月
    {"employee_name": "西村 絵里", "department": "営業部", "behavior": "既存顧客の契約更新タイミングを一覧化し、提案漏れを防ぐ仕組みを作った。", "category": "improvement", "self_points": 5, "manager_points": 5, "manager_comment": "売上機会の取りこぼし防止に貢献。", "created_at": "2026-04-02T09:00:00"},
    {"employee_name": "林 大地", "department": "業務運用部門", "behavior": "夜間帯の引き継ぎメモを見直し、翌日の確認時間を短縮した。", "category": "support", "self_points": 1, "manager_points": 1, "manager_comment": "連携品質の改善として評価。", "created_at": "2026-04-04T18:00:00"},
    {"employee_name": "近藤 奈々", "department": "本社", "behavior": "社内問い合わせの分類を見直し、担当部署へ早くつながるようにした。", "category": "improvement", "self_points": 5, "manager_points": 5, "manager_comment": "対応時間削減につながる改善。", "created_at": "2026-04-07T14:00:00"},
    {"employee_name": "松本 翔太", "department": "営業部", "behavior": "顧客別の提案履歴を整理し、次回提案時に参照しやすくした。", "category": "improvement", "self_points": 1, "manager_points": 1, "manager_comment": "小さな改善だが継続効果がある。", "created_at": "2026-04-10T10:00:00"},
    {"employee_name": "井上 麻衣", "department": "営業部", "behavior": "新サービス提案の成功事例をまとめ、営業部内で横展開した。", "category": "challenge", "self_points": 10, "manager_points": 10, "manager_comment": "横展開効果が大きい高評価案件。", "created_at": "2026-04-15T11:00:00"},
    {"employee_name": "木村 悠", "department": "業務運用部門", "behavior": "処理ミスが起きやすい時間帯を分析し、確認担当を明確化した。", "category": "improvement", "self_points": 5, "manager_points": 5, "manager_comment": "品質安定に効果がある。", "created_at": "2026-04-18T13:00:00"},
    {"employee_name": "斎藤 玲奈", "department": "本社", "behavior": "資料保管ルールを整理し、過去資料を探す時間を短縮した。", "category": "improvement", "self_points": 1, "manager_points": 1, "manager_comment": "業務効率化につながる。", "created_at": "2026-04-22T15:00:00"},
    {"employee_name": "村上 颯", "department": "営業部", "behavior": "顧客対応で得た気づきを朝会で共有し、他メンバーの提案に活用した。", "category": "learning", "self_points": 1, "manager_points": 1, "manager_comment": "共有行動として良い。", "created_at": "2026-04-26T09:30:00"},

    # 5月
    {"employee_name": "青木 優斗", "department": "営業部", "behavior": "重点顧客向けの提案プロセスを見直し、提案から回答までのリードタイムを短縮した。", "category": "challenge", "self_points": 10, "manager_points": 10, "manager_comment": "営業成果に直結する大きな改善。", "created_at": "2026-05-01T09:00:00"},
    {"employee_name": "遠藤 美緒", "department": "本社", "behavior": "人事関連の問い合わせ回答例をまとめ、対応のばらつきを減らした。", "category": "support", "self_points": 5, "manager_points": 5, "manager_comment": "問い合わせ品質の安定に貢献。", "created_at": "2026-05-03T10:00:00"},
    {"employee_name": "坂本 涼", "department": "業務運用部門", "behavior": "月初に集中する確認作業を分散し、残業発生を抑えた。", "category": "improvement", "self_points": 5, "manager_points": 5, "manager_comment": "業務負荷平準化に効果がある。", "created_at": "2026-05-06T11:00:00"},
    {"employee_name": "福田 彩花", "department": "営業部", "behavior": "若手の商談同席後に振り返りメモを共有し、次回行動につなげた。", "category": "support", "self_points": 1, "manager_points": 1, "manager_comment": "育成行動として評価。", "created_at": "2026-05-08T17:00:00"},
    {"employee_name": "太田 直樹", "department": "営業部", "behavior": "競合比較表を更新し、提案時に顧客へ説明しやすい形にした。", "category": "improvement", "self_points": 5, "manager_points": 5, "manager_comment": "提案品質向上に貢献。", "created_at": "2026-05-10T14:00:00"},
    {"employee_name": "三浦 梨沙", "department": "本社", "behavior": "会議資料の提出期限を見える化し、準備遅れを減らした。", "category": "improvement", "self_points": 1, "manager_points": 1, "manager_comment": "小さな運用改善として評価。", "created_at": "2026-05-13T09:00:00"},
    {"employee_name": "原田 陸", "department": "業務運用部門", "behavior": "引き継ぎ時の確認項目を見直し、確認漏れを減らした。", "category": "support", "self_points": 1, "manager_points": 1, "manager_comment": "連携の安定化につながる。", "created_at": "2026-05-16T12:00:00"},
    {"employee_name": "宮本 沙織", "department": "営業部", "behavior": "顧客訪問後の記録内容を統一し、次回提案に活かしやすくした。", "category": "improvement", "self_points": 1, "manager_points": 1, "manager_comment": "ナレッジ蓄積に効果がある。", "created_at": "2026-05-18T16:00:00"},
    {"employee_name": "大野 翼", "department": "営業部", "behavior": "大型提案の進め方を整理し、複数メンバーが再利用できる資料にした。", "category": "challenge", "self_points": 10, "manager_points": 10, "manager_comment": "部門全体への波及効果が大きい。", "created_at": "2026-05-21T10:00:00"},
    {"employee_name": "野口 真央", "department": "本社", "behavior": "稟議書の差戻し理由を分類し、記載例を共有した。", "category": "improvement", "self_points": 5, "manager_points": 5, "manager_comment": "差戻し削減に有効。", "created_at": "2026-05-24T13:00:00"},

    # 6月
    {"employee_name": "久保 亮介", "department": "業務運用部門", "behavior": "処理件数が多い時間帯を見える化し、応援体制を組みやすくした。", "category": "improvement", "self_points": 5, "manager_points": 5, "manager_comment": "業務運用の安定化に貢献。", "created_at": "2026-06-01T09:00:00"},
    {"employee_name": "内田 花", "department": "営業部", "behavior": "顧客との会話で得たニーズを記録し、次回提案候補として整理した。", "category": "learning", "self_points": 1, "manager_points": 1, "manager_comment": "提案につながる良い学習行動。", "created_at": "2026-06-02T10:00:00"},
    {"employee_name": "平野 和也", "department": "本社", "behavior": "社内通知文のテンプレートを作成し、作成時間を短縮した。", "category": "improvement", "self_points": 1, "manager_points": 1, "manager_comment": "効率化につながる改善。", "created_at": "2026-06-03T11:00:00"},
    {"employee_name": "高木 美月", "department": "業務運用部門", "behavior": "新人が間違えやすい入力項目を整理し、説明資料に反映した。", "category": "support", "self_points": 1, "manager_points": 1, "manager_comment": "新人育成に役立つ。", "created_at": "2026-06-04T14:00:00"},
    {"employee_name": "菅原 智也", "department": "営業部", "behavior": "提案後の顧客反応を分類し、次回アプローチの優先順位付けに活用した。", "category": "challenge", "self_points": 5, "manager_points": 5, "manager_comment": "営業活動の質を高める取り組み。", "created_at": "2026-06-05T15:00:00"},
    {"employee_name": "安藤 香織", "department": "本社", "behavior": "部署間で重複していた確認作業を整理し、担当を明確化した。", "category": "improvement", "self_points": 5, "manager_points": 5, "manager_comment": "重複作業の削減に効果がある。", "created_at": "2026-06-06T09:30:00"},
    {"employee_name": "横山 司", "department": "業務運用部門", "behavior": "チェックリストの未使用項目を見直し、実態に合う形に更新した。", "category": "improvement", "self_points": 1, "manager_points": 1, "manager_comment": "運用品質の維持に役立つ。", "created_at": "2026-06-07T10:00:00"},
    {"employee_name": "川口 恵", "department": "営業部", "behavior": "成功商談の流れを短い資料にまとめ、朝会で共有した。", "category": "learning", "self_points": 1, "manager_points": 1, "manager_comment": "共有行動として良い。", "created_at": "2026-06-08T09:00:00"},
    {"employee_name": "柴田 悠真", "department": "本社", "behavior": "よくある申請ミスをまとめ、申請前に確認できる案内を作成した。", "category": "support", "self_points": 1, "manager_points": 1, "manager_comment": "問い合わせ削減に効果がある。", "created_at": "2026-06-09T13:00:00"},
    {"employee_name": "片山 紬", "department": "業務運用部門", "behavior": "月次処理の確認順序を見直し、確認漏れを減らした。", "category": "improvement", "self_points": 1, "manager_points": 1, "manager_comment": "安定運用に寄与している。", "created_at": "2026-06-10T16:00:00"},
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
    print(f"created posts: {len(posts)}")
    print(f"total ROI-P: {sum(item['manager_points'] for item in posts)}")
    print(f"estimated value: {sum(item['manager_points'] for item in posts) * 100000:,} yen")


if __name__ == "__main__":
    main()