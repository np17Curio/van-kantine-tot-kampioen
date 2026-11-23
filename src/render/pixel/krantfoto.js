/* ===================== Krantenfoto's in pixels ===================== */
// Jouw speler op de foto in de krant (render/krantfoto.js), in de stijl van art/chibi_anims.px.js: voor een persmuur met
// clublogo's en de sponsor, of in het stadion bij een ererondje, met de prijs in de handen. Een pixelbeeld van 120×80,
// 6× vergroot (720×480, net als de oude 3D-foto). Geen three.js.
import { outfitVoor } from '../../game/prive/kleding.js';
import { STANDAARD } from '../../data/tenues.js';
import { BAL, Doek, GROND, HEUP, ROMP_EXTRA, Img, inkleuren, opGrond, speler, sprite, vuist } from './rig.js';
import { donker, lookVan } from './atlas.js';
import { fans } from './opkomst.js';
import { regelBreedte, tekst, zonderAccent } from './font.js';
import { uiterlijkVoor } from './uiterlijk.js';
import { pixelLogo, zetLogo } from './clublogo.js';

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
const GBAL = sprite(13, 13, c => {    // De Gouden Bal: een gouden voetbal met donkere vlakken, glans linksboven
  c.circ(6, 6, 6, '<');
  c.rect(5, 5, 3, 3, '>'); c.px(6, 4, '>'); c.px(4, 6, '>'); c.px(8, 6, '>');                         // de vijfhoek in het midden
  c.rect(0, 5, 1, 3, '>'); c.rect(12, 5, 1, 3, '>'); c.rect(5, 0, 3, 1, '>'); c.rect(4, 12, 5, 1, '>'); // halve vlakken aan de rand
  c.line(6, 1, 6, 3, '>'); c.line(2, 5, 3, 6, '>'); c.line(10, 5, 9, 6, '>'); c.line(4, 9, 3, 11, '>'); c.line(8, 9, 9, 11, '>'); // naden
  c.px(10, 9, '>'); c.px(9, 10, '>'); c.px(11, 8, '>');                                                 // schaduw rechtsonder
  c.px(3, 3, '^'); c.px(4, 2, '^'); c.px(2, 4, '^'); c.px(3, 2, '^');                                   // glans
});
const BRUID = {G:'#2f9e4f', g:'#ffffff', '(':'#ddd6ea', ')':'#ffd34d', '*':'#e05a7a', '{':'#b9c0cc', '}':'#3a3f4a'}; // (wit en plooien van de jurk, bloemen)
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
  goudenbal:{...BASIS, aL:[-25, 40], aR:[118, 12], arm:1.35},        // de Gouden Bal omhoog in de hand, naast het hoofd
  bruiloft:{...BASIS, aL:[-12, 18], aR:[28, 55]},                     // arm in arm
  strand:{...BASIS, aL:[-15, 20], aR:[120, 30], arm:1.25},          // zwaaien naar de camera
  stad:{...BASIS, aL:[-12, 18], aR:[150, 70], arm:1.2},
  straat:{...BASIS, aL:[-15, 20], aR:[120, 30], arm:1.25},
  auto:{...BASIS, aL:[-15, 20], aR:[120, 30], arm:1.25},            // zwaaiend naast je auto          // overdag op straat: zwaaien             // een hand omhoog tegen het flitslicht
  blessure:{...BASIS, aL:[-22, 8], aR:[22, 8]},                     // op krukken
  juich:{...BASIS, aL:[-125, -25], aR:[125, 25], arm:1.3},          // allebei de armen omhoog na een goal
  aanvoerder:{...BASIS, aL:[-18, 12], aR:[28, 12]},                  // de arm met de band iets van het lijf, zodat je hem goed ziet
};
function spelerBeeld(soort, v){
  const P = POSE[soort] || POSE.portret, img = new Img(96, 90), c = new Doek(img);
  const hand = speler(c, P, v), oy = R(opGrond(P) - HEUP);
  if (soort === 'hattrick') c.stamp(BAL, hand[0] - 5, hand[1] - 12);
  else if (soort === 'motm'){ c.stamp(TROFEE, hand[0] - 6, hand[1] - 12); vuist(c, hand[0], hand[1] - 3, 's'); } // (de vuist om de steel: dan houdt hij hem echt vast)
  else if (soort === 'topscorer'){ c.stamp(SCHOEN, hand[0] - 6, hand[1] - 9); vuist(c, hand[0] - 1, hand[1] - 2, 's'); } // (de schoen omhoog, de vuist om de hak)
  else if (soort === 'svs') c.stamp(BOKAAL, X0 - 7, oy - 12);
  else if (soort === 'goudenbal'){ c.stamp(GBAL, hand[0] - 6, hand[1] - 14); vuist(c, hand[0], hand[1] - 2, 's'); } // (de vuist onder de bal: hij houdt hem echt vast)
  else if (soort === 'huis'){ c.stamp(SLEUTELS, hand[0] - 3, hand[1] - 10); vuist(c, hand[0], hand[1] - 1, 's'); }
  else if (soort === 'aanvoerder'){ // een grote, duidelijke aanvoerdersband om je bovenarm: geel, zwart omrand, met een C
    const ox = R(P.x - 21), bx = ox + 29, by = oy + 28;
    c.rect(bx - 1, by - 1, 9, 8, 'k'); c.rect(bx, by, 7, 6, '%'); c.hline(bx, by, 7, 'l');
    c.rect(bx + 2, by + 1, 3, 1, 'k'); c.rect(bx + 2, by + 2, 1, 2, 'k'); c.rect(bx + 2, by + 4, 3, 1, 'k');
  }
  else if (soort === 'bruiloft' && !v.vrouw){ c.rect(X0 + 3, oy + 28, 3, 3, 'G'); c.px(X0 + 4, oy + 29, 'g'); } // (een bloem op je revers)
  if (soort === 'blessure'){ // twee krukken onder je armen tot op de grond, en een verband om je knie
    const ox = R(P.x - 21), voet = GROND - 1;
    for (const [x0, x1] of [[ox + 9, ox + 5], [ox + 33, ox + 37]]){ c.line(x0, oy + 29, x1, voet, '{', 2); c.rect(Math.min(x0, x1) - 1, oy + 28, 5, 2, '}'); c.rect(R((x0 + x1) / 2) - 1, oy + 40 + ROMP_EXTRA, 3, 2, '}'); }
    c.rect(ox + 24, oy + HEUP + 7, 5, 4, 'g'); c.hline(ox + 24, oy + HEUP + 8, 5, '('); // (het verband om de knie)
  }
  if (v.langHaar){ const ox = R(P.x - 21); for (const x of [ox + 5, ox + 32]){ c.rect(x, oy + 24, 5, 7, 'h'); c.vline(x + 2, oy + 24, 7, 'H'); c.rect(x + 1, oy + 31, 3, 1, 'h'); } } // (je vrouw: lang haar dat over de schouders valt)
  if (v.jurk){ // een witte trouwjurk: een wijde rok tot op de grond (over de benen heen), plooien, een bloem in het haar en een boeketje
    const ox = R(P.x - 21), top = oy + 33 + ROMP_EXTRA, voet = GROND - 1;
    c.poly([ox + 12, top, ox + 30, top, ox + 37, voet, ox + 5, voet], 'g');
    c.line(ox + 21, top + 2, ox + 21, voet - 1, '('); c.line(ox + 17, top + 2, ox + 11, voet - 1, '('); c.line(ox + 25, top + 2, ox + 31, voet - 1, '(');
    c.hline(ox + 12, top, 18, '('); c.hline(ox + 6, voet - 1, 31, '(');
    c.rect(ox + 12, oy + 26, 18, 7 + ROMP_EXTRA, 'g'); c.poly([ox + 17, oy + 26, ox + 25, oy + 26, ox + 21, oy + 29], 's'); c.hline(ox + 12, oy + 32 + ROMP_EXTRA, 18, '(');   // het lijfje met een V-hals
    c.rect(ox + 27, oy + 3, 4, 4, 'g'); c.px(ox + 28, oy + 4, ')'); c.px(ox + 29, oy + 5, ')');                                                        // bloem in het haar
    c.circ(hand[0], hand[1] - 1, 3, 'G'); c.px(hand[0] - 1, hand[1] - 2, '*'); c.px(hand[0] + 1, hand[1] - 1, ')'); c.px(hand[0], hand[1] - 3, '*'); c.px(hand[0] - 1, hand[1], 'g'); // het boeket
  }
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
// de plekken van de logo's op de persmuur (rij r, vanaf y; om de rij een rij met de naam van de sponsor)
const muurLogos = FW => { const l = []; for (let r = 0, y = 3; y < 66; r += 2, y += 26) for (let x = (r % 4 ? 10 : -2); x < FW; x += 26) l.push([x, y]); return l; };
function persmuur(naam, FW, FH, echtLogo){
  return sprite(FW, FH, c => {
    c.rect(0, 0, FW, FH, 'M');
    if (!echtLogo) for (const [x, y] of muurLogos(FW)) c.stamp(schild, x, y); // (met het echte logo: dat komt er hieronder als plaatje overheen)
    for (let r = 1, y = 16; y < 66; r += 2, y += 26){ const w = naam.length * 4 + 10; for (let x = (r % 4 === 1 ? -6 : 8); x < FW; x += w) tekst(c, x, y + 2, naam, '4'); }
    c.rect(0, FH - 14, FW, 14, 'F'); c.hline(0, FH - 14, FW, 'f');
  });
}
// Het gala van de Gouden Bal: een donker podium met spotlichten, sterretjes, gouden letters en een gouden podiumrand
function galaAchter(FW, FH){
  return sprite(FW, FH, c => {
    c.rect(0, 0, FW, FH, 'M');
    for (const x of [FW * .2, FW * .5, FW * .8]) c.poly([x - 4, 0, x + 4, 0, x + 20, FH - 14, x - 20, FH - 14], 'l');   // spotlichten van boven
    for (let r = 0, y = 6; y < FH - 24; r++, y += 22){ const w = regelBreedte('GOUDEN BAL') + 18; for (let x = r % 2 ? -20 : 4; x < FW; x += w) tekst(c, x, y, 'GOUDEN BAL', 'y'); }
    for (let i = 0; i < 30; i++){ const x = (i * 41 + 7) % FW, y = (i * 29 + 3) % (FH - 18); c.px(x, y, i % 3 ? 'w' : 'Y'); }           // sterretjes
    c.rect(0, FH - 14, FW, 14, 'F'); c.hline(0, FH - 14, FW, 'f'); c.hline(0, FH - 12, FW, 'y');                       // het podium
  });
}
// Het strand: blauwe lucht, de zon, de zee met golfjes, zand en een parasol (paparazzofoto)
function strandAchter(FW, FH){
  return sprite(FW, FH, c => {
    c.rect(0, 0, FW, FH, 'L'); c.rect(0, 0, FW, 8, 'l');
    c.circ(FW - 18, 12, 7, 'y'); c.circ(FW - 18, 12, 5, 'Y');
    for (const [x, y, w] of [[20, 8, 10], [FW * .55, 5, 8]]){ c.ellipse(R(x), y, w, 2, 'w'); c.ellipse(R(x) + 4, y - 2, 5, 2, 'w'); }
    const zee = 30, zand = 46; c.rect(0, zee, FW, zand - zee, 'B'); for (let y = zee + 2; y < zand; y += 4) for (let x = (y * 7) % 11; x < FW; x += 13) c.hline(x, y, 4, 'b');
    c.hline(0, zee, FW, 'b'); c.rect(0, zand, FW, FH - zand, 'Z'); c.hline(0, zand, FW, 'w');
    for (let i = 0; i < 40; i++){ const x = (i * 37) % FW, y = zand + 3 + (i * 17) % (FH - zand - 3); c.px(x, y, 'z'); }
    const px = 14; c.vline(px, 22, zand + 10 - 22, 'd'); c.poly([px - 13, 26, px, 15, px + 13, 26], 'r');                       // de parasol
    for (let i = 0; i < 3; i++) c.poly([px - 13 + i * 9, 26, px, 15, px - 9 + i * 9, 26], 'w');
    c.rect(FW - 34, FH - 12, 22, 5, 'r'); c.hline(FW - 34, FH - 10, 22, 'w');                                                  // een handdoek
  });
}
// 's Avonds in de stad: donkere lucht, gebouwen met verlichte ramen, een lantaarnpaal en flitsende camera's (paparazzofoto)
function stadAchter(FW, FH, dag){
  return sprite(FW, FH, c => {
    c.rect(0, 0, FW, FH, 'M'); if (dag){ for (const [x, y, w] of [[18, 6, 9], [FW * .6, 4, 7]]){ c.ellipse(R(x), y, w, 2, 'w'); c.ellipse(R(x) + 4, y - 2, 5, 2, 'w'); } }
    else for (let i = 0; i < 18; i++) c.px((i * 53) % FW, (i * 13) % 18, 'w');
    for (let x = 0, i = 0; x < FW; i++){ const w = 18 + (i * 7) % 14, top = 8 + (i * 11) % 16; c.rect(x, top, w, FH - top, i % 2 ? 'V' : 'v');
      for (let y = top + 3; y < FH - 18; y += 6) for (let xx = x + 3; xx < x + w - 3; xx += 5) c.rect(xx, y, 2, 3, (xx * 3 + y) % 7 < 3 ? 'Y' : 'y');
      x += w + 1; }
    const stoep = FH - 14; c.rect(0, stoep, FW, 14, 'F'); c.hline(0, stoep, FW, 'f'); for (let x = 0; x < FW; x += 16) c.vline(x, stoep, 14, 'f');
    c.vline(FW - 16, 14, stoep - 14, 'd'); c.rect(FW - 20, 11, 9, 3, 'd'); c.rect(FW - 19, 14, 7, 2, 'Y');                     // een lantaarnpaal
    if (!dag) for (const [x, y] of [[8, 30], [FW - 30, 26], [28, 18]]){ c.line(x - 4, y, x + 4, y, 'w'); c.line(x, y - 4, x, y + 4, 'w'); c.rect(x - 1, y - 1, 3, 3, 'w'); } // flitsen
  });
}
// Een auto van opzij (neus naar rechts): een lage sportwagen met spoiler, of een gewone auto. q/Q = lak, g = glas,
// w = velgen, L = koplamp, r = achterlicht. Met een zwarte rand eromheen (outline)
function autoSprite(sport){
  const w = sport ? 46 : 40, h = sport ? 16 : 19;
  return sprite(w, h, c => {
    if (sport){
      c.rect(2, 7, 42, 5, 'q'); c.rect(0, 9, 46, 3, 'q'); c.poly([13, 7, 19, 2, 31, 2, 38, 7], 'q');
      c.poly([15, 7, 20, 3, 25, 3, 25, 7], 'g'); c.poly([27, 7, 27, 3, 30, 3, 35, 7], 'g');
      c.hline(2, 10, 42, 'Q'); c.rect(1, 6, 6, 1, 'Q'); c.rect(2, 5, 1, 2, 'Q'); c.rect(43, 9, 2, 1, 'L'); c.rect(0, 9, 2, 1, 'r');
      for (const x of [10, 36]){ c.circ(x, 12, 3, 'k'); c.circ(x, 12, 1, 'w'); }
    } else {
      c.rect(1, 9, 38, 6, 'q'); c.poly([8, 9, 12, 3, 28, 3, 33, 9], 'q');
      c.poly([10, 9, 13, 4, 19, 4, 19, 9], 'g'); c.poly([21, 9, 21, 4, 27, 4, 31, 9], 'g');
      c.hline(1, 12, 38, 'Q'); c.rect(37, 10, 2, 2, 'L'); c.rect(1, 10, 1, 2, 'r');
      for (const x of [9, 31]){ c.circ(x, 15, 3, 'k'); c.circ(x, 15, 1, 'w'); }
    }
  }).outline(107);
}
const AUTO_KLEUR = {geel:'#ffd21a', rood:'#e0262b', zwart:'#2a2a33', wit:'#f2f2f5', blauw:'#2f62d6', groen:'#2f9e4f', grijs:'#8a8f9a', oranje:'#ff8a1a'};
const donkerHex = (hex, f) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - f)).toString(16).padStart(2, '0')).join('');
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
  const uit = ctx.wie ? uiterlijkVoor(ctx.wie) : uiterlijkVoor('jij|' + (ctx.sleutel || 'nieuw'), ctx.leeftijd ? {...(ctx.uiterlijk || {}), leeftijd:ctx.leeftijd} : ctx.uiterlijk || undefined); // (je leeftijd: pixel/leeftijd.js)
  const F = ctx.foto || {}, prive = ['huis', 'bruiloft', 'strand', 'stad', 'straat', 'auto', 'blessure'].includes(soort), gala = soort === 'goudenbal', aanv = soort === 'aanvoerder';
  const JURK = {shirt:'#fbfbff', accent:'#e8e2f2', patroon:'effen', broek:'#fbfbff', sok:'#fbfbff'};
  // jouw eigen kledingkast (game/prive/kleding.js: ctx.kleding) gaat voor, behalve in het clubtenue of met een blessure
  const eigen = gel => outfitVoor(ctx.kleding, gel);
  const kleedIk = (u, vrouw) => { const gel = soort === 'strand' ? 'strand' : ['huis', 'stad', 'straat', 'auto'].includes(soort) ? 'uit' : gala || (soort === 'bruiloft' && !vrouw) ? 'gala' : null;
    if (soort === 'stijlpers') return eigen('pers') || ['training', {...tenue, broek:'#262b36', sok:'#262b36'}, {}]; // (het voorbeeld in je kledingkast)
    return (gel && eigen(gel)) || kleed(u, vrouw); };
  const kleed = (u, vrouw) => soort === 'huis' || soort === 'strand' || soort === 'stad' || soort === 'straat' || soort === 'auto' ? ['casual', tenue, {}] : soort === 'blessure' ? ['training', tenue, {}] : gala ? ['pak', null, {pak:'#1b1d24', pak2:'#0f1016', das:'#c9a227'}] : soort === 'bruiloft' ? (vrouw ? ['tenue', JURK, {}] : ['pak', null, {pak:'#1b1d24', pak2:'#0f1016', das:'#c9a227'}]) : ['tenue', tenue, {band:aanv || !!ctx.band}];
  const [kl, tn, opt] = kleedIk(uit, uit.vrouw);
  const look = lookVan(uit, tn, {...opt, kleding:kl});
  const v = {kapsel:look.kapsel, vrouw:look.vrouw, kleding:kl, patroon:look.patroon, jurk:soort === 'bruiloft' && !!uit.vrouw, band:aanv ? false : prive || gala ? false : look.band, baard:look.baard};
  const sp = inkleuren(spelerBeeld(soort, v), {...look.kleuren, ...GOUD, ...BRUID});
  // op de bruiloft: je partner naast je (gespiegeld, arm in arm)
  let partner = null;
  const paar = soort === 'bruiloft' || (['strand', 'stad', 'straat'].includes(soort) && F.partner);
  if (paar){
    const pv = !!F.partnerVrouw, pu0 = uiterlijkVoor('partner|' + (F.partner || 'x'), {vrouw:pv}), pu = pv && pu0.haar === 5 ? {...pu0, haar:(F.partner || 'x').length % 5} : pu0, [pk, pt, po] = kleed(pu, pv), pl = lookVan(pu, pt, {...po, kleding:pk});
    const bruid = soort === 'bruiloft' && pv;
    // (je vrouw ziet er op elke foto hetzelfde uit als op de bruiloft: hetzelfde gezicht en dezelfde haarkleur, lang los haar; alleen de kleren verschillen)
    partner = inkleuren(spelerBeeld(soort === 'bruiloft' ? 'bruiloft' : 'portret', {kapsel:pv ? 'lang' : pl.kapsel, langHaar:pv, vrouw:pl.vrouw, kleding:pk, patroon:'effen', baard:pl.baard, jurk:bruid}).flipX(), {...pl.kleuren, ...GOUD, ...BRUID});
  }
  // de nieuwe aanvoerder: naast je de trainer (in pak, met een das in de clubkleur) en aan de buitenkant de twee vice-aanvoerders
  let groep = [];
  if (aanv){
    const mens = (sleutel, kl, tn, opt) => { const u = uiterlijkVoor(sleutel), l = lookVan(u, tn, {...opt, kleding:kl});
      return inkleuren(spelerBeeld('portret', {kapsel:l.kapsel, vrouw:l.vrouw, kleding:kl, patroon:l.patroon, baard:l.baard, band:false}), {...l.kleuren, ...GOUD, G:'#2f9e4f', g:'#ffffff'}); };
    const [v1, v2] = F.vices || [];
    groep = [[mens('vice|' + (ctx.clubId ?? '') + '|' + (v1 || 'a'), 'tenue', tenue, {}), -43, -2], [mens('vice|' + (ctx.clubId ?? '') + '|' + (v2 || 'b'), 'tenue', tenue, {}), 43, -2],
      [mens('trainer|' + (F.trainer || ctx.club || 'x'), 'pak', null, {pak:'#1b1d24', pak2:'#0f1016', das:tenue.shirt}), 19, 0]];
  }
  // de achtergrond met de clubkleuren
  const naam = zonderAccent(ctx.sponsor && ctx.sponsor.naam ? ctx.sponsor.naam : ctx.club || 'PERS').slice(0, 16);
  const clubKl = {1:tenue.shirt, 2:donker(tenue.shirt, .3), 3:tenue.accent || '#ffffff', 4:'#38bdf8', 5:'#e8ecf5'};
  const ererondje = soort === 'ererondje' || soort === 'juich' || soort === 'veld'; // (na een goal of iets op het veld: ook in het stadion)
  const achter = soort === 'huis' ? inkleuren(huisAchter(FW, FH, F.type || 'huis'), {L:'#8fd3ff', l:'#b8e4ff', W:'#ffffff', g:'#3f9a4a', G:'#4caf55', B:'#b5603f', b:'#8e4630', V:'#efe9df', D:'#7a2e2a', k:'#2a2430', w:'#bfe6ff', d:'#6b4226', r:'#d62828', '<':'#f3c44f'})
    : gala ? inkleuren(galaAchter(FW, FH), {M:'#140f26', l:'#211a3b', y:'#8a6b1e', Y:'#f3c44f', w:'#ffffff', F:'#0b0816', f:'#f3c44f'})
    : soort === 'strand' ? inkleuren(strandAchter(FW, FH), {L:'#8fd3ff', l:'#b8e4ff', y:'#ffe066', Y:'#ffd03a', w:'#ffffff', B:'#2f7fd0', b:'#6cb4f0', Z:'#f1d79a', z:'#d9bb78', d:'#6b4226', r:'#e05a5a'})
    : soort === 'straat' || soort === 'auto' ? inkleuren(stadAchter(FW, FH, true), {M:'#9fd3ff', w:'#ffffff', V:'#c98b6a', v:'#b07656', Y:'#dff1ff', y:'#7fa6c4', F:'#b9b4ac', f:'#a29d95', d:'#5a5f6e'})
    : soort === 'stad' ? inkleuren(stadAchter(FW, FH), {M:'#141a33', w:'#ffffff', V:'#262d4a', v:'#1d2340', Y:'#ffd56b', y:'#3a3f5c', F:'#2b2b33', f:'#3a3a44', d:'#5a5f6e'})
    : soort === 'bruiloft' ? inkleuren(bruiloftAchter(FW, FH), {P:'#f6dfe6', p:'#f1d2db', g:'#cfc4b6', w:'#ffffff', G:'#3f8a4a', r:'#e05a7a', y:'#ffd34d'})
    : inkleuren(ererondje ? stadion(zonderAccent(ctx.club || 'KAMPIOEN').slice(0, 16), FW, FH) : persmuur(naam, FW, FH, !!ctx.logo),
    ererondje ? {K:'#0f1424', b:'#3c4a6e', M:'#ffe9a8', w:'#ffffff', C:'#22222a', c:'#34343e', g:'#2f7d3f', G:'#378c48', h:'#b5541c', s:'#f7c9a8', R:'#a3161b',
      v:'#2b3f9e', i:'#a8744f', n:'#2a1f1c', y:'#ffd21a', d:'#7a4a2a', ...clubKl}
      : {...clubKl, M:muur, F:donker(muur, .45), f:donker(muur, .2), 4:accent});
  // het echte clublogo op de persmuur (scherp pixellogo, data/logos.js), op de plekken van de schildjes
  if (ctx.logo && !prive && !ererondje && !gala){ const pl = pixelLogo(ctx.logo, 12); for (const [x, y] of muurLogos(FW)) zetLogo(achter, pl, x - 2, y - 2, [0, 0, FW, FH - 14]); }
  // samenstellen: het beeld van 120×80, de speler met zijn voeten net op de vloer
  const klein = document.createElement('canvas'); klein.width = FW; klein.height = FH;
  const g = klein.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(achter, 0, 0);
  if (aanv){ for (const [cv, dx, dy] of groep) g.drawImage(cv, FW / 2 + dx - (X0 + 1), FH - 80 + dy); g.drawImage(sp, FW / 2 - 14 - (X0 + 1), FH - 80); } // (jij vooraan, net links van het midden)
  else if (partner){ const d = soort === 'bruiloft' ? 11 : 14; g.drawImage(sp, FW / 2 - d - (X0 + 1), FH - 80); g.drawImage(partner, FW / 2 + d - (96 - X0 - 1), FH - 80); }
  else if (soort === 'auto'){ // je auto rechts op de stoep, jij ervoor links
    const sport = F.auto === 'sport', kl = AUTO_KLEUR[F.kleur] || (sport ? AUTO_KLEUR.geel : F.auto === 'oud' ? AUTO_KLEUR.groen : AUTO_KLEUR.blauw);
    const car = inkleuren(autoSprite(sport), {q:kl, Q:donkerHex(kl, .28), g:'#9fd8ff', k:'#1a1414', w:'#c8c8d0', L:'#fff6b0', r:'#e0262b'});
    const z = FW >= 150 ? 3 : 2.4, cw = Math.round(car.width * z), ch = Math.round(car.height * z); // (groot: een echte auto is langer en breder dan jij)
    g.drawImage(car, FW - cw + Math.round(cw * .08), FH - ch + 1, cw, ch); // (rechts in beeld, de neus loopt net buiten de foto)
    g.drawImage(sp, FW * .17 - (X0 + 1), FH - 80);
  }
  else g.drawImage(sp, (soort === 'huis' ? FW * .3 : FW / 2) - (X0 + 1), FH - 80 + (ererondje ? 4 : 0)); // (de voeten net boven de onderrand; voor het huis iets naar links)
  if (alleenCanvas) return klein;
  // 6× vergroot, met een lichte vignet (zoals een krantenfoto; de pixels blijven scherp)
  const cv = document.createElement('canvas'); cv.width = FW * Z; cv.height = FH * Z;
  const G = cv.getContext('2d'); G.imageSmoothingEnabled = false; G.drawImage(klein, 0, 0, cv.width, cv.height);
  const vg = G.createRadialGradient(cv.width / 2, cv.height * .45, cv.height * .35, cv.width / 2, cv.height / 2, cv.width * .7);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.3)'); G.fillStyle = vg; G.fillRect(0, 0, cv.width, cv.height);
  return cv.toDataURL('image/png');
}
