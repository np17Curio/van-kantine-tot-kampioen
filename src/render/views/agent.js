import { S, club, tmp } from '../../core/state.js';
import { act, knop } from '../../core/ui.js';
import { clamp, esc } from '../../core/utils.js';
import { AGENT, AMATEUR, CLUBS, DIVS, JEUGD, NIVEAU, divClubs } from '../../data/gegevens.js';
import { SENIOR, agentReset, eisenVoor, kaal, kiesDoel, norm, vraagAgent, zoekClub } from '../../game/transfers/zaakwaarnemer.js';
import { rolRij } from './venster.js';

// Hoe ver ligt een club van jouw huidige niveau?
export function stapTag(id){
  const sp = S.sp, c = CLUBS[id], eigen = club(), sprong = eigen.t - c.t;
  if (id === sp.club) return ['Jouw club', ''];
  if (sprong > 2) return ['Te grote stap', 'teveel'];
  if (sprong === 2) return ['Twee niveaus hoger', 'twee'];
  if (sprong === 1) return ['Stap omhoog', 'omhoog'];
  if (sprong === 0) return [c.s > eigen.s ? 'Sterker, zelfde niveau' : 'Zelfde niveau', ''];
  return ['Stap terug', ''];
}
export const clubNiveau = id => `${DIVS[CLUBS[id].t]} · sterkte ${CLUBS[id].s}`;
// Live suggesties tijdens het typen, met niveau erbij
export function suggHtml(q){
  const n = norm(q || ''), k = kaal(q || '');
  if (!n) return '';
  let ids = SENIOR.filter(i => norm(CLUBS[i].n).includes(n) || (k.length >= 3 && kaal(CLUBS[i].n).includes(k)));
  if (!ids.length){ const r = zoekClub(q); ids = r.club !== undefined ? [r.club] : r.sugg || []; }
  return ids.slice(0, 6).map(i => `<button class="sugg" data-i="${act(() => { tmp.agentQ = ''; kiesDoel(i); })}" data-blijf data-naar="agentPanel"><b>${esc(CLUBS[i].n)}</b><span class="niv">${clubNiveau(i)}</span></button>`).join('');
}
export function vClubOverzicht(){
  const sp = S.sp, eigen = club();
  let h = `<details class="clubs" id="clubLijstPanel" ${tmp.clubLijstOpen ? 'open' : ''}><summary class="label">Alle clubs per niveau</summary>`;
  for (let t = 0; t <= AMATEUR; t++){
    const ids = divClubs(t).slice().sort((a, b) => CLUBS[b].s - CLUBS[a].s);
    h += `<div class="clubgroep"><span class="label">${NIVEAU[t]} · ${DIVS[t]}${eigen.t === t ? ' · hier speel jij' : ''}</span>`;
    for (const i of ids){
      const [tag, cls] = stapTag(i);
      h += `<div class="clubrij ${i === sp.club ? 'mijn' : ''}"><div><span><b>${esc(CLUBS[i].n)}</b> <span class="niv">· sterkte ${CLUBS[i].s}</span></span><span class="tag ${cls}">${tag}</span></div>${i === sp.club ? '' : knop('Kies', () => { tmp.clubLijstOpen = false; kiesDoel(i); }, 'klein', 'data-blijf data-naar="agentPanel"')}</div>`;
    }
    h += `</div>`;
  }
  return h + `</details>`;
}
export function eisRij(x){
  const f = v => v === null ? '–' : x.fmt === 'cijfer' ? v.toFixed(1).replace('.', ',') : v;
  const pct = x.nu === null ? 0 : x.fmt === 'cijfer' ? clamp((x.nu - 5) / (x.nodig - 5), 0, 1) * 100 : clamp(x.nu / x.nodig, 0, 1) * 100;
  return `<div class="eis ${x.ok ? 'ok' : ''}"><span>${x.ok ? '✓ ' : ''}${x.label}</span><span class="b"><i style="width:${pct}%"></i></span><span class="v">${f(x.nu)} / ${f(x.nodig)}</span></div>`;
}
export function vAgent(){
  const sp = S.sp, ag = sp.agent;
  if (club().t === JEUGD) return `<div class="paneel"><span class="label">Zaakwaarnemer</span><p class="muted">Je hebt nog geen zaakwaarnemer. Zodra je in een 1e elftal speelt, meldt ${AGENT} zich bij je.</p></div>`;
  let h = `<section id="agentPanel" class="paneel sectie"><h3 class="sectiekop">Zaakwaarnemer · ${AGENT}${ag.doel != null ? ` · droomclub ${esc(CLUBS[ag.doel].n)}` : ''}</h3><div class="agentin">`;
  if (ag.antwoord) h += `<p class="quote">${esc(ag.antwoord)}</p>`;
  if (ag.sugg && ag.sugg.length) h += `<div class="sugglijst">${ag.sugg.map(i => `<button class="sugg" data-i="${act(() => kiesDoel(i))}" data-blijf data-naar="agentPanel"><b>${esc(CLUBS[i].n)}</b><span class="niv">${clubNiveau(i)}</span></button>`).join('')}</div>`;
  if (ag.doel != null){
    const c = CLUBS[ag.doel], e = eisenVoor(ag.doel), ok = e.filter(x => x.ok).length;
    h += `<div class="doel"><div class="rij" style="justify-content:space-between"><b>${esc(c.n)}</b><span class="label">${NIVEAU[c.t]} · ${DIVS[c.t]} · sterkte ${c.s}</span></div>
      ${ag.gehaald ? `<p class="melding">Gehaald! Het bod van ${esc(c.n)} komt in de volgende transferperiode.</p>` : `<span class="label">Dit seizoen · ${ok} van ${e.length} eisen gehaald</span>`}
      <div class="eisen">${e.map(eisRij).join('')}</div>${rolRij(ag.doel)}</div>`;
  }
  h += `<div class="agentvraag"><label class="label" for="agentInput">${ag.doel != null ? 'Andere club in gedachten?' : 'Bij welke club wil je spelen?'}</label>
    <div class="rij"><input id="agentInput" autocomplete="off" placeholder="Typ een clubnaam" value="${esc(tmp.agentQ || '')}">${knop('Vraag het', vraagAgent, 'hoofd middel', 'id="agentVraag" data-blijf data-naar="agentPanel"')}</div>
    <div class="sugglijst" id="agentSugg">${suggHtml(tmp.agentQ)}</div>
    ${vClubOverzicht()}
    <p class="muted klein-tekst">Hoe hoger de club, hoe meer je moet laten zien.</p>
    ${ag.doel != null ? `<div>${knop('Doel loslaten', () => agentReset('Prima. Zeg het maar als je een nieuw doel hebt.'), 'klein', 'data-blijf')}</div>` : ''}</div>`;
  return h + '</div></section>';
}
