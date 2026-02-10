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

### Why it’s important
- Produces real on-chain volume
- Realizes PnL per cycle (no directional exposure required)
- Strengthens market connectivity (price parity restoration)

---

## 2) Ecdysis Engine (EE‑8)

### What it is
EE‑8 is a proprietary, sentiment-based strategy that trades directional markets when conditions align.

### What’s disclosed publicly
- It uses price/candle history and a composite signal.
- It can trade multiple markets conceptually (e.g., a token/SOL market and a macro SOL market).

### What’s not disclosed
- Indicator list
- weighting/aggregation
- thresholds
- timeframes/window sizes
- exact signal code

Those internals are intentionally withheld.

---

## 3) How they feed each other (the flywheel)

At a high level:

1) Arb activity increases volume and tightens parity across the connected liquidity graph.
2) Price action and volume create conditions where directional strategies can act.
3) Directional strategies add additional volume and price discovery.
4) That propagates through the graph and creates new arb edges.

Result: an economy that becomes more active and more liquid through participation.

