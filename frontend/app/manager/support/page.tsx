"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY_MANAGER_REQUESTS = "hcos_manager_requests";
const BG =
  "radial-gradient(ellipse 80% 55% at 50% 18%, rgba(16,185,129,0.05) 0%, transparent 68%), #0d1f35";

type ManagerRequest = {
  id: string;
  employeeName: string;
  action: string;
  deadline?: string;
  supportType: string;
  message: string;
  status: "support_requested" | "feedback_sent" | "sent_to_management" | "management_responded";
  managerFeedback: string | null;
  createdAt: string;
  managementAction?: "support" | "connect_department" | "pass";
  managementComment?: string;
  managementRespondedAt?: string;
};

const STATUS_LABELS: Record<ManagerRequest["status"], string> = {
  support_requested: "支援待ち",
  feedback_sent: "フィードバック済み",
  sent_to_management: "経営共有済み",
  management_responded: "経営回答済み",
};

const STATUS_COLORS: Record<ManagerRequest["status"], { bg: string; color: string }> = {
  support_requested: {
    bg: "rgba(245,158,11,0.15)",
    color: "#fbbf24",
  },
  feedback_sent: {
    bg: "rgba(16,185,129,0.15)",
    color: "#6ee7b7",
  },
  sent_to_management: {
    bg: "rgba(99,102,241,0.15)",
    color: "#a5b4fc",
  },
  management_responded: {
    bg: "rgba(165,180,252,0.15)",
    color: "#c7d2fe",
  },
};

const SUPPORT_TYPE_LABELS: Record<string, string> = {
  advice: "意見がほしい",
  info: "判断材料がほしい",
  cooperation: "協力してほしい",
  escalate: "経営にも提案したい",
};

const MANAGEMENT_ACTION_LABELS: Record<
  "support" | "connect_department" | "pass",
  string
> = {
  support: "支援します",
  connect_department: "担当部署につなぎます",
  pass: "今回は見送ります",
};

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDeadlineLabel(deadline: string): string {
  const now = new Date();
  const todayStr = toLocalDateString(now);
  const tomorrowStr = toLocalDateString(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  );
  if (deadline === todayStr) return "今日";
  if (deadline === tomorrowStr) return "明日";
  const parts = deadline.split("-");
  if (parts.length === 3)
    return `${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`;
  return deadline;
}

export default function ManagerSupportPage() {
  const [requests, setRequests] = useState<ManagerRequest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>({});
  const [openFeedback, setOpenFeedback] = useState<string | null>(null);
  const [openConfirm, setOpenConfirm] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_MANAGER_REQUESTS);
      if (raw) {
        setRequests(JSON.parse(raw) as ManagerRequest[]);
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  const persistRequests = (updated: ManagerRequest[]) => {
    setRequests(updated);
    try {
      sessionStorage.setItem(
        STORAGE_KEY_MANAGER_REQUESTS,
        JSON.stringify(updated)
      );
    } catch {
      /* ignore */
    }
  };

  const handleFeedbackSubmit = (id: string) => {
    const feedback = (feedbackInputs[id] ?? "").trim();
    if (!feedback) return;
    persistRequests(
      requests.map((r) =>
        r.id === id
          ? { ...r, managerFeedback: feedback, status: "feedback_sent" as const }
          : r
      )
    );
    setOpenFeedback(null);
    setFeedbackInputs((prev) => ({ ...prev, [id]: "" }));
  };

  const handleSendToManagement = (id: string) => {
    persistRequests(
      requests.map((r) =>
        r.id === id ? { ...r, status: "sent_to_management" as const } : r
      )
    );
    setOpenConfirm(null);
  };

  if (!loaded) {
    return <main style={{ minHeight: "100vh", background: BG }} />;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: BG,
        color: "#fff",
        padding: "40px 20px 80px",
        overflowX: "hidden",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* ページタイトル */}
        <section style={{ marginBottom: 36 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#e2e8f0",
              letterSpacing: "-0.025em",
              marginBottom: 10,
              lineHeight: 1.25,
            }}
          >
            チームの次の一歩
          </h1>
          <p style={{ fontSize: 13, color: "#7a90a8", lineHeight: 1.7 }}>
            本人が共有を選んだ内容だけが表示されます。
          </p>
        </section>

        {/* プライバシー通知（信頼設計の明示） */}
        <div
          style={{
            marginBottom: 36,
            padding: "12px 16px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p style={{ fontSize: 11, color: "#3a5470", lineHeight: 1.85 }}>
            この画面には、社員本人が「上司に相談する」を選んだ内容だけが表示されています。
            AIとの会話・感情状態・内省ログは一切含まれません。
          </p>
        </div>

        {/* 空状態 */}
        {requests.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 56 }}>
            <p style={{ fontSize: 14, color: "#4e6a86", lineHeight: 1.9 }}>
              現在、支援を求めている共有はありません。
            </p>
            <p style={{ fontSize: 11, color: "#2e4a66", marginTop: 8 }}>
              社員が「上司に相談する」を選ぶとここに表示されます。
            </p>
          </div>
        )}

        {/* リクエストカード一覧 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {requests.map((req) => {
            const statusStyle = STATUS_COLORS[req.status];
            const feedbackText = feedbackInputs[req.id] ?? "";
            const canFeedback = feedbackText.trim().length > 0;

            return (
              <div
                key={req.id}
                style={{
                  padding: "20px 22px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.09)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                {/* カードヘッダー：社員名 + ステータスバッジ */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 16,
                    gap: 12,
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: "#4e6a86",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {req.employeeName}
                  </p>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      letterSpacing: "0.04em",
                      flexShrink: 0,
                    }}
                  >
                    {STATUS_LABELS[req.status]}
                  </span>
                </div>

                {/* 次の一歩 */}
                <div style={{ marginBottom: 14 }}>
                  <p
                    style={{
                      fontSize: 10,
                      color: "#3a5470",
                      marginBottom: 5,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    次の一歩
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      color: "#b8c8d8",
                      fontWeight: 600,
                      lineHeight: 1.5,
                    }}
                  >
                    「{req.action}」
                  </p>
                  {req.deadline && (
                    <p
                      style={{
                        fontSize: 11,
                        color: "#3a5470",
                        marginTop: 4,
                      }}
                    >
                      期限：{formatDeadlineLabel(req.deadline)}
                    </p>
                  )}
                </div>

                {/* 支援してほしいこと */}
                <div style={{ marginBottom: req.message ? 14 : 0 }}>
                  <p
                    style={{
                      fontSize: 10,
                      color: "#3a5470",
                      marginBottom: 5,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    支援してほしいこと
                  </p>
                  <p style={{ fontSize: 13, color: "#94a3b8" }}>
                    {SUPPORT_TYPE_LABELS[req.supportType] ?? req.supportType}
                  </p>
                </div>

                {/* 本人からのメッセージ */}
                {req.message && (
                  <div style={{ marginBottom: 14 }}>
                    <p
                      style={{
                        fontSize: 10,
                        color: "#3a5470",
                        marginBottom: 5,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      本人からのメッセージ
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#7a90a8",
                        lineHeight: 1.75,
                      }}
                    >
                      {req.message}
                    </p>
                  </div>
                )}

                {/* 送済みフィードバック表示 */}
                {req.managerFeedback && (
                  <div
                    style={{
                      marginBottom: 14,
                      padding: "12px 14px",
                      borderRadius: 9,
                      background: "rgba(16,185,129,0.05)",
                      border: "1px solid rgba(16,185,129,0.18)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 10,
                        color: "#4e6a86",
                        marginBottom: 5,
                        letterSpacing: "0.06em",
                      }}
                    >
                      送ったフィードバック
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#7a90a8",
                        lineHeight: 1.75,
                      }}
                    >
                      {req.managerFeedback}
                    </p>
                  </div>
                )}

                {/* 経営からの回答（managementActionが存在する場合のみ表示） */}
                {req.managementAction && (
                  <div
                    style={{
                      marginBottom: 14,
                      padding: "12px 14px",
                      borderRadius: 9,
                      background: "rgba(99,102,241,0.06)",
                      border: "1px solid rgba(165,180,252,0.20)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 10,
                        color: "#818cf8",
                        marginBottom: 5,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      経営からの回答
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#c7d2fe",
                        fontWeight: 600,
                        lineHeight: 1.5,
                        marginBottom: req.managementComment ? 6 : 0,
                      }}
                    >
                      {MANAGEMENT_ACTION_LABELS[req.managementAction]}
                    </p>
                    {req.managementComment && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "#94a3b8",
                          lineHeight: 1.75,
                        }}
                      >
                        {req.managementComment}
                      </p>
                    )}
                  </div>
                )}

                {/* アクションボタン（support_requested / feedback_sent） */}
                {(req.status === "support_requested" ||
                  req.status === "feedback_sent") && (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    {req.status === "support_requested" && (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenFeedback(
                            openFeedback === req.id ? null : req.id
                          )
                        }
                        style={{
                          flex: 1,
                          minWidth: 140,
                          padding: "10px",
                          borderRadius: 9,
                          border: "1px solid rgba(16,185,129,0.35)",
                          background: "rgba(16,185,129,0.07)",
                          color: "#6ee7b7",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        フィードバックする
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setOpenConfirm(
                          openConfirm === req.id ? null : req.id
                        )
                      }
                      style={{
                        flex: 1,
                        minWidth: 140,
                        padding: "10px",
                        borderRadius: 9,
                        border: "1px solid rgba(255,255,255,0.11)",
                        background: "rgba(255,255,255,0.02)",
                        color: "#7a90a8",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      経営提案へ送る
                    </button>
                  </div>
                )}

                {/* フィードバック入力フォーム（インライン展開） */}
                {openFeedback === req.id && (
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        color: "#94a3b8",
                        marginBottom: 10,
                        lineHeight: 1.6,
                      }}
                    >
                      どんな支援ができそうですか？
                    </p>
                    <textarea
                      value={feedbackText}
                      onChange={(e) =>
                        setFeedbackInputs((prev) => ({
                          ...prev,
                          [req.id]: e.target.value,
                        }))
                      }
                      maxLength={200}
                      placeholder="サポートできそうなことを記入してください"
                      style={{
                        width: "100%",
                        minHeight: 80,
                        padding: "10px 12px",
                        borderRadius: 9,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.04)",
                        color: "#b8c8d8",
                        fontSize: 13,
                        lineHeight: 1.7,
                        resize: "vertical",
                        outline: "none",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => handleFeedbackSubmit(req.id)}
                        disabled={!canFeedback}
                        style={{
                          flex: 1,
                          padding: "11px",
                          borderRadius: 9,
                          border: "none",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: canFeedback ? "pointer" : "not-allowed",
                          background: canFeedback
                            ? "rgba(16,185,129,0.75)"
                            : "rgba(255,255,255,0.04)",
                          color: canFeedback ? "#fff" : "#4e6a86",
                          transition: "background 0.2s ease",
                        }}
                      >
                        フィードバックを送る
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenFeedback(null)}
                        style={{
                          padding: "11px 16px",
                          borderRadius: 9,
                          border: "1px solid rgba(255,255,255,0.10)",
                          background: "transparent",
                          color: "#4e6a86",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        閉じる
                      </button>
                    </div>
                  </div>
                )}

                {/* 経営提案確認（インライン） */}
                {openConfirm === req.id && (
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        color: "#94a3b8",
                        marginBottom: 16,
                        lineHeight: 1.6,
                      }}
                    >
                      この提案を経営側へ共有しますか？
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleSendToManagement(req.id)}
                        style={{
                          flex: 1,
                          padding: "11px",
                          borderRadius: 9,
                          border: "none",
                          background: "rgba(99,102,241,0.70)",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        共有する
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenConfirm(null)}
                        style={{
                          flex: 1,
                          padding: "11px",
                          borderRadius: 9,
                          border: "1px solid rgba(255,255,255,0.11)",
                          background: "transparent",
                          color: "#7a90a8",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        戻る
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
