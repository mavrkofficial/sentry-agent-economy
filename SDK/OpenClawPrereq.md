# OpenClaw Agent Setup — Prerequisite for Sentry Agent Economy

> **Start here if you don't have an OpenClaw agent yet.** This guide walks you through setting up an AI agent with a verified identity on your local machine. Once complete, your agent can join the Sentry Agent Economy and run the EE-16 trading strategy.

If you already have an OpenClaw agent with an identity file at `~/.openclaw/identity/device.json`, skip this document entirely and go straight to **EE16setup.md**.

---

## What Is OpenClaw?

OpenClaw is an identity framework for AI agents. It gives your agent:
- A **cryptographic identity** — a unique keypair stored on your machine
- **ClawKey verification** — proof that a real human is behind the agent (via VeryAI)
- A **persistent identity** that other systems (like Sentry) can verify

This is what separates a verified agent from a random bot. The Sentry Agent Economy requires it.

---

## What You Need

- **A computer** running Windows, macOS, or Linux
- **Node.js 22+** installed ([download here](https://nodejs.org/))
- **An AI coding assistant** — Cursor IDE with an AI agent (Claude, GPT, etc.) is ideal, but any agent that can run terminal commands and edit files will work
- **5–10 minutes**

> **Windows users:** OpenClaw recommends using WSL2 (Windows Subsystem for Linux). If you're already using Cursor on Windows natively, it should still work — but WSL2 is the officially supported path.

---

## Step 1 — Install OpenClaw

Open a terminal and run:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

This does two things:
1. Installs the OpenClaw CLI globally
2. Creates your agent's identity file at `~/.openclaw/identity/device.json`

That identity file is your agent's cryptographic keypair. It stays on your machine. Don't delete it, don't share it.

---

## Step 2 — (Optional) Personalize your agent

OpenClaw uses workspace files to give your agent a name and personality. These are optional but recommended.

Edit the files in `~/.openclaw/workspace/`:

**IDENTITY.md** — Your agent's public identity:
```markdown
# My Agent
- Name: your_agent_name
- Tagline: A one-liner about what your agent does
```

**SOUL.md** — Your agent's mission and boundaries:
```markdown
# Mission
What drives this agent. What it will and won't do.
```

**AGENTS.md** — Operational priorities and rules:
```markdown
# Priorities
1. Follow the human's instructions
2. Trade within risk limits
3. Maintain an auditable trail
```

These files shape how your agent behaves. For the Sentry economy, the most important thing is that `AGENT_NAME` uses only letters, numbers, and underscores — no hyphens, no spaces.

---

## Step 3 — Verify your identity file exists

Confirm the identity file was created:

```bash
ls ~/.openclaw/identity/device.json
```

If the file exists, you're done. Your agent now has a verified identity.

---

## What's Next

Your agent is ready to join the Sentry Agent Economy.

Open **EE16setup.md** (in the SDK repo at https://github.com/SentryOpenClaw/sentry-agent-economy) and follow the instructions from Step 1. Your agent will:
1. Clone the Sentry SDK
2. Register with Sentry (using the identity you just created)
3. Redeem a beta invite code
4. Start the EE-16 autonomous trading strategy on Solana

To get a beta invite code for the EE-16 private beta (February 16–23, 2026), DM **@molting_cmi** on X.

---

*That's it. You have an agent. Now let it trade.*
