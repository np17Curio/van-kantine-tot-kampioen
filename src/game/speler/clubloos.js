import { S, club, mod, ovr, salarisVoor, seizoenLabel } from '../../core/state.js';
import { clamp, pick, rnd } from '../../core/utils.js';
import { AMATEUR, ATTR, CLUBS, DIVS, JEUGD } from '../../data/gegevens.js';
import { naWedstrijd } from '../competitie/beker.js';
import { speelRonde } from '../competitie/spelers.js';
import { krantMelding } from '../media/roddel.js';
import { stoppen } from '../seizoen/seizoen.js';
import { wilJou, wissel } from '../transfers/transfers.js';
import { bewaarVertrek } from '../wedstrijd/reunie.js';
import { plafond, trainKans, verhoog } from '../week.js';

/* ===================== Zonder club ===================== */
// Je contract liep af (of je werd weggestuurd) en geen club wilde je hebben. Je traint alleen, de competities gaan
// gewoon door, en elke week kan er een club bellen. sp.club blijft naar je vorige club wijzen (zodat club() werkt);
// overal waar het telt kijkt het spel naar sp.clubloos.
export const isClubloos = () => !!(S && S.sp && S.sp.clubloos);
export function wordClubloos(hoe){
  const sp = S.sp, oud = sp.club;
  bewaarVertrek(oud, hoe === 'weg' ? 'weg' : 'vrij', false);
  sp.clubloos = {sinds:S.jaar, weken:0, vorige:oud, bel:0};
  sp.salaris = 0; sp.contract = 0; sp.transferlijst = false; sp.transferWens = false; sp.clausule = null;
  sp.o23 = null; sp.huur = null;
  sp.clubWed = 0; sp.clubSz = 0; sp.legendeHier = false; sp.status = 0; sp.statusNiveau = 0;
  S.car.hist.push(`${seizoenLabel()}: zonder club (${hoe === 'weg' ? 'weggestuurd' : 'contract niet verlengd'} bij ${CLUBS[oud].n})`);
  if (CLUBS[oud].t <= 3) krantMelding(`${sp.naam} zit zonder club`, `Na zijn vertrek bij ${CLUBS[oud].n} heeft zich nog geen enkele club gemeld.`);
  S.verhuisTekst = `Je zit zonder club. Je traint voortaan alleen en wacht tot er een club belt. Houd je fit: een club wil geen speler die uit vorm is.`;
}
// Clubs die je nu een contract zouden geven: van het niveau van je vorige club of lager, en die je goed genoeg vinden
export function clubsVoorJou(marge = 5){
  const sp = S.sp, t = club().t === JEUGD ? AMATEUR : club().t;
  return CLUBS.map((c, i) => i).filter(i => i !== sp.club && CLUBS[i].t >= t && CLUBS[i].t <= AMATEUR && wilJou(i, marge));
}
// Kans dat er deze week een club belt
export function bodKans(){
  const L = S.sp.clubloos; if (!L) return 0;
  return clamp(.12 + (L.bel ? .15 : 0) + L.weken * .02 + (S.sp.fit < 60 ? -.06 : 0), .04, .6);
}
function bodVan(i){
  const c = CLUBS[i], o = ovr(S.sp);
  return {club:i, salaris:Math.round(salarisVoor(c.t, o, c.s) * .8 / 100) * 100, jaren:1, som:0};
}
function bodEvent(i, inleiding){
  const sp = S.sp, c = CLUBS[i], bod = bodVan(i);
  return {soort:'transfer', tekst:`${inleiding} ${c.n} (${DIVS[c.t]}) biedt je een contract voor 1 jaar: ${bod.salaris.toLocaleString('nl-NL')} euro per jaar. Teken je?`, opts:[
    {l:`Tekenen bij ${c.n}`, f(){ return wissel(bod, 'vrij'); }},
    {l:'Nee, ik wacht op iets beters', f(){ mod('moraal', -2); return `Je slaat het aanbod van ${c.n} af. Hopelijk belt er snel een andere club.`; }}]};
}
// Wat je deze week doet
export const CLUBLOOS_ACTIES = {
  conditie:{n:'Conditie op peil houden', s:'Hardlopen en krachttraining: je blijft fit'},
  rust:{n:'Rust nemen', s:'Even niets: je benen en je hoofd herstellen'},
  proef:{n:'Proeftraining aanvragen', s:'Een week meetrainen bij een club: overtuig je de trainer?'},
  bellen:{n:'Zaakwaarnemer laten rondbellen', s:'Meer kans dat er volgende week een club belt'},
};
export function doeClubloos(soort, attr){
  const sp = S.sp, w = S.week, L = sp.clubloos; if (!L || w.gedaan) return;
  let t, ev = null;
  if (soort === 'train'){
    mod('fit', -6);
    if (sp.a[attr] >= plafond()) t = `Je traint in je eentje op ${ATTR[attr].toLowerCase()}, maar je zit aan je plafond (${plafond()}).`;
    else if (rnd() < trainKans() * .6){ const voor = sp.a[attr]; verhoog(attr, 1); t = `Je traint in je eentje op ${ATTR[attr].toLowerCase()} op een leeg veldje. Het lukt: ${voor} → ${sp.a[attr]}.`; }
    else t = `Je traint in je eentje op ${ATTR[attr].toLowerCase()}. Zonder trainer en teamgenoten is het lastig om beter te worden.`;
  } else if (soort === 'conditie'){
    mod('fit', 12); mod('moraal', 1);
    t = 'Je loopt elke ochtend tien kilometer en gaat naar de sportschool. Als er een club belt, ben je er klaar voor.';
  } else if (soort === 'rust'){
    mod('fit', 6); mod('moraal', 5);
    t = 'Je neemt een week rust. Even geen voetbal: je ziet vrienden en familie.';
  } else if (soort === 'proef'){
    const goed = clubsVoorJou(3), alle = clubsVoorJou(12), i = goed.length && rnd() < .7 ? pick(goed) : alle.length ? pick(alle) : null;
    if (i === null) t = 'Je zaakwaarnemer probeert een proeftraining te regelen, maar geen enkele club wil je zien.';
    else if (goed.includes(i) && rnd() < .55 + (sp.fit >= 70 ? .1 : -.15)){ t = `Je traint een week mee bij ${CLUBS[i].n}. Je laat zien wat je kan.`; ev = bodEvent(i, 'De trainer is overtuigd!'); }
    else { mod('moraal', -3); t = `Je traint een week mee bij ${CLUBS[i].n}. Na afloop bedankt de trainer je vriendelijk: "We zoeken iets anders."`; }
  } else if (soort === 'bellen'){
    L.bel = 1;
    t = 'Je zaakwaarnemer belt alle clubs die hij kent. "Geef me een week," zegt hij.';
  }
  w.gedaan = true; w.tekst.push(t);
  if (!ev){ const kand = clubsVoorJou(); if (kand.length && rnd() < bodKans()) ev = bodEvent(pick(kand), 'Je telefoon gaat.'); }
  if (ev){ S.ev = ev; S.fase = 'event'; }
}
// Volgende week: de competities spelen zonder jou, daarna gaat het seizoen gewoon verder (winterstop, einde seizoen)
export function volgendeWeekClubloos(){ speelRonde(S.ronde, 0, 0, null); naWedstrijd(); }
// Elke week zonder club (vanuit nieuweWeek)
export function clubloosWeek(eerste){
  const sp = S.sp, L = sp.clubloos; if (!L) return;
  if (!eerste){ L.weken++; L.bel = 0; mod('moraal', -2); sp.rep = clamp(sp.rep * .99, 0, 100); }
  sp.fit = clamp(sp.fit - 16, 0, 100); // geen wedstrijden, maar ook geen begeleiding: zonder training zak je weg (nieuweWeek gaf +14)
  if (L.weken === 10) S.week.tekst.push('Tien weken zonder club. Je begint te twijfelen of er nog een club komt.');
}
export const stopZonderClub = () => stoppen(`Na ${S.sp.clubloos.weken} weken zonder club hang je je schoenen aan de wilgen.`);
