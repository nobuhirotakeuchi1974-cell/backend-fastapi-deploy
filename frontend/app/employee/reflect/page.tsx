"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const STORAGE_KEY_NEXT_ACTION = "hcos_next_action";
const BG =
  "radial-gradient(ellipse 80% 55% at 50% 18%, rgba(16,185,129,0.07) 0%, transparent 68%), #0d1f35";

type HcosNextAction = {
  action: string;
  createdAt: string;
  deadline?: string;
  status?: "active" | "completed";
};

type DeadlineOption = "today" | "tomorrow" | "thisweek" | "custom";
type SubState =
  | "done_reflect"
  | "done_nextstep"
  | "notyet_choice"
  | "extend_deadline"
  | "finished";

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getLocalToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function calcEndOfWeek(today: Date): Date {
  const dayOfWeek = today.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const result = new Date(today);
  result.setDate(today.getDate() + daysUntilSunday);
  return result;
}

function choiceBtnStyle(isSelected = false): React.CSSProperties {
  return {
    padding: "16px 20px",
    borderRadius: 12,
    border: isSelected
      ? "1.5px solid rgba(16,185,129,0.60)"
      : "1px solid rgba(255,255,255,0.13)",
    background: isSelected
      ? "rgba(16,185,129,0.10)"
      : "rgba(255,255,255,0.04)",
    color: isSelected ? "#a7f3d0" : "#b8c8d8",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    transition: "background 0.14s ease, border-color 0.14s ease",
  };
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

function ReflectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const result = searchParams.get("result");

  const [subState, setSubState] = useState<SubState>(
    result === "done" ? "done_reflect" : "notyet_choice"
  );
  const [deadlineOption, setDeadlineOption] = useState<DeadlineOption | null>(
    null
  );
  const [customDate, setCustomDate] = useState("");

  const today = getLocalToday();
  const todayStr = toLocalDateString(today);
  const tomorrowStr = toLocalDateString(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  );
  const endOfWeekStr = toLocalDateString(calcEndOfWeek(today));

  const resolvedDeadline = (): string | null => {
    switch (deadlineOption) {
      case "today":
        return todayStr;
      case "tomorrow":
        return tomorrowStr;
      case "thisweek":
        return endOfWeekStr;
      case "custom":
        return customDate || null;
      default:
        return null;
    }
  };

  const markCompleted = () => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_NEXT_ACTION);
      if (raw) {
        const parsed = JSON.parse(raw) as HcosNextAction;
        sessionStorage.setItem(
          STORAGE_KEY_NEXT_ACTION,
          JSON.stringify({ ...parsed, status: "completed" })
        );
      }
    } catch {
      /* ignore */
    }
  };

  const applyExtendedDeadline = () => {
    const dl = resolvedDeadline();
    if (!dl) return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_NEXT_ACTION);
      if (raw) {
        const parsed = JSON.parse(raw) as HcosNextAction;
        sessionStorage.setItem(
          STORAGE_KEY_NEXT_ACTION,
          JSON.stringify({ ...parsed, deadline: dl })
        );
      }
    } catch {
      /* ignore */
    }
    setSubState("finished");
    setTimeout(() => router.replace("/employee"), 1400);
  };

  const deadlineLabel: Record<DeadlineOption, string> = {
    today: "今日",
    tomorrow: "明日",
    thisweek: "今週中",
    custom: "日付を選ぶ",
  };

  // ── 保存完了 ────────────────────────────────
  if (subState === "finished") {
    return (
      <div style={{ paddingTop: 48, textAlign: "center" }}>
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#e2e8f0",
            lineHeight: 1.6,
            marginBottom: 10,
          }}
        >
          保存しました。
        </p>
        <p style={{ fontSize: 12, color: "#4e6a86" }}>ホームに戻ります…</p>
      </div>
    );
  }

  // ── できた → 振り返り選択 ────────────────────
  if (subState === "done_reflect") {
    return (
      <>
        <section style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#e2e8f0",
              lineHeight: 1.3,
              marginBottom: 12,
            }}
          >
            やってみて、何か変わりましたか？
          </h1>
        </section>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { id: "forward", label: "前に進んだ" },
            { id: "learned", label: "新しいことが分かった" },
            { id: "same", label: "思ったほど変わらなかった" },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSubState("done_nextstep")}
              style={choiceBtnStyle()}
            >
              {label}
            </button>
          ))}
        </div>
      </>
    );
  }

  // ── できた → 次の一歩を考えるか ────────────────
  if (subState === "done_nextstep") {
    return (
      <>
        <section style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#e2e8f0",
              marginBottom: 10,
              lineHeight: 1.4,
            }}
          >
            次の一歩も考えますか？
          </h1>
        </section>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            onClick={() => router.push("/employee")}
            style={choiceBtnStyle()}
          >
            次の一歩を考える
          </button>
          <button
            type="button"
            onClick={() => {
              markCompleted();
              setSubState("finished");
              setTimeout(() => router.replace("/employee"), 1400);
            }}
            style={choiceBtnStyle()}
          >
            今日はここで終わる
          </button>
        </div>
      </>
    );
  }

  // ── まだできていない → 選択 ────────────────────
  if (subState === "notyet_choice") {
    return (
      <>
        <section style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#e2e8f0",
              marginBottom: 10,
              lineHeight: 1.4,
            }}
          >
            まだ途中でも大丈夫です。
          </h1>
          <p style={{ fontSize: 13, color: "#7a90a8", lineHeight: 1.7 }}>
            この一歩をどうしますか？
          </p>
        </section>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            onClick={() => setSubState("extend_deadline")}
            style={choiceBtnStyle()}
          >
            期限を延ばす
          </button>
          <button
            type="button"
            onClick={() => router.push("/employee")}
            style={choiceBtnStyle()}
          >
            もっと小さな一歩にする
          </button>
          <button
            type="button"
            onClick={() => router.push("/employee")}
            style={choiceBtnStyle()}
          >
            別の一歩を考える
          </button>
        </div>
      </>
    );
  }

  // ── 期限を延ばす ────────────────────────────
  if (subState === "extend_deadline") {
    const dl = resolvedDeadline();
    return (
      <>
        <section style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#e2e8f0",
              marginBottom: 10,
              lineHeight: 1.4,
            }}
          >
            いつに延ばしますか？
          </h1>
        </section>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {(
            ["today", "tomorrow", "thisweek", "custom"] as DeadlineOption[]
          ).map((opt) => {
            const isSelected = deadlineOption === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setDeadlineOption(opt)}
                style={choiceBtnStyle(isSelected)}
              >
                {deadlineLabel[opt]}
              </button>
            );
          })}
        </div>
        {deadlineOption === "custom" && (
          <input
            type="date"
            value={customDate}
            min={todayStr}
            onChange={(e) => setCustomDate(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.05)",
              color: "#b8c8d8",
              fontSize: 14,
              marginBottom: 16,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        )}
        <button
          type="button"
          onClick={applyExtendedDeadline}
          disabled={!dl}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 12,
            border: dl ? "none" : "1px solid rgba(255,255,255,0.14)",
            fontSize: 14,
            fontWeight: 700,
            cursor: dl ? "pointer" : "not-allowed",
            background: dl ? "rgba(16,185,129,0.82)" : "transparent",
            color: dl ? "#fff" : "#4e6a86",
            transition: "background 0.22s ease, color 0.22s ease",
            letterSpacing: "0.02em",
          }}
        >
          {dl ? "この期限で保存する" : "期限を選んでください"}
        </button>
      </>
    );
  }

  return null;
}

export default function ReflectPage() {
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
        <Suspense fallback={<div style={{ color: "#4e6a86" }}>読み込み中…</div>}>
          <ReflectInner />
        </Suspense>
      </div>
    </main>
  );
}
