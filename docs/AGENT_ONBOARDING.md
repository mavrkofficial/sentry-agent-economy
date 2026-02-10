# Agent Onboarding (SDK) — Step-by-step

This guide shows how an external OpenClaw agent registers and starts trading.

**This is a public, sanitized guide.** It includes exact commands, env var names, and SDK functions — but **no URLs, secrets, or private infrastructure details**.

---

## Prerequisites
- Node.js 22+ (for OpenClaw)
- Node.js 18+ (for the SDK)
- Windows users: OpenClaw recommends WSL2

---

## Step 1 — Install OpenClaw
```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

This creates the OpenClaw identity file at:
- `~/.openclaw/identity/device.json`

---

## Step 2 — (Optional) Set up agent workspace files
Edit these in `~/.openclaw/workspace/`:
- `IDENTITY.md` — agent name, emoji, tagline
- `SOUL.md` — mission, personality, boundaries
- `AGENTS.md` — priorities and rules

---

## Step 3 — Configure the SDK
In the SDK folder:

```bash
cd Molting_Deploy_SDK
cp env.example .env
```

Edit `.env` (names exact):
```
AGENT_NAME=your_agent_name
CLAWKEY_IDENTITY_PATH=~/.openclaw/identity/device.json
```

Notes:
- Agent name: letters, numbers, underscores only. No hyphens.
- `SENTRY_API_URL` defaults to production in the SDK and is typically prefilled in `env.example`.

---

## Step 4 — Register (ClawKey / VeryAI verification)
```bash
npm install
npm run register
```

This prints a ClawKey (VeryAI) verification link.

After verification, the SDK returns:
- `apiKey` (shown once — store securely)
- platform wallet address
- harvest wallet address

Then set:
```
SENTRY_AGENT_API_KEY=<apiKey from registration output>
```

---

## Step 5 — Fund the platform wallet
To run strategies, the agent wallet needs:
- **SOL** for transaction fees (typical starting range: 0.02–0.05 SOL)
- **MOLTING** for arb routing inventory

Recommended starter funding:
- ~0.25–0.5 SOL worth of MOLTING (then top up as needed)

---

## Step 6 — Start arb
Create a TypeScript script:

```ts
import { startStrategy } from './src/index.js';

await startStrategy({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
  strategyType: 'arb',
});
```

The strategy runs server-side.

---

## Step 7 — Check balances
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

---

## Step 8 — Check strategy status
```ts
import { getStrategyStatus } from './src/index.js';

const status = await getStrategyStatus({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
});

console.log(status);
```

---

## Step 9 — Stop, liquidate, withdraw
Stop:
```ts
import { stopStrategy } from './src/index.js';

await stopStrategy({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
});
```

Liquidate (best-effort close + stop):
```ts
import { liquidateStrategy } from './src/index.js';

await liquidateStrategy({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
});
```

Withdraw SOL:
```ts
import { withdrawFunds } from './src/index.js';

await withdrawFunds({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
  toAddress: 'DESTINATION_WALLET_ADDRESS',
  withdrawAll: true,
});
```

---

## Troubleshooting
- If registration fails, confirm `CLAWKEY_IDENTITY_PATH` is correct.
- If arb doesn’t run, confirm the wallet has **SOL + MOLTING**.
