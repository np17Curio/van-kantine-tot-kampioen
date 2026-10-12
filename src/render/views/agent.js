import { S, club, tmp } from '../../core/state.js';
import { act, knop } from '../../core/ui.js';
import { clamp, esc } from '../../core/utils.js';
import { AGENT, AMATEUR, DIVS, JEUGD, NIVEAU } from '../../data/gegevens.js';
import { SPEEL_LANDEN, thuisLand } from '../../data/landen.js';
import { agentReset, clubIndex, clubsVanNiveau, doelBod, doelVan, eisenVoor, eliteClubs, eliteLand, infoVan, isHier, kaal, kiesDoel, norm, vraagAgent, wanneerBod, zoekClub } from '../../game/transfers/zaakwaarnemer.js';
import { rolRij } from './venster.js';

// Hoe ver ligt een club van jouw huidige niveau? (d = {club, land})
export function stapTag(d){
  const c = infoVan(d), eigen = club(), sprong = eigen.t - c.t;
  if (isHier(d)) return ['Jouw club', ''];
  if (sprong > 2) return ['Te grote stap', 'teveel'];
  if (sprong === 2) return ['Twee niveaus hoger', 'twee'];
  if (sprong === 1) return ['Stap omhoog', 'omhoog'];
  if (sprong === 0) return [c.s > eigen.s ? 'Sterker, zelfde niveau' : 'Zelfde niveau', ''];
  return ['Stap terug', ''];
}
export const clubNiveau = d => { const c = infoVan(d); return `${c.t === 0 ? `${DIVS[0]} · ${esc(eliteLand(d))}` : d.land ? `🌍 ${esc(d.land)} · ${esc(c.div)}` : DIVS[c.t]} · sterkte ${c.s}`; };
const suggKnop = d => `<button class="sugg" data-i="${act(() => { tmp.agentQ = ''; kiesDoel(d); })}" data-blijf data-naar="agentPanel"><b>${esc(infoVan(d).n)}</b><span class="niv">${clubNiveau(d)}</span></button>`;
// Live suggesties tijdens het typen, met land en niveau erbij
export function suggHtml(q){
  const n = norm(q || ''), k = kaal(q || '');
  if (!n) return '';
  let ds = clubIndex().filter(x => norm(x.n).includes(n) || (k.length >= 3 && kaal(x.n).includes(k))).map(x => doelVan(x.club, x.land));
  if (!ds.length){ const r = zoekClub(q); ds = r.doel ? [r.doel] : r.sugg || []; }
  return ds.slice(0, 6).map(suggKnop).join('');
}
// Eén club in de lijst, met de kies-knop (land: bij de Elite het land van de club erbij)
function clubRij(d, metLand){
  const [tag, cls] = stapTag(d), c = infoVan(d);
  return `<div class="clubrij ${isHier(d) ? 'mijn' : ''}"><div><span><b>${esc(c.n)}</b> <span class="niv">· ${metLand ? `${esc(eliteLand(d))} · ` : ''}sterkte ${c.s}</span></span><span class="tag ${cls}">${tag}</span></div>${isHier(d) ? '' : knop('Kies', () => { tmp.clubLijstOpen = false; kiesDoel(d); }, 'klein', 'data-blijf data-naar="agentPanel"')}</div>`;
}
// Alle clubs per niveau: de Europese Elite (de wereldtop, één competitie met clubs uit heel Europa) en per land (je eigen land eerst)
export function vClubOverzicht(){
  const eigen = club(), hier = thuisLand(), keuzes = ['elite', hier, ...SPEEL_LANDEN.filter(l => l !== hier)];
  const land = keuzes.includes(tmp.agentLand) ? tmp.agentLand : hier, thuis = land === hier;
  const naam = l => l === 'elite' ? `🏆 ${DIVS[0]}` : l === hier ? `${esc(l)} (hier)` : `🌍 ${esc(l)}`;
  let h = `<details class="clubs" id="clubLijstPanel" ${tmp.clubLijstOpen ? 'open' : ''}><summary class="label">Alle clubs per niveau</summary>
    <div class="landkeuze">${keuzes.map(l => knop(naam(l), () => { tmp.agentLand = l; tmp.clubLijstOpen = true; }, `klein${l === land ? ' actief' : ''}`, 'data-blijf data-naar="clubLijstPanel"')).join('')}</div>`;
  if (land === 'elite'){
    const ds = eliteClubs().sort((a, b) => infoVan(b).s - infoVan(a).s);
    return h + `<div class="clubgroep"><span class="label">${NIVEAU[0]} · ${DIVS[0]} · topclubs uit heel Europa${eigen.t === 0 ? ' · hier speel jij' : ''}</span>${ds.map(d => clubRij(d, true)).join('')}</div></details>`;
  }
  if (!thuis && S.sp.leeftijd < 18) h += `<p class="muted klein-tekst">Naar het buitenland kan pas vanaf je 18e.</p>`;
  for (let t = 0; t <= AMATEUR; t++){
    const ds = clubsVanNiveau(land, t).sort((a, b) => infoVan(b).s - infoVan(a).s);
    if (t === 0){
      h += `<div class="clubgroep"><span class="label">${NIVEAU[0]} · ${DIVS[0]}${thuis && eigen.t === 0 ? ' · hier speel jij' : ''}</span>${ds.length ? ds.map(d => clubRij(d)).join('') : `<p class="muted klein-tekst">Geen club uit ${esc(land)} in de ${DIVS[0]}.</p>`}</div>`;
      continue;
    }
    if (!ds.length) continue;
    const div = thuis ? DIVS[t] : infoVan(ds[0]).div;
    h += `<div class="clubgroep"><span class="label">${NIVEAU[t]} · ${esc(div)}${thuis && eigen.t === t ? ' · hier speel jij' : ''}</span>${ds.map(d => clubRij(d)).join('')}</div>`;
  }
  return h + `</details>`;
}
export function eisRij(x){
  const f = v => v === null ? '–' : x.fmt === 'cijfer' ? v.toFixed(1).replace('.', ',') : v;
  const pct = x.nu === null ? 0 : x.fmt === 'cijfer' ? clamp((x.nu - 5) / (x.nodig - 5), 0, 1) * 100 : clamp(x.nu / x.nodig, 0, 1) * 100;
  return `<div class="eis ${x.ok ? 'ok' : ''}"><span>${x.ok ? '✓ ' : ''}${x.label}</span><span class="b"><i style="width:${pct}%"></i></span><span class="v">${f(x.nu)} / ${f(x.nodig)}</span></div>`;
}
export function vAgent(){
  const sp = S.sp, ag = sp.agent, d = doelBod();
  if (club().t === JEUGD) return `<div class="paneel"><span class="label">Zaakwaarnemer</span><p class="muted">Je hebt nog geen zaakwaarnemer. Zodra je in een 1e elftal speelt, meldt ${AGENT} zich bij je.</p></div>`;
  let h = `<section id="agentPanel" class="paneel sectie"><h3 class="sectiekop">Zaakwaarnemer · ${AGENT}${d ? ` · droomclub ${esc(infoVan(d).n)}${d.land ? ` (🌍 ${esc(d.land)})` : ''}` : ''}</h3><div class="agentin">`;
  if (ag.antwoord) h += `<p class="quote">${esc(ag.antwoord)}</p>`;
  if (ag.sugg && ag.sugg.length) h += `<div class="sugglijst">${ag.sugg.map(x => suggKnop(typeof x === 'number' ? doelVan(x) : x)).join('')}</div>`;
  if (d){
    const c = infoVan(d), e = eisenVoor(d), ok = e.filter(x => x.ok).length;
    h += `<div class="doel"><div class="rij" style="justify-content:space-between"><b>${esc(c.n)}</b><span class="label">${d.land ? `🌍 ${esc(d.land)} · ` : ''}${NIVEAU[c.t]} · ${esc(d.land ? c.div : DIVS[c.t])} · sterkte ${c.s}</span></div>
      ${ag.gehaald ? `<p class="melding">Gehaald! Het bod van ${esc(c.n)} komt ${wanneerBod(d)}.</p>` : `<span class="label">Dit seizoen · ${ok} van ${e.length} eisen gehaald</span>`}
      <div class="eisen">${e.map(eisRij).join('')}</div>${rolRij(d.club, d.land ? c : undefined)}</div>`;
  }
  h += `<div class="agentvraag"><label class="label" for="agentInput">${d ? 'Andere club in gedachten?' : 'Bij welke club wil je spelen?'}</label>
    <div class="rij"><input id="agentInput" autocomplete="off" placeholder="Typ een clubnaam" value="${esc(tmp.agentQ || '')}">${knop('Vraag het', vraagAgent, 'hoofd middel', 'id="agentVraag" data-blijf data-naar="agentPanel"')}</div>
    <div class="sugglijst" id="agentSugg">${suggHtml(tmp.agentQ)}</div>
    ${vClubOverzicht()}
    <p class="muted klein-tekst">Hoe hoger de club, hoe meer je moet laten zien. Je kunt ook een club in een ander land kiezen (vanaf je 18e).</p>
    ${d ? `<div>${knop('Doel loslaten', () => agentReset('Prima. Zeg het maar als je een nieuw doel hebt.'), 'klein', 'data-blijf')}</div>` : ''}</div>`;
  return h + '</div></section>';
}
