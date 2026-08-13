"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function EmployeePage() {
  const router = useRouter();
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

  const handleNext = () => {
    if (!selected) return;
    router.push(`/employee/session/new?state=${selected}`);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        // 非常に弱い中央グロー — ほぼ気づかない程度の奥行き
        background:
          "radial-gradient(ellipse 80% 55% at 50% 18%, rgba(16,185,129,0.07) 0%, transparent 68%), #0d1f35",
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
              color: "#4e6480",
              textTransform: "uppercase",
            }}
          >
            Human Capital OS
          </span>
          <span
            style={{
              width: 1,
              height: 12,
              background: "#2a3f58",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.16em",
              color: "#3a5470",
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
              color: "#4e6480",
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
              color: "#e2e8f0",
              marginBottom: 14,
            }}
          >
            今日はどんな状態ですか？
          </h1>

          <p
            style={{
              fontSize: 13,
              color: "#7a90a8",
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
                  color: "#4e6a86",
                  textTransform: "uppercase",
                }}
              >
                {group.groupLabel}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(255,255,255,0.09)",
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
                        ? "1.5px solid rgba(16,185,129,0.60)"
                        : isHovered
                        ? "1px solid rgba(255,255,255,0.20)"
                        : "1px solid rgba(255,255,255,0.11)",
                      background: isSelected
                        ? "rgba(16,185,129,0.10)"
                        : isHovered
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(255,255,255,0.05)",
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
                      color={isSelected ? "#6ee7b7" : "#4e6a86"}
                    />
                    <div>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: isSelected ? "#a7f3d0" : "#b8c8d8",
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
                          color: isSelected ? "#4ade80" : "#607d97",
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
            border: selected ? "none" : "1px solid rgba(255,255,255,0.14)",
            cursor: selected ? "pointer" : "not-allowed",
            background: selected
              ? "rgba(16,185,129,0.82)"
              : "transparent",
            color: selected ? "#fff" : "#4e6a86",
            transition: "background 0.22s ease, color 0.22s ease",
            letterSpacing: "0.02em",
            marginTop: 8,
          }}
        >
          {selected ? "少し整理する" : "状態を選んでください"}
        </button>

        {prevAction && (
          <div
            style={{
              marginTop: 40,
              padding: "14px 18px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: "#4e6a86",
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
                color: "#607d97",
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
                  color: "#3a5470",
                  marginTop: 5,
                  lineHeight: 1.4,
                }}
              >
                期限：{formatDeadlineLabel(prevAction.deadline)}
              </p>
            )}
          </div>
        )}

        {/* フッターコピー */}
        <footer style={{ marginTop: 48, textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              color: "#3a5470",
              lineHeight: 1.9,
            }}
          >
            ここで整理した内容は、あなた自身のためのものです。
            <br />
            <span style={{ fontSize: 11, color: "#2e4a66" }}>
              評価のためではなく、自分のために整理する場所です。
            </span>
          </p>
        </footer>

      </div>
    </main>
  );
}
