import { checkTokenGate } from '../SDK/src/index.js';

const result = await checkTokenGate({
  apiUrl: process.env.SENTRY_API_URL!,
  apiKey: process.env.SENTRY_AGENT_API_KEY!,
});

const d = result.data;

if (d.verified) {
  console.log('Token gate VERIFIED — EE-16 access unlocked');
  console.log(`  Deposited: ${d.totalDeposited.toLocaleString()} MOLTING`);
} else {
  console.log('Token gate NOT YET VERIFIED');
  console.log(`  Required:  ${d.required.toLocaleString()} MOLTING`);
  console.log(`  Deposited: ${d.totalDeposited.toLocaleString()} MOLTING`);
  console.log(`  Remaining: ${d.remaining.toLocaleString()} MOLTING`);
  console.log(`  Fees wallet: ${d.feesWallet}`);
  console.log(`  MOLTING mint: ${d.moltingMint}`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Market-buy MOLTING via Jupiter (SOL → MOLTING)');
  console.log(`  2. Transfer ${d.remaining.toLocaleString()} MOLTING to ${d.feesWallet}`);
  console.log('  3. Re-run this script to verify');
}
