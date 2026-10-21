import { S, seizoenLabel } from '../../core/state.js';
import { clamp } from '../../core/utils.js';
import { CLUBS, DIVS, LAAGSTE, divClubs, AANTAL_RONDES } from '../../data/gegevens.js';
import { fixture, simGoals } from '../competitie/competitie.js';
import { speelRonde, stand } from '../competitie/spelers.js';
import { krantMelding } from '../media/roddel.js';
import { bepaalPromotie, voerPromotieUit } from '../seizoen/kampioen.js';
import { nieuweTabellen } from '../speler/status.js';
import { EIS, assistentKandidaten, heeftAss, maakBod, maakMarkt, sponsorAanbod, sponsorInkomsten, trainerKandidaten, trainerKoopt, trainerModus, transferBudget } from './eigenaar-staf.js';

/* ===================== Na je carrière: clubeigenaar ===================== */
// Je koopt een club met je spaargeld en bepaalt elk seizoen het beleid: spelersbudget, stadion, jeugd, ticketprijs en trainer.
// Het seizoen wordt in één keer gespeeld; daarna zie je de eindstand en de financiën. Raakt je geld op, dan ben je failliet.
const PRIJS = [60e6, 25e6, 5e6, 1e6, 60e3];     // basisprijs van een club per niveau
const TV = [12e6, 3e6, 600e3, 120e3, 5e3];       // tv-geld per seizoen
export const BUDGET_REF = [8e6, 2.5e6, 500e3, 100e3, 10e3]; // een "normaal" spelersbudget per seizoen
export const TICKET = {laag:{n:'Laag', d:'Volle tribunes, de fans zijn blij.', inkomst:.75, fans:4}, normaal:{n:'Normaal', d:'Gewone prijzen.', inkomst:1, fans:0}, hoog:{n:'Hoog', d:'Meer inkomsten, maar de fans morren.', inkomst:1.35, fans:-5}};
const r1k = x => Math.round(x / 1000) * 1000;
export function clubWaarde(id){ const c = CLUBS[id], l = divClubs(c.t), gem = l.reduce((a, i) => a + CLUBS[i].s, 0) / l.length; return r1k(PRIJS[c.t] * (c.s / gem) ** 3); }
// Wat kost het goedkoopste seizoen (half spelersbudget en de goedkoopste trainer)? Zoveel moet je na de koop nog hebben
export const minSeizoen = t => r1k(BUDGET_REF[t] * (.5 + .11));
// Welke clubs kun je kopen (je eerste club met 20% korting)? Alleen als je daarna nog een seizoen kunt betalen
export function koopbaar(){
  const eerste = S.car.clubs && S.car.clubs[0] ? S.car.clubs[0].club : null;
  return [LAAGSTE, 1].flatMap(t => divClubs(t)).map(id => ({id, prijs:r1k(clubWaarde(id) * (id === eerste ? .8 : 1)), eerste:id === eerste}))
    .filter(x => x.prijs + minSeizoen(CLUBS[x.id].t) <= S.sp.geld).sort((a, b) => CLUBS[a.id].t - CLUBS[b.id].t || b.prijs - a.prijs).slice(0, 8);
}
export const kanEigenaar = () => koopbaar().length > 0;
// Alle clubs van je land, op prijs: welke kun je kopen, en hoeveel kom je tekort voor de rest
export function alleClubs(){
  const eerste = S.car.clubs && S.car.clubs[0] ? S.car.clubs[0].club : null;
  return [1, LAAGSTE].flatMap(t => divClubs(t)).map(id => { const prijs = r1k(clubWaarde(id) * (id === eerste ? .8 : 1)), nodig = prijs + minSeizoen(CLUBS[id].t);
    return {id, prijs, eerste:id === eerste, kan:nodig <= S.sp.geld, tekort:Math.max(0, nodig - S.sp.geld)}; }).sort((a, b) => b.prijs - a.prijs);
}
export const goedkoopste = () => Math.min(...divClubs(LAAGSTE).map(clubWaarde)) + minSeizoen(LAAGSTE);
export function koopClub(id, prijs){
  const sp = S.sp; if (prijs > sp.geld) return;
  sp.geld -= prijs;
  S.eigenaar = {club:id, betaald:prijs, stadion:0, jeugd:0, fans:55, seizoenen:0, hist:[`${seizoenLabel()}: eigenaar van ${CLUBS[id].n}`], beleid:{budget:1, ticket:'normaal', stadion:false, jeugd:false}, laatste:null, prijzen:[]};
  zorgEigenaar(); nieuweZomer();
  S.sp.club = id; S.jaar++; S.ronde = 0; S.tab = nieuweTabellen(); S.ss = {wed:0, g:0, a:0, c:[], bods:0};
  krantMelding(`${sp.naam} koopt ${CLUBS[id].n}`, `De oud-voetballer neemt de club over. "Ik wil van deze club iets moois maken."`);
  S.fase = 'eigenaar';
}
export const startEigenaar = () => { S.fase = 'eigenaarAanbod'; };
// De kosten van het gekozen beleid (voor het seizoen begint)
// (de financieel directeur drukt alle kosten met 10%; transfers betaal je apart, op het moment van kopen)
export function kosten(){
  const E = S.eigenaar, t = CLUBS[E.club].t, b = E.beleid, f = heeftAss('financieel') ? .9 : 1, tr = E.trainer && !E.trainer.verlopen ? E.trainer : null;
  return {spelers:r1k(BUDGET_REF[t] * b.budget * f), trainer:tr ? r1k(tr.salaris * f) : 0, assistent:E.assistent ? E.assistent.salaris : 0, stadion:b.stadion ? r1k(BUDGET_REF[t] * (.6 + E.stadion * .3) * f) : 0, jeugd:b.jeugd ? r1k(BUDGET_REF[t] * (.3 + E.jeugd * .15) * f) : 0};
}
// Nieuwe velden (en oude opslag): trainer met contract, assistent, sponsors en transfers
export function zorgEigenaar(){
  const E = S.eigenaar; if (!E || E.v2) return;
  E.v2 = true; E.trainer = E.trainer || null; E.sponsors = E.sponsors || []; E.assistent = E.assistent || null; E.tb = E.tb ?? .5;
  delete E.trainers; if (E.beleid) delete E.beleid.trainer;
  nieuweZomer();
}
// Elke zomer: trainers (als je er geen hebt), assistenten, sponsors, de transfermarkt en misschien een bod op een speler
export function nieuweZomer(){
  const E = S.eigenaar;
  E.kandidaten = !E.trainer || E.trainer.verlopen ? trainerKandidaten() : [];
  E.assKand = assistentKandidaten(); E.uitgegeven = 0; E.verkocht = 0; E.gekocht = [];
  sponsorAanbod(); maakMarkt(); maakBod();
}
// Voldoe je aan de eisen van je trainer? (een goede trainer wil een minimaal spelersbudget)
export const eisOk = () => { const T = S.eigenaar.trainer; return !T || S.eigenaar.beleid.budget >= EIS[T.k].min; };
export const totaalKosten = () => Object.values(kosten()).reduce((a, b) => a + b, 0);
export const kanSpelen = () => !!(S.eigenaar.trainer && !S.eigenaar.trainer.verlopen) && totaalKosten() <= S.sp.geld;
// Kun je zelfs het goedkoopste beleid niet meer betalen? Dan moet je verkopen of failliet gaan
export const vastgelopen = () => minSeizoen(CLUBS[S.eigenaar.club].t) > S.sp.geld;
export function failliet(){ stopEigenaar(`${CLUBS[S.eigenaar.club].n} gaat failliet. Je hebt geen geld meer om de club draaiende te houden.`); }
// Het hele seizoen in één keer
export function speelSeizoen(){
  const E = S.eigenaar, c = CLUBS[E.club], t = c.t, b = E.beleid, k = kosten(), tr = E.trainer;
  if (!kanSpelen()) return;
  // een trainer die zelf de transfers doet, geeft eerst het transferbudget uit
  const zelf = trainerModus() === 'trainer' ? trainerKoopt() : 0;
  S.sp.geld -= totaalKosten();
  // het budget maakt de selectie sterker (of zwakker als je bezuinigt), de trainer helpt tijdens het seizoen
  const sVoor = c.s; c.s = clamp(Math.round(c.s + (b.budget - 1) * 3 + (b.jeugd ? .5 : 0)), 30, 95);
  if (b.stadion) E.stadion = Math.min(5, E.stadion + 1); if (b.jeugd) E.jeugd = Math.min(5, E.jeugd + 1);
  const T = c.s + tr.k * .8 + E.jeugd * .3;
  for (let r = 0; r < AANTAL_RONDES; r++){ S.ronde = r; const fx = fixture(r); if (!fx){ speelRonde(r, 0, 0); continue; } const O = CLUBS[fx.opp].s; const [a, bb] = simGoals(T, O, fx.thuis); speelRonde(r, a, bb); }
  S.ronde = 14;
  const st = stand(t), plek = st.indexOf(E.club) + 1, tab = S.tab[E.club];
  // inkomsten: tickets (fans, stadion, prijs), tv, prijzengeld
  const ticket = r1k(BUDGET_REF[t] * .5 * (E.fans / 55) * (1 + E.stadion * .15) * TICKET[b.ticket].inkomst), tv = TV[t], prijs = r1k(BUDGET_REF[t] * Math.max(0, (9 - plek) / 8) * .4);
  const wissels = bepaalPromotie(), mijn = wissels.find(w => w.id === E.club), sp0 = sponsorInkomsten(plek, !!(mijn && mijn.naar > mijn.van), b.ticket);
  const inkomsten = ticket + tv + prijs + sp0.tot; S.sp.geld += inkomsten;
  E.fans = clamp(E.fans + TICKET[b.ticket].fans + (plek <= 2 ? 8 : plek >= 7 ? -8 : 0) + (b.budget >= 1.5 ? 3 : b.budget < 1 ? -4 : 0), 5, 100);
  // de trainer: zijn contract loopt af, en is hij ontevreden over het budget, dan vertrekt hij na twee seizoenen
  const trNa = {};
  if (b.budget < EIS[tr.k].min){ tr.boos = (tr.boos || 0) + 1; trNa.boos = tr.boos; } else tr.boos = 0;
  tr.jaren--;
  if (tr.boos >= 2){ trNa.weg = `${tr.n} vertrekt: hij kreeg twee seizoenen niet het spelersbudget dat hij eiste.`; krantMelding(`Trainer ${tr.n} stapt op bij ${c.n}`, `"Zonder investeringen kan ik hier niets bereiken."`); E.trainer = null; }
  else if (tr.jaren <= 0){ tr.verlopen = true; trNa.verlopen = `Het contract van ${tr.n} loopt af. Verleng het, of kies een nieuwe trainer.`; }
  else if (trNa.boos) trNa.boosTxt = `${tr.n} is ontevreden: hij wil minstens een spelersbudget "${{1:'Normaal', 1.5:'Investeren'}[EIS[tr.k].min]}". Nog een seizoen zo, en hij vertrekt.`;
  voerPromotieUit(wissels);
  E.seizoenen++;
  if (plek === 1){ E.prijzen.push(`Kampioen als eigenaar: ${DIVS[t]} ${seizoenLabel()}`); S.car.prijzen.push(`Kampioen als clubeigenaar: ${DIVS[t]} ${seizoenLabel()}`); }
  E.hist.push(`${seizoenLabel()}: ${plek}e in de ${DIVS[t]}${mijn ? (mijn.naar < mijn.van ? ' · gepromoveerd!' : ' · gedegradeerd') : ''}`);
  const failliet = S.sp.geld < 0;
  E.laatste = {plek, t, pt:tab.pt, w:tab.w, g:tab.gl, v:tab.v, mijn, sVoor, sNa:c.s, kosten:{...k, transfers:E.uitgegeven || 0}, ticket, tv, prijs, sponsors:sp0.tot, sponsorRegels:sp0.regels, verkocht:E.verkocht || 0, gekocht:(E.gekocht || []).slice(), zelf, inkomsten:inkomsten + (E.verkocht || 0), saldo:inkomsten + (E.verkocht || 0) - Object.values(k).reduce((a, x) => a + x, 0) - (E.uitgegeven || 0), failliet, trainer:tr.n, trNa};
  krantMelding(plek === 1 ? `${c.n} kampioen onder eigenaar ${S.sp.naam}!` : `${c.n} eindigt als ${plek}e`, `Eigenaar ${S.sp.naam}: "${plek <= 3 ? 'Hier hebben we voor gewerkt.' : plek >= 7 ? 'Dit is niet goed genoeg. We gaan alles evalueren.' : 'We bouwen verder.'}"`);
  S.fase = 'eigenaarSeizoen';
}
export function eigenaarVolgend(){
  const E = S.eigenaar;
  if (E.laatste && E.laatste.failliet) return stopEigenaar(`${CLUBS[E.club].n} gaat failliet. Je moet de club verkopen en houdt niets over.`);
  S.jaar++; S.sp.leeftijd++; S.ronde = 0; S.tab = nieuweTabellen(); S.ss = {wed:0, g:0, a:0, c:[], bods:0};
  E.beleid = {...E.beleid, stadion:false, jeugd:false};
  nieuweZomer();
  if (S.sp.leeftijd >= 80) return stopEigenaar('Op je 80e draag je de club over aan de volgende generatie.');
  S.fase = 'eigenaar';
}
export function verkoopClub(){ const E = S.eigenaar, w = clubWaarde(E.club); S.sp.geld += w; E.hist.push(`${seizoenLabel()}: ${CLUBS[E.club].n} verkocht voor €${Math.round(w / 1000)}k`); stopEigenaar(`Je verkoopt ${CLUBS[E.club].n}. Tijd om te genieten van je pensioen.`); }
export function stopEigenaar(reden){ S.eigenaar.gestopt = true; S.einde = {reden}; S.fase = 'einde'; }
