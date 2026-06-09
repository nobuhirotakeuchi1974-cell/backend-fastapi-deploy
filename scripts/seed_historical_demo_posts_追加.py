import requests

API_URL = "https://human-capital-os-api.onrender.com/api/posts"

demo_posts = [
    {"employee_name": "譽ｮ逕ｰ闊ｪ", "department": "讌ｭ蜍咎°逕ｨ驛ｨ髢", "category": "improvement", "behavior": "蝠上＞蜷医ｏ縺帛・鬘槭Ν繝ｼ繝ｫ繧定ｦ狗峩縺励∽ｸ谺｡蟇ｾ蠢懊・蛻､譁ｭ邊ｾ蠎ｦ繧帝ｫ倥ａ縺・, "self_points": 5, "created_at": "2026-01-10T09:00:00"},
    {"employee_name": "髟ｷ隹ｷ蟾晁揃", "department": "蝟ｶ讌ｭ驛ｨ", "category": "challenge", "behavior": "譌｢蟄倬｡ｧ螳｢蜷代￠謠先｡医す繝翫Μ繧ｪ繧貞・險ｭ險医＠縲∬ｿｽ蜉謠先｡育紫蜷台ｸ翫↓謖第姶縺励◆", "self_points": 10, "created_at": "2026-01-22T14:00:00"},
    {"employee_name": "遏ｳ蟾晉峩莠ｺ", "department": "譛ｬ遉ｾ", "category": "support", "behavior": "驛ｨ髢讓ｪ譁ｭ縺ｮ蝠上＞蜷医ｏ縺帷ｪ灘哨繧呈紛逅・＠縲∫｢ｺ隱榊ｷ･謨ｰ繧貞炎貂帙＠縺・, "self_points": 5, "created_at": "2026-02-04T10:30:00"},
    {"employee_name": "蟯｡逕ｰ闔牙ｭ・, "department": "讌ｭ蜍咎°逕ｨ驛ｨ髢", "category": "learning", "behavior": "蟇ｾ蠢懷刀雉ｪ縺ｮ螂ｽ莠倶ｾ九ｒ蜈ｱ譛峨＠縲√Γ繝ｳ繝舌・縺ｮ蛻､譁ｭ蝓ｺ貅悶ｒ縺昴ｍ縺医◆", "self_points": 5, "created_at": "2026-02-18T16:00:00"},
    {"employee_name": "阯､莠募､ｧ霈・, "department": "蝟ｶ讌ｭ驛ｨ", "category": "improvement", "behavior": "蝠・ｫ・ｾ後ヵ繧ｩ繝ｭ繝ｼ縺ｮ繝√ぉ繝・け繝ｪ繧ｹ繝医ｒ菴懈・縺励∝ｯｾ蠢懈ｼ上ｌ繧呈ｸ帙ｉ縺励◆", "self_points": 5, "created_at": "2026-02-26T11:00:00"},
    {"employee_name": "蜑咲伐鬥咏ｹ・, "department": "譛ｬ遉ｾ", "category": "challenge", "behavior": "莠ｺ逧・ｳ・悽繝繝・す繝･繝懊・繝峨・譛域ｬ｡繝ｬ繝薙Η繝ｼ譯医ｒ菴懈・縺励◆", "self_points": 10, "created_at": "2026-03-03T09:30:00"},
    {"employee_name": "驕阯､逵・, "department": "讌ｭ蜍咎°逕ｨ驛ｨ髢", "category": "support", "behavior": "譁ｰ莠ｺ縺ｮ繧ｨ繧ｹ繧ｫ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ蝓ｺ貅悶ｒ謨ｴ逅・＠縲∝愛譁ｭ縺ｮ霑ｷ縺・ｒ貂帙ｉ縺励◆", "self_points": 5, "created_at": "2026-03-11T13:00:00"},
    {"employee_name": "髱呈惠闖懊・, "department": "蝟ｶ讌ｭ驛ｨ", "category": "learning", "behavior": "螟ｱ豕ｨ逅・罰繧貞・鬘槭＠縲∝霧讌ｭ繝√・繝蜀・〒謾ｹ蝟・・繧､繝ｳ繝医ｒ蜈ｱ譛峨＠縺・, "self_points": 5, "created_at": "2026-03-19T15:30:00"},
    {"employee_name": "隘ｿ譚第あ", "department": "譛ｬ遉ｾ", "category": "improvement", "behavior": "莨夊ｭｰ縺ｮ莠句燕雉・侭繝輔か繝ｼ繝槭ャ繝医ｒ邨ｱ荳縺励∵э諤晄ｱｺ螳壽凾髢薙ｒ遏ｭ邵ｮ縺励◆", "self_points": 5, "created_at": "2026-03-27T10:00:00"},
    {"employee_name": "譚台ｸ雁ｽｩ荵・, "department": "讌ｭ蜍咎°逕ｨ驛ｨ髢", "category": "challenge", "behavior": "蟇ｾ蠢懷刀雉ｪ繧ｹ繧ｳ繧｢縺ｮ菴惹ｸ玖ｦ∝屏繧貞・譫舌＠縲∵隼蝟・命遲悶ｒ謠先｡医＠縺・, "self_points": 10, "created_at": "2026-04-02T09:00:00"},
    {"employee_name": "蜴溽伐蛛･", "department": "蝟ｶ讌ｭ驛ｨ", "category": "support", "behavior": "闍･謇九Γ繝ｳ繝舌・縺ｮ謠先｡郁ｳ・侭菴懈・繧呈髪謠ｴ縺励∵署譯亥刀雉ｪ繧貞ｺ穂ｸ翫￡縺励◆", "self_points": 5, "created_at": "2026-04-08T14:30:00"},
    {"employee_name": "譚ｾ譛ｬ邨占｡｣", "department": "譛ｬ遉ｾ", "category": "learning", "behavior": "莠ｺ逧・ｳ・悽KPI縺ｮ隱ｭ縺ｿ隗｣縺榊級蠑ｷ莨壹ｒ螳滓命縺励・Κ髢逅・ｧ｣繧帝ｫ倥ａ縺・, "self_points": 10, "created_at": "2026-04-16T16:00:00"},
    {"employee_name": "豎逕ｰ豸ｼ", "department": "讌ｭ蜍咎°逕ｨ驛ｨ髢", "category": "improvement", "behavior": "FAQ讀懃ｴ｢繧ｭ繝ｼ繝ｯ繝ｼ繝峨ｒ隕狗峩縺励∝屓遲泌芦驕斐∪縺ｧ縺ｮ譎る俣繧堤洒邵ｮ縺励◆", "self_points": 5, "created_at": "2026-04-24T11:00:00"},
    {"employee_name": "貂・ｰｴ鄒取怦", "department": "蝟ｶ讌ｭ驛ｨ", "category": "challenge", "behavior": "譁ｰ隕城｡ｧ螳｢蜷代￠繝偵い繝ｪ繝ｳ繧ｰ鬆・岼繧貞・險ｭ險医＠縲∵署譯育ｲｾ蠎ｦ蜷台ｸ翫↓謖第姶縺励◆", "self_points": 10, "created_at": "2026-05-03T10:00:00"},
    {"employee_name": "譛ｨ譚醍ｿ・, "department": "譛ｬ遉ｾ", "category": "support", "behavior": "驛ｨ髢蛻･縺ｮ謾ｹ蝟・ｴｻ蜍輔ｒ謨ｴ逅・＠縲∫ｵ悟霧莨夊ｭｰ蜷代￠縺ｫ隕∫せ繧偵∪縺ｨ繧√◆", "self_points": 5, "created_at": "2026-05-07T15:00:00"},
    {"employee_name": "譫礼悄逕ｱ", "department": "讌ｭ蜍咎°逕ｨ驛ｨ髢", "category": "learning", "behavior": "蠢懷ｯｾ繝ｭ繧ｰ縺ｮ謖ｯ繧願ｿ斐ｊ莨壹ｒ螳滓命縺励∝刀雉ｪ謾ｹ蝟・・蟄ｦ鄙呈ｩ滉ｼ壹ｒ菴懊▲縺・, "self_points": 5, "created_at": "2026-05-10T13:30:00"},
    {"employee_name": "蟆丞ｷ晄挙豬ｷ", "department": "蝟ｶ讌ｭ驛ｨ", "category": "improvement", "behavior": "鬘ｧ螳｢蛻･縺ｮ謠先｡亥ｱ･豁ｴ繧呈紛逅・＠縲∵ｬ｡蝗樊署譯域ｺ門ｙ縺ｮ蜉ｹ邇・ｒ鬮倥ａ縺・, "self_points": 5, "created_at": "2026-05-14T09:30:00"},
    {"employee_name": "霑題陸驕･", "department": "譛ｬ遉ｾ", "category": "challenge", "behavior": "ROI謠帷ｮ励Ν繝ｼ繝ｫ縺ｮ隱ｬ譏手ｳ・侭繧剃ｽ懈・縺励∫樟蝣ｴ縺ｸ縺ｮ豬ｸ騾上↓蜿悶ｊ邨・ｓ縺", "self_points": 10, "created_at": "2026-05-18T17:00:00"},
    {"employee_name": "讖区悽謔譁・, "department": "讌ｭ蜍咎°逕ｨ驛ｨ髢", "category": "support", "behavior": "郢∝ｿ呎凾髢灘ｸｯ縺ｮ繝輔か繝ｭ繝ｼ菴灘宛繧定ｦ狗峩縺励∝ｿ懃ｭ秘≦蟒ｶ繧呈ｸ帙ｉ縺励◆", "self_points": 5, "created_at": "2026-05-21T11:30:00"},
    {"employee_name": "蜷臥伐逅ｴ髻ｳ", "department": "蝟ｶ讌ｭ驛ｨ", "category": "learning", "behavior": "謌仙粥蝠・ｫ・・骭ｲ髻ｳ繧貞・譫舌＠縲∝霧讌ｭ繝翫Ξ繝・ず縺ｨ縺励※蜈ｱ譛峨＠縺・, "self_points": 10, "created_at": "2026-05-23T16:30:00"},
]

for i, payload in enumerate(demo_posts, start=1):
    response = requests.post(API_URL, json=payload)
    print(
        f"{i:02d}",
        response.status_code,
        payload["created_at"],
        payload["department"],
        payload["behavior"],
    )
