import { S, club, ovr } from '../../core/state.js';
import { pick, randInt, rnd } from '../../core/utils.js';
import { CLUBS, divClubs } from '../../data/gegevens.js';
import { ACHTERNAMEN, stand } from '../competitie/spelers.js';
import { metVoornaam } from '../media/nieuws.js';

/* ===================== Gouden Bal ===================== */
// De beste speler van de wereld. Je strijdt tegen verzonnen wereldsterren die ook ouder worden
export const STER_VOOR = ['Mateo', 'Lucas', 'Kai', 'Rafael', 'Theo', 'Jamal', 'Enzo', 'Viktor', 'Yusuf', 'Leon', 'Andrés', 'Ousmane', 'Marco', 'Dani', 'Ilyas', 'Nico'];
export function nieuweSter(jong){ return {v:pick(STER_VOOR), n:pick(ACHTERNAMEN), club:pick(divClubs(0)), basis:jong ? randInt(58, 70) : randInt(62, 80), lft:jong ? randInt(19, 21) : randInt(20, 31)}; }
export const wereldSterren = () => S.sterren || (S.sterren = Array.from({length:12}, () => nieuweSter(false)));
export function goudenBal(gem){
  const sp = S.sp, t = club().t, st = stand(t), kamp = st[0] === sp.club;
  const f = [1, .55, .3, .15, .08, .03][t];
  const g = S.ss.g + (S.ss.bg || 0), a = S.ss.a + (S.ss.ba || 0);
  const tb = sp.tGB || 0; sp.tGB = 0; // bonus van het WK/EK van afgelopen zomer
  const mijn = S.ss.wed >= 8 && gem !== null ? Math.round(f * ((gem - 6) * 18 + g * 1.3 + a * .8 + (kamp ? 10 : 0) + (S.ss.bekerWinst ? 6 : 0) + (S.ss.clWinst ? 10 : 0) + Math.max(0, ovr(sp) - 70) * .65) + tb) : 0;
  wereldSterren().forEach(x => { if (CLUBS[x.club].t !== 0) x.club = pick(divClubs(0)); });
  const lijst = wereldSterren().map(x => ({naam:metVoornaam(x.v, x.n), club:CLUBS[x.club].n, score:Math.round(x.basis + rnd() * 18 + (stand(0)[0] === x.club ? 8 : 0))}));
  // De jury wil ook wel eens een ander: elke eerder gewonnen Gouden Bal telt licht tegen je mee
  const eerder = S.car.prijzen.filter(p => /^Gouden Bal/.test(p)).length;
  lijst.push({naam:sp.naam, club:club().n, score:mijn ? mijn - Math.min(12, eerder * 3) : 0, jij:true});
  lijst.sort((x, y) => y.score - x.score || (x.jij ? -1 : 1));
  // Sterren worden ouder: beter tot 26, daarna langzaam minder, rond 34 stoppen ze
  S.sterren = wereldSterren().map(x => { x.lft++; if (CLUBS[x.club].t !== 0) x.club = pick(divClubs(0)); x.basis += x.lft < 26 ? randInt(0, 3) : x.lft < 30 ? randInt(-1, 1) : -randInt(2, 4); return x.lft >= 34 || x.basis < 55 ? nieuweSter(true) : x; });
  return {lijst, plek:lijst.findIndex(x => x.jij) + 1, telt:mijn > 0};
}
