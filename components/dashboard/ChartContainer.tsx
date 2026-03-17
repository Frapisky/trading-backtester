"use client";

import { useEffect, useMemo, useState } from "react";
import CandlestickChart from "@/components/charts/CandlestickChart";
import type { TradeDirection } from "@/lib/trade";
import { MOCK_CANDLES } from "@/lib/mockCandles";
import type { SeriesMarker, Time } from "lightweight-charts";
import type { TradeHistoryItem } from "@/lib/tradeHistory";

type Props = {
  title?: string;
  direction?: TradeDirection;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  lotSize?: number;
  onTradeComplete?: (item: TradeHistoryItem) => void;
};

type TradeState =
  | {
      status: "none";
    }
  | {
      status: "open";
      entryIndex: number;
      entryPrice: number;
      strategy: string;
      direction: TradeDirection;
      stopLoss: number;
      takeProfit: number;
      lotSize: number;
    }
  | {
      status: "resolved";
      entryIndex: number;
      entryPrice: number;
      exitIndex: number;
      outcome: "WIN" | "LOSS";
      strategy: string;
      direction: TradeDirection;
      stopLoss: number;
      takeProfit: number;
      lotSize: number;
    };

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export default function ChartContainer({
  title = "Price Chart",
  direction = "BUY",
  entryPrice,
  stopLoss,
  takeProfit,
  lotSize,
  onTradeComplete,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<"slow" | "medium" | "fast">("medium");
  const [index, setIndex] = useState(1);
  const [trade, setTrade] = useState<TradeState>({ status: "none" });
  const [strategy, setStrategy] = useState("Default");

  const intervalMs = useMemo(() => {
    if (speed === "slow") return 900;
    if (speed === "fast") return 150;
    return 400;
  }, [speed]);

  const visibleCandles = useMemo(
    () =>
      MOCK_CANDLES.slice(
        0,
        Math.max(1, Math.min(index, MOCK_CANDLES.length)),
      ),
    [index],
  );

  useEffect(() => {
    if (!isPlaying) return;
    if (index >= MOCK_CANDLES.length) return;

    const id = window.setInterval(() => {
      setIndex((prev) => {
        const next = prev + 1;
        return next > MOCK_CANDLES.length ? MOCK_CANDLES.length : next;
      });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [index, intervalMs, isPlaying]);

  useEffect(() => {
    if (index >= MOCK_CANDLES.length && isPlaying) setIsPlaying(false);
  }, [index, isPlaying]);

  // Resolve an open trade as playback reveals candles.
  useEffect(() => {
    if (!isPlaying) return;
    if (trade.status !== "open") return;
    if (!isFiniteNumber(trade.stopLoss) || !isFiniteNumber(trade.takeProfit))
      return;

    // index is count of visible candles; newly revealed candle is at (index - 1)
    if (index - 1 <= trade.entryIndex) return;

    const c = MOCK_CANDLES[index - 1];
    const high = (c as any).high as number;
    const low = (c as any).low as number;
    if (!isFiniteNumber(high) || !isFiniteNumber(low)) return;

    const stopHit =
      trade.direction === "BUY" ? low <= trade.stopLoss : high >= trade.stopLoss;
    const takeHit =
      trade.direction === "BUY"
        ? high >= trade.takeProfit
        : low <= trade.takeProfit;

    let outcome: "WIN" | "LOSS" | null = null;
    if (stopHit && takeHit) outcome = "LOSS";
    else if (stopHit) outcome = "LOSS";
    else if (takeHit) outcome = "WIN";

    if (!outcome) return;

    setIsPlaying(false);
    setTrade({
      status: "resolved",
      entryIndex: trade.entryIndex,
      entryPrice: trade.entryPrice,
      exitIndex: index - 1,
      outcome,
      strategy: trade.strategy,
      direction: trade.direction,
      stopLoss: trade.stopLoss,
      takeProfit: trade.takeProfit,
      lotSize: trade.lotSize,
    });
  }, [index, isPlaying, trade]);

  // Emit a completed trade record once when resolved.
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  useEffect(() => {
    if (trade.status !== "resolved") return;
    if (!onTradeComplete) return;

    const exitPrice = trade.outcome === "WIN" ? trade.takeProfit : trade.stopLoss;
    const profitLoss =
      trade.direction === "BUY"
        ? (exitPrice - trade.entryPrice) * trade.lotSize
        : (trade.entryPrice - exitPrice) * trade.lotSize;

    const id = `${trade.entryIndex}-${trade.exitIndex}-${trade.outcome}-${trade.direction}-${trade.entryPrice}`;
    if (lastSavedId === id) return;
    setLastSavedId(id);

    onTradeComplete({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: Date.now(),
      strategy: trade.strategy?.trim() ? trade.strategy.trim() : "Default",
      direction: trade.direction,
      entryPrice: trade.entryPrice,
      stopLoss: trade.stopLoss,
      takeProfit: trade.takeProfit,
      lotSize: trade.lotSize,
      result: trade.outcome,
      profitLoss,
    });
  }, [lastSavedId, onTradeComplete, trade]);

  const outcomeStyles =
    trade.status === "resolved" && trade.outcome === "WIN"
      ? "border-emerald-500/20"
      : trade.status === "resolved" && trade.outcome === "LOSS"
        ? "border-rose-500/20"
        : "border-white/10";

  const currentCandle = visibleCandles[visibleCandles.length - 1];
  const currentClose = (currentCandle as any)?.close as number | undefined;

  const canPlaceTrade =
    trade.status === "none" &&
    isPlaying &&
    isFiniteNumber(stopLoss) &&
    isFiniteNumber(takeProfit) &&
    isFiniteNumber(lotSize) &&
    isFiniteNumber(currentClose);

  const markers: SeriesMarker<Time>[] = useMemo(() => {
    if (trade.status === "none") return [];

    const entryTime = MOCK_CANDLES[trade.entryIndex].time;
    const entryMarker: SeriesMarker<Time> = {
      time: entryTime,
      position: trade.direction === "BUY" ? "belowBar" : "aboveBar",
      color: "#3b82f6",
      shape: trade.direction === "BUY" ? "arrowUp" : "arrowDown",
      text: "Entry",
    };

    if (trade.status === "open") return [entryMarker];

    const exitTime = MOCK_CANDLES[trade.exitIndex].time;
    const exitMarker: SeriesMarker<Time> = {
      time: exitTime,
      position: trade.outcome === "WIN" ? "aboveBar" : "belowBar",
      color: trade.outcome === "WIN" ? "#10b981" : "#f43f5e",
      shape: "circle",
      text: trade.outcome === "WIN" ? "Win" : "Loss",
    };

    return [entryMarker, exitMarker];
  }, [trade]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-100">{title}</div>
          <div className="mt-1 text-xs text-zinc-400">
            Mock candlestick data (hardcoded)
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden text-xs text-zinc-500 sm:block">
            Candle {visibleCandles.length}/{MOCK_CANDLES.length}
          </div>

          <select
            value={speed}
            onChange={(e) => setSpeed(e.target.value as any)}
            className="h-9 rounded-xl border border-white/10 bg-zinc-950/40 px-3 text-xs font-semibold text-zinc-200 outline-none"
            aria-label="Playback speed"
          >
            <option value="slow">Slow</option>
            <option value="medium">Medium</option>
            <option value="fast">Fast</option>
          </select>

          {!isPlaying ? (
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              className="h-9 rounded-xl bg-white px-3 text-xs font-semibold text-black hover:bg-zinc-200"
            >
              Play
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsPlaying(false)}
              className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-200 hover:bg-white/10"
            >
              Pause
            </button>
          )}

          <input
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            placeholder="Strategy"
            className="hidden h-9 w-40 rounded-xl border border-white/10 bg-zinc-950/40 px-3 text-xs font-semibold text-zinc-200 outline-none placeholder:text-zinc-500 sm:block"
            aria-label="Strategy name"
          />

          <button
            type="button"
            disabled={!canPlaceTrade}
            onClick={() => {
              if (!canPlaceTrade) return;
              const entryIdx = visibleCandles.length - 1;
              setTrade({
                status: "open",
                entryIndex: entryIdx,
                entryPrice: Number(currentClose),
                strategy: strategy?.trim() ? strategy.trim() : "Default",
                direction,
                stopLoss: Number(stopLoss),
                takeProfit: Number(takeProfit),
                lotSize: Number(lotSize),
              });
            }}
            className="h-9 rounded-xl border border-white/10 bg-zinc-950/40 px-3 text-xs font-semibold text-zinc-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Place trade at current candle"
          >
            Place Trade
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setIndex(1);
              setTrade({ status: "none" });
            }}
            className="h-9 rounded-xl border border-white/10 bg-zinc-950/40 px-3 text-xs font-semibold text-zinc-200 hover:bg-white/5"
          >
            Reset
          </button>
        </div>
      </div>

      <div
        className={`relative mt-4 w-full overflow-hidden rounded-xl border bg-zinc-950/40 ${outcomeStyles}`}
      >
        {trade.status === "resolved" ? (
          <div className="absolute right-3 top-3 z-10">
            <div
              className={`rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur ${
                trade.outcome === "WIN"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-200"
              }`}
            >
              {trade.outcome === "WIN" ? "Win" : "Loss"} • {trade.strategy}
            </div>
          </div>
        ) : null}
        <CandlestickChart
          className="h-72 w-full"
          candles={visibleCandles}
          markers={markers}
          direction={trade.status !== "none" ? trade.direction : direction}
          entryPrice={trade.status !== "none" ? trade.entryPrice : entryPrice}
          stopLoss={trade.status !== "none" ? trade.stopLoss : stopLoss}
          takeProfit={trade.status !== "none" ? trade.takeProfit : takeProfit}
        />
      </div>
    </section>
  );
}

