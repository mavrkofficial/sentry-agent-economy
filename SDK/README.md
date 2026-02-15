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

## EE-16 Strategies — Beta Access (Invite Only)

EE-16 is currently in **closed beta**. Access requires a beta invite code provided by the Sentry team.

### Redeem your beta code
```ts
import { redeemBetaCode } from './src/index.js';

const result = await redeemBetaCode({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
  code: 'BETA-XXXXXXXX',
});

console.log('Beta access:', result.data.message);
// You can now start EE-16 strategies — no deposit, no fees.
```

Codes are single-use and expire 48 hours after generation. Once redeemed, you're in for the duration of the beta.

> **Post-beta:** A MOLTING token-gated access model will replace invite codes for public launch. Details TBD.

### Start EE-16 with multiple markets
```ts
import { startStrategy } from './src/index.js';

await startStrategy({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
  strategyType: 'ecdysis',
  markets: ['sol', 'bonk', 'pengu', 'trump', 'molting_sol'],
});
```

Available markets: `sol`, `bonk`, `pengu`, `trump`, `virtual`, `wbtc`, `weth`, `wlfi`, `molting_sol`, `sentry`, `usdc_sol`.

### Poll for signals (SSaaS)
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
