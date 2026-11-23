/* ===================== Het gala van de Gouden Bal in pixels ===================== */
// In de stijl van de huldiging en de contractscène (stijlbron art/chibi_anims.px.js): een feestzaal met een rode loper,
// sterspelers in pak aan ronde tafels, rechts een podium met gordijnen, een sokkel met de Gouden Bal en een presentator
// achter een spreekgestoelte. Op het scherm boven de zaal: "EN DE WINNAAR IS...", de presentator opent de envelop, de
// zaal wordt donker en een spot valt op jou: je naam. Jij (eigen uiterlijk, in smoking) juicht, loopt over de loper het
// podium op en tilt de Gouden Bal boven je hoofd; applaus, flitsende fotografen en gouden confetti.
// 104 beelden van 220×124 op 8 fps; daarna lopen de laatste 16 beelden (de bal boven je hoofd) door tot je verder klikt.
// Alles wordt in sleutels getekend en per onderdeel met een eigen palet ingekleurd (zie ook huldiging.js).
import { Doek, Img, inkleuren, opGrond, speler, sprite, vuist } from './rig.js';
import { loopCyclus } from './animaties.js';
import { lookVan } from './atlas.js';
import { regelBreedte, tekst, zonderAccent } from './font.js';

export const GW = 220, GH = 124, G_FRAMES = 104, G_FPS = 8, G_LUS = 16;
// Belangrijke beelden (voor de teksten en de flitsen in galascene.js)
export const G_MOMENT = {start:0, envelop:12, open:16, donker:24, naam:28, lopen:34, trap:58, podium:66, draai:74, pak:76, til:84, boven:88};
const M = G_MOMENT;
const LOPER = 106, PODIUM = 80, SOKKEL = 128, PRES = 200, MIDDEN = 152; // voeten op de loper en op het podium, de sokkel, de presentator, jouw plek
const SCHERM = [8, 3, 93, 26]; // het scherm boven de zaal (x, y, b, h)

// ---------- kleuren ----------
const STIJL = {k:'#0c0a12', K:'#07081a', b:'#171c3e', B:'#10142e', F:'#1d2036', f:'#262a44', V:'#7a0f2a', v:'#560a1d', r:'#c8152e', R:'#8e0d1f',
  w:'#ffffff', W:'#cfd0dc', P:'#151827', p:'#21253c', s:'#3a3f52', S:'#0a1430', l:'#ffe9a8', z:'#3a3a44', X:'#c4c4d0', y:'#ffd21a',
  '<':'#f3c44f', '>':'#b58a25', '^':'#fff2b0'};
const GOUD = {'<':'#f3c44f', '>':'#b58a25', '^':'#fff2b0'};

// ---------- de Gouden Bal (goud: < licht, > donker, ^ glans) ----------
// grip = waar de handen zitten (links en rechts onderaan), zoals de prijzen in huldiging.js
const BAL = {grip:[[1, 10], [11, 10]], img:sprite(13, 13, c => {
  c.circ(6, 6, 6, '>'); c.circ(6, 6, 5, '<'); c.circ(5, 5, 3, '<');
  c.rect(5, 5, 3, 3, '>'); c.px(6, 4, '>');                                                   // de vijfhoek in het midden
  c.line(6, 4, 6, 1, '>'); c.line(5, 6, 1, 5, '>'); c.line(8, 6, 11, 5, '>'); c.line(5, 8, 3, 11, '>'); c.line(7, 8, 9, 11, '>'); // de naden
  c.px(3, 3, '^'); c.px(4, 2, '^'); c.px(3, 4, '^'); c.px(2, 5, '^');                          // glans
})};

// ---------- de zaal ----------
function tafel(c, cx, cy, rx){
  c.rect(cx - rx, cy, rx * 2 + 1, 6, 'W'); c.ellipse(cx, cy + 6, rx, 2, 'W'); c.ellipse(cx, cy, rx, 3, 'w');   // het tafelkleed
  c.px(cx, cy - 2, 'l'); c.px(cx, cy - 1, '<'); c.px(cx - 5, cy - 1, '^'); c.px(cx + 5, cy - 1, '^'); c.px(cx - 8, cy, 'X'); c.px(cx + 8, cy, 'X'); // kaars, glazen, borden
}
const TAFELS_ACHTER = [[20, 60, 12], [58, 60, 12], [96, 60, 11]], TAFELS_VOOR = [[34, 86, 15], [80, 86, 15]];
function zaal(){
  return sprite(GW, GH, c => {
    c.rect(0, 0, GW, GH, 'b'); c.rect(0, 0, GW, 3, 'K');
    for (let x = 6; x < 112; x += 20){ c.rect(x, 3, 3, 1, 'z'); c.px(x + 1, 4, 'l'); }                  // lampjes aan het plafond
    for (let x = 2; x < 112; x += 22){ c.vline(x, 30, 26, 'B'); c.vline(x + 1, 30, 26, '>'); }           // pilaren met een gouden rand
    c.hline(0, 30, 112, '>'); c.hline(0, 55, 112, 'B');
    c.rect(0, 56, 116, GH - 56, 'F'); for (const y of [59, 63, 68, 74, 81, 90]) c.hline(0, y, 116, 'f');   // de vloer
    // de gordijnen achter het podium, met een gouden rand en sterretjes
    c.rect(112, 0, 108, 80, 'V'); for (let x = 114; x < GW; x += 6) c.vline(x, 4, 76, 'v');
    c.rect(112, 0, 108, 4, '<'); c.hline(112, 4, 108, '>'); for (let x = 116; x < GW; x += 12) c.rect(x, 5, 3, 2, '>');
    for (let i = 0; i < 10; i++) c.px(118 + (i * 37) % 98, 12 + (i * 23) % 50, 'l');
    // het scherm boven de zaal (de tekst komt er per beeld overheen)
    const [sx, sy, sb, sh] = SCHERM;
    c.vline(sx + 12, 0, sy, 's'); c.vline(sx + sb - 13, 0, sy, 's'); c.rect(sx, sy, sb, sh, 's'); c.rect(sx + 2, sy + 2, sb - 4, sh - 4, 'S');
    // het podium met de trap
    c.rect(116, PODIUM, 104, GH - PODIUM, 'P'); c.hline(116, PODIUM, 104, '<'); c.hline(116, PODIUM + 1, 104, '>'); c.hline(116, PODIUM + 2, 104, 'p');
    tekst(c, 168, PODIUM + 8, 'GOUDEN BAL', '<', {align:'c'});
    c.rect(100, 98, 16, GH - 98, 'p'); c.hline(100, 98, 16, '<'); c.rect(108, 89, 8, GH - 89, 'P'); c.hline(108, 89, 8, '<');
    c.rect(102, 99, 14, 2, 'r'); c.rect(109, 90, 7, 2, 'r'); c.rect(116, PODIUM + 2, 10, 2, 'r');      // de loper op de treden
    // de rode loper door de zaal
    c.rect(0, 100, 100, 10, 'r'); c.hline(0, 101, 100, 'R'); c.hline(0, 100, 100, '<'); c.hline(0, 109, 100, '<');
    // de sokkel voor de Gouden Bal
    c.rect(SOKKEL - 3, 66, 6, 14, '<'); c.vline(SOKKEL + 1, 66, 14, '>'); c.rect(SOKKEL - 5, 64, 10, 2, '^'); c.rect(SOKKEL - 6, 78, 12, 2, '>');
  });
}
// de tafels (voor de gasten langs) en het spreekgestoelte (voor de presentator langs)
const tafelsAchter = () => sprite(GW, GH, c => { for (const [x, y, r] of TAFELS_ACHTER) tafel(c, x, y, r); });
const tafelsVoor = () => sprite(GW, GH, c => { for (const [x, y, r] of TAFELS_VOOR) tafel(c, x, y, r); });
const katheder = () => sprite(28, 20, c => { c.rect(2, 0, 24, 3, '>'); c.rect(4, 3, 20, 17, 'p'); c.rect(4, 3, 2, 17, 'P'); c.circ(14, 10, 4, '<'); c.circ(14, 10, 2, '>'); c.px(13, 9, '^'); });

// ---------- de gasten aan de tafels: sterspelers in pak of jurk, van voren (16×18, klein: ze zitten verder weg) ----------
// sleutels: v pak of jurk, w overhemd, t das, s huid, h haar, e ogen. klap: 0 = stil, 1 en 2 = handen uit elkaar en tegen elkaar
function gast(vrouw, klap){
  const img = sprite(16, 18, c => {
    c.ellipse(8, 15, 7, 4, 'v'); c.rect(1, 15, 15, 3, 'v');
    if (!vrouw){ c.rect(7, 12, 3, 5, 'w'); c.vline(8, 13, 4, 't'); } else { c.rect(6, 12, 5, 2, 's'); c.px(8, 14, '<'); }
    if (vrouw){ c.rect(3, 4, 2, 8, 'h'); c.rect(12, 4, 2, 8, 'h'); }
    c.circ(8, 7, 5, 's'); c.ellipse(8, 3, 5, 2, 'h'); c.px(6, 7, 'e'); c.px(10, 7, 'e');
    if (klap === 1){ c.rect(3, 12, 2, 2, 's'); c.rect(12, 12, 2, 2, 's'); }
    if (klap === 2){ c.rect(7, 10, 3, 2, 's'); }
  });
  return img.outline(107);
}
const PAKKEN = ['#16171c', '#2a2f3d', '#1d2a44', '#3b2a4a', '#4a3b2f', '#2f3a2c'], JURKEN = ['#a3161b', '#d4a72c', '#1f6d8a', '#6d2bd1', '#16171c'];
const HAREN = ['#2a1f1c', '#140e0c', '#b5541c', '#e7c36a', '#6b4a2a', '#8e8e9a'], HUIDEN = ['#f7c9a8', '#e0a982', '#b07a52', '#7a4e33', '#4a2e1e'];
const DASSEN = ['#16171c', '#a3161b', '#d4a72c', '#1e5bd6'];

// ---------- het publiek vooraan (op de rug gezien) en de fotografen (zoals in contract.js) ----------
const publiek = () => sprite(20, 18, c => { c.ellipse(10, 15, 9, 5, 'v'); c.rect(1, 15, 19, 3, 'v'); c.circ(10, 6, 5, 'h'); c.px(8, 3, 'j'); c.px(9, 3, 'j'); });
const fotograaf = () => sprite(20, 26, c => { c.stamp(publiek(), 0, 8); c.rect(5, 0, 10, 6, 'z'); c.rect(9, 1, 3, 3, 'k'); c.rect(6, 1, 2, 1, 'X'); c.rect(4, 5, 3, 6, 's'); c.rect(14, 5, 3, 6, 's'); });
const FLITSBEELD = sprite(9, 9, c => { c.line(4, 0, 4, 8, 'w'); c.line(0, 4, 8, 4, 'w'); c.rect(3, 3, 3, 3, 'w'); c.px(4, 4, 'y'); c.px(2, 2, 'y'); c.px(6, 2, 'y'); c.px(2, 6, 'y'); c.px(6, 6, 'y'); });
// [sprite, x, haar, kleding]
const RIJ = [['p', -6, 0, 0], ['f', 12, 2, 1], ['p', 30, 4, 2], ['p', 48, 1, 3], ['f', 66, 3, 0], ['p', 84, 0, 4], ['f', 124, 1, 2], ['p', 146, 5, 0], ['f', 172, 2, 3], ['p', 196, 4, 1]];

// ---------- vaste "willekeur" (elke keer hetzelfde) ----------
const KORREL = n => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; return (h ^ (h >>> 13)) >>> 0; };
const CONFETTI = Array.from({length:80}, (_, i) => ({x:KORREL(i) % GW, y:KORREL(i + 500) % GH, v:2 + KORREL(i + 900) % 3, k:['<', '^', 'w', '>', 'r'][KORREL(i + 77) % 5], fase:KORREL(i + 33) % 8, breed:KORREL(i + 11) % 3 === 0}));
function confetti(c, f){
  CONFETTI.forEach((p, i) => {
    const y = Math.round((p.y + (f - M.boven) * p.v) % (GH + 4)) - 2, x = Math.round(p.x + Math.sin((f + p.fase) * .7) * 2);
    c.px(x, y, p.k); if (p.breed && (f + i) % 2) c.px(x + 1, y, p.k); else if (p.breed) c.px(x, y + 1, p.k);
  });
}
// welke fotograaf (plek in RIJ) flitst in beeld f: na je naam steeds vaker, en bij het tillen het vaakst
export const flitst = (f, i) => f >= M.naam && KORREL(f * 13 + i * 7) % (f >= M.til ? 3 : f >= M.podium ? 5 : 7) === 0;

// ---------- waar ben jij (de voeten), per beeld ----------
function plek(f){
  let x = 26;
  if (f >= M.draai) x = MIDDEN;
  else if (f >= M.podium) x = 124 + (f - M.podium) * (MIDDEN - 124) / (M.draai - M.podium);
  else if (f >= M.trap) x = 100 + (f - M.trap) * 24 / (M.podium - M.trap);
  else if (f >= M.lopen) x = 26 + (f - M.lopen) * 74 / (M.trap - M.lopen);
  x = Math.round(x);
  return [x, x < 100 ? LOPER : x < 108 ? 98 : x < 116 ? 89 : PODIUM];
}

// ---------- de figuren ----------
const STAAN = {lL:[-4, 4], lR:[4, 4], aL:[-12, 15], aR:[12, 15]};
const LOOP = loopCyclus(48);
const JUICH = [{aL:[-150, -20], aR:[150, 20], arm:1.3}, {aL:[-120, -30], aR:[120, 30], arm:1.3}];
const BOVEN = [{aL:[-170, -8], aR:[170, 8], arm:1.9}, {aL:[-166, -10], aR:[166, 10], arm:1.85}];
// Jij: eerst stil op de loper (zenuwachtig), dan juichen, lopen (van opzij), de bal van de sokkel pakken, naast je hoofd houden
// en boven je hoofd tillen (zoals de prijs in huldiging.js: de bal hangt aan de handen, de vuisten eroverheen)
function spelerBeeld(f, v){
  const img = new Img(96, 90), c = new Doek(img), B = {x:48, lL:[-5, 10], lR:[10, 15]}, hy = opGrond(B);
  const p = BAL.img, [[gx1, gy1], [gx2]] = BAL.grip;
  if (f < M.naam) speler(c, {...STAAN, x:48, aL:f >= M.envelop ? [-30, 70] : [-12, 15], aR:f >= M.envelop ? [30, 70] : [12, 15], hd:[0, f % 8 < 4 ? 0 : 1]}, v);
  else if (f < M.lopen) speler(c, {...STAAN, x:48, ...JUICH[f % 2]}, v);
  else if (f < M.draai) speler(c, LOOP[f % 8], v);
  else if (f < M.pak) speler(c, {...STAAN, x:48, aL:[-70, 10], arm:1.5}, v);                       // de bal van de sokkel pakken
  else if (f < M.til){                                                                            // de bal naast je hoofd
    const hand = speler(c, {...B, aL:[-25 + (f % 4 < 2 ? 0 : 6), 40], aR:[118, 12], arm:1.35}, v);
    c.stamp(p, hand[0] - Math.round((gx1 + gx2) / 2), hand[1] - p.h + 4); vuist(c, hand[0], hand[1] - 1, 's');
  } else {                                                                                        // en de lucht in
    const P = f < M.boven ? {aL:[-140, -20], aR:[140, 20], arm:1.7} : BOVEN[Math.floor(f / 2) % 2];
    const arm = (sx, [a, b]) => { const r = d => d * Math.PI / 180, l1 = 6 * P.arm, l2 = 5 * P.arm;
      return [sx + Math.sin(r(a)) * l1 + Math.sin(r(a + b)) * l2, hy - 11 + Math.cos(r(a)) * l1 + Math.cos(r(a + b)) * l2]; };
    const hL = arm(B.x - 10, P.aL), hR = arm(B.x + 9, P.aR);
    const px = Math.round((hL[0] + hR[0]) / 2 - (gx1 + gx2) / 2), py = Math.round(Math.min(hL[1], hR[1]) - gy1);
    speler(c, {...B, ...P, voor:true, extra:k => k.stamp(p, px, py)}, v);
    vuist(c, Math.round(hL[0]), Math.round(hL[1]), 'S'); vuist(c, Math.round(hR[0]), Math.round(hR[1]), 's');
  }
  return img.outline(107); // ('k')
}
// De presentator: praat, houdt de envelop omhoog, opent hem (een gouden kaart) en klapt
function presentatorBeeld(f, v){
  const img = new Img(70, 90), c = new Doek(img), B = {...STAAN, x:35};
  if (f < M.envelop) speler(c, {...B, aR:f % 6 < 3 ? [40, 50] : [55, 40], hd:[0, f % 4 < 2 ? 0 : 1]}, v);
  else if (f < M.naam){
    const [hx, hy] = speler(c, {...B, aR:[150, 15], arm:1.3}, v);
    if (f < M.open){ c.rect(hx - 4, hy - 9, 9, 6, 'w'); c.line(hx - 4, hy - 9, hx, hy - 6, 'W'); c.line(hx + 4, hy - 9, hx, hy - 6, 'W'); }
    else { c.rect(hx - 4, hy - 13, 9, 7, '<'); c.hline(hx - 3, hy - 11, 7, '>'); c.hline(hx - 3, hy - 9, 5, '>'); c.rect(hx - 4, hy - 6, 9, 4, 'w'); c.hline(hx - 4, hy - 6, 9, 'W'); }
    vuist(c, hx, hy - 2, 's');
  }
  else speler(c, {...B, ...(f % 2 ? {aL:[-20, 120], aR:[20, 110]} : {aL:[-35, 100], aR:[35, 95]})}, v);
  return img.outline(107);
}

// ---------- het scherm: de tekst per moment ----------
function schermBeeld(f, naam){
  const [sx, sy, sb] = SCHERM, mx = sx + Math.floor(sb / 2);
  return sprite(GW, GH, c => {
    if (f < M.envelop){ tekst(c, mx, sy + 6, 'GOUDEN BAL', '<', {align:'c'}); c.stamp(BAL.img, mx - 6, sy + 12); return; }
    if (f < M.naam){ tekst(c, mx, sy + 6, 'EN DE WINNAAR IS', 'w', {align:'c'}); const n = Math.min(3, Math.floor((f - M.envelop) / 4)); if (n) tekst(c, mx, sy + 13, '...'.slice(0, n), 'w', {align:'c'}); return; }
    tekst(c, mx, sy + 3, 'GOUDEN BAL', '>', {align:'c'});
    const k = f < M.naam + 8 && f % 2 ? 'w' : '<', groot = regelBreedte(naam, {scale:2}) <= sb - 6;
    tekst(c, mx, groot ? sy + 11 : sy + 13, naam, k, {align:'c', scale:groot ? 2 : 1});
  });
}

// ---------- het licht: de zaal wordt donker en een spot volgt jou (per pixel, zodat de randen scherp blijven) ----------
function donkerte(f){ return f < M.envelop ? .08 : f < M.donker ? .35 : f < M.naam ? .62 : f < M.pak ? .5 : f < M.boven ? .38 : .22; }
function licht(g, f, spot){
  const d = donkerte(f), id = g.getImageData(0, 0, GW, GH), p = id.data, [fx, fy, r] = spot, ax = Math.round(fx + (112 - fx) * .35), ay = -10; // (de lamp hangt boven het midden)
  const [s0, s1, s2, s3] = SCHERM;
  for (let y = 0; y < GH; y++){
    const t = (y - ay) / (fy - ay), cx = ax + (fx - ax) * t, hw = 4 + (r - 4) * t, lijf = y <= fy && y >= fy - 62; // (lijf: de spot valt over je hele figuur)
    for (let x = 0; x < GW; x++){
      const i = (y * GW + x) * 4;
      const inSpot = r > 0 && ((y <= fy && Math.abs(x - cx) <= hw) || (lijf && Math.abs(x - fx) <= r + 3) || ((x - fx) / r) ** 2 + ((y - fy) / 3.5) ** 2 <= 1);
      if (inSpot){ p[i] = Math.min(255, p[i] * 1.12 + 14); p[i + 1] = Math.min(255, p[i + 1] * 1.1 + 10); p[i + 2] = Math.min(255, p[i + 2] * 1.02 + 2); continue; }
      if (f >= M.envelop && x >= s0 && x < s0 + s2 && y >= s1 && y < s1 + s3) continue;   // het scherm blijft oplichten
      p[i] *= 1 - d; p[i + 1] *= 1 - d; p[i + 2] *= 1 - d * .8;
    }
  }
  g.putImageData(id, 0, 0);
}

// info = {uit (jouw uiterlijk, uiterlijkVoor('jij|…')), naam (op het scherm), presentator (uiterlijk)}
// Geeft {frames:[canvas 222×126], lus (vanaf welk beeld de slotlus begint)}
export function maakGala(info = {}){
  const naam = zonderAccent(info.naam || 'DE WINNAAR').replace(/[^A-Z0-9 .'-]/g, '').trim().slice(0, 22) || 'DE WINNAAR';
  const achter = inkleuren(zaal(), STIJL), voorAchter = inkleuren(tafelsAchter(), STIJL), voorVoor = inkleuren(tafelsVoor(), STIJL), kath = inkleuren(katheder(), STIJL);
  // jij, in een zwarte smoking met een gouden das (of het pak en de das uit je eigen kledingkast: info.pak)
  const ik = lookVan(info.uit || {}, null, info.pak ? {kleding:'pak', ...info.pak} : {kleding:'pak', pak:'#15161c', pak2:'#0b0c10', das:'#d4a72c'});
  const vIk = {kapsel:ik.kapsel, vrouw:ik.vrouw, kleding:'pak', patroon:'effen', baard:ik.baard};
  const palIk = {...ik.kleuren, w:'#ffffff', ...GOUD};
  const SP = [], spelerCv = f => SP[f] || (SP[f] = inkleuren(spelerBeeld(f, vIk), palIk));
  // de presentator: donkerblauw pak met een gouden das
  const pr = lookVan(info.presentator || {}, null, {kleding:'pak', pak:'#1d2a44', das:'#d4a72c'});
  const vPr = {kapsel:pr.kapsel, vrouw:pr.vrouw, kleding:'pak', patroon:'effen', baard:pr.baard}, palPr = {...pr.kleuren, w:'#ffffff', W:'#cfd0dc', ...GOUD};
  const PR = new Map(), presCv = f => { const k = f < M.envelop ? 'p' + (f % 6 < 3 ? 0 : 1) + (f % 4 < 2 ? 0 : 1) : f < M.open ? 'e' : f < M.naam ? 'o' : 'k' + (f % 2);
    if (!PR.has(k)) PR.set(k, inkleuren(presentatorBeeld(f, vPr), palPr)); return PR.get(k); };
  // de gasten: twee aan elke tafel achterin, drie aan elke tafel vooraan
  const plekken = [...TAFELS_ACHTER.flatMap(([x, y]) => [[x - 7, y], [x + 7, y]]), ...TAFELS_VOOR.flatMap(([x, y]) => [[x - 11, y], [x, y], [x + 11, y]])];
  const gasten = plekken.map(([x, y], i) => { const vrouw = KORREL(i + 300) % 3 === 0;
    const pal = {...STIJL, v:vrouw ? JURKEN[KORREL(i + 40) % JURKEN.length] : PAKKEN[KORREL(i + 40) % PAKKEN.length], w:'#ffffff', t:DASSEN[KORREL(i + 60) % DASSEN.length],
      s:HUIDEN[KORREL(i + 80) % HUIDEN.length], h:HAREN[KORREL(i + 90) % HAREN.length], e:'#1a1414'};
    return {x:x - 9, y:y - 15, cv:[0, 1, 2].map(k => inkleuren(gast(vrouw, k), pal))}; });
  const rij = RIJ.map(([soort, x, h, v]) => ({x, foto:soort === 'f', cv:inkleuren(soort === 'f' ? fotograaf() : publiek(), {...STIJL, h:HAREN[h], j:HAREN[(h + 3) % HAREN.length], v:PAKKEN[v], s:HUIDEN[(h + v) % HUIDEN.length]})}));
  const flitsCv = inkleuren(FLITSBEELD, STIJL), balCv = inkleuren(BAL.img.outline(107), {...STIJL, ...GOUD});
  const SCH = new Map(), schermCv = f => { const k = f < M.envelop ? 'g' : f < M.naam ? 'w' + Math.min(3, Math.floor((f - M.envelop) / 4)) : 'n' + (f < M.naam + 8 ? f % 2 : 0);
    if (!SCH.has(k)) SCH.set(k, inkleuren(schermBeeld(f, naam), STIJL)); return SCH.get(k); };
  const frames = [];
  for (let f = 0; f < G_FRAMES; f++){
    const binnen = document.createElement('canvas'); binnen.width = GW; binnen.height = GH;
    const g = binnen.getContext('2d', {willReadFrequently:true}); g.imageSmoothingEnabled = false;
    g.drawImage(achter, 0, 0); g.drawImage(schermCv(f), 0, 0);
    // de gasten (na je naam klappen ze, ieder op zijn eigen tel) en de tafels ervoor
    const klap = i => f < M.naam ? 0 : 1 + (f + i) % 2;
    gasten.forEach((p, i) => { if (i < 6) g.drawImage(p.cv[klap(i)], p.x, p.y - (f >= M.naam && (f + i) % 4 === 0 ? 1 : 0)); });
    g.drawImage(voorAchter, 0, 0);
    gasten.forEach((p, i) => { if (i >= 6) g.drawImage(p.cv[klap(i)], p.x, p.y - (f >= M.naam && (f + i) % 4 === 0 ? 1 : 0)); });
    g.drawImage(voorVoor, 0, 0);
    // de presentator achter het spreekgestoelte, de bal op de sokkel (tot jij hem pakt)
    g.drawImage(presCv(f), PRES - 36, PODIUM - 75); g.drawImage(kath, PRES - 14, PODIUM - 19);
    if (f < M.pak) g.drawImage(balCv, SOKKEL - 7, 51 - ((f >> 2) % 2));
    const [x, y] = plek(f); g.drawImage(spelerCv(f), x - 49, y - 75);
    // de rij vooraan; dan het licht: eerst op de presentator met de envelop, dan op jou
    const ry = p => p.foto ? GH - 20 : GH - 12;
    rij.forEach(p => g.drawImage(p.cv, p.x, ry(p)));
    licht(g, f, f < M.envelop ? [MIDDEN, PODIUM, 0] : f < M.donker ? [PRES, PODIUM, 16] : f < M.naam ? [PRES, PODIUM, 0] : [x, y, 17]);
    // de flitsen en de confetti over alles heen
    rij.forEach((p, i) => { if (p.foto && flitst(f, i)) g.drawImage(flitsCv, p.x + 6, ry(p) - 7); });
    if (f >= M.boven) g.drawImage(inkleuren(sprite(GW, GH, c => confetti(c, f)), STIJL), 0, 0);
    const cv = document.createElement('canvas'); cv.width = GW + 2; cv.height = GH + 2; const o = cv.getContext('2d');
    o.fillStyle = STIJL.k; o.fillRect(1, 0, GW, GH + 2); o.fillRect(0, 1, GW + 2, GH); o.drawImage(binnen, 1, 1);
    frames.push(cv);
  }
  return {frames, lus:G_FRAMES - G_LUS};
}
