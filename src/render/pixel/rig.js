/* ===================== Pixelspeler: de chibi-rig ===================== */
// Dezelfde rig als art/chibi_anims.px.js (de stijlbron), maar dan in het spel getekend, zodat elke speler
// zijn eigen huid, haar, kapsel en tenue krijgt. De tekenregels (lijn met ronde kwast, cirkel, vrij draaien,
// omlijning) zijn die van pxl (github.com/uilianks/pxl, MIT), zodat de pixels precies hetzelfde uitkomen.
// Een afbeelding bestaat uit kleursleutels (één letter per pixel); pas bij het inkleuren worden het kleuren.
// Hoeken in graden: 0 = recht naar beneden, + = naar rechts (looprichting), 180 = recht omhoog.
// Geen three.js: ook het startscherm en de krantenfoto's gebruiken dit.

import { MERKEN } from '../../data/merken.js';
const K = s => s.charCodeAt(0);
// Het patroon kan een kledingmerk meedragen: 'strepen#vortiq' (atlas.js lookVan). Hier weer uit elkaar
const delen = p => { const [pat, merk] = String(p || 'effen').split('#'); return [pat, MERKEN[merk] ? MERKEN[merk] : null]; };
// Het merklogo op de borst (kleur '|'), linksboven op het shirt (vanaf jou gezien rechts op je borst). Van opzij smaller
function merkLogo(c, merk, x0, y0, maxB = 9){
  if (!merk) return;
  // op een vlakje in de shirtkleur (net als het rugnummer): zo zie je het logo ook op strepen of blokken
  const b = Math.min(maxB, merk.logo[0].length), h = merk.logo.length;
  c.rect(x0 - 1, y0 - 1, b + 2, h + 2, 'r');
  merk.logo.forEach((rij, y) => [...rij].slice(0, maxB).forEach((b, x) => { if (b === '1') c.px(x0 + x, y0 + y, '|'); }));
}

// ---------- de afbeelding ----------
export class Img {
  constructor(w, h){ this.w = w; this.h = h; this.d = new Uint8Array(w * h); }
  inside(x, y){ return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y){ return this.inside(x, y) ? this.d[y * this.w + x] : 0; }
  set(x, y, c){ if (this.inside(x, y)) this.d[y * this.w + x] = c; }
  // 1px omlijning rond alles wat niet doorzichtig is; het beeld groeit 1 px aan elke kant
  outline(c){
    const o = new Img(this.w + 2, this.h + 2), op = (x, y) => this.get(x - 1, y - 1) !== 0;
    for (let y = 0; y < this.h; y++) o.d.set(this.d.subarray(y * this.w, (y + 1) * this.w), (y + 1) * o.w + 1);
    for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++){
      if (op(x, y)) continue;
      if (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1)) o.d[y * o.w + x] = c;
    }
    return o;
  }
  flipX(){ const o = new Img(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) o.d[y * this.w + this.w - 1 - x] = this.d[y * this.w + x]; return o; }
  // Met de klok mee draaien; veelvouden van 90 exact, andere hoeken zoals pxl (4×4 monsters per pixel, 5 of meer = raak)
  rot(deg){
    const d = ((deg % 360) + 360) % 360;
    if (d === 0) return this;
    if (d === 180){ const o = new Img(this.w, this.h); for (let i = 0; i < this.d.length; i++) o.d[this.d.length - 1 - i] = this.d[i]; return o; }
    if (d === 90 || d === 270){ const o = new Img(this.h, this.w);
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++){ const [tx, ty] = d === 90 ? [this.h - 1 - y, x] : [y, this.w - 1 - x]; o.set(tx, ty, this.d[y * this.w + x]); }
      return o; }
    const a = d * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
    const W = Math.max(1, Math.ceil(Math.abs(this.w * cos) + Math.abs(this.h * sin) - 1e-6)), H = Math.max(1, Math.ceil(Math.abs(this.w * sin) + Math.abs(this.h * cos) - 1e-6));
    const o = new Img(W, H), cx = this.w / 2, cy = this.h / 2, ox = W / 2, oy = H / 2, hits = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
      hits.length = 0;
      for (let k = 0; k < 16; k++){
        const dx = x + ((k & 3) + .5) / 4 - ox, dy = y + ((k >> 2) + .5) / 4 - oy;
        const sx = Math.floor(cx + dx * cos + dy * sin), sy = Math.floor(cy - dx * sin + dy * cos);
        if (!this.inside(sx, sy)) continue;
        const c = this.d[sy * this.w + sx]; if (c) hits.push(c);
      }
      if (hits.length < 5) continue;
      let best = 0, bestN = 0;
      for (let k = 0; k < hits.length; k++){ let n = 0; for (const c of hits) if (c === hits[k]) n++; if (n > bestN){ bestN = n; best = k; } }
      o.d[y * W + x] = hits[best];
    }
    return o;
  }
}

// ---------- tekenen (zoals pxl: alles valt op hele pixels) ----------
export class Doek {
  constructor(img){ this.img = img; }
  px(x, y, c){ this.img.set(Math.floor(x), Math.floor(y), K(c)); }
  is(x, y, keys){ const v = this.img.get(x, y); return v !== 0 && keys.includes(String.fromCharCode(v)); }
  rect(x, y, w, h, c){ const k = K(c); for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.img.set(Math.floor(xx), Math.floor(yy), k); }
  hline(x, y, len, c){ this.rect(x, y, len, 1, c); }
  vline(x, y, len, c){ this.rect(x, y, 1, len, c); }
  // Bresenham; breder dan 1 = een ronde kwast
  line(x0, y0, x1, y1, c, width = 1){
    const k = K(c), brush = [];
    if (width > 1){
      const f = width % 2 === 0 ? .5 : 0, r2 = (width / 2) ** 2, lo = -Math.floor((width - 1) / 2), hi = Math.ceil((width - 1) / 2);
      for (let oy = lo; oy <= hi; oy++) for (let ox = lo; ox <= hi; ox++) if ((ox - f) ** 2 + (oy - f) ** 2 <= r2) brush.push(ox, oy);
    } else brush.push(0, 0);
    x0 = Math.floor(x0); y0 = Math.floor(y0); x1 = Math.floor(x1); y1 = Math.floor(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;){
      for (let i = 0; i < brush.length; i += 2) this.img.set(x0 + brush[i], y0 + brush[i + 1], k);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy){ err += dy; x0 += sx; }
      if (e2 <= dx){ err += dx; y0 += sy; }
    }
  }
  ellipse(cx, cy, rx, ry, c){
    const k = K(c), ax = rx + .5, ay = ry + .5;
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x / ax) ** 2 + (y / ay) ** 2 <= 1) this.img.set(Math.floor(cx + x), Math.floor(cy + y), k);
  }
  circ(cx, cy, r, c){ this.ellipse(cx, cy, r, r, c); }
  poly(pts, c){ // gevuld, hoekpunten op pixelhoeken (pixelmiddens worden getest)
    const k = K(c); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < pts.length; i += 2){ x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); }
    for (let y = Math.floor(y0); y < Math.ceil(y1); y++) for (let x = Math.floor(x0); x < Math.ceil(x1); x++){
      const px = x + .5, py = y + .5; let in_ = false;
      for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2){ const xi = pts[i], yi = pts[i + 1], xj = pts[j], yj = pts[j + 1];
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) in_ = !in_; }
      if (in_) this.img.set(x, y, k);
    }
  }
  // een andere afbeelding erop (doorzichtig blijft doorzichtig), eventueel gedraaid of gespiegeld
  stamp(src, x, y, {rot = 0, flip = false} = {}){
    let s = flip ? src.flipX() : src; if (rot) s = s.rot(rot);
    x = Math.floor(x); y = Math.floor(y);
    for (let yy = 0; yy < s.h; yy++) for (let xx = 0; xx < s.w; xx++){ const v = s.d[yy * s.w + xx]; if (v) this.img.set(x + xx, y + yy, v); }
  }
}
export const sprite = (w, h, ...stappen) => { const img = new Img(w, h), c = new Doek(img); for (const f of stappen) f(c); return img; };

// ---------- de onderdelen ----------
// Het hoofd (38×26) met een kapsel. 'model' is het haar uit de stijlbron; de andere kapsels staan in kapsels.js
import { haarAchter, haarVoor, haarRug, haarZijAchter, haarZijVoor } from './kapsels.js';
import { verouder } from './leeftijd.js'; // (jouw speler wordt ouder: grijs, inhammen, rimpels; de code staat achter het kapsel)
import { leesTattoo, tattooArm } from './tattoo.js'; // (jouw tattoos: alleen op huid, de code staat achter het kapsel)
const HOOFDEN = new Map();
// Gezichtshaar (baard: '', 'geen', 'stoppels', 'snor', 'sikje', 'baard'), in de haarkleur (h, en H voor de schaduw).
// Van voren: gezicht x 10-31, mond y 22; van opzij (zij): gezicht x 15-31, mond x 28-30. De snor van voren is die van
// de eigenaar in de contractscène (stijlbron: _hoofd_baas). true = 'snor' (zo riep de contractscène het al aan).
const baardSoort = b => b === true ? 'snor' : b && b !== 'geen' ? b : '';
// Gezichtshaar. Geen effen blok (dat leek een masker of bandana): de baard volgt de kaak, de wangen blijven vrij,
// de rand naar de huid is zacht, de mond blijft zichtbaar en onder de kin loopt hij rond.
const KORREL = (x, y) => (((x * 73856093) ^ (y * 19349663) ^ (x * y * 83492791)) >>> 0) % 100; // (vaste "willekeur": geen ruitjes)
// de bovenrand van de baard per kolom (van voren: x 10-31, van opzij: x 22-31); hoger bij de bakkebaarden, lager bij de mond
const BAARDRAND_V = x => x <= 11 || x >= 30 ? 16 : x === 12 || x === 29 ? 18 : x === 13 || x === 28 ? 19 : x <= 15 || x >= 26 ? 20 : 21;
const BAARDRAND_Z = x => x <= 23 ? 16 : x === 24 ? 18 : x <= 26 ? 20 : 21;
function baardVlak(c, zij, onder, dicht, stoppel = false){
  const [x0, x1] = zij ? [22, 31] : [10, 31], rand = zij ? BAARDRAND_Z : BAARDRAND_V;
  for (let x = x0; x <= x1; x++){
    const top = rand(x) + (stoppel ? 1 : 0);
    if (stoppel){ for (let y = top; y <= onder; y++) if (!c.is(x, y, 'k')) c.px(x, y, KORREL(x, y) < 22 ? 'H' : 'S'); continue; } // stoppels: een donkere baardschaduw met losse haartjes
    if (KORREL(x, top - 1) < 35) c.px(x, top - 1, 'h');                                   // een zachte, rafelige bovenrand
    for (let y = top; y <= onder; y++) if (KORREL(x, y) < dicht) c.px(x, y, KORREL(x + 7, y) < 14 ? 'H' : 'h');
  }
}
function snor(c, zij){
  if (zij){ c.rect(27, 20, 5, 1, 'H'); c.rect(28, 21, 4, 1, 'H'); c.px(27, 21, 'h'); return; }
  c.rect(18, 20, 6, 1, 'H'); c.rect(17, 21, 8, 1, 'H'); c.px(16, 22, 'H'); c.px(25, 22, 'H');     // met hoekjes die naar beneden lopen
}
function gezichtshaar(c, baard, zij){
  if (!baard) return;
  if (baard === 'stoppels'){ baardVlak(c, zij, 24, 100, true); if (zij) c.hline(28, 22, 3, 'k'); else c.hline(18, 22, 5, 'k'); return; } // (de mond blijft zichtbaar)
  if (baard === 'baard'){
    baardVlak(c, zij, 24, 100);
    if (zij){ c.rect(24, 25, 7, 1, 'h'); c.px(31, 24, 'h'); c.hline(25, 25, 5, 'H'); }    // onder de kin rond
    else { c.rect(13, 25, 16, 1, 'h'); c.hline(15, 25, 12, 'H'); }
    snor(c, zij);
    if (zij){ c.hline(28, 22, 3, 'k'); c.px(30, 23, 's'); }             // de mond en een stukje onderlip
    else { c.hline(18, 22, 5, 'k'); c.rect(19, 23, 3, 1, 's'); }
    return;
  }
  snor(c, zij);                                                                               // de snor (ook bij het sikje)
  if (baard === 'sikje'){
    if (zij){ c.rect(28, 23, 4, 2, 'h'); c.px(29, 25, 'h'); c.px(30, 25, 'h'); c.hline(28, 24, 4, 'H'); }
    else { c.px(17, 22, 'H'); c.px(23, 22, 'H'); c.rect(18, 23, 5, 2, 'h'); c.rect(19, 25, 3, 1, 'h'); c.hline(18, 24, 5, 'H'); c.px(20, 23, 'H'); } // (verbonden met de snor, rond onder de kin)
  }
}
// De wenkbrauwen van voren: de linker tekenen en precies gespiegeld (om x = 20, het midden van de ogen) de rechter, zodat ze
// allebei even hoog en even dik zijn. (Twee losse lijnen in tegengestelde richting gaven verschillende pixels: de linker raakte
// het oog en leek groter.) Van boven-buiten schuin naar beneden-binnen, en nooit op de bovenste rij van het oog (y 15)
const WENKBRAUW = {man:[[12, 12, 14], [12, 13, 16], [14, 14, 17]], vrouw:[[13, 13, 15], [15, 14, 17]]};
function wenkbrauwen(c, vrouw){
  for (const [x0, y, x1] of WENKBRAUW[vrouw ? 'vrouw' : 'man']) for (let x = x0; x <= x1; x++){ c.px(x, y, 'k'); c.px(40 - x, y, 'k'); }
}
export function hoofd(kapsel = 'model', vrouw = false, baard = ''){
  baard = vrouw ? '' : baardSoort(baard);
  const sl = kapsel + (vrouw ? '|v' : '') + (baard === 'snor' ? '|snor' : baard ? '|' + baard : ''); if (HOOFDEN.has(sl)) return HOOFDEN.get(sl);
  const img = sprite(38, 26, c => {
    haarAchter(c, kapsel);
    c.rect(10, 10, 22, 15, 's');
    // (de schaduw en de oren komen vóór de pony: lang haar en een afro vallen over de oren; bij het
    //  kapsel uit de stijlbron raken ze elkaar niet, dus daar blijft elke pixel gelijk)
    c.rect(10, 23, 22, 2, 'S'); c.rect(31, 12, 1, 11, 'S');
    c.rect(5, 14, 3, 5, 's'); c.px(5, 16, 'S'); c.rect(34, 14, 3, 5, 'S');
    haarVoor(c, kapsel);
    wenkbrauwen(c, vrouw);
    c.rect(13, 15, 4, 4, 'i'); c.rect(15, 16, 2, 3, 'k'); // (oogwit: 'i', los van het accent 'w' van het shirt)
    c.rect(24, 15, 4, 4, 'i'); c.rect(26, 16, 2, 3, 'k');
    if (vrouw){ c.px(12, 15, 'k'); c.px(28, 15, 'k'); } // wimpers
    c.rect(11, 20, 3, 1, 'p'); c.rect(28, 20, 3, 1, 'p');
    c.px(20, 19, 'S');
    if (vrouw){ c.hline(18, 22, 5, 'k'); c.hline(19, 23, 3, 'p'); } else c.hline(18, 22, 5, 'k');
    gezichtshaar(c, baard, false);
    verouder(c, kapsel, 'voor');
  });
  HOOFDEN.set(sl, img); return img;
}
// Van opzij (stijlbron: _hoofd_zij): gezicht x 15-31 naar rechts, oor in het midden, haar op het achterhoofd
export function hoofdZij(kapsel = 'model', vrouw = false, baard = ''){
  baard = vrouw ? '' : baardSoort(baard);
  const sl = 'zij|' + kapsel + (vrouw ? '|v' : '') + (baard ? '|' + baard : ''); if (HOOFDEN.has(sl)) return HOOFDEN.get(sl);
  const img = sprite(38, 26, c => {
    haarZijAchter(c, kapsel);
    c.rect(15, 10, 17, 15, 's');                                                              // gezicht
    c.rect(32, 15, 2, 3, 's'); c.px(33, 17, 'S');                                             // neus
    c.rect(15, 23, 17, 2, 'S'); c.rect(15, 10, 1, 13, 'S');                                   // kaak en achterkant
    c.img.set(31, 24, 0); c.px(30, 24, 'S'); c.px(31, 23, 'S');                               // een ronde kin (geen blokhoek)
    c.rect(17, 13, 4, 6, 's'); c.rect(18, 15, 2, 2, 'S'); c.vline(21, 14, 4, 'S'); c.hline(18, 19, 2, 'S'); // oor
    haarZijVoor(c, kapsel); // (de pony raakt neus, kaak en oor niet: bij het kapsel uit de stijlbron blijft elke pixel gelijk)
    if (vrouw) c.line(25, 13, 30, 13, 'k', 1); else c.line(25, 12, 30, 13, 'k', 2);          // wenkbrauw
    c.rect(26, 15, 4, 4, 'i'); c.rect(28, 16, 2, 3, 'k');                                     // oog
    if (vrouw) c.px(30, 15, 'k');                                                              // wimper
    c.rect(23, 20, 3, 1, 'p');                                                                 // blos
    c.hline(28, 22, 3, 'k'); if (vrouw) c.px(29, 23, 'p');                                     // mond
    gezichtshaar(c, baard, true);
    verouder(c, kapsel, 'zij');
  });
  HOOFDEN.set(sl, img); return img;
}
// Van achteren: het achterhoofd (P.richting = 'achter')
export function hoofdRug(kapsel = 'model'){
  const sl = 'rug|' + kapsel; if (HOOFDEN.has(sl)) return HOOFDEN.get(sl);
  const img = sprite(38, 26, c => {
    c.rect(10, 6, 22, 19, 's'); c.rect(10, 23, 22, 2, 'S'); c.rect(31, 8, 1, 15, 'S');      // het hoofd en de nek
    c.rect(5, 14, 3, 5, 's'); c.px(7, 16, 'S'); c.rect(34, 14, 3, 5, 'S');                  // oren
    haarRug(c, kapsel);
    verouder(c, kapsel, 'rug');
  });
  HOOFDEN.set(sl, img); return img;
}
// Het shirtpatroon: welke pixel van het shirtvlak (x 12-29, y 26-35) krijgt de accentkleur
const PATROON = {
  effen: () => false,
  strepen: (x) => ((x - 12) >> 1) % 2 === 1,
  banen: (x, y) => ((y - 26) >> 1) % 2 === 1,
  helften: (x) => x >= 21,
  sjerp: (x, y) => Math.abs((x - 12) - 2 * (y - 26) - 1) < 3,
  blokken: (x, y) => (((x - 12) >> 1) + ((y - 26) >> 1)) % 2 === 1,
  bies: (x, y) => y === 26 || x === 12 || x === 13 && y < 30,
};
// sleutels omwisselen (zoals stamp(..., {swap}) in pxl)
const K2 = s => s.charCodeAt(0);
function wissel(img, swap){ const m = new Uint8Array(128); for (const k in swap) m[K2(k)] = K2(swap[k]); const o = new Img(img.w, img.h); for (let i = 0; i < img.d.length; i++) o.d[i] = m[img.d[i]] || img.d[i]; return o; }
const JAS = {r:'c', R:'C', w:'c', W:'C', u:'e', U:'E'}; // vrijetijdskleding: jas en spijkerbroek over de vorm van het shirt
// De romp (31×41): shirt en broek, of vrijetijdskleding, een pak of een trainingspak
const ROMPEN = new Map();
export function romp(kleding = 'tenue', patroon = 'strepen'){
  const sl = kleding + '|' + patroon; if (ROMPEN.has(sl)) return ROMPEN.get(sl);
  let img;
  if (kleding === 'casual') img = sprite(31, 41, c => { c.stamp(wissel(romp('tenue', 'strepen'), JAS), 0, 0); c.poly([18, 26, 24, 26, 21, 31], 'w'); c.vline(21, 32, 3, 'C'); });
  else img = sprite(31, 41, c => {
    c.rect(18, 25, 6, 2, 'S');
    if (kleding === 'pak'){ // stijlbron: _romp_pak (revers, wit overhemd, das, knoop)
      c.rect(12, 26, 18, 10, 'c'); c.rect(27, 26, 3, 10, 'C');
      c.poly([17, 26, 25, 26, 21, 33], 'w');
      c.line(17, 26, 21, 33, 'C'); c.line(25, 26, 21, 33, 'C');
      c.rect(21, 27, 1, 6, 't'); c.rect(20, 27, 3, 1, 't');
      c.px(21, 34, 'C');
      c.rect(12, 36, 18, 4, 'c'); c.rect(12, 36, 18, 1, 'C');
      return;
    }
    if (kleding === 'training'){
      c.rect(12, 26, 18, 10, 'r');
      for (let x = 27; x < 30; x++) for (let y = 26; y < 36; y++) c.px(x, y, 'R');
      c.vline(21, 26, 9, 'w'); c.rect(18, 26, 6, 1, 'w'); c.rect(12, 34, 18, 1, 'R');      // rits en kraag
      c.rect(12, 35, 18, 5, 'u'); c.rect(12, 39, 18, 1, 'U'); c.rect(20, 37, 1, 3, 'U');
      return;
    }
    const [pat, merk] = delen(patroon), acc = PATROON[pat] || PATROON.effen;
    for (let x = 12; x < 30; x++) for (let y = 26; y < 36; y++) c.px(x, y, acc(x, y) ? 'w' : 'r');
    for (let x = 27; x < 30; x++) for (let y = 26; y < 36; y++) c.px(x, y, c.is(x, y, 'w') ? 'W' : 'R');
    c.rect(12, 34, 18, 1, 'W');
    c.px(21, 26, 'w'); c.px(20, 27, 'w'); c.px(22, 27, 'w');
    merkLogo(c, merk, 16, 28); // (niet onder de arm; rijen 28-30: boven het stuk dat rek() uitrekt)
    c.rect(12, 35, 18, 5, 'u'); c.rect(12, 39, 18, 1, 'U'); c.rect(20, 37, 1, 3, 'U');
  });
  ROMPEN.set(sl, img); return img;
}
// Van opzij (stijlbron: _romp_zij): shirt x 15-27, de rug in de schaduw, de kraag aan de voorkant
export function rompZij(kleding = 'tenue', patroon = 'strepen'){
  const sl = 'zij|' + kleding + '|' + patroon; if (ROMPEN.has(sl)) return ROMPEN.get(sl);
  const [pat, merk] = delen(patroon), acc = PATROON[pat] || PATROON.effen;
  let img;
  if (kleding === 'casual') img = sprite(31, 41, c => { c.stamp(wissel(rompZij('tenue', 'strepen'), JAS), 0, 0); c.rect(24, 26, 3, 2, 'w'); });
  else img = sprite(31, 41, c => {
    c.rect(19, 25, 5, 2, 'S');
    if (kleding === 'pak'){ c.rect(15, 26, 13, 10, 'c'); c.rect(15, 26, 2, 10, 'C'); c.rect(24, 26, 3, 3, 'w'); c.vline(26, 27, 4, 't'); c.rect(15, 36, 13, 4, 'c'); c.rect(15, 36, 13, 1, 'C'); return; }
    if (kleding === 'training'){ c.rect(15, 26, 13, 10, 'r'); c.rect(15, 26, 2, 10, 'R'); c.vline(27, 26, 9, 'w'); c.rect(15, 34, 13, 1, 'R'); c.rect(15, 35, 13, 5, 'u'); c.rect(15, 39, 13, 1, 'U'); return; }
    for (let x = 15; x < 28; x++) for (let y = 26; y < 36; y++) c.px(x, y, acc(x - 3, y) ? 'w' : 'r');   // (strepen: precies de stijlbron)
    for (let x = 15; x < 17; x++) for (let y = 26; y < 36; y++) c.px(x, y, c.is(x, y, 'w') ? 'W' : 'R');
    c.rect(15, 34, 13, 1, 'W');
    c.rect(24, 26, 3, 1, 'w');
    merkLogo(c, merk, 21, 27, 3); // (van opzij: een smaller stukje logo op de borst)
    c.rect(15, 35, 13, 5, 'u'); c.rect(15, 39, 13, 1, 'U');
  });
  ROMPEN.set(sl, img); return img;
}
// Van achteren: geen V-hals; met een rugnummer (cijfers van 3×5 in de accentkleur) als nr is meegegeven
const CIJFERS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
// Een klein lettertype van 3×4 voor de naam op de rug (de rug is maar 14 pixels breed tussen de armen), en cijfers van 3×4
// eronder: rek() verdubbelt de rijen 30-33, dus de cijfers (rijen 31-34) worden vanzelf groter dan de naam (27-30)
const RUG_LETTER = {A:'.#./#.#/###/#.#', B:'##./###/#.#/##.', C:'###/#../#../###', D:'##./#.#/#.#/##.', E:'###/##./#../###', F:'###/##./#../#..', G:'###/#../#.#/###', H:'#.#/###/#.#/#.#',
  I:'###/.#./.#./###', J:'..#/..#/#.#/###', K:'#.#/##./#.#/#.#', L:'#../#../#../###', M:'###/###/#.#/#.#', N:'##./#.#/#.#/#.#', O:'###/#.#/#.#/###', P:'###/#.#/###/#..',
  Q:'###/#.#/###/..#', R:'##./#.#/##./#.#', S:'.##/#../..#/##.', T:'###/.#./.#./.#.', U:'#.#/#.#/#.#/###', V:'#.#/#.#/#.#/.#.', W:'#.#/#.#/###/###', X:'#.#/.#./.#./#.#', Y:'#.#/#.#/.#./.#.', Z:'###/..#/#../###'};
const RUG_CIJFER = ['###/#.#/#.#/###', '##./.#./.#./###', '###/.##/#../###', '###/.##/..#/###', '#.#/###/..#/..#', '###/##./..#/##.', '#../###/#.#/###', '###/..#/.#./.#.', '###/###/#.#/###', '###/#.#/###/..#'];
const tekenRugTeken = (c, x, y, kaart, kl = 'w') => kaart.split('/').forEach((rij, r) => [...rij].forEach((k, i) => { if (k === '#') c.px(x + i, y + r, kl); }));
// De achternaam zoals hij op een shirt staat: hoofdletters, zonder accenten of tussenvoegsel, hooguit 4 letters
export const rugNaam = n => String(n || '').trim().split(/\s+/).pop().normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4); // (de rug is maar 18 pixels breed: 4 letters met ruimte ertussen zijn leesbaar, 5 aan elkaar niet)
export function rompRug(kleding = 'tenue', patroon = 'strepen', nr = '', naam = ''){
  naam = rugNaam(naam);
  const sl = 'rug|' + kleding + '|' + patroon + '|' + nr + '|' + naam; if (ROMPEN.has(sl)) return ROMPEN.get(sl);
  const acc = PATROON[delen(patroon)[0]] || PATROON.effen;
  let img;
  if (kleding === 'casual') img = sprite(31, 41, c => { c.stamp(wissel(rompRug('tenue', 'strepen'), JAS), 0, 0); });
  else img = sprite(31, 41, c => {
    c.rect(18, 25, 6, 2, 'S');
    if (kleding === 'pak'){ c.rect(12, 26, 18, 10, 'c'); c.rect(27, 26, 3, 10, 'C'); c.vline(21, 30, 5, 'C'); c.rect(18, 26, 6, 1, 'w'); c.rect(12, 36, 18, 4, 'c'); c.rect(12, 36, 18, 1, 'C'); return; }
    if (kleding === 'training'){ c.rect(12, 26, 18, 10, 'r'); c.rect(27, 26, 3, 10, 'R'); c.rect(18, 26, 6, 1, 'w'); c.rect(12, 34, 18, 1, 'R'); c.rect(12, 35, 18, 5, 'u'); c.rect(12, 39, 18, 1, 'U'); return; }
    for (let x = 12; x < 30; x++) for (let y = 26; y < 36; y++) c.px(x, y, acc(x, y) ? 'w' : 'r');
    for (let x = 27; x < 30; x++) for (let y = 26; y < 36; y++) c.px(x, y, c.is(x, y, 'w') ? 'W' : 'R');
    c.rect(12, 34, 18, 1, 'W'); c.rect(18, 26, 6, 1, 'R');
    const cijfers = String(nr || '').replace(/[^0-9]/g, '').slice(0, 2);
    if (naam){
      // naam en nummer, zoals op een echt shirt: op een vlak in de shirtkleur (dan is het ook op strepen leesbaar)
      // (tot 4 letters met een pixel ertussen; een naam van 5 letters past alleen zonder ruimte: dan om en om een iets donkerder
      //  accentkleur, zodat je de letters toch los ziet. De naam op rij 26-29, het nummer op 30-33: die rijen worden door rek()
      //  verdubbeld, dus het nummer wordt vanzelf groot, net als op een echt shirt)
      const gat = naam.length <= 4 ? 1 : 0, bn = naam.length * (3 + gat) - gat, xn = 21 - Math.floor(bn / 2);
      c.rect(Math.min(xn, 17) - 1, 26, Math.max(bn, 7) + 2, 8, 'r');
      [...naam].forEach((l, n) => tekenRugTeken(c, xn + n * (3 + gat), 26, RUG_LETTER[l] || RUG_LETTER.O, !gat && n % 2 ? 'W' : 'w'));
      if (cijfers){ const bc = cijfers.length * 4 - 1, xc = 21 - Math.floor(bc / 2); [...cijfers].forEach((d, n) => tekenRugTeken(c, xc + n * 4, 30, RUG_CIJFER[+d])); }
    }
    else if (cijfers){
      // het nummer op een vlak in de shirtkleur, zodat het ook op strepen leesbaar is
      const b = cijfers.length * 4 - 1, x0 = 21 - Math.floor(b / 2);
      c.rect(x0 - 1, 27, b + 2, 7, 'r');
      [...cijfers].forEach((d, n) => { const m = CIJFERS[+d]; for (let i = 0; i < 15; i++) if (m[i] === '1') c.px(x0 + n * 4 + (i % 3), 28 + Math.floor(i / 3), 'w'); });
    }
    c.rect(12, 35, 18, 5, 'u'); c.rect(12, 39, 18, 1, 'U');
  });
  ROMPEN.set(sl, img); return img;
}
// Een echte voetbal: wit met zwarte vijfhoeken (één in het midden, halve aan de randen), naden ertussen en schaduw rechtsonder
// (b wit, B schaduw, k de zwarte vlakken; de omlijning komt er bij het tekenen van de speler omheen)
const BAL_KAART = [
  '...bbkbb...',
  '..bbbkbbb..',
  '.kbbBbBbbk.',
  'kkbBbbbBbkk',
  'bbBbbkbbBbb',
  'bbbbkkkbbbb',
  'bbbbkkkbbbB',
  'bbbBbbbBbBB',
  '.bkkbbbkkB.',
  '..bkbbbkB..',
  '...bBBBB...'];
export const BAL = sprite(11, 11, c => BAL_KAART.forEach((rij, y) => [...rij].forEach((k, x) => { if (k !== '.') c.px(x, y, k); })));

// ---------- de rig ----------
export const GROND = 74;               // y van de grond (onderkant schoenen)
export const W = 96, H = 90;
const rad = d => d * Math.PI / 180, R = Math.round;
// De lengte van de ledematen. Langer dan de stijlbron (boven 6, onder 5, dij 6, scheen 6): een slankere, langere speler,
// met meer ruimte op de armen (voor tattoos). De romp is ook langer: ROMP_EXTRA rijen shirt erbij (zie rek)
const L = {boven:8, onder:7, dij:9, scheen:9};
export const ROMP_EXTRA = 4, HEUP = 39 + ROMP_EXTRA; // HEUP: hoe ver de heup onder de bovenkant van het hoofd zit (oy = heup - HEUP)
// De romp langer maken: de rijen 30-33 (het shirt, onder de kraag en de mouwen) elk twee keer. Werkt voor elk tenue,
// pak, jas en trainingspak, en voor de achterkant met rugnummer, zonder dat elke romp opnieuw getekend hoeft te worden
const REKKEN = new WeakMap();
function rek(img){
  let o = REKKEN.get(img); if (o) return o;
  o = new Img(img.w, img.h + ROMP_EXTRA);
  const rij = (van, naar) => { for (let x = 0; x < img.w; x++) o.d[naar * img.w + x] = img.d[van * img.w + x]; };
  let y = 0; for (let r = 0; r < img.h; r++){ rij(r, y++); if (r >= 30 && r < 30 + ROMP_EXTRA) rij(r, y++); }
  REKKEN.set(img, o); return o;
}
const stap = (x, y, hoek, len) => [x + Math.sin(rad(hoek)) * len, y + Math.cos(rad(hoek)) * len];
function beenPunten(hx, hy, [a, buig]){ const [kx, ky] = stap(hx, hy, a, L.dij), [fx, fy] = stap(kx, ky, a - buig, L.scheen); return {kx, ky, fx, fy}; }
function armPunten(sx, sy, [a, buig], f = 1){ const [ex, ey] = stap(sx, sy, a, L.boven * f), [hx, hy] = stap(ex, ey, a + buig, L.onder * f); return {ex, ey, hx, hy}; }
function dik(c, x0, y0, x1, y1, kleur, b){ c.line(R(x0), R(y0), R(x1), R(y1), 'k', b + 2); c.line(R(x0), R(y0), R(x1), R(y1), kleur, b); }
// Welke sleutels de ledematen per kleding krijgen (stijlbron: de teams THUIS, CASUAL, BAAS). Schoenen: y/Y, zolen: a/A
// (de kleuren zelf komen uit de look: atlas.js lookVan)
const LEDEN = {
  tenue:   {dij:'s', dij2:'S', kous:'o', kous2:'O', mouw:'r', mouw2:'R', onder:'s', onder2:'S', kort:true}, // (kort: korte mouwen, de onderste helft van de bovenarm is huid)
  casual:  {dij:'e', dij2:'E', kous:'e', kous2:'E', mouw:'c', mouw2:'C', onder:'c', onder2:'C'},
  pak:     {dij:'c', dij2:'C', kous:'c', kous2:'C', mouw:'c', mouw2:'C', onder:'c', onder2:'C'},
  training:{dij:'u', dij2:'U', kous:'u', kous2:'U', mouw:'r', mouw2:'R', onder:'r', onder2:'R'},
};
// Voetbalschoen van opzij, neus naar rechts: een enkelkraag, de wreef met witte veters, een lange voet die naar de neus toe
// smaller wordt, een hiel, en een zool met noppen (tussen de noppen zit geen zwarte rand, zo zie je ze los staan)
const SCHOEN = [[-2, 0, 2, 'b'], [-1, -1, 4, 'b'], [0, -2, 6, 'b'], [1, -2, 6, 'z']]; // (laag uitgesneden: de achterkant loopt schuin af naar de hiel)
const NOPPEN = [-1, 2, 5]; // (de x van de noppen onder de zool)
export function schoen(c, fx, fy, kleur, zool){
  for (const [dy, x0, x1] of SCHOEN) for (let x = x0; x <= x1; x++) c.rect(fx + x - 1, fy + dy - 1, 3, 3, 'k');
  for (const [dy, x0, x1, deel] of SCHOEN) for (let x = x0; x <= x1; x++) c.px(fx + x, fy + dy, deel === 'z' ? zool : kleur);
  c.img.set(fx + 7, fy - 1, 0); c.img.set(fx + 6, fy - 2, 0); // (een ronde neus: de hoek van de rand eraf)
  for (let x = -3; x <= 7; x++) if (!NOPPEN.includes(x)) c.img.set(fx + x, fy + 2, 0); // noppen
  c.px(fx - 2, fy, zool);                                                          // een klein hielstukje in de kleur van de zool
  c.px(fx + 1, fy - 2, 'i'); c.px(fx + 2, fy - 1, 'i'); c.px(fx + 3, fy - 1, 'i');  // veters
  c.px(fx + 6, fy, zool);                                                          // de neus iets donkerder
}
// Een hand met vingers (getekend, niet gedraaid: zo blijven de vingers scherp). Wijst de onderarm naar beneden, dan ziet hij er zo uit
// (kolom 2 = het midden van de pols, de duim rechts, onderaan de vingers: gesloten, met donkere naden ertussen en een ronde top).
// Voor een arm omhoog, naar links of naar rechts wordt dezelfde tekening gespiegeld of gekanteld (de grootste richting telt)
const HAND = ['ssss..',
              'sssss.',
              'ssssss',
              'sSsSsS',
              '.sss..'];
const VUIST_DONKER = {s:'S', S:'S', q:'Q', Q:'Q'};
const NAAD = {s:'S', S:'_', q:'Q', Q:'k'}; // (de naden tussen de vingers: altijd iets donkerder dan de hand zelf)
// Van voren of van achteren (armen langs het lijf): smaller, de duim aan de binnenkant (naar je lijf toe), de vingers naar beneden
const HAND_V = ['ssss',
                'Tsss',
                'TsSs',
                '.sSs'];
export function handV(c, x, y, kleur, binnen){
  const vak = [], d = VUIST_DONKER[kleur] || kleur, n = NAAD[kleur] || d;
  HAND_V.forEach((rij, r) => [...rij].forEach((k, k0) => { if (k === '.') return;
    const X = binnen < 0 ? x - 2 + k0 : x + 1 - k0; // (kolom 0 = de binnenkant)
    vak.push([X, y - 1 + r, k === 'T' ? d : k === 'n' ? kleur : k === 'S' ? n : kleur]); }));
  const op = new Set(vak.map(([X, Y]) => X + ',' + Y));
  // (een zwarte rand eromheen, behalve aan de kant van de pols: daar loopt de arm door)
  for (const [X, Y] of vak) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!op.has((X + dx) + ',' + (Y + dy)) && Y + dy >= y - 1) c.px(X + dx, Y + dy, 'k');
  for (const [X, Y, k] of vak) c.px(X, Y, k);
}
// (ex, ey) = de elleboog: daaruit volgt de richting van de hand. duim = +1 of -1: naar welke kant (x) de duim wijst als de hand
// omhoog of omlaag wijst. Wijst de hand opzij (een gestrekte arm), dan zit de duim altijd boven
export function hand(c, x, y, kleur, ex, ey, duim = 1){
  const ux = x - ex, uy = y - ey, liggend = Math.abs(ux) > Math.abs(uy) * 1.2, voor = liggend ? Math.sign(ux) || 1 : Math.sign(uy) || 1;
  if (liggend) duim = -1;
  const d = NAAD[kleur] || VUIST_DONKER[kleur] || kleur, vak = [];
  HAND.forEach((rij, r) => [...rij].forEach((k, k0) => { if (k === '.') return;
    const a = (r - 1) * voor, b = (k0 - 2) * duim;     // a = langs de arm, b = dwars
    vak.push([liggend ? x + a : x + b, liggend ? y + b : y + a, k === 'S' ? d : kleur]); }));
  const op = new Set(vak.map(([X, Y]) => X + ',' + Y)), langs = (X, Y) => (liggend ? X - x : Y - y) * voor; // (hoe ver langs de arm)
  for (const [X, Y] of vak) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!op.has((X + dx) + ',' + (Y + dy)) && langs(X + dx, Y + dy) >= -1) c.px(X + dx, Y + dy, 'k');
  for (const [X, Y, k] of vak) c.px(X, Y, k);
}
// Vuist (stijlbron): breder dan de onderarm, met zwarte rand, schaduw rechtsonder en een duim linksboven
export function vuist(c, x, y, kleur){
  const d = VUIST_DONKER[kleur] || kleur;
  c.circ(x, y, 3, 'k'); c.circ(x, y, 2, kleur);
  c.px(x + 1, y + 2, d); c.px(x + 2, y + 1, d); c.px(x + 2, y + 2, 'k');
  c.px(x - 1, y - 1, d);
}
// De schoen draait mee met het scheenbeen: zwaait je onderbeen naar achteren (tijdens het rennen), dan wijst de neus naar
// beneden en de zool naar achteren, zoals bij een echte voet. Eerst de schoen recht tekenen op een klein doek, dan elke pixel
// van het doel terugrekenen naar dat doek (zo komen er geen gaten in). Naar voren (de hak op de grond) blijft hij recht
function schoenGedraaid(c, fx, fy, kleur, zool, hoek){
  // (in stappen: recht, schuin of helemaal gekanteld; een kleine draaiing maakt de pixels alleen maar rafelig)
  const stap = hoek <= -113 ? -135 : hoek <= -68 ? -90 : hoek <= -28 ? -45 : 0;
  if (!stap){ schoen(c, fx, fy, kleur, zool); return; }
  const OX = 5, OY = 5, los = new Img(16, 10); schoen(new Doek(los), OX, OY, kleur, zool);
  const r = rad(stap), vx = Math.cos(r), vy = -Math.sin(r), ox = Math.sin(r), oy = Math.cos(r); // langs de voet en langs het been
  for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++){
    const lx = Math.round(x * vx + y * vy), ly = Math.round(x * ox + y * oy), k = los.get(lx + OX, ly + OY);
    if (k) c.img.set(fx + x, fy + y, k);
  }
}
// staat = deze voet staat op de grond (de laagste voet): die blijft altijd plat, hoe het been ook staat
function tekenBeen(c, hx, hy, pose, voor, T, staat = false){
  const {kx, ky, fx, fy} = beenPunten(hx, hy, pose);
  dik(c, hx, hy, kx, ky, voor ? T.dij : T.dij2, 4);
  dik(c, kx, ky, kx + (fx - kx) * .78, ky + (fy - ky) * .78, voor ? T.kous : T.kous2, 4); // (iets korter, zie tekenBeenV)
  schoenGedraaid(c, R(fx), R(fy), voor ? 'y' : 'Y', voor ? 'a' : 'A', staat ? 0 : pose[0] - pose[1]); // (de hoek van het scheenbeen)
}
function tekenArm(c, sx, sy, pose, voor, handKleur, f, T, band, inkt){
  const {ex, ey, hx, hy} = armPunten(sx, sy, pose, f);
  // korte mouwen (een voetbalshirt): de mouw tot halverwege de bovenarm, daaronder huid (daar is ook ruimte voor een tattoo)
  const mx = sx + (ex - sx) * .35, my = sy + (ey - sy) * .35;
  if (T.kort){ dik(c, mx, my, ex, ey, voor ? T.onder : T.onder2, 4); dik(c, sx, sy, mx, my, voor ? T.mouw : T.mouw2, 4); }
  else dik(c, sx, sy, ex, ey, voor ? T.mouw : T.mouw2, 4);
  if (voor && band) c.line(R(sx + (ex - sx) * (T.kort ? .12 : .55)), R(sy + (ey - sy) * (T.kort ? .12 : .55)), R(sx + (ex - sx) * (T.kort ? .42 : .85)), R(sy + (ey - sy) * (T.kort ? .42 : .85)), '%', 4); // aanvoerdersband (op de mouw)
  if (inkt) T.kort ? tattooArm(c, R(mx), R(my), R(ex), R(ey), inkt, 'boven') : tattooArm(c, R(sx), R(sy), R(ex), R(ey), inkt, 'boven');
  dik(c, ex, ey, hx, hy, voor ? T.onder : T.onder2, T.kort ? 4 : 3); // (blote armen iets steviger: dan past een tattoo erop)
  if (inkt) tattooArm(c, R(ex), R(ey), R(hx), R(hy), inkt);
  // hangt de arm, dan wijst de duim naar voren (de kijkrichting); steek je hem omhoog, dan wijst de duim naar je hoofd
  const omhoog = hy < ey - 1, naarLijf = Math.sign(sx - hx) || (voor ? -1 : 1);
  hand(c, R(hx), R(hy), handKleur, ex, ey, omhoog ? naarLijf : 1);
  return [R(hx), R(hy)];
}
// Van voren of van achteren: dezelfde pose, maar de diepte valt weg. Een knie die naar voren komt wordt zo een korter been,
// een arm die naar voren zwaait een kortere arm. De schoen wijst naar de kijker (of van hem af).
function tekenBeenV(c, hx, hy, pose, voor, T, rug){
  const p = beenPunten(0, 0, pose), ky = hy + p.ky, fy = R(hy + (rug ? p.fy : Math.max(p.fy, p.ky + 2))), x = R(hx);
  dik(c, hx, hy, hx, ky, voor ? T.dij : T.dij2, 4);
  dik(c, hx, ky, hx, fy - 2, voor ? T.kous : T.kous2, 4); // (iets korter: anders steekt de zwarte rand van de kous onder de schoen uit)
  schoenV(c, x, fy, voor ? 'y' : 'Y', voor ? 'a' : 'A', rug);
}
// Een schoen van voren (de neus wijst naar je toe: breed en rond, veters bovenop) of van achteren (de hiel, met een donkere hielkap)
const SCHOEN_V = [[-2, -1, 1], [-1, -2, 2], [0, -2, 2], [1, -2, 2, 'z']]; // (laag: geen hoge hak die bol uitsteekt)
function schoenV(c, x, fy, kleur, zool, rug){
  for (const [dy, x0, x1] of SCHOEN_V) for (let xx = x0; xx <= x1; xx++) c.rect(x + xx - 1, fy + dy - 1, 3, 3, 'k');
  for (const [dy, x0, x1, deel] of SCHOEN_V) for (let xx = x0; xx <= x1; xx++) c.px(x + xx, fy + dy, deel === 'z' ? zool : kleur);
  c.img.set(x - 3, fy - 2, 0); c.img.set(x + 3, fy - 2, 0);                           // (ronde schouders van de schoen)
  for (let xx = -3; xx <= 3; xx++) if (xx !== -2 && xx !== 2) c.img.set(x + xx, fy + 2, 0); // twee noppen onder de zool
  if (rug){ c.px(x, fy - 1, zool); c.px(x, fy, zool); } // een smalle hielkap (geen brede bolle hiel)
  else { c.px(x, fy - 2, 'i'); c.px(x - 1, fy - 1, 'i'); c.px(x + 1, fy - 1, 'i'); c.px(x - 2, fy, zool); c.px(x + 2, fy, zool); } // veters, en de neus rond
}
function tekenArmV(c, sx, sy, pose, kant, handKleur, f, T, voor, inkt){
  const a = armPunten(0, 0, pose, f), ex = sx + kant, hx = sx + kant;
  const my = sy + a.ey * .35;
  if (T.kort){ dik(c, ex, my, ex, sy + a.ey, voor ? T.onder : T.onder2, 4); dik(c, sx, sy, ex, my, voor ? T.mouw : T.mouw2, 4); }
  else dik(c, sx, sy, ex, sy + a.ey, voor ? T.mouw : T.mouw2, 4);
  if (inkt) tattooArm(c, R(ex), R(T.kort ? my : sy), R(ex), R(sy + a.ey), inkt, 'boven');
  dik(c, ex, sy + a.ey, hx, sy + a.hy, voor ? T.onder : T.onder2, T.kort ? 4 : 3);
  if (inkt) tattooArm(c, R(ex), R(sy + a.ey), R(hx), R(sy + a.hy), inkt);
  handV(c, R(hx), R(sy + a.hy), handKleur, -kant);
}
export function opGrond(P){ const l = beenPunten(0, 0, P.lL).fy, r = beenPunten(0, 0, P.lR).fy; return GROND - 3 - Math.max(l, r) - 1; }
// Waar zitten heup en hoofd in deze pose (voor ankerpunten: rugnummer, kaart, iets in de hand)
export function punten(P){ const hy = P.y ?? opGrond(P) - (P.hoog ?? 0), ox = R(P.x - 21), oy = R(hy - HEUP + (P.dy ?? 0)); return {heup:[P.x, hy], hoofd:[ox + 21 + (P.hd ? P.hd[0] : 0), oy + 12 + (P.hd ? P.hd[1] : 0)], handVoor:(() => { const a = armPunten(ox + 30, oy + 28, P.aR, P.arm); return [a.hx, a.hy]; })()}; }

// De hele speler in pose P. v = {kapsel, vrouw, kleding, patroon, band, nr, snor, baard, bal}. Geeft de plek van de voorste hand terug.
// P (zoals in de stijlbron): x, y of hoog, dy, lL/lR [dij, knie], aL/aR [bovenarm, elleboog], hd [dx, dy], hand ('s' of 'q'), arm (lengte),
// zij (zijaanzicht), bal [x, y], balRot. Extra: richting 'voor'/'achter' (van voren of van achteren), extra(c, o) tekent iets erbij
// (een pen, een camera), voor = true tekent dat over de voorste arm
export function speler(c, P, v = {}){
  const kleding = v.kleding || 'tenue', T = LEDEN[kleding] || LEDEN.tenue;
  const hy = P.y ?? opGrond(P) - (P.hoog ?? 0), ox = R(P.x - 21), oy = R(hy - HEUP + (P.dy ?? 0)), hand = P.hand ?? 's';
  const [dx, dy] = P.hd ?? [0, 0], rt = P.richting, achterHand = hand === 's' ? 'S' : 'Q';
  const tat = leesTattoo(v.kapsel) || {r:0, l:0}; // (r = de voorste arm, l = de achterste)
  if (rt === 'voor' || rt === 'achter'){
    const rug = rt === 'achter';
    tekenBeenV(c, ox + 16, oy + HEUP, P.lL, false, T, rug);
    tekenBeenV(c, ox + 26, oy + HEUP, P.lR, true, T, rug);
    c.stamp(rek(rug ? rompRug(kleding, v.patroon || 'strepen', v.nr, v.rugnaam) : romp(kleding, v.patroon || 'strepen')), ox, oy);
    tekenArmV(c, ox + 11, oy + 28, P.aL, -1, achterHand, P.arm, T, false, rug ? tat.r : tat.l);
    tekenArmV(c, ox + 30, oy + 28, P.aR, 1, hand, P.arm, T, true, rug ? tat.l : tat.r);
    if (v.band){ const kx = rug ? ox + 12 : ox + 29; c.rect(kx - 1, oy + 30, 3, 3, '%'); }
    c.stamp(rug ? hoofdRug(v.kapsel || 'model') : hoofd(v.kapsel || 'model', !!v.vrouw, v.snor ? 'snor' : v.baard), ox + dx, oy + dy);
    if (P.bal && v.bal !== false) c.stamp(BAL, R(P.bal[0]) - 5, R(P.bal[1]) - 5, {rot:P.balRot || 0});
    return [ox + 30, oy + 40 + ROMP_EXTRA];
  }
  // vooraanzicht: schouders en heupen links en rechts; zijaanzicht: alles uit één punt (stijlbron)
  const zij = !!P.zij || rt === 'zij';
  const sL = zij ? [21, 28] : [11, 28], sR = zij ? [21, 28] : [30, 28], hL = zij ? [20, HEUP] : [16, HEUP], hR = zij ? [22, HEUP] : [26, HEUP];
  if (P.extra && !P.voor) P.extra(c, {ox, oy, hy});
  tekenArm(c, ox + sL[0], oy + sL[1], P.aL, false, achterHand, P.arm, T, false, tat.l);
  // welke voet staat op de grond? (de laagste, of allebei als ze even laag zijn)
  const vL = oy + hL[1] + beenPunten(0, 0, P.lL).fy, vR = oy + hR[1] + beenPunten(0, 0, P.lR).fy, laag = Math.max(vL, vR);
  tekenBeen(c, ox + hL[0], oy + hL[1], P.lL, false, T, vL >= laag - 1.5);
  tekenBeen(c, ox + hR[0], oy + hR[1], P.lR, true, T, vR >= laag - 1.5);
  c.stamp(rek(zij ? rompZij(kleding, v.patroon || 'strepen') : romp(kleding, v.patroon || 'strepen')), ox, oy);
  c.stamp(zij ? hoofdZij(v.kapsel || 'model', !!v.vrouw, v.snor ? 'snor' : v.baard) : hoofd(v.kapsel || 'model', !!v.vrouw, v.snor ? 'snor' : v.baard), ox + dx, oy + dy);
  const voorHand = tekenArm(c, ox + sR[0], oy + sR[1], P.aR, true, hand, P.arm, T, v.band, tat.r);
  if (P.extra && P.voor) P.extra(c, {ox, oy, hy});
  if (P.bal && v.bal !== false) c.stamp(BAL, R(P.bal[0]) - 5, R(P.bal[1]) - 5, {rot:P.balRot || 0});
  return voorHand;
}


// ---------- inkleuren ----------
// De kleuren van de stijlbron (art/chibi_anims.px.js); 'b'/'B' zijn het wit van de bal (los van het accent van het shirt)
export const ORIGINEEL = {k:'#1a1414', s:'#f7c9a8', S:'#e3a07e', p:'#f19a8f', h:'#b5541c', H:'#7e3410', j:'#dc7a3c', r:'#e0262b', R:'#a3161b', o:'#e0262b', O:'#a3161b',
  w:'#ffffff', W:'#d4d4de', b:'#ffffff', B:'#d4d4de', i:'#ffffff', u:'#2f62d6', U:'#1d3c8f', y:'#ffd21a', Y:'#e39a0c', g:'#1f8a5a', G:'#13603e', q:'#7ed957', Q:'#4fa83a',
  c:'#2a2f3d', C:'#1b1f29', t:'#a3161b',
  // de tegenstander uit de stijlbron (UIT): blauw-geel shirt en blauwe kousen, witte broek, zwart haar, zwarte schoenen (animaties.js: alsUit)
  1:'#2b3f9e', 2:'#1a2563', 3:'#ffd84a', 4:'#d9a91c', 5:'#f4f4f8', 6:'#c4c4d0', 7:'#2a1f1c', 8:'#140e0c', 9:'#4a3a34', 0:'#3a3a44', '!':'#24242c', e:'#3a3f4a', E:'#23262e', m:'#c9ced8', l:'#ffe9a8', a:'#b8650a', A:'#8a4a08', '%':'#ffd21a', // (a/A: de zolen; %: de aanvoerdersband)
  n:'#8a5a2b', N:'#5e3c1c', '_':'#b9805f', '|':'#ffffff', // (|: het kledingmerk op de borst) // (_: de naad tussen de vingers van een donkere hand)
  '=':'#adadb4', '+':'#7c7c86', '&':'#3b3742', $:'#1c2236', '`':'#b3282f'}; // (grijs haar en een brillenmontuur: pixel/leeftijd.js)
const RGB = new Map();
const rgb = hex => { let v = RGB.get(hex); if (!v){ const n = parseInt(hex.slice(1), 16); v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; RGB.set(hex, v); } return v; };
// Een afbeelding met sleutels naar een canvas met kleuren (pal: sleutel -> '#hex'; ontbreekt hij, dan de stijlbron)
export function inkleuren(img, pal = {}){
  const cv = typeof document !== 'undefined' ? document.createElement('canvas') : new OffscreenCanvas(img.w, img.h);
  cv.width = img.w; cv.height = img.h;
  const g = cv.getContext('2d'), id = g.createImageData(img.w, img.h), d = id.data, lut = new Array(128);
  for (let i = 0; i < img.d.length; i++){
    const v = img.d[i]; if (!v) continue;
    let c = lut[v]; if (!c){ const s = String.fromCharCode(v); c = lut[v] = rgb(pal[s] || ORIGINEEL[s] || '#ff00ff'); }
    d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255;
  }
  g.putImageData(id, 0, 0); return cv;
}
