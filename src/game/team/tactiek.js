import { S, mod } from '../../core/state.js';
import { clamp, randInt } from '../../core/utils.js';
import { ATTR, CLUBS, CLUBS_BASIS } from '../../data/gegevens.js';
import { ck } from '../transfers/buitenland.js';

/* ===================== Tactiek ===================== */
// Elke club speelt in een vaste stijl. w: welke eigenschappen daarin tellen, m: welke wedstrijdmomenten je vaker krijgt
export const TACTIEKEN = {
  tikitaka:{n:'Tiki-taka',       d:'Kort combineren, veel balbezit en geduldig zoeken naar de opening.',
    w:{pas:.45, drib:.25, afw:.1, verd:.1, cond:.1}, m:{rand:1.4, diepteBal:1.6, opbouw:1.5, counter:.6, kopduel:.5}},
  lang:    {n:'Lange ballen',    d:'Snel en direct de bal naar voren, koppen en de tweede bal winnen.',
    w:{afw:.3, cond:.3, verd:.2, pas:.2}, m:{kopduel:2, corner:1.5, vrijeTrap:1.3, diepteBal:.6}},
  vleugels:{n:'Via de vleugels', d:'Het veld breed maken, je man uitspelen en voorzetten geven.',
    w:{drib:.35, cond:.3, pas:.25, afw:.1}, m:{eenOpEen:1.3, corner:1.4, kopduel:1.3}},
  bus:     {n:'Parkeer de bus',  d:'Met z\'n allen achter de bal, niets weggeven en hopen op één kans.',
    w:{verd:.45, cond:.3, pas:.15, afw:.1}, m:{verdedigen:2, tackle:1.6, verdCorner:1.5, counter:1.3, rand:.6}},
  counter: {n:'Counteren',       d:'De tegenstander laten komen en bij balwinst in een paar passes voor het doel staan.',
    w:{cond:.35, afw:.25, pas:.25, drib:.15}, m:{counter:2.5, eenOpEen:1.4, diepteBal:1.3, rand:.8}},
};
export const TACTIEK_IDS = Object.keys(TACTIEKEN);
// Kans per tactiek, per oorspronkelijk niveau van de club (0 = Europese top, 5 = jeugd)
const VERDELING = [
  {tikitaka:35, vleugels:30, counter:20, lang:5,  bus:10},
  {tikitaka:25, vleugels:30, counter:25, lang:10, bus:10},
  {tikitaka:15, vleugels:25, counter:25, lang:20, bus:15},
  {tikitaka:10, vleugels:20, counter:25, lang:25, bus:20},
  {tikitaka:5,  vleugels:15, counter:20, lang:35, bus:25},
  {tikitaka:10, vleugels:25, counter:25, lang:25, bus:15},
];
// Vast per club: dezelfde club speelt altijd dezelfde stijl
export function clubTactiek(id){
  const key = String(ck(id)); let h = 2166136261;
  for (let i = 0; i < key.length; i++){ h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  const t = (CLUBS_BASIS[id] ? CLUBS_BASIS[id][0] : CLUBS[id] ? CLUBS[id].t : 2), v = VERDELING[clamp(t, 0, 5)];
  let r = (h >>> 0) % 100;
  for (const k of TACTIEK_IDS){ r -= v[k]; if (r < 0) return k; }
  return 'counter';
}
// Steen-papier-schaar: elke stijl heeft er één waar hij goed tegen werkt
export const WINT_VAN = {counter:'tikitaka', tikitaka:'bus', bus:'vleugels', vleugels:'lang', lang:'counter'};
export const matchup = (wij, zij) => WINT_VAN[wij] === zij ? 1.5 : WINT_VAN[zij] === wij ? -1.5 : 0;

// Inzicht: hoe goed je een stijl begrijpt (0-100). Blijft bewaard, ook als je van club wisselt
export function inzicht(id = clubTactiek(S.sp.club)){
  const sp = S.sp; sp.tactiek = sp.tactiek || {};
  if (sp.tactiek[id] === undefined) sp.tactiek[id] = 20;
  return sp.tactiek[id];
}
export const tactiekEig = (id = clubTactiek(S.sp.club)) => { const w = TACTIEKEN[id].w; let s = 0; for (const k in w) s += w[k] * S.sp.a[k]; return Math.round(s); };
// Hoe goed pas je in het systeem van je club: half je eigenschappen, half je inzicht
export const pasScore = (id = clubTactiek(S.sp.club)) => Math.round(.5 * tactiekEig(id) + .5 * inzicht(id));
export const zwaarste = id => Object.entries(TACTIEKEN[id].w).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => ATTR[k].toLowerCase());
export function erbij(n, id = clubTactiek(S.sp.club)){ const v = inzicht(id); S.sp.tactiek[id] = clamp(v + n, 0, 100); return S.sp.tactiek[id] - v; }
export const TRAIN_FIT = 6;
export function tactiekTraining(){
  const id = clubTactiek(S.sp.club), v = inzicht(id), n = erbij(v >= 70 ? randInt(4, 7) : randInt(8, 12), id);
  mod('fit', -TRAIN_FIT); mod('vert', 2);
  return `Je oefent met de trainer op de ${TACTIEKEN[id].n.toLowerCase()}: looplijnen, wanneer je drukt en waar je moet staan. Inzicht +${n}.`;
}
// Effect op je acties: wie het systeem snapt, staat vaker goed
export function tactiekKans(st){
  const M = S.M; if (!M || M.inter) return 0;
  const id = clubTactiek(S.sp.club), w = TACTIEKEN[id].w[st] || 0;
  return (inzicht(id) - 50) / 500 * (w > .2 ? 1 : .5);
}
export const tactiekMoment = k => { const M = S.M; return M && M.inter ? 1 : TACTIEKEN[clubTactiek(S.sp.club)].m[k] ?? 1; };
