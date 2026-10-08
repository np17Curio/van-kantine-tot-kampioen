import { herstel } from '../../core/migratie.js';
import { laad, setS, tmp } from '../../core/state.js';
import { act, knop } from '../../core/ui.js';
import { esc } from '../../core/utils.js';
import { CLUBS, DIVS, LANDEN_LIJST, NIVEAU, POS } from '../../data/gegevens.js';
import { SPEEL_LANDEN, zetLand } from '../../data/landen.js';
import { nieuwSpel } from '../../game/speler/status.js';

export const HERKOMST_IDS = ['geboren', 'vader', 'moeder'];

export function landSelect(id, label){
  return `<div><label class="label" for="${id}">${label}</label><select id="${id}">${LANDEN_LIJST.map(n => `<option ${tmp[id] === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>`;
}
export const herkomstUitTmp = () => ({geboren:tmp.geboren, vader:tmp.vader, moeder:tmp.moeder});
export function vHerkomstKeuze(){
  return `<div class="herkomst">${landSelect('geboren', 'Geboren in')}${landSelect('vader', 'Land van je vader')}${landSelect('moeder', 'Land van je moeder')}</div>`;
}

export const opgroeiKeuze = () => tmp.opgroei || (SPEEL_LANDEN.includes(tmp.geboren) ? tmp.geboren : 'Nederland');
export function vStart(){
  const opgeslagen = laad();
  zetLand(opgeslagen && opgeslagen.land || opgroeiKeuze());
  const posKnop = k => `<button class="keuze ${tmp.pos === k ? 'aan' : ''}" data-i="${act(() => { tmp.pos = k; })}"><span class="t">${POS[k].n}</span><span class="s">${k === 'SPITS' ? 'Goals maken, schieten, dribbelen' : k === 'MID' ? 'Passen, counters, vrije trappen' : 'Tackles, kopduels, opbouwen'}</span></button>`;
  return `<div class="verhaal">
      <span class="label">Nieuwe carrière</span>
      <h1>Van de kantine naar de top</h1>
      <p>Je bent 15 en speelt in de jeugd (O19) van een amateurclub. Speel goed en het 1e elftal haalt je erbij. Daarna wachten semi-prof, prof en misschien wel de Europese top. Speel slecht en de trainer stuurt je weg.</p>
      <p class="muted">Ook buiten het veld gebeurt van alles: school, feestjes, ongelukjes, de liefde en de media. Jouw keuzes bepalen je reputatie.</p>
    </div>
    ${opgeslagen ? `<div class="rij">${knop(`Verder met ${esc(opgeslagen.sp.naam)}`, () => { setS(herstel(opgeslagen)); })}<span class="muted">${esc(CLUBS[opgeslagen.sp.club].n)} · ${opgeslagen.sp.leeftijd} jaar</span></div>` : ''}
    <div class="invoer"><label class="label" for="naam">Naam van je speler</label><input id="naam" maxlength="24" placeholder="bijv. Daan de Kanon" value="${esc(tmp.naam)}"></div>
    <div><span class="label">Positie</span><div class="keuzes" style="margin-top:6px">${posKnop('SPITS')}${posKnop('MID')}${posKnop('VERD')}</div></div>
    <div style="display:grid;gap:8px"><span class="label">Afkomst</span>${vHerkomstKeuze()}<p class="muted klein-tekst">Hiermee bepaal je voor welke landen je later interlands kunt spelen.</p></div>
    <div style="display:grid;gap:8px"><label class="label" for="opgroei">Waar groei je op?</label><select id="opgroei">${SPEEL_LANDEN.map(n => `<option ${opgroeiKeuze() === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
      <p class="muted klein-tekst">Hier begin je je carrière, in de jeugd van een amateurclub. Elk land heeft zijn eigen competitie, clubs en kranten. De Europese Elite is voor iedereen hetzelfde.</p></div>
    ${knop('Start carrière', () => { nieuwSpel((tmp.naam || '').trim() || 'Daan de Kanon', tmp.pos, herkomstUitTmp(), opgroeiKeuze()); }, 'hoofd', opgeslagen ? `data-bevestig="Je opgeslagen carrière met ${esc(opgeslagen.sp.naam)} wordt overschreven." data-ja="Ja, nieuwe carrière"` : '')}`;
}
// Spelregels in het kort: op het startscherm en in het hulpvenster (?)
const UITLEG = [
  ['De week', 'Elke week kies je één ding: trainen, rusten, de trainer imponeren of uitgaan. Daarna speel je een wedstrijd waarin jouw keuzes tellen.'],
  ['Transfers', 'Bij de winterstop en in de zomer kunnen clubs van een niveau hoger je halen. Vanaf semi-prof kunnen clubs ook midden in het seizoen een bod op je doen. Jij beslist of je gaat.'],
  ['Status bij je club', 'Je status bij de club groeit als je lang en goed bij een club speelt: van jonkie en bankspeler tot vaste waarde, aanvoerder en clublegende. Speel je slecht, dan zak je terug naar de bank.'],
  ['Interlands', 'Speel je prof en goed, dan kan een bondscoach je oproepen voor een land waar jij of je ouders vandaan komen. Je zaakwaarnemer vertelt je wat je moet laten zien voor je droomclub.'],
  ['O23 en verhuur', 'Speel je een reeks slechte wedstrijden, dan zet de trainer je terug naar de O23. Als prof kun je dan ook verhuurd worden.'],
  ['Focus', 'Focus is belangrijk: hoe hoger, hoe meer er lukt. Vanaf 80 zit je in de flow, onder de 35 gaat het snel mis. Een 6 of lager kost focus, een 7,5 of hoger geeft focus. Je focus opkrikken kan met rust, mentale training, videoanalyse, elke week een extra ontspanningskeuze en spullen uit de winkel.'],
  ['Kaarten en schorsingen', 'Tackelen en opstootjes kunnen een gele of rode kaart opleveren. Vijf keer geel of een rode kaart betekent een schorsing.'],
  ['Uitblinken en sponsors', 'Haal je een 9 of hoger, dan krijg je +3 bij een willekeurige eigenschap. Als prof kloppen er ook sponsors bij je aan.'],
  ['School en privé', 'Tot je 18e ga je naar school: elke week een vraag. Slechte cijfers geven ruzie met je ouders. Feesten, ruzie en de liefde kosten focus.'],
];
export const hulpInhoud = () => `<dl class="uitleg">${UITLEG.map(([k, t]) => `<dt>${k}</dt><dd>${t}</dd>`).join('')}</dl>`;
export function vZijStart(){
  return `<div class="kaart"><h3>De weg naar boven</h3>
    <div class="ladder">${DIVS.map((d, i) => `<div><span class="label">${NIVEAU[i]}</span><b>${d}</b></div>`).reverse().join('')}</div>
    <details id="hulpPanel" class="uitlegpanel" ${tmp.hulpOpen ? 'open' : ''}><summary class="label">Hoe werkt het?</summary>${hulpInhoud()}</details>
    <p class="muted klein-tekst">Tip: met de <b>?</b> rechtsboven vind je de sneltoetsen en spelregels.</p></div>`;
}
