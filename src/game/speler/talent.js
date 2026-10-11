import { S, ovr } from '../../core/state.js';
import { clamp, rnd } from '../../core/utils.js';
import { krantMelding } from '../media/roddel.js';

/* ===================== Talent dat kan groeien ===================== */
// Je talent (pot) is de verwachting van de scouts. Wie het beter doet dan verwacht, krijgt een hogere verwachting
// en daarmee een hoger plafond. Jong groeit het hard, na je 30e niet meer.
export const POT_MAX = 95;
export const potLimiet = lft => lft <= 27 ? 6 : lft <= 30 ? 2 : 0;
const ster = p => clamp(Math.round((p - 64) / 6), 1, 5); // dezelfde indeling als de talentsterren

// Verhoog het talent (binnen de limiet van dit seizoen). Geeft een tekst terug, of null als er niets bij kon.
export function talentGroei(n, reden){
  const sp = S.sp, ruimte = Math.min(potLimiet(sp.leeftijd) - (sp.potSz || 0), POT_MAX - sp.pot), d = Math.min(n, ruimte);
  if (d <= 0) return null;
  const voor = sp.pot; sp.pot += d; sp.potSz = (sp.potSz || 0) + d;
  if (ster(sp.pot) > ster(voor)) krantMelding(`Scouts zien meer in ${sp.naam}`, `${sp.naam} (${sp.leeftijd}) doet het beter dan iedereen dacht. Scouts stellen hun verwachting flink bij.`);
  return `${reden ? reden + ' ' : ''}Scouts stellen hun verwachting bij: talent ${voor} → ${sp.pot}.`;
}

// Na een wedstrijd: wie aan zijn plafond zit en uitblinkt, laat zien dat er meer in zit
export function talentNaWedstrijd(cijfer){
  const sp = S.sp;
  if (cijfer == null || ovr(sp) < sp.pot) return null;
  if (cijfer >= 9 || (cijfer >= 8 && rnd() < .3)) return talentGroei(1, 'Met dit spel laat je zien dat er meer in je zit.');
  return null;
}

// Einde seizoen: een sterk seizoen en prijzen tillen je talent omhoog
export function talentSeizoen(gem, prijzen){
  let n = gem == null ? 0 : gem >= 7.2 ? 3 : gem >= 6.8 ? 2 : gem >= 6.5 ? 1 : 0;
  n += prijzen;
  return n > 0 ? talentGroei(n, 'Een sterk seizoen.') : null;
}

// Training aan je plafond: soms een doorbraak
export function talentDoorbraak(){
  if (S.sp.leeftijd > 27 || rnd() >= .15) return null;
  return talentGroei(1, 'Je merkt dat je meer kunt dan iedereen dacht.');
}
