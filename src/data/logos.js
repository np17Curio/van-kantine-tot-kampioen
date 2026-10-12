import { CLUBS } from './gegevens.js';
import { clubTenue, kleurAfstand } from './tenues.js';

/* ===================== Clublogo's ===================== */
// Elk club een eigen logo (inline SVG), gemaakt uit de naam en de clubkleuren: een vorm, een achtergrond in het design
// van het tenue, een symbool dat bij de naam past (een molen voor Molenburg, een koe voor Koeienwei) en de initialen.
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c]));
// Vormen in een vak van 100 bij 100
const VORMEN = {
  schild:'M12 8 H88 V48 C88 72 70 87 50 95 C30 87 12 72 12 48 Z',
  rond:'M50 4 A46 46 0 1 1 49.9 4 Z',
  wapen:'M10 10 L30 5 L50 11 L70 5 L90 10 V50 C90 74 70 88 50 96 C30 88 10 74 10 50 Z',
  ruit:'M50 3 L97 50 L50 97 L3 50 Z',
  lint:'M50 6 A40 40 0 1 1 49.9 6 Z',
};
export const VORM_NAMEN = Object.keys(VORMEN);
// Symbolen rond (0,0), ongeveer 30 bij 30. k = kleur van het symbool
const SYMBOLEN = {
  bal: k => `<circle r="12" fill="none" stroke="${k}" stroke-width="3"/><path d="M0-5L5-1.5 3 4.5H-3L-5-1.5Z" fill="${k}"/><path d="M0-5V-12M5-1.5L11.5-4M3 4.5L7 10M-3 4.5L-7 10M-5-1.5L-11.5-4" stroke="${k}" stroke-width="2"/>`,
  ster: k => `<path d="M0-14L3.5-4.5H13.5L5.5 1.5L8.5 11L0 5.5L-8.5 11L-5.5 1.5L-13.5-4.5H-3.5Z" fill="${k}"/>`,
  kroon: k => `<path d="M-14 9V-6L-7 2L0-11L7 2L14-6V9Z" fill="${k}"/><rect x="-14" y="10" width="28" height="4" fill="${k}"/>`,
  molen: k => `<path d="M-4 14L-2.5-1H2.5L4 14Z" fill="${k}"/><path d="M-12-15L12 9M12-15L-12 9" stroke="${k}" stroke-width="4.5" stroke-linecap="round"/><circle cy="-3" r="2.6" fill="${k}"/>`,
  golf: k => `<path d="M-15-4q3.75-6 7.5 0t7.5 0t7.5 0t7.5 0M-15 5q3.75-6 7.5 0t7.5 0t7.5 0t7.5 0" fill="none" stroke="${k}" stroke-width="3.2" stroke-linecap="round"/><path d="M-15 12H15" stroke="${k}" stroke-width="3"/>`,
  anker: k => `<circle cy="-11" r="3" fill="none" stroke="${k}" stroke-width="2.6"/><path d="M0-8V13M-8-3H8M-12 3Q-11 13 0 13Q11 13 12 3" fill="none" stroke="${k}" stroke-width="3" stroke-linecap="round"/>`,
  bloem: k => `${[0, 72, 144, 216, 288].map(a => `<circle cx="${(Math.cos(a * Math.PI / 180) * 7.5).toFixed(1)}" cy="${(Math.sin(a * Math.PI / 180) * 7.5 - 2).toFixed(1)}" r="5.5" fill="${k}"/>`).join('')}<circle cy="-2" r="3" fill="none" stroke="${k}" stroke-width="2"/><path d="M0 6V15" stroke="${k}" stroke-width="2.5"/>`,
  koe: (k, plaat) => `<path d="M-11-9Q-17-16-9-15M11-9Q17-16 9-15" fill="none" stroke="${k}" stroke-width="3" stroke-linecap="round"/><ellipse cx="-13" cy="-4" rx="4.5" ry="2.5" fill="${k}"/><ellipse cx="13" cy="-4" rx="4.5" ry="2.5" fill="${k}"/><path d="M-9-10H9Q11 0 8 5Q7 13 0 13Q-7 13-8 5Q-11 0-9-10Z" fill="${k}"/><circle cx="-4" cy="-3" r="1.8" fill="${plaat}"/><circle cx="4" cy="-3" r="1.8" fill="${plaat}"/><ellipse cy="7" rx="6" ry="4" fill="${plaat}" opacity=".55"/><circle cx="-2.5" cy="7" r="1.2" fill="${k}"/><circle cx="2.5" cy="7" r="1.2" fill="${k}"/>`,
  klomp: k => `<path d="M-15 7Q-15-5-4-6H4Q13-6 15 6Q11 12 0 12H-11Q-15 12-15 7Z" fill="${k}"/>`,
  bier: k => `<rect x="-10" y="-7" width="15" height="20" rx="2" fill="${k}"/><path d="M5-2H9Q13-2 13 3V6Q13 10 9 10H5" fill="none" stroke="${k}" stroke-width="3"/><circle cx="-7" cy="-9" r="4" fill="${k}"/><circle cx="-1" cy="-11" r="4.5" fill="${k}"/><circle cx="4" cy="-9" r="3.5" fill="${k}"/>`,
  druppel: k => `<path d="M0-15C8-3 10 3 10 5A10 10 0 0 1-10 5C-10 3-8-3 0-15Z" fill="${k}"/>`,
  brug: k => `<path d="M-15 4H15M-15 4Q0-16 15 4M-8 4V-5M0 4V-7M8 4V-5" fill="none" stroke="${k}" stroke-width="3"/><path d="M-15 9H15" stroke="${k}" stroke-width="3"/>`,
  helm: k => `<path d="M-11 12V-1A11 11 0 0 1 11-1V12H4V3H-4V12Z" fill="${k}"/><path d="M-6-11Q0-19 6-11" fill="none" stroke="${k}" stroke-width="3.5"/>`,
  bliksem: k => `<path d="M3-15L-9 2H0L-4 15L10-3H1Z" fill="${k}"/>`,
  klaver: k => `<circle cx="-6" cy="-3" r="6" fill="${k}"/><circle cx="6" cy="-3" r="6" fill="${k}"/><circle cy="-11" r="6" fill="${k}"/><path d="M0 0Q1 9 6 14" fill="none" stroke="${k}" stroke-width="2.5"/>`,
  zon: k => `<circle r="7" fill="${k}"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180); return `<path d="M${(c * 10).toFixed(1)} ${(s * 10).toFixed(1)}L${(c * 15).toFixed(1)} ${(s * 15).toFixed(1)}" stroke="${k}" stroke-width="2.6" stroke-linecap="round"/>`; }).join('')}`,
  toren: k => `<path d="M-9 14V-6H-9V-13H-5V-9H-2V-13H2V-9H5V-13H9V-6V14Z" fill="${k}"/>`,
  boom: k => `<rect x="-2" y="2" width="4" height="13" fill="${k}"/><circle cy="-6" r="9" fill="${k}"/><circle cx="-7" cy="0" r="5.5" fill="${k}"/><circle cx="7" cy="0" r="5.5" fill="${k}"/>`,
  lauwer: k => `<path d="M-4 13Q-15 5-12-12M4 13Q15 5 12-12" fill="none" stroke="${k}" stroke-width="2"/>${[-1, 1].map(z => [0, 1, 2, 3].map(i => `<ellipse cx="${z * (11 - i * .6)}" cy="${8 - i * 6}" rx="2.2" ry="4" transform="rotate(${z * (35 - i * 10)} ${z * (11 - i * .6)} ${8 - i * 6})" fill="${k}"/>`).join('')).join('')}`,
};
export const SYMBOOL_NAMEN = Object.keys(SYMBOLEN);
// Welk symbool hoort bij de naam?
// (de specifieke woorden eerst, zodat niet bijna elke club golven krijgt)
const WOORD_SYMBOOL = [[/sparta|achilles|hercules/i, 'helm'], [/quick|dynamo|rapid/i, 'bliksem'], [/molen|polder/i, 'molen'], [/koe/i, 'koe'], [/klomp/i, 'klomp'], [/bier|kantine|bitterbal|zaterdag/i, 'bier'],
  [/regen/i, 'druppel'], [/brug/i, 'brug'], [/haven|harbour|havn|zout|kreek/i, 'anker'], [/klaproos|heide/i, 'bloem'], [/real|victoria|royal/i, 'kroon'], [/celtic/i, 'klaver'],
  [/lumi|soleil|alvor|lage/i, 'zon'], [/grens|stein|wacht|kravets/i, 'toren'], [/linden|gras|wei|hoeve/i, 'boom'], [/fortuna|union|olymp/i, 'lauwer'], [/dijk|wadden|zee|duin|vliet|modder/i, 'golf']];
const VOORVOEGSEL = /^(FC|VV|SV|SC|AC|RKSV|ASV)$/;
export function initialen(naam){
  const w = naam.replace(/ O19$/, '').split(/[\s-]+/).filter(Boolean);
  return w.map(x => VOORVOEGSEL.test(x) ? x : /^[a-z]/.test(x) ? '' : x[0]).join('').slice(0, 5);
}
export function logoOnderdelen(id){
  const c = CLUBS[id]; if (!c) return null;
  const naam = c.n.replace(/ O19$/, ''), h = hash('logo|' + naam), t = clubTenue(id);
  const symbool = (WOORD_SYMBOOL.find(([r]) => r.test(naam)) || [null, ['ster', 'bal', 'ster', 'kroon', 'bliksem'][h % 5]])[1];
  return {naam, vorm:VORM_NAMEN[(h >>> 3) % VORM_NAMEN.length], symbool, ini:initialen(naam), jaar:1890 + (h >>> 9) % 116, t};
}
const cache = {};
export function clubLogo(id, maat = 28){
  const key = id + '|' + maat + '|' + (CLUBS[id] ? CLUBS[id].n : ''); if (cache[key]) return cache[key];
  const o = logoOnderdelen(id); if (!o) return '';
  const {t, vorm, symbool, ini, jaar} = o, d = VORMEN[vorm], cid = 'lg' + id + 'x' + maat;
  const wit = '#f6f6f6', donker = '#15161c', licht = c => { const n = parseInt(c.slice(1), 16); return ((n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114) > 150; };
  const rand = kleurAfstand(t.accent, t.shirt) > 90 ? t.accent : licht(t.shirt) ? donker : wit;
  // achtergrond in het design van het tenue
  const pat = t.patroon === 'strepen' ? [0, 1, 2, 3, 4].map(i => `<rect x="${10 + i * 20}" y="0" width="10" height="100" fill="${t.accent}"/>`).join('')
    : t.patroon === 'banen' ? [0, 1, 2, 3, 4].map(i => `<rect x="0" y="${8 + i * 20}" width="100" height="10" fill="${t.accent}"/>`).join('')
    : t.patroon === 'helften' ? `<rect x="50" y="0" width="50" height="100" fill="${t.accent}"/>`
    : t.patroon === 'sjerp' ? `<path d="M0 72L72 0H100V12L12 100H0Z" fill="${t.accent}"/>`
    : t.patroon === 'blokken' ? [0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4].map(k => (r + k) % 2 ? `<rect x="${k * 20}" y="${r * 20}" width="20" height="20" fill="${t.accent}"/>` : '').join('')).join('') : '';
  // het symbool op een rond plaatje in de clubkleur, met de initialen eronder
  const plaatKl = t.shirt, symKl = kleurAfstand(t.accent, plaatKl) > 90 ? t.accent : licht(plaatKl) ? donker : wit, tekstKl = licht(t.shirt) && !pat ? donker : wit;
  const groot = maat >= 56, tekst = maat >= 24;
  const lint = vorm === 'lint' ? `<path d="M2 66H98L92 76L98 86H2L8 76Z" fill="${rand}"/><text x="50" y="80.5" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="${ini.length > 3 ? 11 : 13}" fill="${licht(rand) ? donker : wit}">${esc(ini)}</text>` : '';
  const ty = vorm === 'ruit' ? 74 : vorm === 'rond' ? 80 : 79;
  const svg = `<svg class="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${maat}" height="${maat}" role="img" aria-label="Logo van ${esc(o.naam)}">`
    + `<defs><clipPath id="${cid}"><path d="${d}"/></clipPath></defs>`
    + `<path d="${d}" fill="${t.shirt}"/><g clip-path="url(#${cid})">${pat}</g><path d="${d}" fill="none" stroke="${rand}" stroke-width="6"/>`
    + (vorm === 'rond' ? `<circle cx="50" cy="50" r="38" fill="none" stroke="${rand}" stroke-width="2"/>` : '')
    + `<circle cx="50" cy="${vorm === 'lint' ? 38 : 42}" r="${vorm === 'ruit' ? 18 : 21}" fill="${plaatKl}" stroke="${rand}" stroke-width="3"/>`
    + `<g transform="translate(50 ${vorm === 'lint' ? 38 : 42}) scale(${vorm === 'ruit' ? .95 : 1.05})">${SYMBOLEN[symbool](symKl, plaatKl)}</g>`
    + (tekst && vorm !== 'lint' ? `<text x="50" y="${ty}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="${ini.length > 3 ? 11 : 13}" fill="${tekstKl}" stroke="${t.shirt}" stroke-width="2.5" paint-order="stroke">${esc(ini)}</text>` : '')
    + (tekst ? lint : '')
    + (groot && vorm !== 'ruit' ? `<text x="50" y="${vorm === 'lint' ? 95 : 90}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="6" fill="${tekstKl}" stroke="${t.shirt}" stroke-width="1.5" paint-order="stroke" letter-spacing=".5">SINDS ${jaar}</text>` : '')
    + `</svg>`;
  return cache[key] = svg;
}
// Als data-URL (voor een <img> of om op een canvas te tekenen)
export const logoURL = (id, maat = 128) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(clubLogo(id, maat));
