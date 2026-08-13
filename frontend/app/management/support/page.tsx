"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "hcos_manager_requests";
const BG =
  "radial-gradient(ellipse 80% 55% at 50% 18%, rgba(99,102,241,0.05) 0%, transparent 68%), #0d1f35";

type ManagementAction = "support" | "connect_department" | "pass";

type FullRequest = {
  id: string;
  employeeName: string;
  action: string;
  deadline?: string;
  supportType: string;
  message: string;
  status:
    | "support_requested"
    | "feedback_sent"
    | "sent_to_management"
    | "management_responded";
  managerFeedback: string | null;
  createdAt: string;
  managementAction?: ManagementAction;
  managementComment?: string;
  managementRespondedAt?: string;
};

const SUPPORT_TYPE_LABELS: Record<string, string> = {
  advice: "意見がほしい",
  info: "判断材料がほしい",
  cooperation: "協力してほしい",
  escalate: "経営にも提案したい",
};

const MANAGEMENT_ACTION_LABELS: Record<ManagementAction, string> = {
  support: "支援します",
  connect_department: "担当部署につなぎます",
  pass: "今回は見送ります",
};

const MANAGEMENT_ACTION_OPTIONS: { id: ManagementAction; label: string }[] = [
  { id: "support", label: "支援する" },
  { id: "connect_department", label: "担当部署につなぐ" },
  { id: "pass", label: "今回は見送る" },
];

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

export default function ManagementSupportPage() {
  const [allRequests, setAllRequests] = useState<FullRequest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [openAction, setOpenAction] = useState<string | null>(null);
  const [selectedActions, setSelectedActions] = useState<
    Record<string, ManagementAction>
  >({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setAllRequests(JSON.parse(raw) as FullRequest[]);
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  const persist = (updated: FullRequest[]) => {
    setAllRequests(updated);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  };

  const handleRespond = (id: string) => {
    const action = selectedActions[id];
    if (!action) return;
    persist(
      allRequests.map((r) =>
        r.id === id
          ? {
              ...r,
              managementAction: action,
              managementComment:
                (commentInputs[id] ?? "").trim() || undefined,
              managementRespondedAt: new Date().toISOString(),
              status: "management_responded" as const,
            }
          : r
      )
    );
    setOpenAction(null);
  };

  // 経営共有済み案件のみ表示（送付済み + 対応済み）
  const visibleRequests = allRequests.filter(
    (r) =>
      r.status === "sent_to_management" ||
      r.status === "management_responded"
  );

  const pendingCount = visibleRequests.filter(
    (r) => r.status === "sent_to_management"
  ).length;
  const respondedCount = visibleRequests.filter(
    (r) => r.status === "management_responded"
  ).length;

  // supportType別集計（経営共有案件のみ）
  const supportTypeCounts: Record<string, number> = {};
  for (const r of visibleRequests) {
    supportTypeCounts[r.supportType] =
      (supportTypeCounts[r.supportType] ?? 0) + 1;
  }
  const maxCount = Math.max(...Object.values(supportTypeCounts), 1);

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
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

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
            経営への共有
          </h1>
          <p style={{ fontSize: 13, color: "#7a90a8", lineHeight: 1.7 }}>
            上司が経営共有を選んだ案件だけが表示されています。
          </p>
        </section>

        {/* プライバシー通知 */}
        <div
          style={{
            marginBottom: 36,
            padding: "12px 16px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p style={{ fontSize: 11, color: "#4e6a86", lineHeight: 1.85 }}>
            AIとの会話・感情状態・内省ログは含まれていません。
            本人が共有を選んだ情報と、上司が追加した支援情報だけを表示しています。
          </p>
        </div>

        {/* 組織サマリー */}
        <section style={{ marginBottom: 36 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#4e6480",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            現場の動き（経営共有分）
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              {
                label: "経営共有",
                value: visibleRequests.length,
                color: "#6ee7b7",
              },
              { label: "対応待ち", value: pendingCount, color: "#fbbf24" },
              { label: "対応済み", value: respondedCount, color: "#a5b4fc" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  padding: "14px 20px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.09)",
                  background: "rgba(255,255,255,0.03)",
                  minWidth: 100,
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color,
                    marginBottom: 4,
                    lineHeight: 1,
                  }}
                >
                  {value}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "#4e6480",
                    letterSpacing: "0.06em",
                  }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 支援ニーズ集計 */}
        {Object.keys(supportTypeCounts).length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#4e6480",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              支援ニーズ内訳
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {Object.entries(supportTypeCounts).map(([type, count]) => (
                <div
                  key={type}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "#7a90a8",
                      width: 168,
                      flexShrink: 0,
                    }}
                  >
                    {SUPPORT_TYPE_LABELS[type] ?? type}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      style={{
                        width: `${(count / maxCount) * 100}%`,
                        height: "100%",
                        borderRadius: 3,
                        background: "rgba(16,185,129,0.55)",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: "#6ee7b7",
                      fontWeight: 600,
                      width: 20,
                      textAlign: "right",
                    }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 空状態 */}
        {visibleRequests.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 56 }}>
            <p style={{ fontSize: 14, color: "#4e6a86", lineHeight: 1.9 }}>
              現在、経営共有された案件はありません。
            </p>
            <p style={{ fontSize: 11, color: "#2e4a66", marginTop: 8 }}>
              上司が「経営提案へ送る」を選んだ案件がここに表示されます。
            </p>
          </div>
        )}

        {/* 案件一覧 */}
        {visibleRequests.length > 0 && (
          <section>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#4e6480",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              経営に届いた現場の声
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {visibleRequests.map((req) => {
                const isResponded = req.status === "management_responded";
                const isOpen = openAction === req.id;
                const selectedAction = selectedActions[req.id];
                const commentText = commentInputs[req.id] ?? "";
                const canRespond = !!selectedAction;

                return (
                  <div
                    key={req.id}
                    style={{
                      padding: "20px 22px",
                      borderRadius: 14,
                      border: isResponded
                        ? "1px solid rgba(165,180,252,0.22)"
                        : "1px solid rgba(255,255,255,0.09)",
                      background: isResponded
                        ? "rgba(99,102,241,0.04)"
                        : "rgba(255,255,255,0.03)",
                    }}
                  >
                    {/* カードヘッダー */}
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
                          flexShrink: 0,
                          background: isResponded
                            ? "rgba(165,180,252,0.15)"
                            : "rgba(245,158,11,0.15)",
                          color: isResponded ? "#a5b4fc" : "#fbbf24",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {isResponded ? "対応済み" : "対応待ち"}
                      </span>
                    </div>

                    {/* 次の一歩 */}
                    <div style={{ marginBottom: 12 }}>
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
                          color: "#c8d8e8",
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
                            color: "#4e6a86",
                            marginTop: 4,
                          }}
                        >
                          期限：{formatDeadlineLabel(req.deadline)}
                        </p>
                      )}
                    </div>

                    {/* 支援してほしいこと */}
                    <div style={{ marginBottom: 12 }}>
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

                    {/* 本人メッセージ */}
                    {req.message && (
                      <div style={{ marginBottom: 12 }}>
                        <p
                          style={{
                            fontSize: 10,
                            color: "#3a5470",
                            marginBottom: 5,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                          }}
                        >
                          本人メッセージ
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

                    {/* 上司フィードバック */}
                    {req.managerFeedback && (
                      <div style={{ marginBottom: 12 }}>
                        <p
                          style={{
                            fontSize: 10,
                            color: "#3a5470",
                            marginBottom: 5,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                          }}
                        >
                          上司フィードバック
                        </p>
                        <p
                          style={{
                            fontSize: 13,
                            color: "#7a90a8",
                            lineHeight: 1.75,
                          }}
                        >
                          {req.managerFeedback}
                        </p>
                      </div>
                    )}

                    {/* 経営対応済み表示 */}
                    {isResponded && req.managementAction && (
                      <div
                        style={{
                          marginTop: 14,
                          padding: "12px 14px",
                          borderRadius: 9,
                          background: "rgba(99,102,241,0.07)",
                          border: "1px solid rgba(165,180,252,0.22)",
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
                          経営対応
                        </p>
                        <p
                          style={{
                            fontSize: 13,
                            color: "#c7d2fe",
                            fontWeight: 600,
                          }}
                        >
                          {MANAGEMENT_ACTION_LABELS[req.managementAction]}
                        </p>
                        {req.managementComment && (
                          <p
                            style={{
                              fontSize: 12,
                              color: "#94a3b8",
                              marginTop: 6,
                              lineHeight: 1.75,
                            }}
                          >
                            {req.managementComment}
                          </p>
                        )}
                      </div>
                    )}

                    {/* 対応ボタン（未対応 & フォーム非表示時のみ） */}
                    {!isResponded && !isOpen && (
                      <button
                        type="button"
                        onClick={() => setOpenAction(req.id)}
                        style={{
                          marginTop: 16,
                          padding: "10px 20px",
                          borderRadius: 9,
                          border: "1px solid rgba(99,102,241,0.40)",
                          background: "rgba(99,102,241,0.09)",
                          color: "#a5b4fc",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        対応する
                      </button>
                    )}

                    {/* 経営アクション選択フォーム（インライン展開） */}
                    {isOpen && (
                      <div
                        style={{
                          marginTop: 16,
                          paddingTop: 16,
                          borderTop: "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 13,
                            color: "#94a3b8",
                            marginBottom: 14,
                            lineHeight: 1.6,
                          }}
                        >
                          この案件をどう支援しますか？
                        </p>

                        {/* 3択 */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            marginBottom: 16,
                          }}
                        >
                          {MANAGEMENT_ACTION_OPTIONS.map(({ id, label }) => {
                            const isSel = selectedAction === id;
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() =>
                                  setSelectedActions((prev) => ({
                                    ...prev,
                                    [req.id]: id,
                                  }))
                                }
                                style={{
                                  padding: "13px 16px",
                                  borderRadius: 10,
                                  border: isSel
                                    ? "1.5px solid rgba(99,102,241,0.55)"
                                    : "1px solid rgba(255,255,255,0.11)",
                                  background: isSel
                                    ? "rgba(99,102,241,0.12)"
                                    : "rgba(255,255,255,0.03)",
                                  color: isSel ? "#c7d2fe" : "#94a3b8",
                                  fontSize: 13,
                                  fontWeight: isSel ? 600 : 400,
                                  cursor: "pointer",
                                  textAlign: "left",
                                  transition:
                                    "border-color 0.14s ease, background 0.14s ease",
                                }}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>

                        {/* 任意コメント */}
                        <p
                          style={{
                            fontSize: 12,
                            color: "#607d97",
                            marginBottom: 8,
                          }}
                        >
                          本人・上司に伝えること（任意）
                        </p>
                        <textarea
                          value={commentText}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [req.id]: e.target.value,
                            }))
                          }
                          maxLength={200}
                          placeholder="必要であれば記入してください"
                          style={{
                            width: "100%",
                            minHeight: 72,
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
                            marginBottom: 12,
                          }}
                        />

                        {/* 確定CTA */}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleRespond(req.id)}
                            disabled={!canRespond}
                            style={{
                              flex: 1,
                              padding: "12px",
                              borderRadius: 9,
                              border: "none",
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: canRespond ? "pointer" : "not-allowed",
                              background: canRespond
                                ? "rgba(99,102,241,0.75)"
                                : "rgba(255,255,255,0.04)",
                              color: canRespond ? "#fff" : "#4e6a86",
                              transition: "background 0.2s ease",
                            }}
                          >
                            {canRespond
                              ? "この内容で対応する"
                              : "対応方法を選んでください"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setOpenAction(null)}
                            style={{
                              padding: "12px 16px",
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
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
