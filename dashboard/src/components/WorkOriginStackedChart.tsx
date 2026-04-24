import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORY_COLORS, WORK_CATEGORY_KEYS, type TermSummaryRow } from "../types";

function toNum(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

type Props = {
  rows: TermSummaryRow[];
};

export function WorkOriginStackedChart({ rows }: Props) {
  const data = rows.map((r) => {
    const row: Record<string, string | number> = { 期: `${r.期}期` };
    for (const { key } of WORK_CATEGORY_KEYS) {
      row[key] = toNum(r[key as keyof TermSummaryRow] as string);
    }
    return row;
  });

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-5 shadow-glass backdrop-blur-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">出身×勤務地（期別）</h2>
        <p className="mt-1 text-sm text-slate-400">
          本籍地と勤務先（＋備考）から分類。積み上げ＝各期の人数内訳。
        </p>
      </div>
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
            <XAxis
              dataKey="期"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "#475569" }}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "#475569" }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(51, 65, 85, 0.8)",
                borderRadius: "12px",
                padding: "12px 14px",
              }}
              labelStyle={{ color: "#e2e8f0", fontWeight: 600, marginBottom: 8 }}
              formatter={(value: number, name: string) => {
                const found = WORK_CATEGORY_KEYS.find((x) => x.key === name);
                return [value, found?.label ?? name];
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 16 }}
              formatter={(value) => {
                const found = WORK_CATEGORY_KEYS.find((x) => x.key === value);
                return <span className="text-slate-300 text-xs">{found?.short ?? value}</span>;
              }}
            />
            {WORK_CATEGORY_KEYS.map(({ key }, i) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                radius={i === WORK_CATEGORY_KEYS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
