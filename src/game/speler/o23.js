import { S, club, mod, ovr, seizoenLabel } from '../../core/state.js';
import { sterrenNa } from '../wedstrijd/opdrachten.js';
import { seizoenDeel } from '../seizoen/seizoen.js';
import { clamp, pick, randInt, rnd, shuffle } from '../../core/utils.js';
import { CLUBS, LAAGSTE, POS, clubsLand, divClubs, weekFactor } from '../../data/gegevens.js';
import { SPEEL_LANDEN, thuisLand } from '../../data/landen.js';
import { isBuitenland, vreemdeClub, winterInhalen, wisselLand } from '../transfers/buitenland.js';
import { startBuitenland, thuis as thuisStart } from '../prive/buitenland-leven.js';
import { fixture, simGoals } from '../competitie/competitie.js';
import { speelRonde } from '../competitie/spelers.js';
import { KRANTEN, reeks } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { topBonus } from '../prive/sponsors.js';
import { statusNiveau } from './status.js';
import { sluitVenster } from '../transfers/transfers.js';
import { agentReset } from '../transfers/zaakwaarnemer.js';
import { focusNaWedstrijd } from '../wedstrijd/focus.js';
import { onderwijsCoach, planWedstrijd, verderSpelen } from '../wedstrijd/wedstrijd.js';
import { leeftijdGroei, verhoog } from '../week.js';
import { staminaNaWedstrijd } from '../wedstrijd/stamina.js';
import { talentNaWedstrijd } from './talent.js';
import { teamKracht } from '../team/kleedkamer.js';
import { ik } from '../../core/geslacht.js';

/* ===================== O23 en verhuur ===================== */
export const gemiddelde = l => l.reduce((a, b) => a + b, 0) / l.length;
export const fmt1 = v => v.toFixed(1).replace('.', ',');
// Na elke wedstrijd met het eerste elftal: houdt een slechte reeks bij. Eerst een waarschuwing, daarna de O23
export function checkO23(){
  const sp = S.sp, M = S.M;
  if (sp.huur) return null; // niet tijdens een huurperiode
  const r = sp.recent = (sp.recent || []).concat(M.cijfer).slice(-5);
  const slecht = r.filter(c => c < 6).length, g5 = gemiddelde(r);
  if (slecht <= 1 || g5 >= 6.5) sp.gewaarschuwd = false;
  if (statusNiveau() > 2) return null; // fanfavorieten en aanvoerders zakken eerst in status
  // Echt een slechte reeks: minstens 3 van de laatste 5 onder de 6 én gemiddeld onder de 6.
  // Altijd eerst een waarschuwing; pas bij de volgende slechte wedstrijd ga je naar de O23
  const reeks = slecht >= 3 && g5 < 6;
  if (sp.gewaarschuwd && M.cijfer < 6 && reeks) return naarO23();
  if (reeks && !sp.gewaarschuwd){
    sp.gewaarschuwd = true;
    return `Waarschuwing van de trainer: dit was je ${slecht}e slechte wedstrijd van de laatste ${r.length}. Nog zo'n wedstrijd en je gaat terug naar de O23.`;
  }
  return null;
}
export function naarO23(){
  const sp = S.sp;
  sp.o23 = {cijfers:[], g:0, a:0};
  sp.status = Math.min(sp.status, 10); sp.vert = Math.min(sp.vert, 35); sp.recent = []; sp.gewaarschuwd = false;
  sp.statusNiveau = statusNiveau();
  mod('moraal', -10);
  S.car.hist.push(`${seizoenLabel()}: teruggezet naar de O23 van ${club().n}`);
  krantMelding(`${sp.naam} teruggezet naar de O23`, `De trainer van ${club().n} is niet tevreden over ${ik.zijn} vorm. Bij de O23 moet ${ik.hij} zich opnieuw bewijzen.`);
  return `De trainer is klaar met je slechte wedstrijden: je gaat terug naar de O23 van ${club().n}. Laat je daar zien, dan haalt hij je terug.`;
}
export const O23_EIS = 'Haal over 3 wedstrijden gemiddeld een 7,0 (of twee keer op rij gemiddeld 7,6) en de trainer haalt je terug.';
export function terugUitO23(){
  const sp = S.sp;
  sp.o23 = null; sp.status = Math.max(sp.status, 20); sp.vert = Math.max(sp.vert, 48); sp.recent = []; sp.gewaarschuwd = false;
  sp.statusNiveau = statusNiveau();
  mod('moraal', 8);
  S.car.hist.push(`${seizoenLabel()}: teruggehaald bij de selectie van ${club().n}`);
  return `Je hebt je bewezen bij de O23! De trainer haalt je terug bij de selectie van ${club().n}. Je begint als bankspeler.`;
}
// Een O23-wedstrijd: jij speelt bij de O23, het eerste elftal speelt tegelijk zonder jou
export function startO23(){
  const sp = S.sp, c = club(), fx = fixture(S.ronde), opp = CLUBS[fx.opp];
  const [a, b] = simGoals(c.s, opp.s, fx.thuis);
  // O23-teams bestaan uit jonge spelers van ongeveer jouw niveau (de O23 van een sterkere club is iets beter).
  // Ben je zelf al goed (een teruggezette prof), dan zijn ze hooguit zo sterk als het eerste elftal min 8
  const o = ovr(sp), o23 = (s, d) => Math.round(Math.min(s - 8, o + d + (s - 66) * .25));
  const wijS = o23(c.s, -3), oppS = o23(opp.s, -8 + randInt(-1, 1)), thuis = rnd() < .5;
  const T = teamKracht(wijS, {speelt:true, thuis, bonus:false}), O = oppS + (thuis ? 0 : 2);
  const M = {o23:true, eerste:{us:a, them:b, opp:fx.opp, thuis:fx.thuis}, oppS, wij:`${c.n} O23`, zij:`${opp.n} O23`, thuis, rol:'basis', us:0, them:0, min:0, ev:[], idx:0, log:[], cijfer:sp.pos === 'VERD' || sp.pos === 'KEEPER' ? 6.3 : 6.0, goals:0, assists:0, geel:false, rood:false, pending:null, klaar:false};
  S.M = M;
  { const r = onderwijsCoach(); if (r) M.log.push(r); }
  planWedstrijd(M, T, O);
  M.log.push({m:"1'", t:'Aftrap bij de O23, op een bijveld met een handjevol toeschouwers. Hier moet je het laten zien.', k:''});
  S.fase = 'match';
  verderSpelen();
}
export function eindeO23(){
  const sp = S.sp, M = S.M, E = M.eerste, O = sp.o23;
  M.klaar = true;
  if (M.us > M.them) M.cijfer += .3; else if (M.us < M.them) M.cijfer -= .3;
  if ((sp.pos === 'VERD' || sp.pos === 'KEEPER') && M.them === 0) M.cijfer += sp.pos === 'KEEPER' ? .7 : .5; // (de nul gehouden)
  M.cijfer = Math.round(clamp(M.cijfer, 3, 10) * 10) / 10;
  sp.vorm = clamp(sp.vorm * .5 + (M.cijfer - 6.5) * .7, -3, 3);
  staminaNaWedstrijd(M);
  mod('vert', (M.cijfer - 6.5) * 3);
  O.cijfers.push(M.cijfer); O.g += M.goals; O.a += M.assists;
  focusNaWedstrijd(M);
  M.bonus = topBonus(M); sterrenNa(M); // (de wedstrijddoelen: opdrachten.js)
  M.groei = null;
  if (M.cijfer >= 7 && rnd() < .25 * weekFactor() * leeftijdGroei()){
    const w = POS[sp.pos].w, keys = Object.keys(w); let r = rnd(), k = keys[0];
    for (const kk of keys){ r -= w[kk]; if (r <= 0){ k = kk; break; } }
    if (ovr(sp) < sp.pot + 3){ verhoog(k, 1); M.groei = k; }
  }
  M.talent = rnd() < weekFactor() ? talentNaWedstrijd(M.cijfer) : null;
  // Het eerste elftal speelde ook
  speelRonde(S.ronde, E.us, E.them);
  const eUit = E.us > E.them ? 'W' : E.us < E.them ? 'V' : 'G', eStand = E.thuis ? `${E.us}-${E.them}` : `${E.them}-${E.us}`;
  (S.ss.uitslagen = S.ss.uitslagen || [])[S.ronde] = {r:eUit, s:`${eStand} tegen ${CLUBS[E.opp].n}`, mee:false, opp:E.opp, thuis:E.thuis};
  M.eersteTekst = `Het eerste elftal van ${club().n} speelde ondertussen ${eStand} tegen ${CLUBS[E.opp].n} (${eUit === 'W' ? 'gewonnen' : eUit === 'V' ? 'verloren' : 'gelijk'}).`;
  // Terug naar de selectie?
  const c = O.cijfers;
  if ((c.length >= 3 && gemiddelde(c.slice(-3)) >= 7) || (c.length >= 2 && gemiddelde(c.slice(-2)) >= 7.6)) M.o23Tekst = terugUitO23();
  else M.o23Tekst = c.length < 3 ? `Je cijfers bij de O23: ${c.map(fmt1).join(' · ')}. ${O23_EIS}` : `Gemiddeld over je laatste 3 O23-wedstrijden: ${fmt1(gemiddelde(c.slice(-3)))}. Je hebt een 7,0 nodig om terug te komen.`;
  const o = ovr(sp); if (o > S.car.maxOvr) S.car.maxOvr = o;
  S.fase = 'matchEnd';
}
// Huur: alleen voor profs die bij de O23 zitten of het hele seizoen slecht spelen
export function huurNodig(){
  const sp = S.sp;
  if (sp.huur || (sp.sindsTransfer || 0) < 7) return false;
  return !!sp.o23 || (S.ss.c.length >= 5 && gemiddelde(S.ss.c) < 6.2);
}
// Huuropties: {club, land?}. Twee clubs uit je eigen land, en vanaf je 18e meestal ook een club uit het buitenland
export function huurClubs(){
  const eigen = club();
  const kand = (eigen.t < LAAGSTE ? divClubs(eigen.t + 1) : []).concat(divClubs(eigen.t).filter(i => i !== S.sp.club && CLUBS[i].s <= eigen.s - 6));
  const uit = shuffle(kand).slice(0, 2).map(id => ({club:id}));
  // (zelf gevraagd: altijd een buitenlandse optie)
  const bl = S.sp.leeftijd >= 18 && rnd() < (S.sp.huurWens ? 1 : .6) ? buitenlandseHuur() : null; if (bl) uit.push(bl);
  return uit;
}
// Een club in een ander land: zwakker dan je eigen club, maar van jouw niveau (daar speel je)
function buitenlandseHuur(){
  const o = ovr(S.sp), eigen = club(), land = pick(SPEEL_LANDEN.filter(l => l !== thuisLand())), kand = [];
  for (let id = 8; id < clubsLand(land); id++){ const c = vreemdeClub(land, id); if (c.t >= 1 && c.s <= eigen.s - 4 && c.s >= o - 6) kand.push([id, Math.abs(c.s - (o + 2))]); }
  if (!kand.length) return null;
  return {club:pick(kand.sort((a, b) => a[1] - b[1]).slice(0, 3))[0], land};
}
// Je eigen club tijdens een huurperiode (in het buitenland staat die niet in CLUBS: daar hoort het nummer bij een andere club)
export function huurOuder(){
  const h = S.sp.huur; if (!h) return club();
  return h.ouderLand && h.ouderLand !== thuisLand() ? {n:h.ouderNaam, t:h.ouderT, s:h.ouderS} : CLUBS[h.ouder];
}
export function gaHuren(x){
  const o = typeof x === 'number' ? {club:x} : x, sp = S.sp, V = S.venster, oc = club(), ouder = {n:oc.n, t:oc.t, s:oc.s}, bl = isBuitenland(o), krant = KRANTEN[ouder.t];
  if (V.agentBod != null) agentReset('Je koos voor een huurperiode. Zeg het maar als je daarna een nieuw doel hebt.');
  seizoenDeel(); // (een huurperiode vanaf de winter)
  sp.huur = {ouder:sp.club, ouderLand:thuisLand(), ouderNaam:ouder.n, ouderT:ouder.t, ouderS:ouder.s, clubWed:sp.clubWed, clubSz:sp.clubSz, status:sp.status, legende:sp.legendeHier, cijfers:[],
    ...(bl ? {bl:sp.buitenland || null, heimwee:sp.heimwee || 0} : {})}; // (na de huur weer zoals het was)
  if (bl) wisselLand(o.land); // (daarna hoort het clubnummer bij een club in dat land: ouder is een kopie)
  const naam = CLUBS[o.club].n, waar = bl ? ` in ${o.land}` : '';
  sp.o23 = null; sp.recent = []; sp.gewaarschuwd = false;
  sp.club = o.club; sp.clubWed = 0; sp.clubSz = 0; sp.legendeHier = false; sp.status = 38; sp.vert = 55; sp.sindsTransfer = 0;
  sp.statusNiveau = statusNiveau();
  mod('moraal', 5);
  S.car.clubs.push({club:o.club, van:S.jaar, huur:true, land:thuisLand(), n:naam});
  S.car.hist.push(`${seizoenLabel()}: verhuurd door ${ouder.n} aan ${naam}${bl ? ` (${o.land})` : ''}`);
  krantMelding(`${ouder.n} verhuurt ${sp.naam} aan ${naam}${bl ? ` uit ${o.land}` : ''}`, `Bij ${naam} moet ${ik.hij} speeltijd krijgen. In de zomer keert ${ik.hij} terug.`, krant);
  let tekst = `Je bent verhuurd aan ${naam}${waar} tot het einde van het seizoen. Hier krijg je speeltijd. Laat zien wat je kan!`;
  if (bl){ const t = startBuitenland(o.land); if (t) tekst += ' ' + t; if (V.soort === 'winter') tekst += ' ' + winterInhalen(); }
  S.verhuisTekst = tekst;
  sluitVenster();
}
// Einde huurperiode (zomer): terug naar je eigen club, met een plek die past bij hoe je het deed
export function terugVanHuur(){
  const sp = S.sp, h = sp.huur, huurId = sp.club, huurNaam = club().n, huurLand = thuisLand(), weg = !!h.ouderLand && h.ouderLand !== huurLand;
  // Een huurperiode in het buitenland: terug naar je eigen land (taal en heimwee weer zoals vóór de huur)
  if (weg){ wisselLand(h.ouderLand); sp.buitenland = h.bl || null; sp.heimwee = h.heimwee || 0; }
  const ouder = CLUBS[h.ouder], c = h.cijfers, g = c.length ? gemiddelde(c) : null;
  sp.club = h.ouder; sp.huur = null; sp.o23 = null; sp.recent = []; sp.gewaarschuwd = false;
  sp.clubWed = h.clubWed; sp.clubSz = h.clubSz; sp.legendeHier = h.legende; sp.sindsTransfer = 10; sp.huurTerug = true; // (geen 'eerste seizoen' meer bij je eigen club)
  let tekst;
  if (g !== null && g >= 7){ sp.status = Math.max(h.status, 38); sp.vert = 55; tekst = `Je huurperiode bij ${huurNaam} was een succes (gemiddeld ${fmt1(g)}). ${ouder.n} haalt je terug en rekent op je.`; }
  else if (g !== null && g >= 6.4){ sp.status = Math.max(h.status, 22); sp.vert = 45; tekst = `Je speelde redelijk bij ${huurNaam} (gemiddeld ${fmt1(g)}). Terug bij ${ouder.n} moet je knokken voor een basisplaats.`; }
  else { sp.status = Math.min(h.status, 12); sp.vert = 30; tekst = `Je huurperiode bij ${huurNaam} liep niet goed${g !== null ? ` (gemiddeld ${fmt1(g)})` : ''}. ${ouder.n} is nog niet overtuigd.`; }
  sp.statusNiveau = statusNiveau();
  S.car.hist.push(`${seizoenLabel()}: terug van huur bij ${huurNaam} naar ${ouder.n}`);
  if (weg) tekst = `${h.ouderLand === thuisStart() ? 'Terug thuis' : `Terug in ${h.ouderLand}`} na een seizoen in ${huurLand}. ` + tekst;
  return {tekst, koop: g !== null && g >= 7.2 && c.length >= 5 ? {club:huurId, ...(weg ? {land:huurLand} : {})} : null};
}
