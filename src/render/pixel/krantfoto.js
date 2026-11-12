/* ===================== Krantenfoto's in pixels ===================== */
// Jouw speler op de foto in de krant (render/krantfoto.js), in de stijl van art/chibi_anims.px.js: voor een persmuur met
// clublogo's en de sponsor, of in het stadion bij een ererondje, met de prijs in de handen. Een pixelbeeld van 120×80,
// 6× vergroot (720×480, net als de oude 3D-foto). Geen three.js.
import { STANDAARD } from '../../data/tenues.js';
import { BAL, Doek, Img, inkleuren, opGrond, speler, sprite, vuist } from './rig.js';
import { donker, lookVan } from './atlas.js';
import { fans } from './opkomst.js';
import { tekst, zonderAccent } from './font.js';
import { uiterlijkVoor } from './uiterlijk.js';

const Z = 6, X0 = 48; // de vergroting, waar de heup van de speler staat (het beeld: standaard 120×80, zie maakPixelFoto)
const R = Math.round;

// ---------- de prijzen (goud: < licht, > donker, ^ glans; ~ zwarte voet) ----------
const BOKAAL = sprite(15, 14, c => {   // Speler van het Seizoen: een bokaal met oren
  c.rect(2, 0, 11, 1, '^'); c.rect(2, 1, 11, 5, '<'); c.rect(3, 6, 9, 1, '<'); c.rect(4, 7, 7, 1, '<'); c.rect(10, 1, 2, 5, '>'); c.rect(9, 6, 2, 1, '>');
  c.rect(0, 1, 2, 1, '<'); c.rect(0, 1, 1, 4, '<'); c.rect(0, 4, 2, 1, '<');
  c.rect(13, 1, 2, 1, '>'); c.rect(14, 1, 1, 4, '>'); c.rect(13, 4, 2, 1, '>');
  c.rect(6, 8, 3, 3, '>'); c.vline(7, 8, 3, '<');
  c.rect(4, 11, 7, 1, '<'); c.rect(3, 12, 9, 2, '~');
});
const TROFEE = sprite(13, 17, c => {   // Man/Speelster van de Wedstrijd: een gouden beker met oren op een zwarte voet met een plaatje
  c.rect(1, 0, 11, 1, '^'); c.rect(1, 1, 11, 3, '<'); c.rect(2, 4, 9, 1, '<'); c.rect(3, 5, 7, 1, '<'); c.rect(4, 6, 5, 1, '<');
  c.rect(9, 1, 2, 4, '>'); c.px(8, 5, '>'); c.px(7, 6, '>'); c.rect(3, 1, 1, 3, '^');                 // schaduw rechts, glans links
  c.vline(0, 1, 3, '<'); c.px(0, 4, '>'); c.vline(12, 1, 3, '>'); c.px(12, 4, '>');                  // de oren
  c.rect(5, 7, 3, 3, '>'); c.vline(6, 7, 3, '<');                                                     // de steel (daar zitten de handen)
  c.rect(3, 10, 7, 2, '<'); c.hline(3, 11, 7, '>');
  c.rect(2, 12, 9, 5, '~'); c.rect(4, 14, 5, 1, '<');                                                 // de voet met een gouden plaatje
});
const SCHOEN = sprite(12, 7, c => {    // De Gouden Schoen (topscorer)
  c.rect(1, 0, 4, 2, '<'); c.rect(0, 2, 9, 2, '<'); c.rect(0, 4, 11, 1, '<'); c.rect(9, 3, 2, 1, '<'); c.rect(0, 5, 12, 1, '>'); c.rect(1, 6, 10, 1, '~');
  c.px(2, 1, '^'); c.px(4, 3, '^'); c.px(7, 3, '^'); c.rect(2, 2, 1, 1, '>');
});
const GOUD = {'<':'#f3c44f', '>':'#b58a25', '^':'#fff2b0', '~':'#15161c'};

// ---------- de houding per soort foto (van voren) ----------
const BASIS = {x:X0, lL:[-5, 10], lR:[10, 15]};
const POSE = {
  portret:{...BASIS, aL:[30, 100], aR:[40, 100]},                   // armen voor de borst
  hattrick:{...BASIS, aL:[-20, 30], aR:[130, 20], arm:1.3},          // de bal hoog in de hand
  motm:{...BASIS, aL:[-25, 40], aR:[118, 12], arm:1.35},           // de trofee omhoog in de hand, naast het hoofd
  topscorer:{...BASIS, aL:[-25, 40], aR:[118, 12], arm:1.35},
  svs:{...BASIS, aL:[-125, -25], aR:[125, 25], arm:1.3},             // de bokaal boven het hoofd
  ererondje:{...BASIS, aL:[-15, 20], aR:[120, 30], arm:1.25},        // zwaaien naar het publiek
  huis:{...BASIS, aL:[-20, 30], aR:[118, 12], arm:1.35},             // de sleutels omhoog
  bruiloft:{...BASIS, aL:[-12, 18], aR:[28, 55]},                     // arm in arm
};
function spelerBeeld(soort, v){
  const P = POSE[soort] || POSE.portret, img = new Img(96, 90), c = new Doek(img);
  const hand = speler(c, P, v), oy = R(opGrond(P) - 39);
  if (soort === 'hattrick') c.stamp(BAL, hand[0] - 5, hand[1] - 12);
  else if (soort === 'motm'){ c.stamp(TROFEE, hand[0] - 6, hand[1] - 12); vuist(c, hand[0], hand[1] - 3, 's'); } // (de vuist om de steel: dan houdt hij hem echt vast)
  else if (soort === 'topscorer'){ c.stamp(SCHOEN, hand[0] - 6, hand[1] - 9); vuist(c, hand[0] - 1, hand[1] - 2, 's'); } // (de schoen omhoog, de vuist om de hak)
  else if (soort === 'svs') c.stamp(BOKAAL, X0 - 7, oy - 12);
  else if (soort === 'huis'){ c.stamp(SLEUTELS, hand[0] - 3, hand[1] - 10); vuist(c, hand[0], hand[1] - 1, 's'); }
  else if (soort === 'bruiloft' && !v.vrouw){ c.rect(X0 + 3, oy + 28, 3, 3, 'G'); c.px(X0 + 4, oy + 29, 'g'); } // (een bloem op je revers)
  return img.outline(107); // ('k')
}

const SLEUTELS = sprite(7, 11, c => { c.circ(3, 2, 2, '<'); c.px(3, 2, '~'); c.rect(3, 5, 1, 6, '>'); c.rect(4, 8, 2, 1, '>'); c.rect(4, 10, 2, 1, '>'); c.px(2, 1, '^'); });

// ---------- de achtergronden ----------
// Je nieuwe huis (type: villa, huis of penthouse) met een "VERKOCHT"-bord, blauwe lucht en een gazon
function huisAchter(FW, FH, type){
  return sprite(FW, FH, c => {
    c.rect(0, 0, FW, FH, 'L'); c.rect(0, 0, FW, 10, 'l');
    for (const [x, y, w] of [[18, 7, 9], [FW - 30, 5, 11]]){ c.ellipse(x, y, w, 3, 'W'); c.ellipse(x + 5, y - 2, 5, 2, 'W'); }
    const gras = FH - 16; c.rect(0, gras, FW, 16, 'g'); for (let x = 0; x < FW; x += 12) c.rect(x, gras, 6, 16, 'G');
    const hw = type === 'penthouse' ? 46 : type === 'villa' ? Math.min(FW - 50, 90) : 60, hx = Math.round(FW * .5 - hw / 2 + 18), wand = type === 'villa' ? 'V' : 'B';
    if (type === 'penthouse'){                                                                   // een hoge toren met glas
      c.rect(hx, 6, hw, gras - 6, 'V'); for (let y = 10; y < gras - 6; y += 8) for (let x = hx + 4; x < hx + hw - 6; x += 10) c.rect(x, y, 6, 5, 'w');
      c.rect(hx - 2, 4, hw + 4, 3, 'k');
    } else {
      const top = type === 'villa' ? 22 : 18, dak = type === 'villa' ? 14 : 18;
      c.poly([hx - 4, top, hx + hw / 2, top - dak, hx + hw + 4, top], 'D'); c.hline(hx - 4, top, hw + 8, 'k');
      c.rect(hx, top, hw, gras - top, wand);
      if (wand === 'B') for (let y = top + 2; y < gras; y += 3) for (let x = hx + ((y >> 1) % 2) * 3; x < hx + hw; x += 6) c.px(x, y, 'b');   // bakstenen
      for (const x of [hx + 6, hx + hw - 18]) { c.rect(x, top + 6, 12, 9, 'k'); c.rect(x + 1, top + 7, 10, 7, 'w'); c.vline(x + 6, top + 7, 7, 'k'); }
      c.rect(hx + hw / 2 - 5, gras - 16, 10, 16, 'd'); c.px(hx + hw / 2 + 3, gras - 8, '<');      // de voordeur
      if (type === 'villa'){ c.rect(hx + hw / 2 - 12, top + 5, 24, 4, 'w'); c.hline(hx + hw / 2 - 12, top + 9, 24, 'k'); }
    }
    // het bord VERKOCHT, links op het gras
    c.rect(10, gras - 18, 2, 18, 'd'); c.rect(3, gras - 22, 34, 9, 'w'); c.hline(3, gras - 22, 34, 'k'); c.hline(3, gras - 14, 34, 'k');
    tekst(c, 20, gras - 20, 'VERKOCHT', 'r', {align:'c'});
  });
}
// De bruiloft: een zachte muur, een boog van bloemen en een witte loper
function bruiloftAchter(FW, FH){
  return sprite(FW, FH, c => {
    c.rect(0, 0, FW, FH, 'P'); for (let x = 4; x < FW; x += 10) c.vline(x, 0, FH, 'p');
    const loper = FH - 14; c.rect(0, loper, FW, 14, 'g'); c.poly([FW / 2 - 18, loper, FW / 2 + 18, loper, FW / 2 + 30, FH, FW / 2 - 30, FH], 'w');
    // de bloemenboog
    const cx = FW / 2, rx = Math.min(46, FW * .3), ry = loper - 5; // (breder en hoger dan jullie twee: de boog staat om jullie heen)
    for (let a = 0; a <= 180; a += 6){ const t = a * Math.PI / 180, x = Math.round(cx + Math.cos(t) * rx), y = Math.round(loper - Math.sin(t) * ry);
      c.circ(x, y, 3, 'G'); c.px(x, y, ['r', 'w', 'y'][(a / 6) % 3]); c.px(x + 1, y - 1, ['w', 'y', 'r'][(a / 6) % 3]); }
    for (const x of [cx - rx, cx + rx]) c.rect(Math.round(x) - 1, loper - 4, 3, 4, 'G');
    for (let i = 0; i < 26; i++){ const x = (i * 37) % FW, y = (i * 23) % (loper - 6); c.px(x, y, i % 2 ? 'w' : 'y'); }     // confetti
  });
}
// de clubschildjes (sleutels 1-3: de clubkleuren)
const SCHILD = ['RRRRRRRRR', 'RrwrwrwrR', 'RrwrwrwrR', 'RrwrwrwrR', '.RrwrwrR.', '..RrwrR..', '...RrR...', '....R....'];
const schild = sprite(9, 8, c => SCHILD.forEach((rij, y) => [...rij].forEach((k, x) => { if (k !== '.') c.px(x, y, {R:'2', r:'1', w:'3'}[k]); })));
function persmuur(naam, FW, FH){
  return sprite(FW, FH, c => {
    c.rect(0, 0, FW, FH, 'M');
    for (let r = 0, y = 3; y < 66; r++, y += 13){
      if (r % 2 === 0) for (let x = (r % 4 ? 10 : -2); x < FW; x += 26) c.stamp(schild, x, y);
      else { const w = naam.length * 4 + 10; for (let x = (r % 4 === 1 ? -6 : 8); x < FW; x += w) tekst(c, x, y + 2, naam, '4'); }
    }
    c.rect(0, FH - 14, FW, 14, 'F'); c.hline(0, FH - 14, FW, 'f');
  });
}
function stadion(naam, FW, FH){
  return sprite(FW, FH, c => {
    c.rect(0, 0, FW, 12, 'K');
    for (const x of [14, 100]){ c.rect(x, 0, 2, 10, 'b'); c.rect(x - 5, 1, 12, 4, 'M'); c.hline(x - 5, 1, 12, 'w'); }   // lichtmasten
    c.rect(0, 10, FW, 38, 'C'); for (let y = 16; y < 48; y += 8) c.hline(0, y, FW, 'c');
    fans(c, 0, 0, 10, FW, 38, 3); fans(c, 1, 0, 10, FW, 38, 9);                                                  // de tribune vol fans
    c.rect(0, 48, FW, 8, '1'); c.hline(0, 48, FW, '2'); c.hline(0, 55, FW, '2');                                 // spandoek in clubkleuren
    { const w = naam.length * 4 + 14; for (let x = 4; x < FW; x += w) tekst(c, x, 50, naam, '3'); }
    let y = 56, h = 4, i = 0; while (y < FH){ c.rect(0, y, FW, h, i % 2 ? 'G' : 'g'); y += h; h += 2; i++; }      // gras met banen
  });
}

// ctx (krantfoto.js fotoCtx): {sleutel, uiterlijk, club, muur, accent, tenue, band, sponsor}. Geeft een PNG-dataURL van 720×480
// opties: {w, h} (het pixelbeeld, standaard 120×80) en canvas (dan het kleine canvas zelf, niet vergroot: voor de pixelkrant)
export function maakPixelFoto(soort, ctx = {}, {w:FW = 120, h:FH = 80, canvas:alleenCanvas = false} = {}){
  const tenue = ctx.tenue || STANDAARD, muur = ctx.muur || '#0f1a33', accent = ctx.accent || '#c6f432';
  const uit = uiterlijkVoor('jij|' + (ctx.sleutel || 'nieuw'), ctx.uiterlijk || undefined);
  const F = ctx.foto || {}, prive = soort === 'huis' || soort === 'bruiloft';
  const JURK = {shirt:'#fbfbff', accent:'#e8e2f2', patroon:'effen', broek:'#fbfbff', sok:'#fbfbff'};
  const kleed = (u, vrouw) => soort === 'huis' ? ['casual', tenue, {}] : soort === 'bruiloft' ? (vrouw ? ['tenue', JURK, {}] : ['pak', null, {pak:'#1b1d24', pak2:'#0f1016', das:'#c9a227'}]) : ['tenue', tenue, {band:!!ctx.band}];
  const [kl, tn, opt] = kleed(uit, uit.vrouw);
  const look = lookVan(uit, tn, {...opt, kleding:kl});
  const v = {kapsel:look.kapsel, vrouw:look.vrouw, kleding:kl, patroon:look.patroon, band:prive ? false : look.band, baard:look.baard};
  const sp = inkleuren(spelerBeeld(soort, v), {...look.kleuren, ...GOUD, G:'#2f9e4f', g:'#ffffff'});
  // op de bruiloft: je partner naast je (gespiegeld, arm in arm)
  let partner = null;
  if (soort === 'bruiloft'){
    const pv = !!F.partnerVrouw, pu = uiterlijkVoor('partner|' + (F.partner || 'x'), {vrouw:pv}), [pk, pt, po] = kleed(pu, pv), pl = lookVan(pu, pt, {...po, kleding:pk});
    partner = inkleuren(spelerBeeld('bruiloft', {kapsel:pl.kapsel, vrouw:pl.vrouw, kleding:pk, patroon:'effen', baard:pl.baard}).flipX(), {...pl.kleuren, ...GOUD, G:'#2f9e4f', g:'#ffffff'});
  }
  // de achtergrond met de clubkleuren
  const naam = zonderAccent(ctx.sponsor && ctx.sponsor.naam ? ctx.sponsor.naam : ctx.club || 'PERS').slice(0, 16);
  const clubKl = {1:tenue.shirt, 2:donker(tenue.shirt, .3), 3:tenue.accent || '#ffffff', 4:'#38bdf8', 5:'#e8ecf5'};
  const ererondje = soort === 'ererondje';
  const achter = soort === 'huis' ? inkleuren(huisAchter(FW, FH, F.type || 'huis'), {L:'#8fd3ff', l:'#b8e4ff', W:'#ffffff', g:'#3f9a4a', G:'#4caf55', B:'#b5603f', b:'#8e4630', V:'#efe9df', D:'#7a2e2a', k:'#2a2430', w:'#bfe6ff', d:'#6b4226', r:'#d62828', '<':'#f3c44f'})
    : soort === 'bruiloft' ? inkleuren(bruiloftAchter(FW, FH), {P:'#f6dfe6', p:'#f1d2db', g:'#cfc4b6', w:'#ffffff', G:'#3f8a4a', r:'#e05a7a', y:'#ffd34d'})
    : inkleuren(ererondje ? stadion(zonderAccent(ctx.club || 'KAMPIOEN').slice(0, 16), FW, FH) : persmuur(naam, FW, FH),
    ererondje ? {K:'#0f1424', b:'#3c4a6e', M:'#ffe9a8', w:'#ffffff', C:'#22222a', c:'#34343e', g:'#2f7d3f', G:'#378c48', h:'#b5541c', s:'#f7c9a8', R:'#a3161b',
      v:'#2b3f9e', i:'#a8744f', n:'#2a1f1c', y:'#ffd21a', d:'#7a4a2a', ...clubKl}
      : {...clubKl, M:muur, F:donker(muur, .45), f:donker(muur, .2), 4:accent});
  // samenstellen: het beeld van 120×80, de speler met zijn voeten net op de vloer
  const klein = document.createElement('canvas'); klein.width = FW; klein.height = FH;
  const g = klein.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(achter, 0, 0);
  if (partner){ g.drawImage(sp, FW / 2 - 11 - (X0 + 1), FH - 80); g.drawImage(partner, FW / 2 + 11 - (96 - X0 - 1), FH - 80); }
  else g.drawImage(sp, (soort === 'huis' ? FW * .3 : FW / 2) - (X0 + 1), FH - 80 + (ererondje ? 4 : 0)); // (de voeten net boven de onderrand; voor het huis iets naar links)
  if (alleenCanvas) return klein;
  // 6× vergroot, met een lichte vignet (zoals een krantenfoto; de pixels blijven scherp)
  const cv = document.createElement('canvas'); cv.width = FW * Z; cv.height = FH * Z;
  const G = cv.getContext('2d'); G.imageSmoothingEnabled = false; G.drawImage(klein, 0, 0, cv.width, cv.height);
  const vg = G.createRadialGradient(cv.width / 2, cv.height * .45, cv.height * .35, cv.width / 2, cv.height / 2, cv.width * .7);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.3)'); G.fillStyle = vg; G.fillRect(0, 0, cv.width, cv.height);
  return cv.toDataURL('image/png');
}
