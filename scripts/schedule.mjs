import { appendFile, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const mode = process.argv[2] || 'list';
if (!['list', 'due'].includes(mode)) {
  console.error('usage: node scripts/schedule.mjs [list|due]');
  process.exit(2);
}
// PUBLISH_DATE may be YYYY-MM-DD (end of that day) or YYYY-MM-DDTHH:MM (UTC).
const nowKey = process.env.PUBLISH_DATE ? (process.env.PUBLISH_DATE.length === 10 ? `${process.env.PUBLISH_DATE}T23:59` : process.env.PUBLISH_DATE.slice(0, 16)) : new Date().toISOString().slice(0, 16);
if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(nowKey)) throw new Error('PUBLISH_DATE must be YYYY-MM-DD or YYYY-MM-DDTHH:MM');
const today = nowKey.slice(0, 10);
// The hourly job deploys when a post's publish moment fell in the last 75 minutes,
// so a delayed GitHub run still catches it. A second deploy is harmless.
const windowStart = new Date(Date.parse(`${nowKey}:00Z`) - 75 * 60000).toISOString().slice(0, 16);
const moment = m => `${String(m.published || '')}T${/^\d{2}:\d{2}$/.test(String(m.publish_time || '')) ? m.publish_time : '00:00'}`;

let names=[];
try {
  names=(await readdir('content/posts')).filter(name=>name.endsWith('.md')).sort();
} catch(error) {
  if (error.code !== 'ENOENT') throw error;
}

function frontMatter(raw) {
  const match=raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const metadata={};
  for (const line of match[1].split(/\r?\n/)) {
    const colon=line.indexOf(':');
    if (colon < 1) continue;
    const key=line.slice(0,colon).trim();
    let value=line.slice(colon+1).trim().replace(/^["']|["']$/g,'');
    if (value === 'true') value=true;
    if (value === 'false') value=false;
    metadata[key]=value;
  }
  return metadata;
}

const rows=[];
for(const name of names) {
  const metadata=frontMatter(await readFile(path.join('content/posts',name),'utf8'));
  const published=String(metadata.published || '').trim();
  const approved=metadata.draft !== true && /^\d{4}-\d{2}-\d{2}$/.test(published);
  rows.push({
    id:String(metadata.content_id || metadata.tracker_id || name),
    published:published || '-',
    at:approved ? moment(metadata) : '-',
    state:metadata.draft === true ? 'draft' : (!approved ? 'unscheduled' : moment(metadata) > nowKey ? 'scheduled' : 'live'),
    slug:String(metadata.slug || '')
  });
}

const goingLive=rows.filter(row=>row.state==='live' && row.at>windowStart && row.at<=nowKey);
if(mode==='due') {
  const due=goingLive.length>0;
  console.log(due ? `${goingLive.length} post(s) went live since ${windowStart} UTC: ${goingLive.map(row=>`${row.slug} (${row.at})`).join(', ')}` : `Nothing went live between ${windowStart} and ${nowKey} UTC.`);
  if(process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT,`due=${due}\n`);
} else {
  console.log(`Publishing schedule as of ${nowKey} UTC\n`);
  for(const row of rows) console.log(`${row.id}\t${row.at}\t${row.state}\t${row.slug}`);
}
