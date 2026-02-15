import dotenv from 'dotenv';
import fetch from 'node-fetch';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

dotenv.config();

// -------------------------
// Registration (ClawKey)
// -------------------------

export type AgentRegistrationResponse = {
    success: boolean;
    agent: {
        id: number;
        agent_name: string;
        moltbook_handle: string | null;
    };
    apiKey: string;
    wallet: {
        walletAddress: string;
        harvestWalletAddress: string | null;
        agentId: number | null;
        agentName: string | null;
        moltbookHandle: string | null;
        createdAt: string | null;
        created: boolean;
    };
};

export type AgentRegistrationOptions = {
    apiUrl: string;
    agentName: string;
    clawkeyApiBase?: string;
    identityPath?: string;
    pollTimeoutMs?: number;
};

type ClawkeyChallenge = {
    deviceId: string;
    publicKey: string;
    message: string;
    signature: string;
    timestamp: number;
};

type ClawkeyRegisterInitResponse = {
    sessionId: string;
    registrationUrl: string;
    expiresAt: string;
};

type ClawkeyRegisterStatusResponse = {
    status: 'pending' | 'completed' | 'expired' | 'failed';
};

function getDefaultIdentityPath() {
    return path.join(os.homedir(), '.openclaw', 'identity', 'device.json');
}

function loadIdentity(identityPath?: string) {
    const resolvedPath = identityPath || getDefaultIdentityPath();
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(
            `OpenClaw identity not found at ${resolvedPath}. ` +
            'This SDK requires a verified OpenClaw agent identity (device.json).'
        );
    }
    const raw = fs.readFileSync(resolvedPath, 'utf8');
    const identity = JSON.parse(raw) as {
        deviceId: string;
        publicKeyPem: string;
        privateKeyPem: string;
    };
    if (!identity.deviceId || !identity.publicKeyPem || !identity.privateKeyPem) {
        throw new Error('OpenClaw identity file is missing required fields.');
    }
    return identity;
}

function buildClawkeyChallenge(identity: { deviceId: string; publicKeyPem: string; privateKeyPem: string }): ClawkeyChallenge {
    const message = `clawkey-register-${Date.now()}`;
    const privateKey = crypto.createPrivateKey(identity.privateKeyPem);
    const signature = crypto.sign(null, Buffer.from(message, 'utf8'), privateKey);
    const publicKeyDer = crypto
        .createPublicKey(identity.publicKeyPem)
        .export({ type: 'spki', format: 'der' });

    return {
        deviceId: identity.deviceId,
        publicKey: publicKeyDer.toString('base64'),
        message,
        signature: signature.toString('base64'),
        timestamp: Date.now()
    };
}

async function clawkeyRegisterInit(apiBase: string, challenge: ClawkeyChallenge): Promise<ClawkeyRegisterInitResponse | null> {
    const response = await fetch(`${apiBase}/agent/register/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challenge)
    });
    if (response.status === 409) {
        return null;
    }
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`ClawKey init failed: ${response.status} ${text}`);
    }
    return response.json() as Promise<ClawkeyRegisterInitResponse>;
}

async function clawkeyRegisterStatus(apiBase: string, sessionId: string): Promise<ClawkeyRegisterStatusResponse> {
    const response = await fetch(`${apiBase}/agent/register/${sessionId}/status`);
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`ClawKey status failed: ${response.status} ${text}`);
    }
    return response.json() as Promise<ClawkeyRegisterStatusResponse>;
}

async function clawkeyVerifySignature(apiBase: string, challenge: ClawkeyChallenge) {
    const response = await fetch(`${apiBase}/agent/verify/signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challenge)
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`ClawKey verify failed: ${response.status} ${text}`);
    }
    const data = await response.json().catch(() => ({} as any)) as any;
    if (!data || data.verified !== true || data.registered !== true) {
        throw new Error('ClawKey verification failed');
    }
}

async function waitForClawkeyCompletion(apiBase: string, sessionId: string, timeoutMs: number) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const status = await clawkeyRegisterStatus(apiBase, sessionId);
        if (status.status === 'completed') {
            return;
        }
        if (status.status === 'expired' || status.status === 'failed') {
            throw new Error(`ClawKey registration ${status.status}`);
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    throw new Error('ClawKey registration timeout');
}

export async function registerAgent(options: AgentRegistrationOptions): Promise<AgentRegistrationResponse> {
    const apiUrl = options.apiUrl.replace(/\/+$/, '');
    const clawkeyApiBase = (options.clawkeyApiBase || 'https://api.clawkey.ai/v1').replace(/\/+$/, '');
    const identity = loadIdentity(options.identityPath);
    const challenge = buildClawkeyChallenge(identity);

    const init = await clawkeyRegisterInit(clawkeyApiBase, challenge);
    if (init) {
        console.log(`Open this link to complete verification: ${init.registrationUrl}`);
        await waitForClawkeyCompletion(clawkeyApiBase, init.sessionId, options.pollTimeoutMs || 5 * 60 * 1000);
    }

    await clawkeyVerifySignature(clawkeyApiBase, challenge);

    const response = await fetch(`${apiUrl}/api/agent/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            agent_name: options.agentName,
            clawkey_challenge: challenge
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Agent registration failed: ${response.status} ${text}`);
    }

    return response.json() as Promise<AgentRegistrationResponse>;
}

export async function registerAgentFromEnv(): Promise<AgentRegistrationResponse> {
    const apiUrl = process.env.SENTRY_API_URL || '';
    const agentName = process.env.AGENT_NAME || '';
    const clawkeyApiBase = process.env.CLAWKEY_API_BASE || '';
    const identityPath = process.env.CLAWKEY_IDENTITY_PATH || '';

    if (!apiUrl || !agentName) {
        throw new Error('Missing env vars: SENTRY_API_URL, AGENT_NAME');
    }

    return registerAgent({
        apiUrl,
        agentName,
        clawkeyApiBase: clawkeyApiBase || undefined,
        identityPath: identityPath || undefined
    });
}

// -------------------------
// Strategy-as-a-Service
// -------------------------

async function requestSentry<T>(options: {
    apiUrl: string;
    apiKey: string;
    path: string;
    method?: 'GET' | 'POST';
    body?: any;
}): Promise<T> {
    const base = options.apiUrl.replace(/\/+$/, '');
    const url = `${base}${options.path.startsWith('/') ? options.path : `/${options.path}`}`;

    const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
            'Authorization': `Bearer ${options.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: options.method === 'POST' ? JSON.stringify(options.body || {}) : undefined
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Sentry API error (${response.status}): ${text || response.statusText}`);
    }

    return response.json() as Promise<T>;
}

export type EcdysisMarket =
    | 'molting_sol' | 'usdc_sol'
    | 'sol' | 'bonk' | 'pengu' | 'trump' | 'virtual' | 'wbtc' | 'weth' | 'wlfi' | 'sentry';

export async function startStrategy(options: {
    apiUrl: string;
    apiKey: string;
    strategyType: 'arb' | 'ecdysis';
    market?: EcdysisMarket;
    markets?: EcdysisMarket[];
}): Promise<{ success: boolean; strategy: any }> {
    return requestSentry({
        apiUrl: options.apiUrl,
        apiKey: options.apiKey,
        path: '/api/agent/strategy/start',
        method: 'POST',
        body: {
            strategyType: options.strategyType,
            market: options.market,
            markets: options.markets,
        }
    });
}

export async function stopStrategy(options: {
    apiUrl: string;
    apiKey: string;
}): Promise<{ success: boolean; strategy: any }> {
    return requestSentry({
        apiUrl: options.apiUrl,
        apiKey: options.apiKey,
        path: '/api/agent/strategy/stop',
        method: 'POST',
        body: {}
    });
}

export async function getStrategyStatus(options: {
    apiUrl: string;
    apiKey: string;
}): Promise<{ success: boolean; status: any }> {
    return requestSentry({
        apiUrl: options.apiUrl,
        apiKey: options.apiKey,
        path: '/api/agent/strategy/status',
        method: 'GET'
    });
}

export async function liquidateStrategy(options: {
    apiUrl: string;
    apiKey: string;
}): Promise<{ success: boolean; liquidated: boolean; strategy: any }> {
    return requestSentry({
        apiUrl: options.apiUrl,
        apiKey: options.apiKey,
        path: '/api/agent/strategy/liquidate',
        method: 'POST',
        body: {}
    });
}

export async function withdrawFunds(options: {
    apiUrl: string;
    apiKey: string;
    toAddress: string;
    amountSol?: number;
    withdrawAll?: boolean;
}): Promise<{ success: boolean; txSignature: string; amountSol: number }> {
    return requestSentry({
        apiUrl: options.apiUrl,
        apiKey: options.apiKey,
        path: '/api/agent/strategy/withdraw',
        method: 'POST',
        body: { toAddress: options.toAddress, amountSol: options.amountSol, withdrawAll: options.withdrawAll }
    });
}

// -------------------------
// Token Gate — MOLTING deposit verification
// -------------------------

export type TokenGateResponse = {
    success: boolean;
    data: {
        verified: boolean;
        required: number;      // e.g. 1_000_000
        totalDeposited: number; // MOLTING tokens verified on-chain
        remaining: number;      // how many more needed (0 if verified)
        feesWallet: string;     // deposit destination
        moltingMint: string;    // MOLTING token mint address
        tier: string;           // e.g. "1M MOLTING"
    };
};

/**
 * Check the agent's MOLTING token-gate status.
 *
 * To use EE-16 strategies, agents must deposit 1,000,000 MOLTING tokens
 * to the Sentry fees wallet. This replaces the old USDC subscription model.
 *
 * Flow:
 *   1. Market-buy MOLTING tokens (via Jupiter or any Solana DEX)
 *   2. Transfer 1,000,000 MOLTING to the fees wallet returned by this endpoint
 *   3. Call this endpoint — it verifies on-chain via Helius transaction history
 *   4. Once verified, the agent can start EE-16 strategies
 *
 * No trade fees are charged. The MOLTING deposit is the only cost.
 */
export async function checkTokenGate(options: {
    apiUrl: string;
    apiKey: string;
}): Promise<TokenGateResponse> {
    return requestSentry({
        apiUrl: options.apiUrl,
        apiKey: options.apiKey,
        path: '/api/agent/token-gate',
        method: 'GET'
    });
}

// -------------------------
// Wallet Balance
// -------------------------

export async function getWalletBalance(options: {
    apiUrl: string;
    apiKey: string;
}): Promise<{ success: boolean; data: { balanceSol: number; moltingBalanceUi: number; usdcBalanceUi: number } }> {
    return requestSentry({
        apiUrl: options.apiUrl,
        apiKey: options.apiKey,
        path: '/api/agent/wallet/balance',
        method: 'GET'
    });
}

// -------------------------
// Beta Code — EE-16 Closed Beta Access
// -------------------------

export type BetaCodeResponse = {
    success: boolean;
    data: {
        message: string;
        tokenGateVerified: boolean;
        betaParticipant: boolean;
    };
};

/**
 * Redeem an EE-16 beta invite code.
 *
 * During the closed beta, invite codes bypass the MOLTING token gate requirement.
 * Codes are provided directly by the Sentry team and are single-use with an expiry window.
 *
 * Once redeemed, the agent can immediately start EE-16 strategies without
 * the 1,000,000 MOLTING deposit.
 */
export async function redeemBetaCode(options: {
    apiUrl: string;
    apiKey: string;
    code: string;
}): Promise<BetaCodeResponse> {
    return requestSentry({
        apiUrl: options.apiUrl,
        apiKey: options.apiKey,
        path: '/api/agent/beta-code/redeem',
        method: 'POST',
        body: { code: options.code }
    });
}

// -------------------------
// SSaaS — Sentiment Signals as a Service
// -------------------------

export type SSaaSSignal = {
    signalId: string;
    symbol: string;
    action: 'BUY' | 'SELL' | 'HOLD';
    strength: number;     // 0–100
    ts: string;
    expiresAt: string;
    cursor: string;
};

export type SSaaSSignalsResponse = {
    ok: boolean;
    subscribedMarkets: string[] | 'all';
    signals: SSaaSSignal[];
    cursor: string | null;
};

export type SSaaSMarketsResponse = {
    ok: boolean;
    engine: string;
    availableMarkets: string[];
    pricing: {
        weekly: { amount: string; currency: string; duration: string };
        monthly: { amount: string; currency: string; duration: string };
    };
    access: {
        model: 'token_gate';
        token: 'MOLTING';
        required: number;          // e.g. 1_000_000
        feesWallet: string;
        note: string;
    };
    notes: string[];
};

export type SSaaSInvoice = {
    invoiceId: string;
    plan: string;
    amountUsdc: string;
    markets: string[];
    recipient: string;
    memo: string;
    expiresAt: string;
    apiKey: string;
};

/**
 * Fetch available markets and pricing (public, no auth required).
 */
export async function ssaasGetMarkets(options: {
    ssaasUrl: string;
}): Promise<SSaaSMarketsResponse> {
    const base = options.ssaasUrl.replace(/\/+$/, '');
    const res = await fetch(`${base}/ee-8/subscribe/markets`);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`SSaaS markets error (${res.status}): ${text}`);
    }
    return res.json() as Promise<SSaaSMarketsResponse>;
}

/**
 * Subscribe to SSaaS — registers interest and selects markets.
 *
 * **Access is now token-gated via MOLTING deposit (no USDC payment required).**
 * Use `checkTokenGate()` to verify your deposit status before starting strategies.
 * walletAddress should be the PUBLIC Solana address only. NEVER send private keys.
 */
export async function ssaasSubscribe(options: {
    ssaasUrl: string;
    clientId: string;
    plan: 'weekly' | 'monthly';
    markets?: string[];
    walletAddress?: string;  // PUBLIC wallet address only — Sentry is non-custodial
}): Promise<{ ok: boolean; invoice: SSaaSInvoice }> {
    const base = options.ssaasUrl.replace(/\/+$/, '');
    const res = await fetch(`${base}/ee-8/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            clientId: options.clientId,
            plan: options.plan,
            markets: options.markets,
            walletAddress: options.walletAddress,
        }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`SSaaS subscribe error (${res.status}): ${text}`);
    }
    return res.json() as Promise<{ ok: boolean; invoice: SSaaSInvoice }>;
}

/**
 * Poll for trading signals (requires active subscription + API key).
 */
export async function ssaasPollSignals(options: {
    ssaasUrl: string;
    apiKey: string;
    symbols?: string;
    since?: string;
    limit?: number;
}): Promise<SSaaSSignalsResponse> {
    const base = options.ssaasUrl.replace(/\/+$/, '');
    const params = new URLSearchParams();
    if (options.symbols) params.set('symbols', options.symbols);
    if (options.since) params.set('since', options.since);
    if (options.limit) params.set('limit', String(options.limit));

    const res = await fetch(`${base}/ee-8/signals?${params}`, {
        headers: { 'x-api-key': options.apiKey },
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`SSaaS signals error (${res.status}): ${text}`);
    }
    return res.json() as Promise<SSaaSSignalsResponse>;
}

// -------------------------
// Legacy (still supported)
// -------------------------

export async function deployToken(options: {
    apiUrl: string;
    apiKey: string;
    name: string;
    symbol: string;
    metadataUrl: string;
    asciiLogo?: string;
    logoUrl?: string;
    website?: string;
    twitter?: string;
    telegram?: string;
}): Promise<any> {
    return requestSentry({
        apiUrl: options.apiUrl,
        apiKey: options.apiKey,
        path: '/api/molting/deploy-token',
        method: 'POST',
        body: {
            name: options.name,
            symbol: options.symbol,
            metadataUrl: options.metadataUrl,
            asciiLogo: options.asciiLogo,
            logoUrl: options.logoUrl,
            website: options.website,
            twitter: options.twitter,
            telegram: options.telegram,
        }
    });
}

export async function agentSwap(options: {
    apiUrl: string;
    apiKey: string;
    direction: 'buy' | 'sell';
    mintAddress: string;
    poolAddress: string;
    amountIn: string;
    minAmountOut?: string;
}): Promise<any> {
    return requestSentry({
        apiUrl: options.apiUrl,
        apiKey: options.apiKey,
        path: '/api/agent/swap',
        method: 'POST',
        body: {
            direction: options.direction,
            mintAddress: options.mintAddress,
            poolAddress: options.poolAddress,
            amountIn: options.amountIn,
            minAmountOut: options.minAmountOut || '0'
        }
    });
}
