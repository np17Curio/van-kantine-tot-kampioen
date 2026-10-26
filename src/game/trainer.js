import { S, seizoenLabel } from '../core/state.js';
import { clamp, pick, randInt, rnd, shuffle } from '../core/utils.js';
import { AANTAL_RONDES, CLUBS, DIVS, LAAGSTE, divClubs, WINTER } from '../data/gegevens.js';
import { fixture, simGoals } from './competitie/competitie.js';
import { speelRonde, stand, willekeurigDoel } from './competitie/spelers.js';
import { vormBonus } from './competitie/vorm.js';
import { KRANTEN, metVoorletter } from './media/nieuws.js';
import { krantMelding } from './media/roddel.js';
import { bepaalPromotie, voerPromotieUit } from './seizoen/kampioen.js';
import { nieuweTabellen } from './speler/status.js';
import { clubTransfers } from './transfers/markt.js';
import { rivaal } from './wedstrijd/fans-pers.js';
import { bijwerkenVertrouwen, krantOordeel, maakEisen, nieuwSeizoenTeller, oordeel } from './trainer/bestuur.js';
import { eff, elfKracht, fit, jeugdSpeler, kan, mijnSel, naWedstrijd, opst, pasToe, refKracht, vulAan } from './trainer/ploeg.js';
import { BEKERS, bekerNu, bekerRondeKlaar, bekerRondeNaam, bekerSchema, nieuweBekers, speelBekerRonde } from './competitie/beker.js';
import { dramaAuto, dramaNaWedstrijd, fans, maakDrama } from './trainer/drama.js';
import { fansNaWedstrijd, fansWeek, maakPersVoor } from './trainer/pers.js';
import { trainerPriveWeek, trainerSalaris } from './trainer/prive.js';
import { BUDGET, maakMarkt } from './trainer/transfers.js';
import { assistentKost, coach, heeftDiploma, pasAdviesToe, heeftStaf, magLeague, maakO23Sel, nieuweO23Tab, o23Groei, o23NieuwSeizoen, o23Ronde, o23Stand, stafKosten, trainerNiveau } from './trainer/loopbaan.js';
import { gewogen } from './competitie/spelers.js';
import { animPush, reeksStrafschoppen } from '../render/pitch.js';

/* ===================== Trainer worden ===================== */
export const TACTIEK = {
  aanval:   {n:'Aanvallend',   d:'Meer goals, voor en tegen. Sterk tegen zwakkere ploegen.'},
  balans:   {n:'Balans',       d:'Geen risico, geen verrassingen.'},
  verdedig: {n:'Verdedigend',  d:'Minder goals. Slim tegen sterkere ploegen.'},
  rotatie:  {n:'Rouleren',     d:'Je basisspelers worden minder moe, maar de ploeg is iets zwakker.'}
};
// Wat je deze week op de training doet
export const TRAINING = {
  conditie:{n:'Conditietraining', d:'Iedereen +8 fitheid, maar iets meer kans op een blessure.'},
  tactiek: {n:'Tactiektraining',  d:'De ploeg weet precies wat je wilt: deze wedstrijd +1 teamkracht.'},
  jeugd:   {n:'Jeugd ontwikkelen', d:'Extra aandacht voor de spelers van 21 of jonger: kans dat er een beter wordt.'},
  rust:    {n:'Rust',             d:'Iedereen +12 fitheid, maar de ploeg is iets minder scherp.'},
};
// De teambespreking vlak voor de wedstrijd
export const BESPREKING = {
  motiveren:{n:'Motiveren', d:'Een vurige speech: +1 teamkracht, maar een nederlaag komt harder aan.'},
  rustig:   {n:'Druk eraf', d:'"Speel je eigen spel." Een nederlaag kost minder moraal.'},
};
// Trainersreputatie: begint bij je naam als speler, groeit met titels en promoties, zakt bij ontslag
export function trainerRep(){
  if (S.trainer && S.trainer.rep !== undefined) return S.trainer.rep;
  const C = S.car; return clamp(Math.round(C.maxOvr - 45 + C.prijzen.length * 1.5 + (C.prijzen.some(x => /Gouden Bal/.test(x)) ? 10 : 0)), 5, 75);
}
// Nog nooit hoofdtrainer geweest: eerst een O23. Na een goed O23-seizoen (en met je A-diploma) bellen de eerste elftallen.
// Als hoofdtrainer: alleen clubs in een league waarvoor je diploma geldt (A: de tweede league, Pro: alles)
export function trainerAanbiedingen(){
  const C = S.car, r = trainerRep(), ex = S.trainer && S.trainer.ontslag ? 1 : 0, c0 = coach(), E = S.trainerEind;
  const goedeO23 = E && E.o23 && E.bestuur && E.bestuur.uit === 'tevreden' && !(S.trainer && S.trainer.ontslag);
  S.trainerAanbodO23 = !c0.hoofdSz && !c0.wasHoofd && !(goedeO23 && heeftDiploma('A'));
  const legende = C.prijzen.find(x => /^Clublegende van /.test(x)), lid = legende ? CLUBS.findIndex(c => 'Clublegende van ' + c.n === legende) : -1;
  if (S.trainerAanbodO23){
    const hoog = r >= 55 ? 1 : 2, l = shuffle(divClubs(hoog)).slice(0, 2).concat(shuffle(divClubs(hoog === 1 ? 2 : 1)).slice(0, 1));
    if (lid >= 0 && CLUBS[lid].t >= 1 && !l.includes(lid) && !ex) l.unshift(lid);
    return [...new Set(l)].filter(id => !(S.trainer && S.trainer.o23 && S.trainer.ontslag && id === S.trainer.club)).slice(0, 4);
  }
  const top = clamp((r >= 68 ? 1 : 2) + ex, magLeague(1) ? 1 : 2, LAAGSTE);
  const lijst = shuffle(divClubs(top)).slice(0, 2).concat(shuffle(divClubs(Math.min(top + 1, LAAGSTE))).slice(0, 1));
  if (lid >= 0 && CLUBS[lid].t >= 1 && magLeague(CLUBS[lid].t) && !lijst.includes(lid) && !ex) lijst.unshift(lid);
  return [...new Set(lijst)].filter(id => magLeague(CLUBS[id].t)).slice(0, 4);
}
// Trainer worden: zonder diploma eerst de cursus (UEFA B)
export function startTrainer(){
  if (!heeftDiploma('B')){ S.fase = 'trainerCursus'; S.cursusTerug = 'aanbod'; return; }
  S.fase = 'trainerAanbod'; S.trainerAanbod = trainerAanbiedingen();
}
// Een transfervenster openen: de markt voor jou, en de andere clubs kopen en verkopen ook
function openVenster(soort){
  const T0 = S.trainer; T0.venster = soort; T0.bod = null; T0.gekochtVenster = 0; T0.versterkingGevraagd = false; T0.vensterBudget = T0.budget;
  clubTransfers(soort, {zonderMijn:true});
  maakMarkt();
}
// Begin van een seizoen bij een club (of halverwege, na een ontslag elders): budget, eisen, opstelling en transfervenster
export function seizoenStart(){
  const T0 = S.trainer, c = CLUBS[T0.club], halverwege = S.ronde > 0;
  T0.sz = nieuwSeizoenTeller();
  T0.salaris = trainerSalaris(); T0.fans = T0.fans ?? 50; T0.bekerQ = T0.bekerQ || [];
  if (!halverwege){ T0.bekerWinst = 0; T0.bekerQ = []; if (!(S.ss && S.ss.bekers)) S.ss.bekers = nieuweBekers(); } // de bekers van dit seizoen (ook Europa, als je club zich plaatste)
  if (T0.o23){ // de O23: geen transferbudget, wel talenten die naar het eerste kunnen
    T0.budget = 0; if (!T0.o23Tab) nieuweO23Tab();
    for (const x of mijnSel()){ x.bT = 0; if (x.fit === undefined) x.fit = 100; x.kStart = x.k; }
    T0.opstelling = null; opst(); vulAan(); maakEisen(halverwege); T0.venster = null; maakPersVoor(volgendeWedstrijd()); return;
  }
  const N = trainerNiveau(), basis = BUDGET[c.t] * (T0.bonus ? 1.25 : 1) * (halverwege ? .5 : 1) * N.budget;
  T0.budget = Math.round(Math.max(0, basis + Math.max(0, T0.budget || 0) * .5 - stafKosten() * (T0.staf || []).length - (T0.assistent ? assistentKost(T0.assistent.q) : 0)) / 1000) * 1000; T0.bonus = false;
  for (const x of mijnSel()){ x.bT = 0; if (x.fit === undefined) x.fit = 100; }
  T0.opstelling = null; opst(); vulAan();
  maakEisen(halverwege);
  if (S.ronde === 0) openVenster('zomer'); else if (S.ronde === WINTER) openVenster('winter'); else T0.venster = null;
  maakPersVoor(volgendeWedstrijd());
}
// Oude opslag: wat er nog niet is, aanvullen
export function zorgVoorTrainer(){
  const T0 = S.trainer; if (!T0) return;
  if (!S.coach) S.coach = {diplomas:['B', 'A', 'Pro'], cursus:null, gezakt:{}, o23Sz:0, hoofdSz:Math.max(1, T0.seizoenen || 0)}; // oude opslag: al trainer, dus al gediplomeerd
  if (!T0.staf) T0.staf = [];
  if (!T0.sz) T0.sz = nieuwSeizoenTeller();
  if (T0.budget === undefined) T0.budget = Math.round(BUDGET[CLUBS[T0.club].t] * .5 / 1000) * 1000;
  opst();
  if (!T0.eisen || T0.eisen.jaar !== S.jaar) maakEisen(S.ronde > 0);
}
export function kiesTrainerClub(id){
  const vorig = S.trainer, o23 = !!S.trainerAanbodO23; // (je assistent gaat met je mee naar je nieuwe club)
  S.trainer = {club:id, o23, staf:[], fans:50, duels:vorig ? vorig.duels || {} : {}, assistent:vorig ? vorig.assistent || null : null, rep:trainerRep(), wed:0, w:0, g:0, v:0, prijzen:vorig ? vorig.prijzen : [], hist:vorig ? vorig.hist : [], ontslagen:vorig ? vorig.ontslagen || 0 : 0, bestuur:60, moraal:60, tactiek:'balans', training:'tactiek', bespreking:null, seizoenen:vorig ? vorig.seizoenen : 0, laatste:null, totW:vorig ? vorig.totW : 0, totWed:vorig ? vorig.totWed : 0};
  S.sp.club = id; S.krantWacht = []; // oud nieuws uit je vorige baan hoort hier niet meer
  // Begin van een nieuw seizoen (na je spelerscarrière of na de zomer); na een ontslag midden in het seizoen ga je gewoon verder
  if (S.ronde >= AANTAL_RONDES || !vorig){ S.jaar++; S.ronde = 0; S.tab = nieuweTabellen(); S.ss = {wed:0, g:0, a:0, c:[], bods:0}; }
  if (o23){ S.trainer.o23Sel = maakO23Sel(id); nieuweO23Tab(); } else coach().wasHoofd = true;
  S.trainer.hist.push(`${seizoenLabel()}: ${o23 ? 'trainer van de O23 van' : 'trainer van'} ${CLUBS[id].n} (${DIVS[CLUBS[id].t]})`);
  if (o23) krantMelding(`${S.sp.naam} gaat de O23 van ${CLUBS[id].n} trainen`, 'De oud-speler begint zijn trainersloopbaan bij de jeugd. "Hier leer ik het vak."', KRANTEN[CLUBS[id].t]);
  else krantMelding(`${S.sp.naam} nieuwe trainer van ${CLUBS[id].n}`, coach().hoofdSz ? 'Een nieuwe uitdaging voor de trainer.' : 'De oud-speler staat voor het eerst langs de lijn als hoofdtrainer.', KRANTEN[CLUBS[id].t]);
  seizoenStart();
  S.fase = 'trainer';
}
// De training van deze week (vlak voor de wedstrijd)
function doeTraining(T0){
  const sel = mijnSel(), tr = T0.training;
  if (tr === 'conditie') sel.forEach(x => { if (!(x.bles > 0)) x.fit = clamp((x.fit ?? 100) + 8, 0, 100); });
  if (tr === 'rust') sel.forEach(x => { x.fit = clamp((x.fit ?? 100) + 12, 0, 100); });
  if (tr === 'jeugd' && !T0.o23 && rnd() < (heeftStaf('jeugd') ? .5 : .3)){ const l = sel.filter(jeugdSpeler); if (l.length){ const x = pick(l); x.k = clamp(x.k + 1, 25, 95); return `Op de training groeit ${metVoorletter(x)} (${x.lft}): klasse ${x.k - 1} → ${x.k}.`; } }
  return null;
}
// De hoogtepunten voor het veld: de goals van dit stuk van de wedstrijd en een paar grote kansen, op volgorde van de minuut.
// Jij staat als trainer bij de dug-out (bank) en juicht daar mee.
function trainerHoogtepunten(M, a, b, wijNamen, zijNamen, T, O, van = 1, tot = 90, maxKans = 3){
  const mom = [];
  for (let i = 0; i < a; i++) mom.push({wij:true, goal:true, naam:wijNamen[i]});
  for (let i = 0; i < b; i++) mom.push({wij:false, goal:true, naam:zijNamen[i]});
  const kansen = Math.max(0, Math.min(10 - mom.length, randInt(maxKans > 1 ? 1 : 0, maxKans))), pWij = clamp(.5 + (T - O) / 20, .25, .75);
  for (let i = 0; i < kansen; i++) mom.push({wij:rnd() < pWij, goal:false});
  const minuten = mom.map(() => randInt(van + 1, tot)).sort((x, y) => x - y);
  shuffle(mom).forEach((x, i) => { x.min = minuten[i]; });
  mom.sort((x, y) => x.min - y.min);
  for (const x of mom){
    M.min = x.min;
    const variant = x.goal && x.wij && rnd() < .08 ? 'pen' : pick(['combi', 'combi', 'kop', 'afstand']), wie = x.naam || (x.wij ? 'een speler van jou' : 'de tegenstander');
    let soort, einde = null, t;
    if (x.goal){ if (x.wij) M.us++; else M.them++; soort = x.wij ? 'teamGoal' : 'tegenGoal';
      t = `${x.wij ? 'GOAL!' : 'Tegengoal.'} ${wie} ${variant === 'kop' ? 'kopt raak' : variant === 'afstand' ? 'schiet raak van afstand' : variant === 'pen' ? 'benut de strafschop' : 'rondt af'}. ${M.thuis ? `${M.us}-${M.them}` : `${M.them}-${M.us}`}`; }
    else { soort = x.wij ? 'teamKans' : 'tegenKans'; einde = pick(x.wij ? ['paal', 'redding', 'lijn', 'over'] : ['paal', 'redding', 'lijn']);
      t = `${x.wij ? 'Grote kans' : 'Gevaar'}: ${einde === 'paal' ? 'op de paal' : einde === 'lijn' ? 'van de lijn gehaald' : einde === 'over' ? 'net over' : 'de keeper redt'}!`; }
    animPush(M, {soort, type:soort, variant:variant === 'pen' && !x.wij ? 'combi' : variant, einde, onder:`${x.min}' · ${t}`, anderen:true, bank:true});
  }
  M.min = tot;
}
// De volgende wedstrijd: een bekerwedstrijd die klaarstaat, of de competitie
export function volgendeWedstrijd(){
  const T0 = S.trainer; if (!T0) return null;
  const q = (T0.bekerQ || [])[0];
  if (q){ const B = S.ss.bekers[q.k]; return {opp:q.h === T0.club ? q.u : q.h, thuis:q.h === T0.club, beker:{k:q.k, naam:BEKERS[q.k].naam, ronde:bekerRondeNaam(q.k, B.rondes.length - 1)}}; }
  const fx = fixture(S.ronde); return fx ? {opp:fx.opp, thuis:fx.thuis, beker:null} : null;
}
// Voor de aftrap: drama en pers afgehandeld, training, opstelling (of de assistent), en de krachtverhouding
function bereid(){
  S.krantWacht = []; S.M = null;
  zorgVoorTrainer(); dramaAuto();
  const T0 = S.trainer, c = CLUBS[T0.club], W = volgendeWedstrijd(), opp = CLUBS[W.opp], tk = T0.tactiek, tr = T0.training, bs = T0.bespreking, E = T0.persEffect;
  T0.venster = null; T0.markt = null; T0.bod = null; // het transfervenster gaat dicht
  const advies = T0.assistent && T0.assistent.auto ? pasAdviesToe() : null; // de assistent zet de opstelling klaar
  const trainingTekst = doeTraining(T0), vervangen = vulAan(), finale = W.beker && W.beker.ronde === 'Finale';
  // de O23: de beste fitte elf (met groei en doorstromers) als basis, net als bij het eerste elftal telt vermoeidheid als verschil
  const basisT = T0.o23 ? refKracht() + 1.5 + (elfKracht() - refKracht()) * .9 : c.s + (elfKracht() - refKracht()) * .9 + vormBonus(T0.club);
  let T = basisT + (T0.moraal - 60) / (T0.o23 ? 12 : 8) + // (jonge spelers: het moraal telt iets minder zwaar)
    Math.min(4, T0.totWed / 60) + (W.thuis && !finale ? 2 : 0)
    + (tr === 'tactiek' ? 1 : 0) + (tr === 'rust' ? -.5 : 0) + (bs === 'motiveren' ? 1 : 0) + (heeftStaf('aanval') ? .7 : 0) + (E ? E.dT : 0);
  let O = (T0.o23 ? opp.s - 9 + randInt(-2, 2) : opp.s + vormBonus(W.opp)) + (W.thuis || finale ? 0 : 2) - (heeftStaf('keeper') ? .7 : 0) + (E ? E.dO : 0);
  if (heeftStaf('video') && O > T) T += 1;
  let fact = 1;
  if (tk === 'aanval'){ fact = 1.3; if (T > O) T += 1.5; }
  if (tk === 'verdedig'){ fact = .7; if (O > T) T += 1.5; }
  if (tk === 'rotatie'){ T -= 1.5; }
  const L = {opp:W.opp, thuis:W.thuis, beker:W.beker, T, O, fact, a:0, b:0, doelen:[], scorers:[], zijNamen:[], keuzes:[], wissels:[], fase:null, tk, tr, bs,
    regelsVoor:[vervangen.length ? `Niet beschikbaar: ${vervangen.join(', ')}. Hun vervangers stonden in de basis.` : null, advies ? `Je assistent ${T0.assistent.naam} zette de opstelling klaar (${advies.f}${advies.tactiek ? `, ${TACTIEK[advies.tactiek].n.toLowerCase()}` : ''}).` : null, trainingTekst].filter(Boolean)};
  // het veld: de wedstrijd als animatie (zoals bij je eigen wedstrijden als speler)
  S.M = {trainer:true, o23:!!T0.o23, opp:W.opp, thuis:W.thuis, wij:T0.o23 ? `${c.n} O23` : c.n, zij:T0.o23 ? `${opp.n} O23` : opp.n, us:0, them:0, min:0, animQ:[]};
  return L;
}
// Een stuk van de wedstrijd (van-tot in minuten): goals naar de krachtverhouding, met de namen van wie er nu staat
function speelStuk(L, van, tot){
  const T0 = S.trainer, p = Math.min(1, (tot - van + 1) / 90 * L.fact);
  const [ga, gb] = simGoals(L.T, L.O, false); let a = 0, b = 0;
  for (let i = 0; i < ga; i++) if (rnd() < p) a++;
  for (let i = 0; i < gb; i++) if (rnd() < p) b++;
  const wij = [], zij = [];
  for (let i = 0; i < a; i++){
    if (T0.o23){ const s = gewogen(T0.o23Sel.filter(x => x.basis), 'g'); wij.push(s ? metVoorletter(s) : null); }
    else { const d = willekeurigDoel(T0.club); L.doelen.push({club:T0.club, s:d.s, a:d.a}); wij.push(d.s ? metVoorletter(d.s) : null); } }
  for (let i = 0; i < b; i++){ if (T0.o23){ zij.push(null); continue; } const d = willekeurigDoel(L.opp); L.doelen.push({club:L.opp, s:d.s, a:d.a}); zij.push(d.s ? metVoorletter(d.s) : null); }
  L.scorers.push(...wij.filter(Boolean)); L.a += a; L.b += b;
  trainerHoogtepunten(S.M, a, b, wij, zij, L.T, L.O, van, tot, tot - van > 40 ? 2 : 1);
}
// Snel spelen: de hele wedstrijd in één keer (de assistent of jouw keuzes van voor de wedstrijd)
export function trainerWedstrijd(){ const L = bereid(); speelStuk(L, 1, 90); rondAf(L); }
// Live coachen: eerst de eerste helft, dan jouw keuzes in de rust
export function startLive(){
  const L = bereid(); S.trainer.live = L; speelStuk(L, 1, 45); L.fase = 'rust'; S.fase = 'trainerLive';
  // na een helft is iedereen in het veld moe (wie al moe begon het meest). Dat zit al in de krachtverhouding;
  // een frisse invaller voor een moe geworden speler levert in de tweede helft wel iets extra op
  const sel = mijnSel(); L.moe = {};
  for (const n of opst().ids){ const x = sel.find(y => y.n === n); if (x) L.moe[n] = Math.max(15, Math.round(fit(x) - randInt(12, 20) - (fit(x) < 70 ? 6 : 0))); }
}
const moeStraf = lf => Math.max(0, (70 - lf) / 3);
// Hoe goed speelt hij in de tweede helft? Klasse min de vermoeidheid van de eerste helft
export const liveEff = (x, L) => eff(x) + (fit(x) < 60 ? (60 - fit(x)) / 4 : 0) - moeStraf(L.moe && L.moe[x.n] != null ? L.moe[x.n] : fit(x));
export const PEPTALK = {
  rustig:{n:'Rustig blijven', d:'"Blijf bij het plan." Bij een voorsprong het beste.'},
  motiveer:{n:'Motiveren', d:'"Jullie kunnen dit!" Altijd een beetje beter.'},
  fel:{n:'Op tafel slaan', d:'Bij een achterstand een flinke boost, bij een voorsprong averechts.'},
};
// Een wissel in de rust (of bij de 70e): de opstelling verandert, de kracht ook
export function liveWissel(uit, erin){
  const T0 = S.trainer, L = T0.live, o = opst(), sel = mijnSel(); if (!L || L.wissels.length >= 3) return;
  const x = sel.find(y => y.n === uit), y = sel.find(z => z.n === erin); if (!x || !y || !o.ids.includes(uit) || o.ids.includes(erin) || !kan(y)) return;
  o.ids = o.ids.map(n => n === uit ? erin : n); pasToe();
  // de invaller is fris; de speler die eruit gaat was een helft moe
  const winst = (liveEff(y, {moe:{}}) - liveEff(x, L)) / 11 * .9; L.T += winst; L.moe[erin] = fit(y);
  L.wissels.push({uit:metVoorletter(x), in:metVoorletter(y), winst});
}
export function liveTactiek(k){ const L = S.trainer.live; if (!L) return; const oud = L.tk; if (oud === k) return; S.trainer.tactiek = k;
  if (oud === 'aanval') L.fact /= 1.3; if (oud === 'verdedig') L.fact /= .7; if (k === 'aanval') L.fact *= 1.3; if (k === 'verdedig') L.fact *= .7; L.tk = k; L.keuzes.push(`Na rust ${TACTIEK[k].n.toLowerCase()}.`); }
export function tweedeHelft(peptalk){
  const T0 = S.trainer, L = T0.live; if (!L || L.fase !== 'rust') return;
  const d = L.a - L.b; let dT = 0;
  if (peptalk === 'rustig') dT = d > 0 ? 1 : 0;
  else if (peptalk === 'motiveer') dT = .8;
  else if (peptalk === 'fel') dT = d < 0 ? 2 : d > 0 ? -1 : .5;
  L.T += dT; L.keuzes.push(`Rust (${L.a}-${L.b}): ${PEPTALK[peptalk].n.toLowerCase()}${dT > .5 ? ', en het werkt' : dT < 0 ? ', maar dat pakt verkeerd uit' : ''}.`);
  for (const w of L.wissels) L.keuzes.push(`Wissel: ${w.in} voor ${w.uit}.`);
  L.wisselsRust = L.wissels.length;
  speelStuk(L, 46, 70);
  if (Math.abs(L.a - L.b) <= 1){ L.fase = 'slot'; S.fase = 'trainerLive'; return; }
  speelStuk(L, 71, 90); eindeLive(L);
}
export const SLOT = {
  aanval:{n:'Alles naar voren', d:'Meer goals, voor én tegen. Je ploeg drukt door.'},
  bus:{n:'De bus parkeren', d:'Minder goals. De tegenstander komt er moeilijk door.'},
  niets:{n:'Niets veranderen', d:'Zo doorgaan.'},
};
export function slotKeuze(k){
  const L = S.trainer.live; if (!L || L.fase !== 'slot') return;
  if (k === 'aanval'){ L.fact *= 1.3; L.T += 1.5; } else if (k === 'bus'){ L.fact *= .6; L.O -= 1; }
  L.keuzes.push(`70e minuut (${L.a}-${L.b}): ${SLOT[k].n.toLowerCase()}.`);
  for (const w of L.wissels.slice(L.wisselsRust || 0)) L.keuzes.push(`Wissel: ${w.in} voor ${w.uit}.`);
  speelStuk(L, 71, 90); eindeLive(L);
}
function eindeLive(L){ S.trainer.live = null; rondAf(L); }
// Na het laatste fluitsignaal: de stand, het bestuur, de eisen, de fans, de pers en het drama (competitie) of het schema (beker)
function rondAf(L){
  const T0 = S.trainer, c = CLUBS[T0.club], opp = CLUBS[L.opp];
  let {a, b} = L; const regels = [];
  if (L.beker) return rondAfBeker(L);
  if (T0.o23){ // de O23: de uitslag in de O23-stand, het eerste elftal speelt (gesimuleerd) gewoon zijn competitie
    o23Ronde(L.opp, a, b);
    const [fa, fb] = simGoals(c.s + vormBonus(T0.club), opp.s + vormBonus(L.opp), L.thuis); speelRonde(S.ronde, fa, fb, null);
    T0.eerste = {a:fa, b:fb, opp:opp.n, thuis:L.thuis};
  } else speelRonde(S.ronde, a, b, L.doelen);
  const won = a > b, gel = a === b, verwacht = c.s - opp.s, bs = L.bs; // (bij de O23 net zo: de O23 van een sterke club is sterker)
  // tellers voor de eisen van het bestuur
  const z = T0.sz; if (L.thuis){ z.thuisGes++; if (won) z.thuisW++; } if (L.opp === rivaal(T0.club)){ z.rivaalGes++; if (won) z.rivaalW++; z.rivaalPt = (z.rivaalPt || 0) + (won ? 3 : a === b ? 1 : 0); }
  T0.wed++; T0.totWed++; if (won){ T0.w++; T0.totW++; } else if (gel) T0.g++; else T0.v++;
  T0.moraal = clamp(T0.moraal + (won ? (bs === 'motiveren' ? 7 : 6) : gel ? 0 : bs === 'motiveren' ? -9 : bs === 'rustig' ? -3 : -6), 20, 100);
  dramaNaWedstrijd(regels);
  const blessures = naWedstrijd({rotatie:L.tk === 'rotatie', conditie:L.tr === 'conditie'});
  T0.bestuur = clamp(T0.bestuur + (won ? 3 : gel ? (verwacht > 3 ? -2 : 1) : (verwacht < -3 ? -1 : T0.o23 ? -3 : -5)), 0, 100); // bij de O23 telt de uitslag minder zwaar
  bijwerkenVertrouwen();
  const pl = (T0.o23 ? o23Stand() : stand(c.t)).indexOf(T0.club) + 1, groei = T0.o23 ? o23Groei() : null;
  if (heeftStaf('conditie')) mijnSel().forEach(x => { if (!(x.bles > 0)) x.fit = clamp((x.fit ?? 100) + 3, 0, 100); });
  regels.unshift(...L.keuzes);
  if (!L.keuzes.length) regels.unshift(won ? pick(['Je spelers volgen je plan perfect.', 'Je ploeg is vanaf de eerste minuut de baas.', 'Een zege van het hele team.']) : gel ? pick(['Een taaie wedstrijd zonder winnaar.', 'Jullie komen niet door de verdediging heen.']) : pick(['Je plan werkt vandaag niet.', 'Een individuele fout kost de wedstrijd.', 'De tegenstander is gewoon beter.']));
  if (L.scorers.length) regels.push(`Doelpunten: ${L.scorers.join(', ')}.`);
  regels.push(...L.regelsVoor);
  if (groei) regels.push(groei);
  if (T0.o23 && T0.eerste) regels.push(`Het eerste elftal van ${c.n}: ${T0.eerste.thuis ? `${T0.eerste.a}-${T0.eerste.b} tegen ${T0.eerste.opp}` : `${T0.eerste.b}-${T0.eerste.a} bij ${T0.eerste.opp}`}.`);
  for (const x of blessures) regels.push(`${metVoorletter(x)} raakt geblesseerd en is ${x.bles} ${x.bles === 1 ? 'week' : 'weken'} uit de roulatie.`);
  fansNaWedstrijd(L, a, b, regels);
  T0.laatste = {opp:opp.n, oppId:L.opp, thuis:L.thuis, a, b, regels, plek:pl, tk:L.tk};
  T0.bespreking = null; T0.drama = T0.drama && T0.drama.klaar ? null : T0.drama; T0.pers = null;
  S.ronde++;
  if (T0.bestuur < 15 && !T0.o23){ ontslaan(c, 'De resultaten vielen tegen. Het bestuur grijpt in.'); }
  S.fase = 'trainerUitslag';
}
// Een bekerwedstrijd: gelijk is strafschoppen; de uitslag gaat in het schema. Telt niet voor de stand of de eisen
function rondAfBeker(L){
  const T0 = S.trainer, c = CLUBS[T0.club], opp = CLUBS[L.opp], k = L.beker.k, B = S.ss.bekers[k], regels = [...L.keuzes];
  let {a, b} = L, pens = null, winst = a > b;
  if (a === b){ const ks = reeksStrafschoppen(null, S.M); winst = ks.wij > ks.zij; pens = `${ks.wij}-${ks.zij}`;
    animPush(S.M, {soort:'shootout', type:'shootout', kicks:ks.lijst, winst});
    regels.push(`Strafschoppen! ${winst ? `${c.n} wint (${ks.wij}-${ks.zij}).` : `${opp.n} wint (${ks.zij}-${ks.wij}).`}`); }
  const r = B.rondes[B.rondes.length - 1], m = r.find(x => x.wacht && (x.h === T0.club || x.u === T0.club));
  if (m){ Object.assign(m, {gh:L.thuis ? a : b, gu:L.thuis ? b : a, pen:pens ? (winst === L.thuis ? 'h' : 'u') : null, w:winst ? T0.club : L.opp}); delete m.wacht; }
  bekerRondeKlaar(k); T0.bekerQ.shift();
  T0.totWed++; if (winst) T0.totW++;
  T0.moraal = clamp(T0.moraal + (winst ? 5 : -5), 20, 100);
  if (L.scorers.length) regels.push(`Doelpunten: ${L.scorers.join(', ')}.`);
  regels.push(...L.regelsVoor);
  const blessures = naWedstrijd({rotatie:L.tk === 'rotatie', conditie:L.tr === 'conditie'});
  for (const x of blessures) regels.push(`${metVoorletter(x)} raakt geblesseerd en is ${x.bles} ${x.bles === 1 ? 'week' : 'weken'} uit de roulatie.`);
  if (winst && B.winnaar === T0.club){
    const prijs = `${BEKERS[k].naam} ${seizoenLabel()}`; T0.prijzen.push(prijs); T0.hist.push(`${seizoenLabel()}: ${BEKERS[k].naam} gewonnen met ${c.n}`);
    T0.bekerWinst = (T0.bekerWinst || 0) + (k === 'cl' ? 2 : 1); T0.rep = clamp(T0.rep + (k === 'cl' ? 10 : k === 'eur' ? 6 : 4), 0, 100); T0.bestuur = clamp(T0.bestuur + 15, 0, 100); fans(15);
    regels.unshift(`🏆 ${c.n} wint de ${BEKERS[k].naam}! Je spelers gooien je in de lucht.`);
    krantMelding(`${c.n} wint de ${BEKERS[k].naam}!`, `Trainer ${S.sp.naam} pakt de beker${pens ? ' na strafschoppen' : ''}. "Dit is voor de fans."`, KRANTEN[0]);
  } else if (winst){ fans(3); T0.bestuur = clamp(T0.bestuur + 2, 0, 100); regels.unshift(`Door naar de ${bekerRondeNaam(k, B.rondes.length).toLowerCase()} van de ${BEKERS[k].naam}!`); }
  else { fans(-3); regels.unshift(`Uitgeschakeld in de ${L.beker.ronde.toLowerCase()} van de ${BEKERS[k].naam}.`); }
  fansNaWedstrijd(L, a, b, regels);
  T0.laatste = {opp:opp.n, oppId:L.opp, thuis:L.thuis, a, b, regels, plek:stand(c.t).indexOf(T0.club) + 1, tk:L.tk, beker:L.beker, pens};
  T0.bespreking = null; T0.drama = T0.drama && T0.drama.klaar ? null : T0.drama; T0.pers = null;
  S.fase = 'trainerUitslag';
}
function ontslaan(c, reden){
  const T0 = S.trainer;
  T0.ontslagen = (T0.ontslagen || 0) + 1; T0.rep = clamp(T0.rep - 8, 0, 100); T0.hist.push(`${seizoenLabel()}: ontslagen bij ${c.n}`);
  krantMelding(`${c.n} ontslaat trainer ${S.sp.naam}`, reden, KRANTEN[c.t]); T0.ontslag = true;
}
// Bekerrondes van deze week: de andere wedstrijden gesimuleerd, die van jouw club in de wachtrij
function trainerBekerWeek(){
  const T0 = S.trainer, B = S.ss.bekers; T0.bekerQ = T0.bekerQ || [];
  for (const k in B){
    if (!bekerSchema(k).includes(S.ronde) || B[k].winnaar !== null || B[k].levend.length < 2) continue;
    const m = speelBekerRonde(k, !T0.o23 && B[k].levend.includes(T0.club));
    if (m) T0.bekerQ.push({k, h:m.h, u:m.u});
  }
}
export function trainerVerder(){
  const T0 = S.trainer; S.M = null;
  if (T0.ontslag){ S.fase = 'trainerAanbod'; S.trainerAanbod = trainerAanbiedingen(); T0.ontslag = false; return; }
  if ((T0.bekerQ || []).length){ S.fase = 'trainer'; return; } // nog een bekerwedstrijd deze week
  trainerVolgende();
}
// Naar de volgende wedstrijd: bekerrondes, speelvrije weken, de winterstop, het einde van het seizoen. Daarna: privé, drama en pers
function trainerVolgende(){
  const T0 = S.trainer;
  for (let n = 0; n < 200; n++){
    if (S.ss && S.ss.bekers && T0.bekerRonde !== `${S.jaar}|${S.ronde}` && bekerNu()){ T0.bekerRonde = `${S.jaar}|${S.ronde}`; trainerBekerWeek(); if (T0.bekerQ.length) break; }
    if (S.ronde >= AANTAL_RONDES) return trainerSeizoenEinde();
    if (S.ronde === WINTER || fixture(S.ronde)) break;
    speelRonde(S.ronde, 0, 0, null); S.ronde++; // speelvrij voor jouw league (de andere league speelt wel)
  }
  if (S.ronde === WINTER && T0.vensterRonde !== `${S.jaar}|${S.ronde}` && !(T0.bekerQ || []).length){ T0.vensterRonde = `${S.jaar}|${S.ronde}`; openVenster('winter'); } // de winterstop
  S.fase = 'trainer';
  fansWeek(); maakDrama(); maakPersVoor(volgendeWedstrijd());
  trainerPriveWeek(); // je privéleven (kan een gebeurtenis openen; daarna terug naar de trainer)
}
export function trainerSeizoenEinde(){
  const T0 = S.trainer, c = CLUBS[T0.club], t = c.t, plek = (T0.o23 ? o23Stand() : stand(t)).indexOf(T0.club) + 1, prijzen = [];
  zorgVoorTrainer();
  if (T0.o23) return o23SeizoenEinde(T0, c, t, plek);
  if (plek === 1){ prijzen.push(`Kampioen als trainer: ${DIVS[t]} ${seizoenLabel()}`); T0.bestuur = clamp(T0.bestuur + 25, 0, 100); }
  const o = oordeel();
  const wissels = bepaalPromotie(), mijn = wissels.find(x => x.id === T0.club);
  T0.prijzen.push(...prijzen); T0.seizoenen++;
  // Reputatie en clubsterkte: succes trekt betere spelers en betere clubs aan
  T0.rep = clamp(T0.rep + (plek === 1 ? 12 : plek <= 3 ? 5 : plek >= 7 ? -4 : 0) + (mijn && mijn.naar < mijn.van ? 5 : 0) + (t <= 1 && plek <= 4 ? 3 : 0) + (o.uit === 'tevreden' ? 4 : 0), 0, 100);
  if (plek <= 3) c.s = clamp(c.s + (plek === 1 ? 2 : 1), 30, 95);
  T0.hist.push(`${seizoenLabel()}: ${plek}e met ${c.n} in de ${DIVS[t]}${mijn ? (mijn.naar < mijn.van ? ' · gepromoveerd!' : ' · gedegradeerd') : ''} · bestuur ${o.score}/4`);
  krantMelding(`${krantOordeel(o)}: ${c.n}`, o.tekst, KRANTEN[t]);
  if (o.uit === 'ontslag') ontslaan(c, o.tekst);
  else if (o.uit === 'tevreden') T0.bonus = true;
  else T0.bestuur = Math.min(T0.bestuur, 40);
  // Trainer van het Jaar: beter dan verwacht, een titel, een beker, promotie
  const tvj = (T0.eisen.rang - plek) + (plek === 1 ? 3 : 0) + (T0.bekerWinst || 0) * 3 + (mijn && mijn.naar < mijn.van ? 2 : 0) + (t === 1 ? 1 : 0);
  if (tvj >= 6 || (plek === 1 && t === 1)){ const p = `Trainer van het Jaar ${seizoenLabel()}`; prijzen.push(p); T0.prijzen.push(p); T0.rep = clamp(T0.rep + 6, 0, 100); krantMelding(`${S.sp.naam} is de Trainer van het Jaar`, `Met ${c.n} ${plek === 1 ? 'kampioen' : `${plek}e`}${T0.bekerWinst ? ' en een beker' : ''}. Zijn collega's kozen hem unaniem.`, KRANTEN[0]); }
  S.trainerEind = {plek, t, prijzen, mijn, clubNaam:c.n, bestuur:o, tvj:prijzen.some(p => /^Trainer van het Jaar/.test(p))};
  bewaarVorig();
  coach().hoofdSz++;
  voerPromotieUit(wissels);
  S.fase = 'trainerSeizoen';
}
// Einde van een seizoen bij de O23: het oordeel van de technisch directeur, en je naam als trainer groeit
function o23SeizoenEinde(T0, c, t, plek){
  const prijzen = []; if (plek === 1) prijzen.push(`Kampioen met de O23 van ${c.n} ${seizoenLabel()}`);
  const o = oordeel(), wissels = bepaalPromotie();
  T0.prijzen.push(...prijzen); T0.seizoenen++; coach().o23Sz++;
  T0.rep = clamp(T0.rep + (o.uit === 'tevreden' ? 8 : o.uit === 'waarschuwing' ? 2 : -4) + (plek === 1 ? 6 : plek <= 3 ? 2 : 0) + (T0.sz.door || 0) * 2, 0, 100);
  T0.hist.push(`${seizoenLabel()}: ${plek}e met de O23 van ${c.n} · ${T0.sz.door || 0} ${T0.sz.door === 1 ? 'talent' : 'talenten'} naar het eerste · oordeel ${o.score}/4`);
  krantMelding(`${krantOordeel(o)}: de O23 van ${c.n}`, o.tekst, KRANTEN[t]);
  if (o.uit === 'ontslag') ontslaan(c, o.tekst);
  if (plek <= 2 && (T0.sz.door || 0) >= 2){ const p = `Jeugdtrainer van het Jaar ${seizoenLabel()}`; prijzen.push(p); T0.prijzen.push(p); T0.rep = clamp(T0.rep + 4, 0, 100); }
  S.trainerEind = {o23:true, plek, t, prijzen, mijn:null, clubNaam:`${c.n} O23`, bestuur:o, door:T0.sz.door || 0};
  bewaarVorig();
  voerPromotieUit(wissels);
  S.fase = 'trainerSeizoen';
}
// De eindstand van dit seizoen: voor de Europese plekken van volgend seizoen
function bewaarVorig(){ S.vorig = {}; for (let t = 1; t <= LAAGSTE; t++) stand(t).forEach((id, i) => { S.vorig[id] = {t, plek:i + 1}; }); }
// Een speelvrije week (zoals de winterstop zonder wedstrijd): de week overslaan
export function trainerVrij(){ speelRonde(S.ronde, 0, 0, null); S.ronde++; trainerVerder(); }
export function trainerNieuwSeizoen(){
  const T0 = S.trainer;
  S.jaar++; S.sp.leeftijd++; S.ronde = 0; S.tab = nieuweTabellen(); S.ss = {wed:0, g:0, a:0, c:[], bods:0};
  T0.wed = 0; T0.w = 0; T0.g = 0; T0.v = 0; T0.moraal = 60; T0.bestuur = Math.max(T0.bestuur, 45);
  if (S.sp.leeftijd >= 70) return stopTrainer('Na een lang leven in het voetbal ga je met pensioen. De kantine is naar je vernoemd.');
  if (T0.o23) o23NieuwSeizoen(); // wie 22 wordt vertrekt, nieuwe jeugd komt erbij
  seizoenStart();
  S.fase = 'trainer';
}
// Ontslagen aan het einde van het seizoen, of zelf een andere club zoeken
export function trainerAndereClub(){
  S.jaar++; S.sp.leeftijd++; S.ronde = 0; S.tab = nieuweTabellen(); S.ss = {wed:0, g:0, a:0, c:[], bods:0};
  S.fase = 'trainerAanbod'; S.trainerAanbod = trainerAanbiedingen(); if (S.trainer) S.trainer.ontslag = false;
}
export function stopTrainer(reden){ S.trainer.gestopt = true; S.einde = {reden: reden || 'Je stopt als trainer. Tijd voor de achtertuin en de kleinkinderen.'}; S.fase = 'einde'; }
