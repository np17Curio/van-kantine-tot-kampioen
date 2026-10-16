import { S, club, mod, ovr, waarde } from '../../core/state.js';
import { clamp, pick, poisson, randInt, rnd } from '../../core/utils.js';
import { AANTAL_RONDES, AANV, CLUBS, JEUGD, POS, TEAMGENOTEN, TEGENSTANDERS } from '../../data/gegevens.js';
import { eindeBeker } from '../competitie/beker.js';
import { fixture, simGoals } from '../competitie/competitie.js';
import { doelHun, doelOns, gewogen, inVeld, ploeg, selectie, speelRonde, tegenPloeg, telt } from '../competitie/spelers.js';
import { eindeInterland, maakOproep } from '../interlands/interlands.js';
import { toernooiNaWedstrijd, twStrafschoppen } from '../interlands/toernooi.js';
import { maakNieuws } from '../media/nieuws.js';
import { volgersNaWedstrijd } from '../prive/social.js';
import { isProf, topBonus } from '../prive/sponsors.js';
import { carCijfer } from '../seizoen/carriere.js';
import { checkKampioen } from '../seizoen/kampioen.js';
import { recordsNaWedstrijd } from '../seizoen/records.js';
import { o19Check } from '../speler/doorstroom.js';
import { kalmte, onrust } from '../speler/kalmte.js';
import { checkO23, eindeO23, startO23 } from '../speler/o23.js';
import { checkStatus, statusNiveau, statusPunten, wedstrijdPunten } from '../speler/status.js';
import { isAanvoerder } from '../team/aanvoerder.js';
import { band, iedereen, teamKracht } from '../team/kleedkamer.js';
import { opstellingReden, opstellingScore } from '../team/opstelling.js';
import { clubTactiek, erbij, matchup } from '../team/tactiek.js';
import { openVenster } from '../transfers/transfers.js';
import { agentCheck } from '../transfers/zaakwaarnemer.js';
import { fansNaWedstrijd, fansVoorAftrap, isDerby, maakPers, modFans } from './fans-pers.js';
import { focusNaWedstrijd } from './focus.js';
import { FLOW, SLECHTE_FOCUS, bouwMoment, focusBoost, kans, kiesMomentType, pOpts } from './momenten.js';
import { gebruik, staminaNaWedstrijd, staminaStart, wisselCheck } from './stamina.js';
import { bewijsAfrekening } from '../speler/bewijs.js';
import { eindeNacompetitie, nacompetitie } from '../competitie/nacompetitie.js';
import { ontvangst, reunieAftrap, reunieMet, reunieNaWedstrijd } from './reunie.js';
import { nieuweWeek, verhoog } from '../week.js';
import { animAnderen, animPush, animSoort, animVariant } from '../../render/pitch.js';
import { talentNaWedstrijd } from '../speler/talent.js';
import { reeksTekst, vormBonus } from '../competitie/vorm.js';

/* ===================== Wedstrijd ===================== */
// Achtergrondgoals als jij meespeelt (naast jouw momenten): factor voor jullie en voor de tegenstander
export const BG = {wij:.5, zij:.85};
import { pers } from '../speler/persoonlijkheid.js';
import { naRivaalDuel, rivaalNaam, speeltTegenRivaal, rivaal, RIVAAL_MOMENTEN, rivaalVoorzet } from '../speler/rivaal.js';
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
  const bgUs = vast ? vast.us : poisson(1.3 * r4 * BG.wij), bgThem = vast ? vast.them : poisson(1.3 / r4 * BG.zij);
  // Wedstrijdverslag: kansen voor beide ploegen (hoe beter het team, hoe meer kansen), kaarten, rust en blessuretijd
  const kansUs = clamp(poisson(1.5 + lu * 2), 1, 7), kansThem = clamp(poisson(1.5 + lt * 2), 1, 7);
  for (let i = 0; i < kansUs; i++) M.ev.push({type:'kansUs', min:randInt(3, 89)});
  for (let i = 0; i < kansThem; i++) M.ev.push({type:'kansThem', min:randInt(3, 89)});
  for (let i = poisson(.7); i > 0; i--) M.ev.push({type:'geelUs', min:randInt(10, 89)});
  for (let i = poisson(.8); i > 0; i--) M.ev.push({type:'geelThem', min:randInt(10, 89)});
  if (M.derby){ const x = M.fel ? 1 : .6; for (let i = poisson(x); i > 0; i--) M.ev.push({type:'geelUs', min:randInt(10, 89)}); for (let i = poisson(x); i > 0; i--) M.ev.push({type:'geelThem', min:randInt(10, 89)}); }
  M.ev.push({type:'rust', min:45});
  M.ev.push({type:'extra', min:90});
  if (rol === 'bank'){ const w = randInt(60, 74); M.ev.push({type:'warm', min:w}); M.ev.push({type:'geenInval', min:randInt(Math.max(w + 8, 80), 88)}); }
  for (let i = 0; i < bgUs; i++) M.ev.push({type:'us', min:randInt(2, 90)});
  for (let i = 0; i < bgThem; i++) M.ev.push({type:'them', min:randInt(2, 90)});
  let start = 1;
  if (rol === 'basis') staminaStart(M, 0);
  if (rol === 'invaller'){ start = randInt(58, 72); M.ev.push({type:'warm', min:start - randInt(5, 9)}); M.ev.push({type:'inval', min:start}); }
  if (rol !== 'basis' && rol !== 'invaller') return sorteerEv(M);
  const n = rol === 'basis' ? 3 + (rnd() < .5 ? 1 : 0) + (rnd() < .25 ? 1 : 0) + (sp.pos === 'VERD' ? 1 : 0) : 1 + (rnd() < .6 ? 1 : 0);
  // Tegen een duidelijk sterkere ploeg heb je de bal minder: soms een moment minder
  const nn = n - (O - T >= 3 && n > 1 && rnd() < .6 ? 1 : 0);
  let extra = 0;
  if (telt(M) && !M.beker){
    const sel = selectie(S.sp.club), koel = sel.filter(x => band(x.n) < 30), maat = sel.filter(x => band(x.n) >= 80);
    if (koel.length && rnd() < .5){ M.ev.push({type:'genegeerd', min:randInt(start + 1, 89), naam:pick(koel).n}); extra = -1; }
    if (maat.length && rnd() < .4){ M.ev.push({type:'moment', min:randInt(start + 1, 89), m:'rand', via:pick(maat).n}); extra += 0; }
  }
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
  if (M.rivaal){ const R = rivaal(), lijst = RIVAAL_MOMENTEN[sp.pos] || RIVAAL_MOMENTEN.MID, n = 2 + (R && R.uitgedaagd ? 1 : 0);
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
  const rivX = M.rivaal && e.type === 'them' && T ? T.find(x => x.rivaal) : null, hijScoort = !!(rivX && rnd() < .35);
  const opS = T ? (hijScoort ? rivX : e.type === 'them' ? gewogen(T, 'g') : pick(inVeld(T))) : null, op = T ? opS.n : pick(TEGENSTANDERS);
  const coach = M.inter ? 'De bondscoach' : 'De trainer', jijSpeelt = M.rol === 'basis' || (M.rol === 'invaller' && M.idx > M.ev.findIndex(x => x.type === 'inval'));
  switch (e.type){
    case 'us': { if (!e.varPen){ const va = varTegen(M, wij, tm); if (va) return va; } M.us++; const l = [
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
      const t = hijScoort ? `Tegengoal. Daar is hij: je rivaal ${rivaalNaam()} scoort en juicht recht voor je neus. ${stand2()}` : uniek(M, 'them', l), i = hijScoort ? 1 : l.indexOf(t);
      doelHun(M, opS, i <= 1 ? ag : null);
      return {t, k:'tegen'}; }
    case 'kansUs':
      // Soms ziet de VAR nog een overtreding in het strafschopgebied: alsnog een penalty
      if (varAan(M) && rnd() < VAR_PENALTY){ varTel(M, 'pen');
        const jij = jijSpeelt && !M.rood && M.gewisseld === undefined;
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
    case 'geelUs': return {t:uniek(M, 'geelUs', [`Gele kaart voor ${tm} na een harde overtreding.`, `${tm} protesteert te fel en krijgt geel.`, `Gele kaart voor ${tm}: hij trekt ${op} aan zijn shirt.`]), k:'kaart'};
    case 'geelThem': return {t:uniek(M, 'geelThem', [`Gele kaart voor ${op} van ${zij}.`, `${op} van ${zij} schopt ${tm} onderuit. Geel.`, `${op} van ${zij} krijgt geel wegens tijdrekken.`]), k:'kaart'};
    case 'oudMaat': return {t:pick([`Je oude maatje ${e.naam} probeert je af te stoppen. Jullie grijnzen allebei.`, `${e.naam} zet je stevig onder druk en geeft je daarna een knipoog. Net als vroeger op de training.`]), k:'info'};
    case 'oudVijand': return {t:pick([`${e.naam}, met wie je nooit door één deur kon, schopt je net iets te hard. "Welkom terug," sist hij.`, `${e.naam} blijft de hele tijd tegen je praten. Hij wil je gek maken.`]), k:'gevaar'};
    case 'genegeerd': return {t:`${e.naam} ziet je vrijstaan, maar speelt de bal niet naar jou. Hij schiet zelf, ver over. Jullie kunnen het niet zo goed met elkaar vinden.`, k:'mis'};
    case 'rust': return {t:`Rust. Stand: ${stand2()}.${jijSpeelt ? '' : M.rol === 'invaller' || M.rol === 'bank' ? ` ${coach} zegt dat je klaar moet zitten.` : ''}`, k:'rust'};
    case 'warm': return {t:`${coach} zegt dat je moet gaan warmlopen. Je trekt je trainingsjack uit.`, k:'info'};
    case 'geenInval': return {t:`${coach} kiest voor een andere wissel. Je gaat weer zitten.`, k:'info'};
    case 'extra': return {t:`Er komen ${randInt(2, 6)} minuten bij.`, k:'info'};
  }
  return null;
}
export function startWedstrijd(){
  S.krantWacht = [];
  // Zijn je ouders boos om je cijfers, dan houden ze je soms thuis (niet als je deze week huiswerk maakte)
  const thuis = S.sp.leeftijd < 18 && S.sp.ouders && S.sp.ouders.boos && !(S.week && S.week.huiswerk) && S.sp.blessure <= 0 && rnd() < .35;
  if (!thuis && !(S.sp.geschorst > 0) && S.sp.o23 && S.sp.blessure <= 0 && S.sp.fit >= 20) return startO23();
  const sp = S.sp, c = club(), fx = fixture(S.ronde), opp = CLUBS[fx.opp];
  let rol, reden = '';
  if (thuis) rol = 'ouders';
  else if (sp.blessure > 0) rol = 'blessure';
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
  }

  const T = teamKracht(c.s, {speelt:rol === 'basis' || rol === 'invaller', thuis:fx.thuis, tactiek:matchup(clubTactiek(sp.club), clubTactiek(fx.opp))});
  const O = opp.s + (fx.thuis ? 0 : 2) + vormBonus(fx.opp);
  const M = {opp:fx.opp, oppS:opp.s, wij:c.n, zij:opp.n, thuis:fx.thuis, rol, us:0, them:0, min:0, ev:[], idx:0, log:[], cijfer:sp.pos === 'VERD' ? 6.3 : 6.0, goals:0, assists:0, geel:false, rood:false, pending:null, klaar:false, derby:isDerby(fx.opp), fel:!!S.ss.rivaalFel};
  S.M = M;
  if (speeltTegenRivaal(fx.opp)) M.rivaal = true; // ook als je zelf niet speelt
  const derbyRegel = M.derby ? {m:'', t:`DERBY tegen aartsrivaal ${opp.n}! Het stadion kookt, overal vuurwerk en spandoeken.${M.fel ? ' Na de woorden in de krant is de sfeer extra vijandig.' : ''}`, k:'info'} : null;

  if (rol === 'blessure' || rol === 'rust' || rol === 'tribune' || rol === 'bank' || rol === 'ouders' || rol === 'geschorst'){
    const [a, b] = simGoals(T, O, false);
    M.log.push({m:'', t: rol === 'geschorst' ? `Je bent geschorst${sp.geschorst > 1 ? ` (nog ${sp.geschorst} wedstrijden)` : ''}. Je kijkt vanaf de tribune hoe je ploeg het zonder jou doet.` : rol === 'ouders' ? 'Je ouders houden je thuis: "Eerst je cijfers ophalen, dan mag je weer voetballen."' : rol === 'blessure' ? 'Je zit geblesseerd op de tribune.' : rol === 'rust' ? 'Je bent compleet kapot. De trainer laat je rusten.' : rol === 'bank' ? 'Je zit de hele wedstrijd op de bank. De trainer brengt je niet in.' + reden : 'De trainer laat je buiten de selectie. Je kijkt vanaf de tribune.' + reden, k:'mis'});
    M.log.push({m:"1'", t:`Aftrap! ${rol === 'bank' ? 'Je zit op de bank.' : rol === 'ouders' ? 'Je volgt de wedstrijd thuis via de livestream.' : 'Je kijkt vanaf de tribune.'}`, k:''});
    if (derbyRegel) M.log.push(derbyRegel);
    if (M.rivaal) M.log.push({m:"1'", t:`Je rivaal ${rivaalNaam()} staat in de basis bij ${opp.n}. Jij ${rol === 'bank' ? 'zit op de bank en ziet hem warmlopen' : 'kijkt toe'}. Dat doet pijn.`, k:'info'});
    if (reunieMet(M.opp)) M.reunie = {club:M.opp, type:reunieMet(M.opp).type, ontvangst:ontvangst(M.opp)};
    planWedstrijd(M, T, O, {us:a, them:b});
    S.fase = 'match';
    return verderSpelen();
  }
  if (derbyRegel) M.log.push(derbyRegel);
  reunieAftrap(M);
  fansVoorAftrap(M);
  if (M.rivaal){ M.log.push({m:"1'", t:`Je rivaal ${rivaalNaam()} staat in de basis bij ${opp.n}. Bij de opkomst kijkt hij je strak aan. Vandaag laat je zien wie de beste is.`, k:'info'});
    const R = rivaal();
    if (R.persReactie){ M.log.push({m:"1'", t:R.persReactie, k:'info'}); R.persReactie = null; }
    if (R.voorbereid){ M.rivaalBonus = .08; M.log.push({m:"1'", t:`Je hebt zijn wedstrijden geanalyseerd. Je weet precies wat hij gaat doen (focus +${focusBoost(8)}).`, k:'info'}); }
    if (R.uitgedaagd) M.log.push({m:"1'", t:'Na jouw woorden in de krant zijn alle ogen op jullie gericht. Dit duel telt dubbel.', k:'info'}); }
  planWedstrijd(M, T, O);
  M.log.push({m:"1'", t:`Aftrap! ${rol === 'basis' ? (sp.statusNiveau >= AANV ? 'Met de aanvoerdersband om je arm leid je het team het veld op.' : statusNiveau() <= 1 ? 'De trainer geeft je als bankspeler een kans in de basis. Grijp hem!' : 'Je staat in de basis.') : 'Je begint op de bank.' + reden}`, k:''});
  S.fase = 'match';
  verderSpelen();
}
export const mijnNaam = () => club().n;
export function stand2(){ const M = S.M; return M.thuis ? `${M.us}-${M.them}` : `${M.them}-${M.us}`; }

export function verderSpelen(){
  const M = S.M;
  if (M.varKeuze) return varKeuze(0);
  while (M.idx < M.ev.length){
    const e = M.ev[M.idx++]; M.min = e.min; wisselCheck(M);
    if (e.type !== 'inval' && e.type !== 'moment'){ const v = verslag(e, M); if (v){ M.log.push({m:e.min + "'", t:v.t, k:v.k}); animAnderen(M, e, v); }
      if (e.type === 'rust' && M.rol === 'basis' && !M.rood && M.gewisseld === undefined && M.us < M.them && !M.inter && isAanvoerder()){ M.pending = bouwMoment('toespraak'); return; } }
    else if (e.type === 'inval'){ staminaStart(M, e.min); M.log.push({m:e.min + "'", t: M.inter ? 'De bondscoach roept je. Je mag erin!' : 'De trainer roept je. Je mag erin!', k:'ok'}); }
    else if (e.type === 'moment'){
      if (M.rood || M.gewisseld !== undefined) continue;
      const type = (!e.varPen && !e.rivaal && e.min >= 84 && M.us <= M.them && rnd() < .6) ? 'laatsteMinuut' : e.m;
      M.pending = bouwMoment(type);
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
  // Tegen een veel sterkere ploeg haalt hun keeper soms ook een goede kans van jou eruit
  // VAR bij jouw goal
  if (out.goal && !M.o23 && !M.inter){ const gat = (M.oppS ?? CLUBS[M.opp].s) - club().s;
    if (gat > 2 && rnd() < Math.min(KEEPER_MAX, (gat - 2) * .05)) out = {...out, goal:false, t:`${out.t.replace(/[.!]*$/, '')}... maar de keeper van ${M.zij} haalt hem er met een wereldredding uit!`, d:Math.max(.1, (out.d || 0) - .4)}; }
  // VAR bij jouw goal: de bal ligt erin, maar de scheids gaat kijken. Jij kiest wat je doet (varKeuze)
  const ruwGoal = !!out.goal, varWacht = out.goal ? varCheck('jij') : null;
  if (varWacht) out = {...out, goal:false};
  { const soort = animSoort(M.pending.type, opt.l); if (soort) animPush(M, {type:M.pending.type, label:opt.l, soort, variant:animVariant(M.pending.type, opt.l), ok, goal:ruwGoal, assist:!!out.assist, team:!!out.teamGoal, tegen:!!out.tegen, geel:!!out.geel, rood:!!out.rood}); }
  gebruik(M, opt);
  const fVoor = S.sp.focus ?? 65; if (ok) focusBoost(1); else mod('focus', -1 * pers('focusMis'));
  const m = M.min + "'";
  M.log.push({m, t:`[${opt.l}] ${out.t}`, k: ok ? 'ok' : 'mis'});
  if (fVoor < FLOW && S.sp.focus >= FLOW) M.log.push({m, t:'Alles lukt! Je zit helemaal in de flow.', k:'info'});
  if (fVoor >= SLECHTE_FOCUS && S.sp.focus < SLECHTE_FOCUS) M.log.push({m, t:'Je hoofd zit vol. Je raakt je concentratie kwijt.', k:'info'});
  M.cijfer += (out.d || 0) * (M.rol === 'invaller' ? 1.5 : 1); // invallers moeten het in weinig minuten laten zien
  const P = ploeg(M), T = tegenPloeg(M);
  if (out.goal){ M.us++; M.goals++; M.log.push({m, t:`GOAL! ${S.sp.naam} scoort! ${stand2()}`, k:'goal'}); if (M.rivaal) M.log.push({m, t:uniek(M, 'rivJuich', [`Je rent juichend langs ${rivaalNaam()}. Hij kijkt de andere kant op.`, `Je wijst naar je rugnummer, recht voor de neus van ${rivaalNaam()}.`, `${rivaalNaam()} schopt boos tegen het gras. Jij juicht.`]), k:'info'}); doelOns(M, 'JIJ', P && rnd() < .5 ? gewogen(P, 'a') : null); }
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
  if (out.next && !M.rood){
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
    if (M.rivaal) M.log.push({m, t:`Je rent juichend langs ${rivaalNaam()}. Hij kijkt de andere kant op.`, k:'info'});
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
  if (M.o23) return eindeO23();
  if (M.beker) return eindeBeker();
  if (M.po) return eindeNacompetitie();
  M.klaar = true;
  const speelde = M.rol === 'basis' || M.rol === 'invaller';
  if (speelde){
    if (M.us > M.them) M.cijfer += .3; else if (M.us < M.them) M.cijfer -= .3;
    if (sp.pos === 'VERD' && M.them === 0 && M.rol === 'basis') M.cijfer += .5;
    M.cijfer = Math.round(clamp(M.cijfer, 3, 10) * 10) / 10;
    sp.vert = clamp(sp.vert + (M.cijfer - (M.rol === 'invaller' ? 6.0 : 6.3)) * 6 - (M.rood ? 8 : 0), 0, 100);
    sp.vorm = clamp(sp.vorm * .5 + (M.cijfer - 6.5) + (M.us > M.them ? .2 : M.us < M.them ? -.2 : 0), -3, 3); // een winnende ploeg geeft vertrouwen
    sp.rep = clamp(sp.rep + ((M.cijfer - 6.5) * 1.2 + M.goals + M.assists * .5) * (1 + (3 - Math.min(club().t, 4)) * .3), 0, 100);
    staminaNaWedstrijd(M);
    S.ss.wed++; S.ss.g += M.goals; S.ss.a += M.assists; S.ss.c.push(M.cijfer);
    if (M.rol === 'basis') S.ss.basis = (S.ss.basis || 0) + 1;
    if (M.rol === 'basis' && M.them === 0) S.ss.cs = (S.ss.cs || 0) + 1;
    sp.clubWed++;
    erbij(2); // spelen in het systeem leert je het systeem
    statusPunten(wedstrijdPunten(M.cijfer, M.goals, M.assists, M.us > M.them, M.rood, M.rol === 'invaller'));
    focusNaWedstrijd(M);
    M.kaartTekst = kaartenVerwerken(M);
    S.car.wed++; S.car.g += M.goals; S.car.a += M.assists; carCijfer(M.cijfer);
    M.bonus = topBonus(M);
    M.groei = null;
    if (M.cijfer >= 7 && rnd() < .4){
      const w = POS[sp.pos].w, keys = Object.keys(w); let r = rnd(), k = keys[0];
      for (const kk of keys){ r -= w[kk]; if (r <= 0){ k = kk; break; } }
      if (ovr(sp) < sp.pot + 3){ verhoog(k, 1); M.groei = k; }
    }
    M.talent = talentNaWedstrijd(M.cijfer);
    if (sp.fit < 30 && rnd() < .12 * pers('blessure')){ sp.blessure = Math.max(1, randInt(1, 4) - pers('herstel')); M.blessureNieuw = sp.blessure; }
  } else {
    M.cijfer = null;
    if (M.rol === 'tribune'){ mod('vert', 3); statusPunten(-1); }
    if (M.rol === 'ouders'){ mod('vert', -3); mod('focus', -3); }
    if (M.rol === 'bank'){ mod('vert', 2); statusPunten(-.5); }
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
  (S.ss.uitslagen = S.ss.uitslagen || [])[S.ronde] = {r: M.us > M.them ? 'W' : M.us < M.them ? 'V' : 'G', s:`${stand2()} tegen ${CLUBS[M.opp].n}`, mee:speelde};
  M.statusTekst = checkStatus();
  M.agentTekst = agentCheck();
  M.o19Tekst = club().t === JEUGD ? o19Check() : null;
  fansNaWedstrijd(M, speelde);
  reunieNaWedstrijd(M, speelde);
  if (speelde) recordsNaWedstrijd(M);
  M.nieuws = maakNieuws(M, speelde);
  // Een nieuwe status (basisplaats, fanfavoriet, aanvoerder, terug naar de bank) staat meteen in de krant van deze wedstrijd
  const statusKoppen = (S.krantWacht || []).filter(x => x.status);
  if (statusKoppen.length){ S.krantWacht = S.krantWacht.filter(x => !x.status); M.nieuws = statusKoppen.concat(M.nieuws).slice(0, 3); }
  checkKampioen(M);
  if (speelde && (M.rivaal || (isProf() && (M.derby || rnd() < .25)))) M.pers = maakPers(M);
  if (speelde) volgersNaWedstrijd(M);
  if (speelde){ if (sp.huur) sp.huur.cijfers.push(M.cijfer); M.o23Tekst = checkO23(); }
  const o = ovr(sp); if (o > S.car.maxOvr) S.car.maxOvr = o;
  const wv = waarde(sp); if (wv > S.car.maxWaarde) S.car.maxWaarde = wv;
  S.fase = 'matchEnd';
}

export function vervolgNaRonde(){
  if (S.ronde === 7){
    // Winterstop: de laatbloeier hoort of zijn proefcontract een vast contract wordt
    const proef = bewijsAfrekening();
    openVenster('winter');
    // (bij een mislukte proeftijd vertelt het transfervenster zelf dat je weg moet)
    if (proef === true && S.venster) S.venster.intro = 'Je proeftijd zit erop en je hebt je bewezen: je krijgt een vast contract! ' + (S.sp.bewijs.talent ? S.sp.bewijs.talent + ' ' : '') + S.venster.intro;
    return;
  }
  if (S.ronde >= AANTAL_RONDES) return nacompetitie(); // eerst de nacompetitie, daarna het seizoenseinde
  if (S.ronde === 4 || S.ronde === 11){
    const o = maakOproep();
    if (o && o.landen.length){ S.oproep = o; S.fase = 'oproep'; return; }
    nieuweWeek();
    if (o && o.bijna.length) S.week.tekst.push(`Interlandperiode. De bondscoach van ${o.bijna.join(' en ')} heeft je nog niet opgeroepen, maar je staat wel in beeld. Met betere cijfers maak je kans.`);
    return;
  }
  nieuweWeek();
}
