import { herstel } from '../../core/migratie.js';
import { laad, setS, tmp } from '../../core/state.js';
import { act, knop } from '../../core/ui.js';
import { esc } from '../../core/utils.js';
import { CLUBS, DIVS, LANDEN_LIJST, NIVEAU, POS } from '../../data/gegevens.js';
import { SPEEL_LANDEN, zetLand } from '../../data/landen.js';
import { nieuwSpel } from '../../game/speler/status.js';
import { LEEFTIJDEN, START } from '../../game/speler/startverhaal.js';
import { HAAR, HAAR_NAAM, HUID, KAPSEL_KEUZE, willekeurigUiterlijk } from '../../data/uiterlijk.js';

export const HERKOMST_IDS = ['geboren', 'vader', 'moeder'];

export function landSelect(id, label){
  return `<div><label class="label" for="${id}">${label}</label><select id="${id}">${LANDEN_LIJST.map(n => `<option ${tmp[id] === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>`;
}
export const herkomstUitTmp = () => ({geboren:tmp.geboren, vader:tmp.vader, moeder:tmp.moeder});
export function vHerkomstKeuze(){
  return `<div class="herkomst">${landSelect('geboren', 'Geboren in')}${landSelect('vader', 'Land van je vader')}${landSelect('moeder', 'Land van je moeder')}</div>`;
}

export const opgroeiKeuze = () => tmp.opgroei || (SPEEL_LANDEN.includes(tmp.geboren) ? tmp.geboren : 'Nederland');
// Je speler aanmaken: huidskleur, haarkleur en kapsel, met een portret in 3D (gemaakt in de fotostudio)
function vUiterlijk(){
  const u = tmp.uiterlijk || (tmp.uiterlijk = willekeurigUiterlijk());
  if (!tmp.uitSleutel) tmp.uitSleutel = Math.random().toString(36).slice(2, 10);
  const vlak = (lijst, k, label, namen) => `<div class="kleurvlakken" role="group" aria-label="${label}">${lijst.map((kl, i) => `<button class="kleurvlak ${u[k] === i ? 'aan' : ''}" style="--kl:${kl}" aria-pressed="${u[k] === i}" aria-label="${label} ${namen ? namen[i] : `${i + 1} van ${lijst.length}`}" title="${namen ? namen[i] : ''}" data-i="${act(() => { u[k] = i; })}" data-blijf></button>`).join('')}</div>`;
  return `<div class="aanmaken">
    <figure class="portretfoto"><img data-foto="portret" data-uit="${u.huid},${u.haar},${u.kapsel}" data-sleutel="${tmp.uitSleutel}" alt="Jouw speler"><span class="ontwikkel">Foto laden…</span></figure>
    <div class="aanmaakkeuzes">
      <div class="invoer"><label class="label" for="naam">Naam van je speler</label><input id="naam" maxlength="24" placeholder="bijv. Daan de Kanon" value="${esc(tmp.naam)}"></div>
      <div><span class="label">Huidskleur</span>${vlak(HUID, 'huid', 'Huidskleur')}</div>
      <div><span class="label">Haarkleur</span>${vlak(HAAR, 'haar', 'Haarkleur', HAAR_NAAM)}</div>
      <div><span class="label">Kapsel</span><div class="kapsels" role="group" aria-label="Kapsel">${KAPSEL_KEUZE.map(([k, l]) => knop(l, () => { u.kapsel = k; }, 'klein' + (u.kapsel === k ? ' aan' : ''), `data-blijf aria-pressed="${u.kapsel === k}"`)).join('')}</div></div>
      <div>${knop('🎲 Verras me', () => { tmp.uiterlijk = willekeurigUiterlijk(); tmp.uitSleutel = Math.random().toString(36).slice(2, 10); }, 'klein', 'data-blijf')}</div>
    </div></div>`;
}
// Hoe oud ben je? Elke leeftijd is een ander verhaal
function vLeeftijd(){
  return `<div><span class="label">Leeftijd en verhaal</span><div class="keuzes leeftijden" style="margin-top:6px">${LEEFTIJDEN.map(l => { const V = START[l];
    return `<button class="keuze leeftijd ${tmp.leeftijd === l ? 'aan' : ''}" aria-pressed="${tmp.leeftijd === l}" data-i="${act(() => { tmp.leeftijd = l; })}" data-blijf><span class="t"><b>${l}</b> · ${V.titel}</span><span class="v">${V.kort}</span><span class="s">${V.waar}</span></button>`; }).join('')}</div></div>`;
}
export function vStart(){
  const opgeslagen = laad();
  zetLand(opgeslagen && opgeslagen.land || opgroeiKeuze());
  const posKnop = k => `<button class="keuze ${tmp.pos === k ? 'aan' : ''}" data-i="${act(() => { tmp.pos = k; })}"><span class="t">${POS[k].n}</span><span class="s">${k === 'SPITS' ? 'Goals maken, schieten, dribbelen' : k === 'MID' ? 'Passen, counters, vrije trappen' : 'Tackles, kopduels, opbouwen'}</span></button>`;
  return `<div class="verhaal">
      <span class="label">Nieuwe carrière</span>
      <h1>Van de kantine naar de top</h1>
      <p>Maak je speler en kies hoe je begint: als wonderkind, gewoon als 18-jarige of als laatbloeier die zich moet bewijzen. Speel goed en je klimt via semi-prof en prof misschien wel naar de Europese top. Speel slecht en de trainer stuurt je weg.</p>
      <p class="muted">Ook buiten het veld gebeurt van alles: school, feestjes, ongelukjes, de liefde en de media. Jouw keuzes bepalen je reputatie.</p>
    </div>
    ${opgeslagen ? `<div class="rij">${knop(`Verder met ${esc(opgeslagen.sp.naam)}`, () => { setS(herstel(opgeslagen)); })}<span class="muted">${esc(CLUBS[opgeslagen.sp.club].n)} · ${opgeslagen.sp.leeftijd} jaar</span></div>` : ''}
    ${vUiterlijk()}
    ${vLeeftijd()}
    <div><span class="label">Positie</span><div class="keuzes" style="margin-top:6px">${posKnop('SPITS')}${posKnop('MID')}${posKnop('VERD')}</div></div>
    <div style="display:grid;gap:8px"><span class="label">Afkomst</span>${vHerkomstKeuze()}<p class="muted klein-tekst">Hiermee bepaal je voor welke landen je later interlands kunt spelen.</p></div>
    <div style="display:grid;gap:8px"><label class="label" for="opgroei">Waar groei je op?</label><select id="opgroei">${SPEEL_LANDEN.map(n => `<option ${opgroeiKeuze() === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
      <p class="muted klein-tekst">Hier begin je je carrière. Elk land heeft zijn eigen competitie, clubs en kranten. De Europese Elite is voor iedereen hetzelfde.</p></div>
    ${knop('Start carrière', () => { nieuwSpel((tmp.naam || '').trim() || 'Daan de Kanon', tmp.pos, herkomstUitTmp(), opgroeiKeuze(), {leeftijd:tmp.leeftijd || 15, uiterlijk:tmp.uiterlijk, sleutel:tmp.uitSleutel}); },'hoofd', opgeslagen ? `data-bevestig="Je opgeslagen carrière met ${esc(opgeslagen.sp.naam)} wordt overschreven." data-ja="Ja, nieuwe carrière"` : '')}`;
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
