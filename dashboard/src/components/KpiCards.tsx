import { GraduationCap, Users, Layers } from "lucide-react";

type Props = {
  totalMembers: number;
  periodCount: number;
  avgRyukyuPct: number;
};

export function KpiCards({ totalMembers, periodCount, avgRyukyuPct }: Props) {
  const items = [
    {
      icon: Users,
      label: "集計対象メンバー",
      value: totalMembers.toLocaleString("ja-JP"),
      sub: "38〜60期（重複なし）",
    },
    {
      icon: Layers,
      label: "期数",
      value: `${periodCount}`,
      sub: "期別サマリー",
    },
    {
      icon: GraduationCap,
      label: "琉球大学出身 平均割合",
      value: `${avgRyukyuPct.toFixed(1)}%`,
      sub: "出身大学ベース（全期平均）",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map(({ icon: Icon, label, value, sub }) => (
        <div
          key={label}
          className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5 shadow-glass backdrop-blur-sm transition hover:border-cyan-500/30"
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl transition group-hover:bg-cyan-500/20" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-400">{label}</p>
              <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-white">
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{sub}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
