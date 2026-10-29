import { S, seizoenLabel } from '../../core/state.js';
import { clamp, pick, randInt, rnd, shuffle } from '../../core/utils.js';
import { CLUBS, DIVS, divClubs } from '../../data/gegevens.js';
import { simGoals } from '../competitie/competitie.js';
import { selectie } from '../competitie/spelers.js';
import { metVoorletter } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { ik } from '../../core/geslacht.js';

/* ===================== Na je carrière: commentator / tv-analist ===================== */
// Elke week analyseer je een topwedstrijd: je voorspelt de uitslag en kiest hoe je praat. Goede voorspellingen en een
// pakkende stijl trekken kijkers; een controversiële uitspraak kan een rel geven. Na 14 weken kijkt de zender of je mag blijven.
export const WEKEN = 14;
export const STIJL = {
  nuchter:  {n:'Nuchter', d:'Rustig en inhoudelijk. Weinig risico, iets minder kijkers.', kijk:1, rel:0},
  emotie:   {n:'Emotioneel', d:'Met vuur en passie. Meer kijkers, soms een uitglijder.', kijk:1.25, rel:.05},
  rel:      {n:'Controversieel', d:'Harde meningen. Veel kijkers, maar je kunt een rel veroorzaken.', kijk:1.6, rel:.22},
};
export const VOORSPEL = {thuis:'Thuiswinst', gelijk:'Gelijkspel', uit:'Uitwinst'};
const ZENDERS = ['Studio Voetbal', 'Voetbal Vandaag Live', 'De Tweede Helft', 'Sportavond'];
// Startreputatie: je naam als speler
function startRep(){ const C = S.car; return clamp(Math.round(C.maxOvr - 45 + C.prijzen.length * 1.5 + (C.prijzen.some(x => /Gouden Bal/.test(x)) ? 10 : 0)), 5, 80); }
export const basisKijkers = A => Math.round((250 + A.rep * 12) * 1000);
export function startAnalist(){
  const A = S.analist = {zender:pick(ZENDERS), rep:startRep(), seizoen:1, week:0, kijkers:[], goed:0, rels:0, hist:[], salaris:0, totaalKijkers:0, wk:false, gestopt:false};
  A.salaris = Math.round((20000 + A.rep * 1500) / 1000) * 1000;
  A.hist.push(`${seizoenLabel()}: analist bij ${A.zender}`);
  krantMelding(`${S.sp.naam} nieuwe analist bij ${A.zender}`, `De oud-international gaat wekelijks de topwedstrijden bespreken. "Ik ga zeggen wat ik zie."`);
  nieuweWeek(); S.fase = 'analist';
}
// Drie topwedstrijden van deze week (uit de hoogste competitie van je land)
function nieuweWeek(){
  const A = S.analist, clubs = shuffle(divClubs(1).slice()).slice(0, 6);
  A.wedstrijden = [0, 1, 2].map(i => ({h:clubs[i * 2], u:clubs[i * 2 + 1]}));
  A.keuze = {w:0, voorspel:null, stijl:'nuchter'};
  // af en toe een gebeurtenis
  A.event = A.week > 0 && rnd() < .25 ? maakEvent() : null;
}
function maakEvent(){
  const A = S.analist, oud = (S.car.clubs || []).map(c => c.club).filter(id => CLUBS[id]);
  const id = oud.length ? pick(oud) : pick(divClubs(1)), x = pick(selectie(id)), naam = metVoorletter(x);
  return {tekst:`Je oude club ${CLUBS[id].n} verliest door een blunder van ${naam}, met wie je nog samen speelde. De regisseur vraagt of je hem gaat afkraken.`, opts:[
    {l:'Ja: zeggen hoe het zit', f(){ A.rep = clamp(A.rep + 1, 0, 100); A.bonus = 1.25; return `"Dit is onvergeeflijk op dit niveau." Het fragment gaat viraal. ${naam} stuurt je een boos berichtje.`; }},
    {l:'Nee: hem een beetje beschermen', f(){ A.bonus = .95; return '"Dit kan de beste overkomen." Netjes, maar de kijkers vinden het een beetje slap.'; }}]};
}
export function kiesEvent(i){ const A = S.analist; if (!A.event) return; A.eventTekst = A.event.opts[i].f(); A.event = null; }
// De analyse: de uitslag, de kijkers, en misschien een rel
export function analyseer(){
  const A = S.analist, k = A.keuze, w = A.wedstrijden[k.w], st = STIJL[k.stijl];
  if (!k.voorspel) return;
  const [gh, gu] = simGoals(CLUBS[w.h].s, CLUBS[w.u].s, true), uit = gh > gu ? 'thuis' : gh === gu ? 'gelijk' : 'uit', goed = uit === k.voorspel;
  const sterk = (CLUBS[w.h].s + CLUBS[w.u].s) / 2, kraker = 1 + Math.max(0, sterk - 70) / 40;
  let kijk = basisKijkers(A) * st.kijk * kraker * (goed ? 1.15 : .9) * (A.bonus || 1) * (.9 + rnd() * .2); A.bonus = 1;
  const rel = rnd() < st.rel;
  if (rel){ kijk *= 1.2; A.rep = clamp(A.rep - 6, 0, 100); A.rels++; krantMelding(`Ophef om uitspraak van analist ${S.sp.naam}`, `Na ${CLUBS[w.h].n} - ${CLUBS[w.u].n} schiet ${S.sp.naam} uit ${ik.zijn} slof. De zender krijgt honderden klachten.`); }
  if (goed){ A.goed++; A.rep = clamp(A.rep + 2, 0, 100); }
  if (k.stijl !== 'nuchter' && !rel) A.rep = clamp(A.rep + 1, 0, 100);
  kijk = Math.round(kijk / 1000) * 1000; A.kijkers.push(kijk); A.totaalKijkers += kijk; A.week++;
  A.laatste = {h:w.h, u:w.u, gh, gu, goed, voorspel:k.voorspel, stijl:k.stijl, kijk, rel};
  S.fase = 'analistUitslag';
}
export function analistVerder(){
  const A = S.analist;
  if (A.week >= WEKEN) return analistSeizoenEinde();
  nieuweWeek(); A.eventTekst = null; S.fase = 'analist';
}
// Na 14 weken: mag je blijven? Gemiddeld genoeg kijkers (ten opzichte van wat je naam belooft) = nieuw contract
export function analistSeizoenEinde(){
  const A = S.analist, gem = A.kijkers.reduce((a, b) => a + b, 0) / Math.max(1, A.kijkers.length), doel = basisKijkers(A) * .95;
  const blijft = gem >= doel || A.goed >= 9;
  S.sp.geld += A.salaris;
  const wk = !A.wk && A.rep >= 75; if (wk){ A.wk = true; A.hist.push(`${seizoenLabel()}: commentator bij het WK`); S.car.prijzen.push(`WK-commentator ${S.jaar}`); }
  A.eind = {gem:Math.round(gem / 1000) * 1000, doel:Math.round(doel / 1000) * 1000, blijft, goed:A.goed, rels:A.rels, salaris:A.salaris, wk};
  A.hist.push(`${seizoenLabel()}: gemiddeld ${Math.round(gem / 1000)}k kijkers, ${A.goed} van ${WEKEN} goed voorspeld${blijft ? '' : ' · contract niet verlengd'}`);
  krantMelding(blijft ? `${A.zender} verlengt met ${S.sp.naam}` : `${A.zender} stopt met ${S.sp.naam}`, blijft ? `De analist trok gemiddeld ${Math.round(gem / 1000)}.000 kijkers.` : 'De kijkcijfers vielen tegen.');
  S.fase = 'analistSeizoen';
}
export function analistNieuwSeizoen(){
  const A = S.analist; S.jaar++; S.sp.leeftijd++;
  A.seizoen++; A.week = 0; A.kijkers = []; A.goed = 0; A.rels = 0; A.salaris = Math.round((20000 + A.rep * 1500) / 1000) * 1000;
  nieuweWeek(); S.fase = 'analist';
}
export function stopAnalist(reden){ const A = S.analist; A.gestopt = true; S.einde = {reden: reden || 'Je stopt als analist. De microfoon gaat aan de wilgen.'}; S.fase = 'einde'; }
export const analistDiv = () => DIVS[1];
