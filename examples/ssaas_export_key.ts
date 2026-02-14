/**
 * Export your wallet private key to the owner.
 * 
 * WARNING: Only run this when the owner explicitly requests their key.
 * Clear your terminal/chat history immediately after the owner copies it.
 */

import dotenv from 'dotenv';
dotenv.config();

import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

if (!process.env.WALLET_SECRET_KEY) {
  console.error('No WALLET_SECRET_KEY found in .env');
  process.exit(1);
}

const secretKey = bs58.decode(process.env.WALLET_SECRET_KEY);
const keypair = Keypair.fromSecretKey(secretKey);

console.log('');
console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║                    ⚠  PRIVATE KEY EXPORT  ⚠                    ║');
console.log('╠══════════════════════════════════════════════════════════════════╣');
console.log('║                                                                ║');
console.log('║  Your wallet private key is displayed below.                   ║');
console.log('║                                                                ║');
console.log('║  AFTER YOU COPY THIS KEY:                                      ║');
console.log('║  1. Store it in a password manager or offline backup           ║');
console.log('║  2. CLEAR your terminal/chat history immediately               ║');
console.log('║  3. NEVER paste it into a website, form, or DM                 ║');
console.log('║  4. NEVER share it with anyone — not even "support"            ║');
console.log('║  5. NEVER screenshot it or save it in plain text               ║');
console.log('║                                                                ║');
console.log('║  Anyone with this key has FULL CONTROL of your wallet          ║');
console.log('║  and can drain ALL funds. There is no recovery.                ║');
console.log('║                                                                ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('Wallet address:', keypair.publicKey.toBase58());
console.log('Private key:',    process.env.WALLET_SECRET_KEY);
console.log('');
console.log('This key can be imported into Phantom, Solflare, or any Solana wallet.');
console.log('');
console.log('After saving — CLEAR THIS OUTPUT from your terminal or chat history.');
