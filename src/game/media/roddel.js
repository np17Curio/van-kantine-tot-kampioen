import { S, club, seizoenLabel } from '../../core/state.js';
import { pick } from '../../core/utils.js';
import { AANTAL_RONDES } from '../../data/gegevens.js';
import { KRANTEN } from './nieuws.js';
import { isProf } from '../prive/sponsors.js';

/* ===================== Krant buiten de wedstrijden ===================== */
// Transfers komen altijd in de krant. Roddels (stappen, domme dingen) alleen als je prof bent: dan ben je bekend
export const RODDELBLADEN = ['Roddelblad Ster & Schandaal', 'Weekblad Glossy', 'De Sportkrant'];
export function krantMelding(kop, tekst, bronnen, foto){
  const wanneer = S.fase === 'venster' && S.venster ? `${S.venster.soort === 'zomer' ? 'zomerstop' : 'winterstop'}, ${seizoenLabel()}` : `week ${Math.min(S.ronde + 1, AANTAL_RONDES)}, ${seizoenLabel()}`;
  const it = {bron:pick(bronnen || KRANTEN[club().t]), kop, tekst, wanneer, ...(foto ? {foto} : {})};
  (S.krantWacht = S.krantWacht || []).push(it);
  S.nieuws = [it].concat(S.nieuws || []).slice(0, 6);
}
export function roddel(kop, tekst){ if (isProf()) krantMelding(kop, tekst, RODDELBLADEN); }
