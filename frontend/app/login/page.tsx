"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://tech0-gen-11-step3-2-py-62.azurewebsites.net";

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!res.ok) {
        throw new Error("ログインに失敗しました");
      }

      const data = await res.json();

      if (!data.access_token) {
        throw new Error("トークンを取得できませんでした");
      }

      localStorage.setItem("token", data.access_token);

      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      setError("ユーザー名またはパスワードが違います");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <section className="w-full max-w-md rounded-3xl border border-emerald-400/20 bg-slate-900/80 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm text-emerald-300 mb-2">
            Human Capital OS
          </p>

          <h1 className="text-3xl font-bold">
            ログイン
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            管理者・上司ユーザーとしてログインします。
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm mb-2 text-slate-300">
              ユーザー名
            </label>

            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-300">
              パスワード
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-emerald-400"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-xl bg-emerald-400 py-3 font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-300 disabled:opacity-60"
          >
            {loading ? "ログイン中..." : "ログインする"}
          </button>
        </div>
      </section>
    </main>
  );
}