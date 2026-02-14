import { ssaasSubscribe } from '../SDK/src/index.js';

// NOTE: walletAddress is your PUBLIC key only.
// NEVER send your private key to any API. Sentry is non-custodial.
const result = await ssaasSubscribe({
  ssaasUrl: process.env.SSAAS_API_URL!,
  clientId: process.env.AGENT_NAME || 'my-agent-001',
  plan: 'weekly',
  markets: ['SOL', 'BONK', 'PENGU'],
  walletAddress: process.env.WALLET_PUBLIC_KEY,
});

console.log('Invoice created:');
console.log('  Invoice ID:', result.invoice.invoiceId);
console.log('  Amount:', result.invoice.amountUsdc, 'USDC');
console.log('  Pay to:', result.invoice.recipient);
console.log('  Memo:', result.invoice.memo);
console.log('  Expires:', result.invoice.expiresAt);
console.log('');
console.log('API Key (save this!):', result.invoice.apiKey);
console.log('');
console.log('Send exactly', result.invoice.amountUsdc, 'USDC to the recipient with the memo above.');
console.log('Payment is verified automatically on-chain.');
