"use client";

import LogoutButton from "../components/LogoutButton";
import AuthGuard from "../components/AuthGuard";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type DepartmentSummary = {
  count: number;
  roi_points: number;
  estimated_value: number;
  estimated_hours_saved: number;
  average_confidence: number;
};

type BiasAlert = {
  department: string;
  category: string;
  diff: number;
  risk: string;
  detail: string;
  department_average_roi: number;
  company_average_roi: number;
  count: number;
};

type Summary = {
  bias_alerts: BiasAlert[];
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  target_roi_points: number;
  target_value: number;
  total_roi_points: number;
  total_estimated_value: number;
  total_hours_saved: number;
  achievement_rate: number;
  average_confidence: number;
  departments: Record<string, DepartmentSummary>;
};

type PostItem = {
  id: number;
  employee_name: string;
  department: string;
  behavior: string;
  category: string;
  status: string;
  roi_points?: number;
  confidence_score: number;
  ai_comment: string;
  manager_comment?: string;
  manager_points?: number;
  created_at: string;
};

type AttentionDepartment = {
  department: string;
  post_count: number;
  approved_count: number;
  pending_count: number;
  total_points: number;
  total_roi: number;
  attention_score: number;
  level: string;
  label: string;
  reason: string;
  recommended_actions: string[];
};

type DynamicRoiTrendItem = {
  month: string;
  points: number;
  count: number;
  financial_impact: number;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://human-capital-os-api.onrender.com";

const ALL_DEPARTMENTS = "全部門";
const VALUE_PER_POINT = 10000;

function normalizeDepartmentName(name?: string | null) {
  const value = (name || "未設定").trim();

  if (value === "営業部" || value === "営業") return "営業部";
  if (value === "本社" || value === "本社部門") return "本社";

  if (
    value === "業務運用部門" ||
    value === "業務運用" ||
    value === "現場"
  ) {
    return "業務運用部門";
  }

  return value;
}

function normalizeRfpPoint(value?: number | null) {
  const point = Number(value ?? 0);

  if (point >= 10) return 10;
  if (point >= 5) return 5;
  if (point >= 1) return 1;
  return 0;
}

function isApproved(post: PostItem) {
  return String(post.status || "").trim().toLowerCase() === "approved";
}

function isPending(post: PostItem) {
  return String(post.status || "").trim().toLowerCase() === "pending";
}

function getPostPoint(post: PostItem) {
  return normalizeRfpPoint(post.manager_points ?? post.roi_points ?? 0);
}

function rfpLevelLabel(point?: number | null) {
  const normalized = normalizeRfpPoint(point);

  if (normalized === 10) return "Lv.3 / 10P";
  if (normalized === 5) return "Lv.2 / 5P";
  if (normalized === 1) return "Lv.1 / 1P";
  return "未評価";
}

function formatIntegerPoint(value?: number | null) {
  return `${Math.round(Number(value || 0)).toLocaleString()}P`;
}

function getDepartmentDisplayStatus(
  department: string,
  postCount: number,
  pendingCount: number,
  roiPoints: number
) {
  const name = normalizeDepartmentName(department);
  const averagePoint = postCount > 0 ? roiPoints / postCount : 0;

  if (name === "業務運用部門") {
    return {
      level: "high",
      label: "要支援",
      headline: "挑戦行動の質・承認滞留に注意",
      reason:
        "投稿は発生しているものの、ROI-Pが低位で、挑戦・学習よりも改善対応に偏っています。経営として支援すべき部門候補です。",
      actions: ["上司レビュー促進", "挑戦テーマ再設計", "営業部事例の横展開"],
    };
  }

  if (name === "営業部") {
    return {
      level: "low",
      label: "好調",
      headline: "挑戦行動が継続的に発生",
      reason:
        "高評価の挑戦行動が多く、成功事例として他部門へ横展開できる状態です。",
      actions: ["成功事例共有", "横展開候補化", "表彰・称賛"],
    };
  }

  if (name === "本社") {
    return {
      level: "middle",
      label: "安定",
      headline: "挑戦行動は一定水準",
      reason:
        "大きな問題はないものの、営業部と比べると挑戦行動の量・ROI-Pに伸びしろがあります。",
      actions: ["巻き込み強化", "部門横断テーマ設定", "投稿促進"],
    };
  }

  if (pendingCount >= 3 || averagePoint < 5) {
    return {
      level: "high",
      label: "要支援",
      headline: "承認滞留またはROI-P低位",
      reason:
        "承認待ちまたは低評価の投稿が目立ちます。上司レビューと挑戦テーマの再設計が必要です。",
      actions: ["上司レビュー促進", "テーマ再設計", "個別支援"],
    };
  }

  return {
    level: "middle",
    label: "確認",
    headline: "状況確認が必要",
    reason:
      "投稿状況と評価傾向を確認し、次の支援アクションを検討してください。",
    actions: ["状況確認", "投稿促進", "横展開検討"],
  };
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [attentionDepartments, setAttentionDepartments] = useState<
    AttentionDepartment[]
  >([]);
  const [selectedDepartment, setSelectedDepartment] =
    useState(ALL_DEPARTMENTS);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");

        const authHeaders: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const [summaryRes, postsRes, attentionRes] = await Promise.all([
          fetch(`${API_BASE}/api/posts/summary`, {
            cache: "no-store",
            headers: authHeaders,
          }),
          fetch(`${API_BASE}/api/posts`, {
            cache: "no-store",
            headers: authHeaders,
          }),
          fetch(`${API_BASE}/api/analytics/attention-departments`, {
            cache: "no-store",
            headers: authHeaders,
          }),
        ]);

        if (!summaryRes.ok || !postsRes.ok || !attentionRes.ok) {
          setErrorMessage(
            `Dashboard API取得失敗: summary=${summaryRes.status}, posts=${postsRes.status}, attention=${attentionRes.status}`
          );

          setSummary(null);
          setPosts([]);
          setAttentionDepartments([]);
          return;
        }

        const summaryData = await summaryRes.json();
        const postsData = await postsRes.json();
        const attentionData = await attentionRes.json();

        const rawPosts = Array.isArray(postsData)
          ? postsData
          : Array.isArray(postsData.data)
          ? postsData.data
          : [];

        const rawAttention = Array.isArray(attentionData.data)
          ? attentionData.data
          : [];

        const normalizedAttention: AttentionDepartment[] = rawAttention.map(
          (dept: AttentionDepartment) => ({
            ...dept,
            department: normalizeDepartmentName(dept.department),
          })
        );

        const mergedAttention = mergeAttentionDepartments(normalizedAttention);

        setSummary(summaryData);
        setPosts(rawPosts);
        setAttentionDepartments(mergedAttention);
        setErrorMessage("");

        const operationDept = mergedAttention.find(
          (dept) => dept.department === "業務運用部門"
        );

        if (operationDept?.department) {
          setSelectedDepartment(operationDept.department);
        } else if (mergedAttention[0]?.department) {
          setSelectedDepartment(mergedAttention[0].department);
        } else {
          setSelectedDepartment(ALL_DEPARTMENTS);
        }
      } catch (error) {
        console.error("dashboard fetch error", error);

        setErrorMessage(
          "Dashboard API取得に失敗しました。backend起動・JWT・CORSを確認してください。"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const targetRoiPoints = summary?.target_roi_points ?? 6000;
  const averageConfidence = Math.round(summary?.average_confidence ?? 0);
  const departmentBiasAlerts = summary?.bias_alerts ?? [];

  const departmentRfpPoints = useMemo(() => {
    const map = new Map<string, number>();

    for (const post of posts) {
      if (!isApproved(post)) continue;

      const department = normalizeDepartmentName(post.department);
      const point = getPostPoint(post);

      map.set(department, (map.get(department) ?? 0) + point);
    }

    return map;
  }, [posts]);

  const departmentPostStats = useMemo(() => {
    const map = new Map<
      string,
      { postCount: number; approvedCount: number; pendingCount: number }
    >();

    for (const post of posts) {
      const department = normalizeDepartmentName(post.department);
      const current = map.get(department) ?? {
        postCount: 0,
        approvedCount: 0,
        pendingCount: 0,
      };

      map.set(department, {
        postCount: current.postCount + 1,
        approvedCount: current.approvedCount + (isApproved(post) ? 1 : 0),
        pendingCount: current.pendingCount + (isPending(post) ? 1 : 0),
      });
    }

    return map;
  }, [posts]);

  const departmentExecutiveStats = useMemo(() => {
    const map = new Map<
      string,
      {
        hoursSaved: number;
        estimatedValue: number;
        averageConfidence: number;
      }
    >();

    if (summary?.departments) {
      Object.entries(summary.departments).forEach(([rawDepartment, value]) => {
        const department = normalizeDepartmentName(rawDepartment);

        map.set(department, {
          hoursSaved: Number(value.estimated_hours_saved || 0),
          estimatedValue: Number(value.estimated_value || 0),
          averageConfidence: Number(value.average_confidence || 0),
        });
      });
    }

    const confidenceMap = new Map<
      string,
      { confidenceTotal: number; confidenceCount: number }
    >();

    posts.forEach((post) => {
      const department = normalizeDepartmentName(post.department);
      const current = confidenceMap.get(department) ?? {
        confidenceTotal: 0,
        confidenceCount: 0,
      };

      confidenceMap.set(department, {
        confidenceTotal:
          current.confidenceTotal + Number(post.confidence_score || 0),
        confidenceCount: current.confidenceCount + 1,
      });
    });

    confidenceMap.forEach((value, department) => {
      const current = map.get(department) ?? {
        hoursSaved: 0,
        estimatedValue: 0,
        averageConfidence: 0,
      };

      const fallbackConfidence =
        value.confidenceCount > 0
          ? value.confidenceTotal / value.confidenceCount
          : 0;

      map.set(department, {
        ...current,
        averageConfidence:
          current.averageConfidence > 0
            ? current.averageConfidence
            : fallbackConfidence,
      });
    });

    return map;
  }, [posts, summary]);

  const rfpTotalPoints = useMemo(() => {
    return Array.from(departmentRfpPoints.values()).reduce(
      (sum, point) => sum + point,
      0
    );
  }, [departmentRfpPoints]);

  const achievementRate =
    targetRoiPoints > 0
      ? ((rfpTotalPoints / targetRoiPoints) * 100).toFixed(2)
      : "0.00";

  const dynamicRoiTrend = useMemo<DynamicRoiTrendItem[]>(() => {
    const monthlyMap = new Map<string, { points: number; count: number }>();

    posts
      .filter((post) => isApproved(post))
      .forEach((post) => {
        const date = new Date(post.created_at);
        if (Number.isNaN(date.getTime())) return;

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const monthKey = `${year}-${month}`;
        const point = getPostPoint(post);

        const current = monthlyMap.get(monthKey) ?? {
          points: 0,
          count: 0,
        };

        monthlyMap.set(monthKey, {
          points: current.points + point,
          count: current.count + 1,
        });
      });

    return Array.from(monthlyMap.entries())
      .map(([month, value]) => ({
        month,
        points: value.points,
        count: value.count,
        financial_impact: value.points * VALUE_PER_POINT,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [posts]);

  const primaryBiasAlert = useMemo(() => {
    if (departmentBiasAlerts.length === 0) return null;

    return [...departmentBiasAlerts].sort(
      (a, b) => Math.abs(b.diff) - Math.abs(a.diff)
    )[0];
  }, [departmentBiasAlerts]);

  const departmentOptions = useMemo(() => {
    const names = Array.from(
      new Set(posts.map((post) => normalizeDepartmentName(post.department)))
    ).filter(Boolean);

    return [ALL_DEPARTMENTS, ...names];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (selectedDepartment === ALL_DEPARTMENTS) {
      return posts.slice(0, 4);
    }

    return posts
      .filter(
        (post) =>
          normalizeDepartmentName(post.department) === selectedDepartment
      )
      .slice(0, 4);
  }, [posts, selectedDepartment]);

  const executiveAttentionDepartments = useMemo(() => {
    const departmentNames = Array.from(
      new Set(posts.map((post) => normalizeDepartmentName(post.department)))
    );

    const fromPosts = departmentNames.map((department) => {
      const stats = departmentPostStats.get(department) ?? {
        postCount: 0,
        approvedCount: 0,
        pendingCount: 0,
      };
      const roiPoints = departmentRfpPoints.get(department) ?? 0;
      const status = getDepartmentDisplayStatus(
        department,
        stats.postCount,
        stats.pendingCount,
        roiPoints
      );

      let baseScore = 0;
      if (department === "業務運用部門") baseScore = 300;
      else if (department === "本社") baseScore = 180;
      else if (department === "営業部") baseScore = 80;
      else baseScore = 120;

      return {
        department,
        post_count: stats.postCount,
        approved_count: stats.approvedCount,
        pending_count: stats.pendingCount,
        total_points: roiPoints,
        total_roi: roiPoints,
        attention_score:
          baseScore + stats.pendingCount * 20 + Math.max(0, 8 - roiPoints),
        level: status.level,
        label: status.label,
        reason: status.reason,
        recommended_actions: status.actions,
      };
    });

    if (fromPosts.length > 0) {
      return fromPosts.sort((a, b) => b.attention_score - a.attention_score);
    }

    return attentionDepartments;
  }, [posts, departmentPostStats, departmentRfpPoints, attentionDepartments]);

  const managementFocusAverages = useMemo(() => {
    const targets = executiveAttentionDepartments.slice(0, 4);
    const count = targets.length || 1;

    const totalPending = targets.reduce(
      (sum, dept) => sum + dept.pending_count,
      0
    );
    const totalPosts = targets.reduce((sum, dept) => sum + dept.post_count, 0);
    const totalRoi = targets.reduce((sum, dept) => {
      const departmentName = normalizeDepartmentName(dept.department);
      return sum + (departmentRfpPoints.get(departmentName) ?? 0);
    }, 0);
    const totalHours = targets.reduce((sum, dept) => {
      const departmentName = normalizeDepartmentName(dept.department);
      return (
        sum +
        (departmentExecutiveStats.get(departmentName)?.hoursSaved ?? 0)
      );
    }, 0);
    const totalConfidence = targets.reduce((sum, dept) => {
      const departmentName = normalizeDepartmentName(dept.department);
      return (
        sum +
        (departmentExecutiveStats.get(departmentName)?.averageConfidence ?? 0)
      );
    }, 0);

    return {
      pending: totalPending / count,
      posts: totalPosts / count,
      roi: totalRoi / count,
      hours: totalHours / count,
      confidence: totalConfidence / count,
    };
  }, [executiveAttentionDepartments, departmentRfpPoints, departmentExecutiveStats]);

  const summaryCards = [
    {
      title: "全社ROI-P",
      value: formatIntegerPoint(rfpTotalPoints),
      sub: "承認された挑戦行動を経営価値へ換算",
    },
    {
      title: "推定財務インパクト",
      value: formatMoney(rfpTotalPoints * VALUE_PER_POINT),
      sub: "挑戦行動による削減時間・品質改善効果を金額換算",
    },
    {
      title: "達成率",
      value: `${achievementRate}%`,
      sub: "2026年度KGI進捗",
    },
    {
      title: "未承認",
      value: `${summary?.pending ?? 0}件`,
      sub: "上司確認待ち・評価滞留",
    },
  ];

  if (loading) {
    return (
      <AuthGuard>
        <main style={styles.page}>
          <section style={styles.container}>
            <p style={styles.kicker}>HUMAN CAPITAL OS</p>
            <h1 style={styles.title}>Dashboardを読み込み中...</h1>
          </section>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <main style={styles.page}>
        <section style={styles.container}>
          {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}

          <div style={styles.hero}>
            <div style={styles.heroText}>
              <p style={styles.kicker}>HUMAN CAPITAL OS</p>

              <h1 style={styles.title}>
                現場⇔経営をつなぎ、
                <br />
                現場を動かす人的資本OS
              </h1>

              <p style={styles.description}>
                挑戦行動を可視化し、上司評価・ROI換算・経営判断へ接続します。
              </p>
            </div>

            <div style={styles.logoutArea}>
              <LogoutButton />
            </div>
          </div>

          <div style={styles.summaryGrid}>
            {summaryCards.map((card) => (
              <Card key={card.title}>
                <p style={styles.cardLabel}>{card.title}</p>
                <p style={styles.cardValue}>{card.value}</p>
                <p style={styles.cardSub}>{card.sub}</p>
              </Card>
            ))}
          </div>

          <div style={styles.twoColumn}>
            <Panel title="KGI進捗" tag="KGI">
              <div style={styles.kgiTop}>
                <div style={styles.flexItemMin}>
                  <p style={styles.bigValue}>{achievementRate}%</p>

                  <p style={styles.muted}>
                    {formatIntegerPoint(rfpTotalPoints)} /{" "}
                    {targetRoiPoints.toLocaleString()}P
                  </p>
                </div>

                <div style={styles.badge}>
                  目標 {formatMoney(targetRoiPoints * VALUE_PER_POINT)}
                </div>
              </div>

              <Progress value={Number(achievementRate)} />

              <div style={styles.miniGrid}>
                <MiniCard
                  label="現在実績"
                  value={formatMoney(rfpTotalPoints * VALUE_PER_POINT)}
                />
                <MiniCard label="承認済み" value={`${summary?.approved ?? 0}件`} />
                <MiniCard label="AI信頼度" value={`${averageConfidence}%`} />
              </div>
            </Panel>

            <Panel title="価値変換ロジック" tag="LOGIC">
              <FlowItem
                step="01"
                title="現場の挑戦行動を収集"
                text="挑戦・改善・共有・学習を短文で入力"
              />
              <FlowItem
                step="02"
                title="AI補完＋上司評価"
                text="AIが意味づけし、最終評価は上司が確認"
              />
              <FlowItem
                step="03"
                title="ROI換算し経営判断へ接続"
                text="削減時間・品質改善効果を推定し、部門支援の判断材料にする"
              />
            </Panel>
          </div>

          <Panel title="経営アクション部門" tag="MANAGEMENT FOCUS">
            <p style={styles.panelLead}>
              現場の挑戦行動を、経営が支援・横展開すべき部門単位で可視化
            </p>

            <div style={styles.attentionList}>
              {executiveAttentionDepartments.length === 0 ? (
                <div style={styles.emptyBox}>
                  部門別データがまだありません。
                </div>
              ) : (
                executiveAttentionDepartments.slice(0, 4).map((dept, index) => {
                  const departmentName = normalizeDepartmentName(
                    dept.department
                  );
                  const executiveStats =
                    departmentExecutiveStats.get(departmentName);
                  const departmentRoiPoints =
                    departmentRfpPoints.get(departmentName) ?? 0;
                  const departmentHoursSaved = Math.round(
                    executiveStats?.hoursSaved ?? 0
                  );
                  const departmentConfidence = Math.round(
                    executiveStats?.averageConfidence ?? 0
                  );
                  const pendingDiff = Math.round(
                    dept.pending_count - managementFocusAverages.pending
                  );
                  const postDiff = Math.round(
                    dept.post_count - managementFocusAverages.posts
                  );
                  const roiDiff = Math.round(
                    departmentRoiPoints - managementFocusAverages.roi
                  );
                  const hoursDiff = Math.round(
                    departmentHoursSaved - managementFocusAverages.hours
                  );
                  const confidenceDiff = Math.round(
                    departmentConfidence - managementFocusAverages.confidence
                  );

                  return (
                    <button
                      key={`${dept.department}-${index}`}
                      type="button"
                      style={{
                        ...styles.attentionCard,
                        ...(selectedDepartment === dept.department
                          ? styles.attentionCardSelected
                          : {}),
                        ...(dept.level === "high"
                          ? styles.attentionCardHigh
                          : {}),
                      }}
                      onClick={() => setSelectedDepartment(departmentName)}
                    >
                      <div style={styles.attentionHeader}>
                        <div style={styles.flexItemMin}>
                          <p style={styles.attentionRank}>#{index + 1}</p>
                          <h3 style={styles.attentionDept}>{dept.department}</h3>
                        </div>

                        <span
                          style={{
                            ...styles.attentionBadge,
                            ...(dept.level === "high"
                              ? styles.attentionHigh
                              : dept.level === "middle"
                              ? styles.attentionMiddle
                              : styles.attentionLow),
                          }}
                        >
                          {dept.label}
                        </span>
                      </div>

                      <p style={styles.attentionHeadline}>
                        {
                          getDepartmentDisplayStatus(
                            dept.department,
                            dept.post_count,
                            dept.pending_count,
                            departmentRoiPoints
                          ).headline
                        }
                      </p>

                      <div style={styles.attentionMetrics}>
                        <MetricRow
                          label="ROI-P"
                          value={`${departmentRoiPoints.toLocaleString()}P`}
                          diff={roiDiff}
                          suffix="P"
                        />

                        <MetricRow
                          label="投稿"
                          value={`${dept.post_count}件`}
                          diff={postDiff}
                          suffix="件"
                        />

                        <MetricRow
                          label="削減時間"
                          value={`${departmentHoursSaved.toLocaleString()}h`}
                          diff={hoursDiff}
                          suffix="h"
                        />

                        <MetricRow
                          label="未承認"
                          value={`${dept.pending_count}件`}
                          diff={pendingDiff}
                          suffix="件"
                          reverse
                        />

                        <MetricRow
                          label="AI信頼度"
                          value={`${departmentConfidence}%`}
                          diff={confidenceDiff}
                          suffix="pt"
                        />
                      </div>

                      <p style={styles.attentionReason}>{dept.reason}</p>

                      <div style={styles.recommendBox}>
                        <p style={styles.recommendTitle}>推奨アクション</p>

                        <div style={styles.recommendList}>
                          {dept.recommended_actions?.map((action, idx) => (
                            <span key={idx} style={styles.recommendTag}>
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Panel>

          <Panel title="部門別アクション詳細" tag="FIELD ACTION">
            <div style={styles.filterBar}>
              <div style={styles.filterLeft}>
                <p style={styles.filterLabel}>対象部門</p>

                <select
                  value={selectedDepartment}
                  onChange={(event) =>
                    setSelectedDepartment(
                      normalizeDepartmentName(event.target.value)
                    )
                  }
                  style={styles.select}
                >
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <p style={styles.filterNote}>
                部門ごとの現場投稿・上司評価・AI分析を確認
              </p>
            </div>

            <div style={styles.aiInsightList}>
              {filteredPosts.length === 0 ? (
                <div style={styles.emptyBox}>
                  選択した部門の投稿データがありません。
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <div key={post.id} style={styles.aiInsightCard}>
                    <div style={styles.aiInsightTop}>
                      <div style={styles.flexItemMin}>
                        <strong style={styles.postName}>
                          {post.employee_name}
                        </strong>

                        <span style={styles.aiInsightMeta}>
                          {normalizeDepartmentName(post.department)} /{" "}
                          {statusLabel(post.status)}
                        </span>
                      </div>

                      <div style={styles.aiBadgeGroup}>
                        <span style={styles.aiBadge}>
                          AI推奨 {rfpLevelLabel(post.roi_points)}
                        </span>

                        <span
                          style={{
                            ...styles.aiBadge,
                            ...getConfidenceColor(post.confidence_score),
                          }}
                        >
                          信頼度{" "}
                          {Math.round(Number(post.confidence_score || 0))}%
                        </span>
                      </div>
                    </div>

                    <div style={styles.detailBlock}>
                      <span style={styles.detailLabel}>社員入力</span>
                      <p style={styles.aiBehavior}>{post.behavior}</p>
                    </div>

                    <div style={styles.detailGrid}>
                      <div style={styles.aiCommentBox}>
                        <span style={styles.aiLabel}>AI分析</span>
                        <p>{post.ai_comment || "AIコメント未生成"}</p>
                      </div>

                      <div style={styles.managerCommentBox}>
                        <span style={styles.managerLabel}>上司コメント</span>
                        <p>{post.manager_comment || "上司コメント未入力"}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <div style={styles.twoColumn}>
            <Panel title="部門間評価乖離" tag="BIAS ALERT">
              {!primaryBiasAlert ? (
                <div style={styles.emptyBox}>
                  評価差アラートはありません。
                </div>
              ) : (
                <div style={styles.biasFocusCard}>
                  <div style={styles.biasFocusHeader}>
                    <div style={styles.flexItemMin}>
                      <p style={styles.biasFocusLabel}>
                        評価傾向確認（良し悪し判定ではない）
                      </p>

                      <h3 style={styles.biasFocusDept}>
                        {normalizeDepartmentName(primaryBiasAlert.department)} /{" "}
                        {primaryBiasAlert.category}
                      </h3>
                    </div>

                    <span style={styles.biasFocusBadge}>他部門比較</span>
                  </div>

                  <div style={styles.biasFocusBody}>
                    <div style={styles.biasSubMetrics}>
                      <div style={styles.biasSubMetricBox}>
                        <span>部門平均ROI-P</span>
                        <strong>
                          {Number(
                            primaryBiasAlert.department_average_roi || 0
                          ).toFixed(1)}
                          P
                        </strong>
                      </div>

                      <div style={styles.biasSubMetricBox}>
                        <span>全社平均ROI-P</span>
                        <strong>
                          {Number(
                            primaryBiasAlert.company_average_roi || 0
                          ).toFixed(1)}
                          P
                        </strong>
                      </div>

                      <div style={styles.biasSubMetricBox}>
                        <span>評価倍率</span>
                        <strong style={styles.biasDiffCompact}>
                          {(
                            Number(primaryBiasAlert.department_average_roi || 0) /
                            Math.max(
                              Number(primaryBiasAlert.company_average_roi || 0),
                              0.1
                            )
                          ).toFixed(1)}
                          倍
                        </strong>
                      </div>
                    </div>
                  </div>

                  <p style={styles.biasFocusDetail}>
                    この指標は成果評価ではなく、「他部門と比較して評価が高め・
                    低めに出ていないか」を確認するための指標です。
                    経営アクション部門の「要支援」「好調」とは別軸で確認します。
                    対象件数：{primaryBiasAlert.count}件
                  </p>

                  <div style={styles.biasPoCNote}>
                    <strong>評価補助PoC：</strong>
                    社員投稿・上司評価・部門平均との差分から評価傾向を検知。
                    AIが評価を決定するのではなく、
                    上司が確認すべき論点を補助します。
                  </div>
                </div>
              )}
            </Panel>

            <Panel title="人的資本ROI-Pトレンド" tag="TREND">
              <p style={styles.panelLead}>
                現場で生まれた挑戦行動を経営価値へ換算し、
                月次で可視化します。
              </p>

              <div style={styles.chartBox}>
                {dynamicRoiTrend.length === 0 ? (
                  <div style={styles.emptyBox}>
                    承認済み投稿がまだないため、ROIトレンドデータはありません。
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dynamicRoiTrend}>
                      <CartesianGrid stroke="rgba(148,163,184,0.12)" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis
                        stroke="#94a3b8"
                        tickFormatter={(value) =>
                          `${Math.round(Number(value || 0))}P`
                        }
                      />
                      <Tooltip
                        contentStyle={styles.tooltip}
                        labelStyle={{ color: "#e5e7eb" }}
                        formatter={(value) => [
                          `${Math.round(Number(value || 0)).toLocaleString()}P`,
                          "ROI-P",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="points"
                        stroke="#10b981"
                        strokeWidth={4}
                        dot={{ r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Panel>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}

function MetricRow({
  label,
  value,
  diff,
  suffix,
  reverse = false,
}: {
  label: string;
  value: string;
  diff: number;
  suffix: string;
  reverse?: boolean;
}) {
  return (
    <div style={styles.attentionMetricRow}>
      <span style={styles.metricRowLabel}>{label}</span>

      <div style={styles.metricRowBody}>
        <strong style={styles.metricRowValue}>{value}</strong>
        <MetricDiff value={diff} suffix={suffix} reverse={reverse} />
      </div>
    </div>
  );
}

function MetricDiff({
  value,
  suffix,
  reverse = false,
}: {
  value: number;
  suffix: string;
  reverse?: boolean;
}) {
  const diffStyle = reverse
    ? value > 0
      ? styles.metricDiffNegative
      : value < 0
      ? styles.metricDiffPositive
      : styles.metricDiffNeutral
    : value > 0
    ? styles.metricDiffPositive
    : value < 0
    ? styles.metricDiffNegative
    : styles.metricDiffNeutral;

  return (
    <span style={{ ...styles.metricDiff, ...diffStyle }}>
      平均比 {value >= 0 ? "+" : ""}
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

function mergeAttentionDepartments(items: AttentionDepartment[]) {
  const map = new Map<string, AttentionDepartment>();

  for (const item of items) {
    const name = normalizeDepartmentName(item.department);
    const current = map.get(name);

    if (!current) {
      map.set(name, { ...item, department: name });
      continue;
    }

    map.set(name, {
      ...current,
      department: name,
      post_count: current.post_count + item.post_count,
      approved_count: current.approved_count + item.approved_count,
      pending_count: current.pending_count + item.pending_count,
      total_points: current.total_points + item.total_points,
      total_roi: current.total_roi + item.total_roi,
      attention_score: Math.max(current.attention_score, item.attention_score),
      level:
        current.level === "high" || item.level === "high"
          ? "high"
          : current.level,
      label: current.label || item.label,
      reason: current.reason || item.reason,
      recommended_actions: Array.from(
        new Set([
          ...(current.recommended_actions || []),
          ...(item.recommended_actions || []),
        ])
      ),
    });
  }

  return Array.from(map.values()).sort(
    (a, b) => b.attention_score - a.attention_score
  );
}

function getConfidenceColor(score: number): CSSProperties {
  if (score >= 80) {
    return {
      background: "rgba(16,185,129,0.18)",
      color: "#6ee7b7",
      border: "1px solid rgba(110,231,183,0.35)",
    };
  }

  if (score >= 60) {
    return {
      background: "rgba(234,179,8,0.18)",
      color: "#fde68a",
      border: "1px solid rgba(253,224,71,0.35)",
    };
  }

  return {
    background: "rgba(239,68,68,0.18)",
    color: "#fca5a5",
    border: "1px solid rgba(252,165,165,0.35)",
  };
}

function formatMoney(value: number) {
  return `¥${Math.round(Number(value || 0)).toLocaleString()}`;
}

function statusLabel(status: string) {
  if (status === "approved") return "承認済み";
  if (status === "rejected") return "差戻し";
  return "未承認";
}

function Card({ children }: { children: ReactNode }) {
  return <div style={styles.card}>{children}</div>;
}

function Panel({
  title,
  tag,
  children,
}: {
  title: string;
  tag: string;
  children: ReactNode;
}) {
  return (
    <section style={styles.panel}>
      <p style={styles.panelTag}>{tag}</p>
      <h2 style={styles.panelTitle}>{title}</h2>
      {children}
    </section>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.miniCard}>
      <p style={styles.miniCardLabel}>{label}</p>
      <strong style={styles.miniCardValue}>{value}</strong>
    </div>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div style={styles.progressBase}>
      <div
        style={{
          ...styles.progressBar,
          width: `${Math.min(value, 100)}%`,
        }}
      />
    </div>
  );
}

function FlowItem({
  step,
  title,
  text,
}: {
  step: string;
  title: string;
  text: string;
}) {
  return (
    <div style={styles.flowItem}>
      <div style={styles.stepCircle}>{step}</div>

      <div style={styles.flexItemMin}>
        <strong style={styles.flowTitle}>{title}</strong>
        <p style={styles.flowText}>{text}</p>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(16,185,129,0.18), transparent 34%), linear-gradient(135deg, #020617 0%, #07111f 48%, #020617 100%)",
    color: "#e5e7eb",
    padding: "clamp(14px, 4vw, 40px)",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    overflowX: "hidden",
    boxSizing: "border-box",
  },
  container: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    boxSizing: "border-box",
  },
  flexItemMin: { minWidth: 0 },
  errorBox: {
    marginBottom: "20px",
    padding: "16px 20px",
    borderRadius: "18px",
    background: "rgba(239,68,68,0.14)",
    border: "1px solid rgba(248,113,113,0.35)",
    color: "#fecaca",
    fontSize: "14px",
    fontWeight: 800,
    lineHeight: 1.7,
  },
  hero: {
    marginBottom: "30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "24px",
    flexWrap: "wrap",
  },
  heroText: { flex: "1 1 420px", minWidth: 0 },
  logoutArea: { flex: "0 0 auto" },
  kicker: {
    color: "#34d399",
    fontSize: "14px",
    fontWeight: 900,
    letterSpacing: "0.12em",
    marginBottom: "10px",
  },
  title: {
    fontSize: "clamp(28px, 6vw, 46px)",
    lineHeight: 1.18,
    fontWeight: 900,
    margin: 0,
    color: "#f8fafc",
    wordBreak: "keep-all",
    overflowWrap: "break-word",
  },
  description: {
    marginTop: "18px",
    color: "#cbd5e1",
    fontSize: "clamp(15px, 2.4vw, 19px)",
    lineHeight: 1.8,
    maxWidth: "980px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
    gap: "14px",
    marginBottom: "26px",
  },
  card: {
    minWidth: 0,
    background: "rgba(15,23,42,0.84)",
    border: "1px solid rgba(52,211,153,0.2)",
    borderRadius: "24px",
    padding: "clamp(16px, 3vw, 24px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.34)",
    boxSizing: "border-box",
  },
  cardLabel: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "14px",
    fontWeight: 800,
    lineHeight: 1.4,
  },
  cardValue: {
    margin: "12px 0 8px",
    fontSize: "clamp(26px, 6vw, 40px)",
    fontWeight: 900,
    color: "#f8fafc",
    lineHeight: 1.1,
    overflowWrap: "break-word",
  },
  cardSub: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    gap: "22px",
    marginBottom: "26px",
  },
  panel: {
    minWidth: 0,
    background: "rgba(15,23,42,0.86)",
    border: "1px solid rgba(52,211,153,0.2)",
    borderRadius: "28px",
    padding: "clamp(18px, 3vw, 28px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.34)",
    marginBottom: "26px",
    boxSizing: "border-box",
  },
  panelTag: {
    margin: 0,
    color: "#34d399",
    fontSize: "13px",
    fontWeight: 900,
    letterSpacing: "0.1em",
  },
  panelTitle: {
    margin: "8px 0 22px",
    fontSize: "clamp(21px, 4.8vw, 30px)",
    color: "#f8fafc",
    lineHeight: 1.3,
    overflowWrap: "break-word",
  },
  panelLead: {
    margin: "-8px 0 20px",
    color: "#cbd5e1",
    fontSize: "clamp(15px, 2.3vw, 17px)",
    lineHeight: 1.7,
  },
  kgiTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "18px",
    gap: "16px",
    flexWrap: "wrap",
  },
  bigValue: {
    margin: 0,
    fontSize: "clamp(38px, 10vw, 56px)",
    fontWeight: 900,
    color: "#6ee7b7",
    lineHeight: 1.05,
  },
  muted: {
    margin: "6px 0 0",
    color: "#cbd5e1",
    fontSize: "15px",
    lineHeight: 1.5,
  },
  badge: {
    padding: "10px 16px",
    borderRadius: "999px",
    background: "rgba(16,185,129,0.14)",
    border: "1px solid rgba(16,185,129,0.24)",
    color: "#a7f3d0",
    fontSize: "13px",
    fontWeight: 900,
    whiteSpace: "nowrap",
    flex: "0 0 auto",
  },
  progressBase: {
    height: "13px",
    background: "rgba(2,6,23,0.8)",
    borderRadius: "999px",
    overflow: "hidden",
    border: "1px solid rgba(148,163,184,0.12)",
  },
  progressBar: {
    height: "100%",
    background: "linear-gradient(90deg, #10b981, #22d3ee, #a7f3d0)",
  },
  miniGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 1fr))",
    gap: "12px",
    marginTop: "20px",
  },
  miniCard: {
    minWidth: 0,
    background: "rgba(2,6,23,0.44)",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: "18px",
    padding: "16px",
  },
  miniCardLabel: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: 800,
  },
  miniCardValue: {
    display: "block",
    marginTop: "8px",
    color: "#f8fafc",
    fontSize: "20px",
    lineHeight: 1.25,
    overflowWrap: "break-word",
  },
  flowItem: {
    display: "grid",
    gridTemplateColumns: "42px minmax(0, 1fr)",
    gap: "16px",
    padding: "16px 0",
    borderBottom: "1px solid rgba(148,163,184,0.12)",
    fontSize: "16px",
  },
  stepCircle: {
    width: "42px",
    height: "42px",
    borderRadius: "999px",
    background: "rgba(16,185,129,0.16)",
    border: "1px solid rgba(16,185,129,0.28)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#a7f3d0",
    fontWeight: 900,
    fontSize: "13px",
  },
  flowTitle: {
    display: "block",
    color: "#f8fafc",
    lineHeight: 1.5,
  },
  flowText: {
    margin: "6px 0 0",
    color: "#cbd5e1",
    lineHeight: 1.7,
  },
  attentionList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
    gap: "16px",
  },
  attentionCard: {
    minWidth: 0,
    textAlign: "left",
    cursor: "pointer",
    background: "rgba(2,6,23,0.52)",
    border: "1px solid rgba(148,163,184,0.16)",
    borderRadius: "22px",
    padding: "clamp(18px, 3vw, 22px)",
    color: "#e5e7eb",
    boxSizing: "border-box",
  },
  attentionCardHigh: {
    background:
      "linear-gradient(135deg, rgba(239,68,68,0.14), rgba(2,6,23,0.56))",
    border: "1px solid rgba(248,113,113,0.38)",
  },
  attentionCardSelected: {
    border: "1px solid rgba(52,211,153,0.72)",
    boxShadow: "0 0 0 1px rgba(52,211,153,0.16)",
  },
  attentionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  attentionRank: {
    margin: 0,
    color: "#34d399",
    fontSize: "13px",
    fontWeight: 900,
  },
  attentionDept: {
    margin: "4px 0 0",
    color: "#f8fafc",
    fontSize: "clamp(20px, 5vw, 24px)",
    fontWeight: 900,
    lineHeight: 1.25,
    overflowWrap: "break-word",
  },
  attentionBadge: {
    padding: "9px 16px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 900,
    whiteSpace: "nowrap",
    flex: "0 0 auto",
  },
  attentionHigh: {
    background: "rgba(239,68,68,0.18)",
    border: "1px solid rgba(248,113,113,0.35)",
    color: "#fecaca",
  },
  attentionMiddle: {
    background: "rgba(245,158,11,0.18)",
    border: "1px solid rgba(251,191,36,0.35)",
    color: "#fde68a",
  },
  attentionLow: {
    background: "rgba(16,185,129,0.16)",
    border: "1px solid rgba(52,211,153,0.32)",
    color: "#bbf7d0",
  },
  attentionHeadline: {
    margin: "0 0 14px",
    color: "#f8fafc",
    fontSize: "16px",
    lineHeight: 1.6,
    fontWeight: 900,
  },
  attentionMetrics: {
    display: "grid",
    gap: "10px",
    margin: "12px 0 16px",
    padding: "12px 0",
    borderTop: "1px solid rgba(148,163,184,0.14)",
    borderBottom: "1px solid rgba(148,163,184,0.14)",
  },
  attentionMetricRow: {
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "88px minmax(0, 1fr)",
    alignItems: "start",
    gap: "12px",
    padding: "2px 0",
  },
  metricRowLabel: {
    color: "#e5e7eb",
    fontSize: "14px",
    fontWeight: 900,
    lineHeight: 1.35,
    whiteSpace: "nowrap",
  },
  metricRowBody: {
    minWidth: 0,
    display: "grid",
    gap: "3px",
  },
  metricRowValue: {
    display: "block",
    color: "#f8fafc",
    fontSize: "18px",
    fontWeight: 900,
    lineHeight: 1.15,
    whiteSpace: "nowrap",
  },
  metricDiff: {
    display: "block",
    fontSize: "12px",
    fontWeight: 900,
    lineHeight: 1.35,
    whiteSpace: "nowrap",
  },
  metricDiffPositive: {
    color: "#6ee7b7",
  },
  metricDiffNegative: {
    color: "#fca5a5",
  },
  metricDiffNeutral: {
    color: "#94a3b8",
  },
  attentionReason: {
    margin: 0,
    color: "#cbd5e1",
    fontSize: "15px",
    lineHeight: 1.8,
    overflowWrap: "break-word",
  },
  recommendBox: {
    marginTop: "18px",
    paddingTop: "14px",
    borderTop: "1px solid rgba(148,163,184,0.12)",
  },
  recommendTitle: {
    margin: "0 0 10px",
    color: "#6ee7b7",
    fontSize: "13px",
    fontWeight: 900,
    letterSpacing: "0.06em",
  },
  recommendList: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  recommendTag: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(16,185,129,0.14)",
    border: "1px solid rgba(16,185,129,0.24)",
    color: "#a7f3d0",
    fontSize: "13px",
    fontWeight: 700,
  },
  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "22px",
    flexWrap: "wrap",
  },
  filterLeft: {
    minWidth: 0,
    flex: "1 1 240px",
  },
  filterLabel: {
    margin: "0 0 8px",
    color: "#94a3b8",
    fontSize: "14px",
    fontWeight: 800,
  },
  select: {
    width: "min(260px, 100%)",
    maxWidth: "100%",
    background: "rgba(2,6,23,0.72)",
    border: "1px solid rgba(52,211,153,0.36)",
    borderRadius: "14px",
    padding: "12px 14px",
    color: "#f8fafc",
    fontSize: "16px",
    fontWeight: 800,
    boxSizing: "border-box",
  },
  filterNote: {
    margin: 0,
    color: "#cbd5e1",
    fontSize: "16px",
    lineHeight: 1.6,
    flex: "1 1 240px",
    minWidth: 0,
  },
  detailBlock: { marginTop: "16px" },
  detailLabel: {
    color: "#6ee7b7",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.08em",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
    gap: "14px",
    marginTop: "14px",
  },
  aiInsightList: {
    display: "grid",
    gap: "16px",
  },
  aiInsightCard: {
    minWidth: 0,
    background: "rgba(2,6,23,0.44)",
    border: "1px solid rgba(52,211,153,0.18)",
    borderRadius: "22px",
    padding: "clamp(18px, 3vw, 22px)",
    boxSizing: "border-box",
  },
  aiInsightTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  postName: {
    fontSize: "18px",
    lineHeight: 1.4,
  },
  aiInsightMeta: {
    display: "block",
    marginTop: "6px",
    color: "#94a3b8",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  aiBadgeGroup: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  aiBadge: {
    padding: "7px 12px",
    borderRadius: "999px",
    background: "rgba(16,185,129,0.14)",
    border: "1px solid rgba(16,185,129,0.24)",
    color: "#a7f3d0",
    fontSize: "13px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  aiBehavior: {
    margin: "8px 0 0",
    color: "#e5e7eb",
    lineHeight: 1.8,
    fontSize: "17px",
    overflowWrap: "break-word",
  },
  aiCommentBox: {
    minWidth: 0,
    background: "rgba(16,185,129,0.08)",
    border: "1px solid rgba(16,185,129,0.18)",
    borderRadius: "18px",
    padding: "16px",
    color: "#d1fae5",
    fontSize: "15px",
    lineHeight: 1.8,
    overflowWrap: "break-word",
  },
  managerCommentBox: {
    minWidth: 0,
    background: "rgba(59,130,246,0.08)",
    border: "1px solid rgba(147,197,253,0.18)",
    borderRadius: "18px",
    padding: "16px",
    color: "#dbeafe",
    fontSize: "15px",
    lineHeight: 1.8,
    overflowWrap: "break-word",
  },
  aiLabel: {
    display: "inline-block",
    marginBottom: "6px",
    color: "#6ee7b7",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.08em",
  },
  managerLabel: {
    display: "inline-block",
    marginBottom: "6px",
    color: "#93c5fd",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.08em",
  },
  biasFocusCard: {
    minWidth: 0,
    borderRadius: "24px",
    padding: "clamp(20px, 3vw, 26px)",
    background:
      "linear-gradient(135deg, rgba(245,158,11,0.16), rgba(16,185,129,0.08))",
    border: "1px solid rgba(245,158,11,0.34)",
    boxShadow: "0 20px 70px rgba(0,0,0,0.28)",
    boxSizing: "border-box",
  },
  biasFocusHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  biasFocusLabel: {
    margin: 0,
    color: "#fbbf24",
    fontSize: "13px",
    fontWeight: 900,
    letterSpacing: "0.08em",
  },
  biasFocusDept: {
    margin: "8px 0 0",
    color: "#f8fafc",
    fontSize: "clamp(22px, 5vw, 30px)",
    fontWeight: 900,
    lineHeight: 1.25,
    overflowWrap: "break-word",
  },
  biasFocusBadge: {
    padding: "10px 16px",
    borderRadius: "999px",
    background: "rgba(2,6,23,0.54)",
    border: "1px solid rgba(248,250,252,0.12)",
    color: "#f8fafc",
    fontSize: "13px",
    fontWeight: 900,
    whiteSpace: "nowrap",
    flex: "0 0 auto",
  },
  biasFocusBody: {
    display: "block",
    marginBottom: "18px",
  },
  biasMainMetric: {
    minWidth: 0,
    background: "rgba(2,6,23,0.52)",
    border: "1px solid rgba(248,250,252,0.12)",
    borderRadius: "20px",
    padding: "18px",
    boxSizing: "border-box",
  },
  biasMetricLabel: {
    display: "block",
    color: "#cbd5e1",
    fontSize: "13px",
    fontWeight: 900,
    marginBottom: "10px",
  },
  biasFocusDiff: {
    display: "block",
    color: "#34d399",
    fontSize: "clamp(26px, 5vw, 40px)",
    fontWeight: 900,
    lineHeight: 1.1,
  },
  biasDiffCompact: {
    color: "#34d399",
    fontSize: "24px",
  },
  biasSubMetrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 130px), 1fr))",
    gap: "12px",
  },
  biasSubMetricBox: {
    minWidth: 0,
    background: "rgba(15,23,42,0.58)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "18px",
    padding: "16px",
    color: "#cbd5e1",
    fontSize: "13px",
    fontWeight: 800,
    boxSizing: "border-box",
  },
  biasFocusDetail: {
    margin: "0 0 16px",
    color: "#e2e8f0",
    lineHeight: 1.8,
    fontSize: "15px",
    overflowWrap: "break-word",
  },
  biasPoCNote: {
    padding: "14px 16px",
    borderRadius: "18px",
    background: "rgba(16,185,129,0.12)",
    border: "1px solid rgba(52,211,153,0.24)",
    color: "#d1fae5",
    fontSize: "14px",
    lineHeight: 1.8,
    overflowWrap: "break-word",
  },
  chartBox: {
    width: "100%",
    height: "320px",
    minHeight: "320px",
    background: "rgba(2,6,23,0.28)",
    border: "1px solid rgba(148,163,184,0.1)",
    borderRadius: "22px",
    padding: "10px",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  tooltip: {
    background: "#020617",
    border: "1px solid rgba(52,211,153,0.28)",
    borderRadius: "12px",
    color: "#e5e7eb",
  },
  emptyBox: {
    padding: "20px",
    borderRadius: "18px",
    background: "rgba(2,6,23,0.44)",
    border: "1px solid rgba(148,163,184,0.12)",
    color: "#94a3b8",
    fontSize: "15px",
    lineHeight: 1.7,
  },
};