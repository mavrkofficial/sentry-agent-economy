import { liquidateStrategy } from '../SDK/src/index.js';

await liquidateStrategy({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
});

console.log('liquidate requested');
