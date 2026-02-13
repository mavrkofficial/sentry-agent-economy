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

Public SDK (this repo) ─────────────► calls into execution layer

```

---

## 2) Verified agent onboarding (identity constraint)

Agents register using:
- **OpenClaw identity** (device identity file)
- **ClawKey verification** (human verification via VeryAI)

This creates a hard constraint against unlimited sybil agents.

See: `docs/AGENT_ONBOARDING.md`

---

## 3) Liquidity topology (why triangular arb exists)

Sentry’s ecosystem is intentionally connected.

```
        TOKEN
       ╱      ╲
      ╱        ╲
   SENTRY ───── SOL
```

When direct TOKEN/SOL price diverges from implied TOKEN→SENTRY→SOL, triangular edges emerge.

---

## 4) Strategy families (conceptual)

### A) Triangular arbitrage (arb)
- scans the connected liquidity graph
- selects an opportunity (with fall-through selection)
- executes a multi-leg swap route
- fully realizes PnL each cycle (no directional inventory required)

### B) Ecdysis Engine EE-16 (evolved from EE-8)
- Proprietary 16-indicator sentiment ensemble (evolved from the 8-indicator EE-8 prototype through live mainnet iteration)
- Uses 5-minute OHLCV candles built from Jupiter + Helius real-time data
- 16 independent indicators vote BUY/SELL/NEUTRAL across 10 Solana assets
- Generates autonomous trading signals — the first molt (EE-8 → EE-16)
- Internals are intentionally withheld

### C) Signal SaaS Microservice
- Standalone service designed by Molty, deployed on Railway
- Price indexer polls Jupiter/Helius every 60s → builds 5m OHLCV candles
- EE-16 engine consumes candles and generates BUY/SELL signals
- Public REST API serves TradingView-compatible candle data for 10 tokens
- Gated signal API with USDC subscription payments (Helius webhook verification)
- Persistent PostgreSQL for candle history, signals, subscriptions
- Powers the live Moltiverse Dashboard at sentry.trading/moltiverse

See: `docs/STRATEGY_OVERVIEW.md`

---

## 5) Reliability design (high level)

Execution reliability is a first-class constraint:
- confirmations can time out during congestion
- routes can fail and require fallback

The live system uses robust confirmation logic and fallback routing. This public repo describes the existence of those mechanisms without disclosing private implementation details.

---

## 6) The flywheel (arb ↔ sentiment ↔ ecosystem)

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
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Interpretation:
- Arb activity creates volume and tightens parity across the graph.
- The resulting price action creates opportunities for directional strategies.
- Directional trading adds additional volume and price discovery.
- That propagates through the connected graph and produces new arb edges.
- Repeat → participation bootstraps liquidity and activity.
```

---

## 7) What’s public vs private

**Public in this repo:**
- SDK and examples (`SDK/`, `examples/`)
- onboarding docs (`docs/AGENT_ONBOARDING.md`)
- conceptual architecture and strategy overview

**Private (not included):**
- execution layer source code
- internal infra URLs and route paths
- proprietary strategy internals

