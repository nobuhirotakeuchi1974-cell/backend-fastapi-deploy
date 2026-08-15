"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  type EmotionalIntensity,
  type Message,
  type Phase,
  type SessionStatus,
} from "./mockEngine";
import {
  type HcosDialogueState,
  type HcosActiveSession,
  type HcosAiResponse,
  type DialogueMessage,
  DEFAULT_DIALOGUE_STATE,
  STORAGE_KEY_DRAFT,
  STORAGE_KEY_ACTIVE,
  STORAGE_KEY_NEXT_ACTION,
  callHcosAiDialogue,
} from "./hcosAiClient";

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
  "radial-gradient(ellipse 80% 55% at 50% 18%, rgba(25,201,154,0.10) 0%, transparent 68%), #10263D";

// ── サブコンポーネント ────────────────────────────

function BrandHeader() {
  return (
    <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "#829AAF", textTransform: "uppercase" }}>
        Human Capital OS
      </span>
      <span style={{ width: 1, height: 12, background: "rgba(180,210,230,0.25)", flexShrink: 0 }} />
      <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.16em", color: "#829AAF", textTransform: "uppercase" }}>
        Self-Decision System
      </span>
    </header>
  );
}

function StepDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "#829AAF", textTransform: "uppercase", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(180,210,230,0.18)" }} />
    </div>
  );
}

function MessageItem({ message }: { message: Message }) {
  const isAI = message.role === "ai";
  return (
    <div
      style={{
        marginBottom: isAI ? 28 : 20,
        paddingLeft: isAI ? 0 : 14,
        paddingTop: isAI ? 0 : 10,
        paddingBottom: isAI ? 0 : 10,
        borderLeft: isAI ? "none" : "2px solid rgba(25,201,154,0.35)",
        background: isAI ? "transparent" : "rgba(25,201,154,0.05)",
        borderRadius: isAI ? 0 : "0 8px 8px 0",
      }}
    >
      {message.content.split("\n").map((line, i) => (
        <p
          key={i}
          style={{
            fontSize: isAI ? 14 : 13,
            color: isAI ? "#B6C7D6" : "#829AAF",
            lineHeight: isAI ? 2.0 : 1.8,
            margin: isAI ? `0 0 ${line ? "2px" : "10px"} 0` : "0",
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
      <p style={{ fontSize: 18, color: "#829AAF", letterSpacing: "0.2em", lineHeight: 1 }}>···</p>
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
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#19C99A", textTransform: "uppercase", marginBottom: 16 }}>
        次の一歩
      </p>
      <p
        style={{
          fontSize: 15,
          color: "#F3F7FA",
          fontWeight: 600,
          lineHeight: 1.8,
          padding: "18px 20px",
          borderRadius: 14,
          border: "1px solid rgba(25,201,154,0.40)",
          background: "#183149",
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
          background: "#19C99A",
          color: "#0d1f35",
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
      <p style={{ fontSize: 14, color: "#829AAF", lineHeight: 1.9, marginBottom: 32 }}>
        今日はここで区切りました。
        <br />
        また思い出したときに続けましょう。
      </p>
      <Link
        href="/employee"
        style={{
          fontSize: 13,
          color: "#829AAF",
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
        border: "1px solid rgba(180,210,230,0.18)",
        background: "#183149",
      }}
    >
      <p style={{ fontSize: 14, color: "#B6C7D6", marginBottom: 20, lineHeight: 1.7 }}>
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
            border: "1px solid rgba(180,210,230,0.18)",
            background: "#1D3953",
            color: "#829AAF",
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
            background: "#19C99A",
            color: "#0d1f35",
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

  // 会話状態 — 仕様書 §32 (turnInPhase は本番 AI 制御では使用しない)
  const [messages, setMessages] = useState<Message[]>([]);
  const [phase, setPhase] = useState<Phase>("RECEIVE");
  const [dialogueState, setDialogueState] = useState<HcosDialogueState>(DEFAULT_DIALOGUE_STATE);
  const [sessionId] = useState(() => crypto.randomUUID());

  // UI状態
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // React Strict Mode による二重実行を防ぐ
  const initialCallFiredRef = useRef(false);

  // ── 初期化: sessionStorage から読み込み ─────────
  useEffect(() => {
    try {
      // まず hcos_active_session を確認（リロード復元）
      const rawActive = sessionStorage.getItem(STORAGE_KEY_ACTIVE);
      if (rawActive) {
        const active = JSON.parse(rawActive) as HcosActiveSession;
        setSessionData({
          selectedState: active.selectedState,
          eventText: active.initialEventText,
        });
        setPhase(active.phase);
        setDialogueState(active.state);
        // API メッセージ形式 → UI メッセージ形式に変換
        const uiMessages: Message[] = active.messages.map((m, i) => ({
          id: String(i),
          role: m.role === "assistant" ? "ai" : "user",
          content: m.content,
        }));
        setMessages(uiMessages);
        setDataLoaded(true);
        return;
      }

      // 初回: hcos_session_draft を読み込む
      const rawDraft = sessionStorage.getItem(STORAGE_KEY_DRAFT);
      if (!rawDraft) {
        setDataLoaded(true);
        return;
      }
      const draft = JSON.parse(rawDraft) as { state?: string; eventText?: string };
      const state = draft.state ?? "";
      const eventText = draft.eventText ?? "";
      setSessionData({ selectedState: state, eventText });

      // 感情強度の初期値を selectedState から推定（会話が進めば AI が更新）
      const intensity: EmotionalIntensity = ["irritated", "down", "anxious"].includes(state)
        ? "high"
        : ["uncertain", "tired"].includes(state)
        ? "medium"
        : "low";
      setDialogueState({ ...DEFAULT_DIALOGUE_STATE, emotionalIntensity: intensity });
    } catch {
      // JSON parse 失敗はそのまま続行
    }
    setDataLoaded(true);
  }, []);

  // ── 最新メッセージへ自動スクロール ──────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ── AIレスポンスを内部状態へ反映（初回・通常ターン共通）──────────
  const applyAiResponse = useCallback(
    (res: HcosAiResponse, prevState: HcosDialogueState) => {
      setPhase(res.phase);
      setDialogueState({
        facts: [
          ...prevState.facts,
          ...res.newInformation.facts.filter((f) => !prevState.facts.includes(f)),
        ],
        interpretations: [
          ...prevState.interpretations,
          ...res.newInformation.interpretations.filter((i) => !prevState.interpretations.includes(i)),
        ],
        emotions: [
          ...prevState.emotions,
          ...res.newInformation.emotions.filter((e) => !prevState.emotions.includes(e)),
        ],
        selfJudgments: [
          ...prevState.selfJudgments,
          ...res.newInformation.selfJudgments.filter((s) => !prevState.selfJudgments.includes(s)),
        ],
        focus: res.focus,
        controllable: res.controllable,
        options: res.options,
        nextAction: res.nextAction,
        emotionalIntensity: res.emotionalIntensity,
        sessionStatus: res.sessionStatus,
      });
    },
    []
  );

  // ── 初回AI呼び出し: draft読み込み完了 & messages空のときAIから会話開始 ──
  useEffect(() => {
    if (!dataLoaded || !sessionData || messages.length > 0) return;
    if (initialCallFiredRef.current) return;
    initialCallFiredRef.current = true;

    setError(null);
    setIsLoading(true);
    callHcosAiDialogue({
      sessionId,
      selectedState: sessionData.selectedState,
      initialEventText: sessionData.eventText,
      phase,
      messages: [],
      state: dialogueState,
    })
      .then((res) => {
        setMessages([{ id: crypto.randomUUID(), role: "ai", content: res.message }]);
        applyAiResponse(res, dialogueState);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "うまく接続できませんでした。もう一度試してください。"
        );
      })
      .finally(() => setIsLoading(false));
  // dataLoaded・sessionData が揃った瞬間に一度だけ実行。ref ガードで再実行を防ぐ
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded, sessionData]);

  // ── hcos_active_session を常に最新に保つ ────────
  useEffect(() => {
    if (!sessionData || messages.length === 0) return;
    const apiMessages: DialogueMessage[] = messages.map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content,
    }));
    const active: HcosActiveSession = {
      sessionId,
      selectedState: sessionData.selectedState,
      initialEventText: sessionData.eventText,
      phase,
      messages: apiMessages,
      state: dialogueState,
    };
    try {
      sessionStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(active));
    } catch {
      // storage quota などは無視
    }
  }, [messages, phase, dialogueState, sessionData, sessionId]);

  // ── 完了時: hcos_next_action に保存 ─────────────
  useEffect(() => {
    if (
      dialogueState.sessionStatus === "completed" &&
      dialogueState.nextAction.confirmed &&
      dialogueState.nextAction.candidate
    ) {
      try {
        sessionStorage.setItem(
          STORAGE_KEY_NEXT_ACTION,
          JSON.stringify({
            action: dialogueState.nextAction.candidate,
            createdAt: new Date().toISOString(),
          })
        );
      } catch {
        // storage quota などは無視
      }
    }
  }, [dialogueState]);

  // ── 送信 ─────────────────────────────────────────
  const handleSubmit = async () => {
    const trimmed = userInput.trim();
    if (!trimmed || isLoading || dialogueState.sessionStatus !== "active") return;

    setError(null);

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setUserInput("");
    setIsLoading(true);

    try {
      // UI messages → API messages 形式に変換
      const apiMessages: DialogueMessage[] = nextMessages.map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));

      const res = await callHcosAiDialogue({
        sessionId,
        selectedState: sessionData?.selectedState ?? "",
        initialEventText: sessionData?.eventText ?? "",
        phase,
        messages: apiMessages,
        state: dialogueState,
      });

      const aiMsg: Message = { id: crypto.randomUUID(), role: "ai", content: res.message };
      setMessages((prev) => [...prev, aiMsg]);

      // フェーズ・内部状態を更新
      applyAiResponse(res, dialogueState);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "うまく接続できませんでした。もう一度試してください。";
      setError(msg);
      // ユーザーメッセージはそのまま残し再送できる状態にする
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCloseConfirm = (yes: boolean) => {
    if (yes) {
      setDialogueState((prev) => ({ ...prev, sessionStatus: "closed_without_action" }));
    }
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
          <p style={{ fontSize: 14, color: "#829AAF", lineHeight: 1.8, marginBottom: 24 }}>
            セッションデータが見つかりません。
          </p>
          <Link href="/employee" style={{ fontSize: 13, color: "#829AAF", textDecoration: "none", fontWeight: 600 }}>
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

  const sessionStatus = dialogueState.sessionStatus;
  const nextActionCandidate = dialogueState.nextAction.candidate;
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
          style={{ display: "inline-block", fontSize: 12, color: "#829AAF", textDecoration: "none", marginBottom: 28, letterSpacing: "0.02em" }}
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
            border: "1px solid rgba(180,210,230,0.18)",
            background: "#183149",
          }}
        >
          <span
            style={{
              flexShrink: 0,
              fontSize: 10,
              color: "#B6C7D6",
              letterSpacing: "0.04em",
              marginTop: 2,
            }}
          >
            {stateLabel}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "#829AAF",
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
          {error && (
            <p style={{ fontSize: 13, color: "#f87171", marginBottom: 16, lineHeight: 1.7 }}>
              {error}
            </p>
          )}
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
                  className="placeholder:text-[#829AAF]"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "16px 18px",
                    borderRadius: 13,
                    border: inputFocused
                      ? "1px solid rgba(25,201,154,0.50)"
                      : "1px solid rgba(180,210,230,0.18)",
                    background: "#183149",
                    color: "#F3F7FA",
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
                    border: isSubmittable ? "none" : "1px solid rgba(180,210,230,0.18)",
                    cursor: isSubmittable ? "pointer" : "not-allowed",
                    background: isSubmittable ? "#19C99A" : "transparent",
                    color: isSubmittable ? "#0d1f35" : "#829AAF",
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
                      color: "#829AAF",
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
          <p style={{ marginTop: 40, textAlign: "center", fontSize: 11, color: "#829AAF", lineHeight: 1.8 }}>
            Cmd + Enter で送信
          </p>
        )}

      </div>
    </main>
  );
}
