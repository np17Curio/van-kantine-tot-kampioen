import { S, club, mod } from '../../core/state.js';
import { clamp, pick, rnd } from '../../core/utils.js';
import { CLUBS } from '../../data/gegevens.js';
import { ik } from '../../core/geslacht.js';
import { MOMENTS, focusBoost, kans, pOpts } from './momenten.js';
import { gebruik } from './stamina.js';
import { krantMelding } from '../media/roddel.js';
import { animPush } from '../../render/pitch.js';
import { eindeWedstrijd } from './wedstrijd.js';

/* ===================== Strafschoppenserie: jij in de hoofdrol ===================== */
// Een bekerwedstrijd eindigt gelijk en jij staat in het veld: dan neem jij een strafschop (je kiest de hoek), of je staat als
// keeper in het doel en kiest bij elke strafschop van de tegenstander een kant. De andere strafschoppen gaan vanzelf.
// Vijf per ploeg, daarna sudden death. M.ss houdt de serie bij; elke reeks strafschoppen gaat als 'shootout' naar het veld (pitch.js).
// Hoeken gezien vanaf de stip: L = links van de schutter (de grote y op het veld), R = rechts, M = het midden
const HOEK_Y = {L:36.3, M:34, R:31.7};
const KEEPER_Y = {L:36.5, M:34, R:31.5};
// De keuzes (ssSchutter, ssKeeper) staan in momenten.js
// Sta jij nog in het veld? (niet gewisseld, geen rood, en als invaller ook echt ingevallen)
const inHetVeld = M => !M.rood && M.gewisseld === undefined && (M.rol === 'basis' || (M.rol === 'invaller' && M.ev.slice(0, M.idx).some(x => x.type === 'inval')));
const willekeurigeKant = (pm = .2) => { const r = rnd(); return r < pm ? 'M' : r < pm + (1 - pm) / 2 ? 'L' : 'R'; };
const oppS = M => M.oppS ?? (CLUBS[M.opp] ? CLUBS[M.opp].s : 60);
// Beslist? Eerst vijf per ploeg (beslist zodra de achterstand niet meer in te halen is), daarna sudden death per ronde
function beslist(s){
  if (s.tW <= 5 && s.tZ <= 5){
    if (s.wij > s.zij + (5 - s.tZ) || s.zij > s.wij + (5 - s.tW)) return true;
    return s.tW === 5 && s.tZ === 5 && s.wij !== s.zij;
  }
  return s.tW === s.tZ && s.wij !== s.zij;
}
const wijAanDeBeurt = s => s.tW === s.tZ ? s.wijEerst : s.tW < s.tZ;
const streepjes = l => l.map(k => k.r ? '✓' : '✗').join(' ') || '–';
const standTekst = (M, s) => `Stand: ${s.wij}-${s.zij} (${M.wij}: ${streepjes(s.kicks.filter(k => k.w))} · ${M.zij}: ${streepjes(s.kicks.filter(k => !k.w))}).`;

// Start de serie (beker.js, eindeBeker). true = er wacht nu een keuze op jou; false = jij doet niet mee (de oude, automatische serie)
export function strafschoppenStart(M){
  if (!inHetVeld(M) || M.ss) return false;
  const s = M.ss = {wijEerst:rnd() < .5, kicks:[], wij:0, zij:0, tW:0, tZ:0, keeper:S.sp.pos === 'KEEPER', jijNr:0, getoond:0, aw:0, az:0, reddingen:0, jij:null};
  M.log.push({m:M.min + "'", t:`Strafschoppen! ${s.wijEerst ? M.wij : M.zij} begint.`, k:'rust'});
  return ssDoor(M) === 'wacht';
}
// De serie loopt door tot jij aan de beurt bent (of tot hij beslist is)
function ssDoor(M){
  const s = M.ss;
  while (!beslist(s)){
    const wij = wijAanDeBeurt(s);
    if (wij && !s.keeper && s.tW === s.jijNr){ zetKeuze(M, 'ssSchutter'); return 'wacht'; }
    if (!wij && s.keeper){ zetKeuze(M, 'ssKeeper'); return 'wacht'; }
    vanzelf(M, wij);
  }
  ssKlaar(M); return 'klaar';
}
// Een strafschop die vanzelf gaat: een teamgenoot, of hun schutter tegen jullie keeper
function vanzelf(M, wij){
  const s = M.ss, gat = (club().s - oppS(M)) / 200, p = clamp(.76 + (wij ? gat : -gat), .62, .88), r = rnd() < p;
  const kant = willekeurigeKant(.15), hoog = rnd() < .3, ky = r ? KEEPER_Y[kant === 'L' ? 'R' : 'L'] : KEEPER_Y[kant], naast = !r && rnd() < .3;
  s.kicks.push({w:wij ? 1 : 0, r, y:HOEK_Y[kant], z:hoog ? 1.35 : .3, ky:naast ? KEEPER_Y[willekeurigeKant(.2)] : ky, naast});
  if (wij){ s.tW++; if (r) s.wij++; } else { s.tZ++; if (r) s.zij++; }
}
// Laat zien wat er sinds de vorige keer gebeurde (in het veld), met de stand van toen erbij
function toonNieuw(M, slot){
  const s = M.ss, l = s.kicks.slice(s.getoond); if (!l.length && !slot) return;
  animPush(M, {soort:'shootout', type:'shootout', kicks:l, start:{w:s.aw, z:s.az}, ...(slot ? {winst:s.wij > s.zij} : {})});
  s.getoond = s.kicks.length; s.aw = s.wij; s.az = s.zij;
}
function zetKeuze(M, type){
  const s = M.ss, sd = s.tW >= 5 && s.tZ >= 5;
  toonNieuw(M);
  const delen = [];
  if (type === 'ssSchutter'){
    delen.push(s.kicks.length ? standTekst(M, s) : 'Na het laatste fluitsignaal staat het nog steeds gelijk.');
    delen.push(s.tW === 0 ? 'De trainer wijst naar jou: jij neemt de eerste strafschop.' : 'Jij bent weer aan de beurt.');
    delen.push(pick(['Je legt de bal op de stip. Het hele stadion houdt de adem in. Welke hoek kies je?', 'Je loopt naar de stip. De keeper springt op en neer op de lijn. Welke hoek kies je?']));
  } else {
    if (s.kicks.length) delen.push(standTekst(M, s));
    if (sd) delen.push('Sudden death!');
    delen.push(`Strafschop ${s.tZ + 1} van ${M.zij}.`);
    delen.push(pick(['Hun schutter legt de bal klaar en kijkt je aan. Welke kant kies je?', 'Je staat op de lijn. Hun schutter neemt een lange aanloop. Welke kant kies je?']));
  }
  M.pending = {type, tekst:delen.join(' '), idx:MOMENTS[type].opts.map((o, i) => i), ss:true};
}
// Jouw keuze (wedstrijd.js, kies)
export function strafschopKies(i){
  const M = S.M, s = M.ss, p = M.pending, opt = pOpts(p)[i], m = M.min + "'";
  const kp = kans(opt); gebruik(M, opt);
  let tekst, gelukt;
  if (p.type === 'ssSchutter'){
    // De keeper kiest een kant (soms blijft hij staan). Hoog: lastig te stoppen, maar je kunt over schieten
    const kd = willekeurigeKant(.25), naast = rnd() < (opt.kant === 'M' ? .02 + (1 - kp) * .1 : opt.hoog ? .08 + (1 - kp) * .25 : .03 + (1 - kp) * .08);
    const goed = kd === opt.kant, r = !naast && (!goed || rnd() < (opt.kant === 'M' ? .1 : opt.hoog ? .45 + kp * .35 : kp * .6));
    tekst = naast ? (opt.hoog ? 'Te hoog. De bal vliegt over de lat.' : opt.kant === 'M' ? 'Je raakt hem helemaal verkeerd. Naast.' : 'Je schiet hem net langs de paal.')
      : r ? (opt.kant === 'M' ? 'De keeper duikt al weg. Keihard door het midden: raak!' : goed ? (opt.hoog ? 'De keeper zit in de goede hoek, maar je schot gaat er hoog overheen in de kruising. Raak!' : 'De keeper zit in de goede hoek, maar je schot is te hard. Raak!') : opt.hoog ? 'Hoog in de kruising, de keeper gaat de andere kant op. Raak!' : 'Strak in de hoek, de keeper gaat de andere kant op. Raak!')
      : (opt.kant === 'M' ? 'De keeper blijft staan en pakt je schot door het midden.' : 'De keeper zit in de goede hoek en stopt je strafschop.');
    s.kicks.push({w:1, r, jij:1, y:HOEK_Y[opt.kant], z:opt.hoog ? 1.4 : .3, ky:KEEPER_Y[kd], naast});
    s.tW++; if (r) s.wij++; gelukt = r; s.jij = r; M.penJij = r;
    M.cijfer += r ? .3 : -.4;
  } else {
    // Hun schutter kiest een hoek; jouw links is zijn rechts
    const sk = willekeurigeKant(.2), kant = opt.kant === 'L' ? 'R' : opt.kant === 'R' ? 'L' : 'M', naast = rnd() < .07;
    const red = !naast && sk === kant && rnd() < (kant === 'M' ? .9 : clamp(kp * .9, .15, .85)), raak = !naast && !red;
    tekst = naast ? pick(['Hun schutter schiet naast!', 'Hun schutter schiet over! Je balt je vuist.']) : red ? pick(['Je zit in de goede hoek en stopt de strafschop!', 'Gestopt! Je tikt hem met je vingertoppen om de paal.']) : sk === kant ? (kant === 'M' ? 'Je blijft staan, maar de bal gaat keihard boven je in.' : 'Je zit in de goede hoek, maar de bal gaat net langs je handen in.') : kant === 'M' ? 'Je blijft staan en de bal gaat in de hoek. Raak.' : 'Je duikt de verkeerde kant op. Raak.';
    s.kicks.push({w:0, r:raak, jijK:1, y:HOEK_Y[sk], z:rnd() < .3 ? 1.3 : .3, ky:KEEPER_Y[kant], naast});
    s.tZ++; if (raak) s.zij++; gelukt = !raak;
    if (red){ s.reddingen++; M.reddingen = (M.reddingen || 0) + 1; S.ss.red = (S.ss.red || 0) + 1; S.car.red = (S.car.red || 0) + 1; M.cijfer += .4; }
  }
  if (gelukt) focusBoost(1); else mod('focus', -1);
  M.log.push({m, t:`[${opt.l}] ${tekst}`, k:gelukt ? 'ok' : 'mis'});
  M.pending = null;
  if (ssDoor(M) === 'klaar') eindeWedstrijd();
}
// De serie is beslist: uitslag, verslag en de krant
function ssKlaar(M){
  const s = M.ss, winst = s.wij > s.zij, sp = S.sp;
  M.pens = `${s.wij}-${s.zij}`; M.pensWin = winst;
  toonNieuw(M, true);
  M.log.push({m:M.min + "'", t:winst ? `${M.wij} wint na strafschoppen (${s.wij}-${s.zij})!` : `${M.zij} wint na strafschoppen (${s.zij}-${s.wij}).`, k:winst ? 'goal' : 'tegen'});
  if (M.beker && M.beker.finale && winst) return; // (de bekerwinst haalt de krant al: beker.js)
  const rol = s.keeper ? (s.reddingen ? `${sp.naam} stopte er ${s.reddingen === 1 ? 'één' : s.reddingen}.` : `${sp.naam} kon er geen stoppen.`)
    : s.jij === true ? `${sp.naam} benutte ${ik.zijn} strafschop.` : s.jij === false ? `${sp.naam} miste ${ik.zijn} strafschop.` : '';
  const kop = s.keeper && winst && s.reddingen >= 2 ? `${sp.naam} held in de strafschoppenserie` : winst ? `${M.wij} wint na strafschoppen van ${M.zij}` : `${M.wij} na strafschoppen uitgeschakeld door ${M.zij}`;
  const waar = M.beker ? `In de ${M.beker.ronde.toLowerCase()} van de ${M.beker.naam} werd het ${s.wij}-${s.zij} in de strafschoppenserie.` : `Het werd ${s.wij}-${s.zij} in de strafschoppenserie.`;
  krantMelding(kop, `${waar} ${rol}`.trim());
}
