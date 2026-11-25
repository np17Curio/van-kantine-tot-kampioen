import { clamp } from './utils.js';
import { BASE, CLUBS, POS, REF, attrNaam } from '../data/gegevens.js';
import { kalmte } from '../game/speler/kalmte.js';
import { willekeurigUiterlijk } from '../data/uiterlijk.js';
import { pers } from '../game/speler/persoonlijkheid.js';
import { geldF } from '../data/gegevens.js';

/* ===================== Staat ===================== */
export const VERSIE = 4; // 4: echte competitiegroottes per land (oudere opslag past niet meer)
export let S = null;
export const OPSLAG = 'vtk_carriere_v2';
// Meerdere carrières: 5 opslagplekken. Plek 1 is de oude sleutel (zo blijft een bestaande carrière gewoon werken)
export const SLOTS = 5;
export const slotSleutel = i => i > 1 ? `${OPSLAG}_s${i}` : OPSLAG;
let savesCache = null;
// Een korte samenvatting in de opslag zelf, voor het overzicht op het startscherm
function kop(){ const sp = S.sp, T = S.trainer, c = CLUBS[sp.club];
  return {naam:sp.naam, club:c ? c.n : '', leeftijd:sp.leeftijd, seizoen:seizoenLabel(), rol:T && !T.gestopt ? (T.o23 ? 'Trainer O23' : 'Trainer') : S.eigenaar && !S.eigenaar.gestopt ? 'Clubeigenaar' : (POS[sp.pos] || {n:''}).n, einde:S.fase === 'einde', land:S.land || 'Nederland'}; }
export function bewaar(){ try { if (S.sp) S.kop = kop(); localStorage.setItem(slotSleutel(S.slot || 1), JSON.stringify(S)); savesCache = null; } catch(e){} }
export function laad(slot = 1){ try { const s = localStorage.getItem(slotSleutel(slot)); const d = s ? JSON.parse(s) : null; if (d && d.v === VERSIE){ d.slot = slot; return d; } return null; } catch(e){ return null; } }
export function wis(slot = (S && S.slot) || 1){ try { localStorage.removeItem(slotSleutel(slot)); } catch(e){} savesCache = null; }
// Alle opslagplekken: bezet (met samenvatting) of leeg
export function saves(){
  if (savesCache) return savesCache;
  const l = [];
  for (let i = 1; i <= SLOTS; i++){ const d = laad(i); l.push(d ? {slot:i, ...(d.kop || {naam:d.sp.naam, club:'', leeftijd:d.sp.leeftijd, seizoen:'', rol:(POS[d.sp.pos] || {n:''}).n})} : {slot:i, leeg:true}); }
  return (savesCache = l);
}
export const vrijeSlot = () => (saves().find(x => x.leeg) || {}).slot || null;
// Opslag als bestand: om je carrière mee te nemen naar een ander adres of een andere computer
export function exporteer(){ try { if (S) bewaar(); return localStorage.getItem(slotSleutel((S && S.slot) || 1)); } catch(e){ return null; } }
export function importeer(tekst){
  let d; try { d = JSON.parse(tekst); } catch(e){ return {fout:'Dit is geen opslagbestand van het spel.'}; }
  if (!d || typeof d !== 'object' || !d.sp || !d.car) return {fout:'Dit is geen opslagbestand van het spel.'};
  if (d.v !== VERSIE) return {fout:'Dit opslagbestand komt uit een andere versie van het spel.'};
  const slot = (S && S.slot) || vrijeSlot() || 1; d.slot = slot; // (een geladen bestand vervangt de huidige carrière, of komt op een vrije plek)
  try { localStorage.setItem(slotSleutel(slot), JSON.stringify(d)); } catch(e){ return {fout:'De browser liet het opslaan niet toe.'}; }
  savesCache = null;
  return {ok:true, naam:d.sp.naam, d, slot};
}

// De naam van een eigenschap voor jouw positie (een keeper heeft eigen namen)
export const attr = k => attrNaam(k, S && S.sp && S.sp.pos);
export function ovr(sp){ const w = POS[sp.pos].w; let s = 0; for (const k in w) s += w[k] * sp.a[k]; return Math.round(s); }
// Marktwaarde zoals in het echte voetbal (ongeveer de bedragen van Transfermarkt per niveau): een speler van klasse 70 is een
// paar miljoen waard, klasse 80 zo'n 20 miljoen, klasse 88 rond de 90 miljoen en een wereldster van 92 gaat voor 150 tot 200 miljoen.
// [klasse, waarde]; daartussen loopt het geleidelijk op (logaritmisch)
const WAARDE_PUNTEN = [[35, 2e3], [45, 1e4], [50, 25e3], [55, 8e4], [60, 25e4], [65, 8e5], [70, 2.5e6], [75, 7e6], [80, 2e7], [84, 4.5e7], [88, 9e7], [92, 1.6e8], [95, 2.2e8], [99, 3e8]];
// Geleidelijk (logaritmisch) tussen de punten van een tabel [[klasse, bedrag]]
function tussen(P, k){
  if (k <= P[0][0]) return P[0][1]; if (k >= P[P.length - 1][0]) return P[P.length - 1][1];
  for (let i = 1; i < P.length; i++) if (k <= P[i][0]){ const [k0, w0] = P[i - 1], [k1, w1] = P[i], f = (k - k0) / (k1 - k0); return Math.exp(Math.log(w0) + (Math.log(w1) - Math.log(w0)) * f); }
  return P[P.length - 1][1];
}
export const waardeVoorKlasse = k => tussen(WAARDE_PUNTEN, k);
// Netjes afronden: miljoenen op een ton, daaronder op duizenden
export const rondSom = v => v >= 1e6 ? Math.round(v / 1e5) * 1e5 : Math.round(v / 1e3) * 1e3;
export function waarde(sp){
  const o = ovr(sp), l = sp.leeftijd, pot = sp.pot ?? o;
  // Jong talent: een koper betaalt ook voor wat je nog kunt worden. Na je 30e zakt je waarde snel
  const k = l < 24 ? o + Math.max(0, pot - o) * (l <= 19 ? .45 : l <= 21 ? .35 : .2) : o;
  const leeftijd = l < 21 ? 1.2 : l < 24 ? 1.1 : l < 28 ? 1 : l < 30 ? .8 : l < 31 ? .65 : l < 33 ? .45 : .25;
  const contract = sp.contract === 1 ? .75 : 1; // (nog één jaar contract: je club moet verkopen, anders ben je volgend jaar gratis weg)
  return rondSom(waardeVoorKlasse(k) * leeftijd * contract * geldF());
}
// Hoeveel een club voor een speler kan betalen: een topclub in de hoogste competitie honderden miljoenen, een kleine club in de
// tweede divisie een paar ton. c = {t, s} (ook een buitenlandse club)
export function koopkracht(c){
  if (!c) return Infinity;
  return waardeVoorKlasse((c.s || 60) + 4) * (c.t <= 1 ? 1 : c.t === 2 ? .3 : .12) * geldF();
}
// De transfersom die een club voor jou biedt: je marktwaarde (met wat speling), maar nooit meer dan de club kan betalen
export const somVoor = (sp, c, f = 1) => rondSom(Math.min(waarde(sp) * f, koopkracht(c)));
export const club = () => CLUBS[S.sp.club];
export const seizoenLabel = () => `${S.jaar}/${String((S.jaar + 1) % 100).padStart(2, '0')}`;
export const sterren = p => { const n = clamp(Math.round((p - 64) / 6), 1, 5); return '★'.repeat(n) + '☆'.repeat(5 - n); };
export function gemCijfer(){ const c = S.ss.c; return c.length ? c.reduce((a, b) => a + b, 0) / c.length : null; }
// s: de sterkte van de club; een topclub in de hoogste competitie (een Champions League-club) betaalt anderhalf keer zoveel
// Salaris per jaar zoals in het echte voetbal: hangt af van hoe goed je bent én van hoe rijk de club is (sterkte s).
// Een basisspeler in de tweede divisie verdient een paar ton nog niet, een vaste waarde bij een topclub in de Eredivisie een paar
// miljoen, en een wereldster bij een Europese topclub 20 tot 30 miljoen. [klasse, jaarsalaris bij een club van dat niveau]
const LOON_PUNTEN = [[40, 12e3], [50, 25e3], [55, 45e3], [60, 8e4], [65, 1.8e5], [70, 4.5e5], [75, 1e6], [80, 2.2e6], [84, 4.5e6], [88, 1.05e7], [92, 2.5e7], [95, 3.5e7], [99, 5e7]];
export const loonVoorKlasse = k => tussen(LOON_PUNTEN, k);
export function salarisVoor(t, o, s = 0){
  const club = s || o, lager = t >= 2 ? .7 : 1; // (een lagere divisie betaalt minder, ook voor dezelfde speler)
  const v = Math.exp(.6 * Math.log(loonVoorKlasse(o)) + .4 * Math.log(loonVoorKlasse(club + 3))) * lager; // (60% jij, 40% de rijkdom van de club)
  return Math.round(Math.max(12000, v) * geldF() / 100) * 100; // (vrouwenvoetbal: geldF)
}
export const salarisLabel = () => 'Salaris/jaar';
export function statWaarde(st){ return st === 'kalm' ? kalmte() : S.sp.a[st]; }
// (vertrouwen van de trainer: de persoonlijkheid bepaalt hoe snel het groeit)
export function mod(k, n){ if (k === 'vert' && n > 0) n *= pers('vert'); S.sp[k] = clamp(S.sp[k] + n, 0, 100); }

export const NIEUW_TMP = () => ({naam:'', pos:'SPITS', geboren:'Nederland', vader:'Nederland', moeder:'Nederland', agentQ:'', leeftijd:15, uiterlijk:willekeurigUiterlijk(), pers:[]});
export let tmp = NIEUW_TMP();
export function setS(v){ S = v; }
export function resetTmp(){ tmp = NIEUW_TMP(); }
