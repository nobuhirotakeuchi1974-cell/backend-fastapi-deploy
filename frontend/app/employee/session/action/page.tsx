"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STORAGE_KEY_NEXT_ACTION = "hcos_next_action";

const BG =
  "radial-gradient(ellipse 80% 55% at 50% 18%, rgba(16,185,129,0.07) 0%, transparent 68%), #0d1f35";

type HcosNextAction = {
  action: string;
  createdAt: string;
  deadline?: string;
};

type DeadlineOption = "today" | "tomorrow" | "thisweek" | "custom";

// ローカル日付を YYYY-MM-DD 形式で返す（UTC変換によるズレを避ける）
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

// 今週の日曜日（今日が日曜なら今日）を返す
function calcEndOfWeek(today: Date): Date {
  const dayOfWeek = today.getDay(); // 0=日, 1=月 ... 6=土
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const result = new Date(today);
  result.setDate(today.getDate() + daysUntilSunday);
  return result;
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
  );
}

export default function SessionActionPage() {
  const router = useRouter();
  const [nextAction, setNextAction] = useState<HcosNextAction | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<DeadlineOption | null>(null);
  const [customDate, setCustomDate] = useState("");
  const [completed, setCompleted] = useState(false);

  // sessionStorage から確定済みアクションを読み込む
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_NEXT_ACTION);
      if (raw) {
        const parsed = JSON.parse(raw) as HcosNextAction;
        if (parsed.action) {
          setNextAction(parsed);
        }
      }
    } catch {
      // JSON parse 失敗は無視して不正遷移として扱う
    }
    setLoaded(true);
  }, []);

  // 不正遷移: actionデータなし → /employee へリダイレクト
  useEffect(() => {
    if (loaded && !nextAction) {
      router.replace("/employee");
    }
  }, [loaded, nextAction, router]);

  const today = getLocalToday();
  const todayStr = toLocalDateString(today);
  const tomorrowStr = toLocalDateString(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  );
  const endOfWeekStr = toLocalDateString(calcEndOfWeek(today));

  const resolvedDeadline = (): string | null => {
    switch (selectedOption) {
      case "today":    return todayStr;
      case "tomorrow": return tomorrowStr;
      case "thisweek": return endOfWeekStr;
      case "custom":   return customDate || null;
      default:         return null;
    }
  };

  const deadline = resolvedDeadline();
  const canCommit = deadline !== null;

  const handleCommit = () => {
    if (!deadline || !nextAction) return;
    const updated: HcosNextAction = { ...nextAction, deadline };
    try {
      sessionStorage.setItem(STORAGE_KEY_NEXT_ACTION, JSON.stringify(updated));
    } catch {
      // storage quota は無視
    }
    setCompleted(true);
    setTimeout(() => {
      router.replace("/employee");
    }, 1600);
  };

  // ロード前 or データなし（redirect useEffect 発火待機中）: 空背景
  if (!loaded || !nextAction) {
    return <main style={{ minHeight: "100vh", background: BG }} />;
  }

  // 完了状態（1.6秒後に /employee へ遷移）
  if (completed) {
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
                fontSize: 17,
                fontWeight: 700,
                color: "#e2e8f0",
                lineHeight: 1.55,
                marginBottom: 14,
              }}
            >
              決まりました。今日はここで終わりです。
            </p>
            <p style={{ fontSize: 12, color: "#4e6a86", lineHeight: 1.8 }}>
              ホームに戻ります…
            </p>
          </div>
        </div>
      </main>
    );
  }

  const optionLabel: Record<DeadlineOption, string> = {
    today: "今日",
    tomorrow: "明日",
    thisweek: "今週中",
    custom: "日付を選ぶ",
  };

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
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#e2e8f0",
              marginBottom: 10,
              lineHeight: 1.3,
            }}
          >
            次の一歩が決まりました。
          </h1>
          <p style={{ fontSize: 13, color: "#7a90a8", lineHeight: 1.8 }}>
            あとは、いつやるかだけ決めて終わりましょう。
          </p>
        </section>

        {/* 確定した次の一歩（読み取り専用） */}
        <div style={{ marginBottom: 36 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#4e6a86",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            次の一歩
          </p>
          <div
            style={{
              padding: "18px 20px",
              borderRadius: 13,
              border: "1px solid rgba(16,185,129,0.30)",
              background: "rgba(16,185,129,0.05)",
            }}
          >
            <p
              style={{
                fontSize: 15,
                color: "#b8c8d8",
                fontWeight: 600,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              「{nextAction!.action}」
            </p>
          </div>
        </div>

        {/* 期限選択 */}
        <div style={{ marginBottom: 32 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#94a3b8",
              marginBottom: 16,
            }}
          >
            いつやりますか？
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(["today", "tomorrow", "thisweek", "custom"] as DeadlineOption[]).map((opt) => {
              const isSelected = selectedOption === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedOption(opt)}
                  style={{
                    padding: "16px 20px",
                    borderRadius: 13,
                    border: isSelected
                      ? "1.5px solid rgba(16,185,129,0.60)"
                      : "1px solid rgba(255,255,255,0.11)",
                    background: isSelected
                      ? "rgba(16,185,129,0.10)"
                      : "rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    textAlign: "left",
                    color: isSelected ? "#a7f3d0" : "#b8c8d8",
                    fontSize: 14,
                    fontWeight: isSelected ? 600 : 500,
                    transition: "border-color 0.14s ease, background 0.14s ease",
                    outline: "none",
                    width: "100%",
                    // スマホで押しやすいよう最低高さを確保
                    minHeight: 52,
                  }}
                >
                  {optionLabel[opt]}
                </button>
              );
            })}
          </div>

          {/* カスタム日付入力（「日付を選ぶ」選択時のみ表示） */}
          {selectedOption === "custom" && (
            <div style={{ marginTop: 14 }}>
              <input
                type="date"
                value={customDate}
                min={todayStr}
                onChange={(e) => setCustomDate(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px 16px",
                  borderRadius: 11,
                  border: customDate
                    ? "1px solid rgba(16,185,129,0.40)"
                    : "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#d1dde8",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "inherit",
                  colorScheme: "dark",
                  transition: "border-color 0.15s ease",
                }}
              />
            </div>
          )}
        </div>

        {/* CTA — 期限未選択では disabled */}
        <button
          type="button"
          onClick={handleCommit}
          disabled={!canCommit}
          style={{
            width: "100%",
            padding: "17px",
            borderRadius: 13,
            fontSize: 14,
            fontWeight: 700,
            border: canCommit ? "none" : "1px solid rgba(255,255,255,0.09)",
            cursor: canCommit ? "pointer" : "not-allowed",
            background: canCommit ? "rgba(16,185,129,0.82)" : "transparent",
            color: canCommit ? "#fff" : "#3a5470",
            transition: "background 0.22s ease, color 0.22s ease",
            letterSpacing: "0.02em",
          }}
        >
          この一歩を決める →
        </button>

        {/* 戻るリンク */}
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <Link
            href="/employee"
            style={{
              fontSize: 12,
              color: "#3a5470",
              textDecoration: "none",
            }}
          >
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
