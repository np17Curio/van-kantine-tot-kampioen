// Maakt Models/speler.glb uit het originele spelersmodel, zodat het spel sneller laadt:
// - bal en wimpers eruit (het spel tekent een eigen bal); de spijkerbroek blijft: het spel maakt er een korte broek met sokken van
// - texturen maximaal 1024 px, als JPEG waar geen doorzichtigheid nodig is
// Het omzetten van de afbeeldingen gebeurt met een canvas in headless Chrome (Node kan zelf geen afbeeldingen schalen).
// Gebruik: node scripts/model-verkleinen.mjs
// Model: "pallone da calcio+giocatore" door rosaliarenda (Sketchfab), CC-BY-4.0. Aangepast: bal en wimpers weggelaten, texturen verkleind.
import { NodeIO } from '@gltf-transform/core';
import { prune, dedup } from '@gltf-transform/functions';
import { spawn } from 'child_process';
import fs from 'fs'; import os from 'os'; import path from 'path';

const BRON = 'Models/pallone_da_calciogiocatore.glb', DOEL = 'Models/speler.glb', MAX = 1024;
const WEG = /^Solid|eyelashes/;
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => fs.existsSync(p));
if (!CHROME) throw new Error('Geen Chrome of Edge gevonden om de texturen te verkleinen');

// --- headless browser om afbeeldingen te schalen ---
const wacht = ms => new Promise(r => setTimeout(r, ms));
const profiel = fs.mkdtempSync(path.join(os.tmpdir(), 'model-'));
const browser = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9399', `--user-data-dir=${profiel}`, '--no-first-run', 'about:blank'], {stdio:'ignore'});
let ws;
for (let i = 0; i < 60 && !ws; i++){ try { const t = await (await fetch('http://127.0.0.1:9399/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch {} if (!ws) await wacht(250); }
await new Promise(r => ws.onopen = r);
let id = 0; const wachtend = {};
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && wachtend[d.id]){ wachtend[d.id](d); delete wachtend[d.id]; } };
const ev = expr => new Promise(r => { const i = ++id; wachtend[i] = r; ws.send(JSON.stringify({id:i, method:'Runtime.evaluate', params:{expression:expr, returnByValue:true, awaitPromise:true}})); })
  .then(d => { if (d.result.exceptionDetails) throw new Error(d.result.exceptionDetails.text); return d.result.result.value; });
async function schaal(bytes, mime, jpeg){
  const b64 = Buffer.from(bytes).toString('base64');
  const uit = await ev(`(async () => { const img = new Image(); img.src = 'data:${mime};base64,${b64}'; await img.decode();
    const w = Math.min(${MAX}, img.width), h = Math.round(img.height * w / img.width), c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h); return c.toDataURL('${jpeg ? 'image/jpeg' : 'image/png'}', .88).split(',')[1]; })()`);
  return new Uint8Array(Buffer.from(uit, 'base64'));
}

// --- model aanpassen ---
const io = new NodeIO(), doc = await io.read(BRON), root = doc.getRoot();
for (const mesh of root.listMeshes()) if (WEG.test(mesh.getName())) mesh.dispose();
await doc.transform(prune(), dedup());
const doorzichtig = new Set();
for (const m of root.listMaterials()) if (m.getAlphaMode() !== 'OPAQUE') [m.getBaseColorTexture()].forEach(t => t && doorzichtig.add(t));
for (const t of root.listTextures()){
  const voor = t.getImage().byteLength, jpeg = !doorzichtig.has(t);
  t.setImage(await schaal(t.getImage(), t.getMimeType(), jpeg)).setMimeType(jpeg ? 'image/jpeg' : 'image/png');
  if (jpeg) t.setURI(t.getURI().replace(/\.png$/i, '.jpg'));
  console.log(`textuur ${t.getName() || '?'}: ${(voor / 1024) | 0} kB -> ${(t.getImage().byteLength / 1024) | 0} kB${jpeg ? ' (jpeg)' : ''}`);
}
await io.write(DOEL, doc);
console.log(`${DOEL}: ${(fs.statSync(BRON).size / 1048576).toFixed(1)} MB -> ${(fs.statSync(DOEL).size / 1048576).toFixed(1)} MB, onderdelen: ${root.listMeshes().map(m => m.getName()).join(', ')}`);
ws.close(); browser.kill(); try { fs.rmSync(profiel, {recursive:true, force:true}); } catch {}
process.exit(0);
