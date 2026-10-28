export interface DeriveInstrument {
  symbol: string;
  rawSymbol: string;
  name: string;
  type: string;
  exchange: string;
}

type DeriveActiveSymbol = {
  underlying_symbol?: string;
  underlying_symbol_name?: string;
  underlying_symbol_type?: string;
  market?: string;
  submarket?: string;
  subgroup?: string;
};

type DeriveMessage = {
  msg_type?: string;
  active_symbols?: DeriveActiveSymbol[];
  error?: { message?: string };
};

let cachedSymbols: DeriveInstrument[] | null = null;
let cachedAt = 0;
let symbolsRequest: Promise<DeriveInstrument[]> | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

function instrumentType(item: DeriveActiveSymbol): string {
  const source = `${item.underlying_symbol_type ?? ""} ${item.market ?? ""} ${item.submarket ?? ""} ${item.subgroup ?? ""}`.toLowerCase();
  if (source.includes("synthetic") || source.includes("derived")) return "Synthetic Index";
  if (source.includes("forex") || source.includes("currency")) return "Forex";
  if (source.includes("crypto")) return "Crypto";
  if (source.includes("commodity")) return "Commodity";
  if (source.includes("stock") || source.includes("equity")) return "Equity";
  if (source.includes("index")) return "Index";
  return item.underlying_symbol_type || "Deriv";
}

async function requestActiveSymbols(): Promise<DeriveInstrument[]> {
  if (typeof WebSocket === "undefined") throw new Error("WebSocket support is unavailable in this runtime");

  return new Promise((resolve, reject) => {
    const socket = new WebSocket("wss://api.derivws.com/trading/v1/options/ws/public");
    let settled = false;
    const timeout = setTimeout(() => finish(new Error("Deriv symbol request timed out")), 8000);
    const finish = (error?: Error, symbols?: DeriveInstrument[]) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      try { socket.close(); } catch { /* Socket may already be closed. */ }
      if (error) reject(error);
      else resolve(symbols ?? []);
    };

    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ active_symbols: "brief", req_id: 1 }));
    }, { once: true });
    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(String(event.data)) as DeriveMessage;
        if (message.error) return finish(new Error(message.error.message || "Deriv symbol request failed"));
        if (message.msg_type !== "active_symbols" || !Array.isArray(message.active_symbols)) return;
        const symbols = message.active_symbols.flatMap((item) => {
          const rawSymbol = item.underlying_symbol?.trim();
          if (!rawSymbol) return [];
          return [{
            symbol: rawSymbol,
            rawSymbol,
            name: item.underlying_symbol_name?.trim() || rawSymbol,
            type: instrumentType(item),
            exchange: "Deriv",
          }];
        });
        finish(undefined, symbols);
      } catch {
        finish(new Error("Deriv returned an invalid symbol response"));
      }
    });
    socket.addEventListener("error", () => finish(new Error("Could not connect to Deriv")), { once: true });
  });
}

export async function getDeriveInstruments(): Promise<DeriveInstrument[]> {
  if (cachedSymbols && Date.now() - cachedAt < CACHE_TTL_MS) return cachedSymbols;
  if (!symbolsRequest) {
    symbolsRequest = requestActiveSymbols()
      .then((symbols) => {
        cachedSymbols = symbols;
        cachedAt = Date.now();
        return symbols;
      })
      .finally(() => { symbolsRequest = null; });
  }
  return symbolsRequest;
}
