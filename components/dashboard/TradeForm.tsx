"use client";

import type { TradeDirection } from "@/lib/trade";

type FieldError = string | null;

export type TradeFormValues = {
  direction: TradeDirection;
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  lotSize: string;
};

export type TradeFormErrors = Partial<
  Record<keyof Omit<TradeFormValues, "direction">, FieldError>
> & {
  form?: FieldError;
};

type Props = {
  values: TradeFormValues;
  errors?: TradeFormErrors;
  canSubmit: boolean;
  onChange: (next: TradeFormValues) => void;
  onSubmit: () => void;
};

function Input({
  label,
  placeholder,
  value,
  onChange,
  min,
  step,
  error,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  step?: number;
  error?: string | null;
}) {
  return (
    <label className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-zinc-400">{label}</div>
        {error ? (
          <div className="text-[11px] font-medium text-rose-200">{error}</div>
        ) : null}
      </div>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-white/20"
      />
    </label>
  );
}

export default function TradeForm({
  values,
  errors,
  canSubmit,
  onChange,
  onSubmit,
}: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm font-semibold text-zinc-100">Trade Input</div>

      <div className="mt-4">
        <div className="text-xs font-medium text-zinc-400">Trade Direction</div>
        <div className="mt-2 inline-flex w-full rounded-xl border border-white/10 bg-zinc-950/40 p-1 sm:w-auto">
          <button
            type="button"
            onClick={() => onChange({ ...values, direction: "BUY" })}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition sm:flex-none ${
              values.direction === "BUY"
                ? "bg-white text-black"
                : "text-zinc-300 hover:bg-white/5 hover:text-zinc-100"
            }`}
          >
            BUY
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...values, direction: "SELL" })}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition sm:flex-none ${
              values.direction === "SELL"
                ? "bg-white text-black"
                : "text-zinc-300 hover:bg-white/5 hover:text-zinc-100"
            }`}
          >
            SELL
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Input
          label="Entry Price"
          placeholder="e.g. 100.00"
          value={values.entryPrice}
          onChange={(v) => onChange({ ...values, entryPrice: v })}
          min={0}
          step={0.01}
          error={errors?.entryPrice}
        />
        <Input
          label="Stop Loss"
          placeholder="e.g. 95.00"
          value={values.stopLoss}
          onChange={(v) => onChange({ ...values, stopLoss: v })}
          min={0}
          step={0.01}
          error={errors?.stopLoss}
        />
        <Input
          label="Take Profit"
          placeholder="e.g. 110.00"
          value={values.takeProfit}
          onChange={(v) => onChange({ ...values, takeProfit: v })}
          min={0}
          step={0.01}
          error={errors?.takeProfit}
        />
        <Input
          label="Lot Size"
          placeholder="e.g. 1.00"
          value={values.lotSize}
          onChange={(v) => onChange({ ...values, lotSize: v })}
          min={0}
          step={0.01}
          error={errors?.lotSize}
        />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="mt-4 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Simulate Trade
      </button>

      {errors?.form ? (
        <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {errors.form}
        </div>
      ) : null}
    </section>
  );
}

