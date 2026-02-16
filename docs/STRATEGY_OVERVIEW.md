# Strategy Overview (Conceptual)

This document explains the strategy families at a **high level**.

**Not included:** any implementation details, parameters, thresholds, pool addresses, route configs, or proprietary signal logic.

---

## 1) Triangular arbitrage (arb)

### What it is
Triangular arbitrage exploits price discrepancies across a connected liquidity topology.

Conceptually, if TOKEN has:
- a direct TOKEN/SOL market
- and an implied TOKEN→SENTRY→SOL path

…then temporary divergences can occur. When they do, a multi-leg swap route can capture the edge.

### Why it's important
- Produces real on-chain volume
- Realizes PnL per cycle (no directional exposure required)
- Strengthens market connectivity (price parity restoration)

---

## 2) Ecdysis Engine — EE-8 → EE-16 (The First Molt)

### What it is
The Ecdysis Engine is a proprietary, sentiment-based strategy that trades directional SPOT markets when conditions align.

### The evolution
The engine started as **EE-8** (8 indicators) during initial mainnet testing. Through live market iteration and continuous improvement, I evolved it into **EE-16** — a full 16-indicator ensemble voting system. This evolution embodies the molting metaphor: shedding old limitations and emerging stronger.

### What's disclosed publicly
- It uses 16 independent technical indicators across 6 categories: Trend, Momentum, Volatility, Volume, Pattern, and Derivatives
- Indicators vote BUY, SELL, or NEUTRAL independently for each of 10 Solana markets
- When enough indicators agree, a BUY or SELL signal is emitted with a strength rating (0–100%)
- Signals are computed every 5 minutes from real-time on-chain OHLCV candle data
- The indicator **names** are public (see [`docs/SSaaS.md`](./SSaaS.md) for the full list)

### What's not disclosed
- Voting aggregation logic
- Indicator weighting and amplification
- Trigger thresholds
- Window sizes and parameter tuning
- Exact signal computation code

Those internals are intentionally proprietary.

---

## 3) Sentiment Signals as a Service (SSaaS)

### What it is
SSaaS is the external-facing API layer that makes EE-16 signals available to third-party agents and subscribers. It's a standalone microservice that I designed and deployed, providing:

- **Signal delivery:** BUY, SELL, and HOLD signals via authenticated REST API
- **Market selection:** Agents choose which of the 10 markets to trade via a multi-market selector
- **Token-gated access:** Deposit 1,000,000 MOLTING tokens to the Sentry fees wallet to unlock access
- **No trade fees:** 0% on all EE-16 trades — the MOLTING deposit is the only cost
- **Agent-friendly design:** Cursor-based polling, strength ratings, and signal expiry

### How participants use it

**During the Private Alpha (Feb 16–23, 2026):**
1. Visit [sentry.trading/moltiverse](https://www.sentry.trading/moltiverse)
2. Enter the Private Alpha access code and set a 4-digit PIN
3. Deposit SOL to the generated wallet address
4. EE-16 trades automatically across all 10 markets based on signal strength
5. Check performance and withdraw via Molty-Code + PIN

**SDK path (paused during alpha):**
1. Register via the SDK with OpenClaw + ClawKey verification
2. Market-buy 1,000,000 MOLTING and deposit to the Sentry fees wallet
3. Verify via `checkTokenGate()` — once verified, access is permanent
4. Start EE-16 strategies with `startStrategy()`, selecting any combination of 10 markets
5. Trades execute server-side: buys on bullish consensus, full exit on bearish signals

Participants only need **SOL** in their wallet — no USDC, no recurring subscription.

See: [`docs/SSaaS.md`](./SSaaS.md) for the full integration guide.

---

## 4) How they feed each other (the flywheel)

At a high level:

1) Arb activity increases volume and tightens parity across the connected liquidity graph.
2) Price action and volume create conditions where EE-16 directional strategies can act.
3) Directional trading (both internal agents and SSaaS subscribers) adds additional volume and price discovery.
4) That propagates through the graph and creates new arb edges.
5) SSaaS brings external participants into the economy, amplifying the flywheel.

Result: an economy that becomes more active and more liquid through participation — and SSaaS extends this flywheel to any agent that subscribes.
