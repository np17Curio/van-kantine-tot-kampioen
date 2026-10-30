import { vriendApart, vriendClubInfo } from '../../game/speler/journey.js';
import { clubPlek } from '../../game/transfers/buitenland.js';
import { S, ovr, salarisLabel } from '../../core/state.js';
import { knop } from '../../core/ui.js';
import { esc, geldTxt } from '../../core/utils.js';
import { CLUBS, DIVS, NIVEAU, POS } from '../../data/gegevens.js';
import { clubLogo } from '../../data/logos.js';
import { POS_MEERV, RANG_TOP, SELECTIE_WED, SEL_UITLEG, mijnPlek, rangStart, naSelectie, ranglijst, selGemiddelde, startSelectie, tekenSelectie } from '../../game/speler/selectie.js';
import { fmt1 } from '../../game/speler/o23.js';
import { startVoor } from '../../game/speler/startverhaal.js';
import { rolBijClub } from '../../game/speler/status.js';
import { TACTIEKEN, clubTactiek } from '../../game/team/tactiek.js';
import { vFit, vLog, scorebord, statRegel } from './match.js';
import { vr } from '../../core/geslacht.js';

// De scoutingranglijst: top 10 gemarkeerd, jij en je vriend uitgelicht
function vRanglijst(){
  const l = ranglijst(), mv = POS_MEERV[S.sp.pos];
  if (!l) return `<p class="muted">Scoutingranglijst van de ${mv}: je begint onderaan, op plek <b>${rangStart()}</b>. Eindig zo hoog mogelijk: bij de top ${RANG_TOP} van de ${mv} kijken de grote clubs mee.</p>`;
  const kort = pos => { const k = ranglijst(pos) || []; return `<p class="klein-tekst"><b>${POS_MEERV[pos][0].toUpperCase() + POS_MEERV[pos].slice(1)}</b>: ${k.map((x, i) => `${i + 1}. ${esc(x.n)}${x.vriend ? ' 🤝' : ''}${x.rivaal ? ' ⚔️' : ''} (${fmt1(x.gem)})`).join(' · ')}</p>`; };
  const anderen = Object.keys(POS_MEERV).filter(p => p !== S.sp.pos);
  return `<div class="paneel"><span class="label">Scoutingranglijst · ${mv[0].toUpperCase() + mv.slice(1)}</span><ol class="ranglijst">${l.map((x, i) => `<li class="${x.jij ? 'mij' : ''}${i === RANG_TOP - 1 ? ' grens' : ''}"><span>${x.jij ? '<b>' + esc(x.n) + ' (jij)</b>' : x.vriend ? esc(x.n) + ' 🤝' : x.rivaal ? esc(x.n) + ' ⚔️' : esc(x.n)}</span><b>${fmt1(x.gem)}</b></li>`).join('')}</ol>
    <p class="muted klein-tekst">Boven de streep: de top ${RANG_TOP} van de ${mv}. 🤝 = je jeugd${vr.vriend}${l.some(x => x.rivaal) ? `, ⚔️ = je rivaal (${esc(l.find(x => x.rivaal).n)})` : ''}.</p>
    <details><summary class="label" style="cursor:pointer">Andere posities</summary>${anderen.map(kort).join('')}</details></div>`;
}
// Voor de eerste week: de 3 selectiewedstrijden die bepalen waar je carrière begint
export function vSelectie(){
  const sp = S.sp, Sel = S.selectie, n = Sel.cijfers.length, g = selGemiddelde(), V = startVoor(sp.leeftijd), r = mijnPlek();
  return `<div class="verhaal"><span class="label">Selectiedagen · wedstrijd ${n + 1} van ${SELECTIE_WED}</span>
      <h2>${n ? `Plek ${r.plek} van de ${r.van} ${r.meerv}` : 'Laat zien wat je kunt'}</h2>
      <p>${n ? `Je cijfers tot nu toe: <b>${Sel.cijfers.map(fmt1).join(' · ')}</b> (gemiddeld ${fmt1(g)}).` : `${esc(V.kort)} Je speelt ${SELECTIE_WED} selectiewedstrijden met andere talenten van jouw niveau. Scouts van alle clubs kijken mee.`}</p>
      <p class="muted">${SEL_UITLEG} Daarna kies je uit de clubs die je willen hebben.</p>
      <div class="ladder"><div><span class="label">≥ ${fmt1(7.5)}</span><b>${esc(DIVS[1])}</b></div><div><span class="label">≥ ${fmt1(6.5)}</span><b>${esc(DIVS[2])}</b></div><div><span class="label">lager</span><b>O23 van een club uit de ${esc(DIVS[2])}</b></div></div>
      <p class="muted klein-tekst">${POS[sp.pos].n} · ${sp.leeftijd} jaar · klasse ${ovr(sp)} · fitheid ${Math.round(sp.fit)}</p>
    </div>` + vRanglijst() + knop(`Speel selectiewedstrijd ${n + 1}`, startSelectie);
}
export function vSelectieEnd(){
  const M = S.M, Sel = S.selectie, klaar = !!Sel.bods, uitslag = M.us > M.them ? 'Gewonnen' : M.us < M.them ? 'Verloren' : 'Gelijkgespeeld';
  return scorebord() + `<div class="verhaal"><span class="label">Selectiewedstrijd ${Sel.cijfers.length} van ${SELECTIE_WED} · ${uitslag}</span>
    <div class="rij" style="gap:20px;align-items:flex-end"><div><span class="label">Jouw cijfer</span><div class="groot">${fmt1(M.cijfer)}</div></div>
    <div class="muted">${statRegel(M)}${M.rood ? ' · rode kaart' : ''}</div></div>
    ${M.focusTekst ? `<p class="${M.focusOmlaag ? 'fouttxt' : 'goedtxt'}">${esc(M.focusTekst)}</p>` : ''}${vFit(M)}
    <p class="melding">${esc(M.selTekst)}</p>${klaar ? `<p><b>${Sel.bods.length} clubs</b> willen met je praten!</p>` : ''}</div>` + vRanglijst() + vLog()
    + knop(klaar ? 'Bekijk de aanbiedingen' : 'Volgende selectiewedstrijd', naSelectie);
}
// De clubs die je na de selectiedagen willen hebben: jij kiest
const SOORT = {past:'Past bij je niveau', ambitie:'Ambitieus', veilig:'Veel speeltijd'};
export function vSelectieKeuze(){
  const Sel = S.selectie, vc = Sel.vriendClub, vn = S.sp.vriend ? S.sp.vriend.voornaam : null;
  const kaart = (o, i) => {
    const c = CLUBS[o.club], r = o.o23 ? null : rolBijClub(o.club, {...c, land:'nieuw'}), stijl = TACTIEKEN[clubTactiek(o.club)];
    return `<div class="bod ${o.soort === 'ambitie' ? 'door' : ''}"><span class="label">${SOORT[o.soort]} · ${o.o23 ? 'O23' : NIVEAU[c.t]} · ${esc(DIVS[c.t])}</span>
      <div class="club">${clubLogo(o.club, 40)}<span>${esc(c.n)}${o.o23 ? ' O23' : ''}</span></div>
      <p class="quote">${esc(o.quote)}</p>
      <dl><dt>Clubsterkte</dt><dd>${c.s}</dd><dt>Stand</dt><dd>${esc(clubPlek({club:o.club}))}</dd><dt>${salarisLabel(c.t)}</dt><dd>${geldTxt(o.salaris)}</dd><dt>Contract</dt><dd>${o.jaren} jaar</dd><dt>Speelstijl</dt><dd>${esc(stijl ? stijl.n : '–')}</dd></dl>
      <div class="rol"><span class="label">Jouw rol daar</span>${o.o23 ? '<b>Bij de O23</b><span class="risico r-gem">Bewijs je, dan haalt de trainer je naar het eerste</span>' : `<b>${r.status}</b><span class="risico ${r.plek[1]}">${r.plek[0]}</span>`}</div>
      ${vc && vc.club === o.club && vn && !vriendApart() ? `<p class="goedtxt klein-tekst">🤝 ${esc(vn)} tekent hier ook${vc.o23 ? ' (bij de O23)' : ''}.</p>` : ''}
      <div class="rij">${knop('Hier tekenen', () => tekenSelectie(i), 'hoofd', 'style="font-size:1.05rem;padding:10px 16px"')}</div></div>`;
  };
  const vElders = vc && vn && (vriendApart() || !Sel.bods.some(o => o.club === vc.club)) ? `<p class="muted">${esc(vn)} heeft al gekozen: ${vr.hij} tekent bij ${esc(vriendClubInfo(vc.club).n)}${vc.o23 ? ' (O23)' : ''}.</p>` : '';
  return `<div class="verhaal"><span class="label">Selectiedagen · de aanbiedingen</span><h2>Welke club past bij jou?</h2>
    <p>Gemiddeld een <b>${fmt1(selGemiddelde())}</b>, plek <b>${mijnPlek().plek}</b> van de ${POS_MEERV[S.sp.pos]}. Deze clubs willen je hebben. Let op je rol: bij een sterke club leer je veel, maar speel je minder.</p>${vElders}</div>
    <div class="aanbod">${Sel.bods.map(kaart).join('')}</div>`;
}
