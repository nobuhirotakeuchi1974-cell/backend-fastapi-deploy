"use client";

import { useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://tech0-gen-11-step3-2-py-62.azurewebsites.net";

const VALUE_PER_POINT = 10000;

const categories = [
  { value: "challenge", label: "謖第姶" },
  { value: "improvement", label: "謾ｹ蝟・ },
  { value: "support", label: "謾ｯ謠ｴ" },
  { value: "learning", label: "蟄ｦ鄙・ },
];

const departments = [
  { value: "蝟ｶ讌ｭ", label: "蝟ｶ讌ｭ" },
  { value: "譛ｬ遉ｾ", label: "譛ｬ遉ｾ" },
  { value: "迴ｾ蝣ｴ", label: "迴ｾ蝣ｴ" },
];

const aiSuggestions = [
  {
    label: "謾ｹ蝟・署譯・,
    text: "蝟ｶ讌ｭ雉・侭繧呈隼蝟・＠縲∵署譯域ｺ門ｙ譎る俣繧・0蛻・洒邵ｮ縺励◆縲・,
  },
  {
    label: "謾ｯ謠ｴ",
    text: "莉夜Κ鄂ｲ縺ｮ險育判菴懈・繧定｣懷勧縺励∝ｷ･謨ｰ繧・莠ｺ譛亥炎貂帙＠縺溘・,
  },
  {
    label: "蟄ｦ鄙・,
    text: "譁ｰ縺励＞蛻・梵繝・・繝ｫ繧貞ｭｦ鄙偵＠縲√Ξ繝昴・繝井ｽ懈・繧貞柑邇・喧縺励◆縲・,
  },
  {
    label: "謖第姶",
    text: "譁ｰ隕城｡ｧ螳｢蜷代￠謠先｡医↓謖第姶縺励∝膚隲・ｩ滉ｼ壹ｒ蜑ｵ蜃ｺ縺励◆縲・,
  },
];

const categoryLabels: Record<string, string> = {
  challenge: "謖第姶",
  improvement: "謾ｹ蝟・,
  support: "謾ｯ謠ｴ",
  learning: "蟄ｦ鄙・,
  謖第姶: "謖第姶",
  謾ｹ蝟・ "謾ｹ蝟・,
  謾ｯ謠ｴ: "謾ｯ謠ｴ",
  蟄ｦ鄙・ "蟄ｦ鄙・,
};

type Post = {
  id: string;
  behavior: string;
  category: string;
  department?: string;
  manager_points?: number | null;
  manager_comment?: string | null;
  reviewed_at?: string | null;
  created_at?: string | null;
  points?: number | null;
  status: string;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ja-JP");
}

export default function EmployeePage() {
  const [behavior, setBehavior] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [message, setMessage] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);

  const fetchPosts = async () => {
    const res = await fetch(`${API_BASE_URL}/api/posts`);
    const data = await res.json();

    if (Array.isArray(data)) setPosts(data);
    else if (Array.isArray(data.data)) setPosts(data.data);
    else if (Array.isArray(data.posts)) setPosts(data.posts);
    else setPosts([]);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async () => {
    if (!department) {
      setMessage("驛ｨ髢繧帝∈謚槭＠縺ｦ縺上□縺輔＞");
      return;
    }

    if (!category) {
      setMessage("繧ｫ繝・ざ繝ｪ繧帝∈謚槭＠縺ｦ縺上□縺輔＞");
      return;
    }

    if (!behavior.trim()) {
      setMessage("陦悟虚蜀・ｮｹ繧貞・蜉帙＠縺ｦ縺上□縺輔＞");
      return;
    }

    const res = await fetch(`${API_BASE_URL}/api/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employee_name: "繝・せ繝育､ｾ蜩｡",
        department,
        behavior,
        category,
        points: 0,
      }),
    });

    if (!res.ok) {
      setMessage("騾∽ｿ｡縺ｫ螟ｱ謨励＠縺ｾ縺励◆");
      return;
    }

    setBehavior("");
    setCategory("");
    setDepartment("");

    setMessage("騾∽ｿ｡縺励∪縺励◆縲ゆｸ雁昇隧穂ｾ｡蠕・■縺ｫ霑ｽ蜉縺輔ｌ縺ｾ縺励◆縲・);

    fetchPosts();

    setTimeout(() => setMessage(""), 3000);
  };

  const approved = posts.filter((p) => p.status === "approved");
  const pending = posts.filter((p) => p.status === "pending");

  const totalPoints = approved.reduce(
    (sum, p) => sum + (Number(p.manager_points) || Number(p.points) || 0),
    0
  );

  const totalValue = totalPoints * VALUE_PER_POINT;

  return (
    <main className="min-h-screen bg-[#071326] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-gradient-to-r from-[#0b1b33] to-[#06402f] p-8 shadow-2xl shadow-emerald-500/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_45%)]" />

          <div className="relative z-10">
            <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
              笳・Employee Action
            </p>

            <h1 className="text-4xl font-black">
              莉頑律縺ｮ陦悟虚繧定ｨ倬鹸縺吶ｋ
            </h1>

            <p className="mt-5 max-w-4xl leading-8 text-slate-200">
              譌･縲・・謖第姶繝ｻ謾ｹ蝟・・謾ｯ謠ｴ繝ｻ蟄ｦ鄙偵ｒ謚慕ｨｿ縺吶ｋ縺ｨ縲・
              荳雁昇隧穂ｾ｡繧帝壹§縺ｦ莠ｺ逧・ｳ・悽萓｡蛟､縺ｨ縺励※蜿ｯ隕門喧縺輔ｌ縺ｾ縺吶・
            </p>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <KpiCard title="謇ｿ隱肴ｸ医∩繝昴う繝ｳ繝・ value={`${totalPoints}pt`} />
          <KpiCard
            title="縺ゅ↑縺溘・遒ｺ螳壻ｾ｡蛟､"
            value={`ﾂ･${totalValue.toLocaleString()}`}
            strong
          />
          <KpiCard
            title="謇ｿ隱榊ｾ・■"
            value={`${pending.length}莉ｶ`}
            accent
          />
        </section>

        {message && (
          <div
            className={`fixed right-6 top-6 z-50 rounded-2xl px-6 py-4 font-black shadow-2xl ${
              message.includes("騾∽ｿ｡縺励∪縺励◆")
                ? "bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950"
                : "bg-white text-slate-950"
            }`}
          >
            {message}
          </div>
        )}

        <section className="mt-6 rounded-[28px] border border-white/10 bg-[#0b1528] p-7 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-3xl font-black">陦悟虚蜈･蜉・/h2>

            <p className="mt-2 text-sm font-bold leading-7 text-slate-400">
              驛ｨ髢繝ｻ繧ｫ繝・ざ繝ｪ繧帝∈縺ｳ縲∽ｸ雁昇縺瑚ｩ穂ｾ｡縺励ｄ縺吶＞繧医≧縺ｫ陦悟虚蜀・ｮｹ繧貞・菴鍋噪縺ｫ險倬鹸縺励∪縺吶・
            </p>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-[#081225] p-6">
            <FieldTitle title="驛ｨ髢" required />

            <div className="mb-6 grid gap-3 md:grid-cols-3">
              {departments.map((item) => (
                <SelectButton
                  key={item.value}
                  selected={department === item.value}
                  onClick={() => setDepartment(item.value)}
                  color="sky"
                >
                  {item.label}
                </SelectButton>
              ))}
            </div>

            <FieldTitle title="繧ｫ繝・ざ繝ｪ" required />

            <div className="mb-6 grid gap-3 md:grid-cols-4">
              {categories.map((item) => (
                <SelectButton
                  key={item.value}
                  selected={category === item.value}
                  onClick={() => setCategory(item.value)}
                  color="emerald"
                >
                  {item.label}
                </SelectButton>
              ))}
            </div>

            <FieldTitle title="AI謚慕ｨｿ繧｢繧ｷ繧ｹ繝・ />

            <div className="mb-5 flex flex-wrap gap-3">
              {aiSuggestions.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setBehavior(item.text)}
                  className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
                >
                  AI謠先｡茨ｼ嘴item.label}
                </button>
              ))}
            </div>

            <FieldTitle title="陦悟虚蜀・ｮｹ" required />

            <textarea
              value={behavior}
              onChange={(e) => setBehavior(e.target.value)}
              placeholder="萓具ｼ壼霧讌ｭ雉・侭縺ｮ豈碑ｼ・｡ｨ繧剃ｽ懊ｊ逶ｴ縺励∵署譯域ｺ門ｙ譎る俣繧・0蛻・洒邵ｮ縺励◆"
              rows={6}
              className="w-full rounded-[22px] border border-white/10 bg-[#071326] p-5 text-sm font-bold leading-8 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/40"
            />

            <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm font-bold leading-8 text-emerald-100">
              譖ｸ縺肴婿縺ｮ逶ｮ螳会ｼ・
              菴輔ｒ縺励◆縺具ｼ剰ｪｰ縺ｫ蜉ｹ縺・◆縺具ｼ乗凾髢鍋洒邵ｮ繝ｻ蜩∬ｳｪ蜷台ｸ翫・螢ｲ荳願ｲ｢迪ｮ縺ｪ縺ｩ縺ｮ蜉ｹ譫懊ｒ蜈･繧後ｋ縺ｨ縲・
              荳雁昇縺瑚ｩ穂ｾ｡縺励ｄ縺吶￥縺ｪ繧翫∪縺吶・
            </div>

            <button
              onClick={handleSubmit}
              className="mt-6 w-full rounded-[22px] bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-5 text-lg font-black text-slate-950 shadow-2xl shadow-emerald-500/20 transition hover:-translate-y-1"
            >
              荳雁昇隧穂ｾ｡縺ｸ騾∽ｿ｡縺吶ｋ
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-white/10 bg-[#0b1528] p-7 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-3xl font-black">縺ゅ↑縺溘・謚慕ｨｿ螻･豁ｴ</h2>

            <p className="mt-2 text-sm font-bold leading-7 text-slate-400">
              謚慕ｨｿ縺励◆陦悟虚縺ｮ謇ｿ隱咲憾豕√→縲∫｢ｺ螳壹＠縺滉ｺｺ逧・ｳ・悽萓｡蛟､繧堤｢ｺ隱阪〒縺阪∪縺吶・
            </p>
          </div>

          <div className="grid gap-5">
            {posts
              .slice()
              .reverse()
              .map((post) => {
                const points =
                  Number(post.manager_points) || Number(post.points) || 0;

                const value = points * VALUE_PER_POINT;

                return (
                  <article
                    key={post.id}
                    className="rounded-[26px] border border-white/10 bg-[#081225] p-6 shadow-xl"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2">
                          <Badge color="sky">
                            {post.department || "譛ｪ險ｭ螳・}
                          </Badge>

                          <Badge color="emerald">
                            {categoryLabels[post.category] || post.category}
                          </Badge>

                          <StatusBadge status={post.status} />
                        </div>

                        <p className="mt-5 text-lg font-black leading-8 text-white">
                          {post.behavior}
                        </p>

                        <div className="mt-4 grid gap-1 text-xs font-bold text-slate-500">
                          <p>謚慕ｨｿ譌･譎ゑｼ嘴formatDate(post.created_at)}</p>

                          {post.reviewed_at && (
                            <p>謇ｿ隱肴律譎ゑｼ嘴formatDate(post.reviewed_at)}</p>
                          )}
                        </div>
                      </div>

                      {post.status === "approved" && (
                        <div className="min-w-[150px] rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-center">
                          <p className="text-xs font-black text-emerald-300">
                            遒ｺ螳壻ｾ｡蛟､
                          </p>

                          <p className="mt-2 text-3xl font-black text-white">
                            {points}pt
                          </p>

                          <p className="mt-1 text-sm font-black text-emerald-300">
                            ﾂ･{value.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {post.manager_comment && (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs font-black text-slate-400">
                          荳雁昇繧ｳ繝｡繝ｳ繝・
                        </p>

                        <div className="mt-2 text-sm font-bold leading-7 text-slate-200">
                          {post.manager_comment}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
          </div>
        </section>
      </div>
    </main>
  );
}

function KpiCard({
  title,
  value,
  strong = false,
  accent = false,
}: {
  title: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-[#0b1220] via-[#101827] to-[#062c28] p-6 shadow-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_42%)]" />

      <div className="relative z-10">
        <p className="text-sm font-black text-slate-400">
          {title}
        </p>

        <p
          className={`mt-5 text-3xl font-black ${
            strong
              ? "text-emerald-300"
              : accent
              ? "text-amber-300"
              : "text-white"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function FieldTitle({
  title,
  required = false,
}: {
  title: string;
  required?: boolean;
}) {
  return (
    <p className="mb-3 text-sm font-black text-slate-300">
      {title}

      {required && (
        <span className="ml-2 text-rose-400">
          蠢・・
        </span>
      )}
    </p>
  );
}

function SelectButton({
  selected,
  onClick,
  children,
  color,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color: "sky" | "emerald";
}) {
  const selectedClass =
    color === "sky"
      ? "from-sky-400 to-cyan-400"
      : "from-emerald-400 to-cyan-400";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-5 py-4 text-sm font-black transition ${
        selected
          ? `bg-gradient-to-r ${selectedClass} border-transparent text-slate-950 shadow-lg`
          : "border-white/10 bg-[#071326] text-slate-300 hover:border-emerald-400/30"
      }`}
    >
      {children}
    </button>
  );
}

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "sky" | "emerald" | "amber" | "rose";
}) {
  const colorClass =
    color === "sky"
      ? "border-sky-400/20 bg-sky-400/10 text-sky-300"
      : color === "emerald"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : color === "amber"
      ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
      : "border-rose-400/20 bg-rose-400/10 text-rose-300";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${colorClass}`}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return <Badge color="emerald">謇ｿ隱肴ｸ・/Badge>;
  }

  if (status === "rejected") {
    return <Badge color="rose">蟾ｮ謌ｻ縺・/Badge>;
  }

  return <Badge color="amber">謇ｿ隱榊ｾ・■</Badge>;
}

