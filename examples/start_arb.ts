import { startStrategy } from '../SDK/src/index.js';

await startStrategy({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
  strategyType: 'arb',
});

console.log('arb started');
