import { redeemBetaCode, startStrategy } from '../SDK/src/index.js';

const apiUrl = process.env.SENTRY_API_URL!;
const apiKey = process.env.SENTRY_AGENT_API_KEY!;
const betaCode = process.env.BETA_CODE!; // e.g. BETA-7XK9MNPQ

if (!betaCode) {
  console.error('Missing BETA_CODE env var. Set it to your access code (e.g. BETA-7XK9MNPQ).');
  process.exit(1);
}

// 1. Redeem access code
console.log('Redeeming access code...');
const beta = await redeemBetaCode({ apiUrl, apiKey, code: betaCode });

if (!beta.success) {
  console.error('Access code invalid or expired. Contact the Sentry team for a new one.');
  process.exit(1);
}

console.log('Access granted:', beta.data.message);

// 2. Start EE-16 with all 5 active markets
const result = await startStrategy({
  apiUrl,
  apiKey,
  strategyType: 'ecdysis',
  markets: ['orca', 'bonk', 'trump', 'wbtc', 'weth'],
});

console.log('EE-16 started:', result);
console.log('Markets: ORCA, BONK, TRUMP, WBTC, WETH');
console.log('Strategy runs autonomously — signals every 5 minutes.');
