import { S, mod, seizoenLabel } from '../../core/state.js';
import { clamp } from '../../core/utils.js';
import { CLUBS } from '../../data/gegevens.js';
import { fotoVan, KRANTEN } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { social, volgersTxt } from '../prive/social.js';
import { isAanvoerder } from '../team/aanvoerder.js';
import { rugnummer } from '../team/rugnummers.js';
import { ck } from './buitenland.js';

/* ===================== Afscheid van een club waar je veel betekende ===================== */
// Bepaald in wissel() vóór alles op 0 gaat: seizoenen, aanvoerder, records, fans en legendestatus.
// Vanaf 3 punten een afscheid (de eerste week bij je nieuwe club); vanaf 7, of als aanvoerder én clubtopscorer, word je erelegende.
export function clubAfscheid(oudId, hoe){
  const sp = S.sp; if (sp.clubloos || sp.o23 || sp.huur || hoe === 'weg' || hoe === 'geforceerd' || sp.ontbonden) return null;
  const c = CLUBS[oudId], ky = ck(oudId), R = (S.car && S.car.rec) || {}, gebroken = R.gebroken || [];
  const topscorer = gebroken.some(p => p.startsWith(`Clubtopscorer aller tijden van ${c.n}`)), recordspeler = gebroken.some(p => p.startsWith(`Recordspeler van ${c.n}`));
  const comp = gebroken.some(p => p.startsWith('Competitierecord')), aanv = isAanvoerder(), fansNu = (sp.fans || {})[ky] ?? 50, sz = sp.clubSz || 0;
  const punten = sz + (aanv ? 2 : 0) + (topscorer ? 3 : 0) + (recordspeler ? 2 : 0) + (comp && sz >= 1 ? 1 : 0) + (fansNu >= 70 ? 1 : 0) + (sp.legendeHier ? 3 : 0);
  if (punten < 3) return null;
  const wed = (R.clubW && R.clubW[ky]) ?? sp.clubWed ?? 0, g = (R.clubG && R.clubG[ky]) || 0;
  let nr = ''; try { nr = rugnummer() || ''; } catch (e){ nr = ''; }
  const A = {club:c.n, fk:ky, sz, wed, g, aanv, topscorer, recordspeler, nr, legende:sp.legendeHier, ere:false};
  // erelegende: de club eert je bij je vertrek (ook voor een reünie later: bewaarVertrek ziet sp.legendeHier)
  if (!sp.legendeHier && (punten >= 7 || (aanv && topscorer))){
    sp.legendeHier = true; A.ere = true; A.legende = true;
    S.car.prijzen.push(`Clublegende van ${c.n}`); S.car.hist.push(`${seizoenLabel()}: bij zijn afscheid benoemd tot clublegende van ${c.n}`);
    krantMelding(`${c.n} benoemt ${sp.naam} tot clublegende`, `Bij zijn afscheid krijgt hij de hoogste eer van de club. "Zijn naam staat voor altijd in onze geschiedenis."`, KRANTEN[0], fotoVan('portret', `${sp.naam}, clublegende van ${c.n}.`));
  }
  S.car.hist.push(`${seizoenLabel()}: afscheid van ${c.n}, met een ingelijst shirt${nr ? ` met nummer ${nr}` : ''} als cadeau`);
  S.wachtEv = afscheidEvent(A);
  return A;
}
const seiz = n => `${n} ${n === 1 ? 'seizoen' : 'seizoenen'}`;
function afscheidEvent(A){
  const sp = S.sp, rollen = [A.aanv ? 'aanvoerder' : '', A.topscorer ? 'de topscorer aller tijden van de club' : '', A.recordspeler ? 'de speler met de meeste wedstrijden ooit' : '', A.legende && !A.ere ? 'clublegende' : ''].filter(Boolean);
  const oudFans = d => { const f = sp.fans = sp.fans || {}; f[A.fk] = clamp((f[A.fk] ?? 50) + d, 0, 100); };
  const tekst = `Je laatste dag bij ${A.club}. ${seiz(A.sz)}, ${A.wed} wedstrijden, ${A.g} goals.${rollen.length ? ` ${rollen.join(', ').replace(/^./, x => x.toUpperCase())}.` : ''}${A.ere ? ' De club heeft je bij je vertrek tot clublegende benoemd.' : ''} Bij je laatste training staan honderden fans langs het veld. Ze krijgen een ingelijst shirt${A.nr ? ` met nummer ${A.nr}` : ''} van je, jij krijgt er een van hen. Hoe neem je afscheid?`;
  return {soort:'club', tekst, opts:[
    {l:'Een open brief aan de fans', toon:'kalm', f(){ mod('moraal', 6); mod('rep', 2); oudFans(15); krantMelding(`Ontroerende brief van ${sp.naam} aan de fans van ${A.club}`, `"Jullie waren mijn familie. Ik vergeet jullie nooit."`); return `Je brief wordt overal gedeeld. Bij ${A.club} hangt hij straks in de kantine.`; }},
    {l:'Een ererondje bij de laatste thuiswedstrijd', toon:'bal', f(){ mod('moraal', 10); oudFans(10); const n = Math.round(200 + social().volgers * .03); social().volgers += n;
      krantMelding(`Tranen bij ${A.club}: ererondje voor ${sp.naam}`, `Het hele stadion staat op. ${A.wed} wedstrijden en ${A.g} goals, en nu een laatste rondje.`, KRANTEN[0], fotoVan('portret', `${sp.naam} neemt afscheid van de fans van ${A.club}.`)); return `Het hele stadion zingt je naam. Het filmpje gaat de hele wereld rond: +${volgersTxt(n)} volgers.`; }},
    {l:'Stilletjes vertrekken', toon:'fel', f(){ mod('focus', 6); oudFans(-5); return `Je zwaait nog één keer en stapt in de auto. Je hoofd zit al bij je nieuwe club. De fans hadden je graag nog bedankt.`; }}]};
}
