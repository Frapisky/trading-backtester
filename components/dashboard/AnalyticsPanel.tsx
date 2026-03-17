"use client";

import { useMemo } from "react";
import type { TradeHistoryItem } from "@/lib/tradeHistory";
import { formatCurrency, formatNumber } from "@/lib/format";

type Props = {
  trades: TradeHistoryItem[];
};

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function ProgressBar({
  value,
  tone,
}: {
  value: number; // 0..1
  tone: "green" | "red" | "neutral";
}) {
  const pct = `${Math.round(clamp01(value) * 100)}%`;
  const bar =
    tone === "green"
      ? "bg-emerald-500/60"
      : tone === "red"
        ? "bg-rose-500/60"
        : "bg-white/25";
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div className={`h-full ${bar}`} style={{ width: pct }} />
    </div>
  );
}

export default function AnalyticsPanel({ trades }: Props) {
  const stats = useMemo(() => {
    const total = trades.length;
    const wins = trades.filter((t) => t.result === "WIN").length;
    const losses = trades.filter((t) => t.result === "LOSS").length;
    const winRate = total > 0 ? wins / total : 0;
    const totalPL = trades.reduce((sum, t) => sum + t.profitLoss, 0);

    const rrList = trades
      .map((t) => {
        const risk =
          t.direction === "BUY"
            ? (t.entryPrice - t.stopLoss) * t.lotSize
            : (t.stopLoss - t.entryPrice) * t.lotSize;
        const reward =
          t.direction === "BUY"
            ? (t.takeProfit - t.entryPrice) * t.lotSize
            : (t.entryPrice - t.takeProfit) * t.lotSize;
        if (!Number.isFinite(risk) || !Number.isFinite(reward) || risk <= 0)
          return null;
        return reward / risk;
      })
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

    const avgRR =
      rrList.length > 0
        ? rrList.reduce((sum, v) => sum + v, 0) / rrList.length
        : 0;

    const strategies = Object.entries(
      trades.reduce<Record<string, { total: number; wins: number }>>(
        (acc, t) => {
          const key =
            typeof t.strategy === "string" && t.strategy.trim()
              ? t.strategy.trim()
              : "Default";
          const prev = acc[key] ?? { total: 0, wins: 0 };
          const next = {
            total: prev.total + 1,
            wins: prev.wins + (t.result === "WIN" ? 1 : 0),
          };
          acc[key] = next;
          return acc;
        },
        {},
      ),
    )
      .map(([name, s]) => ({
        name,
        total: s.total,
        wins: s.wins,
        winRate: s.total > 0 ? s.wins / s.total : 0,
      }))
      .sort((a, b) => b.total - a.total || b.winRate - a.winRate);

    return { total, wins, losses, winRate, totalPL, avgRR, strategies };
  }, [trades]);

  const plTone =
    stats.totalPL > 0
      ? "text-emerald-200"
      : stats.totalPL < 0
        ? "text-rose-200"
        : "text-zinc-100";

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-100">Analytics</div>
          <div className="mt-1 text-xs text-zinc-400">
            Summary computed from trade history
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-zinc-950/40 px-2.5 py-1 text-xs font-semibold text-zinc-200">
          {stats.total} trades
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
          <div className="text-xs font-medium text-zinc-400">Win rate</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
            {formatNumber(stats.winRate * 100)}%
          </div>
          <ProgressBar value={stats.winRate} tone="green" />
          <div className="mt-2 text-xs text-zinc-500">
            {stats.wins}W / {stats.losses}L
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
          <div className="text-xs font-medium text-zinc-400">Wins</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-emerald-200">
            {stats.wins}
          </div>
          <ProgressBar
            value={stats.total > 0 ? stats.wins / stats.total : 0}
            tone="green"
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
          <div className="text-xs font-medium text-zinc-400">Losses</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-rose-200">
            {stats.losses}
          </div>
          <ProgressBar
            value={stats.total > 0 ? stats.losses / stats.total : 0}
            tone="red"
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
          <div className="text-xs font-medium text-zinc-400">Total P/L</div>
          <div className={`mt-2 text-2xl font-semibold tracking-tight ${plTone}`}>
            {formatCurrency(stats.totalPL)}
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Net across all saved trades
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
          <div className="text-xs font-medium text-zinc-400">
            Average R/R
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
            {formatNumber(stats.avgRR)}
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Avg reward divided by risk
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs font-semibold text-zinc-300">
          Win rate by strategy
        </div>

        {stats.strategies.length === 0 ? (
          <div className="mt-3 text-xs text-zinc-500">
            Place trades with a strategy name to see breakdowns.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {stats.strategies.slice(0, 6).map((s) => (
              <div
                key={s.name}
                className="rounded-xl border border-white/10 bg-zinc-950/40 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-zinc-100">
                    {s.name}
                  </div>
                  <div className="text-xs font-semibold text-zinc-300">
                    {formatNumber(s.winRate * 100)}% • {s.wins}/{s.total}
                  </div>
                </div>
                <ProgressBar value={s.winRate} tone="green" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

