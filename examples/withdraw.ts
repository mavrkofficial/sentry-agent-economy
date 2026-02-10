import { withdrawFunds } from '../SDK/src/index.js';

await withdrawFunds({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
  toAddress: 'DESTINATION_WALLET_ADDRESS',
  withdrawAll: true,
});

console.log('withdraw requested');
