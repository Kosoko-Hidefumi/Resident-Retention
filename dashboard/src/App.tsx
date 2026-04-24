import { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { KpiCards } from "./components/KpiCards";
import { PeriodTable } from "./components/PeriodTable";
import { UniversityTrendChart } from "./components/UniversityTrendChart";
import { WorkOriginStackedChart } from "./components/WorkOriginStackedChart";
import { loadTermSummary, loadUniversityPct } from "./lib/loadData";
import type { TermSummaryRow, UniversityRow } from "./types";

export default function App() {
  const [termRows, setTermRows] = useState<TermSummaryRow[] | null>(null);
  const [uniRows, setUniRows] = useState<UniversityRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [t, u] = await Promise.all([loadTermSummary(), loadUniversityPct()]);
      setTermRows(t);
      setUniRows(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const totalMembers =
    termRows?.reduce((s, r) => s + (Number(r.総数) || 0), 0) ?? 0;
  const periodCount = termRows?.length ?? 0;
  const avgRyukyuPct =
    uniRows && uniRows.length > 0
      ? uniRows.reduce((s, r) => s + (Number(r.琉球大学出身_県内_pct) || 0), 0) /
        uniRows.length
      : 0;

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
            <Activity className="h-3.5 w-3.5" />
            Resident Retention · 分析ビュー
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            同窓会メンバー
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              {" "}
              ダッシュボード
            </span>
          </h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            配信データは <strong className="text-slate-300">期別の集計（人数・割合）のみ</strong>です。
            元CSVを再集計したら{" "}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-cyan-300/90">
              python analyze_alumni_terms.py
            </code>{" "}
            のあと{" "}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-cyan-300/90">
              npm run dev
            </code>{" "}
            で再同期してください。
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-cyan-500/40 hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          再読み込み
        </button>
      </header>

      {error && (
        <div className="mb-8 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading && !termRows && (
        <div className="flex h-48 items-center justify-center text-slate-500">
          読み込み中…
        </div>
      )}

      {termRows && uniRows && (
        <>
          <section className="mb-10">
            <KpiCards
              totalMembers={totalMembers}
              periodCount={periodCount}
              avgRyukyuPct={avgRyukyuPct}
            />
          </section>

          <section className="mb-10 grid gap-8 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <WorkOriginStackedChart rows={termRows} />
            </div>
            <UniversityTrendChart rows={uniRows} />
            <PeriodTable rows={uniRows} />
          </section>

          <footer className="border-t border-slate-800/80 pt-8 text-center text-xs text-slate-500">
            分析ロジックは Python の{" "}
            <code className="font-mono text-slate-400">analyze_alumni_terms.py</code>{" "}
            に準拠しています。
          </footer>
        </>
      )}
    </div>
  );
}
