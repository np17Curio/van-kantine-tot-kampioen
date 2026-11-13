/* ===================== De huldiging in pixels: de beker gaat de lucht in ===================== */
// In de stijl van de contractscène en de opkomst (stijlbron art/chibi_anims.px.js): 's avonds in het stadion staat het
// team op een podium, de tribunes juichen, er dwarrelt confetti en boven het stadion knalt vuurwerk. Jij staat vooraan
// op de hoogste trede met je eigen uiterlijk en tenue en tilt de prijs boven je hoofd. 48 beelden van 220×124 op 8 fps;
// daarna lopen de laatste 16 beelden (juichen, confetti, vuurwerk) door tot je verder klikt.
// Alles wordt in sleutels getekend en per onderdeel met een eigen palet ingekleurd (zie ook contract.js).
import { Doek, Img, inkleuren, opGrond, speler, sprite, vuist } from './rig.js';
import { donker, lookVan } from './atlas.js';
import { fans } from './opkomst.js';
import { regelBreedte, tekst, zonderAccent } from './font.js';

export const HW = 220, HH = 124, H_FRAMES = 48, H_FPS = 8, H_LUS = 16;
// Belangrijke beelden (voor de teksten en de flits in huldigingscene.js)
export const H_MOMENT = {start:0, til:12, boven:16, vuurwerk:18};
const TREDE = 92, TOP = 82, SX = 110; // de voeten van het team, de voeten op de hoogste trede, het midden van de speler

// ---------- kleuren ----------
const STIJL = {K:'#0b1022', k:'#1a1414', b:'#3c4a6e', M:'#ffe9a8', w:'#ffffff', C:'#1d1f2c', c:'#2b2e3e', g:'#2f7d3f', G:'#378c48',
  s:'#f7c9a8', h:'#b5541c', r:'#e0262b', R:'#a3161b', v:'#2b3f9e', i:'#a8744f', n:'#2a1f1c', o:'#ffd84a', d:'#7a4a2a', y:'#ffd21a',
  P:'#141a33', p:'#232c52', '<':'#f3c44f', '>':'#b58a25', '^':'#fff2b0', '~':'#15161c'};
const GOUD = {'<':'#f3c44f', '>':'#b58a25', '^':'#fff2b0', '~':'#15161c'};

// ---------- de prijzen (goud: < licht, > donker, ^ glans; ~ zwarte voet; ( ) linten in de clubkleuren) ----------
// Een grote beker met oren (de bekers, Europa en de eindtoernooien). grip = waar de handen zitten (onder aan de linten)
const BEKER = {grip:[[4, 24], [24, 24]], img:sprite(29, 26, c => {
  c.rect(8, 0, 13, 1, '^'); c.rect(8, 1, 13, 9, '<'); c.rect(9, 10, 11, 1, '<'); c.rect(10, 11, 9, 1, '<'); c.rect(11, 12, 7, 1, '<');  // de kom
  c.rect(17, 1, 3, 10, '>'); c.px(17, 11, '>'); c.px(16, 12, '>'); c.rect(10, 2, 1, 7, '^'); c.px(11, 2, '^');                       // schaduw en glans
  for (const [x0, d] of [[7, -1], [21, 1]]){                                                                                         // de grote oren
    c.line(x0, 2, x0 + d * 4, 1, '<', 2); c.line(x0 + d * 4, 1, x0 + d * 5, 6, '<', 2); c.line(x0 + d * 5, 6, x0 + d * 3, 11, '<', 2);
    c.line(x0 + d * 3, 11, x0 + d * 4, 13, '>', 2);
  }
  c.rect(13, 13, 3, 4, '>'); c.vline(14, 13, 4, '<');                                                                                // de steel
  c.rect(10, 17, 9, 2, '<'); c.hline(10, 18, 9, '>'); c.rect(9, 19, 11, 5, '~'); c.rect(11, 21, 7, 1, '<');                         // de voet met een plaatje
  c.rect(4, 14, 2, 10, '('); c.rect(23, 14, 2, 10, ')'); c.px(4, 24, '('); c.px(24, 24, ')');                                        // de linten
})};
// De kampioensschaal: een grote gouden schaal, schuin van voren gezien
const SCHAAL = {grip:[[3, 21], [25, 21]], img:sprite(29, 22, c => {
  c.ellipse(14, 8, 14, 8, '>'); c.ellipse(14, 7, 13, 7, '<'); c.ellipse(14, 7, 9, 4, '>'); c.ellipse(14, 6, 8, 3, '<');
  c.ellipse(14, 7, 3, 1, '^'); c.px(6, 3, '^'); c.px(7, 2, '^'); c.px(5, 4, '^');
  c.rect(2, 11, 3, 10, '('); c.rect(24, 11, 3, 10, ')'); c.px(3, 21, '('); c.px(25, 21, ')');                                        // linten
})};
export const PRIJZEN = {beker:BEKER, schaal:SCHAAL};

// ---------- het stadion 's avonds (twee versies: de fans op de tribune juichen om en om) ----------
function stadion(naam, titel, juich){
  return sprite(HW, HH, c => {
    c.rect(0, 0, HW, 30, 'K');
    for (let i = 0; i < 22; i++) c.px((i * 47 + 11) % HW, (i * 13 + 3) % 22, 'w');                                     // sterren
    for (const x of [18, 200]){ c.rect(x, 0, 2, 26, 'b'); c.rect(x - 6, 2, 14, 5, 'M'); c.hline(x - 6, 2, 14, 'w'); }  // lichtmasten
    c.rect(0, 24, HW, 44, 'C'); for (let y = 30; y < 68; y += 8) c.hline(0, y, HW, 'c');
    fans(c, juich ? 1 : 0, 0, 25, HW, 42, 3); fans(c, juich ? 0 : 1, 0, 25, HW, 42, 11);                                 // de volle tribune
    c.rect(0, 66, HW, 8, '1'); c.hline(0, 66, HW, '2'); c.hline(0, 73, HW, '2');                                         // spandoek in de clubkleuren
    { const w = regelBreedte(naam) + 16; for (let x = 4; x < HW; x += w) tekst(c, x, 68, naam, '3'); }
    let y = 74, h = 4, i = 0; while (y < HH){ c.rect(0, y, HW, h, i % 2 ? 'G' : 'g'); y += h; h += 2; i++; }             // gras met banen
    // het podium: een brede trede voor het team, in het midden een hogere voor jou; vooraan een bord met de titel
    c.rect(26, TREDE, 168, HH - TREDE, 'P'); c.hline(26, TREDE, 168, '<'); c.hline(26, TREDE + 1, 168, '>');
    c.rect(SX - 22, TOP, 44, TREDE - TOP, 'p'); c.hline(SX - 22, TOP, 44, '<'); c.hline(SX - 22, TOP + 1, 44, '>');
    c.rect(SX - 46, TREDE + 10, 92, 11, '1'); c.hline(SX - 46, TREDE + 10, 92, '<'); c.hline(SX - 46, TREDE + 20, 92, '<');
    tekst(c, SX, TREDE + 13, titel, '3', {align:'c'});
  });
}

// ---------- de figuren ----------
// Teamgenoten: juichend, armen omhoog of half omhoog (twee beelden om en om), van voren
const JUICH = [{aL:[-150, -20], aR:[150, 20], arm:1.3}, {aL:[-120, -30], aR:[120, 30], arm:1.3}];
function maatBeeld(v, i){
  const img = new Img(44, 90), c = new Doek(img);
  speler(c, {x:22, lL:[-5, 10], lR:[10, 15], ...JUICH[i]}, v);
  return img.outline(107); // ('k')
}
// Jij: eerst de prijs naast je hoofd (zoals op de krantenfoto), dan tilt je hem op en houd je hem boven je hoofd.
// De prijs hangt aan de handen (aan de onderkant van de linten), boven op je hoofd; de vuisten eroverheen
const BOVEN = [{aL:[-170, -8], aR:[170, 8], arm:1.9}, {aL:[-166, -10], aR:[166, 10], arm:1.85}];
function spelerBeeld(f, v, prijs){
  const img = new Img(96, 90), c = new Doek(img), B = {x:48, lL:[-5, 10], lR:[10, 15]}, hy = opGrond(B);
  const p = prijs.img, [[gx1, gy1], [gx2]] = prijs.grip;
  if (f < H_MOMENT.til){                                                                     // de prijs omhoog in je rechterhand
    const hand = speler(c, {...B, aL:[-25 + (f % 4 < 2 ? 0 : 6), 40], aR:[118, 12], arm:1.35}, v);
    const gx = Math.round((gx1 + gx2) / 2);
    c.stamp(p, hand[0] - gx, hand[1] - p.h + 4); vuist(c, hand[0], hand[1] - 1, 's');
  } else {
    const P = f < H_MOMENT.boven ? {aL:[-140, -20], aR:[140, 20], arm:1.7} : BOVEN[Math.floor(f / 2) % 2];
    // waar de handen komen (zoals rig.js: de schouders op x-10 en x+9, 11 boven de heup): de prijs hangt eraan
    const arm = (sx, [a, b], kant) => { const r = d => d * Math.PI / 180, l1 = 6 * P.arm, l2 = 5 * P.arm;
      return [sx + Math.sin(r(a)) * l1 + Math.sin(r(a + b)) * l2, hy - 11 + Math.cos(r(a)) * l1 + Math.cos(r(a + b)) * l2, kant]; };
    const hL = arm(B.x - 10, P.aL), hR = arm(B.x + 9, P.aR);
    const px = Math.round((hL[0] + hR[0]) / 2 - (gx1 + gx2) / 2), py = Math.round(Math.min(hL[1], hR[1]) - gy1);
    speler(c, {...B, ...P, voor:true, extra:k => k.stamp(p, px, py)}, v);
    vuist(c, Math.round(hL[0]), Math.round(hL[1]), 'S'); vuist(c, Math.round(hR[0]), Math.round(hR[1]), 's');
  }
  return img.outline(107);
}

// ---------- confetti en vuurwerk (vaste "willekeur": elke keer hetzelfde) ----------
const KORREL = n => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; return (h ^ (h >>> 13)) >>> 0; };
const CONFETTI = Array.from({length:90}, (_, i) => ({x:KORREL(i) % HW, y:KORREL(i + 500) % HH, v:2 + KORREL(i + 900) % 3, k:['1', '3', '<', 'w', '^'][KORREL(i + 77) % 5], fase:KORREL(i + 33) % 8, breed:KORREL(i + 11) % 3 === 0}));
const VUURWERK = [[18, 52, 14, '<'], [21, 168, 10, '3'], [24, 96, 8, 'w'], [28, 30, 18, '1'], [31, 190, 16, '<'], [34, 140, 6, 'w'], [38, 70, 12, '3'], [41, 120, 16, '<'], [44, 180, 8, '1']];
// de lus (beeld 32-47) loopt steeds opnieuw: het vuurwerk daarin komt terug
function vuurwerk(c, f){
  for (const [f0, x, y, k] of VUURWERK){
    const t = f - f0; if (t < -2 || t > 5) continue;
    if (t < 0){ c.vline(x, y + 12 + t * 5, 3, 'M'); continue; }                                         // de pijl gaat omhoog
    const r = 3 + t * 3;
    for (let a = 0; a < 12; a++){ const h = a * Math.PI / 6 + (t % 2) * .26, px = Math.round(x + Math.cos(h) * r), py = Math.round(y + Math.sin(h) * r * .8);
      if (t > 3 && (a + t) % 2) continue;                                                                 // uitdovend
      c.px(px, py, k); if (t < 3) c.px(Math.round(x + Math.cos(h) * (r - 2)), Math.round(y + Math.sin(h) * (r - 2) * .8), 'w'); }
    if (t < 2) c.rect(x - 1, y - 1, 3, 3, 'w');
  }
}
function confetti(c, f, veel){
  CONFETTI.forEach((p, i) => {
    if (!veel && i % 3) return;
    const y = Math.round((p.y + f * p.v) % (HH + 4)) - 2, x = Math.round(p.x + Math.sin((f + p.fase) * .7) * 2);
    c.px(x, y, p.k); if (p.breed && (f + i) % 2) c.px(x + 1, y, p.k); else if (p.breed) c.px(x, y + 1, p.k);
  });
}

// info = {uit (jouw uiterlijk), tenue (club of land), team: [uiterlijk × 4] (teamgenoten), naam (op het spandoek), titel (op het podium),
//   prijs ('beker' of 'schaal')}. Geeft {frames:[canvas 222×126], lus (vanaf welk beeld de slotlus begint)}
export function maakHuldiging(info = {}){
  const t = info.tenue || {shirt:'#e0262b', accent:'#ffffff', patroon:'strepen', broek:'#2f62d6', sok:'#e0262b'};
  const club = {1:t.shirt, 2:donker(t.shirt, .3), 3:t.accent || '#ffffff', '(':t.shirt, ')':t.accent || '#ffffff'};
  const naam = zonderAccent(info.naam || 'KAMPIOEN').slice(0, 22), titel = zonderAccent(info.titel || 'KAMPIOENEN').slice(0, 22);
  const achter = [0, 1].map(j => inkleuren(stadion(naam, titel, j), {...STIJL, ...club}));
  const prijs = PRIJZEN[info.prijs] || BEKER;
  // jij, in je eigen tenue (met de aanvoerdersband als je aanvoerder bent)
  const ik = lookVan(info.uit || {}, t, {band:!!info.band});
  const vIk = {kapsel:ik.kapsel, vrouw:ik.vrouw, kleding:'tenue', patroon:ik.patroon, band:ik.band, baard:ik.baard};
  const palIk = {...ik.kleuren, ...GOUD, '(':club['('], ')':club[')']};
  const SP = [], spelerCv = f => SP[f] || (SP[f] = inkleuren(spelerBeeld(f, vIk, prijs), palIk));
  // het team: vier teamgenoten in hetzelfde tenue, om en om juichend
  const PLEK = [32, 66, 154, 188];
  const maten = PLEK.map((x, i) => { const u = (info.team || [])[i] || {}, l = lookVan(u, t, {}), v = {kapsel:l.kapsel, vrouw:l.vrouw, kleding:'tenue', patroon:l.patroon, baard:l.baard};
    return {x, cv:[0, 1].map(j => inkleuren(maatBeeld(v, j), l.kleuren))}; });
  const frames = [];
  for (let f = 0; f < H_FRAMES; f++){
    const binnen = document.createElement('canvas'); binnen.width = HW; binnen.height = HH;
    const g = binnen.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(achter[(f >> 1) % 2], 0, 0);
    // het team (springend: om de beurt een pixel of twee omhoog)
    maten.forEach((m, i) => { const j = (f + i) % 2, sprong = f >= H_MOMENT.boven && (f + i * 3) % 4 < 2 ? 2 : 0; g.drawImage(m.cv[j], m.x - 23, TREDE - 75 - sprong); });
    g.drawImage(spelerCv(f), SX - 49, TOP - 75);
    // confetti en vuurwerk over alles heen (in sleutels, met de kleuren van de club en het goud)
    const deeltjes = sprite(HW, HH, c => { if (f >= H_MOMENT.vuurwerk - 2) vuurwerk(c, f); if (f >= H_MOMENT.til) confetti(c, f, f >= H_MOMENT.boven); });
    g.drawImage(inkleuren(deeltjes, {...STIJL, ...club}), 0, 0);
    const cv = document.createElement('canvas'); cv.width = HW + 2; cv.height = HH + 2; const o = cv.getContext('2d');
    o.fillStyle = STIJL.k; o.fillRect(1, 0, HW, HH + 2); o.fillRect(0, 1, HW + 2, HH); o.drawImage(binnen, 1, 1);
    frames.push(cv);
  }
  return {frames, lus:H_FRAMES - H_LUS};
}
