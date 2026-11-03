import { S, club, gemCijfer, mod, ovr, seizoenLabel } from '../../core/state.js';
import { sterrenNa } from '../wedstrijd/opdrachten.js';
import { clamp, pick, randInt, rnd } from '../../core/utils.js';
import { LANDEN, landInfo } from '../../data/gegevens.js';
import { topBonus } from '../prive/sponsors.js';
import { statusNiveau } from '../speler/status.js';
import { focusNaWedstrijd } from '../wedstrijd/focus.js';
import { planWedstrijd, stand2, verderSpelen } from '../wedstrijd/wedstrijd.js';
import { nieuweWeek } from '../week.js';
import { staminaNaWedstrijd } from '../wedstrijd/stamina.js';
import { krantMelding } from '../media/roddel.js';
import { vriendInterland, vriendNaInterland } from '../speler/journey.js';
import { ik, vr } from '../../core/geslacht.js';

/* ===================== Interlands ===================== */
export const magInterland = () => club().t <= 2 && S.sp.leeftijd >= 17 && !S.sp.o23 && !S.sp.clubloos && !S.sp.interStop;
export function landenVoor(){
  const sp = S.sp; if (!sp.herkomst) return [];
  return sp.land ? [sp.land] : [...new Set([sp.herkomst.geboren, sp.herkomst.vader, sp.herkomst.moeder])];
}
// Hoe interessant ben je voor een bondscoach: klasse, cijfers, rol bij je club, bekendheid en eerdere interlands
export function interScore(naam){
  const sp = S.sp, gem = gemCijfer() ?? S.vorigGem;
  return ovr(sp) + (gem - 6.5) * 4 + (statusNiveau() >= 2 ? 2 : -3) + (sp.rep - 30) * .05 + ((sp.bonds[naam] ?? 40) - 40) * .08 + (S.land && S.land === naam && club().t !== 0 ? 1 : 0);
}
export const interDrempel = naam => landInfo(naam).s - 5;
export function interStatus(naam){
  if (S.sp.interStop) return ['Gestopt als international', 'r-gem'];
  if (S.sp.o23) return ['Niet bij de O23', 'r-riskant'];
  if (!magInterland()) return ['Eerst prof worden', 'r-riskant'];
  const d = interScore(naam) - interDrempel(naam);
  if (d >= 2) return ['In de selectie', 'r-veilig'];
  if (d >= -2) return ['Op het randje', 'r-gem'];
  if (d >= -6) return ['In beeld', 'r-gem'];
  return ['Nog te ver weg', 'r-riskant'];
}
export function maakOproep(){
  const sp = S.sp; if (!magInterland() || sp.blessure > 0) return null;
  const type = rnd() < .55 ? 'Kwalificatiewedstrijd' : 'Oefeninterland', landen = [], bijna = [];
  for (const naam of landenVoor()){
    const d = interScore(naam) + randInt(-2, 2) - interDrempel(naam);
    if (d >= 0) landen.push({land:naam, opp:pick(LANDEN.filter(l => l.n !== naam)).n});
    else if (d >= -6) bijna.push(naam);
  }
  return {type, landen, bijna};
}
export function interRol(naam){
  const st = S.car.int[naam], sc = (S.sp.bonds[naam] ?? 40) + S.sp.vorm * 6;
  if (!st || !st.caps) return ['Debuut, waarschijnlijk als invaller', 'r-gem'];
  return sc >= 55 ? ['Basisspeler', 'r-veilig'] : ['Waarschijnlijk invaller', 'r-gem'];
}
export function startInterland(naam){
  const sp = S.sp, O = S.oproep, x = O.landen.find(l => l.land === naam), L = landInfo(naam), opp = landInfo(x.opp);
  sp.bonds[naam] = sp.bonds[naam] ?? 40;
  // Andere landen die je ook opriepen, zijn teleurgesteld
  O.landen.filter(l => l.land !== naam).forEach(l => { sp.bonds[l.land] = clamp((sp.bonds[l.land] ?? 40) - 8, 0, 100); });
  const st = S.car.int[naam];
  const rol = st && st.caps && sp.bonds[naam] + sp.vorm * 6 + randInt(-8, 8) >= 55 ? 'basis' : 'invaller';
  const thuis = rnd() < .5;
  const T = L.s + (ovr(sp) - L.s) * .1 + (thuis ? 2 : 0), Opp = opp.s + (thuis ? 0 : 2);
  const M = {inter:{land:naam, type:O.type}, oppS:opp.s, wij:naam, zij:opp.n, thuis, rol, us:0, them:0, min:0, ev:[], idx:0, log:[], cijfer:sp.pos === 'VERD' || sp.pos === 'KEEPER' ? 6.3 : 6.0, goals:0, assists:0, geel:false, rood:false, pending:null, klaar:false};
  S.M = M;
  // je jeugdvriend in de selectie? (journey.js)
  M.vriendMee = vriendInterland(naam);
  if (M.vriendMee) M.log.push({m:'', t:`Je ${vr.jeugdvriend} ${S.sp.vriend.voornaam} zit ook in de selectie${M.vriendMee.basis ? ', in de basis' : ', op de bank'}. Samen het volkslied zingen, net als vroeger in de achtertuin.`, k:'info'});
  planWedstrijd(M, T, Opp);
  M.log.push({m:"1'", t:`${O.type}. Het volkslied klinkt. ${rol === 'basis' ? 'Je staat in de basis.' : st && st.caps ? 'Je begint op de bank.' : 'Je zit op de bank en hoopt op je debuut.'}`, k:''});
  S.fase = 'match';
  verderSpelen();
}
export function eindeInterland(){
  const sp = S.sp, M = S.M, I = M.inter, naam = I.land;
  M.klaar = true;
  if (M.us > M.them) M.cijfer += .3; else if (M.us < M.them) M.cijfer -= .3;
  if ((sp.pos === 'VERD' || sp.pos === 'KEEPER') && M.them === 0 && M.rol === 'basis') M.cijfer += sp.pos === 'KEEPER' ? .7 : .5; // (de nul gehouden)
  M.cijfer = Math.round(clamp(M.cijfer, 3, 10) * 10) / 10;
  sp.bonds[naam] = clamp((sp.bonds[naam] ?? 40) + (M.cijfer - 6.3) * 7 + 3, 0, 100);
  if (M.cijfer >= 8.5) S.car.motm = (S.car.motm || 0) + 1;
  focusNaWedstrijd(M);
  M.bonus = topBonus(M); sterrenNa(M); // (de wedstrijddoelen: opdrachten.js)
  sp.vorm = clamp(sp.vorm * .7 + (M.cijfer - 6.5) * .3, -3, 3);
  sp.rep = clamp(sp.rep + 2 + (M.cijfer - 6.5) * 1.5 + M.goals * 1.5 + M.assists * .7, 0, 100);
  staminaNaWedstrijd(M);
  mod('moraal', M.us >= M.them ? 6 : -2);
  const st = S.car.int[naam] = S.car.int[naam] || {caps:0, g:0, a:0};
  const debuut = st.caps === 0, eersteGoal = st.g === 0 && M.goals > 0;
  st.caps++; st.g += M.goals; st.a += M.assists;
  M.interTekst = [];
  M.interTekst.push(...vriendNaInterland(M)); // je jeugdvriend in het nationale team
  if (M.bonus) M.interTekst.push(M.bonus.tekst);
  if (debuut){ S.car.hist.push(`${seizoenLabel()}: debuut voor ${naam} tegen ${M.zij}`); M.interTekst.push(`Je debuut voor ${naam}! Dit vergeet je nooit meer.`); }
  if (eersteGoal){ S.car.hist.push(`${seizoenLabel()}: eerste interlandgoal voor ${naam}`); M.interTekst.push(`Je eerste interlandgoal voor ${naam}!`); }
  if ([25, 50, 75, 100].includes(st.caps)){ S.car.prijzen.push(`${st.caps} interlands voor ${naam}`); M.interTekst.push(`Dit was je ${st.caps}e interland voor ${naam}!`); }
  if (I.type === 'Kwalificatiewedstrijd' && !sp.land){
    sp.land = naam;
    if (new Set([sp.herkomst.geboren, sp.herkomst.vader, sp.herkomst.moeder]).size > 1){ S.car.hist.push(`${seizoenLabel()}: kiest definitief voor ${naam}`); M.interTekst.push(`Je hebt een officiële wedstrijd voor ${naam} gespeeld. Vanaf nu kun je alleen nog voor ${naam} uitkomen.`); }
  }
  const o = ovr(sp); if (o > S.car.maxOvr) S.car.maxOvr = o;
  S.fase = 'matchEnd';
}
export function naInterland(){
  const M = S.M, I = M.inter;
  const uitslag = M.us > M.them ? 'gewonnen' : M.us < M.them ? 'verloren' : 'gelijkgespeeld';
  S.oproep = null;
  nieuweWeek();
  S.week.tekst.unshift(`Terug van de interland: ${I.land} heeft ${uitslag} van ${M.zij} (${stand2()}). Jouw cijfer: ${M.cijfer.toFixed(1).replace('.', ',')}.`);
}
// Stoppen als international: geen oproepen en geen eindtoernooien meer (een comeback kan later, als de bondscoach je nog wil)
export const kanStoppenInter = () => { const sp = S.sp; return !!(sp && sp.herkomst && sp.leeftijd >= 17 && !sp.interStop); };
export function interLand(){ const sp = S.sp; if (sp.land) return sp.land; const l = Object.entries(S.car.int || {}).filter(([, x]) => x.caps > 0).sort((a, b) => b[1].caps - a[1].caps); return l.length ? l[0][0] : landenVoor()[0]; }
export function stopInternational(){
  const sp = S.sp; if (!kanStoppenInter()) return null;
  const land = interLand(), st = (S.car.int || {})[land] || {caps:0, g:0};
  sp.interStop = {jaar:S.jaar, land, caps:st.caps, g:st.g};
  sp.bonds[land] = clamp((sp.bonds[land] ?? 40) - 10, 0, 100);
  S.car.hist.push(`${seizoenLabel()}: ${st.caps ? `stopt als international (${st.caps} interlands, ${st.g} goals voor ${land})` : `zegt nee tegen het nationale team van ${land}`}`);
  if (st.caps) krantMelding(`${sp.naam} stopt als international`, `Na ${st.caps} interlands en ${st.g} goals voor ${land} houdt ${ik.hij} ermee op.${st.caps >= 50 ? ' De bond bedankt ' + ik.hem + ' voor jaren trouwe dienst.' : ' ' + ik.Hij + ' wil zich richten op ' + ik.zijn + ' club.'}`);
  else krantMelding(`${sp.naam} zegt nee tegen het nationale team`, `De bondscoach van ${land} hoeft ${ik.hem} niet meer te bellen. "Ik kies voor mijn club," zegt ${ik.hij}.`);
  return st.caps ? `Je stopt als international. ${st.caps} interlands en ${st.g} goals voor ${land}: daar mag je trots op zijn.` : `Je laat de bond van ${land} weten dat je niet beschikbaar bent voor het nationale team.`;
}
// Een comeback: vanaf het volgende seizoen, één poging per seizoen
export const kanTerugInter = () => { const X = S.sp.interStop; return !!(X && S.jaar > X.jaar && X.poging !== S.jaar); };
export function terugInternational(){
  const sp = S.sp, X = sp.interStop; if (!kanTerugInter()) return null;
  X.poging = S.jaar;
  if (interScore(X.land) - interDrempel(X.land) >= -2){
    sp.interStop = null; sp.bonds[X.land] = clamp((sp.bonds[X.land] ?? 40) + 5, 0, 100);
    S.car.hist.push(`${seizoenLabel()}: terug in het nationale team van ${X.land}`);
    krantMelding(`${sp.naam} keert terug in het nationale team`, `De bondscoach van ${X.land} is blij: "Met ${ik.hem} zijn we sterker."`);
    return `De bondscoach van ${X.land} is blij: je bent weer welkom in het nationale team.`;
  }
  return `De bondscoach van ${X.land} ziet het (nog) niet zitten. Speel beter, en probeer het volgend seizoen opnieuw.`;
}
// Vanuit het oproepscherm: niet afzeggen maar helemaal stoppen
export function stopVanuitOproep(){ const t = stopInternational(); S.oproep = null; nieuweWeek(); if (t) S.week.tekst.unshift(t); }
export function zegAf(){
  const sp = S.sp, namen = S.oproep.landen.map(l => l.land);
  namen.forEach(n => { sp.bonds[n] = clamp((sp.bonds[n] ?? 40) - 10, 0, 100); });
  S.oproep = null;
  nieuweWeek();
  S.week.tekst.unshift(`Je zegt af voor de interland. De bondscoach van ${namen.join(' en ')} is daar niet blij mee.`);
}
