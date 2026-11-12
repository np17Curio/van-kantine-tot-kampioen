/* ===================== De pixelkrant ===================== */
// Elk krantenartikel als een voorpagina in pixels, naar de stijlbron (art/chibi_anims.px.js, deel 10 'krant'):
// de naam van de krant tussen dubbele lijnen, de datum en de prijs, een rubriek, de kop in grote letters (de laatste
// regel rood), een foto met een zwarte lijst, het onderschrift en het artikel, en een omgevouwen hoek. Een nieuw artikel
// draait het beeld in, zoals in oude films (anim 'krant'). Geen three.js.
import { Doek, Img, inkleuren, sprite } from './rig.js';
import { regelBreedte, tekst, zonderAccent } from './font.js';

export const KW = 200, KH = 272;
const KLEUR = {f:'#efe4cc', F:'#dccdae', k:'#1a1414', L:'#8e8e9a', G:'#55525e', r:'#e0262b', w:'#ffffff', y:'#ffd21a', K:'#0f1424'};
const box = (c, x, y, w, h, k) => { for (let xx = x; xx < x + w; xx++){ c.px(xx, y, k); c.px(xx, y + h - 1, k); } for (let yy = y + 1; yy < y + h - 1; yy++){ c.px(x, yy, k); c.px(x + w - 1, yy, k); } };

// Tekst op hele woorden afbreken tot regels van hoogstens `breed` pixels (in het 3×5-font, met schaal)
export function afbreken(s, breed, scale = 1){
  const regels = []; let r = '';
  for (const w of String(s).split(/\s+/).filter(Boolean)){
    const t = r ? r + ' ' + w : w;
    if (regelBreedte(t, {scale}) <= breed) r = t;
    else { if (r) regels.push(r); let x = w; while (regelBreedte(x, {scale}) > breed) x = x.slice(0, -1); r = x; }
  }
  if (r) regels.push(r);
  return regels;
}
const krap = (regels, n) => regels.length <= n ? regels : [...regels.slice(0, n - 1), regels[n - 1].replace(/\s*\S*$/, '') + '...'];

// De rubriek bij een artikel (het rode label)
export function rubriekVan(item){
  const t = (item.kop + ' ' + item.tekst).toLowerCase(), b = String(item.bron || '').toLowerCase();
  if (/roddel|weekend|privé|prive|story|glossy/.test(b)) return 'RODDEL';
  if (/tekent|transfer|contract|verlengt|haalt .* bij|vertrekt|huur/.test(t)) return 'TRANSFERNIEUWS';
  if (/interland|nationale|oranje|ek |wk |eindtoernooi/.test(t)) return 'INTERLAND';
  return 'SPORT';
}

// De voorpagina. item = {bron, kop, tekst, wanneer, rubriek?, feiten? [[label, waarde], ...], plaats?}
// foto = {cv (canvas 180×72), onder (onderschrift), door} of null. Geeft een canvas van KW breed (de hoogte volgt de inhoud)
export function krantPagina(item, foto = null){
  const BIG = 600, img = new Img(KW, BIG), c = new Doek(img);
  c.rect(0, 0, KW, BIG, 'f');
  // de naam van de krant, datum en prijs
  const bron = zonderAccent(item.bron || 'DE PIXEL KRANT'), groot = regelBreedte(bron, {scale:2}) <= KW - 12;
  tekst(c, KW / 2, groot ? 6 : 10, bron, 'k', {scale:groot ? 2 : 1, align:'c'});
  c.hline(6, 22, KW - 12, 'k'); c.hline(6, 24, KW - 12, 'k');
  tekst(c, 8, 27, zonderAccent(item.wanneer || '').slice(0, 34), 'G'); tekst(c, KW - 8, 27, item.prijs || 'EUR 2.50', 'G', {align:'r'});
  c.hline(6, 33, KW - 12, 'k');
  // rubriek
  const rub = item.rubriek || rubriekVan(item), rb = regelBreedte(rub);
  c.rect(6, 37, rb + 7, 9, 'r'); tekst(c, 9, 39, rub, 'w');
  tekst(c, KW - 8, 39, 'SPORT', 'r', {align:'r'});
  // de kop: groot (drie regels, de laatste rood) of iets kleiner als hij lang is
  const kop = zonderAccent(item.kop || '');
  let regels = afbreken(kop, KW - 12, 3), scale = 3, stap = 20;
  if (regels.length > 3){ regels = krap(afbreken(kop, KW - 12, 2), 4); scale = 2; stap = 14; }
  let y = 52;
  regels.forEach((r, i) => { tekst(c, KW / 2, y, r, scale === 3 && i === regels.length - 1 && regels.length > 1 ? 'r' : 'k', {scale, align:'c'}); y += stap; });
  y += 18 - stap + (scale === 3 ? 0 : 4);
  c.hline(30, y, KW - 60, 'L'); y += 6;
  // de foto met een zwarte lijst (de foto zelf komt er hieronder als plaatje overheen)
  let fotoY = null;
  if (foto && foto.cv){
    c.rect(8, y, 184, 76, 'k'); fotoY = y + 2; y += 78;
    const onder = afbreken(zonderAccent(foto.onder || ''), KW - 16).slice(0, 2);
    onder.forEach(r => { tekst(c, 8, y + 3, r, 'k'); y += 7; });
    tekst(c, 8, y + 3, 'FOTO: ' + zonderAccent(foto.door || 'PIXEL PERS'), 'G'); y += 10;
    c.hline(6, y, KW - 12, 'L'); y += 5;
  }
  // het artikel, met rechts een kader met feiten (als die er zijn)
  const feiten = item.feiten && item.feiten.length ? item.feiten : null, kolom = feiten ? 116 : KW - 16;
  const plaats = zonderAccent(item.plaats || '');
  const lijnen = afbreken((plaats ? plaats + ' - ' : '') + zonderAccent(item.tekst || ''), kolom);
  const y0 = y;
  lijnen.forEach((r, i) => { const eerste = plaats && i === 0; tekst(c, 8, y, r, eerste ? 'k' : 'k'); y += 7; });
  if (feiten){
    const h = 13 + feiten.length * 10, fy = y0 - 1;
    c.rect(130, fy, 64, h, 'w'); box(c, 130, fy, 64, h, 'k'); c.rect(130, fy, 64, 9, 'k');
    tekst(c, 162, fy + 2, item.feitenKop || 'DE DEAL', 'y', {align:'c'});
    feiten.forEach(([l, w], i) => { tekst(c, 134, fy + 13 + i * 10, zonderAccent(l), 'G'); tekst(c, 190, fy + 13 + i * 10, zonderAccent(w), 'k', {align:'r'}); });
    y = Math.max(y, fy + h + 2);
  }
  const H = Math.max(160, Math.min(BIG, y + 6));
  // de omgevouwen hoek
  c.poly([KW - 10, 0, KW, 0, KW, 10], 'F'); c.line(KW - 10, 0, KW, 10, 'L');
  // bijsnijden en inkleuren, dan de foto erin
  const o = new Img(KW, H); o.d.set(img.d.subarray(0, KW * H));
  const cv = inkleuren(o, KLEUR);
  if (fotoY !== null){ const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(foto.cv, 0, 0, 180, 72, 10, fotoY, 180, 72); }
  return cv;
}

// ---------- de stijlbron zelf (om met pxl te vergelijken): _krant met de persfoto uit de contractscène ----------
export function stijlKrant(uitsnede){
  const img = new Img(KW, KH), c = new Doek(img);
  c.rect(0, 0, KW, KH, 'f');
  tekst(c, KW / 2, 6, 'DE PIXEL KRANT', 'k', {scale:2, align:'c'});
  c.hline(6, 22, KW - 12, 'k'); c.hline(6, 24, KW - 12, 'k');
  tekst(c, 8, 27, 'DINSDAG 10 NOVEMBER 2026', 'L'); tekst(c, KW - 8, 27, 'EUR 2.50', 'L', {align:'r'});
  c.hline(6, 33, KW - 12, 'k');
  c.rect(6, 37, 74, 9, 'r'); tekst(c, 9, 39, 'TRANSFERNIEUWS', 'w');
  tekst(c, KW - 8, 39, 'SPORT', 'r', {align:'r'});
  tekst(c, KW / 2, 52, 'DE BOER', 'k', {scale:3, align:'c'}); tekst(c, KW / 2, 72, 'TEKENT BIJ', 'k', {scale:3, align:'c'}); tekst(c, KW / 2, 92, 'ROOD-WIT!', 'r', {scale:3, align:'c'});
  c.hline(30, 110, KW - 60, 'L');
  c.rect(8, 114, 184, 76, 'k');
  tekst(c, 8, 193, 'DE BOER TOONT ZIJN NIEUWE SHIRT MET', 'k'); tekst(c, 8, 200, 'RUGNUMMER 10. FOTO: PIXEL PERS', 'L');
  c.hline(6, 208, KW - 12, 'L');
  tekst(c, 8, 213, 'PIXELSTAD -', 'k');
  [38, 52, 56, 44, 54, 50, 30, 54, 48, 56, 40, 22].forEach((l, i) => c.rect(i < 6 ? 8 : 70, (i < 6 ? 221 : 213) + (i % 6) * 8, l, 2, 'L'));
  c.rect(52, 213, 10, 2, 'L');
  c.rect(130, 212, 64, 52, 'w'); box(c, 130, 212, 64, 52, 'k'); c.rect(130, 212, 64, 9, 'k');
  tekst(c, 162, 214, 'DE DEAL', 'y', {align:'c'});
  [['DUUR', '4 JAAR', 'k'], ['NUMMER', '10', 'k'], ['BEDRAG', '25 MLN', 'k'], ['CLUB', 'ROOD-WIT', 'r']].forEach(([l, w, k], i) => { tekst(c, 134, 225 + i * 10, l, 'L'); tekst(c, 190, 225 + i * 10, w, k, {align:'r'}); });
  c.poly([KW - 10, 0, KW, 0, KW, 10], 'F'); c.line(KW - 10, 0, KW, 10, 'L');
  const cv = inkleuren(img, KLEUR), g = cv.getContext('2d'); g.drawImage(uitsnede, 0, 0, 180, 72, 10, 116, 180, 72);
  return cv;
}

// ---------- indraaien (anim 'krant'): de hoek per beeld, en vrij draaien zoals pxl ----------
export const DRAAI_FRAMES = 24, DRAAI_FPS = 12;
export const draaiHoek = f => { const t = Math.min(1, f / 15); return Math.round(690 * (1 - t) * (1 - t) / 15) * 15; };
// Een canvas met de klok mee draaien (pxl rotateFree: per pixel 4×4 monsters terug in de bron, 5 of meer raak = de meest voorkomende kleur)
const BRON = new WeakMap();
export function draai(cv, deg){
  const d = ((deg % 360) + 360) % 360, w = cv.width, h = cv.height;
  if (d === 0) return cv;
  // de bron als 32-bits pixels (0 = doorzichtig, anders de kleur met volle alfa); per canvas één keer opgehaald
  let src = BRON.get(cv);
  if (!src){ const ruw = new Uint32Array(cv.getContext('2d').getImageData(0, 0, w, h).data.buffer); src = new Uint32Array(w * h);
    for (let i = 0; i < src.length; i++){ const v = ruw[i]; src[i] = (v >>> 24) < 128 ? 0 : (v | 0xff000000) >>> 0; } BRON.set(cv, src); }
  let W, H, uit;
  if (d === 90 || d === 180 || d === 270){
    W = d === 180 ? w : h; H = d === 180 ? h : w; uit = new Uint32Array(W * H);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ const [tx, ty] = d === 90 ? [h - 1 - y, x] : d === 270 ? [y, w - 1 - x] : [w - 1 - x, h - 1 - y]; uit[ty * W + tx] = src[y * w + x]; }
  } else {
    const a = d * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
    W = Math.max(1, Math.ceil(Math.abs(w * cos) + Math.abs(h * sin) - 1e-6)); H = Math.max(1, Math.ceil(Math.abs(w * sin) + Math.abs(h * cos) - 1e-6));
    uit = new Uint32Array(W * H); const cx = w / 2, cy = h / 2, ox = W / 2, oy = H / 2, hits = new Uint32Array(16);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
      let n = 0, gelijk = true;
      for (let k = 0; k < 16; k++){
        const dx = x + ((k & 3) + .5) / 4 - ox, dy = y + ((k >> 2) + .5) / 4 - oy;
        const sx = Math.floor(cx + dx * cos + dy * sin), sy = Math.floor(cy - dx * sin + dy * cos);
        if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
        const c = src[sy * w + sx]; if (c){ if (n && c !== hits[0]) gelijk = false; hits[n++] = c; }
      }
      if (n < 5) continue;
      if (gelijk){ uit[y * W + x] = hits[0]; continue; }   // (meestal: alle monsters dezelfde kleur)
      let best = 0, bestN = 0;   // de meest voorkomende kleur; bij gelijkspel de eerste (zoals pxl)
      for (let k = 0; k < n; k++){ let m = 0; for (let j = 0; j < n; j++) if (hits[j] === hits[k]) m++; if (m > bestN){ bestN = m; best = k; } }
      uit[y * W + x] = hits[best];
    }
  }
  const o = document.createElement('canvas'); o.width = W; o.height = H;
  const g = o.getContext('2d'), id = g.createImageData(W, H);
  new Uint32Array(id.data.buffer).set(uit);
  g.putImageData(id, 0, 0); return o;
}
// Beeld f van het indraaien op een vierkant van `maat` (achtergrond: kleur of doorzichtig). Stil (hoek 0): met schaduw
export function draaiBeeld(pagina, f, maat, achtergrond = null){
  const o = document.createElement('canvas'); o.width = o.height = maat; const g = o.getContext('2d'); g.imageSmoothingEnabled = false;
  if (achtergrond){ g.fillStyle = achtergrond; g.fillRect(0, 0, maat, maat); }
  const hoek = draaiHoek(f), w = pagina.width, h = pagina.height;
  if (hoek === 0){ g.fillStyle = KLEUR.k; g.fillRect(maat / 2 - w / 2 + 4, maat / 2 - h / 2 + 4, w, h); g.drawImage(pagina, maat / 2 - w / 2, maat / 2 - h / 2); }
  else { const r = hoek * Math.PI / 180, bw = Math.abs(w * Math.cos(r)) + Math.abs(h * Math.sin(r)), bh = Math.abs(w * Math.sin(r)) + Math.abs(h * Math.cos(r));
    g.drawImage(draai(pagina, hoek), Math.round(maat / 2 - bw / 2), Math.round(maat / 2 - bh / 2)); }
  return o;
}

// ---------- in het spel: welk artikel hoort bij welke krant op de pagina (vKrant in game/media/nieuws.js) ----------
const REGISTER = new Map(); let VOLG = 0;
export function registreer(item){ const id = 'k' + (++VOLG); REGISTER.set(id, item); if (REGISTER.size > 300) REGISTER.delete(REGISTER.keys().next().value); return id; }
export const krantItem = id => REGISTER.get(id);
