import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020817] text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-10">
        <div className="rounded-[36px] border border-emerald-400/25 bg-gradient-to-r from-[#03101f] via-[#06192d] to-[#063124] px-5 py-10 sm:p-10 shadow-2xl shadow-emerald-500/10">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="pt-2 lg:pt-4">
              <div className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-5 py-2 text-sm font-black text-emerald-300 shadow-lg shadow-emerald-500/10">
                ● Human Capital OS
              </div>

              <h1
className="mt-10 max-w-[700px] font-black"
  style={{
    fontSize: "clamp(28px, 8vw, 64px)",
    lineHeight: 1.08,
    letterSpacing: "-0.02em",
  }}
>
  人的資本を、
  <span
    className="block whitespace-nowrap text-emerald-400"
    style={{
      fontSize: "clamp(28px, 8vw, 64px)",
      lineHeight: 1.08,
      letterSpacing: "-0.02em",
    }}
  >
    経営の力に変える。
  </span>
</h1>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#06111f]/85 p-7 shadow-2xl backdrop-blur">
              <h2 className="text-l font-black">Human Capital Flow とは</h2>

              <p className="mt-4 leading-8 text-slate-300">
                社員の行動が、評価・分析を通じて、経営判断や人的資本戦略につながる一連の流れを指します。
              </p>

              <div className="mt-8 space-y-7">
                <div className="grid grid-cols-[64px_1fr_1.4fr] items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-2xl text-emerald-300 shadow-inner">
                    ✎
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-400">STEP 01</p>
                    <p className="mt-1 text-xl font-black">行動入力</p>
                  </div>

                  <p className="border-l border-emerald-400/40 pl-5 text-sm leading-7 text-slate-300">
                    日々の挑戦や改善を記録
                  </p>
                </div>

                <div className="grid grid-cols-[64px_1fr_1.4fr] items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-2xl text-emerald-300 shadow-inner">
                    ◎
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-400">STEP 02</p>
                    <p className="mt-1 text-xl font-black">上司承認</p>
                  </div>

                  <p className="border-l border-emerald-400/40 pl-5 text-sm leading-7 text-slate-300">
                    行動内容を確認・評価
                  </p>
                </div>

                <div className="grid grid-cols-[64px_1fr_1.4fr] items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-2xl text-emerald-300 shadow-inner">
                    ▥
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-400">STEP 03</p>
                    <p className="mt-1 text-xl font-black">KPI・ROI分析</p>
                  </div>

                  <p className="border-l border-emerald-400/40 pl-5 text-sm leading-7 text-slate-300">
                    人的資本の成果を可視化
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 shadow-lg shadow-emerald-500/10">
                <div>
                  <p className="text-xs font-bold text-emerald-300">
                    最終アウトプット
                  </p>
                  <p className="mt-1 text-l font-black">
                    経営判断・人的資本戦略
                  </p>
                </div>

                <div className="text-3xl text-emerald-300"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Link
            href="/employee"
            className="group rounded-[32px] border border-white/10 bg-gradient-to-b from-[#071427] to-[#020817] p-7 shadow-2xl transition duration-300 hover:-translate-y-2 hover:border-emerald-400/50 hover:shadow-emerald-500/20 active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-300">
                STEP 01
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl text-slate-200 transition group-hover:bg-emerald-400 group-hover:text-black">
                →
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-white/5 text-5xl text-emerald-300 shadow-inner">
                ✎
              </div>
            </div>

            <div className="mt-8 text-center">
              <h2 className="text-4xl font-black">社員入力</h2>
              <div className="mx-auto mt-5 h-px w-28 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
              <p className="mt-6 text-xl font-black text-emerald-300">
                日々の挑戦を記録
              </p>
            </div>

            <div className="mt-9 flex items-center justify-center gap-3 rounded-2xl bg-emerald-400 px-6 py-4 text-center font-black text-black shadow-lg shadow-emerald-500/20 transition group-hover:bg-emerald-300">
              入力画面を開く
              <span>→</span>
            </div>
          </Link>

          <Link
            href="/manager"
            className="group rounded-[32px] border border-white/10 bg-gradient-to-b from-[#071427] to-[#020817] p-7 shadow-2xl transition duration-300 hover:-translate-y-2 hover:border-emerald-400/50 hover:shadow-emerald-500/20 active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-300">
                STEP 02
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl text-slate-200 transition group-hover:bg-emerald-400 group-hover:text-black">
                →
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-white/5 text-5xl text-emerald-300 shadow-inner">
                ◎
              </div>
            </div>

            <div className="mt-8 text-center">
              <h2 className="text-4xl font-black">上司評価</h2>
              <div className="mx-auto mt-5 h-px w-28 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
              <p className="mt-6 text-xl font-black text-emerald-300">
                行動を承認・評価
              </p>
            </div>

            <div className="mt-9 flex items-center justify-center gap-3 rounded-2xl bg-emerald-400 px-6 py-4 text-center font-black text-black shadow-lg shadow-emerald-500/20 transition group-hover:bg-emerald-300">
              評価画面を開く
              <span>→</span>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="group rounded-[32px] border border-white/10 bg-gradient-to-b from-[#071427] to-[#020817] p-7 shadow-2xl transition duration-300 hover:-translate-y-2 hover:border-emerald-400/50 hover:shadow-emerald-500/20 active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-300">
                STEP 03
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl text-slate-200 transition group-hover:bg-emerald-400 group-hover:text-black">
                →
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-white/5 text-5xl text-emerald-300 shadow-inner">
                ▥
              </div>
            </div>

            <div className="mt-8 text-center">
              <h2 className="text-4xl font-black">ダッシュボード</h2>
              <div className="mx-auto mt-5 h-px w-28 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
              <p className="mt-6 text-xl font-black text-emerald-300">
                人的資本を分析
              </p>
            </div>

            <div className="mt-9 flex items-center justify-center gap-3 rounded-2xl bg-emerald-400 px-6 py-4 text-center font-black text-black shadow-lg shadow-emerald-500/20 transition group-hover:bg-emerald-300">
              ダッシュボードを見る
              <span>→</span>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}