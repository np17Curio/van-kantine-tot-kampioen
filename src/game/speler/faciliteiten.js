import { S } from '../../core/state.js';
import { clamp } from '../../core/utils.js';
import { CLUBS } from '../../data/gegevens.js';

/* ===================== Trainers en faciliteiten van een club ===================== */
// Bij een betere club word je sneller beter: betere trainers en staf, een sportwetenschapper, betere velden en een gym.
// Hoe sterker de club, hoe hoger de factor op je trainingsvoortgang (game/week.js trainKans). Zonder club train je alleen: trager.
// sterkte 50 → ×0,78 · 60 → ×0,95 · 70 → ×1,12 · 80 → ×1,29 · 88 en hoger → ×1,43 (hooguit ×1,45)
export const faciliteitFactor = c => !c ? .75 : clamp(.95 + ((c.s || 60) - 60) * .017, .75, 1.45);
export function clubGroei(){
  const sp = S && S.sp; if (!sp) return 1;
  if (sp.clubloos) return .75; // (zonder club train je alleen, in het park of de sportschool)
  return faciliteitFactor(CLUBS[sp.club]);
}
// Een woord en een percentage voor op het scherm: "Uitstekend (+18%)"
const NIVEAUS = [[.9, 'Eenvoudig'], [1.02, 'Gemiddeld'], [1.15, 'Goed'], [1.32, 'Uitstekend'], [9, 'Wereldklasse']];
export function faciliteitTekst(f){
  const n = NIVEAUS.find(([grens]) => f < grens)[1], p = Math.round((f - 1) * 100);
  return `${n} (${p >= 0 ? '+' : '−'}${Math.abs(p)}% trainen)`;
}
