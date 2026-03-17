import type { TradeDirection } from "@/lib/trade";
import { formatNumber } from "@/lib/format";

type Props = {
  direction: TradeDirection;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  lotSize?: number;
};

function Value({ v }: { v?: number }) {
  return (
    <span className="text-sm font-semibold text-zinc-100">
      {typeof v === "number" && Number.isFinite(v) ? formatNumber(v) : "—"}
    </span>
  );
}

export default function TradeSummaryCard({
  direction,
  entryPrice,
  stopLoss,
  takeProfit,
  lotSize,
}: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-100">Trade Summary</div>
        <div className="rounded-full border border-white/10 bg-zinc-950/40 px-2.5 py-1 text-xs font-semibold text-zinc-200">
          {direction}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
          <div className="text-xs font-medium text-zinc-400">Entry</div>
          <div className="mt-2">
            <Value v={entryPrice} />
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
          <div className="text-xs font-medium text-zinc-400">Stop Loss</div>
          <div className="mt-2">
            <Value v={stopLoss} />
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
          <div className="text-xs font-medium text-zinc-400">Take Profit</div>
          <div className="mt-2">
            <Value v={takeProfit} />
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
          <div className="text-xs font-medium text-zinc-400">Lot Size</div>
          <div className="mt-2">
            <Value v={lotSize} />
          </div>
        </div>
      </div>
    </section>
  );
}

