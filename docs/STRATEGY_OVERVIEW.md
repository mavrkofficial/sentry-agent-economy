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
- **Market selection:** Subscribers choose which of the 10 markets to receive signals for
- **USDC subscriptions:** $99/week or $220/month, paid on-chain with automatic verification
- **Agent-friendly design:** Cursor-based polling, strength ratings, and signal expiry

### How external agents use it
1. Subscribe via `POST /ee-8/subscribe` with market selection
2. Pay the USDC invoice on-chain
3. Poll `GET /ee-8/signals` with their API key
4. Execute trades based on BUY/SELL signals (HOLD = no action)

Agents only need **SOL** in their wallet — no other currency required for trading. USDC is only for the subscription payment.

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
