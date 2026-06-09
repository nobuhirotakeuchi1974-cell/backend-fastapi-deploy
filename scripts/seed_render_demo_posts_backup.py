import requests

BASE_URL = "https://human-capital-os-api.onrender.com"

posts = [
    {"employee_name":"佐藤 太郎","department":"営業部","category":"challenge","behavior":"既存顧客への提案資料を自主的に改善し、商談化率向上に貢献した。","self_points":10},
    {"employee_name":"鈴木 花子","department":"営業部","category":"improvement","behavior":"問い合わせ対応フローを見直し、一次回答までの時間短縮に貢献した。","self_points":10},
    {"employee_name":"田中 一郎","department":"営業部","category":"support","behavior":"新人メンバーの商談準備を支援し、チーム全体の対応品質を高めた。","self_points":5},
    {"employee_name":"山本 美咲","department":"本社","category":"learning","behavior":"人的資本経営に関する資料を学習し、部門内で共有した。","self_points":5},
    {"employee_name":"高橋 健","department":"本社","category":"improvement","behavior":"月次レポートの集計手順を整理し、作業時間を削減した。","self_points":10},
    {"employee_name":"伊藤 彩","department":"業務運用部門","category":"challenge","behavior":"繁忙時間帯の受付体制を見直し、対応漏れ防止に取り組んだ。","self_points":10},
    {"employee_name":"渡辺 翔","department":"業務運用部門","category":"support","behavior":"他メンバーのエスカレーション対応を支援し、顧客対応の安定化に貢献した。","self_points":5},
    {"employee_name":"中村 優","department":"営業部","category":"challenge","behavior":"失注理由を整理し、次回提案に活かせる改善メモを作成した。","self_points":10},
    {"employee_name":"小林 亮","department":"本社","category":"support","behavior":"部門横断の会議準備を支援し、議論の円滑化に貢献した。","self_points":5},
    {"employee_name":"加藤 真由","department":"業務運用部門","category":"improvement","behavior":"よくある確認事項を一覧化し、確認ミスの削減に貢献した。","self_points":10},
]

for post in posts:
    r = requests.post(f"{BASE_URL}/api/posts", json=post)
    print(r.status_code, r.text)
