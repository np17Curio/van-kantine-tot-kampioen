import { S, club, mod } from '../../core/state.js';
import { keuzeKnop, knop } from '../../core/ui.js';
import { clamp, esc, pick } from '../../core/utils.js';
import { AANTAL_RONDES, CLUBS } from '../../data/gegevens.js';
import { thuisLand } from '../../data/landen.js';
import { fixture } from '../competitie/competitie.js';
import { selectie } from '../competitie/spelers.js';
import { KRANTEN, vKrant } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { social } from '../prive/social.js';
import { onrust } from '../speler/kalmte.js';
import { ck } from '../transfers/buitenland.js';
import { fans, modFans, zetFans } from './fans-pers.js';
import { focusBoost } from './momenten.js';
import { stand2 } from './wedstrijd.js';
import { ik } from '../../core/geslacht.js';

/* ===================== Weerzien met je oude club ===================== */
// Bij een transfer onthoudt de game hoe je vertrok en je band met je teamgenoten daar
export const oudeClubs = () => S.sp.oudeClubs || (S.sp.oudeClubs = {});
export const VERTREK_TEKST = {legende:'Je vertrok als clublegende.', goed:'Je vertrok netjes, met de zegen van de club.', weg:'De trainer stuurde je weg.', slecht:'Je vertrok met ruzie.'};
export function bewaarVertrek(oudId, hoe, naarRivaal){
  const sp = S.sp;
  const type = sp.legendeHier ? 'legende' : (naarRivaal || hoe === 'geforceerd' || sp.ontbonden || sp.vertrekRuzie) ? 'slecht' : hoe === 'weg' ? 'weg' : 'goed';
  const reden = naarRivaal ? 'Je ging naar de aartsrivaal.' : sp.ontbonden ? 'Je contract werd ontbonden.' : hoe === 'geforceerd' ? 'Je dwong je transfer af.' : sp.vertrekRuzie ? 'Je wilde per se weg en kreeg ruzie met de club.' : VERTREK_TEKST[type];
  const rel = sp.kleed && sp.kleed.club === ck(oudId) ? {...sp.kleed.rel} : {};
  const rec = (S.car && S.car.rec) || {};
  oudeClubs()[ck(oudId)] = {type, reden, rel, jaar:S.jaar, nr:(sp.rugHist || {})[ck(oudId)] ?? null, n:CLUBS[oudId].n, land:thuisLand(),
    sz:sp.clubSz || 0, wed:(rec.clubW && rec.clubW[ck(oudId)]) ?? sp.clubWed ?? 0, g:(rec.clubG && rec.clubG[ck(oudId)]) || 0, aanv:(sp.statusNiveau || 0) >= 4}; // (wat je er betekende: voor het weerzien)
  // Hoe de oude fans over je denken past bij hoe je vertrok
  sp.fans = sp.fans || {}; const f = fans(oudId);
  zetFans(oudId, type === 'legende' ? Math.max(f, 85) : type === 'goed' ? Math.max(f, 58) : type === 'slecht' ? Math.min(f, 25) : f);
  sp.vertrekRuzie = false;
}
export const reunieMet = opp => { const o = S.sp.oudeClubs; return o && o[ck(opp)] && opp !== S.sp.club ? o[ck(opp)] : null; };
// Oude maat (beste band) en oude vijand (slechtste band) uit de oude selectie
export function oudeMaten(opp){
  const R = reunieMet(opp); if (!R) return {};
  const sel = selectie(opp).filter(x => R.rel[x.n] !== undefined).sort((a, b) => R.rel[b.n] - R.rel[a.n]);
  return {maat: sel.length && R.rel[sel[0].n] >= 55 ? sel[0] : null, vijand: sel.length && R.rel[sel[sel.length - 1].n] < 35 ? sel[sel.length - 1] : null};
}
export function ontvangst(opp){ const f = fans(opp), R = reunieMet(opp); return R.type === 'legende' && f >= 70 ? 'ovatie' : f >= 55 ? 'applaus' : f >= 30 ? 'gemengd' : 'fluit'; }
// Weekscherm: aankondiging, pers en een appje van een oude teamgenoot
export function reuniePers(fel){
  const sp = S.sp, w = S.week, fx = fixture(S.ronde); if (!fx) return; const opp = fx.opp, R = reunieMet(opp); if (!R || w.reuniePers) return;
  w.reuniePers = fel ? 'fel' : 'rustig';
  if (fel){ modFans(-8, opp); social().volgers += Math.round(40 + social().volgers * .02);
    if (club().t <= 3) krantMelding(`${sp.naam}: "Ik ga ${CLUBS[opp].n} laten zien wat ze missen"`, `Voor het weerzien met ${ik.zijn} oude club is ${sp.naam} strijdlustig. Bij ${CLUBS[opp].n} reageren ze verbaasd.`);
    w.reunieTekst = `Je zegt het hardop in de krant. Je bent extra gemotiveerd, maar bij ${CLUBS[opp].n} zijn ze er niet blij mee (oude fans −8).`; }
  else { focusBoost(2); w.reunieTekst = '"Ik heb ze niks te bewijzen. Ik heb daar een mooie tijd gehad." Een rustig antwoord. Focus +2.'; }
}
export function reunieApp(opp){
  const w = S.week; if (w.reunieApp !== undefined) return w.reunieApp;
  const {maat, vijand} = oudeMaten(opp);
  w.reunieApp = maat ? `${maat.n} appt je: "Zondag zie ik je! Ik ga je geen meter ruimte geven, maatje 😄 Daarna een drankje?"` : vijand ? `${vijand.n} stuurt je een berichtje: "Hoop dat je zondag je schoenen niet vergeet. Je gaat het merken."` : null;
  return w.reunieApp;
}
export function vReunie(){
  const sp = S.sp, w = S.week; if (sp.o23 || S.ronde >= AANTAL_RONDES) return '';
  const fx = fixture(S.ronde); if (!fx) return ''; const opp = fx.opp, R = reunieMet(opp); if (!R) return '';
  const f = Math.round(fans(opp)), o = ontvangst(opp), app = reunieApp(opp);
  const verwacht = {ovatie:'Ze maken zich op voor een staande ovatie.', applaus:'De oude fans willen je bedanken met een applaus.', gemengd:'De oude fans weten niet goed wat ze van je moeten denken.', fluit:'De oude fans hebben er zin in: ze gaan je uitfluiten.'}[o];
  return `<div class="paneel" style="gap:8px;border-color:var(--lamp)"><span class="label">Weerzien met ${esc(CLUBS[opp].n)}</span>
    <p>${esc(R.reden)} Daar speelde je${R.nr ? ` met nummer ${R.nr}` : ''} tot ${R.jaar}. ${verwacht} <span class="muted">(fans daar: ${f})</span>${R.type === 'weg' ? ' Jij hebt nog iets recht te zetten...' : ''}</p>
    ${app ? `<p class="moment">📱 ${esc(app)}</p>` : ''}
    ${w.reuniePers ? `<p class="melding">${esc(w.reunieTekst)}</p>` : `<span class="label">De pers vraagt naar het weerzien</span><div class="keuzes">${keuzeKnop('"Ik heb ze niks te bewijzen"', 'rustig · focus +2', () => reuniePers(false), 'data-blijf')}${keuzeKnop('"Ik ga ze laten zien wat ze missen"', 'extra motivatie · krantenkop · oude fans boos', () => reuniePers(true), 'data-blijf')}</div>`}</div>`;
}
// Bij de aftrap: ontvangst door het oude publiek
export function reunieAftrap(M){
  const sp = S.sp, R = reunieMet(M.opp); if (!R) return;
  const o = ontvangst(M.opp), naam = CLUBS[M.opp].n, fel = S.week && S.week.reuniePers === 'fel';
  M.reunie = {club:M.opp, type:R.type, ontvangst:o};
  if (o === 'ovatie'){ const n = focusBoost(6); M.log.push({m:'', t:`Als je naam klinkt, staat het hele stadion op. Een staande ovatie voor de clublegende van ${naam}. Je moet even slikken. Focus +${n}.`, k:'ok'}); }
  else if (o === 'applaus'){ const n = focusBoost(3); M.log.push({m:'', t:`Een warm applaus van de supporters van ${naam}. In het oude vak hangt een spandoek: "Bedankt, ${sp.naam}!" Focus +${n}.`, k:'ok'}); }
  else if (o === 'gemengd') M.log.push({m:'', t:`Als je naam klinkt, hoor je applaus én gefluit uit het vak van ${naam}.`, k:'info'});
  else { mod('focus', -5); onrust(6, `Uitgefloten door ${naam}`); M.reunieDuels = 2; M.log.push({m:'', t:`Een oorverdovend fluitconcert. Op een spandoek staat: "${sp.naam} = VERRADER". Focus −5.`, k:'mis'}); }
  if (R.type === 'weg'){ const n = focusBoost(4); M.reunieDuels = Math.max(M.reunieDuels || 0, 1); M.log.push({m:'', t:`De trainer die je wegstuurde staat langs de lijn. Je hebt iets recht te zetten. Focus +${n}.`, k:'info'}); }
  if (fel){ const n = focusBoost(3); M.reunieDuels = Math.max(M.reunieDuels || 0, 1); M.log.push({m:'', t:`Na je woorden in de krant ben je extra gebrand. Focus +${n}.`, k:'info'}); }
  const {maat, vijand} = oudeMaten(M.opp); M.reunieMaat = maat ? maat.n : null; M.reunieVijand = vijand ? vijand.n : null;
}
// ---------- hoeveel je betekende bij je oude club: hoe meer, hoe meer er gebeurt bij het weerzien ----------
// 0-10: seizoenen, wedstrijden, goals, aanvoerder, clublegende (oude opslag zonder die cijfers: uit je clubrecords)
export function reunieImpact(opp){
  const R = reunieMet(opp); if (!R) return 0; const rec = (S.car && S.car.rec) || {}, k = ck(opp);
  const sz = R.sz ?? 0, wed = R.wed ?? ((rec.clubW && rec.clubW[k]) || 0), g = R.g ?? ((rec.clubG && rec.clubG[k]) || 0);
  return Math.min(10, sz + wed / 50 + g / 25 + (R.aanv ? 1.5 : 0) + (R.type === 'legende' ? 3 : 0));
}
// De momenten tijdens de wedstrijd (wedstrijd.js zet ze in het verslag): bij een warm weerzien eerbetoon, bij een vijandig weerzien gedoe
const WARM = ['spandoek', 'video', 'mascotte', 'kitman', 'lied', 'shirts', 'oudeTrainer'], KOUD = ['boegeroep', 'judas', 'shirtVerbrand', 'stewards', 'oudeTrainerKoud'];
export function reunieMomenten(M, start){
  const R = reunieMet(M.opp); if (!R || !M.reunie) return [];
  const imp = reunieImpact(M.opp), warm = M.reunie.ontvangst === 'ovatie' || M.reunie.ontvangst === 'applaus', n = Math.min(5, 1 + Math.floor(imp / 2.2));
  const lijst = (warm ? WARM : M.reunie.ontvangst === 'fluit' ? KOUD : [...WARM.slice(0, 3), ...KOUD.slice(0, 2)]).slice();
  for (let i = lijst.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [lijst[i], lijst[j]] = [lijst[j], lijst[i]]; }
  M.reunie.impact = imp;
  return lijst.slice(0, n).map((wat, i) => ({type:'reunieMoment', wat, min:Math.max(start + 1, Math.min(88, 4 + i * 17 + Math.floor(Math.random() * 10)))}));
}
export function reunieMomentTekst(e, M, opVeld){
  const R = reunieMet(M.opp) || {}, naam = CLUBS[M.opp].n, nr = R.nr ? `nummer ${R.nr}` : 'je oude rugnummer', jaren = R.sz ? `${R.sz} ${R.sz === 1 ? 'seizoen' : 'seizoenen'}` : 'jaren';
  switch (e.wat){
    case 'spandoek': mod('moraal', 2); return {t:`In het oude vak gaat een enorm spandoek omhoog: je gezicht, ${nr}, en "Voor altijd een van ons". Je slikt even.`, k:'ok'};
    case 'video': { const n = focusBoost(2); return {t:`Op het grote scherm een filmpje over je tijd bij ${naam}: ${R.g || 0} goals${R.wed ? ` in ${R.wed} wedstrijden` : ''}. Het hele stadion klapt mee. Focus +${n}.`, k:'ok'}; }
    case 'mascotte': mod('moraal', 2); return {t:`Een jochie in een oud shirt van ${naam} met jouw naam erop rent op je af voor een high five. De camera's smullen ervan.`, k:'ok'};
    case 'kitman': return {t:`De materiaalman van ${naam}, die ${jaren} lang je schoenen poetste, steekt zijn duim op vanaf de bank.`, k:'ok'};
    case 'lied': { const n = opVeld ? focusBoost(3) : 0; return {t:`Als je de bal krijgt, zingen de fans van ${naam} ineens je oude lied. ${opVeld ? `Je krijgt er kippenvel van. Focus +${n}.` : 'Vanaf de bank zing je zachtjes mee.'}`, k:'ok'}; }
    case 'shirts': return {t:`Op de tribune zie je overal nog oude shirts met jouw naam. ${jaren} bij ${naam}: dat vergeten ze hier niet.`, k:'ok'};
    case 'oudeTrainer': mod('moraal', 1); return {t:`Je oude trainer roept je bij de dug-out: "Je bent nog steeds even lastig, hè?" Jullie lachen allebei.`, k:'ok'};
    case 'boegeroep': if (opVeld) mod('focus', -3); return {t:`Elke keer dat je de bal raakt, klinkt een oorverdovend boegeroep uit het vak van ${naam}.${opVeld ? ' Focus −3.' : ''}`, k:'mis'};
    case 'judas': if (opVeld) mod('focus', -2); return {t:`"Judas! Judas!" De fans van ${naam} hebben er een spreekkoor voor bedacht.${opVeld ? ' Focus −2.' : ''}`, k:'mis'};
    case 'shirtVerbrand': return {t:`In het oude vak houdt iemand een shirt met ${nr} omhoog en steekt het in brand. De stewards grijpen in.`, k:'mis'};
    case 'stewards': return {t:`Bij een hoekschop voor het oude vak moeten stewards voor je gaan staan: er vliegen bekertjes het veld op.`, k:'mis'};
    case 'oudeTrainerKoud': return {t:`Je oude trainer kijkt je de hele wedstrijd niet aan. Bij een wissel loop je vlak langs hem: geen woord.`, k:'info'};
  }
  return {t:'', k:'info'};
}
// Na het laatste fluitsignaal: bij een groot weerzien een eigen keuze (de oude kleedkamer in, of je excuses aan de fans)
export function reunieNaKeuze(soort){
  const M = S.M, R = M && M.reunie; if (!R || M.reunieNa) return;
  const o = oudeClubs()[ck(R.club)] || {}, naam = CLUBS[R.club].n;
  if (soort === 'kleedkamer'){ mod('moraal', 4); for (const k in (o.rel || {})) o.rel[k] = clamp(o.rel[k] + 5, 0, 100); modFans(3, R.club);
    M.reunieNa = `Je loopt de kleedkamer van ${naam} binnen. Je oude plekje, je oude haakje: er zit nog een sticker met je naam op. Je oude ploeggenoten geven je een drankje. (moraal +4, band met je oude teamgenoten +5)`; }
  else if (soort === 'ererondje'){ mod('moraal', 3); modFans(6, R.club); social().volgers += 150;
    M.reunieNa = `Na afloop loop je nog een rondje langs het oude vak. Ze scanderen je naam. (fans van ${naam} +6, moraal +3)`; }
  else if (soort === 'excuses'){ modFans(8, R.club); mod('focus', 2);
    M.reunieNa = `Je loopt naar het oude vak en steekt je handen op: sorry. Er klinkt nog wat gefluit, maar ook applaus. Het ijs is gebroken. (fans van ${naam} +8)`; }
  else if (soort === 'negeren'){ mod('focus', 3); modFans(-4, R.club);
    M.reunieNa = `Je draait je om en loopt meteen de tunnel in. Voor jou is dit hoofdstuk afgesloten. (fans van ${naam} −4)`; }
}
export function reunieNaWedstrijd(M, speelde){
  const sp = S.sp, R = M.reunie; if (!R) return;
  const t = S.car.tegenOud = S.car.tegenOud || {}, x = t[ck(R.club)] = t[ck(R.club)] || {w:0, g:0, v:0, goals:0}; x.n = CLUBS[R.club].n;
  if (M.us > M.them || (M.us === M.them && M.pens && M.bekerWinstRonde)) x.w++; else if (M.us < M.them) x.v++; else x.g++;
  if (speelde) x.goals += M.goals;
  const naam = CLUBS[R.club].n, wij = club().n;
  let kop, tekst;
  if (M.juich === 'ssst'){ kop = `Ssst! ${sp.naam} legt oude fans van ${naam} het zwijgen op`; tekst = `Na ${ik.zijn} doelpunt hield ${ik.hij} ${ik.zijn} vinger voor ${ik.zijn} mond, recht voor het vak van ${ik.zijn} oude club. Bij ${naam} zijn ze woedend.`; }
  else if (M.juich === 'respect'){ kop = `Respect: ${sp.naam} juicht niet tegen ${naam}`; tekst = `${ik.Hij} scoorde tegen ${ik.zijn} oude club, maar hief ${ik.zijn} handen verontschuldigend op. Het oude publiek gaf ${ik.hem} applaus.`; }
  else if (M.juich === 'wild'){ kop = `${sp.naam} viert feest voor neus van oude club`; tekst = `Na ${ik.zijn} goal rende ${ik.hij} juichend naar het vak van ${naam}. De supporters daar konden het niet waarderen.`; }
  else if (speelde && M.goals) { kop = `${sp.naam} scoort tegen ${ik.zijn} oude club`; tekst = `Het weerzien met ${naam} eindigde in ${stand2()}.`; }
  else if (R.ontvangst === 'ovatie' || R.ontvangst === 'applaus'){ kop = `Warm weerzien voor ${sp.naam} bij ${naam}`; tekst = `Het publiek van ${ik.zijn} oude club ontving ${ik.hem} met applaus. Uitslag: ${stand2()}.`; }
  else if (R.ontvangst === 'fluit'){ kop = `${sp.naam} uitgefloten bij weerzien met ${naam}`; tekst = `De supporters van ${ik.zijn} oude club zijn ${ik.hem} nog niet vergeten. Uitslag: ${stand2()}.`; }
  else { kop = `${wij} tegen ${naam}: weerzien voor ${sp.naam}`; tekst = `Uitslag: ${stand2()}.`; }
  M.reunieKop = {kop, tekst};
}
export function shirtRuil(){
  const M = S.M, R = M && M.reunie; if (!R || M.shirtGeruild || !M.reunieMaat) return;
  M.shirtGeruild = true; const o = oudeClubs()[ck(R.club)]; o.rel[M.reunieMaat] = clamp((o.rel[M.reunieMaat] ?? 50) + 10, 0, 100); mod('moraal', 2);
  M.shirtTekst = `Na het laatste fluitsignaal ruil je je shirt met ${M.reunieMaat}. Een knuffel, een grap over vroeger. Jullie band blijft goed.`;
}
export function vReunieEinde(M){
  if (!M.reunie) return '';
  return `${M.reunieKop ? vKrant([{bron:pick(KRANTEN[Math.min(club().t, 3)]), kop:M.reunieKop.kop, tekst:M.reunieKop.tekst}]) : ''}
    ${(() => { const imp = M.reunie.impact ?? reunieImpact(M.reunie.club), warm = M.reunie.ontvangst === 'ovatie' || M.reunie.ontvangst === 'applaus';
      if (M.reunieNa) return `<p class="melding">${esc(M.reunieNa)}</p>`;
      if (imp < 3) return '';
      return `<span class="label">Na het laatste fluitsignaal</span><div class="keuzes">${warm
        ? keuzeKnop('De oude kleedkamer in', 'moraal +4 · band met je oude teamgenoten +5', () => reunieNaKeuze('kleedkamer'), 'data-blijf') + keuzeKnop('Nog een rondje langs het oude vak', 'fans van je oude club +6 · volgers', () => reunieNaKeuze('ererondje'), 'data-blijf')
        : keuzeKnop('Je excuses aanbieden aan de oude fans', 'fans van je oude club +8', () => reunieNaKeuze('excuses'), 'data-blijf') + keuzeKnop('Meteen de tunnel in', 'focus +3 · fans van je oude club −4', () => reunieNaKeuze('negeren'), 'data-blijf')}</div>`; })()}
    ${M.reunieMaat ? (M.shirtGeruild ? `<p class="melding">${esc(M.shirtTekst)}</p>` : `<div class="rij">${knop(`Shirt ruilen met je oude maat ${esc(M.reunieMaat)}`, shirtRuil, 'klein', 'data-blijf')}</div>`) : ''}`;
}
export function vTegenOud(){
  const t = S.car.tegenOud, o = S.sp.oudeClubs || {}; if (!t || !Object.keys(t).length) return '';
  return `<div class="paneel"><span class="label">Tegen je oude clubs</span>${Object.entries(t).map(([id, x]) => `<div class="landrij"><div><b>${esc(x.n || (CLUBS[id] || {}).n || '')}</b> <span class="muted klein-tekst">· ${esc((o[id] || {}).reden || '')}</span></div><span class="niv">${x.w}W ${x.g}G ${x.v}V · ${x.goals} ${x.goals === 1 ? 'goal' : 'goals'}</span></div>`).join('')}</div>`;
}
