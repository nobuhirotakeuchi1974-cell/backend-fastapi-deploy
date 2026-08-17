"use client";

import { useState } from "react";

// HCOS Ver.2 デモ用 sessionStorage キー — 本番化時はこのファイルごと削除
const HCOS_DEMO_STORAGE_KEYS = [
  "hcos_session_draft",
  "hcos_active_session",
  "hcos_next_action",
  "hcos_manager_requests",
  "hcos_cycle_history",
  "hcos_cycle_context",
] as const;

export function DemoResetButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleReset = () => {
    if (typeof window === "undefined") return;
    for (const key of HCOS_DEMO_STORAGE_KEYS) {
      sessionStorage.removeItem(key);
    }
    setShowConfirm(false);
    setResetDone(true);
  };

  if (resetDone) {
    return (
      <p style={{ fontSize: 12, color: "#829AAF", letterSpacing: "0.02em" }}>
        デモデータをリセットしました
      </p>
    );
  }

  if (showConfirm) {
    return (
      <div
        style={{
          display: "inline-block",
          padding: "20px 24px",
          borderRadius: 12,
          border: "1px solid rgba(180,210,230,0.18)",
          background: "#183149",
          textAlign: "left",
          maxWidth: 400,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <p style={{ fontSize: 13, color: "#B6C7D6", marginBottom: 6, fontWeight: 600 }}>
          HCOS Ver.2 のデモデータを初期化しますか？
        </p>
        <p style={{ fontSize: 11, color: "#829AAF", marginBottom: 18, lineHeight: 1.7 }}>
          AIとの対話、次の一歩、上司・経営への共有データが削除されます。
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              flex: 1,
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid rgba(239,68,68,0.35)",
              background: "rgba(239,68,68,0.08)",
              color: "#fca5a5",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            リセットする
          </button>
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            style={{
              flex: 1,
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid rgba(180,210,230,0.18)",
              background: "#1D3953",
              color: "#829AAF",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      style={{
        background: "none",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 11,
        color: "#3a5470",
        padding: "6px 14px",
        letterSpacing: "0.04em",
      }}
    >
      デモデータをリセット
    </button>
  );
}
