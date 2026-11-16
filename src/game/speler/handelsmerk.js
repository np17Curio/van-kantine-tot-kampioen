import { S, seizoenLabel } from '../../core/state.js';
import { esc, pick, rnd } from '../../core/utils.js';
import { krantMelding } from '../media/roddel.js';
import { ik } from '../../core/geslacht.js';

/* ===================== Handelsmerk-trap: je eigen vrije trap ===================== */
// Elke goal uit een vrije trap telt mee in je carrière (S.car.vtg). Na MERK_DREMPEL goals geven de media je trap een naam
// (S.sp.handelsmerk). Vanaf dan heeft elk vrije-trapmoment een extra keuze met die naam (momenten.js), met wat meer kans.
export const MERK_DREMPEL = 5;
const NAMEN = ['De Banaan', 'Het Vallende Blad', 'De Raket', 'De Zwaluw', 'De Boemerang', 'Het Kanon', 'De Duikbom', 'De Knuckleball'];
export const vrijeTrapGoals = () => (S.car && S.car.vtg) || 0;
export const handelsmerk = () => (S && S.sp && S.sp.handelsmerk) || null;
export const merkNaam = () => (handelsmerk() || {}).naam || 'Handelsmerk-trap';
// Een naam uit de lijst, of eentje naar je achternaam ("Van Dijk-krul")
function maakNaam(){
  const delen = String(S.sp.naam || '').trim().split(/\s+/), achter = delen.slice(1).join(' ') || delen[0] || 'Super';
  return rnd() < .4 ? `${achter[0].toUpperCase() + achter.slice(1)}-krul` : pick(NAMEN);
}
// Commentaar als je handelsmerk erin gaat
export function merkTekst(){
  const n = merkNaam();
  return pick([`Daar is ${n} weer! Om de muur heen en in de bovenhoek. De keeper kijkt hem na.`,
    `${n}! Precies zoals op de training: de bal duikt over de muur en valt achter de keeper in.`,
    `Het publiek wist het al toen je de bal neerlegde. ${n}, en binnen!`]);
}
export const merkMisTekst = () => pick([`Je probeert ${merkNaam()}, maar deze keer krult hij net naast.`, `${merkNaam()} gaat over de muur, maar de keeper heeft hem gezien.`]);
// Een goal uit een vrije trap (wedstrijd.js); merk = met je handelsmerk
export function vrijeTrapGoal(M, merk){
  S.car.vtg = (S.car.vtg || 0) + 1;
  const sp = S.sp, m = (M ? M.min : 0) + "'";
  if (merk && sp.handelsmerk) sp.handelsmerk.goals = (sp.handelsmerk.goals || 0) + 1;
  if (sp.handelsmerk || S.car.vtg < MERK_DREMPEL) return;
  const naam = maakNaam();
  sp.handelsmerk = {naam, sinds:seizoenLabel(), goals:0};
  if (M) M.log.push({m, t:`🎯 Je ${S.car.vtg}e goal uit een vrije trap! De media hebben een naam voor je trap: "${naam}".`, k:'info'});
  krantMelding(`${sp.naam} heeft een handelsmerk: "${naam}"`, `Al ${S.car.vtg} keer schoot ${sp.naam} een vrije trap binnen. Keepers zijn gewaarschuwd: als ${ik.hij} achter de bal staat, is het gevaar.`);
}
// In het carrièreoverzicht (stats.js)
export function vHandelsmerk(){
  const h = handelsmerk(), n = vrijeTrapGoals();
  if (!h && !n) return '';
  return `<div class="paneel"><span class="label">Vrije trappen</span>${h ? `<p>🎯 Handelsmerk: <b>${esc(h.naam)}</b> <span class="muted klein-tekst">(sinds ${esc(h.sinds)})</span></p>` : ''}<p class="muted klein-tekst">${n} ${n === 1 ? 'goal' : 'goals'} uit een vrije trap${h ? `, waarvan ${h.goals || 0} met ${esc(h.naam)}` : ` · nog ${MERK_DREMPEL - n} tot je eigen handelsmerk`}.</p></div>`;
}
