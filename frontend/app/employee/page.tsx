"use client";

import { useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8002";

const VALUE_PER_POINT = 10000;

const categories = [
  { value: "challenge", label: "挑戦" },
  { value: "improvement", label: "改善" },
  { value: "support", label: "支援" },
  { value: "learning", label: "学習" },
];

const departments = [
  { value: "営業", label: "営業" },
  { value: "本社", label: "本社" },
  { value: "現場", label: "現場" },
];

const aiSuggestions = [
  {
    label: "改善提案",
    text: "営業資料を改善し、提案準備時間を30分短縮した。",
  },
  {
    label: "支援",
    text: "他部署の計画作成を補助し、工数を1人月削減した。",
  },
  {
    label: "学習",
    text: "新しい分析ツールを学習し、レポート作成を効率化した。",
  },
  {
    label: "挑戦",
    text: "新規顧客向け提案に挑戦し、商談機会を創出した。",
  },
];

const categoryLabels: Record<string, string> = {
  challenge: "挑戦",
  improvement: "改善",
  support: "支援",
  learning: "学習",
  挑戦: "挑戦",
  改善: "改善",
  支援: "支援",
  学習: "学習",
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
      setMessage("部門を選択してください");
      return;
    }

    if (!category) {
      setMessage("カテゴリを選択してください");
      return;
    }

    if (!behavior.trim()) {
      setMessage("行動内容を入力してください");
      return;
    }

    const res = await fetch(`${API_BASE_URL}/api/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employee_name: "テスト社員",
        department,
        behavior,
        category,
        points: 0,
      }),
    });

    if (!res.ok) {
      setMessage("送信に失敗しました");
      return;
    }

    setBehavior("");
    setCategory("");
    setDepartment("");

    setMessage("送信しました。上司評価待ちに追加されました。");

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
              ● Employee Action
            </p>

            <h1 className="text-4xl font-black">
              今日の行動を記録する
            </h1>

            <p className="mt-5 max-w-4xl leading-8 text-slate-200">
              日々の挑戦・改善・支援・学習を投稿すると、
              上司評価を通じて人的資本価値として可視化されます。
            </p>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <KpiCard title="承認済みポイント" value={`${totalPoints}pt`} />
          <KpiCard
            title="あなたの確定価値"
            value={`¥${totalValue.toLocaleString()}`}
            strong
          />
          <KpiCard
            title="承認待ち"
            value={`${pending.length}件`}
            accent
          />
        </section>

        {message && (
          <div
            className={`fixed right-6 top-6 z-50 rounded-2xl px-6 py-4 font-black shadow-2xl ${
              message.includes("送信しました")
                ? "bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950"
                : "bg-white text-slate-950"
            }`}
          >
            {message}
          </div>
        )}

        <section className="mt-6 rounded-[28px] border border-white/10 bg-[#0b1528] p-7 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-3xl font-black">行動入力</h2>

            <p className="mt-2 text-sm font-bold leading-7 text-slate-400">
              部門・カテゴリを選び、上司が評価しやすいように行動内容を具体的に記録します。
            </p>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-[#081225] p-6">
            <FieldTitle title="部門" required />

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

            <FieldTitle title="カテゴリ" required />

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

            <FieldTitle title="AI投稿アシスト" />

            <div className="mb-5 flex flex-wrap gap-3">
              {aiSuggestions.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setBehavior(item.text)}
                  className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950"
                >
                  AI提案：{item.label}
                </button>
              ))}
            </div>

            <FieldTitle title="行動内容" required />

            <textarea
              value={behavior}
              onChange={(e) => setBehavior(e.target.value)}
              placeholder="例：営業資料の比較表を作り直し、提案準備時間を30分短縮した"
              rows={6}
              className="w-full rounded-[22px] border border-white/10 bg-[#071326] p-5 text-sm font-bold leading-8 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/40"
            />

            <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm font-bold leading-8 text-emerald-100">
              書き方の目安：
              何をしたか／誰に効いたか／時間短縮・品質向上・売上貢献などの効果を入れると、
              上司が評価しやすくなります。
            </div>

            <button
              onClick={handleSubmit}
              className="mt-6 w-full rounded-[22px] bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-5 text-lg font-black text-slate-950 shadow-2xl shadow-emerald-500/20 transition hover:-translate-y-1"
            >
              上司評価へ送信する
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-white/10 bg-[#0b1528] p-7 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-3xl font-black">あなたの投稿履歴</h2>

            <p className="mt-2 text-sm font-bold leading-7 text-slate-400">
              投稿した行動の承認状況と、確定した人的資本価値を確認できます。
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
                            {post.department || "未設定"}
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
                          <p>投稿日時：{formatDate(post.created_at)}</p>

                          {post.reviewed_at && (
                            <p>承認日時：{formatDate(post.reviewed_at)}</p>
                          )}
                        </div>
                      </div>

                      {post.status === "approved" && (
                        <div className="min-w-[150px] rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-center">
                          <p className="text-xs font-black text-emerald-300">
                            確定価値
                          </p>

                          <p className="mt-2 text-3xl font-black text-white">
                            {points}pt
                          </p>

                          <p className="mt-1 text-sm font-black text-emerald-300">
                            ¥{value.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {post.manager_comment && (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs font-black text-slate-400">
                          上司コメント
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
          必須
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
    return <Badge color="emerald">承認済</Badge>;
  }

  if (status === "rejected") {
    return <Badge color="rose">差戻し</Badge>;
  }

  return <Badge color="amber">承認待ち</Badge>;
}