import { readFile } from 'node:fs/promises';

const site = JSON.parse(await readFile('data/site.json', 'utf8'));

if (site.launch_status !== 'ready') {
  throw new Error('Production release blocked: data/site.json launch_status must be "ready"');
}
if (!/^https:\/\//.test(site.url)) {
  throw new Error('Production release blocked: site URL must use HTTPS');
}

console.log('Production release gate passed.');
