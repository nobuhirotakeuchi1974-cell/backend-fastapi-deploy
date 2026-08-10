"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  type EmotionalIntensity,
  type Message,
  type Phase,
  type SessionStatus,
  generateInitialMessage,
  generateMockResponse,
} from "./mockEngine";

// ── 定数 ─────────────────────────────────────────

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

const BG =
  "radial-gradient(ellipse 80% 55% at 50% 18%, rgba(16,185,129,0.07) 0%, transparent 68%), #0d1f35";

// ── サブコンポーネント ────────────────────────────

function BrandHeader() {
  return (
    <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "#4e6480", textTransform: "uppercase" }}>
        Human Capital OS
      </span>
      <span style={{ width: 1, height: 12, background: "#2a3f58", flexShrink: 0 }} />
      <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.16em", color: "#3a5470", textTransform: "uppercase" }}>
        Self-Decision System
      </span>
    </header>
  );
}

function StepDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "#4e6a86", textTransform: "uppercase", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
    </div>
  );
}

function MessageItem({ message }: { message: Message }) {
  const isAI = message.role === "ai";
  return (
    <div
      style={{
        marginBottom: isAI ? 24 : 20,
        paddingLeft: isAI ? 0 : 16,
        borderLeft: isAI ? "none" : "2px solid rgba(16,185,129,0.20)",
      }}
    >
      {message.content.split("\n").map((line, i) => (
        <p
          key={i}
          style={{
            fontSize: isAI ? 14 : 13,
            color: isAI ? "#c4d4e4" : "#6b86a0",
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          {line || "\u00A0"}
        </p>
      ))}
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 18, color: "#3a5470", letterSpacing: "0.2em", lineHeight: 1 }}>···</p>
    </div>
  );
}

function CompletedView({
  nextAction,
  onNavigate,
}: {
  nextAction: string | null;
  onNavigate: () => void;
}) {
  return (
    <div style={{ paddingTop: 32, paddingBottom: 16 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#4e6a86", textTransform: "uppercase", marginBottom: 16 }}>
        次の一歩
      </p>
      <p
        style={{
          fontSize: 15,
          color: "#b8c8d8",
          fontWeight: 600,
          lineHeight: 1.7,
          padding: "16px 20px",
          borderRadius: 12,
          border: "1px solid rgba(16,185,129,0.30)",
          background: "rgba(16,185,129,0.05)",
          marginBottom: 32,
        }}
      >
        「{nextAction}」
      </p>
      <button
        type="button"
        onClick={onNavigate}
        style={{
          width: "100%",
          padding: "17px",
          borderRadius: 13,
          fontSize: 14,
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          background: "rgba(16,185,129,0.82)",
          color: "#fff",
          letterSpacing: "0.02em",
        }}
      >
        次のステップへ →
      </button>
    </div>
  );
}

function ClosedView() {
  return (
    <div style={{ paddingTop: 32, paddingBottom: 16, textAlign: "center" }}>
      <p style={{ fontSize: 14, color: "#7a90a8", lineHeight: 1.9, marginBottom: 32 }}>
        今日はここで区切りました。
        <br />
        また思い出したときに続けましょう。
      </p>
      <Link
        href="/employee"
        style={{
          fontSize: 13,
          color: "#4e6a86",
          textDecoration: "none",
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        ← ホームに戻る
      </Link>
    </div>
  );
}

function CloseConfirmView({ onConfirm }: { onConfirm: (yes: boolean) => void }) {
  return (
    <div
      style={{
        padding: "20px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 20, lineHeight: 1.7 }}>
        今日はここで区切りますか？
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          onClick={() => onConfirm(true)}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "transparent",
            color: "#7a90a8",
            cursor: "pointer",
          }}
        >
          はい、区切る
        </button>
        <button
          type="button"
          onClick={() => onConfirm(false)}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            background: "rgba(16,185,129,0.75)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          続ける
        </button>
      </div>
    </div>
  );
}

// ── メインページ ──────────────────────────────────

export default function SessionDraftPage() {
  const router = useRouter();

  // セッションデータ
  const [sessionData, setSessionData] = useState<{ selectedState: string; eventText: string } | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // 会話状態
  const [messages, setMessages] = useState<Message[]>([]);
  const [phase, setPhase] = useState<Phase>("RECEIVE");
  const [turnInPhase, setTurnInPhase] = useState(0);
  const [emotionalIntensity, setEmotionalIntensity] = useState<EmotionalIntensity>("medium");

  // 思考整理の内部状態
  const [focusHypothesis, setFocusHypothesis] = useState<string | null>(null);
  const [focusConfirmed, setFocusConfirmed] = useState(false);
  const [nextActionCandidate, setNextActionCandidate] = useState<string | null>(null);
  const [nextActionConfirmed, setNextActionConfirmed] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("active");

  // UI状態
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── 初期化: sessionStorage から読み込み ─────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("hcos_session_draft");
      if (!raw) {
        setDataLoaded(true);
        return;
      }
      const draft = JSON.parse(raw) as { state?: string; eventText?: string };
      const state = draft.state ?? "";
      const eventText = draft.eventText ?? "";

      setSessionData({ selectedState: state, eventText });

      const intensity: EmotionalIntensity = ["irritated", "down", "anxious"].includes(state)
        ? "high"
        : ["uncertain", "tired"].includes(state)
        ? "medium"
        : "low";
      setEmotionalIntensity(intensity);

      const firstMsg = generateInitialMessage(state, intensity);
      setMessages([{ id: crypto.randomUUID(), role: "ai", content: firstMsg }]);
    } catch {
      // JSON parse failure — treat as no data
    }
    setDataLoaded(true);
  }, []);

  // ── 最新メッセージへ自動スクロール ──────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ── 完了時: sessionStorage に保存 ────────────────
  useEffect(() => {
    if (sessionStatus === "completed" && nextActionConfirmed && nextActionCandidate) {
      sessionStorage.setItem(
        "hcos_next_action",
        JSON.stringify({ action: nextActionCandidate, createdAt: new Date().toISOString() })
      );
    }
  }, [sessionStatus, nextActionConfirmed, nextActionCandidate]);

  // ── 送信 ─────────────────────────────────────────
  const handleSubmit = () => {
    const trimmed = userInput.trim();
    if (!trimmed || isLoading || sessionStatus !== "active") return;

    // 送信時点の状態をキャプチャ（closure stale 回避）
    const capturedPhase = phase;
    const capturedTurn = turnInPhase;
    const capturedFocusHypothesis = focusHypothesis;
    const capturedFocusConfirmed = focusConfirmed;
    const capturedNextActionCandidate = nextActionCandidate;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setUserInput("");
    setIsLoading(true);

    // 実API接続時はここを非同期APIコールに差し替える
    setTimeout(() => {
      const result = generateMockResponse(trimmed, {
        selectedState: sessionData?.selectedState ?? "",
        phase: capturedPhase,
        turnInPhase: capturedTurn,
        emotionalIntensity,
        focusHypothesis: capturedFocusHypothesis,
        focusConfirmed: capturedFocusConfirmed,
        nextActionCandidate: capturedNextActionCandidate,
      });

      const aiMsg: Message = { id: crypto.randomUUID(), role: "ai", content: result.content };
      setMessages((prev) => [...prev, aiMsg]);

      // フェーズ遷移
      if (result.phaseChanged) {
        setPhase(result.nextPhase);
        setTurnInPhase(0);
      } else {
        setTurnInPhase((prev) => prev + 1);
      }

      // 状態更新
      if (result.updates.focusHypothesis) setFocusHypothesis(result.updates.focusHypothesis);
      if (result.updates.focusConfirmed !== undefined) setFocusConfirmed(result.updates.focusConfirmed);
      if (result.updates.nextActionCandidate) setNextActionCandidate(result.updates.nextActionCandidate);
      if (result.updates.nextActionConfirmed) setNextActionConfirmed(true);
      if (result.updates.sessionStatus) setSessionStatus(result.updates.sessionStatus);

      setIsLoading(false);
    }, 750);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCloseConfirm = (yes: boolean) => {
    if (yes) setSessionStatus("closed_without_action");
    setShowCloseConfirm(false);
  };

  // ── レンダリング ──────────────────────────────────

  if (!dataLoaded) {
    return (
      <main style={{ minHeight: "100vh", background: BG, color: "#fff", padding: "44px 20px" }}>
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <BrandHeader />
        </div>
      </main>
    );
  }

  if (!sessionData) {
    return (
      <main style={{ minHeight: "100vh", background: BG, color: "#fff", padding: "44px 20px" }}>
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <BrandHeader />
          <p style={{ fontSize: 14, color: "#7a90a8", lineHeight: 1.8, marginBottom: 24 }}>
            セッションデータが見つかりません。
          </p>
          <Link href="/employee" style={{ fontSize: 13, color: "#4e6480", textDecoration: "none", fontWeight: 600 }}>
            ← 最初から整理する
          </Link>
        </div>
      </main>
    );
  }

  const stateLabel = STATE_LABELS[sessionData.selectedState] ?? sessionData.selectedState;
  const eventExcerpt =
    sessionData.eventText.length > 55
      ? sessionData.eventText.substring(0, 55) + "…"
      : sessionData.eventText;

  const isSubmittable = userInput.trim().length > 0 && !isLoading && sessionStatus === "active";

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

        {/* 戻るリンク */}
        <Link
          href={`/employee/session/new?state=${sessionData.selectedState}`}
          style={{ display: "inline-block", fontSize: 12, color: "#4e6480", textDecoration: "none", marginBottom: 28, letterSpacing: "0.02em" }}
        >
          ← 入力に戻る
        </Link>

        <StepDivider label="Step 03" />

        {/* セッションコンテキスト — 小さく控えめに */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            marginBottom: 36,
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <span
            style={{
              flexShrink: 0,
              fontSize: 10,
              color: "#4e6a86",
              letterSpacing: "0.04em",
              marginTop: 2,
            }}
          >
            {stateLabel}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "#3a5470",
              lineHeight: 1.6,
              wordBreak: "break-all",
            }}
          >
            {eventExcerpt}
          </span>
        </div>

        {/* ── メッセージ履歴 ── */}
        <div style={{ marginBottom: 32 }}>
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
          {isLoading && <LoadingDots />}
          <div ref={messagesEndRef} />
        </div>

        {/* ── 完了 ── */}
        {sessionStatus === "completed" && (
          <CompletedView
            nextAction={nextActionCandidate}
            onNavigate={() => router.push("/employee/session/action")}
          />
        )}

        {/* ── 途中終了 ── */}
        {sessionStatus === "closed_without_action" && <ClosedView />}

        {/* ── アクティブ: 入力エリア ── */}
        {sessionStatus === "active" && (
          <>
            {showCloseConfirm ? (
              <CloseConfirmView onConfirm={handleCloseConfirm} />
            ) : (
              <div>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="思ったまま書いてください"
                  rows={4}
                  className="placeholder:text-[#3a5570]"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "16px 18px",
                    borderRadius: 13,
                    border: inputFocused
                      ? "1px solid rgba(16,185,129,0.38)"
                      : "1px solid rgba(255,255,255,0.09)",
                    background: "rgba(255,255,255,0.025)",
                    color: "#d1dde8",
                    fontSize: 14,
                    lineHeight: 1.8,
                    resize: "vertical",
                    outline: "none",
                    transition: "border-color 0.15s ease",
                    fontFamily: "inherit",
                  }}
                />

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isSubmittable}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: 13,
                    fontSize: 14,
                    fontWeight: 700,
                    border: isSubmittable ? "none" : "1px solid rgba(255,255,255,0.09)",
                    cursor: isSubmittable ? "pointer" : "not-allowed",
                    background: isSubmittable ? "rgba(16,185,129,0.82)" : "transparent",
                    color: isSubmittable ? "#fff" : "#3a5470",
                    transition: "background 0.22s ease, color 0.22s ease",
                    letterSpacing: "0.02em",
                    marginTop: 12,
                  }}
                >
                  {isSubmittable ? "続ける →" : "思ったまま書いてください"}
                </button>

                {/* 途中終了オプション */}
                <div style={{ textAlign: "center", marginTop: 20 }}>
                  <button
                    type="button"
                    onClick={() => setShowCloseConfirm(true)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 11,
                      color: "#2e4a66",
                      letterSpacing: "0.04em",
                      padding: "4px 8px",
                    }}
                  >
                    今日はここで区切る
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* フッター */}
        {sessionStatus === "active" && (
          <p style={{ marginTop: 40, textAlign: "center", fontSize: 11, color: "#1e3a52", lineHeight: 1.8 }}>
            Cmd + Enter で送信
          </p>
        )}

      </div>
    </main>
  );
}
