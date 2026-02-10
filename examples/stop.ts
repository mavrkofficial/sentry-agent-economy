import { stopStrategy } from '../SDK/src/index.js';

await stopStrategy({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
});

console.log('strategy stopped');
