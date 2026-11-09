// Fetches the pool timetable day by day and writes pool.json for Stride.
// Run by .github/workflows/pool.yml once a day. Usage: node pool-timetable.mjs [previous.json] out.json
// Config comes from the workflow: POOL_NAME, POOL_AJAX (the club site's timetable endpoint), POOL_CAL, POOL_PAGE, POOL_BOOK.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [prevPath, outPath] = process.argv.length > 3 ? process.argv.slice(2) : [null, process.argv[2] || 'pool.json'];
const { POOL_NAME = 'Pool', POOL_AJAX, POOL_CAL = 'swimming', POOL_PAGE = '', POOL_BOOK = '' } = process.env;
if (!POOL_AJAX) throw new Error('POOL_AJAX not set');
const DAYS = 28, UA = 'Mozilla/5.0 (compatible; StrideTimetable/1.0; personal training plan)';

let prev = {};
try { if (prevPath) prev = JSON.parse(readFileSync(prevPath, 'utf8')).days || {}; } catch {}

const ukDate = d => new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/London' }).format(d);  // YYYY-MM-DD
const today = new Date(ukDate(new Date()) + 'T12:00:00Z');
const monday = new Date(today); monday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));
const ENT = { amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", nbsp:' ' };
const decode = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&(\w+);/g, (m, n) => ENT[n] ?? m).replace(/\s+/g, ' ').trim();

function parse(html){
  const out = [], re = /<div class="single-column-header">([^<]*)<\/div>\s*<div class="single-column-header">([^<]*)<\/div>/g;
  for (let m; (m = re.exec(html));){
    const t = decode(m[1]).match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/); if (!t) continue;
    const hm = (h, mi) => `${h.padStart(2, '0')}:${mi}`;
    out.push([hm(t[1], t[2]), hm(t[3], t[4]), decode(m[2])]);
  }
  return out.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
}

const days = {}; let ok = 0, failed = 0;
for (let i = 0; i < DAYS; i++){
  const d = new Date(monday); d.setUTCDate(monday.getUTCDate() + i); const key = d.toISOString().slice(0, 10);
  try {
    const res = await fetch(`${POOL_AJAX}?action=get_events_timetable&day=${key}&calendar=${encodeURIComponent(POOL_CAL)}`, { headers:{ 'User-Agent':UA } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    days[key] = parse(await res.text()); ok++;
  } catch (e){ failed++; console.log(`${key}: ${e.message}`); if (prev[key]) days[key] = prev[key]; }
  await new Promise(r => setTimeout(r, 400));   // be gentle with the club's site
}
if (!ok) { console.error('Every request failed; keeping the old timetable.'); process.exit(1); }
const data = { name:POOL_NAME, page:POOL_PAGE, book:POOL_BOOK, fetched:new Date().toISOString(), days };
mkdirSync(dirname(outPath) || '.', { recursive:true });
writeFileSync(outPath, JSON.stringify(data));
console.log(`Saved ${ok} days (${failed} failed), ${Object.values(days).reduce((a, d) => a + d.length, 0)} sessions.`);
