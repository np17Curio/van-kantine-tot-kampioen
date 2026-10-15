import { S, club, mod, ovr, seizoenLabel } from '../../core/state.js';
import { knop } from '../../core/ui.js';
import { clamp, esc, randInt, rnd, shuffle } from '../../core/utils.js';
import { CLUBS, JEUGD, divClubs } from '../../data/gegevens.js';
import { simGoals } from './competitie.js';
import { kortClub } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { social, volgersNaWedstrijd } from '../prive/social.js';
import { isProf, topBonus } from '../prive/sponsors.js';
import { carCijfer } from '../seizoen/carriere.js';
import { recordsNaWedstrijd } from '../seizoen/records.js';
import { fmt1 } from '../speler/o23.js';
import { checkStatus, statusPunten, wedstrijdPunten } from '../speler/status.js';
import { teamKracht } from '../team/kleedkamer.js';
import { opstellingReden, opstellingScore } from '../team/opstelling.js';
import { maakPers, modFans, vPers } from '../wedstrijd/fans-pers.js';
import { focusNaWedstrijd } from '../wedstrijd/focus.js';
import { MOMENTS, kans } from '../wedstrijd/momenten.js';
import { ontvangst, reunieAftrap, reunieMet, reunieNaWedstrijd, vReunieEinde } from '../wedstrijd/reunie.js';
import { planWedstrijd, stand2, verderSpelen, vervolgNaRonde } from '../wedstrijd/wedstrijd.js';
import { animPush, reeksStrafschoppen } from '../../render/pitch.js';
import { scorebord, vFit, vLog } from '../../render/views/match.js';
import { staminaNaWedstrijd } from '../wedstrijd/stamina.js';
import { vormBonus } from './vorm.js';
import { GAST_START, GASTEN } from '../../data/gegevens.js';
import { SPEEL_LANDEN, thuisLand } from '../../data/landen.js';
import { ck, vreemdeClub } from '../transfers/buitenland.js';

/* ===================== Beker ===================== */
// Elke competitie heeft een beker: knock-out, bij gelijkspel strafschoppen. Bekerwedstrijden vallen tussen de speelrondes
export const BEKERS = {
  nat:  {naam:'Nationale Beker', niveaus:[1, 2, 3, 4], schema:[2, 5, 8, 10, 13], rondes:['1/16 finale', '1/8 finale', 'Kwartfinale', 'Halve finale', 'Finale']},
  cl:   {naam:'Champions League', niveaus:[],          schema:[3, 6, 9, 12],      rondes:['Achtste finale', 'Kwartfinale', 'Halve finale', 'Finale'], europa:true},
  eur:  {naam:'Europa Cup',      niveaus:[],           schema:[3, 9, 12],         rondes:['Kwartfinale', 'Halve finale', 'Finale'], europa:true},
  jeugd:{naam:'Jeugdbeker',      niveaus:[JEUGD],      schema:[3, 9, 13],         rondes:['Kwartfinale', 'Halve finale', 'Finale']}
};
export function nieuweBekers(){
  const b = {};
  const eu = europeseClubs();
  for (const k in BEKERS){ const clubs = BEKERS[k].europa ? eu[k] : CLUBS.map((c, i) => i).filter(i => BEKERS[k].niveaus.includes(CLUBS[i].t)); b[k] = {levend:shuffle(clubs), rondes:[], winnaar:null}; }
  return b;
}
// Europees voetbal: de nummers 1 en 2 van de hoogste competitie van elk land spelen de Champions League (16 clubs),
// de nummers 3 en 4 van jouw land en de nummer 3 van 6 andere landen de Europa Cup (8 clubs).
// Jouw land: de eindstand van vorig seizoen (S.vorig), zonder eindstand de clubsterkte. Andere landen: op sterkte,
// met wat toeval (die competities worden niet gespeeld). Zij doen mee via de gastplaatsen in CLUBS.
export function vulGasten(){
  const andere = SPEEL_LANDEN.filter(l => l !== thuisLand()), cl = [], eur = [];
  let g = GAST_START;
  const zet = (land, id, rang, lijst) => { const c = vreemdeClub(land, id); Object.assign(CLUBS[g], {n:c.n, s:c.s, t:-1, gast:{land, id, rang}}); if (S.sel) delete S.sel[ck(g)]; lijst.push(g); g++; };
  andere.forEach((land, k) => {
    const top = []; for (let id = 8; id < 40; id++){ const c = vreemdeClub(land, id); if (c.t === 1) top.push([id, c.s + rnd() * 10]); } // een gesimuleerde eindstand: de sterkste wint meestal, niet altijd
    top.sort((a, b) => b[1] - a[1]);
    if (top[0]) zet(land, top[0][0], 1, cl); if (top[1]) zet(land, top[1][0], 2, cl);
    if (k < 6 && top[2]) zet(land, top[2][0], 3, eur);
  });
  S.gasten = CLUBS.slice(GAST_START, GAST_START + GASTEN).map(c => ({n:c.n, s:c.s, gast:c.gast}));
  return {cl, eur};
}
// Na laden: de gasten van dit seizoen terugzetten (namen en sterkte)
export function zetGasten(){ (S.gasten || []).forEach((x, i) => { if (CLUBS[GAST_START + i]) Object.assign(CLUBS[GAST_START + i], x); }); }
export function europeseClubs(){
  const V = S.vorig || {};
  const sleutel = id => V[id] ? V[id].t * 20 + V[id].plek : 200 - CLUBS[id].s;
  const top = divClubs(1).sort((a, b) => sleutel(a) - sleutel(b)), g = vulGasten();
  return {cl:top.slice(0, 2).concat(g.cl), eur:top.slice(2, 4).concat(g.eur)};
}
// Alle bekers waar een club dit seizoen in zit (een club uit de Topdivisie speelt de Nationale Beker en een Europese beker)
export const bekersVan = id => { const B = S.ss.bekers; if (!B) return []; return Object.keys(B).filter(k => B[k].levend.includes(id) || B[k].rondes.some(r => r.some(m => m.h === id || m.u === id))); };
export const bekerVan = id => { const B = S.ss.bekers; if (!B) return null; for (const k in B) if (B[k].levend.includes(id) || B[k].rondes.some(r => r.some(m => m.h === id || m.u === id))) return k; return null; };
export function simBeker(h, u){
  const [a, b] = simGoals(CLUBS[h].s, CLUBS[u].s, false);
  let pen = null; if (a === b) pen = rnd() < clamp(.5 + (CLUBS[h].s - CLUBS[u].s) / 60, .2, .8) ? 'h' : 'u';
  return {h, u, gh:a, gu:b, pen, w: a > b || pen === 'h' ? h : u};
}
// Speel een bekerronde van beker k; de wedstrijd van jouw club wordt overgeslagen (die speel je zelf)
export function speelBekerRonde(k, mijnWedstrijdApart){
  const B = S.ss.bekers[k], paren = [], l = B.levend.slice();
  for (let i = 0; i + 1 < l.length; i += 2) paren.push([l[i], l[i + 1]]);
  const ronde = []; let mijn = null;
  for (const [h, u] of paren){
    if (mijnWedstrijdApart && (h === S.sp.club || u === S.sp.club)){ mijn = {h, u}; ronde.push({h, u, wacht:true}); continue; }
    ronde.push(simBeker(h, u));
  }
  B.rondes.push(ronde);
  if (!mijn) bekerRondeKlaar(k);
  return mijn;
}
export function bekerRondeKlaar(k){
  const B = S.ss.bekers[k], r = B.rondes[B.rondes.length - 1];
  B.levend = shuffle(r.map(m => m.w));
  if (B.levend.length === 1){ B.winnaar = B.levend[0]; }
}
export const bekerRondeNaam = (k, i) => BEKERS[k].rondes[i] || `Ronde ${i + 1}`;
export function bekerNu(){ const B = S.ss.bekers; if (!B) return false; return Object.keys(B).some(k => BEKERS[k].schema.includes(S.ronde) && B[k].winnaar === null && B[k].levend.length > 1); }
export function naWedstrijd(){
  S.ronde++;
  if (bekerNu()) return bekerWeek();
  vervolgNaRonde();
}
// Alle bekers die nu aan de beurt zijn; speelt jouw club mee, dan speel je die wedstrijd zelf
export function bekerWeek(){
  const B = S.ss.bekers, sp = S.sp; let mijn = null, mijnK = null;
  for (const k in B){
    if (!BEKERS[k].schema.includes(S.ronde) || B[k].winnaar !== null || B[k].levend.length < 2) continue;
    const doetMee = B[k].levend.includes(sp.club);
    const m = speelBekerRonde(k, doetMee);
    if (m){ mijn = m; mijnK = k; }
  }
  if (!mijn) return vervolgNaRonde();
  return startBeker(mijnK, mijn);
}
export function startBeker(k, m){
  const sp = S.sp, c = club(), thuis = m.h === sp.club, oppId = thuis ? m.u : m.h, opp = CLUBS[oppId], B = S.ss.bekers[k];
  const rondeNaam = bekerRondeNaam(k, B.rondes.length - 1), finale = rondeNaam === 'Finale';
  let rol, reden = '';
  if (sp.o23) rol = 'o23';
  else if (sp.blessure > 0) rol = 'blessure';
  else if (sp.fit < 20) rol = 'rust';
  else { const sc = opstellingScore() + randInt(-6, 6); rol = sc >= 50 ? 'basis' : sc >= 12 ? 'invaller' : 'tribune'; if (rol !== 'basis') reden = ' ' + opstellingReden(); }
  const speelt = rol === 'basis' || rol === 'invaller';
  const T = teamKracht(c.s, {speelt, thuis:thuis && !finale}), O = opp.s + (!thuis && !finale ? 2 : 0) + vormBonus(oppId);
  const M = {beker:{k, naam:BEKERS[k].naam, ronde:rondeNaam, finale}, opp:oppId, oppS:opp.s, wij:c.n, zij:opp.n, thuis, rol, us:0, them:0, min:0, ev:[], idx:0, log:[], cijfer:sp.pos === 'VERD' ? 6.3 : 6.0, goals:0, assists:0, geel:false, rood:false, pending:null, klaar:false};
  S.M = M;
  M.log.push({m:'', t:`${k === 'cl' ? 'De Champions League-hymne klinkt door het stadion. Kippenvel. ' : ''}${BEKERS[k].naam} · ${rondeNaam}${finale ? ' in een uitverkocht stadion' : ''}. ${rol === 'basis' ? 'Je staat in de basis.' : rol === 'invaller' ? 'Je begint op de bank.' + reden : rol === 'o23' ? 'Je speelt bij de O23 en kijkt vanaf de tribune.' : rol === 'blessure' ? 'Je bent geblesseerd en kijkt vanaf de tribune.' : rol === 'rust' ? 'Je bent kapot en krijgt rust.' : 'De trainer laat je buiten de selectie.' + reden}`, k:'rust'});
  if (!speelt){ const [a, b] = simGoals(T, O, false); if (reunieMet(oppId)) M.reunie = {club:oppId, type:reunieMet(oppId).type, ontvangst:ontvangst(oppId)}; planWedstrijd(M, T, O, {us:a, them:b}); }
  else { reunieAftrap(M); planWedstrijd(M, T, O); }
  S.fase = 'match';
  verderSpelen();
}
// Einde bekerwedstrijd: bij gelijkspel strafschoppen (jij neemt er één als je in het veld staat)
export function eindeBeker(){
  const sp = S.sp, M = S.M, k = M.beker.k, B = S.ss.bekers[k];
  M.klaar = true;
  const speelde = M.rol === 'basis' || M.rol === 'invaller';
  let winst = M.us > M.them;
  if (M.us === M.them){
    let wij = 0, zij = 0; const kansJij = speelde && !M.rood ? kans(MOMENTS.penalty.opts[0]) : null;
    const ks = reeksStrafschoppen(kansJij, M); wij = ks.wij; zij = ks.zij;
    winst = wij > zij; M.pens = `${wij}-${zij}`; animPush(M, {soort:'shootout', type:'shootout', kicks:ks.lijst, winst});
    M.log.push({m:"120'", t:`Strafschoppen!${M.penJij === true ? ' Jij neemt de vijfde: raak!' : M.penJij === false ? ' Jij neemt de vijfde... en mist.' : ''} ${winst ? `${club().n} wint na strafschoppen (${wij}-${zij})!` : `${CLUBS[M.opp].n} wint na strafschoppen (${zij}-${wij}).`}`, k: winst ? 'goal' : 'tegen'});
    if (speelde) M.cijfer += M.penJij === true ? .3 : M.penJij === false ? -.4 : 0;
  }
  // Uitslag in het schema zetten
  const r = B.rondes[B.rondes.length - 1], m = r.find(x => x.wacht);
  Object.assign(m, {gh: M.thuis ? M.us : M.them, gu: M.thuis ? M.them : M.us, pen: M.pens ? ((winst === M.thuis) ? 'h' : 'u') : null, w: winst ? sp.club : M.opp}); delete m.wacht;
  bekerRondeKlaar(k);
  if (speelde){
    if (winst) M.cijfer += .3; else M.cijfer -= .3;
    M.cijfer = Math.round(clamp(M.cijfer, 3, 10) * 10) / 10;
    sp.vert = clamp(sp.vert + (M.cijfer - (M.rol === 'invaller' ? 6.0 : 6.3)) * 4, 0, 100);
    sp.vorm = clamp(sp.vorm * .6 + (M.cijfer - 6.5) * .7, -3, 3);
    sp.rep = clamp(sp.rep + (M.cijfer - 6.5) + M.goals * .8, 0, 100);
    staminaNaWedstrijd(M);
    S.car.wed++; S.car.g += M.goals; S.car.a += M.assists; carCijfer(M.cijfer);
    S.ss.bg = (S.ss.bg || 0) + M.goals; S.ss.ba = (S.ss.ba || 0) + M.assists; S.ss.bw = (S.ss.bw || 0) + 1;
    statusPunten(wedstrijdPunten(M.cijfer, M.goals, M.assists, winst, M.rood, M.rol === 'invaller') * .5);
    M.bonus = topBonus(M);
    focusNaWedstrijd(M); volgersNaWedstrijd(M); recordsNaWedstrijd(M);
  } else M.cijfer = null;
  mod('moraal', winst ? 4 : -4);
  if (winst && B.winnaar === sp.club){
    M.bekerWinst = true; mod('moraal', 12); mod('rep', 4); statusPunten(5); modFans(8);
    if (k === 'cl'){ S.ss.clWinst = true; mod('rep', 6); social().volgers = Math.round(social().volgers * 1.1); }
    const prijs = `${BEKERS[k].naam} ${seizoenLabel()}`; S.car.prijzen.push(prijs); S.car.hist.push(`${seizoenLabel()}: ${BEKERS[k].naam} gewonnen met ${club().n}`); S.ss.bekerWinst = BEKERS[k].naam;
    krantMelding(`${club().n} wint de ${BEKERS[k].naam}!`, `${M.pens ? 'Na strafschoppen' : `Met ${stand2()}`} werd ${CLUBS[M.opp].n} verslagen in de finale.${speelde && M.goals ? ` ${sp.naam} scoorde.` : ''}`);
  } else if (!winst){ M.bekerUit = `Uitgeschakeld in de ${M.beker.ronde.toLowerCase()} door ${CLUBS[M.opp].n}.`; S.ss.bekerRes = `${M.beker.ronde} (uitgeschakeld)`; }
  else S.ss.bekerRes = `door naar de ${bekerRondeNaam(k, B.rondes.length).toLowerCase()}`;
  if (B.winnaar === sp.club) S.ss.bekerRes = 'gewonnen';
  M.statusTekst = checkStatus();
  if (speelde && isProf() && M.beker.ronde === 'Finale') M.pers = maakPers(M, 'finale');
  if (M.reunie){ M.bekerWinstRonde = winst; reunieNaWedstrijd(M, speelde); }
  S.fase = 'matchEnd';
}
// Bekerresultaat van een club dit seizoen, rechtstreeks uit het schema (klopt ook na een transfer)
export function bekerResultaat(id){
  const l = bekersVan(id).map(k => ({k, r:bekerResultaatK(id, k)})).filter(x => x.r);
  if (!l.length) return null;
  if (l.length === 1 && l[0].k !== 'cl' && l[0].k !== 'eur') return l[0].r;
  return l.map(x => `${BEKERS[x.k].naam}: ${x.r}`).join(' · ');
}
export function bekerResultaatK(id, k){
  const b = S.ss.bekers[k];
  if (b.winnaar === id) return 'gewonnen';
  let laatste = null; b.rondes.forEach((r, i) => r.forEach(m => { if (m.h === id || m.u === id) laatste = {m, i}; }));
  if (!laatste) return null;
  return laatste.m.w === id ? `door naar de ${bekerRondeNaam(k, laatste.i + 1).toLowerCase()}` : `${bekerRondeNaam(k, laatste.i)} (uitgeschakeld)`;
}
export function naBeker(){ S.M = null; vervolgNaRonde(); }
export function vBekerEnd(){
  const M = S.M, k = M.beker.k, B = S.ss.bekers[k], uitslag = M.us > M.them ? 'Gewonnen' : M.us < M.them ? 'Verloren' : 'Gelijkspel';
  const ronde = B.rondes[B.rondes.length - 1];
  let h = scorebord() + `<div class="verhaal"><span class="label">${esc(M.beker.naam)} · ${esc(M.beker.ronde)} · ${uitslag}${M.pens ? ` (strafschoppen ${M.pens})` : ''}</span>`;
  if (M.cijfer !== null) h += `<div class="rij" style="gap:20px;align-items:flex-end"><div><span class="label">Jouw cijfer</span><div class="groot">${fmt1(M.cijfer)}</div></div><div class="muted">${M.goals} ${M.goals === 1 ? 'goal' : 'goals'} · ${M.assists} ${M.assists === 1 ? 'assist' : 'assists'}</div></div>`
    + (M.focusTekst ? `<p class="${M.focusOmlaag ? 'fouttxt' : 'goedtxt'}">${esc(M.focusTekst)}</p>` : '') + vFit(M) + (M.bonus ? `<p class="melding">${esc(M.bonus.tekst)}</p>` : '');
  if (M.bekerWinst) h += `<div class="kampioen"><span class="label">Bekerwinnaar!</span><h2>🏆 ${esc(M.beker.naam)}</h2><p>${esc(club().n)} wint de ${esc(M.beker.naam)}! De beker gaat van hand tot hand en jij mag hem als eerste omhoog houden.</p></div>`;
  else if (M.bekerUit) h += `<p class="melding" style="color:var(--fout);border-color:var(--fout)">${esc(M.bekerUit)}</p>`;
  else h += `<p class="melding">Door naar de ${esc(bekerRondeNaam(k, B.rondes.length).toLowerCase())}!</p>`;
  if (M.statusTekst) h += `<p class="melding">${esc(M.statusTekst)}</p>`;
  h += vReunieEinde(M);
  if (M.recordTekst) h += `<div class="kampioen"><span class="label">Record!</span>${[].concat(M.recordTekst).map(t => `<p>${esc(t)}</p>`).join('')}</div>`;
  h += vPers();
  h += `</div>`;
  const anderen = ronde.filter(m => m.h !== S.sp.club && m.u !== S.sp.club);
  if (anderen.length) h += `<div class="krantblok"><span class="label">Ook in de ${esc(M.beker.ronde.toLowerCase())}</span>${vBekerUitslagen(anderen)}</div>`;
  return h + vLog() + knop('Verder', naBeker);
}
export function vBekerUitslagen(lijst){
  return `<div class="uitslagen">${lijst.filter(m => !m.wacht).map(m => `<div class="uit ${m.h === S.sp.club || m.u === S.sp.club ? 'mij' : ''}"><span class="th ${m.w === m.h ? 'w' : ''}">${esc(kortClub(m.h))}</span><b>${m.gh} - ${m.gu}${m.pen ? ' ns' : ''}</b><span class="tu ${m.w === m.u ? 'w' : ''}">${esc(kortClub(m.u))}</span></div>`).join('')}</div>`;
}
export function vBekerKaart(){ return bekersVan(S.sp.club).map(vBekerKaartK).join(''); }
export function vBekerKaartK(k){
  const B = S.ss.bekers; if (!B) return '';
  const b = B[k], naam = BEKERS[k].naam, nog = b.levend.includes(S.sp.club), volgende = BEKERS[k].schema[b.rondes.length];
  let status;
  if (b.winnaar === S.sp.club) status = '<p class="goedtxt"><b>Bekerwinnaar!</b></p>';
  else if (b.winnaar !== null) status = `<p>Winnaar: <b>${esc(CLUBS[b.winnaar].n)}</b>.</p>`;
  else if (nog) status = `<p>Jullie zitten nog in de beker. Volgende: <b>${esc(bekerRondeNaam(k, b.rondes.length))}</b>${volgende ? ` (na speelronde ${volgende})` : ''}.</p>`;
  else { const uit = b.rondes.flat().find(m => (m.h === S.sp.club || m.u === S.sp.club) && m.w !== S.sp.club); status = `<p class="muted">Uitgeschakeld${uit ? ` door ${esc(CLUBS[uit.w].n)}` : ''}. Nog ${b.levend.length} clubs over.</p>`; }
  const laatste = b.rondes.length ? b.rondes[b.rondes.length - 1] : null;
  return `<div class="kaart"><h3>${naam}</h3>${status}${laatste ? `<span class="label">${esc(bekerRondeNaam(k, b.rondes.length - 1))}</span>${vBekerUitslagen(laatste.filter((m, i) => i < 8 || m.h === S.sp.club || m.u === S.sp.club))}` : '<p class="muted klein-tekst">De eerste ronde wordt na speelronde ' + BEKERS[k].schema[0] + ' gespeeld.</p>'}</div>`;
}
