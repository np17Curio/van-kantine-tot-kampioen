import { S, club } from '../../core/state.js';
import { poisson, rnd, shuffle } from '../../core/utils.js';
import { thuisLand } from '../../data/landen.js';
import { divClubs, genRounds, genRoundsOud, rondeInWeek } from '../../data/gegevens.js';

/* ===================== Competitie ===================== */
// Elk seizoen een nieuwe loting: de clubs komen in een geschudde volgorde op de plaatsen van het vaste schema (genRounds),
// en soms worden thuis en uit omgedraaid. Zo speel je niet elk jaar in ronde 1 tegen dezelfde club.
export function loting(t){
  const ss = S.ss, clubs = divClubs(t), sleutel = S.jaar + '|' + thuisLand();
  if (!ss.loting || ss.loting.sleutel !== sleutel) ss.loting = {sleutel, t:{}};
  const l = ss.loting.t[t], zelfde = l && l.lijst.length === clubs.length && clubs.every(i => l.lijst.includes(i));
  if (zelfde) return l;
  // Al begonnen zonder loting (oude opslag): dit seizoen het oude schema houden, zodat er niets door elkaar loopt
  if (S.ronde > 0) return {lijst:clubs, spiegel:false};
  return ss.loting.t[t] = {lijst:shuffle(clubs.slice()), spiegel:rnd() < .5, schema:2};
}
export const speelLijst = t => loting(t).lijst;
// De wedstrijden van ronde r (van die league) als plaatsen [thuis, uit] in speelLijst(t)
// (een seizoen dat nog met het oude schema begon, houdt dat schema tot de zomer)
export const rondeParen = (t, r) => { const l = loting(t), R = (l.schema === 2 ? genRounds : genRoundsOud)(l.lijst.length)[r] || []; return l.spiegel ? R.map(([h, u]) => [u, h]) : R; };
// Jouw wedstrijd in week w (null: je league heeft deze week geen speelronde)
export function fixture(w){
  const t = club().t, r = rondeInWeek(t, w); if (r == null) return null;
  const lijst = speelLijst(t), pos = lijst.indexOf(S.sp.club);
  const pr = rondeParen(t, r).find(p => p[0] === pos || p[1] === pos); if (!pr) return null;
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
