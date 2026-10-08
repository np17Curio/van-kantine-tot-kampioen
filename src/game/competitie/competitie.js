import { S, club } from '../../core/state.js';
import { poisson } from '../../core/utils.js';
import { ROUNDS, divClubs } from '../../data/gegevens.js';

/* ===================== Competitie ===================== */
export function fixture(r){
  const t = club().t, lijst = divClubs(t), pos = lijst.indexOf(S.sp.club);
  const pr = ROUNDS[r].find(p => p[0] === pos || p[1] === pos);
  const thuis = pr[0] === pos;
  return {opp: lijst[thuis ? pr[1] : pr[0]], thuis};
}
export function simGoals(sa, sb, thuisA){
  const a = sa + (thuisA ? 2 : 0), b = sb + (thuisA ? 0 : 2);
  return [poisson(1.35 * Math.pow(a / b, 3)), poisson(1.35 * Math.pow(b / a, 3))];
}
export function teamUitslag(id, voor, tegen){
  const e = S.tab[id]; e.g++; e.dv += voor; e.dt += tegen;
  if (voor > tegen){ e.w++; e.pt += 3; } else if (voor === tegen){ e.gl++; e.pt += 1; } else e.v++;
}
