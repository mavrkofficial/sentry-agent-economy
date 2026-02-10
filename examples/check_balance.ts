import { getWalletBalance } from '../SDK/src/index.js';

const bal = await getWalletBalance({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
});

console.log('SOL:', bal.data.balanceSol);
console.log('MOLTING:', bal.data.moltingBalanceUi);
console.log('USDC:', bal.data.usdcBalanceUi);
