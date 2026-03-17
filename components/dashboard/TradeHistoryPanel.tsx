"use client";

import type { TradeHistoryItem } from "@/lib/tradeHistory";
import { formatCurrency, formatNumber } from "@/lib/format";

type Props = {
  trades: TradeHistoryItem[];
  onClear: () => void;
};

export default function TradeHistoryPanel({ trades, onClear }: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-100">
            Trade History
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            Saved locally in this browser
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={trades.length === 0}
          className="h-9 rounded-xl border border-white/10 bg-zinc-950/40 px-3 text-xs font-semibold text-zinc-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear History
        </button>
      </div>

      {trades.length === 0 ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-xs text-zinc-400">
          No completed trades yet. Start playback, place a trade, and let it
          resolve.
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-12 gap-0 bg-zinc-950/40 px-4 py-2 text-[11px] font-semibold text-zinc-400">
            <div className="col-span-3">Time</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Strategy</div>
            <div className="col-span-2">Entry</div>
            <div className="col-span-2">Result</div>
            <div className="col-span-1 text-right">P/L</div>
          </div>
          <div className="divide-y divide-white/10">
            {trades.map((t) => {
              const plTone =
                t.profitLoss > 0
                  ? "text-emerald-200"
                  : t.profitLoss < 0
                    ? "text-rose-200"
                    : "text-zinc-200";
              return (
                <div
                  key={t.id}
                  className="grid grid-cols-12 items-center bg-zinc-950/20 px-4 py-3 text-sm"
                >
                  <div className="col-span-3 text-xs text-zinc-400">
                    {new Date(t.timestamp).toLocaleString()}
                  </div>
                  <div className="col-span-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-zinc-200">
                      {t.direction}
                    </span>
                  </div>
                  <div className="col-span-2 text-xs font-semibold text-zinc-200">
                    {t.strategy}
                  </div>
                  <div className="col-span-2 font-semibold text-zinc-100">
                    {formatNumber(t.entryPrice)}
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${
                        t.result === "WIN"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                      }`}
                    >
                      {t.result}
                    </span>
                  </div>
                  <div
                    className={`col-span-1 text-right font-semibold ${plTone}`}
                  >
                    {formatCurrency(t.profitLoss)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

