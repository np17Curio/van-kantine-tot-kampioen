/* ===================== Contractondertekening in pixels ===================== */
// Naar de stijlbron (art/chibi_anims.px.js, deel 8 'contract'): je komt binnen, tekent het contract, schudt de hand van de
// eigenaar en laat je nieuwe shirt zien. Vooraan zit publiek, en de fotografen flitsen. 52 beelden van 220×124 op 8 fps.
// Hier met jouw uiterlijk (in vrijetijdskleding), de kleuren van je nieuwe club en jouw rugnummer.
// Elk onderdeel wordt in eigen sleutels getekend, met een eigen palet ingekleurd en dan over elkaar gelegd.
import { Doek, GROND, Img, ORIGINEEL, inkleuren, speler, sprite, vuist } from './rig.js';
import { loopCyclus } from './animaties.js';
import { donker, lookVan } from './atlas.js';
import { tekst as fontTekst, regelBreedte, zonderAccent } from './font.js';

export const ZW = 220, ZH = 124, FRAMES = 52, FPS = 8;
const VLOER = 100, DY = VLOER - GROND, SX = 88, BX = 128;
// Welke fotograaf (plek in RIJ) flitst in welk beeld
export const FLITS = {30:[4], 31:[1], 33:[8], 35:[11], 38:[4, 8], 40:[1], 41:[11], 43:[4], 44:[8], 46:[1, 11], 48:[4], 50:[8]};
// Belangrijke beelden (voor de teksten in contractscene.js)
export const MOMENT = {binnen:2, zwaai:14, tekenStart:18, tekenEind:28, hand:30, shirt:38};

// ---------- kleuren uit de stijlbron ----------
const STIJL = {k:'#1a1414', s:'#f7c9a8', S:'#e3a07e', h:'#b5541c', H:'#7e3410', j:'#dc7a3c', r:'#e0262b', R:'#a3161b', w:'#ffffff', W:'#d4d4de', u:'#2f62d6', y:'#ffd21a',
  V:'#1a2563', o:'#ffd84a', n:'#2a1f1c', N:'#140e0c', z:'#3a3a44', X:'#c4c4d0', c:'#34343e', C:'#22222a', e:'#4a6fb0', E:'#33508a', P:'#2b3452', D:'#1b2138',
  l:'#c4c4cc', L:'#8e8e9a', f:'#efe4cc', F:'#dccdae', J:'#c79f6e', T:'#a9824f', i:'#a8744f', I:'#6f4630', d:'#7a4a2a', B:'#3b2a22'};

// ---------- de zaal ----------
// sleutels: f/F muur, J/T vloer, i/I tafel, d deur, B deuropening, L vlaggenstok, x/X wit (sponsorwand, papier),
// r/R/w de club (logo's, tafelkleed, vlaggetjes)
const LOGO = ['..RRRRRRRRR', '..RrwrwrwrR', '..RrwrwrwrR', '..RrwrwrwrR', '..RrwrwrwrR', '...RrwrwrR.', '....RrwrR..', '.....RrR...', '......R....'];
const logo = sprite(16, 13, c => LOGO.forEach((rij, y) => [...rij].forEach((k, x) => { if (k !== '.') c.px(x, y, k); })));
function zaal(){
  return sprite(ZW, ZH, c => {
    c.rect(0, 0, ZW, VLOER, 'f'); c.rect(0, 64, ZW, VLOER - 64, 'F'); c.hline(0, 64, ZW, 'T');
    c.rect(0, VLOER, ZW, ZH - VLOER, 'J');
    for (let y = VLOER + 5; y < ZH; y += 6) c.hline(0, y, ZW, 'T');                          // planken
    // sponsorwand met clublogo's (pxl: box = rand, pattern = tegels, afgekapt aan de rand)
    c.rect(44, 6, 170, 56, 'x');
    for (let x = 44; x < 214; x++){ c.px(x, 6, 'X'); c.px(x, 61, 'X'); } for (let y = 7; y < 61; y++){ c.px(44, y, 'X'); c.px(213, y, 'X'); }
    for (let ty = 8; ty < 60; ty += 13) for (let tx = 46; tx < 212; tx += 16){
      const cw = Math.min(16, 212 - tx), ch = Math.min(13, 60 - ty);
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++){ const v = logo.d[y * 16 + x]; if (v) c.img.set(tx + x, ty + y, v); }
    }
    // deur links, open
    c.rect(6, 40, 26, VLOER - 40, 'd'); c.rect(9, 43, 20, VLOER - 43, 'B'); c.rect(29, 43, 4, VLOER - 43, 'i');
    // tafel met kleed in clubkleuren, contract en vlaggetjes
    c.rect(70, 76, 84, 5, 'i'); c.rect(70, 76, 84, 1, 'f'); c.rect(70, 81, 84, 3, 'I');
    c.rect(70, 84, 84, 9, 'r'); for (let x = 72; x < 154; x += 4) c.rect(x, 84, 2, 9, 'w');
    c.rect(74, 93, 3, 7, 'I'); c.rect(147, 93, 3, 7, 'I');
    c.rect(100, 77, 16, 3, 'x'); c.hline(102, 79, 12, 'X');
    c.vline(76, 62, 14, 'L'); c.rect(77, 62, 7, 5, 'r'); c.rect(79, 62, 2, 5, 'w');
    c.vline(148, 62, 14, 'L'); c.rect(149, 62, 7, 5, 'r'); c.rect(151, 62, 2, 5, 'w');
  });
}

// ---------- het shirt dat je laat zien (achterkant, met je nummer) ----------
// sleutels ( ) [ : shirt, donker shirt, accent (los van de kleuren van de speler zelf)
const FONT = {0:'###/#.#/#.#/#.#/###', 1:'##./.#./.#./.#./###', 2:'###/..#/###/#../###', 3:'###/..#/.##/..#/###', 4:'#.#/#.#/###/..#/..#',
  5:'###/#../###/..#/###', 6:'###/#../###/#.#/###', 7:'###/..#/..#/.#./.#.', 8:'###/#.#/###/#.#/###', 9:'###/#.#/###/..#/###'}; // (het 3×5-font van pxl)
function tekst(c, x, y, s, k){ for (const ch of s){ const g = FONT[ch]; if (!g) continue; g.split('/').forEach((rij, r) => [...rij].forEach((b, i) => { if (b === '#') c.px(x + i, y + r, k); })); x += 4; } }
function shirtToon(nr, strepen){
  return sprite(26, 20, c => {
    c.rect(5, 0, 16, 20, '(');
    if (strepen) for (let x = 5; x < 21; x++) if (((x - 5) >> 1) % 2) c.rect(x, 0, 1, 20, '[');
    c.rect(0, 1, 5, 6, '('); c.rect(21, 1, 5, 6, '(');
    c.rect(0, 6, 5, 1, ')'); c.rect(21, 6, 5, 1, ')');
    c.rect(10, 0, 6, 1, ')');
    c.rect(7, 6, 12, 9, '(');
    const s = String(nr ?? '').replace(/[^0-9]/g, '').slice(0, 2);
    if (s) tekst(c, s.length === 1 ? 11 : 8, 8, s, '[');
    c.rect(5, 19, 16, 1, ')');
  });
}

// In het spel: een groter shirt (40×26) met je naam en je nummer op de rug, zoals een echt wedstrijdshirt.
// (sleutels ( ) [ zoals hierboven; de naam in het 3×5-font, het nummer twee keer zo groot)
function shirtMetNaam(naam, nr, strepen){
  return sprite(40, 26, c => {
    c.rect(6, 0, 28, 26, '(');
    if (strepen) for (let x = 6; x < 34; x++) if (((x - 6) >> 1) % 2) c.rect(x, 0, 1, 26, '[');
    c.rect(0, 1, 6, 8, '('); c.rect(34, 1, 6, 8, '(');                                          // mouwen
    c.rect(0, 8, 6, 1, ')'); c.rect(34, 8, 6, 1, ')');
    c.rect(14, 0, 12, 1, ')');                                                                 // kraag
    const s = String(nr ?? '').replace(/[^0-9]/g, '').slice(0, 2);
    let n = zonderAccent(naam).replace(/[^A-Z0-9 .'-]/g, '').trim();
    while (n.length > 1 && regelBreedte(n) > 38) n = n.slice(0, -1).trimEnd();                 // (een heel lange naam: ingekort)
    c.rect(Math.min(7, 20 - Math.ceil(regelBreedte(n) / 2) - 1), 2, Math.max(26, regelBreedte(n) + 2), 7, '(');   // een vlak achter de naam
    fontTekst(c, 20, 3, n, '[', {align:'c'});
    if (s){ const b = regelBreedte(s, {scale:2}); c.rect(20 - Math.ceil(b / 2) - 1, 10, b + 2, 12, '('); fontTekst(c, 20, 11, s, '[', {scale:2, align:'c'}); }
    c.rect(6, 25, 28, 1, ')');
  });
}

// ---------- de personen ----------
const STAAN = {lL:[-4, 4], lR:[4, 4], aL:[-12, 15], aR:[12, 15]};
const LOOP = loopCyclus(40);
const spelerX = f => f < 16 ? Math.round(14 + f * ((SX - 14) / 15)) : SX;
function spelerBeeld(f, v, shirt){
  const img = new Img(80, 90), c = new Doek(img), B = {...STAAN, x:40};
  if (f < 16) speler(c, LOOP[f % 8], v);                                                      // binnenlopen (van opzij)
  else if (f < 18) speler(c, {...B, aR:[40, 30]}, v);                                          // pakt de pen
  else if (f < 28){                                                                            // tekenen
    const hand = speler(c, {...B, aR:[44 + ((f - 18) % 2) * 6, 22], hd:[1, 2]}, v);
    c.line(hand[0] + 1, hand[1] - 1, hand[0] + 3, hand[1] - 5, 'k'); c.line(hand[0] + 2, hand[1] - 2, hand[0] + 3, hand[1] - 4, 'w'); // pen
  }
  else if (f < 30) speler(c, B, v);                                                            // klaar
  else if (f < 38) speler(c, {...B, aR:[f % 2 ? 62 : 72, 25]}, v);                             // hand schudden
  else {                                                                                       // het shirt voor de borst, vuisten op de schouders
    speler(c, {...B, aL:[-154, 0], aR:[154, 0], arm:.4}, v);
    const sy = 42 + (f === 38 ? 4 : 0);
    const h = Math.floor(shirt.w / 2); // (het shirt van de stijlbron is 26 breed, dat met je naam 40)
    c.stamp(shirt, 40 - h, sy); vuist(c, 40 - h + 1, sy + 1, 'S'); vuist(c, 40 + h - 1, sy + 1, 's');
  }
  return img.outline(107); // ('k')
}
const BAAS = {staan:{}, hand1:{aR:[62, 25]}, hand2:{aR:[72, 25]}, klap1:{aL:[-20, 120], aR:[20, 110]}, klap2:{aL:[-35, 100], aR:[35, 95]}};
const baasBeeld = (P, v) => { const img = new Img(70, 90); speler(new Doek(img), {x:35, ...STAAN, ...P}, v); return img.outline(107).flipX(); };

// het publiek, op de rug gezien; fotografen houden een camera omhoog. [sprite, x, haar, kleding] (kleuren uit de stijlbron)
const RIJ = [['p', -4, 'n', 'u'], ['f', 14, 'h', 'c'], ['p', 32, 'l', 'V'], ['p', 50, 'j', 'R'], ['f', 70, 'n', 'E'], ['p', 88, 'h', 'o'],
  ['p', 106, 'N', 'c'], ['p', 124, 'l', 'r'], ['f', 142, 'j', 'P'], ['p', 160, 'n', 'e'], ['p', 178, 'h', 'D'], ['f', 196, 'n', 'C']];
const publiek = () => sprite(20, 18, c => { c.ellipse(10, 15, 9, 5, 'v'); c.rect(1, 15, 19, 3, 'v'); c.circ(10, 6, 5, 'h'); c.px(8, 3, 'j'); c.px(9, 3, 'j'); });
const fotograaf = () => sprite(20, 26, c => { c.stamp(publiek(), 0, 8); c.rect(5, 0, 10, 6, 'z'); c.rect(9, 1, 3, 3, 'k'); c.rect(6, 1, 2, 1, 'X'); c.rect(4, 5, 3, 6, 's'); c.rect(14, 5, 3, 6, 's'); });
const FLITSBEELD = sprite(9, 9, c => { c.line(4, 0, 4, 8, 'w'); c.line(0, 4, 8, 4, 'w'); c.rect(3, 3, 3, 3, 'w'); c.px(4, 4, 'y'); c.px(2, 2, 'y'); c.px(6, 2, 'y'); c.px(2, 6, 'y'); c.px(6, 6, 'y'); });
const KRABBEL = [[102, 78], [103, 77], [104, 78], [105, 78], [106, 77], [107, 78], [108, 77], [109, 78], [110, 78], [111, 77]];

// info = {uit (uiterlijk, pixel/uiterlijk.js), tenue (de club), nr (rugnummer of leeg)}; stijlbron: true = precies de stijlbron (om te vergelijken)
// Geeft {frames:[canvas 222×126], flits(f): plekken waar geflitst wordt (in pixels van het beeld)}
export function maakContract(info = {}){
  const stijl = !!info.stijlbron, t = info.tenue || {shirt:STIJL.r, accent:STIJL.w, patroon:'strepen'};
  const club = stijl ? {r:STIJL.r, R:STIJL.R, w:STIJL.w} : {r:t.shirt, R:donker(t.shirt, .3), w:t.accent};
  const shirtKl = {'(':club.r, ')':club.R, '[':club.w};
  // de zaal
  const zaalCv = inkleuren(zaal(), {...STIJL, ...club, x:STIJL.w, X:STIJL.W});
  // de speler: jouw uiterlijk in vrijetijdskleding (in de stijlbron: het model-uiterlijk)
  const ik = stijl ? {kapsel:'model', kleuren:{...ORIGINEEL, c:STIJL.c, C:STIJL.C, e:STIJL.e, E:STIJL.E, y:'#f4f4f8', Y:'#c4c4d0', a:'#3a3a44', A:'#24242c', w:'#ffffff'}}
    : lookVan(info.uit || {}, {shirt:'#ffffff', accent:'#ffffff', patroon:'effen', broek:'#4a6fb0', sok:'#4a6fb0'}, {kleding:'casual'});
  const vIk = {kapsel:ik.kapsel, vrouw:!!ik.vrouw, baard:ik.baard, kleding:'casual'}, palIk = {...ik.kleuren, w:'#ffffff', ...shirtKl};
  const shirt = stijl ? shirtToon('10', true) : shirtMetNaam(info.naam || '', info.nr, t.patroon === 'strepen');
  const SP = [], spelerCv = f => SP[f] || (SP[f] = inkleuren(spelerBeeld(f, vIk, shirt), palIk)); // (pas getekend als hij nodig is)
  // de eigenaar: marineblauw pak, rode das, grijs haar en een snor
  const vBaas = {kapsel:'model', kleding:'pak', snor:true};
  const palBaas = {...ORIGINEEL, h:STIJL.l, H:STIJL.L, j:'#ffffff', c:STIJL.P, C:STIJL.D, t:'#c8302c', w:'#ffffff', y:STIJL.d, Y:STIJL.I, a:STIJL.B, A:STIJL.B};
  const baas = Object.fromEntries(Object.entries(BAAS).map(([n, P]) => [n, inkleuren(baasBeeld(P, vBaas), palBaas)]));
  // het publiek, met per persoon haar en kleding
  const pub = RIJ.map(([soort, x, haar, kleding]) => ({x, foto:soort === 'f', cv:inkleuren(soort === 'f' ? fotograaf() : publiek(),
    {...STIJL, h:STIJL[haar], j:STIJL[haar === 'h' ? 'j' : haar], v:STIJL[kleding]})}));
  const flitsCv = inkleuren(FLITSBEELD, STIJL);
  const frames = [];
  // de persfoto voor de krant (stijlbron deel 10): de zaal, de klappende eigenaar en jij met je shirt (beeld 44)
  const uitsnede = (b = 180, h = 72, bx = 20, by = 28) => { const cv = document.createElement('canvas'); cv.width = b; cv.height = h; const g = cv.getContext('2d');
    g.drawImage(zaalCv, -bx, -by); g.drawImage(baas.klap1, BX - 36 - bx, DY - 1 - by); g.drawImage(spelerCv(44), SX - 41 - bx, DY - 1 - by); return cv; };
  if (info.alleenUitsnede) return {frames:[], uitsnede};
  for (let f = 0; f < FRAMES; f++){
    // eerst het beeld zelf (220×124, wat erbuiten valt wordt afgeknipt), dan de omlijning eromheen zoals pxl (hoeken leeg)
    const binnen = document.createElement('canvas'); binnen.width = ZW; binnen.height = ZH;
    const g = binnen.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(zaalCv, 0, 0);
    const bh = f >= 30 && f < 38 ? (f % 2 ? 'hand1' : 'hand2') : f >= 38 ? (f % 2 ? 'klap1' : 'klap2') : 'staan';
    g.drawImage(baas[bh], BX - 35 - 1, DY - 1);
    g.drawImage(spelerCv(f), spelerX(f) - 40 - 1, DY - 1);
    g.fillStyle = STIJL.D; for (let i = 0; i < Math.max(0, Math.min(10, f - 17)); i++) g.fillRect(KRABBEL[i][0], KRABBEL[i][1], 1, 1); // de handtekening groeit
    pub.forEach((p, i) => { const y = p.foto ? ZH - 26 + 2 : ZH - 18 + 2; g.drawImage(p.cv, p.x, y); if ((FLITS[f] || []).includes(i)) g.drawImage(flitsCv, p.x + 6, y - 7); });
    const cv = document.createElement('canvas'); cv.width = ZW + 2; cv.height = ZH + 2; const o = cv.getContext('2d');
    o.fillStyle = STIJL.k; o.fillRect(1, 0, ZW, ZH + 2); o.fillRect(0, 1, ZW + 2, ZH); o.drawImage(binnen, 1, 1);
    frames.push(cv);
  }
  return {frames, uitsnede};
}
