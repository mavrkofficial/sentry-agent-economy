# EE-16 Simplified Onboarding — Moltiverse Changelog

**Date:** February 16, 2026
**Scope:** Backend (API + DB), Frontend (Sentry-PWA), Strategy Runner integration
**Motivation:** User feedback from Cruz (OpenClaw agent operator) during private alpha onboarding

---

## Why This Was Built

The original EE-16 onboarding flow required users to:

1. Have an OpenClaw agent with a ClawKey identity
2. Clone the SDK repo
3. Install Node.js 18+ and run `npm install`
4. Configure a `.env` file with agent name and identity path
5. Run `npm run register` to perform a cryptographic ClawKey verification
6. Save the API key and add it to `.env`
7. Ask their human to send SOL to the generated platform wallet
8. Redeem a beta invite code via SDK or curl
9. Choose which markets to trade (from a list of 10)
10. Start the strategy via SDK or curl
11. Monitor via curl, withdraw via curl

This flow was designed for **agent-to-agent interaction** — an OpenClaw agent reading the SDK doc and executing commands on behalf of its human. It worked well for that use case, but when we tried onboarding a real user (Cruz), the feedback was immediate and clear:

> "This isn't simple. Simple is you give me a CA or UI and I can connect a wallet and deposit. Most people will drop off with this. Make it one click."

Cruz wasn't saying the engine was bad. He was saying the **delivery mechanism** had too much surface area for the end user. Users don't care about SDK repos, API keys, or curl commands. They want to deposit capital and have a strategy run on their behalf.

The core insight: **the complexity of the engine and the complexity of accessing the engine are two separate problems.** EE-16 can be sophisticated under the hood while being dead simple to use.

---

## What Changed

### 1. New Database Table: `moltiverse_users`

**File:** `src/db.ts`

Added a new table that serves as a simplified authentication layer mapping a human-readable Molty-Code + hashed PIN to an existing `agent_accounts` entry:

```sql
CREATE TABLE IF NOT EXISTS moltiverse_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    molty_code TEXT UNIQUE NOT NULL,     -- Format: M-XXXX (e.g. M-84G5)
    pin_hash TEXT NOT NULL,              -- bcrypt hash of 4-digit numeric PIN
    agent_id INTEGER NOT NULL,           -- FK → agent_accounts.id
    beta_code_used TEXT NOT NULL,         -- The universal alpha code
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agent_accounts(id)
)
```

**Key design decision:** Moltiverse users are NOT a separate system. They ARE regular `agent_accounts` + `agent_wallets` + `agent_strategies` entries under the hood. The `moltiverse_users` table just provides the simplified auth facade. This means:

- The strategy runner picks up Moltiverse users automatically with **zero changes to the runner**
- All existing PnL tracking, swap event logging, and cycle reporting works out of the box
- The same `agent_strategies` table controls their strategy config and enabled status

### 2. Universal Alpha Code

**File:** `src/api.ts`

Instead of generating individual invite codes for each user, we use a **single universal access code** that everyone shares.

- Set via environment variable: `MOLTIVERSE_ALPHA_CODE` (default: `MOLTY-ALPHA`)
- One code for the entire Private Alpha
- People can share it freely — "DM me for the Private Alpha invite code"
- Adoption tracked by counting `moltiverse_users` rows
- The `GET /api/moltiverse/stats` endpoint returns the total user count

This eliminates all code generation, code distribution, and code management overhead.

### 3. API Endpoints

**File:** `src/api.ts`

Four endpoints were added under `/api/moltiverse/`:

#### `POST /api/moltiverse/register`

**Input:** `{ accessCode, pin }`
**Output:** `{ moltyCode, walletAddress }`

What it does:
1. Validates the access code against the universal `MOLTIVERSE_ALPHA_CODE`
2. Validates PIN format (exactly 4 digits, numbers only)
3. Generates a unique Molty-Code (`M-` + 4 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789`)
4. Creates an `agent_accounts` entry (agent name: `molty_mXXXX`)
5. Generates a Solana keypair, encrypts the private key, stores in `agent_wallets`
6. Creates an `agent_strategies` entry with:
   - `strategyType: 'ecdysis'`
   - `markets:` ALL 10 markets (orca, bonk, pengu, trump, virtual, wbtc, weth, wlfi, molting_sol, sentry)
   - `tokenGateVerified: true`
   - `enabled: 1` (starts immediately)
   - `moltiverseUser: true` (flag for identification)
7. Hashes the PIN with bcrypt and creates the `moltiverse_users` record
8. Returns the wallet address and Molty-Code

**No market selection.** The engine trades all 10 markets and only acts when signals are strong enough. The user doesn't choose — the math chooses.

#### `POST /api/moltiverse/login`

**Input:** `{ moltyCode, pin }`
**Output:** wallet info, SOL balance, active positions with cost basis, 24h PnL, recent trades

#### `POST /api/moltiverse/withdraw`

**Input:** `{ moltyCode, pin, toAddress }`
**Output:** `{ withdrawnSol, txSignature, positionsLiquidated }`

What it does:
1. Authenticates via Molty-Code + PIN
2. Stops the strategy (`enabled = 0`)
3. Scans all token holdings and sells each position back to SOL via Jupiter
4. Transfers all available SOL (minus rent reserve) to the destination address

#### `GET /api/moltiverse/stats`

**Output:** `{ totalUsers }`

Public endpoint. Returns the count of registered Moltiverse users. Used by the frontend to display "X users in the alpha."

### 4. Frontend: Toggle-Based UI

**File:** `Sentry-PWA/src/pages/MoltiverseComingSoon.tsx`
**File:** `Sentry-PWA/src/style.css`

The Moltiverse page at `sentry.trading/moltiverse` now features a **toggle-based onboarding card** with two tabs:

**Tab 1: "EE-16 Private Alpha"**
- Shows user count ("X users in the alpha")
- Access code input
- 4-digit PIN setup (numeric only, masked)
- "Activate" button
- On success: displays wallet address, Molty-Code, and PIN with instructions

**Tab 2: "View Performance"**
- Molty-Code input
- PIN input (numeric only, masked)
- "View Dashboard" button
- On success: full dashboard showing:
  - SOL balance
  - 24h PnL (green/red)
  - Active position count
  - Deposit address
  - Open positions with symbol, amount, and cost basis
  - Recent trades with direction (BUY/SELL), symbol, SOL amount, date
  - Withdraw section with destination input and "Close All & Withdraw" button

The toggle UI is inspired by the Colosseum "I'm a Human / I'm an Agent" toggle pattern — a clean bordered container with two buttons that switch between views. The active tab gets a subtle highlight border and background.

The existing live EE-16 charts, arb feed, and Kalshi scanner remain below the onboarding card.

### 5. Strategy Runner Integration

**No changes needed.** This is the key architectural win.

Because Moltiverse registration creates standard `agent_accounts` + `agent_wallets` + `agent_strategies` entries, the existing `runStrategyCycle()` function in `agent_strategy_runner.ts` picks up Moltiverse users automatically. Zero lines changed in the runner.

---

## The Molty-Code Format

Format: `M-` followed by 4 characters from a clean charset.

**Character set:** `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (31 characters)
- Excludes: `I` (looks like `1`), `O` (looks like `0`), `L` (looks like `1`), `0` (looks like `O`), `1` (looks like `I`/`L`)
- Total unique codes: 31^4 = **923,521**

Examples: `M-84G5`, `M-K7NR`, `M-3WHP`

The format is short enough to write on a napkin, text to a friend, or remember.

---

## Before vs. After

| Step | Before (Agent SDK Flow) | After (Moltiverse Flow) |
|------|------------------------|------------------------|
| 1 | Have OpenClaw agent + identity file | Go to sentry.trading/moltiverse |
| 2 | Clone SDK repo | Enter access code |
| 3 | Install Node.js + npm install | Set a 4-digit PIN |
| 4 | Configure .env file | Receive wallet address + Molty-Code |
| 5 | Run ClawKey verification | Deposit SOL to wallet |
| 6 | Save API key | *Done — EE-16 is live* |
| 7 | Human sends SOL to wallet | — |
| 8 | Redeem beta code via curl | — |
| 9 | Choose markets | — |
| 10 | Start strategy via curl | — |
| 11 | Monitor via curl | Enter Molty-Code + PIN to check |

**10+ steps → 5 steps.** No SDK, no API keys, no env files, no curl, no market selection.

---

## What's NOT Changed

- **The EE-16 engine itself** — same 16 indicators, same ensemble voting, same signal computation, same execution logic
- **The strategy runner** — zero modifications, Moltiverse users are picked up automatically
- **The agent SDK flow** — still works for OpenClaw agents who want the full control path
- **PnL tracking** — same `strategy_cycle_pnl` and `agent_swap_events` tables
- **Trade execution** — same Jupiter/Orca routing, same priority fees, same on-chain execution

---

## Security Notes

- **PINs are bcrypt-hashed** — the raw PIN is never stored
- **Private keys are encrypted at rest** using the existing `encryptPrivateKey()` function from `src/encryption.js`
- **Molty-Code + PIN authentication** uses constant-time bcrypt comparison
- **No session tokens** — every request requires Molty-Code + PIN (stateless auth)
- **Withdrawal requires authentication** — Molty-Code + PIN + destination address

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MOLTIVERSE_ALPHA_CODE` | `MOLTY-ALPHA` | Universal access code for the Private Alpha |

---

## Files Modified

| File | Change |
|------|--------|
| `src/db.ts` | Added `moltiverse_users` table creation + indexes |
| `src/api.ts` | Added `/api/moltiverse/register`, `/api/moltiverse/login`, `/api/moltiverse/withdraw`, `/api/moltiverse/stats` endpoints; universal alpha code via env var |
| `Sentry-PWA/src/pages/MoltiverseComingSoon.tsx` | Rebuilt `MoltiverseOnboarding` component with toggle tabs (Private Alpha / View Performance) |
| `Sentry-PWA/src/style.css` | Added toggle bar styles, updated onboarding layout to single-panel with tabs |
| `EE16_Simplified_ChangeLog.md` | This file |

---

## API Reference (Moltiverse)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/moltiverse/register` | POST | Universal alpha code | Register, get wallet + Molty-Code |
| `/api/moltiverse/login` | POST | Molty-Code + PIN | View balance, positions, PnL |
| `/api/moltiverse/withdraw` | POST | Molty-Code + PIN | Liquidate all + withdraw SOL |
| `/api/moltiverse/stats` | GET | None (public) | Total registered user count |

---

*This is what Cruz meant by "make it one click." The engine is the same. The experience is radically simpler.*
