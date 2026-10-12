import { appendFile, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const mode = process.argv[2] || 'list';
if (!['list', 'due'].includes(mode)) {
  console.error('usage: node scripts/schedule.mjs [list|due]');
  process.exit(2);
}
const today = process.env.PUBLISH_DATE || new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new Error('PUBLISH_DATE must be YYYY-MM-DD');

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
    state:metadata.draft === true ? 'draft' : (published > today ? 'scheduled' : approved ? 'live' : 'unscheduled'),
    slug:String(metadata.slug || '')
  });
}

const goingLive=rows.filter(row=>row.state==='live' && row.published===today);
if(mode==='due') {
  const due=goingLive.length>0;
  console.log(due ? `${goingLive.length} post(s) go live on ${today}: ${goingLive.map(row=>row.slug).join(', ')}` : `Nothing goes live on ${today}.`);
  if(process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT,`due=${due}\n`);
} else {
  console.log(`Publishing schedule as of ${today} (UTC)\n`);
  for(const row of rows) console.log(`${row.id}\t${row.published}\t${row.state}\t${row.slug}`);
}
