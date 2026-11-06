import { S, seizoenLabel } from '../../core/state.js';
import { randInt, rnd } from '../../core/utils.js';
import { krantMelding } from '../media/roddel.js';
import { pers } from './persoonlijkheid.js';
import { ik } from '../../core/geslacht.js';

/* ===================== Blessures ===================== */
// Eén lijst blessuresoorten, voor jou en je jeugdvriend. kans: hoe vaak deze soort voorkomt (samen 100),
// wk: hoeveel weken je eruit ligt, blijvend: wat je nooit helemaal terugkrijgt (conditie en talent)
export const BLESSURES = {
  hamstring:{n:'Verrekte hamstring', kort:'hamstring', wk:[2, 4], kans:26},
  enkel:    {n:'Verzwikte enkel', kort:'enkel', wk:[2, 5], kans:25},
  lies:     {n:'Liesblessure', kort:'lies', wk:[3, 6], kans:18},
  meniscus: {n:'Gescheurde meniscus', kort:'meniscus', wk:[6, 10], kans:10},
  voet:     {n:'Gebroken middenvoetsbeentje', kort:'middenvoet', wk:[8, 12], kans:8},
  achilles: {n:'Gescheurde achillespees', kort:'achillespees', wk:[18, 26], kans:5, blijvend:{cond:1}},
  kruisband:{n:'Afgescheurde kruisband', kort:'kruisband', wk:[28, 40], kans:8, blijvend:{cond:2, pot:2}},
};
export const ZWAAR = 6; // vanaf zoveel weken is het een zware blessure (krant, terugkeer-bericht)
export function kiesBlessure(){
  let r = rnd() * Object.values(BLESSURES).reduce((s, b) => s + b.kans, 0);
  for (const [id, b] of Object.entries(BLESSURES)){ r -= b.kans; if (r <= 0) return id; }
  return 'hamstring';
}
// Een blessure in een wedstrijd die je speelde: altijd een kleine kans, groter als je moe bent (en naar je lichaam)
export const KANS_PER_WED = .022;
export const blessureKans = fit => KANS_PER_WED * (fit < 50 ? 1.6 : fit < 70 ? 1.2 : 1) * pers('blessure');

// Jij raakt geblesseerd. Geeft {id, n, wk, blijvend} terug (voor het wedstrijdeinde)
export function blesseer(id = kiesBlessure()){
  const sp = S.sp, B = BLESSURES[id] || BLESSURES.hamstring;
  const wk = Math.max(1, randInt(B.wk[0], B.wk[1]) - (B.wk[1] >= ZWAAR ? 0 : pers('herstel')));
  if (wk <= (sp.blessure || 0)) return null; // al langer geblesseerd
  sp.blessure = wk; sp.blesSoort = {id, n:B.n, kort:B.kort, wk};
  const gevolg = [];
  if (B.blijvend){
    if (B.blijvend.cond && sp.a && sp.a.cond != null){ sp.a.cond = Math.max(1, sp.a.cond - B.blijvend.cond); gevolg.push(`conditie −${B.blijvend.cond}`); }
    if (B.blijvend.pot && sp.pot){ sp.pot = Math.max(40, sp.pot - B.blijvend.pot); gevolg.push(`talent −${B.blijvend.pot}`); }
  }
  const C = S.car; (C.blessures = C.blessures || []).push({id, wk, jaar:S.jaar});
  if (wk >= ZWAAR){
    C.hist.push(`${seizoenLabel()}: ${B.n.toLowerCase()}, ${wk} weken uit`);
    krantMelding(`${sp.naam} ${wk >= 20 ? 'maanden' : 'weken'} uit met ${B.n.toLowerCase()}`, `Een flinke klap voor ${ik.zijn} club: ${sp.naam} ligt naar verwachting ${wk} weken uit.${wk >= 20 ? ' Een lange revalidatie wacht.' : ''}`);
  }
  return {id, n:B.n, wk, gevolg:gevolg.join(', ')};
}
// Na het aftellen: ben je net terug van een zware blessure?
export function terugVanBlessure(){
  const sp = S.sp, b = sp.blesSoort; if (!b || sp.blessure > 0) return null;
  sp.blesSoort = null;
  return b.wk >= ZWAAR ? `Je bent terug na je ${b.kort}blessure! Na ${b.wk} weken sta je weer op het veld.` : null;
}
