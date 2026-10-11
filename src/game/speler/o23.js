import { S, club, mod, ovr, seizoenLabel } from '../../core/state.js';
import { clamp, rnd, shuffle } from '../../core/utils.js';
import { AMATEUR, CLUBS, POS, divClubs } from '../../data/gegevens.js';
import { fixture, simGoals } from '../competitie/competitie.js';
import { speelRonde } from '../competitie/spelers.js';
import { KRANTEN, reeks } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { topBonus } from '../prive/sponsors.js';
import { statusNiveau } from './status.js';
import { sluitVenster } from '../transfers/transfers.js';
import { agentReset } from '../transfers/zaakwaarnemer.js';
import { focusNaWedstrijd } from '../wedstrijd/focus.js';
import { planWedstrijd, verderSpelen } from '../wedstrijd/wedstrijd.js';
import { verhoog } from '../week.js';
import { staminaNaWedstrijd } from '../wedstrijd/stamina.js';

/* ===================== O23 en verhuur ===================== */
export const gemiddelde = l => l.reduce((a, b) => a + b, 0) / l.length;
export const fmt1 = v => v.toFixed(1).replace('.', ',');
// Na elke wedstrijd met het eerste elftal: houdt een slechte reeks bij. Eerst een waarschuwing, daarna de O23
export function checkO23(){
  const sp = S.sp, M = S.M;
  if (club().t > AMATEUR || sp.huur) return null; // niet in de jeugd en niet tijdens een huurperiode
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
  krantMelding(`${sp.naam} teruggezet naar de O23`, `De trainer van ${club().n} is niet tevreden over zijn vorm. Bij de O23 moet hij zich opnieuw bewijzen.`);
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
  const wijS = c.s - 8, oppS = opp.s - 8, thuis = rnd() < .5;
  const T = wijS + (ovr(sp) - wijS) * .15 + (thuis ? 2 : 0), O = oppS + (thuis ? 0 : 2);
  const M = {o23:true, eerste:{us:a, them:b, opp:fx.opp, thuis:fx.thuis}, oppS, wij:`${c.n} O23`, zij:`${opp.n} O23`, thuis, rol:'basis', us:0, them:0, min:0, ev:[], idx:0, log:[], cijfer:sp.pos === 'VERD' ? 6.3 : 6.0, goals:0, assists:0, geel:false, rood:false, pending:null, klaar:false};
  S.M = M;
  planWedstrijd(M, T, O);
  M.log.push({m:"1'", t:'Aftrap bij de O23, op een bijveld met een handjevol toeschouwers. Hier moet je het laten zien.', k:''});
  S.fase = 'match';
  verderSpelen();
}
export function eindeO23(){
  const sp = S.sp, M = S.M, E = M.eerste, O = sp.o23;
  M.klaar = true;
  if (M.us > M.them) M.cijfer += .3; else if (M.us < M.them) M.cijfer -= .3;
  if (sp.pos === 'VERD' && M.them === 0) M.cijfer += .5;
  M.cijfer = Math.round(clamp(M.cijfer, 3, 10) * 10) / 10;
  sp.vorm = clamp(sp.vorm * .5 + (M.cijfer - 6.5) * .7, -3, 3);
  staminaNaWedstrijd(M);
  mod('vert', (M.cijfer - 6.5) * 3);
  O.cijfers.push(M.cijfer); O.g += M.goals; O.a += M.assists;
  focusNaWedstrijd(M);
  M.bonus = topBonus(M);
  M.groei = null;
  if (M.cijfer >= 7 && rnd() < .4){
    const w = POS[sp.pos].w, keys = Object.keys(w); let r = rnd(), k = keys[0];
    for (const kk of keys){ r -= w[kk]; if (r <= 0){ k = kk; break; } }
    if (ovr(sp) < sp.pot + 3){ verhoog(k, 1); M.groei = k; }
  }
  // Het eerste elftal speelde ook
  speelRonde(S.ronde, E.us, E.them);
  const eUit = E.us > E.them ? 'W' : E.us < E.them ? 'V' : 'G', eStand = E.thuis ? `${E.us}-${E.them}` : `${E.them}-${E.us}`;
  (S.ss.uitslagen = S.ss.uitslagen || [])[S.ronde] = {r:eUit, s:`${eStand} tegen ${CLUBS[E.opp].n}`, mee:false};
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
  if (club().t > 2 || sp.huur || (sp.sindsTransfer || 0) < 7) return false;
  return !!sp.o23 || (S.ss.c.length >= 5 && gemiddelde(S.ss.c) < 6.2);
}
export function huurClubs(){
  const eigen = club();
  const kand = divClubs(eigen.t + 1).concat(divClubs(eigen.t).filter(i => i !== S.sp.club && CLUBS[i].s <= eigen.s - 6));
  return shuffle(kand).slice(0, 2);
}
export function gaHuren(id){
  const sp = S.sp, V = S.venster, ouder = club();
  if (V.agentBod != null) agentReset('Je koos voor een huurperiode. Zeg het maar als je daarna een nieuw doel hebt.');
  sp.huur = {ouder:sp.club, clubWed:sp.clubWed, clubSz:sp.clubSz, status:sp.status, legende:sp.legendeHier, cijfers:[]};
  sp.o23 = null; sp.recent = []; sp.gewaarschuwd = false;
  sp.club = id; sp.clubWed = 0; sp.clubSz = 0; sp.legendeHier = false; sp.status = 38; sp.vert = 55; sp.sindsTransfer = 0;
  sp.statusNiveau = statusNiveau();
  mod('moraal', 5);
  S.car.clubs.push({club:id, van:S.jaar, huur:true});
  S.car.hist.push(`${seizoenLabel()}: verhuurd door ${ouder.n} aan ${CLUBS[id].n}`);
  krantMelding(`${ouder.n} verhuurt ${sp.naam} aan ${CLUBS[id].n}`, `Bij ${CLUBS[id].n} moet hij speeltijd krijgen. In de zomer keert hij terug.`, KRANTEN[ouder.t]);
  S.verhuisTekst = `Je bent verhuurd aan ${CLUBS[id].n} tot het einde van het seizoen. Hier krijg je speeltijd. Laat zien wat je kan!`;
  sluitVenster();
}
// Einde huurperiode (zomer): terug naar je eigen club, met een plek die past bij hoe je het deed
export function terugVanHuur(){
  const sp = S.sp, h = sp.huur, huurId = sp.club, huurNaam = club().n, ouder = CLUBS[h.ouder], c = h.cijfers, g = c.length ? gemiddelde(c) : null;
  sp.club = h.ouder; sp.huur = null; sp.o23 = null; sp.recent = []; sp.gewaarschuwd = false;
  sp.clubWed = h.clubWed; sp.clubSz = h.clubSz; sp.legendeHier = h.legende; sp.sindsTransfer = 10;
  let tekst;
  if (g !== null && g >= 7){ sp.status = Math.max(h.status, 38); sp.vert = 55; tekst = `Je huurperiode bij ${huurNaam} was een succes (gemiddeld ${fmt1(g)}). ${ouder.n} haalt je terug en rekent op je.`; }
  else if (g !== null && g >= 6.4){ sp.status = Math.max(h.status, 22); sp.vert = 45; tekst = `Je speelde redelijk bij ${huurNaam} (gemiddeld ${fmt1(g)}). Terug bij ${ouder.n} moet je knokken voor een basisplaats.`; }
  else { sp.status = Math.min(h.status, 12); sp.vert = 30; tekst = `Je huurperiode bij ${huurNaam} liep niet goed${g !== null ? ` (gemiddeld ${fmt1(g)})` : ''}. ${ouder.n} is nog niet overtuigd.`; }
  sp.statusNiveau = statusNiveau();
  S.car.hist.push(`${seizoenLabel()}: terug van huur bij ${huurNaam} naar ${ouder.n}`);
  return {tekst, koop: g !== null && g >= 7.2 && c.length >= 5 ? huurId : null};
}
