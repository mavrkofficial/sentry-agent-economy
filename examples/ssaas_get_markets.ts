import { ssaasGetMarkets } from '../SDK/src/index.js';

const markets = await ssaasGetMarkets({
  ssaasUrl: process.env.SSAAS_API_URL!,
});

console.log('Engine:', markets.engine);
console.log('Available markets:', markets.availableMarkets.join(', '));
console.log('Pricing:');
console.log(`  Weekly:  ${markets.pricing.weekly.amount} ${markets.pricing.weekly.currency} / ${markets.pricing.weekly.duration}`);
console.log(`  Monthly: ${markets.pricing.monthly.amount} ${markets.pricing.monthly.currency} / ${markets.pricing.monthly.duration}`);
