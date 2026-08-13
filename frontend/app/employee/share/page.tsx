"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY_NEXT_ACTION = "hcos_next_action";
const STORAGE_KEY_MANAGER_REQUESTS = "hcos_manager_requests";
const BG =
  "radial-gradient(ellipse 80% 55% at 50% 18%, rgba(16,185,129,0.07) 0%, transparent 68%), #0d1f35";

type HcosNextAction = {
  action: string;
  createdAt: string;
  deadline?: string;
  status?: "active" | "completed";
};

type ManagerRequest = {
  id: string;
  employeeName: string;
  action: string;
  deadline?: string;
  supportType: string;
  message: string;
  status: "support_requested" | "feedback_sent" | "sent_to_management";
  managerFeedback: string | null;
  createdAt: string;
};

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

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

function BrandHeader() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 40,
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
        style={{ width: 1, height: 12, background: "#2a3f58", flexShrink: 0 }}
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
  );
}

const SUPPORT_OPTIONS = [
  { id: "advice", label: "意見がほしい" },
  { id: "info", label: "判断材料がほしい" },
  { id: "cooperation", label: "協力してほしい" },
  { id: "escalate", label: "経営にも提案したい" },
];

export default function EmployeeSharePage() {
  const router = useRouter();
  const [nextAction, setNextAction] = useState<HcosNextAction | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [supportType, setSupportType] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_NEXT_ACTION);
      if (raw) {
        const parsed = JSON.parse(raw) as HcosNextAction;
        if (parsed.action && parsed.status !== "completed") {
          setNextAction(parsed);
        }
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded && !nextAction) {
      router.replace("/employee");
    }
  }, [loaded, nextAction, router]);

  const handleSubmit = () => {
    if (!supportType || !nextAction) return;

    const request: ManagerRequest = {
      id: genId(),
      employeeName: "（あなた）",
      action: nextAction.action,
      deadline: nextAction.deadline,
      supportType,
      message: message.trim(),
      status: "support_requested",
      managerFeedback: null,
      createdAt: new Date().toISOString(),
    };

    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_MANAGER_REQUESTS);
      const existing: ManagerRequest[] = raw ? JSON.parse(raw) : [];
      existing.push(request);
      sessionStorage.setItem(
        STORAGE_KEY_MANAGER_REQUESTS,
        JSON.stringify(existing)
      );
    } catch {
      /* ignore */
    }

    setSubmitted(true);
    setTimeout(() => router.replace("/employee"), 1600);
  };

  if (!loaded) {
    return <main style={{ minHeight: "100vh", background: BG }} />;
  }

  if (submitted) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: BG,
          color: "#fff",
          padding: "44px 20px 80px",
        }}
      >
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <BrandHeader />
          <div style={{ paddingTop: 48, textAlign: "center" }}>
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#e2e8f0",
                lineHeight: 1.6,
                marginBottom: 10,
              }}
            >
              上司に共有しました。
            </p>
            <p style={{ fontSize: 12, color: "#4e6a86" }}>
              ホームに戻ります…
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: BG,
        color: "#fff",
        padding: "44px 20px 80px",
        overflowX: "hidden",
      }}
    >
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        <BrandHeader />

        {/* タイトル */}
        <section style={{ marginBottom: 36 }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#e2e8f0",
              lineHeight: 1.25,
              marginBottom: 10,
            }}
          >
            上司に相談する
          </h1>
          <p style={{ fontSize: 13, color: "#7a90a8", lineHeight: 1.7 }}>
            必要なことだけ共有できます。
          </p>
        </section>

        {/* 次の一歩（読み取り専用。AI会話・感情状態は含まない） */}
        {nextAction && (
          <div
            style={{
              marginBottom: 32,
              padding: "16px 18px",
              borderRadius: 12,
              border: "1px solid rgba(16,185,129,0.25)",
              background: "rgba(16,185,129,0.04)",
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
              次の一歩
            </p>
            <p
              style={{
                fontSize: 14,
                color: "#b8c8d8",
                fontWeight: 600,
                lineHeight: 1.5,
                marginBottom: nextAction.deadline ? 6 : 0,
              }}
            >
              「{nextAction.action}」
            </p>
            {nextAction.deadline && (
              <p style={{ fontSize: 11, color: "#4e6a86", lineHeight: 1.4 }}>
                期限：{formatDeadlineLabel(nextAction.deadline)}
              </p>
            )}
          </div>
        )}

        {/* 支援種別 */}
        <section style={{ marginBottom: 28 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#94a3b8",
              marginBottom: 14,
              lineHeight: 1.5,
            }}
          >
            何について支援してほしいですか？
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SUPPORT_OPTIONS.map(({ id, label }) => {
              const isSelected = supportType === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSupportType(id)}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 11,
                    border: isSelected
                      ? "1.5px solid rgba(16,185,129,0.55)"
                      : "1px solid rgba(255,255,255,0.11)",
                    background: isSelected
                      ? "rgba(16,185,129,0.09)"
                      : "rgba(255,255,255,0.03)",
                    color: isSelected ? "#a7f3d0" : "#94a3b8",
                    fontSize: 13,
                    fontWeight: isSelected ? 600 : 400,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "border-color 0.14s ease, background 0.14s ease",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 任意メッセージ */}
        <section style={{ marginBottom: 32 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#94a3b8",
              marginBottom: 10,
            }}
          >
            伝えておきたいこと（任意）
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={200}
            placeholder="自由に記入してください"
            style={{
              width: "100%",
              minHeight: 90,
              padding: "12px 14px",
              borderRadius: 10,
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
          <p
            style={{
              fontSize: 10,
              color: "#3a5470",
              marginTop: 4,
              textAlign: "right",
            }}
          >
            {message.length} / 200
          </p>
        </section>

        {/* CTA */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!supportType}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 12,
            border: supportType ? "none" : "1px solid rgba(255,255,255,0.14)",
            fontSize: 14,
            fontWeight: 700,
            cursor: supportType ? "pointer" : "not-allowed",
            background: supportType
              ? "rgba(16,185,129,0.82)"
              : "transparent",
            color: supportType ? "#fff" : "#4e6a86",
            transition: "background 0.22s ease, color 0.22s ease",
            letterSpacing: "0.02em",
          }}
        >
          {supportType ? "上司に共有する →" : "支援内容を選んでください"}
        </button>

        <p
          style={{
            fontSize: 11,
            color: "#2e4a66",
            textAlign: "center",
            marginTop: 16,
            lineHeight: 1.8,
          }}
        >
          AIとの会話内容は共有されません。
          <br />
          次の一歩と、あなたが選んだ支援内容だけが伝わります。
        </p>
      </div>
    </main>
  );
}
