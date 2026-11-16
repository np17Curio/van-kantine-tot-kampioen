/* ===================== Mijlpaalgoal in pixels: je 1e, 50e en 100e goal ===================== */
// In de stijl van de huldiging en de opkomst (stijlbron art/chibi_anims.px.js). Drie delen op 10 fps, 220×124:
//  A (beeld 0-29)  de herhaling: jij schiet (of kopt) de bal langs de keeper in het net, het net bolt op, GOAL!
//  B (beeld 30-65) jij doet je eigen juichdans (S.sp.dans, de pixelanimaties met dezelfde naam in animaties.js) bij de hoekvlag
//  C (beeld 66-89) de tribune ontploft: springende fans met sjaals, een spandoek met 1E GOAL / 50 GOALS / 100 GOALS
// Daarna lopen de laatste 16 beelden van de tribune door tot je verder klikt (zoals de huldiging).
// Achtergronden, net, bal en fans worden in sleutels getekend en ingekleurd; de spelers komen uit atlas.js (frame).
import { BAL, Doek, Img, inkleuren, sprite } from './rig.js';
import { donker, frame, frameOp, lookVan } from './atlas.js';
import { ANIMS } from './animaties.js';
import { fans } from './opkomst.js';
import { regelBreedte, tekst, zonderAccent } from './font.js';

export const MW = 220, MH = 124, M_FPS = 10, M_FRAMES = 90, M_LUS = 16;
export const M_MOMENT = {schot:12, goal:18, dans:30, mee:52, tribune:66};
const GY = 112;            // de voeten op het gras
const PAAL = 184, LAT = 40; // de voorste doelpaal (x) en de bovenkant van het doel (y)
const DOEL = [204, 54];     // waar de bal het net raakt

// ---------- kleuren ----------
const STIJL = {K:'#0b1022', k:'#1a1414', b:'#3c4a6e', M:'#ffe9a8', w:'#ffffff', W:'#d4d4de', C:'#1d1f2c', c:'#2b2e3e', g:'#2f7d3f', G:'#378c48',
  s:'#f7c9a8', S:'#e3a07e', i:'#a8744f', I:'#6f4630', d:'#5a3a24', n:'#2a1f1c', h:'#b5541c', y:'#ffd21a', Y:'#e39a0c', r:'#e0262b', o:'#ffd84a'};
const KORREL = n => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; return (h ^ (h >>> 13)) >>> 0; };

// ---------- achtergronden ----------
function gras(c, y0){ let y = y0, h = 4, i = 0; while (y < MH){ c.rect(0, y, MW, h, i % 2 ? 'G' : 'g'); y += h; h += 2; i++; } }
function borden(c, y, naam){ c.rect(0, y, MW, 8, '1'); c.hline(0, y, MW, '2'); c.hline(0, y + 7, MW, '2'); const w = regelBreedte(naam) + 18; for (let x = 6; x < MW; x += w) tekst(c, x, y + 2, naam, '3'); }
// A: van opzij langs het veld, het doel rechts
function veldA(naam, juich){
  return sprite(MW, MH, c => {
    c.rect(0, 0, MW, 16, 'K'); for (let i = 0; i < 14; i++) c.px((i * 53 + 7) % MW, (i * 11 + 2) % 12, 'w');
    for (const x of [30, 150]){ c.rect(x, 0, 2, 12, 'b'); c.rect(x - 5, 1, 12, 4, 'M'); }
    c.rect(0, 12, MW, 34, 'C'); for (let y = 18; y < 46; y += 8) c.hline(0, y, MW, 'c');
    fans(c, juich ? 1 : 0, 0, 13, MW, 32, 5); fans(c, juich ? 0 : 1, 0, 13, MW, 32, 13);
    borden(c, 45, naam); gras(c, 53);
    c.hline(0, 100, MW, 'w'); // (de lijn van het strafschopgebied, in de verte)
  });
}
// B: dichterbij de tribune, de hoekvlag rechts
function veldB(naam, juich){
  return sprite(MW, MH, c => {
    c.rect(0, 0, MW, 8, 'K');
    c.rect(0, 6, MW, 52, 'C'); for (let y = 12; y < 58; y += 9) c.hline(0, y, MW, 'c');
    fans(c, juich ? 1 : 0, 0, 7, MW, 50, 21); fans(c, juich ? 0 : 1, 0, 7, MW, 50, 29);
    borden(c, 57, naam); gras(c, 65);
    c.vline(207, 72, 34, 'w'); c.poly([208, 72, 216, 75, 208, 79], '1'); c.px(207, 106, 'W');  // de hoekvlag
    c.line(180, 106, 219, 103, 'w'); // (de zijlijn naar de hoek)
  });
}

// ---------- het doel van opzij (het net bolt op waar de bal erin vliegt) ----------
function doel(c, bol){
  const d = (x, y) => { if (!bol) return 0; const dx = x - DOEL[0], dy = y - DOEL[1]; return Math.round(bol * Math.exp(-(dx * dx + dy * dy) / 90)); };
  const boven = x => LAT + Math.round((x - PAAL) * 4 / 22);                 // de bovenkant van het zijnet loopt iets af
  const achter = y => 206 + Math.round((y - LAT) * 10 / (GY - LAT));         // de achterkant van het net loopt schuin naar beneden
  for (let x = PAAL + 6; x < 218; x += 6) for (let y = boven(Math.min(x, 206)); y <= GY; y++) if (x <= achter(y)) c.px(x + d(x, y), y, 'W');  // verticale mazen
  for (let y = LAT + 6; y < GY; y += 6) for (let x = PAAL + 2; x <= achter(y); x++) if (y >= boven(Math.min(x, 206))) c.px(x + d(x, y), y, 'W'); // horizontale mazen
  for (let y = LAT; y <= GY; y++) c.px(achter(y) + d(achter(y), y), y, 'W');
  c.line(PAAL, LAT, 206, LAT + 4, 'W');
  c.rect(PAAL, LAT, 3, GY - LAT + 1, 'w'); c.vline(PAAL + 2, LAT + 1, GY - LAT, 'W'); c.rect(PAAL - 1, LAT - 1, 5, 2, 'w'); // de paal met de lat (van opzij)
}

// ---------- de fans van dichtbij (deel C) ----------
const HAAR = ['n', 'h', 'y', 'd', 'k', 'n', 'I'], HUID = ['s', 's', 'i', 'S', 'I', 's'];
// x = midden, y = bovenkant van het hoofd; soort 0 sjaal boven het hoofd, 1 vuist, 2 beide armen omhoog; hoog = de sjaal/armen hoger
function fan(c, x, y, nr, soort, hoog, shirt){
  const hd = HUID[nr % HUID.length], ha = HAAR[(nr >>> 1) % HAAR.length];
  c.rect(x - 7, y + 9, 15, 16, shirt);                                       // het lijf
  if (shirt === '1') c.rect(x - 1, y + 9, 3, 16, '3'); else c.rect(x - 7, y + 13, 15, 3, '1');
  c.circ(x, y + 4, 5, hd); c.rect(x - 5, y - 1, 11, 3, ha); c.px(x - 5, y + 2, ha); c.px(x + 5, y + 2, ha);  // hoofd en haar
  c.px(x - 2, y + 4, 'k'); c.px(x + 2, y + 4, 'k'); c.rect(x - 1, y + 6, 3, 2 + (hoog ? 1 : 0), 'k');  // ogen en een juichende mond
  const top = y - (hoog ? 9 : 6);
  if (soort === 0){                                                          // de sjaal strak boven het hoofd
    c.line(x - 7, y + 10, x - 9, top + 1, hd, 2); c.line(x + 7, y + 10, x + 9, top + 1, hd, 2);
    for (let i = 0; i < 21; i++) c.rect(x - 10 + i, top - 1 + (hoog && i % 7 === 3 ? -1 : 0), 1, 3, (i >> 2) % 2 ? '3' : '1');
    c.px(x - 11, top + 2, '1'); c.px(x + 11, top + 2, '1'); c.px(x - 11, top + 3, '3'); c.px(x + 11, top + 3, '3');  // franjes
  } else if (soort === 1){                                                   // een vuist in de lucht
    c.line(x + 6, y + 10, x + 8, top, hd, 2); c.circ(x + 8, top - 1, 2, hd); c.line(x - 6, y + 11, x - 9, y + 16, hd, 2);
  } else { c.line(x - 6, y + 10, x - 10, top, hd, 2); c.line(x + 6, y + 10, x + 10, top, hd, 2); c.circ(x - 10, top - 1, 2, hd); c.circ(x + 10, top - 1, 2, hd); }
}
function tribune(f, kop, naam){
  const achter = sprite(MW, MH, c => {
    c.rect(0, 0, MW, MH, 'C'); for (let y = 6; y < MH; y += 12) c.hline(0, y, MW, 'c');
    c.rect(0, 0, MW, 5, 'K'); for (let x = 20; x < MW; x += 60) c.rect(x, 0, 16, 2, 'M');
  });
  const volk = new Img(MW, MH), c = new Doek(volk);
  [[20, 22], [44, 18], [68, 14]].forEach(([y, stap], rij) => {
    for (let i = 0, x = (rij % 2) * 9 - 4; x < MW + 12; x += stap, i++){
      const nr = KORREL(rij * 97 + i), op = (f + nr) % 4 < 2, soort = nr % 5 === 0 ? 2 : nr % 3 === 0 ? 1 : 0;
      fan(c, x, y - (op ? 3 : 0), nr, soort, op, nr % 4 === 1 ? '3' : '1');
    }
  });
  const fansImg = volk.outline(107); // ('k')
  // het spandoek vooraan (zwaait een pixel op en neer), met de mijlpaal groot en je naam eronder
  const doek = sprite(MW, MH, c => {
    const y = 88 + ((f >> 2) % 2);
    c.rect(6, y, MW - 12, 30, '1'); c.hline(6, y, MW - 12, '3'); c.hline(6, y + 29, MW - 12, '3'); c.vline(6, y, 30, '3'); c.vline(MW - 7, y, 30, '3');
    for (let x = 10; x < MW - 10; x += 8) c.px(x, y + 2, '3');
    tekst(c, MW / 2, y + 5, kop, '3', {scale:3, align:'c'});
    tekst(c, MW / 2, y + 23, naam, '3', {align:'c'});
    c.vline(4, y - 6, 36, 'd'); c.vline(MW - 5, y - 6, 36, 'd');          // de stokken
  });
  // snippers en flitsjes van fototoestellen
  const deeltjes = sprite(MW, MH, c => {
    for (let i = 0; i < 70; i++){ const x = (KORREL(i) % MW + Math.round(Math.sin((f + i) * .6) * 2)), y = Math.round((KORREL(i + 300) % MH + f * (2 + KORREL(i + 9) % 2)) % (MH + 4)) - 2;
      c.px(x, y, ['1', '3', 'w', 'o'][KORREL(i + 40) % 4]); if (i % 3 === 0) c.px(x + 1, y, ['1', '3', 'w', 'o'][KORREL(i + 40) % 4]); }
    for (let i = 0; i < 3; i++){ const k = KORREL(f * 7 + i); if (k % 3) continue; const x = k % MW, y = 10 + (k >> 8) % 60; c.rect(x - 1, y, 3, 1, 'w'); c.rect(x, y - 1, 1, 3, 'w'); }
  });
  return [achter, fansImg, doek, deeltjes];
}

// ---------- de dansen: waar sta je (sommige dansen gaan over het veld) ----------
const DANS_ANIM = id => (id && ANIMS[id] ? id : 'juich');
function dansPlek(id, t){ // t in seconden sinds het begin van de dans
  const u = Math.min(1, t / 3.4);
  if (id === 'vliegtuig') return 36 + 140 * u;
  if (id === 'polonaise') return 70 + 105 * u;
  if (id === 'kangoeroe') return 70 + 70 * u;
  if (id === 'knieslide'){ const s = Math.min(1, t / 1.1); return 56 + 64 * (1 - (1 - s) * (1 - s)); }
  return 112;
}

// info = {uit (jouw uiterlijk), tenue, team:[uiterlijk × 3] (teamgenoten), keeper (uiterlijk), keeperTenue, naam (op de borden), speler (jouw naam),
//   n (1, 50 of 100), dans (id uit dansen.js), soort ('schot'|'kop'|'pen')}. Geeft {W, H, teken(g, f)}; f loopt door, na het laatste beeld de lus
export function maakMijlpaal(info = {}){
  const t = info.tenue || {shirt:'#e0262b', accent:'#ffffff', patroon:'strepen', broek:'#2f62d6', sok:'#e0262b'};
  const club = {1:t.shirt, 2:donker(t.shirt, .3), 3:t.accent || '#ffffff'};
  const pal = {...STIJL, ...club};
  const naam = zonderAccent(info.naam || 'FC').slice(0, 24), spNaam = zonderAccent(info.speler || '').slice(0, 30);
  const kop = info.n === 1 ? '1E GOAL' : `${info.n} GOALS`;
  const ik = lookVan(info.uit || {}, t, {band:!!info.band});
  const kt = info.keeperTenue || {shirt:'#f08a1c', accent:'#16171c', patroon:'effen', broek:'#16171c', sok:'#f08a1c'};
  const keeper = lookVan(info.keeper || {}, kt, {handschoen:true});
  const maten = [0, 1, 2].map(i => lookVan((info.team || [])[i] || {}, t, {}));
  const bgA = [0, 1].map(j => inkleuren(veldA(naam, j), pal)), bgB = [0, 1].map(j => inkleuren(veldB(naam, j), pal));
  const balImg = BAL.outline(107), bal = [0, 90, 180, 270].map(r => inkleuren(balImg.rot(r), pal));
  const netten = new Map(), net = bol => netten.get(bol) || (netten.set(bol, inkleuren(sprite(MW, MH, c => doel(c, bol)), pal)), netten.get(bol));
  const goalTekst = [3, 4].map(s => { const im = sprite(96, 24, c => tekst(c, 48, 2, 'GOAL!', 'y', {scale:s, align:'c'})).outline(107); return inkleuren(im, pal); });
  const herhaling = inkleuren(sprite(60, 9, c => { c.circ(3, 4, 2, 'r'); tekst(c, 8, 2, 'HERHALING', 'w'); }), pal);
  const TRIB = []; const trib = f => TRIB[f % 8] || (TRIB[f % 8] = tribune(f % 8, kop, spNaam).map(im => inkleuren(im, pal)));
  const dans = DANS_ANIM(info.dans), soort = info.soort || 'schot';
  const zet = (g, look, anim, i, x, flip = false) => g.drawImage(frame(look, anim, i, flip), Math.round(x) - (flip ? 50 : 47), GY - 75);

  // de bal in deel A: [x, y] of null (de speler heeft hem dan zelf)
  const SCH = soort === 'kop' ? 112 : soort === 'pen' ? 100 : 70; // waar je staat als je schiet of kopt
  const start = soort === 'kop' ? [SCH + 10, GY - 62] : [SCH + 26, GY - 12];
  function balA(f){
    if (f >= M_MOMENT.goal){ const n = f - M_MOMENT.goal; return [DOEL[0] - Math.min(4, n), Math.min(GY - 5, DOEL[1] + n * n * 1.2)]; } // na de goal valt hij in het net
    if (f >= M_MOMENT.schot){ const u = (f - M_MOMENT.schot) / (M_MOMENT.goal - M_MOMENT.schot);
      return [start[0] + (DOEL[0] - start[0]) * u, start[1] + (DOEL[1] - start[1]) * u - (soort === 'kop' ? 4 : 16) * Math.sin(Math.PI * u)]; }
    if (soort === 'kop'){ const u = f / M_MOMENT.schot; return [214 - (214 - start[0]) * u, 6 + (start[1] - 6) * u - 22 * Math.sin(Math.PI * u)]; } // de voorzet van de achterlijn
    return null;
  }
  function delA(g, f){
    g.drawImage(bgA[(f >> 2) % 2], 0, 0);
    const b = balA(f), inNet = b && b[0] > PAAL + 2;
    if (inNet) g.drawImage(bal[f % 4], Math.round(b[0]) - 6, Math.round(b[1]) - 6);
    const bol = f >= M_MOMENT.goal ? [4, 3, 2, 1, 1, 0][f - M_MOMENT.goal] || 0 : 0;
    g.drawImage(net(bol), 0, 0);
    // de keeper: klaar, en net te laat in de sprong
    const kx = 168;
    if (f < M_MOMENT.schot + 4) zet(g, keeper, 'keeperKlaar', frameOp('keeperKlaar', f / M_FPS), kx, true);
    else zet(g, keeper, 'spring', Math.min(7, f - M_MOMENT.schot - 4), kx, true);
    // jij
    if (soort === 'kop'){
      if (f < 8) zet(g, ik, 'sta', frameOp('sta', f / M_FPS), SCH); else zet(g, ik, 'kop', Math.min(7, f - 8), SCH);
    } else {
      const aanloop = M_MOMENT.schot - 4, x0 = soort === 'pen' ? SCH - 30 : 8;
      if (f < aanloop){ const x = x0 + (SCH - x0) * f / aanloop; zet(g, ik, 'ren', f % 8, x);
        g.drawImage(bal[(f >> 1) % 4], Math.round(x + 14 + (f % 4 < 2 ? 2 : 0)) - 6, GY - 11); }
      else { const i = Math.min(7, f - aanloop); zet(g, ik, 'schiet', i, SCH); if (f < M_MOMENT.schot) g.drawImage(bal[0], SCH + 18 - 6, GY - 11); }
    }
    if (b && !inNet) g.drawImage(bal[f % 4], Math.round(b[0]) - 6, Math.round(b[1]) - 6);
    if (f >= M_MOMENT.goal + 1){ const gt = goalTekst[f === M_MOMENT.goal + 1 ? 0 : 1]; g.drawImage(gt, 92 - gt.width / 2, 14 - (f % 4 < 2 ? 1 : 0)); }
    if ((f >> 2) % 2 === 0 || f < 4) g.drawImage(herhaling, 4, 3);
  }
  function delB(g, f){
    const n = f - M_MOMENT.dans, tt = n / M_FPS;
    g.drawImage(bgB[(f >> 1) % 2], 0, 0);
    const x = dansPlek(dans, tt), i = frameOp(dans, tt);
    // teamgenoten: bij de polonaise in een rij achter je aan, anders komen ze aan het eind juichend aanrennen
    if (dans === 'polonaise') maten.forEach((m, j) => zet(g, m, dans, frameOp(dans, tt + j * .15), x - 26 * (j + 1)));
    else if (f >= M_MOMENT.mee){ const m = f - M_MOMENT.mee, klaar = m >= 8;
      const doelL = Math.max(22, x - 34), doelR = Math.min(196, x + 34);
      const xl = klaar ? doelL : -30 + (doelL + 30) * m / 8, xr = klaar ? doelR : 250 - (250 - doelR) * m / 8;
      zet(g, maten[0], klaar ? 'juich' : 'renJuich', klaar ? frameOp('juich', m / M_FPS) : m % 8, xl);
      zet(g, maten[1], klaar ? 'juich' : 'renJuich', klaar ? frameOp('juich', m / M_FPS + .2) : (m + 3) % 8, xr, true); }
    zet(g, ik, dans, i, x);
  }
  function delC(g, f){ const [a, v, d, p] = trib(f - M_MOMENT.tribune); g.drawImage(a, 0, 0); g.drawImage(v, -1, -1); g.drawImage(d, 0, 0); g.drawImage(p, 0, 0); }
  function teken(g, f){
    if (f >= M_FRAMES) f = M_FRAMES - M_LUS + ((f - M_FRAMES) % M_LUS);
    g.imageSmoothingEnabled = false;
    g.fillStyle = STIJL.k; g.fillRect(0, 0, MW + 2, MH + 2);
    g.save(); g.translate(1, 1); g.beginPath(); g.rect(0, 0, MW, MH); g.clip();
    if (f < M_MOMENT.dans) delA(g, f); else if (f < M_MOMENT.tribune) delB(g, f); else delC(g, f);
    g.restore();
  }
  return {W:MW + 2, H:MH + 2, teken};
}
