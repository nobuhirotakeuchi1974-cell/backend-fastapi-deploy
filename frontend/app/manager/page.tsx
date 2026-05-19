"use client";

import AuthGuard from "../components/AuthGuard";
import LogoutButton from "../components/LogoutButton";

import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction, ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://tech0-gen-11-step3-2-py-62.azurewebsites.net";

const VALUE_PER_POINT = 10000;

type Post = {
  id: string;
  employee_name?: string;
  department?: string;
  behavior: string;
  category: string;
  self_points?: number | null;
  manager_points?: number | null;
  manager_comment?: string | null;
  status: string;
  created_at?: string;
  reviewed_at?: string;
  human_action?: string | null;
  organization_impact?: string | null;
  business_impact?: string | null;
  estimated_hours_saved?: number | null;
  estimated_value?: number | null;
  roi_points?: number | null;
  confidence_score?: number | null;
  ai_comment?: string | null;
};

const pointOptions = [1, 5, 10];
const ROLE: "manager" | "employee" = "manager";

function normalizeCategory(category?: string) {
  const raw = category ?? "譛ｪ蛻・｡・;
  const normalized = String(raw).toLowerCase();

  if (normalized.includes("challenge") || normalized.includes("謖第姶"))
    return "謖第姶";
  if (
    normalized.includes("improvement") ||
    normalized.includes("謾ｹ蝟・) ||
    normalized.includes("productivity") ||
    normalized.includes("逕溽肇")
  ) {
    return "逕溽肇諤ｧ";
  }
  if (
    normalized.includes("support") ||
    normalized.includes("謾ｯ謠ｴ") ||
    normalized.includes("蜉ｩ縺・)
  ) {
    return "蜉ｩ縺大粋縺・;
  }
  if (normalized.includes("learning") || normalized.includes("蟄ｦ鄙・))
    return "蟄ｦ鄙・;

  return raw;
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ja-JP");
}

function getAiRecommendPoint(post: Post) {
  if (post.roi_points && post.roi_points > 0) {
    return Math.max(1, Math.round(post.roi_points * 10));
  }

  const category = normalizeCategory(post.category);
  if (category === "謖第姶") return 10;
  if (category === "逕溽肇諤ｧ") return 10;
  if (category === "蜉ｩ縺大粋縺・) return 5;
  if (category === "蟄ｦ鄙・) return 5;
  return 5;
}

function getBiasInsight(post: Post) {
  const category = normalizeCategory(post.category);
  const department = post.department || "譛ｪ險ｭ螳・;

  const biasTable: Record<string, Record<string, number>> = {
    蝟ｶ讌ｭ: { 謖第姶: 42, 逕溽肇諤ｧ: 18, 蜉ｩ縺大粋縺・ 12, 蟄ｦ鄙・ -8 },
    譛ｬ遉ｾ: { 謖第姶: -14, 逕溽肇諤ｧ: -6, 蜉ｩ縺大粋縺・ 10, 蟄ｦ鄙・ -31 },
    迴ｾ蝣ｴ: { 謖第姶: 8, 逕溽肇諤ｧ: 34, 蜉ｩ縺大粋縺・ 16, 蟄ｦ鄙・ 6 },
  };

  const diff = biasTable[department]?.[category] ?? 0;
  const abs = Math.abs(diff);

  const hasEvidence =
    /\d/.test(post.behavior) ||
    post.behavior.includes("蜑頑ｸ・) ||
    post.behavior.includes("遏ｭ邵ｮ") ||
    post.behavior.includes("謾ｹ蝟・) ||
    post.behavior.includes("蠅怜刈");

  const trustScore = hasEvidence ? "B+" : "B";

  const alert =
    abs >= 30
      ? diff > 0
        ? "鬮倥ａ隧穂ｾ｡蛯ｾ蜷代≠繧・
        : "菴弱ａ隧穂ｾ｡蛯ｾ蜷代≠繧・
      : "螟ｧ縺阪↑荵夜屬縺ｪ縺・;

  return {
    diff,
    trustScore,
    alert,
    hasWarning: abs >= 30,
  };
}

function sortNewest(a: Post, b: Post) {
  const aTime = new Date(a.reviewed_at || a.created_at || 0).getTime();
  const bTime = new Date(b.reviewed_at || b.created_at || 0).getTime();
  return bTime - aTime;
}

export default function ManagerPage() {
  if (ROLE === "employee") {
    return (
      <AuthGuard>
        <main
          style={{
            minHeight: "100vh",
            background: "#071326",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            fontWeight: 900,
          }}
        >
          繧｢繧ｯ繧ｻ繧ｹ讓ｩ髯舌′縺ゅｊ縺ｾ縺帙ｓ
        </main>
      </AuthGuard>
    );
  }

  const [posts, setPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState("");
  const [showAnimation, setShowAnimation] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState<Record<string, number>>(
    {}
  );
  const [comments, setComments] = useState<Record<string, string>>({});

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts`, {
        cache: "no-store",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        setMessage(`謚慕ｨｿ蜿門ｾ励↓螟ｱ謨励＠縺ｾ縺励◆: ${res.status}`);
        setPosts([]);
        return;
      }

      const data = await res.json();

      if (Array.isArray(data)) setPosts(data);
      else if (Array.isArray(data.data)) setPosts(data.data);
      else if (Array.isArray(data.posts)) setPosts(data.posts);
      else setPosts([]);
    } catch (error) {
      console.error(error);
      setMessage("謚慕ｨｿ蜿門ｾ励↓螟ｱ謨励＠縺ｾ縺励◆縲Ｃackend縺瑚ｵｷ蜍輔＠縺ｦ縺・ｋ縺狗｢ｺ隱阪＠縺ｦ縺上□縺輔＞縲・);
      setPosts([]);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const approvePost = async (id: string) => {
    const points = selectedPoints[id] ?? 10;
    const comment =
      comments[id] ||
      "AI蛻・梵繧ｳ繝｡繝ｳ繝医・謗ｨ螳啌OI繝ｻ菫｡鬆ｼ蠎ｦ繧堤｢ｺ隱阪＠縲∽ｸ雁昇隧穂ｾ｡縺ｫ繧医ｊ莠ｺ逧・ｳ・悽萓｡蛟､縺ｨ縺励※遒ｺ螳壹＠縺ｾ縺励◆縲・;

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${id}/review`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: "approved",
          manager_points: points,
          manager_comment: comment,
        }),
      });

      if (!res.ok) {
        setMessage(`謇ｿ隱阪↓螟ｱ謨励＠縺ｾ縺励◆: ${res.status}`);
        return;
      }

      setMessage(`+${points}pt / ﾂ･${(points * VALUE_PER_POINT).toLocaleString()}`);
      setShowAnimation(true);
      await fetchPosts();

      setTimeout(() => {
        setMessage("");
        setShowAnimation(false);
      }, 2200);
    } catch (error) {
      console.error(error);
      setMessage("謇ｿ隱阪↓螟ｱ謨励＠縺ｾ縺励◆縲・PI謗･邯壹∪縺溘・JWT繧堤｢ｺ隱阪＠縺ｦ縺上□縺輔＞縲・);
    }
  };

  const rejectPost = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${id}/review`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: "rejected",
          manager_points: 0,
          manager_comment:
            comments[id] ||
            "AI蛻・梵蜀・ｮｹ繧堤｢ｺ隱阪＠縺溽ｵ先棡縲∬ｿｽ蜉隱ｬ譏弱′蠢・ｦ√→蛻､譁ｭ縺怜ｷｮ謌ｻ縺励∪縺励◆縲・,
        }),
      });

      if (!res.ok) {
        setMessage(`蟾ｮ謌ｻ縺励↓螟ｱ謨励＠縺ｾ縺励◆: ${res.status}`);
        return;
      }

      setMessage("蟾ｮ謌ｻ縺励∪縺励◆");
      await fetchPosts();

      setTimeout(() => setMessage(""), 2500);
    } catch (error) {
      console.error(error);
      setMessage("蟾ｮ謌ｻ縺励↓螟ｱ謨励＠縺ｾ縺励◆縲・PI謗･邯壹∪縺溘・JWT繧堤｢ｺ隱阪＠縺ｦ縺上□縺輔＞縲・);
    }
  };

  const pendingPosts = useMemo(
    () => posts.filter((p) => p.status === "pending").sort(sortNewest),
    [posts]
  );

  const approvedPosts = useMemo(
    () => posts.filter((p) => p.status === "approved").sort(sortNewest),
    [posts]
  );

  const rejectedPosts = useMemo(
    () => posts.filter((p) => p.status === "rejected").sort(sortNewest),
    [posts]
  );

  const totalPoints = approvedPosts.reduce(
    (sum, p) => sum + (Number(p.manager_points) || 0),
    0
  );

  const pendingPoints = pendingPosts.reduce((sum, p) => {
    const points = selectedPoints[p.id] ?? getAiRecommendPoint(p);
    return sum + points;
  }, 0);

  const totalValue = totalPoints * VALUE_PER_POINT;
  const pendingValue = pendingPoints * VALUE_PER_POINT;

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#071326] px-6 py-10 text-white">
        <section className="mx-auto max-w-6xl">
          <header className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-gradient-to-r from-[#0b1b33] to-[#06402f] p-8 shadow-2xl shadow-emerald-500/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_45%)]" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
                  笳・Manager Review
                </p>

                <h1 className="text-4xl font-black">
                  荳雁昇隧穂ｾ｡繝ｻ萓｡蛟､遒ｺ螳壹ム繝・す繝･繝懊・繝・
                </h1>

                <p className="mt-5 max-w-4xl leading-8 text-slate-200">
                  AI蛻・梵繧ｳ繝｡繝ｳ繝医∵耳螳啌OI-P縲∽ｿ｡鬆ｼ繧ｹ繧ｳ繧｢縲・Κ髢髢楢ｩ穂ｾ｡荵夜屬繧堤｢ｺ隱阪＠縺ｪ縺後ｉ縲・
                  遉ｾ蜩｡陦悟虚繧剃ｺｺ逧・ｳ・悽萓｡蛟､縺ｨ縺励※遒ｺ螳壹＠縺ｾ縺吶・
                </p>
              </div>

              <div className="flex shrink-0">
                <LogoutButton />
              </div>
            </div>
          </header>

          <section className="mt-6 grid gap-4 md:grid-cols-4">
            <KpiCard title="謇ｿ隱榊ｾ・■" value={`${pendingPosts.length}莉ｶ`} />
            <KpiCard title="遒ｺ螳壽ｸ医∩繝昴う繝ｳ繝・ value={`${totalPoints}pt`} />
            <KpiCard
              title="遒ｺ螳壽ｸ医∩萓｡蛟､"
              value={`ﾂ･${totalValue.toLocaleString()}`}
              strong
            />
            <KpiCard
              title="遒ｺ螳壻ｺ亥ｮ壻ｾ｡蛟､"
              value={`ﾂ･${pendingValue.toLocaleString()}`}
              accent
            />
          </section>

          {showAnimation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur">
              <div className="rounded-[28px] border border-emerald-400/30 bg-[#ecfdf5] px-14 py-10 text-center text-slate-950 shadow-2xl">
                <CheckCircle2 className="mx-auto h-20 w-20 text-emerald-500" />
                <h2 className="mt-5 text-3xl font-black">謇ｿ隱榊ｮ御ｺ・/h2>
                <p className="mt-3 text-2xl font-black text-emerald-700">
                  {message}
                </p>
                <p className="mt-3 text-sm font-bold text-slate-500">
                  莠ｺ逧・ｳ・悽萓｡蛟､縺ｨ縺励※蜿肴丐縺輔ｌ縺ｾ縺励◆
                </p>
              </div>
            </div>
          )}

          {message && !showAnimation && (
            <div className="fixed right-6 top-6 z-50 rounded-2xl bg-white px-6 py-4 font-black text-slate-950 shadow-2xl">
              {message}
            </div>
          )}

          <PostSection
            title="謇ｿ隱榊ｾ・■"
            subtitle="AI蛻・梵繧ｳ繝｡繝ｳ繝医∵耳螳啌OI-P縲∽ｿ｡鬆ｼ蠎ｦ縲・Κ髢蟷ｳ蝮・→縺ｮ蟾ｮ繧堤｢ｺ隱阪＠縲∬ｩ穂ｾ｡縺ｮ螯･蠖捺ｧ繧貞愛譁ｭ縺励∪縺吶・
            statusLabel="譛ｪ謇ｿ隱・
            tone="amber"
            posts={pendingPosts}
            emptyMessage="謇ｿ隱榊ｾ・■縺ｮ謚慕ｨｿ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・
            selectedPoints={selectedPoints}
            setSelectedPoints={setSelectedPoints}
            comments={comments}
            setComments={setComments}
            approvePost={approvePost}
            rejectPost={rejectPost}
            mode="pending"
          />

          <PostSection
            title="謇ｿ隱肴ｸ医∩"
            subtitle="莠ｺ逧・ｳ・悽萓｡蛟､縺ｨ縺励※遒ｺ螳壽ｸ医∩縺ｮ謚慕ｨｿ縺ｧ縺吶・I蛻・梵縺ｨ荳雁昇隧穂ｾ｡縺檎ｴ舌▼縺・◆迥ｶ諷九〒遒ｺ隱阪〒縺阪∪縺吶・
            statusLabel="萓｡蛟､遒ｺ螳壽ｸ医∩"
            tone="emerald"
            posts={approvedPosts}
            emptyMessage="謇ｿ隱肴ｸ医∩縺ｮ謚慕ｨｿ縺ｯ縺ｾ縺縺ゅｊ縺ｾ縺帙ｓ縲・
            selectedPoints={selectedPoints}
            setSelectedPoints={setSelectedPoints}
            comments={comments}
            setComments={setComments}
            approvePost={approvePost}
            rejectPost={rejectPost}
            mode="approved"
          />

          <PostSection
            title="蟾ｮ謌ｻ縺・
            subtitle="謇ｿ隱阪＆繧後↑縺九▲縺滓兜遞ｿ縺ｧ縺吶ょｿ・ｦ√↓蠢懊§縺ｦ蜀肴兜遞ｿ蟇ｾ雎｡縺ｫ縺励∪縺吶・
            statusLabel="蟾ｮ謌ｻ縺玲ｸ医∩"
            tone="slate"
            posts={rejectedPosts}
            emptyMessage="蟾ｮ謌ｻ縺玲兜遞ｿ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・
            selectedPoints={selectedPoints}
            setSelectedPoints={setSelectedPoints}
            comments={comments}
            setComments={setComments}
            approvePost={approvePost}
            rejectPost={rejectPost}
            mode="rejected"
          />
        </section>
      </main>
    </AuthGuard>
  );
}

function PostSection({
  title,
  subtitle,
  statusLabel,
  tone,
  posts,
  emptyMessage,
  selectedPoints,
  setSelectedPoints,
  comments,
  setComments,
  approvePost,
  rejectPost,
  mode,
}: {
  title: string;
  subtitle: string;
  statusLabel: string;
  tone: "amber" | "emerald" | "slate";
  posts: Post[];
  emptyMessage: string;
  selectedPoints: Record<string, number>;
  setSelectedPoints: Dispatch<SetStateAction<Record<string, number>>>;
  comments: Record<string, string>;
  setComments: Dispatch<SetStateAction<Record<string, string>>>;
  approvePost: (id: string) => void;
  rejectPost: (id: string) => void;
  mode: "pending" | "approved" | "rejected";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
      : tone === "emerald"
        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
        : "border-slate-400/20 bg-slate-400/10 text-slate-300";

  return (
    <section className="mt-6 rounded-[28px] border border-white/10 bg-[#0b1528] p-7 shadow-2xl">
      <div className="mb-6">
        <p
          className={`inline-flex rounded-full border px-4 py-2 text-sm font-black ${toneClass}`}
        >
          {statusLabel}・嘴posts.length}莉ｶ
        </p>

        <h2 className="mt-4 text-3xl font-black">{title}</h2>
        <p className="mt-2 text-sm font-bold leading-7 text-slate-400">
          {subtitle}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#081225] p-6 text-slate-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-5">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              selectedPoints={selectedPoints}
              setSelectedPoints={setSelectedPoints}
              comments={comments}
              setComments={setComments}
              approvePost={approvePost}
              rejectPost={rejectPost}
              mode={mode}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PostCard({
  post,
  selectedPoints,
  setSelectedPoints,
  comments,
  setComments,
  approvePost,
  rejectPost,
  mode,
}: {
  post: Post;
  selectedPoints: Record<string, number>;
  setSelectedPoints: Dispatch<SetStateAction<Record<string, number>>>;
  comments: Record<string, string>;
  setComments: Dispatch<SetStateAction<Record<string, string>>>;
  approvePost: (id: string) => void;
  rejectPost: (id: string) => void;
  mode: "pending" | "approved" | "rejected";
}) {
  const category = normalizeCategory(post.category);
  const aiPoint = getAiRecommendPoint(post);
  const currentPoints = selectedPoints[post.id] ?? aiPoint;
  const estimatedValue = currentPoints * VALUE_PER_POINT;
  const confirmedPoints = Number(post.manager_points) || 0;
  const confirmedValue = confirmedPoints * VALUE_PER_POINT;
  const bias = getBiasInsight(post);

  return (
    <article className="rounded-[26px] border border-white/10 bg-[#081225] p-6 shadow-xl transition hover:border-emerald-400/30">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <Badge color="sky">{post.department || "譛ｪ險ｭ螳・}</Badge>
            <Badge color="emerald">{category}</Badge>
            {post.human_action && (
              <Badge color="emerald">{post.human_action}</Badge>
            )}
            {mode === "pending" && <Badge color="amber">謇ｿ隱榊ｾ・■</Badge>}
            {mode === "approved" && (
              <Badge color="emerald">萓｡蛟､遒ｺ螳壽ｸ医∩</Badge>
            )}
            {mode === "rejected" && <Badge color="slate">蟾ｮ謌ｻ縺玲ｸ医∩</Badge>}
          </div>

          <h3 className="mt-4 text-2xl font-black leading-relaxed text-white">
            {post.behavior}
          </h3>

          <div className="mt-3 grid gap-1 text-sm font-bold text-slate-400">
            <p>謚慕ｨｿ閠・ｼ嘴post.employee_name || "繝・せ繝育､ｾ蜩｡"}</p>
            <p>謚慕ｨｿ譌･・嘴formatDate(post.created_at)}</p>
            {mode !== "pending" && (
              <p>隧穂ｾ｡譌･・嘴formatDate(post.reviewed_at)}</p>
            )}
          </div>
        </div>

        <BiasInsightCard aiPoint={aiPoint} bias={bias} />
      </div>

      <AiCommentPanel post={post} aiPoint={aiPoint} bias={bias} />

      {mode === "pending" && (
        <>
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm font-black text-slate-300">隧穂ｾ｡繝昴う繝ｳ繝・/p>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {pointOptions.map((point) => (
                <button
                  key={point}
                  type="button"
                  onClick={() =>
                    setSelectedPoints((prev) => ({
                      ...prev,
                      [post.id]: point,
                    }))
                  }
                  className={`rounded-2xl border px-4 py-4 text-lg font-black transition ${
                    currentPoints === point
                      ? "border-emerald-400 bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
                      : "border-white/10 bg-[#0b1528] text-slate-300 hover:border-emerald-400/40"
                  }`}
                >
                  Lv.{point} / {point}pt
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-200">
              謇ｿ隱阪☆繧九→ {currentPoints}pt / ﾂ･
              {estimatedValue.toLocaleString()} 縺ｮ莠ｺ逧・ｳ・悽萓｡蛟､縺ｨ縺励※遒ｺ螳壹＠縺ｾ縺吶・
            </div>

            <textarea
              value={comments[post.id] ?? ""}
              onChange={(e) =>
                setComments((prev) => ({
                  ...prev,
                  [post.id]: e.target.value,
                }))
              }
              placeholder="荳雁昇繧ｳ繝｡繝ｳ繝医ｒ蜈･蜉幢ｼ井ｾ具ｼ哂I蛻・梵繧ｳ繝｡繝ｳ繝医→謗ｨ螳啌OI繧堤｢ｺ隱阪＠縲∝ｦ･蠖薙→蛻､譁ｭ・・
              className="mt-4 min-h-24 w-full rounded-2xl border border-white/10 bg-[#071326] p-4 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
            />
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => approvePost(post.id)}
              className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-4 font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5"
            >
              謇ｿ隱阪＠縺ｦ萓｡蛟､遒ｺ螳・
            </button>

            <button
              onClick={() => rejectPost(post.id)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 font-black text-slate-300 transition hover:border-red-400/40 hover:text-red-300"
            >
              蟾ｮ謌ｻ縺・
            </button>
          </div>
        </>
      )}

      {mode === "approved" && (
        <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-200">
          縺薙・陦悟虚縺ｯ {confirmedPoints}pt / ﾂ･
          {confirmedValue.toLocaleString()} 縺ｨ縺励※萓｡蛟､遒ｺ螳壽ｸ医∩縺ｧ縺吶・
          {post.manager_comment && (
            <p className="mt-2 text-emerald-100">
              荳雁昇繧ｳ繝｡繝ｳ繝茨ｼ嘴post.manager_comment}
            </p>
          )}
        </div>
      )}

      {mode === "rejected" && (
        <div className="mt-5 rounded-2xl border border-slate-400/20 bg-slate-400/10 p-4 text-sm font-bold text-slate-300">
          縺薙・陦悟虚縺ｯ蟾ｮ謌ｻ縺玲ｸ医∩縺ｧ縺吶・
          {post.manager_comment && (
            <p className="mt-2 text-slate-200">
              荳雁昇繧ｳ繝｡繝ｳ繝茨ｼ嘴post.manager_comment}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function AiCommentPanel({
  post,
  aiPoint,
  bias,
}: {
  post: Post;
  aiPoint: number;
  bias: {
    diff: number;
    trustScore: string;
    alert: string;
    hasWarning: boolean;
  };
}) {
  return (
    <div className="mt-5 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge color="emerald">AI謗ｨ螳・{post.roi_points ?? aiPoint}P</Badge>

        <Badge color="sky">
          菫｡鬆ｼ蠎ｦ {post.confidence_score ?? bias.trustScore}
          {typeof post.confidence_score === "number" ? "%" : ""}
        </Badge>

        {post.organization_impact && (
          <Badge color="sky">{post.organization_impact}</Badge>
        )}
        {post.business_impact && (
          <Badge color="amber">{post.business_impact}</Badge>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-black tracking-wider text-cyan-300">
          AI蛻・梵繧ｳ繝｡繝ｳ繝・
        </p>

        <p className="mt-3 text-sm leading-7 text-slate-200">
          {post.ai_comment || "莠ｺ逧・ｳ・悽陦悟虚縺ｨ縺励※蛻・梵荳ｭ縺ｧ縺吶・}
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <AiMetric label="謗ｨ螳啌OI-P" value={`${post.roi_points ?? aiPoint}P`} />
        <AiMetric
          label="謗ｨ螳夊ｲ｡蜍吝柑譫・
          value={
            typeof post.estimated_value === "number"
              ? `ﾂ･${post.estimated_value.toLocaleString()}`
              : "-"
          }
        />
        <AiMetric
          label="謗ｨ螳壼炎貂帶凾髢・
          value={
            typeof post.estimated_hours_saved === "number"
              ? `${post.estimated_hours_saved}h`
              : "-"
          }
        />
      </div>
    </div>
  );
}

function AiMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#071326]/70 p-4">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-black text-cyan-200">{value}</p>
    </div>
  );
}

function BiasInsightCard({
  aiPoint,
  bias,
}: {
  aiPoint: number;
  bias: {
    diff: number;
    trustScore: string;
    alert: string;
    hasWarning: boolean;
  };
}) {
  return (
    <div className="min-w-[230px] rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
      <p className="text-xs font-black text-emerald-300">AI隧穂ｾ｡陬懷勧</p>

      <div className="mt-3 grid gap-3">
        <InsightRow label="謗ｨ螂ｨ轤ｹ謨ｰ" value={`${aiPoint}pt`} />
        <InsightRow label="菫｡鬆ｼ繧ｹ繧ｳ繧｢" value={bias.trustScore} />
        <InsightRow
          label="驛ｨ髢蟷ｳ蝮・→縺ｮ蟾ｮ"
          value={`${bias.diff > 0 ? "+" : ""}${bias.diff}%`}
          alert={bias.hasWarning}
        />
      </div>

      <div
        className={`mt-4 rounded-xl border p-3 text-xs font-bold leading-5 ${
          bias.hasWarning
            ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
            : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
        }`}
      >
        {bias.hasWarning ? "笞 " : "笨・"}
        {bias.alert}
      </div>
    </div>
  );
}

function InsightRow({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold text-slate-400">{label}</span>
      <span
        className={`text-sm font-black ${
          alert ? "text-amber-300" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
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
        <p className="text-sm font-black text-slate-400">{title}</p>
        <p
          className={`mt-5 text-3xl font-black ${
            strong ? "text-emerald-300" : accent ? "text-amber-300" : "text-white"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function Badge({
  children,
  color,
}: {
  children: ReactNode;
  color: "sky" | "emerald" | "amber" | "slate";
}) {
  const colorClass =
    color === "sky"
      ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
      : color === "emerald"
        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
        : color === "amber"
          ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
          : "border-slate-400/20 bg-slate-400/10 text-slate-300";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${colorClass}`}
    >
      {children}
    </span>
  );
}

