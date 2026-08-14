"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideHeader =
    pathname === "/login" || pathname.startsWith("/employee");

  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          background: "#071326",
          color: "white",
          minHeight: "100vh",
          overflowX: "hidden",
        }}
      >
        {!hideHeader && (
          <header
            style={{
              position: "sticky",
              top: 0,
              zIndex: 999,
              borderBottom: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(8,17,32,0.95)",
              backdropFilter: "blur(18px)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.28)",
            }}
          >
            <div
              style={{
                maxWidth: 1320,
                margin: "0 auto",
                padding: "14px 18px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
              }}
            >
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  textDecoration: "none",
                  color: "#ffffff",
                  minWidth: 0,
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
                    flexShrink: 0,
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
              </Link>

              <nav
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <NavItem href="/employee" label="社員" isActive={pathname.startsWith("/employee")} />
                <NavItem href="/manager/support" label="上司支援" isActive={pathname === "/manager/support"} />
                <NavItem href="/management/support" label="経営支援" isActive={pathname === "/management/support"} />
              </nav>
            </div>
          </header>
        )}

        {children}
      </body>
    </html>
  );
}

function NavItem({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 18px",
        borderRadius: 16,
        textDecoration: "none",
        color: isActive ? "#6ee7b7" : "#ffffff",
        fontSize: 14,
        fontWeight: 900,
        border: isActive
          ? "1px solid rgba(16,185,129,0.45)"
          : "1px solid rgba(255,255,255,0.10)",
        background: isActive
          ? "rgba(16,185,129,0.12)"
          : "rgba(255,255,255,0.05)",
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.02), 0 4px 14px rgba(0,0,0,0.25)",
        transition:
          "all 0.22s ease, transform 0.15s ease, box-shadow 0.22s ease",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (isActive) return;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.background =
          "linear-gradient(135deg, rgba(34,211,238,0.22), rgba(16,185,129,0.14))";
        e.currentTarget.style.border = "1px solid rgba(34,211,238,0.45)";
        e.currentTarget.style.boxShadow =
          "0 0 18px rgba(34,211,238,0.28)";
        e.currentTarget.style.color = "#67e8f9";
      }}
      onMouseLeave={(e) => {
        if (isActive) return;
        e.currentTarget.style.transform = "translateY(0px)";
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