/* ===================== Pixelspeler: de chibi-rig ===================== */
// Dezelfde rig als art/chibi_anims.px.js (de stijlbron), maar dan in het spel getekend, zodat elke speler
// zijn eigen huid, haar, kapsel en tenue krijgt. De tekenregels (lijn met ronde kwast, cirkel, vrij draaien,
// omlijning) zijn die van pxl (github.com/uilianks/pxl, MIT), zodat de pixels precies hetzelfde uitkomen.
// Een afbeelding bestaat uit kleursleutels (één letter per pixel); pas bij het inkleuren worden het kleuren.
// Hoeken in graden: 0 = recht naar beneden, + = naar rechts (looprichting), 180 = recht omhoog.
// Geen three.js: ook het startscherm en de krantenfoto's gebruiken dit.

const K = s => s.charCodeAt(0);

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
const HOOFDEN = new Map();
// Gezichtshaar (baard: '', 'geen', 'stoppels', 'snor', 'sikje', 'baard'), in de haarkleur (h, en H voor de schaduw).
// Van voren: gezicht x 10-31, mond y 22; van opzij (zij): gezicht x 15-31, mond x 28-30. De snor van voren is die van
// de eigenaar in de contractscène (stijlbron: _hoofd_baas). true = 'snor' (zo riep de contractscène het al aan).
const baardSoort = b => b === true ? 'snor' : b && b !== 'geen' ? b : '';
function gezichtshaar(c, baard, zij){
  if (!baard) return;
  if (baard === 'stoppels'){
    const [x0, x1] = zij ? [22, 31] : [11, 30];
    for (let y = 21; y <= 24; y++) for (let x = x0; x <= x1; x++) if ((x + y) % 2 === 0 && !(y === 22 && x >= (zij ? 28 : 18) && x <= (zij ? 30 : 22))) c.px(x, y, 'H');
    if (zij) c.px(31, 21, 'H'); else { c.px(18, 21, 'H'); c.px(20, 21, 'H'); c.px(22, 21, 'H'); }
    return;
  }
  if (baard === 'baard'){
    // (met een donkere rand en wat textuur in H: anders valt een lichte baard weg tegen de huid)
    if (zij){ c.rect(22, 20, 10, 5, 'h'); c.rect(22, 16, 2, 4, 'h'); c.vline(22, 16, 9, 'H'); c.hline(22, 24, 10, 'H'); for (let x = 23; x < 32; x += 2) c.px(x, 23, 'H'); c.hline(28, 22, 3, 'k'); }
    else { c.rect(10, 20, 22, 5, 'h'); c.rect(10, 16, 2, 4, 'h'); c.rect(30, 16, 2, 4, 'h'); c.hline(10, 24, 22, 'H'); c.vline(10, 16, 9, 'H'); c.vline(31, 16, 9, 'H'); for (let x = 12; x < 30; x += 2) c.px(x, 23, 'H'); c.hline(18, 22, 5, 'k'); }
  }
  if (zij) c.rect(27, 20, 5, 2, 'H'); else c.rect(17, 20, 8, 2, 'H');   // de snor (ook bij sikje en volle baard)
  if (baard === 'sikje'){ if (zij){ c.rect(28, 23, 4, 2, 'h'); c.hline(28, 24, 4, 'H'); } else { c.rect(18, 23, 5, 2, 'h'); c.hline(18, 24, 5, 'H'); } }
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
    if (vrouw){ c.line(13, 13, 17, 14, 'k', 1); c.line(28, 13, 24, 14, 'k', 1); } // dunnere wenkbrauwen
    else { c.line(12, 12, 17, 14, 'k', 2); c.line(29, 12, 24, 14, 'k', 2); }
    c.rect(13, 15, 4, 4, 'i'); c.rect(15, 16, 2, 3, 'k'); // (oogwit: 'i', los van het accent 'w' van het shirt)
    c.rect(24, 15, 4, 4, 'i'); c.rect(26, 16, 2, 3, 'k');
    if (vrouw){ c.px(12, 15, 'k'); c.px(28, 15, 'k'); } // wimpers
    c.rect(11, 20, 3, 1, 'p'); c.rect(28, 20, 3, 1, 'p');
    c.px(20, 19, 'S');
    if (vrouw){ c.hline(18, 22, 5, 'k'); c.hline(19, 23, 3, 'p'); } else c.hline(18, 22, 5, 'k');
    gezichtshaar(c, baard, false);
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
    c.rect(17, 13, 4, 6, 's'); c.rect(18, 15, 2, 2, 'S'); c.vline(21, 14, 4, 'S'); c.hline(18, 19, 2, 'S'); // oor
    haarZijVoor(c, kapsel); // (de pony raakt neus, kaak en oor niet: bij het kapsel uit de stijlbron blijft elke pixel gelijk)
    if (vrouw) c.line(25, 13, 30, 13, 'k', 1); else c.line(25, 12, 30, 13, 'k', 2);          // wenkbrauw
    c.rect(26, 15, 4, 4, 'i'); c.rect(28, 16, 2, 3, 'k');                                     // oog
    if (vrouw) c.px(30, 15, 'k');                                                              // wimper
    c.rect(23, 20, 3, 1, 'p');                                                                 // blos
    c.hline(28, 22, 3, 'k'); if (vrouw) c.px(29, 23, 'p');                                     // mond
    gezichtshaar(c, baard, true);
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
    const acc = PATROON[patroon] || PATROON.effen;
    for (let x = 12; x < 30; x++) for (let y = 26; y < 36; y++) c.px(x, y, acc(x, y) ? 'w' : 'r');
    for (let x = 27; x < 30; x++) for (let y = 26; y < 36; y++) c.px(x, y, c.is(x, y, 'w') ? 'W' : 'R');
    c.rect(12, 34, 18, 1, 'W');
    c.px(21, 26, 'w'); c.px(20, 27, 'w'); c.px(22, 27, 'w');
    c.rect(12, 35, 18, 5, 'u'); c.rect(12, 39, 18, 1, 'U'); c.rect(20, 37, 1, 3, 'U');
  });
  ROMPEN.set(sl, img); return img;
}
// Van opzij (stijlbron: _romp_zij): shirt x 15-27, de rug in de schaduw, de kraag aan de voorkant
export function rompZij(kleding = 'tenue', patroon = 'strepen'){
  const sl = 'zij|' + kleding + '|' + patroon; if (ROMPEN.has(sl)) return ROMPEN.get(sl);
  const acc = PATROON[patroon] || PATROON.effen;
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
    c.rect(15, 35, 13, 5, 'u'); c.rect(15, 39, 13, 1, 'U');
  });
  ROMPEN.set(sl, img); return img;
}
// Van achteren: geen V-hals; met een rugnummer (cijfers van 3×5 in de accentkleur) als nr is meegegeven
const CIJFERS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
export function rompRug(kleding = 'tenue', patroon = 'strepen', nr = ''){
  const sl = 'rug|' + kleding + '|' + patroon + '|' + nr; if (ROMPEN.has(sl)) return ROMPEN.get(sl);
  const acc = PATROON[patroon] || PATROON.effen;
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
    if (cijfers){
      // het nummer op een vlak in de shirtkleur, zodat het ook op strepen leesbaar is
      const b = cijfers.length * 4 - 1, x0 = 21 - Math.floor(b / 2);
      c.rect(x0 - 1, 27, b + 2, 7, 'r');
      [...cijfers].forEach((d, n) => { const m = CIJFERS[+d]; for (let i = 0; i < 15; i++) if (m[i] === '1') c.px(x0 + n * 4 + (i % 3), 28 + Math.floor(i / 3), 'w'); });
    }
    c.rect(12, 35, 18, 5, 'u'); c.rect(12, 39, 18, 1, 'U');
  });
  ROMPEN.set(sl, img); return img;
}
export const BAL = sprite(11, 11, c => {
  c.circ(5, 5, 5, 'b');
  c.rect(4, 3, 3, 4, 'g'); c.rect(3, 4, 5, 2, 'g');
  c.rect(1, 1, 2, 2, 'G'); c.rect(8, 1, 2, 2, 'G'); c.rect(1, 7, 2, 2, 'G'); c.rect(8, 7, 2, 2, 'G');
  c.px(9, 5, 'B'); c.px(8, 8, 'B'); c.px(5, 10, 'B');
});

// ---------- de rig ----------
export const GROND = 74;               // y van de grond (onderkant schoenen)
export const W = 96, H = 90;
const rad = d => d * Math.PI / 180, R = Math.round;
const L = {boven:6, onder:5, dij:6, scheen:6};
const stap = (x, y, hoek, len) => [x + Math.sin(rad(hoek)) * len, y + Math.cos(rad(hoek)) * len];
function beenPunten(hx, hy, [a, buig]){ const [kx, ky] = stap(hx, hy, a, L.dij), [fx, fy] = stap(kx, ky, a - buig, L.scheen); return {kx, ky, fx, fy}; }
function armPunten(sx, sy, [a, buig], f = 1){ const [ex, ey] = stap(sx, sy, a, L.boven * f), [hx, hy] = stap(ex, ey, a + buig, L.onder * f); return {ex, ey, hx, hy}; }
function dik(c, x0, y0, x1, y1, kleur, b){ c.line(R(x0), R(y0), R(x1), R(y1), 'k', b + 2); c.line(R(x0), R(y0), R(x1), R(y1), kleur, b); }
// Welke sleutels de ledematen per kleding krijgen (stijlbron: de teams THUIS, CASUAL, BAAS). Schoenen: y/Y, zolen: a/A
// (de kleuren zelf komen uit de look: atlas.js lookVan)
const LEDEN = {
  tenue:   {dij:'s', dij2:'S', kous:'o', kous2:'O', mouw:'r', mouw2:'R', onder:'s', onder2:'S'},
  casual:  {dij:'e', dij2:'E', kous:'e', kous2:'E', mouw:'c', mouw2:'C', onder:'c', onder2:'C'},
  pak:     {dij:'c', dij2:'C', kous:'c', kous2:'C', mouw:'c', mouw2:'C', onder:'c', onder2:'C'},
  training:{dij:'u', dij2:'U', kous:'u', kous2:'U', mouw:'r', mouw2:'R', onder:'r', onder2:'R'},
};
// Voetbalschoen, neus naar rechts (stijlbron): enkelrand, wreef, voet met ronde neus, zool. Eerst een zwarte rand rondom
const SCHOEN = [[-2, -1, 1, 'b'], [-1, -2, 3, 'b'], [0, -2, 5, 'b'], [1, -2, 4, 'z']];
export function schoen(c, fx, fy, kleur, zool){
  for (const [dy, x0, x1] of SCHOEN) for (let x = x0; x <= x1; x++) c.rect(fx + x - 1, fy + dy - 1, 3, 3, 'k');
  for (const [dy, x0, x1, deel] of SCHOEN) for (let x = x0; x <= x1; x++) c.px(fx + x, fy + dy, deel === 'z' ? zool : kleur);
  c.px(fx + 4, fy, zool);
}
// Vuist (stijlbron): breder dan de onderarm, met zwarte rand, schaduw rechtsonder en een duim linksboven
const VUIST_DONKER = {s:'S', S:'S', q:'Q', Q:'Q'};
export function vuist(c, x, y, kleur){
  const d = VUIST_DONKER[kleur] || kleur;
  c.circ(x, y, 3, 'k'); c.circ(x, y, 2, kleur);
  c.px(x + 1, y + 2, d); c.px(x + 2, y + 1, d); c.px(x + 2, y + 2, 'k');
  c.px(x - 1, y - 1, d);
}
function tekenBeen(c, hx, hy, pose, voor, T){
  const {kx, ky, fx, fy} = beenPunten(hx, hy, pose);
  dik(c, hx, hy, kx, ky, voor ? T.dij : T.dij2, 4);
  dik(c, kx, ky, fx, fy, voor ? T.kous : T.kous2, 4);
  schoen(c, R(fx), R(fy), voor ? 'y' : 'Y', voor ? 'a' : 'A');
}
function tekenArm(c, sx, sy, pose, voor, hand, f, T, band){
  const {ex, ey, hx, hy} = armPunten(sx, sy, pose, f);
  dik(c, sx, sy, ex, ey, voor ? T.mouw : T.mouw2, 4);
  if (voor && band) c.line(R(sx + (ex - sx) * .55), R(sy + (ey - sy) * .55), R(sx + (ex - sx) * .85), R(sy + (ey - sy) * .85), '%', 4); // aanvoerdersband (stijlbron)
  dik(c, ex, ey, hx, hy, voor ? T.onder : T.onder2, 3);
  vuist(c, R(hx), R(hy), hand);
  return [R(hx), R(hy)];
}
// Van voren of van achteren: dezelfde pose, maar de diepte valt weg. Een knie die naar voren komt wordt zo een korter been,
// een arm die naar voren zwaait een kortere arm. De schoen wijst naar de kijker (of van hem af).
function tekenBeenV(c, hx, hy, pose, voor, T, rug){
  const p = beenPunten(0, 0, pose), ky = hy + p.ky, fy = R(hy + (rug ? p.fy : Math.max(p.fy, p.ky + 2))), x = R(hx);
  dik(c, hx, hy, hx, ky, voor ? T.dij : T.dij2, 4);
  dik(c, hx, ky, hx, fy, voor ? T.kous : T.kous2, 4);
  c.rect(x - 3, fy - 2, 7, 5, 'k'); c.rect(x - 2, fy - 1, 5, 2, voor ? 'y' : 'Y'); c.rect(x - 2, fy + 1, 5, 1, voor ? 'a' : 'A');
}
function tekenArmV(c, sx, sy, pose, kant, hand, f, T, voor){
  const a = armPunten(0, 0, pose, f), ex = sx + kant, hx = sx + kant;
  dik(c, sx, sy, ex, sy + a.ey, voor ? T.mouw : T.mouw2, 4);
  dik(c, ex, sy + a.ey, hx, sy + a.hy, voor ? T.onder : T.onder2, 3);
  vuist(c, R(hx), R(sy + a.hy), hand);
}
export function opGrond(P){ const l = beenPunten(0, 0, P.lL).fy, r = beenPunten(0, 0, P.lR).fy; return GROND - 3 - Math.max(l, r) - 1; }
// Waar zitten heup en hoofd in deze pose (voor ankerpunten: rugnummer, kaart, iets in de hand)
export function punten(P){ const hy = P.y ?? opGrond(P) - (P.hoog ?? 0), ox = R(P.x - 21), oy = R(hy - 39 + (P.dy ?? 0)); return {heup:[P.x, hy], hoofd:[ox + 21 + (P.hd ? P.hd[0] : 0), oy + 12 + (P.hd ? P.hd[1] : 0)], handVoor:(() => { const a = armPunten(ox + 30, oy + 28, P.aR, P.arm); return [a.hx, a.hy]; })()}; }

// De hele speler in pose P. v = {kapsel, vrouw, kleding, patroon, band, nr, snor, baard, bal}. Geeft de plek van de voorste hand terug.
// P (zoals in de stijlbron): x, y of hoog, dy, lL/lR [dij, knie], aL/aR [bovenarm, elleboog], hd [dx, dy], hand ('s' of 'q'), arm (lengte),
// zij (zijaanzicht), bal [x, y], balRot. Extra: richting 'voor'/'achter' (van voren of van achteren), extra(c, o) tekent iets erbij
// (een pen, een camera), voor = true tekent dat over de voorste arm
export function speler(c, P, v = {}){
  const kleding = v.kleding || 'tenue', T = LEDEN[kleding] || LEDEN.tenue;
  const hy = P.y ?? opGrond(P) - (P.hoog ?? 0), ox = R(P.x - 21), oy = R(hy - 39 + (P.dy ?? 0)), hand = P.hand ?? 's';
  const [dx, dy] = P.hd ?? [0, 0], rt = P.richting, achterHand = hand === 's' ? 'S' : 'Q';
  if (rt === 'voor' || rt === 'achter'){
    const rug = rt === 'achter';
    tekenBeenV(c, ox + 16, oy + 39, P.lL, false, T, rug);
    tekenBeenV(c, ox + 26, oy + 39, P.lR, true, T, rug);
    c.stamp(rug ? rompRug(kleding, v.patroon || 'strepen', v.nr) : romp(kleding, v.patroon || 'strepen'), ox, oy);
    tekenArmV(c, ox + 11, oy + 28, P.aL, -1, achterHand, P.arm, T, false);
    tekenArmV(c, ox + 30, oy + 28, P.aR, 1, hand, P.arm, T, true);
    if (v.band){ const kx = rug ? ox + 12 : ox + 29; c.rect(kx - 1, oy + 30, 3, 3, '%'); }
    c.stamp(rug ? hoofdRug(v.kapsel || 'model') : hoofd(v.kapsel || 'model', !!v.vrouw, v.snor ? 'snor' : v.baard), ox + dx, oy + dy);
    if (P.bal && v.bal !== false) c.stamp(BAL, R(P.bal[0]) - 5, R(P.bal[1]) - 5, {rot:P.balRot || 0});
    return [ox + 30, oy + 40];
  }
  // vooraanzicht: schouders en heupen links en rechts; zijaanzicht: alles uit één punt (stijlbron)
  const zij = !!P.zij || rt === 'zij';
  const sL = zij ? [21, 28] : [11, 28], sR = zij ? [21, 28] : [30, 28], hL = zij ? [20, 39] : [16, 39], hR = zij ? [22, 39] : [26, 39];
  if (P.extra && !P.voor) P.extra(c, {ox, oy, hy});
  tekenArm(c, ox + sL[0], oy + sL[1], P.aL, false, achterHand, P.arm, T);
  tekenBeen(c, ox + hL[0], oy + hL[1], P.lL, false, T);
  tekenBeen(c, ox + hR[0], oy + hR[1], P.lR, true, T);
  c.stamp(zij ? rompZij(kleding, v.patroon || 'strepen') : romp(kleding, v.patroon || 'strepen'), ox, oy);
  c.stamp(zij ? hoofdZij(v.kapsel || 'model', !!v.vrouw, v.snor ? 'snor' : v.baard) : hoofd(v.kapsel || 'model', !!v.vrouw, v.snor ? 'snor' : v.baard), ox + dx, oy + dy);
  const voorHand = tekenArm(c, ox + sR[0], oy + sR[1], P.aR, true, hand, P.arm, T, v.band);
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
  n:'#8a5a2b', N:'#5e3c1c'};
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
