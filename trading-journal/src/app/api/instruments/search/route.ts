import { NextResponse } from "next/server";

export interface InstrumentResult {
  symbol: string;
  rawSymbol: string;
  name: string;
  type: string;
  exchange: string;
}

// Curated instant-fallback list for standard trading markets
const FALLBACK_INSTRUMENTS: InstrumentResult[] = [
  // Futures / Indices
  { symbol: "NQ", rawSymbol: "NQ=F", name: "E-mini Nasdaq 100 Futures", type: "Futures", exchange: "CME" },
  { symbol: "MNQ", rawSymbol: "MNQ=F", name: "Micro E-mini Nasdaq 100", type: "Futures", exchange: "CME" },
  { symbol: "ES", rawSymbol: "ES=F", name: "E-mini S&P 500 Futures", type: "Futures", exchange: "CME" },
  { symbol: "MES", rawSymbol: "MES=F", name: "Micro E-mini S&P 500", type: "Futures", exchange: "CME" },
  { symbol: "YM", rawSymbol: "YM=F", name: "E-mini Dow Jones ($5)", type: "Futures", exchange: "CBOT" },
  { symbol: "MYM", rawSymbol: "MYM=F", name: "Micro E-mini Dow Jones", type: "Futures", exchange: "CBOT" },
  { symbol: "RTY", rawSymbol: "RTY=F", name: "E-mini Russell 2000", type: "Futures", exchange: "CME" },
  { symbol: "M2K", rawSymbol: "M2K=F", name: "Micro E-mini Russell 2000", type: "Futures", exchange: "CME" },
  { symbol: "GC", rawSymbol: "GC=F", name: "Gold Futures", type: "Futures", exchange: "COMEX" },
  { symbol: "MGC", rawSymbol: "MGC=F", name: "Micro Gold Futures", type: "Futures", exchange: "COMEX" },
  { symbol: "SI", rawSymbol: "SI=F", name: "Silver Futures", type: "Futures", exchange: "COMEX" },
  { symbol: "CL", rawSymbol: "CL=F", name: "Crude Oil Futures", type: "Futures", exchange: "NYMEX" },
  { symbol: "MCL", rawSymbol: "MCL=F", name: "Micro Crude Oil Futures", type: "Futures", exchange: "NYMEX" },
  { symbol: "NG", rawSymbol: "NG=F", name: "Natural Gas Futures", type: "Futures", exchange: "NYMEX" },
  { symbol: "ZB", rawSymbol: "ZB=F", name: "U.S. 30Y Treasury Bond", type: "Futures", exchange: "CBOT" },
  { symbol: "ZN", rawSymbol: "ZN=F", name: "U.S. 10Y Treasury Note", type: "Futures", exchange: "CBOT" },
  { symbol: "FDAX", rawSymbol: "FDAX=F", name: "DAX Index Futures", type: "Futures", exchange: "EUREX" },

  // Forex
  { symbol: "EURUSD", rawSymbol: "EURUSD=X", name: "Euro / US Dollar", type: "Forex", exchange: "FX" },
  { symbol: "GBPUSD", rawSymbol: "GBPUSD=X", name: "British Pound / US Dollar", type: "Forex", exchange: "FX" },
  { symbol: "USDJPY", rawSymbol: "USDJPY=X", name: "US Dollar / Japanese Yen", type: "Forex", exchange: "FX" },
  { symbol: "AUDUSD", rawSymbol: "AUDUSD=X", name: "Australian Dollar / US Dollar", type: "Forex", exchange: "FX" },
  { symbol: "USDCAD", rawSymbol: "USDCAD=X", name: "US Dollar / Canadian Dollar", type: "Forex", exchange: "FX" },
  { symbol: "USDCHF", rawSymbol: "USDCHF=X", name: "US Dollar / Swiss Franc", type: "Forex", exchange: "FX" },
  { symbol: "NZDUSD", rawSymbol: "NZDUSD=X", name: "New Zealand Dollar / US Dollar", type: "Forex", exchange: "FX" },
  { symbol: "EURGBP", rawSymbol: "EURGBP=X", name: "Euro / British Pound", type: "Forex", exchange: "FX" },
  { symbol: "EURJPY", rawSymbol: "EURJPY=X", name: "Euro / Japanese Yen", type: "Forex", exchange: "FX" },
  { symbol: "GBPJPY", rawSymbol: "GBPJPY=X", name: "British Pound / Japanese Yen", type: "Forex", exchange: "FX" },

  // Crypto
  { symbol: "BTCUSD", rawSymbol: "BTC-USD", name: "Bitcoin / USD", type: "Crypto", exchange: "Crypto" },
  { symbol: "ETHUSD", rawSymbol: "ETH-USD", name: "Ethereum / USD", type: "Crypto", exchange: "Crypto" },
  { symbol: "SOLUSD", rawSymbol: "SOL-USD", name: "Solana / USD", type: "Crypto", exchange: "Crypto" },
  { symbol: "XRPUSD", rawSymbol: "XRP-USD", name: "XRP / USD", type: "Crypto", exchange: "Crypto" },

  // Equities & ETFs
  { symbol: "SPY", rawSymbol: "SPY", name: "SPDR S&P 500 ETF Trust", type: "ETF", exchange: "NYSE" },
  { symbol: "QQQ", rawSymbol: "QQQ", name: "Invesco QQQ Trust", type: "ETF", exchange: "NASDAQ" },
  { symbol: "IWM", rawSymbol: "IWM", name: "iShares Russell 2000 ETF", type: "ETF", exchange: "NYSE" },
  { symbol: "NVDA", rawSymbol: "NVDA", name: "NVIDIA Corporation", type: "Equity", exchange: "NASDAQ" },
  { symbol: "AAPL", rawSymbol: "AAPL", name: "Apple Inc.", type: "Equity", exchange: "NASDAQ" },
  { symbol: "TSLA", rawSymbol: "TSLA", name: "Tesla, Inc.", type: "Equity", exchange: "NASDAQ" },
  { symbol: "MSFT", rawSymbol: "MSFT", name: "Microsoft Corporation", type: "Equity", exchange: "NASDAQ" },
  { symbol: "AMZN", rawSymbol: "AMZN", name: "Amazon.com, Inc.", type: "Equity", exchange: "NASDAQ" },
  { symbol: "META", rawSymbol: "META", name: "Meta Platforms, Inc.", type: "Equity", exchange: "NASDAQ" },
];

function cleanSymbol(raw: string): string {
  let s = raw.trim().toUpperCase();
  if (s.endsWith("=F")) s = s.slice(0, -2);
  else if (s.endsWith("=X")) s = s.slice(0, -2);
  else if (s.includes("-USD")) s = s.replace("-USD", "USD");
  return s;
}

function normalizeAssetType(quoteType: string | undefined, typeDisp: string | undefined): string {
  const t = (typeDisp || quoteType || "").toLowerCase();
  if (t.includes("future")) return "Futures";
  if (t.includes("currency") || t.includes("forex") || t === "fx") return "Forex";
  if (t.includes("crypto")) return "Crypto";
  if (t.includes("etf")) return "ETF";
  if (t.includes("index")) return "Index";
  if (t.includes("equity") || t.includes("stock")) return "Equity";
  return typeDisp || quoteType || "Asset";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim();

  if (!query) {
    return NextResponse.json({ instruments: [] });
  }

  const queryUpper = query.toUpperCase();

  // Filter local fallback list first
  const fallbackMatches = FALLBACK_INSTRUMENTS.filter(
    (item) =>
      item.symbol.toUpperCase().includes(queryUpper) ||
      item.name.toLowerCase().includes(query.toLowerCase())
  );

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
      query
    )}&quotesCount=12&newsCount=0&enableFuzzyQuery=false`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(4500),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ instruments: fallbackMatches });
    }

    const data = (await res.json()) as {
      quotes?: Array<{
        symbol?: string;
        shortname?: string;
        longname?: string;
        quoteType?: string;
        typeDisp?: string;
        exchDisp?: string;
        exchange?: string;
      }>;
    };

    const quotes = data.quotes || [];
    const seen = new Set<string>();
    const results: InstrumentResult[] = [];

    // Prioritize exact or prefix matches from the curated list if any
    for (const fb of fallbackMatches) {
      if (fb.symbol === queryUpper || fb.symbol.startsWith(queryUpper)) {
        if (!seen.has(fb.symbol)) {
          seen.add(fb.symbol);
          results.push(fb);
        }
      }
    }

    for (const q of quotes) {
      const raw = q.symbol;
      if (!raw) continue;
      const clean = cleanSymbol(raw);
      if (seen.has(clean)) continue;
      seen.add(clean);

      results.push({
        symbol: clean,
        rawSymbol: raw,
        name: q.shortname || q.longname || clean,
        type: normalizeAssetType(q.quoteType, q.typeDisp),
        exchange: q.exchDisp || q.exchange || "",
      });
    }

    // Add remaining fallback matches that weren't included yet
    for (const fb of fallbackMatches) {
      if (!seen.has(fb.symbol) && results.length < 15) {
        seen.add(fb.symbol);
        results.push(fb);
      }
    }

    return NextResponse.json({
      instruments: results.slice(0, 15),
    });
  } catch {
    // If online search times out or errors, gracefully use offline matches
    return NextResponse.json({ instruments: fallbackMatches });
  }
}
