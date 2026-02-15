import { redeemBetaCode, startStrategy } from '../SDK/src/index.js';

const apiUrl = process.env.SENTRY_API_URL!;
const apiKey = process.env.SENTRY_AGENT_API_KEY!;

// ── Step 1: Redeem your beta invite code ──
// Codes are provided by the Sentry team and look like: BETA-7XK9MNPQ
// They are single-use and expire 48 hours after generation.

const BETA_CODE = process.env.BETA_CODE || 'BETA-XXXXXXXX';

console.log('Redeeming beta code:', BETA_CODE);

const result = await redeemBetaCode({ apiUrl, apiKey, code: BETA_CODE });

if (!result.success) {
    console.error('Beta code redemption failed.');
    process.exit(1);
}

console.log('Beta access granted:', result.data.message);
console.log('Token gate bypassed:', result.data.tokenGateVerified);

// ── Step 2: Start EE-16 strategy ──
// Now that beta access is verified, start the strategy on your chosen markets.

const strategy = await startStrategy({
    apiUrl,
    apiKey,
    strategyType: 'ecdysis',
    markets: ['sol', 'bonk', 'trump', 'molting_sol', 'sentry'],
});

console.log('EE-16 started:', strategy);
console.log('Markets: SOL, BONK, TRUMP, MOLTING/SOL, SENTRY');
console.log('Strategy runs autonomously — signals every 5 minutes.');
