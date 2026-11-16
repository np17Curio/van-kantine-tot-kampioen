/* ===================== Je interlanddebuut in pixels: het volkslied en de hand van de bondscoach ===================== */
// In de stijl van de opkomst en de huldiging (stijlbron art/chibi_anims.px.js): 's avonds in het stadion staat het nationale
// team op een rij in het landentenue, boven de tribunes wapperen de vlaggen van beide landen. Bij het volkslied gaat de
// rechterhand op het hart (er zweven muzieknoten omhoog) en zoomt de camera in op jou, met een gouden naambalk. Daarna loopt
// de bondscoach (in pak, met een das in de landskleur) naar je toe en schudt je de hand.
// 120 beelden van 220×124 op 10 fps. Jij staat met je eigen uiterlijk aan het eind van de rij.
import { Doek, GROND, Img, inkleuren, speler, sprite } from './rig.js';
import { donker, lookVan } from './atlas.js';
import { fans } from './opkomst.js';
import { loopCyclus } from './animaties.js';
import { regelBreedte, tekst, zonderAccent } from './font.js';

export const DW = 220, DH = 124, D_FPS = 10, D_FRAMES = 120;
// Belangrijke beelden (voor de teksten en de flitsen in debuutscene.js)
export const D_MOMENT = {hart:18, zoomIn:26, balk:34, omlaag:70, zoomUit:70, coach:76, stop:96, hand:96, schud:98, klaar:112};
const VOET = 104, JIJ_X = 154, MATEN_X = [24, 50, 76, 102, 128], COACH_START = 262;
const K = s => s.charCodeAt(0);

// ---------- kleuren ----------
const STIJL = {K:'#0b1022', k:'#1a1414', b:'#3c4a6e', M:'#ffe9a8', w:'#ffffff', C:'#1d1f2c', c:'#2b2e3e', g:'#2f7d3f', G:'#378c48',
  s:'#f7c9a8', h:'#b5541c', r:'#e0262b', R:'#a3161b', v:'#2b3f9e', i:'#a8744f', n:'#2a1f1c', o:'#ffd84a', O:'#d9a91c', d:'#7a4a2a', y:'#ffd21a', Y:'#e39a0c', x:'#c9ced8'};

// ---------- de vlaggen (vereenvoudigd, in hun echte kleuren) ----------
const F = {rood:'#d52b1e', wit:'#ffffff', blauw:'#21468b', zwart:'#16171c', geel:'#fdda24', goud:'#ffce00', groen:'#1f9d55', hemel:'#74acdf', marine:'#0055a4', oranje:'#ff7a1a'};
const banen = (g, w, h, kl, dl, staand) => { const som = (dl || kl.map(() => 1)).reduce((a, b) => a + b, 0); let p = 0;
  kl.forEach((k, i) => { const d = (dl ? dl[i] : 1) / som, a = Math.round(p * (staand ? w : h)), e = Math.round((p + d) * (staand ? w : h)); g.fillStyle = k;
    if (staand) g.fillRect(a, 0, e - a, h); else g.fillRect(0, a, w, e - a); p += d; }); };
const kruis = (g, w, h, k, x, dik) => { g.fillStyle = k; g.fillRect(x, 0, dik, h); g.fillRect(0, Math.round((h - dik) / 2), w, dik); };
const ster = (g, cx, cy, k) => { g.fillStyle = k; g.fillRect(cx - 1, cy - 1, 3, 3); g.fillRect(cx, cy - 2, 1, 1); g.fillRect(cx - 2, cy, 1, 1); g.fillRect(cx + 2, cy, 1, 1); g.fillRect(cx - 1, cy + 2, 1, 1); g.fillRect(cx + 1, cy + 2, 1, 1); };
const rondje = (g, cx, cy, r, k) => { g.fillStyle = k; for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * .6) g.fillRect(cx + x, cy + y, 1, 1); };
const VLAGGEN = {
  Nederland:(g, w, h) => banen(g, w, h, ['#ae1c28', F.wit, F.blauw]),
  'België':(g, w, h) => banen(g, w, h, [F.zwart, F.geel, '#ef3340'], null, true),
  Duitsland:(g, w, h) => banen(g, w, h, [F.zwart, '#dd0000', F.goud]),
  Frankrijk:(g, w, h) => banen(g, w, h, [F.marine, F.wit, '#ef4135'], null, true),
  Spanje:(g, w, h) => banen(g, w, h, ['#c60b1e', '#ffc400', '#c60b1e'], [1, 2, 1]),
  Engeland:(g, w, h) => { banen(g, w, h, [F.wit]); kruis(g, w, h, '#ce1124', Math.round(w / 2) - 2, 4); },
  Portugal:(g, w, h) => { banen(g, w, h, ['#046a38', '#da291c'], [2, 3], true); rondje(g, Math.round(w * .4), Math.round(h / 2), 3, F.geel); },
  'Italië':(g, w, h) => banen(g, w, h, ['#009246', F.wit, '#ce2b37'], null, true),
  'Brazilië':(g, w, h) => { banen(g, w, h, ['#009c3b']); g.fillStyle = '#ffdf00'; const cx = w / 2, cy = h / 2;
    for (let y = 2; y < h - 2; y++){ const b = Math.round((1 - Math.abs(y + .5 - cy) / (cy - 2)) * (w / 2 - 3)); g.fillRect(Math.round(cx - b), y, b * 2, 1); }
    rondje(g, Math.round(cx), Math.round(cy), Math.round(h / 4), '#002776'); },
  'Argentinië':(g, w, h) => { banen(g, w, h, [F.hemel, F.wit, F.hemel]); rondje(g, Math.round(w / 2), Math.round(h / 2), 2, '#f6b40e'); },
  'Kroatië':(g, w, h) => { banen(g, w, h, ['#ff0000', F.wit, '#171796']); const x0 = Math.round(w / 2) - 4, y0 = Math.round(h / 2) - 4;
    for (let y = 0; y < 8; y += 2) for (let x = 0; x < 8; x += 2){ g.fillStyle = (x + y) % 4 ? F.wit : '#ff0000'; g.fillRect(x0 + x, y0 + y, 2, 2); } },
  Marokko:(g, w, h) => { banen(g, w, h, ['#c1272d']); ster(g, Math.round(w / 2), Math.round(h / 2), '#006233'); },
  Turkije:(g, w, h) => { banen(g, w, h, ['#e30a17']); rondje(g, Math.round(w * .36), Math.round(h / 2), 5, F.wit); rondje(g, Math.round(w * .36) + 2, Math.round(h / 2), 4, '#e30a17'); ster(g, Math.round(w * .56), Math.round(h / 2), F.wit); },
  Senegal:(g, w, h) => { banen(g, w, h, ['#00853f', '#fdef42', '#e31b23'], null, true); ster(g, Math.round(w / 2), Math.round(h / 2), '#00853f'); },
  Japan:(g, w, h) => { banen(g, w, h, [F.wit]); rondje(g, Math.round(w / 2), Math.round(h / 2), Math.round(h * .28), '#bc002d'); },
  Polen:(g, w, h) => banen(g, w, h, [F.wit, '#dc143c']),
  Nigeria:(g, w, h) => banen(g, w, h, ['#008751', F.wit, '#008751'], null, true),
  Ghana:(g, w, h) => { banen(g, w, h, ['#ce1126', '#fcd116', '#006b3f']); ster(g, Math.round(w / 2), Math.round(h / 2), F.zwart); },
  Zwitserland:(g, w, h) => { banen(g, w, h, ['#ff0000']); const cx = Math.round(w / 2), cy = Math.round(h / 2), a = Math.round(h * .16), b = Math.round(h * .5);
    g.fillStyle = F.wit; g.fillRect(cx - a, cy - Math.round(b / 2) - 1, a * 2, b + 2); g.fillRect(cx - Math.round(b / 2) - 1, cy - a, b + 2, a * 2); },
  Denemarken:(g, w, h) => { banen(g, w, h, ['#c8102e']); kruis(g, w, h, F.wit, Math.round(w * .32), 3); },
  Noorwegen:(g, w, h) => { banen(g, w, h, ['#ba0c2f']); kruis(g, w, h, F.wit, Math.round(w * .3) - 1, 5); kruis(g, w, h, '#00205b', Math.round(w * .3), 3); },
  'Tsjechië':(g, w, h) => { banen(g, w, h, [F.wit, '#d7141a']); g.fillStyle = '#11457e'; for (let y = 0; y < h; y++){ const b = Math.round((1 - Math.abs(y + .5 - h / 2) / (h / 2)) * w * .45); g.fillRect(0, y, b, 1); } },
  Griekenland:(g, w, h) => { banen(g, w, h, ['#0d5eaf', F.wit, '#0d5eaf', F.wit, '#0d5eaf', F.wit, '#0d5eaf', F.wit, '#0d5eaf']); const cw = Math.round(h * 5 / 9);
    g.fillStyle = '#0d5eaf'; g.fillRect(0, 0, cw, cw); g.fillStyle = F.wit; g.fillRect(Math.round(cw / 2) - 1, 0, 2, cw); g.fillRect(0, Math.round(cw / 2) - 1, cw, 2); },
  'Kaapverdië':(g, w, h) => { banen(g, w, h, ['#003893', '#003893', F.wit, '#cf2027', F.wit, '#003893'], [6, 0, 1, 1, 1, 3]); rondje(g, Math.round(w * .38), Math.round(h * .62), 1, '#f7d116'); },
  'Curaçao':(g, w, h) => { banen(g, w, h, ['#002b7f', '#f9e814', '#002b7f'], [5, 1, 2]); ster(g, 5, 4, F.wit); ster(g, 10, 8, F.wit); },
  Suriname:(g, w, h) => { banen(g, w, h, ['#377e3f', F.wit, '#b40a2d', F.wit, '#377e3f'], [2, 1, 4, 1, 2]); ster(g, Math.round(w / 2), Math.round(h / 2), '#ecc81d'); },
  'Indonesië':(g, w, h) => banen(g, w, h, ['#ce1126', F.wit]),
};
// Een vlag als canvas (w×h); zonder eigen vlag: drie banen in de kleuren van het landentenue
export function vlagCanvas(land, w, h, tenue){
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  const f = VLAGGEN[land]; if (f) f(g, w, h); else banen(g, w, h, [tenue && tenue.shirt || F.wit, tenue && tenue.accent || F.zwart, tenue && tenue.shirt || F.wit]);
  return cv;
}
// Een donkere versie (de plooien in een wapperende vlag)
function schaduw(cv, t){
  const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; const g = o.getContext('2d');
  g.drawImage(cv, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = `rgba(11,13,24,${t})`; g.fillRect(0, 0, o.width, o.height); return o;
}
// Wapperen: elke kolom gaat op en neer (aan de stok nauwelijks, aan het eind het meest); waar de golf daalt, ligt de stof in de schaduw
function wapper(g, vlag, x0, y0, f, links){
  const w = vlag.licht.width, h = vlag.licht.height;
  for (let i = 0; i < w; i++){
    const af = i / w, fase = i * .42 - f * .8, dy = Math.round(Math.sin(fase) * (.5 + af * 2.2)), helling = Math.cos(fase);
    const bron = helling < -.45 ? vlag.donker : vlag.licht, sx = links ? i : w - 1 - i, dx = links ? x0 + i : x0 - i;
    g.fillStyle = STIJL.k; g.fillRect(dx, y0 + dy - 1, 1, h + 2);  // (de omlijning boven en onder)
    g.drawImage(bron, sx, 0, 1, h, dx, y0 + dy, 1, h);
  }
  const eind = links ? x0 + w : x0 - w, dyE = Math.round(Math.sin((w - 1) * .42 - f * .8) * 2.7);
  g.fillStyle = STIJL.k; g.fillRect(eind, y0 + dyE - 1, 1, h + 2);
}

// ---------- het stadion 's avonds ----------
function stadion(bord){
  return sprite(DW, DH, c => {
    c.rect(0, 0, DW, 30, 'K');
    for (let i = 0; i < 24; i++) c.px((i * 53 + 7) % DW, (i * 17 + 5) % 26, 'w');                                            // sterren
    for (const x of [62, 158]){ c.rect(x, 0, 2, 24, 'b'); c.rect(x - 6, 2, 14, 5, 'M'); c.hline(x - 6, 2, 14, 'w'); }        // lichtmasten
    for (const x of [8, 211]){ c.rect(x, 0, 2, 30, 'x'); c.rect(x - 1, 0, 4, 2, 'o'); }                                     // de vlaggenmasten
    c.rect(0, 26, DW, 38, 'C'); for (let y = 32; y < 64; y += 8) c.hline(0, y, DW, 'c');
    fans(c, 0, 0, 27, DW, 36, 5); fans(c, 1, 0, 27, DW, 36, 19);                                                             // de volle tribune (beide landen)
    c.rect(0, 62, DW, 8, '1'); c.hline(0, 62, DW, '2'); c.hline(0, 69, DW, '2');                                            // reclamebord in de landskleuren
    { const w = regelBreedte(bord) + 18; for (let x = 6; x < DW; x += w) tekst(c, x, 64, bord, '3'); }
    let y = 70, h = 4, i = 0; while (y < DH){ c.rect(0, y, DW, h, i % 2 ? 'G' : 'g'); y += h; h += 2; i++; }                  // gras met banen
  });
}

// ---------- de figuren ----------
// Van voren (de rig kijkt een tikje naar rechts: de voorste arm is je rechterarm). HART: de rechterhand plat op de linkerborst
const POSE = {
  staan:{x:35, lL:[-4, 4], lR:[4, 4], aL:[-8, 10], aR:[8, 10]},
  hart:{x:35, lL:[-4, 4], lR:[4, 4], aL:[-8, 10], aR:[0, -110]},
  hand:{x:35, lL:[-4, 4], lR:[4, 4], aL:[-8, 10], aR:[70, 15]},
  hand2:{x:35, lL:[-4, 4], lR:[4, 4], aL:[-8, 10], aR:[64, 18]},
  // de bondscoach, van opzij: staan, de hand uitsteken (en op en neer bij het handen schudden)
  zstaan:{x:35, lL:[-4, 4], lR:[4, 4], aL:[-4, 8], aR:[4, 8], zij:true},
  zhand:{x:35, lL:[-4, 4], lR:[4, 4], aL:[-5, 10], aR:[80, 5], zij:true},
  zhand2:{x:35, lL:[-4, 4], lR:[4, 4], aL:[-5, 10], aR:[74, 8], zij:true},
};
const LOOP = loopCyclus(35); LOOP.forEach((p, k) => { POSE['l' + k] = p; });
// look (atlas.js lookVan) → sprites per pose, met de plek van de voorste hand (na de omlijning; gespiegeld als flip)
function figuur(look){
  const v = {kapsel:look.kapsel, vrouw:look.vrouw, baard:look.baard, kleding:look.kleding, patroon:look.patroon}, cache = new Map();
  return (naam, flip = false) => {
    const sl = naam + (flip ? 'f' : ''); let r = cache.get(sl); if (r) return r;
    const img = new Img(70, 90), c = new Doek(img), [hx, hy] = speler(c, POSE[naam], v);
    let o = img.outline(K('k')); if (flip) o = o.flipX();
    r = {cv:inkleuren(o, look.kleuren), hand:[flip ? o.w - 2 - hx : hx + 1, hy + 1]}; cache.set(sl, r); return r;
  };
}
const zet = (g, fig, x, voet = VOET) => g.drawImage(fig.cv, Math.round(x) - 36, voet - GROND - 1);
const handOp = (fig, x, voet = VOET) => [Math.round(x) - 36 + fig.hand[0], voet - GROND - 1 + fig.hand[1]];

// ---------- muzieknoten (vaste "willekeur") ----------
const NOOT = [sprite(6, 9, c => { c.vline(3, 0, 7, 'M'); c.rect(1, 6, 3, 2, 'M'); c.px(4, 1, 'M'); c.px(5, 2, 'M'); c.px(5, 3, 'M'); }).outline(K('k')),
  sprite(9, 9, c => { c.vline(3, 1, 6, 'M'); c.vline(7, 0, 6, 'M'); c.line(3, 1, 7, 0, 'M'); c.hline(3, 2, 5, 'M'); c.rect(1, 6, 3, 2, 'M'); c.rect(5, 5, 3, 2, 'M'); }).outline(K('k'))];
const KORREL = n => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; return (h ^ (h >>> 13)) >>> 0; };
const NOTEN = Array.from({length:16}, (_, i) => ({f0:D_MOMENT.hart + 2 + i * 3, x:KORREL(i) % 150 + 20, soort:KORREL(i + 40) % 2, fase:KORREL(i + 9) % 7}));
// (een paar noten komen precies bij jou vandaan, voor de close-up)
[2, 6, 9, 12].forEach((i, j) => { NOTEN[i].x = JIJ_X - 8 + j * 5; });

// info = {uit (jouw uiterlijk), team: [uiterlijk × 5] (je ploeggenoten), coach (uiterlijk van de bondscoach), tenue (het landentenue),
//   land, opp (de tegenstander), oppTenue, naam (jouw naam), nr (rugnummer, mag leeg)}
// Geeft {teken(g, f): beeld f op een context van (DW+2)×(DH+2), flitsen(f), W, H, frames}
export function maakDebuut(info = {}){
  const t = info.tenue || {shirt:'#ff7a1a', accent:'#ffffff', patroon:'effen', broek:'#ffffff', sok:'#ff7a1a'}, ot = info.oppTenue || {shirt:'#ffffff', accent:'#16171c'};
  const land = zonderAccent(info.landNaam || info.land || 'NEDERLAND'), opp = zonderAccent(info.oppNaam || info.opp || 'DUITSLAND'); // (landNaam, oppNaam: in de taal van het spel)
  const pal = {...STIJL, 1:t.shirt, 2:donker(t.shirt, .3), 3:t.accent || '#ffffff', 4:ot.shirt, 5:ot.accent || '#ffffff'};
  const achter = inkleuren(stadion(land), pal);
  // de vlaggen: jouw land links, de tegenstander rechts
  const vlag = (n, tn) => { const l = vlagCanvas(n, 34, 22, tn); return {licht:l, donker:schaduw(l, .32)}; };
  const vlagJij = vlag(info.land, t), vlagZij = vlag(info.opp, ot);
  // de figuren
  const ik = figuur(lookVan(info.uit || {}, t, {}));
  const maten = MATEN_X.map((x, i) => ({x, fig:figuur(lookVan((info.team || [])[i] || {}, t, {})), hartF:D_MOMENT.hart + (KORREL(i + 3) % 5)}));
  const coach = figuur(lookVan(info.coach || {}, t, {kleding:'pak', das:t.shirt === '#ffffff' || t.shirt === '#f2f2f2' ? t.accent : t.shirt, nr:KORREL(land.length) % 6}));
  // waar de bondscoach stopt: zijn hand net naast de jouwe
  const jijHand = handOp(ik('hand'), JIJ_X), cHand = coach('zhand', true).hand, COACH_X = jijHand[0] + 3 - (cHand[0] - 36);
  // balken (op het scherm, niet ingezoomd): bovenin de wedstrijd, onderin jouw naam
  const titel = zonderAccent(`${land}  -  ${opp}`);
  const titelCv = inkleuren(sprite(DW, 11, c => { c.rect(0, 0, DW, 11, 'K'); c.hline(0, 10, DW, '1'); tekst(c, DW / 2, 3, titel, 'w', {align:'c'}); }), pal);
  const naam = zonderAccent(info.naam || 'JIJ'), nr = String(info.nr || '');
  const naamCv = inkleuren(sprite(DW, 14, c => { c.rect(0, 0, DW, 14, 'O'); c.hline(0, 0, DW, 'w'); c.hline(0, 13, DW, 'Y');
    const lbl = 'DEBUUT', lw = regelBreedte(lbl) + 8; c.rect(6, 3, lw, 8, 'K'); tekst(c, 10, 5, lbl, 'y');
    tekst(c, 6 + lw + 6, 5, nr ? `${nr}  ${naam}` : naam, 'k'); }), STIJL);
  const flitsCv = inkleuren(sprite(9, 9, c => { c.line(4, 0, 4, 8, 'w'); c.line(0, 4, 8, 4, 'w'); c.rect(3, 3, 3, 3, 'w'); c.px(4, 4, 'y'); c.px(2, 2, 'y'); c.px(6, 2, 'y'); c.px(2, 6, 'y'); c.px(6, 6, 'y'); }), STIJL);
  const notenCv = NOOT.map(n => inkleuren(n, STIJL));
  const M = D_MOMENT;
  const binnen = document.createElement('canvas'); binnen.width = DW; binnen.height = DH;
  const b = binnen.getContext('2d'); b.imageSmoothingEnabled = false;
  const glad = (a, e, x) => { const q = Math.min(1, Math.max(0, (x - a) / (e - a))); return q * q * (3 - 2 * q); };
  // de camera: zoom en het middelpunt van het beeld
  function camera(f){
    const inZ = glad(M.zoomIn, M.zoomIn + 14, f), uitZ = glad(M.zoomUit, M.zoomUit + 10, f);
    const z = 1 + inZ * 1 - uitZ * .6, cx = 110 + inZ * (JIJ_X - 110) + uitZ * ((JIJ_X + COACH_X) / 2 + 2 - JIJ_X), cy = 62 - inZ * 12 - uitZ * 2; // (ingezoomd iets hoger: de spelers zijn langer, zo blijft je hoofd in beeld)
    return {z, cx, cy};
  }
  function teken(g, f){
    b.drawImage(achter, 0, 0);
    wapper(b, vlagJij, 10, 3, f, true); wapper(b, vlagZij, 210, 3, f + 3, false);
    // de ploeggenoten en jij: eerst stil, dan de hand op het hart, na het volkslied weer omlaag
    for (const m of maten) zet(b, m.fig(f >= m.hartF && f < M.omlaag + 2 ? 'hart' : 'staan'), m.x);
    const schud = f >= M.schud && f < M.klaar, pomp = schud && (f >> 1) % 2;
    zet(b, ik(f >= M.hand ? (pomp ? 'hand2' : 'hand') : f >= M.hart && f < M.omlaag ? 'hart' : 'staan'), JIJ_X);
    // de bondscoach loopt van rechts naar je toe en steekt zijn hand uit
    if (f >= M.coach){
      const x = COACH_START + (COACH_X - COACH_START) * Math.min(1, (f - M.coach) / (M.stop - M.coach));
      zet(b, f < M.stop ? coach('l' + (f % 8), true) : coach(pomp ? 'zhand2' : f >= M.hand ? 'zhand' : 'zstaan', true), f < M.stop ? x : COACH_X);
    }
    // muzieknoten zweven omhoog tijdens het volkslied
    if (f >= M.hart && f < M.omlaag + 12) for (const n of NOTEN){
      const a = f - n.f0; if (a < 0 || a > 26 || n.f0 > M.omlaag) continue;
      b.drawImage(notenCv[n.soort], Math.round(n.x + Math.sin((a + n.fase) * .45) * 3), Math.round(VOET - 58 - a * 1.4));
    }
    // fotografen flitsen bij het handen schudden
    if (f >= M.schud && f < M.klaar + 4) for (let k = 0; k < 2; k++){ const h = KORREL(f * 7 + k); if (h % 3 === 0) b.drawImage(flitsCv, 20 + h % (DW - 40), 30 + (h >> 8) % 40); }
    // naar het scherm, met de camera (scherpe pixels)
    const {z, cx, cy} = camera(f), sw = Math.round(DW / z), sh = Math.round(DH / z);
    const sx = Math.round(Math.max(0, Math.min(DW - sw, cx - sw / 2))), sy = Math.round(Math.max(0, Math.min(DH - sh, cy - sh / 2)));
    g.clearRect(0, 0, DW + 2, DH + 2); g.fillStyle = STIJL.k; g.fillRect(1, 0, DW, DH + 2); g.fillRect(0, 1, DW + 2, DH);
    g.imageSmoothingEnabled = false; g.drawImage(binnen, sx, sy, sw, sh, 1, 1, DW, DH);
    if (f < M.zoomIn + 4) g.drawImage(titelCv, 1, 1);
    if (f >= M.balk && f < M.omlaag + 6) g.drawImage(naamCv, 1, DH + 1 - 16);
  }
  const flitsen = f => f === M.schud || f === M.schud + 6;
  return {teken, flitsen, W:DW + 2, H:DH + 2, frames:D_FRAMES};
}
