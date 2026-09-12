import { useEffect, useRef } from "react";
import type { Candle } from "@/lib/market/candles";
import { formatPrice } from "@/lib/format";

function sma(values: number[], n: number): (number | null)[] {
  return values.map((_, i) => {
    if (i + 1 < n) return null;
    const slice = values.slice(i + 1 - n, i + 1);
    return slice.reduce((a, b) => a + b, 0) / n;
  });
}

export function CandleChart({ candles }: { candles: Candle[] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = 220;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const padL = 52;
      const padR = 8;
      const padT = 10;
      const padB = 8;
      const data = candles.slice(-72);
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
      const plotH = h - padT - padB;
      const y = (v: number) => padT + ((max - v) / (max - min)) * plotH;
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
        ctx.fillText(formatPrice(v), padL - 6, yy + 3);
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
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [candles]);

  return (
    <div className="w-full">
      <canvas ref={ref} className="block w-full" aria-label="陰陽燭圖" />
      <p className="mt-1 text-[11px] text-muted-foreground">淡色線為 20 期簡單平均（SMA20）。紅升綠跌。</p>
    </div>
  );
}
