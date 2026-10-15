import { S, seizoenLabel } from '../core/state.js';
import { clamp, pick, randInt, rnd, shuffle } from '../core/utils.js';
import { AANTAL_RONDES, CLUBS, DIVS, JEUGD, divClubs } from '../data/gegevens.js';
import { thuisLand } from '../data/landen.js';
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
import { elfKracht, jeugdSpeler, mijnSel, naWedstrijd, opst, refKracht, vulAan } from './trainer/ploeg.js';
import { BUDGET, maakMarkt } from './trainer/transfers.js';

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
export function trainerAanbiedingen(){
  const C = S.car, r = trainerRep(), ex = S.trainer && S.trainer.ontslag ? 1 : 0;
  const top = clamp((r >= 85 ? 0 : r >= 68 ? 1 : r >= 52 ? 2 : r >= 36 ? 3 : 4) + ex, 0, 4);
  const lijst = shuffle(divClubs(Math.min(top, 4))).slice(0, 2).concat(shuffle(divClubs(Math.min(top + 1, 4))).slice(0, 1));
  const legende = C.prijzen.find(x => /^Clublegende van /.test(x)), lid = legende ? CLUBS.findIndex(c => 'Clublegende van ' + c.n === legende) : -1;
  if (lid >= 0 && CLUBS[lid].t <= 4 && !lijst.includes(lid) && !ex) lijst.unshift(lid);
  const eerste = CLUBS.findIndex(c => c.t === JEUGD && C.clubs[0] && (C.clubs[0].land || 'Nederland') === thuisLand() && c === CLUBS[C.clubs[0].club]);
  if (eerste >= 0) lijst.push(eerste);
  return [...new Set(lijst)].slice(0, 4);
}
export function startTrainer(){ S.fase = 'trainerAanbod'; S.trainerAanbod = trainerAanbiedingen(); }
// Een transfervenster openen: de markt voor jou, en de andere clubs kopen en verkopen ook
function openVenster(soort){
  const T0 = S.trainer; T0.venster = soort; T0.bod = null;
  clubTransfers(soort, {zonderMijn:true});
  maakMarkt();
}
// Begin van een seizoen bij een club (of halverwege, na een ontslag elders): budget, eisen, opstelling en transfervenster
export function seizoenStart(){
  const T0 = S.trainer, c = CLUBS[T0.club], halverwege = S.ronde > 0;
  T0.sz = nieuwSeizoenTeller();
  const basis = BUDGET[c.t] * (T0.bonus ? 1.25 : 1) * (halverwege ? .5 : 1);
  T0.budget = Math.round((basis + Math.max(0, T0.budget || 0) * .5) / 1000) * 1000; T0.bonus = false;
  for (const x of mijnSel()){ x.bT = 0; if (x.fit === undefined) x.fit = 100; }
  T0.opstelling = null; opst(); vulAan();
  maakEisen(halverwege);
  if (S.ronde === 0) openVenster('zomer'); else if (S.ronde === 7) openVenster('winter'); else T0.venster = null;
}
// Oude opslag: wat er nog niet is, aanvullen
export function zorgVoorTrainer(){
  const T0 = S.trainer; if (!T0) return;
  if (!T0.sz) T0.sz = nieuwSeizoenTeller();
  if (T0.budget === undefined) T0.budget = Math.round(BUDGET[CLUBS[T0.club].t] * .5 / 1000) * 1000;
  opst();
  if (!T0.eisen || T0.eisen.jaar !== S.jaar) maakEisen(S.ronde > 0);
}
export function kiesTrainerClub(id){
  const vorig = S.trainer;
  S.trainer = {club:id, rep:trainerRep(), wed:0, w:0, g:0, v:0, prijzen:vorig ? vorig.prijzen : [], hist:vorig ? vorig.hist : [], ontslagen:vorig ? vorig.ontslagen || 0 : 0, bestuur:60, moraal:60, tactiek:'balans', training:'tactiek', bespreking:null, seizoenen:vorig ? vorig.seizoenen : 0, laatste:null, totW:vorig ? vorig.totW : 0, totWed:vorig ? vorig.totWed : 0};
  S.sp.club = id; S.krantWacht = []; // oud nieuws uit je vorige baan hoort hier niet meer
  // Begin van een nieuw seizoen (na je spelerscarrière of na de zomer); na een ontslag midden in het seizoen ga je gewoon verder
  if (S.ronde >= AANTAL_RONDES || !vorig){ S.jaar++; S.ronde = 0; S.tab = nieuweTabellen(); S.ss = {wed:0, g:0, a:0, c:[], bods:0}; }
  S.trainer.hist.push(`${seizoenLabel()}: trainer van ${CLUBS[id].n} (${DIVS[CLUBS[id].t]})`);
  krantMelding(`${S.sp.naam} nieuwe trainer van ${CLUBS[id].n}`, 'De oud-speler staat voor het eerst langs de lijn als hoofdtrainer.', KRANTEN[CLUBS[id].t]);
  seizoenStart();
  S.fase = 'trainer';
}
// De training van deze week (vlak voor de wedstrijd)
function doeTraining(T0){
  const sel = mijnSel(), tr = T0.training;
  if (tr === 'conditie') sel.forEach(x => { if (!(x.bles > 0)) x.fit = clamp((x.fit ?? 100) + 8, 0, 100); });
  if (tr === 'rust') sel.forEach(x => { x.fit = clamp((x.fit ?? 100) + 12, 0, 100); });
  if (tr === 'jeugd' && rnd() < .3){ const l = sel.filter(jeugdSpeler); if (l.length){ const x = pick(l); x.k = clamp(x.k + 1, 25, 95); return `Op de training groeit ${metVoorletter(x)} (${x.lft}): klasse ${x.k - 1} → ${x.k}.`; } }
  return null;
}
export function trainerWedstrijd(){
  S.krantWacht = [];
  zorgVoorTrainer();
  const T0 = S.trainer, c = CLUBS[T0.club], fx = fixture(S.ronde), opp = CLUBS[fx.opp], tk = T0.tactiek, tr = T0.training, bs = T0.bespreking;
  T0.venster = null; T0.markt = null; T0.bod = null; // het transfervenster gaat dicht
  const trainingTekst = doeTraining(T0), vervangen = vulAan();
  let T = c.s + (elfKracht() - refKracht()) * .9 + (T0.moraal - 60) / 8 + Math.min(4, T0.totWed / 60) + (fx.thuis ? 2 : 0) + vormBonus(T0.club)
    + (tr === 'tactiek' ? 1 : 0) + (tr === 'rust' ? -.5 : 0) + (bs === 'motiveren' ? 1 : 0);
  const O = opp.s + (fx.thuis ? 0 : 2) + vormBonus(fx.opp);
  let fact = 1;
  if (tk === 'aanval'){ fact = 1.3; if (T > O) T += 1.5; }
  if (tk === 'verdedig'){ fact = .7; if (O > T) T += 1.5; }
  if (tk === 'rotatie'){ T -= 1.5; }
  let [a, b] = simGoals(T, O, false); a = Math.round(a * fact); b = Math.round(b * fact);
  // Wie scoorde er? Jouw elf (met de gewichten uit de opstelling) en de tegenstander
  const doelen = [], scorers = [];
  for (let i = 0; i < a; i++){ const d = willekeurigDoel(T0.club); doelen.push({club:T0.club, s:d.s, a:d.a}); if (d.s) scorers.push(metVoorletter(d.s)); }
  for (let i = 0; i < b; i++){ const d = willekeurigDoel(fx.opp); doelen.push({club:fx.opp, s:d.s, a:d.a}); }
  speelRonde(S.ronde, a, b, doelen);
  const won = a > b, gel = a === b, verwacht = c.s - opp.s;
  // tellers voor de eisen van het bestuur
  const z = T0.sz; if (fx.thuis){ z.thuisGes++; if (won) z.thuisW++; } if (fx.opp === rivaal(T0.club)){ z.rivaalGes++; if (won) z.rivaalW++; z.rivaalPt = (z.rivaalPt || 0) + (won ? 3 : a === b ? 1 : 0); }
  T0.wed++; T0.totWed++; if (won){ T0.w++; T0.totW++; } else if (gel) T0.g++; else T0.v++;
  T0.moraal = clamp(T0.moraal + (won ? (bs === 'motiveren' ? 7 : 6) : gel ? 0 : bs === 'motiveren' ? -9 : bs === 'rustig' ? -3 : -6), 20, 100);
  const blessures = naWedstrijd({rotatie:tk === 'rotatie', conditie:tr === 'conditie'});
  T0.bestuur = clamp(T0.bestuur + (won ? 3 : gel ? (verwacht > 3 ? -2 : 1) : (verwacht < -3 ? -1 : -5)), 0, 100);
  bijwerkenVertrouwen();
  const pl = stand(c.t).indexOf(T0.club) + 1;
  const regels = [won ? pick(['Je spelers volgen je plan perfect.', 'Een wissel van jou pakt geweldig uit.', 'Na rust zet je om en het werkt.']) : gel ? pick(['Een taaie wedstrijd zonder winnaar.', 'Jullie komen niet door de verdediging heen.']) : pick(['Je plan werkt vandaag niet.', 'Een individuele fout kost de wedstrijd.', 'De tegenstander is gewoon beter.'])];
  if (scorers.length) regels.push(`Doelpunten: ${scorers.join(', ')}.`);
  if (vervangen.length) regels.push(`Niet beschikbaar: ${vervangen.join(', ')}. Hun vervangers stonden in de basis.`);
  if (trainingTekst) regels.push(trainingTekst);
  for (const x of blessures) regels.push(`${metVoorletter(x)} raakt geblesseerd en is ${x.bles} ${x.bles === 1 ? 'week' : 'weken'} uit de roulatie.`);
  T0.laatste = {opp:opp.n, oppId:fx.opp, thuis:fx.thuis, a, b, regels, plek:pl, tk};
  T0.bespreking = null;
  S.ronde++;
  if (T0.bestuur < 15){ ontslaan(c, 'De resultaten vielen tegen. Het bestuur grijpt in.'); }
  S.fase = 'trainerUitslag';
}
function ontslaan(c, reden){
  const T0 = S.trainer;
  T0.ontslagen = (T0.ontslagen || 0) + 1; T0.rep = clamp(T0.rep - 8, 0, 100); T0.hist.push(`${seizoenLabel()}: ontslagen bij ${c.n}`);
  krantMelding(`${c.n} ontslaat trainer ${S.sp.naam}`, reden, KRANTEN[c.t]); T0.ontslag = true;
}
export function trainerVerder(){
  const T0 = S.trainer;
  if (T0.ontslag){ S.fase = 'trainerAanbod'; S.trainerAanbod = trainerAanbiedingen(); T0.ontslag = false; return; }
  if (S.ronde >= AANTAL_RONDES) return trainerSeizoenEinde();
  if (S.ronde === 7) openVenster('winter'); // de winterstop
  S.fase = 'trainer';
}
export function trainerSeizoenEinde(){
  const T0 = S.trainer, c = CLUBS[T0.club], t = c.t, plek = stand(t).indexOf(T0.club) + 1, prijzen = [];
  zorgVoorTrainer();
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
  S.trainerEind = {plek, t, prijzen, mijn, clubNaam:c.n, bestuur:o};
  voerPromotieUit(wissels);
  S.fase = 'trainerSeizoen';
}
export function trainerNieuwSeizoen(){
  const T0 = S.trainer;
  S.jaar++; S.sp.leeftijd++; S.ronde = 0; S.tab = nieuweTabellen(); S.ss = {wed:0, g:0, a:0, c:[], bods:0};
  T0.wed = 0; T0.w = 0; T0.g = 0; T0.v = 0; T0.moraal = 60; T0.bestuur = Math.max(T0.bestuur, 45);
  if (S.sp.leeftijd >= 70) return stopTrainer('Na een lang leven in het voetbal ga je met pensioen. De kantine is naar je vernoemd.');
  seizoenStart();
  S.fase = 'trainer';
}
// Ontslagen aan het einde van het seizoen, of zelf een andere club zoeken
export function trainerAndereClub(){
  S.jaar++; S.sp.leeftijd++; S.ronde = 0; S.tab = nieuweTabellen(); S.ss = {wed:0, g:0, a:0, c:[], bods:0};
  S.fase = 'trainerAanbod'; S.trainerAanbod = trainerAanbiedingen(); if (S.trainer) S.trainer.ontslag = false;
}
export function stopTrainer(reden){ S.trainer.gestopt = true; S.einde = {reden: reden || 'Je stopt als trainer. Tijd voor de achtertuin en de kleinkinderen.'}; S.fase = 'einde'; }
