import { readFile } from 'node:fs/promises';

const staging = String(process.env.STAGING_URL || '').replace(/\/$/, '');
const site = JSON.parse(await readFile('data/site.json', 'utf8'));
const production = String(site.url || '').replace(/\/$/, '');

if (!/^https:\/\//.test(staging)) throw new Error('STAGING_URL must use HTTPS');
if (staging === production) throw new Error('Refusing to deploy a staging build to the production URL');

const host = new URL(staging).hostname.toLowerCase();
if (!host.includes('staging')) throw new Error('Staging URL hostname must identify itself as staging');

console.log(`Confirmed staging target: ${staging}`);
