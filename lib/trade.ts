export type TradeDirection = "BUY" | "SELL";

export type TradeInputs = {
  direction: TradeDirection;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
};

export type TradeResults = {
  direction: TradeDirection;
  risk: number;
  reward: number;
  riskRewardRatio: number;
};

type Ok = { ok: true; results: TradeResults };
type Err = { ok: false; error: string };

export function simulateTrade(inputs: TradeInputs): Ok | Err {
  const { direction, entryPrice, stopLoss, takeProfit, lotSize } = inputs;

  const values = { entryPrice, stopLoss, takeProfit, lotSize };
  for (const [key, value] of Object.entries(values)) {
    if (!Number.isFinite(value)) {
      return { ok: false, error: `Invalid ${key}.` };
    }
  }

  if (lotSize <= 0) return { ok: false, error: "Lot size must be > 0." };

  let risk = 0;
  let reward = 0;

  if (direction === "BUY") {
    risk = (entryPrice - stopLoss) * lotSize;
    reward = (takeProfit - entryPrice) * lotSize;
  } else {
    risk = (stopLoss - entryPrice) * lotSize;
    reward = (entryPrice - takeProfit) * lotSize;
  }

  if (risk < 0 || reward < 0) {
    return {
      ok: false,
      error:
        direction === "BUY"
          ? "For BUY: stop loss should be below entry and take profit above entry."
          : "For SELL: stop loss should be above entry and take profit below entry.",
    };
  }

  if (risk === 0) {
    return {
      ok: false,
      error:
        direction === "BUY"
          ? "Risk is zero (entry equals stop loss)."
          : "Risk is zero (stop loss equals entry).",
    };
  }

  const riskRewardRatio = reward / risk;

  return {
    ok: true,
    results: { direction, risk, reward, riskRewardRatio },
  };
}

