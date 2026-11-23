"use client";

import { useEffect, useMemo, useState } from "react";
import CandlestickChart from "@/components/charts/CandlestickChart";
import type { TradeDirection } from "@/lib/trade";
import { MOCK_CANDLES } from "@/lib/mockCandles";
import type { CandlestickData, SeriesMarker, Time, UTCTimestamp } from "lightweight-charts";
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

function toUTCTimestamp(ms: number): UTCTimestamp {
  return Math.floor(ms / 1000) as UTCTimestamp;
}

type Timeframe = "1m" | "5m" | "15m" | "1h";

type TradingPair = "BTCUSDT" | "ETHUSDT" | "EURUSD";

function makeEurUsdMockCandles(): CandlestickData[] {
  // Start with the existing mock dates and shape, but scale to realistic EURUSD prices.
  // Deterministic transform keeps UI stable across rerenders.
  return (MOCK_CANDLES as unknown as CandlestickData[]).map((c, i) => {
    const base = 1.085;
    const drift = (i - 4) * 0.0012;
    const open = base + drift + ((c as any).open - 100) * 0.0008;
    const close = base + drift + ((c as any).close - 100) * 0.0008;
    const high = Math.max(open, close) + 0.0015;
    const low = Math.min(open, close) - 0.0015;
    return {
      time: (c as any).time,
      open: Number(open.toFixed(5)),
      high: Number(high.toFixed(5)),
      low: Number(low.toFixed(5)),
      close: Number(close.toFixed(5)),
    };
  });
}

async function fetchKlines(pair: TradingPair, interval: Timeframe): Promise<CandlestickData[]> {
  if (pair === "EURUSD") return makeEurUsdMockCandles();

  const url = new URL("https://api.binance.com/api/v3/klines");
  url.searchParams.set("symbol", pair);
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", "500");

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    throw new Error(`Binance API error (${res.status})`);
  }
  const raw = (await res.json()) as unknown;
  if (!Array.isArray(raw)) throw new Error("Unexpected Binance response");

  // Kline format:
  // [
  //   0 openTime(ms), 1 open, 2 high, 3 low, 4 close, 5 volume, ...
  // ]
  const out: CandlestickData[] = [];
  for (const k of raw) {
    if (!Array.isArray(k) || k.length < 5) continue;
    const openTimeMs = Number(k[0]);
    const open = Number(k[1]);
    const high = Number(k[2]);
    const low = Number(k[3]);
    const close = Number(k[4]);
    if (
      !Number.isFinite(openTimeMs) ||
      !Number.isFinite(open) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low) ||
      !Number.isFinite(close)
    ) {
      continue;
    }
    out.push({
      time: toUTCTimestamp(openTimeMs),
      open,
      high,
      low,
      close,
    });
  }

  if (out.length === 0) throw new Error("No candlesticks returned");
  return out;
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
  const [pair, setPair] = useState<TradingPair>("BTCUSDT");
  const [timeframe, setTimeframe] = useState<Timeframe>("1m");
  const [candles, setCandles] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<"slow" | "medium" | "fast">("medium");
  const [index, setIndex] = useState(1);
  const [trade, setTrade] = useState<TradeState>({ status: "none" });
  const [strategy, setStrategy] = useState("Default");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await fetchKlines(pair, timeframe);
        if (cancelled) return;
        setCandles(data);
        setIndex(1);
        setTrade({ status: "none" });
        setIsPlaying(false);
      } catch (e) {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "Failed to load candles");
        // Fallback to mock so the UI stays usable.
        setCandles(MOCK_CANDLES as unknown as CandlestickData[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pair, timeframe]);

  const intervalMs = useMemo(() => {
    if (speed === "slow") return 900;
    if (speed === "fast") return 150;
    return 400;
  }, [speed]);

  const sourceCandles = candles.length > 0 ? candles : (MOCK_CANDLES as unknown as CandlestickData[]);

  const visibleCandles = useMemo(
    () =>
      sourceCandles.slice(
        0,
        Math.max(1, Math.min(index, sourceCandles.length)),
      ),
    [index, sourceCandles],
  );

  useEffect(() => {
    if (!isPlaying) return;
    if (index >= sourceCandles.length) return;

    const id = window.setInterval(() => {
      setIndex((prev) => {
        const next = prev + 1;
        return next > sourceCandles.length ? sourceCandles.length : next;
      });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [index, intervalMs, isPlaying, sourceCandles.length]);

  useEffect(() => {
    if (index >= sourceCandles.length && isPlaying) setIsPlaying(false);
  }, [index, isPlaying, sourceCandles.length]);

  // Resolve an open trade as playback reveals candles.
  useEffect(() => {
    if (!isPlaying) return;
    if (trade.status !== "open") return;
    if (!isFiniteNumber(trade.stopLoss) || !isFiniteNumber(trade.takeProfit))
      return;

    // index is count of visible candles; newly revealed candle is at (index - 1)
    if (index - 1 <= trade.entryIndex) return;

    const c = sourceCandles[index - 1];
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
  }, [index, isPlaying, sourceCandles, trade]);

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

    const entryTime = sourceCandles[trade.entryIndex]?.time;
    if (!entryTime) return [];
    const entryMarker: SeriesMarker<Time> = {
      time: entryTime,
      position: trade.direction === "BUY" ? "belowBar" : "aboveBar",
      color: "#3b82f6",
      shape: trade.direction === "BUY" ? "arrowUp" : "arrowDown",
      text: "Entry",
    };

    if (trade.status === "open") return [entryMarker];

    const exitTime = sourceCandles[trade.exitIndex]?.time;
    if (!exitTime) return [entryMarker];
    const exitMarker: SeriesMarker<Time> = {
      time: exitTime,
      position: trade.outcome === "WIN" ? "aboveBar" : "belowBar",
      color: trade.outcome === "WIN" ? "#10b981" : "#f43f5e",
      shape: "circle",
      text: trade.outcome === "WIN" ? "Win" : "Loss",
    };

    return [entryMarker, exitMarker];
  }, [sourceCandles, trade]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-100">{title}</div>
          <div className="mt-1 text-xs text-zinc-400">
            {loading
              ? `Loading ${pair} ${timeframe} candles…`
              : loadError
                ? `Using fallback data • ${loadError}`
                : pair === "EURUSD"
                  ? `Mock ${pair} ${timeframe} candles`
                  : `Live ${pair} ${timeframe} candles (Binance)`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden text-xs text-zinc-500 sm:block">
            Candle {visibleCandles.length}/{sourceCandles.length}
          </div>

          <select
            value={pair}
            onChange={(e) => setPair(e.target.value as TradingPair)}
            className="h-9 rounded-xl border border-white/10 bg-zinc-950/40 px-3 text-xs font-semibold text-zinc-200 outline-none"
            aria-label="Trading pair"
            disabled={loading}
          >
            <option value="BTCUSDT">BTCUSDT</option>
            <option value="ETHUSDT">ETHUSDT</option>
            <option value="EURUSD">EURUSD</option>
          </select>

          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
            className="h-9 rounded-xl border border-white/10 bg-zinc-950/40 px-3 text-xs font-semibold text-zinc-200 outline-none"
            aria-label="Timeframe"
            disabled={loading}
          >
            <option value="1m">1m</option>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
          </select>

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
              disabled={loading || sourceCandles.length === 0}
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
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 text-xs font-semibold text-zinc-200 backdrop-blur">
            Loading candles…
          </div>
        ) : null}
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

