/* ===================== De persconferentie in pixels ===================== */
// In dezelfde stijl als de contractondertekening (pixel/contract.js): de perszaal met een sponsorwand vol clublogo's,
// een tafel met een kleed in de clubkleuren, microfoons van de zenders, jij en de persvoorlichter achter de tafel,
// tv-camera's aan de zijkant en vooraan een rij journalisten en fotografen (op de rug gezien) die hun hand opsteken.
// De scène wordt per beeld getekend uit een toestand (render/persscene.js bepaalt wat er gebeurt).
import { Doek, GROND, Img, inkleuren, speler, sprite } from './rig.js';
import { loopCyclus } from './animaties.js';
import { donker, lookVan } from './atlas.js';
import { tekst, regelBreedte, zonderAccent } from './font.js';

export const PW = 220, PH = 124, P_FPS = 8;
const VLOER = 100, DY = VLOER - GROND;
export const SX = 98, BX = 142, DEUR = 18;   // jouw stoel, die van de persvoorlichter, de deur
const TAFEL = 86;                             // bovenkant van het tafelblad
export const ZIT = 4;                          // zoveel pixels zak je als je gaat zitten

const KL = {k:'#1a1414', s:'#f7c9a8', S:'#e3a07e', h:'#b5541c', j:'#dc7a3c', w:'#ffffff', W:'#d4d4de', y:'#ffd21a',
  n:'#2a1f1c', N:'#140e0c', l:'#c4c4cc', L:'#8e8e9a', z:'#3a3a44', Z:'#24242c', X:'#c4c4d0', c:'#34343e', C:'#22222a',
  e:'#4a6fb0', E:'#33508a', P:'#2b3452', D:'#1b2138', V:'#1a2563', o:'#ffd84a', u:'#2f62d6',
  f:'#e4e2dc', F:'#cfccc4', J:'#5a5f6e', T:'#464a57', i:'#3a2c26', I:'#271c18', b:'#9fd4f5', '!':'#ff2a2a',
  1:'#d62828', 2:'#1d4ed8', 3:'#f59e0b', 4:'#111827', 5:'#059669'};

// ---------- de zaal ----------
const LOGO = ['..RRRRRRRRR', '..RrwrwrwrR', '..RrwrwrwrR', '..RrwrwrwrR', '..RrwrwrwrR', '...RrwrwrR.', '....RrwrR..', '.....RrR...', '......R....'];
const logo = sprite(16, 13, c => LOGO.forEach((rij, y) => [...rij].forEach((k, x) => { if (k !== '.') c.px(x, y, k); })));
function zaal(){
  return sprite(PW, PH, c => {
    c.rect(0, 0, PW, VLOER, 'f'); c.rect(0, 66, PW, VLOER - 66, 'F'); c.hline(0, 66, PW, 'L');
    c.rect(0, VLOER, PW, PH - VLOER, 'J');                                                   // vloerbedekking
    for (let y = VLOER + 2; y < PH; y += 3) for (let x = (y * 7) % 5; x < PW; x += 5) c.px(x, y, 'T');
    // de perswand: wit met clublogo's om en om, een band in de clubkleur eronder
    c.rect(38, 4, 178, 62, 'x'); c.rect(38, 64, 178, 3, 'r');
    for (let x = 38; x < 216; x++){ c.px(x, 4, 'X'); } for (let y = 4; y < 64; y++){ c.px(38, y, 'X'); c.px(215, y, 'X'); }
    for (let r = 0, ty = 7; ty < 58; ty += 14, r++) for (let tx = 41 + (r % 2) * 10; tx < 204; tx += 20)
      for (let y = 0; y < 13; y++) for (let x = 0; x < 16; x++){ const v = logo.d[y * 16 + x]; if (v) c.img.set(tx + x, ty + y, v); }
    // de deur links, open
    c.rect(4, 40, 26, VLOER - 40, 'i'); c.rect(7, 43, 20, VLOER - 43, 'D'); c.rect(25, 43, 4, VLOER - 43, 'I');
    // banieren in de clubkleur naast de wand
    for (const x of [31, 216]){ if (x + 4 > PW) continue; c.rect(x, 8, 5, 46, 'r'); c.rect(x, 8, 5, 3, 'w'); c.rect(x, 51, 5, 3, 'w'); c.rect(x + 1, 26, 3, 6, 'w'); }
  });
}
// De tafel (komt over de personen heen): blad, kleed met PERSCONFERENTIE, microfoons, naambordjes en water
function tafel(naam){
  return sprite(PW, PH, c => {
    c.rect(56, TAFEL, 112, 3, 'i'); c.hline(56, TAFEL, 112, 'L'); c.rect(56, TAFEL + 3, 112, 1, 'I');
    c.rect(58, TAFEL + 4, 108, VLOER - TAFEL - 4, 'r'); c.hline(58, TAFEL + 4, 108, 'w'); c.hline(58, VLOER - 1, 108, 'R');
    c.stamp(logo, 60, TAFEL + 4);
    tekst(c, 118, TAFEL + 6, 'PERSCONFERENTIE', 'w', {align:'c'});
    // de microfoons van de zenders voor jouw plek (op kinhoogte), een losse voor de persvoorlichter
    [[SX - 10, 1], [SX - 6, 2], [SX - 2, 3], [SX + 2, 4], [SX + 6, 5]].forEach(([x, k], i) => {
      const h = 7 + (i % 2) * 2; c.vline(x + 1, TAFEL - h, h, 'z'); c.rect(x, TAFEL - h - 5, 3, 3, 'Z'); c.px(x + 1, TAFEL - h - 5, 'L');
      c.rect(x - 1, TAFEL - h - 2, 5, 3, String(k)); });
    c.vline(BX - 12, TAFEL - 7, 7, 'z'); c.rect(BX - 13, TAFEL - 10, 3, 3, 'Z');
    // naambordjes (voor de voet van de microfoons)
    const bordje = (x, s) => { let t = zonderAccent(s).toUpperCase(); while (t.length > 1 && regelBreedte(t) > 36) t = t.slice(0, -1);
      c.rect(x - 20, TAFEL - 6, 40, 6, 'x'); c.hline(x - 20, TAFEL - 1, 40, 'r'); tekst(c, x, TAFEL - 6, t, 'k', {align:'c'}); };
    bordje(SX, naam); bordje(BX + 2, 'PERS');
    // water
    for (const x of [72, 164]){ c.rect(x, TAFEL - 7, 3, 7, 'b'); c.px(x, TAFEL - 7, 'x'); }
  });
}
// Een tv-camera op een statief (lamp = het rode lampje aan)
const tvCamera = (lamp) => sprite(26, 46, c => {
  c.line(13, 18, 3, 45, 'z'); c.line(13, 18, 23, 45, 'z'); c.line(13, 18, 13, 45, 'Z');
  c.rect(3, 6, 18, 12, 'z'); c.rect(3, 6, 18, 2, 'L'); c.rect(20, 9, 6, 7, 'Z'); c.rect(23, 10, 3, 5, 'k');
  c.rect(6, 2, 8, 4, 'Z'); if (lamp) c.rect(16, 3, 3, 3, '!'); else c.rect(16, 3, 3, 3, 'Z');
  tekst(c, 8, 11, 'TV', 'x');
});

// ---------- het publiek (op de rug gezien) ----------
// [soort, x, haar, kleding]; soort p = journalist, f = fotograaf
const RIJ = [['p', -4, 'n', 'u'], ['f', 14, 'h', 'c'], ['p', 32, 'l', 'V'], ['p', 50, 'j', 'e'], ['f', 70, 'n', 'E'], ['p', 88, 'h', 'o'],
  ['p', 106, 'N', 'c'], ['p', 124, 'l', 'P'], ['f', 142, 'j', 'D'], ['p', 160, 'n', 'e'], ['p', 178, 'h', 'D'], ['f', 196, 'n', 'C']];
export const JOURNALISTEN = RIJ.map((r, i) => r[0] === 'p' ? i : -1).filter(i => i >= 0);
const romp = () => sprite(20, 18, c => { c.ellipse(10, 15, 9, 5, 'v'); c.rect(1, 15, 19, 3, 'v'); c.circ(10, 6, 5, 'h'); c.px(8, 3, 'j'); c.px(9, 3, 'j'); });
const journalist = (hand) => sprite(22, 30, c => {
  c.stamp(romp(), 0, 12);
  if (hand){ c.line(16, 22, 18, 6, 'v', 3); c.line(16, 22, 18, 6, 'v', 3); c.circ(18, 4, 2, 's'); c.px(19, 5, 'S'); c.rect(17, 0, 1, 3, 's'); }  // de hand omhoog, met een pen
});
const fotograaf = () => sprite(22, 30, c => { c.stamp(romp(), 0, 12); c.rect(5, 4, 10, 6, 'z'); c.rect(9, 5, 3, 3, 'k'); c.rect(6, 5, 2, 1, 'X'); c.rect(4, 9, 3, 6, 's'); c.rect(14, 9, 3, 6, 's'); });
const FLITS = sprite(9, 9, c => { c.line(4, 0, 4, 8, 'w'); c.line(0, 4, 8, 4, 'w'); c.rect(3, 3, 3, 3, 'w'); c.px(4, 4, 'y'); c.px(2, 2, 'y'); c.px(6, 2, 'y'); c.px(2, 6, 'y'); c.px(6, 6, 'y'); });

// ---------- jij en de persvoorlichter ----------
const STAAN = {lL:[-4, 4], lR:[4, 4], aL:[-12, 15], aR:[12, 15]};
export const POSES = {
  staan:STAAN,
  zit:{...STAAN, aL:[-35, 70], aR:[35, 70]},                                   // de handen op tafel
  praat1:{...STAAN, aL:[-35, 70], aR:[95, 40]},                                // een gebaar bij je antwoord
  praat2:{...STAAN, aL:[-35, 70], aR:[120, 25]},
  zwaai:{...STAAN, aL:[-35, 70], aR:[150, 20]},                                // de persvoorlichter wijst een journalist aan
};
const LOOP = loopCyclus(40);

// info = {uit (jouw uiterlijk), uitPv (de persvoorlichter), tenue, trainer, naam}
export function maakPers(info){
  const t = info.tenue || {shirt:'#e0262b', accent:'#ffffff', patroon:'effen'};
  const club = {r:t.shirt, R:donker(t.shirt, .3), w:t.accent || '#ffffff', x:'#ffffff', X:'#d4d4de'};
  const pal = {...KL, ...club};
  const zaalCv = inkleuren(zaal(), pal), tafelCv = inkleuren(tafel(info.naam || ''), pal);
  const cams = [false, true].map(l => inkleuren(tvCamera(l), pal));
  // jij: in het trainingspak van de club (als trainer: in pak); de persvoorlichter in pak met een das in de clubkleur
  const ik = lookVan(info.uit || {}, info.trainer ? null : {...t, broek:'#262b36', sok:'#262b36'}, {kleding:info.trainer ? 'pak' : 'training', nr:2});
  const pv = lookVan(info.uitPv || {}, null, {kleding:'pak', nr:3, das:t.shirt});
  const cache = new Map();
  const figuur = (look, P, flip) => {
    const sl = look.sleutel + '|' + JSON.stringify(P) + (flip ? 'f' : ''); let cv = cache.get(sl);
    if (!cv){ const img = new Img(80, 90); speler(new Doek(img), {...P, x:40}, {kapsel:look.kapsel, vrouw:look.vrouw, kleding:look.kleding, baard:look.baard, snor:look.snor});
      let o = img.outline(107); if (flip) o = o.flipX(); cv = inkleuren(o, {...look.kleuren, w:look.kleding === 'pak' ? '#ffffff' : look.kleuren.w}); cache.set(sl, cv); }
    return cv;
  };
  const pub = RIJ.map(([soort, x, haar, kl]) => {
    const p = {...KL, h:KL[haar], j:KL[haar === 'h' ? 'j' : haar], v:KL[kl]};
    return {x, foto:soort === 'f', cv:inkleuren(soort === 'f' ? fotograaf() : journalist(false), p), hand:soort === 'f' ? null : inkleuren(journalist(true), p)};
  });
  const flitsCv = inkleuren(FLITS, KL);
  const buf = document.createElement('canvas'); buf.width = PW; buf.height = PH;
  const g = buf.getContext('2d'); g.imageSmoothingEnabled = false;

  // st = {ikX, ikLoop (beeld van de loop, of null), ikZit (0..1), ikPose, pvPose, handen:Set van plekken in RIJ, flits:[plekken], lamp}
  function teken(st){
    g.drawImage(zaalCv, 0, 0);
    g.drawImage(cams[st.lamp ? 1 : 0], -2, VLOER - 44);
    // de persvoorlichter (gespiegeld: kijkt naar links) en jij
    g.drawImage(figuur(pv, POSES[st.pvPose || 'zit'], true), BX - 40 - 1, DY - 1 + ZIT);
    const zak = Math.round((st.ikZit || 0) * ZIT);
    const ikP = st.ikLoop != null ? LOOP[st.ikLoop % 8] : POSES[st.ikPose || 'staan'];
    g.drawImage(figuur(ik, ikP, false), Math.round(st.ikX ?? SX) - 40 - 1, DY - 1 + zak);
    g.drawImage(tafelCv, 0, 0);
    g.drawImage(cams[st.lamp ? 1 : 0], PW - 24, VLOER - 40);
    // het publiek; wie een vraag wil stellen steekt zijn hand op, fotografen flitsen
    pub.forEach((p, i) => {
      const hand = p.hand && st.handen && st.handen.has(i), y = PH - 34 + (p.foto ? 0 : 4);
      g.drawImage(hand ? p.hand : p.cv, p.x, y);
      if (st.flits && st.flits.includes(i)) g.drawImage(flitsCv, p.x + 6, y - 2);
    });
    return buf;
  }
  // De plek van een journalist (voor de camera): het midden van zijn hoofd
  const plekVan = i => [RIJ[i][1] + 10, PH - 16];
  return {teken, plekVan, fotografen:RIJ.map((r, i) => r[0] === 'f' ? i : -1).filter(i => i >= 0)};
}
