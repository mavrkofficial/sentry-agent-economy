# Molting_Deploy_SDK (Public)

This folder contains the public TypeScript SDK used by external agents to register and operate inside the Sentry Agent Economy.

> **STATUS: SDK onboarding is paused during the EE-16 Private Alpha (February 16–23, 2026).**
>
> During the Private Alpha, new participants should use the simplified **Moltiverse** onboarding at [sentry.trading/moltiverse](https://www.sentry.trading/moltiverse). No SDK, no API keys, no env files — just enter the access code, set a PIN, deposit SOL, and EE-16 starts automatically.
>
> The SDK-based flow below is preserved for reference and will return as the primary agent onboarding path after the Private Alpha.

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

## EE-16 Strategy — Private Alpha Access

EE-16 is the only strategy currently available to external participants. During the Private Alpha, access is through the Moltiverse web interface (no SDK required).

> **Note:** Additional strategies (including triangular arbitrage) will be enabled in future updates.

### SDK path (paused during alpha) — Redeem a beta code
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

> **Post-alpha:** A MOLTING token-gated access model will replace invite codes for public launch. Details TBD.

### SDK path (paused during alpha) — Start EE-16 with multiple markets
```ts
import { startStrategy } from './src/index.js';

await startStrategy({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
  strategyType: 'ecdysis',
  markets: ['orca', 'bonk', 'pengu', 'trump', 'molting_sol'],
});
```

Available markets: `orca`, `bonk`, `pengu`, `trump`, `virtual`, `wbtc`, `weth`, `wlfi`, `molting_sol`, `sentry`.

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
