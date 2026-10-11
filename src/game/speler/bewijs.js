import { S, club, gemCijfer, mod, seizoenLabel } from '../../core/state.js';
import { clamp } from '../../core/utils.js';
import { krantMelding } from '../media/roddel.js';
import { fmt1 } from './o23.js';
import { talentGroei } from './talent.js';

/* ===================== Proefcontract: de laatbloeier moet zich bewijzen ===================== */
// Wie op zijn 23e begint, krijgt een proefcontract. Tot de winterstop moet hij genoeg spelen en goede cijfers halen.
export const BEWIJS = {wed:5, cijfer:6.6};
export const heeftProef = () => !!(S.sp.bewijs && S.sp.bewijs.klaar === null);
export function bewijsEisen(){
  const g = gemCijfer(), cij = S.ss.wed ? Math.round(g * 10) / 10 : null;
  return [
    {key:'wed', label:'Wedstrijden gespeeld', nodig:BEWIJS.wed, nu:S.ss.wed, ok:S.ss.wed >= BEWIJS.wed},
    {key:'cijfer', label:'Gem. cijfer', nodig:BEWIJS.cijfer, nu:cij, fmt:'cijfer', ok:cij !== null && cij >= BEWIJS.cijfer},
  ];
}
export function bewijsAdvies(e){
  const mis = e.filter(x => !x.ok).map(x => x.key === 'wed' ? `speel nog ${x.nodig - x.nu} ${x.nodig - x.nu === 1 ? 'wedstrijd' : 'wedstrijden'}` : x.nu === null ? `haal gemiddeld een ${fmt1(x.nodig)}` : `haal hogere cijfers (gemiddeld een ${fmt1(x.nodig)} nodig, nu ${fmt1(x.nu)})`);
  if (!mis.length) return 'Je voldoet aan alle eisen. Houd dit vast tot de winterstop!';
  const lijst = mis.length > 1 ? mis.slice(0, -1).join(', ') + ' en ' + mis[mis.length - 1] : mis[0];
  return 'Tot de winterstop: ' + lijst + '. Haal je het niet, dan moet je weg.';
}
// Bij de winterstop: gehaald of niet?
export function bewijsAfrekening(){
  const sp = S.sp; if (!heeftProef()) return null;
  const ok = bewijsEisen().every(x => x.ok), c = club().n;
  sp.bewijs.klaar = ok;
  if (ok){
    sp.bewijs.talent = talentGroei(4, 'De laatbloeier is ontdekt.');
    mod('vert', 15); mod('moraal', 10); sp.status = clamp(sp.status + 10, 0, 100); sp.contract = (sp.contract || 0) + 1;
    S.car.hist.push(`${seizoenLabel()}: proefcontract omgezet in een vast contract bij ${c}`);
    krantMelding(`Laatbloeier ${sp.naam} verdient een vast contract`, `${c} is overtuigd: ${sp.naam} (${sp.leeftijd}) krijgt er een jaar bij. "Hij heeft zich dubbel en dwars bewezen," zegt de trainer. Ook scouts kijken nu met andere ogen naar de laatbloeier.`);
  } else {
    mod('vert', -15); mod('moraal', -8);
    S.car.hist.push(`${seizoenLabel()}: proeftijd bij ${c} niet gehaald`);
    krantMelding(`Proeftijd mislukt: ${c} laat ${sp.naam} gaan`, `De trainer is niet overtuigd. "We hebben hem een eerlijke kans gegeven, maar het niveau is te hoog." ${sp.naam} moet een nieuwe club zoeken.`);
  }
  return ok;
}
