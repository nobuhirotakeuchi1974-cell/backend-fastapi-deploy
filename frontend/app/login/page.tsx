"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tech0-gen-11-step3-2-py-62.azurewebsites.net";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      if (!res.ok) {
        setError(`ログインに失敗しました: ${res.status}`);
        return;
      }

      const data = await res.json();

      if (!data.access_token) {
        setError("トークンを取得できませんでした");
        return;
      }

      localStorage.setItem("token", data.access_token);
      setMessage("ログイン成功。トップページへ移動します。");

setTimeout(() => {
  router.push("/");
}, 300);
    } catch (err) {
      console.error(err);
      setError("APIに接続できません。Backend URL または CORS を確認してください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071326] px-5 py-10 text-white">
      <section
        className="w-full rounded-[28px] border border-emerald-400/20 bg-[#0b1528] p-7 shadow-2xl shadow-emerald-500/10"
        style={{ maxWidth: 520 }}
     >
        <div className="mb-8">
          <p className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-black tracking-wider text-emerald-300">
            HUMAN CAPITAL OS
          </p>

          <h1 className="text-3xl font-black text-white">ログイン</h1>

          <p className="mt-3 text-sm font-bold leading-7 text-slate-400">
            管理者・上司ユーザーとしてログインします。
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              ユーザー名
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full rounded-2xl border border-white/10 bg-[#071326] px-4 py-3 font-bold text-white outline-none focus:border-emerald-400/60"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              パスワード
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-2xl border border-white/10 bg-[#071326] px-4 py-3 font-bold text-white outline-none focus:border-emerald-400/60"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-400/40 bg-red-950/40 px-4 py-3 text-sm font-bold text-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-200">
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-4 font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "ログイン中..." : "ログインする"}
          </button>

          
        </div>
      </section>
    </main>
  );
}