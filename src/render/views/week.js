import { S, club, mod, tmp } from '../../core/state.js';
import { act, keuzeKnop, knop, tabBalk } from '../../core/ui.js';
import { clamp, esc, geldTxt } from '../../core/utils.js';
import { AANTAL_RONDES, ATTR, CLUBS, DIVS, TRAINBAAR, WINKEL, WINKEL_GROEPEN } from '../../data/gegevens.js';
import { BEKERS, bekerRondeNaam, bekersVan } from '../../game/competitie/beker.js';
import { fixture } from '../../game/competitie/competitie.js';
import { kiesEvent } from '../../game/gebeurtenissen.js';
import { metVoorletter, vKrant } from '../../game/media/nieuws.js';
import { DIEREN, DIER_ACTIES, MAX_DIEREN, dierActie, dieren, herplaats, neemDier } from '../../game/prive/dieren.js';
import { kindActie, ouderActie, ouderCadeau, ouders } from '../../game/prive/familie.js';
import { ZAKEN, geldZaken, haalSpaar, koopAandelen, spaar, startZaak, verkoopAandelen, verkoopZaak } from '../../game/prive/geld.js';
import { RING, aanzoek, geefNaam, kindLeeftijd, overKinderen, relatieEisen, samenwonen, scheidingKosten, trouwen } from '../../game/prive/gezin.js';
import { STICHTING_PRIJS, goedDoel } from '../../game/prive/goede-doelen.js';
import { DATE_PRIJS, STAPPEN_PRIJS, cadeauPrijs, datingApp, gaStappen, relatieActie, uitElkaar } from '../../game/prive/liefde.js';
import { beantwoord, spijbelen } from '../../game/prive/school.js';
import { POSTS, VOLG_ACTIES, influencerPerWeek, kledingPerWeek, post, social, volgActie, volgersTxt } from '../../game/prive/social.js';
import { koop } from '../../game/prive/sponsors.js';
import { vUitgaan } from '../../game/prive/verleidingen.js';
import { AUTOS, EXAMEN_PRIJS, RIJLES, THEORIE_PRIJS, WONINGEN, autoInfo, autoWaarde, koopAuto, praktijkExamen, rijles, startTheorie, theorieAntwoord, verhuis, verkoopWaarde, woning } from '../../game/prive/wonen-auto.js';
import { doorstroomAdvies, doorstroomDoel, doorstroomEisen, inMoment } from '../../game/speler/doorstroom.js';
import { BEWIJS, bewijsAdvies, bewijsEisen, heeftProef } from '../../game/speler/bewijs.js';
import { O23_EIS, fmt1, gemiddelde } from '../../game/speler/o23.js';
import { aanvoerderActie, isAanvoerder, kleedPersonen, teamUitjePrijs } from '../../game/team/aanvoerder.js';
import { band, bandLabel, chemie, maatActie } from '../../game/team/kleedkamer.js';
import { tactiekOpst, verwachteOpstelling } from '../../game/team/opstelling.js';
import { rugTeam, stNaam, vRugnummer } from '../../game/team/rugnummers.js';
import { TACTIEKEN, TRAIN_FIT, WINT_VAN, clubTactiek, inzicht, matchup, pasScore, tactiekEig, zwaarste } from '../../game/team/tactiek.js';
import { vVertrek } from '../../game/transfers/vertrek.js';
import { isDerby, vFans } from '../../game/wedstrijd/fans-pers.js';
import { focusBoost, focusStaat, focusWinst } from '../../game/wedstrijd/momenten.js';
import { reunieMet, vReunie } from '../../game/wedstrijd/reunie.js';
import { startWedstrijd } from '../../game/wedstrijd/wedstrijd.js';
import { doeActiviteit, plafond } from '../../game/week.js';
import { eisRij, vAgent } from './agent.js';
import { herkomstUitTmp, vHerkomstKeuze } from './start.js';
import { balk, vSeizoenStrip } from './zijbalk.js';

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

function vVooruitblik(fx, opp, vo){
  const sp = S.sp, c = club(), wij = sp.o23 ? `${c.n} O23` : c.n, zij = sp.o23 ? `${opp.n} O23` : opp.n;
  const aandeel = Math.round(clamp(c.s / (c.s + opp.s), .1, .9) * 100);
  const tags = [fx.thuis ? '<span class="tag">Thuis</span>' : '<span class="tag">Uit</span>', reunieMet(fx.opp) ? '<span class="tag twee">Je oude club!</span>' : '', isDerby(fx.opp) ? '<span class="tag teveel">Derby tegen je aartsrivaal</span>' : ''];
  for (const k of bekersVan(sp.club)){ const b = S.ss.bekers[k]; if (b && b.levend.includes(sp.club) && b.winnaar === null && BEKERS[k].schema[b.rondes.length] === S.ronde + 1) tags.push(`<span class="tag omhoog">Daarna: ${esc(BEKERS[k].naam)}, ${esc(bekerRondeNaam(k, b.rondes.length).toLowerCase())}</span>`); }
  return `<div class="vooruit">
    <span class="label">Wedstrijd ${S.ronde + 1} van ${AANTAL_RONDES}${sp.o23 ? ` · het 1e elftal speelt ${fx.thuis ? 'thuis' : 'uit'} tegen ${esc(opp.n)}` : ''}</span>
    <div class="vs"><div class="ploeg ${fx.thuis ? 'mij' : ''}"><b>${esc(fx.thuis ? wij : zij)}</b></div><span class="vsteken">vs</span><div class="ploeg r ${fx.thuis ? '' : 'mij'}"><b>${esc(fx.thuis ? zij : wij)}</b></div></div>
    <div class="kracht" title="Sterkte ${c.s} tegen ${opp.s}"><span class="niv">${esc(c.n)} ${c.s}</span><span class="krachtbalk"><i style="width:${aandeel}%"></i></span><span class="niv">${opp.s} ${esc(opp.n)}</span></div>
    ${vTactiekDuel(fx.opp)}
    <div class="rij">${tags.filter(Boolean).join('')}</div>
    <p class="opst"><span class="label">Verwachte opstelling</span><span class="risico ${vo.cls}">${vo.k}</span><span class="muted">${esc(vo.reden)}</span></p>
  </div>`;
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
  const train = TRAINBAAR.map(k => keuzeKnop(`Train ${ATTR[k].toLowerCase()}`, `<span class="mini"><i style="width:${clamp(sp.a[k], 0, 100)}%"></i></span> ${sp.a[k]} · ${sp.a[k] >= plafond() ? 'plafond bereikt' : `fitheid −${fitKost}`}`, () => doeActiviteit('train', k))).join('')
    + activiteit('tactiek', `Tactiek: ${TACTIEKEN[tid].n.toLowerCase()}`, `<span class="mini"><i style="width:${iz}%"></i></span> inzicht ${iz} · fitheid −${TRAIN_FIT}`, () => doeActiviteit('tactiek'));
  const herstel = activiteit('rust', 'Rustig aan', `Fitheid +22 · focus +${focusWinst(8)} · vorm iets beter`, () => doeActiviteit('rust'))
    + activiteit('mentaal', 'Mentale training', `Focus +${focusWinst(12)} · fitheid +4 · geen training`, () => doeActiviteit('mentaal'))
    + activiteit('video', 'Videoanalyse', `Focus +${focusWinst(7)} · vertrouwen +4 · fitheid −2`, () => doeActiviteit('video'));
  const sociaal = activiteit('trainer', 'Indruk maken op trainer', 'Vertrouwen +7 · fitheid −12', () => doeActiviteit('trainer'))
    + (sp.leeftijd < 18 && sp.ouders.boos ? keuzeKnop('Afspreken met vrienden', 'Mag niet van je ouders', () => {}, 'disabled') : activiteit('uit', sp.leeftijd < 18 ? 'Afspreken met vrienden' : 'Avondje uit', 'Moraal +10 · focus −3 · kans op gedoe', () => doeActiviteit('uit')))
    + (sp.leeftijd < 18 ? keuzeKnop('Huiswerk maken', sp.ouders.boos ? 'Focus +6 · dan mag je deze week zeker spelen' : 'Focus +6 · beter voorbereid op school', () => doeActiviteit('huiswerk')) : '');
  return `<section class="activiteiten"><h3 class="sectiekop">Wat doe je deze week? <span class="niv">1 keuze</span></h3>
    <div class="actgroepen">
    <div class="actgroep"><span class="label">Trainen</span><div class="keuzes">${train}</div></div>
    <div class="actgroep"><span class="label">Herstel en mentaal</span><div class="keuzes">${herstel}</div></div>
    <div class="actgroep"><span class="label">Club en sociaal</span><div class="keuzes">${sociaal}</div></div></div></section>`;
}

function vDezeWeek(){
  const sp = S.sp, w = S.week, fx = fixture(S.ronde), opp = CLUBS[fx.opp];
  const eersteKeer = S.ronde === 0 && S.car.wed === 0;
  const vo = sp.o23 && sp.blessure <= 0 && !(sp.geschorst > 0) ? {k:'O23 · basis', cls:'r-gem', reden:'Je speelt bij de O23 tot de trainer je terughaalt.'} : verwachteOpstelling();
  let html = vSeizoenStrip() + `<div class="verhaal"><span class="label">Week ${S.ronde + 1} van ${AANTAL_RONDES} · ${S.ronde === 0 ? 'Nieuw seizoen' : S.ronde === 7 ? 'Na de winterstop' : 'Trainingsweek'}</span>
    ${S.ronde === 0 ? `<h2>${eersteKeer ? `Welkom bij ${esc(club().n)}` : 'Nieuw seizoen'}</h2>` : ''}`;
  if (eersteKeer) html += `<p>Je eerste training bij de jeugd. De trainer is ook de vader van de keeper en fluit op een theelepeltje. De ballen zijn half lek, maar de droom is groot: ooit speel je in een vol stadion.</p>`;
  else if (S.ronde === 0) html += `<p>Een nieuw seizoen bij ${esc(club().n)} in de ${DIVS[club().t]}. Alles begint weer bij nul.</p>`;
  html += `</div>` + vVooruitblik(fx, opp, vo);
  html += vReunie();
  if (sp.o23){ const c = sp.o23.cijfers; html += `<div class="paneel"><span class="label">Bij de O23</span><p>${O23_EIS}</p><p class="muted">${c.length ? 'Je cijfers bij de O23: ' + c.map(fmt1).join(' · ') : 'Je hebt nog geen wedstrijd gespeeld bij de O23.'}</p></div>`; }
  if (sp.huur){ const c = sp.huur.cijfers; html += `<div class="paneel"><span class="label">Op huurbasis tot de zomer</span><p>Je speelt bij ${esc(club().n)} en gaat in de zomer terug naar ${esc(CLUBS[sp.huur.ouder].n)}. Hoe beter je hier speelt, hoe beter je plek daar. Gemiddeld een 7,0 of hoger en ze rekenen op je.</p><p class="muted">${c.length ? `Gemiddeld cijfer hier: ${fmt1(gemiddelde(c))} (${c.length} ${c.length === 1 ? 'wedstrijd' : 'wedstrijden'})` : 'Je hebt hier nog niet gespeeld.'}</p></div>`; }
  if (!sp.herkomst) html += `<div class="paneel"><span class="label">Nieuw: interlands</span><p>Uit welke landen kom je? Daarmee bepaal je voor welke landen je later interlands kunt spelen.</p>${vHerkomstKeuze()}<div>${knop('Opslaan', () => { sp.herkomst = herkomstUitTmp(); }, 'hoofd middel', 'data-blijf')}</div></div>`;
  if (w.tekst.length) html += `<div class="verhaal">${w.tekst.map(t => `<p class="moment">${esc(t)}</p>`).join('')}</div>`;
  if (S.krantWacht && S.krantWacht.length) html += vKrant(S.krantWacht);
  if (sp.geboorte) html += `<div class="kampioen"><span class="label">Je bent vader!</span><h2>Het is een ${sp.geboorte.jongen ? 'jongen' : 'meisje'}</h2><p>Hoe ga je ${sp.geboorte.jongen ? 'hem' : 'haar'} noemen?</p><div class="keuzes">${sp.geboorte.opties.map(n => keuzeKnop(esc(n), '', () => geefNaam(n), 'data-blijf')).join('')}</div></div>`;
  if (sp.leeftijd < 18 && sp.ouders.boos && !w.huiswerk) html += `<p class="melding">Je ouders zijn boos om je cijfers. Misschien houden ze je thuis bij de wedstrijd. Maak je deze week huiswerk, dan mag je zeker spelen.</p>`;
  html += vDoorstroom();
  html += vBewijs();
  html += vSchool();
  // Stap 1: activiteit kiezen · stap 2 (optioneel): iets voor je focus · stap 3: spelen
  let cta;
  if (!w.gedaan){
    html += sp.blessure > 0 ? `<section class="activiteiten"><h3 class="sectiekop">Je bent geblesseerd</h3><div class="keuzes">${keuzeKnop('Revalideren', 'Fitheid +20', () => doeActiviteit('revalidatie'))}</div></section>` : vActiviteiten();
    cta = `<span class="muted">Kies eerst wat je deze week doet.</span>`;
  } else if (sp.geboorte) cta = `<span class="muted">Kies eerst een naam voor je kindje.</span>`;
  else if (w.school && !w.school.klaar) cta = `<span class="muted">Maak eerst je schoolwerk af, daarna kun je spelen.</span>`;
  else cta = knop(sp.o23 && sp.blessure <= 0 && sp.fit >= 20 ? `Speel met de O23 tegen ${esc(opp.n)} O23` : `Speel ronde ${S.ronde + 1}: ${fx.thuis ? esc(club().n) + ' – ' + esc(opp.n) : esc(opp.n) + ' – ' + esc(club().n)}`, startWedstrijd);
  html += vFocusExtra();
  const rest = teamOpen();
  html += `<div class="ctabalk">${cta}${w.gedaan && rest ? `<span class="niv">Nog ${rest} ${rest === 1 ? 'teamactie' : 'teamacties'} open bij <b>Team</b></span>` : ''}</div>`;
  return html;
}

function vTeamTab(){
  const h = vTactiek() + vAanvoerder() + vKleedkamer() + vFans();
  return h || `<p class="muted">Bij de O23 heb je geen eigen kleedkamer. Bewijs jezelf eerst.</p>`;
}
function vCarriereTab(){
  return vAgent() + vVertrek();
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
    return `<button class="maatrij ${gek === x.n ? 'aan' : ''}" data-i="${act(() => { tmp.maat = tmp.maat === x.n ? null : x.n; })}" data-blijf><span class="mn"><b><span class="muted">#${x.nr}</span> ${esc(metVoorletter(x))}</b><span class="niv">${x.basis ? 'Basis' : 'Bank'} · ${esc(stNaam(x.st))}</span></span><span class="b"><i style="width:${v}%;background:${v >= 60 ? 'var(--goed)' : v >= 40 ? 'var(--lamp)' : 'var(--fout)'}"></i></span><span class="risico ${cls}">${lab}</span></button>`; };
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
export function vBuiten(){
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
    <p class="muted klein-tekst">Wat je volgers je verder opleveren: sponsors kloppen vaker aan, clubs vinden je interessanter${inf ? `, betaalde posts (${geldTxt(inf)} per week)` : ''}${sp.merk ? `, je kledinglijn (${geldTxt(kledingPerWeek())} per week, totaal ${geldTxt(sp.merk.totaal)})` : ''}.</p>`;
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
  const ou = ouders(), ob = Math.round(ou.band), kinds = sp.kinderen || [];
  const famHtml = `<p>Je band met je ouders: <b>${ob}</b> <span class="risico ${ob >= 70 ? 'r-veilig' : ob >= 40 ? 'r-gem' : 'r-riskant'}">${ob >= 70 ? 'Heel goed' : ob >= 40 ? 'Goed' : 'Afstandelijk'}</span>${ou.boos ? ' <span class="risico r-riskant">Boos om je cijfers</span>' : ''}${sp.items.ouders ? ' <span class="muted">· ze wonen in het huis dat jij voor ze kocht</span>' : ''}</p>
    <p class="muted klein-tekst">Een goede band geeft je elke week wat extra moraal. ${sp.leeftijd < 18 ? 'En soms krijg je wat extra zakgeld.' : ''}</p>
    <span class="label winkelkop">Met je ouders · 1 per week${w.ouder ? ' (al gedaan)' : ''}</span>
    <div class="keuzes">${[['eten', sp.leeftijd < 18 ? 'Samen koken en eten' : 'Zondag bij je ouders eten', 'band +6 · moraal +3 · focus +2'], ...(sp.leeftijd < 18 ? [['helpen', 'Helpen in huis', `band +6${ou.boos ? ' · kans dat ze niet meer boos zijn' : ''}`]] : [['bellen', 'Je moeder bellen', 'band +3']]), ['wedstrijd', 'Ze uitnodigen voor je wedstrijd', 'band +7 · moraal +3'], ['cadeau', `Ze verrassen met een cadeau · ${geldTxt(ouderCadeau())}`, 'band +10']]
      .map(([id, l, d]) => keuzeKnop(l, d, () => ouderActie(id), `data-blijf ${w.ouder || (id === 'cadeau' && sp.geld < ouderCadeau()) ? 'disabled' : ''}`)).join('')}</div>
    ${kinds.length ? `<span class="label winkelkop">Je kinderen</span><p>${kinds.map(k => `<b>${esc(k.naam)}</b> (${kindLeeftijd(k)})`).join(', ')}</p><div class="keuzes">${keuzeKnop('Tijd met je kinderen', 'moraal +5 · focus +2', kindActie, `data-blijf ${w.kind ? 'disabled' : ''}`)}</div>` : ''}`;
  const tabs = [['liefde', 'Liefde', liefde], ['familie', 'Familie', famHtml], ['social', 'Social media', socialHtml], ['dier', 'Huisdieren', dierHtml], ['geld', 'Geld en zaken', geldHtml], ['goed', 'Goede doelen', goedHtml], ['rij', 'Rijbewijs en auto', rij + auto], ['wonen', 'Wonen', wonen], ['uitgaan', 'Uitgaan', vUitgaan()]];
  const tab = tabs.find(x => x[0] === tmp.buitenTab) || tabs[0];
  return `<section id="buitenPanel" class="paneel sectie"><h3 class="sectiekop">Buiten het voetbal · ${esc(samenvatting)}</h3>
    <div class="buitentabs" role="tablist" style="margin-top:8px">${tabs.map(([k, l]) => knop(l, () => { tmp.buitenTab = k; }, 'comptab' + (k === tab[0] ? ' aan' : ''), `data-blijf role="tab" aria-selected="${k === tab[0]}"`)).join('')}</div>
    <div class="winkel" style="margin-top:10px">${tab[2]}</div></section>`;
}
export function vDoorstroom(){
  const d = doorstroomDoel(); if (!d) return '';
  const e = doorstroomEisen(d.lft), klaar = e.every(x => x.ok);
  const rijen = e.map(x => x.key === 'lft' ? {...x, label:`Leeftijd ${inMoment(d.moment)}`} : x);
  return `<div class="paneel"><span class="label">Naar het 1e elftal van ${esc(d.ouder.n)}</span>
    ${klaar ? `<p class="melding">Je voldoet aan alle eisen! ${inMoment(d.moment).charAt(0).toUpperCase() + inMoment(d.moment).slice(1)} mag je naar het 1e elftal.</p>` : `<p>${esc(doorstroomAdvies(e))}</p>`}
    <div class="eisen">${rijen.map(eisRij).join('')}</div>
    <p class="muted klein-tekst">Wedstrijden en cijfers tellen alleen voor dit seizoen. Het 1e elftal kijkt bij de winterstop (na wedstrijd 7) en in de zomer. Je volgende kans: ${inMoment(d.moment).replace('bij ', '')}.${d.moment === 'zomer' && S.ronde >= 7 ? ' In de zomer telt je hele seizoen mee.' : ''}</p></div>`;
}
// De laatbloeier: hoe staat zijn proefcontract ervoor?
export function vBewijs(){
  if (!heeftProef() || S.ronde >= 7) return '';
  const e = bewijsEisen(), klaar = e.every(x => x.ok), nog = 7 - S.ronde;
  return `<div class="paneel"><span class="label">Je proefcontract bij ${esc(club().n)}</span>
    ${klaar ? `<p class="melding">${esc(bewijsAdvies(e))}</p>` : `<p>${esc(bewijsAdvies(e))}</p>`}
    <div class="eisen">${e.map(eisRij).join('')}</div>
    <p class="muted klein-tekst">Bij de winterstop (nog ${nog} ${nog === 1 ? 'wedstrijd' : 'wedstrijden'}) beslist de trainer. Minstens ${BEWIJS.wed} wedstrijden en gemiddeld een ${String(BEWIJS.cijfer).replace('.', ',')}: dan krijg je een vast contract.</p></div>`;
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
  const label = soort === 'prive' ? 'Buiten het veld' : soort === 'transfer' ? 'Transfernieuws' : soort === 'sponsor' ? 'Sponsoraanbod' : 'Bij de club';
  const kop = soort === 'prive' ? 'Ondertussen, in je privéleven' : soort === 'transfer' ? 'Er ligt een bod op tafel' : soort === 'sponsor' ? 'Een merk wil jou' : 'Er gebeurt iets';
  return `<div class="verhaal"><span class="label">${label}</span><h2>${kop}</h2>
    ${S.week.tekst.map(t => `<p class="muted">${esc(t)}</p>`).join('')}
    <p class="moment">${esc(S.ev.tekst)}</p></div>
    <div class="keuzes">${S.ev.opts.map((o, i) => `<button class="keuze" data-i="${act(() => kiesEvent(i))}"><span class="t">${esc(o.l)}</span></button>`).join('')}</div>`;
}
