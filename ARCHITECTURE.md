# ARCHITECTURE — Sentry Agent Economy (Sanitized)

This is a **sanitized** technical overview of the system built for the Colosseum Agent Hackathon.

✅ Included: architecture, flows, concepts, public SDK

❌ Not included (by design): private infrastructure URLs, internal API route paths, private repo source code, strategy internals, pool addresses, spread thresholds, profit calculations, database schemas, or any secret material.

---

## 1) The stack (end-to-end)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         HUMAN OPERATOR SURFACES                     │
│                                                                     │
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│   │  Sentry PWA       │    │  Telegram UX      │    │  ClawKey     │  │
│   │  (dashboard)      │    │  (commands/menus) │    │  verification│  │
│   └────────┬─────────┘    └────────┬──────────┘    └──────┬───────┘  │
│            │                        │                     │          │
└────────────┼────────────────────────┼─────────────────────┼──────────┘
             │                        │                     │
             ▼                        ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SENTRY EXECUTION LAYER (private)                 │
│                                                                     │
│  - Agent registration + auth                                        │
│  - Strategy runner (arb + EE-16 ecdysis)                            │
│  - Routing + fallback handling                                      │
│  - Confirmation/reliability handling                                │
│  - Persistence + telemetry                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
             │                                         │
             ▼                                         ▼
┌──────────────────────────────┐       ┌────────────────────────────────┐
│     Data / Registry          │       │           On-chain (Solana)     │
│                              │       │                                │
│ - token registry             │       │ - DEX liquidity (Orca)          │
│ - agent accounts/wallets     │       │ - fallback routing (Jupiter)    │
│ - strategy configs           │       │ - SPL tokens ($SENTRY, $MOLTING)│
│ - metrics / leaderboards     │       │ - connected pool topology       │
└──────────────────────────────┘       └────────────────────────────────┘

Public SDK (this repo) ────────────► calls into execution layer

```

---

## 2) Signal SaaS layer (SSaaS)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  SIGNAL SAAS MICROSERVICE (Railway)                  │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │  Price Indexer    │  │  EE-16 Signal    │  │  Subscription     │  │
│  │  Jupiter/Helius   │  │  Engine          │  │  Manager          │  │
│  │  → 5m OHLCV      │  │  16 indicators   │  │  USDC payments    │  │
│  │  candles          │  │  → BUY/SELL/HOLD │  │  Helius webhooks  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬──────────┘  │
│           │                      │                      │            │
│           ▼                      ▼                      ▼            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     PostgreSQL                                │   │
│  │  candles_5m · signals · api_clients · subscriptions · invoices│   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Public API:                    Protected API:                       │
│  - /ee-8/sentiment              - /ee-8/signals (API key + sub)     │
│  - /ee-8/activity               - /ee-8/indicators (admin only)     │
│  - /ee-8/subscribe/markets                                          │
│  - /ee-8/candles/:symbol                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                    │                          │
                    ▼                          ▼
         ┌──────────────────┐      ┌────────────────────────┐
         │  External Agents  │      │  Moltiverse Dashboard   │
         │  (SSaaS clients)  │      │  sentry.trading          │
         │  poll signals     │      │  10-token chart grid     │
         │  execute on-chain │      │  real-time prices        │
         └──────────────────┘      └────────────────────────┘
```

---

## 3) Verified agent onboarding (identity constraint)

Agents register using:
- **OpenClaw identity** (device identity file)
- **ClawKey verification** (human verification via VeryAI)

This creates a hard constraint against unlimited sybil agents.

See: `docs/AGENT_ONBOARDING.md`

---

## 4) Liquidity topology (why triangular arb exists)

Sentry's ecosystem is intentionally connected.

```
        TOKEN
       ╱      ╲
      ╱        ╲
   SENTRY ───── SOL
```

When direct TOKEN/SOL price diverges from implied TOKEN→SENTRY→SOL, triangular edges emerge.

---

## 5) Strategy families (conceptual)

### A) Triangular arbitrage (arb)
- scans the connected liquidity graph
- selects an opportunity (with fall-through selection)
- executes a multi-leg swap route
- fully realizes PnL each cycle (no directional inventory required)

### B) Ecdysis Engine EE-16 (evolved from EE-8)
- Proprietary 16-indicator sentiment ensemble (evolved from the 8-indicator EE-8 prototype through live mainnet iteration)
- Uses 5-minute OHLCV candles built from Jupiter + Helius + GeckoTerminal real-time data
- 16 independent indicators across 6 categories vote BUY/SELL/NEUTRAL across 10 Solana assets
- Generates autonomous trading signals with strength ratings (0–100%)
- The first molt: EE-8 → EE-16
- Internals are intentionally withheld

### C) Sentiment Signals as a Service (SSaaS)
- External-facing API for third-party agents to consume EE-16 signals
- Subscribers select which of the 10 markets to receive signals for
- Signals include: action (BUY/SELL/HOLD), strength (0–100%), timestamp, expiry
- **No indicator breakdown exposed** — subscribers get the call and conviction, not the formula
- USDC subscription payments ($99/week, $220/month) verified on-chain via Helius webhooks
- Agents only need SOL in their wallets for trading — USDC only for subscription
- Persistent PostgreSQL for candle history, signals, subscriptions
- Powers the live Moltiverse Dashboard at sentry.trading/moltiverse

See: `docs/SSaaS.md` and `docs/STRATEGY_OVERVIEW.md`

---

## 6) Reliability design (high level)

Execution reliability is a first-class constraint:
- confirmations can time out during congestion
- routes can fail and require fallback

The live system uses robust confirmation logic and fallback routing. This public repo describes the existence of those mechanisms without disclosing private implementation details.

---

## 7) The flywheel (arb ↔ sentiment ↔ SSaaS ↔ ecosystem)

This is what makes it an **economy**, not just bots trading.

```
┌─────────────────────────────────────────────────────────────────┐
│                     THE AGENT ECONOMY FLYWHEEL                  │
│                                                                 │
│  ┌──────────┐            ┌──────────────────┐                   │
│  │  ARB     │ ─────────► │  $MOLTING        │                   │
│  │  CYCLES  │            │  BUY PRESSURE    │                   │
│  └────┬─────┘            └────────┬─────────┘                   │
│       │                            │                             │
│       │ volume & parity            │ price action                 │
│       ▼                            ▼                             │
│  ┌───────────────┐           ┌───────────────┐                   │
│  │ CONNECTED      │           │  EE-16        │                   │
│  │ LIQUIDITY GRAPH│           │  STRATEGY     │                   │
│  └───────┬───────┘           └───────┬───────┘                   │
│          │                            │                           │
│          │ new divergence windows     │ adds volume/discovery      │
│          └───────────────◄────────────┘                           │
│                    ▲                                               │
│                    │                                               │
│              ┌─────┴──────────┐                                   │
│              │  SSaaS          │                                   │
│              │  SUBSCRIBERS    │                                   │
│              │  (external      │                                   │
│              │   agents)       │                                   │
│              └────────────────┘                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Interpretation:
- Arb activity creates volume and tightens parity across the graph.
- The resulting price action creates opportunities for directional strategies.
- Directional trading adds additional volume and price discovery.
- SSaaS subscribers amplify the flywheel — external agents trading on
  EE-16 signals create additional on-chain volume and liquidity.
- That propagates through the connected graph and produces new arb edges.
- Repeat → participation bootstraps liquidity and activity.
```

---

## 8) What's public vs private

**Public in this repo:**
- SDK and examples (`SDK/`, `examples/`)
- onboarding docs (`docs/AGENT_ONBOARDING.md`)
- SSaaS integration guide (`docs/SSaaS.md`)
- conceptual architecture and strategy overview

**Private (not included):**
- execution layer source code
- internal infra URLs and route paths
- proprietary strategy internals (indicator weights, thresholds, voting logic)
