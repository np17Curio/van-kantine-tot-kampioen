import { S, club, mod } from '../../core/state.js';
import { pick, rnd } from '../../core/utils.js';
import { AANV } from '../../data/gegevens.js';
import { selectie } from '../competitie/spelers.js';
import { statusNiveau } from '../speler/status.js';
import { band, iedereen, zetBand } from './kleedkamer.js';
import { team } from '../../core/geslacht.js';

/* ===================== Aanvoerder ===================== */
export const isAanvoerder = () => statusNiveau() >= AANV && !S.sp.o23;
// Elke week kiest de trainer iemand die slecht traint en iemand die wat stil is
export function kleedPersonen(){
  const w = S.week, groep = selectie(S.sp.club), sel = groep.map(x => x.n);
  // Op de bank zetten kan alleen bij iemand die nu speelt
  if (!w.slecht) w.slecht = pick(groep.filter(x => x.basis).map(x => x.n));
  if (!w.stil){ const r = sel.filter(n => n !== w.slecht).sort((a, b) => band(a) - band(b)); w.stil = r[0]; }
  if (!w.laat) w.laat = pick(sel.filter(n => n !== w.slecht && n !== w.stil));
  return w;
}
export function aanvoerderActie(id){
  const sp = S.sp, w = S.week; if (w.aanv || !isAanvoerder()) return; kleedPersonen(); let t;
  if (id === 'oppeppen'){ w.boost = (w.boost || 0) + 1.5; iedereen(2); mod('moraal', 3); t = 'Je roept iedereen bij elkaar in de kleedkamer: "Dit is ONZE week!" De ' + team.jongens + ' gaan met kippenvel de training op. Het team is opgepept voor de wedstrijd.'; }
  else if (id === 'bank'){ const x = w.slecht;
    if (rnd() < .65 + (sp.vert - 60) / 200){ w.boost = (w.boost || 0) + 1; mod('vert', 2); zetBand(x, -20); iedereen(-1); t = `Je zegt tegen de trainer dat ${x} al weken slecht traint. De trainer luistert en zet ${x} op de bank. ${x} is woest op je. Band met ${x} −20.`; }
    else { mod('vert', -4); zetBand(x, -8); t = `Je vraagt de trainer om ${x} op de bank te zetten. "Ik maak de opstelling, niet jij," zegt hij. En ${x} heeft het ook gehoord. Band met ${x} −8.`; } }
  else if (id === 'opkomen'){ const x = w.stil; zetBand(x, 12); iedereen(1); mod('vert', -1); t = `${x} krijgt veel kritiek. Jij neemt het voor hem op, bij de trainer en in de krant. ${x} vergeet het nooit. Band met ${x} +12.`; }
  else if (id === 'uitje'){ const prijs = teamUitjePrijs(); if (sp.geld < prijs) return; sp.geld -= prijs; iedereen(5); mod('moraal', 5); mod('fit', -4); t = `Je regelt een avond karten en daarna samen eten. Iedereen heeft het erover. Band met de hele groep +5.`; }
  else if (id === 'aanspreken'){ const x = w.laat; zetBand(x, -8); w.boost = (w.boost || 0) + .5; mod('vert', 3); t = `${x} komt voor de derde keer te laat. Jij spreekt hem streng aan, waar iedereen bij is. De groep is weer scherp, maar ${x} is gepikeerd. Band met ${x} −8.`; }
  if (!t) return; w.aanv = id; w.tekst.push(t);
}
export const teamUitjePrijs = () => [8000, 3000, 1500, 600, 200, 100][club().t];
