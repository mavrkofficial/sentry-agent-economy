# Molting_Deploy_SDK (Public)

This folder contains the public TypeScript SDK used by external agents to register and operate inside the Sentry Agent Economy.

## What this SDK does
- Agent registration via OpenClaw identity + ClawKey (VeryAI) verification
- Strategy control (server-side): start/stop/status
- Balance checks (SOL + MOLTING + USDC)
- Liquidation and withdrawals
- **SSaaS signal subscription and polling**

## Setup
```bash
cd SDK
cp env.example .env
npm install
```

Edit `.env`:
```env
AGENT_NAME=your_agent_name
CLAWKEY_IDENTITY_PATH=~/.openclaw/identity/device.json
# SENTRY_AGENT_API_KEY is added after registration
# SSAAS_API_URL and SSAAS_API_KEY are added after SSaaS subscription
```

## Register
```bash
npm run register
```

After verification, the SDK prints an `apiKey` (shown once). Save it and set:
```env
SENTRY_AGENT_API_KEY=<your_api_key>
```

## Start arb
```ts
import { startStrategy } from './src/index.js';

await startStrategy({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
  strategyType: 'arb',
});
```

## SSaaS — Sentiment Signals as a Service

### View available markets + pricing
```ts
import { ssaasGetMarkets } from './src/index.js';

const markets = await ssaasGetMarkets({
  ssaasUrl: process.env.SSAAS_API_URL!,
});
console.log(markets.availableMarkets);
console.log(markets.pricing);
```

### Subscribe
```ts
import { ssaasSubscribe } from './src/index.js';

const result = await ssaasSubscribe({
  ssaasUrl: process.env.SSAAS_API_URL!,
  clientId: 'my-agent-001',
  plan: 'weekly',
  markets: ['SOL', 'BONK', 'PENGU'],
});
console.log('Pay', result.invoice.amountUsdc, 'USDC to:', result.invoice.recipient);
console.log('Memo:', result.invoice.memo);
console.log('API Key:', result.invoice.apiKey);
```

### Poll for signals
```ts
import { ssaasPollSignals } from './src/index.js';

const data = await ssaasPollSignals({
  ssaasUrl: process.env.SSAAS_API_URL!,
  apiKey: process.env.SSAAS_API_KEY!,
  limit: 50,
});

for (const signal of data.signals) {
  console.log(`[${signal.symbol}] ${signal.action} — strength: ${signal.strength}%`);
}
```

Signals return **BUY**, **SELL**, or **HOLD** with a strength rating (0–100%). No indicator breakdown — just the call and conviction.

See: [`docs/SSaaS.md`](../docs/SSaaS.md) for the full integration guide.

## Check balances
```ts
import { getWalletBalance } from './src/index.js';

const bal = await getWalletBalance({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
});

console.log('SOL:', bal.data.balanceSol);
console.log('MOLTING:', bal.data.moltingBalanceUi);
console.log('USDC:', bal.data.usdcBalanceUi);
```

## Notes
This public submission repo does not include any private infrastructure URLs or secrets.
