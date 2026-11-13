// Maakt de achtergrondmuziek van het spel met de ElevenLabs Music API (één keer draaien, daarna staan de mp3's in public/muziek).
// De sleutel komt alleen uit de omgeving en wordt nergens bewaard: zet hem nooit in de code van het spel, want die kan iedere speler lezen.
//   ELEVENLABS_API_KEY=... node scripts/maak-muziek.mjs            (maakt wat er nog ontbreekt)
//   ELEVENLABS_API_KEY=... node scripts/maak-muziek.mjs --opnieuw spel-1   (maakt één nummer opnieuw)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SLEUTEL = process.env.ELEVENLABS_API_KEY;
if (!SLEUTEL){ console.error('Zet eerst ELEVENLABS_API_KEY in de omgeving.'); process.exit(1); }
const MAP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'muziek');
fs.mkdirSync(MAP, {recursive:true});

// (eerste versie was te rustig, "liftmuziek": nu met een echte groove en energie, maar zonder zang en zonder grote drops, zodat je er nog bij kunt lezen)
const SAMEN = 'Instrumental only, no vocals, no spoken words. Loopable with a steady driving energy, no long quiet breaks and no huge EDM drops. Hype background music for a modern football career video game menu, like a FIFA or EA FC soundtrack vibe.';
const NUMMERS = [
  {naam:'menu', prompt:`Hyped up hip-hop inspired beat with hard-hitting boom bap drums, a deep 808 style bass, a big cinematic brass and orchestral hit hook, a dark piano riff and stadium crowd style percussion, around 90 BPM, bold anthemic swagger, like the intro of a football highlights show before a big final. ${SAMEN}`},
  {naam:'spel-1', prompt:`Hyped up hip-hop inspired beat with hard-hitting boom bap drums, a deep 808 style bass, a catchy chopped soul strings hook, a clean electric guitar lick and vocal-chop style textures without words, around 92 BPM, bold and confident swagger, like warming up before a big match. ${SAMEN}`},
  {naam:'spel-2', prompt:`Hyped up hip-hop inspired beat with hard-hitting boom bap drums, a fat bass line, punchy brass stabs, a bright piano hook and crowd-chant style energy, around 96 BPM, bold and swaggering, like a highlight reel of great goals. ${SAMEN}`},
];
const LENGTE = 150000; // 2:30

const opnieuw = process.argv.includes('--opnieuw') ? process.argv[process.argv.indexOf('--opnieuw') + 1] : null;

async function maak(n, model){
  const r = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', {
    method:'POST', headers:{'xi-api-key':SLEUTEL, 'Content-Type':'application/json', 'Accept':'audio/mpeg'},
    body:JSON.stringify({prompt:n.prompt, music_length_ms:LENGTE, model_id:model, force_instrumental:true}),
  });
  if (!r.ok) throw Object.assign(new Error(`${r.status} ${(await r.text()).slice(0, 400)}`), {status:r.status});
  return Buffer.from(await r.arrayBuffer());
}

for (const n of NUMMERS){
  const doel = path.join(MAP, n.naam + '.mp3');
  if (fs.existsSync(doel) && opnieuw !== n.naam){ console.log(`${n.naam}: bestaat al, overgeslagen`); continue; }
  if (opnieuw && opnieuw !== n.naam) continue;
  console.log(`${n.naam}: bezig (dat duurt even)...`);
  let data;
  try { data = await maak(n, 'music_v2_5'); }
  catch (e){ if (e.status !== 422 && e.status !== 400) throw e; console.log(`  music_v2_5 lukte niet (${e.message.slice(0, 120)}), probeer music_v1`); data = await maak(n, 'music_v1'); }
  fs.writeFileSync(doel, data);
  console.log(`${n.naam}: klaar, ${(data.length / 1048576).toFixed(1)} MB`);
}
