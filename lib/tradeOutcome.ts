import type { CandlestickData } from "lightweight-charts";
import type { TradeDirection } from "@/lib/trade";

export type TradeOutcome = "WIN" | "LOSS";

type Inputs = {
  direction: TradeDirection;
  stopLoss: number;
  takeProfit: number;
  candles: CandlestickData[];
};

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

// Simple rule:
// - Iterate candles in order and check if SL or TP is hit.
// - If both hit in the same candle, assume SL hit first (conservative).
export function simulateOutcome({
  direction,
  stopLoss,
  takeProfit,
  candles,
}: Inputs): TradeOutcome | null {
  if (!isFiniteNumber(stopLoss) || !isFiniteNumber(takeProfit)) return null;
  if (!candles.length) return null;

  for (const c of candles) {
    const high = (c as any).high as number;
    const low = (c as any).low as number;
    if (!isFiniteNumber(high) || !isFiniteNumber(low)) continue;

    const stopHit = direction === "BUY" ? low <= stopLoss : high >= stopLoss;
    const takeHit = direction === "BUY" ? high >= takeProfit : low <= takeProfit;

    if (stopHit && takeHit) return "LOSS";
    if (stopHit) return "LOSS";
    if (takeHit) return "WIN";
  }

  return null;
}

