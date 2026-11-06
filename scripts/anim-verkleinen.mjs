// Verkleint een animatie-JSON (uit het pakket voetbal-animaties) voor het spel: getallen afronden en wat we niet
// gebruiken weglaten. Gebruik: node scripts/anim-verkleinen.mjs <bron.json> <doel.json>
import { readFile, writeFile } from 'node:fs/promises';

const [bron, doel] = process.argv.slice(2);
if (!bron || !doel){ console.error('Gebruik: node scripts/anim-verkleinen.mjs <bron.json> <doel.json>'); process.exit(1); }
const d = JSON.parse(await readFile(bron, 'utf8'));
const rond = n => v => Array.isArray(v) ? v.map(rond(n)) : typeof v === 'number' ? +v.toFixed(n) : v;
const pos = rond(3), rot = rond(4);
for (const sporen of Object.values(d.characters)) for (const s of Object.values(sporen)){ if (s.t) s.t = pos(s.t); if (s.r) s.r = rot(s.r); }
for (const o of Object.values(d.objects)){ if (o.t) o.t = pos(o.t); if (o.r) o.r = rot(o.r); }
if (d.events){ delete d.events.teams; delete d.events.opstelling_uitleg; } // (de opstelling komt uit het spel zelf)
const uit = JSON.stringify(d);
await writeFile(doel, uit);
console.log(`${doel}: ${(uit.length / 1e6).toFixed(2)} MB (was ${((await readFile(bron)).length / 1e6).toFixed(2)} MB)`);
