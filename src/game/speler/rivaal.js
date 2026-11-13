import { S, club, gemCijfer, mod, ovr, attr } from '../../core/state.js';
import { clamp, pick, randInt, rnd } from '../../core/utils.js';
import { AANTAL_RONDES, CLUBS, LAAGSTE, TRAINBAAR, divClubs, WINTER } from '../../data/gegevens.js';
import { selectie } from '../competitie/spelers.js';
import { metVoorletter } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { PERS } from './persoonlijkheid.js';
import { statusPunten } from './status.js';
import { social } from '../prive/social.js';
import { fixture } from '../competitie/competitie.js';
import { ik, team } from '../../core/geslacht.js';

/* ===================== Je vaste rivaal ===================== */
// Een speler van jouw leeftijd, op jouw positie en van ongeveer jouw niveau, bij een andere club.
// Hij staat echt in de selectie van die club (dus hij scoort ook in de andere wedstrijden), groeit mee en volgt je omhoog.
const POS_LINIE = {SPITS:'A', MID:'M', VERD:'V', KEEPER:'K'};
const NAMEN = ['Van Rijswijk', 'Brandsma', 'De Haas', 'Kortenhoeven', 'Vermeulen', 'Okonkwo', 'Lindqvist', 'Van der Stroom', 'El Haddaoui', 'Moreau', 'Kuipers', 'Sanchez-Duin'];
const VOORL = ['J', 'M', 'R', 'T', 'L', 'S', 'D', 'K'];
const ACHTERGROND = () => [
  'Jullie speelden al tegen elkaar in de jeugd en zijn sindsdien elkaars grootste concurrent.',
  'Jullie werden in hetzelfde jaar ontdekt. Sindsdien worden jullie altijd met elkaar vergeleken.',
  `${team.Hij} nam jouw plek in bij een jeugdselectie. Dat ben je nooit vergeten.`,
  'De media noemen jullie al jaren in één adem. Jullie kunnen elkaar niet uitstaan.',
];
/* ----- Meerdere rivalen ----- */
// sp.rivaal is je hoofdrivaal (de duels, de acties in de week, het interview, je ex-vriend). sp.rivalen zijn de andere
// rivalen ernaast (hooguit MAX_RIVALEN in totaal): een ploeggenoot die jouw plek wil, een speler van een andere club.
// Ze groeien, racen en spelen duels net als je hoofdrivaal; je kunt er een tot hoofdrivaal maken.
export const MAX_RIVALEN = 3;
export const sleutel = R => R ? R.v + '|' + R.n : '';
function norm(R){
  if (!R) return R;
  if (R.band === undefined){ R.band = -20; R.race = {}; }
  if (R.pot === undefined) R.pot = Math.max(R.k + 6, S.sp.pot + randInt(-4, 4));
  if (!R.onderling) R.onderling = {w:0, g:0, v:0}; if (!R.hist) R.hist = [];
  return R;
}
// De lijst op orde: gestopte bijrivalen eruit, en is je hoofdrivaal weg of gestopt, dan schuift de volgende door
function orde(){
  const sp = S.sp; if (!sp) return;
  if (!Array.isArray(sp.rivalen)) sp.rivalen = [];
  if (sp.rivalen.some(R => !R || R.gestopt || R === sp.rivaal || sleutel(R) === sleutel(sp.rivaal))) sp.rivalen = sp.rivalen.filter(R => R && !R.gestopt && R !== sp.rivaal && sleutel(R) !== sleutel(sp.rivaal));
  if ((!sp.rivaal || sp.rivaal.gestopt) && sp.rivalen.length) sp.rivaal = sp.rivalen.shift();
}
export const hoofdRivaal = () => { orde(); return norm(S.sp && S.sp.rivaal); };
export const overigeRivalen = () => { orde(); return ((S.sp && S.sp.rivalen) || []).map(norm); };
export const alleRivalen = () => { const H = hoofdRivaal(); return H ? [H, ...overigeRivalen()] : []; };
// De rivaal van de wedstrijd die nu loopt (of net klaar is): tegen een bijrivaal gaat het duel over hem. Anders je hoofdrivaal
export const duelRivaal = (M = S.M) => (M && M.rivaalSl && alleRivalen().find(R => sleutel(R) === M.rivaalSl)) || hoofdRivaal();
export const rivaal = () => duelRivaal();
// Je hoofdrivaal wordt een bijrivaal (je ex-vriend neemt zijn plaats in, journey.js). Geen plek meer? Dan verdwijnt hij uit beeld
export function degradeerHoofdRivaal(){
  const sp = S.sp, R = sp.rivaal; if (!R) return; orde();
  if (!R.gestopt && sp.rivalen.length < MAX_RIVALEN - 1){ sp.rivalen.unshift(R); }
  else { const r = rivaalSpeler(R); if (r) r.x.rivaal = false; }
  sp.rivaal = null;
}
// Een bijrivaal tot hoofdrivaal maken (je ex-vriend blijft altijd je hoofdrivaal)
export const kanHoofdRivaal = R => { const H = hoofdRivaal(); return !!(R && H && R !== H && !H.exVriend && !R.gestopt); };
export function maakHoofdRivaal(sl){
  const sp = S.sp, R = overigeRivalen().find(x => sleutel(x) === sl); if (!kanHoofdRivaal(R)) return;
  sp.rivalen.splice(sp.rivalen.indexOf(R), 1, sp.rivaal); sp.rivaal = R;
}
// Wat voor rivaal is het nu? (een ploeggenoot kan door een transfer een rivaal bij een andere club worden, en andersom)
export function rivaalSoort(R){
  if (R.exVriend) return 'Ex-vriend';
  const r = rivaalSpeler(R); return r && r.id === S.sp.club ? 'Ploeggenoot' : 'Andere club';
}
// Waar speelt hij nu? (een transfer van de computer kan hem verplaatsen: we zoeken op naam)
export function rivaalSpeler(R = rivaal()){
  if (!R || R.gestopt) return null;
  const bij = id => { const x = selectie(id).find(y => y.n === R.n && y.v === R.v); return x ? {id, x} : null; };
  const nu = CLUBS[R.club] ? bij(R.club) : null; if (nu) return nu;
  for (let id = 0; id < CLUBS.length; id++){ const r = bij(id); if (r){ R.club = id; return r; } }
  return null;
}
// Hem bij een club in de selectie zetten (als basisspeler op zijn linie)
export function plaats(id, R = hoofdRivaal()){
  const sel = selectie(id), linie = POS_LINIE[R.pos || S.sp.pos]; // (een ex-vriend houdt zijn eigen positie)
  const oud = rivaalSpeler(R); if (oud && oud.id !== id){ const s2 = selectie(oud.id); s2.splice(s2.indexOf(oud.x), 1); selectie(oud.id); }
  if (sel.some(y => y.n === R.n && y.v === R.v)) return;
  // de zwakste bankspeler op zijn linie maakt plaats
  const bank = sel.filter(y => y.pos === linie && !y.basis).sort((a, b) => a.k - b.k)[0]; if (bank) sel.splice(sel.indexOf(bank), 1);
  sel.push({v:R.v, n:R.n, pos:linie, basis:true, g:linie === 'A' ? 4.5 : linie === 'M' ? 2.4 : linie === 'K' ? 0 : 1, a:linie === 'M' ? 2.8 : linie === 'K' ? .1 : 1.6, k:R.k, lft:R.lft, rivaal:true});
  R.club = id;
}
// Een club voor hem: niet de jouwe, op jouw niveau (of eentje hoger/lager)
function kiesClub(t, niet = []){
  const mijn = S.sp.club, niv = [t, t - 1, t + 1].filter(x => x >= 1 && x <= LAAGSTE);
  for (const n of niv){ const l = divClubs(n).filter(i => i !== mijn && !niet.includes(i)); if (l.length) return pick(l); }
  return null;
}
function nieuwObject(o, id){
  const sp = S.sp, bezet = alleRivalen().map(sleutel);
  let v = o.v || pick(VOORL), n = o.n || pick(NAMEN);
  for (let i = 0; i < 20 && bezet.includes(v + '|' + n); i++){ v = pick(VOORL); n = pick(NAMEN); } // (geen twee rivalen met dezelfde naam)
  const R = {v, n, lft:sp.leeftijd + randInt(-1, 1), k:clamp(o.k ?? ovr(sp) + randInt(-3, 3), 30, 95), club:id,
    achtergrond:o.achtergrond || pick(ACHTERGROND()), karakter:pick(Object.keys(PERS)), onderling:{w:0, g:0, v:0}, hist:[], seizoen:null, band:o.band ?? -20, race:{}};
  if (o.soort) R.soort = o.soort; if (o.sinds) R.sinds = o.sinds;
  R.pot = Math.max(R.k + 4, clamp(sp.pot + randInt(-4, 4), 40, 95)); R.kVorig = R.k;
  return R;
}
// o (optioneel): {v, n, k, t, achtergrond} van de selectiedagen; zonder: een toevallige rivaal op jouw niveau
export function maakRivaal(o = {}){
  const sp = S.sp, H = hoofdRivaal(); if (H) return H;
  const t = o.t || club().t, id = kiesClub(t); if (id == null) return null;
  sp.rivaal = nieuwObject(o, id);
  plaats(id, sp.rivaal);
  return sp.rivaal;
}
// Een nieuwe rivaal duikt op in de loop van je carrière (hooguit één per seizoen, en hooguit MAX_RIVALEN in totaal)
const NIEUW_PLOEG = [
  n => `De club haalde ${n} als concurrent voor jouw plek. Op elke training vechten jullie om de basisplaats.`,
  n => `${n} kwam uit de jeugd en wil jouw plek. De trainer zegt: "Wie het beste traint, speelt."`,
  n => `${n} zit in de kleedkamer naast je, maar gunt je niets. Jullie strijden om dezelfde plek.`,
];
const NIEUW_CLUB = [
  c => `Na een fel duel kunnen jullie elkaar niet meer luchten. ${team.Hij} speelt bij ${c}.`,
  c => `De fans van ${c} hebben een spandoek over jou gemaakt. ${team.Hij} is hun held, en jouw nieuwe rivaal.`,
  c => `${team.Hij} zei in een interview bij ${c} dat jij overschat bent. Dat vergeet je niet.`,
];
export function nieuweRivaal(){
  const sp = S.sp; if (!sp || S.trainer || sp.clubloos || sp.o23 || CLUBS[sp.club] == null) return null;
  if (!hoofdRivaal() || alleRivalen().filter(R => !R.gestopt).length >= MAX_RIVALEN) return null;
  const ploeg = rnd() < .45, sinds = S.jaar;
  let R;
  if (ploeg){
    R = nieuwObject({soort:'ploeggenoot', sinds, band:-10, k:clamp(ovr(sp) + randInt(-2, 2), 30, 95)}, sp.club);
    R.achtergrond = pick(NIEUW_PLOEG)(metVoorletter(R));
    sp.rivalen.push(R); plaats(sp.club, R);
    krantMelding(`${metVoorletter(R)} wil de plek van ${sp.naam}`, `Bij ${club().n} is de strijd om de basisplaats losgebarsten. "Ik ben hier niet gekomen om op de bank te zitten," zegt ${metVoorletter(R)}.`);
    if (S.week) S.week.tekst.push(`Je hebt er een rivaal bij: ploeggenoot ${metVoorletter(R)} wil jouw plek.`);
  } else {
    const id = kiesClub(club().t, alleRivalen().map(x => x.club)); if (id == null) return null;
    R = nieuwObject({soort:'club', sinds, band:-25}, id);
    R.achtergrond = pick(NIEUW_CLUB)(CLUBS[id].n);
    sp.rivalen.push(R); plaats(id, R);
    krantMelding(`Nieuwe rivaliteit: ${sp.naam} tegen ${metVoorletter(R)}`, `${metVoorletter(R)} van ${CLUBS[id].n} en ${sp.naam} zoeken elkaar op. De volgende ontmoeting wordt beladen.`);
    if (S.week) S.week.tekst.push(`Je hebt er een rivaal bij: ${metVoorletter(R)} van ${CLUBS[id].n}.`);
  }
  return R;
}
// Zijn doelpunten en assists dit seizoen (over alle clubs waar hij speelde)
export function rivaalStats(R = rivaal()){
  let g = 0, a = 0; if (!R) return {g, a};
  for (const x of Object.values((S.ss && S.ss.st) || {})) if (!x.jij && x.n === R.n && x.v === R.v){ g += x.g || 0; a += x.a || 0; }
  return {g, a};
}
export const rivaalNaam = (R = rivaal()) => R ? metVoorletter(R) : '';
// Welke rivaal speelt er bij deze tegenstander? (je hoofdrivaal gaat voor)
export const rivaalTegen = opp => alleRivalen().find(R => { const r = rivaalSpeler(R); return !!(r && !(R.blessure > 0) && r.id === opp && r.id !== S.sp.club); }) || null;
export const speeltTegenRivaal = opp => !!rivaalTegen(opp);
// Na een wedstrijd tegen zijn club: onderling resultaat, en de krant als een van jullie scoorde
export function naRivaalDuel(M){
  const R = duelRivaal(M); if (!R || !M.rivaal) return null;
  const won = M.us > M.them, gel = M.us === M.them; R.onderling[won ? 'w' : gel ? 'g' : 'v']++;
  let inzet = '';
  const hijG = (M.doelen || []).filter(d => d.club === M.opp && d.s && d.s.n === R.n).length;
  if (R.uitgedaagd){ // je had hem uitgedaagd: dit duel telde dubbel
    if (won){ mod('rep', 5); statusPunten(4); mod('moraal', 5); inzet = ' Je had ' + team.hem + ' uitgedaagd en je maakt je woorden waar. De pers is lyrisch.'; }
    else if (!gel){ mod('rep', -4); mod('moraal', -8); inzet = ' Je had ' + team.hem + ' uitgedaagd... en je verliest. De pers lacht je uit.'; }
    else inzet = ' Na al die grote woorden: gelijk. Niemand is overtuigd.';
  }
  if (won) zetBand(-5, R);
  // Man tegen man: zijn cijfer tegen het jouwe (alleen als je zelf speelde)
  const speelde = M.rol === 'basis' || M.rol === 'invaller';
  let cijferRegel = '';
  if (speelde){
    const hij = Math.round(clamp(6.2 + hijG * .9 + (M.them > M.us ? .3 : M.them < M.us ? -.3 : 0) + rnd() * 1.2 - .6, 4, 9.5) * 10) / 10, jij = M.cijfer, f = x => x.toFixed(1).replace('.', ',');
    const cd = R.cijferDuels = R.cijferDuels || {w:0, v:0};
    if (jij > hij){ cd.w++; mod('moraal', 3); cijferRegel = ` Cijfers: jij ${f(jij)}, ${team.hij} ${f(hij)}. Het duel is voor jou.`; }
    else if (jij < hij){ cd.v++; mod('moraal', -3); cijferRegel = ` Cijfers: jij ${f(jij)}, ${team.hij} ${f(hij)}. ${team.Hij} was vandaag beter.`; }
    else cijferRegel = ` Cijfers: allebei een ${f(jij)}.`;
    if (R.grootSpraak){ if (jij >= 7){ mod('rep', 2); cijferRegel += ' Je grote woorden in het interview maak je waar.'; } else { mod('rep', -2); cijferRegel += ' Na je grote woorden in het interview valt dit tegen.'; } }
  } else if (hijG){ mod('moraal', -2); cijferRegel = ` Jij kon niets doen, en ${team.hij} scoorde.`; }
  R.grootSpraak = false; inzet += cijferRegel;
  R.uitgedaagd = false; R.voorbereid = false;
  const naam = rivaalNaam(R);
  if (M.goals || hijG) krantMelding(M.goals > hijG ? `${S.sp.naam} wint het duel met rivaal ${naam}` : hijG > M.goals ? `Rivaal ${naam} steelt de show tegen ${S.sp.naam}` : `${S.sp.naam} en ${naam} houden elkaar in evenwicht`,
    `${M.goals ? `${S.sp.naam} scoorde ${M.goals}x` : `${S.sp.naam} scoorde niet`}, ${hijG ? `${naam} ${hijG}x` : `${naam} niet`}. Onderling: ${R.onderling.w} zeges, ${R.onderling.g} gelijk, ${R.onderling.v} nederlagen.`);
  return `Het duel met je rivaal ${naam}: ${won ? 'jij wint deze keer!' : gel ? 'gelijk, niemand wint.' : '' + team.hij + ' heeft deze keer gewonnen.'} Onderling: ${R.onderling.w}-${R.onderling.g}-${R.onderling.v}.${inzet}`;
}
// Einde seizoen: de race, en daarna wordt hij een jaar ouder en beter of slechter, net als jij
// Zonder R: je hoofdrivaal, met in .overig de races met je andere rivalen
export function rivaalSeizoen(R){
  if (!R){ const H = hoofdRivaal(), uit = H && !H.gestopt ? rivaalSeizoen(H) : null, overig = overigeRivalen().filter(x => !x.gestopt).map(x => rivaalSeizoen(x)).filter(Boolean);
    if (!uit) return overig.length ? Object.assign(overig.shift(), {overig}) : null; uit.overig = overig; return uit; }
  if (R.gestopt) return null;
  const st = rivaalStats(R), sp = S.sp, jij = {g:S.ss.g || 0, a:S.ss.a || 0}, naam = rivaalNaam(R);
  const doel = sp.pos === 'SPITS' ? 'g' : 'a', woord = doel === 'g' ? 'goals' : 'assists';
  const winst = jij[doel] > st[doel] ? 'jij' : jij[doel] < st[doel] ? 'hij' : 'gelijk';
  const tekst = `De race met je rivaal ${naam}: jij ${jij[doel]} ${woord}, ${team.hij} ${st[doel]}. ${winst === 'jij' ? 'Dit seizoen ben jij de beste.' : winst === 'hij' ? 'Dit seizoen was ' + team.hij + ' beter. Volgend jaar pak je ' + team.hem + '.' : 'Precies gelijk!'}`;
  R.hist.push(`${S.jaar}: jij ${jij[doel]}, ${team.hij} ${st[doel]} ${woord} · klasse ${R.k}`); if (R.hist.length > 12) R.hist.shift();
  R.seizoen = {jij:jij[doel], hij:st[doel], woord, winst};
  R.race = {};
  let prijs = null;
  if (winst === 'jij' && jij[doel] >= 3){ prijs = `Race gewonnen van rivaal ${naam} (${jij[doel]} tegen ${st[doel]} ${woord})`; mod('rep', 3); statusPunten(2); }
  else if (winst === 'hij') mod('moraal', -4);
  return {tekst, prijs, winst, kop: winst === 'hij' ? `${naam} wint de race van ${sp.naam}` : winst === 'jij' ? `${sp.naam} wint de race van rivaal ${naam}` : `${sp.naam} en ${naam}: geen winnaar`};
}
export function rivaalOuder(groeiJij, R){
  if (!R){ alleRivalen().forEach(x => rivaalOuder(groeiJij, x)); hoofdRivaal(); return; } // (daarna: een gestopte hoofdrivaal maakt plaats)
  const r = rivaalSpeler(R);
  // De rest van zijn groei van dit seizoen (de helft kwam in de winterstop), en hij laat zich niet afschudden
  const rest = R.groeiJaar === S.jaar ? (R.groeiRest || 0) : groeiSeizoen(R);
  groei(R, rest);
  const extra = (ovr(S.sp) - R.k >= 6 ? 1 : 0) + (R.seizoen && R.seizoen.winst === 'hij' ? 1 : 0);
  if (extra && !(R.lft >= 31)){ zetK(R, R.k + extra); if (R.k > R.pot) R.pot = R.k; }
  R.groeiRest = 0; R.lft++; R.kVorig = R.k;
  if (r){ r.x.k = R.k; r.x.lft = R.lft; }
  // op zijn 37e stopt hij
  if (R.lft >= 37 && !R.gestopt){ R.gestopt = true; if (r){ const sel = selectie(r.id); sel.splice(sel.indexOf(r.x), 1); selectie(r.id); }
    krantMelding(`Rivaal ${rivaalNaam(R)} stopt met voetballen`, `Na jaren strijd met ${S.sp.naam} hangt ${team.hij} ${team.zijn} schoenen aan de wilgen. "${team.Hij} maakte mij beter," zegt ${S.sp.naam}.`); }
}
// In een transfervenster: volgt hij je omhoog, of wordt hij zelfs je teamgenoot?
// Zonder R: al je rivalen (de teksten achter elkaar)
export function rivaalVenster(soort, R){
  if (!R){ const l = alleRivalen().map(x => rivaalVenster(soort, x)).filter(Boolean); return l.length ? l.join(' ') : null; }
  if (R.gestopt) return null; let r = rivaalSpeler(R);
  if (!r){ const id = kiesClub(club().t); if (id != null) plaats(id, R); return null; }
  const t = club().t, hijT = CLUBS[r.id].t, naam = rivaalNaam(R);
  if (hijT > t && rnd() < .6){ const id = kiesClub(t); if (id != null && CLUBS[id].t === t){ plaats(id, R); krantMelding(`Rivaal ${naam} volgt ${S.sp.naam} naar de top`, `${naam} tekent bij ${CLUBS[id].n}. "Ik wil laten zien dat ik net zo goed ben."`); return `Je rivaal ${naam} maakt ook de stap omhoog: ${team.hij} tekent bij ${CLUBS[id].n}.`; } }
  if (r.id !== S.sp.club && rnd() < (R.band >= 60 ? .2 : R.band <= -60 ? 0 : .05)){ plaats(S.sp.club, R); krantMelding(`Opvallend: rivaal ${naam} tekent bij de club van ${S.sp.naam}`, `De twee rivalen zijn nu teamgenoten. "We hoeven geen vrienden te worden," zegt ${naam}.`); return `Wat?! Je rivaal ${naam} tekent bij jouw club. Jullie strijden nu om dezelfde plek.`; }
  return null;
}

/* ----- De band met je rivaal, acties, gebeurtenissen en de race ----- */
export const zetBand = (d, R = rivaal()) => { if (R) R.band = clamp(R.band + d, -100, 100); };
export const BANDEN = [[-60, 'Aartsvijand'], [-20, 'Vijand'], [19, 'Concurrent'], [59, 'Respect'], [100, 'Vriendschap']];
export const bandLabel = (b = rivaal() ? rivaal().band : 0) => BANDEN.find(([g]) => b <= g)[1];
export const actiefRivaal = (R = rivaal()) => !!(R && !R.gestopt && rivaalSpeler(R) && !S.trainer);
// De race: goals voor een spits, assists voor de rest
export function raceStand(R = rivaal()){
  if (!R) return null;
  const doel = S.sp.pos === 'SPITS' ? 'g' : 'a', st = rivaalStats(R), jij = (S.ss && S.ss[doel]) || 0;
  return {doel, woord:doel === 'g' ? 'goals' : 'assists', jij, hij:st[doel], verschil:jij - st[doel]};
}
// Het volgende duel in de competitie (week en thuis/uit), of null
export function volgendDuel(R = rivaal()){
  const r = rivaalSpeler(R); if (!r || S.sp.clubloos || r.id === S.sp.club || CLUBS[r.id].t !== club().t) return null;
  for (let ronde = S.ronde; ronde < AANTAL_RONDES; ronde++){ try { const f = fixture(ronde); if (f && f.opp === r.id) return {ronde, thuis:f.thuis}; } catch(e){ return null; } }
  return null;
}
// Hij jaagt je op: wie achter staat in de race (of hem niet kan uitstaan) traint feller
// (met meer rivalen telt de felste prikkel; een ploeggenoot die jouw plek wil, jaagt je altijd een beetje op)
export function rivaalPrikkel(){
  if (S.sp.clubloos || S.trainer) return 0;
  return Math.max(0, ...alleRivalen().filter(R => actiefRivaal(R)).map(R => { const rs = raceStand(R), r = rivaalSpeler(R);
    return rs && rs.verschil <= -2 ? .08 : R.band <= -20 ? .04 : r && r.id === S.sp.club ? .03 : 0; }));
}
// Acties in de week (één per week, naast je gewone activiteit)
export const RIVAAL_ACTIES = {
  uitdagen:{n:'Uitdagen in de media', get s(){ return `"Ik ben beter dan ${team.hij}." Reputatie +2 · het volgende duel telt dubbel · jullie band wordt slechter`; }},
  analyse:{get n(){ return `${team.Zijn} wedstrijden analyseren`; }, s:'Klaar voor het volgende duel: focus +8 bij de aftrap en meer kans in jullie duels · fitheid −2'},
  contact:{n:'Contact zoeken', s:'Een berichtje of samen koffie. Jullie band wordt beter'},
};
export const kanRivaalActie = () => actiefRivaal() && !S.sp.clubloos && S.week && !S.week.rivaalActie;
export function doeRivaalActie(id){
  const R = rivaal(), sp = S.sp, w = S.week, naam = rivaalNaam(); if (!kanRivaalActie()) return;
  let t;
  if (id === 'uitdagen'){
    zetBand(-15); mod('rep', 2); mod('moraal', 3); R.uitgedaagd = true; R.reactie = rnd() < .5;
    const gem = gemCijfer(), rs = raceStand();
    t = `Je zegt tegen een journalist: "${naam}? Ik ben gewoon beter." De krant zet het groot op de sportpagina. Het volgende duel telt dubbel.`;
    if ((gem !== null && gem < 6.3) || (rs && rs.verschil < 0)){ mod('rep', -2); t += ' Maar met jouw cijfers lachen de lezers je uit.'; }
    krantMelding(`${sp.naam}: "Ik ben beter dan ${naam}"`, `De rivaliteit laait op. "Laat ${team.hem} maar komen," zegt ${sp.naam}.`);
  } else if (id === 'analyse'){
    mod('fit', -2); R.voorbereid = true;
    const d = volgendDuel();
    t = `Je bekijkt uren beelden van ${naam}: ${team.zijn} favoriete actie, ${team.zijn} zwakke been. ${d ? `In week ${d.ronde + 1} ben je er klaar voor.` : 'Als jullie elkaar weer treffen, ben je er klaar voor.'}`;
  } else if (id === 'contact'){
    zetBand(15); mod('moraal', 2);
    t = R.band >= 60 ? `Je drinkt koffie met ${naam}. Jullie lachen om oude verhalen. Jullie zijn rivalen met respect.` : `Je stuurt ${naam} een berichtje. ${team.Hij} stuurt een kort antwoord terug. Het ijs is een beetje gebroken.`;
  }
  w.rivaalActie = id; w.tekst.push(t);
}
// Gebeurtenissen met je rivaal (vanuit maakEvent)
export function rivaalEvents(){
  if (S.sp.clubloos) return [];
  const ov = overigeRivalen().filter(x => actiefRivaal(x)), extra = ov.length ? overigEvents(pick(ov)) : [];
  if (!actiefRivaal(hoofdRivaal())) return extra;
  const R = hoofdRivaal(), sp = S.sp, naam = rivaalNaam(R), rs = raceStand(R), uit = extra;
  const zetBand = d => zetBandR(d, R), blesseer = () => blesseerR(R);
  const kaats = {soort:'prive', tekst:`Je rivaal ${naam} reageert in de krant: "${sp.naam}? Die moet eerst maar eens laten zien wat ${ik.hij} kan. Praten is makkelijk."`, opts:[
    {l:'Terugslaan in de media', f(){ zetBand(-10); mod('rep', 1); mod('focus', -3); if (rnd() < .3){ mod('vert', -4); return 'Je haalt hard uit. De trainer roept je bij zich: "Focus op het voetbal."'; } return 'Je haalt hard uit. De fans genieten van de oorlog in de krant.'; }},
    {l:'Negeren en doortrainen', f(){ mod('focus', 4); mod('vert', 2); return 'Je zegt niets. Op het veld praat je wel. De trainer waardeert je rust.'; }},
    {l:'Met humor reageren', f(){ mod('rep', 2); zetBand(5); social().volgers = Math.round(social().volgers * 1.03 + 50); return `Je post een grappige foto van een praatpaal met "${naam}" erop. Iedereen lacht, zelfs ${team.hij}.`; }}]};
  if (R.reactie){ R.reactie = false; return [kaats]; }
  if (R.band < -40) uit.push(kaats);
  if (rs && rs.verschil <= -2) uit.push({soort:'prive', tekst:`${naam} heeft al ${rs.hij} ${rs.woord}, jij ${rs.jij}. Op social media worden jullie vergeleken, en niet in jouw voordeel.`, opts:[
    {l:'Extra trainen', f(){ mod('fit', -8); const k = TRAINBAAR.slice().sort((a, b) => sp.a[a] - sp.a[b])[0]; if (rnd() < .4){ sp.a[k] = Math.min(99, sp.a[k] + 1); return `Je traint elke avond extra. Je ${attr(k).toLowerCase()} gaat omhoog naar ${sp.a[k]}.`; } return 'Je traint elke avond extra. Moe, maar gemotiveerd.'; }},
    {l:'' + team.Hem + ' feliciteren', f(){ zetBand(10); mod('rep', 1); return `Je feliciteert ${naam} met ${team.zijn} goede seizoen. Sportief: dat valt op.`; }},
    {l:'Er niets mee doen', f(){ mod('moraal', -2); return 'Je doet alsof het je niets doet. Maar het knaagt.'; }}]});
  if (!R.blessure && rnd() < .3) uit.push({soort:'prive', tekst:`Slecht nieuws voor je rivaal: ${naam} is geblesseerd en is een paar weken uit de roulatie.`, opts:[
    {l:'Beterschap wensen', f(){ blesseer(); zetBand(20); mod('rep', 2); return 'Je stuurt ' + team.hem + ' een berichtje: "Snel beter, ik wil je verslaan als je fit bent." ' + team.Hij + ' waardeert het.'; }},
    {l:'Er een grap over maken', f(){ blesseer(); zetBand(-25); mod('rep', -4); social().volgers = Math.round(social().volgers * 1.04 + 80); return 'Je grap gaat viraal... maar veel mensen vinden het smakeloos.'; }},
    {l:'Niets zeggen', f(){ blesseer(); return 'Je houdt je mond. Dat is ook een keuze.'; }}]});
  uit.push({soort:'prive', tekst:`${naam} post een foto van zichzelf met de tekst: "Nummer 1 van de competitie 👑". Je vrienden sturen hem door.`, opts:[
    {l:'Reageren met jouw cijfers', f(){ if (rs && rs.verschil > 0){ mod('rep', 3); zetBand(-5); return `Je reageert: "${rs.jij} ${rs.woord}. En jij?" Iedereen ziet wie er echt voor staat.`; } mod('rep', -3); return 'Je reageert met je cijfers... maar ' + team.hij + ' staat voor. Dat was geen goed idee.'; }},
    {l:'Negeren', f(){ return 'Je scrolt verder. Niet aan beginnen.'; }},
    {l:'Een like geven', f(){ zetBand(5); return 'Je geeft ' + team.hem + ' een like. ' + team.Hij + ' is verbaasd, en een beetje blij.'; }}]});
  uit.push({soort:'prive', tekst:`Een journalist vraagt je na de training: "Wie is beter, jij of ${naam}?"`, opts:[
    {l:'"Ik natuurlijk"', f(){ zetBand(-15); mod('rep', 2); R.uitgedaagd = true; return 'De kop van morgen staat al vast. Het volgende duel telt dubbel.'; }},
    {l:'"' + team.Hij + ' is een goede ' + team.speler + '"', f(){ zetBand(8); mod('vert', 2); return 'Een volwassen antwoord. De trainer knikt.'; }},
    {l:'"Daar ga ik niet over"', f(){ return 'Je laat je niet verleiden. De journalist zucht.'; }}]});
  if (R.band >= 60) uit.push({soort:'prive', tekst:`${naam} belt je: "Zin om deze week samen extra te trainen? Wie het hardst loopt, wint."`, opts:[
    {l:'Ja, samen trainen', f(){ mod('fit', -5); mod('focus', 5); zetBand(5); return 'Jullie jagen elkaar op. Een rivaal die je beter maakt.'; }},
    {l:'Nee, liever alleen', f(){ return 'Je slaat het aanbod af. Een rivaal blijft een rivaal.'; }}]});
  return uit;
}
// Gebeurtenissen met een van je andere rivalen
function overigEvents(R){
  const sp = S.sp, naam = rivaalNaam(R), r = rivaalSpeler(R), uit = [];
  if (r && r.id === sp.club) uit.push({soort:'prive', tekst:`Op de training gaat ploeggenoot ${naam} er vol in bij een duel met jou. ${team.Hij} wil jouw plek, en dat laat ${team.hij} merken.`, opts:[
    {l:'Hard terug', f(){ zetBandR(-10, R); mod('focus', 3); if (rnd() < .35){ mod('vert', -3); return 'Jullie liggen allebei in het gras. De trainer stuurt jullie eruit: "Bewaar dat voor zondag."'; } return 'Je laat je niet wegzetten. De trainer ziet het wel.'; }},
    {l:'Laten zien met je voetbal', f(){ mod('vert', 3); mod('focus', 2); return 'Je zegt niets en speelt de sterren van de hemel. Een beter antwoord bestaat niet.'; }},
    {l:'Na de training uitpraten', f(){ zetBandR(12, R); mod('moraal', 1); return `Jullie praten het uit bij de auto. "Het is niks persoonlijks," zegt ${naam}. Concurrenten blijven jullie.`; }}]});
  else uit.push({soort:'prive', tekst:`Je rivaal ${naam} haalt in een podcast uit: "${sp.naam}? Overschat. Wacht maar tot we weer tegen elkaar spelen."`, opts:[
    {l:'Terugslaan in de media', f(){ zetBandR(-10, R); mod('rep', 1); return 'Je haalt hard uit. De volgende ontmoeting wordt beladen.'; }},
    {l:'Negeren', f(){ mod('focus', 3); return 'Je reageert niet. Op het veld praat je wel.'; }},
    {l:'Met humor reageren', f(){ zetBandR(6, R); mod('rep', 1); return 'Je reageert met een knipoog. Zelfs ' + team.hij + ' moet erom lachen.'; }}]});
  return uit;
}
// Een blessure: hij speelt (en scoort) een paar weken niet
function blesseerR(R){
  const r = rivaalSpeler(R); if (!R || R.blessure || !r) return;
  R.blessure = randInt(2, 6); R.oud = {g:r.x.g, a:r.x.a}; r.x.g = 0; r.x.a = 0;
}
function herstel(R){
  const r = rivaalSpeler(R); if (r && R.oud){ r.x.g = R.oud.g; r.x.a = R.oud.a; }
  R.blessure = 0; R.oud = null;
}
const zetBandR = (d, R) => zetBand(d, R);
// Elke week: de race volgen (mijlpalen één keer per seizoen) en zijn blessure aftellen. Zonder R: al je rivalen,
// en misschien duikt er een nieuwe rivaal op (hooguit één per seizoen)
export function raceWeek(eerste, R){
  if (!R){
    if (S.M && S.M.rivaalSl) delete S.M.rivaalSl; // (de wedstrijd is voorbij: vanaf nu weer je hoofdrivaal)
    if (S.trainer) return;
    alleRivalen().forEach(x => raceWeek(eerste, x));
    const sp = S.sp, H = hoofdRivaal();
    if (!eerste && H && S.ronde >= 3 && sp.rivaalNieuwJaar !== S.jaar && H.hist.length && rnd() < .08){ sp.rivaalNieuwJaar = S.jaar; if (rnd() < .5) nieuweRivaal(); } // (hooguit één keer per seizoen een kans van de helft)
    return;
  }
  if (R.gestopt || S.trainer) return;
  if (S.ronde >= WINTER && R.groeiJaar !== S.jaar && !S.sp.clubloos) rivaalWinter(R);
  if (!eerste && R.blessure > 0){ R.blessure--; if (R.blessure <= 0){ herstel(R); S.week.tekst.push(`Je rivaal ${rivaalNaam(R)} is weer fit.`); } }
  if (eerste || S.sp.clubloos || !rivaalSpeler(R)) return;
  const rs = raceStand(R), naam = rivaalNaam(R), M = R.race = R.race || {};
  if (rs.verschil <= -3 && !M.hijUit){ M.hijUit = true; krantMelding(`${naam} loopt uit in de race met ${S.sp.naam}`, `Met ${rs.hij} ${rs.woord} heeft ${team.hij} er ${-rs.verschil} meer dan ${S.sp.naam}.`); S.week.tekst.push(`Je rivaal ${naam} loopt uit: ${rs.hij} tegen ${rs.jij} ${rs.woord}. Dat jaagt je op: je traint feller.`); }
  if (rs.verschil > 0 && M.achter && !M.ingehaald){ M.ingehaald = true; mod('moraal', 3); krantMelding(`${S.sp.naam} haalt rivaal ${naam} in`, `Met ${rs.jij} ${rs.woord} staat ${ik.hij} nu voor in de race.`); S.week.tekst.push(`Je hebt je rivaal ingehaald: ${rs.jij} tegen ${rs.hij} ${rs.woord}!`); }
  if (rs.verschil >= 3 && !M.jijUit){ M.jijUit = true; mod('rep', 1); krantMelding(`${S.sp.naam} laat rivaal ${naam} achter zich`, `${rs.jij} tegen ${rs.hij} ${rs.woord}: de race lijkt beslist.`); }
  if (rs.verschil < 0) M.achter = true;
}

/* ----- Het duel: momenten, het interview vooraf ----- */
// Bestaande momenten (die al animaties hebben), passend bij je positie
export const RIVAAL_MOMENTEN = {SPITS:['eenOpEen', 'kopduel', 'volley'], MID:['counter', 'diepteBal', 'eenOpEen'], VERD:['tackle', 'verdedigen', 'kopduel'], KEEPER:['redding', 'eenOpEenKeeper', 'hogeBal']};
const VOORZET = [
  n => `Daar is ${team.hij}: je rivaal ${n}. Dit is jullie duel.`,
  n => `${n} staat recht tegenover je. Het hele stadion weet wat dit betekent.`,
  n => `Weer jij tegen ${n}. ${team.Hij} grijnst: "Kom maar op."`,
  n => `${n} zet zich schrap. Dit is het moment om te laten zien wie de beste is.`,
];
export function rivaalVoorzet(M, e){
  const n = rivaalNaam();
  if (e.provo) return `Je rivaal ${n} loopt langs en fluistert iets in je oor.`;
  if ((rivaal() || {}).pos === 'KEEPER') return `In het doel staat je rivaal ${n}. Dit is jullie duel.`; // (je ex-vriend is keeper)
  const g = M.rivVoorzet = M.rivVoorzet || []; let vrij = VOORZET.map((_, i) => i).filter(i => !g.includes(i)); if (!vrij.length){ g.length = 0; vrij = VOORZET.map((_, i) => i); }
  const i = pick(vrij); g.push(i); return VOORZET[i](n);
}
// Het interview in de week van het duel (één keer, niet verplicht)
// R: de rivaal tegen wie je deze week speelt (zonder: je hoofdrivaal)
const persRivaal = P => (P && P.sl && alleRivalen().find(x => sleutel(x) === P.sl)) || hoofdRivaal();
export function voorDuelVraag(R0){
  const w = S.week; if (!w) return null; if (w.rivaalPers) return w.rivaalPers;
  const R = R0 || hoofdRivaal(); if (!R) return null; const naam = rivaalNaam(R), rs = raceStand(R), o = R.onderling;
  const vraag = rs && rs.verschil < 0 ? `Zondag tegen ${naam}. ${team.Hij} heeft meer ${rs.woord} dan jij. Hoe ga je ${team.hem} stoppen?`
    : rs && rs.verschil > 0 ? `Zondag tegen ${naam}. Jij staat voor in de race. Voel je de druk?`
    : R.band <= -40 ? `Zondag tegen ${naam}. Jullie kunnen elkaar niet uitstaan, zeggen ze. Klopt dat?`
    : `Zondag tegen je rivaal ${naam}. Onderling staat het ${o.w}-${o.g}-${o.v}. Wat verwacht je?`;
  return w.rivaalPers = {vraag, sl:sleutel(R), klaar:false, opts:[
    {s:'b', l:'Respectvol', t:`"${naam} is een goede speler. Maar zondag wil ik winnen."`, e:'focus +4 · jullie band wordt beter'},
    {s:'z', l:'Zelfverzekerd', t:'"Ik ben in vorm. ' + team.Hij + ' gaat het merken."', e:'moraal +3 · speel je goed (7 of hoger), dan reputatie +2; anders −2'},
    {s:'u', l:'Uitdagend', t:'"Na zondag weet iedereen wie de beste is."', e:'het duel telt dubbel · reputatie, volgers · jullie band wordt slechter'}]};
}
export function voorDuelAntwoord(i){
  const P = voorDuelVraag(), R = persRivaal(P), sp = S.sp, naam = rivaalNaam(R); if (!P || P.klaar) return;
  const o = P.opts[i]; P.klaar = true; P.keuze = i;
  if (o.s === 'b'){ mod('focus', 4); zetBand(5, R); P.uit = 'Een rustig antwoord. Je bent gefocust op het duel.'; }
  else if (o.s === 'z'){ mod('moraal', 3); R.grootSpraak = true; P.uit = 'Stoere woorden. Nu moet je het zondag wel waarmaken.'; }
  else {
    R.uitgedaagd = true; zetBand(-10, R); mod('rep', 2); social().volgers = Math.round(social().volgers * 1.03 + 60);
    krantMelding(`${sp.naam}: "Na zondag weet iedereen wie de beste is"`, `Het duel met ${naam} wordt beladen. "Laat ${ik.hem} maar praten," zegt ${naam}.`);
    R.persReactie = pick([`${naam} heeft het interview gelezen. Bij het warmlopen roept ${team.hij}: "Praatjes vullen geen gaatjes!"`, `${naam} reageerde in de krant: "Laat ${ik.hem} maar praten. Op het veld zien we het wel."`]);
    P.uit = 'De kop van morgen staat al vast. Het duel telt dubbel: winnen levert veel op, verliezen kost veel.';
  }
}

/* ----- Hij groeit: een eigen talent (pot) en een groeicurve per leeftijd ----- */
export function groeiSeizoen(R){ // (ook voor je jeugdvriend, journey.js)
  const a = R.lft, [lo, hi] = a <= 18 ? [4, 6] : a <= 21 ? [3, 5] : a <= 24 ? [2, 3] : a <= 27 ? [1, 2] : a <= 30 ? [0, 1] : a <= 33 ? [-2, -1] : [-3, -2];
  return randInt(lo, hi);
}
function zetK(R, k){ R.k = clamp(k, 30, 95); const r = rivaalSpeler(R); if (r) r.x.k = R.k; }
// Groei tot zijn talent (achteruitgang gaat altijd door)
function groei(R, n){ if (n > 0) n = Math.min(n, Math.max(0, R.pot - R.k)); zetK(R, R.k + n); return n; }
// In de winterstop: de helft van zijn groei van dit seizoen
export function rivaalWinter(R = hoofdRivaal()){
  if (!R || R.gestopt || R.groeiJaar === S.jaar) return;
  R.groeiJaar = S.jaar;
  const G = groeiSeizoen(R), half = G > 0 ? Math.ceil(G / 2) : Math.trunc(G / 2), voor = R.k;
  groei(R, half); R.groeiRest = G - half;
  const naam = rivaalNaam(R);
  if (R.k - voor >= 3){ krantMelding(`Rivaal ${naam} is flink beter geworden`, `${team.Zijn} klasse gaat van ${voor} naar ${R.k}. ${S.sp.naam} is gewaarschuwd.`); if (S.week) S.week.tekst.push(`Je rivaal ${naam} is flink beter geworden (${voor} → ${R.k}).`); }
  else if (R.k > voor && S.week) S.week.tekst.push(`Je rivaal ${naam} wordt beter: klasse ${voor} → ${R.k}.`);
}
