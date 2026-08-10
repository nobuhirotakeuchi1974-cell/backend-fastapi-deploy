// HCOS思考整理エンジン — mock実装
// AI API接続時はこのファイルの generateMockResponse を非同期関数に差し替える

export type Phase =
  | "RECEIVE"
  | "UNTANGLE"
  | "FOCUS"
  | "BOUNDARY"
  | "EXPLORE"
  | "DECIDE";

export type EmotionalIntensity = "low" | "medium" | "high";
export type SessionStatus = "active" | "completed" | "closed_without_action";
export type MessageRole = "ai" | "user";

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
};

// 内部で管理する思考整理の状態 — 将来的にはAIがこれを埋める
export type ThoughtElements = {
  facts: string[];
  interpretations: string[];
  emotions: string[];
  selfJudgments: string[];
};

export type SessionContext = {
  selectedState: string;
  phase: Phase;
  turnInPhase: number;
  emotionalIntensity: EmotionalIntensity;
  focusHypothesis: string | null;
  focusConfirmed: boolean;
  nextActionCandidate: string | null;
};

export type AIResponseResult = {
  content: string;
  nextPhase: Phase;
  phaseChanged: boolean;
  updates: {
    focusHypothesis?: string;
    focusConfirmed?: boolean;
    nextActionCandidate?: string;
    nextActionConfirmed?: boolean;
    sessionStatus?: SessionStatus;
  };
};

// ── ヘルパー ──────────────────────────────────────

function hasPositiveAgreement(text: string): boolean {
  const markers = [
    "はい", "そう", "そうです", "たしかに", "確かに", "します",
    "決め", "そこ", "それ", "わかり", "合っ", "そういう", "そうかも",
  ];
  return markers.some((m) => text.includes(m));
}

function isActionTooVague(action: string): boolean {
  const vagueWords = ["頑張", "改善", "直す", "やる", "考え", "気をつけ", "努力", "もっと"];
  return action.trim().length < 13 || vagueWords.some((v) => action.includes(v));
}

function getFocusHypothesis(selectedState: string): string {
  const map: Record<string, string> = {
    irritated: "自分の意図が伝わらなかったこと",
    down:      "自分のやり方が良くなかったかもしれないこと",
    anxious:   "先の見通しが立たないこと",
    uncertain: "どちらを選んでも後悔しそうなこと",
    decision:  "判断に必要な情報が揃っていないと感じていること",
    organize:  "何から手をつければいいかわからないこと",
    tired:     "余裕のなさの中で何かを決めなければいけないこと",
    positive:  "その出来事を自分の中でちゃんと受け取れているかどうか",
  };
  return map[selectedState] ?? "自分にできることが何かわからないこと";
}

// ── 初期メッセージ生成 ────────────────────────────
// 将来: AIが eventText を読んで動的に生成する

export function generateInitialMessage(
  selectedState: string,
  _emotionalIntensity: EmotionalIntensity
): string {
  const map: Record<string, string> = {
    irritated:
      "何かが引っかかって、すっきりしない状態なんですね。\n特に、どの場面が一番頭に残っていますか？",
    down:
      "うまくいかなかった感覚が残っているんですね。\n一番気になっているのは、どんな場面ですか？",
    anxious:
      "先のことが気になって、頭から離れないんですね。\n特に、どんなことが浮かんできますか？",
    uncertain:
      "どうするか決めきれない状態なんですね。\n何と何の間で揺れている感じですか？",
    decision:
      "考えを整理して決めたいんですね。\n何について決めようとしているか、もう少し聞かせてもらえますか？",
    organize:
      "頭の中にいくつかのことが混ざっている状態ですね。\n今、一番大きく占めているのは何ですか？",
    tired:
      "今日は余裕がない中で、それでも整理したいことがあるんですね。\n何が一番頭に残っていますか？",
    positive:
      "残しておきたい出来事があったんですね。\n何があったか、聞かせてもらえますか？",
  };
  return (
    map[selectedState] ??
    "今日あったことが頭に残っているんですね。\n特に、どのあたりが一番気になっていますか？"
  );
}

// ── 会話応答生成 ──────────────────────────────────
// 将来: async function + LLM API呼び出しに差し替える

export function generateMockResponse(
  userMessage: string,
  ctx: SessionContext
): AIResponseResult {
  const { phase, turnInPhase, selectedState, focusHypothesis, nextActionCandidate } = ctx;

  switch (phase) {
    // PHASE 1: 受け止める
    case "RECEIVE": {
      return {
        content: "そのとき、実際にどんなことがあったかをもう少し聞かせてもらえますか？",
        nextPhase: "UNTANGLE",
        phaseChanged: true,
        updates: {},
      };
    }

    // PHASE 2: ほどく
    case "UNTANGLE": {
      if (turnInPhase === 0) {
        return {
          content: "それを受けて、どう感じましたか？",
          nextPhase: "UNTANGLE",
          phaseChanged: false,
          updates: {},
        };
      }
      const hypothesis = focusHypothesis ?? getFocusHypothesis(selectedState);
      return {
        content: `ここまで聞くと、一番引っかかっているのは「${hypothesis}」のようにも見えます。\nどうですか？`,
        nextPhase: "FOCUS",
        phaseChanged: true,
        updates: { focusHypothesis: hypothesis },
      };
    }

    // PHASE 3: 本当の引っかかりを見つける
    case "FOCUS": {
      if (turnInPhase === 0) {
        if (hasPositiveAgreement(userMessage)) {
          return {
            content:
              "そこが中心にありそうですね。\n自分から確かめたり変えたりできそうなことは、何かありますか？",
            nextPhase: "BOUNDARY",
            phaseChanged: true,
            updates: { focusConfirmed: true },
          };
        }
        return {
          content:
            "そうじゃないとしたら、一番引っかかっているのはどのあたりですか？",
          nextPhase: "FOCUS",
          phaseChanged: false,
          updates: {},
        };
      }
      return {
        content:
          "なるほど。自分から確かめたり変えたりできそうなことは、何かありますか？",
        nextPhase: "BOUNDARY",
        phaseChanged: true,
        updates: { focusConfirmed: true },
      };
    }

    // PHASE 4: 自分で動かせる範囲を見つける
    case "BOUNDARY": {
      return {
        content:
          "何か一つ動かすとしたら、どんなことが考えられそうですか？",
        nextPhase: "EXPLORE",
        phaseChanged: true,
        updates: {},
      };
    }

    // PHASE 5: 選択肢を広げる
    case "EXPLORE": {
      return {
        content:
          "では、次にやる一歩を、あなたの言葉で一文にすると、どうなりますか？",
        nextPhase: "DECIDE",
        phaseChanged: true,
        updates: {},
      };
    }

    // PHASE 6: 本人が次の一歩を決める
    case "DECIDE": {
      if (turnInPhase === 0) {
        const action = userMessage.trim();
        if (isActionTooVague(action)) {
          return {
            content:
              "もう少し具体的にすると、最初に何をするところから始められそうですか？",
            nextPhase: "DECIDE",
            phaseChanged: false,
            updates: {},
          };
        }
        return {
          content: `「${action}」\n\nこれを次の一歩にしますか？`,
          nextPhase: "DECIDE",
          phaseChanged: false,
          updates: { nextActionCandidate: action },
        };
      }

      // 確認ターン
      if (nextActionCandidate && hasPositiveAgreement(userMessage)) {
        return {
          content: "決まりました。今日はここで区切りましょう。",
          nextPhase: "DECIDE",
          phaseChanged: false,
          updates: {
            nextActionConfirmed: true,
            sessionStatus: "completed",
          },
        };
      }

      // 修正提案
      const revised = userMessage.trim();
      if (revised.length > 10 && !isActionTooVague(revised)) {
        return {
          content: `「${revised}」\n\nこれを次の一歩にしますか？`,
          nextPhase: "DECIDE",
          phaseChanged: false,
          updates: { nextActionCandidate: revised },
        };
      }

      return {
        content: "次にやる一歩を、具体的に一文で教えてもらえますか？",
        nextPhase: "DECIDE",
        phaseChanged: false,
        updates: {},
      };
    }

    default:
      return {
        content: "続けましょう。",
        nextPhase: phase,
        phaseChanged: false,
        updates: {},
      };
  }
}
