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

type DepartmentAverageComparison = {
  department: string;
  postCount: number;
  approvedCount: number;
  roiPoints: number;
  averageRoiPerPost: number;
  companyAverageRoiPerPost: number;
  diffPercent: number;
  statusLabel: string;
  detail: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://human-capital-os-api.onrender.com";

const ALL_DEPARTMENTS = "全部門";
const VALUE_PER_POINT = 100000;

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

  const approvedPostCount = useMemo(() => {
    return posts.filter((post) => isApproved(post)).length;
  }, [posts]);

  const companyAverageRoiPerPost =
    approvedPostCount > 0 ? rfpTotalPoints / approvedPostCount : 0;

  const departmentAverageComparisons = useMemo<DepartmentAverageComparison[]>(
    () => {
      const departmentNames = Array.from(
        new Set(posts.map((post) => normalizeDepartmentName(post.department)))
      ).filter(Boolean);

      return departmentNames
        .map((department) => {
          const stats = departmentPostStats.get(department) ?? {
            postCount: 0,
            approvedCount: 0,
            pendingCount: 0,
          };

          const roiPoints = departmentRfpPoints.get(department) ?? 0;
          const averageRoiPerPost =
            stats.approvedCount > 0 ? roiPoints / stats.approvedCount : 0;

          const diffPercent =
            companyAverageRoiPerPost > 0
              ? ((averageRoiPerPost - companyAverageRoiPerPost) /
                  companyAverageRoiPerPost) *
                100
              : 0;

          const isHigh = diffPercent >= 0;

          return {
            department,
            postCount: stats.postCount,
            approvedCount: stats.approvedCount,
            roiPoints,
            averageRoiPerPost,
            companyAverageRoiPerPost,
            diffPercent,
            statusLabel: isHigh ? "平均より高い" : "平均より低い",
            detail: isHigh
              ? "1投稿あたりのROI-Pが全社平均を上回っています。成功事例として他部門へ横展開できる可能性があります。"
              : "投稿は発生しているものの、1投稿あたりのROI-Pが全社平均を下回っています。挑戦テーマの再設計や成功事例の共有を推奨します。",
          };
        })
        .sort((a, b) => b.averageRoiPerPost - a.averageRoiPerPost);
    },
    [
      posts,
      departmentPostStats,
      departmentRfpPoints,
      companyAverageRoiPerPost,
    ]
  );

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
                  目標 {formatMoney(summary?.target_value ?? 600000000)}
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
                        <div style={styles.attentionMetricBox}>
                          <span>未承認</span>
                          <strong>{dept.pending_count}件</strong>
                        </div>

                        <div style={styles.attentionMetricBox}>
                          <span>投稿</span>
                          <strong>{dept.post_count}件</strong>
                        </div>

                        <div style={styles.attentionMetricBox}>
                          <span>ROI-P</span>
                          <strong>{departmentRoiPoints.toLocaleString()}P</strong>
                        </div>

                        <div style={styles.attentionMetricBox}>
                          <span>削減時間</span>
                          <strong>
                            {Math.round(
                              executiveStats?.hoursSaved ?? 0
                            ).toLocaleString()}
                            h
                          </strong>
                        </div>

                        <div style={styles.attentionMetricBox}>
                          <span>AI信頼度</span>
                          <strong>
                            {Math.round(
                              executiveStats?.averageConfidence ?? 0
                            )}
                            %
                          </strong>
                        </div>
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
            <Panel title="部門別平均ROI-P比較" tag="DEPARTMENT AVG">
              <p style={styles.panelLead}>
                各部門のROI-Pを投稿件数で割り、1投稿あたりの平均ROI-Pとして比較します。
                単純な合計ではなく、部門ごとの挑戦行動の質と広がりを確認します。
              </p>

              {departmentAverageComparisons.length === 0 ? (
                <div style={styles.emptyBox}>
                  部門別の平均ROI-P比較データはありません。
                </div>
              ) : (
                <div style={styles.departmentAverageList}>
                  <div style={styles.companyAverageBox}>
                    <span style={styles.companyAverageLabel}>全社平均</span>
                    <strong style={styles.companyAverageValue}>
                      {companyAverageRoiPerPost.toFixed(1)}P / 件
                    </strong>
                  </div>

                  {departmentAverageComparisons.map((dept) => {
                    const isHigh = dept.diffPercent >= 0;

                    return (
                      <div
                        key={dept.department}
                        style={{
                          ...styles.departmentAverageCard,
                          ...(isHigh
                            ? styles.departmentAverageCardHigh
                            : styles.departmentAverageCardLow),
                        }}
                      >
                        <div style={styles.departmentAverageHeader}>
                          <div style={styles.flexItemMin}>
                            <p style={styles.departmentAverageLabel}>
                              {dept.statusLabel}
                            </p>

                            <h3 style={styles.departmentAverageDept}>
                              {dept.department}
                            </h3>
                          </div>

                          <span
                            style={{
                              ...styles.departmentAverageBadge,
                              ...(isHigh
                                ? styles.departmentAverageBadgeHigh
                                : styles.departmentAverageBadgeLow),
                            }}
                          >
                            {isHigh ? "+" : ""}
                            {Math.round(dept.diffPercent)}%
                          </span>
                        </div>

                        <div style={styles.departmentAverageMetrics}>
                          <div style={styles.departmentAverageMetricBox}>
                            <span>部門平均</span>
                            <strong>
                              {dept.averageRoiPerPost.toFixed(1)}P / 件
                            </strong>
                          </div>

                          <div style={styles.departmentAverageMetricBox}>
                            <span>全社平均</span>
                            <strong>
                              {dept.companyAverageRoiPerPost.toFixed(1)}P / 件
                            </strong>
                          </div>

                          <div style={styles.departmentAverageMetricBox}>
                            <span>承認済み</span>
                            <strong>{dept.approvedCount}件</strong>
                          </div>

                          <div style={styles.departmentAverageMetricBox}>
                            <span>合計ROI-P</span>
                            <strong>{dept.roiPoints.toLocaleString()}P</strong>
                          </div>
                        </div>

                        <p style={styles.departmentAverageDetail}>
                          {dept.detail}
                        </p>
                      </div>
                    );
                  })}

                  <div style={styles.biasPoCNote}>
                    <strong>読み方：</strong>
                    例えば「-20%」は、その部門の1投稿あたり平均ROI-Pが全社平均より20%低いという意味です。
                    評価の良し悪しを決めるものではなく、経営が支援・横展開・確認すべき部門傾向を見つけるための補助指標です。
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
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(2)}億円`;
  }

  return `${Math.round(value / 10000).toLocaleString()}万円`;
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
    gridTemplateColumns: "repeat(auto-fit, minmax(84px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  attentionMetricBox: {
    minWidth: 0,
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "16px",
    padding: "14px",
    fontSize: "14px",
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
    display: "grid",
    gridTemplateColumns: "minmax(150px, 0.9fr) minmax(0, 1.4fr)",
    gap: "16px",
    alignItems: "stretch",
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
  biasSubMetrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 1fr))",
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
  departmentAverageList: {
    display: "grid",
    gap: "14px",
  },
  companyAverageBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    borderRadius: "18px",
    background: "rgba(2,6,23,0.5)",
    border: "1px solid rgba(148,163,184,0.14)",
    flexWrap: "wrap",
  },
  companyAverageLabel: {
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: 900,
    letterSpacing: "0.08em",
  },
  companyAverageValue: {
    color: "#f8fafc",
    fontSize: "20px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  departmentAverageCard: {
    minWidth: 0,
    borderRadius: "20px",
    padding: "18px",
    background: "rgba(2,6,23,0.46)",
    border: "1px solid rgba(148,163,184,0.14)",
    boxSizing: "border-box",
  },
  departmentAverageCardHigh: {
    background:
      "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(2,6,23,0.48))",
    border: "1px solid rgba(52,211,153,0.28)",
  },
  departmentAverageCardLow: {
    background:
      "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(2,6,23,0.48))",
    border: "1px solid rgba(251,191,36,0.28)",
  },
  departmentAverageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  departmentAverageLabel: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.08em",
  },
  departmentAverageDept: {
    margin: "6px 0 0",
    color: "#f8fafc",
    fontSize: "22px",
    fontWeight: 900,
    lineHeight: 1.25,
  },
  departmentAverageBadge: {
    padding: "9px 14px",
    borderRadius: "999px",
    fontSize: "15px",
    fontWeight: 900,
    whiteSpace: "nowrap",
    flex: "0 0 auto",
  },
  departmentAverageBadgeHigh: {
    background: "rgba(16,185,129,0.18)",
    border: "1px solid rgba(52,211,153,0.34)",
    color: "#bbf7d0",
  },
  departmentAverageBadgeLow: {
    background: "rgba(245,158,11,0.18)",
    border: "1px solid rgba(251,191,36,0.34)",
    color: "#fde68a",
  },
  departmentAverageMetrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 1fr))",
    gap: "10px",
    marginBottom: "14px",
  },
  departmentAverageMetricBox: {
    minWidth: 0,
    background: "rgba(15,23,42,0.62)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "16px",
    padding: "13px",
    color: "#cbd5e1",
    fontSize: "12px",
    fontWeight: 800,
    boxSizing: "border-box",
  },
  departmentAverageDetail: {
    margin: 0,
    color: "#e2e8f0",
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