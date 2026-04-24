import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { UniversityRow } from "../types";

type SortKey = "期" | "ryukyu";
type SortDir = "asc" | "desc";

type Props = {
  rows: UniversityRow[];
};

export function PeriodTable({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("期");
  const [dir, setDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      if (sortKey === "期") {
        const na = Number(a.期);
        const nb = Number(b.期);
        return dir === "asc" ? na - nb : nb - na;
      }
      const na = Number(a.琉球大学出身_県内_pct);
      const nb = Number(b.琉球大学出身_県内_pct);
      return dir === "asc" ? na - nb : nb - na;
    });
    return copy;
  }, [rows, sortKey, dir]);

  function toggle(key: SortKey) {
    if (sortKey === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setDir(key === "期" ? "asc" : "desc");
    }
  }

  const SortIcon = ({ active, d }: { active: boolean; d: SortDir }) => {
    if (!active) return <span className="inline-block w-4" />;
    return d === "asc" ? (
      <ArrowUp className="inline h-3.5 w-3.5 text-cyan-400" />
    ) : (
      <ArrowDown className="inline h-3.5 w-3.5 text-cyan-400" />
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/40 shadow-glass backdrop-blur-sm">
      <div className="border-b border-slate-700/60 px-5 py-4">
        <h2 className="text-lg font-semibold text-white">期別データ表</h2>
        <p className="mt-1 text-sm text-slate-400">琉球大学出身の人数・割合（クリックでソート）</p>
      </div>
      <div className="max-h-[360px] overflow-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="sticky top-0 bg-slate-900/95 backdrop-blur">
            <tr className="border-b border-slate-700/60 text-slate-400">
              <th className="px-5 py-3 font-medium">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-cyan-400"
                  onClick={() => toggle("期")}
                >
                  期
                  <SortIcon active={sortKey === "期"} d={dir} />
                </button>
              </th>
              <th className="px-3 py-3 font-medium">総数</th>
              <th className="px-3 py-3 font-medium">琉球大学</th>
              <th className="px-3 py-3 font-medium">その他</th>
              <th className="px-3 py-3 font-medium">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-cyan-400"
                  onClick={() => toggle("ryukyu")}
                >
                  琉球大学%
                  <SortIcon active={sortKey === "ryukyu"} d={dir} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr
                key={r.期}
                className="border-b border-slate-800/80 transition hover:bg-slate-800/40"
              >
                <td className="px-5 py-2.5 font-mono text-cyan-300/90">{r.期}期</td>
                <td className="px-3 py-2.5 text-slate-300">{r.総数}</td>
                <td className="px-3 py-2.5 text-slate-300">{r.琉球大学出身_県内_人数}</td>
                <td className="px-3 py-2.5 text-slate-300">{r.その他大学出身_県外_人数}</td>
                <td className="px-3 py-2.5 font-mono text-cyan-200/80">
                  {r.琉球大学出身_県内_pct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
