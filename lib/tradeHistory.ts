import type { TradeDirection } from "@/lib/trade";

export type TradeHistoryItem = {
  id: string;
  timestamp: number;
  strategy: string;
  direction: TradeDirection;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  result: "WIN" | "LOSS";
  profitLoss: number;
};

const STORAGE_KEY = "backtester.tradeHistory.v1";

export function loadTradeHistory(): TradeHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Backward-compatible: older trades may not have strategy.
    return (parsed as any[]).map((t) => ({
      ...t,
      strategy:
        typeof (t as any)?.strategy === "string" && (t as any).strategy.trim()
          ? String((t as any).strategy)
          : "Default",
    })) as TradeHistoryItem[];
  } catch {
    return [];
  }
}

export function saveTradeHistory(items: TradeHistoryItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function clearTradeHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

