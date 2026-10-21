import { S, club, gemCijfer, ovr, salarisLabel, seizoenLabel, sterren, tmp, waarde } from '../../core/state.js';
import { knop, tabBalk } from '../../core/ui.js';
import { clamp, esc, geldTxt } from '../../core/utils.js';
import { AANTAL_RONDES, ATTR, CLUBS, DIVS, LEGENDE, POS, SPONSOR_CAT, STATUS, STATUS_KORT, TRAINBAAR, landInfo, STATUS_ROL, STATUS_UITLEG, WINTER, rondeInWeek, rondesVan, rondesVoor } from '../../data/gegevens.js';
import { vBekerKaart } from '../../game/competitie/beker.js';
import { stand } from '../../game/competitie/spelers.js';
import { interStatus, kanStoppenInter, kanTerugInter, landenVoor, magInterland, stopInternational, terugInternational } from '../../game/interlands/interlands.js';
import { vCompetitieKaart, vNieuwsKaart } from '../../game/media/nieuws.js';
import { dieren } from '../../game/prive/dieren.js';
import { ouders } from '../../game/prive/familie.js';
import { VAKKEN } from '../../game/prive/school.js';
import { isProf } from '../../game/prive/sponsors.js';
import { autoInfo, woning } from '../../game/prive/wonen-auto.js';
import { vKalmte } from '../../game/speler/kalmte.js';
import { fmt1, gemiddelde } from '../../game/speler/o23.js';
import { statusDrempel, statusNaam, statusNiveau } from '../../game/speler/status.js';
import { rugnummer } from '../../game/team/rugnummers.js';
import { fixture } from '../../game/competitie/competitie.js';
import { clubLogo } from '../../data/logos.js';
import { PERS, mijnPers } from '../../game/speler/persoonlijkheid.js';
import { HOOFDSTUKKEN, KLAAR, bijJou, deelVan, vriendClubNaam, hoofdstukTitel, toonLabel, vriendKlasse, vriendStats } from '../../game/speler/journey.js';
import { bandLabel } from '../../game/speler/rivaal.js';
import { gewichtVan, lengteTxt, lichaam } from '../../game/speler/lichaam.js';
import { vHistorie } from '../../game/seizoen/historie.js';

export function balk(l, v, cls = ''){ return `<div class="balk ${cls}"><span>${l}</span><span class="b"><i style="width:${clamp(v, 0, 100)}%"></i></span><span class="v">${Math.round(v)}</span></div>`; }
export function vStatus(){
  const sp = S.sp, n = statusNiveau(), d = statusDrempel();
  if (sp.clubloos) return `<div class="status"><span class="label">Status</span><div class="statusnaam">Zonder club</div><p class="muted klein-tekst">Al ${sp.clubloos.weken} ${sp.clubloos.weken === 1 ? 'week' : 'weken'}. Bij een nieuwe club begin je opnieuw.</p></div>`;
  const segs = STATUS.map((s, i) => {
    const max = i < STATUS.length - 1 ? STATUS[i + 1].min : 100;
    const vul = n >= LEGENDE ? 100 : clamp((sp.status - s.min) / (max - s.min), 0, 1) * 100;
    return `<span class="seg ${i > n && vul > 0 ? 'geblokt' : ''}" title="${statusNaam(i)}: ${STATUS_UITLEG[i]}"><i style="width:${vul}%"></i></span>`;
  }).join('');
  const namen = STATUS_KORT.map((s, i) => `<span class="${i === n ? 'nu' : i < n ? 'bereikt' : ''}">${i === 0 && sp.leeftijd >= 21 ? 'Nieuw&shy;komer' : s}</span>`).join('');
  return `<div class="status">
    <div class="rij" style="justify-content:space-between"><span class="label">Status bij ${esc(club().n)}</span><span class="label">${sp.clubWed} wed · ${sp.clubSz} ${sp.clubSz === 1 ? 'seizoen' : 'seizoenen'}</span></div>
    <div class="statusnaam">${sp.o23 ? 'Bij de O23' : statusNaam(n)}</div>
    ${sp.o23 ? '' : `<p class="muted klein-tekst statusrol">${STATUS_UITLEG[n]}</p>`}
    <div class="segs">${segs}</div>
    <div class="treden">${namen}</div>
    <p class="muted klein-tekst">${sp.o23 ? 'Bewijs jezelf bij de O23 om terug te komen bij de selectie.' : d ? `Volgende stap omhoog: ${d.naam} (${STATUS_ROL[n + 1]}) · nog ${d.nodig.join(' en ')}` : 'Hoger kan niet. Je naam staat voor altijd in de clubboeken.'}</p>
  </div>`;
}
// De seizoenskalender: per week het logo van je tegenstander (T = thuis, U = uit), gespeelde wedstrijden in de kleur van de uitslag
const UITSLAG = {W:'gewonnen', G:'gelijk', V:'verloren'};
function weekInfo(i){
  const r = (S.ss.uitslagen || [])[i], vrij = S.sp.clubloos ? false : rondeInWeek(club().t, i) == null;
  if (vrij) return {vrij:true};
  let opp = r && r.opp != null ? r.opp : null, thuis = r && r.thuis != null ? r.thuis : null;
  if (opp == null && !S.sp.clubloos){ try { const f = fixture(i); if (f){ opp = f.opp; thuis = f.thuis; } } catch (e){} }
  return {r, opp, thuis};
}
export function vSeizoenStrip(){
  const los = S.sp.clubloos;
  const blok = i => {
    const w = weekInfo(i), gespeeld = i < S.ronde || (i === S.ronde && S.fase === 'matchEnd');
    if (w.vrij) return `<span class="blok vrij" title="Week ${i + 1}: speelvrij">–</span>`;
    const naam = w.opp != null && CLUBS[w.opp] ? CLUBS[w.opp].n : null, r = w.r;
    const titel = `Week ${i + 1}${naam ? ` · ${w.thuis ? 'thuis' : 'uit'} tegen ${naam}` : ''}${r ? ` · ${r.s.split(' tegen ')[0]} ${UITSLAG[r.r]}${r.mee ? '' : ' (zonder jou)'}` : gespeeld ? '' : ' · nog te spelen'}`;
    const cls = `blok${r ? ` u-${r.r}${r.mee ? '' : ' zonder'}` : ''}${!gespeeld && i === S.ronde ? ' u-nu' : ''}${naam && !los ? ' logo' : ''}`;
    if (!naam || los) return `<span class="${cls}" title="${esc(titel)}">${r ? r.r : gespeeld ? '·' : i + 1}</span>`;
    return `<span class="${cls}" title="${esc(titel)}">${clubLogo(w.opp, 18)}<i class="tu">${w.thuis ? 'T' : 'U'}</i>${r ? `<b class="ul">${r.r}</b>` : ''}</span>`;
  };
  const helft = (a, b) => `<div class="helft">${Array.from({length:b - a}, (_, k) => blok(a + k)).join('')}</div>`;
  const t = club().t, tot = rondesVan(t), gespeeld = Math.min(rondesVoor(t, S.ronde + (S.fase === 'matchEnd' ? 1 : 0)), tot);
  return `<div class="strip"><div class="rij" style="justify-content:space-between"><span class="label">Seizoen ${seizoenLabel()} · ${tot} wedstrijden in ${AANTAL_RONDES} weken</span><span class="label">${gespeeld} gespeeld · nog ${tot - gespeeld}</span></div>
    <div class="blokken" title="T = thuis, U = uit · W = gewonnen, G = gelijk, V = verloren · – = speelvrije week">${helft(0, WINTER)}<span class="winter" title="Winterstop"></span>${helft(WINTER, AANTAL_RONDES)}</div>
    ${los ? '' : vProgramma()}</div>`;
}
// Het hele programma als lijst (uitklapbaar): week, tegenstander, thuis/uit en de uitslag
function vProgramma(){
  const regels = [];
  for (let i = 0; i < AANTAL_RONDES; i++){
    const w = weekInfo(i); if (w.vrij || w.opp == null || !CLUBS[w.opp]) continue;
    const r = w.r, nu = i === S.ronde && S.fase !== 'matchEnd';
    regels.push(`<li class="${nu ? 'nu' : ''}${r ? ` u-${r.r}` : ''}"><span class="wk">${i + 1}</span>${clubLogo(w.opp, 18)}<span class="cn">${esc(CLUBS[w.opp].n)}</span><span class="tu">${w.thuis ? 'thuis' : 'uit'}</span><span class="res">${r ? `${esc(r.s.split(' tegen ')[0])} ${r.r}` : nu ? 'deze week' : ''}</span></li>`);
    if (i === WINTER - 1) regels.push('<li class="winterregel">Winterstop</li>');
  }
  return `<details id="programmaPanel" class="programma" ${tmp.programmaOpen ? 'open' : ''}><summary class="label">Programma</summary><ol>${regels.join('')}</ol></details>`;
}
export function vInterlandKaart(){
  const sp = S.sp;
  if (!sp.herkomst) return '';
  const landen = landenVoor(), I = S.car.int;
  const lijst = landen.length > 1 ? landen.slice(0, -1).join(', ') + ' of ' + landen[landen.length - 1] : landen[0];
  const rijen = landen.map(n => {
    const st = I[n], [k, cls] = interStatus(n);
    return `<div class="landrij"><div><b>${esc(n)}</b> <span class="muted">· sterkte ${landInfo(n).s}</span>${st ? `<div class="muted klein-tekst">${st.caps} interlands · ${st.g} goals · ${st.a} assists</div>` : ''}</div><span class="risico ${cls}">${k}</span></div>`;
  }).join('');
  return `<div class="kaart"><h3>Interlands</h3>
    ${sp.interStop ? `<p>Je bent in ${sp.interStop.jaar}/${String((sp.interStop.jaar + 1) % 100).padStart(2, '0')} gestopt als international${sp.interStop.caps ? ` (${sp.interStop.caps} interlands, ${sp.interStop.g} goals voor ${esc(sp.interStop.land)})` : ''}.</p>` : ''}
    <p class="muted klein-tekst">${sp.interStop ? '' : sp.land ? `Je speelt voor ${esc(sp.land)}.` : landen.length > 1 ? `Je kunt uitkomen voor ${esc(lijst)}. Na je eerste officiële wedstrijd ligt je keuze vast.` : `Je kunt uitkomen voor ${esc(lijst)}.`}</p>
    ${rijen}
    ${kanStoppenInter() ? `<div class="rij">${knop('Stoppen als international', () => { const t = stopInternational(); if (t && S.week) S.week.tekst.push(t); }, 'klein', 'data-bevestig="Je wordt niet meer opgeroepen en gaat niet meer naar eindtoernooien. Later terugkeren kan, maar alleen als de bondscoach je dan nog wil." data-ja="Ja, ik stop"')}</div>` : ''}
    ${kanTerugInter() ? `<div class="rij">${knop('Terugkeren als international', () => { const t = terugInternational(); if (t && S.week) S.week.tekst.push(t); }, 'klein')}</div>` : sp.interStop && S.jaar === sp.interStop.jaar ? '<p class="muted klein-tekst">Terugkeren kan vanaf volgend seizoen.</p>' : ''}
    <p class="muted klein-tekst">${sp.interStop ? '' : sp.o23 ? 'Zolang je bij de O23 speelt, roept geen bondscoach je op.' : magInterland() ? 'Interlandperiodes: na wedstrijd 4 en na wedstrijd 11.' : `Bondscoaches kijken pas naar je als je prof bent (${DIVS[2]} of hoger) en minstens 17.`}</p></div>`;
}
export function vSchoolKaart(){
  const sp = S.sp; if (sp.leeftijd >= 18 || !sp.school) return '';
  const c = sp.school.cijfers;
  const rij = vak => { const l = c.filter(x => x.vak === vak).map(x => x.c), g = l.length ? gemiddelde(l) : null;
    return `<div class="landrij"><div><b>${vak}</b> <span class="muted klein-tekst">· ${l.length} ${l.length === 1 ? 'cijfer' : 'cijfers'}</span></div><span class="niv ${g !== null && g < 5.5 ? 'onv' : ''}">${g === null ? '–' : fmt1(g)}</span></div>`; };
  const tot = c.length ? gemiddelde(c.map(x => x.c)) : null;
  const ouders = sp.ouders.boos ? '<span class="risico r-riskant">Boos</span>' : sp.ouders.trots ? '<span class="risico r-veilig">Trots</span>' : '<span class="tag">Tevreden</span>';
  return `<div class="kaart"><h3>Rapport</h3>${VAKKEN.map(rij).join('')}
    <div class="landrij"><div><b>Gemiddeld</b></div><span class="niv ${tot !== null && tot < 5.5 ? 'onv' : ''}">${tot === null ? '–' : fmt1(tot)}</span></div>
    <div class="rol"><span class="label">Je ouders</span>${ouders}</div>
    <p class="muted klein-tekst">Tot je 18e ga je naar school. Gemiddeld een 5,5 of hoger is genoeg voor je diploma.</p></div>`;
}
export function vSponsorKaart(){
  const sp = S.sp, deals = sp.sponsors || [];
  if (!deals.length && !isProf()) return '';
  const totaal = deals.reduce((a, d) => a + d.bedrag, 0);
  return `<div class="kaart"><h3>Sponsors</h3>
    ${deals.length ? deals.map(d => `<div class="landrij"><div><b>${esc(d.merk)}</b> <span class="muted">· ${SPONSOR_CAT[d.cat].n.toLowerCase()}</span><div class="muted klein-tekst">nog ${d.jaren} ${d.jaren === 1 ? 'seizoen' : 'seizoenen'} · ${SPONSOR_CAT[d.cat].perk}</div></div><span class="niv">${geldTxt(d.bedrag)}/jaar</span></div>`).join('') + `<p class="muted klein-tekst">Samen ${geldTxt(totaal)} per jaar, bovenop je salaris.</p>`
      : '<p class="muted klein-tekst">Nog geen sponsors. Hoe bekender je bent (reputatie), hoe vaker merken bij je aankloppen.</p>'}</div>`;
}
// Jouw verhaal: welk hoofdstuk, je karakter (rustig of heethoofd) en je band met je jeugdvriend
function vVerhaal(){
  const sp = S.sp, J = sp.journey; if (!J) return '';
  const v = sp.vriend, R = sp.rivaal, t = sp.toon || 0, b = v && v.weg && R && R.exVriend ? R.band : v ? v.band : null;
  return `<div class="verhaalkaart"><span class="label">${J.h < KLAAR ? `Jouw verhaal · deel ${deelVan(J.h).nr} · hoofdstuk ${J.h}: ${esc(hoofdstukTitel(J.h))}` : 'Jouw verhaal · voltooid'}</span>${J.h < KLAAR - 1 && J.h >= 7 ? `<p class="muted klein-tekst">Volgende hoofdstuk: <b>${esc(hoofdstukTitel(J.h + 1))}</b></p>` : ''}
    <div class="toonmeter" title="Kalme keuzes: de trainer vertrouwt je meer. Felle keuzes: de fans houden van je vuur."><span>🧊 Rustig</span><span class="b"><i style="left:${(t + 100) / 2}%"></i></span><span>Heethoofd 🔥</span></div>
    ${v ? (() => { const st = vriendStats(); return `<p class="muted klein-tekst">Jij ${S.ss.g || 0} G · ${S.ss.a || 0} A · klasse ${ovr(sp)} — ${esc(v.voornaam)} ${st.g} G · ${st.a} A · klasse ${vriendKlasse()}</p>`; })() : ''}
    <p class="muted klein-tekst">Karakter: <b>${toonLabel()}</b>${b !== null ? ` · ${v.weg ? 'ex-vriend' : 'jeugdvriend'} ${esc(v.voornaam)}: ${v.weg ? bandLabel(b).toLowerCase() : b >= 60 ? 'beste vrienden' : b >= 20 ? 'goede vrienden' : 'het schuurt'}${!v.weg && vriendClubNaam() ? (bijJou() ? ' (jouw club)' : ` (${esc(vriendClubNaam())})`) : ''}` : ''}</p></div>`;
}
export function vZij(){
  const sp = S.sp, c = club(), gem = gemCijfer(), st = stand(c.t);
  const vorm = sp.vorm > 1.2 ? 'Topvorm' : sp.vorm > .3 ? 'Goed' : sp.vorm > -.3 ? 'Normaal' : sp.vorm > -1.2 ? 'Matig' : 'Slecht';
  const wo = woning(), au = autoInfo();
  const prive = [sp.leeftijd >= 18 ? (sp.relatie ? `${sp.relatie.getrouwd ? 'Getrouwd' : sp.relatie.verloofd ? 'Verloofd' : 'Samen'} met ${esc(sp.relatie.naam)}` : 'Single') : '', (sp.kinderen || []).length ? `Vader van ${sp.kinderen.map(k => esc(k.naam)).join(' en ')}` : '', wo.id === 'ouders' ? 'Woont bij je ouders' : esc(wo.n.replace(/ (kopen|huren)$/, '')), dieren().length ? dieren().map(d => `${d.soort.charAt(0).toUpperCase() + d.soort.slice(1)} ${esc(d.naam)}`).join(', ') : '', sp.rijbewijs ? (au ? esc(au.n) : 'Rijbewijs') : ''].filter(Boolean).join(' · ');
  const spelerKaart = () => `<div class="kaart">
      <div>${knop(tmp.stats ? 'Terug naar het spel' : '📊 Mijn carrière', () => { tmp.stats = !tmp.stats; }, 'klein')}</div>
      <div class="speler"><div class="ovr">${ovr(sp)}<small>KLASSE</small></div>
        <div><div class="naam">${sp.o23 || sp.clubloos ? '' : `<span class="muted">#${rugnummer()}</span> `}${esc(sp.naam)}</div><div class="muted">${POS[sp.pos].n} · ${sp.leeftijd} jaar · ${lengteTxt(lichaam().lengte)} · ${gewichtVan(lichaam().lengte, lichaam().bmi)} kg · ${sp.clubloos ? 'zonder club' : esc(c.n)}${sp.o23 ? ' O23' : ''}${sp.huur ? ` (gehuurd van ${esc(CLUBS[sp.huur.ouder].n)})` : ''}</div><div class="label" title="Verwachting van scouts">Talent ${sterren(sp.pot)}</div></div></div>
      ${mijnPers().length ? `<div class="perschips">${mijnPers().map(id => `<span class="tag pers" title="In het veld: ${esc(PERS[id].veld)} Buiten het veld: ${esc(PERS[id].buiten)}">${PERS[id].i} ${PERS[id].n}</span>`).join('')}</div>` : ''}
      ${vStatus()}
      ${vVerhaal()}
      <div class="balken">${TRAINBAAR.map(k => balk(ATTR[k], sp.a[k])).join('')}</div>
      <div class="balken2">${balk('Fitheid', sp.fit, 'st')}${balk('Moraal', sp.moraal, 'st')}${balk('Focus', sp.focus ?? 65, 'st')}${vKalmte()}${balk('Vertrouwen', sp.vert, 'st')}${balk('Reputatie', sp.rep, 'st')}</div>
      <div class="feiten">
        <div><span class="label">Vorm</span><b>${vorm}</b></div>
        <div><span class="label">Marktwaarde</span><b>${geldTxt(waarde(sp))}</b></div>
        <div><span class="label">${salarisLabel(c.t)}</span><b>${geldTxt(sp.salaris)}</b></div>
        <div><span class="label">Contract</span><b>${Math.max(sp.contract, 0)} jaar${sp.clausule && sp.clausule.club === sp.club ? `<br><span class="muted klein-tekst">afkoopsom ${geldTxt(sp.clausule.bedrag)}</span>` : ''}</b></div>
        <div><span class="label">Dit seizoen</span><b>${S.ss.wed} wed · ${S.ss.g} G · ${S.ss.a} A${S.ss.geel ? ` · ${S.ss.geel} geel` : ''}${S.ss.rood ? ` · ${S.ss.rood} rood` : ''}</b></div>
        <div><span class="label">Gem. cijfer</span><b>${gem === null ? '–' : gem.toFixed(1).replace('.', ',')}</b></div>
      </div>
      <div><span class="label">Privé</span><div>${prive}</div></div>
      ${sp.blessure > 0 ? `<p style="color:var(--fout)">Geblesseerd: nog ${sp.blessure} ${sp.blessure === 1 ? 'week' : 'weken'}</p>` : ''}
    </div>`;
  const leeg = t => `<div class="kaart"><p class="muted">${t}</p></div>`;
  const tabs = {
    speler: ['Speler', spelerKaart],
    stand: ['Stand', () => vCompetitieKaart() + vBekerKaart()],
    historie: ['Historie', vHistorie],
    nieuws: ['Nieuws', () => vNieuwsKaart() || leeg('Nog geen nieuws over jou. Speel een paar wedstrijden.')],
    meer: ['Meer', () => vSchoolKaart() + vSponsorKaart() + vInterlandKaart() || leeg('Hier komen je rapport, sponsors en interlands.')],
  };
  const tab = tabs[tmp.zijTab] ? tmp.zijTab : 'speler';
  return tabBalk(Object.entries(tabs).map(([k, [l]]) => [k, l]), tab, k => { tmp.zijTab = k; }, 'hubtabs zijtabs') + tabs[tab][1]();
}
