"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Zap,
  Cloud,
  AlertCircle,
  HelpCircle,
  Moon,
  Sun,
  Target,
  Layers,
} from "lucide-react";

type StateOption = {
  id: string;
  label: string;
  sub: string;
  Icon: typeof Zap;
};

type StateGroup = {
  groupLabel: string;
  options: StateOption[];
};

type NextActionData = {
  action: string;
  createdAt: string;
  deadline?: string;
  status?: "active" | "completed";
};

type ManagerRequestPreview = {
  action: string;
  managerFeedback?: string | null;
  status: string;
  managementAction?: "support" | "connect_department" | "pass";
  managementComment?: string;
};

const MGMT_ACTION_LABELS: Record<
  "support" | "connect_department" | "pass",
  string
> = {
  support: "支援します",
  connect_department: "担当部署につなぎます",
  pass: "今回は見送ります",
};

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDeadlineLabel(deadline: string): string {
  const now = new Date();
  const todayStr = toLocalDateStr(now);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowStr = toLocalDateStr(tomorrow);
  if (deadline === todayStr) return "今日";
  if (deadline === tomorrowStr) return "明日";
  const parts = deadline.split("-");
  if (parts.length === 3) {
    return `${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`;
  }
  return deadline;
}

function getDeadlineStatus(deadline?: string): "none" | "before" | "today" | "overdue" {
  if (!deadline) return "none";
  const todayStr = toLocalDateStr(new Date());
  if (deadline > todayStr) return "before";
  if (deadline === todayStr) return "today";
  return "overdue";
}

const STATE_GROUPS: StateGroup[] = [
  {
    groupLabel: "今の状態",
    options: [
      { id: "irritated", label: "イライラしている",    sub: "何かが引っかかっている",       Icon: Zap          },
      { id: "down",      label: "落ち込んでいる",       sub: "うまくいかなかったことがある", Icon: Cloud        },
      { id: "anxious",   label: "不安がある",           sub: "先のことが気になっている",     Icon: AlertCircle  },
      { id: "uncertain", label: "迷っている",           sub: "どうするか決めきれない",       Icon: HelpCircle   },
      { id: "tired",     label: "疲れている",           sub: "今日は少し余裕がない",        Icon: Moon         },
      { id: "positive",  label: "嬉しいことがあった",   sub: "残しておきたい出来事がある",   Icon: Sun          },
    ],
  },
  {
    groupLabel: "したいこと",
    options: [
      { id: "decision",  label: "判断したい",           sub: "考えを整理して決めたい",       Icon: Target       },
      { id: "organize",  label: "頭の中を整理したい",   sub: "考えていることがまとまらない", Icon: Layers       },
    ],
  },
];

function EmployeeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // sessionStorage はクライアント専用のため SSR ガードつき lazy initializer で読む
  const [prevAction] = useState<NextActionData | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem("hcos_next_action");
      if (raw) {
        const parsed = JSON.parse(raw) as NextActionData;
        if (parsed.action) return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [managerRequest] = useState<ManagerRequestPreview | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const actRaw = window.sessionStorage.getItem("hcos_next_action");
      const reqRaw = window.sessionStorage.getItem("hcos_manager_requests");
      if (actRaw && reqRaw) {
        const act = JSON.parse(actRaw) as { action?: string };
        const reqs = JSON.parse(reqRaw) as ManagerRequestPreview[];
        if (act.action) return reqs.find((r) => r.action === act.action) ?? null;
      }
    } catch { /* ignore */ }
    return null;
  });

  // URLから直接取得（client-side遷移でもリアクティブに更新される）
  const isContinuation = searchParams.get("continuation") === "1";

  const handleNext = () => {
    if (!selected) return;
    const base = `/employee/session/new?state=${selected}`;
    router.push(isContinuation ? `${base}&continuation=1` : base);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        // 非常に弱い中央グロー — ほぼ気づかない程度の奥行き
        background:
          "radial-gradient(ellipse 80% 55% at 50% 18%, rgba(25,201,154,0.10) 0%, transparent 68%), #10263D",
        color: "#fff",
        padding: "44px 20px 72px",
        overflowX: "hidden",
      }}
    >
      <div style={{ maxWidth: 540, margin: "0 auto" }}>

        {/* ブランドヘッダー */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 48,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#829AAF",
              textTransform: "uppercase",
            }}
          >
            Human Capital OS
          </span>
          <span
            style={{
              width: 1,
              height: 12,
              background: "rgba(180,210,230,0.25)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.16em",
              color: "#829AAF",
              textTransform: "uppercase",
            }}
          >
            Self-Decision System
          </span>
        </header>

        {/* メインメッセージ */}
        <section style={{ marginBottom: 44 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.08em",
              color: "#829AAF",
              marginBottom: 14,
            }}
          >
            仕事を終える、その前に。
          </p>

          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.25,
              color: "#F3F7FA",
              marginBottom: 14,
            }}
          >
            今日はどんな状態ですか？
          </h1>

          <p
            style={{
              fontSize: 13,
              color: "#829AAF",
              lineHeight: 1.85,
            }}
          >
            うまく言葉にできなくても大丈夫です。
            <br />
            今の自分に近いものを選んでください。
          </p>
        </section>

        {/* 状態グループ */}
        {STATE_GROUPS.map((group) => (
          <section key={group.groupLabel} style={{ marginBottom: 32 }}>
            {/* グループラベル */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  color: "#829AAF",
                  textTransform: "uppercase",
                }}
              >
                {group.groupLabel}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(180,210,230,0.18)",
                }}
              />
            </div>

            {/* カードグリッド — PC: 2列 / スマホ: 1列 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.options.map((option) => {
                const isSelected = selected === option.id;
                const isHovered = hoveredId === option.id;
                const { Icon } = option;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelected(option.id)}
                    onMouseEnter={() => setHoveredId(option.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      padding: "18px 18px",
                      borderRadius: 14,
                      border: isSelected
                        ? "1.5px solid rgba(25,201,154,0.65)"
                        : isHovered
                        ? "1px solid rgba(180,210,230,0.30)"
                        : "1px solid rgba(180,210,230,0.18)",
                      background: isSelected
                        ? "rgba(25,201,154,0.12)"
                        : isHovered
                        ? "#1D3953"
                        : "#183149",
                      cursor: "pointer",
                      textAlign: "left",
                      transition:
                        "border-color 0.14s ease, background 0.14s ease, transform 0.12s ease",
                      transform:
                        isHovered && !isSelected ? "translateY(-1px)" : "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      outline: "none",
                      // スマホでタップ領域を広く
                      minHeight: 80,
                    }}
                  >
                    <Icon
                      size={15}
                      strokeWidth={1.5}
                      color={isSelected ? "#19C99A" : "#829AAF"}
                    />
                    <div>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: isSelected ? "#A7F3D0" : "#B6C7D6",
                          lineHeight: 1.3,
                          marginBottom: 4,
                        }}
                      >
                        {option.label}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 400,
                          color: isSelected ? "#86efac" : "#829AAF",
                          lineHeight: 1.4,
                        }}
                      >
                        {option.sub}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {/* CTA ボタン */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!selected}
          style={{
            width: "100%",
            padding: "17px",
            borderRadius: 13,
            fontSize: 14,
            fontWeight: 700,
            border: selected ? "none" : "1px solid rgba(180,210,230,0.18)",
            cursor: selected ? "pointer" : "not-allowed",
            background: selected
              ? "#19C99A"
              : "transparent",
            color: selected ? "#0d1f35" : "#829AAF",
            transition: "background 0.22s ease, color 0.22s ease",
            letterSpacing: "0.02em",
            marginTop: 8,
          }}
        >
          {selected ? "少し整理する" : "状態を選んでください"}
        </button>

        {prevAction && prevAction.status !== "completed" && (
          <div
            style={{
              marginTop: 40,
              padding: "18px 20px",
              borderRadius: 14,
              border: "1px solid rgba(180,210,230,0.18)",
              background: "#183149",
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: "#19C99A",
                marginBottom: 6,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              前回決めた次の一歩
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#B6C7D6",
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              「{prevAction.action}」
            </p>
            {prevAction.deadline && (
              <p
                style={{
                  fontSize: 11,
                  color: "#829AAF",
                  marginTop: 5,
                  lineHeight: 1.4,
                }}
              >
                期限：{formatDeadlineLabel(prevAction.deadline)}
              </p>
            )}
            {(() => {
              const ds = getDeadlineStatus(prevAction.deadline);
              if (ds !== "today" && ds !== "overdue") return null;
              return (
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: "1px solid rgba(180,210,230,0.12)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: "#829AAF",
                      marginBottom: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    {ds === "today"
                      ? "この一歩、どうでしたか？"
                      : "この一歩、どうなりましたか？"}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => router.push("/employee/reflect?result=done")}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: 9,
                        border: "1px solid rgba(25,201,154,0.50)",
                        background: "rgba(25,201,154,0.12)",
                        color: "#19C99A",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      できた
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/employee/reflect?result=notyet")}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: 9,
                        border: "1px solid rgba(180,210,230,0.18)",
                        background: "#1D3953",
                        color: "#B6C7D6",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      まだできていない
                    </button>
                  </div>
                </div>
              );
            })()}
            {managerRequest?.managerFeedback && (
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: "1px solid rgba(180,210,230,0.12)",
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    color: "#829AAF",
                    marginBottom: 5,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  上司からのフィードバック
                </p>
                <p style={{ fontSize: 12, color: "#829AAF", lineHeight: 1.7 }}>
                  {managerRequest.managerFeedback}
                </p>
              </div>
            )}
            {managerRequest?.managementAction && (
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: "1px solid rgba(165,180,252,0.12)",
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    color: "#6366f1",
                    marginBottom: 5,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  経営からの反応
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "#a5b4fc",
                    fontWeight: 600,
                    lineHeight: 1.6,
                    marginBottom: managerRequest.managementComment ? 5 : 0,
                  }}
                >
                  {MGMT_ACTION_LABELS[managerRequest.managementAction]}
                </p>
                {managerRequest.managementComment && (
                  <p style={{ fontSize: 12, color: "#829AAF", lineHeight: 1.7 }}>
                    {managerRequest.managementComment}
                  </p>
                )}
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                onClick={() => router.push("/employee/share")}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(180,210,230,0.18)",
                  background: "transparent",
                  color: "#829AAF",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  textAlign: "center",
                  letterSpacing: "0.04em",
                }}
              >
                上司に相談する
              </button>
            </div>
          </div>
        )}

        {/* フッターコピー */}
        <footer style={{ marginTop: 48, textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
            color: "#829AAF",
              lineHeight: 1.9,
            }}
          >
            ここで整理した内容は、あなた自身のためのものです。
            <br />
            <span style={{ fontSize: 11, color: "#829AAF" }}>
              評価のためではなく、自分のために整理する場所です。
            </span>
          </p>
        </footer>

      </div>
    </main>
  );
}

export default function EmployeePage() {
  return (
    <Suspense>
      <EmployeeContent />
    </Suspense>
  );
}
