import { clamp } from './utils.js';
import { AMATEUR, BASE, CLUBS, JEUGD, POS, REF } from '../data/gegevens.js';
import { kalmte } from '../game/speler/kalmte.js';

/* ===================== Staat ===================== */
export const VERSIE = 2;
export let S = null;
export const OPSLAG = 'vtk_carriere_v2';
export function bewaar(){ try { localStorage.setItem(OPSLAG, JSON.stringify(S)); } catch(e){} }
export function laad(){ try { const s = localStorage.getItem(OPSLAG); const d = s ? JSON.parse(s) : null; return d && d.v === VERSIE ? d : null; } catch(e){ return null; } }
export function wis(){ try { localStorage.removeItem(OPSLAG); } catch(e){} }

export function ovr(sp){ const w = POS[sp.pos].w; let s = 0; for (const k in w) s += w[k] * sp.a[k]; return Math.round(s); }
export function waarde(sp){
  if (club().t === JEUGD) return 0;
  const age = sp.leeftijd < 23 ? 1.3 : sp.leeftijd < 28 ? 1 : sp.leeftijd < 31 ? .7 : .4;
  return Math.round(Math.pow(1.16, ovr(sp) - 50) * 50000 * age / 1000) * 1000;
}
export const club = () => CLUBS[S.sp.club];
export const seizoenLabel = () => `${S.jaar}/${String((S.jaar + 1) % 100).padStart(2, '0')}`;
export const sterren = p => { const n = clamp(Math.round((p - 64) / 6), 1, 5); return '★'.repeat(n) + '☆'.repeat(5 - n); };
export function gemCijfer(){ const c = S.ss.c; return c.length ? c.reduce((a, b) => a + b, 0) / c.length : null; }
export function salarisVoor(t, o){ return Math.max(Math.round(BASE[t] * .6), Math.round(BASE[t] * Math.pow(1.05, o - REF[t]) / 100) * 100); }
export const salarisLabel = t => t === JEUGD ? 'Zakgeld/jaar' : t === AMATEUR ? 'Vergoeding/jaar' : 'Salaris/jaar';
export function statWaarde(st){ return st === 'kalm' ? kalmte() : S.sp.a[st]; }
export function mod(k, n){ S.sp[k] = clamp(S.sp[k] + n, 0, 100); }

export const NIEUW_TMP = () => ({naam:'', pos:'SPITS', geboren:'Nederland', vader:'Nederland', moeder:'Nederland', agentQ:''});
export let tmp = NIEUW_TMP();
export function setS(v){ S = v; }
export function resetTmp(){ tmp = NIEUW_TMP(); }
