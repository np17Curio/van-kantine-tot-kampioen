import { clubFormatie, formatieVan } from '../../game/team/formatie.js';
import { mijnPlek } from '../../data/plekken.js';
import { WEER, wedstrijdWeer, weerEffectTekst } from '../../game/wedstrijd/weer.js';
import { S, club, statWaarde, attr, tmp } from '../../core/state.js';
import { vDoelenBalk, vSterren } from './sterren.js';
import { act, keuzeKnop, knop, render } from '../../core/ui.js';
import { toast } from '../../core/feedback.js';
import { TOON, vriendNa, vriendNaOpties } from '../../game/speler/journey.js';
import { lichaamKans } from '../../game/speler/lichaam.js';
import { esc } from '../../core/utils.js';
import { AANTAL_RONDES, CLUBS, DIVS, WINTER, rondesVoor } from '../../data/gegevens.js';
import { naWedstrijd, vBekerEnd } from '../../game/competitie/beker.js';
import { vNacompetitieEnd } from '../../game/competitie/nacompetitie.js';
import { vKrant, vOokGespeeld } from '../../game/media/nieuws.js';
import { social, volgersTxt } from '../../game/prive/social.js';
import { fmt1 } from '../../game/speler/o23.js';
import { vPers } from '../../game/wedstrijd/fans-pers.js';
import { focusStaat, kans, pOpts, risico } from '../../game/wedstrijd/momenten.js';
import { WAARSCHUW, actieKosten, isRoutinier, stamina } from '../../game/wedstrijd/stamina.js';
import { vReunieEinde } from '../../game/wedstrijd/reunie.js';
import { aftrap, dansKies, metVriendNa, kies, mijnNaam, simuleer, stand2, VAR_KEUZES, varKeuze, varTekst } from '../../game/wedstrijd/wedstrijd.js';
import { dansLijst, goalsNu, volgendeDans } from '../../game/wedstrijd/dansen.js';
import { rugTeam, rugnummer } from '../../game/team/rugnummers.js';
import { startElf } from '../../game/competitie/spelers.js';
import { metVoorletter } from '../../game/media/nieuws.js';

import { instel, vPitch } from '../pitch.js';
import { vInterEnd } from './interland.js';
import { vSelectieEnd } from './selectiedagen.js';
import { vProefEnd } from './proef.js';
import { vSeizoenStrip } from './zijbalk.js';
import { clubLogo } from '../../data/logos.js';
import { isAanvoerder } from '../../game/team/aanvoerder.js';
import { vrouwenWereld } from '../../core/geslacht.js';
// Wat je deed in de wedstrijd: goals en assists, of als keeper je reddingen en tegengoals
export function statRegel(M){
  if (S.sp && S.sp.pos === 'KEEPER') return `${M.reddingen || 0} ${M.reddingen === 1 ? 'redding' : 'reddingen'} · ${M.them === 0 ? 'de nul gehouden' : `${M.them} ${M.them === 1 ? 'tegengoal' : 'tegengoals'}`}`;
  return `${M.goals} ${M.goals === 1 ? 'goal' : 'goals'} · ${M.assists} ${M.assists === 1 ? 'assist' : 'assists'}`;
}

export function vO23End(){
  const M = S.M, uitslag = M.us > M.them ? 'Gewonnen' : M.us < M.them ? 'Verloren' : 'Gelijkgespeeld';
  return scorebord() + vSeizoenStrip() + `<div class="verhaal"><span class="label">O23 · ${uitslag}</span>
    <div class="rij" style="gap:20px;align-items:flex-end"><div><span class="label">Jouw cijfer</span><div class="groot">${fmt1(M.cijfer)}</div></div>
    <div class="muted">${statRegel(M)}${M.rood ? ' · rode kaart' : ''}</div></div>
    ${M.focusTekst ? `<p class="${M.focusOmlaag ? 'fouttxt' : 'goedtxt'}">${esc(M.focusTekst)}</p>` : ''}${vFit(M)}
    <p class="melding">${esc(M.o23Tekst)}</p>
    ${M.bonus ? `<p class="melding">${esc(M.bonus.tekst)}</p>` : ''}
    ${M.groei ? `<p class="muted">Door je goede spel groeit je ${attr(M.groei).toLowerCase()} met 1.</p>` : ''}
    ${M.talent ? `<p class="muted">${esc(M.talent)}</p>` : ''}
    ${M.reeksTekst ? `<p class="melding">${esc(M.reeksTekst)}</p>` : ''}
    ${M.rivaalTekst ? `<p class="melding">${esc(M.rivaalTekst)}</p>` : ''}
    <p class="muted">${esc(M.eersteTekst)}</p></div>` + vLog()
    + knop(S.ronde + 1 === WINTER ? 'Naar de winterstop' : S.ronde + 1 >= AANTAL_RONDES ? 'Seizoen afsluiten' : 'Volgende week', naWedstrijd);
}

export function scorebord(){
  const M = S.M, mij = esc(M.wij ?? mijnNaam()), hun = esc(M.zij ?? CLUBS[M.opp].n);
  const oppId = M.opp ?? (M.eerste && M.eerste.opp), lg = id => !M.inter && !M.selectie && id != null && CLUBS[id] ? clubLogo(id, 34) : '';
  const [l, r] = M.thuis ? [lg(S.sp.club) + `<span>${mij}</span>`, `<span>${hun}</span>` + lg(oppId)] : [lg(oppId) + `<span>${hun}</span>`, `<span>${mij}</span>` + lg(S.sp.club)];
  return `<div class="score"><div class="team ${M.thuis ? 'mij' : ''}">${l}</div>
    <div class="stand">${stand2()}<span class="min">${M.derby ? '<b style="color:var(--fout)">DERBY</b> · ' : ''}${M.klaar ? 'EINDE' : M.min + "'"}</span>${(w => w ? `<span class="min weer" title="${esc(weerEffectTekst(w) || WEER[w.soort].n)}">${WEER[w.soort].i} ${w.temp}°C</span>` : '')(wedstrijdWeer())}</div>
    <div class="team r ${!M.thuis ? 'mij' : ''}">${r}</div>${vStamina(M)}</div>`;
}
// Hoeveel energie heb je nog? Alleen zolang jij in het veld staat (of net gewisseld bent)
export function vStamina(M){
  if (!M.stam || M.klaar || M.rood) return '';
  if (M.gewisseld !== undefined) return `<div class="stamina uit"><span class="label">Gewisseld (${M.gewisseld}')</span><span class="muted klein-tekst">${M.blessureVeld ? 'Geblesseerd van het veld.' : 'Je stamina was op.'}</span></div>`;
  const st = Math.round(stamina(M)), kl = st > 50 ? 'hoog' : st >= 25 ? 'mid' : 'laag', alarm = M.rol === 'basis' && st < M.wisselGrens + WAARSCHUW;
  return `<div class="stamina ${kl}${alarm ? ' alarm' : ''}" title="Elke minuut en elke actie kost stamina. Moeilijke acties kosten meer. Is hij op, dan wisselt de trainer je.${isRoutinier() ? ` Op jouw leeftijd (${S.sp.leeftijd}) raak je sneller leeg, vooral na een uur; een goede conditie helpt.` : ''}"><span class="label">Stamina</span><div class="stambalk"><i style="width:${st}%"></i></div><b>${st}</b>${alarm ? '<span class="klein-tekst">Wisselgevaar</span>' : ''}</div>`;
}
// Na afloop: hoeveel fitheid kostte het, en werd je gewisseld?
// (na de wedstrijd ook de sterren van je wedstrijddoelen: sterren.js)
export function vFit(M){ return vSterren(M) + vStaminaNa(M); }
function vStaminaNa(M){
  if (M.fitVoor === undefined) return '';
  return (M.gewisseld !== undefined && M.blessureVeld ? `<p class="fouttxt">Je moest in de ${M.gewisseld}e minuut geblesseerd van het veld.</p>` : M.gewisseld !== undefined ? `<p class="fouttxt">De trainer wisselde je in de ${M.gewisseld}e minuut: je stamina was op${isRoutinier() ? `. Op je ${S.sp.leeftijd}e gaat de stamina sneller op; met conditietraining hou je het langer vol` : ''}.</p>` : '') + `<p class="muted">Fitheid: ${M.fitVoor} → ${S.sp.fit}.</p>`;
}
// Nieuwe regels sinds de vorige weergave verschijnen één voor één, alsof je de wedstrijd live volgt
export const REGEL_TEMPO = .22;
export const nieuweRegels = () => Math.max(0, S.M.log.length - (S.M.getoond || 0));
export function vLog(){
  const M = S.M, oud = M.getoond || 0;
  const html = `<div class="log">${M.log.map((l, i) => `<div${i >= oud ? ` class="nieuw" style="animation-delay:${(Math.min(i - oud, 20) * REGEL_TEMPO).toFixed(2)}s"` : ''}><span class="m">${l.m}</span><span class="${l.k}">${esc(l.t)}</span></div>`).join('')}</div>`;
  M.getoond = M.log.length;
  return html;
}

/* ---------- de intro: opstellingen en jouw rol, vóór de aftrap ---------- */
const LINIE = {SPITS:'A', MID:'M', VERD:'V', KEEPER:'K'}, LINIES = [['K', 'Keeper'], ['V', 'Verdediging'], ['M', 'Middenveld'], ['A', 'Aanval']];
const ROL = {basis:['Je staat in de basis', 'r-veilig'], invaller:['Je begint op de bank', 'r-gem'], bank:['Je zit op de bank', 'r-gem'], tribune:['Je zit op de tribune', 'r-riskant'],
  blessure:['Je bent geblesseerd', 'r-riskant'], geschorst:['Je bent geschorst', 'r-riskant'], rust:['Je krijgt rust', 'r-gem'], o23:['Je speelt bij de O23', 'r-gem']};
// De elf van een club (aangevuld uit de bank als er iemand ontbreekt) en de wissels. Jij staat erbij als je in de basis staat
// De elf en de wissels (startElf), met rugnummers
export function elftal(id, metJou, vulPos){ rugTeam(id); const r = startElf(id, metJou, vulPos); r.elf = r.elf.map(x => ({...x})); if (metJou) r.elf.push({jij:true, n:S.sp.naam, pos:LINIE[S.sp.pos], nr:rugnummer()}); geefPlekken(r.elf, id, metJou); return r; }
// Iedereen in de elf krijgt een plek uit de formatie van de club (formatie.js), van links naar rechts per linie. Jij staat op je eigen plek
function geefPlekken(elf, id, metJou){
  const f = formatieVan(id), jij = metJou ? elf.find(x => x.jij) : null, mijn = jij ? mijnPlek() : null, uit = [];
  for (const l of ['K', 'V', 'M', 'A']){
    const volg = l === 'K' ? ['GK'] : f[l], vrij = volg.map((_, i) => i), g = elf.filter(x => x.pos === l), plaats = new Map();
    if (jij && jij.pos === l){ const i = volg.indexOf(mijn); plaats.set(jij, i >= 0 ? vrij.splice(vrij.indexOf(i), 1)[0] : 99); jij.plek = mijn; }
    g.filter(x => !x.jij).forEach(x => { const i = vrij.length ? vrij.shift() : 99; plaats.set(x, i); x.plek = volg[i] || (l === 'K' ? 'GK' : ''); });
    // op volgorde van de formatie, van links naar rechts (zo staan ze ook op het opstellingsscherm)
    uit.push(...g.sort((a, b) => plaats.get(a) - plaats.get(b)));
  }
  elf.splice(0, elf.length, ...uit, ...elf.filter(x => !uit.includes(x)));
}
const spelerRij = x => `<li class="${x.jij ? 'mij' : ''}"><span class="nr">${x.nr ? x.nr : ''}</span><span>${x.plek ? `<span class="plekcode">${x.plek}</span> ` : ''}${x.jij ? `<b>${esc(x.n)} (jij)</b>${isAanvoerder() ? ' <span class="tag" title="Aanvoerder">C</span>' : ''}` : esc(metVoorletter(x))}${x.vriend ? ' 🤝' : ''}${x.rivaal ? ' ⚔️' : ''}</span></li>`;
function vElftal(id, titel, metJou, toonBank, opBank){
  const {elf, bank} = elftal(id, metJou, id === S.sp.club ? null : 'M'), tel = p => elf.filter(x => x.pos === p).length;
  const formatie = clubFormatie(id) || `${tel('V')}-${tel('M')}-${tel('A')}`;
  const mij = !metJou && toonBank && opBank ? [{jij:true, n:S.sp.naam, pos:LINIE[S.sp.pos], nr:rugnummer()}] : [];
  return `<div class="opstelling"><div class="opkop">${clubLogo(id, 28)}<div><b>${esc(titel)}</b><span class="muted klein-tekst">${formatie} · sterkte ${CLUBS[id].s}</span></div></div>
    ${LINIES.map(([p, l]) => { const g = elf.filter(x => x.pos === p); return g.length ? `<span class="label">${l}</span><ol>${g.map(spelerRij).join('')}</ol>` : ''; }).join('')}
    ${toonBank ? `<span class="label">Wissels</span><ol class="wissels">${mij.concat(bank.slice().sort((x, y) => (y.vriend || y.rivaal ? 1 : 0) - (x.vriend || x.rivaal ? 1 : 0)).slice(0, 6)).map(spelerRij).join('')}</ol>` : ''}</div>`;
}
export function introSoort(M){
  if (M.proef) return `Oefenwedstrijd bij ${M.wij}`;
  if (M.selectie) return `Selectiewedstrijd ${S.selectie ? S.selectie.cijfers.length + 1 : ''} van 3`;
  if (M.inter) return 'Interland';
  if (M.o23) return 'O23';
  if (M.beker) return `${M.beker.naam} · ${M.beker.ronde}`;
  if (M.po) return M.po.soort === 'halve' ? 'Play-offs · halve finale' : M.po.soort === 'finale' ? 'Play-offs · finale' : 'Nacompetitie';
  return `Speelronde ${rondesVoor(club().t, S.ronde) + 1} · ${DIVS[club().t]}`;
}
export function vIntro(M){
  const sp = S.sp, echteTeams = !M.inter && !M.o23 && !M.selectie && M.opp != null && CLUBS[M.opp], rol = ROL[M.rol] || [M.rol, 'r-gem'];
  const tags = [M.thuis ? 'Thuis' : 'Uit', M.derby ? 'Derby!' : '', M.rivaal ? 'Tegen je rivaal' : '', M.reunie ? 'Weerzien met je oude club' : ''].filter(Boolean);
  const info = (M.log || []).filter(l => !l.m || l.m === '').map(l => `<p class="muted">${esc(l.t)}</p>`).join('');
  const opst = echteTeams ? `<div class="opstellingen">${vElftal(sp.club, club().n, M.rol === 'basis', true, M.rol === 'bank' || M.rol === 'invaller')}${vElftal(M.opp, CLUBS[M.opp].n, false, true)}</div>`
    : `<p class="muted">${esc(M.wij)} tegen ${esc(M.zij)}.</p>`;
  return scorebord() + `<div class="verhaal intro"><span class="label">${esc(introSoort(M))}</span>
    <div class="rij">${tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}<span class="risico ${rol[1]}">${esc(rol[0])}</span></div>
    ${vDoelenBalk(M, true)}${info}${opst}</div>` + `<div class="rij">${knop('Aftrap!', () => aftrapMetOpkomst(M))}${knop('⏩ Simuleer wedstrijd', simuleer, 'hoofd tweede')}${magOpkomst(M) ? knop('🎬 Opkomst', () => { speelOpkomstScene(M); }, 'klein', 'data-blijf') : ''}</div>`;
}

// ---------- de opkomst (render/opkomstscene.js): de teams komen het veld op en de opstellingen ----------
// Bij clubwedstrijden en de O23 (de O23-elftallen worden daar verzonnen). instel().opkomst: 'belangrijk' (standaard) | 'altijd' | 'uit'
export const magOpkomst = M => !!(M && !M.inter && !M.selectie && !M.trainer && !tmp.simBezig && (M.o23 ? M.eerste && CLUBS[M.eerste.opp] : M.opp != null && CLUBS[M.opp]));
const eersteRonde = M => !M.beker && !M.po && rondesVoor(club().t, S.ronde) === 0;
export const belangrijkDuel = M => !M.o23 && !!(M.beker || M.po || M.derby || M.rivaal || eersteRonde(M));
function toonOpkomst(M){
  const s = instel().opkomst || 'belangrijk';
  return s !== 'uit' && magOpkomst(M) && (s === 'altijd' || belangrijkDuel(M));
}
let OPKOMST = null;
function speelOpkomstScene(M){
  return (OPKOMST || (OPKOMST = import('../opkomstscene.js'))).then(m => m.speelOpkomst(M))
    .catch(e => { console.warn('opkomst', e); toast('De opkomst kon niet worden afgespeeld.'); });
}
// Aftrap: eerst de opkomst (het introscherm blijft eronder staan), daarna pas de wedstrijd
function aftrapMetOpkomst(M){
  if (toonDebuut(M)) return speelDebuutScene(M);
  // een derby of een finale: eerst de spelersbus en de kleedkamer (render/busscene.js), dan de opkomst
  if (toonBus(M)){ M.busGezien = true; return speelBusScene(M).then(() => { if (S && S.M === M && M.intro) aftrapMetOpkomst(M); }); }
  if (!toonOpkomst(M)) return aftrap();
  speelOpkomstScene(M).then(() => { if (S && S.M === M && M.intro){ aftrap(); render(); } });
}
// De spelersbus (render/busscene.js): alleen bij de grote wedstrijden van je club, een keer per wedstrijd
const toonBus = M => !!(M && !M.inter && !M.selectie && !M.o23 && !M.trainer && !tmp.simBezig && !M.busGezien && (M.derby || (M.beker && M.beker.finale))
  && (instel().opkomst || 'belangrijk') !== 'uit');
let BUS = null;
function speelBusScene(M){
  return (BUS || (BUS = import('../busscene.js'))).then(m => m.speelBus(M)).catch(e => console.warn('bus', e));
}
// Je interlanddebuut (render/debuutscene.js): het volkslied en de hand van de bondscoach. Eén keer (M.debuut uit startInterland;
// S.car.debuutScene onthoudt dat hij gespeeld is), niet als de opkomst-animaties uit staan
const toonDebuut = M => !!(M && M.inter && M.debuut && !S.car.debuutScene && !tmp.simBezig && (instel().opkomst || 'belangrijk') !== 'uit');
let DEBUUT = null;
function speelDebuutScene(M){
  S.car.debuutScene = true;
  return (DEBUUT || (DEBUUT = import('../debuutscene.js'))).then(m => m.speelDebuut(M)).catch(e => console.warn('debuut', e))
    .finally(() => { if (S && S.M === M && M.intro){ aftrap(); render(); } });
}
export function vMatch(){
  if (S.M.intro) return vIntro(S.M);
  const M = S.M, wacht = `style="animation-delay:${(Math.min(nieuweRegels(), 20) * REGEL_TEMPO).toFixed(2)}s"`;
  let keuzeHtml = '';
  if (M.varKeuze){
    keuzeHtml = `<p class="moment nieuw varmoment" ${wacht}><b>${M.min}'</b> · 📺 VAR-check op jouw goal! De scheidsrechter bekijkt de beelden. Wat doe je?</p><div class="keuzes">${VAR_KEUZES.map((o, i) => `<button class="keuze" data-i="${act(() => varKeuze(i))}"><span class="t">${esc(o.l)}</span><span class="s">${esc(o.s)}</span></button>`).join('')}</div>`;
  } else if (M.dansKeuze){
    // jouw goal: kies je juichdans (je favoriet staat bovenaan); de volgende dans die nog vrij moet komen als teaser
    const fav = S.sp.dans, nxt = volgendeDans(), nog = nxt ? nxt.vanaf - goalsNu() : 0;
    keuzeHtml = `<p class="moment nieuw dansmoment" ${wacht}><b>${M.dansKeuze.m}</b> · ⚽ GOAL! Hoe vier je hem?</p><div class="keuzes nieuw" ${wacht}>${dansLijst().map(d => `<button class="keuze" data-i="${act(() => dansKies(d.id))}"><span class="t">${d.i} ${esc(d.n)}${d.id === fav ? ' <span class="muted" title="Je laatst gekozen dans">★</span>' : ''}</span><span class="s">${esc(d.s)}</span></button>`).join('')}${nxt ? `<button class="keuze" disabled><span class="t">🔒 ${esc(nxt.n)}</span><span class="s">Nog ${nog} ${nog === 1 ? 'goal' : 'goals'} in je carrière</span></button>` : ''}</div>`;
  } else if (M.pending){
    const f = Math.round(S.sp.focus ?? 65), fs = focusStaat(f);
    keuzeHtml = `<p class="moment nieuw" ${wacht}><b>${M.min}'</b> · ${esc(M.pending.tekst)}</p><p class="opst nieuw" ${wacht}><span class="label">Focus ${f}</span>${fs ? `<span class="risico ${fs.cls}">${fs.k}</span><span class="muted klein-tekst">${fs.t}</span>` : '<span class="muted klein-tekst">Lukt een actie, dan groeit je focus. Mislukt ze, dan zakt hij.</span>'}</p>${(M.oppS ?? 0) >= 85 && !M.o23 ? `<p class="muted klein-tekst nieuw" ${wacht}>Tegen een topclub is scoren extra lastig: hun keeper is van wereldklasse.</p>` : ''}<div class="keuzes nieuw" ${wacht}>${pOpts(M.pending).map((o, i) => {
      const [r, cls] = risico(kans(o)), kost = actieKosten(o);
      return `<button class="keuze" data-i="${act(() => kies(i))}"><span class="t">${o.toon ? TOON[o.toon].i + ' ' : ''}${esc(o.l)}</span><span class="s">${attr(o.st)} ${statWaarde(o.st)}${(() => { const d = lichaamKans(o, M.pending.type); return Math.abs(d) >= .015 ? ` <span class="${d > 0 ? 'goedtxt' : 'fouttxt'}" title="Door je lengte en bouw">${d > 0 ? '+' : '−'}${Math.abs(Math.round(d * 100))}% lichaam</span>` : ''; })()} <span class="risico ${cls}">${r}</span><span class="stamkost${kost >= 6 ? ' zwaar' : ''}" title="Kost ${kost} stamina">−${kost} ⚡</span>${o.kaart ? `<span class="kaartrisico ${o.kaart}">${o.kaart === 'rood' ? 'kans op rood' : 'kans op geel'}</span>` : ''}</span></button>`;
    }).join('')}</div>`;
  }
  // Jouw actie staat op het veld zelf; zonder veld staat hij boven het verslag
  const veld = vPitch(keuzeHtml);
  return scorebord() + vDoelenBalk(M) + (veld || keuzeHtml) + vLog() + `<div class="rij" style="margin-top:8px">${knop('⏩ Simuleer de rest', simuleer, 'klein')}</div>`;
}

// Na afloop tegen je vriend: shirts ruilen, een knuffel, of plagen (met een toon)
function vVriendNa(M){
  const V = metVriendNa(M); if (!V) return '';
  const vn = S.sp.vriend.voornaam, opts = vriendNaOpties(M), kop = `<span class="label">Na het laatste fluitsignaal · ${esc(vn)} 🤝</span>`;
  if (V.keuze != null) return `<div class="paneel">${kop}<p><b>Jij:</b> ${esc(opts[V.keuze].l)}</p><p class="melding">${esc(V.uit)}</p></div>`;
  return `<div class="paneel">${kop}<p>${V.bank ? `${esc(vn)} zat vandaag op de bank, maar na afloop komt hij naar je toe.` : `${esc(vn)} komt naar je toe in de middencirkel.`}${M.vriendGoalsTegen ? ` Hij scoorde vandaag tegen je${M.us < M.them ? ', en won' : ''}.` : ''}</p>
    <div class="keuzes">${opts.map((o, i) => keuzeKnop(`${TOON[o.toon].i} ${esc(o.l)}`, `${TOON[o.toon].n} · ${o.e}`, () => vriendNa(i), 'data-blijf')).join('')}</div></div>`;
}
export function vMatchEnd(){
  const M = S.M, sp = S.sp;
  if (M.inter) return vInterEnd();
  if (M.proef) return vProefEnd();
  if (M.selectie) return vSelectieEnd();
  if (M.o23) return vO23End();
  if (M.beker) return vBekerEnd();
  if (M.po) return vNacompetitieEnd();
  const uitslag = M.us > M.them ? 'Gewonnen' : M.us < M.them ? 'Verloren' : 'Gelijkgespeeld';
  let oordeel = '';
  if (M.cijfer !== null){
    oordeel = M.cijfer >= 8.5 ? `${vrouwenWereld() ? 'Speelster van de Wedstrijd' : 'Man of the Match'}! De fans scanderen je naam.` : M.cijfer >= 7.3 ? 'Sterke wedstrijd. De trainer geeft je een schouderklopje.' : M.cijfer >= 6 ? 'Degelijk. Niks mis mee.' : M.cijfer >= 5 ? 'Matige wedstrijd. De trainer kijkt je niet aan.' : 'Dramatisch. In de kantine wordt over je gepraat.';
  }
  let html = scorebord() + vSeizoenStrip() + `<div class="verhaal"><span class="label">${uitslag}${M.gesimuleerd ? ' · gesimuleerd' : ''}</span>${M.gesimuleerd ? '<p class="muted klein-tekst">Gesimuleerd: je speler speelde zoals een gewone speler, niet altijd de beste keuze.</p>' : ''}`;
  if (M.cijfer !== null){
    html += `<div class="rij" style="gap:20px;align-items:flex-end"><div><span class="label">Jouw cijfer</span><div class="groot">${M.cijfer.toFixed(1).replace('.', ',')}</div></div>
      <div class="muted">${statRegel(M)}${M.rood ? ' · rode kaart' : M.geel ? ' · gele kaart' : ''}</div></div>
      <p>${oordeel}</p>${M.focusTekst ? `<p class="${M.focusOmlaag ? 'fouttxt' : 'goedtxt'}">${esc(M.focusTekst)}</p>` : ''}${vFit(M)}`;
    if (M.volgers) html += `<p class="muted">${M.volgers > 0 ? '+' : ''}${volgersTxt(M.volgers)} volgers op social media (nu ${volgersTxt(social().volgers)}).</p>`;
    if (M.volgerTekst) html += `<p class="melding">${esc(M.volgerTekst)}</p>`;
    if (M.partnerTekst) html += `<p class="melding">${esc(M.partnerTekst)}</p>`;
    if (M.kaartTekst) html += `<p class="melding" style="${M.rood ? 'color:var(--fout);border-color:var(--fout)' : ''}">${esc(M.kaartTekst)}</p>`;
    if (M.statusTekst) html += `<p class="melding">${esc(M.statusTekst)}</p>`;
    if (M.agentTekst) html += `<p class="melding">${esc(M.agentTekst)}</p>`;
    if (M.o23Tekst) html += `<p class="melding">${esc(M.o23Tekst)}</p>`;
    if (M.bonus) html += `<p class="melding">${esc(M.bonus.tekst)}</p>`;
    if (M.groei) html += `<p class="muted">Door je goede spel groeit je ${attr(M.groei).toLowerCase()} met 1.</p>`;
    if (M.talent) html += `<p class="muted">${esc(M.talent)}</p>`;
    if (M.reeksTekst) html += `<p class="melding">${esc(M.reeksTekst)}</p>`;
    if (M.rivaalTekst) html += `<p class="melding">${esc(M.rivaalTekst)}</p>`;
    if (varTekst(M)) html += `<p class="melding var">${esc(varTekst(M))}</p>`;
    if (M.blessureNieuw) html += M.blesSoort ? `<p style="color:var(--fout)"><b>${esc(M.blesSoort.n)}.</b> Je ligt ${M.blessureNieuw} ${M.blessureNieuw === 1 ? 'week' : 'weken'} uit.${M.blessureNieuw >= 20 ? ' Je seizoen is waarschijnlijk voorbij.' : ''}${M.blesSoort.gevolg ? ` Je houdt er blijvend iets aan over: ${esc(M.blesSoort.gevolg)}.` : ''}</p>` : `<p style="color:var(--fout)">Je hebt je geblesseerd en ligt ${M.blessureNieuw} ${M.blessureNieuw === 1 ? 'week' : 'weken'} uit. Te weinig rust genomen?</p>`;
    if (M.kampioen) html += `<div class="kampioen"><span class="label">Kampioen!</span><h2>🏆 ${esc(club().n)}</h2><p>${esc(M.kampioenTekst)}</p></div>`;
    if (M.recordTekst) html += `<div class="kampioen"><span class="label">Record!</span>${[].concat(M.recordTekst).map(t => `<p>${esc(t)}</p>`).join('')}</div>`;
    if (M.derbyTekst) html += `<p class="melding" style="${M.us < M.them ? 'color:var(--fout);border-color:var(--fout)' : ''}">${esc(M.derbyTekst)}</p>`;
    if (M.grootTekst) html += `<p class="melding">${esc(M.grootTekst)}</p>`;
    if (M.fansTekst) html += `<p class="muted">${esc(M.fansTekst)}</p>`;
    html += vPers();
    html += vVriendNa(M);
    html += vReunieEinde(M);
    html += vKrant(M.nieuws);
    html += vKrant((S.ss && S.ss.compRonde) || [], 'Ook in het nieuws'); // de rest van de competitie
    html += vOokGespeeld();
    if (sp.vert < 25) html += `<p style="color:var(--fout)">Pas op: het vertrouwen van de trainer is laag. Zakt het onder de 15, dan word je bij de volgende transferperiode weggestuurd.</p>`;
  } else { html += `<p>${esc(M.log[0].t)}</p>`; html += vReunieEinde(M); html += vVriendNa(M); if (M.derbyTekst) html += `<p class="melding">${esc(M.derbyTekst)}</p>`; if (M.kampioen) html += `<div class="kampioen"><span class="label">Kampioen!</span><h2>🏆 ${esc(club().n)}</h2><p>${esc(M.kampioenTekst)}</p></div>`; html += vKrant(M.nieuws); html += vOokGespeeld(); }
  html += `</div>` + vLog();
  html += knop(S.ronde + 1 === WINTER ? 'Naar de winterstop' : S.ronde + 1 >= AANTAL_RONDES ? 'Seizoen afsluiten' : 'Volgende week', naWedstrijd);
  return html;
}
