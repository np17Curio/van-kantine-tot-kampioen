import { S, seizoenLabel } from '../../core/state.js';
import { clamp, pick, randInt, rnd, shuffle } from '../../core/utils.js';
import { CLUBS, WINTER, divClubs, rondesVan } from '../../data/gegevens.js';
import { ACHTERNAMEN, OPBOUW, VOORL, selectie } from '../competitie/spelers.js';
import { fixture, simGoals } from '../competitie/competitie.js';
import { metVoorletter } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { herschik } from '../transfers/markt.js';
import { FORMATIES, LINIE, eff, elfKracht, fit, kan, mijnSel, opst, pasToe, refKracht } from './ploeg.js';
import { geldF } from '../../data/gegevens.js';
import { ik, team } from '../../core/geslacht.js';

/* ===================== De loopbaan van een trainer ===================== */
// Eerst een diploma (UEFA B), dan de O23 van een club, en wie het daar goed doet wordt hoofdtrainer.
// Hoe beter je naam als trainer, hoe meer je mag: zelf kopen en verkopen, en extra trainers aanvragen.
export const DIPLOMAS = {
  B:  {n:'UEFA B',   prijs:2500,  d:'Je mag een O23-team trainen.'},
  A:  {n:'UEFA A',   prijs:10000, d:'Je mag hoofdtrainer worden in de tweede league.'},
  Pro:{n:'UEFA Pro', prijs:40000, d:'Je mag elke club trainen, ook in de hoogste league.'},
};
export const coach = () => (S.coach = S.coach || {diplomas:[], cursus:null, gezakt:{}, o23Sz:0, hoofdSz:0});
export const heeftDiploma = d => coach().diplomas.includes(d);
// In welke league mag je hoofdtrainer zijn? Met A de tweede league, met Pro alles
export const magLeague = t => heeftDiploma('Pro') || (heeftDiploma('A') && t >= 2);
// Welke cursus kun je nu volgen? A vanaf de winterstop van je eerste O23-seizoen, Pro na een seizoen als hoofdtrainer
export function volgendeCursus(){
  const c = coach(), T0 = S.trainer;
  if (!heeftDiploma('B')) return 'B';
  if (!heeftDiploma('A')) return c.o23Sz >= 1 || c.hoofdSz >= 1 || (T0 && T0.o23 && S.ronde >= WINTER) ? 'A' : null;
  if (!heeftDiploma('Pro')) return c.hoofdSz >= 1 ? 'Pro' : null;
  return null;
}
export const cursusWanneer = d => d === 'A' ? 'vanaf de winterstop van je eerste seizoen bij een O23' : d === 'Pro' ? 'na een volledig seizoen als hoofdtrainer' : 'nu';
// Het examen: 3 vragen, 2 goed = geslaagd. [vraag, goed antwoord, fout, fout]
const VRAGEN = [
  ['Je staat 1-0 voor en de tegenstander gaat vol aanvallen. Wat is meestal slim?', 'Compact verdedigen en snel counteren', 'Iedereen naar voren', 'Je keeper laten meevoetballen op de middenlijn'],
  ['Wat is buitenspel?', 'Bij de pass dichter bij de doellijn staan dan de bal en de op één na laatste tegenstander', 'Achter de laatste verdediger staan, op elk moment', 'Buiten het veld staan bij een inworp'],
  ['Hoeveel wissels mag je in een gewone competitiewedstrijd doen?', 'Vijf, in drie wisselmomenten', 'Drie, op elk moment', 'Onbeperkt'],
  ['Een speler heeft drie zware wedstrijden in een week gespeeld. Wat doe je?', 'Rust geven of laten rouleren', 'Extra conditietraining', 'Niks, hij is profvoetballer'],
  ['Wat is het doel van "gegenpressing"?', 'Direct na balverlies de bal terugwinnen', 'Zo snel mogelijk terug naar je eigen helft', 'De bal lang naar voren schieten'],
  ['Waar let je op bij een speler van 18 met veel talent?', 'Speelminuten en geduld: niet te snel te veel', 'Hem elke wedstrijd 90 minuten laten spelen', 'Hem verhuren aan een club zonder speeltijd'],
  ['In een 4-3-3 spelen de buitenspelers meestal...', 'breed, om de verdediging uit elkaar te trekken', 'als extra verdedigers', 'in het centrum achter de spits'],
  ['Je ploeg mist veel kansen. Welke training helpt het meest?', 'Afwerken in wedstrijdsituaties', 'Lange duurlopen', 'Alleen tactiekbesprekingen'],
  ['Wat doe je in de rust als je met 0-2 achterstaat?', 'Rustig blijven, één ding aanpassen en een duidelijke opdracht geven', 'De hele ploeg uitschelden', 'Alle elf spelers wisselen'],
  ['Wanneer krijgt een speler een rode kaart?', 'Bij ernstig gemeen spel of een tweede gele kaart', 'Bij elke overtreding in het strafschopgebied', 'Als hij te laat op de training is'],
  ['Waarom is een goede warming-up belangrijk?', 'Minder kans op blessures', 'Dan hoef je niet te trainen', 'Het telt mee voor de uitslag'],
  ['Wat betekent "tussen de linies spelen"?', 'Aanspeelbaar zijn tussen de verdediging en het middenveld van de tegenstander', 'Op de zijlijn blijven staan', 'Achter je eigen keeper staan'],
  ['Hoe ga je om met een ster die niet wil verdedigen?', 'Een eerlijk gesprek: iedereen werkt voor het team', 'Hem nooit meer opstellen zonder gesprek', 'Doen alsof je het niet ziet'],
  ['Wat is een "valse negen"?', 'Een spits die steeds uitzakt naar het middenveld', 'Een keeper die rugnummer 9 draagt', 'Een speler die vaak schwalbes maakt'],
  ['Een tegenstander is veel sterker. Welke tactiek past het best?', 'Laag blokkeren en op de counter loeren', 'Hoog druk zetten met iedereen', 'Met drie spitsen beginnen'],
  ['Wat doet een assistent-trainer vooral?', 'Trainingen mee voorbereiden en de tegenstander analyseren', 'De opstelling bepalen in plaats van de hoofdtrainer', 'Kaartjes verkopen'],
  ['Wanneer is een penalty opnieuw nemen verplicht?', 'Als de keeper te vroeg van zijn lijn komt en de bal niet ingaat', 'Als het publiek fluit', 'Altijd als de bal de paal raakt'],
  ['Wat is het belangrijkst bij een jonge selectie?', 'Duidelijke afspraken en veel herhaling op de training', 'Elke week een andere formatie', 'Zo weinig mogelijk trainen'],
];
const ster = () => { const C = S.car || {}; return (C.prijzen || []).some(p => /Gouden Bal/.test(p)) || (C.wed || 0) >= 400; };
export const cursusPrijs = d => Math.round(DIPLOMAS[d].prijs * (coach().gezakt[d] ? .5 : 1));
export function startCursus(d){
  const c = coach(); if (c.cursus && !c.cursus.klaar) return null; if (heeftDiploma(d)) return 'Dat diploma heb je al.';
  if (c.wachtTot && c.wachtTot.jaar === S.jaar && S.ronde < c.wachtTot.ronde && S.trainer) return 'Je kunt het examen volgende week opnieuw doen.';
  const p = cursusPrijs(d), sp = S.sp;
  if (sp.geld < p && d !== 'B') return `De cursus kost ${p.toLocaleString('nl-NL')} euro. Zoveel heb je niet.`;
  sp.geld = Math.max(0, sp.geld - p); // (de B-cursus betaalt de bond als je het geld niet hebt)
  const tip = d === 'B' && ster();
  c.cursus = {d, i:0, goed:0, laatste:null, klaar:false, geslaagd:false, tip, vragen:shuffle(VRAGEN.slice()).slice(0, 3).map(r => {
    let opts = r.slice(1); if (tip) opts = [opts[0], pick(opts.slice(1))]; opts = shuffle(opts); return {q:r[0], opts, goed:opts.indexOf(r[1])}; })};
  return null;
}
export function cursusAntwoord(j){
  const c = coach(), K = c.cursus; if (!K || K.klaar) return;
  const v = K.vragen[K.i], ok = j === v.goed; if (ok) K.goed++;
  K.laatste = ok ? 'Goed!' : `Fout. Het goede antwoord was: ${v.opts[v.goed]}.`;
  if (++K.i < K.vragen.length) return;
  K.klaar = true; K.geslaagd = K.goed >= 2;
  if (K.geslaagd){ c.diplomas.push(K.d); delete c.gezakt[K.d];
    (S.car && S.car.hist || []).push(`${seizoenLabel()}: trainersdiploma ${DIPLOMAS[K.d].n} gehaald`);
    if (S.trainer) S.trainer.hist.push(`${seizoenLabel()}: diploma ${DIPLOMAS[K.d].n} gehaald`);
    krantMelding(`${S.sp.naam} haalt ${ik.zijn} ${DIPLOMAS[K.d].n}-diploma`, `${K.goed} van de 3 vragen goed. ${DIPLOMAS[K.d].d}`); }
  else { c.gezakt[K.d] = true; c.wachtTot = {jaar:S.jaar, ronde:S.ronde + 1}; }
}
export const sluitCursus = () => { coach().cursus = null; };

// ---------- trainersniveau: hoe meer naam, hoe meer zeggenschap ----------
export const NIVEAUS = [
  {k:'beginnend',     n:'Beginnend',     min:0,  staf:0, budget:1,    d:'De technisch directeur doet de transfers. Jij mag één keer per transferperiode om een versterking vragen.'},
  {k:'ervaren',       n:'Ervaren',       min:45, staf:1, budget:1,    maxKoop:2, maxDeel:.5, d:'Zelf kopen (hooguit 2 spelers per transferperiode, elk voor hooguit de helft van je budget) en verkopen.'},
  {k:'gerespecteerd', n:'Gerespecteerd', min:60, staf:2, budget:1.1,  d:'Vrij kopen en verkopen, en 10% meer budget.'},
  {k:'top',           n:'Toptrainer',    min:75, staf:4, budget:1.25, ster:true, d:'Vrij kopen en verkopen, 25% meer budget en een sterspeler op de markt.'},
];
export const trainerNiveau = (rep = S.trainer ? S.trainer.rep : 0) => NIVEAUS.filter(x => rep >= x.min).pop();
export const volgendNiveau = (rep = S.trainer ? S.trainer.rep : 0) => NIVEAUS.find(x => x.min > rep) || null;

// ---------- extra trainers ----------
export const STAF = {
  conditie:{n:'Conditietrainer', d:'40% minder blessures en +3 fitheid per week.'},
  keeper:  {n:'Keeperstrainer',  d:'Minder tegengoals: de tegenstander is 0,7 zwakker.'},
  aanval:  {n:'Aanvalstrainer',  d:'Meer goals: jouw ploeg is 0,7 sterker.'},
  jeugd:   {n:'Jeugdtrainer',    d:'"Jeugd ontwikkelen" werkt vaker, en bij een O23 groeien je talenten sneller.'},
  video:   {n:'Videoanalist',    d:'+1 tegen een sterkere tegenstander.'},
};
const BASIS_BUDGET = [40e6, 6e6, 1.2e6, 250e3, 25e3, 5e3];
export const heeftStaf = k => !!(S.trainer && (S.trainer.staf || []).includes(k));
export const stafKosten = () => S.trainer && S.trainer.o23 ? 0 : Math.round(BASIS_BUDGET[CLUBS[S.trainer.club].t] * geldF() * .05 / 1000) * 1000;
export function vraagStaf(k){
  const T0 = S.trainer, N = trainerNiveau(), V = volgendNiveau(), l = T0.staf = T0.staf || [];
  if (l.includes(k)) return `Je hebt al een ${STAF[k].n.toLowerCase()}.`;
  if (l.length >= N.staf) return N.staf === 0 ? `Als beginnende trainer krijg je nog geen extra trainers. Vanaf reputatie ${V ? V.min : 45} wel.` : `Als ${N.n.toLowerCase()} trainer krijg je hooguit ${N.staf} extra ${N.staf === 1 ? 'trainer' : 'trainers'}.${V ? ` Vanaf reputatie ${V.min} meer.` : ''}`;
  if (T0.bestuur < 40) return 'Het bestuur wil eerst betere resultaten zien voordat er geld bij komt.';
  const kost = stafKosten(); if (kost > (T0.budget || 0)) return `Daar is geen budget voor (${kost.toLocaleString('nl-NL')} euro per seizoen).`;
  l.push(k); T0.budget -= kost;
  return `Akkoord! Er komt een ${STAF[k].n.toLowerCase()} bij${kost ? ` (${kost.toLocaleString('nl-NL')} euro per seizoen, van je budget)` : ''}.`;
}
export function ontslaStaf(k){ const T0 = S.trainer; T0.staf = (T0.staf || []).filter(x => x !== k); return `De ${STAF[k].n.toLowerCase()} vertrekt.`; }

// ---------- de O23 ----------
const o23Basis = id => CLUBS[id].s - 10;
function talent(pos, basis, s, gebruikt){
  const vrij = ACHTERNAMEN.filter(n => !gebruikt.has(n)), n = vrij.length ? pick(vrij) : pick(ACHTERNAMEN) + ' jr.'; gebruikt.add(n);
  const k = clamp(basis ? s + randInt(-3, 3) : s + randInt(-9, -2), 25, 90), lft = randInt(17, 21);
  return {v:pick(VOORL), n, pos, basis, k, kStart:k, pot:clamp(k + randInt(3, 15), k, 95), lft, fit:100, bles:0, bT:0, g:0, a:0, o23:true};
}
export function maakO23Sel(id){
  const sel = [], gebruikt = new Set(selectie(id).map(x => x.n)), s = o23Basis(id);
  for (const [pos, o] of Object.entries(OPBOUW)) for (let i = 0; i < o.g.length; i++) sel.push(talent(pos, i < o.basis, s, gebruikt));
  herschik(sel); return sel;
}
// Aanvullen tot de normale opbouw (na een doorstroming of aan het einde van een seizoen)
export function vulO23Aan(){
  const T0 = S.trainer, sel = T0.o23Sel, gebruikt = new Set(selectie(T0.club).map(x => x.n).concat(sel.map(x => x.n))), s = o23Basis(T0.club);
  for (const [pos, o] of Object.entries(OPBOUW)) for (let i = sel.filter(x => x.pos === pos).length; i < o.g.length; i++){ const x = talent(pos, false, s - 2, gebruikt); x.lft = randInt(16, 18); sel.push(x); }
  pasToe();
}
export const o23Stand = () => { const T = S.trainer.o23Tab || {}; return Object.keys(T).map(Number).sort((a, b) => T[b].pt - T[a].pt || (T[b].dv - T[b].dt) - (T[a].dv - T[a].dt) || T[b].dv - T[a].dv); };
export function nieuweO23Tab(){ const T0 = S.trainer, t = CLUBS[T0.club].t; T0.o23Tab = {}; for (const id of divClubs(t)) T0.o23Tab[id] = {g:0, w:0, gl:0, v:0, pt:0, dv:0, dt:0}; }
function o23Uitslag(id, v, t){ const r = S.trainer.o23Tab[id]; if (!r) return; r.g++; r.dv += v; r.dt += t; if (v > t){ r.w++; r.pt += 3; } else if (v === t){ r.gl++; r.pt++; } else r.v++; }
// Een speelronde in de O23-competitie: jouw wedstrijd, en de rest gesimuleerd (iedereen speelt even vaak)
export function o23Ronde(opp, a, b){
  const T0 = S.trainer; o23Uitslag(T0.club, a, b); o23Uitslag(opp, b, a);
  const rest = shuffle(Object.keys(T0.o23Tab).map(Number).filter(id => id !== T0.club && id !== opp));
  for (let i = 0; i + 1 < rest.length; i += 2){ const [h, u] = [rest[i], rest[i + 1]], [gh, gu] = simGoals(o23Basis(h), o23Basis(u), true); o23Uitslag(h, gh, gu); o23Uitslag(u, gu, gh); }
}
// Na elke wedstrijd groeit een deel van je talenten (meer met jeugdtraining en een jeugdtrainer)
export function o23Groei(){
  const T0 = S.trainer, kans = .05 + (T0.training === 'jeugd' ? .05 : 0) + (heeftStaf('jeugd') ? .04 : 0), uit = [];
  for (const x of T0.o23Sel) if (x.k < (x.pot || x.k) && rnd() < kans * (x.basis ? 1.3 : .8)){ x.k++; if (x.k - (x.kStart || x.k) === 3) uit.push(x); }
  return uit.length ? `${uit.map(x => metVoorletter(x)).join(', ')} ${uit.length === 1 ? 'is' : 'zijn'} dit seizoen al 3 klassen gegroeid.` : null;
}
export const zwaksteBasis = id => { const b = selectie(id).filter(x => x.basis).map(x => x.k); return b.length ? Math.min(...b) : 50; };
export const DOOR_WED = 4; // eerst minstens 4 keer in de basis bij de O23
export const kanDoorstromen = x => x.k >= zwaksteBasis(S.trainer.club) - 3 && (x.bT || 0) >= DOOR_WED;
export function doorstroom(naam){
  const T0 = S.trainer, sel = T0.o23Sel, x = sel.find(y => y.n === naam); if (!T0.o23 || !x) return null;
  if (!kanDoorstromen(x)) return `${metVoorletter(x)} is nog niet klaar: hij moet minstens klasse ${zwaksteBasis(T0.club) - 3} zijn en ${DOOR_WED} keer in de basis hebben gestaan.`;
  sel.splice(sel.indexOf(x), 1); opst().ids = opst().ids.filter(n => n !== naam);
  const eerste = selectie(T0.club); eerste.push({v:x.v, n:x.n, pos:x.pos, k:x.k, lft:x.lft, basis:false, g:0, a:0, jeugd:true, sindsWeek:S.weekNr || 0}); herschik(eerste);
  T0.sz.door = (T0.sz.door || 0) + 1; vulO23Aan();
  krantMelding(`${metVoorletter(x)} naar het eerste van ${CLUBS[T0.club].n}`, `De ${x.lft}-jarige (klasse ${x.k}) maakt de stap uit de O23. Trainer ${S.sp.naam}: "${team.Hij} heeft het verdiend."`);
  return `${metVoorletter(x)} gaat naar het eerste elftal! Een nieuw talent uit de jeugd neemt zijn plek in.`;
}
// Einde van een O23-seizoen: iedereen een jaar ouder, wie 22 wordt vertrekt (of stroomt alsnog door), nieuwe jeugd erbij
export function o23NieuwSeizoen(){
  const T0 = S.trainer, weg = [];
  for (const x of T0.o23Sel.slice()){ x.lft++; x.k = clamp(x.k + randInt(0, 2), 25, x.pot || 95); x.kStart = x.k; x.bT = 0; x.fit = 100; x.bles = 0;
    if (x.lft >= 22){ T0.o23Sel.splice(T0.o23Sel.indexOf(x), 1); weg.push(x); } }
  T0.opstelling = null; vulO23Aan(); nieuweO23Tab();
  return weg;
}
export const o23Punten = t => Math.round(rondesVan(t) * 1.25);

// ---------- de assistent-trainer: helpt je elke wedstrijd met de beste opstelling ----------
export const ASSISTENTEN = [
  {q:1, n:'Jonge assistent',   min:0,  kost:0,   d:'Maakt de beste elf in je huidige formatie en laat vermoeide spelers rusten. Schat een speler soms een puntje verkeerd in.'},
  {q:2, n:'Ervaren assistent', min:45, kost:.03, d:'Bekijkt alle formaties, adviseert een tactiek tegen deze tegenstander en ziet wie rust nodig heeft.'},
  {q:3, n:'Topassistent',      min:60, kost:.06, d:'Foutloos advies over opstelling, formatie en tactiek, en ook over de training van de week.'},
];
const ASS_NAMEN = ['Ruud', 'Henk', 'Marco', 'Erik', 'Dennis', 'Jaap', 'Sjoerd', 'Patrick', 'Kees', 'Arjen', 'Mehmet', 'Youssef'];
export const assistent = () => (S.trainer && S.trainer.assistent) || null;
export const assistentKost = q => S.trainer && S.trainer.o23 ? 0 : Math.round(BASIS_BUDGET[CLUBS[S.trainer.club].t] * geldF() * ASSISTENTEN[q - 1].kost / 1000) * 1000;
export function neemAssistent(q){
  const T0 = S.trainer, A = ASSISTENTEN[q - 1], N = trainerNiveau();
  if (T0.rep < A.min) return `Een ${A.n.toLowerCase()} wil alleen werken met een trainer vanaf reputatie ${A.min}. Jij zit op ${Math.round(T0.rep)} (${N.n.toLowerCase()}).`;
  const kost = assistentKost(q), oud = T0.assistent; if (kost > (T0.budget || 0)) return `Daar is geen budget voor (${kost.toLocaleString('nl-NL')} euro per seizoen).`;
  T0.budget = (T0.budget || 0) - kost;
  T0.assistent = {q, naam:`${pick(ASS_NAMEN)} ${pick(ACHTERNAMEN)}`, auto:oud ? oud.auto : false};
  return `${T0.assistent.naam} is je nieuwe ${A.n.toLowerCase()}${kost ? ` (${kost.toLocaleString('nl-NL')} euro per seizoen, van je budget)` : ''}. "Ik zet elke week mijn advies voor je klaar, trainer."`;
}
export function ontslaAssistent(){ const T0 = S.trainer, a = T0.assistent; T0.assistent = null; return a ? `${a.naam} vertrekt.` : ''; }
// Een vaste kleine vergissing per speler per week (alleen de jonge assistent)
const ruis = (x, q) => { if (q > 1) return 0; let h = S.ronde * 31 + S.jaar; for (const c of x.n) h = (h * 33 + c.charCodeAt(0)) % 9973; return (h % 5) / 2 - 1; };
// Een ervaren assistent laat wie heel moe is (fitheid onder de 50) liever rusten: dan is de kans op een blessure groot
// Hoe de assistent een speler waardeert: klasse min vermoeidheid, strenger dan de wedstrijd zelf (die telt pas onder de 60).
// Een moe basisspeler zakt elke week verder weg; rust nu voorkomt een slechte reeks en blessures later.
export const moeGrens = q => q >= 2 ? 78 : 75;
const keus = (x, q) => x.k + ruis(x, q) - Math.max(0, moeGrens(q) - fit(x)) / 2.5 - (fit(x) < 50 ? 3 : 0);
function elfVoor(f, q){
  const sel = mijnSel(), ids = [], nu = opst().ids, k2 = x => keus(x, q) + (nu.includes(x.n) ? .3 : 0); // bij twijfel: wie er nu staat blijft staan
  for (const pos of LINIE){ const n = pos === 'K' ? 1 : FORMATIES[f][pos];
    ids.push(...sel.filter(x => x.pos === pos && kan(x)).sort((a, b) => k2(b) - k2(a)).slice(0, n).map(x => x.n)); }
  const l = sel.filter(x => ids.includes(x.n));
  return {f, ids, kracht:l.length ? l.reduce((a, x) => a + eff(x), 0) / 11 : 0, waarde:l.reduce((a, x) => a + keus(x, q), 0) / 11, fit:l.reduce((a, x) => a + fit(x), 0) / 11};
}
const TACTIEK_NAAM = {aanval:'aanvallend', balans:'met balans', verdedig:'verdedigend', rotatie:'met rouleren'};
export function assistentAdvies(){
  const T0 = S.trainer, A = assistent(); if (!A) return null;
  const fx = fixture(S.ronde); if (!fx) return null;
  const o = opst(), formaties = A.q >= 2 ? Object.keys(FORMATIES) : [o.formatie];
  const best = formaties.map(f => elfVoor(f, A.q)).sort((a, b) => b.waarde - a.waarde)[0];
  const sel = mijnSel(), opp = CLUBS[fx.opp], wijS = T0.o23 ? refKracht() + 1.5 : CLUBS[T0.club].s, zijS = T0.o23 ? opp.s - 9 : opp.s;
  const basisFit = best.ids.map(n => fit(sel.find(x => x.n === n))).reduce((a, b) => a + b, 0) / 11;
  const tactiek = A.q < 2 ? null : zijS - wijS > 3 ? 'verdedig' : wijS - zijS > 3 ? 'aanval' : basisFit < 65 ? 'rotatie' : 'balans';
  const allesFit = sel.filter(kan).reduce((a, x) => a + fit(x), 0) / Math.max(1, sel.filter(kan).length);
  const training = A.q < 3 ? null : allesFit < 70 ? 'rust' : 'tactiek';
  const nu = elfKracht(), regels = [];
  const eruit = o.ids.filter(n => !best.ids.includes(n)).map(n => sel.find(x => x.n === n)).filter(Boolean), erin = best.ids.filter(n => !o.ids.includes(n)).map(n => sel.find(x => x.n === n)).filter(Boolean);
  for (const x of eruit.slice(0, 3)){ const y = erin.find(z => z.pos === x.pos) || erin[0]; if (!y) continue; erin.splice(erin.indexOf(y), 1);
    regels.push(!kan(x) ? `${metVoorletter(x)} is geblesseerd: ${metVoorletter(y)} erin.` : fit(x) < 50 ? `Geef ${metVoorletter(x)} rust (fitheid ${Math.round(fit(x))}): grote kans op een blessure. ${metVoorletter(y)} speelt.` : fit(x) < moeGrens(A.q) && fit(y) > fit(x) ? `Zet ${metVoorletter(x)} op de bank (fitheid ${Math.round(fit(x))}), ${metVoorletter(y)} is ${fit(y) >= 90 ? 'fit' : 'fitter'} (${Math.round(fit(y))}).` : y.k > x.k ? `${metVoorletter(y)} (klasse ${y.k}) is nu beter dan ${metVoorletter(x)} (${x.k}).` : `Ik heb een goed gevoel bij ${metVoorletter(y)}: hij krijgt deze week de voorkeur boven ${metVoorletter(x)}.`); }
  const mijnFit = o.ids.map(n => sel.find(x => x.n === n)).filter(Boolean), mf = mijnFit.length ? mijnFit.reduce((a, x) => a + fit(x), 0) / mijnFit.length : 100, moe = mijnFit.filter(x => fit(x) < 65);
  if (eruit.length > 3) regels.push(`En nog ${eruit.length - 3 === 1 ? 'één andere wissel' : `${eruit.length - 3} andere wissels`}.`);
  if (best.f !== o.formatie) regels.push(`Tegen ${opp.n} zou ik ${best.f} spelen${tactiek ? `, ${TACTIEK_NAAM[tactiek]}` : ''}.`);
  else if (tactiek) regels.push(`Speel ${TACTIEK_NAAM[tactiek]}: ${tactiek === 'verdedig' ? `${opp.n} is sterker, loer op de counter` : tactiek === 'aanval' ? `${opp.n} is zwakker, ga ervoor` : tactiek === 'rotatie' ? 'de ' + team.jongens + ' zijn moe' : 'een gelijkwaardige tegenstander'}.`);
  if (Math.round(best.fit) !== Math.round(mf)) regels.push(`Gemiddelde fitheid van mijn elf: ${Math.round(best.fit)} (jouw elf: ${Math.round(mf)}).`);
  if (moe.length && eruit.length) regels.push(`Let op: ${moe.length === 1 ? `${metVoorletter(moe[0])} staat` : `${moe.length} spelers staan`} nu met een fitheid onder de 65 in je elf.`);
  if (training && training !== T0.training) regels.push(training === 'rust' ? 'De groep is moe: geef deze week rust op de training.' : 'Iedereen is fit: train op tactiek.');
  const winst = best.kracht - nu;
  if (!regels.length) regels.push('Je opstelling is precies goed. Daar zou ik niets aan veranderen.');
  else if (winst > .05) regels.push(`Met mijn opstelling sta je ${winst.toFixed(1).replace('.', ',')} sterker.`);
  else if (winst < -.05) regels.push('Vandaag iets minder sterk, maar zo houden we de ' + team.jongens + ' heel voor de rest van het seizoen.');
  return {...best, tactiek, training, nu, winst, regels, zelfde:!eruit.length && best.f === o.formatie && (!tactiek || tactiek === T0.tactiek) && (!training || training === T0.training)};
}
export function pasAdviesToe(){
  const T0 = S.trainer, a = assistentAdvies(); if (!a) return null;
  const o = opst(); o.formatie = a.f; o.ids = a.ids.slice(); pasToe();
  if (a.tactiek) T0.tactiek = a.tactiek; if (a.training) T0.training = a.training;
  return a;
}
