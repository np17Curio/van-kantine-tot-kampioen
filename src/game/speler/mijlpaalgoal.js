import { S } from '../../core/state.js';

/* ===================== Mijlpaalgoals: je 1e, 50e en 100e carrièregoal ===================== */
// Na een wedstrijd waarin je zo'n grens passeert, zet dit S.mijlpaalGoal; core/ui.js speelt dan na de wedstrijd de
// pixelscène af (render/mijlpaalscene.js). Elke mijlpaal maar één keer per carrière (S.car.mijlGoal).
// Aanroepen nadat S.car.g al is opgehoogd (records.js recordsNaWedstrijd, nacompetitie.js).
export const GOAL_MIJLPALEN = [1, 50, 100];
export function mijlpaalGoalNaWedstrijd(M){
  if (!S.car || !S.sp || !M || !(M.goals > 0)) return;
  const g = S.car.g || 0, voor = g - M.goals;
  // (een carrière van vóór deze scène: wat je al gehaald had, komt niet alsnog)
  const gehad = S.car.mijlGoal || (S.car.mijlGoal = GOAL_MIJLPALEN.filter(n => n <= voor));
  const nieuw = GOAL_MIJLPALEN.filter(n => n > voor && n <= g && !gehad.includes(n)); if (!nieuw.length) return;
  gehad.push(...nieuw);
  // hoe viel de goal (de laatste eigen goal op het veld): een kopbal, een penalty of een schot
  const a = [...(M.animQ || [])].reverse().find(x => x.goal && !x.tegen && !x.team);
  const soort = !a ? 'schot' : a.soort === 'kop' ? 'kop' : a.soort === 'penalty' || a.variant === 'pen' ? 'pen' : 'schot';
  S.mijlpaalGoal = {n:nieuw[nieuw.length - 1], zij:M.zij || '', clubId:S.sp.club, soort};
}
