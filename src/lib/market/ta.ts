import type { Candle } from "./candles";
import { formatPrice } from "../format";

export type Hint = {
  title: string;
  body: string;
  bias: "up" | "down" | "neutral";
};

export type Advice = {
  hints: Hint[];
  longRR: number | null;
  shortRR: number | null;
  support: number | null;
  resist: number | null;
  last: number | null;
  atr: number | null;
  volRatio: number | null;
  bias: "up" | "down" | "neutral";
};

function sma(values: number[], n: number): number | null {
  if (values.length < n) return null;
  const slice = values.slice(-n);
  return slice.reduce((a, b) => a + b, 0) / n;
}

function rsi(closes: number[], n = 14): number | null {
  if (closes.length < n + 1) return null;
  let gain = 0;
  let loss = 0;
  for (let i = closes.length - n; i < closes.length; i++) {
    const d = closes[i]! - closes[i - 1]!;
    if (d >= 0) gain += d;
    else loss -= d;
  }
  if (loss === 0) return 100;
  const rs = gain / loss;
  return 100 - 100 / (1 + rs);
}

function ema(values: number[], n: number): number | null {
  if (values.length < n) return null;
  const k = 2 / (n + 1);
  let e = values.slice(0, n).reduce((a, b) => a + b, 0) / n;
  for (let i = n; i < values.length; i++) e = values[i]! * k + e * (1 - k);
  return e;
}

function trueRange(cs: Candle[], i: number): number {
  const c = cs[i]!;
  if (i === 0) return c.h - c.l;
  const prev = cs[i - 1]!.c;
  return Math.max(c.h - c.l, Math.abs(c.h - prev), Math.abs(c.l - prev));
}

function atr(cs: Candle[], n = 14): number | null {
  if (cs.length < 2) return null;
  const take = Math.min(n, cs.length - 1);
  let s = 0;
  for (let i = cs.length - take; i < cs.length; i++) s += trueRange(cs, Math.max(1, i));
  return s / take;
}

export function overlayLive(cs: Candle[], live?: number | null): Candle[] {
  if (!cs.length || live == null) return cs;
  const copy = cs.slice();
  const last = copy[copy.length - 1]!;
  copy[copy.length - 1] = {
    ...last,
    c: live,
    h: Math.max(last.h, live),
    l: Math.min(last.l, live),
  };
  return copy;
}

function lastPattern(cs: Candle[]): Hint | null {
  if (cs.length < 2) return null;
  const a = cs[cs.length - 2]!;
  const b = cs[cs.length - 1]!;
  const body = Math.abs(b.c - b.o);
  const range = b.h - b.l || 1e-9;
  const lower = Math.min(b.o, b.c) - b.l;
  const upper = b.h - Math.max(b.o, b.c);
  const up = b.c >= b.o;

  if (body / range < 0.12) {
    return {
      title: "十字星（Doji）",
      body: "實體很短，多空暫時平衡。若出現在急升或急跌之後，常見於轉向觀察點，需等下一根確認。",
      bias: "neutral",
    };
  }
  if (lower > body * 2 && upper < body * 0.6 && up) {
    return {
      title: "錘頭（Hammer）",
      body: "長下影線顯示低位有買盤承接。教學上多視為潛在止跌訊號，但仍要配合均線與成交位置。",
      bias: "up",
    };
  }
  if (upper > body * 2 && lower < body * 0.6 && !up) {
    return {
      title: "上吊／射擊之星",
      body: "長上影線代表高位賣壓。若緊貼阻力或均線，傾向視為回吐警號。",
      bias: "down",
    };
  }
  const aUp = a.c >= a.o;
  if (!aUp && up && b.o <= a.c && b.c >= a.o) {
    return {
      title: "陽包陰（底部吞噬）",
      body: "陽燭實體覆蓋前一根陰燭，屬常見短線轉強形態。確認方法：收市站上近 20 期均線更有力。",
      bias: "up",
    };
  }
  if (aUp && !up && b.o >= a.c && b.c <= a.o) {
    return {
      title: "陰包陽（頂部吞噬）",
      body: "陰燭覆蓋前陽，顯示賣盤轉強。教學上視作短線轉弱，勿單靠一根燭下結論。",
      bias: "down",
    };
  }
  return null;
}

export function advise(candles: Candle[], live?: number | null, ccy: "HKD" | "USD" = "HKD"): Advice {
  const cs = overlayLive(candles.slice(-80), live);
  const empty: Advice = {
    hints: [{ title: "數據不足", body: "陰陽燭仍在累積，稍後即可判斷。", bias: "neutral" }],
    longRR: null,
    shortRR: null,
    support: null,
    resist: null,
    last: live ?? null,
    atr: null,
    volRatio: null,
    bias: "neutral",
  };
  if (cs.length < 5) return empty;

  const closes = cs.map((c) => c.c);
  const last = closes[closes.length - 1]!;
  const ma20 = sma(closes, Math.min(20, closes.length));
  const ma60 = sma(closes, Math.min(60, closes.length));
  const r = rsi(closes);
  const rangeBars = cs.slice(-20);
  const resist = Math.max(...rangeBars.map((c) => c.h));
  const support = Math.min(...rangeBars.map((c) => c.l));
  const upRoom = Math.max(0, resist - last);
  const dnRoom = Math.max(0, last - support);
  const longRR = dnRoom > 1e-9 ? upRoom / dnRoom : null;
  const shortRR = upRoom > 1e-9 ? dnRoom / upRoom : null;
  const a = atr(cs, 14);
  const vols = cs.map((c) => c.v ?? 0);
  const volMa = sma(vols, Math.min(20, vols.length));
  const lastVol = vols[vols.length - 1] ?? 0;
  const volRatio = volMa && volMa > 0 ? lastVol / volMa : null;

  const hints: Hint[] = [];

  const pat = lastPattern(cs);
  if (pat) hints.push(pat);

  if (ma20 != null) {
    if (last > ma20 * 1.004) {
      hints.push({
        title: `站上 SMA20 · ${formatPrice(ma20, ccy)}`,
        body: "短線結構偏多，回踩均線而守住可視作承接。",
        bias: "up",
      });
    } else if (last < ma20 * 0.996) {
      hints.push({
        title: `跌破 SMA20 · ${formatPrice(ma20, ccy)}`,
        body: "短線結構偏空，反彈至均線或遇阻力。",
        bias: "down",
      });
    } else {
      hints.push({
        title: "貼近 20 期均線",
        body: "價格與均線糾纏，方向未明，等下一根確認。",
        bias: "neutral",
      });
    }
  }

  if (r != null && (r >= 70 || r <= 30)) {
    hints.push(
      r >= 70
        ? {
            title: `RSI ${r.toFixed(0)} · 超買`,
            body: "升勢或過熱，宜防回吐，不代表立刻要沽。",
            bias: "down" as const,
          }
        : {
            title: `RSI ${r.toFixed(0)} · 超賣`,
            body: "跌勢或過急，需等陽燭確認，超賣可維持。",
            bias: "up" as const,
          },
    );
  } else if (volRatio != null && (volRatio >= 1.35 || volRatio <= 0.65)) {
    hints.push(
      volRatio >= 1.35
        ? {
            title: `放量 ${volRatio.toFixed(1)}×均量`,
            body: "高於近 20 期均量，突破或跌破較有說服力。",
            bias: (last >= cs[cs.length - 1]!.o ? "up" : "down") as "up" | "down",
          }
        : {
            title: `縮量 ${volRatio.toFixed(1)}×均量`,
            body: "低於均量，方向未獲資金確認，不宜追價。",
            bias: "neutral" as const,
          },
    );
  } else if (ma20 != null && ma60 != null && cs.length >= 40) {
    hints.push({
      title: ma20 > ma60 ? "均線排列偏多" : "均線排列偏空",
      body: ma20 > ma60 ? "短線在長線之上，回調才考慮偏多。" : "短線在長線之下，反彈未升破前仍當弱勢。",
      bias: ma20 > ma60 ? "up" : "down",
    });
  }

  while (hints.length < 3) {
    if (r != null && !hints.some((h) => h.title.startsWith("RSI"))) {
      hints.push({
        title: `RSI ${r.toFixed(0)} · 中性`,
        body: "動能未極端。主看陰陽燭與均線，RSI 僅作輔助。",
        bias: "neutral",
      });
      continue;
    }
    if (longRR != null && shortRR != null && !hints.some((h) => h.title.includes("盈虧比"))) {
      const better = longRR >= shortRR ? "偏多" : "偏空";
      hints.push({
        title: `區間 ${better}較佳`,
        body: `近 20 根高 ${formatPrice(resist, ccy)}、低 ${formatPrice(support, ccy)}。教學上${better}方向報酬相對風險較佳。`,
        bias: longRR >= shortRR ? "up" : "down",
      });
      continue;
    }
    break;
  }

  let score = 0;
  for (const h of hints) {
    if (h.bias === "up") score += 1;
    else if (h.bias === "down") score -= 1;
  }
  const bias: Advice["bias"] = score >= 2 ? "up" : score <= -2 ? "down" : "neutral";

  return {
    hints: hints.slice(0, 3),
    longRR,
    shortRR,
    support,
    resist,
    last,
    atr: a,
    volRatio,
    bias,
  };
}

export function analyze(candles: Candle[], live?: number | null, ccy: "HKD" | "USD" = "HKD"): Hint[] {
  return advise(candles, live, ccy).hints;
}
