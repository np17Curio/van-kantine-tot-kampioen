import { S, club, mod, ovr, tmp, waarde } from '../../core/state.js';
import { clamp, pick, poisson, randInt, rnd } from '../../core/utils.js';
import { AANTAL_RONDES, AANV, CLUBS, POS, TEAMGENOTEN, TEGENSTANDERS, WINTER, INTER_WEKEN, weekFactor } from '../../data/gegevens.js';
import { eindeBeker, naWedstrijd } from '../competitie/beker.js';
import { fixture, simGoals } from '../competitie/competitie.js';
import { doelHun, doelOns, gewogen, inVeld, ploeg, selectie, speelRonde, tegenPloeg, telt } from '../competitie/spelers.js';
import { eindeInterland, maakOproep } from '../interlands/interlands.js';
import { toernooiNaWedstrijd, twStrafschoppen } from '../interlands/toernooi.js';
import { maakNieuws, metVoorletter } from '../media/nieuws.js';
import { volgersNaWedstrijd } from '../prive/social.js';
import { isProf, topBonus } from '../prive/sponsors.js';
import { carCijfer } from '../seizoen/carriere.js';
import { checkKampioen } from '../seizoen/kampioen.js';
import { recordsNaWedstrijd } from '../seizoen/records.js';
import { kalmte, onrust } from '../speler/kalmte.js';
import { checkO23, eindeO23, startO23 } from '../speler/o23.js';
import { eindeSelectie } from '../speler/selectie.js';
import { rugnummer } from '../team/rugnummers.js';
import { speeltTegenVriend, toonMeter, vriendNaam, vriendPos, vriendBijTegenstander, vriendInTeam, zetVriendBand } from '../speler/journey.js';
import { checkStatus, statusNiveau, statusPunten, wedstrijdPunten } from '../speler/status.js';
import { isAanvoerder } from '../team/aanvoerder.js';
import { band, iedereen, teamKracht } from '../team/kleedkamer.js';
import { opstellingReden, opstellingScore } from '../team/opstelling.js';
import { clubTactiek, erbij, matchup } from '../team/tactiek.js';
import { openVenster } from '../transfers/transfers.js';
import { agentCheck } from '../transfers/zaakwaarnemer.js';
import { fansNaWedstrijd, fansVoorAftrap, isDerby, maakPers, modFans } from './fans-pers.js';
import { focusNaWedstrijd } from './focus.js';
import { FLOW, MOMENTS, SLECHTE_FOCUS, bouwMoment, focusBoost, kans, kiesMomentType, pOpts } from './momenten.js';
import { gebruik, staminaNaWedstrijd, staminaStart, wisselCheck } from './stamina.js';
import { eindeNacompetitie, nacompetitie } from '../competitie/nacompetitie.js';
import { ontvangst, reunieAftrap, reunieMet, reunieNaWedstrijd } from './reunie.js';
import { leeftijdGroei, nieuweWeek, verhoog } from '../week.js';
import { animAnderen, animPush, animSoort, animVariant } from '../../render/pitch.js';
import { talentNaWedstrijd } from '../speler/talent.js';
import { reeksTekst, vormBonus } from '../competitie/vorm.js';
import { krantMelding } from '../media/roddel.js';
import { merkenNaWedstrijd } from '../prive/merken.js';

/* ===================== Wedstrijd ===================== */
// Achtergrondgoals als jij meespeelt (naast jouw momenten): factor voor jullie en voor de tegenstander
export const BG = {wij:.5, zij:.85};
// Bij "seizoen simuleren": minder achtergrondgoals voor jullie en meer voor de tegenstander, zodat een middenmoter niet vanzelf kampioen wordt
export const SIM_BG = {wij:.8, zij:1.1};
import { pers } from '../speler/persoonlijkheid.js';
import { naRivaalDuel, rivaalNaam, speeltTegenRivaal, rivaal, RIVAAL_MOMENTEN, rivaalVoorzet } from '../speler/rivaal.js';
import { ik, team, vr } from '../../core/geslacht.js';
// Hoe vaak de keeper van een veel sterkere ploeg jouw goal hooguit voorkomt
export const KEEPER_MAX = .3;
// VAR: alleen bij de profs (Topdivisie, Eerste Divisie, Europese bekers, interlands). Bij elke goal (van jou, je teamgenoten
// en de tegenstander): 15% check, 40% daarvan afgekeurd.
export const VAR = {jij:{check:.3, af:.3}, tegen:{check:.15, af:.4}}; // jouw goals vaker: dan kies jij wat je doet (varKeuze)
// Kans dat de VAR bij een kans alsnog een penalty geeft
export const VAR_PENALTY = .025;
export function varAan(M = S.M){
  if (!M) return false; if (M.inter) return true; if (M.o23) return false;
  if (M.beker && (M.beker.k === 'cl' || M.beker.k === 'eur')) return true;
  const t = club().t; return t >= 1 && t <= 2;
}
const varTel = (M, k) => { const L = M.varLog = M.varLog || {af:0, ok:0, pen:0}; L[k]++; };
// Wat deed de VAR deze wedstrijd? (voor het eindscherm)
export function varTekst(M){ const L = M.varLog; if (!L || !(L.af + L.ok + L.pen)) return null;
  const d = [L.af ? `${L.af} ${L.af === 1 ? 'goal' : 'goals'} afgekeurd` : '', L.ok ? `${L.ok} ${L.ok === 1 ? 'goal' : 'goals'} goedgekeurd na een check` : '', L.pen ? `${L.pen} ${L.pen === 1 ? 'penalty' : 'penalty\'s'} na beelden` : ''].filter(Boolean);
  return `📺 VAR deze wedstrijd: ${d.join(', ')}.`; }
const VAR_REDEN = ['buitenspel', 'een duwfout in de aanloop', 'hands', 'een overtreding op de keeper'];
export function varCheck(soort, M = S.M){ if (!varAan(M)) return null; const v = VAR[soort]; if (rnd() >= v.check) return null; return rnd() < v.af ? 'af' : 'ok'; }
function varTegen(M, zij, op){
  const v = varCheck('tegen'); if (!v) return null;
  if (v === 'ok'){ varTel(M, 'ok'); M.log.push({m:M.min + "'", t:`📺 VAR: de VAR bekijkt het doelpunt van ${zij}... ✅ De goal telt.`, k:'var'}); return null; }
  M.varAf = (M.varAf || 0) + 1; varTel(M, 'af');
  return {t:`📺 VAR: ${op} scoort voor ${zij}... maar na de beelden: ❌ afgekeurd voor ${pick(VAR_REDEN)}. ${stand2()}`, k:'var'};
}
// Plant de goals van teamgenoten/tegenstander en jouw momenten in
export function planWedstrijd(M, T, O, vast){
  if (M.focusStart === undefined){ if (pers('focusStart')) mod('focus', pers('focusStart')); M.focusStart = Math.round(S.sp.focus ?? 65); }
  const sp = S.sp, rol = M.rol;
  const lu = 1.3 * Math.pow(T / O, 3), lt = 1.3 * Math.pow(O / T, 3);
  // Zit je niet in het veld, dan staat de uitslag al vast (vast = {us, them}).
  // Speel je mee, dan komen jouw goals en assists uit je momenten. De rest van het spel weegt het sterkteverschil zwaarder mee,
  // zodat een zwakke ploeg niet alles wint omdat jij goed bent.
  const r4 = Math.pow(T / O, 4);
  const bgUs = vast ? vast.us : poisson(1.3 * r4 * BG.wij * (tmp.simBezig ? SIM_BG.wij : 1)), bgThem = vast ? vast.them : poisson(1.3 / r4 * BG.zij * (tmp.simBezig ? SIM_BG.zij : 1));
  // Wedstrijdverslag: kansen voor beide ploegen (hoe beter het team, hoe meer kansen), kaarten, rust en blessuretijd
  const kansUs = clamp(poisson(1.5 + lu * 2), 1, 7), kansThem = clamp(poisson(1.5 + lt * 2), 1, 7);
  for (let i = 0; i < kansUs; i++) M.ev.push({type:'kansUs', min:randInt(3, 89)});
  for (let i = 0; i < kansThem; i++) M.ev.push({type:'kansThem', min:randInt(3, 89)});
  for (let i = poisson(.7); i > 0; i--) M.ev.push({type:'geelUs', min:randInt(10, 89)});
  for (let i = poisson(.8); i > 0; i--) M.ev.push({type:'geelThem', min:randInt(10, 89)});
  if (M.derby){ const x = M.fel ? 1 : .6; for (let i = poisson(x); i > 0; i--) M.ev.push({type:'geelUs', min:randInt(10, 89)}); for (let i = poisson(x); i > 0; i--) M.ev.push({type:'geelThem', min:randInt(10, 89)}); }
  M.ev.push({type:'rust', min:45});
  M.ev.push({type:'extra', min:90});
  if (rol === 'bank' && sp.pos !== 'KEEPER'){ const w = randInt(60, 74); M.ev.push({type:'warm', min:w}); M.ev.push({type:'geenInval', min:randInt(Math.max(w + 8, 80), 88)}); }
  for (let i = 0; i < bgUs; i++) M.ev.push({type:'us', min:randInt(2, 90)});
  for (let i = 0; i < bgThem; i++) M.ev.push({type:'them', min:randInt(2, 90)}); // (als keeper wordt elk schot op het moment zelf jouw keuze: verderSpelen)
  let start = 1;
  if (rol === 'basis') staminaStart(M, 0);
  // Een keeper valt alleen in als de eerste keeper uitvalt (bij een interland: de wissel in de rust)
  if (rol === 'invaller' && sp.pos === 'KEEPER'){ const nood = M.inter ? 'rust' : pick(['blessure', 'rood']); start = nood === 'rust' ? 46 : randInt(10, 85); M.ev.push({type:'inval', min:start, nood}); }
  else if (rol === 'invaller'){ start = randInt(58, 72); M.ev.push({type:'warm', min:start - randInt(5, 9)}); M.ev.push({type:'inval', min:start}); }
  if (rol !== 'basis' && rol !== 'invaller') return sorteerEv(M);
  const n = sp.pos === 'KEEPER' ? (rol === 'basis' ? 2 + (rnd() < .4 ? 1 : 0) : 1) // (een keeper: de schoten van de tegenstander komen er nog bij)
    : rol === 'basis' ? 3 + (rnd() < .5 ? 1 : 0) + (rnd() < .25 ? 1 : 0) + (sp.pos === 'VERD' ? 1 : 0) : 1 + (rnd() < .6 ? 1 : 0);
  // Tegen een duidelijk sterkere ploeg heb je de bal minder: soms een moment minder
  const nn = n - (O - T >= 3 && n > 1 && rnd() < .6 ? 1 : 0);
  let extra = 0;
  if (telt(M) && !M.beker){
    const sel = selectie(S.sp.club), koel = sel.filter(x => band(x.n) < 30), maat = sel.filter(x => band(x.n) >= 80);
    if (koel.length && rnd() < .5){ M.ev.push({type:'genegeerd', min:randInt(start + 1, 89), naam:pick(koel).n}); extra = -1; }
    if (maat.length && rnd() < .4){ M.ev.push({type:'moment', min:randInt(start + 1, 89), m:'rand', via:pick(maat).n}); extra += 0; }
  }
  // Je jeugdvriend speelt mee: één van je momenten gaat over hem (hij staat vrij, of jullie combineren)
  // (als keeper: hij schiet op jouw doel)
  // (de momenten met je vriend passen bij jullie posities: is hij keeper, dan staat hij in het doel)
  const ikK = sp.pos === 'KEEPER', hijK = vriendPos() === 'KEEPER';
  if (speeltTegenVriend(M.opp) && !(ikK && hijK) && rnd() < .9){ M.ev.push(ikK ? {type:'moment', min:randInt(start + 1, 89), m:'eenOpEenKeeper', vriendSchiet:true} : {type:'moment', min:randInt(start + 1, 89), m:hijK ? 'vriendKeeperTegen' : 'vriendTegen'}); extra -= 1; }
  if (!ikK && vriendInTeam(M) && rnd() < (M.selectie ? .8 : .6)){ M.ev.push({type:'moment', min:randInt(start + 1, 89), m:hijK ? 'vriendKeeperUit' : 'vriendVrij'}); extra -= 1; }
  // tegen je rivaal: een gewoon moment minder, de duels met hem komen ervoor in de plaats
  for (let i = 0; i < Math.max(1, nn + extra - (M.rivaal ? 1 : 0)); i++) M.ev.push({type:'moment', min:randInt(start + 1, 89), m:kiesMomentType()});
  // Weerzien met je oude club: extra duels en je oude teamgenoten in het verslag
  if (M.reunie){ for (let i = 0; i < (M.reunieDuels || 0); i++) M.ev.push({type:'moment', min:randInt(start + 1, 89), m:pick(['provocatie', 'opstootje', 'tackle'])});
    if (M.reunieMaat) M.ev.push({type:'oudMaat', min:randInt(10, 80), naam:M.reunieMaat}); if (M.reunieVijand) M.ev.push({type:'oudVijand', min:randInt(10, 80), naam:M.reunieVijand}); }
  // Lage kalmte: je zoekt het gedoe sneller op
  { const ka = kalmte(); if (ka < 55 && rnd() < (55 - ka) / 35) M.ev.push({type:'moment', min:randInt(start + 1, 89), m:pick(['opstootje', 'provocatie'])}); }
  // Derby: er gaat altijd iemand op je lontje staan
  if (M.derby){ M.ev.push({type:'moment', min:randInt(start + 1, 89), m:pick(['opstootje', 'provocatie'])}); if (M.fel && rnd() < .6) M.ev.push({type:'moment', min:randInt(start + 1, 89), m:'opstootje'}); }
  // Tegen je rivaal: een extra duel met hem
  // (is je rivaal keeper, dan sta je tegenover hem in het doel; zijn jullie allebei keeper, dan geen duels in het veld)
  const rivK = M.rivaal && (rivaal() || {}).pos === 'KEEPER';
  if (M.rivaal && !(rivK && sp.pos === 'KEEPER')){ const R = rivaal(), lijst = rivK ? ['eenOpEen'] : RIVAAL_MOMENTEN[sp.pos] || RIVAAL_MOMENTEN.MID, n = 2 + (R && R.uitgedaagd ? 1 : 0);
    for (let i = 0; i < n; i++) M.ev.push({type:'moment', min:randInt(start + 1, 88), m:pick(lijst), rivaal:true});
    if (rnd() < .5) M.ev.push({type:'moment', min:randInt(start + 1, 88), m:'provocatie', rivaal:true, provo:true}); }
  sorteerEv(M);
}
// Volgorde binnen dezelfde minuut: warmlopen, invallen, de rest, en rust/blessuretijd als laatste
export const EV_VOLG = {warm:0, inval:1, rust:3, extra:3};
export function sorteerEv(M){ M.ev.sort((a, b) => a.min - b.min || (EV_VOLG[a.type] ?? 2) - (EV_VOLG[b.type] ?? 2)); }
// Kies een zin die in deze wedstrijd nog niet gebruikt is (pas als alles op is, mag het opnieuw)
export function uniek(M, sleutel, lijst){
  const g = (M.gebruikt = M.gebruikt || {})[sleutel] = (M.gebruikt[sleutel] || []).filter(i => i < lijst.length);
  let vrij = lijst.map((_, i) => i).filter(i => !g.includes(i));
  if (!vrij.length){ g.length = 0; vrij = lijst.map((_, i) => i); }
  const i = pick(vrij); g.push(i);
  return lijst[i];
}
// Tekst bij een gebeurtenis in de wedstrijd waar jij niet zelf aan de bal bent
export function verslag(e, M){
  const wij = M.wij ?? mijnNaam(), zij = M.zij ?? CLUBS[M.opp].n, P = ploeg(M), T = tegenPloeg(M);
  // Bij een doelpunt: de maker volgens wie vaak scoort, de aangever volgens wie vaak assists geeft
  const tmS = P ? (e.type === 'us' ? gewogen(P, 'g') : pick(inVeld(P))) : null, tm2S = P ? gewogen(P.filter(x => x !== tmS), 'a') : null;
  const tm = P ? tmS.n : pick(TEAMGENOTEN), tm2 = P ? tm2S.n : pick(TEAMGENOTEN.filter(n => n !== tm));
  const rivX = M.rivaal && e.type === 'them' && T ? T.find(x => x.rivaal && x.pos !== 'K') : null, hijScoort = !!(rivX && rnd() < .35); // (een keeper scoort niet)
  // je beste vriend (als hij in hun basis staat) scoort ook vaker tegen je
  const vrX = !hijScoort && e.type === 'them' && T && speeltTegenVriend(M.opp) ? T.find(x => x.vriend && x.pos !== 'K') : null, zijScoort = !!(vrX && rnd() < .3);
  const opS = T ? (hijScoort ? rivX : zijScoort ? vrX : e.type === 'them' ? gewogen(T, 'g') : pick(inVeld(T))) : null, op = T ? opS.n : pick(TEGENSTANDERS);
  const coach = M.inter ? 'De bondscoach' : 'De trainer', jijSpeelt = M.rol === 'basis' || (M.rol === 'invaller' && M.idx > M.ev.findIndex(x => x.type === 'inval'));
  switch (e.type){
    case 'us': { if (!e.varPen){ const va = varTegen(M, wij, tm); if (va) return va; } M.us++;
      if (M.inter && M.vriendMee && M.vriendMee.basis && vriendPos() !== 'KEEPER' && rnd() < .25){ M.vriendGoals = (M.vriendGoals || 0) + 1; return {t:`GOAL! ${vriendNaam()} kopt raak voor ${wij}! ${vr.Hij} rent meteen naar jou toe. ${stand2()}`, k:'goal'}; }
      const l = [
      `GOAL! ${tm} kopt een voorzet van ${tm2} binnen. ${stand2()}`,
      `GOAL! ${tm} schiet van afstand raak. ${stand2()}`,
      `GOAL! Na een mooie combinatie met ${tm2} schuift ${tm} de bal in de hoek. ${stand2()}`,
      `GOAL! ${tm} benut een strafschop. ${stand2()}`,
      `GOAL! Scrimmage voor het doel en ${tm} werkt de bal over de lijn. ${stand2()}`,
      `GOAL! ${tm2} legt breed en ${tm} tikt hem binnen. ${stand2()}`];
      const t = uniek(M, 'us', l), i = l.indexOf(t);
      doelOns(M, tmS, [0, 2, 5].includes(i) ? tm2S : null);
      return {t, k:'goal'}; }
    case 'them': { if (!e.varPen){ const va = varTegen(M, zij, op); if (va) return va; } M.them++; const T2 = T ? T.filter(x => x !== opS) : null, ag = T2 && rnd() < .6 ? gewogen(T2, 'a') : null;
      const l = [
      `Tegengoal. ${op} van ${zij} kopt raak${ag ? ` uit een voorzet van ${ag.n}` : ''}. ${stand2()}`,
      `Tegengoal. ${zij} countert snel en ${op} maakt het af${ag ? ` na een pass van ${ag.n}` : ''}. ${stand2()}`,
      `Tegengoal. Een afstandsschot van ${op} verdwijnt in de kruising. ${stand2()}`,
      `Tegengoal. Een vrije trap van ${op} gaat via de muur erin. ${stand2()}`,
      `Tegengoal. ${op} krijgt te veel ruimte en schiet raak. ${stand2()}`];
      const t = hijScoort ? `Tegengoal. Daar is ${team.hij}: je rivaal ${rivaalNaam()} scoort en juicht recht voor je neus. ${stand2()}` : zijScoort ? `Tegengoal. Uitgerekend ${vriendNaam()}! ${vr.Hij} schiet hem binnen en kijkt meteen jouw kant op. ${vr.Hij} juicht niet. ${stand2()}` : uniek(M, 'them', l), i = hijScoort || zijScoort ? 1 : l.indexOf(t);
      if (hijScoort){ M.rivGoals = (M.rivGoals || 0) + 1; M.tegenScoorde = {wie:'rivaal'}; } else if (zijScoort){ M.vriendGoalsTegen = (M.vriendGoalsTegen || 0) + 1; M.tegenScoorde = {wie:'vriend'}; }
      doelHun(M, opS, i <= 1 ? ag : null);
      return {t, k:'tegen'}; }
    case 'kansUs':
      // Soms ziet de VAR nog een overtreding in het strafschopgebied: alsnog een penalty
      if (varAan(M) && rnd() < VAR_PENALTY){ varTel(M, 'pen');
        const jij = jijSpeelt && !M.rood && M.gewisseld === undefined && S.sp.pos !== 'KEEPER'; // (een keeper neemt de penalty niet)
        if (jij) M.ev.splice(M.idx, 0, {type:'moment', min:e.min, m:'penalty', varPen:true});
        else if (rnd() < .75) M.ev.splice(M.idx, 0, {type:'us', min:e.min, varPen:true});
        return {t:`📺 VAR: na de beelden krijgt ${wij} alsnog een penalty! ${tm} werd in het strafschopgebied onderuitgehaald.${jij ? ' Jij pakt de bal.' : ''}`, k:'var'};
      }
      return {t:uniek(M, 'kansUs', [
      `Kans voor ${wij}! ${tm} schiet net naast.`,
      `${tm} raakt de paal! Zo dichtbij.`,
      `Kopbal van ${tm}, maar de keeper tikt hem over de lat.`,
      `Mooie aanval via ${tm2}, maar ${tm} schiet over.`,
      `Vrije trap van ${tm}. De keeper van ${zij} heeft hem.`,
      `Corner voor ${wij}. ${tm} kopt net over.`,
      `${tm} gaat alleen op de keeper af... en die redt fantastisch.`,
      `${tm} krult de bal richting de verre hoek, maar hij gaat er net langs.`,
      `Een verdediger van ${zij} haalt de bal nog net van de lijn na een schot van ${tm}.`,
      `${tm2} geeft een prachtige voorzet, maar niemand komt erbij.`,
      `${tm} probeert het van afstand. De bal zeilt over de lat.`,
      `De scheidsrechter fluit voor buitenspel. Het doelpunt van ${tm} telt niet.`]), k:''};
    case 'kansThem':
      // je vriend staat in het doel van jouw nationale ploeg: soms redt hij knap
      if (M.inter && M.vriendMee && M.vriendMee.basis && vriendPos() === 'KEEPER' && rnd() < .35) return {t:`${vriendNaam()} redt knap op een schot van ${zij}. ${vr.Hij} steekt ${vr.zijn} duim naar je op.`, k:'info'};
      // Ook de tegenstander kan via de VAR alsnog een penalty krijgen
      if (varAan(M) && rnd() < VAR_PENALTY){ varTel(M, 'pen');
        if (rnd() < .75) M.ev.splice(M.idx, 0, {type:'them', min:e.min, varPen:true});
        return {t:`📺 VAR: na de beelden krijgt ${zij} alsnog een penalty. ${op} werd in het strafschopgebied geraakt.`, k:'var'};
      }
      return {t:uniek(M, 'kansThem', [
      `${op} van ${zij} schiet op de paal. Pfoe!`,
      `Jullie keeper redt knap op een schot van ${op}.`,
      `Kopbal van ${op} gaat net over. Gevaarlijk.`,
      `${zij} komt gevaarlijk opzetten, maar ${tm} grijpt op tijd in.`,
      `${op} staat helemaal vrij, maar schiet hem over.`,
      `Een vrije trap van ${zij} zeilt net langs de paal.`,
      `${op} schiet hard in de korte hoek. Jullie keeper tikt hem met de vingertoppen weg.`,
      `${tm} haalt een schot van ${op} van de lijn!`,
      `${op} valt in de zestien, maar de scheidsrechter wuift het weg. Geen penalty.`,
      `${zij} zet druk. De bal stuitert door jullie zestien, maar niemand van ${zij} komt erbij.`,
      `Een doelpunt van ${op} wordt afgekeurd wegens buitenspel. Opluchting!`]), k:'gevaar'};
    case 'geelUs': return {t:uniek(M, 'geelUs', [`Gele kaart voor ${tm} na een harde overtreding.`, `${tm} protesteert te fel en krijgt geel.`, `Gele kaart voor ${tm}: ${team.hij} trekt ${op} aan ${team.zijn} shirt.`]), k:'kaart'};
    case 'geelThem': return {t:uniek(M, 'geelThem', [`Gele kaart voor ${op} van ${zij}.`, `${op} van ${zij} schopt ${tm} onderuit. Geel.`, `${op} van ${zij} krijgt geel wegens tijdrekken.`]), k:'kaart'};
    case 'oudMaat': return {t:pick([`Je oude maatje ${e.naam} probeert je af te stoppen. Jullie grijnzen allebei.`, `${e.naam} zet je stevig onder druk en geeft je daarna een knipoog. Net als vroeger op de training.`]), k:'info'};
    case 'oudVijand': return {t:pick([`${e.naam}, met wie je nooit door één deur kon, schopt je net iets te hard. "Welkom terug," sist ${team.hij}.`, `${e.naam} blijft de hele tijd tegen je praten. ${team.Hij} wil je gek maken.`]), k:'gevaar'};
    case 'genegeerd': return {t:`${e.naam} ziet je vrijstaan, maar speelt de bal niet naar jou. ${team.Hij} schiet zelf, ver over. Jullie kunnen het niet zo goed met elkaar vinden.`, k:'mis'};
    case 'rust': return {t:`Rust. Stand: ${stand2()}.${jijSpeelt ? '' : M.rol === 'invaller' || M.rol === 'bank' ? ` ${coach} zegt dat je klaar moet zitten.` : ''}`, k:'rust'};
    case 'warm': return {t:`${coach} zegt dat je moet gaan warmlopen. Je trekt je trainingsjack uit.`, k:'info'};
    case 'geenInval': return {t:`${coach} kiest voor een andere wissel. Je gaat weer zitten.`, k:'info'};
    case 'extra': return {t:`Er komen ${randInt(2, 6)} minuten bij.`, k:'info'};
  }
  return null;
}
// Slechte cijfers en geen huiswerk gemaakt? Bij een profclub houden je ouders je niet thuis, maar de onderwijscoach van de club
// volgt je rapport en vertelt het de trainer (vertrouwen −3). Geeft de regel voor het wedstrijdverslag
export function onderwijsCoach(){
  const sp = S.sp; if (!(sp.leeftijd < 18 && sp.ouders && sp.ouders.boos && !(S.week && S.week.huiswerk))) return null;
  mod('vert', -3);
  return {m:'', t:`De onderwijscoach van ${club().n} heeft de trainer verteld over je slechte cijfers. Dat kost je wat vertrouwen.`, k:'gevaar'};
}
// Een keeper valt niet zomaar in: als reserve zit je op de bank, tenzij de eerste keeper uitvalt (blessure of rood)
// Ben je minstens zo goed als de eerste keeper, dan kiest de trainer voor jou
export function keeperRol(rol){
  const sp = S.sp; if (sp.pos !== 'KEEPER' || rol !== 'invaller') return rol;
  const k1 = !sp.clubloos && sp.club != null ? selectie(sp.club).filter(y => y.pos === 'K' && !(y.bles > 0)).sort((a, b) => b.k - a.k)[0] : null;
  if (k1 && ovr(sp) >= k1.k - 1){ S.keeperKeus = true; return 'basis'; }
  return rnd() < .07 ? 'invaller' : 'bank';
}
export function startWedstrijd(){
  S.krantWacht = [];
  if (!fixture(S.ronde)) return rustWeek();
  if (!(S.sp.geschorst > 0) && S.sp.o23 && S.sp.blessure <= 0 && S.sp.fit >= 20) return startO23();
  const sp = S.sp, c = club(), fx = fixture(S.ronde), opp = CLUBS[fx.opp];
  let rol, reden = '';
  if (sp.blessure > 0) rol = 'blessure';
  else if (sp.geschorst > 0) rol = 'geschorst';
  else if (sp.fit < 20) rol = 'rust';
  else {
    const sc = opstellingScore() + randInt(-6, 6);
    if (sc >= 50) rol = 'basis';
    else if (sc >= 12) rol = (sc < 30 && rnd() < .25) ? 'bank' : 'invaller';
    else rol = 'tribune';
    if (rol !== 'basis') reden = ' ' + opstellingReden();
    // Je vroeg de trainer om op de bank te beginnen en hij ging akkoord
    const bank = S.week && S.week.bank;
    if (bank === 'inval' && (rol === 'basis' || rol === 'invaller')){ rol = 'invaller'; reden = ' Op je eigen verzoek begin je op de bank om je fitheid te sparen.'; }
    else if (bank === 'rust' && (rol === 'basis' || rol === 'invaller')){ rol = 'bank'; reden = ' Op je eigen verzoek zit je deze wedstrijd op de bank om uit te rusten.'; }
    S.keeperKeus = false; rol = keeperRol(rol); // (een reservekeeper zit op de bank)
    if (S.keeperKeus) reden = ''; 
  }

  const T = teamKracht(c.s, {speelt:rol === 'basis' || rol === 'invaller', thuis:fx.thuis, tactiek:matchup(clubTactiek(sp.club), clubTactiek(fx.opp))});
  const O = opp.s + (fx.thuis ? 0 : 2) + vormBonus(fx.opp);
  const M = {opp:fx.opp, oppS:opp.s, wij:c.n, zij:opp.n, thuis:fx.thuis, rol, us:0, them:0, min:0, ev:[], idx:0, log:[], cijfer:sp.pos === 'VERD' || sp.pos === 'KEEPER' ? 6.3 : 6.0, goals:0, assists:0, geel:false, rood:false, pending:null, klaar:false, derby:isDerby(fx.opp), fel:!!S.ss.rivaalFel};
  S.M = M;
  { const r = onderwijsCoach(); if (r) M.log.push(r); }
  if (speeltTegenRivaal(fx.opp)) M.rivaal = true; // ook als je zelf niet speelt
  const derbyRegel = M.derby ? {m:'', t:`DERBY tegen aartsrivaal ${opp.n}! Het stadion kookt, overal vuurwerk en spandoeken.${M.fel ? ' Na de woorden in de krant is de sfeer extra vijandig.' : ''}`, k:'info'} : null;

  if (rol === 'blessure' || rol === 'rust' || rol === 'tribune' || rol === 'bank' || rol === 'ouders' || rol === 'geschorst'){
    const [a, b] = simGoals(T, O, false);
    M.log.push({m:'', t: rol === 'geschorst' ? `Je bent geschorst${sp.geschorst > 1 ? ` (nog ${sp.geschorst} wedstrijden)` : ''}. Je kijkt vanaf de tribune hoe je ploeg het zonder jou doet.` : rol === 'ouders' ? 'Je ouders houden je thuis: "Eerst je cijfers ophalen, dan mag je weer voetballen."' : rol === 'blessure' ? (sp.verlof ? 'Je bent met zwangerschapsverlof. Je ploeg speelt zonder jou.' : 'Je zit geblesseerd op de tribune.') : rol === 'rust' ? 'Je bent compleet kapot. De trainer laat je rusten.' : rol === 'bank' ? 'Je zit de hele wedstrijd op de bank. De trainer brengt je niet in.' + reden : 'De trainer laat je buiten de selectie. Je kijkt vanaf de tribune.' + reden, k:'mis'});
    M.log.push({m:"1'", t:`Aftrap! ${rol === 'bank' ? (sp.pos === 'KEEPER' ? 'Je zit op de bank als reservekeeper.' : 'Je zit op de bank.') : rol === 'ouders' ? 'Je volgt de wedstrijd thuis via de livestream.' : 'Je kijkt vanaf de tribune.'}`, k:''});
    if (derbyRegel) M.log.push(derbyRegel);
    if (M.rivaal) M.log.push({m:"1'", t:`Je rivaal ${rivaalNaam()} staat in de basis bij ${opp.n}. Jij ${rol === 'bank' ? 'zit op de bank en ziet ' + team.hem + ' warmlopen' : 'kijkt toe'}. Dat doet pijn.`, k:'info'});
    if (reunieMet(M.opp)) M.reunie = {club:M.opp, type:reunieMet(M.opp).type, ontvangst:ontvangst(M.opp)};
    planWedstrijd(M, T, O, {us:a, them:b});
    S.fase = 'match';
    return verderSpelen();
  }
  if (derbyRegel) M.log.push(derbyRegel);
  reunieAftrap(M);
  fansVoorAftrap(M);
  if (M.rivaal){ M.log.push({m:"1'", t:`Je rivaal ${rivaalNaam()} staat in de basis bij ${opp.n}. Bij de opkomst kijkt ${team.hij} je strak aan. Vandaag laat je zien wie de beste is.`, k:'info'});
    const R = rivaal();
    if (R.persReactie){ M.log.push({m:"1'", t:R.persReactie, k:'info'}); R.persReactie = null; }
    if (R.voorbereid){ M.rivaalBonus = .08; M.log.push({m:"1'", t:`Je hebt ${team.zijn} wedstrijden geanalyseerd. Je weet precies wat ${team.hij} gaat doen (focus +${focusBoost(8)}).`, k:'info'}); }
    if (R.uitgedaagd) M.log.push({m:"1'", t:'Na jouw woorden in de krant zijn alle ogen op jullie gericht. Dit duel telt dubbel.', k:'info'}); }
  planWedstrijd(M, T, O);
  M.log.push({m:"1'", t:`Aftrap! ${rol === 'basis' ? (sp.statusNiveau >= AANV ? 'Met de aanvoerdersband om je arm leid je het team het veld op.' : statusNiveau() <= 1 ? 'De trainer geeft je als bankspeler een kans in de basis. Grijp hem!' : 'Je staat in de basis.') : 'Je begint op de bank.' + reden}`, k:''});
  S.fase = 'match';
  verderSpelen();
}
export const mijnNaam = () => club().n;
// Wie gaat eruit als jij invalt? Wie in de intro jouw plek innam: de sterkste wissel op jouw linie (bij de O23, selectiedagen en interlands: een teamgenoot)
function wisselUit(M){
  if (!telt(M)) return {naam:null};
  const linie = {SPITS:'A', MID:'M', VERD:'V', KEEPER:'K'}[S.sp.pos], x = selectie(S.sp.club).filter(y => !y.basis && !(y.bles > 0) && y.pos === linie).sort((a, b) => b.k - a.k)[0];
  let ik = null; try { ik = rugnummer(); } catch (e){}
  return x ? {naam:metVoorletter(x), nr:x.nr, ik} : {naam:null};
}
export function aftrap(){ if (S.M && S.M.intro) verderSpelen(); }
// Simuleren: je speler kiest zelf, zoals een gewone speler (niet altijd de beste optie: vaker een goede, soms een mindere of een gok).
// VAR: rustig afwachten. Alles telt verder net als bij zelf spelen. gewoon = false: steeds de optie met de meeste kans (voor tests)
const SIM_KEUS = .5; // (hoe sterk een gesimuleerde speler de kansrijkste optie verkiest: laag = vaker een gewone of mindere keuze)
export function simuleer(gewoon = true){
  const M = S.M; if (!M || S.fase !== 'match') return;
  M.gesimuleerd = true;
  for (let n = 0; n < 500 && S.fase === 'match' && S.M === M; n++){
    if (M.intro){ aftrap(); continue; }
    if (M.varKeuze){ varKeuze(0); continue; }
    if (M.pending){
      const opts = pOpts(M.pending), score = o => kans(o) - (o.kaart ? .02 : 0) + (o.toon === 'bal' ? .01 : 0);
      let best = 0; opts.forEach((o, i) => { if (score(o) > score(opts[best])) best = i; });
      if (gewoon){ const w = opts.map(o => Math.max(.01, score(o)) ** SIM_KEUS), som = w.reduce((a, b) => a + b, 0); let r = rnd() * som; best = w.findIndex(x => (r -= x) <= 0); if (best < 0) best = 0; }
      kies(best); continue;
    }
    verderSpelen();
  }
}
// Na afloop een moment met je vriend, als je tegen hem speelde (ook vanaf de bank)
export const metVriendNa = M => { if (M && !M.vriendNa && vriendBijTegenstander(M.opp)) M.vriendNa = {keuze:null, bank:!speeltTegenVriend(M.opp)}; return M && M.vriendNa; };
// Sta jij op dit moment in het veld?
const jijInVeld = M => !M.rood && M.gewisseld === undefined && (M.rol === 'basis' || (M.rol === 'invaller' && M.idx > M.ev.findIndex(x => x.type === 'inval')));
export function stand2(){ const M = S.M; return M.thuis ? `${M.us}-${M.them}` : `${M.them}-${M.us}`; }

// Elke wedstrijd begint met een intro (de opstellingen, jouw rol): de eerste keer stopt verderSpelen daar, "Aftrap!" speelt verder.
// (Een wedstrijd die in een oude opslag al bezig was, krijgt geen intro)
export function verderSpelen(){
  const M = S.M;
  if (M.intro === undefined && !(M.idx > 0)){ M.intro = true; return; }
  if (M.intro) M.intro = false;
  if (M.varKeuze) return varKeuze(0);
  while (M.idx < M.ev.length){
    const e = M.ev[M.idx++]; M.min = e.min; wisselCheck(M);
    // Keeper in het veld: elke goal van de tegenstander (en een deel van hun grote kansen) wordt een moment waarin jij kiest
    if (S.sp.pos === 'KEEPER' && !e.omgezet && (e.type === 'them' || e.type === 'kansThem') && jijInVeld(M) && (e.type === 'them' || rnd() < .4)){
      const zeker = e.type === 'them';
      Object.assign(e, {omgezet:true, type:'moment', m:e.varPen ? 'penaltyKeeper' : pick(['redding', 'redding', 'eenOpEenKeeper', 'hogeBal']), zeker, kans:!zeker});
    }
    // Een ruime voorsprong: jullie halen de voet van het gas, de tegenstander gooit alles op de verdediging
    if (e.type === 'us' && !e.varPen){ const vs = M.us - M.them; if (vs >= 3 && rnd() < (vs >= 5 ? .7 : .45)){ e.type = 'kansUs';
      if (!M.gasEraf){ M.gasEraf = true; M.log.push({m:e.min + "'", t:'Met deze voorsprong haalt jullie ploeg de voet van het gas. De tegenstander gooit alles op de verdediging.', k:'info'}); } } }
    if (e.type !== 'inval' && e.type !== 'moment'){ const v = verslag(e, M); if (v){ M.log.push({m:e.min + "'", t:v.t, k:v.k}); animAnderen(M, e, v); }
      if (e.type === 'rust' && M.rol === 'basis' && !M.rood && M.gewisseld === undefined && M.us < M.them && !M.inter && isAanvoerder()){ M.pending = bouwMoment('toespraak'); return; }
      // je rivaal of je vriend scoorde: in het veld reageer je meteen, vanaf de bank wil je erin (revanche als je invalt)
      if (M.tegenScoorde && e.type === 'them'){ const w = M.tegenScoorde.wie; M.tegenScoorde = null;
        if (jijInVeld(M)){ M.pending = bouwMoment(w === 'rivaal' ? 'rivaalScoort' : 'vriendScoort'); return; }
        if (!M.rood && M.gewisseld === undefined){ M.revanche = Math.min(.08, (M.revanche || 0) + .03); M.log.push({m:e.min + "'", t:w === 'rivaal' ? `Vanaf de bank zie je ${rivaalNaam()} juichen. Je springt op: je wilt erin.` : `Vanaf de bank zie je ${vriendNaam()} scoren. Je weet niet of je moet klappen of balen.`, k:'info'}); } } }
    else if (e.type === 'inval' && e.nood){ staminaStart(M, e.min); // de eerste keeper valt uit
      const k1 = telt(M) ? selectie(S.sp.club).find(y => y.basis && y.pos === 'K') : null, kn = k1 ? metVoorletter(k1) : 'de eerste keeper';
      M.log.push({m:e.min + "'", t:e.nood === 'rust' ? `In de rust wisselt de bondscoach van keeper. Jij gaat erin!` : e.nood === 'blessure' ? `Jullie keeper ${kn} grijpt naar ${team.zijn} hamstring en kan niet verder. Jij moet erin!` : `ROOD voor jullie keeper ${kn}! ${team.Hij} haalt hun spits neer. Jij moet erin, en het is ook nog penalty.`, k:'ok'});
      animPush(M, {soort:'wissel', type:'wissel', bord:'Keeperswissel', onder:`${e.min}' · Jij komt erin voor ${kn}`});
      if (e.nood === 'rood'){ M.tienMan = true; M.log.push({m:e.min + "'", t:'Jullie moeten met tien man verder.', k:'info'}); M.ev.splice(M.idx, 0, {type:'moment', min:e.min, m:'penaltyKeeper'});
        if (e.min < 85 && rnd() < .3){ const x = {type:'them', min:randInt(e.min + 2, 89)}; let j = M.idx + 1; while (j < M.ev.length && M.ev[j].min <= x.min) j++; M.ev.splice(j, 0, x); } } }
    else if (e.type === 'inval'){ staminaStart(M, e.min); const w = wisselUit(M);
      M.log.push({m:e.min + "'", t:`${M.inter ? 'De bondscoach' : 'De trainer'} roept je. Je mag erin${w.naam ? `, voor ${w.naam}` : ''}!`, k:'ok'});
      animPush(M, {soort:'wissel', type:'wissel', bord:w.nr && w.ik ? `#${w.nr} eruit · #${w.ik} erin` : 'Wissel!', onder:`${e.min}' · Wissel: jij komt erin${w.naam ? ` voor ${w.naam}` : ''}`}); }
    else if (e.type === 'moment'){
      if (M.rood || M.gewisseld !== undefined) continue;
      const type = (!e.varPen && !e.rivaal && !e.zeker && S.sp.pos !== 'KEEPER' && e.min >= 84 && M.us <= M.them && rnd() < .6) ? 'laatsteMinuut' : e.m;
      M.pending = bouwMoment(type); if (e.zeker) M.pending.zeker = true; if (e.kans) M.pending.kans = true;
      if (e.vriendSchiet) M.pending.tekst = `Daar komt je beste ${vr.vriend} ${vriendNaam()}! ${vr.Hij} is alleen door en kijkt je recht aan. Jullie hebben dit duizend keer gedaan op het pleintje. Nu is het echt.`;
      if (e.rivaal && type !== 'laatsteMinuut') M.pending.rivaal = true;
      if (e.rivaal && type !== 'laatsteMinuut') M.pending.tekst = rivaalVoorzet(M, e) + ' ' + M.pending.tekst;
      if (e.via && type !== 'laatsteMinuut') M.pending.tekst = `${e.via} zoekt je op met een perfecte pass. Jullie zijn maatjes en weten elkaar blind te vinden. ` + M.pending.tekst;
      return;
    }
  }
  M.log.push({m:"90'", t:`Laatste fluitsignaal. Eindstand ${stand2()}.`, k:'rust'});
  eindeWedstrijd();
}

export function kies(i){
  const M = S.M, opt = pOpts(M.pending)[i];
  const ok = rnd() < kans(opt);
  let out = (ok ? opt.ok : opt.mis)();
  if (out.vriend) zetVriendBand(out.vriend);
  if (opt.toon && !M.gesimuleerd) toonMeter(opt.toon); // je karakter: rustig of heethoofd (niet bij een gesimuleerde wedstrijd)
  if (out.vriendGoal) M.vriendGoals = (M.vriendGoals || 0) + 1;
  // Tegen een veel sterkere ploeg haalt hun keeper soms ook een goede kans van jou eruit
  // VAR bij jouw goal
  if (out.goal && !M.o23 && !M.inter){ const gat = (M.oppS ?? CLUBS[M.opp].s) - club().s;
    if (gat > 2 && rnd() < Math.min(KEEPER_MAX, (gat - 2) * .05)) out = {...out, goal:false, t:`${out.t.replace(/[.!]*$/, '')}... maar de keeper van ${M.zij} haalt hem er met een wereldredding uit!`, d:Math.max(.1, (out.d || 0) - .4)}; }
  // VAR bij jouw goal: de bal ligt erin, maar de scheids gaat kijken. Jij kiest wat je doet (varKeuze)
  const ruwGoal = !!out.goal, varWacht = out.goal ? varCheck('jij') : null;
  if (varWacht) out = {...out, goal:false};
  if (MOMENTS[M.pending.type] && MOMENTS[M.pending.type].keeper){ // keeper: een redding of een tegengoal, of een uittrap vanaf je doellijn
    const pt = M.pending.type, schot = pt !== 'uittrap' && pt !== 'terugspeel';
    if (out.redding){ S.ss.red = (S.ss.red || 0) + 1; S.car.red = (S.car.red || 0) + 1; M.reddingen = (M.reddingen || 0) + 1; }
    if (schot) animPush(M, {type:out.tegen ? 'tegenGoal' : 'tegenKans', soort:out.tegen ? 'tegenGoal' : 'tegenKans', variant:pt === 'hogeBal' ? 'kop' : pt === 'penaltyKeeper' ? 'pen' : 'combi', einde:out.tegen ? null : 'redding', jijKeeper:true, ok, geel:!!out.geel});
    else animPush(M, {type:'opbouw', label:opt.l, soort:/Lange|Ver weg|uitgooien|tribune/.test(opt.l) ? 'lang' : 'kort', variant:'normaal', ok, keeperUit:true, tegen:!!out.tegen, assist:!!out.assist, geel:!!out.geel});
  } else { const soort = opt.anim ? opt.anim[0] : animSoort(M.pending.type, opt.l); if (soort) animPush(M, {type:M.pending.type, label:opt.l, soort, variant:opt.anim ? opt.anim[1] : animVariant(M.pending.type, opt.l), ok, goal:ruwGoal, assist:!!out.assist, team:!!out.teamGoal, tegen:!!out.tegen, geel:!!out.geel, rood:!!out.rood}); }
  gebruik(M, opt);
  const keeperM = MOMENTS[M.pending.type] && MOMENTS[M.pending.type].keeper; // (een keeper heeft veel momenten: niet elke redding geeft focus, anders zit hij altijd in de flow)
  const fVoor = S.sp.focus ?? 65; if (ok){ if (!keeperM || rnd() < .35) focusBoost(1); } else mod('focus', -1 * pers('focusMis'));
  const m = M.min + "'";
  M.log.push({m, t:`[${opt.l}] ${out.t}`, k: ok ? 'ok' : 'mis'});
  if (fVoor < FLOW && S.sp.focus >= FLOW) M.log.push({m, t:'Alles lukt! Je zit helemaal in de flow.', k:'info'});
  if (fVoor >= SLECHTE_FOCUS && S.sp.focus < SLECHTE_FOCUS) M.log.push({m, t:'Je hoofd zit vol. Je raakt je concentratie kwijt.', k:'info'});
  M.cijfer += (out.d || 0) * (M.rol === 'invaller' ? 1.5 : 1); // invallers moeten het in weinig minuten laten zien
  const P = ploeg(M), T = tegenPloeg(M);
  if (out.goal){ M.us++; M.goals++; M.log.push({m, t:`GOAL! ${S.sp.naam} scoort! ${stand2()}`, k:'goal'}); if (M.rivaal) M.log.push({m, t:uniek(M, 'rivJuich', [`Je rent juichend langs ${rivaalNaam()}. ${team.Hij} kijkt de andere kant op.`, `Je wijst naar je rugnummer, recht voor de neus van ${rivaalNaam()}.`, `${rivaalNaam()} schopt boos tegen het gras. Jij juicht.`]), k:'info'}); doelOns(M, 'JIJ', P && rnd() < .5 ? gewogen(P, 'a') : null);
    // revanche: jij antwoordt op de goal van je rivaal of je vriend
    if ((M.rivGoals || M.vriendGoalsTegen) && !M.revancheGezien){ M.revancheGezien = true; const wie = M.rivGoals ? rivaalNaam() : vriendNaam(); M.log.push({m, t:`Revanche! Je antwoordt op de goal van ${wie}.`, k:'info'}); if (M.rivGoals) krantMelding(`${S.sp.naam} antwoordt op goal van rivaal ${wie}`, 'Eerst scoorde ' + ik.zijn + ' rivaal, maar het laatste woord was aan hem.'); } }
  if (out.assist){ M.us++; M.assists++; M.log.push({m, t:`GOAL! Assist van ${S.sp.naam}. ${stand2()}`, k:'goal'}); doelOns(M, out.gekkeGoal ? null : out.scorer || (P ? gewogen(P, 'g') : null), 'JIJ'); if (out.gekkeGoal && telt(M) && !M.beker){ const kg = S.ss.kg = S.ss.kg || {}; kg[S.sp.club] = (kg[S.sp.club] || 0) + 1; } }
  if (out.teamGoal){ M.us++; const sx = P ? gewogen(P, 'g') : null; M.log.push({m, t:`GOAL!${sx ? ` ${sx.n} scoort.` : ''} ${stand2()}`, k:'goal'}); doelOns(M, sx, null); }
  if (out.tegen){ M.them++; const sx = T ? gewogen(T, 'g') : null; M.log.push({m, t:`Tegengoal${sx ? ` van ${sx.n}` : ''}. ${stand2()}`, k:'tegen'}); doelHun(M, sx, null); }
  if ((out.rood && !M.rood) || (out.geel && M.geel && !M.rood)) onrust(6, 'Rode kaart');
  if (out.rood && !M.rood){ M.rood = true; M.roodSoort = 'direct'; M.cijfer -= 1; M.log.push({m, t:'Rode kaart. Je moet van het veld.', k:'kaart'}); }
  else if (out.geel){
    if (M.geel){ M.rood = true; M.roodSoort = 'tweedeGeel'; M.cijfer -= 1.5; M.log.push({m, t:'Tweede gele kaart... ROOD! Je moet eraf.', k:'kaart'}); }
    else { M.geel = true; M.log.push({m, t:'Gele kaart voor jou.', k:'kaart'}); }
  }
  if (M.rood && !M.tienMan){
    // Met tien man wordt het lastig: soms valt er daardoor een extra tegengoal
    M.tienMan = true;
    M.log.push({m, t:'Jullie moeten met tien man verder. Je teamgenoten kijken je boos aan.', k:'info'});
    if (M.min < 88 && rnd() < .4){ const e = {type:'them', min:randInt(M.min + 1, 89)}; let j = M.idx; while (j < M.ev.length && M.ev[j].min <= e.min) j++; M.ev.splice(j, 0, e); }
  }
  if (out.extraUs){ const e = {type:'us', min:randInt(Math.max(M.min + 3, 50), 88)}; let j = M.idx; while (j < M.ev.length && M.ev[j].min <= e.min) j++; M.ev.splice(j, 0, e); }
  if (out.minderThem){ const j = M.ev.findIndex((x, i) => i >= M.idx && x.type === 'them'); if (j >= 0) M.ev.splice(j, 1); }
  if (out.ruzie && telt(M)) iedereen(-3);
  if (out.juich){ M.juich = out.juich; if (M.reunie){ modFans(out.oudFans || 0, M.reunie.club); modFans(out.nieuwFans || 0); } }
  M.pending = null;
  if (varWacht && !M.rood){ M.log.push({m, t:'📺 VAR-check! De scheidsrechter legt zijn hand bij zijn oor en loopt naar het scherm...', k:'var'}); M.varKeuze = {uitslag:varWacht, m}; return; }
  if (out.goal && M.reunie && !M.juichGekozen && !M.rood){ M.juichGekozen = true; M.pending = bouwMoment('juichen'); return; }
  if (out.next && !M.rood && M.us - M.them < 4){ // (bij een ruime voorsprong geen extra scoremoment meer)
    // Vervolgactie in dezelfde aanval: zelfde minuut, zodat het verslag op volgorde blijft
    M.pending = bouwMoment(out.next);
    return;
  }
  verderSpelen();
}

// Wat doe je terwijl de VAR naar jouw goal kijkt?
export const VAR_KEUZES = [
  {l:'Rustig afwachten', s:'Geen risico. Wordt hij afgekeurd, dan baal je even (moraal −2)'},
  {l:'Protesteren bij de scheids', s:'Kans op geel (heb je al geel, dan rood!)'},
  {l:'Alvast juichen', s:'Telt hij: cijfer +0,2 en de fans gaan los. Afgekeurd: je staat voor gek (moraal −4)'},
];
export function varKeuze(i){
  const M = S.M, V = M && M.varKeuze; if (!V) return;
  M.varKeuze = null; const m = V.m, P = ploeg(M);
  if (i === 1){
    if (rnd() < .3){
      if (M.geel){ M.rood = true; M.roodSoort = 'tweedeGeel'; M.cijfer -= 1.5; onrust(6, 'Rode kaart'); M.log.push({m, t:'Je blijft maar protesteren... tweede gele kaart. ROOD!', k:'kaart'}); }
      else { M.geel = true; M.log.push({m, t:'Je protesteert te fel bij de scheids. Gele kaart.', k:'kaart'}); }
    } else M.log.push({m, t:'Je loopt naar de scheids en wijst naar het scherm. Hij gebaart dat je weg moet gaan.', k:''});
  }
  if (i === 2) M.log.push({m, t:'Je rent al juichend naar de hoekvlag...', k:''});
  if (V.uitslag === 'ok'){
    varTel(M, 'ok'); M.log.push({m, t:'📺 VAR: ✅ De goal telt!', k:'var'});
    M.us++; M.goals++; M.log.push({m, t:`GOAL! ${S.sp.naam} scoort! ${stand2()}`, k:'goal'}); doelOns(M, 'JIJ', P && rnd() < .5 ? gewogen(P, 'a') : null);
    if (M.rivaal) M.log.push({m, t:`Je rent juichend langs ${rivaalNaam()}. ${team.Hij} kijkt de andere kant op.`, k:'info'});
    if (i === 2){ M.cijfer += .2; modFans(2); M.log.push({m, t:'Je wist het zeker! Het publiek gaat helemaal los.', k:'info'}); }
  } else {
    varTel(M, 'af'); M.varAf = (M.varAf || 0) + 1; M.cijfer -= .5;
    M.log.push({m, t:`📺 VAR: ❌ Afgekeurd voor ${pick(VAR_REDEN)}. ${stand2()}`, k:'var'});
    if (i === 0) mod('moraal', -2);
    if (i === 2){ mod('moraal', -4); M.cijfer -= .2; M.log.push({m, t:'De beelden van jouw juichen gaan viral. Niet om de goede reden.', k:'info'}); }
  }
  if (M.rood && !M.tienMan){ M.tienMan = true; M.log.push({m, t:'Jullie moeten met tien man verder. Je teamgenoten kijken je boos aan.', k:'info'}); }
  if (V.uitslag === 'ok' && M.reunie && !M.juichGekozen && !M.rood){ M.juichGekozen = true; M.pending = bouwMoment('juichen'); return; }
  verderSpelen();
}
// Gele en rode kaarten in de competitie: 5 keer geel = 1 wedstrijd schorsing, twee keer geel = 1, direct rood = 2
export function kaartenVerwerken(M){
  const sp = S.sp, ss = S.ss;
  ss.geel = ss.geel || 0; ss.rood = ss.rood || 0; ss.geelTeller = ss.geelTeller || 0;
  S.car.geel = S.car.geel || 0; S.car.rood = S.car.rood || 0;
  if (M.rood){
    ss.rood++; S.car.rood++;
    const n = M.roodSoort === 'direct' ? 2 : 1;
    sp.geschorst = (sp.geschorst || 0) + n;
    return `Door je rode kaart ben je de volgende ${n === 1 ? 'wedstrijd' : `${n} wedstrijden`} geschorst.`;
  }
  if (M.geel){
    ss.geel++; S.car.geel++; ss.geelTeller++;
    if (ss.geelTeller >= 5){ ss.geelTeller = 0; sp.geschorst = (sp.geschorst || 0) + 1; return 'Dat was je vijfde gele kaart dit seizoen. Je bent de volgende wedstrijd geschorst.'; }
    const nog = 5 - ss.geelTeller;
    return `Gele kaart (${ss.geelTeller} dit seizoen). Nog ${nog} ${nog === 1 ? 'gele kaart' : 'gele kaarten'} en je bent een wedstrijd geschorst.`;
  }
  return null;
}
export function eindeWedstrijd(){
  const sp = S.sp, M = S.M;
  if (M.inter){
    if (M.inter.toernooi && M.inter.ko && M.us === M.them) twStrafschoppen(M);
    eindeInterland();
    if (M.inter.toernooi) toernooiNaWedstrijd(M);
    return;
  }
  if (M.selectie) return eindeSelectie();
  if (M.o23) return eindeO23();
  if (M.beker) return eindeBeker();
  if (M.po) return eindeNacompetitie();
  M.klaar = true;
  const speelde = M.rol === 'basis' || M.rol === 'invaller';
  if (speelde){
    if (M.us > M.them) M.cijfer += .3; else if (M.us < M.them) M.cijfer -= .3;
    if ((sp.pos === 'VERD' || sp.pos === 'KEEPER') && M.them === 0 && M.rol === 'basis') M.cijfer += sp.pos === 'KEEPER' ? .7 : .5; // (de nul gehouden)
    M.cijfer = Math.round(clamp(M.cijfer, 3, 10) * 10) / 10;
    sp.vert = clamp(sp.vert + (M.cijfer - (M.rol === 'invaller' ? 6.0 : 6.3)) * 6 - (M.rood ? 8 : 0), 0, 100);
    sp.vorm = clamp(sp.vorm * .5 + (M.cijfer - 6.5) + (M.us > M.them ? .2 : M.us < M.them ? -.2 : 0), -3, 3); // een winnende ploeg geeft vertrouwen
    sp.rep = clamp(sp.rep + ((M.cijfer - 6.5) * 1.2 + M.goals + M.assists * .5) * (1 + (3 - Math.min(club().t, 4)) * .3) * weekFactor(), 0, 100); // (weekFactor: per seizoen even snel, hoe lang het seizoen ook is)
    staminaNaWedstrijd(M);
    S.ss.wed++; S.ss.g += M.goals; S.ss.a += M.assists; S.ss.c.push(M.cijfer);
    if (M.rol === 'basis') S.ss.basis = (S.ss.basis || 0) + 1;
    if (M.rol === 'basis' && M.them === 0){ S.ss.cs = (S.ss.cs || 0) + 1; S.car.nul = (S.car.nul || 0) + 1; } // de nul gehouden (ook over je carrière)
    sp.clubWed++;
    erbij(2); // spelen in het systeem leert je het systeem
    statusPunten(wedstrijdPunten(M.cijfer, M.goals, M.assists, M.us > M.them, M.rood, M.rol === 'invaller') * weekFactor());
    focusNaWedstrijd(M);
    M.kaartTekst = kaartenVerwerken(M);
    S.car.wed++; S.car.g += M.goals; S.car.a += M.assists; carCijfer(M.cijfer);
    M.bonus = topBonus(M);
    M.groei = null;
    if (M.cijfer >= 7 && rnd() < .25 * weekFactor() * leeftijdGroei()){
      const w = POS[sp.pos].w, keys = Object.keys(w); let r = rnd(), k = keys[0];
      for (const kk of keys){ r -= w[kk]; if (r <= 0){ k = kk; break; } }
      if (ovr(sp) < sp.pot + 3){ verhoog(k, 1); M.groei = k; }
    }
    M.talent = rnd() < weekFactor() ? talentNaWedstrijd(M.cijfer) : null;
    if (sp.fit < 30 && rnd() < .12 * pers('blessure')){ sp.blessure = Math.max(1, randInt(1, 4) - pers('herstel')); M.blessureNieuw = sp.blessure; }
  } else {
    M.cijfer = null;
    if (M.rol === 'tribune'){ mod('vert', 3); statusPunten(-weekFactor()); }
    if (M.rol === 'ouders'){ mod('vert', -3); mod('focus', -3); }
    if (M.rol === 'bank'){ mod('vert', 2); if (S.sp.pos !== 'KEEPER') statusPunten(-.5 * weekFactor()); } // (een reservekeeper zit nu eenmaal op de bank)
    if (M.rol === 'geschorst') mod('vert', -1);
    // Een schorsing loopt door, ook als je geblesseerd bent of thuis zit
    if (sp.geschorst > 0) sp.geschorst--;
    sp.vorm *= .5;
    if (M.rol !== 'blessure') mod('fit', 10);
    if (sp.blessure > 0) sp.blessure--;
  }
  if (M.us > M.them){ mod('moraal', 4); iedereen(1); }
  else if (M.us < M.them) mod('moraal', -4 * pers('nederlaagMoraal'));
  speelRonde(S.ronde, M.us, M.them, M.doelen || []);
  M.reeksTekst = reeksTekst(S.sp.club);
  M.rivaalTekst = naRivaalDuel(M);
  // gevolgen van een goal van je rivaal of je vriend
  if (M.rivGoals){ if (M.us < M.them){ mod('moraal', -3); mod('focus', 4); krantMelding(`${rivaalNaam()} beslist het duel met ${S.sp.naam}`, `${team.Zijn} goal tegen ${S.sp.naam} maakte het verschil.`); if (S.week) S.week.tekst.push('Je rivaal maakte het verschil. Deze week train je feller (focus +4).'); }
    else if (M.us > M.them){ mod('moraal', 3); if (S.week) S.week.tekst.push('Je rivaal scoorde, maar jij won. Dat telt.'); } }
  if (M.vriendGoalsTegen && S.week) S.week.tekst.push(`${vriendNaam()} appt: "Sorry ${ik.knul} 😅 Volgende keer mag jij."`);
  (S.ss.uitslagen = S.ss.uitslagen || [])[S.ronde] = {r: M.us > M.them ? 'W' : M.us < M.them ? 'V' : 'G', s:`${stand2()} tegen ${CLUBS[M.opp].n}`, mee:speelde, opp:M.opp, thuis:M.thuis};
  M.statusTekst = checkStatus();
  M.agentTekst = agentCheck();
  fansNaWedstrijd(M, speelde);
  if (speelde) merkenNaWedstrijd(M); // je eigen merken: goals en topcijfers geven hype
  reunieNaWedstrijd(M, speelde);
  if (speelde) recordsNaWedstrijd(M);
  M.nieuws = maakNieuws(M, speelde);
  // Een nieuwe status (basisplaats, fanfavoriet, aanvoerder, terug naar de bank) staat meteen in de krant van deze wedstrijd
  const statusKoppen = (S.krantWacht || []).filter(x => x.status);
  if (statusKoppen.length){ S.krantWacht = S.krantWacht.filter(x => !x.status); M.nieuws = statusKoppen.concat(M.nieuws).slice(0, 3); }
  checkKampioen(M);
  // Persconferentie: altijd bij een derby of tegen je rivaal; anders pas na minstens 3 wedstrijden zonder pers,
  // en dan vaker na een opvallende wedstrijd (bescheiden/zelfverzekerd/uitdagend = kalm/gebalanceerd/fel)
  if (speelde){ S.ss.persNa = (S.ss.persNa || 0) + 1;
    const opvallend = M.cijfer != null && (M.cijfer >= 8.5 || M.cijfer <= 5);
    if (M.rivaal || M.derby || (S.ss.persNa > 3 && rnd() < (opvallend ? .45 : .2))){ M.pers = maakPers(M); S.ss.persNa = 0; } }
  if (speelde) volgersNaWedstrijd(M);
  if (speelde){ if (sp.huur) sp.huur.cijfers.push(M.cijfer); M.o23Tekst = checkO23(); }
  const o = ovr(sp); if (o > S.car.maxOvr) S.car.maxOvr = o;
  const wv = waarde(sp); if (wv > S.car.maxWaarde) S.car.maxWaarde = wv;
  S.fase = 'matchEnd';
}

// Speelvrije week: jouw league speelt niet, de andere league (en de bekers) wel. Wel even bijkomen
export function rustWeek(){
  speelRonde(S.ronde, 0, 0, null);
  mod('fit', 6);
  naWedstrijd();
}
export function vervolgNaRonde(){
  if (S.ronde === WINTER){
    openVenster('winter');
    return;
  }
  if (S.ronde >= AANTAL_RONDES) return nacompetitie(); // eerst de nacompetitie, daarna het seizoenseinde
  if (INTER_WEKEN.includes(S.ronde)){
    if (S.sp.interStop && !S.sp.clubloos){ nieuweWeek(); mod('fit', 10); mod('moraal', 2); S.week.tekst.unshift('Interlandperiode. Jij bent gestopt als international en hebt een week rust.'); return; }
    const o = maakOproep();
    if (o && o.landen.length){ S.oproep = o; S.fase = 'oproep'; return; }
    nieuweWeek();
    if (o && o.bijna.length) S.week.tekst.push(`Interlandperiode. De bondscoach van ${o.bijna.join(' en ')} heeft je nog niet opgeroepen, maar je staat wel in beeld. Met betere cijfers maak je kans.`);
    return;
  }
  nieuweWeek();
}
