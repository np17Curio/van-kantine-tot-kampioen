import { S, club, gemCijfer, mod, ovr, seizoenLabel } from '../../core/state.js';
import { clamp, pick, randInt, rnd } from '../../core/utils.js';
import { LANDEN, landInfo } from '../../data/gegevens.js';
import { topBonus } from '../prive/sponsors.js';
import { statusNiveau } from '../speler/status.js';
import { focusNaWedstrijd } from '../wedstrijd/focus.js';
import { planWedstrijd, stand2, verderSpelen } from '../wedstrijd/wedstrijd.js';
import { nieuweWeek } from '../week.js';

/* ===================== Interlands ===================== */
export const magInterland = () => club().t <= 2 && S.sp.leeftijd >= 17 && !S.sp.o23;
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
  const M = {inter:{land:naam, type:O.type}, oppS:opp.s, wij:naam, zij:opp.n, thuis, rol, us:0, them:0, min:0, ev:[], idx:0, log:[], cijfer:sp.pos === 'VERD' ? 6.3 : 6.0, goals:0, assists:0, geel:false, rood:false, pending:null, klaar:false};
  S.M = M;
  planWedstrijd(M, T, Opp);
  M.log.push({m:"1'", t:`${O.type}. Het volkslied klinkt. ${rol === 'basis' ? 'Je staat in de basis.' : st && st.caps ? 'Je begint op de bank.' : 'Je zit op de bank en hoopt op je debuut.'}`, k:''});
  S.fase = 'match';
  verderSpelen();
}
export function eindeInterland(){
  const sp = S.sp, M = S.M, I = M.inter, naam = I.land;
  M.klaar = true;
  if (M.us > M.them) M.cijfer += .3; else if (M.us < M.them) M.cijfer -= .3;
  if (sp.pos === 'VERD' && M.them === 0 && M.rol === 'basis') M.cijfer += .5;
  M.cijfer = Math.round(clamp(M.cijfer, 3, 10) * 10) / 10;
  sp.bonds[naam] = clamp((sp.bonds[naam] ?? 40) + (M.cijfer - 6.3) * 7 + 3, 0, 100);
  if (M.cijfer >= 8.5) S.car.motm = (S.car.motm || 0) + 1;
  focusNaWedstrijd(M);
  M.bonus = topBonus(M);
  sp.vorm = clamp(sp.vorm * .7 + (M.cijfer - 6.5) * .3, -3, 3);
  sp.rep = clamp(sp.rep + 2 + (M.cijfer - 6.5) * 1.5 + M.goals * 1.5 + M.assists * .7, 0, 100);
  sp.fit = clamp(sp.fit - (M.rol === 'basis' ? 15 : 7), 0, 100);
  mod('moraal', M.us >= M.them ? 6 : -2);
  const st = S.car.int[naam] = S.car.int[naam] || {caps:0, g:0, a:0};
  const debuut = st.caps === 0, eersteGoal = st.g === 0 && M.goals > 0;
  st.caps++; st.g += M.goals; st.a += M.assists;
  M.interTekst = [];
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
export function zegAf(){
  const sp = S.sp, namen = S.oproep.landen.map(l => l.land);
  namen.forEach(n => { sp.bonds[n] = clamp((sp.bonds[n] ?? 40) - 10, 0, 100); });
  S.oproep = null;
  nieuweWeek();
  S.week.tekst.unshift(`Je zegt af voor de interland. De bondscoach van ${namen.join(' en ')} is daar niet blij mee.`);
}
