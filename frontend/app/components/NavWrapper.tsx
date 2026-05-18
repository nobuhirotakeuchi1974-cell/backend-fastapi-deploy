"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/employee");

  return (
    <div className="app-shell">
      {!hideNav && (
        <nav className="app-nav">
          <strong className="nav-logo">Human Capital OS</strong>
          <Link href="/">トップ</Link>
          <Link href="/employee">社員入力</Link>
          <Link href="/manager">上司評価</Link>
          <Link href="/dashboard">ダッシュボード</Link>
        </nav>
      )}
      {children}
    </div>
  );
}