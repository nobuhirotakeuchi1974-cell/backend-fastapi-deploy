"use client";

import Link from "next/link";
import "./globals.css";

// const ROLE = "employee";
const ROLE = "manager";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isEmployee = ROLE === "employee";

  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          background: "#071326",
          color: "white",
          minHeight: "100vh",
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 999,
            borderBottom: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(8,17,32,0.92)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.28)",
          }}
        >
          <div
            style={{
              maxWidth: 1320,
              margin: "0 auto",
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flex: 1,
                minWidth: 0,
              }}
            >
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  textDecoration: "none",
                  color: "white",
                  flex: "0 0 auto",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(34,211,238,0.35)",
                    background:
                      "linear-gradient(135deg, rgba(34,211,238,0.24), rgba(16,185,129,0.12))",
                    boxShadow: "0 0 24px rgba(34,211,238,0.14)",
                  }}
                >
                  <div
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: 5,
                      background: "#67e8f9",
                      boxShadow: "0 0 14px rgba(34,211,238,0.95)",
                    }}
                  />
                </div>

                <div>
                  <div
                    style={{
                      color: "#ffffff",
                      fontWeight: 900,
                      fontSize: 17,
                      letterSpacing: 0.2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Human Capital OS
                  </div>

                  <div
                    className="logo-subtitle"
                    style={{
                      color: "rgba(165,243,252,0.85)",
                      fontSize: 11,
                      fontWeight: 800,
                      marginTop: 2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Human Capital Analytics Platform
                  </div>
                </div>
              </Link>

              <nav
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  overflowX: "auto",
                  overflowY: "hidden",
                  whiteSpace: "nowrap",
                  flexWrap: "nowrap",
                  paddingBottom: 4,
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {isEmployee ? (
  <NavItem href="/employee" label="社員入力" />
) : (
  <>
    <NavItem href="/" label="トップ" />
    <NavItem href="/manager" label="上司評価" />
    <NavItem href="/dashboard" label="ダッシュボード" />
  </>
)}
              </nav>
            </div>

            <div
              className="admin-area"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                style={{
                  position: "relative",
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#ffffff",
                  fontSize: 18,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  flex: "0 0 auto",
                }}
              >
                🔔

                <span
                  style={{
                    position: "absolute",
                    right: 9,
                    top: 9,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#34d399",
                    boxShadow: "0 0 10px rgba(16,185,129,0.9)",
                  }}
                />
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.05)",
                  padding: "7px 12px",
                  boxShadow: "0 4px 18px rgba(0,0,0,0.22)",
                  flex: "0 0 auto",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(34,211,238,0.35)",
                    background: "rgba(34,211,238,0.12)",
                    color: "#67e8f9",
                    fontWeight: 900,
                    fontSize: 13,
                    boxShadow: "0 0 16px rgba(34,211,238,0.16)",
                    flex: "0 0 auto",
                  }}
                >
                  HC
                </div>

                <div>
                  <div
                    style={{
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 900,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isEmployee ? "社員モード" : "管理モード"}
                  </div>

                  <div
                    style={{
                      color: "rgba(165,243,252,0.75)",
                      fontSize: 11,
                      fontWeight: 800,
                      marginTop: 2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isEmployee
                      ? "Human Capital Employee"
                      : "Human Capital Admin"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}

function NavItem({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        flex: "0 0 auto",
        whiteSpace: "nowrap",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 18px",
        borderRadius: 15,
        textDecoration: "none",
        color: "#ffffff",
        fontSize: 14,
        fontWeight: 900,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.05)",
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.02), 0 4px 14px rgba(0,0,0,0.25)",
        transition:
          "all 0.22s ease, transform 0.15s ease, box-shadow 0.22s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px) scale(1.03)";
        e.currentTarget.style.background =
          "linear-gradient(135deg, rgba(34,211,238,0.22), rgba(16,185,129,0.14))";
        e.currentTarget.style.border = "1px solid rgba(34,211,238,0.45)";
        e.currentTarget.style.boxShadow = "0 0 18px rgba(34,211,238,0.28)";
        e.currentTarget.style.color = "#67e8f9";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px) scale(1)";
        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.10)";
        e.currentTarget.style.boxShadow =
          "inset 0 0 0 1px rgba(255,255,255,0.02), 0 4px 14px rgba(0,0,0,0.25)";
        e.currentTarget.style.color = "#ffffff";
      }}
    >
      {label}
    </Link>
  );
}