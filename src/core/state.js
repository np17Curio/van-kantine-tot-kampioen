import { clamp } from './utils.js';
import { BASE, CLUBS, POS, REF } from '../data/gegevens.js';
import { kalmte } from '../game/speler/kalmte.js';
import { willekeurigUiterlijk } from '../data/uiterlijk.js';
import { pers } from '../game/speler/persoonlijkheid.js';

/* ===================== Staat ===================== */
export const VERSIE = 4; // 4: echte competitiegroottes per land (oudere opslag past niet meer)
export let S = null;
export const OPSLAG = 'vtk_carriere_v2';
export function bewaar(){ try { localStorage.setItem(OPSLAG, JSON.stringify(S)); } catch(e){} }
export function laad(){ try { const s = localStorage.getItem(OPSLAG); const d = s ? JSON.parse(s) : null; return d && d.v === VERSIE ? d : null; } catch(e){ return null; } }
export function wis(){ try { localStorage.removeItem(OPSLAG); } catch(e){} }
// Opslag als bestand: om je carrière mee te nemen naar een ander adres of een andere computer
export function exporteer(){ try { if (S) bewaar(); return localStorage.getItem(OPSLAG); } catch(e){ return null; } }
export function importeer(tekst){
  let d; try { d = JSON.parse(tekst); } catch(e){ return {fout:'Dit is geen opslagbestand van het spel.'}; }
  if (!d || typeof d !== 'object' || !d.sp || !d.car) return {fout:'Dit is geen opslagbestand van het spel.'};
  if (d.v !== VERSIE) return {fout:'Dit opslagbestand komt uit een andere versie van het spel.'};
  try { localStorage.setItem(OPSLAG, JSON.stringify(d)); } catch(e){ return {fout:'De browser liet het opslaan niet toe.'}; }
  return {ok:true, naam:d.sp.naam, d};
}

export function ovr(sp){ const w = POS[sp.pos].w; let s = 0; for (const k in w) s += w[k] * sp.a[k]; return Math.round(s); }
export function waarde(sp){
  const age = sp.leeftijd < 23 ? 1.3 : sp.leeftijd < 28 ? 1 : sp.leeftijd < 31 ? .7 : .4;
  return Math.round(Math.pow(1.16, ovr(sp) - 50) * 50000 * age / 1000) * 1000;
}
export const club = () => CLUBS[S.sp.club];
export const seizoenLabel = () => `${S.jaar}/${String((S.jaar + 1) % 100).padStart(2, '0')}`;
export const sterren = p => { const n = clamp(Math.round((p - 64) / 6), 1, 5); return '★'.repeat(n) + '☆'.repeat(5 - n); };
export function gemCijfer(){ const c = S.ss.c; return c.length ? c.reduce((a, b) => a + b, 0) / c.length : null; }
// s: de sterkte van de club; een topclub in de hoogste competitie (een Champions League-club) betaalt anderhalf keer zoveel
export function salarisVoor(t, o, s = 0){ const top = t === 1 && s >= 82 ? 1.5 : 1; return Math.round(Math.max(BASE[t] * .6, BASE[t] * Math.pow(1.05, o - REF[t])) * top / 100) * 100; }
export const salarisLabel = () => 'Salaris/jaar';
export function statWaarde(st){ return st === 'kalm' ? kalmte() : S.sp.a[st]; }
// (vertrouwen van de trainer: de persoonlijkheid bepaalt hoe snel het groeit)
export function mod(k, n){ if (k === 'vert' && n > 0) n *= pers('vert'); S.sp[k] = clamp(S.sp[k] + n, 0, 100); }

export const NIEUW_TMP = () => ({naam:'', pos:'SPITS', geboren:'Nederland', vader:'Nederland', moeder:'Nederland', agentQ:'', leeftijd:15, uiterlijk:willekeurigUiterlijk(), pers:[]});
export let tmp = NIEUW_TMP();
export function setS(v){ S = v; }
export function resetTmp(){ tmp = NIEUW_TMP(); }
