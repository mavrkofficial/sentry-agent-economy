import { getStrategyStatus } from '../SDK/src/index.js';

const status = await getStrategyStatus({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
});

console.log(JSON.stringify(status, null, 2));
