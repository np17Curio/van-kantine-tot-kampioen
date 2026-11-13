import { hoogtepunt } from './hoogtepunten.js';
import { S, club, mod, ovr, salarisVoor, seizoenLabel, tmp } from '../../core/state.js';
import { clamp, pick, randInt, rnd } from '../../core/utils.js';
import { CLUBS, LAAGSTE, TRAINBAAR, divClubs } from '../../data/gegevens.js';
import { thuisLand } from '../../data/landen.js';
import { teamKracht } from '../team/kleedkamer.js';
import { focusNaWedstrijd } from '../wedstrijd/focus.js';
import { staminaNaWedstrijd } from '../wedstrijd/stamina.js';
import { planWedstrijd, verderSpelen } from '../wedstrijd/wedstrijd.js';
import { nieuweWeek, weekHerstel } from '../week.js';
import { fmt1, gemiddelde } from './o23.js';
import { startIntro } from './startverhaal.js';
import { statusNiveau, startStatus } from './status.js';
import { plaatsVriend, vriendApart, vriendNaam, vriendPos } from './journey.js';
import { andereWereldClub, andereWereldIds } from '../transfers/buitenland.js';
import { maakRivaal } from './rivaal.js';
import { eindeProefWed } from './proef.js';
import { AGENT } from '../../data/gegevens.js';
import { team } from '../../core/geslacht.js';

/* ===================== Selectiewedstrijden: waar begint je carrière? ===================== */
// Een nieuwe carrière begint met 3 selectiewedstrijden tegen leeftijdsgenoten. Je gemiddelde cijfer bepaalt waar je tekent:
// heel goed in de hoogste league, goed in de league eronder, anders bij de O23 van een club uit die league.
// Daarna bieden 3 à 4 clubs je een contract aan (binnen een league: hoe hoger je cijfer, hoe sterker de club) en kies jij.
export const SELECTIE_WED = 3;
export const SEL_DREMPEL = {top:7.5, tweede:6.5};
export const SEL_UITLEG = 'Gemiddeld 7,5 of hoger: een club uit de hoogste league. 6,5 of hoger: een club uit de league daaronder. Lager: je begint bij de O23 van een club uit die league.';
const TEGEN = ['Scouting Noord', 'Scouting Zuid', 'Scouting Oost', 'Scouting West', 'Talententeam Kust', 'Talententeam Stad'];
export const inSelectie = () => !!(S && S.selectie);
export const selGemiddelde = () => { const c = S.selectie.cijfers; return c.length ? gemiddelde(c) : null; };

export function startSelectie(){
  const sp = S.sp, Sel = S.selectie, o = ovr(sp);
  // Tegenstanders van je eigen niveau: het gaat erom hoe goed jij speelt, niet hoe oud je bent
  const wijS = o + randInt(0, 2), oppS = o - 5 + randInt(0, 2) + Sel.cijfers.length, thuis = rnd() < .5;
  const T = teamKracht(wijS, {speelt:true, thuis, bonus:false}), O = oppS + (thuis ? 0 : 2);
  const zij = pick(TEGEN.filter(n => !Sel.tegen.includes(n))); Sel.tegen.push(zij);
  const vn = S.sp.vriend ? vriendNaam() : null;
  // De eerste wedstrijd: de ranglijst staat klaar, en een van de talenten op jouw positie wordt je rivaal
  const eerste = !Sel.rang; if (eerste) Sel.rang = maakRanglijst();
  const R = rivaalSel();
  const M = {o23:true, selectie:true, oppS, wij:vn ? `Selectieteam (met ${vn})` : 'Selectieteam', zij, thuis, rol:'basis', us:0, them:0, min:0, ev:[], idx:0, log:[], cijfer:sp.pos === 'VERD' || sp.pos === 'KEEPER' ? 6.3 : 6.0, goals:0, assists:0, geel:false, rood:false, pending:null, klaar:false};
  S.M = M;
  planWedstrijd(M, T, O);
  M.log.push({m:"1'", t:`Selectiewedstrijd ${Sel.cijfers.length + 1} van ${SELECTIE_WED}. Langs de lijn staan scouts van clubs uit heel ${thuisLand()}, met een notitieblok in de hand.${vn ? ` Je speelt samen met ${vn} in het selectieteam.` : ''}`, k:''});
  if (eerste && R) M.log.push({m:"1'", t:`Langs de lijn hoor je de scouts praten over ${R.n}, ook ${POS_EEN[sp.pos]}. ${team.Hij} wordt gezien als het grootste talent van de selectiedagen. ${team.Hij} kijkt je even aan: dit wordt een strijd.`, k:'info'});
  S.fase = 'match';
  verderSpelen();
}
export function eindeSelectie(){
  if (S.M && S.M.proef) return eindeProefWed(); // (de oefenwedstrijd van de laatbloeier, proef.js)
  const sp = S.sp, M = S.M, Sel = S.selectie;
  M.klaar = true;
  if (M.us > M.them) M.cijfer += .3; else if (M.us < M.them) M.cijfer -= .3;
  if ((sp.pos === 'VERD' || sp.pos === 'KEEPER') && M.them === 0) M.cijfer += sp.pos === 'KEEPER' ? .7 : .5; // (de nul gehouden)
  M.cijfer = Math.round(clamp(M.cijfer, 3, 10) * 10) / 10;
  sp.vorm = clamp(sp.vorm * .5 + (M.cijfer - 6.5) * .7, -3, 3);
  staminaNaWedstrijd(M);
  focusNaWedstrijd(M);
  Sel.cijfers.push(M.cijfer); Sel.g += M.goals; Sel.a += M.assists;
  ranglijstNa(M.vriendGoals || 0);
  const r = mijnPlek(), n = Sel.cijfers.length;
  M.selTekst = `Je cijfers tot nu toe: ${Sel.cijfers.map(fmt1).join(' · ')} (gemiddeld ${fmt1(gemiddelde(Sel.cijfers))}). Bij de ${r.meerv} sta je nu op plek ${r.plek} van ${r.van}${r.plek <= RANG_TOP ? `: in de top ${RANG_TOP}, daar kijken de grote clubs mee!` : '.'}`
    + (S.sp.vriend && !vriendApart() ? ` ${vriendNaam()} staat bij de ${r.vriendMeerv} op plek ${r.vriendPlek} van ${r.vriendVan}.` : '')
    + (r.rivaalPlek ? ` Je rivaal ${rivaalSel().n} staat op plek ${r.rivaalPlek} (gemiddeld ${fmt1(r.rivaalGem)}).` : '') + (n < SELECTIE_WED ? ` Nog ${SELECTIE_WED - n} ${SELECTIE_WED - n === 1 ? 'wedstrijd' : 'wedstrijden'}.` : '');
  if (n >= SELECTIE_WED){ const gr = selectieGroei(); if (gr) M.selTekst += ' ' + gr; Sel.bods = maakSelectieBods(gemiddelde(Sel.cijfers)); } // (eerst je nieuwe klasse, dan de aanbiedingen)
  S.fase = 'matchEnd';
}
// Na de laatste selectiewedstrijd: wie uitblinkt, blijkt beter dan gedacht (en wie tegenvalt, iets minder).
// Bonus = je gemiddelde cijfer (-3 bij rond de 5,5 tot +8 bij 8,5 of hoger) plus je plek bij je positie (eerste +3, top 3 +1),
// op al je trainbare eigenschappen: hoe beter je selectiedagen, hoe hoger je klasse aan het begin van je carrière
export function selectieGroei(){
  const sp = S.sp, Sel = S.selectie; if (Sel.groei != null) return null;
  const gem = gemiddelde(Sel.cijfers), plek = mijnPlek().plek, voor = ovr(sp);
  const b = clamp(Math.round((gem - 6.5) * 4), -3, 8) + (plek === 1 ? 3 : plek <= RANG_TOP ? 1 : 0);
  Sel.groei = b; Sel.klasseVoor = voor; if (!b) return null;
  for (const k of TRAINBAAR) sp.a[k] = clamp(sp.a[k] + b, 20, 99);
  const na = ovr(sp); sp.pot = Math.max(sp.pot, na + 6); S.car.maxOvr = Math.max(S.car.maxOvr || 0, na);
  return b > 0 ? `De scouts zijn onder de indruk${plek === 1 ? `: de beste ${({SPITS:'spits', MID:'middenvelder', VERD:'verdediger', KEEPER:'keeper'})[sp.pos]} van de selectiedagen` : ''}. Je klasse gaat van ${voor} naar ${na}.` : `Je bent er nog niet helemaal: je klasse zakt van ${voor} naar ${na}.`;
}
// ---------- de scoutingranglijst: talenten per positie (keepers met keepers, spitsen met spitsen) ----------
const RANG_NAMEN = ['T. Dijkstra', 'K. Mensah', 'L. Peeters', 'J. Kramer', 'R. Aydin', 'D. Bos', 'M. Ferreira', 'S. de Wit', 'B. Hendriks', 'N. Koç', 'Y. Bennani', 'F. Schouten', 'G. Visser', 'A. Lambrecht', 'E. Owusu', 'P. Janssen', 'W. Nijland', 'C. Santos'];
// 3 keepers, 5 verdedigers, 5 middenvelders, 5 spitsen (op volgorde van de namen)
const RANG_POS = ['KEEPER', 'KEEPER', 'KEEPER', 'VERD', 'VERD', 'VERD', 'VERD', 'VERD', 'MID', 'MID', 'MID', 'MID', 'MID', 'SPITS', 'SPITS', 'SPITS', 'SPITS', 'SPITS'];
export const POS_MEERV = {SPITS:'spitsen', MID:'middenvelders', VERD:'verdedigers', KEEPER:'keepers'};
export const RANG_TOP = 3; // de top 3 van je positie: daar kijken de grote clubs mee
export const rangStart = () => RANG_POS.filter(p => p === S.sp.pos).length + (vriendPos() === S.sp.pos && !vriendApart() ? 1 : 0) + 1; // je begint onderaan je positie
export const RANG_START = 15; // (oude naam, voor wie hem nog gebruikt)
export const POS_EEN = {SPITS:'spits', MID:'middenvelder', VERD:'verdediger', KEEPER:'keeper'};
// Je rivaal op de selectiedagen: het sterkste talent op jouw positie (een klein beetje beter dan de rest)
export const rivaalSel = () => ((S.selectie && S.selectie.rang) || []).find(x => x.rivaal) || null;
export function maakRanglijst(){
  const v = vriendApart() ? null : S.sp.vriend; // (een vriend(in) van het andere geslacht doet mee aan andere selectiedagen)
  const l = RANG_NAMEN.map((n, i) => ({n, pos:RANG_POS[i], cijfers:[], basis:6.2 + rnd() * .5}));
  const mijn = l.filter(x => x.pos === S.sp.pos), r = mijn.length ? pick(mijn) : null; if (r){ r.rivaal = true; r.basis = 6.75 + rnd() * .25; }
  return l.concat(v ? [{n:`${v.v}. ${v.n}`, pos:vriendPos(), cijfers:[], basis:6.75 + (v.k - ovr(S.sp)) * .04, vriend:true}] : []);
}
// vriendGoals: de goals van je vriend uit jouw assists (elk +0,5 op zijn cijfer: zo help je hem in de top van zijn positie)
function ranglijstNa(vriendGoals = 0){
  const R = S.selectie.rang || (S.selectie.rang = maakRanglijst());
  R.forEach(x => x.cijfers.push(Math.round(clamp(x.basis + (rnd() + rnd() + rnd() - 1.5) * .9 + (x.vriend ? vriendGoals * .5 : 0), 4, 9.5) * 10) / 10));
}
// De talenten op één positie, op volgorde van gemiddeld cijfer (jij erbij als het jouw positie is)
export function ranglijst(pos = S.sp.pos){
  const Sel = S.selectie, R = Sel.rang || [];
  if (!Sel.cijfers.length) return null;
  R.forEach((x, i) => { if (!x.pos) x.pos = x.vriend ? vriendPos() : RANG_POS[i % RANG_POS.length]; }); // (oude opslag: alsnog een positie)
  const l = R.filter(x => x.pos === pos).map(x => ({n:x.n, gem:gemiddelde(x.cijfers), vriend:!!x.vriend, rivaal:!!x.rivaal}));
  if (pos === S.sp.pos) l.push({n:S.sp.naam, gem:gemiddelde(Sel.cijfers), jij:true});
  return l.sort((a, b) => b.gem - a.gem || (a.jij ? -1 : b.jij ? 1 : 0));
}
// Jouw plek bij jouw positie, en die van je vriend bij de zijne
export function mijnPlek(){
  const l = ranglijst(), n = POS_MEERV[S.sp.pos]; if (!l) return {plek:rangStart(), van:rangStart(), vriendPlek:null, meerv:n};
  const lv = S.sp.vriend && !vriendApart() ? ranglijst(vriendPos()) : null;
  const ri = l.findIndex(x => x.rivaal);
  return {plek:l.findIndex(x => x.jij) + 1, van:l.length, rivaalPlek:ri >= 0 ? ri + 1 : null, rivaalGem:ri >= 0 ? l[ri].gem : null, vriendPlek:lv ? lv.findIndex(x => x.vriend) + 1 || null : null, vriendVan:lv ? lv.length : null, meerv:n, vriendMeerv:POS_MEERV[vriendPos()]};
}
const vriendGem = () => { const x = (S.selectie.rang || []).find(y => y.vriend); return x && x.cijfers.length ? gemiddelde(x.cijfers) : null; };

// ---------- de aanbiedingen: 2 clubs van jouw niveau, plus een ambitieuze en (soms) een veilige keuze ----------
const band = g => g >= SEL_DREMPEL.top ? 0 : g >= SEL_DREMPEL.tweede ? 1 : 2; // 0 hoogste league, 1 tweede league, 2 O23
const opSterkte = t => divClubs(t).sort((a, b) => CLUBS[a].s - CLUBS[b].s);
// Een club rond jouw plek binnen de band (hoger cijfer = sterkere club)
function rondPlek(lijst, g, van, tot, al){
  const vrij = lijst.filter(i => !al.includes(i)); if (!vrij.length) return null;
  return vrij[clamp(Math.floor((g - van) / (tot - van) * vrij.length + (rnd() - .5) * 2), 0, vrij.length - 1)];
}
export function maakSelectieBods(g){
  const b = band(g), top = opSterkte(1), twee = opSterkte(LAAGSTE), bods = [], al = [];
  const voeg = (id, o23, soort) => { if (id == null || al.includes(id)) return; al.push(id); bods.push({club:id, o23, soort}); };
  const vrij = l => l.filter(i => !al.includes(i));
  if (b === 0){
    voeg(rondPlek(top, g, SEL_DREMPEL.top, 9, al), false, 'past'); voeg(rondPlek(top, g, SEL_DREMPEL.top, 9, al), false, 'past');
    if (g >= 8) voeg(vrij(top).pop(), false, 'ambitie');
    voeg(twee[twee.length - 1 - randInt(0, 1)], false, 'veilig');
  } else if (b === 1){
    voeg(rondPlek(twee, g, SEL_DREMPEL.tweede, SEL_DREMPEL.top, al), false, 'past'); voeg(rondPlek(twee, g, SEL_DREMPEL.tweede, SEL_DREMPEL.top, al), false, 'past');
    if (g >= 7.2) voeg(top[randInt(0, 1)], false, 'ambitie'); else voeg(pick(top.slice(-4)), true, 'ambitie');
  } else {
    voeg(rondPlek(twee, g, 4.5, SEL_DREMPEL.tweede, al), true, 'past'); voeg(rondPlek(twee, g, 4.5, SEL_DREMPEL.tweede, al), true, 'past');
    if (g >= 5.8) voeg(pick(top), true, 'ambitie');
    if (g >= 6) voeg(pick(vrij(twee).slice(0, 3)), false, 'veilig');
  }
  while (bods.length < 3 && vrij(twee).length) voeg(pick(vrij(twee)), b === 2, 'past');
  const o = ovr(S.sp), jong = S.sp.leeftijd < 18 ? .3 : 1;
  // een club die veel sterker is dan jij (zoals in Engeland): dan begin je bij de O23
  bods.forEach(x => { if (!x.o23 && o < CLUBS[x.club].s - 14) x.o23 = true; });
  bods.forEach(x => { const c = CLUBS[x.club]; x.salaris = Math.round(salarisVoor(c.t, o, c.s) * (x.o23 ? .5 : 1) * jong * (.9 + rnd() * .25) / 100) * 100; x.jaren = x.o23 ? 2 : randInt(2, 3); x.quote = scoutQuote(x); });
  // Je vriend: op jouw niveau (of hoger) tekent hij vaak bij een van jouw clubs, anders bij een club van zijn eigen niveau
  const vg = vriendGem();
  // (een vriend(in) van het andere geslacht: een club van zijn/haar niveau in de andere wereld)
  if (S.sp.vriend && vriendApart()){ const v = S.sp.vriend, l = [1, 2].flatMap(t => andereWereldIds(thuisLand(), t)).map(i => [i, andereWereldClub(thuisLand(), i).s]).sort((a, b) => Math.abs(a[1] - v.k - 4) - Math.abs(b[1] - v.k - 4)); if (l.length) S.selectie.vriendClub = {club:pick(l.slice(0, 3))[0], o23:false}; }
  else if (S.sp.vriend && vg != null){
    const vb = band(vg);
    if (vb <= b && rnd() < .6){ const x = pick(bods); S.selectie.vriendClub = {club:x.club, o23:vb === 2 && x.o23}; }
    else { const l = vb === 0 ? top : twee; S.selectie.vriendClub = {club:l[clamp(Math.floor((vg - 4.5) / 4.5 * l.length), 0, l.length - 1)], o23:vb === 2}; }
  }
  return bods;
}
function scoutQuote(x){
  if (x.o23) return x.soort === 'ambitie' ? '"Je begint bij onze O23, maar wel bij een topclub. Wie daar uitblinkt, krijgt een kans."' : '"Bij onze O23 krijg je speeltijd en de beste begeleiding. Van daaruit naar het eerste."';
  if (x.soort === 'ambitie') return '"We zijn een topclub. Je zult moeten knokken voor je minuten, maar hier word je beter."';
  if (x.soort === 'veilig') return '"Bij ons speel je. We bouwen het team om jou heen."';
  return CLUBS[x.club].t === 1 ? '"We volgen je al een tijdje. Je past perfect in ons plan."' : '"We zien je als vaste kracht. Hier kun je groeien."';
}
// Na het eindscherm: de volgende selectiewedstrijd, of de aanbiedingen bekijken
export function naSelectie(){
  const Sel = S.selectie; S.M = null;
  if (!Sel.bods){ S.sp.fit = clamp(S.sp.fit + weekHerstel(S.sp.fit), 0, 100); S.fase = 'selectie'; return; }
  const r = mijnPlek();
  S.fase = 'selectieKeuze';
}
// Tekenen bij de club van jouw keuze
export function tekenSelectie(i){
  const Sel = S.selectie, u = Sel.bods[i]; if (!u) return;
  const sp = S.sp, c = CLUBS[u.club], gem = Math.round(gemiddelde(Sel.cijfers) * 10) / 10, plek = mijnPlek().plek;
  sp.club = u.club; sp.clubWed = 0; sp.clubSz = 0; sp.contract = u.jaren;
  sp.salaris = u.salaris;
  sp.status = u.o23 ? Math.min(startStatus(u.club), 10) : startStatus(u.club);
  if (u.o23){ sp.o23 = {cijfers:[], g:0, a:0}; sp.vert = Math.min(sp.vert, 45); }
  else if (gem >= 8) mod('vert', 8);
  sp.statusNiveau = statusNiveau();
  S.car.clubs = [{club:sp.club, van:S.jaar, land:thuisLand()}];
  const V = Sel.verhaal, wie = V === 'wonder' ? 'als wonderkind van 15' : V === 'normaal' ? 'als 18-jarige' : 'als 23-jarige laatbloeier';
  if (u.proef){ const P = Sel.proef; S.car.hist.push(`${seizoenLabel()}: begonnen ${wie}: via zaakwaarnemer ${AGENT} een proeftraining (${fmt1(P.training)}) en een oefenwedstrijd (${fmt1(P.wed)}) bij ${c.n}${P.poging > 1 ? `, bij de ${P.poging}e kans` : ''} (klasse ${ovr(sp)})`); }
  else S.car.hist.push(`${seizoenLabel()}: begonnen ${wie} met ${SELECTIE_WED} selectiewedstrijden (gemiddeld ${fmt1(gem)}, plek ${plek} bij de ${POS_MEERV[sp.pos]}, klasse ${ovr(sp)})`);
  S.car.hist.push(`${seizoenLabel()}: ${u.o23 ? `naar de O23 van ${c.n}` : `tekent bij ${c.n}`}${thuisLand() !== 'Nederland' ? ` (${thuisLand()})` : ''}`);
  if (sp.vriend && Sel.vriendClub) plaatsVriend(Sel.vriendClub.club, Sel.vriendClub.o23);
  // Je rivaal van de selectiedagen tekent bij een andere club, van zijn/haar niveau (het liefst in jouw league)
  const R = rivaalSel();
  if (R && !sp.rivaal && R.cijfers.length){ const rg = gemiddelde(R.cijfers), d = clamp(Math.round((rg - gemiddelde(Sel.cijfers)) * 3), -4, 5), [v, ...n] = R.n.split('. '), rp = mijnPlek().rivaalPlek;
    maakRivaal({v, n:n.join('. '), k:ovr(sp) + d, t:rg >= SEL_DREMPEL.top ? 1 : LAAGSTE,
      achtergrond:`Jullie streden op de selectiedagen om de eerste plek bij de ${POS_MEERV[sp.pos]}: ${team.hij} werd ${rp}e, jij ${plek}e.`}); }
  hoogtepunt('profContract', {club:c.n, o23:!!u.o23, salaris:u.salaris, jaren:u.jaren}); // (hoogtepunten.js: volgende week, met keuzes)
  S.selectie = null;
  tmp.ondertekening = {clubId:u.club, jaren:u.jaren, salaris:u.salaris, o23:!!u.o23}; // je eerste club: de animatie (contract tekenen)
  nieuweWeek(true);
  startIntro({...u, gem});
  return club();
}
