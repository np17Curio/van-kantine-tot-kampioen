import { S } from '../../core/state.js';

/* ===================== Je kledingkast: hoe je eruitziet buiten het veld ===================== */
// Wat je draagt op privéfoto's in de krant (uitgaan, op straat, thuis, bij je auto), op het strand, bij persconferenties
// en op het gala of je bruiloft. S.sp.kleding = {uit, pers, jas, broek, pak, das, sport}. Zonder keuze: het spel kiest zelf
// (zoals het altijd deed: een donkere jas met spijkerbroek, het trainingspak van de club bij de pers, een zwart pak op het gala).

// De kleuren in de kledingkast: [naam, hex]
export const KLEUR_KAST = [['Zwart', '#1b1d24'], ['Antraciet', '#34343e'], ['Grijs', '#7c7f8a'], ['Wit', '#eeeef2'], ['Beige', '#c9b48f'], ['Bruin', '#6b4a32'],
  ['Marine', '#1d2a44'], ['Blauw', '#2f62d6'], ['Bordeaux', '#7a1d33'], ['Rood', '#d0312d'], ['Groen', '#2f6b3f'], ['Olijf', '#6b6b3a'], ['Roze', '#e889b5'], ['Geel', '#f2c230']];
export const BROEK_KAST = [['Spijkerblauw', '#4a6fb0'], ['Donkerblauw', '#25365e'], ['Zwart', '#22232a'], ['Grijs', '#6e717c'], ['Beige', '#c9b48f'], ['Wit', '#eeeef2']];
export const DAS_KAST = [['Goud', '#c9a227'], ['Zwart', '#16171c'], ['Wit', '#eeeef2'], ['Rood', '#b3282f'], ['Blauw', '#2f62d6'], ['Groen', '#2f6b3f'], ['Roze', '#e889b5'], ['Bordeaux', '#7a1d33']];
// Wat je aantrekt als je de deur uitgaat, en wat je draagt bij de pers
export const UIT_STIJLEN = [['casual', 'Jas en spijkerbroek'], ['pak', 'Strak in het pak'], ['sport', 'Trainingspak'], ['zomer', 'T-shirt en korte broek']];
export const PERS_STIJLEN = [['club', 'Trainingspak van de club'], ['pak', 'Pak'], ['casual', 'Jas en spijkerbroek'], ['sport', 'Eigen trainingspak']];
const STANDAARD = {uit:'casual', pers:'club', jas:'#34343e', broek:'#4a6fb0', pak:'#1b1d24', das:'#c9a227', sport:'#1d2a44'};

export function mijnKleding(){ const sp = S.sp; if (!sp.kleding) sp.kleding = {}; return sp.kleding; }
export const kledingWaarde = k => ({...STANDAARD, ...(k || {})});
// Iets kiezen in de kledingkast (wat: 'uit', 'pers', 'jas', 'broek', 'pak', 'das' of 'sport')
export function kies(wat, waarde){ if (wat in STANDAARD) mijnKleding()[wat] = waarde; }

const hex2 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const donker = (h, f) => '#' + hex2(h).map(v => Math.round(v * (1 - f)).toString(16).padStart(2, '0')).join('');
const licht = h => { const [r, g, b] = hex2(h); return r * .3 + g * .59 + b * .11 > 150; };
// Wat je aanhebt in een bepaalde stijl: [kleding, tenue, opties] voor lookVan (pixel/atlas.js).
// k = de kledingkast (S.sp.kleding, mag leeg zijn), stijl = 'casual' | 'pak' | 'sport' | 'zomer'
export function outfit(k, stijl){
  const w = kledingWaarde(k);
  if (stijl === 'pak') return ['pak', null, {pak:w.pak, pak2:donker(w.pak, .3), das:w.das}];
  if (stijl === 'sport') return ['training', {shirt:w.sport, accent:licht(w.sport) ? '#16171c' : '#ffffff', patroon:'effen', broek:w.sport, sok:w.sport}, {}];
  if (stijl === 'zomer') return ['tenue', {shirt:w.sport, accent:w.sport, patroon:'effen', broek:w.broek, sok:'#f2f2f2'}, {}];
  // jas en spijkerbroek, met daaronder een wit of zwart shirt (wat het best afsteekt tegen de jas)
  return ['casual', {shirt:'#ffffff', accent:licht(w.jas) ? '#16171c' : '#ffffff', patroon:'effen', broek:w.broek, sok:w.broek},
    {kleuren:{c:w.jas, C:donker(w.jas, .3), e:w.broek, E:donker(w.broek, .3)}}];
}
// Voor een gelegenheid: 'uit' (privéfoto's), 'strand', 'pers' of 'gala' (ook je bruiloft). null = het spel kiest zelf
export function outfitVoor(k, gelegenheid){
  const w = kledingWaarde(k);
  if (!k || !Object.keys(k).length) return null;
  if (gelegenheid === 'strand') return outfit(k, 'zomer');
  if (gelegenheid === 'gala') return outfit(k, 'pak');
  if (gelegenheid === 'pers') return w.pers === 'club' ? null : outfit(k, w.pers);
  return outfit(k, w.uit);
}
// (voor de fotocache: een andere outfit = een nieuwe foto)
export const kledingSleutel = k => k && Object.keys(k).length ? Object.values(kledingWaarde(k)).join(',') : '';
