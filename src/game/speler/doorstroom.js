import { S, club, gemCijfer, ovr } from '../../core/state.js';
import { CLUBS, JEUGD } from '../../data/gegevens.js';
import { fmt1 } from './o23.js';

/* ===================== Doorstromen naar het 1e elftal ===================== */
// Duidelijke eisen. Op je 16e moet je meer laten zien dan als je ouder bent
export const DOOR_EIS = lft => lft < 17 ? {klasse:44, cijfer:7.0} : {klasse:42, cijfer:6.5};
export function doorstroomEisen(lft){
  const sp = S.sp, d = DOOR_EIS(lft), g = gemCijfer(), cij = S.ss.wed ? Math.round(g * 10) / 10 : null;
  return [
    {key:'lft', label:'Leeftijd', nodig:16, nu:lft, ok:lft >= 16},
    {key:'klasse', label:'Klasse', nodig:d.klasse, nu:ovr(sp), ok:ovr(sp) >= d.klasse},
    {key:'wed', label:'Wedstrijden', nodig:5, nu:S.ss.wed, ok:S.ss.wed >= 5},
    {key:'cijfer', label:'Gem. cijfer', nodig:d.cijfer, nu:cij, fmt:'cijfer', ok:cij !== null && cij >= d.cijfer}
  ];
}
// Wanneer is je volgende kans, en hoe oud ben je dan?
export function doorstroomDoel(){
  const sp = S.sp, c = club(); if (c.t !== JEUGD || c.ouder === undefined) return null;
  const moment = S.ronde < 7 && sp.leeftijd >= 16 ? 'winterstop' : 'zomer';
  return {moment, lft: moment === 'zomer' ? sp.leeftijd + 1 : sp.leeftijd, ouder:CLUBS[c.ouder]};
}
export const inMoment = m => m === 'zomer' ? 'in de zomer' : 'bij de winterstop';
export function doorstroomAdvies(e){
  const mis = e.filter(x => !x.ok).map(x =>
    x.key === 'lft' ? 'word eerst 16'
    : x.key === 'klasse' ? `train hard tot klasse ${x.nodig} (nu ${x.nu})`
    : x.key === 'wed' ? `speel meer wedstrijden (${x.nu} van de ${x.nodig})`
    : x.nu === null ? `haal gemiddeld een ${fmt1(x.nodig)}` : `haal hogere cijfers (gemiddeld een ${fmt1(x.nodig)} nodig, nu ${fmt1(x.nu)})`);
  if (!mis.length) return 'Je voldoet aan alle eisen. Ga zo door!';
  const lijst = mis.length > 1 ? mis.slice(0, -1).join(', ') + ' en ' + mis[mis.length - 1] : mis[0];
  return 'Wil je naar het 1e? ' + lijst.charAt(0).toUpperCase() + lijst.slice(1) + '.';
}
// Na een O19-wedstrijd: vertelt de jeugdtrainer hoe je ervoor staat
export function o19Check(){
  const sp = S.sp, d = doorstroomDoel(); if (!d) return null;
  const e = doorstroomEisen(d.lft), klaar = e.every(x => x.ok);
  if (klaar && !sp.o19klaar){ sp.o19klaar = true; return `Je jeugdtrainer: "De trainer van het 1e elftal heeft je zien spelen. Als je zo doorgaat, mag je ${inMoment(d.moment)} naar het 1e van ${d.ouder.n}!"`; }
  if (!klaar && sp.o19klaar){ sp.o19klaar = false; return `Je jeugdtrainer: "Let op, je zakt weg. ${doorstroomAdvies(e)}"`; }
  if (!klaar && (S.ronde === 3 || S.ronde === 10)) return `Je jeugdtrainer: "${doorstroomAdvies(e)}"`;
  return null;
}
export function doorstroomUitleg(){
  const d = doorstroomDoel(); if (!d) return null;
  const k = DOOR_EIS(d.lft);
  return `Je jeugdtrainer: "Wil je naar het 1e elftal van ${d.ouder.n}? Dan moet je ${inMoment(d.moment)} minstens 16 zijn, klasse ${k.klasse} hebben en gemiddeld een ${fmt1(k.cijfer)} halen over minstens 5 wedstrijden. In je trainingsweek zie je hoe ver je bent."`;
}
