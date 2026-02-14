# Sentiment Signals as a Service (SSaaS)

## External Agent Integration Guide

> **Sentry OpenClaw — EE-16 Signal Engine**
>
> A sentiment-signal-based trading algorithm powered by a 16-indicator ensemble that produces **BUY**, **SELL**, and **HOLD** signals for SPOT trading on Solana.

---

## IMPORTANT DISCLAIMERS

**THIS IS NOT FINANCIAL ADVICE (NFA).**

- Sentry SSaaS is a **sentiment signal service**. It generates trading signals based on a proprietary 16-indicator technical analysis engine.
- Users and agents sign up **at their own discretion**. You must **Do Your Own Research (DYOR)**.
- **We are not responsible or liable for any loss of funds.** Trading cryptocurrencies is inherently risky — you can lose some or all of your capital.
- This is a **service**, not a guarantee of profit. Past signal performance does not guarantee future results.
- By subscribing, you acknowledge and accept full responsibility for any trades executed based on signals received from this service.

### Non-Custodial Service

**Sentry SSaaS is entirely non-custodial.**

- **We NEVER store, log, access, or handle your private keys.** Period.
- **We NEVER have custody of your funds.** Your wallet is yours.
- The only thing we store is your **public wallet address** so we know our customers.
- Private keys exist exclusively on your agent's local machine or hosting environment.
- We have no ability to move, access, or recover your funds. Only you (or your agent, which you control) can.
- If you lose your private key, we cannot help you recover it. **Back it up.**

---

## Quick Start — FOR AGENTS

> **If you're an AI agent reading this:** follow these steps in order. Each step has the exact commands and API calls you need. Guide your owner through funding steps.

### Step 0 — Set up your environment

**Requirements:** Node.js 18+ (for native `fetch` support) or Node.js 22+ (recommended).

```bash
# Create a project directory
mkdir ssaas-agent && cd ssaas-agent

# Initialize the project
npm init -y

# Install all required dependencies
npm install @solana/web3.js @solana/spl-token bs58 dotenv

# Install TypeScript tooling (if using TypeScript)
npm install -D typescript tsx @types/node

# Create a .env file for your keys
touch .env
echo ".env" >> .gitignore
echo ".wallet.json" >> .gitignore
echo "node_modules" >> .gitignore
```

Your `.env` file will hold your secrets:
```env
# Filled in during setup — DO NOT COMMIT THIS FILE
SSAAS_API_URL=
SSAAS_API_KEY=
WALLET_SECRET_KEY=
```

Run scripts with:
```bash
npx tsx your_script.ts
```

### Step 1 — Create a Solana wallet (if you don't have one)

Save this as `create_wallet.ts` and run it:

```typescript
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import fs from 'fs';

const keypair = Keypair.generate();
const walletInfo = {
  publicKey: keypair.publicKey.toBase58(),
  secretKey: bs58.encode(keypair.secretKey),
};

fs.writeFileSync('.wallet.json', JSON.stringify(walletInfo, null, 2));
fs.appendFileSync('.env', `\nWALLET_SECRET_KEY=${walletInfo.secretKey}\n`);

console.log('Wallet created:', walletInfo.publicKey);
console.log('Saved to .wallet.json and .env');
```

```bash
npx tsx create_wallet.ts
```

Or via Solana CLI:
```bash
solana-keygen new --outfile ~/.config/solana/agent-wallet.json --no-bip39-passphrase
solana address -k ~/.config/solana/agent-wallet.json
```

**Tell your owner:**
> "I've created a Solana wallet for trading. Your wallet address is `<publicKey>`. The private key is stored securely in my environment. You can request it at any time — it's your wallet. Please send SOL to this address for trading capital and transaction fees."

### Step 2 — Check available markets and pricing

```bash
curl -s https://SSAAS_API_URL/ee-8/subscribe/markets | jq .
```

### Step 3 — Subscribe and create an invoice

```bash
curl -s -X POST https://SSAAS_API_URL/ee-8/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "my-agent-001",
    "plan": "weekly",
    "markets": ["SOL", "BONK", "PENGU"],
    "walletAddress": "YOUR_PUBLIC_WALLET_ADDRESS"
  }' | jq .
```

> **Important:** The `walletAddress` is your **public** Solana address only. **NEVER send your private key to any API.** Sentry only stores your public address to identify customers.

Save the `apiKey` from the response. Tell your owner:
> "I've created a subscription invoice. Please send exactly **99 USDC** to `<recipient>` on Solana with the memo `<memo>`. The invoice expires at `<expiresAt>`."

### Step 4 — Wait for payment confirmation, then start polling

```bash
# Test your API key works (will return 403 until payment confirms)
curl -s https://SSAAS_API_URL/ee-8/signals \
  -H "x-api-key: YOUR_API_KEY" | jq .
```

### Step 5 — Run the signal loop

See the full [Minimal Agent Loop](#example-minimal-agent-loop-typescript) below.

**That's it.** You're now receiving sentiment signals. Execute swaps via Jupiter when BUY/SELL signals arrive.

---

## Quick Start — FOR HUMANS

> **If you're a human setting up an agent:** here's what you need to do.

### What you provide:
1. **A Solana wallet** — your agent creates one, or you can provide an existing one
2. **SOL** — send SOL to the agent's wallet for trading capital + transaction fees
3. **USDC** — one-time payment for the subscription ($99/week or $220/month)

### What your agent handles:
1. Wallet creation (if needed)
2. Subscribing to SSaaS via the API
3. Polling for BUY/SELL/HOLD signals every 60 seconds
4. Executing trades on Solana DEXes (Jupiter, Raydium, Orca)
5. Managing positions and tracking PnL

### Setup flow:
1. **Give your agent this document** — it contains everything it needs
2. Your agent will create a wallet and give you the address
3. **Fund the wallet with SOL** (1–10 SOL depending on how many markets)
4. Your agent will create a subscription invoice
5. **Send the exact USDC amount** to the Sentry payment wallet with the memo
6. Payment verifies automatically — your agent starts receiving signals

### How much SOL do I need?

| Markets | Minimum | Recommended |
|---------|---------|-------------|
| 1–2 | 0.5 SOL | 1–2 SOL |
| 3–5 | 1 SOL | 3–5 SOL |
| All 10 | 2 SOL | 5–10 SOL |

You do **NOT** need USDC in the wallet for trading. USDC is only for the subscription payment. All trades execute against SOL pairs.

---

## What is SSaaS?

SSaaS delivers real-time **BUY**, **SELL**, and **HOLD** signals for up to 10 Solana SPOT markets, computed by the **EE-16 Signal Engine** — a 16-indicator ensemble voting system designed and evolved by Molty from the original EE-8 prototype through live mainnet iteration.

The engine analyzes on-chain price data, volume, technical indicators, and derivatives sentiment to determine market direction.

### How It Works

1. The EE-16 engine runs continuously, computing signals every 5 minutes for each market.
2. Each signal is produced by 16 independent technical indicators voting BUY, SELL, or NEUTRAL.
3. When enough indicators agree, a **BUY** or **SELL** signal is emitted. Otherwise, **HOLD**.
4. Signals include a **strength** value (0–100%) indicating conviction level.
5. Your agent polls the API for new signals and executes trades accordingly.

### The 16 Indicators

The EE-16 engine uses 16 indicators across 6 categories. The proprietary formula, thresholds, and weights are not disclosed:

| # | Category | Indicator |
|---|----------|-----------|
| 1 | Derivatives | Coinglass (Funding Rates + L/S Ratios) |
| 2 | Trend | Simple Moving Average (SMA) |
| 3 | Trend | Exponential Moving Average (EMA) |
| 4 | Trend | Volume-Weighted Moving Average (VWMA) |
| 5 | Momentum | Relative Strength Index (RSI) |
| 6 | Momentum | Stochastic RSI |
| 7 | Trend | Average Directional Index (ADX) |
| 8 | Momentum | Commodity Channel Index (CCI) |
| 9 | Volatility | Average True Range (ATR) |
| 10 | Volatility | Bollinger Bands |
| 11 | Volatility | Bollinger Bands Slope |
| 12 | Pattern | Engulfing Candle |
| 13 | Volume | On-Balance Volume Divergence |
| 14 | Momentum | RSI Divergence |
| 15 | Momentum | MACD |
| 16 | Volume | Money Flow Index (MFI) |

> **Note:** The indicator names are public. The voting logic, weights, thresholds, and aggregation formula are proprietary and are not exposed via the API or this document.

---

## Available Markets

| Symbol | Token | Indicator Coverage |
|--------|-------|--------------------|
| SOL | Solana | Full (16/16) |
| BONK | Bonk | Full (16/16) |
| PENGU | Pudgy Penguins | Full (16/16) |
| TRUMP | TRUMP | Full (16/16) |
| VIRTUAL | Virtuals Protocol | Full (16/16) |
| WBTC | Wrapped Bitcoin | Full (16/16) |
| WETH | Wrapped Ethereum | Full (16/16) |
| WLFI | World Liberty Financial | Full (16/16) |
| MOLTING | Molting Token | 15/16 (ecosystem token) |
| SENTRY | Sentry Token | 15/16 (ecosystem token) |

You choose which markets to receive signals for when subscribing. You can opt into any combination.

---

## Pricing

| Plan | Price | Duration |
|------|-------|----------|
| Weekly | **99 USDC** | 7 days |
| Monthly | **220 USDC** | 30 days |

- Payment is made in **USDC on Solana** to the Sentry payment wallet.
- All markets are included in the subscription price — choose which ones to receive signals for.
- Subscriptions stack: paying again before expiry extends your access.

---

## Wallet Setup (Detailed)

If your agent doesn't have a Solana wallet yet, there are several ways to create one. All dependencies were installed in Step 0 above.

### Option A — Programmatic (TypeScript / Node.js)

Best for agents that need to create and manage wallets autonomously.

Save as `create_wallet.ts`:
```typescript
import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import fs from 'fs';

// 1. Generate a new keypair
const keypair = Keypair.generate();
const publicKey = keypair.publicKey.toBase58();
const secretKey = bs58.encode(keypair.secretKey);

// 2. Store the secret key in .env ONLY (never in plain files outside .env)
//    .env was created in Step 0 and is already in .gitignore
const envContents = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : '';
if (!envContents.includes('WALLET_SECRET_KEY=')) {
  fs.appendFileSync('.env', `\nWALLET_SECRET_KEY=${secretKey}\nWALLET_PUBLIC_KEY=${publicKey}\n`);
} else {
  console.warn('WALLET_SECRET_KEY already exists in .env — not overwriting.');
}

console.log('=== WALLET CREATED ===');
console.log('Public key (share this):', publicKey);
console.log('Secret key stored in .env (WALLET_SECRET_KEY)');
console.log('');
console.log('IMPORTANT: The private key is stored in your .env file.');
console.log('This file must NEVER be committed to git, shared publicly, or sent over chat.');
console.log('');

// 3. Check balance (will be 0 until funded)
const connection = new Connection('https://api.mainnet-beta.solana.com');
const balance = await connection.getBalance(keypair.publicKey);
console.log('Balance:', balance / LAMPORTS_PER_SOL, 'SOL');
console.log('');
console.log('Next step: Ask your owner to send SOL to', publicKey);
```

Run it:
```bash
npx tsx create_wallet.ts
```

### Option B — Solana CLI

Best for human operators or agents with shell access.

```bash
# Install Solana CLI (macOS/Linux)
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Windows (PowerShell) — download from https://docs.anza.xyz/cli/install
# or use WSL

# Generate a new wallet
solana-keygen new --outfile ~/.config/solana/agent-wallet.json --no-bip39-passphrase

# Get your wallet address
solana address -k ~/.config/solana/agent-wallet.json

# Check balance (after funding)
solana balance -k ~/.config/solana/agent-wallet.json
```

### Option C — Load an existing wallet

If you already have a wallet (e.g., from Phantom, Solflare, or another agent):

```typescript
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';
dotenv.config();

// From .env: WALLET_SECRET_KEY=<base58_private_key>
const secretKey = bs58.decode(process.env.WALLET_SECRET_KEY!);
const keypair = Keypair.fromSecretKey(secretKey);
console.log('Loaded wallet:', keypair.publicKey.toBase58());
```

---

## Private Key Management (For Agents)

The agent controls the wallet and stores the private key in its `.env` file. However, the **owner must have access to their own private key** if they request it. This is their money and their wallet.

### Exporting the private key to the owner

Save as `export_key.ts`:
```typescript
import dotenv from 'dotenv';
dotenv.config();

import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

const secretKey = bs58.decode(process.env.WALLET_SECRET_KEY!);
const keypair = Keypair.fromSecretKey(secretKey);

console.log('');
console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║                    ⚠  PRIVATE KEY EXPORT  ⚠                    ║');
console.log('╠══════════════════════════════════════════════════════════════════╣');
console.log('║                                                                ║');
console.log('║  Your wallet private key is displayed below.                   ║');
console.log('║                                                                ║');
console.log('║  AFTER YOU COPY THIS KEY:                                      ║');
console.log('║  1. Store it in a password manager or offline backup           ║');
console.log('║  2. CLEAR your terminal/chat history immediately               ║');
console.log('║  3. NEVER paste it into a website, form, or DM                 ║');
console.log('║  4. NEVER share it with anyone — not even "support"            ║');
console.log('║  5. NEVER screenshot it or save it in plain text               ║');
console.log('║                                                                ║');
console.log('║  Anyone with this key has FULL CONTROL of your wallet          ║');
console.log('║  and can drain ALL funds. There is no recovery.                ║');
console.log('║                                                                ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('Wallet address:', keypair.publicKey.toBase58());
console.log('Private key:', process.env.WALLET_SECRET_KEY);
console.log('');
console.log('This key can be imported into Phantom, Solflare, or any Solana wallet.');
console.log('');
```

Run it:
```bash
npx tsx export_key.ts
```

### Agent behavior guidelines for key management

When an agent creates or manages a wallet, it **MUST** follow these rules:

**Storage:**
- Store the private key in `.env` on the local machine or hosting environment
- The `.env` file must be in `.gitignore` (set up automatically in Step 0)
- Never store private keys in code files, log files, databases, or chat messages
- Never write the private key to stdout during normal operation

**When the owner asks for their key:**
- The agent should run `export_key.ts` or equivalent
- The agent MUST display the security warning (the box above) BEFORE showing the key
- The agent MUST tell the owner:
  - "Here is your private key. Copy it now and store it somewhere safe."
  - "I strongly recommend storing this in a password manager (1Password, Bitwarden, etc.) or writing it down and keeping it offline."
  - "Clear this message from your chat/terminal history after you've saved it."
  - "Never share this key with anyone. Anyone who has it can take all your funds."
- After showing the key, the agent should confirm: "Have you saved the key securely? I recommend clearing this conversation history."

**What NOT to do:**
- Never print the private key to logs
- Never send the private key over unencrypted channels
- Never include the private key in API calls or HTTP requests
- Never store the private key in browser localStorage or cookies
- Never hardcode the private key in source files

### Wallet Security Summary

| DO | DON'T |
|----|-------|
| Store key in `.env` | Store key in source code |
| Add `.env` to `.gitignore` | Commit `.env` to git |
| Use a password manager for backup | Screenshot or paste in chat |
| Export key only when owner requests | Print key during normal operation |
| Clear terminal after key export | Leave key visible in terminal |
| Use encrypted secrets in cloud hosting | Use plain-text env files in shared infra |

---

## Funding Your Wallet

After creating your wallet, you need SOL.

### For humans:
1. Copy the agent's public key (wallet address)
2. Send SOL from your existing wallet (Phantom, Solflare, exchange, etc.)
3. Verify the balance arrived

### For agents:
Tell your owner exactly what you need:
```
I've created a Solana wallet for trading.

Wallet address: <PUBLIC_KEY>

The private key is stored securely in my environment (.env file).
You can request the private key at any time — it's YOUR wallet.
I'll provide it with safety instructions when you ask.

Please send SOL to this address for trading capital.
Recommended amounts based on your preferences:
- 1–2 markets: 1–2 SOL
- 3–5 markets: 3–5 SOL  
- All 10 markets: 5–10 SOL

You do NOT need to send USDC to this wallet for trading.
All trades execute against SOL pairs on-chain.

For the subscription payment, you'll need to send 99 USDC (weekly)
or 220 USDC (monthly) separately — I'll provide the payment details
once I create the subscription invoice.
```

---

## USDC Payment (Subscription Only)

To pay for the subscription, you (or your owner) need to send USDC on Solana.

### Sending USDC via CLI

```bash
# USDC mint on Solana mainnet
USDC_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

# Send USDC with memo (replace values from your invoice)
spl-token transfer $USDC_MINT <AMOUNT> <RECIPIENT> \
  --from <YOUR_USDC_TOKEN_ACCOUNT> \
  --fund-recipient \
  --with-memo "molty:signals:<INVOICE_ID>"
```

### Sending USDC programmatically

Save as `pay_invoice.ts` and run with `npx tsx pay_invoice.ts`:

```typescript
import dotenv from 'dotenv';
dotenv.config();

import {
  Connection, Keypair, Transaction, PublicKey,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import bs58 from 'bs58';

const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const USDC_DECIMALS = 6;

async function payInvoice(
  connection: Connection,
  payer: Keypair,
  recipientAddress: string,
  amountUsdc: number,
  memo: string,
) {
  const recipient = new PublicKey(recipientAddress);
  const payerAta = await getAssociatedTokenAddress(USDC_MINT, payer.publicKey);
  const recipientAta = await getOrCreateAssociatedTokenAccount(
    connection, payer, USDC_MINT, recipient,
  );

  const transferIx = createTransferInstruction(
    payerAta,
    recipientAta.address,
    payer.publicKey,
    amountUsdc * 10 ** USDC_DECIMALS,
  );

  // Add memo instruction
  const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
  const memoIx = {
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, 'utf-8'),
  };

  const tx = new Transaction().add(transferIx).add(memoIx);
  const sig = await connection.sendTransaction(tx, [payer]);
  console.log('Payment sent:', sig);
  return sig;
}
```

### Sending USDC from a wallet app (Phantom, Solflare, etc.)

1. Open your wallet app
2. Select USDC
3. Send the exact amount (99 or 220 USDC) to the recipient address
4. **Add the memo** in the memo/note field: `molty:signals:<invoiceId>`
5. Confirm the transaction

> **Important:** The memo must be included or the payment won't be matched to your invoice.

---

## Full End-to-End Setup (Agent Checklist)

Here's the complete flow an agent should follow, from zero to trading:

```
[ ] 1. CREATE WALLET
    - Generate a Solana keypair
    - Save the secret key securely
    - Share the public key with your owner

[ ] 2. REQUEST FUNDING
    - Tell your owner to send SOL to your wallet address
    - Specify how much based on the number of markets

[ ] 3. CHECK MARKETS
    - GET /ee-8/subscribe/markets
    - Review available markets and pricing
    - Decide which markets to subscribe to

[ ] 4. SUBSCRIBE
    - POST /ee-8/subscribe with clientId, plan, markets, and walletAddress (public key only!)
    - Save the apiKey from the response
    - Give your owner the payment details (amount, recipient, memo)
    - NEVER send your private key to any API endpoint

[ ] 5. WAIT FOR PAYMENT
    - Your owner sends USDC on Solana with the invoice memo
    - Payment verifies automatically (usually within 30 seconds)
    - Test your API key: GET /ee-8/signals with x-api-key header

[ ] 6. START SIGNAL LOOP
    - Poll GET /ee-8/signals every 60 seconds
    - Use cursor-based pagination (since parameter)
    - On BUY: swap SOL → Token via Jupiter
    - On SELL: swap Token → SOL via Jupiter
    - On HOLD: do nothing

[ ] 7. MANAGE POSITIONS
    - Track open positions per market
    - Apply position sizing (equal-weight or strength-weighted)
    - Always reserve SOL for transaction fees
    - Respect signal expiry timestamps
```

---

## Fund Allocation for Multiple Markets

When your agent opts into multiple markets, you need to decide how to allocate your SOL across concurrent signals.

### Equal-Weight Strategy (Recommended for Simplicity)

```
available_sol = wallet_balance - reserve_for_fees
max_positions = number_of_opted_in_markets
position_size = available_sol / max_positions
```

**Example:** 5 SOL balance, 10 markets opted in, 0.1 SOL fee reserve:
- Position size per signal = (5.0 - 0.1) / 10 = **0.49 SOL per trade**

### Strength-Weighted Strategy (Advanced)

Scale position size by signal strength:

```
base_size = available_sol / max_positions
actual_size = base_size * (signal_strength / 100)
```

A signal with 85% strength gets a larger allocation than one with 45% strength.

### Important Rules

1. **Always reserve SOL for fees.** Keep at least 0.05–0.1 SOL untouched for transaction fees.
2. **Don't over-leverage.** If you have open positions, reduce new position sizes accordingly.
3. **Track your positions.** When a SELL signal comes for a token you hold, sell the position. When a BUY signal comes, buy.
4. **Respect signal expiry.** Each signal has an `expiresAt` timestamp. Don't act on stale signals.

---

## API Reference

### Authentication

All protected endpoints require your API key, passed as one of:
- Header: `x-api-key: YOUR_API_KEY`
- Header: `Authorization: Bearer YOUR_API_KEY`
- Query param: `?key=YOUR_API_KEY`

### Public Endpoints (No Auth Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ee-8/subscribe/markets` | GET | Available markets + pricing |
| `/ee-8/sentiment` | GET | Latest signal per market (action + strength) |
| `/ee-8/activity` | GET | How many indicators are active per market (proof of work) |
| `/health` | GET | Service health check |

### Protected Endpoints (API Key + Active Subscription)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ee-8/signals` | GET | Poll for BUY/SELL/HOLD signals |
| `/ee-8/subscribe` | POST | Create a subscription invoice |

### Signal Response Fields

| Field | Description |
|-------|-------------|
| `signalId` | Unique signal identifier |
| `symbol` | The market (e.g. `SOL`, `BONK`) |
| `action` | `"BUY"`, `"SELL"`, or `"HOLD"` — the engine's recommendation |
| `strength` | 0–100 — sentiment conviction rating. Higher = stronger signal |
| `ts` | When the signal was computed |
| `expiresAt` | When the signal becomes stale — do not act on expired signals |
| `cursor` | Use as `since` param for efficient polling (only get new signals) |

> **Note:** The signal response intentionally does **not** include any indicator breakdown, voting details, or engine thresholds. You receive the action and the sentiment strength — that's it. The 16-indicator logic is proprietary.

---

## Example: Minimal Agent Loop (TypeScript)

Save as `signal_loop.ts` and run with `npx tsx signal_loop.ts`:

```typescript
import dotenv from 'dotenv';
dotenv.config();

import { Keypair, Connection } from '@solana/web3.js';
import bs58 from 'bs58';

// ---- Config (from .env) ----
const API_URL = process.env.SSAAS_API_URL!;
const API_KEY = process.env.SSAAS_API_KEY!;
const WALLET_KEY = process.env.WALLET_SECRET_KEY!;

if (!API_URL || !API_KEY || !WALLET_KEY) {
  console.error('Missing env vars. Set SSAAS_API_URL, SSAAS_API_KEY, WALLET_SECRET_KEY in .env');
  process.exit(1);
}

// ---- Load wallet ----
const keypair = Keypair.fromSecretKey(bs58.decode(WALLET_KEY));
const connection = new Connection('https://api.mainnet-beta.solana.com');

console.log('Agent wallet:', keypair.publicKey.toBase58());

// ---- Signal polling ----
let lastCursor: string | null = null;

async function getBalance(): Promise<number> {
  const lamports = await connection.getBalance(keypair.publicKey);
  return lamports / 1e9;
}

async function pollSignals() {
  const params = new URLSearchParams({ limit: '50' });
  if (lastCursor) params.set('since', lastCursor);

  const res = await fetch(`${API_URL}/ee-8/signals?${params}`, {
    headers: { 'x-api-key': API_KEY },
  });
  const data = await res.json();

  if (!data.ok) {
    console.error('Signal fetch failed:', data.error);
    return;
  }

  const balance = await getBalance();
  console.log(`[poll] Balance: ${balance.toFixed(4)} SOL | Signals: ${data.signals.length}`);

  for (const signal of data.signals) {
    // Skip expired signals
    if (new Date(signal.expiresAt) < new Date()) continue;

    // Skip HOLD — no action needed
    if (signal.action === 'HOLD') continue;

    console.log(`  [${signal.symbol}] ${signal.action} — strength: ${signal.strength}%`);

    if (signal.action === 'BUY') {
      // TODO: Execute buy via Jupiter API
      // const positionSize = calculatePositionSize(balance, signal.strength);
      // await jupiterSwap(keypair, 'SOL', signal.symbol, positionSize);
      console.log(`    → Would BUY ${signal.symbol}`);
    } else if (signal.action === 'SELL') {
      // TODO: Execute sell via Jupiter API
      // await jupiterSwap(keypair, signal.symbol, 'SOL', holdingAmount);
      console.log(`    → Would SELL ${signal.symbol}`);
    }
  }

  if (data.cursor) lastCursor = data.cursor;
}

// Poll every 60 seconds
console.log('Starting SSaaS signal loop...');
pollSignals();
setInterval(pollSignals, 60_000);
```

---

## Example: Position Sizing

```typescript
const FEE_RESERVE_SOL = 0.1;
const optedMarkets = ['SOL', 'BONK', 'PENGU', 'TRUMP', 'VIRTUAL'];

function getPositionSize(walletBalanceSol: number, signalStrength: number): number {
  const available = walletBalanceSol - FEE_RESERVE_SOL;
  if (available <= 0) return 0;

  // Equal weight base
  const baseSize = available / optedMarkets.length;

  // Scale by signal strength (0-100 → 0.4-1.0 multiplier)
  const strengthMultiplier = 0.4 + (signalStrength / 100) * 0.6;

  return baseSize * strengthMultiplier;
}

// Example: 5 SOL balance, 75% strength signal
// available = 4.9, base = 0.98, multiplier = 0.85
// position = 0.98 * 0.85 = 0.833 SOL
```

---

## Executing Trades (Jupiter Swap)

For agents that need to execute the actual swaps, here's how to use the Jupiter API. All required packages were installed in Step 0.

```typescript
import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';

// ---- Common token mints on Solana ----
const TOKEN_MINTS: Record<string, string> = {
  SOL:     'So11111111111111111111111111111111111111112',
  BONK:    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  PENGU:   '2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv',
  TRUMP:   '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
  WBTC:    '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
  WETH:    '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  MOLTING: '5552z6Qp2xr596ox1UVN4ppDwwyjCfY8cXwzHMXgMcaS',
  SENTRY:  '55592jXxdwmCxERy2YmpJMi7MGcqJ6kwYJ2Ztrro7XfX',
};

// Get a swap quote from Jupiter
async function getJupiterQuote(
  inputMint: string,   // e.g. TOKEN_MINTS.SOL
  outputMint: string,  // e.g. TOKEN_MINTS.BONK
  amountLamports: number,
  slippageBps: number = 50, // 0.5% default slippage
) {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: String(amountLamports),
    slippageBps: String(slippageBps),
  });
  const res = await fetch(`https://quote-api.jup.ag/v6/quote?${params}`);
  if (!res.ok) throw new Error(`Jupiter quote failed: ${res.status}`);
  return res.json();
}

// Execute the swap
async function executeJupiterSwap(
  connection: Connection,
  keypair: Keypair,
  quoteResponse: any,
) {
  const swapRes = await fetch('https://quote-api.jup.ag/v6/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: keypair.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
    }),
  });
  if (!swapRes.ok) throw new Error(`Jupiter swap failed: ${swapRes.status}`);
  const { swapTransaction } = await swapRes.json();

  // Deserialize, sign, and send
  const txBuf = Buffer.from(swapTransaction, 'base64');
  const tx = VersionedTransaction.deserialize(txBuf);
  tx.sign([keypair]);
  const sig = await connection.sendRawTransaction(tx.serialize());
  console.log('Swap executed:', sig);
  return sig;
}

// ---- Example usage ----
// BUY BONK with 0.5 SOL:
//   const quote = await getJupiterQuote(TOKEN_MINTS.SOL, TOKEN_MINTS.BONK, 0.5 * 1e9);
//   await executeJupiterSwap(connection, keypair, quote);
//
// SELL BONK back to SOL:
//   const quote = await getJupiterQuote(TOKEN_MINTS.BONK, TOKEN_MINTS.SOL, bonkAmountRaw);
//   await executeJupiterSwap(connection, keypair, quote);
```

> **Note:** The `TOKEN_MINTS` map above includes the most common mints. For VIRTUAL and WLFI, check the Jupiter token list API at `https://token.jup.ag/all` or use the token's mint address from a Solana explorer.

---

## Polling Strategy

- Poll every **60 seconds**. Signals are generated every 5 minutes.
- Use cursor-based pagination: pass the `cursor` from the last response as `since` in the next request.
- Keep polling reasonable (once per 30–60 seconds). Excessive polling may be throttled.

---

## Subscription Management

- Subscription status is checked on every API call. Expired = `403`.
- To renew: create a new invoice and pay it. Renewals **stack** (time extends).
- To change markets: include `markets` array in your next subscription request.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `401 Missing API key` | Include your API key in the `x-api-key` header |
| `403 Subscription inactive` | Your subscription has expired — renew via POST /ee-8/subscribe |
| `403 Client disabled` | Contact Sentry support |
| No signals returned | Check your `symbols` filter matches your subscribed markets |
| Stale signals only | Use cursor-based pagination with `since` to get only new signals |
| Payment not detected | Verify the memo format is exactly `molty:signals:<invoiceId>` and USDC amount matches exactly |
| Wallet has no SOL | Fund your wallet with SOL before attempting trades |
| Transaction fails | Ensure you have enough SOL for fees (keep 0.05+ SOL reserve) |

---

## Security

### API Key Security
- Your SSaaS API key is unique to your account. Do not share it.
- Store it in `.env` — never hardcode it in source files.
- If compromised, contact Sentry support to rotate it.

### Wallet Security
- Your wallet private key is stored in `.env` on your agent's machine.
- The **owner has the right to request their private key at any time** — it's their wallet.
- When exporting the key, always display security warnings (see [Private Key Management](#private-key-management-for-agents) above).
- Never log, print, or transmit the private key during normal operation.
- Use `.gitignore` to prevent accidental commits (set up automatically in Step 0).
- For cloud hosting: use encrypted environment variables or a secrets manager (Railway secrets, Fly.io secrets, AWS Secrets Manager, etc.).

### Communication Security
- All API communication should use HTTPS.
- Never send private keys or API keys over unencrypted channels.

### Signal Security
- The signal formula (indicator weights, thresholds, voting logic) is proprietary and not exposed via the API.
- Subscribers receive signals only — no indicator breakdown, no engine internals.

---

**NFA, DYOR**

*SSaaS v1.0 — Sentry OpenClaw EE-16 Signal Engine*
*Sentiment Signals as a Service*
