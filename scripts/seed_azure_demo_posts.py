import requests
import random
from datetime import datetime

API_URL = "https://human-capital-os-api.onrender.com/api/posts"

demo_posts = [
    {
        "employee_name": "逕ｰ荳ｭ蛛･荳",
        "department": "讌ｭ蜍咎°逕ｨ驛ｨ髢",
        "category": "improvement",
        "behavior": "FAQ繝・Φ繝励Ξ繝ｼ繝医ｒ謾ｹ蝟・＠縲∝ｯｾ蠢懈凾髢薙ｒ遏ｭ邵ｮ",
        "self_points": 5,
    },
    {
        "employee_name": "菴占陸鄒主調",
        "department": "蝟ｶ讌ｭ驛ｨ",
        "category": "challenge",
        "behavior": "鬘ｧ螳｢繝偵い繝ｪ繝ｳ繧ｰ鬆・岼繧定ｦ狗峩縺玲・邏・紫蜷台ｸ翫↓謖第姶",
        "self_points": 10,
    },
    {
        "employee_name": "驤ｴ譛ｨ諡謎ｹ・,
        "department": "譛ｬ遉ｾ",
        "category": "support",
        "behavior": "譁ｰ莠ｺ蜷代￠讌ｭ蜍吶・繝九Η繧｢繝ｫ繧呈紛蛯・,
        "self_points": 5,
    },
    {
        "employee_name": "鬮俶ｩ句━",
        "department": "讌ｭ蜍咎°逕ｨ驛ｨ髢",
        "category": "learning",
        "behavior": "逕滓・AI豢ｻ逕ｨ蜍牙ｼｷ莨壹ｒ閾ｪ荳ｻ髢句ぎ",
        "self_points": 10,
    },
    {
        "employee_name": "莨願陸蠖ｩ",
        "department": "蝟ｶ讌ｭ驛ｨ",
        "category": "improvement",
        "behavior": "蝠・ｫ・ｨ倬鹸蜈･蜉帙Ν繝ｼ繝ｫ繧堤ｵｱ荳",
        "self_points": 5,
    },
    {
        "employee_name": "貂｡霎ｺ隱",
        "department": "譛ｬ遉ｾ",
        "category": "challenge",
        "behavior": "莠ｺ逧・ｳ・悽KPI蛻・梵繝ｬ繝昴・繝医ｒ隧ｦ菴・,
        "self_points": 10,
    },
    {
        "employee_name": "螻ｱ譛ｬ逵溷､ｮ",
        "department": "讌ｭ蜍咎°逕ｨ驛ｨ髢",
        "category": "support",
        "behavior": "繧ｯ繝ｬ繝ｼ繝蜈ｱ譛峨ヵ繝ｭ繝ｼ繧呈隼蝟・,
        "self_points": 5,
    },
    {
        "employee_name": "荳ｭ譚台ｺｮ",
        "department": "蝟ｶ讌ｭ驛ｨ",
        "category": "learning",
        "behavior": "蝟ｶ讌ｭ繝医・繧ｯ蛻・梵繧但I縺ｧ螳滓命",
        "self_points": 10,
    },
    {
        "employee_name": "蟆乗棊逶ｴ讓ｹ",
        "department": "譛ｬ遉ｾ",
        "category": "improvement",
        "behavior": "莨夊ｭｰ雉・侭繝・Φ繝励Ξ繝ｼ繝医ｒ邨ｱ荳",
        "self_points": 5,
    },
    {
        "employee_name": "蜉阯､驕･",
        "department": "讌ｭ蜍咎°逕ｨ驛ｨ髢",
        "category": "challenge",
        "behavior": "蟇ｾ蠢懷刀雉ｪ繧ｹ繧ｳ繧｢謾ｹ蝟・命遲悶ｒ謠先｡・,
        "self_points": 10,
    },
]

for i in range(20):
    base = random.choice(demo_posts)

    payload = {
        "employee_name": base["employee_name"],
        "department": base["department"],
        "category": base["category"],
        "behavior": f"{base['behavior']} #{i+1}",
        "self_points": base["self_points"],
    }

    response = requests.post(API_URL, json=payload)

    print(
        f"{i+1:02d}",
        response.status_code,
        payload["department"],
        payload["behavior"]
    )
