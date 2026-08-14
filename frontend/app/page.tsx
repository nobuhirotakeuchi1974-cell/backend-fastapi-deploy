import Link from "next/link";

const BG =
  "radial-gradient(ellipse 100% 50% at 50% 0%, rgba(16,185,129,0.09) 0%, transparent 60%), #0d1f35";

function LoopStep({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: "10px 18px",
        borderRadius: 10,
        border: "1px solid rgba(16,185,129,0.25)",
        background: "rgba(16,185,129,0.06)",
        color: "#a7f3d0",
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
}

function LoopArrow() {
  return (
    <span style={{ color: "#3a5470", fontSize: 14, fontWeight: 700 }}>→</span>
  );
}

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", background: BG, color: "#e2e8f0", overflowX: "hidden" }}>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "80px 24px 64px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#6ee7b7",
            textTransform: "uppercase",
            marginBottom: 28,
            padding: "5px 14px",
            border: "1px solid rgba(16,185,129,0.35)",
            borderRadius: 20,
            background: "rgba(16,185,129,0.08)",
          }}
        >
          Human Capital OS Ver.2
        </p>

        <h1
          style={{
            fontSize: "clamp(30px, 6vw, 50px)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            color: "#f1f5f9",
            marginBottom: 28,
          }}
        >
          次の一歩が見えれば、
          <br />
          人は動き出せる。
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "#94a3b8",
            lineHeight: 1.95,
            maxWidth: 520,
            margin: "0 auto 44px",
          }}
        >
          Human Capital OSは、答えを与えるシステムではありません。
          <br />
          自分で考え、自分で決め、動き、振り返る。
          <br />
          必要なときだけ、上司と経営が支援する。
          <br />
          <span style={{ color: "#6ee7b7", fontWeight: 600 }}>
            人が挑戦を続けられる仕組みをつくる。
          </span>
        </p>

        {/* Primary CTA */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Link
            href="/employee"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "16px 36px",
              borderRadius: 14,
              background: "rgba(16,185,129,0.82)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 800,
              textDecoration: "none",
              letterSpacing: "0.02em",
            }}
          >
            社員として始める →
          </Link>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
            <Link
              href="/manager/support"
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.13)",
                background: "rgba(255,255,255,0.04)",
                color: "#94a3b8",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              上司支援を見る
            </Link>
            <Link
              href="/management/support"
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.13)",
                background: "rgba(255,255,255,0.04)",
                color: "#94a3b8",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              経営支援を見る
            </Link>
          </div>
        </div>
      </section>

      {/* ── Human Capital Loop ───────────────────────────────────── */}
      <section style={{ maxWidth: 840, margin: "0 auto 64px", padding: "0 24px" }}>
        <p
          style={{
            textAlign: "center",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#4e6480",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          Human Capital Loop
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <LoopStep label="考える" />
          <LoopArrow />
          <LoopStep label="決める" />
          <LoopArrow />
          <LoopStep label="動く" />
          <LoopArrow />
          <LoopStep label="振り返る" />
          <LoopArrow />
          <LoopStep label="支援につながる" />
        </div>
      </section>

      {/* ── 3つの役割 ────────────────────────────────────────────── */}
      <section style={{ maxWidth: 840, margin: "0 auto 64px", padding: "0 24px" }}>
        <p
          style={{
            textAlign: "center",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#4e6480",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          3つの役割
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {[
            {
              role: "社員",
              desc: "自分の状態を整理し、\n自分で次の一歩を決める。",
              href: "/employee",
              linkLabel: "社員として始める →",
            },
            {
              role: "上司",
              desc: "本人が支援を求めたときだけ入り、\n前進を支える。",
              href: "/manager/support",
              linkLabel: "上司支援を見る →",
            },
            {
              role: "経営",
              desc: "現場から届いた行動や支援ニーズを受け取り、\n組織として動く。",
              href: "/management/support",
              linkLabel: "経営支援を見る →",
            },
          ].map(({ role, desc, href, linkLabel }) => (
            <div
              key={role}
              style={{
                padding: "24px 22px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.09)",
                background: "rgba(255,255,255,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.10em",
                  color: "#6ee7b7",
                  textTransform: "uppercase",
                }}
              >
                {role}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  lineHeight: 1.85,
                  whiteSpace: "pre-line",
                  flex: 1,
                }}
              >
                {desc}
              </p>
              <Link
                href={href}
                style={{ fontSize: 12, color: "#4e8da8", textDecoration: "none", fontWeight: 600 }}
              >
                {linkLabel}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── プライバシー思想 ─────────────────────────────────────── */}
      <section
        style={{ maxWidth: 600, margin: "0 auto 56px", padding: "0 24px", textAlign: "center" }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p style={{ fontSize: 12, color: "#607d97", lineHeight: 1.9 }}>
            内省は本人のもの。共有する情報は本人が選ぶ。
            <br />
            <span style={{ fontSize: 11, color: "#3a5470" }}>
              AIとの会話・感情・内省ログは、本人が共有を選ばない限り上司・経営には届きません。
            </span>
          </p>
        </div>
      </section>

      {/* ── フッターCTA ──────────────────────────────────────────── */}
      <section style={{ textAlign: "center", padding: "0 24px 80px" }}>
        <Link
          href="/employee"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "15px 32px",
            borderRadius: 13,
            border: "1px solid rgba(16,185,129,0.35)",
            background: "rgba(16,185,129,0.08)",
            color: "#6ee7b7",
            fontSize: 15,
            fontWeight: 700,
            textDecoration: "none",
            letterSpacing: "0.02em",
          }}
        >
          次の一歩を考える →
        </Link>
      </section>
    </main>
  );
}