/* ===================== De opkomst in pixels (zoals bij FIFA) ===================== */
// Naar de stijlbron (art/chibi_anims.px.js, deel 9 'opkomst'): de teams wachten in de spelerstunnel en lopen naar buiten,
// stellen zich op in één rij (met een naambalk), het uitteam schudt de handen van het thuisteam, en tot slot de opstellingen.
// 216 beelden van 380×200 op 10 fps. In het spel met de echte teams: tenues, namen, rugnummers, aanvoerders, formaties.
// Alles wordt in sleutels getekend en per onderdeel met een eigen palet ingekleurd (zie ook contract.js).
import { pixelLogo, zetLogo } from './clublogo.js';
import { Doek, GROND, Img, ORIGINEEL, inkleuren, speler, sprite } from './rig.js';
import { loopCyclus } from './animaties.js';
import { donker } from './atlas.js';
import { regelBreedte, tekst } from './font.js';

export const SW = 380, SH = 200, OP_FRAMES = 216, OP_FPS = 10;
const T2 = 78, T3 = 140, T4 = 176, WACHT = 12, STAP = 6, AFSTAND = 30, TG = 300, TW = TG + 380;
const SPOT = 30, PIJL_H = 76; // (jouw close-up: 3 seconden; de pijl staat zo hoog boven de voeten)
const RIJ_AFSTAND = 28, RIJ_VOET = 170, RIJ_MARGE = 40, VB = 170, VH = 146, VELD = {thuis:[12, 46], uit:[198, 46]};
export const FLITS3 = [[56, 60, 40], [60, 220, 55], [64, 130, 30], [68, 300, 70], [73, 80, 75]];
export const DEEL = {tunnel:0, rij:T2, handen:T3, opstelling:T4};
const K = s => s.charCodeAt(0);

// ---------- kleuren uit de stijlbron ----------
const STIJL = {k:'#1a1414', s:'#f7c9a8', S:'#e3a07e', p:'#f19a8f', h:'#b5541c', H:'#7e3410', j:'#dc7a3c', r:'#e0262b', R:'#a3161b', w:'#ffffff', W:'#d4d4de',
  u:'#2f62d6', U:'#1d3c8f', y:'#ffd21a', Y:'#e39a0c', g:'#1f8a5a', G:'#13603e', q:'#7ed957', Q:'#4fa83a', v:'#2b3f9e', V:'#1a2563', o:'#ffd84a', O:'#d9a91c',
  n:'#2a1f1c', N:'#140e0c', m:'#4a3a34', x:'#f4f4f8', X:'#c4c4d0', z:'#3a3a44', Z:'#24242c', a:'#b8650a', A:'#8a4a08', c:'#34343e', C:'#22222a',
  i:'#a8744f', I:'#6f4630', d:'#7a4a2a', B:'#3b2a22', K:'#0f1424', M:'#ffe9a8', b:'#3c4a6e'};

// ---------- de toevalsgenerator van pxl (zelfde fans op dezelfde plek als in de stijlbron) ----------
function rng(seed = 1){
  let s = seed >>> 0;
  const mix = () => { s = (s + 0x9e3779b9) >>> 0; let z = s; z = Math.imul(z ^ (z >>> 16), 0x85ebca6b); z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35); return (z ^ (z >>> 16)) >>> 0; };
  let a = mix(), b = mix(), c = mix(), d = mix();
  const next = () => { const t = (((a + b) >>> 0) + d) >>> 0; d = (d + 1) >>> 0; a = b ^ (b >>> 9); b = (c + (c << 3)) >>> 0; c = ((c << 21) | (c >>> 11)) >>> 0; c = (c + t) >>> 0; return t / 4294967296; };
  for (let i = 0; i < 8; i++) next();
  return next;
}
function hash(a, b, seed){
  let h = Math.imul(Math.floor(a) | 0, 0x9e3779b1) ^ Math.imul(Math.floor(b) | 0, 0x85ebca77) ^ Math.imul(Math.floor(seed) | 0, 0xc2b2ae3d);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d); h = Math.imul(h ^ (h >>> 12), 0x297a2d39); return (h ^ (h >>> 15)) >>> 0;
}

// ---------- de fans op de tribune ----------
const FAN = sprite(7, 9, c => { c.rect(2, 0, 3, 1, 'h'); c.rect(2, 1, 3, 3, 's'); c.rect(1, 4, 5, 5, 'r'); });
const FAN_JUICH = sprite(7, 9, c => { c.stamp(FAN, 0, 0); c.px(0, 1, 's'); c.px(6, 1, 's'); c.px(0, 2, 'r'); c.px(6, 2, 'r'); c.px(1, 3, 'r'); c.px(5, 3, 'r'); });
const FAN_KLEUR = [{}, {r:'w'}, {r:'R'}, {r:'v', s:'i', h:'n'}, {r:'o', h:'n'}, {r:'c', s:'d', h:'n'}, {h:'y'}, {r:'w', s:'i'}];
// na de wissel: de clubkleuren krijgen eigen sleutels (1-5), los van het wit en geel van het stadion
const PLOEG = {r:'1', R:'2', w:'3', v:'4', o:'5'};
const tegel = (img, sw) => { const o = new Img(img.w, img.h); for (let i = 0; i < img.d.length; i++){ const v = img.d[i]; if (!v){ continue; } const s = String.fromCharCode(v), t = sw[s] || s; o.d[i] = K(PLOEG[t] || t); } return o; };
const TEGELS = [FAN, FAN_JUICH].map(f => FAN_KLEUR.map(sw => tegel(f, sw)));
export function fans(c, soort, x, y, w, h, seed, leeg){
  for (let ty = y; ty < y + h; ty += 9) for (let tx = x; tx < x + w; tx += 7){
    const r = rng(hash(tx, ty, seed)); r(); const t = TEGELS[soort][Math.floor(r() * FAN_KLEUR.length)];
    if (leeg && hash(tx, ty, 77) % 3) continue; // (een leeg stadion: maar een derde van de stoelen bezet)
    const cw = Math.min(7, x + w - tx), ch = Math.min(9, y + h - ty);
    for (let yy = 0; yy < ch; yy++) for (let xx = 0; xx < cw; xx++){ const v = t.d[yy * 7 + xx]; if (v) c.img.set(tx + xx, ty + yy, v); }
  }
}
const box = (c, x, y, w, h, k) => { for (let xx = x; xx < x + w; xx++){ c.px(xx, y, k); c.px(xx, y + h - 1, k); } for (let yy = y + 1; yy < y + h - 1; yy++){ c.px(x, yy, k); c.px(x + w - 1, yy, k); } };

function stadion(w, info){
  return sprite(w, SH, c => {
    c.rect(0, 0, w, 22, 'K');
    for (let x = 40; x < w; x += 290){ c.rect(x, 0, 3, 22, 'b'); c.rect(x - 8, 2, 19, 7, 'M'); c.rect(x - 8, 2, 19, 1, 'w'); }
    c.rect(0, 20, w, 88, 'C');
    for (let y = 28; y < 106; y += 10) c.hline(0, y, w, 'c');
    fans(c, 0, 0, 19, w, 88, 3, info.leeg); fans(c, 1, 0, 19, w, 88, 9, info.leeg);
    c.rect(0, 106, w, 3, 'b'); c.rect(0, 109, w, 13, 'K'); c.rect(0, 109, w, 1, 'b'); c.rect(0, 121, w, 1, 'b');
    { let x = 8, i = 0; while (x < w){ const [t, k] = info.reclame[i % info.reclame.length]; tekst(c, x, 113, t, k); x += t.length * 4 + 24; i++; } }
    { let y = 122, h = 7, i = 0; while (y < SH){ c.rect(0, y, w, h, i % 2 ? 'G' : 'g'); y += h; h += 3; i++; } }
    c.hline(0, 126, w, 'w');
  });
}
const LOGO = ['..RRRRRRRRR', '..RrwrwrwrR', '..RrwrwrwrR', '..RrwrwrwrR', '..RrwrwrwrR', '...RrwrwrR.', '....RrwrR..', '.....RrR...', '......R....'];
const logo = sprite(16, 13, c => LOGO.forEach((rij, y) => [...rij].forEach((k, x) => { if (k !== '.') c.px(x, y, PLOEG[k]); })));
function tunnelWereld(info){
  return sprite(TW, SH, c => {
    c.stamp(stadion(TW - TG, info), TG, 0);
    c.rect(0, 0, TG, 34, 'b'); for (let x = 0; x < TG; x += 25) c.rect(x, 0, 3, 34, 'K');                // plafond met balken
    for (let x = 20; x < TG - 20; x += 55){ c.rect(x, 31, 18, 3, 'M'); c.rect(x + 2, 34, 14, 1, 'w'); }   // lampen
    c.rect(0, 34, TG, 88, 'c'); for (let x = 0; x < TG; x += 40) c.vline(x, 34, 82, 'C');                // betonnen wand
    c.rect(0, 116, TG, 6, '1'); c.rect(0, 116, TG, 1, '2');                                                // plint in clubkleuren
    if (!info.logoImg){ c.stamp(logo, 60, 52); c.stamp(logo, 200, 52); } // (met het echte logo: dat komt er als plaatje overheen)
    tekst(c, 130, 56, info.tunnelNaam, 'w'); tekst(c, 130, 66, 'DIT IS ONS HUIS', 'M');
    tekst(c, 236, 92, 'VELD', 'y'); c.line(254, 94, 262, 94, 'y'); c.px(261, 93, 'y'); c.px(261, 95, 'y');  // bordje met pijl
    c.rect(0, 122, TG, SH - 122, 'z'); for (let y = 130; y < SH; y += 12) c.hline(0, y, TG, 'Z');          // rubberen mat
    c.rect(TG - 14, 0, 22, 46, 'I'); c.rect(TG - 14, 0, 22, 3, 'i'); c.rect(TG - 8, 46, 10, 76, 'I'); c.rect(TG - 8, 46, 2, 76, 'i');   // uitgang
    tekst(c, TG - 11, 18, 'OUT', 'M');
  });
}
function opstellingsScherm(info){
  return sprite(SW, SH, c => {
    c.rect(0, 0, SW, SH, 'K'); c.rect(0, 0, SW, 2, 'y'); c.rect(0, SH - 2, SW, 2, 'y');
    tekst(c, SW / 2, 6, 'OPSTELLING', 'w', {scale:2, align:'c'});
    tekst(c, VELD.thuis[0] + VB / 2, 26, info.thuis.naam, '6', {align:'c'}); tekst(c, VELD.thuis[0] + VB / 2, 35, info.thuis.formatie, 'y', {align:'c'});
    tekst(c, VELD.uit[0] + VB / 2, 26, info.uit.naam, '7', {align:'c'}); tekst(c, VELD.uit[0] + VB / 2, 35, info.uit.formatie, 'y', {align:'c'});
    for (const [x0, y0] of Object.values(VELD)){
      for (let y = 0; y < VH; y += 16){ c.rect(x0, y0 + y, VB, 8, 'g'); c.rect(x0, y0 + y + 8, VB, Math.min(8, VH - y - 8), 'G'); }
      box(c, x0, y0, VB, VH, 'w');
      box(c, x0 + 45, y0 + VH - 32, 80, 32, 'w'); box(c, x0 + 67, y0 + VH - 12, 36, 12, 'w');
      c.rect(x0 + 75, y0 + VH - 1, 20, 1, 'W');
      for (let a = 0; a <= 180; a += 3) c.px(Math.round(x0 + VB / 2 + Math.cos(a * Math.PI / 180) * 20), Math.round(y0 + Math.sin(a * Math.PI / 180) * 20), 'w');
    }
  });
}

// ---------- de mensen ----------
const STAAN = {lL:[-4, 4], lR:[4, 4], aL:[-12, 15], aR:[12, 15]}, LOOP = loopCyclus(35);
const POSE = {staan:{...STAAN, x:35, aL:[-8, 10], aR:[8, 10]}, zstaan:{...STAAN, x:35, aL:[-4, 8], aR:[4, 8], zij:true}, zhand:{...STAAN, x:35, aL:[-5, 10], aR:[80, 5], zij:true}};
for (let k = 0; k < 8; k++){ POSE['l' + k] = LOOP[k]; POSE['hl' + k] = {...LOOP[k], aR:[80, 5]}; }
const VLAG = {',':'#d4d4de', ';':'#ffd84a', ':':'#e0262b'};
// persoon = {v (kapsel, vrouw, kleding, patroon, band), kleuren, hand ('q' bij handschoenen), vlag}
function persoonSprites(p){
  const cache = new Map();
  return (naam, flip = false) => {
    const sl = naam + (flip ? 'f' : ''); let cv = cache.get(sl); if (cv) return cv;
    const img = new Img(70, 90), c = new Doek(img), P = p.hand ? {...POSE[naam], hand:p.hand} : POSE[naam];
    const hand = speler(c, P, p.v);
    if (p.vlag){ const [hx, hy] = hand; c.line(hx, hy - 9, hx, hy + 2, ','); c.rect(hx + 1, hy - 9, 6, 5, ';'); c.rect(hx + 1, hy - 9, 3, 3, ':'); c.rect(hx + 4, hy - 7, 3, 3, ':'); }
    let o = img.outline(K('k')); if (flip) o = o.flipX();
    cv = inkleuren(o, {...p.kleuren, ...VLAG}); cache.set(sl, cv); return cv;
  };
}

// ---------- de stijlbron zelf (om te vergelijken) ----------
const HUIDK = {licht:['#f7c9a8', '#e3a07e'], getint:['#a8744f', '#6f4630'], donker:['#7a4a2a', '#3b2a22']};
const HAARK = {rood:['#b5541c', '#7e3410', '#dc7a3c'], zwart:['#2a1f1c', '#140e0c', '#4a3a34'], blond:['#ffd21a', '#e39a0c', '#ffffff'], bruin:['#a8744f', '#6f4630', '#b5541c']};
const KIT = {
  thuis:{r:'#e0262b', R:'#a3161b', w:'#ffffff', W:'#d4d4de', u:'#2f62d6', U:'#1d3c8f', o:'#e0262b', O:'#a3161b', y:'#ffd21a', Y:'#e39a0c', a:'#b8650a', A:'#8a4a08'},
  uit:{r:'#2b3f9e', R:'#1a2563', w:'#ffd84a', W:'#d9a91c', u:'#f4f4f8', U:'#c4c4d0', o:'#2b3f9e', O:'#1a2563', y:'#f4f4f8', Y:'#c4c4d0', a:'#3a3a44', A:'#24242c'},
  keeperThuis:{r:'#1f8a5a', R:'#13603e', w:'#7ed957', W:'#4fa83a', u:'#1a1414', U:'#1a1414', o:'#1a1414', O:'#1a1414'},
  keeperUit:{r:'#c4c4d0', R:'#f4f4f8', w:'#3a3a44', W:'#24242c', u:'#1a1414', U:'#1a1414', o:'#3a3a44', O:'#24242c'},
  scheids:{r:'#ffd84a', R:'#d9a91c', w:'#ffd84a', W:'#d9a91c', u:'#3a3a44', U:'#24242c', o:'#3a3a44', O:'#24242c', y:'#3a3a44', Y:'#24242c', a:'#1a1414', A:'#1a1414'},
};
const stijlKleuren = (huid, haar, ...kits) => ({...ORIGINEEL, s:HUIDK[huid][0], S:HUIDK[huid][1], h:HAARK[haar][0], H:HAARK[haar][1], j:HAARK[haar][2], ...Object.assign({}, ...kits)});
function stijlInfo(){
  const LOOKS = {thuis:[['licht', 'bruin'], ['getint', 'zwart'], ['licht', 'blond'], ['donker', 'zwart'], ['licht', 'rood'], ['getint', 'bruin'], ['licht', 'zwart'], ['licht', 'rood'], ['donker', 'zwart'], ['licht', 'blond'], ['getint', 'zwart']],
    uit:[['licht', 'zwart'], ['licht', 'blond'], ['donker', 'zwart'], ['getint', 'zwart'], ['licht', 'bruin'], ['licht', 'zwart'], ['donker', 'zwart'], ['licht', 'rood'], ['getint', 'bruin'], ['licht', 'zwart'], ['licht', 'blond']]};
  const NAMEN = {thuis:['JANSEN', 'DE VRIES', 'BAKKER', 'VISSER', 'SMIT', 'MEIJER', 'MULDER', 'DE BOER', 'BOS', 'VOS', 'PETERS'], uit:['HENDRIKS', 'DEKKER', 'BROUWER', 'DE WIT', 'DIJKSTRA', 'SMITS', 'DE GRAAF', 'VAN DAM', 'KOK', 'JACOBS', 'VERMEULEN']};
  const NRS = {thuis:[1, 2, 4, 5, 3, 8, 6, 10, 7, 9, 11], uit:[1, 2, 4, 5, 3, 7, 6, 8, 11, 9, 10]}, AANV = {thuis:7, uit:3};
  const FORMATIE = {thuis:[[85, 132], [22, 104], [63, 108], [107, 108], [148, 104], [40, 72], [85, 76], [130, 72], [28, 34], [85, 26], [142, 34]],
    uit:[[85, 132], [22, 104], [63, 108], [107, 108], [148, 104], [20, 70], [63, 74], [107, 74], [150, 70], [60, 32], [110, 32]]};
  const ploeg = kant => ({naam:kant === 'thuis' ? 'ROOD-WIT FC' : 'BLAUW-GEEL', formatie:kant === 'thuis' ? '4-3-3' : '4-4-2', aanv:AANV[kant], naamKleur:STIJL[kant === 'thuis' ? 'r' : 'o'], balk:STIJL[kant === 'thuis' ? 'r' : 'v'], balkCijfer:'#ffffff',
    elf:LOOKS[kant].map(([hu, ha], i) => ({naam:NAMEN[kant][i], nr:NRS[kant][i], xy:FORMATIE[kant][i], rond:i === 0 ? STIJL[kant === 'thuis' ? 'y' : 'X'] : STIJL[kant === 'thuis' ? 'r' : 'v'], cijfer:i === 0 ? STIJL.k : STIJL[kant === 'thuis' ? 'w' : 'o'],
      persoon:{v:{kapsel:'model', kleding:'tenue', patroon:'strepen', band:i === AANV[kant]}, kleuren:stijlKleuren(hu, ha, KIT[kant], i === 0 ? KIT[kant === 'thuis' ? 'keeperThuis' : 'keeperUit'] : {})}}))});
  const ref = (hu, ha, naam, vlag) => ({naam, persoon:{v:{kapsel:'model', kleding:'tenue', patroon:'strepen'}, kleuren:stijlKleuren(hu, ha, KIT.scheids), vlag}});
  return {thuis:ploeg('thuis'), uit:ploeg('uit'), scheids:[ref('licht', 'zwart', 'SCHEIDSRECHTER', false), ref('getint', 'bruin', 'ASSISTENT 1', true), ref('licht', 'blond', 'ASSISTENT 2', true)],
    reclame:[['PIXEL CUP 2026', 'y'], ['CHIBI SPORT', 'o'], ['GOAL!', 'w']], titel:'ROOD-WIT FC  -  BLAUW-GEEL', tunnelNaam:'ROOD-WIT FC',
    kleuren:{1:STIJL.r, 2:STIJL.R, 3:STIJL.w, 4:STIJL.v, 5:STIJL.o}};
}

// info (in het spel, uit opkomstscene.js) = {thuis, uit: {naam, formatie, aanv (index), naamKleur, balk, balkCijfer,
//   elf:[{naam, nr, xy, rond, cijfer, jij, persoon}]}, scheids:[{naam, persoon}], reclame, titel, tunnelNaam, kleuren (1-5: clubkleuren), leeg}
// Geeft {teken(g, f): beeld f op een 2D-context van (SW+2)×(SH+2), flitsen(f): flitst er iemand}
export function maakOpkomst(info = {}){
  if (info.stijlbron){ const j = info.jij; info = stijlInfo(); if (j) info.thuis.elf[9].jij = true; } // (jij: om de extra aandacht voor jou te testen)
  const pal = {...STIJL, ...info.kleuren, 6:info.thuis.naamKleur, 7:info.uit.naamKleur};
  const sp = {};
  ['thuis', 'uit'].forEach(kant => info[kant].elf.forEach((x, i) => { sp[kant + i] = persoonSprites(x.persoon); }));
  info.scheids.forEach((r, i) => { sp['ref' + i] = persoonSprites(r.persoon); });
  // volgorde (zoals de stijlbron): in de tunnel de scheidsrechters en de aanvoerders voorop; op de rij de aanvoerders naast de scheidsrechters
  const A = {thuis:info.thuis.aanv, uit:info.uit.aanv}, zonder = (kant, a) => info[kant].elf.map((_, i) => i).filter(i => i !== a);
  const BAAN = {achter:{voet:142, start:270, ids:['ref0', 'ref1', 'ref2', 'uit' + A.uit, ...zonder('uit', A.uit).map(i => 'uit' + i)]},
    voor:{voet:194, start:252, ids:['thuis' + A.thuis, ...zonder('thuis', A.thuis).map(i => 'thuis' + i)]}};
  const OPRIJ = [...zonder('thuis', A.thuis).map(i => 'thuis' + i), 'thuis' + A.thuis, 'ref1', 'ref0', 'ref2', 'uit' + A.uit, ...zonder('uit', A.uit).map(i => 'uit' + i)];
  const RIJ_W = RIJ_MARGE * 2 + (OPRIJ.length - 1) * RIJ_AFSTAND + 40;
  // de achtergronden
  const tunnelCv = inkleuren(tunnelWereld(info), pal);
  { const pl = pixelLogo(info.logoImg, 14); if (pl){ zetLogo(tunnelCv, pl, 61, 51); zetLogo(tunnelCv, pl, 201, 51); } } // het echte logo van de thuisclub in de tunnel
  const breedImg = stadion(RIJ_W, info), breedCv = inkleuren(breedImg, pal);
  const rijCv = document.createElement('canvas'); rijCv.width = RIJ_W; rijCv.height = SH;
  { const g = rijCv.getContext('2d'); g.drawImage(breedCv, 0, 0); OPRIJ.forEach((id, j) => g.drawImage(sp[id]('staan'), RIJ_MARGE + 20 + j * RIJ_AFSTAND - 35 - 1, RIJ_VOET - GROND - 1)); }
  const opstCv = inkleuren(opstellingsScherm(info), pal);
  // balken en teksten bovenin, de naambalken, de rondjes op het opstellingsscherm, de flits
  const balk = (t, k) => inkleuren(sprite(SW, 14, c => { c.rect(0, 0, SW, 14, 'K'); tekst(c, SW / 2, 4, t, k, {align:'c'}); }), STIJL);
  const titelCv = balk(info.titel, 'w'), fairCv = balk('FAIR PLAY', 'y');
  const wie = id => id.startsWith('ref') ? {naam:info.scheids[+id[3]].naam, nr:'', balk:STIJL.o, cijfer:STIJL.k}
    : (([, kant, i]) => { const x = info[kant].elf[+i]; return {naam:x.naam, nr:String(x.nr ?? ''), balk:info[kant].balk, cijfer:info[kant].balkCijfer}; })(id.match(/(thuis|uit)(\d+)/));
  const naambalk = id => { const w = wie(id);
    return inkleuren(sprite(SW, 18, c => { c.rect(0, 0, SW, 18, 'K'); c.rect(0, 0, SW, 1, 'y'); c.rect(10, 3, 26, 12, '1'); tekst(c, 23, 7, w.nr || '-', '2', {align:'c'}); tekst(c, 44, 5, w.naam, 'w', {scale:2}); }),
      {...STIJL, 1:w.balk, 2:w.cijfer}); };
  const balken = OPRIJ.map(naambalk);
  const rondjes = ['thuis', 'uit'].flatMap(kant => info[kant].elf.map((x, i) => ({x:VELD[kant][0] + x.xy[0], y:VELD[kant][1] + x.xy[1],
    cv:inkleuren(sprite(15, 15, c => { c.circ(7, 7, 7, i === A[kant] ? 'y' : x.jij ? 'M' : 'k'); c.circ(7, 7, 6, '1'); tekst(c, 8, 5, String(x.nr ?? ''), '2', {align:'c'}); }), {...STIJL, 1:x.rond, 2:x.cijfer})})));
  const flitsCv = inkleuren(sprite(9, 9, c => { c.line(4, 0, 4, 8, 'w'); c.line(0, 4, 8, 4, 'w'); c.rect(3, 3, 3, 3, 'w'); c.px(4, 4, 'y'); c.px(2, 2, 'y'); c.px(6, 2, 'y'); c.px(2, 6, 'y'); c.px(6, 6, 'y'); }), STIJL);
  const n = {thuis:info.thuis.elf.length, uit:info.uit.elf.length};
  // Sta jij in de basis? Dan krijg je extra aandacht: een pijl boven je hoofd in de tunnel en op de rij, een gouden naambalk,
  // en een eigen close-up (de camera zoomt op jou in, de fotografen flitsen) tussen de rij en het handjes schudden
  const jijKant = ['thuis', 'uit'].find(k => info[k].elf.some(x => x.jij)), jijId = jijKant ? jijKant + info[jijKant].elf.findIndex(x => x.jij) : null;
  const EXTRA = jijId ? SPOT : 0, jijJ = jijId ? OPRIJ.indexOf(jijId) : -1, jijX = RIJ_MARGE + 20 + jijJ * RIJ_AFSTAND;
  const pijlCv = inkleuren(sprite(11, 8, c => { for (let y = 0; y < 6; y++) c.rect(y, y, 11 - 2 * y, 1, y < 2 ? 'y' : 'Y'); c.px(5, 6, 'Y'); }).outline(K('k')), STIJL);
  const jijBalk = jijId && (() => { const w = wie(jijId);
    return inkleuren(sprite(SW, 18, c => { c.rect(0, 0, SW, 18, 'O'); c.rect(0, 0, SW, 1, 'w'); c.rect(0, 17, SW, 1, 'Y'); c.rect(10, 3, 26, 12, 'K'); tekst(c, 23, 7, w.nr || '-', 'y', {align:'c'}); tekst(c, 44, 5, w.naam, 'k', {scale:2}); }), STIJL); })();
  const spotTitel = jijId && balk('IN DE BASIS', 'y');

  const binnen = document.createElement('canvas'); binnen.width = SW; binnen.height = SH;
  const b = binnen.getContext('2d'); b.imageSmoothingEnabled = false;
  function teken(g, f){
    b.clearRect(0, 0, SW, SH);
    let spot = -1; if (EXTRA && f >= T3){ if (f < T3 + EXTRA) spot = f - T3; else f -= EXTRA; } // (de close-up van jou zit tussen de rij en het handjes schudden)
    if (f < T2){
      // 1. de tunnel: wachten, dan naar buiten; de camera loopt mee met de kop van de stoet
      const gelopen = Math.max(0, f - WACHT) * STAP, camX = Math.max(0, Math.min(TW - SW, BAAN.achter.start + gelopen - 200));
      b.drawImage(tunnelCv, -camX, 0);
      for (const baan of [BAAN.achter, BAAN.voor]) baan.ids.forEach((id, i) => {
        const x = baan.start - i * AFSTAND + gelopen - camX; if (x < -40 || x > SW + 40) return;
        b.drawImage(sp[id](f < WACHT ? 'zstaan' : 'l' + ((f + i * 3) % 8)), Math.round(x) - 36, baan.voet - GROND - 1);
        if (id === jijId) b.drawImage(pijlCv, Math.round(x) - 6, baan.voet - PIJL_H + (f % 6 < 3 ? 0 : 1));
      });
      for (const [ff, x, y] of FLITS3) if (ff === f || ff + 1 === f) b.drawImage(flitsCv, x, y);
      if (f < WACHT) b.drawImage(titelCv, 0, 0);
    } else if (f < T3){
      // 2. de rij: de camera schuift langs, de naambalk toont wie in het midden staat
      const camX = Math.round((f - T2) / (T3 - T2 - 1) * (RIJ_W - SW));
      b.drawImage(rijCv, -camX, 0);
      const j = Math.max(0, Math.min(OPRIJ.length - 1, Math.round((camX + SW / 2 - RIJ_MARGE - 20) / RIJ_AFSTAND)));
      if (jijId){ const px = jijX - camX; if (px > -10 && px < SW + 10) b.drawImage(pijlCv, px - 6, RIJ_VOET - PIJL_H + (f % 6 < 3 ? 0 : 1)); }
      b.drawImage(j === jijJ && jijBalk ? jijBalk : balken[j], 0, 176);
    } else if (spot >= 0){
      // 2b. jouw close-up: ingezoomd (2×, scherpe pixels) op jou in de rij, de camera schuift langzaam naar je toe, de rest wordt donkerder
      const cw = SW / 2, ch = SH / 2, cx = Math.round(Math.max(0, Math.min(RIJ_W - cw, jijX - cw / 2 - 24 * (1 - spot / (EXTRA - 1))))), cy = Math.round(Math.max(0, Math.min(SH - ch, RIJ_VOET + 6 - ch)));
      b.drawImage(rijCv, cx, cy, cw, ch, 0, 0, SW, SH);
      const sx = (jijX - cx) * 2, sy = (RIJ_VOET - 30 - cy) * 2, lg = b.createRadialGradient(sx, sy, 30, sx, sy, 150);
      lg.addColorStop(0, 'rgba(10,8,20,0)'); lg.addColorStop(1, 'rgba(10,8,20,.78)'); b.fillStyle = lg; b.fillRect(0, 0, SW, SH);
      b.drawImage(pijlCv, Math.round(sx - 11), Math.round((RIJ_VOET - PIJL_H - cy) * 2) + (spot % 6 < 3 ? 0 : 2), 22, 16);
      for (let k = 0; k < 3; k++){ const h = hash(spot >> 1, k, 41); if (h % 3 === 0) b.drawImage(flitsCv, 20 + h % (SW - 40), 20 + (h >> 8) % 90); }
      b.drawImage(spotTitel, 0, 0);
      b.drawImage(jijBalk, 0, 176);
    } else if (f < T4){
      // 3. handjes schudden: het thuisteam staat met de hand uit, het uitteam loopt langs
      b.drawImage(breedCv, 0, 0);
      const t = f - T3;
      for (let i = 0; i < n.thuis; i++) b.drawImage(sp['thuis' + i]('zhand'), 14 + i * 34 - 36, 158 - GROND - 1);
      for (let i = 0; i < n.uit; i++){ const x = SW + 30 + i * 34 - t * 14; if (x < -40 || x > SW + 40) continue; b.drawImage(sp['uit' + i]('hl' + ((t + i * 3) % 8), true), Math.round(x) - 36, 166 - GROND - 1); }
      b.drawImage(fairCv, 0, 0);
    }
    if (spot < 0 && f >= T4 - 4){
      // 4. het opstellingsscherm schuift in beeld; de spelers verschijnen één voor één
      const dx = f < T4 ? Math.round(SW * (1 - (f - (T4 - 5)) / 5)) : 0;
      b.drawImage(opstCv, dx, 0);
      if (f >= T4) rondjes.forEach((r, k) => { if (k < f - T4 + 1) b.drawImage(r.cv, r.x - 7, r.y - 7); });
    }
    // de omlijning om het hele beeld, zoals pxl (de hoeken blijven leeg)
    g.clearRect(0, 0, SW + 2, SH + 2); g.fillStyle = STIJL.k; g.fillRect(1, 0, SW, SH + 2); g.fillRect(0, 1, SW + 2, SH); g.drawImage(binnen, 1, 1);
  }
  const flitsen = f => (f < T2 && FLITS3.some(([ff]) => ff === f)) || (EXTRA > 0 && f === T3 + 2);
  return {teken, flitsen, W:SW + 2, H:SH + 2, frames:OP_FRAMES + EXTRA};
}
// voor het spel: de breedte van een tekst (om lange namen in te korten)
export const breedte = s => regelBreedte(s);
