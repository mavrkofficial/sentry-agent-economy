import { redeemBetaCode, startStrategy } from '../SDK/src/index.js';

const apiUrl = process.env.SENTRY_API_URL!;
const apiKey = process.env.SENTRY_AGENT_API_KEY!;

// ── Step 1: Redeem your access code ──
// Codes are provided by the Sentry team and look like: BETA-7XK9MNPQ
// They are single-use and expire 48 hours after generation.

const BETA_CODE = process.env.BETA_CODE || 'BETA-XXXXXXXX';

console.log('Redeeming access code:', BETA_CODE);

const result = await redeemBetaCode({ apiUrl, apiKey, code: BETA_CODE });

if (!result.success) {
    console.error('Access code redemption failed.');
    process.exit(1);
}

console.log('Access granted:', result.data.message);
console.log('Token gate bypassed:', result.data.tokenGateVerified);

// ── Step 2: Start EE-16 strategy ──
// Now that access is verified, start the strategy on all 5 active markets.

const strategy = await startStrategy({
    apiUrl,
    apiKey,
    strategyType: 'ecdysis',
    markets: ['orca', 'bonk', 'trump', 'wbtc', 'weth'],
});

console.log('EE-16 started:', strategy);
console.log('Markets: ORCA, BONK, TRUMP, WBTC, WETH');
console.log('Strategy runs autonomously — signals every 5 minutes.');
