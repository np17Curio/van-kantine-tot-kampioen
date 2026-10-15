import { S, club, gemCijfer, ovr, salarisLabel, seizoenLabel, sterren, tmp, waarde } from '../../core/state.js';
import { knop, tabBalk } from '../../core/ui.js';
import { clamp, esc, geldTxt } from '../../core/utils.js';
import { AANTAL_RONDES, ATTR, CLUBS, DIVS, JEUGD, LEGENDE, POS, SPONSOR_CAT, STATUS, STATUS_KORT, TRAINBAAR, landInfo, STATUS_ROL, STATUS_UITLEG } from '../../data/gegevens.js';
import { vBekerKaart } from '../../game/competitie/beker.js';
import { stand } from '../../game/competitie/spelers.js';
import { interStatus, landenVoor, magInterland } from '../../game/interlands/interlands.js';
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
import { PERS, mijnPers } from '../../game/speler/persoonlijkheid.js';

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
export function vSeizoenStrip(){
  const u = S.ss.uitslagen || [];
  const blok = i => {
    const r = u[i], gespeeld = i < S.ronde || (i === S.ronde && S.fase === 'matchEnd');
    if (r) return `<span class="blok u-${r.r} ${r.mee ? '' : 'zonder'}" title="Ronde ${i + 1}: ${esc(r.s)}${r.mee ? '' : ' (zonder jou)'}">${r.r}</span>`;
    return `<span class="blok ${!gespeeld && i === S.ronde ? 'u-nu' : ''}" title="Ronde ${i + 1}">${gespeeld ? '·' : i + 1}</span>`;
  };
  const helft = (a, b) => `<div class="helft">${Array.from({length:b - a}, (_, k) => blok(a + k)).join('')}</div>`;
  const gespeeld = Math.min(S.ronde + (S.fase === 'matchEnd' ? 1 : 0), AANTAL_RONDES);
  return `<div class="strip"><div class="rij" style="justify-content:space-between"><span class="label">Seizoen ${seizoenLabel()} · ${AANTAL_RONDES} wedstrijden</span><span class="label">${gespeeld} gespeeld · nog ${AANTAL_RONDES - gespeeld}</span></div>
    <div class="blokken" title="W = gewonnen, G = gelijk, V = verloren">${helft(0, 7)}<span class="winter" title="Winterstop"></span>${helft(7, AANTAL_RONDES)}</div></div>`;
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
    <p class="muted klein-tekst">${sp.land ? `Je speelt voor ${esc(sp.land)}.` : landen.length > 1 ? `Je kunt uitkomen voor ${esc(lijst)}. Na je eerste officiële wedstrijd ligt je keuze vast.` : `Je kunt uitkomen voor ${esc(lijst)}.`}</p>
    ${rijen}
    <p class="muted klein-tekst">${sp.o23 ? 'Zolang je bij de O23 speelt, roept geen bondscoach je op.' : magInterland() ? 'Interlandperiodes: na wedstrijd 4 en na wedstrijd 11.' : `Bondscoaches kijken pas naar je als je prof bent (${DIVS[2]} of hoger) en minstens 17.`}</p></div>`;
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
export function vZij(){
  const sp = S.sp, c = club(), gem = gemCijfer(), st = stand(c.t);
  const vorm = sp.vorm > 1.2 ? 'Topvorm' : sp.vorm > .3 ? 'Goed' : sp.vorm > -.3 ? 'Normaal' : sp.vorm > -1.2 ? 'Matig' : 'Slecht';
  const wo = woning(), au = autoInfo();
  const prive = [sp.leeftijd >= 18 ? (sp.relatie ? `${sp.relatie.getrouwd ? 'Getrouwd' : sp.relatie.verloofd ? 'Verloofd' : 'Samen'} met ${esc(sp.relatie.naam)}` : 'Single') : '', (sp.kinderen || []).length ? `Vader van ${sp.kinderen.map(k => esc(k.naam)).join(' en ')}` : '', wo.id === 'ouders' ? 'Woont bij je ouders' : esc(wo.n.replace(/ (kopen|huren)$/, '')), dieren().length ? dieren().map(d => `${d.soort.charAt(0).toUpperCase() + d.soort.slice(1)} ${esc(d.naam)}`).join(', ') : '', sp.rijbewijs ? (au ? esc(au.n) : 'Rijbewijs') : ''].filter(Boolean).join(' · ');
  const spelerKaart = () => `<div class="kaart">
      <div>${knop(tmp.stats ? 'Terug naar het spel' : '📊 Mijn carrière', () => { tmp.stats = !tmp.stats; }, 'klein')}</div>
      <div class="speler"><div class="ovr">${ovr(sp)}<small>KLASSE</small></div>
        <div><div class="naam">${sp.o23 || sp.clubloos ? '' : `<span class="muted">#${rugnummer()}</span> `}${esc(sp.naam)}</div><div class="muted">${POS[sp.pos].n} · ${sp.leeftijd} jaar · ${sp.clubloos ? 'zonder club' : esc(c.n)}${sp.o23 ? ' O23' : ''}${sp.huur ? ` (gehuurd van ${esc(CLUBS[sp.huur.ouder].n)})` : ''}</div><div class="label" title="Verwachting van scouts">Talent ${sterren(sp.pot)}</div></div></div>
      ${mijnPers().length ? `<div class="perschips">${mijnPers().map(id => `<span class="tag pers" title="In het veld: ${esc(PERS[id].veld)} Buiten het veld: ${esc(PERS[id].buiten)}">${PERS[id].i} ${PERS[id].n}</span>`).join('')}</div>` : ''}
      ${vStatus()}
      <div class="balken">${TRAINBAAR.map(k => balk(ATTR[k], sp.a[k])).join('')}</div>
      <div class="balken2">${balk('Fitheid', sp.fit, 'st')}${balk('Moraal', sp.moraal, 'st')}${balk('Focus', sp.focus ?? 65, 'st')}${vKalmte()}${balk('Vertrouwen', sp.vert, 'st')}${balk('Reputatie', sp.rep, 'st')}</div>
      <div class="feiten">
        <div><span class="label">Vorm</span><b>${vorm}</b></div>
        <div><span class="label">Marktwaarde</span><b>${c.t === JEUGD ? '–' : geldTxt(waarde(sp))}</b></div>
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
    nieuws: ['Nieuws', () => vNieuwsKaart() || leeg('Nog geen nieuws over jou. Speel een paar wedstrijden.')],
    meer: ['Meer', () => vSchoolKaart() + vSponsorKaart() + vInterlandKaart() || leeg('Hier komen je rapport, sponsors en interlands.')],
  };
  const tab = tabs[tmp.zijTab] ? tmp.zijTab : 'speler';
  return tabBalk(Object.entries(tabs).map(([k, [l]]) => [k, l]), tab, k => { tmp.zijTab = k; }, 'hubtabs zijtabs') + tabs[tab][1]();
}
