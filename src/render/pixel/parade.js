/* ===================== De promotieparade in pixels: met de open bus door de stad ===================== */
// Een variant van de huldiging (huldiging.js): na een promotie rijdt het team in een open bus in de clubkleuren door
// de straten. De huizen, de fans langs de weg (met sjaals en vlaggen in de clubkleuren) en de weg schuiven voorbij,
// de teamgenoten zwaaien vanaf het bovendek en jij staat vooraan met een spandoek: PROMOTIE! en de nieuwe league.
// 220×124 op 8 fps (net als de huldiging). De achtergrond schuift eindeloos door, dus er is geen vaste lus: teken(g, f)
// tekent beeld f (f mag blijven oplopen). De figuren en stroken worden één keer in sleutels getekend en ingekleurd.
import { Doek, Img, inkleuren, speler, sprite, vuist } from './rig.js';
import { donker, licht, lookVan } from './atlas.js';
import { fans } from './opkomst.js';
import { regelBreedte, tekst, zonderAccent } from './font.js';
import { vertaalPixel } from '../../core/taal.js';

export const PW = 220, PH = 124, P_FRAMES = 48, P_FPS = 8;
// Belangrijke beelden (voor de teksten en de flits in huldigingscene.js): de bus rijdt in beeld, het spandoek gaat omhoog
export const P_MOMENT = {start:0, binnen:10, til:12, boven:16};
const RAND = 74;            // de bovenrand van de bus (de reling van het open bovendek)
const BX0 = 24, BX1 = 198;  // de bus, van achter (links) tot de neus (rechts)
const WEG = 84, STOEP = 112; // de weg en de stoep vooraan
const SX = 166;              // waar jij staat (vooraan op het bovendek)

// ---------- kleuren ----------
const STIJL = {k:'#1a1414', w:'#ffffff', L:'#8fd3ff', l:'#c8ecff', Z:'#fff3b0',            // lucht en zon
  A:'#b4553a', a:'#8e3f2c', E:'#e7d6b4', e:'#c9b48e', F:'#6e7c8c', f:'#55606d', D:'#3d2a22',  // gevels (baksteen, zandsteen, grijs), deuren
  V:'#2c3a52', v:'#a8d8f0', T:'#4a4f5a', t:'#3a3e47',                                         // ramen, daken
  g:'#6d6f78', G:'#5a5c64', x:'#f4f4f8', X:'#9a9ca6', b:'#24262e', B:'#3a3d48', m:'#c4c4d0',  // weg, stoeprand, banden
  s:'#f7c9a8', h:'#b5541c', i:'#a8744f', n:'#2a1f1c', d:'#7a4a2a', y:'#ffd21a', c:'#34343e', o:'#ffd84a', R:'#a3161b'};

// ---------- de stad (één strook die naadloos herhaalt) ----------
const KORREL = n => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; return (h ^ (h >>> 13)) >>> 0; };
const STAD_W = 330, CROWD_W = 308; // (de fans staan op een rooster van 7 breed: 308 = 44 × 7, zo sluit de strook naadloos)
const GEVELS = [['A', 'a'], ['E', 'e'], ['F', 'f'], ['A', 'a'], ['E', 'e']];
function stad(){
  return sprite(STAD_W, WEG, c => {
    c.rect(0, 0, STAD_W, WEG, 'L'); c.rect(0, 26, STAD_W, 30, 'l');
    // een rij grachtenpanden met trapgevels en tuitgevels, met hier en daar een vlag uit het raam
    let x = 0, i = 0;
    while (x < STAD_W){
      let w = 24 + KORREL(i) % 12; if (STAD_W - x - w < 24) w = STAD_W - x; // (het laatste pand vult de strook precies)
      const hoog = 34 + KORREL(i + 40) % 18, top = 70 - hoog, [gk, gd] = GEVELS[KORREL(i + 7) % GEVELS.length], soort = KORREL(i + 13) % 3;
      c.rect(x, top, w, 70 - top, gk); c.vline(x + w - 1, top, 70 - top, gd);
      if (soort === 0){ for (let s = 0; s < 3; s++) c.rect(x + 3 + s * 3, top - 4 - s * 3, w - 6 - s * 6, 4 + s * 3, gk); } // trapgevel
      else if (soort === 1){ c.poly([x + 2, top, x + w / 2, top - 10, x + w - 2, top], gk); c.rect(x + w / 2 - 2, top - 12, 4, 2, gk); } // tuitgevel
      else { c.poly([x, top, x + w / 2, top - 9, x + w, top], 'T'); c.hline(x, top, w, 't'); } // een puntdak
      for (let ry = top + 5; ry < 60; ry += 10) for (let rx = x + 4; rx + 5 < x + w - 2; rx += 8){ c.rect(rx, ry, 5, 7, 'w'); c.rect(rx + 1, ry + 1, 3, 5, 'V'); c.px(rx + 1, ry + 1, 'v'); }
      c.rect(x + Math.floor(w / 2) - 3, 61, 6, 9, 'D'); c.hline(x + Math.floor(w / 2) - 3, 60, 6, 'w');
      if (KORREL(i + 21) % 2){ const fx = x + 5, fy = top + 6; c.line(fx, fy + 4, fx + 6, fy, 'd'); c.rect(fx + 5, fy, 3, 12, '1'); c.rect(fx + 6, fy, 1, 12, '3'); } // vlag uit het raam
      x += w; i++;
    }
    // vlaggetjes in de clubkleuren boven de straat
    for (let vx = 0; vx < STAD_W; vx += 6){ const vy = 18 + Math.round(Math.sin(vx / STAD_W * Math.PI * 6) * 3); c.px(vx, vy, 'k'); c.px(vx + 1, vy, 'k'); c.poly([vx + 1, vy + 1, vx + 5, vy + 1, vx + 3, vy + 5], vx % 12 ? '3' : '1'); }
    c.rect(0, 70, STAD_W, WEG - 70, 'X'); c.hline(0, 70, STAD_W, 'x'); c.hline(0, WEG - 1, STAD_W, 'm'); // de stoep achter de weg
  });
}
// De fans langs de weg (twee versies om en om juichend), met sjaals boven het hoofd en vlaggen aan een stok
function publiek(juich, seed, sjaals){
  return sprite(CROWD_W, 22, c => {
    fans(c, juich, 0, 4, CROWD_W, 18, seed); fans(c, juich ? 0 : 1, 3, 13, CROWD_W - 7, 9, seed + 4);
    for (let x = 4 + seed % 9; x < CROWD_W - 12; x += 17 + (x * 7) % 9){
      const j = (x + juich * 5) % 3, y = juich && j ? 0 : 2;
      if ((x >> 2) % 3 === 0){ c.vline(x, y, 12, 'd'); for (let r = 0; r < 5; r++) c.hline(x + 1, y + r, 7 - (juich ? r % 2 : 0), r === 2 ? '3' : '1'); } // vlag
      else if (sjaals){ for (let s = 0; s < 10; s++) c.px(x + s, y + 3 + (s === 0 || s === 9 ? 1 : 0), Math.floor(s / 2) % 2 ? '3' : '1'); c.px(x, y + 5, '1'); c.px(x + 9, y + 5, '3'); } // sjaal
    }
  });
}

// ---------- de bus (open bovendek, in de clubkleuren) ----------
function bus(naam){
  const w = BX1 - BX0;
  return sprite(w + 2, 44, c => {
    const y0 = 2;
    c.rect(0, y0, w, 34, 'k'); c.rect(1, y0 + 1, w - 2, 32, '1');                          // de bak
    c.rect(w - 14, y0 + 1, 13, 32, '1'); c.rect(w - 12, y0 + 6, 10, 12, 'V'); c.px(w - 11, y0 + 7, 'v'); c.px(w - 10, y0 + 7, 'v'); // de neus met de voorruit
    c.rect(1, y0 + 26, w - 2, 7, '2');                                                     // de onderkant
    c.rect(1, y0 + 8, w - 16, 10, 'k'); for (let x = 3; x < w - 18; x += 14) c.rect(x, y0 + 9, 12, 8, 'V');   // de ramen beneden
    for (let x = 4; x < w - 18; x += 14) c.px(x, y0 + 10, 'v');
    c.rect(1, y0 + 19, w - 2, 6, '3'); tekst(c, Math.round((w - 14) / 2), y0 + 20, naam, '1', {align:'c'});  // de clubnaam op de zijkant
    c.rect(w - 4, y0 + 22, 3, 3, 'y'); c.rect(1, y0 + 22, 2, 3, 'R');                         // koplamp, achterlicht
    c.rect(0, 0, w, 3, 'k'); c.hline(1, 1, w - 2, '3');                                       // de reling
    for (let x = 1; x < w; x += 12) c.rect(x, 0, 2, 3, '3');
  });
}
const WIEL = [0, 1].map(j => sprite(17, 17, c => { c.circ(8, 8, 8, 'k'); c.circ(8, 8, 7, 'b'); c.circ(8, 8, 4, 'B'); c.circ(8, 8, 2, 'm');
  for (let a = 0; a < 4; a++){ const h = a * Math.PI / 2 + j * Math.PI / 4; c.px(Math.round(8 + Math.cos(h) * 3), Math.round(8 + Math.sin(h) * 3), 'm'); } }));

// ---------- het spandoek (op twee stokken: ( doek in de clubkleur, ) letters, { rand, ; hout) ----------
function spandoek(titel, liga){
  const t1 = vertaalPixel(zonderAccent(titel)).slice(0, 12), t2 = vertaalPixel(zonderAccent(liga)).slice(0, 22); // (vertaald vóór het meten)
  const w = Math.max(regelBreedte(t1, {scale:2}), regelBreedte(t2)) + 10, h = 22, stok = 12;
  const img = sprite(w, h + stok, c => {
    const gx = [Math.round(w / 2) - 22, Math.round(w / 2) + 22];
    for (const x of gx) c.rect(x - 1, h - 2, 2, stok + 2, ';');
    c.rect(0, 0, w, h, '{'); c.rect(1, 1, w - 2, h - 2, '(');
    tekst(c, Math.round(w / 2), 3, t1, ')', {scale:2, align:'c'}); tekst(c, Math.round(w / 2), 15, t2, ')', {align:'c'});
  });
  return {img, grip:[[Math.round(img.w / 2) - 22, img.h - 1], [Math.round(img.w / 2) + 22, img.h - 1]]};
}

// ---------- de figuren (van voren, alleen het bovenlijf steekt boven de reling uit) ----------
const HEUP = 80, FIG_W = 100, FIG_H = 110;
// teamgenoten: zwaaien met één arm (twee beelden om en om), de andere arm op de reling of ook omhoog
const ZWAAI = [{aL:[-160, -30], aR:[30, -20], arm:1.3}, {aL:[-130, 10], aR:[30, -20], arm:1.3}, {aL:[-150, -20], aR:[150, 20], arm:1.3}, {aL:[-120, -30], aR:[120, 30], arm:1.3}];
function maatBeeld(v, i){
  const img = new Img(FIG_W, FIG_H), c = new Doek(img);
  speler(c, {x:50, y:HEUP, lL:[-5, 10], lR:[10, 15], ...ZWAAI[i]}, v);
  return img.outline(107); // ('k')
}
// jij: eerst zwaaien, dan trek je het spandoek van het dek omhoog en houd je het boven je hoofd
const OMHOOG = [{aL:[-140, -10], aR:[140, 10], arm:1.9}, {aL:[-136, -12], aR:[136, 12], arm:1.85}];
function jijBeeld(f, v, doek){
  const img = new Img(FIG_W, FIG_H), c = new Doek(img), B = {x:50, y:HEUP, lL:[-5, 10], lR:[10, 15]};
  if (f < P_MOMENT.til){ speler(c, {...B, ...ZWAAI[f % 2 ? 0 : 1], aR:[-30, 20]}, v); return img.outline(107); }
  const P = f < P_MOMENT.boven ? {aL:[-60, -50], aR:[60, 50], arm:1.6} : OMHOOG[Math.floor(f / 2) % 2];
  const arm = (sx, [a, b]) => { const r = d => d * Math.PI / 180, l1 = 6 * P.arm, l2 = 5 * P.arm;
    return [sx + Math.sin(r(a)) * l1 + Math.sin(r(a + b)) * l2, HEUP - 11 + Math.cos(r(a)) * l1 + Math.cos(r(a + b)) * l2]; };
  const hL = arm(B.x - 10, P.aL), hR = arm(B.x + 9, P.aR), [[g1x, g1y], [g2x]] = doek.grip;
  const px = Math.round((hL[0] + hR[0]) / 2 - (g1x + g2x) / 2), py = Math.round(Math.min(hL[1], hR[1]) - g1y);
  speler(c, {...B, ...P, voor:true, extra:k => k.stamp(doek.img, px, py)}, v);
  vuist(c, Math.round(hL[0]), Math.round(hL[1]), 'S'); vuist(c, Math.round(hR[0]), Math.round(hR[1]), 's');
  return img.outline(107);
}

// ---------- confetti (vaste "willekeur"; direct op het canvas, want de stad schuift eindeloos door) ----------
const CONFETTI = Array.from({length:80}, (_, i) => ({x:KORREL(i) % PW, y:KORREL(i + 500) % PH, v:2 + KORREL(i + 900) % 3, k:KORREL(i + 77) % 5, fase:KORREL(i + 33) % 8, breed:KORREL(i + 11) % 3 === 0}));

// info = {uit (jouw uiterlijk), tenue, team: [uiterlijk × 4], naam (op de bus), titel ('PROMOTIE!'), liga (de nieuwe league), band}
// Geeft {w, h, teken(g, f)}: g = 2d-context van een canvas van (w × h), f = het beeldnummer (mag eindeloos oplopen)
export function maakParade(info = {}){
  const t = info.tenue || {shirt:'#e0262b', accent:'#ffffff', patroon:'strepen', broek:'#2f62d6', sok:'#e0262b'};
  const acc = t.accent || '#ffffff', club = {1:t.shirt, 2:donker(t.shirt, .3), 3:acc, 4:licht(t.shirt, .25), 5:'#f4f4f8'};
  const pal = {...STIJL, ...club}, naam = zonderAccent(info.naam || 'FC PIXEL').slice(0, 26);
  const achter = inkleuren(stad(), pal);
  const rijAchter = [0, 1].map(j => inkleuren(publiek(j, 3, true), pal)), rijVoor = [0, 1].map(j => inkleuren(publiek(j, 11, true), pal));
  const busCv = inkleuren(bus(naam), pal), wielen = WIEL.map(w => inkleuren(w, pal));
  const doek = spandoek(info.titel || 'PROMOTIE!', info.liga || '');
  const ik = lookVan(info.uit || {}, t, {band:!!info.band});
  const vIk = {kapsel:ik.kapsel, vrouw:ik.vrouw, kleding:'tenue', patroon:ik.patroon, band:ik.band, baard:ik.baard};
  const palIk = {...ik.kleuren, '(':t.shirt, ')':acc, '{':donker(t.shirt, .45), ';':'#7a4a2a'};
  const JIJ = [], jijCv = f => { const k = f < P_MOMENT.til ? f % 2 : f < P_MOMENT.boven ? 2 : 3 + Math.floor(f / 2) % 2;
    return JIJ[k] || (JIJ[k] = inkleuren(jijBeeld(k < 2 ? k : k === 2 ? P_MOMENT.til : P_MOMENT.boven + (k - 3) * 2, vIk, doek), palIk)); };
  const PLEK = [46, 74, 102, 130];
  const maten = PLEK.map((x, i) => { const u = (info.team || [])[i] || {}, l = lookVan(u, t, {}), v = {kapsel:l.kapsel, vrouw:l.vrouw, kleding:'tenue', patroon:l.patroon, baard:l.baard};
    const z = i % 2 ? [2, 3] : [0, 1]; return {x, cv:z.map(j => inkleuren(maatBeeld(v, j), l.kleuren))}; });
  const KLEUR = [t.shirt, acc, '#ffd84a', '#ffffff', '#ff6fa8'];
  const tegel = (g, cv, x, y, w) => { for (let xx = -(x % w + w) % w; xx < PW; xx += w) g.drawImage(cv, xx, y); };

  function teken(g, f){
    g.imageSmoothingEnabled = false;
    const sp = f * 3, j = (f >> 1) % 2;
    g.fillStyle = STIJL.k; g.fillRect(0, 0, PW + 2, PH + 2);
    g.save(); g.beginPath(); g.rect(1, 1, PW, PH); g.clip(); g.translate(1, 1);
    tegel(g, achter, Math.round(sp * .5), 0, STAD_W);                                   // de huizen (verder weg: langzamer)
    tegel(g, rijAchter[j], sp, 62, CROWD_W);                                             // de fans op de stoep achter de bus
    g.fillStyle = STIJL.g; g.fillRect(0, WEG, PW, STOEP - WEG); g.fillStyle = STIJL.G; g.fillRect(0, WEG, PW, 2);
    g.fillStyle = STIJL.x; for (let x = -((sp * 1.5) % 24); x < PW; x += 24) g.fillRect(Math.round(x), 99, 12, 2); // de streep op de weg
    g.fillStyle = STIJL.m; g.fillRect(0, STOEP - 2, PW, 2);
    // de bus rijdt in beeld en schudt een beetje
    const inR = f < P_MOMENT.binnen ? Math.round(-200 * (1 - f / P_MOMENT.binnen) ** 2) : 0, dy = f >= P_MOMENT.binnen && (f >> 1) % 2 ? 1 : 0;
    maten.forEach((m, i) => { const sprong = f >= P_MOMENT.boven && (f + i * 3) % 4 < 2 ? 1 : 0; g.drawImage(m.cv[(f + i) % 2], m.x - 51 + inR, RAND + 4 - HEUP - 1 + dy - sprong); });
    g.drawImage(jijCv(f), SX - 51 + inR, RAND + 4 - HEUP - 1 + dy);
    g.drawImage(busCv, BX0 + inR, RAND - 1 + dy);
    for (const wx of [BX0 + 30, BX1 - 34]) g.drawImage(wielen[f % 2], wx - 8 + inR, RAND + 22);
    tegel(g, rijVoor[(j + 1) % 2], Math.round(sp * 1.4), STOEP - 2, CROWD_W);             // de fans vooraan (dichtbij: sneller)
    // confetti: eerst een beetje, als het spandoek omhoog gaat veel meer
    if (f >= P_MOMENT.til - 4){ const veel = f >= P_MOMENT.boven;
      CONFETTI.forEach((p, i) => { if (!veel && i % 3) return;
        const y = Math.round((p.y + f * p.v) % (PH + 4)) - 2, x = Math.round(((p.x - f * 1.5 + Math.sin((f + p.fase) * .7) * 2) % PW + PW) % PW);
        g.fillStyle = KLEUR[p.k]; g.fillRect(x, y, p.breed && (f + i) % 2 ? 2 : 1, p.breed && !((f + i) % 2) ? 2 : 1); }); }
    g.restore();
  }
  return {w:PW + 2, h:PH + 2, teken};
}
