import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { UniversityRow } from "../types";

function toNum(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

type Props = {
  rows: UniversityRow[];
};

export function UniversityTrendChart({ rows }: Props) {
  const data = rows.map((r) => ({
    期: `${r.期}期`,
    琉球大学: toNum(r.琉球大学出身_県内_pct),
    その他大学: toNum(r.その他大学出身_県外_pct),
  }));

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-5 shadow-glass backdrop-blur-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">出身大学の割合（期別）</h2>
        <p className="mt-1 text-sm text-slate-400">
          琉球大学＝県内、その他大学＝県外（出身大学列ベース）。
        </p>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
            <XAxis
              dataKey="期"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "#475569" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "#475569" }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(51, 65, 85, 0.8)",
                borderRadius: "12px",
              }}
              formatter={(v: number) => [`${v}%`, ""]}
            />
            <Legend
              formatter={(v) => <span className="text-slate-300 text-sm">{v}</span>}
            />
            <Area
              type="monotone"
              dataKey="琉球大学"
              stroke="#22d3ee"
              strokeWidth={2}
              fill="url(#g1)"
            />
            <Area
              type="monotone"
              dataKey="その他大学"
              stroke="#a78bfa"
              strokeWidth={2}
              fill="url(#g2)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
