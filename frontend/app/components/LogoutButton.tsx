"use client";

export default function LogoutButton() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-slate-200 shadow-lg transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-300 active:scale-95"
    >
      ログアウト
    </button>
  );
}