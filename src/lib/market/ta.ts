import type { Candle } from "./candles";

export type Hint = {
  title: string;
  body: string;
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

export function analyze(candles: Candle[]): Hint[] {
  const cs = candles.slice(-80);
  if (cs.length < 5) {
    return [{ title: "數據不足", body: "陰陽燭仍在累積，稍後即可判斷。", bias: "neutral" }];
  }
  const closes = cs.map((c) => c.c);
  const last = closes[closes.length - 1]!;
  const ma20 = sma(closes, Math.min(20, closes.length));
  const ma60 = sma(closes, Math.min(60, closes.length));
  const r = rsi(closes);
  const e12 = ema(closes, 12);
  const e26 = ema(closes, 26);
  const hints: Hint[] = [];

  if (ma20 != null) {
    if (last > ma20 * 1.004) {
      hints.push({
        title: "價格在 20 期均線之上",
        body: `現價高於 SMA20（${ma20.toFixed(2)}）。短線結構偏多，回踩均線而守住可視作承接。`,
        bias: "up",
      });
    } else if (last < ma20 * 0.996) {
      hints.push({
        title: "價格在 20 期均線之下",
        body: `現價低於 SMA20（${ma20.toFixed(2)}）。短線結構偏空，反彈至均線或遇阻力。`,
        bias: "down",
      });
    } else {
      hints.push({
        title: "貼近 20 期均線",
        body: "價格與均線糾纏，方向未明。宜等陽燭站穩或陰燭跌破再作判斷。",
        bias: "neutral",
      });
    }
  }

  if (ma20 != null && ma60 != null && cs.length >= 40) {
    if (ma20 > ma60) {
      hints.push({
        title: "均線排列偏多",
        body: "短期均線在長期均線之上（金叉結構）。趨勢跟隨者通常只在回調時考慮偏多。",
        bias: "up",
      });
    } else {
      hints.push({
        title: "均線排列偏空",
        body: "短期均線在長期均線之下（死叉結構）。反彈未升破均線前，教學上仍當弱勢。",
        bias: "down",
      });
    }
  }

  if (r != null) {
    if (r >= 70) {
      hints.push({
        title: `RSI ${r.toFixed(0)} · 超買區`,
        body: "相對強弱指數偏高，並不等於立刻要沽，只表示升勢可能過熱，宜防回吐。",
        bias: "down",
      });
    } else if (r <= 30) {
      hints.push({
        title: `RSI ${r.toFixed(0)} · 超賣區`,
        body: "指數偏低，跌勢或過急。超賣可維持，需等陽燭或 RSI 轉上才作轉強觀察。",
        bias: "up",
      });
    } else {
      hints.push({
        title: `RSI ${r.toFixed(0)} · 中性`,
        body: "動能未極端。可把 RSI 當作輔助，主看陰陽燭與均線位置。",
        bias: "neutral",
      });
    }
  }

  if (e12 != null && e26 != null) {
    const macd = e12 - e26;
    hints.push({
      title: macd >= 0 ? "MACD 柱在零軸之上" : "MACD 柱在零軸之下",
      body:
        macd >= 0
          ? "12／26 指數平均差為正，中期動能偏多。"
          : "平均差為負，中期動能偏空。零軸附近反覆屬盤整。",
      bias: macd >= 0 ? "up" : "down",
    });
  }

  const recent = cs.slice(-5);
  const higherHigh = recent.every((c, i) => i === 0 || c.h >= recent[i - 1]!.h);
  const lowerLow = recent.every((c, i) => i === 0 || c.l <= recent[i - 1]!.l);
  if (higherHigh) {
    hints.push({
      title: "近 5 根創更高高位",
      body: "上升波動結構仍在。跌破最近一根低位才視為結構轉弱。",
      bias: "up",
    });
  } else if (lowerLow) {
    hints.push({
      title: "近 5 根創更低低位",
      body: "下跌波動結構仍在。要轉強需先止住低位並收復前高。",
      bias: "down",
    });
  }

  const pat = lastPattern(cs);
  if (pat) hints.unshift(pat);

  return hints.slice(0, 4);
}
