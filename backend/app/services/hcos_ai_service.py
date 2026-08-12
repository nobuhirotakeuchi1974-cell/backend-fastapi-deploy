"""
HCOS AI Service — OpenAI 呼び出し + HCOS ルール検証

仕様書 §25 AI呼び出し構造、§28 Pydantic validation、§29 HCOS rule validation に対応。
"""

from __future__ import annotations

import logging
import os
from typing import List

from openai import AsyncOpenAI, APIError, APITimeoutError

from app.prompts.hcos_system_prompt import HCOS_SYSTEM_PROMPT
from app.schemas.ai_dialogue import (
    DialogueMessage,
    FocusState,
    HcosAiRawOutput,
    HcosAiResponse,
    HcosAiRequest,
    HcosDialogueState,
    NewInformation,
    NextActionState,
    Phase,
)

logger = logging.getLogger("human-capital-os")

# フェーズ遷移の許可マップ — 仕様書 §29-C
# EXPLORE/DECIDE → FOCUS 後退を許可（focus仮説否定時の回帰用）
_ALLOWED_NEXT_PHASES: dict[Phase, set[Phase]] = {
    "RECEIVE":   {"RECEIVE", "UNTANGLE"},
    "UNTANGLE":  {"UNTANGLE", "FOCUS", "RECEIVE"},
    "FOCUS":     {"FOCUS", "UNTANGLE", "BOUNDARY"},
    "BOUNDARY":  {"BOUNDARY", "FOCUS", "EXPLORE"},
    "EXPLORE":   {"EXPLORE", "BOUNDARY", "DECIDE", "FOCUS"},
    "DECIDE":    {"DECIDE", "EXPLORE", "FOCUS"},
}

# message 文字数上限 — 仕様書 §29-E
_MAX_MESSAGE_LEN = 600


def _get_openai_client() -> AsyncOpenAI:
    """OPENAI_API_KEY を backend/.env から取得してクライアントを生成する。"""
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise ValueError("OPENAI_API_KEY が設定されていません")
    return AsyncOpenAI(api_key=api_key)


def _build_user_context_block(req: HcosAiRequest) -> str:
    """初回コンテキスト情報をシステムプロンプトへ追記するブロックを生成する。"""
    state_labels: dict[str, str] = {
        "irritated": "イライラしている",
        "down": "落ち込んでいる",
        "anxious": "不安がある",
        "uncertain": "迷っている",
        "decision": "判断したい",
        "organize": "頭の中を整理したい",
        "tired": "疲れている",
        "positive": "嬉しいことがあった",
    }
    state_label = state_labels.get(req.selectedState, req.selectedState)

    lines = [
        "",
        "--- SESSION CONTEXT ---",
        f"Employee current state: {state_label} ({req.selectedState})",
        f"Initial event text: {req.initialEventText}",
        f"Current phase: {req.phase}",
    ]

    if req.state:
        s = req.state
        if s.focus.hypothesis:
            lines.append(f"Focus hypothesis so far: {s.focus.hypothesis} (confidence={s.focus.confidence}, confirmed={s.focus.confirmed})")
        if s.nextAction.candidate:
            lines.append(f"Next action candidate so far: {s.nextAction.candidate} (confirmed={s.nextAction.confirmed})")
        if s.emotionalIntensity:
            lines.append(f"Emotional intensity estimate: {s.emotionalIntensity}")

    lines.append("--- END SESSION CONTEXT ---")
    return "\n".join(lines)


def _validate_hcos_rules(
    raw: HcosAiRawOutput,
    req: HcosAiRequest,
) -> HcosAiRawOutput:
    """
    HCOS ルール検証 — 仕様書 §29
    AI 生出力を信用せず、仕様違反を修正する。
    """

    # A. candidate初生成・変更ターンでは confirmed=true を禁止（前ターンと同一candidateの次ターン以降のみ許可）
    prev_state = req.state
    prev_candidate = prev_state.nextAction.candidate if prev_state else None
    if raw.nextAction.confirmed and raw.nextAction.candidate != prev_candidate:
        logger.warning(
            "hcos_rule_violation: nextAction.confirmed=true on candidate generation/change turn — resetting"
        )
        raw.nextAction.confirmed = False

    # H. nextAction.confirmed=true には今回出力に candidate が必要
    if raw.nextAction.confirmed and not raw.nextAction.candidate:
        logger.warning("hcos_rule_violation: nextAction.confirmed=true with empty candidate — resetting confirmed")
        raw.nextAction.confirmed = False

    # B. sessionStatus=completed は focus.confirmed AND nextAction.confirmed の場合のみ
    if raw.sessionStatus == "completed":
        if not raw.focus.confirmed or not raw.nextAction.confirmed:
            logger.warning(
                "hcos_rule_violation: sessionStatus=completed without focus.confirmed and nextAction.confirmed — resetting to active"
            )
            raw.sessionStatus = "active"

    # F. BOUNDARY/EXPLORE/DECIDE は focus.confirmed=true が必要（Rule C より先に実行）
    if raw.phase in {"BOUNDARY", "EXPLORE", "DECIDE"} and not raw.focus.confirmed:
        logger.warning(
            "hcos_rule_violation: phase %s requires focus.confirmed=true — reverting to FOCUS",
            raw.phase,
        )
        raw.phase = "FOCUS"

    # C. 極端なフェーズ飛び級を防ぐ
    current_phase: Phase = req.phase
    proposed_phase: Phase = raw.phase
    allowed = _ALLOWED_NEXT_PHASES.get(current_phase, {proposed_phase})
    if proposed_phase not in allowed:
        logger.warning(
            "hcos_rule_violation: phase jump %s → %s not allowed — staying at %s",
            current_phase,
            proposed_phase,
            current_phase,
        )
        raw.phase = current_phase

    # G. DECIDE フェーズには nextAction.candidate が必要
    if raw.phase == "DECIDE" and not raw.nextAction.candidate:
        logger.warning(
            "hcos_rule_violation: DECIDE phase without nextAction.candidate — reverting to EXPLORE"
        )
        raw.phase = "EXPLORE"

    # D. options は最大 3 つ
    if len(raw.options) > 3:
        logger.warning("hcos_rule_violation: options count %d > 3 — truncating", len(raw.options))
        raw.options = raw.options[:3]

    # E. message が異常に長い場合はフォールバック
    if len(raw.message) > _MAX_MESSAGE_LEN:
        logger.warning(
            "hcos_rule_violation: message length %d > %d — using fallback",
            len(raw.message),
            _MAX_MESSAGE_LEN,
        )
        raw.message = "少し整理させてください。もう少し聞かせてもらえますか？"

    return raw


async def call_hcos_ai(req: HcosAiRequest) -> HcosAiResponse:
    """
    HCOS AI 対話エンドポイントのメインサービス関数。

    Next.js → FastAPI → (この関数) → OpenAI → Pydantic validation → HCOS rule validation → return
    """
    client = _get_openai_client()

    system_content = HCOS_SYSTEM_PROMPT + _build_user_context_block(req)

    # OpenAI messages 配列を組み立てる
    openai_messages: list[dict] = [{"role": "system", "content": system_content}]
    for m in req.messages:
        openai_messages.append({"role": m.role, "content": m.content})

    # Structured Outputs — HcosAiRawOutput を JSON Schema として渡す
    # openai>=1.50 の parse() を使用
    completion = await client.beta.chat.completions.parse(
        model="gpt-4o-2024-08-06",
        messages=openai_messages,  # type: ignore[arg-type]
        response_format=HcosAiRawOutput,
        temperature=0.4,
        max_tokens=800,
        timeout=30.0,
    )

    raw: HcosAiRawOutput | None = completion.choices[0].message.parsed
    if raw is None:
        raise ValueError("OpenAI Structured Output の parse 結果が None です")

    # HCOS ルール検証
    validated = _validate_hcos_rules(raw, req)

    return HcosAiResponse(
        message=validated.message,
        phase=validated.phase,
        phaseComplete=validated.phaseComplete,
        needsQuestion=validated.needsQuestion,
        newInformation=validated.newInformation,
        focus=validated.focus,
        controllable=validated.controllable,
        options=validated.options,
        nextAction=validated.nextAction,
        emotionalIntensity=validated.emotionalIntensity,
        sessionStatus=validated.sessionStatus,
    )
