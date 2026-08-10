"""
HCOS AI Dialogue — Pydantic スキーマ定義

仕様書 §21 HcosDialogueState, §22 HcosAiResponse, §24 HcosAiRequest に対応。
"""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field, conlist


# ── 列挙型エイリアス ──────────────────────────────────────────────────────────

Phase = Literal["RECEIVE", "UNTANGLE", "FOCUS", "BOUNDARY", "EXPLORE", "DECIDE"]
Confidence = Literal["low", "medium", "high"]
EmotionalIntensity = Literal["low", "medium", "high"]
SessionStatus = Literal["active", "completed", "closed_without_action"]
MessageRole = Literal["user", "assistant"]


# ── リクエスト ────────────────────────────────────────────────────────────────

class DialogueMessage(BaseModel):
    role: MessageRole
    content: str = Field(..., min_length=1, max_length=4000)


class HcosAiRequest(BaseModel):
    """POST /api/ai/dialogue リクエスト — 仕様書 §24"""

    sessionId: str = Field(..., min_length=1, max_length=128)
    selectedState: str = Field(..., min_length=1, max_length=64)
    initialEventText: str = Field(..., min_length=1, max_length=2000)
    phase: Phase
    messages: List[DialogueMessage] = Field(default_factory=list)
    state: Optional[HcosDialogueState] = None


# ── 内部状態 ──────────────────────────────────────────────────────────────────

class FocusState(BaseModel):
    hypothesis: Optional[str] = None
    confidence: Confidence = "low"
    confirmed: bool = False


class NextActionState(BaseModel):
    candidate: Optional[str] = None
    confirmed: bool = False


class HcosDialogueState(BaseModel):
    """仕様書 §21 HcosDialogueState"""

    facts: List[str] = Field(default_factory=list)
    interpretations: List[str] = Field(default_factory=list)
    emotions: List[str] = Field(default_factory=list)
    selfJudgments: List[str] = Field(default_factory=list)
    focus: FocusState = Field(default_factory=FocusState)
    controllable: List[str] = Field(default_factory=list)
    options: List[str] = Field(default_factory=list, max_length=3)
    nextAction: NextActionState = Field(default_factory=NextActionState)
    emotionalIntensity: EmotionalIntensity = "medium"
    sessionStatus: SessionStatus = "active"


# 前方参照解決
HcosAiRequest.model_rebuild()


# ── OpenAI Structured Output モデル ───────────────────────────────────────────
# このモデルが JSON Schema に変換され OpenAI API へ送られる

class NewInformation(BaseModel):
    facts: List[str] = Field(default_factory=list)
    interpretations: List[str] = Field(default_factory=list)
    emotions: List[str] = Field(default_factory=list)
    selfJudgments: List[str] = Field(default_factory=list)


class HcosAiRawOutput(BaseModel):
    """OpenAI Structured Outputs で受け取る生出力 — 仕様書 §30"""

    message: str
    phase: Phase
    phaseComplete: bool
    needsQuestion: bool
    newInformation: NewInformation
    focus: FocusState
    controllable: List[str] = Field(default_factory=list)
    options: List[str] = Field(default_factory=list)
    nextAction: NextActionState
    emotionalIntensity: EmotionalIntensity
    sessionStatus: SessionStatus


# ── レスポンス ────────────────────────────────────────────────────────────────

class HcosAiResponse(BaseModel):
    """POST /api/ai/dialogue レスポンス — 仕様書 §22"""

    message: str
    phase: Phase
    phaseComplete: bool
    needsQuestion: bool
    newInformation: NewInformation
    focus: FocusState
    controllable: List[str]
    options: List[str]
    nextAction: NextActionState
    emotionalIntensity: EmotionalIntensity
    sessionStatus: SessionStatus
