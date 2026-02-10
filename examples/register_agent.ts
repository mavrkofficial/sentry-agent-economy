import { registerAgentFromEnv } from '../SDK/src/index.js';

const out = await registerAgentFromEnv();
console.log(JSON.stringify(out, null, 2));

console.log('\nSave the apiKey securely (shown once).');
