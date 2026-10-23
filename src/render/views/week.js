import { S, club, mod, ovr, tmp } from '../../core/state.js';
import { act, keuzeKnop, knop, tabBalk } from '../../core/ui.js';
import { clamp, esc, geldTxt } from '../../core/utils.js';
import { AANTAL_RONDES, ATTR, CLUBS, DIVS, TRAINBAAR, WINKEL, WINKEL_GROEPEN, WINTER, rondesVan, rondesVoor } from '../../data/gegevens.js';
import { BEKERS, bekerRondeNaam, bekerSchema, bekersVan } from '../../game/competitie/beker.js';
import { fixture } from '../../game/competitie/competitie.js';
import { kiesEvent } from '../../game/gebeurtenissen.js';
import { metVoorletter, vKrant } from '../../game/media/nieuws.js';
import { DIEREN, DIER_ACTIES, MAX_DIEREN, dierActie, dieren, herplaats, neemDier } from '../../game/prive/dieren.js';
import { kindActie, ouderActie, ouderCadeau, ouderVliegPrijs, ouders } from '../../game/prive/familie.js';
import { ZAKEN, geldZaken, haalSpaar, koopAandelen, spaar, startZaak, verkoopAandelen, verkoopZaak } from '../../game/prive/geld.js';
import { RING, aanzoek, geefNaam, kindLeeftijd, overKinderen, relatieEisen, samenwonen, scheidingKosten, trouwen } from '../../game/prive/gezin.js';
import { STICHTING_PRIJS, goedDoel } from '../../game/prive/goede-doelen.js';
import { DATE_PRIJS, STAPPEN_PRIJS, cadeauPrijs, datingApp, gaStappen, relatieActie, uitElkaar } from '../../game/prive/liefde.js';
import { beantwoord, spijbelen } from '../../game/prive/school.js';
import { POSTS, VOLG_ACTIES, influencerPerWeek, kledingPerWeek, post, social, volgActie, volgersTxt } from '../../game/prive/social.js';
import { koop } from '../../game/prive/sponsors.js';
import { merkenPerWeek, mijnMerken, vMerken } from '../../game/prive/merken.js';
import { OORDEEL, besteLeagues, mijnLeague, oordeel } from '../../game/speler/niveau.js';
import { landenRanking } from '../../game/competitie/landsterkte.js';
import { KAPPER, MERKEN, kanAanvragen, kanKapper, kansTxt, mijnUiterlijk, naarKapper, schoenDeal, schoenKans, vraagAan } from '../../game/prive/schoenen.js';
import { HAAR_NAAM, KAPSEL_KEUZE } from '../../data/uiterlijk.js';
import { vUitgaan } from '../../game/prive/verleidingen.js';
import { AUTOS, EXAMEN_PRIJS, RIJLES, THEORIE_PRIJS, WONINGEN, autoInfo, autoWaarde, koopAuto, praktijkExamen, rijles, startTheorie, theorieAntwoord, verhuis, verkoopWaarde, woning } from '../../game/prive/wonen-auto.js';
import { welkomTekst } from '../../game/speler/startverhaal.js';
import { verhaalActiviteiten, verhaalTitel } from '../../game/speler/verhaal.js';
import { O23_EIS, fmt1, gemiddelde } from '../../game/speler/o23.js';
import { aanvoerderActie, isAanvoerder, kleedPersonen, teamUitjePrijs } from '../../game/team/aanvoerder.js';
import { band, bandLabel, chemie, maatActie, teamKracht } from '../../game/team/kleedkamer.js';
import { tactiekOpst, verwachteOpstelling } from '../../game/team/opstelling.js';
import { netGekocht, netUitJeugd, rugTeam, stNaam, vRugnummer } from '../../game/team/rugnummers.js';
import { TACTIEKEN, TRAIN_FIT, WINT_VAN, clubTactiek, inzicht, matchup, pasScore, tactiekEig, zwaarste } from '../../game/team/tactiek.js';
import { vVertrek } from '../../game/transfers/vertrek.js';
import { vContract } from '../../game/transfers/contract.js';
import { isDerby, vFans } from '../../game/wedstrijd/fans-pers.js';
import { focusBoost, focusStaat, focusWinst } from '../../game/wedstrijd/momenten.js';
import { reunieMet, vReunie } from '../../game/wedstrijd/reunie.js';
import { simuleer, startWedstrijd, rustWeek } from '../../game/wedstrijd/wedstrijd.js';
import { simuleerSeizoen } from '../../game/seizoensim.js';
import { doeActiviteit, plafond, trainXP } from '../../game/week.js';
import { eisRij, vAgent } from './agent.js';
import { TOON, VRIEND_ACTIES, bijJou, kanVragen, vriendRolTxt, vriendClubNaam, vriendHier, vriendLand, kanUitpraten, kanVriendActie, speeltTegenVriend, vriendKlasse, vriendStats, uitpraten, vriendActie, vriendDuelAntwoord, vriendDuelVraag } from '../../game/speler/journey.js';
import { herkomstUitTmp, vHerkomstKeuze } from './start.js';
import { balk, vSeizoenStrip } from './zijbalk.js';
import { vBankVraag } from '../../game/team/bankverzoek.js';
import { vSelectie } from './selectie.js';
import { clubLogo } from '../../data/logos.js';
import { laatsteUitslagen, vormBolletjes, vormBonus, vormLabel } from '../../game/competitie/vorm.js';
import { heeft } from '../../game/speler/persoonlijkheid.js';
import { voorDuelAntwoord, voorDuelVraag, RIVAAL_ACTIES, actiefRivaal, bandLabel as rivaalBand, doeRivaalActie, kanRivaalActie, raceStand, rivaal, rivaalNaam, rivaalPrikkel, rivaalSpeler, rivaalStats, speeltTegenRivaal, volgendDuel } from '../../game/speler/rivaal.js';
import { PERS } from '../../game/speler/persoonlijkheid.js';
import { fmtPunt, goudenBalStand } from '../../game/seizoen/gouden-bal.js';
import { BUITENLAND_ACTIES, TAAL, doeBuitenlandActie, inBuitenland, kanBuitenlandActie, lesPrijs, taalLabel, taalNiveau, taalStraf, vluchtPrijs } from '../../game/prive/buitenland-leven.js';

// Het weekscherm is een hub met tabbladen; elke nieuwe week begint op "Deze week"
const WEEK_TABS = [['week', 'Deze week'], ['team', 'Team'], ['carriere', 'Carrière'], ['prive', 'Privé'], ['winkel', 'Winkel']];
export function vWeek(){
  const w = S.week, sleutel = `${S.jaar}-${S.ronde}`;
  if (tmp.weekSleutel !== sleutel){ tmp.weekSleutel = sleutel; tmp.weekTab = 'week'; }
  const tab = WEEK_TABS.some(([k]) => k === tmp.weekTab) ? tmp.weekTab : 'week';
  const badges = {
    week: !w.gedaan || (w.school && !w.school.klaar) || S.sp.geboorte ? '!' : '',
    team: teamOpen() || '',
    prive: w.theorie && !w.theorie.klaar ? '!' : '',
  };
  const inhoud = {week:vDezeWeek, team:vTeamTab, carriere:vCarriereTab, prive:vBuiten, winkel:vWinkel}[tab]();
  return tabBalk(WEEK_TABS.map(([k, l]) => [k, l, k === tab ? '' : badges[k]]), tab, k => { tmp.weekTab = k; }) + `<div class="hubinhoud" role="tabpanel">${inhoud}</div>`;
}
// Hoeveel teamacties zijn er deze week nog over?
function teamOpen(){
  const sp = S.sp, w = S.week; if (sp.o23) return 0;
  return (w.maat ? 0 : 1) + (isAanvoerder() && !kleedPersonen().aanv ? 1 : 0);
}

// Het interview in de week van het duel met je rivaal (niet verplicht)
// Zondag tegen je beste vriend (bij een andere club): hij appt je, jij antwoordt met een toon
// Jij tegen je jeugdvriend: klasse, club, dit seizoen en de hele carrière (groen = de beste)
function vVriendVergelijk(){
  const sp = S.sp, v = sp.vriend, vn = v.voornaam, st = vriendStats(), C = v.carriere || {g:0, a:0}, jk = ovr(sp), hk = vriendKlasse() || 0;
  const rv = v.weg && sp.rivaal && sp.rivaal.exVriend, clNaam = rv ? (CLUBS[sp.rivaal.club] || {}).n : vriendClubNaam();
  const jij = {k:jk, g:S.ss.g || 0, a:S.ss.a || 0, cg:S.car.g || 0, ca:S.car.a || 0}, al = v.carriereJaar === S.jaar, hij = {k:hk, g:st.g, a:st.a, cg:C.g + (al ? 0 : st.g), ca:C.a + (al ? 0 : st.a), ic:(v.int && v.int.caps) || 0};
  jij.ic = Object.values(S.car.int || {}).reduce((t, x) => t + (x.caps || 0), 0); // (na het seizoensein zitten zijn cijfers al in zijn carrière)
  const cel = (x, y) => `<td class="${x > y ? 'goedtxt' : ''}"><b>${x}</b></td>`, rij = (l, k) => `<tr><td class="muted">${l}</td>${cel(jij[k], hij[k])}${cel(hij[k], jij[k])}</tr>`;
  const hoofd = sp.pos === 'SPITS' ? 'g' : 'a', w = hoofd === 'g' ? 'goals' : 'assists';
  const zin = jij[hoofd] > hij[hoofd] ? `Dit seizoen heb jij meer ${w} dan ${vn}.` : jij[hoofd] < hij[hoofd] ? `${vn} heeft dit seizoen meer ${w} dan jij.` : `Jullie staan gelijk in ${w}.`;
  return `<span class="label winkelkop">Jij tegen ${esc(vn)}</span>
    <table class="tabel vergelijk"><thead><tr><th></th><th>Jij</th><th>${esc(vn)}</th></tr></thead><tbody>
      ${rij('Klasse', 'k')}
      <tr><td class="muted">Club</td><td>${esc(club().n)}${sp.o23 ? ' O23' : ''}</td><td>${clNaam ? esc(clNaam) + (v.o23 && !rv ? ' O23' : '') + (!rv && !vriendHier() ? ` (${esc(vriendLand())})` : '') : '–'}</td></tr>
      ${rij('Goals dit seizoen', 'g')}${rij('Assists dit seizoen', 'a')}${rij('Goals carrière', 'cg')}${rij('Assists carrière', 'ca')}${jij.ic || hij.ic ? rij('Interlands', 'ic') : ''}
    </tbody></table><p class="muted klein-tekst">${esc(zin)} ${jk > hk ? 'Jij bent de betere speler (klasse).' : jk < hk ? `${esc(vn)} is nu nog beter (klasse).` : 'Jullie zijn even goed.'}</p>
    ${(v.hist || []).length ? `<details class="paneel"><summary class="label">Vorige seizoenen</summary>${v.hist.slice().reverse().map(h => `<p class="muted klein-tekst">${esc(h)}</p>`).join('')}</details>` : ''}`;
}
function vVriendInterview(fx){
  if (!fx || !speeltTegenVriend(fx.opp)) return '';
  const P = vriendDuelVraag(); if (!P) return '';
  const kop = `<span class="label">Zondag tegen je beste vriend ${esc(S.sp.vriend.voornaam)} 🤝</span>`;
  if (P.klaar) return `<div class="paneel">${kop}<p class="muted">${esc(S.sp.vriend.voornaam)}: ${esc(P.vraag)}</p><p><b>Jij:</b> ${esc(P.opts[P.keuze].l)}</p><p class="melding">${esc(P.uit)}</p></div>`;
  return `<div class="paneel">${kop}<p>${esc(S.sp.vriend.voornaam)} appt je: <b>${esc(P.vraag)}</b></p>
    <div class="keuzes">${P.opts.map((o, i) => keuzeKnop(`${TOON[o.toon].i} ${esc(o.l)}`, `${TOON[o.toon].n} · ${o.e}`, () => vriendDuelAntwoord(i), 'data-blijf')).join('')}</div>
    <p class="muted klein-tekst">Je hoeft niet te antwoorden.</p></div>`;
}
function vRivaalInterview(fx){
  if (!fx || S.sp.o23 || !speeltTegenRivaal(fx.opp)) return '';
  const P = voorDuelVraag(); if (!P) return '';
  const kop = `<span class="label">Interview voor het duel met ${esc(rivaalNaam())}</span>`;
  if (P.klaar) return `<div class="paneel">${kop}<p class="muted">"${esc(P.vraag)}"</p><p><b>Jij:</b> ${esc(P.opts[P.keuze].t)}</p><p class="melding">${esc(P.uit)}</p></div>`;
  return `<div class="paneel" id="rivaalInterview">${kop}<p>Een verslaggever wacht je op na de training: <b>"${esc(P.vraag)}"</b></p>
    <div class="keuzes">${P.opts.map((o, i) => keuzeKnop(o.l, `${esc(o.t)} · ${o.e}`, () => voorDuelAntwoord(i), 'data-blijf')).join('')}</div>
    <p class="muted klein-tekst">Je hoeft niet te antwoorden.</p></div>`;
}
// Een week zonder competitiewedstrijd voor jouw league (een kortere league dan de andere van je land)
function vSpeelvrij(){
  const c = club(), t = c.t, ander = t === 1 ? 2 : 1;
  return `<div class="vooruit"><span class="label">Speelvrije week · ${rondesVoor(t, S.ronde)} van ${rondesVan(t)} wedstrijden gespeeld</span>
    <p>De ${esc(DIVS[t])} heeft deze week geen speelronde (de ${esc(DIVS[ander])} speelt wel: die heeft meer clubs). Train goed, rust uit of doe iets leuks.</p></div>`;
}
function vVooruitblik(fx, opp, vo){
  const sp = S.sp, c = club(), wij = sp.o23 ? `${c.n} O23` : c.n, zij = sp.o23 ? `${opp.n} O23` : opp.n;
  const aandeel = Math.round(clamp(c.s / (c.s + opp.s), .1, .9) * 100);
  const tags = [fx.thuis ? '<span class="tag">Thuis</span>' : '<span class="tag">Uit</span>', reunieMet(fx.opp) ? '<span class="tag twee">Je oude club!</span>' : '', isDerby(fx.opp) ? '<span class="tag teveel">Derby tegen je aartsrivaal</span>' : '', speeltTegenRivaal(fx.opp) ? `<span class="tag teveel">Je rivaal ${esc(rivaalNaam())} speelt mee</span>` : ''];
  // Wie is favoriet? Jullie kracht (met jou, de sfeer en de tactiek) tegen die van de tegenstander
  if (!sp.o23){ const T = teamKracht(c.s, {speelt:true, thuis:fx.thuis, tactiek:matchup(clubTactiek(sp.club), clubTactiek(fx.opp))}), O = opp.s + (fx.thuis ? 0 : 2) + vormBonus(fx.opp), d = T - O;
    tags.unshift(d <= -3 ? '<span class="tag teveel">Jullie zijn de underdog</span>' : d >= 3 ? '<span class="tag omhoog">Jullie zijn favoriet</span>' : '<span class="tag">Gelijkwaardig</span>'); }
  { const rs = actiefRivaal() ? raceStand() : null; if (rs) tags.push(`<span class="tag ${rs.verschil > 0 ? 'omhoog' : rs.verschil < 0 ? 'teveel' : ''}">Race met ${esc(rivaalNaam())}: jij ${rs.jij}, hij ${rs.hij} ${rs.woord}</span>`); }
  for (const k of bekersVan(sp.club)){ const b = S.ss.bekers[k]; if (b && b.levend.includes(sp.club) && b.winnaar === null && bekerSchema(k)[b.rondes.length] === S.ronde + 1) tags.push(`<span class="tag omhoog">Daarna: ${esc(BEKERS[k].naam)}, ${esc(bekerRondeNaam(k, b.rondes.length).toLowerCase())}</span>`); }
  return `<div class="vooruit">
    <span class="label">Wedstrijd ${rondesVoor(c.t, S.ronde) + 1} van ${rondesVan(c.t)}${sp.o23 ? ` · het 1e elftal speelt ${fx.thuis ? 'thuis' : 'uit'} tegen ${esc(opp.n)}` : ''}</span>
    <div class="vs"><div class="ploeg ${fx.thuis ? 'mij' : ''}">${clubLogo(fx.thuis ? sp.club : fx.opp, 40)}<b>${esc(fx.thuis ? wij : zij)}</b></div><span class="vsteken">vs</span><div class="ploeg r ${fx.thuis ? '' : 'mij'}"><b>${esc(fx.thuis ? zij : wij)}</b>${clubLogo(fx.thuis ? fx.opp : sp.club, 40)}</div></div>
    <div class="kracht" title="Sterkte ${c.s} tegen ${opp.s}"><span class="niv">${esc(c.n)} ${c.s}</span><span class="krachtbalk"><i style="width:${aandeel}%"></i></span><span class="niv">${opp.s} ${esc(opp.n)}</span></div>
    ${sp.o23 ? '' : vVormDuel(fx)}
    ${vTactiekDuel(fx.opp)}
    <div class="rij">${tags.filter(Boolean).join('')}</div>
    <p class="opst"><span class="label">Verwachte opstelling</span><span class="risico ${vo.cls}">${vo.k}</span><span class="muted">${esc(vo.reden)}</span></p>
    ${vBankVraag()}
  </div>`;
}

// Teamvorm van beide ploegen: de laatste 5 uitslagen
function vVormDuel(fx){
  const een = id => { const [l, cls] = vormLabel(id); return `<span class="vormploeg">${vormBolletjes(id)}<span class="risico ${cls}">${l}</span></span>`; };
  const [a, b] = fx.thuis ? [S.sp.club, fx.opp] : [fx.opp, S.sp.club];
  if (!laatsteUitslagen(a).length && !laatsteUitslagen(b).length) return ''; // begin van het seizoen: nog geen vorm
  return `<p class="opst vormduel"><span class="label">Vorm</span>${een(a)}<span class="muted">tegen</span>${een(b)}</p>`;
}
// Welke stijl speelt de tegenstander, en ligt die jullie?
function vTactiekDuel(opp){
  const wij = clubTactiek(S.sp.club), zij = clubTactiek(opp), m = matchup(wij, zij);
  const tag = m > 0 ? `<span class="tag omhoog">Jullie stijl werkt goed tegen ${TACTIEKEN[zij].n.toLowerCase()}</span>` : m < 0 ? `<span class="tag teveel">Lastig: ${TACTIEKEN[zij].n.toLowerCase()} werkt goed tegen jullie stijl</span>` : '';
  return `<p class="opst"><span class="label">Tactiek</span><b>${TACTIEKEN[wij].n}</b><span class="muted">tegen</span><b>${TACTIEKEN[zij].n}</b>${tag}</p>`;
}
function vTactiek(){
  const sp = S.sp; if (sp.o23) return '';
  const id = clubTactiek(sp.club), T = TACTIEKEN[id], p = pasScore(id), op = Math.round(tactiekOpst());
  const sterk = TACTIEKEN[WINT_VAN[id]].n.toLowerCase(), zwak = TACTIEKEN[Object.keys(WINT_VAN).find(k => WINT_VAN[k] === id)].n.toLowerCase();
  return `<section id="tactiekPanel" class="paneel sectie"><h3 class="sectiekop">Tactiek van de trainer · ${T.n} <span class="niv">je past ${p >= 65 ? 'heel goed' : p >= 50 ? 'goed' : p >= 35 ? 'matig' : 'nog slecht'} in het systeem</span></h3>
    <p class="muted klein-tekst">${T.d} Hier telt vooral je ${zwaarste(id).join(' en ')}. Werkt goed tegen ${sterk}, maar heeft moeite met ${zwak}.</p>
    <div class="balken breed">${balk('Past bij jou', p, 'st')}${balk('Eigenschappen', tactiekEig(id))}${balk('Inzicht', inzicht(id))}</div>
    <p class="muted klein-tekst">Hoe beter je past, hoe sneller je in de basis staat (nu ${op > 0 ? '+' : ''}${op}) en hoe vaker je acties lukken. Train je inzicht met <b>Tactiektraining</b> bij Deze week. Elke wedstrijd die je speelt levert ook inzicht op.</p></section>`;
}

// Een kleine tip op de activiteit die nu het meest helpt (alleen een hint, verandert niets aan de regels)
function advies(){
  const sp = S.sp, f = sp.focus ?? 65;
  if (sp.fit < 45) return 'rust';
  if (f < 35) return 'mentaal';
  if (sp.vert < 30) return 'trainer';
  if (sp.moraal < 35) return 'uit';
  if (!sp.o23 && pasScore() < 35) return 'tactiek';
  return null;
}
function activiteit(id, t, s, fn, extra = ''){
  const tip = advies() === id ? ' <span class="tip">Aanbevolen</span>' : '';
  return keuzeKnop(t + tip, s, fn, extra);
}
function vActiviteiten(){
  const sp = S.sp, fitKost = sp.items.fitness ? 5 : 8;
  const tid = clubTactiek(sp.club), iz = inzicht(tid);
  const train = TRAINBAAR.map(k => keuzeKnop(`Train ${ATTR[k].toLowerCase()}`, `<span class="mini"><i style="width:${clamp(sp.a[k], 0, 100)}%"></i></span> ${sp.a[k]} · ${sp.a[k] >= plafond() ? 'plafond bereikt (groeit met sterke wedstrijden)' : `fitheid −${fitKost} · voortgang ${Math.round(trainXP(k) * 100)}% naar +1`}`, () => doeActiviteit('train', k))).join('')
    + activiteit('tactiek', `Tactiek: ${TACTIEKEN[tid].n.toLowerCase()}`, `<span class="mini"><i style="width:${iz}%"></i></span> inzicht ${iz} · fitheid −${TRAIN_FIT}`, () => doeActiviteit('tactiek'));
  const extra = heeft('voetbalgek') ? activiteit('extra', '⚽ Extra trainen na de training', 'Kans op +1 bij je zwakste eigenschap · vertrouwen +1 · fitheid −6', () => doeActiviteit('extra')) : '';
  const herstel = activiteit('rust', 'Rustig aan', `Fitheid +22 · focus +${focusWinst(8)} · vorm iets beter`, () => doeActiviteit('rust'))
    + activiteit('mentaal', 'Mentale training', `Focus +${focusWinst(12)} · fitheid +4 · geen training`, () => doeActiviteit('mentaal'))
    + activiteit('video', 'Videoanalyse', `Focus +${focusWinst(7)} · vertrouwen +4 · fitheid −2`, () => doeActiviteit('video'));
  const sociaal = activiteit('trainer', 'Indruk maken op trainer', 'Vertrouwen +7 · fitheid −12', () => doeActiviteit('trainer'))
    + (sp.leeftijd < 18 && sp.ouders.boos ? keuzeKnop('Afspreken met vrienden', 'Mag niet van je ouders', () => {}, 'disabled') : activiteit('uit', sp.leeftijd < 18 ? 'Afspreken met vrienden' : 'Avondje uit', 'Moraal +10 · focus −3 · kans op gedoe', () => doeActiviteit('uit')))
    + (sp.leeftijd < 18 ? keuzeKnop('Huiswerk maken', sp.ouders.boos ? 'Focus +6 · je ouders en de onderwijscoach van de club zijn tevreden' : 'Focus +6 · beter voorbereid op school', () => doeActiviteit('huiswerk')) : '');
  const va = verhaalActiviteiten(), verhaal = va.length ? `<div class="actgroep verhaal"><span class="label">Jouw verhaal · ${esc(verhaalTitel(sp))}</span><div class="keuzes">${va.map(a => keuzeKnop(a.l, a.s, () => doeActiviteit(a.id))).join('')}</div></div>` : '';
  return `<section class="activiteiten"><h3 class="sectiekop">Wat doe je deze week? <span class="niv">1 keuze</span></h3>
    <div class="actgroepen">
    <div class="actgroep"><span class="label">Trainen</span><div class="keuzes">${train}${extra}</div></div>
    <div class="actgroep"><span class="label">Herstel en mentaal</span><div class="keuzes">${herstel}</div></div>
    <div class="actgroep"><span class="label">Club en sociaal</span><div class="keuzes">${sociaal}</div></div>${verhaal}</div></section>`;
}

function vDezeWeek(){
  const sp = S.sp, w = S.week, fx = fixture(S.ronde), opp = fx ? CLUBS[fx.opp] : null;
  const eersteKeer = S.ronde === 0 && S.car.wed === 0;
  const vo = sp.o23 && sp.blessure <= 0 && !(sp.geschorst > 0) ? {k:'O23 · basis', cls:'r-gem', reden:'Je speelt bij de O23 tot de trainer je terughaalt.'} : verwachteOpstelling();
  let html = vSeizoenStrip() + `<div class="verhaal"><span class="label">Week ${S.ronde + 1} van ${AANTAL_RONDES} · ${S.ronde === 0 ? 'Nieuw seizoen' : S.ronde === WINTER ? 'Na de winterstop' : 'Trainingsweek'}</span>
    ${S.ronde === 0 ? `<h2>${eersteKeer ? `Welkom bij ${esc(club().n)}` : 'Nieuw seizoen'}</h2>` : ''}`;
  if (eersteKeer) html += `<p>${esc(welkomTekst(sp))}</p>`;
  else if (S.ronde === 0) html += `<p>Een nieuw seizoen bij ${esc(club().n)} in de ${DIVS[club().t]}. Alles begint weer bij nul.</p>`;
  html += `</div>` + (fx ? vVooruitblik(fx, opp, vo) : vSpeelvrij()) + vRivaalInterview(fx) + vVriendInterview(fx);
  html += fx ? vReunie() : '';
  if (sp.o23){ const c = sp.o23.cijfers; html += `<div class="paneel"><span class="label">Bij de O23</span><p>${O23_EIS}</p><p class="muted">${c.length ? 'Je cijfers bij de O23: ' + c.map(fmt1).join(' · ') : 'Je hebt nog geen wedstrijd gespeeld bij de O23.'}</p></div>`; }
  if (sp.huur){ const c = sp.huur.cijfers; html += `<div class="paneel"><span class="label">Op huurbasis tot de zomer</span><p>Je speelt bij ${esc(club().n)} en gaat in de zomer terug naar ${esc(CLUBS[sp.huur.ouder].n)}. Hoe beter je hier speelt, hoe beter je plek daar. Gemiddeld een 7,0 of hoger en ze rekenen op je.</p><p class="muted">${c.length ? `Gemiddeld cijfer hier: ${fmt1(gemiddelde(c))} (${c.length} ${c.length === 1 ? 'wedstrijd' : 'wedstrijden'})` : 'Je hebt hier nog niet gespeeld.'}</p></div>`; }
  if (!sp.herkomst) html += `<div class="paneel"><span class="label">Nieuw: interlands</span><p>Uit welke landen kom je? Daarmee bepaal je voor welke landen je later interlands kunt spelen.</p>${vHerkomstKeuze()}<div>${knop('Opslaan', () => { sp.herkomst = herkomstUitTmp(); }, 'hoofd middel', 'data-blijf')}</div></div>`;
  if (w.tekst.length) html += `<div class="verhaal">${w.tekst.map(t => `<p class="moment">${esc(t)}</p>`).join('')}</div>`;
  if (S.krantWacht && S.krantWacht.length) html += vKrant(S.krantWacht);
  if (sp.geboorte) html += `<div class="kampioen"><span class="label">Je bent vader!</span><h2>Het is een ${sp.geboorte.jongen ? 'jongen' : 'meisje'}</h2><p>Hoe ga je ${sp.geboorte.jongen ? 'hem' : 'haar'} noemen?</p><div class="keuzes">${sp.geboorte.opties.map(n => keuzeKnop(esc(n), '', () => geefNaam(n), 'data-blijf')).join('')}</div></div>`;
  if (sp.leeftijd < 18 && sp.ouders.boos && !w.huiswerk) html += `<p class="melding">Je ouders zijn boos om je cijfers, en de onderwijscoach van ${esc(club().n)} kijkt mee. Maak je deze week huiswerk, dan is de club tevreden. Anders hoort de trainer het en kost het je vertrouwen.</p>`;
  html += vSchool();
  // Stap 1: activiteit kiezen · stap 2 (optioneel): iets voor je focus · stap 3: spelen
  let cta;
  if (!w.gedaan){
    html += sp.blessure > 0 ? `<section class="activiteiten"><h3 class="sectiekop">Je bent geblesseerd</h3><div class="keuzes">${keuzeKnop('Revalideren', 'Fitheid +20', () => doeActiviteit('revalidatie'))}</div></section>` : vActiviteiten();
    cta = `<span class="muted">Kies eerst wat je deze week doet.</span>` + (sp.clubloos || (fx && isDerby(fx.opp)) ? '' : knop('⏭ Rest van het seizoen simuleren', simuleerSeizoen, 'hoofd tweede'));
  } else if (sp.geboorte) cta = `<span class="muted">Kies eerst een naam voor je kindje.</span>`;
  else if (w.school && !w.school.klaar) cta = `<span class="muted">Maak eerst je schoolwerk af, daarna kun je spelen.</span>`;
  else if (!fx) cta = knop('Speelvrije week · verder', rustWeek);
  else cta = knop(sp.o23 && sp.blessure <= 0 && sp.fit >= 20 ? `Speel met de O23 tegen ${esc(opp.n)} O23` : `Speel ronde ${S.ronde + 1}: ${fx.thuis ? esc(club().n) + ' – ' + esc(opp.n) : esc(opp.n) + ' – ' + esc(club().n)}`, startWedstrijd) + knop('⏩ Simuleren', () => { startWedstrijd(); simuleer(); }, 'hoofd tweede') + (isDerby(fx.opp) ? '' : knop('⏭ Rest van het seizoen simuleren', simuleerSeizoen, 'hoofd tweede')); // (een derby speel je zelf)
  html += vFocusExtra();
  const rest = teamOpen();
  html += `<div class="ctabalk">${cta}${w.gedaan && rest ? `<span class="niv">Nog ${rest} ${rest === 1 ? 'teamactie' : 'teamacties'} open bij <b>Team</b></span>` : ''}</div>`;
  return html;
}

function vTeamTab(){
  const h = vSelectie() + vTactiek() + vAanvoerder() + vKleedkamer() + vFans();
  return h || `<p class="muted">Bij de O23 heb je geen eigen kleedkamer. Bewijs jezelf eerst.</p>`;
}
function vCarriereTab(){
  return vNiveau() + vGoudenBal() + vRivaal() + vAgent() + vContract() + vVertrek();
}
// Jouw niveau: te goed of te slecht voor je competitie, en welke leagues het beste bij je passen (niveau.js)
function vNiveau(){
  const sp = S.sp, o = ovr(sp), M = mijnLeague(), best = besteLeagues(o), bereik = L => `${L.bodem}–${L.top}, gemiddeld ${L.gem}`;
  const rij = L => { const od = OORDEEL[oordeel(o, L)], nu = M && L.land === M.land && L.t === M.t;
    return `<tr class="${nu ? 'mij' : ''}"><td>${esc(L.naam)} <span class="muted klein-tekst">(${esc(L.land)})</span></td><td class="muted klein-tekst">${bereik(L)}</td><td><span class="risico ${od.cls}">${od.n}</span></td></tr>`; };
  const alle = best.slice().sort((a, b) => b.gem - a.gem);
  return `<div class="paneel"><span class="label">Jouw niveau</span>
    ${M ? `<p>Je bent klasse <b>${o}</b>. In de ${esc(M.naam)} (${bereik(M)}) ben je <span class="risico ${OORDEEL[M.oordeel].cls}">${OORDEEL[M.oordeel].n.toLowerCase()}</span>: ${OORDEEL[M.oordeel].d}.</p>` : `<p>Je bent klasse <b>${o}</b>.</p>`}
    <span class="label">Past het best bij jou</span>
    ${best.slice(0, 3).map(L => `<p>${M && L.land === M.land && L.t === M.t ? '✓ ' : ''}<b>${esc(L.naam)}</b> <span class="muted">(${esc(L.land)}, ${bereik(L)})</span></p>`).join('')}
    ${M && M.oordeel === 'tegoed' ? '<p class="muted klein-tekst">Te goed voor je league? In de zomer melden zich vaak clubs, ook uit het buitenland. Je zaakwaarnemer kan ook een droomclub voor je zoeken.</p>' : M && M.oordeel === 'tehoog' ? '<p class="muted klein-tekst">Te hoog gegrepen? Een verhuur of een stap terug geeft je speeltijd om te groeien.</p>' : ''}
    <details><summary class="label" style="cursor:pointer">Alle competities (${alle.length})</summary><table class="tabel">${alle.map(rij).join('')}</table></details>${vLandenRanking()}</div>`;
}
// De landenranking: het gemiddelde van de hoogste competitie per land, en de verandering sinds vorig seizoen (landsterkte.js)
function vLandenRanking(){
  const R = S.landRank, vorig = R && R.vorig, thuis = S.land || 'Nederland';
  const pijl = x => { const v = vorig && vorig.find(y => y.land === x.land); if (!v) return ''; const d = v.plek - x.plek, g = x.gem - v.gem;
    return `${d > 0 ? `<span class="omhoog">▲${d}</span>` : d < 0 ? `<span class="omlaag">▼${-d}</span>` : '<span class="muted">=</span>'} <span class="muted klein-tekst">(${g > 0 ? '+' : ''}${g})</span>`; };
  return `<span class="label">Landenranking</span><table class="tabel">${landenRanking().map(x => `<tr class="${x.land === thuis ? 'mij' : ''}"><td>${x.plek}.</td><td>${esc(x.land)}</td><td>${x.gem}</td><td>${pijl(x)}</td></tr>`).join('')}</table>
    <p class="muted klein-tekst">Gemiddelde sterkte van de clubs in de hoogste competitie. Clubs worden elk seizoen sterker of zwakker, dus de ranking verandert mee.</p>`;
}
// De opbouw van je Gouden Bal-punten (ook in het eindscherm)
export function vGbOpbouw(O, titel){
  if (!O) return '';
  return `<span class="label">${titel}</span><table class="gbopbouw">${O.rij.map(r => `<tr><td>${esc(r.l)}</td><td class="${r.v < 0 ? 'omlaag' : r.v > 0 ? 'omhoog' : 'muted'}">${fmtPunt(r.v)}</td></tr>`).join('')}
    ${O.f < 1 ? `<tr><td class="muted" colspan="2">Op dit niveau telt alles × ${String(O.f).replace('.', ',')} (in de hoogste competitie × 1)</td></tr>` : ''}
    <tr class="totaal"><td>Totaal</td><td>${O.totaal}</td></tr></table>`;
}
// De Gouden Bal-race: hoe sta je ervoor tegen de wereldsterren, en wat moet je doen om te winnen?
function vGoudenBal(){
  const sp = S.sp; if (sp.o23 || S.trainer) return '';
  const G = goudenBalStand(), top = G.lijst.slice(0, 6), jij = G.lijst.find(x => x.jij), inTop = top.includes(jij);
  const rij = (x, i) => `<li class="${x.jij ? 'mij' : ''}"><span>${i + 1}. ${esc(x.naam)} <span class="muted">· ${esc(x.club)}</span></span><b>${x.score}</b></li>`;
  return `<section id="goudenBalPanel" class="paneel sectie"><h3 class="sectiekop">Gouden Bal-race <span class="niv">verwachting · jij ${G.plek}e van ${G.lijst.length}</span></h3>
    <p class="muted klein-tekst">Punten als het seizoen zo doorgaat (jouw goals en assists doorgerekend: ${G.prognose.g} goals, ${G.prognose.a} assists). De sterren scoren aan het einde nog wat hoger of lager.</p>
    <ol class="gb gbrace">${top.map(rij).join('')}${inTop ? '' : `<li class="mij"><span>${G.plek}. ${esc(jij.naam)} <span class="muted">· ${esc(jij.club)}</span></span><b>${jij.score}</b></li>`}</ol>
    <p>${G.plek === 1 ? 'Je staat bovenaan! Houd dit vol.' : `Je hebt nog ongeveer <b>${G.gat} punten</b> nodig om ${esc(G.top.naam)} in te halen.`}</p>
    ${vGbOpbouw(G.onderdelen, 'Zo komen jouw punten tot stand')}
    ${G.delta !== null && G.delta !== undefined ? `<p class="${G.delta < 0 ? 'fouttxt' : G.delta > 0 ? 'goedtxt' : 'muted'}">Sinds vorige week: ${G.delta > 0 ? '↑' : G.delta < 0 ? '↓' : '='}${Math.abs(G.delta)} ${Math.abs(G.delta) === 1 ? 'punt' : 'punten'}${G.verschil.length ? '' : '.'}</p>${G.verschil.length ? `<ul class="tips">${G.verschil.map(v => `<li><b class="${v.d < 0 ? 'omlaag' : 'omhoog'}">${esc(v.l)} ${fmtPunt(v.d)}</b>${v.waarom ? `: ${esc(v.waarom)}` : ''}</li>`).join('')}</ul>` : ''}` : ''}
    <span class="label">Wat levert punten op?</span><ul class="tips">${G.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>`;
}
// Je vaste rivaal: wie hij is, hoe jullie band is, de race, het volgende duel en wat je met hem kunt doen
function vRivaal(){
  const R = rivaal(); if (!R) return '';
  const r = rivaalSpeler(), st = rivaalStats(), sp = S.sp, ik = ovr(sp), p = PERS[R.karakter];
  if (R.gestopt) return `<section class="paneel sectie rivaal"><h3 class="sectiekop">Je rivaal · ${esc(rivaalNaam())}</h3><p class="muted">Hij is gestopt met voetballen. Onderling: ${R.onderling.w} zeges, ${R.onderling.g} gelijk, ${R.onderling.v} nederlagen.</p></section>`;
  const rs = raceStand(), d = volgendDuel(), band = R.band ?? -20, bandPct = (band + 100) / 2;
  const status = [R.blessure > 0 ? `<span class="tag teveel">Geblesseerd · nog ${R.blessure} wk</span>` : '', R.voorbereid ? '<span class="tag omhoog">Voorbereid op het duel</span>' : '', R.uitgedaagd ? '<span class="tag teveel">Uitgedaagd: het volgende duel telt dubbel</span>' : ''].join('');
  const race = rs ? `<div class="race"><span class="label">Race om de meeste ${rs.woord}</span><div class="rij" style="justify-content:space-between"><b>Jij ${rs.jij}</b><span class="${rs.verschil > 0 ? 'omhoog' : rs.verschil < 0 ? 'omlaag' : 'muted'}">${rs.verschil > 0 ? `jij staat ${rs.verschil} voor` : rs.verschil < 0 ? `hij staat ${-rs.verschil} voor` : 'gelijk'}</span><b>${esc(rivaalNaam())} ${rs.hij}</b></div>${rivaalPrikkel() ? '<p class="muted klein-tekst">Hij jaagt je op: je traint feller (meer kans op groei).</p>' : ''}</div>` : '';
  const acties = kanRivaalActie() ? `<div class="keuzes">${Object.entries(RIVAAL_ACTIES).map(([id, x]) => keuzeKnop(x.n, x.s, () => doeRivaalActie(id), 'data-blijf')).join('')}</div>`
    : actiefRivaal() && !sp.clubloos ? `<p class="muted klein-tekst">${S.week && S.week.rivaalActie ? 'Je hebt deze week al iets met je rivaal gedaan.' : ''}</p>` : '';
  return `<section id="rivaalPanel" class="paneel sectie rivaal"><h3 class="sectiekop">Je rivaal · ${esc(rivaalNaam())} <span class="niv">${esc(rivaalBand(band))}</span></h3>
    <p class="muted">${esc(R.achtergrond)}${p ? ` Hij is een ${p.i} ${p.n.toLowerCase()}.` : ''}</p>
    ${status ? `<div class="rij">${status}</div>` : ''}
    <div class="balk st"><span>Jullie band</span><span class="b"><i style="width:${bandPct}%"></i></span><span class="v">${esc(rivaalBand(band))}</span></div>
    ${race}
    <div class="feiten"><div><span class="label">Club</span><b>${r ? `${clubLogo(r.id, 16)} ${esc(CLUBS[r.id].n)}${r.id === sp.club ? ' (jouw club!)' : ''}` : '–'}</b></div><div><span class="label">Leeftijd</span><b>${R.lft}</b></div>
      <div><span class="label">Klasse</span><b>${R.k}${R.kVorig != null && R.k !== R.kVorig ? ` <span class="${R.k > R.kVorig ? 'omhoog' : 'omlaag'}">${R.k > R.kVorig ? '↑' : '↓'}${Math.abs(R.k - R.kVorig)}</span>` : ''} <span class="muted">(jij ${ik})</span></b>${ik - R.k >= 6 ? '<span class="muted klein-tekst">Je loopt op hem uit</span>' : R.k - ik >= 6 ? '<span class="muted klein-tekst">Hij is je ver vooruit</span>' : ''}</div><div><span class="label">Dit seizoen</span><b>${st.g} G · ${st.a} A <span class="muted">(jij ${S.ss.g || 0} G · ${S.ss.a || 0} A)</span></b></div>
      <div><span class="label">Onderling</span><b>${R.onderling.w}W ${R.onderling.g}G ${R.onderling.v}V</b></div><div><span class="label">Cijferduels</span><b>${R.cijferDuels ? `${R.cijferDuels.w} gewonnen · ${R.cijferDuels.v} verloren` : '–'}</b></div><div><span class="label">Volgende duel</span><b>${d ? `week ${d.ronde + 1} · ${d.thuis ? 'thuis' : 'uit'}` : '–'}</b></div></div>
    ${acties ? `<span class="label">Wat doe je met je rivaal? <span class="niv">1 keer per week</span></span>${acties}` : ''}
    ${R.hist.length ? `<p class="muted klein-tekst">Vorige seizoenen: ${R.hist.slice(-4).map(esc).join(' · ')}</p>` : ''}</section>`;
}
function vWinkel(){
  const sp = S.sp;
  const item = it => `<div class="winkelitem ${sp.items[it.id] ? 'bezit' : ''}"><b>${it.n}</b><span class="muted klein-tekst">${it.d}</span>${sp.items[it.id] ? '<span class="tag omhoog">In bezit</span>' : knop(`Koop · ${geldTxt(it.prijs)}`, () => koop(it.id), 'klein', `data-blijf ${sp.geld < it.prijs ? 'disabled' : ''}`)}</div>`;
  return `<section id="winkelPanel" class="paneel sectie"><h3 class="sectiekop">Winkel <span class="niv">je hebt ${geldTxt(sp.geld)}</span></h3>
    ${WINKEL_GROEPEN.map(g => `<span class="label winkelkop">${g}</span><div class="winkelgrid">${WINKEL.filter(it => it.g === g).map(item).join('')}</div>`).join('')}</section>`;
}
export const PSYCHOLOOG = 150;
export const FOCUS_EXTRA = [
  {id:'slaap',    l:'Vroeg naar bed',             n:4, d:'fitheid +3',              f(){ const n = focusBoost(4); mod('fit', 3); return `Om half tien lig je erin. Je wordt fris wakker. Focus +${n}.`; }},
  {id:'telefoon', l:'Een avond zonder telefoon',  n:5, d:'moraal −1',               f(){ const n = focusBoost(5); mod('moraal', -1); return `Je legt je telefoon in een la. Even saai, maar je hoofd wordt rustig. Focus +${n}.`; }},
  {id:'wandelen', l:'Wandelen in de natuur',      n:4, d:'moraal +2',               f(){ const n = focusBoost(4); mod('moraal', 2); return `Je loopt een uur door het bos. Geen voetbal, geen telefoon. Focus +${n}.`; }},
  {id:'yoga',     l:'Yogales',                    n:6, d:'fitheid +2', prijs:25, f(){ const n = focusBoost(6); mod('fit', 2); return `Je teamgenoten lachen erom, maar je voelt je soepel en rustig. Focus +${n}.`; }},
  {id:'koken',    l:'Gezond koken',               n:3, d:'fitheid +3', prijs:15, f(){ const n = focusBoost(3); mod('fit', 3); return `Zalm, groente en zilvervliesrijst. Je lichaam en je hoofd zijn je dankbaar. Focus +${n}.`; }},
  {id:'psycholoog', l:'Gesprek met sportpsycholoog', n:10, d:'moraal +2', prijs:PSYCHOLOOG, f(){ const n = focusBoost(10); mod('moraal', 2); return `Je praat over de druk en over je fouten. Je gaat met een helder hoofd naar huis. Focus +${n}.`; }}
];
export function focusExtra(id){
  const sp = S.sp, w = S.week, x = FOCUS_EXTRA.find(e => e.id === id); if (!x || w.extra) return;
  const prijs = id === 'psycholoog' && sp.items.mentaal ? 0 : (x.prijs || 0);
  if (sp.geld < prijs) return;
  sp.geld -= prijs; w.extra = id;
  w.tekst.push(x.f());
}
export function vFocusExtra(){
  const sp = S.sp, w = S.week, f = Math.round(sp.focus ?? 65), fs = focusStaat(f);
  const knoppen = FOCUS_EXTRA.map(x => {
    const prijs = x.id === 'psycholoog' && sp.items.mentaal ? 0 : (x.prijs || 0);
    const d = [x.id === 'psycholoog' && !prijs ? 'gratis via je mentale coach' : prijs ? geldTxt(prijs) : 'gratis', `focus +${focusWinst(x.n)}`, x.d].join(' · ');
    return keuzeKnop(x.l, d, () => focusExtra(x.id), `data-blijf ${w.extra || sp.geld < prijs ? 'disabled' : ''}`);
  }).join('');
  return `<details class="paneel uitklap" id="focusPanel" ${tmp.focusOpen ? 'open' : ''}><summary><span class="label">Focus en ontspanning</span><span>Focus <b>${f}</b>${fs ? ` · <span class="${fs.cls === 'r-veilig' ? 'goedtxt' : 'fouttxt'}">${fs.k}</span>` : ''}</span><span class="niv">${w.extra ? 'deze week al gedaan' : '1 extra keuze, naast je activiteit'}</span></summary>
    <div class="uitklapinhoud"><p class="muted klein-tekst">Hoe hoger je focus al is, hoe minder het nog oplevert.</p>
    <div class="keuzes">${knoppen}</div></div></details>`;
}
export function vKleedkamer(){
  const sp = S.sp, w = S.week; if (sp.o23) return '';
  const sel = rugTeam(sp.club), ch = Math.round(chemie()), gek = tmp.maat && sel.find(x => x.n === tmp.maat) ? tmp.maat : null;
  const rij = x => { const v = Math.round(band(x.n)), [lab, cls] = bandLabel(v);
    return `<button class="maatrij ${gek === x.n ? 'aan' : ''}" data-i="${act(() => { tmp.maat = tmp.maat === x.n ? null : x.n; })}" data-blijf><span class="mn"><b><span class="muted">#${x.nr}</span> ${esc(metVoorletter(x))}</b><span class="niv">${x.basis ? 'Basis' : 'Bank'} · ${netUitJeugd(x) ? '<span class="goedtxt">Uit de jeugd</span>' : netGekocht(x) ? '<span style="color:var(--info)">Nieuw bij de club</span>' : esc(stNaam(x.st))}</span></span><span class="b"><i style="width:${v}%;background:${v >= 60 ? 'var(--goed)' : v >= 40 ? 'var(--lamp)' : 'var(--fout)'}"></i></span><span class="risico ${cls}">${lab}</span></button>`; };
  // Per linie, basisspelers eerst
  const linies = [['K', 'Keepers'], ['V', 'Verdedigers'], ['M', 'Middenvelders'], ['A', 'Aanvallers']].map(([pos, l]) => {
    const groep = sel.filter(x => x.pos === pos).sort((a, b) => b.basis - a.basis || a.nr - b.nr);
    return groep.length ? `<span class="label linie">${l} · ${groep.length}</span>${groep.map(rij).join('')}` : '';
  }).join('');
  const acties = gek ? `<div class="paneel"><span class="label">Met ${esc(gek)} · ${w.maat ? 'deze week heb je al iets met een teamgenoot gedaan' : '1 keuze per week'}</span><div class="keuzes">${[['praten', 'Praten na de training', 'band +4 tot +9'], ['trainen', 'Samen extra trainen', 'band +7 tot +11 · fitheid −6 · kans op +1'], ['grap', 'Een grap uithalen', 'riskant: band +8 of −12'], ['uitpraten', 'Spanning uitpraten', band(gek) < 40 ? 'band +10 tot +16' : 'band +3 tot +6']].map(([id, l, d]) => keuzeKnop(l, d, () => maatActie(gek, id), `data-blijf ${w.maat ? 'disabled' : ''}`)).join('')}</div></div>` : '<p class="muted klein-tekst">Klik op een teamgenoot om iets met hem te doen.</p>';
  return `<section id="kleedPanel" class="paneel sectie"><h3 class="sectiekop">Kleedkamer · sfeer ${ch}${ch >= 65 ? ' (top)' : ch < 40 ? ' (slecht)' : ''}</h3>
    <p class="muted klein-tekst" style="margin-top:8px">Hoe beter je band, hoe vaker teamgenoten je in de wedstrijd opzoeken. Met wie je niet kunt opschieten, die speelt niet graag naar je. Een goede sfeer maakt het hele team sterker.</p>
    ${vRugnummer()}
    <p class="muted klein-tekst">De selectie: ${sel.length + 1} spelers, jij meegerekend.</p>
    <div class="maten">${linies}</div>${acties}</section>`;
}
export function vAanvoerder(){
  if (!isAanvoerder()) return '';
  const sp = S.sp, w = kleedPersonen(), klaar = !!w.aanv, prijs = teamUitjePrijs();
  const opties = [['oppeppen', 'Het team oppeppen', 'Sterker in de volgende wedstrijd · band met iedereen +2'], ['bank', `Trainer: zet ${w.slecht} op de bank`, `${w.slecht} traint al weken slecht · team sterker, maar ${w.slecht} wordt boos`], ['opkomen', `Opkomen voor ${w.stil}`, `${w.stil} krijgt veel kritiek · band met hem +12`], ['uitje', `Teamuitje regelen · ${geldTxt(prijs)}`, 'Band met de hele groep +5'], ['aanspreken', `${w.laat} aanspreken`, `Hij komt steeds te laat · groep scherper, ${w.laat} gepikeerd`]];
  return `<div class="paneel kampioen" style="gap:8px"><span class="label">Jij bent de aanvoerder · 1 actie per week</span>${klaar ? '<p class="muted">Deze week heb je je aanvoerderstaak al gedaan.</p>' : ''}
    <div class="keuzes">${opties.map(([id, l, d]) => keuzeKnop(esc(l), esc(d), () => aanvoerderActie(id), `data-blijf ${klaar || (id === 'uitje' && sp.geld < prijs) ? 'disabled' : ''}`)).join('')}</div>
    <p class="muted klein-tekst">Sta je in de rust achter? Dan houd jij de toespraak.</p></div>`;
}
// Leven in het buitenland: taal, heimwee en één actie per week
function vBuitenlandLeven(){
  if (!inBuitenland()) return '';
  const sp = S.sp, B = sp.buitenland, t = taalNiveau(), h = Math.round(sp.heimwee || 0), straf = taalStraf(), T = TAAL[B.land] || 'de taal';
  const acties = kanBuitenlandActie() ? `<div class="keuzes">${Object.entries(BUITENLAND_ACTIES).map(([id, a]) => keuzeKnop(a.n, id === 'les' ? `${a.s} · ${geldTxt(lesPrijs())}` : id === 'huis' ? `${a.s} · ${geldTxt(vluchtPrijs())}` : a.s, () => doeBuitenlandActie(id), 'data-blijf')).join('')}</div>` : '<p class="muted klein-tekst">Je hebt deze week al iets gedaan.</p>';
  return `<section id="buitenlandPanel" class="paneel sectie"><h3 class="sectiekop">Leven in ${esc(B.land)} <span class="niv">${B.weken} ${B.weken === 1 ? 'week' : 'weken'}</span></h3>
    <div class="balken2">${balk(`Taal: ${T}`, t, 'st')}${balk('Heimwee', h, 'st')}</div>
    <p class="muted klein-tekst">${esc(taalLabel(t))}.${straf ? ` Je mist een deel van de uitleg van de trainer: je teambonus is −${String(straf).replace('.', ',')}.` : ' Je verstaat je teamgenoten goed.'}${h > 60 ? ' Je heimwee kost je elke week moraal.' : ''}</p>
    <span class="label">Wat doe je deze week? <span class="niv">1 keer per week</span></span>${acties}</section>`;
}
export function vBuiten(){ return vBuitenlandLeven() + vBuitenBasis(); }
function vBuitenBasis(){
  const sp = S.sp, w = S.week, r = sp.rij, wo = woning(), au = autoInfo();
  const samenvatting = [sp.leeftijd >= 18 ? (sp.relatie ? `${sp.relatie.getrouwd ? 'getrouwd' : sp.relatie.verloofd ? 'verloofd' : 'samen'} met ${sp.relatie.naam}` : 'single') : '', (sp.kinderen || []).length ? `${sp.kinderen.length} ${sp.kinderen.length === 1 ? 'kind' : 'kinderen'}` : '', dieren().length ? dieren().map(d => d.naam).join(', ') : '', `${volgersTxt(social().volgers)} volgers`, wo.id === 'ouders' ? 'woont bij je ouders' : wo.n.replace(/ (kopen|huren)$/, '').toLowerCase(), sp.rijbewijs ? (au ? au.n.toLowerCase() : 'rijbewijs, geen auto') : 'geen rijbewijs'].filter(Boolean).join(' · ');
  // Rijbewijs
  let rij;
  if (sp.rijbewijs) rij = `<p>Je hebt je rijbewijs. ${au ? `Je rijdt in een ${esc(au.n.toLowerCase())}.` : 'Nu nog een auto.'}</p>`;
  else if (sp.leeftijd < 17) rij = `<p class="muted">Vanaf je 17e mag je rijlessen nemen. Op je 18e mag je examen doen.</p>`;
  else {
    const T = w.theorie;
    const lesTekst = r.lessen >= 18 ? 'Je instructeur: "Je bent er klaar voor."' : r.lessen >= 10 ? 'Je instructeur: "Nog een paar lessen en je haalt het."' : r.lessen >= 5 ? 'Je instructeur: "Examen kan, maar meer lessen helpen echt."' : 'Je instructeur: "Eerst nog flink oefenen."';
    rij = `<p>${r.lessen} ${r.lessen === 1 ? 'rijles' : 'rijlessen'} gehad · theorie ${r.theorie ? '<b class="goedtxt">gehaald</b>' : 'nog niet gehaald'}. <span class="muted">${r.lessen ? lesTekst : ''}</span></p>`;
    if (T && !T.klaar){
      const v = T.vragen[T.i];
      rij += `<div class="paneel"><span class="label">Theorie-examen · vraag ${T.i + 1} van 3</span>${T.laatste ? `<p class="${/^Goed/.test(T.laatste) ? 'goedtxt' : 'fouttxt'}">${esc(T.laatste)}</p>` : ''}<p class="vraag">${esc(v.q)}</p>
        <div class="keuzes">${v.opts.map((o, j) => `<button class="keuze" data-i="${act(() => theorieAntwoord(j))}" data-blijf><span class="a">${esc(o)}</span></button>`).join('')}</div></div>`;
    } else {
      if (T && T.klaar && T.laatste) rij += `<p class="${/^Goed/.test(T.laatste) ? 'goedtxt' : 'fouttxt'} klein-tekst">Laatste vraag: ${esc(T.laatste)}</p>`;
      const knoppen = [];
      knoppen.push(knop(w.rijles ? 'Rijles gehad deze week' : `Rijles nemen · ${geldTxt(RIJLES)}`, rijles, 'klein', `data-blijf ${w.rijles || sp.geld < RIJLES ? 'disabled' : ''}`));
      if (!r.theorie) knoppen.push(knop(T ? 'Theorie: volgende week opnieuw' : `Theorie-examen · ${geldTxt(THEORIE_PRIJS)}`, startTheorie, 'klein', `data-blijf ${T || sp.geld < THEORIE_PRIJS ? 'disabled' : ''}`));
      else {
        const kan = sp.leeftijd >= 18 && r.lessen >= 5 && !w.examen && sp.geld >= EXAMEN_PRIJS;
        knoppen.push(knop(w.examen ? 'Examen gedaan deze week' : sp.leeftijd < 18 ? 'Examen vanaf je 18e' : r.lessen < 5 ? 'Examen: eerst 5 lessen' : `Praktijkexamen · ${geldTxt(EXAMEN_PRIJS)}`, praktijkExamen, 'klein', `data-blijf ${kan ? '' : 'disabled'}`));
      }
      rij += `<div class="rij">${knoppen.join('')}</div>`;
    }
  }
  // Auto
  let auto = '';
  if (sp.rijbewijs) auto = `<span class="label winkelkop">Auto</span>` + AUTOS.map(a => {
    const kost = a.prijs - autoWaarde();
    return `<div class="item"><div><b>${a.n}</b> <span class="muted">· ${a.d}</span>${sp.auto && sp.auto !== a.id ? `<span class="niv"> · na inruil ${geldTxt(Math.max(0, kost))}</span>` : ''}</div>${sp.auto === a.id ? '<span class="label">Jouw auto</span>' : knop(`Koop ${geldTxt(a.prijs)}`, () => koopAuto(a.id), 'klein', `data-blijf ${sp.geld < kost ? 'disabled' : ''}`)}</div>`; }).join('');
  // Wonen
  const wonen = sp.leeftijd < 18 ? `<p class="muted">Tot je 18e woon je bij je ouders.</p>` : WONINGEN.filter(x => !x.verborgen || x.id === wo.id).map(x => {
    const kost = (x.prijs || 0) - verkoopWaarde(), dit = x.id === wo.id;
    const prijs = x.huur ? 'Huren' : x.prijs ? `Koop ${geldTxt(x.prijs)}` : 'Terug naar huis';
    return `<div class="item"><div><b>${x.n}</b> <span class="muted">· ${x.d}</span>${!dit && wo.prijs && x.prijs ? `<span class="niv"> · na verkoop van je huidige ${geldTxt(Math.max(0, kost))}</span>` : ''}</div>${dit ? '<span class="label">Hier woon je</span>' : knop(prijs, () => verhuis(x.id), 'klein', `data-blijf ${sp.geld < kost ? 'disabled' : ''}`)}</div>`; }).join('');
  // Liefde
  let liefde;
  if (sp.leeftijd < 18) liefde = `<p class="muted">Vanaf je 18e kun je zelf op zoek naar een vriendin.</p>`;
  else if (sp.relatie){
    const r = sp.relatie, rb = r.band, gevoel = rb >= 75 ? 'Het gaat super tussen jullie.' : rb >= 50 ? 'Het gaat goed tussen jullie.' : rb >= 25 ? 'Het gaat wat minder. Doe eens iets leuks samen.' : 'Jullie hebben vaak ruzie.';
    const e = relatieEisen(), stap = [r.samen ? 'jullie wonen samen' : '', r.zwanger ? `${r.naam} is zwanger (nog ${r.zwanger} ${r.zwanger === 1 ? 'week' : 'weken'})` : ''].filter(Boolean).join(' · ');
    const acties = [];
    const samen = [['date', `Op date · ${geldTxt(DATE_PRIJS)}`, DATE_PRIJS], ['weekend', 'Weekendje weg · €300', 300], ['cadeau', `Cadeau kopen · ${geldTxt(cadeauPrijs())}`, cadeauPrijs()], ['koken', 'Samen koken', 0], ['wedstrijd', 'Uitnodigen voor je wedstrijd', 0]].concat(r.familie ? [] : [['familie', 'Haar ouders ontmoeten', 0]]);
    const samenHtml = `<span class="label winkelkop">Samen iets doen · 1 per week${w.date ? ' (al gedaan)' : ''}</span><div class="rij">${samen.map(([id, l, pr]) => knop(l, () => relatieActie(id), 'klein', `data-blijf ${w.date || sp.geld < pr ? 'disabled' : ''}`)).join('')}</div><span class="label winkelkop">Jullie toekomst</span>`;
    if (e.samen === '') acties.push(knop(e.eigen ? `Samenwonen in je ${woning().n.replace(/ (kopen|huren)$/, '').toLowerCase()}` : 'Samen een huis huren · €120 per week', samenwonen, 'klein', 'data-blijf'));
    if (e.aanzoek === '') acties.push(knop(`Aanzoek doen · ring ${geldTxt(RING())}`, aanzoek, 'klein', `data-blijf ${sp.geld < RING() ? 'disabled' : ''}`));
    if (e.trouwen === '') acties.push(knop('De bruiloft plannen', trouwen, 'klein', 'data-blijf'));
    if (e.kind === '') acties.push(knop('Praten over kinderen', overKinderen, 'klein', 'data-blijf'));
    const hints = [e.samen, e.aanzoek, e.trouwen, e.kind].filter(Boolean);
    liefde = `<p>Je bent ${r.getrouwd ? 'getrouwd' : r.verloofd ? 'verloofd' : 'samen'} met <b>${esc(r.naam)}</b> (${r.weken} ${r.weken === 1 ? 'week' : 'weken'} samen)${stap ? ` · ${esc(stap)}` : ''}. <span class="muted">${gevoel}</span></p>
      ${samenHtml}<div class="rij">${acties.join('')}${tmp.uitmaken ? '' : knop(r.getrouwd ? 'Scheiden' : 'Het uitmaken', () => { tmp.uitmaken = true; }, 'klein', 'data-blijf')}</div>
      ${hints.length ? `<p class="muted klein-tekst">${hints.map(esc).join(' ')}</p>` : ''}
      ${tmp.uitmaken ? `<div class="paneel"><p>${r.getrouwd ? `Weet je zeker dat je wilt scheiden van ${esc(r.naam)}? Ze krijgt de helft van je spaargeld (${geldTxt(scheidingKosten())}).` : `Weet je zeker dat je het wilt uitmaken met ${esc(r.naam)}?`}</p><div class="rij">${knop(sp.relatie.getrouwd ? 'Ja, scheiden' : 'Ja, uitmaken', () => { tmp.uitmaken = false; uitElkaar(); }, 'klein', 'data-blijf')}${knop('Nee, toch niet', () => { tmp.uitmaken = false; }, 'klein', 'data-blijf')}</div></div>` : ''}`;
  } else {
    liefde = `<p>Je bent single. ${w.liefde ? '<span class="muted">Deze week heb je het al geprobeerd. Volgende week weer een kans.</span>' : '<span class="muted">Ga stappen of probeer een datingapp om iemand te ontmoeten.</span>'}</p>
      <div class="rij">${knop(`Stappen in de stad · ${geldTxt(STAPPEN_PRIJS)}`, gaStappen, 'klein', `data-blijf ${w.liefde || sp.geld < STAPPEN_PRIJS ? 'disabled' : ''}`)}${knop('Datingapp proberen', datingApp, 'klein', `data-blijf ${w.liefde ? 'disabled' : ''}`)}</div>`;
  }
  const kids = sp.kinderen || [];
  if (kids.length) liefde += `<p>${kids.length === 1 ? 'Je kind' : 'Je kinderen'}: ${kids.map(k => `<b>${esc(k.naam)}</b> (${kindLeeftijd(k)})`).join(', ')}</p>`;
  // Social media
  const so = social(), inf = influencerPerWeek();
  const socialHtml = `<p><b>${volgersTxt(so.volgers)}</b> volgers. <span class="muted">${inf ? `Betaalde posts leveren ${geldTxt(inf)} per week op.` : 'Vanaf 10k volgers krijg je betaalde posts.'} Goed spelen en scoren levert ook volgers op.</span></p>
    ${w.post ? '<p class="muted">Je hebt deze week al iets gepost.</p>' : ''}
    <div class="keuzes">${POSTS.map(x => keuzeKnop(x.l, x.d, () => post(x.id), `data-blijf ${w.post ? 'disabled' : ''}`)).join('')}</div>
    <span class="label winkelkop">Wat doe je met je volgers? · 1 per week</span>
    <div class="keuzes">${VOLG_ACTIES.filter(x => !(x.eenmalig && sp.merk)).map(x => keuzeKnop(x.l, so.volgers < x.min ? `vanaf ${volgersTxt(x.min)} volgers` : x.d, () => volgActie(x.id), `data-blijf ${w.volg || so.volgers < x.min || (x.id === 'kleding' && sp.geld < 20000) ? 'disabled' : ''}`)).join('')}</div>
    <p class="muted klein-tekst">Wat je volgers je verder opleveren: sponsors kloppen vaker aan, clubs vinden je interessanter${inf ? `, betaalde posts (${geldTxt(inf)} per week)` : ''}${mijnMerken().length ? `, je eigen merken (${geldTxt(merkenPerWeek())} per week, zie Geld en zaken)` : ', en vanaf 50k volgers een eigen merk (zie Geld en zaken)'}.</p>`;
  // Huisdieren
  const ds = dieren(), magHond = sp.woning !== 'studio';
  const dierHtml = (ds.length ? ds.map((d, i) => `<div class="paneel"><p><b>${esc(d.naam)}</b> <span class="muted">· ${d.soort} · ${d.weken} ${d.weken === 1 ? 'week' : 'weken'} bij je${d.trucs ? ` · ${d.soort === 'papegaai' ? `kent ${d.trucs} ${d.trucs === 1 ? 'woord' : 'woorden'}` : `${d.trucs} ${d.trucs === 1 ? 'trucje' : 'trucjes'}`}` : ''} · ${geldTxt(DIEREN[d.soort].kost)} per week</span></p>
      <div class="keuzes">${DIER_ACTIES[d.soort].map(([id, l, dd]) => keuzeKnop(l, dd, () => dierActie(id, i), `data-blijf ${w.dier ? 'disabled' : ''}`)).join('')}</div>
      <div>${knop('Een nieuw thuis zoeken', () => herplaats(i), 'klein', `data-blijf data-bevestig="Je brengt ${esc(d.naam)} naar een nieuw thuis. Dat doet pijn." data-ja="Ja, afscheid nemen"`)}</div></div>`).join('') + (w.dier ? '<p class="muted">Je hebt deze week al iets met je dieren gedaan.</p>' : '') : '<p>Je hebt nog geen huisdier.</p>')
    + (ds.length < MAX_DIEREN ? `<span class="label winkelkop">Een dier erbij (${ds.length} van ${MAX_DIEREN})</span><div class="keuzes">${Object.entries(DIEREN).map(([k, D]) => keuzeKnop(`Een ${D.n}`, k === 'hond' && !magHond ? 'Je studio is te klein voor een hond' : D.d, () => neemDier(k), `data-blijf ${sp.geld < D.prijs || (k === 'hond' && !magHond) ? 'disabled' : ''}`)).join('')}</div>` : `<p class="muted">Je hebt ${MAX_DIEREN} dieren. Meer past er echt niet in huis.</p>`);
  // Geld en zaken
  const z = geldZaken(), wz = z.aandelen - z.aandelenIn;
  const geldHtml = `<p><b>Spaarrekening:</b> ${geldTxt(z.spaar)} <span class="muted">· veilig, 2% rente per seizoen</span></p>
    <div class="rij">${knop('25% van je geld sparen', () => spaar(.25), 'klein', `data-blijf ${sp.geld < 4 ? 'disabled' : ''}`)}${knop('Alles van je spaarrekening halen', haalSpaar, 'klein', `data-blijf ${z.spaar ? '' : 'disabled'}`)}</div>
    <p><b>Aandelen:</b> ${geldTxt(z.aandelen)}${z.aandelen ? ` <span class="${wz >= 0 ? 'goedtxt' : 'fouttxt'}">(${wz >= 0 ? '+' : '−'}${geldTxt(Math.abs(wz))} ${wz >= 0 ? 'winst' : 'verlies'})</span>` : ''} <span class="muted">· gaat elke week op en neer, soms flink</span></p>
    <div class="rij">${knop('Voor 10% van je geld kopen', () => koopAandelen(.1), 'klein', `data-blijf ${sp.geld < 10 ? 'disabled' : ''}`)}${knop('Alles verkopen', verkoopAandelen, 'klein', `data-blijf ${z.aandelen ? '' : 'disabled'}`)}</div>
    <p><b>Eigen zaak:</b> ${z.zaak ? `je ${esc(z.zaak.n.toLowerCase())} · vorige week ${z.zaak.laatste >= 0 ? `<span class="goedtxt">+${geldTxt(z.zaak.laatste)}</span>` : `<span class="fouttxt">−${geldTxt(-z.zaak.laatste)}</span>`} · totaal ${z.zaak.totaal >= 0 ? '+' : '−'}${geldTxt(Math.abs(z.zaak.totaal))}` : sp.leeftijd < 18 ? '<span class="muted">vanaf je 18e</span>' : '<span class="muted">verdient elke week geld, maar soms gaat er iets mis</span>'}</p>
    ${z.zaak ? `<div class="rij">${knop(`Verkopen voor ${geldTxt(z.zaak.prijs * .6)}`, verkoopZaak, 'klein', `data-blijf data-bevestig="Je verkoopt je ${esc(z.zaak.n.toLowerCase())} voor ${geldTxt(z.zaak.prijs * .6)}, minder dan je ervoor betaalde." data-ja="Ja, verkopen"`)}</div>` : sp.leeftijd >= 18 ? ZAKEN.map(x => `<div class="item"><div><b>${x.n}</b> <span class="muted">· gemiddeld zo'n ${geldTxt(x.winst)} per week</span></div>${knop(`Beginnen · ${geldTxt(x.prijs)}`, () => startZaak(x.id), 'klein', `data-blijf ${sp.geld < x.prijs ? 'disabled' : ''}`)}</div>`).join('') : ''}`;
  // Goede doelen
  const goedHtml = `<p>${S.ss.goed ? `Dit seizoen deed je al ${S.ss.goed} keer iets voor een goed doel.` : 'Iets terugdoen voor anderen.'} <span class="muted">Vijf keer in een seizoen levert een prijs op.</span>${sp.stichting ? ` Jouw <b>${esc(sp.stichting.naam)}</b> helpt kinderen om te voetballen.` : ''}</p>
    ${w.goed ? '<p class="muted">Deze week heb je al iets gedaan.</p>' : ''}
    <div class="keuzes">${[['ziekenhuis', 'Kinderziekenhuis bezoeken', 'moraal +4 · reputatie +1 · focus +2'], ['clinic', 'Voetbalclinic geven', 'moraal +3 · reputatie +1 · fitheid −3'], ['doneren', `${geldTxt(Math.max(100, Math.round(sp.geld * .1)))} doneren`, '10% van je geld · moraal +3 · reputatie']].concat(sp.stichting ? [] : [['stichting', 'Eigen stichting oprichten', `${geldTxt(STICHTING_PRIJS)} · reputatie +6 · elke week moraal +1`]])
      .map(([id, l, ds]) => keuzeKnop(l, ds, () => goedDoel(id), `data-blijf ${w.goed || (id === 'doneren' && sp.geld < 100) || (id === 'stichting' && sp.geld < STICHTING_PRIJS) ? 'disabled' : ''}`)).join('')}</div>`;
  // Familie
  const ou = ouders(), ob = Math.round(ou.band), kinds = sp.kinderen || [], ver = inBuitenland();
  const famHtml = `<p>Je band met je ouders: <b>${ob}</b> <span class="risico ${ob >= 70 ? 'r-veilig' : ob >= 40 ? 'r-gem' : 'r-riskant'}">${ob >= 70 ? 'Heel goed' : ob >= 40 ? 'Goed' : 'Afstandelijk'}</span>${ou.boos ? ' <span class="risico r-riskant">Boos om je cijfers</span>' : ''}${sp.items.ouders ? ' <span class="muted">· ze wonen in het huis dat jij voor ze kocht</span>' : ''}</p>
    <p class="muted klein-tekst">Een goede band geeft je elke week wat extra moraal. ${sp.leeftijd < 18 ? 'En soms krijg je wat extra zakgeld.' : ''}</p>
    <span class="label winkelkop">Met je ouders · 1 per week${w.ouder ? ' (al gedaan)' : ''}</span>
    <div class="keuzes">${(ver ? [['eten', 'Videobellen met je ouders', 'band +4 · moraal +2'], ['bellen', 'Je moeder bellen', 'band +3'], ['wedstrijd', `Ze overvliegen voor je wedstrijd · ${geldTxt(ouderVliegPrijs())}`, 'band +9 · moraal +4']]
      : [['eten', sp.leeftijd < 18 ? 'Samen koken en eten' : 'Zondag bij je ouders eten', 'band +6 · moraal +3 · focus +2'], ...(sp.leeftijd < 18 ? [['helpen', 'Helpen in huis', `band +6${ou.boos ? ' · kans dat ze niet meer boos zijn' : ''}`]] : [['bellen', 'Je moeder bellen', 'band +3']]), ['wedstrijd', 'Ze uitnodigen voor je wedstrijd', 'band +7 · moraal +3']]).concat([['cadeau', `Ze verrassen met een cadeau · ${geldTxt(ouderCadeau())}`, 'band +10']])
      .map(([id, l, d]) => keuzeKnop(l, d, () => ouderActie(id), `data-blijf ${w.ouder || (id === 'cadeau' && sp.geld < ouderCadeau()) || (ver && id === 'wedstrijd' && sp.geld < ouderVliegPrijs()) ? 'disabled' : ''}`)).join('')}</div>
    ${kinds.length ? `<span class="label winkelkop">Je kinderen</span><p>${kinds.map(k => `<b>${esc(k.naam)}</b> (${kindLeeftijd(k)})`).join(', ')}</p><div class="keuzes">${keuzeKnop('Tijd met je kinderen', 'moraal +5 · focus +2', kindActie, `data-blijf ${w.kind ? 'disabled' : ''}`)}</div>` : ''}`;
  // Je jeugdvriend: elke week iets samen doen (zo blijven jullie vrienden), of het uitpraten als hij je rivaal werd
  const v = sp.vriend, vb = v ? Math.round(v.band) : 0, R = sp.rivaal;
  const vriendHtml = !v ? '' : vVriendVergelijk() + (!v.weg ? `<p>${esc(v.voornaam)} ${esc(v.n)} · ${bijJou() ? `speelt bij jou, bij ${esc(club().n)}` : vriendClubNaam() ? `speelt bij ${esc(vriendClubNaam())}${vriendHier() ? '' : ` (${esc(vriendLand())})`}` : 'nog zonder club'}</p>
    ${sp.vriendBod ? `<p class="goedtxt klein-tekst">${esc(v.voornaam)} wil dat je naar ${esc(vriendClubNaam() || 'zijn club')} komt: in de ${!vriendHier() || S.ronde >= WINTER ? 'zomer' : 'winterstop'} doet zijn club een bod.</p>` : ''}
    <p>Jullie band: <b>${vb}</b> <span class="risico ${vb >= 60 ? 'r-veilig' : vb >= 25 ? 'r-gem' : 'r-riskant'}">${vb >= 60 ? 'Beste vrienden' : vb >= 25 ? 'Goede vrienden' : 'Het schuurt'}</span></p>
    <p class="muted klein-tekst">Hoe beter jullie band, hoe groter de kans dat jullie vrienden blijven als er iets gebeurt (een zaakwaarnemer die hem weg wil halen, ruzie in de media). Zonder contact groeien jullie langzaam uit elkaar${bijJou() ? ', maar bij dezelfde club zien jullie elkaar elke dag' : ''}.</p>
    <span class="label winkelkop">Met ${esc(v.voornaam)} · 1 per week${w.vriend ? ' (al gedaan)' : ''}</span>
    <div class="keuzes">${Object.entries(VRIEND_ACTIES).map(([id, a]) => keuzeKnop(a.n, a.komen ? (v.komt ? `hij komt in de ${v.komt.na === 'winter' ? 'winterstop' : 'zomer'}` : bijJou() ? 'jullie spelen al samen' : sp.clubloos || sp.o23 ? 'kan nu niet' : `${vriendRolTxt()}${kanVragen() ? '' : ' · vraag het in de volgende transferperiode opnieuw'}`) : a.s + (a.zelfde && !bijJou() ? ' · alleen als jullie bij dezelfde club spelen' : ''), () => vriendActie(id), `data-blijf ${kanVriendActie(id) ? '' : 'disabled'}`)).join('')}</div>`
    : `<p>${esc(v.voornaam)} ${esc(v.n)} is nu je rivaal${R && R.exVriend ? ` (${esc(rivaalBand(R.band).toLowerCase())})` : ''}.</p>
    <p class="muted klein-tekst">Zit het weer goed tussen jullie (band "Vriendschap"), dan worden jullie weer beste vrienden.</p>
    <div class="keuzes">${keuzeKnop('Het uitpraten', 'jullie band +8', uitpraten, `data-blijf ${kanUitpraten() ? '' : 'disabled'}`)}</div>`);
  // Kapper en voetbalschoenen (schoenen.js)
  const u = mijnUiterlijk(), dl = schoenDeal(), kapper = kanKapper();
  const stijlHtml = `<div class="rij" style="align-items:flex-start;gap:14px;flex-wrap:wrap"><figure class="portretfoto" style="max-width:220px"><img data-foto="portret" alt="Jouw speler"><span class="ontwikkel">Foto laden…</span></figure>
    <div style="flex:1;min-width:220px"><span class="label">Kapper · knippen ${geldTxt(KAPPER.knippen)}, verven ${geldTxt(KAPPER.verven)}${kapper ? '' : ' · deze week al geweest'}</span>
      <div class="kapsels" role="group" aria-label="Kapsel">${KAPSEL_KEUZE.map(([k, n]) => knop(n, () => naarKapper(k, null), 'klein' + (u.kapsel === k ? ' aan' : ''), `data-blijf aria-pressed="${u.kapsel === k}" ${kapper && u.kapsel !== k && sp.geld >= KAPPER.knippen ? '' : 'disabled'}`)).join('')}</div>
      <span class="label" style="margin-top:8px">Haarkleur</span>
      <div class="kapsels" role="group" aria-label="Haarkleur">${HAAR_NAAM.map((n, i) => knop(n, () => naarKapper(null, i), 'klein' + (u.haar === i ? ' aan' : ''), `data-blijf aria-pressed="${u.haar === i}" ${kapper && u.haar !== i && sp.geld >= KAPPER.verven ? '' : 'disabled'}`)).join('')}</div></div></div>
    <span class="label winkelkop">Voetbalschoenen${dl ? ` · jij speelt op ${esc(dl.merk)} (${geldTxt(dl.bedrag)} per jaar, ${dl.levenslang ? 'levenslang' : `nog ${dl.jaren} ${dl.jaren === 1 ? 'seizoen' : 'seizoenen'}`})` : ''}</span>
    <p class="muted klein-tekst">Hoe beter je bent, hoe groter het merk dat je wil hebben. De grote merken nemen alleen de beste spelers. Per merk kun je het één keer per halfjaar vragen.</p>
    <div class="keuzes">${MERKEN.map(m => { const reden = kanAanvragen(m), k = schoenKans(m);
      return keuzeKnop(`<span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${m.kleur};margin-right:6px;vertical-align:middle"></span>${esc(m.n)}${m.min ? ` · klasse ${m.min}` : ''}`, `${esc(m.tekst)} · ±${geldTxt(m.basis)} per jaar · ${esc(m.perkTxt)} · ${reden ? esc(reden) : kansTxt(k)}`, () => vraagAan(m.id), `data-blijf ${reden || k === null ? (reden ? 'disabled' : '') : ''}`); }).join('')}</div>`;
  const tabs = [['liefde', 'Liefde', liefde], ['familie', 'Familie', famHtml], ...(v ? [['vriend', v.weg ? 'Ex-vriend' : 'Jeugdvriend', vriendHtml]] : []), ['social', 'Social media', socialHtml], ['dier', 'Huisdieren', dierHtml], ['geld', 'Geld en zaken', geldHtml + vMerken()], ['stijl', 'Kapper en schoenen', stijlHtml], ['goed', 'Goede doelen', goedHtml], ['rij', 'Rijbewijs en auto', rij + auto], ['wonen', 'Wonen', wonen], ['uitgaan', 'Uitgaan', vUitgaan()]];
  const tab = tabs.find(x => x[0] === tmp.buitenTab) || tabs[0];
  return `<section id="buitenPanel" class="paneel sectie"><h3 class="sectiekop">Buiten het voetbal · ${esc(samenvatting)}</h3>
    <div class="buitentabs" role="tablist" style="margin-top:8px">${tabs.map(([k, l]) => knop(l, () => { tmp.buitenTab = k; }, 'comptab' + (k === tab[0] ? ' aan' : ''), `data-blijf role="tab" aria-selected="${k === tab[0]}"`)).join('')}</div>
    <div class="winkel" style="margin-top:10px">${tab[2]}</div></section>`;
}
export function vSchool(){
  const v = S.week && S.week.school; if (!v) return '';
  if (v.klaar) return `<div class="paneel"><span class="label">Schoolwerk · ${v.vak}</span><p class="vraag">${esc(v.q)}</p><p class="${v.gekozen === v.goed ? 'goedtxt' : 'fouttxt'}">${esc(v.uitleg)}</p></div>`;
  return `<div class="paneel"><span class="label">Schoolwerk deze week · ${v.vak}</span><p class="vraag">${esc(v.q)}</p>
    <div class="keuzes">${v.opts.map((o, i) => `<button class="keuze" data-i="${act(() => beantwoord(i))}" data-blijf><span class="a">${esc(o)}</span></button>`).join('')}</div>
    <div>${knop('Spijbelen', spijbelen, 'klein', 'data-blijf')}</div></div>`;
}

export function vEvent(){
  const soort = S.ev.soort;
  const label = soort === 'verhaal' ? `Jouw verhaal · ${verhaalTitel(S.sp) || ''}` : soort === 'prive' ? 'Buiten het veld' : soort === 'transfer' ? 'Transfernieuws' : soort === 'sponsor' ? 'Sponsoraanbod' : 'Bij de club';
  const kop = soort === 'verhaal' ? 'Een moment dat je niet vergeet' : soort === 'prive' ? 'Ondertussen, in je privéleven' : soort === 'transfer' ? 'Er ligt een bod op tafel' : soort === 'sponsor' ? 'Een merk wil jou' : 'Er gebeurt iets';
  return `<div class="verhaal"><span class="label">${label}</span><h2>${kop}</h2>
    ${S.week.tekst.map(t => `<p class="muted">${esc(t)}</p>`).join('')}
    <p class="moment">${esc(S.ev.tekst)}</p></div>
    <div class="keuzes">${S.ev.opts.map((o, i) => `<button class="keuze" data-i="${act(() => kiesEvent(i))}"><span class="t">${o.toon ? TOON[o.toon].i + ' ' : ''}${esc(o.l)}</span>${o.toon ? `<span class="s">${TOON[o.toon].n}</span>` : ''}</button>`).join('')}</div>`;
}
