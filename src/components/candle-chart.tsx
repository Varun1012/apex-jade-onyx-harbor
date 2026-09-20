import { useEffect, useRef } from "react";
import type { Tf } from "@/lib/market/candles";
import { formatPrice, formatVol, hkParts } from "@/lib/format";
import { BY_SYMBOL } from "@/lib/market/universe";
import { isPreOpenSession } from "@/lib/market/engine";
import { useDesk } from "@/lib/store";

function sma(values: number[], n: number): (number | null)[] {
  return values.map((_, i) => {
    if (i + 1 < n) return null;
    const slice = values.slice(i + 1 - n, i + 1);
    return slice.reduce((a, b) => a + b, 0) / n;
  });
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatBar(t: number, tf: Tf) {
  const p = hkParts(t);
  if (tf === "1d") return `${p.month}/${pad(p.day)}`;
  return `${p.month}/${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}`;
}

const TF_LABEL: Record<Tf, string> = { "5m": "5分鐘K", "15m": "15分鐘K", "1d": "日K" };

export function CandleChart({ symbol, tf }: { symbol: string; tf: Tf }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useDesk((s) => s.quotes[symbol]?.last);
  const clock = useDesk((s) => s.clock);
  const barT = useDesk((s) => s.candles[symbol]?.[tf]?.at(-1)?.t ?? 0);
  const len = useDesk((s) => s.candles[symbol]?.[tf]?.length ?? 0);
  const lastVol = useDesk((s) => s.candles[symbol]?.[tf]?.at(-1)?.v ?? 0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let raf = 0;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = 292;
      const needW = Math.max(1, Math.floor(w * dpr));
      const needH = Math.floor(h * dpr);
      if (canvas.width !== needW || canvas.height !== needH) {
        canvas.width = needW;
        canvas.height = needH;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const padL = 52;
      const padR = 8;
      const padT = 8;
      const priceH = 196;
      const gap = 10;
      const volH = 66;
      const raw = useDesk.getState().candles[symbol]?.[tf] ?? [];
      const lastPx = useDesk.getState().quotes[symbol]?.last;
      const freeze = isPreOpenSession(useDesk.getState().clock);
      const data = raw.slice(-72).map((c, i, arr) => {
        if (freeze || i !== arr.length - 1 || lastPx == null) return c;
        return { ...c, c: lastPx, h: Math.max(c.h, lastPx), l: Math.min(c.l, lastPx) };
      });
      if (!data.length) return;
      const highs = data.map((c) => c.h);
      const lows = data.map((c) => c.l);
      let min = Math.min(...lows);
      let max = Math.max(...highs);
      if (min === max) {
        min *= 0.99;
        max *= 1.01;
      }
      const span = max - min;
      min -= span * 0.08;
      max += span * 0.08;
      const plotW = w - padL - padR;
      const y = (v: number) => padT + ((max - v) / (max - min)) * priceH;
      const slot = plotW / data.length;
      const bodyW = Math.max(2, Math.min(9, slot * 0.62));

      const styles = getComputedStyle(document.documentElement);
      const up = styles.getPropertyValue("--color-up").trim() || "#c4453c";
      const down = styles.getPropertyValue("--color-down").trim() || "#2f8f6b";
      const muted = styles.getPropertyValue("--color-muted").trim() || "#8b9188";
      const border = styles.getPropertyValue("--color-border").trim() || "#2a2d29";
      const fg = styles.getPropertyValue("--color-fg").trim() || "#ecece8";

      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.font = "10px IBM Plex Mono, ui-monospace, monospace";
      ctx.fillStyle = muted;
      ctx.textAlign = "right";
      for (let i = 0; i < 4; i++) {
        const v = max - ((max - min) * i) / 3;
        const yy = y(v);
        ctx.beginPath();
        ctx.moveTo(padL, yy);
        ctx.lineTo(w - padR, yy);
        ctx.stroke();
        ctx.fillText(formatPrice(v, BY_SYMBOL[symbol]?.kind === "crypto" ? "USD" : "HKD"), padL - 6, yy + 3);
      }

      data.forEach((c, i) => {
        const x = padL + slot * i + slot / 2;
        const bull = c.c >= c.o;
        const color = bull ? up : down;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y(c.h));
        ctx.lineTo(x, y(c.l));
        ctx.stroke();
        const top = y(Math.max(c.o, c.c));
        const bot = y(Math.min(c.o, c.c));
        const bh = Math.max(1, bot - top);
        ctx.fillRect(x - bodyW / 2, top, bodyW, bh);
      });

      const ma = sma(
        data.map((c) => c.c),
        Math.min(20, data.length),
      );
      ctx.beginPath();
      ctx.strokeStyle = fg;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1.2;
      let started = false;
      ma.forEach((v, i) => {
        if (v == null) return;
        const x = padL + slot * i + slot / 2;
        if (!started) {
          ctx.moveTo(x, y(v));
          started = true;
        } else ctx.lineTo(x, y(v));
      });
      ctx.stroke();
      ctx.globalAlpha = 1;

      const volTop = padT + priceH + gap;
      ctx.strokeStyle = border;
      ctx.beginPath();
      ctx.moveTo(padL, volTop);
      ctx.lineTo(w - padR, volTop);
      ctx.stroke();

      const vols = data.map((c) => c.v ?? 0);
      const maxV = Math.max(...vols, 1);
      const volMa = sma(vols, Math.min(20, vols.length));
      ctx.fillStyle = muted;
      ctx.textAlign = "right";
      ctx.fillText(formatVol(maxV), padL - 6, volTop + 10);
      ctx.fillText("量", padL - 6, volTop + volH);

      data.forEach((c, i) => {
        const x = padL + slot * i + slot / 2;
        const bull = c.c >= c.o;
        const vh = Math.max(1, ((c.v ?? 0) / maxV) * (volH - 4));
        ctx.globalAlpha = i === data.length - 1 ? 0.95 : 0.72;
        ctx.fillStyle = bull ? up : down;
        ctx.fillRect(x - bodyW / 2, volTop + volH - vh, bodyW, vh);
      });
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.strokeStyle = fg;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1;
      let vStart = false;
      volMa.forEach((v, i) => {
        if (v == null) return;
        const x = padL + slot * i + slot / 2;
        const yy = volTop + volH - (v / maxV) * (volH - 4);
        if (!vStart) {
          ctx.moveTo(x, yy);
          vStart = true;
        } else ctx.lineTo(x, yy);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        draw();
      });
    };

    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(parent);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [symbol, tf, live, barT, len, lastVol, clock]);

  const series = useDesk.getState().candles[symbol]?.[tf] ?? [];
  const first = series[Math.max(0, series.length - 72)];
  const last = series[series.length - 1];
  const range =
    first && last ? `${formatBar(first.t, tf)} → ${formatBar(last.t, tf)}` : "—";

  return (
    <div className="w-full">
      <canvas ref={ref} className="block w-full" aria-label="陰陽燭及成交量" />
      <p className="mt-1 text-[11px] text-muted-foreground">
        {TF_LABEL[tf]} · {range} · 下方成交量 · 淡線 SMA20 · 紅升綠跌
      </p>
    </div>
  );
}
