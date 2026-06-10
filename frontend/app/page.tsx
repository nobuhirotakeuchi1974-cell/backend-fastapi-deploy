import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#071326] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[28px] border border-emerald-400/20 bg-gradient-to-r from-[#0b1b33] to-[#06402f] p-6 shadow-2xl shadow-emerald-500/10 sm:p-8">
          <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-300">
            ● Human Capital OS
          </p>

          <h1 className="text-[26px] font-black leading-tight tracking-tight sm:text-5xl">
            人的資本を、
            <br />
            経営の力に変える。
          </h1>

          <p className="mt-4 max-w-full break-words text-sm font-bold leading-7 text-slate-200 sm:text-base">
            現場の挑戦行動を上司評価を通じてROIへ変換し、
            経営判断と横展開につなげます。
          </p>
        </header>

        <section className="mt-5 rounded-[28px] border border-white/10 bg-[#0b1528] p-5 shadow-2xl">
          <h2 className="text-center text-xl font-black sm:text-2xl">
            Human Capital Flow
          </h2>

          <p className="mt-2 text-center text-sm text-slate-400">
            現場 → 上司 → 経営
          </p>

          <div className="mt-5 flex flex-col items-center gap-3 font-black text-emerald-300 sm:flex-row sm:justify-center">
            <span>✎ 現場の挑戦</span>

            <span className="hidden sm:block">→</span>
            <span className="sm:hidden">↓</span>

            <span>◎ 上司評価</span>

            <span className="hidden sm:block">→</span>
            <span className="sm:hidden">↓</span>

            <span>▥ 経営判断</span>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <MenuCard
            href="/employee"
            step="STEP 01"
            icon="✎"
            title="社員入力"
            subtitle="日々の挑戦を記録"
            buttonLabel="入力画面を開く"
          />

          <MenuCard
            href="/manager"
            step="STEP 02"
            icon="◎"
            title="上司評価"
            subtitle="行動を承認・評価"
            buttonLabel="評価画面を開く"
          />

          <MenuCard
            href="/dashboard"
            step="STEP 03"
            icon="▥"
            title="ダッシュボード"
            subtitle="経営判断に変換"
            buttonLabel="ダッシュボードを見る"
          />
        </section>
      </div>
    </main>
  );
}

function MenuCard({
  href,
  step,
  icon,
  title,
  subtitle,
  buttonLabel,
}: {
  href: string;
  step: string;
  icon: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[28px] border border-white/10 bg-gradient-to-b from-[#071427] to-[#020817] p-5 shadow-2xl transition hover:border-emerald-400/50 hover:shadow-emerald-500/20"
    >
      <div className="flex items-center justify-between">
        <p className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-300">
          {step}
        </p>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
          →
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-3xl text-emerald-300">
          {icon}
        </div>
      </div>

      <div className="mt-6 text-center">
        <h2 className="text-2xl font-black">
          {title}
        </h2>

        <p className="mt-3 text-base font-black text-emerald-300">
          {subtitle}
        </p>
      </div>

      <div className="mt-6 rounded-2xl bg-emerald-400 px-4 py-3 text-center font-black text-black">
        {buttonLabel}
      </div>
    </Link>
  );
}