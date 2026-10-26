import { S, ovr, attr } from '../../core/state.js';
import { keuzeKnop, knop } from '../../core/ui.js';
import { clamp, esc, geldTxt } from '../../core/utils.js';
import { AANTAL_RONDES, CLUBS, TRAINBAAR } from '../../data/gegevens.js';
import { CLUBLOOS_ACTIES, bodKans, clubsVoorJou, doeClubloos, stopZonderClub, volgendeWeekClubloos } from '../../game/speler/clubloos.js';
import { plafond } from '../../game/week.js';

// De week zonder club: alleen trainen, een proeftraining of je zaakwaarnemer laten bellen, en wachten op een club
export function vClubloos(){
  const sp = S.sp, L = sp.clubloos, w = S.week, kans = Math.round(bodKans() * 100), kand = clubsVoorJou().length;
  const train = TRAINBAAR.map(k => keuzeKnop(`Alleen trainen: ${attr(k).toLowerCase()}`, `<span class="mini"><i style="width:${clamp(sp.a[k], 0, 100)}%"></i></span> ${sp.a[k]} · ${sp.a[k] >= plafond() ? 'plafond bereikt' : 'kleine kans op +1 · fitheid −6'}`, () => doeClubloos('train', k))).join('');
  const overig = Object.entries(CLUBLOOS_ACTIES).map(([id, a]) => keuzeKnop(a.n, a.s, () => doeClubloos(id))).join('');
  return `<div class="verhaal"><span class="label">Zonder club · week ${Math.min(S.ronde + 1, AANTAL_RONDES)}/${AANTAL_RONDES}</span>
      <h2>Je zit zonder club</h2>
      <p>Al ${L.weken} ${L.weken === 1 ? 'week' : 'weken'}, sinds je vertrek bij ${esc(CLUBS[L.vorige].n)}. Je krijgt geen salaris (je hebt nog ${geldTxt(sp.geld)}). De competities gaan zonder jou door.</p>
      <p class="muted">${kand ? `${kand} ${kand === 1 ? 'club zou' : 'clubs zouden'} je kunnen willen (klasse ${ovr(sp)}). Kans dat er deze week een club belt: ongeveer ${kans}%.` : `Met klasse ${ovr(sp)} is er nu geen club die je wil. Train en houd je fit, dan verandert dat.`}</p>
      ${w.tekst.map(t => `<p class="muted">${esc(t)}</p>`).join('')}</div>
    ${w.gedaan ? '' : `<section class="activiteiten"><h3 class="sectiekop">Wat doe je deze week? <span class="niv">1 keuze</span></h3>
      <div class="actgroepen">
      <div class="actgroep"><span class="label">Alleen trainen</span><div class="keuzes">${train}</div></div>
      <div class="actgroep"><span class="label">Een club zoeken</span><div class="keuzes">${overig}</div></div></div></section>`}
    <div class="rij">${knop(w.gedaan ? 'Volgende week' : 'Deze week niets doen, volgende week', volgendeWeekClubloos)}
      ${knop('Stoppen met voetbal', stopZonderClub, 'klein', 'data-bevestig="Dit is het einde van je spelerscarrière. Dit kun je niet terugdraaien." data-ja="Ja, ik stop"')}</div>`;
}
