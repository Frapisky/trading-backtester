 "use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ChartContainer from "@/components/dashboard/ChartContainer";
import TradeForm, {
  type TradeFormErrors,
  type TradeFormValues,
} from "@/components/dashboard/TradeForm";
import ResultsPanel from "@/components/dashboard/ResultsPanel";
import TradeSummaryCard from "@/components/dashboard/TradeSummaryCard";
import TradeHistoryPanel from "@/components/dashboard/TradeHistoryPanel";
import AnalyticsPanel from "@/components/dashboard/AnalyticsPanel";
import { simulateTrade, type TradeResults } from "@/lib/trade";
import {
  clearTradeHistory,
  loadTradeHistory,
  saveTradeHistory,
  type TradeHistoryItem,
} from "@/lib/tradeHistory";

function parsePositiveNumber(s: string): number | undefined {
  if (!s) return undefined;
  const n = Number(s);
  if (!Number.isFinite(n)) return undefined;
  if (n <= 0) return undefined;
  return n;
}

function validate(values: TradeFormValues): TradeFormErrors {
  const errors: TradeFormErrors = {};

  const entry = parsePositiveNumber(values.entryPrice);
  const sl = parsePositiveNumber(values.stopLoss);
  const tp = parsePositiveNumber(values.takeProfit);
  const lot = parsePositiveNumber(values.lotSize);

  if (!values.entryPrice) errors.entryPrice = "Required";
  else if (!entry) errors.entryPrice = "Invalid";

  if (!values.stopLoss) errors.stopLoss = "Required";
  else if (!sl) errors.stopLoss = "Invalid";

  if (!values.takeProfit) errors.takeProfit = "Required";
  else if (!tp) errors.takeProfit = "Invalid";

  if (!values.lotSize) errors.lotSize = "Required";
  else if (!lot) errors.lotSize = "Invalid";

  if (entry && sl && tp) {
    if (values.direction === "BUY") {
      if (!(sl < entry)) errors.stopLoss = "Must be < entry";
      if (!(tp > entry)) errors.takeProfit = "Must be > entry";
    } else {
      if (!(sl > entry)) errors.stopLoss = "Must be > entry";
      if (!(tp < entry)) errors.takeProfit = "Must be < entry";
    }
  }

  return errors;
}

function hasErrors(errors: TradeFormErrors) {
  return Object.values(errors).some((v) => Boolean(v));
}

export default function Home() {
  const [values, setValues] = useState<TradeFormValues>({
    direction: "BUY",
    entryPrice: "",
    stopLoss: "",
    takeProfit: "",
    lotSize: "",
  });

  const errors = useMemo(() => validate(values), [values]);
  const canSubmit = useMemo(() => !hasErrors(errors), [errors]);

  const [results, setResults] = useState<TradeResults | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [history, setHistory] = useState<TradeHistoryItem[]>([]);

  useEffect(() => {
    setHistory(loadTradeHistory());
  }, []);

  useEffect(() => {
    saveTradeHistory(history);
  }, [history]);

  const parsed = useMemo(() => {
    const entry = parsePositiveNumber(values.entryPrice);
    const sl = parsePositiveNumber(values.stopLoss);
    const tp = parsePositiveNumber(values.takeProfit);
    const lot = parsePositiveNumber(values.lotSize);
    return { entry, sl, tp, lot };
  }, [values.entryPrice, values.lotSize, values.stopLoss, values.takeProfit]);

  const onSubmit = () => {
    setFormError(null);

    if (!canSubmit) {
      setResults(null);
      setFormError("Fix the highlighted fields to simulate this trade.");
      return;
    }

    const { entry, sl, tp, lot } = parsed;
    if (!entry || !sl || !tp || !lot) {
      setResults(null);
      setFormError("Please enter valid positive numbers.");
      return;
    }

    const outcome = simulateTrade({
      direction: values.direction,
      entryPrice: entry,
      stopLoss: sl,
      takeProfit: tp,
      lotSize: lot,
    });

    if (!outcome.ok) {
      setResults(null);
      setFormError(outcome.error);
      return;
    }

    setResults(outcome.results);
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        <ChartContainer
          direction={values.direction}
          entryPrice={parsed.entry}
          stopLoss={parsed.sl}
          takeProfit={parsed.tp}
          lotSize={parsed.lot}
          onTradeComplete={(item) => {
            setHistory((prev) => [item, ...prev]);
          }}
        />

        <TradeSummaryCard
          direction={values.direction}
          entryPrice={parsed.entry}
          stopLoss={parsed.sl}
          takeProfit={parsed.tp}
          lotSize={parsed.lot}
        />

        <section className="grid gap-6 lg:grid-cols-2">
          <TradeForm
            values={values}
            errors={{ ...errors, form: formError }}
            canSubmit={canSubmit}
            onChange={(next) => {
              setValues(next);
              setFormError(null);
            }}
            onSubmit={onSubmit}
          />

          <ResultsPanel direction={values.direction} results={results} />
        </section>

        <AnalyticsPanel trades={history} />

        <TradeHistoryPanel
          trades={history}
          onClear={() => {
            setHistory([]);
            clearTradeHistory();
          }}
        />
      </div>
    </DashboardLayout>
  );
}