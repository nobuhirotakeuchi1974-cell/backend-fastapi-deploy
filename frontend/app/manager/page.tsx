"use client";

import AuthGuard from "../components/AuthGuard";
import LogoutButton from "../components/LogoutButton";

import { useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { CheckCircle2 } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://tech0-gen-11-step3-2-py-62.azurewebsites.net";

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

const pointOptions = [60, 65, 70, 75, 80, 85, 90, 95, 100];
const ROLE: "manager" | "employee" = "manager";

function normalizeCategory(category?: string) {
  const raw = category ?? "未分類";
  const normalized = String(raw).toLowerCase();

  if (normalized.includes("challenge") || normalized.includes("挑戦")) return "挑戦";
  if (
    normalized.includes("improvement") ||
    normalized.includes("改善") ||
    normalized.includes("productivity") ||
    normalized.includes("生産")
  ) {
    return "生産性";
  }
  if (
    normalized.includes("support") ||
    normalized.includes("支援") ||
    normalized.includes("助け")
  ) {
    return "助け合い";
  }
  if (normalized.includes("learning") || normalized.includes("学習")) return "学習";

  return raw;
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ja-JP");
}

function roundToFive(value: number) {
  if (!Number.isFinite(value)) return 5;
  return Math.max(5, Math.round(value / 5) * 5);
}

function getAiRecommendPoint(post: Post) {
  if (typeof post.roi_points === "number" && post.roi_points > 0) {
    return roundToFive(post.roi_points * 10);
  }

  if (typeof post.manager_points === "number" && post.manager_points > 0) {
    return roundToFive(post.manager_points);
  }

  const category = normalizeCategory(post.category);
  if (category === "挑戦") return 80;
  if (category === "生産性") return 80;
  if (category === "助け合い") return 60;
  if (category === "学習") return 60;
  return 60;
}

function getConfirmedPoint(post: Post) {
  if (typeof post.manager_points === "number" && post.manager_points > 0) {
    return roundToFive(post.manager_points);
  }

  return getAiRecommendPoint(post);
}

function getBiasInsight(post: Post) {
  const category = normalizeCategory(post.category);
  const department = post.department || "未設定";

  const biasTable: Record<string, Record<string, number>> = {
    営業: { 挑戦: 42, 生産性: 18, 助け合い: 12, 学習: -8 },
    本社: { 挑戦: -14, 生産性: -6, 助け合い: 10, 学習: -31 },
    現場: { 挑戦: 8, 生産性: 34, 助け合い: 16, 学習: 6 },
  };

  const diff = biasTable[department]?.[category] ?? 0;
  const abs = Math.abs(diff);

  const hasEvidence =
    /\d/.test(post.behavior) ||
    post.behavior.includes("削減") ||
    post.behavior.includes("短縮") ||
    post.behavior.includes("改善") ||
    post.behavior.includes("増加");

  const trustScore = hasEvidence ? "B+" : "B";

  const alert =
    abs >= 30
      ? diff > 0
        ? "高め評価傾向あり"
        : "低め評価傾向あり"
      : "大きな乖離なし";

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
        <main className="flex min-h-screen items-center justify-center bg-[#071326] px-4 text-center text-2xl font-black text-white">
          アクセス権限がありません
        </main>
      </AuthGuard>
    );
  }

  const [posts, setPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState("");
  const [showAnimation, setShowAnimation] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState<Record<string, number>>({});
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
        setMessage(`投稿取得に失敗しました: ${res.status}`);
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
      setMessage("投稿取得に失敗しました。backendが起動しているか確認してください。");
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
      "AI分析コメント・推定ROI・信頼度を確認し、上司評価により人的資本価値として確定しました。";

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
        setMessage(`承認に失敗しました: ${res.status}`);
        return;
      }

      setMessage(`+${points}P / ¥${(points * VALUE_PER_POINT).toLocaleString()}`);
      setShowAnimation(true);
      await fetchPosts();

      setTimeout(() => {
        setMessage("");
        setShowAnimation(false);
      }, 2200);
    } catch (error) {
      console.error(error);
      setMessage("承認に失敗しました。API接続またはJWTを確認してください。");
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
            "AI分析内容を確認した結果、追加説明が必要と判断し差戻しました。",
        }),
      });

      if (!res.ok) {
        setMessage(`差戻しに失敗しました: ${res.status}`);
        return;
      }

      setMessage("差戻しました");
      await fetchPosts();

      setTimeout(() => setMessage(""), 2500);
    } catch (error) {
      console.error(error);
      setMessage("差戻しに失敗しました。API接続またはJWTを確認してください。");
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
    (sum, p) => sum + getConfirmedPoint(p),
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
      <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#071326] px-4 py-8 text-white sm:px-6 sm:py-10">
        <section className="mx-auto w-full max-w-6xl overflow-x-hidden">
          <header className="relative w-full max-w-full overflow-hidden rounded-[24px] border border-emerald-400/20 bg-gradient-to-r from-[#0b1b33] to-[#06402f] p-5 shadow-2xl shadow-emerald-500/10 sm:rounded-[28px] sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_45%)]" />

            <div className="relative z-10 flex w-full min-w-0 flex-col gap-6">
              <div className="min-w-0">
                <p className="mb-4 inline-flex max-w-full rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-300 sm:text-sm">
                  ● Manager Review
                </p>

                <h1 className="text-[30px] font-black leading-tight tracking-tight text-white sm:text-4xl">
                  <span className="block">上司評価・</span>
                  <span className="block">価値確定</span>
                  <span className="block">ダッシュボード</span>
                </h1>

                <p className="mt-5 text-sm leading-7 text-slate-200 sm:max-w-4xl sm:text-base sm:leading-8">
                  AI分析コメント、推定ROI-P、信頼スコア、部門間評価乖離を確認しながら、
                  社員行動を人的資本価値として確定します。
                </p>
              </div>

              <div>
                <LogoutButton />
              </div>
            </div>
          </header>

          <section
            className="mt-6 grid w-full max-w-full gap-4 overflow-hidden"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            }}
          >
            <KpiCard title="承認待ち" value={`${pendingPosts.length}件`} />
            <KpiCard title="確定済みROI-P" value={`${totalPoints}P`} />
            <KpiCard
              title="確定済み価値"
              value={`¥${totalValue.toLocaleString()}`}
              strong
            />
            <KpiCard
              title="確定予定価値"
              value={`¥${pendingValue.toLocaleString()}`}
              accent
            />
          </section>

          {showAnimation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur">
              <div className="w-full max-w-md rounded-[28px] border border-emerald-400/30 bg-[#ecfdf5] px-6 py-9 text-center text-slate-950 shadow-2xl sm:px-14 sm:py-10">
                <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500 sm:h-20 sm:w-20" />
                <h2 className="mt-5 text-2xl font-black sm:text-3xl">
                  承認完了
                </h2>
                <p className="mt-3 text-xl font-black text-emerald-700 sm:text-2xl">
                  {message}
                </p>
                <p className="mt-3 text-sm font-bold text-slate-500">
                  人的資本価値として反映されました
                </p>
              </div>
            </div>
          )}

          {message && !showAnimation && (
            <div className="fixed left-4 right-4 top-4 z-50 rounded-2xl bg-white px-5 py-4 text-center font-black text-slate-950 shadow-2xl sm:left-auto sm:right-6 sm:top-6">
              {message}
            </div>
          )}

          <PostSection
            title="承認待ち"
            subtitle="AI分析コメント、推定ROI-P、信頼度、部門平均との差を確認し、評価の妥当性を判断します。"
            statusLabel="未承認"
            tone="amber"
            posts={pendingPosts}
            emptyMessage="承認待ちの投稿はありません。"
            selectedPoints={selectedPoints}
            setSelectedPoints={setSelectedPoints}
            comments={comments}
            setComments={setComments}
            approvePost={approvePost}
            rejectPost={rejectPost}
            mode="pending"
          />

          <PostSection
            title="承認済み"
            subtitle="人的資本価値として確定済みの投稿です。AI分析と上司評価が紐づいた状態で確認できます。"
            statusLabel="価値確定済み"
            tone="emerald"
            posts={approvedPosts}
            emptyMessage="承認済みの投稿はまだありません。"
            selectedPoints={selectedPoints}
            setSelectedPoints={setSelectedPoints}
            comments={comments}
            setComments={setComments}
            approvePost={approvePost}
            rejectPost={rejectPost}
            mode="approved"
          />

          <PostSection
            title="差戻し"
            subtitle="承認されなかった投稿です。必要に応じて再投稿対象にします。"
            statusLabel="差戻し済み"
            tone="slate"
            posts={rejectedPosts}
            emptyMessage="差戻し投稿はありません。"
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
    <section className="mt-6 w-full max-w-full overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1528] p-4 shadow-2xl sm:rounded-[28px] sm:p-7">
      <div className="mb-6 min-w-0">
        <p
          className={`inline-flex max-w-full rounded-full border px-4 py-2 text-xs font-black sm:text-sm ${toneClass}`}
        >
          {statusLabel}：{posts.length}件
        </p>

        <h2 className="mt-4 text-2xl font-black sm:text-3xl">{title}</h2>
        <p className="mt-2 text-sm font-bold leading-7 text-slate-400">
          {subtitle}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#081225] p-6 text-slate-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid w-full max-w-full gap-5 overflow-hidden">
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
  const confirmedPoints = getConfirmedPoint(post);
  const confirmedValue = confirmedPoints * VALUE_PER_POINT;
  const bias = getBiasInsight(post);

  return (
    <article className="w-full max-w-full overflow-hidden rounded-[24px] border border-white/10 bg-[#081225] p-4 shadow-xl transition hover:border-emerald-400/30 sm:rounded-[26px] sm:p-6">
      <div className="flex w-full max-w-full flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <Badge color="sky">{post.department || "未設定"}</Badge>
            <Badge color="emerald">{category}</Badge>
            {post.human_action && (
              <Badge color="emerald">{post.human_action}</Badge>
            )}
            {mode === "pending" && <Badge color="amber">承認待ち</Badge>}
            {mode === "approved" && (
              <Badge color="emerald">価値確定済み</Badge>
            )}
            {mode === "rejected" && <Badge color="slate">差戻し済み</Badge>}
          </div>

          <h3 className="mt-4 break-words text-xl font-black leading-relaxed text-white sm:text-2xl">
            {post.behavior}
          </h3>

          <div className="mt-3 grid gap-1 text-sm font-bold text-slate-400">
            <p>投稿者：{post.employee_name || "テスト社員"}</p>
            <p>投稿日：{formatDate(post.created_at)}</p>
            {mode !== "pending" && <p>評価日：{formatDate(post.reviewed_at)}</p>}
          </div>
        </div>

        <BiasInsightCard aiPoint={aiPoint} bias={bias} />
      </div>

      <AiCommentPanel post={post} aiPoint={aiPoint} bias={bias} />

      {mode === "pending" && (
        <>
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <p className="text-sm font-black text-slate-300">評価ポイント</p>

            <div
              className="mt-4 grid gap-3"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              }}
            >
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
                  {point}P
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-bold leading-6 text-emerald-200">
              承認すると {currentPoints}P / ¥
              {estimatedValue.toLocaleString()} の人的資本価値として確定します。
            </div>

            <textarea
              value={comments[post.id] ?? ""}
              onChange={(e) =>
                setComments((prev) => ({
                  ...prev,
                  [post.id]: e.target.value,
                }))
              }
              placeholder="上司コメントを入力（例：AI分析コメントと推定ROIを確認し、妥当と判断）"
              className="mt-4 min-h-24 w-full resize-y rounded-2xl border border-white/10 bg-[#071326] p-4 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => approvePost(post.id)}
              className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-4 font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5"
            >
              承認して価値確定
            </button>

            <button
              onClick={() => rejectPost(post.id)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 font-black text-slate-300 transition hover:border-red-400/40 hover:text-red-300"
            >
              差戻し
            </button>
          </div>
        </>
      )}

      {mode === "approved" && (
        <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-bold leading-6 text-emerald-200">
          この行動は {confirmedPoints}P / ¥
          {confirmedValue.toLocaleString()} として価値確定済みです。
          {post.manager_comment && (
            <p className="mt-2 text-emerald-100">
              上司コメント：{post.manager_comment}
            </p>
          )}
        </div>
      )}

      {mode === "rejected" && (
        <div className="mt-5 rounded-2xl border border-slate-400/20 bg-slate-400/10 p-4 text-sm font-bold leading-6 text-slate-300">
          この行動は差戻し済みです。
          {post.manager_comment && (
            <p className="mt-2 text-slate-200">
              上司コメント：{post.manager_comment}
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
    <div className="mt-5 w-full max-w-full overflow-hidden rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge color="emerald">AI推定 {aiPoint}P</Badge>

        <Badge color="sky">
          信頼度 {post.confidence_score ?? bias.trustScore}
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
          AI分析コメント
        </p>

        <p className="mt-3 break-words text-sm leading-7 text-slate-200">
          {post.ai_comment || "人的資本行動として分析中です。"}
        </p>
      </div>

      <div
        className="mt-4 grid gap-3"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
        }}
      >
        <AiMetric label="推定ROI-P" value={`${aiPoint}P`} />
        <AiMetric
          label="推定財務効果"
          value={
            typeof post.estimated_value === "number"
              ? `¥${post.estimated_value.toLocaleString()}`
              : "-"
          }
        />
        <AiMetric
          label="推定削減時間"
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
    <div className="min-w-0 rounded-2xl border border-white/10 bg-[#071326]/70 p-4">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-2 break-words text-lg font-black text-cyan-200">
        {value}
      </p>
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
    <div className="w-full max-w-full rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 xl:w-[250px] xl:shrink-0">
      <p className="text-xs font-black text-emerald-300">AI評価補助</p>

      <div className="mt-3 grid gap-3">
        <InsightRow label="推奨ROI-P" value={`${aiPoint}P`} />
        <InsightRow label="信頼スコア" value={bias.trustScore} />
        <InsightRow
          label="部門平均との差"
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
        {bias.hasWarning ? "⚠ " : "✓ "}
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
    <div className="relative min-w-0 overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-[#0b1220] via-[#101827] to-[#062c28] p-5 shadow-xl sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_42%)]" />

      <div className="relative z-10 min-w-0">
        <p className="text-sm font-black text-slate-400">{title}</p>
        <p
          className={`mt-5 break-words text-2xl font-black sm:text-3xl ${
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
      className={`inline-flex max-w-full break-words rounded-full border px-3 py-1 text-xs font-black ${colorClass}`}
    >
      {children}
    </span>
  );
}