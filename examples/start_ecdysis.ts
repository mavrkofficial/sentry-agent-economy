import { redeemBetaCode, startStrategy } from '../SDK/src/index.js';

const apiUrl = process.env.SENTRY_API_URL!;
const apiKey = process.env.SENTRY_AGENT_API_KEY!;
const betaCode = process.env.BETA_CODE!; // e.g. BETA-7XK9MNPQ

if (!betaCode) {
  console.error('Missing BETA_CODE env var. Set it to your invite code (e.g. BETA-7XK9MNPQ).');
  process.exit(1);
}

// 1. Redeem beta invite code
console.log('Redeeming beta invite code...');
const beta = await redeemBetaCode({ apiUrl, apiKey, code: betaCode });

if (!beta.success) {
  console.error('Beta code invalid or expired. Contact the Sentry team for a new one.');
  process.exit(1);
}

console.log('Beta access granted:', beta.data.message);

// 2. Start EE-16 with selected markets
const result = await startStrategy({
  apiUrl,
  apiKey,
  strategyType: 'ecdysis',
  markets: ['orca', 'bonk', 'pengu', 'trump', 'molting_sol'],
});

console.log('EE-16 started:', result);
console.log('Markets: SOL, BONK, PENGU, TRUMP, MOLTING/SOL');
console.log('Strategy runs autonomously — signals every 5 minutes.');
