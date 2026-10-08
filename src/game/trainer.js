import { S, seizoenLabel } from '../core/state.js';
import { clamp, pick, shuffle } from '../core/utils.js';
import { AANTAL_RONDES, CLUBS, DIVS, JEUGD, divClubs } from '../data/gegevens.js';
import { thuisLand } from '../data/landen.js';
import { fixture, simGoals } from './competitie/competitie.js';
import { speelRonde, stand } from './competitie/spelers.js';
import { KRANTEN } from './media/nieuws.js';
import { krantMelding } from './media/roddel.js';
import { bepaalPromotie, voerPromotieUit } from './seizoen/kampioen.js';
import { nieuweTabellen } from './speler/status.js';

/* ===================== Trainer worden ===================== */
export const TACTIEK = {
  aanval:   {n:'Aanvallend',   d:'Meer goals, voor en tegen. Sterk tegen zwakkere ploegen.'},
  balans:   {n:'Balans',       d:'Geen risico, geen verrassingen.'},
  verdedig: {n:'Verdedigend',  d:'Minder goals. Slim tegen sterkere ploegen.'},
  rotatie:  {n:'Rouleren',     d:'Rust voor vermoeide spelers: fitheid van de groep +10, wel iets zwakker.'}
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
export function kiesTrainerClub(id){
  const vorig = S.trainer;
  S.trainer = {club:id, rep:trainerRep(), wed:0, w:0, g:0, v:0, prijzen:vorig ? vorig.prijzen : [], hist:vorig ? vorig.hist : [], ontslagen:vorig ? vorig.ontslagen || 0 : 0, bestuur:60, moraal:60, fit:85, tactiek:'balans', seizoenen:vorig ? vorig.seizoenen : 0, laatste:null, totW:vorig ? vorig.totW : 0, totWed:vorig ? vorig.totWed : 0};
  S.sp.club = id;
  // Begin van een nieuw seizoen (na je spelerscarrière of na de zomer); na een ontslag midden in het seizoen ga je gewoon verder
  if (S.ronde >= AANTAL_RONDES || !vorig){ S.jaar++; S.ronde = 0; S.tab = nieuweTabellen(); S.ss = {wed:0, g:0, a:0, c:[], bods:0}; }
  S.trainer.hist.push(`${seizoenLabel()}: trainer van ${CLUBS[id].n} (${DIVS[CLUBS[id].t]})`);
  krantMelding(`${S.sp.naam} nieuwe trainer van ${CLUBS[id].n}`, 'De oud-speler staat voor het eerst langs de lijn als hoofdtrainer.', KRANTEN[CLUBS[id].t]);
  S.fase = 'trainer';
}
export function trainerWedstrijd(){
  S.krantWacht = [];
  const T0 = S.trainer, c = CLUBS[T0.club], fx = fixture(S.ronde), opp = CLUBS[fx.opp], tk = T0.tactiek;
  let T = c.s + (T0.moraal - 60) / 8 + (T0.fit - 80) / 10 + Math.min(4, T0.totWed / 60) + (fx.thuis ? 2 : 0), O = opp.s + (fx.thuis ? 0 : 2);
  let fact = 1;
  if (tk === 'aanval'){ fact = 1.3; if (T > O) T += 1.5; }
  if (tk === 'verdedig'){ fact = .7; if (O > T) T += 1.5; }
  if (tk === 'rotatie'){ T -= 1.5; }
  let [a, b] = simGoals(T, O, false); a = Math.round(a * fact); b = Math.round(b * fact);
  speelRonde(S.ronde, a, b);
  const won = a > b, gel = a === b, verwacht = c.s - opp.s;
  T0.wed++; T0.totWed++; if (won){ T0.w++; T0.totW++; } else if (gel) T0.g++; else T0.v++;
  T0.moraal = clamp(T0.moraal + (won ? 6 : gel ? 0 : -6), 20, 100);
  T0.fit = clamp(T0.fit + (tk === 'rotatie' ? 10 : -4), 40, 100);
  T0.bestuur = clamp(T0.bestuur + (won ? 3 : gel ? (verwacht > 3 ? -2 : 1) : (verwacht < -3 ? -1 : -5)), 0, 100);
  const pl = stand(c.t).indexOf(T0.club) + 1;
  const regels = [won ? pick(['Je spelers volgen je plan perfect.', 'Een wissel van jou pakt geweldig uit.', 'Na rust zet je om en het werkt.']) : gel ? pick(['Een taaie wedstrijd zonder winnaar.', 'Jullie komen niet door de verdediging heen.']) : pick(['Je plan werkt vandaag niet.', 'Een individuele fout kost de wedstrijd.', 'De tegenstander is gewoon beter.'])];
  T0.laatste = {opp:opp.n, thuis:fx.thuis, a, b, regels, plek:pl, tk};
  S.ronde++;
  if (T0.bestuur < 15){ T0.ontslagen = (T0.ontslagen || 0) + 1; T0.rep = clamp(T0.rep - 8, 0, 100); T0.hist.push(`${seizoenLabel()}: ontslagen bij ${c.n}`); krantMelding(`${c.n} ontslaat trainer ${S.sp.naam}`, 'De resultaten vielen tegen. Het bestuur grijpt in.', KRANTEN[c.t]); T0.ontslag = true; }
  S.fase = 'trainerUitslag';
}
export function trainerVerder(){
  const T0 = S.trainer;
  if (T0.ontslag){ T0.ontslag = false; S.fase = 'trainerAanbod'; S.trainerAanbod = trainerAanbiedingen(); return; }
  if (S.ronde >= AANTAL_RONDES) return trainerSeizoenEinde();
  S.fase = 'trainer';
}
export function trainerSeizoenEinde(){
  const T0 = S.trainer, c = CLUBS[T0.club], t = c.t, plek = stand(t).indexOf(T0.club) + 1, prijzen = [];
  if (plek === 1){ prijzen.push(`Kampioen als trainer: ${DIVS[t]} ${seizoenLabel()}`); T0.bestuur = clamp(T0.bestuur + 25, 0, 100); }
  const wissels = bepaalPromotie(), mijn = wissels.find(x => x.id === T0.club);
  T0.prijzen.push(...prijzen); T0.seizoenen++;
  // Reputatie en clubsterkte: succes trekt betere spelers en betere clubs aan
  T0.rep = clamp(T0.rep + (plek === 1 ? 12 : plek <= 3 ? 5 : plek >= 7 ? -4 : 0) + (mijn && mijn.naar < mijn.van ? 5 : 0) + (t <= 1 && plek <= 4 ? 3 : 0), 0, 100);
  if (plek <= 3) c.s = clamp(c.s + (plek === 1 ? 2 : 1), 30, 95);
  T0.hist.push(`${seizoenLabel()}: ${plek}e met ${c.n} in de ${DIVS[t]}${mijn ? (mijn.naar < mijn.van ? ' · gepromoveerd!' : ' · gedegradeerd') : ''}`);
  S.trainerEind = {plek, t, prijzen, mijn, clubNaam:c.n};
  voerPromotieUit(wissels);
  S.fase = 'trainerSeizoen';
}
export function trainerNieuwSeizoen(){
  const T0 = S.trainer;
  S.jaar++; S.sp.leeftijd++; S.ronde = 0; S.tab = nieuweTabellen(); S.ss = {wed:0, g:0, a:0, c:[], bods:0};
  T0.wed = 0; T0.w = 0; T0.g = 0; T0.v = 0; T0.moraal = 60; T0.fit = 85; T0.bestuur = Math.max(T0.bestuur, 45);
  if (S.sp.leeftijd >= 70) return stopTrainer('Na een lang leven in het voetbal ga je met pensioen. De kantine is naar je vernoemd.');
  S.fase = 'trainer';
}
export function stopTrainer(reden){ S.trainer.gestopt = true; S.einde = {reden: reden || 'Je stopt als trainer. Tijd voor de achtertuin en de kleinkinderen.'}; S.fase = 'einde'; }
