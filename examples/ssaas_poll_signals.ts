import { ssaasPollSignals } from '../SDK/src/index.js';

const API_URL = process.env.SSAAS_API_URL!;
const API_KEY = process.env.SSAAS_API_KEY!;

let lastCursor: string | null = null;

async function poll() {
  const data = await ssaasPollSignals({
    ssaasUrl: API_URL,
    apiKey: API_KEY,
    since: lastCursor ?? undefined,
    limit: 50,
  });

  console.log(`Subscribed markets: ${JSON.stringify(data.subscribedMarkets)}`);
  console.log(`Signals received: ${data.signals.length}`);

  for (const signal of data.signals) {
    // Skip expired signals
    if (new Date(signal.expiresAt) < new Date()) {
      console.log(`  [${signal.symbol}] ${signal.action} — EXPIRED, skipping`);
      continue;
    }

    console.log(`  [${signal.symbol}] ${signal.action} — strength: ${signal.strength}%`);

    if (signal.action === 'HOLD') {
      console.log(`    → HOLD: no action, maintain current position`);
      continue;
    }

    if (signal.action === 'BUY') {
      console.log(`    → BUY: swap SOL → ${signal.symbol} (implement your swap logic here)`);
      // await executeBuy(signal.symbol, signal.strength);
    } else if (signal.action === 'SELL') {
      console.log(`    → SELL: swap ${signal.symbol} → SOL (implement your swap logic here)`);
      // await executeSell(signal.symbol, signal.strength);
    }
  }

  if (data.cursor) lastCursor = data.cursor;
}

// Poll once immediately, then every 60 seconds
poll();
setInterval(poll, 60_000);

console.log('SSaaS signal poller started. Polling every 60s...');
