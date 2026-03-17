import type { TradeDirection, TradeResults } from "@/lib/trade";
import { formatCurrency, formatNumber } from "@/lib/format";

type Props = {
  direction: TradeDirection;
  results: TradeResults | null;
  emptyHint?: string;
};

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "green" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "text-emerald-200"
      : tone === "red"
        ? "text-rose-200"
        : "text-zinc-100";

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
      <div className="text-xs font-medium text-zinc-400">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tracking-tight ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

export default function ResultsPanel({
  direction,
  results,
  emptyHint = "Enter values and click “Simulate Trade” to see results.",
}: Props) {
  const dir = results?.direction ?? direction;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-100">Results</div>
        <div className="rounded-full border border-white/10 bg-zinc-950/40 px-2.5 py-1 text-xs font-semibold text-zinc-200">
          {dir}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Risk"
          value={results ? formatCurrency(results.risk) : "—"}
          tone="red"
        />
        <StatCard
          label="Reward"
          value={results ? formatCurrency(results.reward) : "—"}
          tone="green"
        />
        <StatCard
          label="R/R Ratio"
          value={results ? formatNumber(results.riskRewardRatio) : "—"}
          tone="neutral"
        />
      </div>

      {!results ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-xs text-zinc-400">
          {emptyHint}
        </div>
      ) : null}
    </section>
  );
}

