/* ===================== Krantenfoto's in pixels ===================== */
// Jouw speler op de foto in de krant (render/krantfoto.js), in de stijl van art/chibi_anims.px.js: voor een persmuur met
// clublogo's en de sponsor, of in het stadion bij een ererondje, met de prijs in de handen. Een pixelbeeld van 120×80,
// 6× vergroot (720×480, net als de oude 3D-foto). Geen three.js.
import { STANDAARD } from '../../data/tenues.js';
import { BAL, Doek, Img, inkleuren, opGrond, speler, sprite } from './rig.js';
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
const TROFEE = sprite(9, 13, c => {    // Man/Speelster van de Wedstrijd: een kleine trofee op een zwarte voet
  c.rect(1, 0, 7, 1, '^'); c.rect(1, 1, 7, 4, '<'); c.rect(6, 1, 1, 4, '>'); c.rect(2, 5, 5, 1, '<'); c.rect(3, 6, 3, 1, '>');
  c.rect(4, 7, 1, 3, '>'); c.rect(1, 10, 7, 3, '~');
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
  motm:{...BASIS, aL:[30, 95], aR:[35, 95]},                        // de trofee voor de borst
  topscorer:{...BASIS, aL:[30, 95], aR:[35, 95]},
  svs:{...BASIS, aL:[-125, -25], aR:[125, 25], arm:1.3},             // de bokaal boven het hoofd
  ererondje:{...BASIS, aL:[-15, 20], aR:[120, 30], arm:1.25},        // zwaaien naar het publiek
};
function spelerBeeld(soort, v){
  const P = POSE[soort] || POSE.portret, img = new Img(96, 90), c = new Doek(img);
  const hand = speler(c, P, v), oy = R(opGrond(P) - 39);
  if (soort === 'hattrick') c.stamp(BAL, hand[0] - 5, hand[1] - 12);
  else if (soort === 'motm') c.stamp(TROFEE, X0 - 3, oy + 24);       // midden voor de borst, de handen eromheen
  else if (soort === 'topscorer') c.stamp(SCHOEN, X0 - 4, oy + 27);
  else if (soort === 'svs') c.stamp(BOKAAL, X0 - 7, oy - 12);
  return img.outline(107); // ('k')
}

// ---------- de achtergronden ----------
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
  const look = lookVan(uit, tenue, {band:!!ctx.band});
  const v = {kapsel:look.kapsel, vrouw:look.vrouw, kleding:'tenue', patroon:look.patroon, band:look.band, baard:look.baard};
  const sp = inkleuren(spelerBeeld(soort, v), {...look.kleuren, ...GOUD});
  // de achtergrond met de clubkleuren
  const naam = zonderAccent(ctx.sponsor && ctx.sponsor.naam ? ctx.sponsor.naam : ctx.club || 'PERS').slice(0, 16);
  const clubKl = {1:tenue.shirt, 2:donker(tenue.shirt, .3), 3:tenue.accent || '#ffffff', 4:'#38bdf8', 5:'#e8ecf5'};
  const ererondje = soort === 'ererondje';
  const achter = inkleuren(ererondje ? stadion(zonderAccent(ctx.club || 'KAMPIOEN').slice(0, 16), FW, FH) : persmuur(naam, FW, FH),
    ererondje ? {K:'#0f1424', b:'#3c4a6e', M:'#ffe9a8', w:'#ffffff', C:'#22222a', c:'#34343e', g:'#2f7d3f', G:'#378c48', h:'#b5541c', s:'#f7c9a8', R:'#a3161b',
      v:'#2b3f9e', i:'#a8744f', n:'#2a1f1c', y:'#ffd21a', d:'#7a4a2a', ...clubKl}
      : {...clubKl, M:muur, F:donker(muur, .45), f:donker(muur, .2), 4:accent});
  // samenstellen: het beeld van 120×80, de speler met zijn voeten net op de vloer
  const klein = document.createElement('canvas'); klein.width = FW; klein.height = FH;
  const g = klein.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(achter, 0, 0);
  g.drawImage(sp, FW / 2 - (X0 + 1), FH - 80 + (ererondje ? 4 : 0)); // (de voeten net boven de onderrand)
  if (alleenCanvas) return klein;
  // 6× vergroot, met een lichte vignet (zoals een krantenfoto; de pixels blijven scherp)
  const cv = document.createElement('canvas'); cv.width = FW * Z; cv.height = FH * Z;
  const G = cv.getContext('2d'); G.imageSmoothingEnabled = false; G.drawImage(klein, 0, 0, cv.width, cv.height);
  const vg = G.createRadialGradient(cv.width / 2, cv.height * .45, cv.height * .35, cv.width / 2, cv.height / 2, cv.width * .7);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.3)'); G.fillStyle = vg; G.fillRect(0, 0, cv.width, cv.height);
  return cv.toDataURL('image/png');
}
