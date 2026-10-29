import { S } from '../../core/state.js';
import { clamp, rnd } from '../../core/utils.js';
import { AANTAL_RONDES, CLUBS } from '../../data/gegevens.js';
import { buitenWeek } from '../prive/buiten-week.js';
import { familieWeek } from '../prive/familie.js';
import { relatieWeek } from '../prive/gezin.js';
import { woning, woningMoraal } from '../prive/wonen-auto.js';
import { geldF } from '../../data/gegevens.js';

/* ===================== Trainer: je privéleven gaat gewoon door ===================== */
// Je salaris als trainer: hangt af van de league en je naam. Bij een O23 een bescheiden jeugdtrainerssalaris
const BASIS = [40e6, 6e6, 1.2e6, 250e3, 25e3, 5e3];
export function trainerSalaris(){
  const T0 = S.trainer; if (T0.o23) return Math.round(60000 * geldF());
  return Math.round(BASIS[CLUBS[T0.club].t] * geldF() * .06 * (.7 + (T0.rep || 0) / 100) / 1000) * 1000;
}
// Elke week: salaris, huur, je relatie, familie, dieren, aandelen, je zaak en je merken (net als toen je speelde)
export function trainerPriveWeek(){
  const sp = S.sp, T0 = S.trainer;
  S.weekNr = (S.weekNr || 0) + 1;
  S.week = {gedaan:true, tekst:[], school:null, trainer:true};
  if (!T0.salaris) T0.salaris = trainerSalaris();
  sp.geld += T0.salaris / AANTAL_RONDES;
  const huur = woning().huur;
  if (huur){ if (sp.geld >= huur) sp.geld -= huur; else { sp.woning = 'ouders'; if (sp.relatie) sp.relatie.samen = false; S.week.tekst.push('Je kunt de huur niet meer betalen. Je trekt tijdelijk bij familie in.'); } }
  sp.moraal = clamp(sp.moraal + (60 - sp.moraal) * .08 + woningMoraal() + (sp.relatie ? 1 : 0) + ((sp.kinderen || []).length ? 1 : 0), 0, 100);
  if (sp.relatie) sp.relatie.weken++;
  relatieWeek(false); buitenWeek(false); familieWeek(false);
  if (sp.relatie && sp.relatie.band < 25 && rnd() < .3) S.week.tekst.push(`${sp.relatie.naam} vindt dat je alleen nog maar met voetbal bezig bent.`);
  if (S.wachtEv){ S.ev = S.wachtEv; S.wachtEv = null; S.fase = 'event'; }
}
