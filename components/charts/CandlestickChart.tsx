"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  ColorType,
  CandlestickSeries,
  createSeriesMarkers,
  createChart,
  type CandlestickData,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
} from "lightweight-charts";
import type { TradeDirection } from "@/lib/trade";
import { MOCK_CANDLES } from "@/lib/mockCandles";

type Props = {
  className?: string;
  height?: number;
  candles?: CandlestickData[];
  markers?: SeriesMarker<Time>[];
  direction?: TradeDirection;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
};

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export default function CandlestickChart({
  className,
  height = 288,
  candles,
  markers,
  direction,
  entryPrice,
  stopLoss,
  takeProfit,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const entryLineRef = useRef<IPriceLine | null>(null);
  const stopLineRef = useRef<IPriceLine | null>(null);
  const takeLineRef = useRef<IPriceLine | null>(null);
  const markersApiRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  const data = useMemo(() => candles ?? MOCK_CANDLES, [candles]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "rgba(9,9,11,0)" },
        textColor: "rgba(228,228,231,0.9)",
        fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.12)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.12)",
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.15)" },
        horzLine: { color: "rgba(255,255,255,0.15)" },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#f43f5e",
      wickUpColor: "#10b981",
      wickDownColor: "#f43f5e",
      borderVisible: false,
    });

    series.setData(data);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;
    markersApiRef.current = createSeriesMarkers(series, []);

    const ro = new ResizeObserver(() => {
      const width = el.clientWidth;
      chart.applyOptions({ width });
      chart.timeScale().fitContent();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      markersApiRef.current?.detach();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      entryLineRef.current = null;
      stopLineRef.current = null;
      takeLineRef.current = null;
      markersApiRef.current = null;
    };
  }, [data, height]);

  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;
    series.setData(data);
    chart.timeScale().fitContent();
  }, [data]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    const clear = (ref: React.MutableRefObject<IPriceLine | null>) => {
      if (ref.current) {
        series.removePriceLine(ref.current);
        ref.current = null;
      }
    };

    const setLine = (
      ref: React.MutableRefObject<IPriceLine | null>,
      price: number,
      {
        color,
        title,
      }: {
        color: string;
        title: string;
      },
    ) => {
      clear(ref);
      ref.current = series.createPriceLine({
        price,
        color,
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title,
      });
    };

    clear(entryLineRef);
    clear(stopLineRef);
    clear(takeLineRef);

    if (isFiniteNumber(entryPrice)) {
      setLine(entryLineRef, entryPrice, { color: "#3b82f6", title: "Entry" });
    }
    if (isFiniteNumber(stopLoss)) {
      setLine(stopLineRef, stopLoss, { color: "#f43f5e", title: "Stop" });
    }
    if (isFiniteNumber(takeProfit)) {
      setLine(takeLineRef, takeProfit, {
        color: "#10b981",
        title: "Take",
      });
    }
  }, [entryPrice, stopLoss, takeProfit]);

  useEffect(() => {
    const api = markersApiRef.current;
    if (!api) return;
    api.setMarkers(markers ?? []);
  }, [markers]);

  return <div ref={containerRef} className={className} />;
}

