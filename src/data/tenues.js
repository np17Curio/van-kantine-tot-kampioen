import { CLUBS } from './gegevens.js';
import { merkVoor } from './merken.js';

/* ===================== Tenues van clubs en landen ===================== */
// Een tenue: {shirt, accent, broek, sok, patroon}. Patronen: effen, strepen (verticaal), banen (horizontaal),
// helften, sjerp (diagonaal), blokken (geblokt) en bies (gekleurde schouders en kraag).
// Zonder three.js, zodat het 2D-veld, de foto's en de tests het ook kunnen gebruiken.
export const PATRONEN = ['effen', 'strepen', 'banen', 'helften', 'sjerp', 'blokken', 'bies'];
const K = {rood:'#d42a2a', wit:'#f2f2f2', zwart:'#16171c', blauw:'#1e5bd6', groen:'#1f9d55', geel:'#f5c400', oranje:'#ff7a1a', paars:'#6d2bd1', marine:'#1b2a52', hemel:'#6cb4ee', bordeaux:'#8a1538', goud:'#d4a72c'};
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
// Kleurcombinaties voor clubs zonder kleur in hun naam: [shirt, accent]
const PALET = [['rood', 'wit'], ['blauw', 'wit'], ['wit', 'marine'], ['oranje', 'zwart'], ['paars', 'wit'], ['hemel', 'wit'], ['groen', 'wit'], ['rood', 'zwart'],
  ['blauw', 'zwart'], ['geel', 'zwart'], ['bordeaux', 'hemel'], ['wit', 'rood'], ['zwart', 'goud'], ['marine', 'geel']].map(([a, b]) => [K[a], K[b]]);
const WOORDEN = {rood:'rood', rode:'rood', wit:'wit', witte:'wit', zwart:'zwart', zwarte:'zwart', blauw:'blauw', blauwe:'blauw', groen:'groen', groene:'groen', geel:'geel', gele:'geel', oranje:'oranje', paars:'paars', paarse:'paars'};
const tenue = (shirt, accent, patroon, broek, sok) => ({shirt, accent, patroon, broek:broek || (patroon === 'effen' || patroon === 'bies' ? accent : K.zwart), sok:sok || shirt});
// Elke club een vast tenue, op naam (dezelfde naam = hetzelfde tenue, ook na promotie of in een ander seizoen)
const kaleNaam = n => n.replace(/ O19$/, '').replace(/ Vrouwen$/, '');
export function clubTenue(id){
  const c = CLUBS[id]; if (!c) return tenue(K.wit, K.zwart, 'effen');
  const naam = kaleNaam(c.n);
  // (met het kledingmerk erbij: hoe sterker de club, hoe groter het merk; data/merken.js)
  return {...(uniekeTenues()[naam] || basisTenue(naam)), merk:merkVoor(naam, c.s)};
}
// Elke club een eigen tenue: geen twee clubs met precies dezelfde kleuren en hetzelfde patroon. Botst het tenue van een club
// met dat van een andere, dan krijgt hij (op alfabet, dus altijd hetzelfde) een ander patroon, omgedraaide kleuren of een andere kleurcombinatie
let UNIEK = null, UNIEK_N = 0;
const sleutelVan = t => [t.shirt, t.accent, t.patroon].join(',');
function uniekeTenues(){
  const namen = [...new Set(Object.values(CLUBS).map(c => kaleNaam(c.n)))].sort();
  const sl = namen.join('|'); if (UNIEK && UNIEK_N === sl) return UNIEK; // (een club met een nieuwe naam: opnieuw verdelen)
  UNIEK = {}; UNIEK_N = sl; const bezet = new Set();
  for (const naam of namen){
    const t0 = basisTenue(naam), h = hash('variant|' + naam);
    const kandidaten = [t0, ...PATRONEN.map(p => tenue(t0.shirt, t0.accent, p)), ...PATRONEN.map(p => tenue(t0.accent, t0.shirt, p)),
      ...PALET.flatMap((_, i) => { const [sh, ac] = PALET[(h + i) % PALET.length]; return PATRONEN.map(p => tenue(sh, ac, p)); })];
    const t = kandidaten.find(x => x.shirt !== x.accent && !bezet.has(sleutelVan(x))) || t0;
    bezet.add(sleutelVan(t)); UNIEK[naam] = t;
  }
  return UNIEK;
}
function basisTenue(naam){
  const h = hash('tenue|' + naam);
  const kleuren = (naam.toLowerCase().match(/[a-zë]+/g) || []).map(w => WOORDEN[w]).filter(Boolean);
  const pat = PATRONEN[(h >>> 5) % PATRONEN.length];
  if (kleuren.length >= 2) return tenue(K[kleuren[0]], K[kleuren[1]], pat === 'effen' ? 'strepen' : pat);
  if (kleuren.length === 1){ const k1 = K[kleuren[0]]; return tenue(k1, k1 === K.wit || k1 === K.geel ? K.zwart : K.wit, pat); }
  const [shirt, accent] = PALET[h % PALET.length];
  return tenue(shirt, accent, pat);
}
// Landen in hun echte kleuren
const LAND = {
  Nederland:[K.oranje, K.wit, 'effen', K.wit, K.oranje], 'België':[K.rood, K.zwart, 'bies', K.zwart, K.rood], Duitsland:[K.wit, K.zwart, 'bies', K.zwart, K.wit],
  Frankrijk:[K.marine, K.wit, 'effen', K.wit, K.rood], Spanje:[K.rood, K.goud, 'bies', K.marine, K.zwart], Engeland:[K.wit, K.marine, 'effen', K.marine, K.wit],
  Portugal:['#a51c30', K.groen, 'bies', K.groen, '#a51c30'], 'Italië':[K.blauw, K.wit, 'effen', K.wit, K.blauw], 'Brazilië':[K.geel, K.groen, 'bies', K.blauw, K.wit],
  'Argentinië':[K.hemel, K.wit, 'strepen', K.zwart, K.wit], 'Kroatië':[K.rood, K.wit, 'blokken', K.wit, K.blauw], Marokko:[K.rood, K.groen, 'bies', K.groen, K.rood],
  Turkije:[K.rood, K.wit, 'effen', K.wit, K.rood], Senegal:[K.wit, K.groen, 'bies', K.wit, K.wit], Japan:[K.marine, K.wit, 'effen', K.marine, K.marine],
  Polen:[K.wit, K.rood, 'helften', K.rood, K.wit], Nigeria:[K.groen, K.wit, 'sjerp', K.groen, K.groen], Ghana:[K.wit, K.zwart, 'bies', K.wit, K.wit],
  'Kaapverdië':[K.blauw, K.wit, 'banen', K.blauw, K.blauw], 'Curaçao':[K.blauw, K.geel, 'bies', K.blauw, K.blauw], Suriname:[K.groen, K.wit, 'bies', K.wit, K.groen],
  'Indonesië':[K.rood, K.wit, 'helften', K.wit, K.rood], 'Tsjechië':[K.rood, K.wit, 'bies', K.blauw, K.rood], Griekenland:[K.blauw, K.wit, 'effen', K.wit, K.blauw],
  Denemarken:[K.rood, K.wit, 'effen', K.wit, K.rood], Noorwegen:[K.rood, K.wit, 'bies', K.wit, K.marine], Zwitserland:[K.rood, K.wit, 'effen', K.rood, K.rood],
  Mexico:[K.groen, K.wit, 'bies', K.wit, K.rood], 'Verenigde Staten':[K.wit, K.marine, 'effen', K.marine, K.wit],
};
export function landTenue(naam){
  const merk = merkVoor('land|' + naam, 74 + hash('landmerk|' + naam) % 12); // (een land speelt altijd bij een groot merk)
  const l = LAND[naam]; if (l) return {...tenue(...l), merk};
  const [shirt, accent] = PALET[hash('land|' + naam) % PALET.length]; return {...tenue(shirt, accent, 'effen'), merk};
}
// Uittenue: de kleuren omgedraaid (of wit/donker als dat te veel op elkaar lijkt)
export function uitTenue(t){
  const nieuwShirt = kleurAfstand(t.accent, t.shirt) > 120 ? t.accent : licht(t.shirt) ? K.marine : K.wit;
  const accent = nieuwShirt === t.accent ? t.shirt : t.accent;
  return {shirt:nieuwShirt, accent, patroon:t.patroon === 'blokken' || t.patroon === 'strepen' ? 'effen' : t.patroon, broek:nieuwShirt, sok:nieuwShirt, merk:t.merk};
}
const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export function kleurAfstand(a, b){ const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b), rm = (r1 + r2) / 2;
  return Math.sqrt((2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2); }
const licht = h => { const [r, g, b] = rgb(h); return r * .299 + g * .587 + b * .114 > 150; };
// Hoe een tenue van ver oogt: shirt en accent tellen allebei mee (een rood-wit gestreept shirt is niet "rood")
const lijkt = (a, b) => kleurAfstand(a.shirt, b.shirt) < 140 || (a.patroon !== 'effen' && a.patroon !== 'bies' && kleurAfstand(a.accent, b.shirt) < 90 && kleurAfstand(a.shirt, b.accent) < 90);
const KEEPER = ['#7a3fd6', '#2fd35a', '#ff8a1a', '#16171c', '#f5e400', '#e04fb0', '#18c2c2'];
// Alle tenues voor een wedstrijd: thuis en uit, twee keepers en de scheidsrechter
export function wedstrijdTenues(wij, zij, thuis = true){
  if (lijkt(wij, zij)){ if (thuis) zij = uitTenue(zij); else wij = uitTenue(wij); }
  if (lijkt(wij, zij)) zij = {...zij, shirt:licht(wij.shirt) ? K.zwart : K.wit, patroon:'effen', sok:licht(wij.shirt) ? K.zwart : K.wit};
  const keeper = (eigen, al = []) => { const ver = c => Math.min(...[wij.shirt, zij.shirt, wij.accent, zij.accent, ...al].map(x => kleurAfstand(c, x))); const k = [...KEEPER].sort((a, b) => ver(b) - ver(a))[0]; return {shirt:k, accent:K.zwart, patroon:'effen', broek:K.zwart, sok:k}; };
  const kWij = keeper(wij), kZij = keeper(zij, [kWij.shirt]);
  return {wij, zij, k:kWij, K:kZij, R:{shirt:'#15161c', accent:'#15161c', patroon:'effen', broek:'#15161c', sok:'#15161c'}};
}
export const STANDAARD = tenue('#c6f432', '#141720', 'effen', '#141720', '#c6f432'); // het portret op het startscherm (nog geen club)
