/**
 * HCOS AI Dialogue — フロントエンド型定義 & API 呼び出しヘルパー
 * 仕様書 §21, §22, §24, §31, §32, §33, §38 に対応。
 *
 * - OpenAI API はバックエンド経由 (仕様書 §25)
 * - API KEY はフロントへ渡さない
 * - NEXT_PUBLIC_API_BASE_URL を使用 (仕様書 §38)
 */

// ── 型定義 ────────────────────────────────────────────────────────────────────

export type Phase =
  | "RECEIVE"
  | "UNTANGLE"
  | "FOCUS"
  | "BOUNDARY"
  | "EXPLORE"
  | "DECIDE";

export type Confidence = "low" | "medium" | "high";
export type EmotionalIntensity = "low" | "medium" | "high";
export type SessionStatus = "active" | "completed" | "closed_without_action";
export type MessageRole = "user" | "assistant";

export interface DialogueMessage {
  role: MessageRole;
  content: string;
}

export interface FocusState {
  hypothesis: string | null;
  confidence: Confidence;
  confirmed: boolean;
}

export interface NextActionState {
  candidate: string | null;
  confirmed: boolean;
}

export interface HcosDialogueState {
  facts: string[];
  interpretations: string[];
  emotions: string[];
  selfJudgments: string[];
  focus: FocusState;
  controllable: string[];
  options: string[];
  nextAction: NextActionState;
  emotionalIntensity: EmotionalIntensity;
  sessionStatus: SessionStatus;
}

export interface HcosAiRequest {
  sessionId: string;
  selectedState: string;
  initialEventText: string;
  phase: Phase;
  messages: DialogueMessage[];
  state: HcosDialogueState | null;
}

export interface NewInformation {
  facts: string[];
  interpretations: string[];
  emotions: string[];
  selfJudgments: string[];
}

export interface HcosAiResponse {
  message: string;
  phase: Phase;
  phaseComplete: boolean;
  needsQuestion: boolean;
  newInformation: NewInformation;
  focus: FocusState;
  controllable: string[];
  options: string[];
  nextAction: NextActionState;
  emotionalIntensity: EmotionalIntensity;
  sessionStatus: SessionStatus;
}

// ── sessionStorage キー ───────────────────────────────────────────────────────

export const STORAGE_KEY_DRAFT = "hcos_session_draft";
export const STORAGE_KEY_ACTIVE = "hcos_active_session";
export const STORAGE_KEY_NEXT_ACTION = "hcos_next_action";

// ── アクティブセッション構造 (仕様書 §33) ─────────────────────────────────────

export interface HcosActiveSession {
  sessionId: string;
  selectedState: string;
  initialEventText: string;
  phase: Phase;
  messages: DialogueMessage[];
  state: HcosDialogueState;
}

export const DEFAULT_DIALOGUE_STATE: HcosDialogueState = {
  facts: [],
  interpretations: [],
  emotions: [],
  selfJudgments: [],
  focus: { hypothesis: null, confidence: "low", confirmed: false },
  controllable: [],
  options: [],
  nextAction: { candidate: null, confirmed: false },
  emotionalIntensity: "medium",
  sessionStatus: "active",
};

// ── API 呼び出し ──────────────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function callHcosAiDialogue(
  req: HcosAiRequest
): Promise<HcosAiResponse> {
  const res = await fetch(`${API_BASE}/api/ai/dialogue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    let errMsg = "うまく接続できませんでした。もう一度試してください。";
    try {
      const body = await res.json();
      if (typeof body?.message === "string") errMsg = body.message;
    } catch {
      // JSON parse 失敗はそのまま汎用メッセージを使う
    }
    throw new Error(errMsg);
  }

  return res.json() as Promise<HcosAiResponse>;
}
