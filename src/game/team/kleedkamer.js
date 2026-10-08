import { S, mod } from '../../core/state.js';
import { clamp, pick, randInt, rnd } from '../../core/utils.js';
import { ATTR, TRAINBAAR } from '../../data/gegevens.js';
import { selectie } from '../competitie/spelers.js';
import { onrust } from '../speler/kalmte.js';
import { ck } from '../transfers/buitenland.js';
import { plafond, verhoog } from '../week.js';

/* ===================== Kleedkamer: je band met teamgenoten ===================== */
export const ROL_NAAM = i => i < 2 ? 'Aanvaller' : i < 6 ? 'Middenvelder' : 'Verdediger';
// Per club een eigen kleedkamer. Bij een nieuwe club begin je opnieuw
export function kleedkamer(){
  const sp = S.sp;
  if (!sp.kleed || sp.kleed.club !== ck(sp.club)){ const rel = {}, oud = (sp.oudeClubs || {})[ck(sp.club)]; selectie(sp.club).forEach(x => rel[x.n] = oud && oud.rel[x.n] !== undefined ? oud.rel[x.n] : clamp(48 + randInt(-12, 12), 0, 100)); sp.kleed = {club:ck(sp.club), rel}; }
  const sel = selectie(sp.club); sel.forEach(x => { if (sp.kleed.rel[x.n] === undefined) sp.kleed.rel[x.n] = 50; });
  return sp.kleed;
}
export const band = naam => kleedkamer().rel[naam] ?? 50;
export function zetBand(naam, d){ const k = kleedkamer(); k.rel[naam] = clamp((k.rel[naam] ?? 50) + d, 0, 100); if (d <= -5) onrust(-d * .5, `Ruzie met ${naam}`); }
export function iedereen(d){ selectie(S.sp.club).forEach(x => zetBand(x.n, d)); }
export const chemie = () => { const r = Object.values(kleedkamer().rel); return r.length ? r.reduce((a, b) => a + b, 0) / r.length : 50; };
export const bandLabel = v => v >= 80 ? ['Maatje', 'r-veilig'] : v >= 60 ? ['Goed', 'r-veilig'] : v >= 40 ? ['Neutraal', 'r-gem'] : v >= 20 ? ['Koel', 'r-riskant'] : ['Vijand', 'r-riskant'];
// Teamsterkte: sfeer in de groep en een opgepept team (aanvoerder) helpen een beetje
export const teamBonus = () => (chemie() - 50) / 25 + ((S.week && S.week.boost) || 0);
export function maatActie(naam, id){
  const sp = S.sp, w = S.week; if (w.maat) return; const x = selectie(sp.club).find(y => y.n === naam); if (!x) return;
  let t;
  if (id === 'praten'){ const d = randInt(4, 9); zetBand(naam, d); t = pick([`Je drinkt na de training een kop koffie met ${naam}. Jullie praten over van alles.`, `${naam} vertelt je over zijn familie. Je leert hem beter kennen.`, `Jij en ${naam} kletsen in de kantine tot de schoonmaker het licht uitdoet.`]) + ` Band +${d}.`; }
  else if (id === 'trainen'){ const d = randInt(7, 11); zetBand(naam, d); mod('fit', -6); const k = pick(TRAINBAAR); const groei = rnd() < .3 && sp.a[k] < plafond(); if (groei) verhoog(k, 1);
    t = `Je blijft met ${naam} na de training om extra te oefenen. Band +${d}.${groei ? ` Je ${ATTR[k].toLowerCase()} gaat +1 omhoog.` : ''}`; }
  else if (id === 'grap'){ if (rnd() < .6){ zetBand(naam, 8); iedereen(1); t = `Je verstopt de schoenen van ${naam} in de vriezer. Hij lacht zich kapot, net als de rest. Band +8.`; }
    else { zetBand(naam, -12); t = `Je grap valt verkeerd bij ${naam}. Hij praat de rest van de week niet tegen je. Band −12.`; } }
  else if (id === 'uitpraten'){ const d = band(naam) < 40 ? randInt(10, 16) : randInt(3, 6); zetBand(naam, d); t = `Je neemt ${naam} apart en jullie praten de spanning uit. Band +${d}.`; }
  if (!t) return; w.maat = naam; w.tekst.push(t);
}
// Elke week: banden zakken langzaam terug richting neutraal
export function kleedWeek(eerste){ if (eerste) return; const k = kleedkamer(); for (const n in k.rel) k.rel[n] += (50 - k.rel[n]) * .03; }
