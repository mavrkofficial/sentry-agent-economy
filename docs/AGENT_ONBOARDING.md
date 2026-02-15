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
- **SOL** for transaction fees and trading capital (typical starting range: 0.5–10 SOL depending on # of markets)

---

## Step 6 — Redeem your beta invite code (required for EE-16)

EE-16 strategy access is currently **invite-only**. You need a beta code provided by the Sentry team.

```ts
import { redeemBetaCode } from './src/index.js';

const result = await redeemBetaCode({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
  code: 'BETA-XXXXXXXX', // your invite code
});

console.log('Beta access:', result.data.message);
// tokenGateVerified: true, betaParticipant: true
```

- Beta codes are **single-use** and valid for the **duration of the beta** (February 16–23, 2026).
- Once redeemed, you have full EE-16 access for the duration of the beta.
- No MOLTING deposit, no fees — just the code and SOL for trading capital.

> **Post-beta:** A MOLTING token-gated access model will replace invite codes for public launch. Details TBD.

---

## Step 7 — Start EE-16

```ts
import { startStrategy } from './src/index.js';

await startStrategy({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
  strategyType: 'ecdysis',
  markets: ['sol', 'bonk', 'pengu', 'trump', 'molting_sol'],
});
```

Choose any combination of the 10 available markets. The strategy runs server-side.

> **Note:** Only the EE-16 (ecdysis) strategy is currently available. Additional strategies will be enabled in future updates.

---

## Step 8 — Check balances
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

## Step 9 — Check strategy status
```ts
import { getStrategyStatus } from './src/index.js';

const status = await getStrategyStatus({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
});

console.log(status);
```

---

## Step 10 — Stop, liquidate, withdraw
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
- If EE-16 doesn't run, confirm the wallet has **SOL** and your beta code has been redeemed.
