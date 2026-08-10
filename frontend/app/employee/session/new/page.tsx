"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const STATE_LABELS: Record<string, string> = {
  irritated: "イライラしている",
  down:      "落ち込んでいる",
  anxious:   "不安がある",
  uncertain: "迷っている",
  decision:  "判断したい",
  organize:  "頭の中を整理したい",
  tired:     "疲れている",
  positive:  "嬉しいことがあった",
};

type DraftData = {
  state: string;
  eventText: string;
  createdAt: string;
};

function SessionNewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stateParam = searchParams.get("state") ?? "";
  const stateLabel = STATE_LABELS[stateParam] ?? null;

  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const isActive = text.trim().length > 0;

  const handleNext = () => {
    if (!isActive) return;
    const draft: DraftData = {
      state: stateParam,
      eventText: text.trim(),
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem("hcos_session_draft", JSON.stringify(draft));
    router.push("/employee/session/draft");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
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
            marginBottom: 32,
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

        {/* 戻るリンク */}
        <Link
          href="/employee"
          style={{
            display: "inline-block",
            fontSize: 12,
            color: "#4e6480",
            textDecoration: "none",
            marginBottom: 28,
            letterSpacing: "0.02em",
          }}
        >
          ← 状態を選び直す
        </Link>

        {/* ステップ表示 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "#4e6a86",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            Step 02
          </span>
          <div
            style={{
              flex: 1,
              height: 1,
              background: "rgba(255,255,255,0.07)",
            }}
          />
        </div>

        {/* 選択した状態 — 確認用の小さな表示 */}
        {stateLabel && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 36,
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.025)",
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "#4e6a86",
                letterSpacing: "0.06em",
              }}
            >
              選択した状態
            </span>
            <span
              style={{
                fontSize: 12,
                color: "#7a90a8",
                fontWeight: 500,
              }}
            >
              {stateLabel}
            </span>
          </div>
        )}

        {/* メイン質問 */}
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            lineHeight: 1.25,
            color: "#e2e8f0",
            marginBottom: 12,
          }}
        >
          何がありましたか？
        </h1>

        <p
          style={{
            fontSize: 13,
            color: "#7a90a8",
            lineHeight: 1.85,
            marginBottom: 28,
          }}
        >
          まとまっていなくても大丈夫です。
          <br />
          今、頭に残っていることをそのまま書いてください。
        </p>

        {/* 入力欄 */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            "たとえば、\n今日の打ち合わせがなんとなく引っかかっている。\n上司の反応が気になる。\n自分の説明が悪かったのか、\nそもそも考え方が違うのか分からない…"
          }
          rows={9}
          // Tailwind で placeholder の色だけを指定
          className="placeholder:text-[#3a5570]"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "18px 20px",
            borderRadius: 14,
            border: isFocused
              ? "1px solid rgba(16,185,129,0.38)"
              : "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
            color: "#d1dde8",
            fontSize: 14,
            lineHeight: 1.85,
            resize: "vertical",
            outline: "none",
            transition: "border-color 0.16s ease",
            fontFamily: "inherit",
          }}
        />

        {/* CTA */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!isActive}
          style={{
            width: "100%",
            padding: "17px",
            borderRadius: 13,
            fontSize: 14,
            fontWeight: 700,
            border: isActive ? "none" : "1px solid rgba(255,255,255,0.10)",
            cursor: isActive ? "pointer" : "not-allowed",
            background: isActive ? "rgba(16,185,129,0.82)" : "transparent",
            color: isActive ? "#fff" : "#4e6a86",
            transition: "background 0.22s ease, color 0.22s ease",
            letterSpacing: "0.02em",
            marginTop: 16,
          }}
        >
          {isActive ? "整理をはじめる →" : "頭にあることを書いてください"}
        </button>

      </div>
    </main>
  );
}

export default function SessionNewPage() {
  return (
    <Suspense>
      <SessionNewContent />
    </Suspense>
  );
}
