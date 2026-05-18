"use client";

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
  roi_points: number;
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

type RoiTrendItem = {
  month: string;
  points: number;
  count: number;
  financial_impact: number;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8002";

const ALL_DEPARTMENTS = "全部門";

function normalizeDepartmentName(name?: string | null) {
  const value = (name || "未設定").trim();

  if (value === "営業部" || value === "営業") return "営業部";
  if (value === "本社" || value === "本社部門") return "本社";
  if (value === "業務運用部門" || value === "業務運用") return "業務運用部門";

  return value;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [attentionDepartments, setAttentionDepartments] = useState<
    AttentionDepartment[]
  >([]);
  const [roiTrendData, setRoiTrendData] = useState<RoiTrendItem[]>([]);
  const [selectedDepartment, setSelectedDepartment] =
    useState(ALL_DEPARTMENTS);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");

        const authHeaders = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const [summaryRes, postsRes, attentionRes, roiTrendRes] =
          await Promise.all([
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
            fetch(`${API_BASE}/api/posts/roi-trend`, {
              cache: "no-store",
              headers: authHeaders,
            }),
          ]);

        if (
          !summaryRes.ok ||
          !postsRes.ok ||
          !attentionRes.ok ||
          !roiTrendRes.ok
        ) {
          setErrorMessage(
            `Dashboard API取得失敗: summary=${summaryRes.status}, posts=${postsRes.status}, attention=${attentionRes.status}, trend=${roiTrendRes.status}`
          );
          setSummary(null);
          setPosts([]);
          setAttentionDepartments([]);
          setRoiTrendData([]);
          return;
        }

        const summaryData = await summaryRes.json();
        const postsData = await postsRes.json();
        const attentionData = await attentionRes.json();
        const roiTrend = await roiTrendRes.json();

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
        setRoiTrendData(Array.isArray(roiTrend) ? roiTrend : []);
        setErrorMessage("");

        if (mergedAttention[0]?.department) {
          setSelectedDepartment(mergedAttention[0].department);
        } else {
          setSelectedDepartment(ALL_DEPARTMENTS);
        }
      } catch (error) {
        console.error("dashboard fetch error", error);
        setErrorMessage("Dashboard API取得に失敗しました。backend起動・JWT・CORSを確認してください。");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const targetRoiPoints = summary?.target_roi_points ?? 6000;
  const currentRoiPoints = summary?.total_roi_points ?? 0;
  const achievementRateRaw = summary?.achievement_rate ?? 0;
  const achievementRate =
    achievementRateRaw < 1
      ? achievementRateRaw.toFixed(2)
      : achievementRateRaw.toFixed(1);

  const totalFinancial = summary?.total_estimated_value ?? 0;
  const averageConfidence = summary?.average_confidence ?? 0;
  const departmentBiasAlerts = summary?.bias_alerts ?? [];

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
        (post) => normalizeDepartmentName(post.department) === selectedDepartment
      )
      .slice(0, 4);
  }, [posts, selectedDepartment]);

  const summaryCards = [
    {
      title: "全社ROI-P",
      value: `${currentRoiPoints.toLocaleString()}P`,
      sub: `目標 ${targetRoiPoints.toLocaleString()}P`,
    },
    {
      title: "財務インパクト",
      value: formatMoney(totalFinancial),
      sub: "人的資本行動を財務換算",
    },
    {
      title: "達成率",
      value: `${achievementRate}%`,
      sub: "2026年度KGI進捗",
    },
    {
      title: "未承認",
      value: `${summary?.pending ?? 0}件`,
      sub: "上司確認待ち",
    },
  ];

  if (loading) {
    return (
      <main style={styles.page}>
        <section style={styles.container}>
          <p style={styles.kicker}>HUMAN CAPITAL OS</p>
          <h1 style={styles.title}>Dashboardを読み込み中...</h1>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.container}>
        {errorMessage && (
          <div style={styles.errorBox}>
            {errorMessage}
          </div>
        )}

        <div style={styles.hero}>
          <p style={styles.kicker}>HUMAN CAPITAL OS</p>
          <h1 style={styles.title}>
            現場⇔経営をつなぎ、
            <br />
            現場を動かす人的資本OS
          </h1>
          <p style={styles.description}>
            現場の挑戦行動を、AI補完・上司評価・ROI換算で経営判断へ接続します。
          </p>
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
              <div>
                <p style={styles.bigValue}>{achievementRate}%</p>
                <p style={styles.muted}>
                  {currentRoiPoints.toLocaleString()}P /{" "}
                  {targetRoiPoints.toLocaleString()}P
                </p>
              </div>
              <div style={styles.badge}>
                目標 {formatMoney(summary?.target_value ?? 600000000)}
              </div>
            </div>

            <Progress value={Number(achievementRate)} />

            <div style={styles.miniGrid}>
              <MiniCard label="現在実績" value={formatMoney(totalFinancial)} />
              <MiniCard label="承認済み" value={`${summary?.approved ?? 0}件`} />
              <MiniCard label="AI信頼度" value={`${averageConfidence}%`} />
            </div>
          </Panel>

          <Panel title="価値変換ロジック" tag="LOGIC">
            <FlowItem step="01" title="現場の行動" text="挑戦・改善・共有を短文で入力" />
            <FlowItem step="02" title="AI補完＋上司確認" text="AIが意味づけし、人が妥当性を確認" />
            <FlowItem step="03" title="経営判断へ接続" text="支援優先度・ROI-Pとして可視化" />
          </Panel>
        </div>

        <Panel title="要注意部門ランキング" tag="MANAGEMENT FOCUS">
          <p style={styles.panelLead}>経営が優先的に支援すべき部門</p>

          <div style={styles.attentionList}>
            {attentionDepartments.length === 0 ? (
              <div style={styles.emptyBox}>要注意部門データがまだありません。</div>
            ) : (
              attentionDepartments.slice(0, 4).map((dept, index) => (
                <button
                  key={`${dept.department}-${index}`}
                  type="button"
                  style={{
                    ...styles.attentionCard,
                    ...(selectedDepartment === dept.department
                      ? styles.attentionCardSelected
                      : {}),
                  }}
                  onClick={() =>
                    setSelectedDepartment(normalizeDepartmentName(dept.department))
                  }
                >
                  <div style={styles.attentionHeader}>
                    <div>
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
                      <strong>{dept.total_points}P</strong>
                    </div>
                  </div>

                  <p style={styles.attentionReason}>{dept.reason}</p>

                  <div style={styles.recommendBox}>
                    <p style={styles.recommendTitle}>推奨支援アクション</p>
                    <div style={styles.recommendList}>
                      {dept.recommended_actions?.map((action, idx) => (
                        <span key={idx} style={styles.recommendTag}>
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Panel>

        <Panel title="部門別アクション詳細" tag="FIELD ACTION">
          <div style={styles.filterBar}>
            <div>
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
              要注意部門の現場投稿・上司評価・AI分析を確認
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
                    <div>
                      <strong style={styles.postName}>{post.employee_name}</strong>
                      <span style={styles.aiInsightMeta}>
                        {normalizeDepartmentName(post.department)} /{" "}
                        {statusLabel(post.status)}
                      </span>
                    </div>

                    <div style={styles.aiBadgeGroup}>
                      <span style={styles.aiBadge}>
                        {post.manager_points ?? post.roi_points}P
                      </span>
                      <span
                        style={{
                          ...styles.aiBadge,
                          ...getConfidenceColor(post.confidence_score),
                        }}
                      >
                        信頼度 {post.confidence_score}%
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
            <div style={styles.biasAlertGrid}>
              {departmentBiasAlerts.length === 0 ? (
                <div style={styles.emptyBox}>評価乖離アラートはありません。</div>
              ) : (
                departmentBiasAlerts.slice(0, 3).map((item, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.biasAlertCard,
                      ...(Math.abs(item.diff) >= 30
                        ? styles.biasAlertWarning
                        : styles.biasAlertNormal),
                    }}
                  >
                    <div style={styles.biasAlertTop}>
                      <div>
                        <p style={styles.biasDept}>
                          {normalizeDepartmentName(item.department)} /{" "}
                          {item.category}
                        </p>
                        <strong style={styles.biasDiff}>
                          {item.diff > 0 ? "+" : ""}
                          {item.diff}%
                        </strong>
                      </div>
                      <div style={styles.biasBadge}>{item.risk}</div>
                    </div>
                    <p style={styles.biasDetail}>{item.detail}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="ROIトレンド" tag="TREND">
            <div style={styles.chartBox}>
              {roiTrendData.length === 0 ? (
                <div style={styles.emptyBox}>ROIトレンドデータがまだありません。</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={roiTrendData}>
                    <CartesianGrid stroke="rgba(148,163,184,0.12)" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={styles.tooltip}
                      labelStyle={{ color: "#e5e7eb" }}
                      formatter={(value) => [`${value}P`, "ROI-P"]}
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

function getConfidenceColor(score: number) {
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
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div style={styles.progressBase}>
      <div style={{ ...styles.progressBar, width: `${Math.min(value, 100)}%` }} />
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
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
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
    padding: "40px",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  container: { maxWidth: "1180px", margin: "0 auto" },
  errorBox: {
    marginBottom: "20px",
    padding: "16px 20px",
    borderRadius: "18px",
    background: "rgba(239,68,68,0.14)",
    border: "1px solid rgba(248,113,113,0.35)",
    color: "#fecaca",
    fontSize: "14px",
    fontWeight: 800,
  },
  hero: { marginBottom: "30px" },
  kicker: {
    color: "#34d399",
    fontSize: "14px",
    fontWeight: 900,
    letterSpacing: "0.12em",
    marginBottom: "10px",
  },
  title: {
    fontSize: "46px",
    lineHeight: 1.18,
    fontWeight: 900,
    margin: 0,
    color: "#f8fafc",
  },
  description: {
    marginTop: "18px",
    color: "#cbd5e1",
    fontSize: "19px",
    lineHeight: 1.8,
    maxWidth: "980px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "18px",
    marginBottom: "26px",
  },
  card: {
    background: "rgba(15,23,42,0.84)",
    border: "1px solid rgba(52,211,153,0.2)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.34)",
  },
  cardLabel: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "15px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  cardValue: {
    margin: "12px 0 8px",
    fontSize: "40px",
    fontWeight: 900,
    color: "#f8fafc",
    whiteSpace: "nowrap",
  },
  cardSub: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "14px",
    lineHeight: 1.5,
    whiteSpace: "nowrap",
  },
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "22px",
    marginBottom: "26px",
  },
  panel: {
    background: "rgba(15,23,42,0.86)",
    border: "1px solid rgba(52,211,153,0.2)",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.34)",
    marginBottom: "26px",
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
    fontSize: "30px",
    color: "#f8fafc",
    whiteSpace: "nowrap",
  },
  panelLead: {
    margin: "-8px 0 20px",
    color: "#cbd5e1",
    fontSize: "17px",
    lineHeight: 1.7,
  },
  kgiTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "18px",
    gap: "16px",
  },
  bigValue: {
    margin: 0,
    fontSize: "56px",
    fontWeight: 900,
    color: "#6ee7b7",
    whiteSpace: "nowrap",
  },
  muted: {
    margin: "6px 0 0",
    color: "#cbd5e1",
    fontSize: "15px",
    whiteSpace: "nowrap",
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
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginTop: "20px",
  },
  miniCard: {
    background: "rgba(2,6,23,0.44)",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: "18px",
    padding: "16px",
  },
  flowItem: {
    display: "grid",
    gridTemplateColumns: "52px 1fr",
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
  attentionList: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },
  attentionCard: {
    textAlign: "left",
    cursor: "pointer",
    background: "rgba(2,6,23,0.52)",
    border: "1px solid rgba(148,163,184,0.16)",
    borderRadius: "22px",
    padding: "22px",
    color: "#e5e7eb",
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
    marginBottom: "18px",
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
    fontSize: "24px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  attentionBadge: {
    padding: "9px 16px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 900,
    whiteSpace: "nowrap",
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
  attentionMetrics: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  attentionMetricBox: {
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
  },
  filterLabel: {
    margin: "0 0 8px",
    color: "#94a3b8",
    fontSize: "14px",
    fontWeight: 800,
  },
  select: {
    width: "260px",
    background: "rgba(2,6,23,0.72)",
    border: "1px solid rgba(52,211,153,0.36)",
    borderRadius: "14px",
    padding: "12px 14px",
    color: "#f8fafc",
    fontSize: "16px",
    fontWeight: 800,
  },
  filterNote: {
    margin: 0,
    color: "#cbd5e1",
    fontSize: "16px",
    lineHeight: 1.6,
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
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    marginTop: "14px",
  },
  aiInsightList: { display: "grid", gap: "16px" },
  aiInsightCard: {
    background: "rgba(2,6,23,0.44)",
    border: "1px solid rgba(52,211,153,0.18)",
    borderRadius: "22px",
    padding: "22px",
  },
  aiInsightTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
  },
  postName: { fontSize: "18px" },
  aiInsightMeta: {
    display: "block",
    marginTop: "6px",
    color: "#94a3b8",
    fontSize: "14px",
  },
  aiBadgeGroup: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
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
  },
  aiCommentBox: {
    background: "rgba(16,185,129,0.08)",
    border: "1px solid rgba(16,185,129,0.18)",
    borderRadius: "18px",
    padding: "16px",
    color: "#d1fae5",
    fontSize: "15px",
    lineHeight: 1.8,
  },
  managerCommentBox: {
    background: "rgba(59,130,246,0.08)",
    border: "1px solid rgba(147,197,253,0.18)",
    borderRadius: "18px",
    padding: "16px",
    color: "#dbeafe",
    fontSize: "15px",
    lineHeight: 1.8,
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
  biasAlertGrid: { display: "grid", gap: "16px" },
  biasAlertCard: {
    borderRadius: "22px",
    padding: "20px",
    border: "1px solid rgba(148,163,184,0.12)",
  },
  biasAlertWarning: {
    background: "rgba(245,158,11,0.12)",
    border: "1px solid rgba(245,158,11,0.28)",
  },
  biasAlertNormal: {
    background: "rgba(16,185,129,0.10)",
    border: "1px solid rgba(16,185,129,0.22)",
  },
  biasAlertTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
  },
  biasDept: {
    margin: 0,
    color: "#cbd5e1",
    fontSize: "16px",
    fontWeight: 800,
  },
  biasDiff: {
    display: "block",
    marginTop: "10px",
    fontSize: "38px",
    fontWeight: 900,
    color: "#f8fafc",
    whiteSpace: "nowrap",
  },
  biasBadge: {
    padding: "9px 15px",
    borderRadius: "999px",
    background: "rgba(2,6,23,0.44)",
    color: "#f8fafc",
    fontSize: "13px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  biasDetail: {
    marginTop: "14px",
    color: "#e2e8f0",
    lineHeight: 1.8,
    fontSize: "15px",
  },
  chartBox: {
    width: "100%",
    height: "340px",
    minHeight: "340px",
    background: "rgba(2,6,23,0.28)",
    border: "1px solid rgba(148,163,184,0.1)",
    borderRadius: "22px",
    padding: "16px",
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
  },
};