import { S, club } from '../core/state.js';
import { ploegen } from './pitch.js';
import { HAAR, HUID } from '../data/uiterlijk.js';
import { STANDAARD, clubTenue } from '../data/tenues.js';

/* ===================== Foto's in de krant ===================== */
// Een artikel met foto heeft <img data-foto="soort">. Na elke weergave wordt de foto gemaakt (3D, in de fotostudio)
// of uit het geheugen gehaald. Zonder WebGL komt er een getekende foto.
export const FOTO_SOORTEN = {
  hattrick:{alt:'met de wedstrijdbal na zijn hattrick', prijs:'de wedstrijdbal'},
  motm:{alt:'met de Man of the Match-trofee', prijs:'de Man of the Match-trofee'},
  svs:{alt:'met de bokaal voor Speler van het Seizoen', prijs:'de bokaal'},
  topscorer:{alt:'met de Gouden Schoen voor de topscorer', prijs:'de Gouden Schoen'},
  portret:{alt:'op de persfoto', prijs:null},
};
const KLAAR = new Map(); let STUDIO = null;

const MUREN = [['#0f1a33', '#c6f432'], ['#1a1030', '#f3c44f'], ['#0d2a22', '#ffffff'], ['#2a0f14', '#f3c44f']];
// Wie staat er op de foto? img.dataset.uit = 'huid,haar,kapsel' (op het startscherm, nog zonder carrière), anders jouw speler
function fotoCtx(img){
  if (img && img.dataset.uit){ const [huid, haar, kapsel] = img.dataset.uit.split(','); return {sleutel:img.dataset.sleutel || 'nieuw', uiterlijk:{huid:+huid, haar:+haar, kapsel}, club:'', muur:'#0f1a33', accent:'#c6f432', tenue:STANDAARD, ...(img.dataset.draai !== undefined ? {draai:+img.dataset.draai} : {})}; }
  const c = club(), [muur, accent] = MUREN[(S.sp.club || 0) % MUREN.length];
  return {sleutel:ploegen().jij, uiterlijk:S.sp.uiterlijk || null, club:c ? c.n : '', muur, accent, tenue:clubTenue(S.sp.club), clubId:S.sp.club};
}
const sleutelVan = (soort, ctx) => [soort, ctx.sleutel, ctx.club, ctx.draai ?? '', ctx.uiterlijk ? ctx.uiterlijk.huid + ctx.uiterlijk.haar + ctx.uiterlijk.kapsel : ''].join('|');
export function foto(soort, img){
  const ctx = fotoCtx(img), key = sleutelVan(soort, ctx);
  if (!KLAAR.has(key)){
    const p = (STUDIO || (STUDIO = import('./fotostudio.js'))).then(m => m.maakFoto(soort, ctx))
      .catch(e => { console.warn('Krantenfoto kon niet in 3D, een tekening in de plaats', e); return null; })
      .then(url => url || getekend(soort, ctx));
    KLAAR.set(key, p);
  }
  return KLAAR.get(key);
}
export function fotoNaRender(){
  document.querySelectorAll('img[data-foto]:not([src])').forEach(img => {
    if (!img.dataset.uit && !(S && S.sp)) return;
    foto(img.dataset.foto, img).then(url => { if (!img.isConnected) return; img.src = url; img.closest('.krantfoto')?.classList.add('klaar'); });
  });
}
// Voor tests: een portret in een opgegeven tenue (bijvoorbeeld om de designs te bekijken)
if (typeof window !== 'undefined') window.__fotoTenue = (tenue, draai) => (STUDIO || (STUDIO = import('./fotostudio.js'))).then(m => m.maakFoto('portret', {sleutel:'t', uiterlijk:{huid:1, haar:1, kapsel:'kort'}, club:'Test', muur:'#0f1a33', accent:'#c6f432', tenue, draai}));
if (typeof window !== 'undefined') window.__foto = (soort, uit, draai) => foto(soort, uit ? {dataset:{uit, sleutel:'test', draai}} : undefined);

// ---------- getekende foto (zonder WebGL) ----------
function getekend(soort, ctx){
  const huid = HUID[ctx.uiterlijk ? ctx.uiterlijk.huid : 1] || HUID[1], haar = HAAR[ctx.uiterlijk ? ctx.uiterlijk.haar : 1] || HAAR[1], kaal = ctx.uiterlijk && ctx.uiterlijk.kapsel === 'kaal';
  const prijs = {
    hattrick:'<circle cx="430" cy="210" r="34" fill="#f4f4f4" stroke="#222" stroke-width="3"/><path d="M430 190l17 12-6 20h-22l-6-20z" fill="#222"/>',
    motm:'<rect x="335" y="300" width="50" height="26" fill="#15161c"/><path d="M340 230h40l-6 40h-28z" fill="#f3c44f"/><rect x="354" y="268" width="12" height="34" fill="#e0b040"/>',
    svs:'<rect x="330" y="100" width="60" height="18" fill="#15161c"/><path d="M318 14h84l-12 62h-60z" fill="#f3c44f"/><rect x="352" y="74" width="16" height="28" fill="#e0b040"/><path d="M318 22c-26 0-26 36 4 40M402 22c26 0 26 36-4 40" fill="none" stroke="#f3c44f" stroke-width="7"/>',
    topscorer:'<rect x="320" y="296" width="80" height="22" fill="#15161c"/><path d="M322 296h76c6-10 0-18-10-20l-26-8-10-26h-30v44z" fill="#f3c44f"/>',
  }[soort] || '';
  const armen = soort === 'svs' ? `<path d="M300 270L326 112M420 270L394 112" stroke="${huid}" stroke-width="22" stroke-linecap="round"/>`
    : soort === 'hattrick' ? `<path d="M300 270l-10 120M420 270l20-50 -10-20" stroke="${huid}" stroke-width="22" stroke-linecap="round" fill="none"/>`
    : soort === 'portret' ? `<path d="M290 280l-6 110M430 280l6 110" stroke="${huid}" stroke-width="22" stroke-linecap="round"/>`
    : `<path d="M300 270l40 40M420 270l-40 40" stroke="${huid}" stroke-width="22" stroke-linecap="round"/>`;
  const naam = ctx.club.replace(/[<&>"]/g, '').toUpperCase().slice(0, 18);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 480"><rect width="720" height="480" fill="${ctx.muur}"/>
    <g fill="${ctx.accent}" opacity=".45" font-family="Arial Narrow,Impact,sans-serif" font-weight="800" font-size="20" text-anchor="middle">${[0, 1, 2, 3, 4].map(r => [-1, 0, 1, 2].map(k => `<text x="${k * 260 + (r % 2 ? 130 : 0) + 130}" y="${r * 100 + 50}" textLength="210" lengthAdjust="spacingAndGlyphs">${naam}</text>`).join('')).join('')}</g>
    <path d="M250 480v-150c0-50 30-80 110-80s110 30 110 80v150z" fill="${(ctx.tenue || STANDAARD).shirt}"/>${armen}
    <rect x="345" y="205" width="30" height="40" fill="${huid}"/><circle cx="360" cy="180" r="50" fill="${huid}"/>${kaal ? '' : `<path d="M310 170c0-40 25-55 50-55s50 15 50 55c-12-20-30-28-50-28s-38 8-50 28z" fill="${haar}"/>`}${prijs}</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
