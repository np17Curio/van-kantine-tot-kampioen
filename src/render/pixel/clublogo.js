/* ===================== Het echte clublogo in een pixelscène ===================== */
// In de pixelscènes (contract, persconferentie, opkomst) en de krantenfoto's staat het echte clublogo (data/logos.js) als
// klein pixellogo. Eerst werd het grote logo (met initialen en "SINDS 1900") zacht verkleind: dat gaf een wazige vlek
// met gemengde kleuren. Nu:
//  - de bron is een eenvoudige versie van het logo (data/logos.js pixelLogoSvg): zonder tekst en dunne lijntjes, met een
//    groter symbool (op 12 tot 18 pixels zijn letters toch niet te lezen, alleen ruis);
//  - het wordt 8× zo groot getekend, en elke pixel van het pixellogo krijgt één kleur uit dat vakje (geen gemiddelde):
//    zo blijven het de pure clubkleuren met scherpe randen. Kleuren die weinig voorkomen (het symbool, de rand) tellen
//    zwaarder mee, anders vallen ze tegen de grote vlakken weg;
//  - en net als de rest van de pixelart een donkere omlijning, zodat het logo ook op een witte wand goed te zien is.
import { pixelLogoSvg } from '../../data/logos.js';

const SS = 8; // zo vaak groter tekenen om per pixel de kleur te kiezen
// ---------- de bron: het logo zonder tekst, als <img> (geladen en bewaard per club) ----------
const BRON = new Map(), LADEN = new Map();
const bronURL = id => { const svg = pixelLogoSvg(id); return svg ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) : null; };
export function laadLogoBron(id){
  if (id == null) return Promise.resolve(null);
  if (BRON.has(id)) return Promise.resolve(BRON.get(id));
  if (!LADEN.has(id)) LADEN.set(id, new Promise(ok => {
    const url = bronURL(id); if (!url){ ok(null); return; }
    const im = new Image(); im.onload = () => { BRON.set(id, im); ok(im); }; im.onerror = () => { BRON.set(id, null); ok(null); }; im.src = url;
  }));
  return LADEN.get(id);
}
// (al geladen? dan meteen; anders null, en laadLogoBron(id) laadt hem)
export const logoBron = id => BRON.get(id) || null;
export const logoGeladen = id => id == null || BRON.has(id); // (ook als het laden mislukte: dan niet blijven wachten)

// ---------- het pixellogo ----------
const CACHE = new Map();
export function pixelLogo(img, maat = 12){
  if (!img) return null;
  const sl = img.src + '|' + maat; if (CACHE.has(sl)) return CACHE.get(sl);
  const cv = document.createElement('canvas'); cv.width = maat; cv.height = maat;
  const g = cv.getContext('2d'), m = maat - 2; // (het logo zelf; eromheen 1 pixel voor de omlijning)
  try {
    const N = m * SS, groot = document.createElement('canvas'); groot.width = N; groot.height = N;
    const gg = groot.getContext('2d'); gg.imageSmoothingEnabled = true; gg.imageSmoothingQuality = 'high'; gg.drawImage(img, 0, 0, N, N);
    const p = gg.getImageData(0, 0, N, N).data, sleutel = i => (p[i] >> 4) << 8 | (p[i + 1] >> 4) << 4 | p[i + 2] >> 4;
    // hoe vaak elke kleur in het hele logo voorkomt
    const totaal = new Map(); for (let i = 0; i < p.length; i += 4) if (p[i + 3] >= 128){ const k = sleutel(i); totaal.set(k, (totaal.get(k) || 0) + 1); }
    const uit = g.createImageData(maat, maat), q = uit.data, vol = new Uint8Array(maat * maat);
    for (let py = 0; py < m; py++) for (let px = 0; px < m; px++){
      const tel = new Map(); let n = 0;
      for (let y = py * SS; y < py * SS + SS; y++) for (let x = px * SS; x < px * SS + SS; x++){
        const i = (y * N + x) * 4; if (p[i + 3] < 128) continue; n++;
        const k = sleutel(i), b = tel.get(k);
        if (b){ b.n++; b.r += p[i]; b.g += p[i + 1]; b.b += p[i + 2]; } else tel.set(k, {k, n:1, r:p[i], g:p[i + 1], b:p[i + 2]});
      }
      if (n < SS * SS * .45) continue; // (vooral leeg: doorzichtig)
      let beste = null, bs = 0;
      for (const b of tel.values()){ if (b.n < SS * SS * .2) continue; const sc = b.n / Math.sqrt(totaal.get(b.k)); if (sc > bs){ bs = sc; beste = b; } }
      if (!beste) for (const b of tel.values()) if (!beste || b.n > beste.n) beste = b;
      const o = ((py + 1) * maat + px + 1) * 4; q[o] = beste.r / beste.n; q[o + 1] = beste.g / beste.n; q[o + 2] = beste.b / beste.n; q[o + 3] = 255; vol[(py + 1) * maat + px + 1] = 1;
    }
    // de omlijning: elke lege pixel naast het logo (niet schuin) wordt donker
    for (let y = 0; y < maat; y++) for (let x = 0; x < maat; x++){
      if (vol[y * maat + x]) continue;
      if ((x > 0 && vol[y * maat + x - 1]) || (x < maat - 1 && vol[y * maat + x + 1]) || (y > 0 && vol[(y - 1) * maat + x]) || (y < maat - 1 && vol[(y + 1) * maat + x])){
        const o = (y * maat + x) * 4; q[o] = 0x1d; q[o + 1] = 0x1a; q[o + 2] = 0x22; q[o + 3] = 255; }
    }
    g.putImageData(uit, 0, 0);
  } catch (e){ g.imageSmoothingEnabled = true; g.drawImage(img, 1, 1, m, m); } // (lukt het uitlezen niet: dan zacht verkleind)
  CACHE.set(sl, cv); if (CACHE.size > 60) CACHE.delete(CACHE.keys().next().value);
  return cv;
}
// Het logo op een canvas zetten, binnen een kader (zodat een logo aan de rand van een wand netjes wordt afgekapt)
export function zetLogo(doelCv, logo, x, y, kader){
  if (!logo) return;
  const g = doelCv.getContext('2d'); g.imageSmoothingEnabled = false;
  if (kader){ g.save(); g.beginPath(); g.rect(kader[0], kader[1], kader[2], kader[3]); g.clip(); }
  g.drawImage(logo, x, y);
  if (kader) g.restore();
}
