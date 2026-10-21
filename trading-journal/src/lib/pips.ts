export interface PipCalculation {
  unit: "pips" | "pts";
  pipSize: number;
  diff: number | null; // net price movement in pips/pts (signed: positive is gain)
  pipsFormatted: string | null; // e.g. "+45.0 pips" or "-12.5 pts"
  slPips: number | null; // distance to SL in pips/pts
  tpPips: number | null; // distance to TP in pips/pts
  riskRewardRatio: string | null; // e.g. "1:3.0"
  rMultiple: number | null; // realized R multiple
}

const COMMON_FOREX_PAIRS = new Set([
  "EURUSD", "GBPUSD", "AUDUSD", "NZDUSD", "USDCAD", "USDCHF",
  "EURGBP", "EURCAD", "EURAUD", "GBPAUD", "GBPCAD", "GBPNZD",
  "AUDCAD", "AUDCHF", "AUDNZD", "NZDCAD", "NZDCHF", "CADCHF",
  "EURCHF", "GBPCHF"
]);

export function calculatePipInfo(
  symbol: string,
  entry: number,
  exit: number | null,
  side: "long" | "short",
  sl?: number | null,
  tp?: number | null
): PipCalculation {
  const s = (symbol || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

  let unit: "pips" | "pts" = "pts";
  let pipSize = 1;

  if (s.includes("JPY")) {
    unit = "pips";
    pipSize = 0.01;
  } else if (
    COMMON_FOREX_PAIRS.has(s) ||
    s.endsWith("USD") && (s.startsWith("EUR") || s.startsWith("GBP") || s.startsWith("AUD") || s.startsWith("NZD")) ||
    (entry > 0 && entry < 5 && s.length === 6 && !s.includes("BTC") && !s.includes("ETH"))
  ) {
    unit = "pips";
    pipSize = 0.0001;
  } else if (s === "GC" || s === "MGC" || s.includes("XAU") || s === "GOLD") {
    unit = "pips";
    pipSize = 0.10;
  } else if (s === "SI" || s === "MSI" || s.includes("XAG") || s === "SILVER") {
    unit = "pips";
    pipSize = 0.01;
  }

  // Net realized movement in pips/pts
  let diff: number | null = null;
  let pipsFormatted: string | null = null;
  if (entry > 0 && exit !== null && exit > 0) {
    const delta = side === "long" ? exit - entry : entry - exit;
    diff = Math.round((delta / pipSize) * 10) / 10;
    pipsFormatted = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)} ${unit}`;
  }

  // Stop loss distance
  let slPips: number | null = null;
  if (entry > 0 && sl !== null && sl !== undefined && sl > 0) {
    const slDelta = side === "long" ? entry - sl : sl - entry;
    if (slDelta > 0) {
      slPips = Math.round((slDelta / pipSize) * 10) / 10;
    }
  }

  // Take profit distance
  let tpPips: number | null = null;
  if (entry > 0 && tp !== null && tp !== undefined && tp > 0) {
    const tpDelta = side === "long" ? tp - entry : entry - tp;
    if (tpDelta > 0) {
      tpPips = Math.round((tpDelta / pipSize) * 10) / 10;
    }
  }

  // Planned Risk : Reward ratio
  let riskRewardRatio: string | null = null;
  if (slPips && tpPips && slPips > 0) {
    riskRewardRatio = `1:${(tpPips / slPips).toFixed(1)}`;
  }

  // Realized R multiple
  let rMultiple: number | null = null;
  if (diff !== null && slPips && slPips > 0) {
    rMultiple = Math.round((diff / slPips) * 10) / 10;
  }

  return {
    unit,
    pipSize,
    diff,
    pipsFormatted,
    slPips,
    tpPips,
    riskRewardRatio,
    rMultiple,
  };
}
