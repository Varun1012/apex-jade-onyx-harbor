import { hkDayKey, isContinuous, type NewsItem, type Quote } from "./engine";
import { symbolPhase, zonedParts } from "./boards";
import {
  BY_SYMBOL,
  clearCustomRegistry,
  registerCustom,
  roundTick,
  tickSize,
  unregisterCustom,
  type Board,
  type Instrument,
} from "./universe";

export const SECTORS = ["科技", "消費", "金融", "醫藥", "工業", "能源"] as const;
export type Sector = (typeof SECTORS)[number];
export type Scale = "micro" | "std" | "large";
export type ManageAct =
  | "hr-freeze"
  | "hr-raise"
  | "fin-borrow"
  | "fin-repay"
  | "ops-cut"
  | "ops-grow"
  | "rnd-stop"
  | "rnd-push"
  | "div-none"
  | "div-modest"
  | "div-rich";

export type Company = {
  symbol: string;
  name: string;
  sector: Sector;
  board: Board;
  sharesOut: number;
  offer: number;
  treasury: number;
  revenue: number;
  profit: number;
  debt: number;
  morale: number;
  capacity: number;
  brand: number;
  pipeline: number;
  retained: number;
  payoutDrag: number;
  origin: "player" | "ipo";
  foundedAt: number;
  lastPulse: number;
  pxKey: string;
};

export type IpoOffer = {
  id: string;
  symbol: string;
  name: string;
  sector: Sector;
  board: Board;
  offer: number;
  sharesOut: number;
  treasury: number;
  revenue: number;
  profit: number;
  debt: number;
  morale: number;
  capacity: number;
  brand: number;
  pipeline: number;
  heat: number;
  subShares: number;
  lockedHkd: number;
  listAt: number;
};

export type FoundInput = {
  name: string;
  sector: string;
  board: Board;
  scale: Scale;
  stake: number;
};

export type Holding = { symbol: string; qty: number; avgPrice: number; leverage: number };

const CONTROL = 0.3;
const BOSS = 0.51;
const RAISE: Record<Scale, number> = { micro: 8_000, std: 40_000, large: 180_000 };
const PULSE_MS = 60 * 60_000;

const BASE: Record<Sector, { margin: number; pipeline: number; morale: number; brand: number; capacity: number }> = {
  科技: { margin: 0.16, pipeline: 58, morale: 62, brand: 54, capacity: 57 },
  消費: { margin: 0.11, pipeline: 36, morale: 55, brand: 60, capacity: 58 },
  金融: { margin: 0.24, pipeline: 28, morale: 52, brand: 50, capacity: 61 },
  醫藥: { margin: 0.06, pipeline: 72, morale: 58, brand: 48, capacity: 46 },
  工業: { margin: 0.1, pipeline: 34, morale: 50, brand: 46, capacity: 63 },
  能源: { margin: 0.14, pipeline: 30, morale: 48, brand: 44, capacity: 60 },
};

const NAMES: Record<Board, string[]> = {
  HK: ["青嶼生物", "維港雲科", "荔枝角機械", "南丫新能源", "啟德冷鏈", "西環精品", "赤柱戶外", "鯉魚門食品", "觀塘半導體", "深井材料"],
  JP: ["青葉精密", "櫻橋食品", "港風遊戲", "北斗材料", "富士見物流", "汐留生技", "鎌倉戶外", "隅田能源"],
  US: ["Harbor Chip", "Jade Bio", "Lantern Retail", "Northwind Energy", "Cinder Cloud", "Moss Retail", "Kiln Robotics", "Paper Lantern"],
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function num(v: unknown, d: number) {
  return typeof v === "number" && Number.isFinite(v) ? v : d;
}

function gauss() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function pointValue(board: Board) {
  if (board === "JP") return 0.051;
  if (board === "US") return 7.8;
  return 1;
}

export function isSector(s: string): s is Sector {
  return (SECTORS as readonly string[]).includes(s);
}

function offerFor(board: Board, scale: Scale) {
  if (board === "JP") return scale === "micro" ? 400 : scale === "std" ? 1200 : 2800;
  if (board === "US") return scale === "micro" ? 6 : scale === "std" ? 18 : 42;
  return scale === "micro" ? 1 : scale === "std" ? 2.5 : 6;
}

export function planFound(input: FoundInput, seq: number, taken: Set<string>) {
  const name = input.name.trim().replace(/\s+/g, " ").replace(/[<>&]/g, "").slice(0, 16);
  if (name.length < 2) return { error: "公司名稱至少兩個字" as const };
  const sector: Sector = isSector(input.sector) ? input.sector : "科技";
  const board: Board = input.board === "JP" || input.board === "US" ? input.board : "HK";
  const scale: Scale = input.scale === "std" || input.scale === "large" ? input.scale : "micro";
  const stake = input.stake >= 0.5 ? 0.51 : 0.3;
  const offer = offerFor(board, scale);
  const pv = pointValue(board);
  const sharesOut = Math.max(200, Math.round(RAISE[scale] / (offer * pv)));
  let mine = Math.round(sharesOut * stake);
  if (mine / sharesOut < stake - 0.004) mine += 1;
  if (mine >= sharesOut) mine = sharesOut - Math.max(1, Math.round(sharesOut * 0.2));
  const capHkd = sharesOut * offer * pv;
  const cost = mine * offer * pv;
  const symbol = nextSymbol(board, seq, taken);
  return { error: null, name, sector, board, scale, stake, offer, sharesOut, mine, capHkd, cost, symbol, pv };
}

function nextSymbol(board: Board, seq: number, taken: Set<string>) {
  for (let i = 0; i < 900; i++) {
    const n = seq + i;
    let symbol: string;
    if (board === "HK") symbol = String(8000 + (n % 900)).padStart(4, "0");
    else if (board === "JP") symbol = String(9100 + (n % 800)).padStart(4, "0");
    else symbol = "NQ" + String(n % 100).padStart(2, "0");
    if (taken.has(symbol) || BY_SYMBOL[symbol]) continue;
    return symbol;
  }
  return `NQ${seq}`;
}

export function blankQuote(inst: Instrument, last: number, prev?: number): Quote {
  const px = inst.kind === "index" ? Math.round(last) : roundTick(Math.max(tickSize(last, inst.kind), last), inst.kind);
  const t = tickSize(px, inst.kind);
  const bid = roundTick(Math.max(t, px - t), inst.kind);
  const ask = roundTick(px + t, inst.kind);
  const prevClose = prev && prev > 0 ? prev : px;
  return { last: px, bid, ask, open: px, high: px, low: px, prevClose, iep: px };
}

export function toInstrument(c: Company): Instrument {
  const base = BASE[c.sector] ?? BASE["科技"];
  return {
    symbol: c.symbol,
    name: c.name,
    kind: "stock",
    sector: `${c.sector} · ${c.origin === "player" ? "自營" : "新股"}`,
    start: c.offer,
    vol: 0.012 + (1 - base.margin) * 0.01,
    beta: 0.75,
    lot: 1,
    weight: 0,
    pointValue: pointValue(c.board),
    maxLeverage: 4,
    market: c.board,
    custom: true,
  };
}

export function syncCustomRegistry(companies: Company[]) {
  const keep = new Set(companies.map((c) => c.symbol));
  for (const s of Object.keys(BY_SYMBOL)) {
    if (BY_SYMBOL[s]?.custom && !keep.has(s)) unregisterCustom(s);
  }
  for (const c of companies) registerCustom(toInstrument(c));
}

export function resetCustomRegistry() {
  clearCustomRegistry();
}

export function normalizeCompany(raw: unknown): Company | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<Company>;
  if (!r.symbol || !r.name) return null;
  const sector: Sector = isSector(String(r.sector)) ? (r.sector as Sector) : "科技";
  const base = BASE[sector];
  const board: Board = r.board === "JP" || r.board === "US" ? r.board : "HK";
  return {
    symbol: String(r.symbol),
    name: String(r.name).slice(0, 16),
    sector,
    board,
    sharesOut: Math.max(1, num(r.sharesOut, 1000)),
    offer: Math.max(0.01, num(r.offer, 1)),
    treasury: num(r.treasury, 1000),
    revenue: Math.max(1, num(r.revenue, 1000)),
    profit: num(r.profit, 0),
    debt: Math.max(0, num(r.debt, 0)),
    morale: clamp(num(r.morale, base.morale), 1, 99),
    capacity: clamp(num(r.capacity, base.capacity), 1, 99),
    brand: clamp(num(r.brand, base.brand), 1, 99),
    pipeline: clamp(num(r.pipeline, base.pipeline), 1, 99),
    retained: num(r.retained, 0),
    payoutDrag: Math.max(0, num(r.payoutDrag, 0)),
    origin: r.origin === "ipo" ? "ipo" : "player",
    foundedAt: num(r.foundedAt, 0),
    lastPulse: num(r.lastPulse, 0),
    pxKey: typeof r.pxKey === "string" ? r.pxKey : "",
  };
}

export function normalizeIpo(raw: unknown): IpoOffer | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<IpoOffer>;
  if (!r.id || !r.symbol || !r.name || !(r.listAt && r.listAt > 0)) return null;
  const sector: Sector = isSector(String(r.sector)) ? (r.sector as Sector) : "科技";
  const board: Board = r.board === "JP" || r.board === "US" ? r.board : "HK";
  return {
    id: String(r.id),
    symbol: String(r.symbol),
    name: String(r.name).slice(0, 16),
    sector,
    board,
    offer: Math.max(0.01, num(r.offer, 1)),
    sharesOut: Math.max(1, num(r.sharesOut, 1000)),
    treasury: num(r.treasury, 1000),
    revenue: Math.max(1, num(r.revenue, 1000)),
    profit: num(r.profit, 0),
    debt: Math.max(0, num(r.debt, 0)),
    morale: num(r.morale, 55),
    capacity: num(r.capacity, 55),
    brand: num(r.brand, 50),
    pipeline: num(r.pipeline, 40),
    heat: num(r.heat, 0),
    subShares: Math.max(0, num(r.subShares, 0)),
    lockedHkd: Math.max(0, num(r.lockedHkd, 0)),
    listAt: num(r.listAt, 0),
  };
}

function seedOps(sector: Sector, treasury: number): Pick<Company, "revenue" | "profit" | "morale" | "capacity" | "brand" | "pipeline" | "debt" | "retained" | "payoutDrag"> {
  const base = BASE[sector];
  const revenue = treasury * (0.62 + base.margin);
  const draft = {
    sector,
    revenue,
    debt: 0,
    morale: base.morale,
    capacity: base.capacity,
    brand: base.brand,
    pipeline: base.pipeline,
    payoutDrag: 0,
    treasury,
    sharesOut: 1,
    offer: 1,
  } as Company;
  return {
    revenue,
    profit: runRate(draft),
    morale: base.morale,
    capacity: base.capacity,
    brand: base.brand,
    pipeline: base.pipeline,
    debt: 0,
    retained: 0,
    payoutDrag: 0,
  };
}

export function stakeOf(c: Company, positions: Holding[]) {
  const p = positions.find((x) => x.symbol === c.symbol);
  if (!p || c.sharesOut <= 0) return 0;
  return p.qty / c.sharesOut;
}

export function roleLabel(stake: number) {
  if (stake >= BOSS - 1e-9) return "老闆";
  if (stake >= CONTROL - 1e-9) return "大股東";
  if (stake > 0.001) return "小股東";
  return "無持股";
}

export function controls(c: Company, positions: Holding[]) {
  return stakeOf(c, positions) >= CONTROL - 1e-6;
}

export function qualityOf(c: Company) {
  const q =
    0.22 * (c.morale / 100) + 0.2 * (c.capacity / 100) + 0.24 * (c.brand / 100) + 0.34 * (c.pipeline / 100);
  const debtPen = Math.min(0.25, (c.debt / Math.max(c.revenue, 1)) * 0.15);
  return clamp(q - debtPen, 0.18, 0.92);
}

export function runRate(c: Company) {
  const base = BASE[c.sector]?.margin ?? 0.12;
  let m = base;
  m += (c.brand - 50) * 0.0011;
  m -= (c.pipeline / 100) * 0.07;
  m -= Math.min(0.16, (c.debt / Math.max(c.revenue, 1)) * 0.05);
  m += (c.morale - 55) * -0.0006;
  m += (c.capacity - 50) * 0.0005;
  m = clamp(m, -0.3, 0.42);
  return c.revenue * m - c.debt * 0.075;
}

function anchorEconomics(c: Company): Company {
  const n = { ...c, debt: c.debt || 0 };
  const probe = runRate({ ...n, revenue: 1000 });
  const m = probe / 1000 + (n.debt * 0.075) / 1000;
  const q = qualityOf(n);
  const pe = (8 + q * 28) * (1 - Math.min(0.35, n.payoutDrag * 0.28));
  const want = (n.offer * n.sharesOut) / Math.max(pe, 1);
  if (m > 0.02) n.revenue = Math.max(1, want / m);
  n.profit = runRate(n);
  return n;
}

export function fairPrice(c: Company) {
  const q = qualityOf(c);
  const pe = (8 + q * 28) * (1 - Math.min(0.35, c.payoutDrag * 0.28));
  let fair: number;
  if (c.profit > 0) fair = (c.profit / c.sharesOut) * pe;
  else {
    const book = Math.max(0, c.treasury - c.debt * 0.5) / c.sharesOut;
    fair = Math.max(book * (0.45 + q), c.offer * 0.15);
  }
  return clamp(fair, c.offer * 0.12, c.offer * 6);
}

export function brief(c: Company) {
  const bits: string[] = [];
  if (c.morale < 40) bits.push("士氣低，產能同留人能力會轉差");
  else if (c.morale > 72) bits.push("士氣高，但薪酬成本不輕");
  if (c.pipeline < 32) bits.push("研發偏薄，市場會用較低市盈率");
  else if (c.pipeline > 68) bits.push("研發厚，估值有增長溢價");
  if (c.debt > c.treasury) bits.push("負債高過庫存現金，財務風險上升");
  if (c.brand < 40) bits.push("品牌轉弱，搶客往往要減價");
  if (c.profit < 0) bits.push("正在虧損，派息會再傷現金");
  else bits.push("有盈利，要在留存同派息之間取捨");
  return bits.slice(0, 3).join("。") + "。";
}

function drift(v: number, to: number, k: number) {
  return clamp(v + (to - v) * k, 4, 98);
}

export function pulseCompany(c: Company): { company: Company; news: string | null } {
  const n = { ...c };
  n.morale = drift(n.morale, 48, 0.08);
  n.capacity = drift(n.capacity, 50, 0.06);
  n.brand = drift(n.brand, 47, 0.05);
  n.pipeline = drift(n.pipeline, 34, 0.1);
  n.payoutDrag *= 0.9;
  const g =
    (n.capacity - 50) * 0.002 +
    (n.brand - 50) * 0.0018 +
    (n.pipeline - 42) * 0.0015 +
    (n.morale - 45) * 0.0006;
  n.revenue = Math.max(n.revenue * 0.45, n.revenue * (1 + g));
  n.profit = runRate(n);
  const slice = n.profit / 80;
  n.retained += slice;
  n.treasury = Math.max(0, n.treasury + slice);
  let news: string | null = null;
  if (n.debt > 0 && n.treasury < n.debt * 0.08 && n.debt > n.revenue * 0.25) {
    n.morale = clamp(n.morale - 6, 4, 98);
    n.brand = clamp(n.brand - 4, 4, 98);
    news = `【公司】${n.name}（${n.symbol}）資金鏈緊張，市場憂慮償債能力。`;
  } else if (n.pipeline > 76 && Math.random() < 0.08) {
    n.brand = clamp(n.brand + 6, 4, 98);
    n.pipeline = clamp(n.pipeline + 4, 4, 98);
    n.profit = runRate(n);
    news = `【公司】${n.name}（${n.symbol}）研發取得進展，增長預期上調。`;
  }
  return { company: n, news };
}

const SENT: Record<ManageAct, number> = {
  "hr-freeze": 0.012,
  "hr-raise": -0.006,
  "fin-borrow": -0.01,
  "fin-repay": 0.012,
  "ops-cut": 0.01,
  "ops-grow": 0.004,
  "rnd-stop": 0.008,
  "rnd-push": -0.004,
  "div-none": 0.004,
  "div-modest": -0.002,
  "div-rich": -0.012,
};

export function applyManage(
  company: Company,
  act: ManageAct,
  qty: number,
  last: number,
): { company: Company; playerCash: number; gap: number; news: string; error: string | null } {
  const c = { ...company };
  const before = fairPrice(c);
  let note = "";
  if (act === "hr-freeze") {
    c.morale = clamp(c.morale - 16, 4, 98);
    c.capacity = clamp(c.capacity - 12, 4, 98);
    c.brand = clamp(c.brand - 3, 4, 98);
    note = "凍結招聘：短期成本下降，士氣同產能會掉，長線收入受壓。";
  } else if (act === "hr-raise") {
    const cost = Math.max(c.treasury * 0.08, c.revenue * 0.012);
    if (c.treasury < cost * 1.15) return { company, playerCash: 0, gap: 0, news: "", error: "庫存現金不夠加薪搶人" };
    c.treasury -= cost;
    c.morale = clamp(c.morale + 16, 4, 98);
    c.capacity = clamp(c.capacity + 8, 4, 98);
    note = "加薪搶人：現金減少，士氣同產能上升，短期利潤受壓。";
  } else if (act === "fin-borrow") {
    if (c.debt > c.treasury * 1.6 + c.revenue * 0.35) {
      return { company, playerCash: 0, gap: 0, news: "", error: "負債過高，銀行拒貸" };
    }
    const borrow = Math.max(c.revenue * 0.16, c.treasury * 0.2);
    c.debt += borrow;
    c.treasury += borrow * 0.97;
    c.brand = clamp(c.brand - 3, 4, 98);
    note = "發債：現金增加，利息會吞噬盈利，估值容易受壓。";
  } else if (act === "fin-repay") {
    const pay = Math.min(c.debt, c.treasury * 0.28);
    if (pay < c.offer * 2) return { company, playerCash: 0, gap: 0, news: "", error: "沒有可還的債務，或現金太薄" };
    c.treasury -= pay;
    c.debt -= pay;
    note = "還債：現金換來較乾淨的負債表，倍數容易擴。";
  } else if (act === "ops-cut") {
    c.brand = clamp(c.brand - 12, 4, 98);
    c.morale = clamp(c.morale - 8, 4, 98);
    c.capacity = clamp(c.capacity - 4, 4, 98);
    c.profit *= 1.08;
    note = "削減開支：盈利即時好看，品牌同士氣受損。";
  } else if (act === "ops-grow") {
    const cost = c.treasury * 0.1;
    if (cost < c.revenue * 0.004) return { company, playerCash: 0, gap: 0, news: "", error: "庫存現金不夠搶市佔" };
    c.treasury -= cost;
    c.revenue *= 1.06;
    c.brand = clamp(c.brand + 14, 4, 98);
    c.profit *= 0.9;
    note = "搶市佔：燒錢換收入同品牌，利潤率先跌。";
  } else if (act === "rnd-stop") {
    c.pipeline = clamp(c.pipeline - 18, 4, 98);
    c.brand = clamp(c.brand - 4, 4, 98);
    c.profit *= 1.07;
    note = "停研發：利潤回升，增長故事變薄，市盈率會縮。";
  } else if (act === "rnd-push") {
    const cost = c.treasury * 0.12;
    if (c.treasury < cost * 1.2) return { company, playerCash: 0, gap: 0, news: "", error: "庫存現金不夠重押研發" };
    c.treasury -= cost;
    c.pipeline = clamp(c.pipeline + 18, 4, 98);
    c.profit *= 0.88;
    if (Math.random() < 0.22) {
      c.pipeline = clamp(c.pipeline + 8, 4, 98);
      c.brand = clamp(c.brand + 6, 4, 98);
      note = "重押研發，而且出現突破：短期利潤下跌，增長溢價上升。";
    } else note = "重押研發：短期利潤下跌，管線變厚，突破不是必然。";
  } else if (act === "div-none") {
    c.payoutDrag = Math.max(0, c.payoutDrag - 0.15);
    note = "暫不派息：利潤留下再投資。增長股通常較受用，收息盤則會失望。";
  } else {
    const rich = act === "div-rich";
    const pool = Math.max(0, c.retained);
    const total = Math.min(pool * (rich ? 0.75 : 0.35), c.treasury * (rich ? 0.3 : 0.12));
    if (!(total > c.offer * c.sharesOut * 0.0015)) {
      return { company, playerCash: 0, gap: 0, news: "", error: "未有足夠可分派溢利。先讓公司賺到錢，或減少燒錢。" };
    }
    const dps = total / c.sharesOut;
    c.retained -= total;
    c.treasury -= total;
    c.payoutDrag = clamp(c.payoutDrag + (rich ? 0.7 : 0.28), 0, 1.5);
    c.profit = runRate(c);
    const playerCash = qty * dps * pointValue(c.board);
    const after = fairPrice(c);
    const fairGap = (after - before) / Math.max(before, 1e-9);
    const ex = last > 0 ? -(dps / last) : 0;
    const gap = clamp(ex + fairGap * 0.35 + (rich ? -0.012 : -0.002), -0.14, 0.08);
    const hkd = playerCash;
    note = `${rich ? "進取" : "穩健"}派息：每股 ${dps.toFixed(4)}（你的持股入帳約 HK$${Math.round(hkd)}）。股價除淨，派得太盡會壓增長估值。`;
    return {
      company: c,
      playerCash,
      gap,
      news: `【派息】${c.name}（${c.symbol}）${note}`,
      error: null,
    };
  }
  c.profit = runRate(c);
  const after = fairPrice(c);
  const fairGap = (after - before) / Math.max(before, 1e-9);
  const gap = clamp(fairGap * 0.55 + SENT[act], -0.12, 0.12);
  return { company: c, playerCash: 0, gap, news: `【公司】${c.name}（${c.symbol}）${note}`, error: null };
}

export function buildFound(input: FoundInput, seq: number, taken: Set<string>, clock: number) {
  const plan = planFound(input, seq, taken);
  if (plan.error || !("symbol" in plan)) return { error: plan.error ?? "未能上市" };
  const treasury = (plan.capHkd * 0.96) / plan.pv;
  const ops = seedOps(plan.sector, treasury);
  const company = anchorEconomics({
    symbol: plan.symbol,
    name: plan.name,
    sector: plan.sector,
    board: plan.board,
    sharesOut: plan.sharesOut,
    offer: plan.offer,
    treasury,
    ...ops,
    origin: "player",
    foundedAt: clock,
    lastPulse: clock,
    pxKey: "",
  });
  return { error: null as null, company, plan };
}

function heatRoll() {
  let heat = (Math.random() - 0.45) * 0.22;
  if (Math.random() < 0.12) heat += 0.16 + Math.random() * 0.18;
  if (Math.random() < 0.08) heat -= 0.1;
  return clamp(heat, -0.22, 0.42);
}

export function rollNpcIpo(clock: number, seq: number, taken: Set<string>): { ipo: IpoOffer; seq: number } | null {
  const boards: Board[] = ["HK", "JP", "US"];
  const board = boards[Math.floor(Math.random() * boards.length)]!;
  const pool = NAMES[board].filter((n) => ![...taken].some((s) => s === n));
  const usedNames = pool.length ? pool : NAMES[board];
  const name = usedNames[Math.floor(Math.random() * usedNames.length)]!;
  if (taken.has(name)) return null;
  const sector = SECTORS[Math.floor(Math.random() * SECTORS.length)]!;
  const scale: Scale = Math.random() < 0.55 ? "micro" : "std";
  const offer = offerFor(board, scale);
  const pv = pointValue(board);
  const raise = scale === "micro" ? 12_000 + Math.random() * 8_000 : 28_000 + Math.random() * 30_000;
  const sharesOut = Math.max(200, Math.round(raise / (offer * pv)));
  const symbol = nextSymbol(board, seq, taken);
  const treasury = (sharesOut * offer * pv * 0.96) / pv;
  const ops = seedOps(sector, treasury);
  const shaped = anchorEconomics({
    symbol,
    name,
    sector,
    board,
    sharesOut,
    offer,
    treasury,
    ...ops,
    retained: 0,
    payoutDrag: 0,
    origin: "ipo",
    foundedAt: clock,
    lastPulse: clock,
    pxKey: "",
  });
  const waitMin = 360 + Math.floor(Math.random() * 480);
  const ipo: IpoOffer = {
    id: `ipo-${clock}-${symbol}`,
    symbol,
    name,
    sector,
    board,
    offer,
    sharesOut,
    treasury: shaped.treasury,
    revenue: shaped.revenue,
    profit: shaped.profit,
    debt: shaped.debt,
    morale: shaped.morale,
    capacity: shaped.capacity,
    brand: shaped.brand,
    pipeline: shaped.pipeline,
    heat: heatRoll(),
    subShares: 0,
    lockedHkd: 0,
    listAt: clock + waitMin * 60_000,
  };
  return { ipo, seq: seq + 1 };
}

export function ipoLotShares(ipo: IpoOffer) {
  const pv = pointValue(ipo.board);
  return Math.max(1, Math.round(1500 / (ipo.offer * pv)));
}

export function ipoLotCost(ipo: IpoOffer) {
  return ipoLotShares(ipo) * ipo.offer * pointValue(ipo.board);
}

export function applySubscribe(ipo: IpoOffer, lots: number, cash: number) {
  const n = Math.floor(lots);
  if (!(n > 0)) return { ipo, cash, error: "請選擇認購手數" };
  const lot = ipoLotShares(ipo);
  const add = n * lot;
  const cap = Math.floor(ipo.sharesOut * 0.4);
  if (ipo.subShares + add > cap) return { ipo, cash, error: "單一新股最多認購四成，避免未上市已全面控盤" };
  const cost = add * ipo.offer * pointValue(ipo.board);
  if (cost > cash + 1e-6) return { ipo, cash, error: "現金不足以認購" };
  return {
    ipo: { ...ipo, subShares: ipo.subShares + add, lockedHkd: ipo.lockedHkd + cost },
    cash: cash - cost,
    error: null as null,
  };
}

function sessionKey(clock: number, board: Board) {
  if (board === "JP") {
    const p = zonedParts(clock, "Asia/Tokyo");
    return `JP-${p.year}-${p.month}-${p.day}`;
  }
  if (board === "US") {
    const p = zonedParts(clock, "America/New_York");
    return `US-${p.year}-${p.month}-${p.day}`;
  }
  return `HK-${hkDayKey(clock)}`;
}

function liveNow(clock: number, inst: Instrument) {
  const m = inst.market ?? "HK";
  if (m === "HK") return isContinuous(clock);
  const ph = symbolPhase(clock, inst);
  if (m === "JP") return ph === "continuous";
  return ph === "continuous" || ph === "pre" || ph === "night";
}

function writeWalk(quotes: Record<string, Quote>, inst: Instrument, raw: number, resetPrev: boolean) {
  const prev = quotes[inst.symbol];
  const px = roundTick(Math.max(tickSize(Math.max(raw, 0.01), inst.kind), raw), inst.kind);
  const t = tickSize(px, inst.kind);
  const bid = roundTick(Math.max(t, px - t), inst.kind);
  const ask = roundTick(px + t, inst.kind);
  quotes[inst.symbol] = {
    last: px,
    bid,
    ask,
    open: resetPrev ? px : prev?.open || px,
    high: resetPrev ? px : Math.max(prev?.high ?? px, px),
    low: resetPrev ? px : Math.min(prev?.low ?? px, px),
    prevClose: resetPrev ? prev?.last ?? px : prev?.prevClose ?? px,
    iep: px,
  };
}

function pushHist(hist: Record<string, number[]>, sym: string, last: number) {
  const prev = hist[sym] ?? [];
  if (prev.length && prev[prev.length - 1] === last) return;
  hist[sym] = [...prev, last].slice(-48);
}

export function companyFromIpo(ipo: IpoOffer, clock: number): Company {
  return {
    symbol: ipo.symbol,
    name: ipo.name,
    sector: ipo.sector,
    board: ipo.board,
    sharesOut: ipo.sharesOut,
    offer: ipo.offer,
    treasury: ipo.treasury,
    revenue: ipo.revenue,
    profit: ipo.profit,
    debt: ipo.debt,
    morale: ipo.morale,
    capacity: ipo.capacity,
    brand: ipo.brand,
    pipeline: ipo.pipeline,
    retained: 0,
    payoutDrag: 0,
    origin: "ipo",
    foundedAt: clock,
    lastPulse: clock,
    pxKey: sessionKey(clock, ipo.board),
  };
}

export function advanceCompanies(args: {
  clock: number;
  companies: Company[];
  ipos: IpoOffer[];
  seq: number;
  ipoDay: string;
  quotes: Record<string, Quote>;
  cash: number;
  positions: Holding[];
  histories: Record<string, number[]>;
}) {
  let companies = args.companies.map((c) => ({ ...c }));
  let ipos = args.ipos.map((i) => ({ ...i }));
  let seq = args.seq || 1;
  let ipoDay = args.ipoDay || "";
  const quotes = { ...args.quotes };
  let cash = args.cash;
  let positions = args.positions.map((p) => ({ ...p }));
  const histories = { ...args.histories };
  const news: NewsItem[] = [];
  let toast: string | null = null;
  const moved: string[] = [];
  let gap = false;
  const day = hkDayKey(args.clock);

  if (ipoDay !== day && ipos.length === 0 && companies.length < 10 && Math.random() < 0.34) {
    const taken = new Set<string>([...companies.map((c) => c.symbol), ...companies.map((c) => c.name), ...ipos.map((i) => i.symbol)]);
    const rolled = rollNpcIpo(args.clock, seq, taken);
    if (rolled) {
      ipos = [...ipos, rolled.ipo];
      seq = rolled.seq;
      const ipo = rolled.ipo;
      const text = `【新股】${ipo.name}（${ipo.symbol}）正在招股，招股價 ${ipo.offer}，約數小時後上市。可認購，一手約 HK$${Math.round(ipoLotCost(ipo))}。`;
      news.unshift({ id: ipo.id, text, at: args.clock, symbol: ipo.symbol, sign: 1 });
      toast = text;
    }
  }
  if (ipoDay !== day) ipoDay = day;

  const still: IpoOffer[] = [];
  for (const ipo of ipos) {
    if (args.clock < ipo.listAt) {
      still.push(ipo);
      continue;
    }
    const company = companyFromIpo(ipo, args.clock);
    companies = [...companies, company];
    const inst = toInstrument(company);
    registerCustom(inst);
    const openPx = Math.max(inst.start * 0.2, ipo.offer * (1 + ipo.heat));
    quotes[ipo.symbol] = blankQuote(inst, openPx, ipo.offer);
    histories[ipo.symbol] = [quotes[ipo.symbol]!.last];
    moved.push(ipo.symbol);
    gap = true;
    if (ipo.subShares > 0) {
      positions = [
        ...positions.filter((p) => p.symbol !== ipo.symbol),
        { symbol: ipo.symbol, qty: ipo.subShares, avgPrice: ipo.offer, leverage: 1 },
      ];
    }
    const pct = ipo.heat * 100;
    const text =
      ipo.heat >= 0
        ? `【新股】${ipo.name}（${ipo.symbol}）上市，首日高開 ${pct.toFixed(1)}%。`
        : `【新股】${ipo.name}（${ipo.symbol}）上市破發 ${Math.abs(pct).toFixed(1)}%。`;
    news.unshift({ id: `list-${ipo.id}`, text, at: args.clock, symbol: ipo.symbol, sign: ipo.heat >= 0 ? 1 : -1 });
    toast = text;
  }
  ipos = still;

  for (let i = 0; i < companies.length; i++) {
    let c = companies[i]!;
    const inst = toInstrument(c);
    if (!quotes[c.symbol]) quotes[c.symbol] = blankQuote(inst, c.offer);
    let pulses = 0;
    if (args.clock - c.lastPulse >= PULSE_MS) {
      pulses = Math.min(3, Math.floor((args.clock - c.lastPulse) / PULSE_MS));
    }
    for (let p = 0; p < pulses; p++) {
      const stepped = pulseCompany(c);
      c = stepped.company;
      if (stepped.news && p === pulses - 1) {
        news.unshift({ id: `pulse-${c.symbol}-${args.clock}`, text: stepped.news, at: args.clock, symbol: c.symbol, sign: -1 });
      }
    }
    if (pulses) c.lastPulse += pulses * PULSE_MS;

    if (liveNow(args.clock, inst)) {
      const key = sessionKey(args.clock, c.board);
      const q = quotes[c.symbol]!;
      let reset = false;
      if (c.pxKey !== key) {
        c.pxKey = key;
        reset = true;
        const fair = fairPrice(c);
        const pull = ((fair - q.last) / Math.max(q.last, 1e-9)) * 0.25;
        const overnight = clamp(pull + (Math.random() - 0.5) * 0.012, -0.06, 0.06);
        writeWalk(quotes, inst, q.last * (1 + overnight), true);
        gap = true;
      } else {
        const fair = fairPrice(c);
        const pull = ((fair - q.last) / Math.max(q.last, 1e-9)) * 0.04;
        const noise = gauss() * 0.004 * (1.35 - qualityOf(c));
        writeWalk(quotes, inst, q.last * (1 + pull + noise), false);
      }
      moved.push(c.symbol);
      pushHist(histories, c.symbol, quotes[c.symbol]!.last);
      void reset;
    }
    companies[i] = c;
  }

  return { companies, ipos, seq, ipoDay, quotes, cash, positions, histories, news, toast, moved: [...new Set(moved)], gap };
}
