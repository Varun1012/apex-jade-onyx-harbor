import { BY_SYMBOL, UNIVERSE } from "./universe";
import { externalStockGap, type NewsItem } from "./engine";

export type CardKind = "north" | "drag" | "beat" | "rumor" | "tech" | "banks" | "commodity" | "cover";

export type GameCard = {
  id: string;
  kind: CardKind;
  title: string;
  blurb: string;
  scope: "market" | "sector" | "stock";
  sector?: string;
  sign: 1 | -1;
  mag: number;
};

export type HandState = {
  dayKey: string;
  cards: GameCard[];
};

const DECK: (Omit<GameCard, "id" | "mag"> & { lo: number; hi: number })[] = [
  { kind: "north", title: "北水", blurb: "南向資金湧入，帶動恒指及高貝塔。", scope: "market", sign: 1, lo: 0.007, hi: 0.012 },
  { kind: "drag", title: "外圍急挫", blurb: "外圍期指轉弱，拖累大市。", scope: "market", sign: -1, lo: 0.008, hi: 0.013 },
  { kind: "beat", title: "業績勝預期", blurb: "作用於目前個股，競價目標上調。", scope: "stock", sign: 1, lo: 0.035, hi: 0.06 },
  { kind: "rumor", title: "利淡傳聞", blurb: "作用於目前個股，競價目標下調。", scope: "stock", sign: -1, lo: 0.035, hi: 0.06 },
  { kind: "tech", title: "科網熱炒", blurb: "科技股集體偏強，恒指輕微受惠。", scope: "sector", sector: "科技", sign: 1, lo: 0.012, hi: 0.02 },
  { kind: "banks", title: "資金避險", blurb: "資金湧入金融股，大市略穩。", scope: "sector", sector: "金融", sign: 1, lo: 0.007, hi: 0.011 },
  { kind: "commodity", title: "商品轉強", blurb: "能源與礦業受惠，相關股份上調。", scope: "sector", sector: "能源|礦業", sign: 1, lo: 0.015, hi: 0.028 },
  { kind: "cover", title: "空頭回補", blurb: "作用於目前個股，短線買盤回補。", scope: "stock", sign: 1, lo: 0.028, hi: 0.045 },
];

export function dealHand(dayKey: string): HandState {
  const pool = [...DECK];
  const cards: GameCard[] = [];
  while (cards.length < 3 && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    const proto = pool.splice(i, 1)[0]!;
    const mag = proto.lo + Math.random() * (proto.hi - proto.lo);
    cards.push({
      id: `${dayKey}-${proto.kind}`,
      kind: proto.kind,
      title: proto.title,
      blurb: proto.blurb,
      scope: proto.scope,
      sector: proto.sector,
      sign: proto.sign,
      mag,
    });
  }
  return { dayKey, cards };
}

export function cardMoves(card: GameCard, focus: string): { symbol: string; gap: number }[] {
  if (card.scope === "stock") {
    const gap = card.sign * card.mag;
    return [
      { symbol: focus, gap },
      { symbol: "HSI", gap: gap * 0.08 },
    ];
  }
  if (card.scope === "sector" && card.sector) {
    const sectors = card.sector.split("|");
    const out: { symbol: string; gap: number }[] = [];
    for (const inst of UNIVERSE) {
      if (inst.kind === "stock" && sectors.includes(inst.sector)) {
        out.push({ symbol: inst.symbol, gap: card.sign * card.mag });
      }
    }
    out.push({ symbol: "HSI", gap: card.sign * Math.min(0.006, card.mag * 0.28) });
    return out;
  }
  const ext = card.sign * card.mag;
  const out = [{ symbol: "HSI", gap: ext }];
  for (const inst of UNIVERSE) {
    if (inst.kind !== "stock") continue;
    out.push({ symbol: inst.symbol, gap: externalStockGap(inst.beta, ext) });
  }
  return out;
}

export function cardNews(card: GameCard, focus: string, clock: number): NewsItem {
  const pct = `${card.sign > 0 ? "+" : "−"}${(card.mag * 100).toFixed(1)}%`;
  const inst = BY_SYMBOL[focus];
  const who =
    card.scope === "stock"
      ? inst?.name ?? focus
      : card.scope === "sector"
        ? (card.sector ?? "").replace("|", "、")
        : "恒指";
  return {
    id: `card-${card.id}`,
    text: `出牌「${card.title}」。${who}於開市競價受影響，波幅約 ${pct}。`,
    at: clock,
    symbol: card.scope === "stock" ? focus : "HSI",
    sign: card.sign,
  };
}
