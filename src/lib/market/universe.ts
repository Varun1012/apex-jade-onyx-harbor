export type InstrumentKind = "index" | "etf" | "stock" | "crypto";

export type Instrument = {
  symbol: string;
  name: string;
  kind: InstrumentKind;
  sector: string;
  start: number;
  vol: number;
  beta: number;
  lot: number;
  weight: number;
  pointValue: number;
  maxLeverage: number;
};

export const STARTING_CASH = 10_000;
export const GOAL_EQUITY = 100_000_000;
export const HSI_SYMBOL = "HSI";
export const BTC_SYMBOL = "BTC";
export const BOYAA_SYMBOL = "0434";
export const USD_HKD = 7.8;

export const UNIVERSE: Instrument[] = [
  {
    symbol: "HSI",
    name: "恒生指數迷你",
    kind: "index",
    sector: "指數",
    start: 25842,
    vol: 0.012,
    beta: 1,
    lot: 1,
    weight: 0,
    pointValue: 1,
    maxLeverage: 10,
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    kind: "crypto",
    sector: "加密貨幣",
    start: 97250,
    vol: 0.045,
    beta: 0.4,
    lot: 0.001,
    weight: 0,
    pointValue: USD_HKD,
    maxLeverage: 5,
  },
  {
    symbol: "2800",
    name: "盈富基金",
    kind: "etf",
    sector: "指數",
    start: 25.84,
    vol: 0.01,
    beta: 1,
    lot: 100,
    weight: 0,
    pointValue: 1,
    maxLeverage: 1,
  },
  {
    symbol: "0005",
    name: "匯豐控股",
    kind: "stock",
    sector: "金融",
    start: 88.45,
    vol: 0.0055,
    beta: 0.85,
    lot: 400,
    weight: 0.09,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "0700",
    name: "騰訊控股",
    kind: "stock",
    sector: "科技",
    start: 412.6,
    vol: 0.009,
    beta: 1.25,
    lot: 100,
    weight: 0.11,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "9988",
    name: "阿里巴巴",
    kind: "stock",
    sector: "科技",
    start: 92.15,
    vol: 0.01,
    beta: 1.3,
    lot: 100,
    weight: 0.07,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "3690",
    name: "美團",
    kind: "stock",
    sector: "科技",
    start: 118.3,
    vol: 0.012,
    beta: 1.35,
    lot: 100,
    weight: 0.05,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "1810",
    name: "小米集團",
    kind: "stock",
    sector: "科技",
    start: 48.75,
    vol: 0.013,
    beta: 1.4,
    lot: 200,
    weight: 0.045,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "0941",
    name: "中國移動",
    kind: "stock",
    sector: "電訊",
    start: 76.2,
    vol: 0.0045,
    beta: 0.55,
    lot: 500,
    weight: 0.07,
    pointValue: 1,
    maxLeverage: 2,
  },
  {
    symbol: "1299",
    name: "友邦保險",
    kind: "stock",
    sector: "金融",
    start: 68.9,
    vol: 0.0065,
    beta: 0.9,
    lot: 200,
    weight: 0.08,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "0388",
    name: "港交所",
    kind: "stock",
    sector: "金融",
    start: 352.4,
    vol: 0.008,
    beta: 1.1,
    lot: 100,
    weight: 0.06,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "2318",
    name: "中國平安",
    kind: "stock",
    sector: "金融",
    start: 47.85,
    vol: 0.0085,
    beta: 1.05,
    lot: 500,
    weight: 0.05,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "1211",
    name: "比亞迪股份",
    kind: "stock",
    sector: "汽車",
    start: 268,
    vol: 0.011,
    beta: 1.2,
    lot: 50,
    weight: 0.04,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "9618",
    name: "京東集團",
    kind: "stock",
    sector: "科技",
    start: 128.5,
    vol: 0.0115,
    beta: 1.28,
    lot: 50,
    weight: 0.03,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "9999",
    name: "網易",
    kind: "stock",
    sector: "科技",
    start: 154.8,
    vol: 0.0095,
    beta: 1.15,
    lot: 100,
    weight: 0.025,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "0001",
    name: "長和",
    kind: "stock",
    sector: "地產",
    start: 46.2,
    vol: 0.006,
    beta: 0.7,
    lot: 500,
    weight: 0.03,
    pointValue: 1,
    maxLeverage: 2,
  },
  {
    symbol: "0002",
    name: "中電控股",
    kind: "stock",
    sector: "公用",
    start: 64.75,
    vol: 0.0035,
    beta: 0.35,
    lot: 500,
    weight: 0.025,
    pointValue: 1,
    maxLeverage: 2,
  },
  {
    symbol: "0011",
    name: "恒生銀行",
    kind: "stock",
    sector: "金融",
    start: 108.3,
    vol: 0.005,
    beta: 0.65,
    lot: 100,
    weight: 0.03,
    pointValue: 1,
    maxLeverage: 2,
  },
  {
    symbol: "0012",
    name: "恆基地產",
    kind: "stock",
    sector: "地產",
    start: 23.85,
    vol: 0.008,
    beta: 0.75,
    lot: 1000,
    weight: 0.02,
    pointValue: 1,
    maxLeverage: 2,
  },
  {
    symbol: "0027",
    name: "銀河娛樂",
    kind: "stock",
    sector: "博彩",
    start: 32.62,
    vol: 0.011,
    beta: 1.12,
    lot: 1000,
    weight: 0.025,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "0175",
    name: "吉利汽車",
    kind: "stock",
    sector: "汽車",
    start: 16.42,
    vol: 0.0125,
    beta: 1.22,
    lot: 500,
    weight: 0.02,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "0293",
    name: "國泰航空",
    kind: "stock",
    sector: "航空",
    start: 13.95,
    vol: 0.009,
    beta: 0.85,
    lot: 1000,
    weight: 0.015,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "2020",
    name: "安踏體育",
    kind: "stock",
    sector: "消費",
    start: 86.5,
    vol: 0.009,
    beta: 0.95,
    lot: 200,
    weight: 0.02,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "2382",
    name: "舜宇光學",
    kind: "stock",
    sector: "科技",
    start: 62.8,
    vol: 0.014,
    beta: 1.32,
    lot: 100,
    weight: 0.015,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "2269",
    name: "藥明生物",
    kind: "stock",
    sector: "醫藥",
    start: 50.35,
    vol: 0.016,
    beta: 1.28,
    lot: 500,
    weight: 0.02,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "2899",
    name: "紫金礦業",
    kind: "stock",
    sector: "礦業",
    start: 33.96,
    vol: 0.014,
    beta: 1.18,
    lot: 2000,
    weight: 0.025,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "1024",
    name: "快手",
    kind: "stock",
    sector: "科技",
    start: 52.4,
    vol: 0.015,
    beta: 1.45,
    lot: 100,
    weight: 0.02,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "9961",
    name: "攜程集團",
    kind: "stock",
    sector: "消費",
    start: 478,
    vol: 0.0105,
    beta: 1.18,
    lot: 50,
    weight: 0.02,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "9888",
    name: "百度集團",
    kind: "stock",
    sector: "科技",
    start: 91.2,
    vol: 0.011,
    beta: 1.2,
    lot: 50,
    weight: 0.02,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "0434",
    name: "博雅互動",
    kind: "stock",
    sector: "加密概念",
    start: 5.18,
    vol: 0.019,
    beta: 1.15,
    lot: 400,
    weight: 0,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "0857",
    name: "中國石油股份",
    kind: "stock",
    sector: "能源",
    start: 6.58,
    vol: 0.007,
    beta: 0.8,
    lot: 2000,
    weight: 0.025,
    pointValue: 1,
    maxLeverage: 2,
  },
  {
    symbol: "0992",
    name: "聯想集團",
    kind: "stock",
    sector: "科技",
    start: 9.92,
    vol: 0.011,
    beta: 1.05,
    lot: 2000,
    weight: 0.015,
    pointValue: 1,
    maxLeverage: 5,
  },
  {
    symbol: "3988",
    name: "中國銀行",
    kind: "stock",
    sector: "金融",
    start: 4.21,
    vol: 0.005,
    beta: 0.72,
    lot: 1000,
    weight: 0.04,
    pointValue: 1,
    maxLeverage: 2,
  },
];

export const BY_SYMBOL = Object.fromEntries(UNIVERSE.map((i) => [i.symbol, i]));

function pinRank(symbol: string): number {
  if (symbol === HSI_SYMBOL) return 0;
  if (symbol === BTC_SYMBOL) return 1;
  return 2;
}

/** HSI and BTC pinned; remaining names by numeric stock code ascending. */
export function listedInstruments(list: Instrument[] = UNIVERSE): Instrument[] {
  return [...list].sort((a, b) => {
    const ra = pinRank(a.symbol);
    const rb = pinRank(b.symbol);
    if (ra !== rb) return ra - rb;
    if (ra < 2) return 0;
    return parseInt(a.symbol, 10) - parseInt(b.symbol, 10);
  });
}

export const WATCHLIST = listedInstruments();

/** 0–1. Higher = stronger fundamentals. Extreme 10%+ gaps almost never hit high-quality names. */
export const FUNDAMENTALS: Record<string, number> = {
  HSI: 1,
  BTC: 0.15,
  "2800": 1,
  "0005": 0.92,
  "0700": 0.76,
  "9988": 0.58,
  "3690": 0.42,
  "1810": 0.46,
  "0941": 0.95,
  "1299": 0.9,
  "0388": 0.86,
  "2318": 0.78,
  "1211": 0.56,
  "0434": 0.18,
  "0857": 0.88,
  "0992": 0.62,
  "0012": 0.72,
  "3988": 0.93,
  "9618": 0.52,
  "9999": 0.64,
  "0001": 0.82,
  "0002": 0.96,
  "0011": 0.94,
  "0175": 0.48,
  "2020": 0.7,
  "2382": 0.36,
  "1024": 0.32,
  "9961": 0.6,
  "9888": 0.5,
  "0027": 0.58,
  "0293": 0.68,
  "2269": 0.38,
  "2899": 0.55,
};

export function fundamentalScore(symbol: string): number {
  return FUNDAMENTALS[symbol] ?? 0.5;
}

export function tickSize(price: number, kind?: InstrumentKind): number {
  if (kind === "crypto") {
    if (price >= 10_000) return 1;
    if (price >= 1_000) return 0.5;
    if (price >= 100) return 0.1;
    return 0.01;
  }
  if (price < 0.25) return 0.001;
  if (price < 0.5) return 0.005;
  if (price < 10) return 0.01;
  if (price < 20) return 0.02;
  if (price < 50) return 0.05;
  if (price < 100) return 0.1;
  if (price < 200) return 0.2;
  if (price < 500) return 0.5;
  if (price < 1000) return 1;
  if (price < 2000) return 2;
  if (price < 5000) return 5;
  return 10;
}

export function roundTick(price: number, kind?: InstrumentKind): number {
  const t = tickSize(price, kind);
  return Math.max(t, Math.round(price / t) * t);
}

export function volumeUnit(inst: Instrument): number {
  if (inst.kind === "index") return 900;
  if (inst.kind === "crypto") return 80;
  return inst.lot;
}

export const NEWS_POOL: { text: string; bias: number; focus?: string }[] = [
  { text: "北水持續淨流入，港股氣氛轉旺", bias: 0.45 },
  { text: "聯儲局官員放鴿，資金重新追逐風險資產", bias: 0.55 },
  { text: "內地公布消費補貼細節，零售與互聯網受捧", bias: 0.4, focus: "3690" },
  { text: "騰訊遊戲版號獲批，科技股急彈", bias: 0.7, focus: "0700" },
  { text: "阿里雲簽下大型企業合約，電商板塊跟漲", bias: 0.5, focus: "9988" },
  { text: "小米新機預售超預期，硬件股活躍", bias: 0.6, focus: "1810" },
  { text: "港交所成交額創月內新高", bias: 0.35, focus: "0388" },
  { text: "匯豐上調亞洲業務指引", bias: 0.4, focus: "0005" },
  { text: "友邦新業務價值勝預期", bias: 0.35, focus: "1299" },
  { text: "比亞迪海外銷量再創新高", bias: 0.5, focus: "1211" },
  { text: "地緣風險升溫，資金湧入防守股", bias: -0.35 },
  { text: "港元拆息抽升，金融股受壓", bias: -0.4, focus: "0005" },
  { text: "監管傳聞再起，科網股高位回吐", bias: -0.55 },
  { text: "美團即時零售競爭加劇，市場憂慮利潤率", bias: -0.45, focus: "3690" },
  { text: "內地樓市數據遜預期，地產相關受挫", bias: -0.4, focus: "0001" },
  { text: "油價急升推高通脹預期，風險胃納下降", bias: -0.3 },
  { text: "快手廣告收入指引保守", bias: -0.4, focus: "1024" },
  { text: "舜宇光學大客戶訂單下修", bias: -0.5, focus: "2382" },
  { text: "中國移動派息政策維持進取", bias: 0.25, focus: "0941" },
  { text: "攜程暑假預訂數據強勁", bias: 0.45, focus: "9961" },
  { text: "博雅互動海外棋牌流水回升，股份交投轉旺", bias: 0.55, focus: "0434" },
  { text: "博雅互動加密概念受捧，棋牌業務疊加幣圈熱潮", bias: 0.6, focus: "0434" },
  { text: "中國銀行息差穩定，派息率維持進取", bias: 0.3, focus: "3988" },
  { text: "聯想 AI PC 出貨勝預期，硬件股受捧", bias: 0.5, focus: "0992" },
  { text: "油價回升，中國石油獲資金吸納", bias: 0.4, focus: "0857" },
  { text: "恆基地產新盤認購超額，內房情緒改善", bias: 0.35, focus: "0012" },
  { text: "銀河娛樂澳門賭收勝預期，博彩股受捧", bias: 0.5, focus: "0027" },
  { text: "銀河娛樂貴賓廳流水回落，博彩股受壓", bias: -0.4, focus: "0027" },
  { text: "國泰客運量創疫後新高，航空股獲吸納", bias: 0.45, focus: "0293" },
  { text: "油價急升推高燃油成本，國泰航空受壓", bias: -0.35, focus: "0293" },
  { text: "藥明生物新簽大額 CDMO 訂單，醫藥股急彈", bias: 0.55, focus: "2269" },
  { text: "海外生物安全法案再起，藥明生物遭拋售", bias: -0.55, focus: "2269" },
  { text: "金價再創新高，紫金礦業獲資金追捧", bias: 0.5, focus: "2899" },
  { text: "銅價回落，紫金礦業高位回吐", bias: -0.4, focus: "2899" },
  { text: "比特幣突破前高，加密資產交投爆量", bias: 0.7, focus: "BTC" },
  { text: "比特幣急瀉，風險資產同步受壓", bias: -0.65, focus: "BTC" },
];
