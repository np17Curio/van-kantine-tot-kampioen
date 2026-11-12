// Ontwikkelpagina (pixeltest.html): alle animaties van de pixelspelers, met verschillende looks.
// window.__sheet() tekent de vijf originele animaties precies zoals de sheet van de stijlbron (om pixel voor pixel te vergelijken).
import { ORIGINEEL, ANIM_NAMEN, tekenFrame } from './animaties.js';
import { inkleuren } from './rig.js';
import { frame, lookVan } from './atlas.js';
import { KAPSEL_KEUZE } from '../../data/uiterlijk.js';

import { maakContract } from './contract.js';
import { maakOpkomst } from './opkomst.js';
import { DRAAI_FRAMES, draaiBeeld, stijlKrant } from './krant.js';
// De krant van de stijlbron (deel 10) en het indraaien, als strip van 24 beelden van 300×300 (zoals pxl anim 'krant')
window.__krantStrip = () => { const {uitsnede} = maakContract({stijlbron:true, alleenUitsnede:true}), p = stijlKrant(uitsnede()), c = document.createElement('canvas');
  c.width = 300 * DRAAI_FRAMES; c.height = 300; const g = c.getContext('2d'); for (let f = 0; f < DRAAI_FRAMES; f++) g.drawImage(draaiBeeld(p, f, 300, '#0f1424'), f * 300, 0); return c.toDataURL('image/png'); };
// De opkomst in de kleuren van de stijlbron, per beeld vergeleken met de strip van pxl (frame f op x = f·382)
window.__opkomstVgl = async (ref, alleen) => {
  const im = await new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.src = ref; });
  const op = maakOpkomst({stijlbron:true}), W = op.W, H = op.H, a = document.createElement('canvas'), r = document.createElement('canvas');
  a.width = r.width = W; a.height = r.height = H; const ga = a.getContext('2d'), gr = r.getContext('2d'), per = {}, voorb = [];
  for (let f = 0; f < 216; f++){ if (alleen && !alleen.includes(f)) continue;
    op.teken(ga, f); gr.clearRect(0, 0, W, H); gr.drawImage(im, f * W, 0, W, H, 0, 0, W, H);
    const A = ga.getImageData(0, 0, W, H).data, B = gr.getImageData(0, 0, W, H).data;
    for (let i = 0; i < A.length; i += 4){ const ta = A[i + 3] > 127, tb = B[i + 3] > 127;
      if (ta !== tb || (ta && (A[i] !== B[i] || A[i+1] !== B[i+1] || A[i+2] !== B[i+2]))){ per[f] = (per[f] || 0) + 1; if (voorb.length < 20) voorb.push([f, (i / 4) % W, Math.floor(i / 4 / W), [A[i], A[i+1], A[i+2], A[i+3]].join('/'), [B[i], B[i+1], B[i+2], B[i+3]].join('/')]); } } }
  return JSON.stringify({per, voorb});
};
window.__opkomstBeeld = f => { const op = maakOpkomst({stijlbron:true}), c = document.createElement('canvas'); c.width = op.W; c.height = op.H; op.teken(c.getContext('2d'), f); return c.toDataURL(); };
// De contractscène in de kleuren van de stijlbron, als strip (frame f op x = f·222), om met pxl te vergelijken
window.__contractStrip = () => { const {frames} = maakContract({stijlbron:true}), c = document.createElement('canvas'); c.width = frames.length * frames[0].width; c.height = frames[0].height;
  const g = c.getContext('2d'); frames.forEach((fr, i) => g.drawImage(fr, i * fr.width, 0)); return c.toDataURL('image/png'); };
const uit = document.getElementById('uit'), Z = 2;
const groot = (cv, z = Z) => { const c = document.createElement('canvas'); c.width = cv.width * z; c.height = cv.height * z; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(cv, 0, 0, c.width, c.height); return c; };
const vak = (cv, label) => { const d = document.createElement('div'); d.className = 'vak'; d.append(groot(cv)); const s = document.createElement('span'); s.textContent = label; d.append(s); return d; };
const kop = t => { const h = document.createElement('h2'); h.textContent = t; uit.append(h); };
const rij = () => { const r = document.createElement('div'); r.className = 'rij'; uit.append(r); return r; };

// De sheet van de stijlbron: frames in volgorde, 'pad' 2, de rijen lopen door tot de breedte van 794 px vol is
// pos: optioneel {naam_i: [x, y]} uit de JSON van pxl (pxl deelt de sheet zelf in)
window.__sheet = (W = 794, H = 562, namen = Object.keys(ORIGINEEL), pos = null) => {
  const frames = [];
  for (const naam of namen){ const a = ORIGINEEL[naam]; for (let i = 0; i < a.frames.length; i++){ const cv = inkleuren(tekenFrame(a, i, {})); cv.sl = naam + '_' + i; frames.push(cv); } }
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  let x = 0, y = 0, rijH = 0;
  for (const f of frames){ if (pos && pos[f.sl]){ g.drawImage(f, pos[f.sl][0], pos[f.sl][1]); continue; } if (x + f.width > W){ x = 0; y += rijH + 2; rijH = 0; } g.drawImage(f, x, y); x += f.width + 2; rijH = Math.max(rijH, f.height); }
  return cv.toDataURL('image/png');
};

kop('De stijlbron (originele kleuren, met bal)');
for (const naam of Object.keys(ORIGINEEL)){ const r = rij(), a = ORIGINEEL[naam]; for (let i = 0; i < a.frames.length; i++) r.append(vak(inkleuren(tekenFrame(a, i, {})), `${naam} ${i}`)); }

// Rennen in drie richtingen (opzij, naar je toe, van je af), met verschillende kapsels
const RICHTING_LOOKS = [['model', {huid:1, haar:2}], ['staart', {huid:0, haar:3, vrouw:true}], ['afro', {huid:4, haar:0}], ['kaal', {huid:2, haar:1}], ['vlechten', {huid:5, haar:0, vrouw:true}], ['kuif', {huid:3, haar:4}]];
const RT = new URLSearchParams(location.search).get('richting');
kop('Rennen in drie richtingen');
for (const [k, u] of RICHTING_LOOKS){
  const look = lookVan({...u, kapsel:k}, {shirt:'#d42a2a', accent:'#f2f2f2', patroon:'strepen', broek:'#16171c', sok:'#d42a2a'}, {rugnummer:'10'});
  const r = rij();
  for (const an of ['ren', 'ren_voor', 'ren_achter']) for (const i of [0, 2, 4, 6]) r.append(vak(frame(look, an, i), an + ' ' + i + ' · ' + k));
}
if (RT){ window.__klaar = true; throw new Error('alleen richtingen'); }
const looks = {
  speler:lookVan({huid:1, haar:2, kapsel:'model'}, {shirt:'#d42a2a', accent:'#f2f2f2', patroon:'strepen', broek:'#16171c', sok:'#d42a2a'}),
  keeper:lookVan({huid:4, haar:0, kapsel:'afro'}, {shirt:'#8a5cf0', accent:'#141720', patroon:'effen', broek:'#141720', sok:'#8a5cf0'}, {handschoen:true}),
  speelster:lookVan({huid:0, haar:3, kapsel:'staart', vrouw:true}, {shirt:'#1e5bd6', accent:'#f2f2f2', patroon:'bies', broek:'#f2f2f2', sok:'#1e5bd6'}),
  pak:lookVan({huid:2, haar:5, kapsel:'kort'}, null, {kleding:'pak', nr:3}),
  trainer:lookVan({huid:3, haar:1, kapsel:'kaal'}, {shirt:'#1b2a52', accent:'#f5c400', broek:'#1b2a52'}, {kleding:'training'}),
};
const keuze = new URLSearchParams(location.search).get('look');
for (const [naam, look] of Object.entries(looks)){
  if (keuze && keuze !== naam) continue;
  kop('Alle animaties: ' + naam);
  for (const an of ANIM_NAMEN){ const r = rij(); const n = Math.min(8, (await import('./animaties.js')).ANIMS[an].frames.length); for (let i = 0; i < n; i++) r.append(vak(frame(look, an, i), `${an} ${i}`)); }
}
kop('Kapsels en huid (sta)');
{ const r = rij(); KAPSEL_KEUZE.forEach(([k, n], i) => { r.append(vak(frame(lookVan({huid:i % 6, haar:(i * 2) % 6, kapsel:k}, null), 'sta', 0), n)); r.append(vak(frame(lookVan({huid:(i + 3) % 6, haar:(i + 1) % 6, kapsel:k, vrouw:true}, null), 'sta', 0), n + ' (v)')); }); }
kop('Shirtpatronen');
{ const r = rij(); for (const p of ['effen', 'strepen', 'banen', 'helften', 'sjerp', 'blokken', 'bies']) r.append(vak(frame(lookVan({huid:1, haar:1, kapsel:'kort'}, {shirt:'#1f9d55', accent:'#f2f2f2', patroon:p, broek:'#16171c', sok:'#1f9d55'}), 'sta', 0), p)); }
window.__klaar = true;
