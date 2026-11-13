import { herstel } from '../../core/migratie.js';
import { herstelSeizoenDelen } from '../../game/seizoen/seizoen.js';
import { SLOTS, laad, saves, setS, tmp, vrijeSlot, wis } from '../../core/state.js';
import { voornamenVoor } from '../../game/speler/journey.js';
import { act, knop } from '../../core/ui.js';
import { esc } from '../../core/utils.js';
import { DIVS, LANDEN_LIJST, NIVEAU, POS, zetWereld } from '../../data/gegevens.js';
import { SPEEL_LANDEN, zetLand } from '../../data/landen.js';
import { nieuwSpel } from '../../game/speler/status.js';
import { LEEFTIJDEN, START } from '../../game/speler/startverhaal.js';
import { BAARD_KEUZE, HAAR, HAAR_NAAM, HUID, KAPSEL_KEUZE, SCHOENEN, SCHOEN_NAAM, willekeurigUiterlijk } from '../../data/uiterlijk.js';
import { MAX_PERS, PERS, kanErBij, willekeurigePers, wisselPers } from '../../game/speler/persoonlijkheid.js';
import { BOUW, gewichtVan, groeiRest, lengteTxt, lengtesVoor, lichaamSamenvatting, standaardLengte } from '../../game/speler/lichaam.js';

export const HERKOMST_IDS = ['geboren', 'vader', 'moeder'];
// Opslag downloaden en laden (de afhandeling zit in main.js)
export const opslagKnoppen = () => `<div class="rij opslag"><button class="klein" id="opslagDown" type="button">💾 Opslag downloaden</button><label class="klein bestandknop">📂 Opslag laden<input type="file" id="opslagLaad" accept=".json,application/json" hidden></label></div>`;

export function landSelect(id, label){
  return `<div><label class="label" for="${id}">${label}</label><select id="${id}">${LANDEN_LIJST.map(n => `<option value="${esc(n)}" ${tmp[id] === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>`;
}
export const herkomstUitTmp = () => ({geboren:tmp.geboren, vader:tmp.vader, moeder:tmp.moeder});
export function vHerkomstKeuze(){
  return `<div class="herkomst">${landSelect('geboren', 'Geboren in')}${landSelect('vader', 'Land van je vader')}${landSelect('moeder', 'Land van je moeder')}</div>`;
}

export const opgroeiKeuze = () => tmp.opgroei || (SPEEL_LANDEN.includes(tmp.geboren) ? tmp.geboren : 'Nederland');
// Je speler aanmaken: huidskleur, haarkleur en kapsel, met je pixelspeler ernaast (render/pixel/voorbeeld.js)
function vUiterlijk(){
  const u = tmp.uiterlijk || (tmp.uiterlijk = willekeurigUiterlijk());
  if (!u.lengte) u.lengte = standaardLengte(tmp.pos, tmp.vrouw); if (!u.bmi) u.bmi = 22.5; if (!SCHOENEN[u.schoen]) u.schoen = 0; // lengte, bouw (lichaam.js) en de kleur van je schoenen
  // gezichtshaar: alleen jongens van 18 of 23 kiezen het nu (begin je op je 15e, dan groeit het later: game/week.js)
  const baardKiezen = !tmp.vrouw && (tmp.leeftijd || 15) >= 18;
  if (!baardKiezen) delete u.baard; else if (!BAARD_KEUZE.some(([b]) => b === u.baard)) u.baard = 'geen';
  const LENGTES = lengtesVoor(tmp.vrouw);
  // Jongen of meisje: een meisje speelt in het vrouwenvoetbal (andere competities, met de vrouwenteams van dezelfde clubs)
  const zetG = v => () => { if (!!tmp.vrouw === v) return; tmp.vrouw = v; u.lengte = standaardLengte(tmp.pos, v); u.kapsel = v ? 'staart' : 'model'; if (tmp.valtOp === undefined) tmp.valtOp = v ? 'm' : 'v'; else tmp.valtOp = tmp.valtOp === 'v' ? 'm' : 'v'; tmp.uitSleutel = Math.random().toString(36).slice(2, 10); };
  const geslacht = `<div><span class="label">Jongen of meisje?</span><div class="kapsels" role="group" aria-label="Jongen of meisje">${knop('👦 Jongen', zetG(false), 'klein' + (!tmp.vrouw ? ' aan' : ''), `data-blijf aria-pressed="${!tmp.vrouw}"`)}${knop('👧 Meisje', zetG(true), 'klein' + (tmp.vrouw ? ' aan' : ''), `data-blijf aria-pressed="${!!tmp.vrouw}"`)}</div>
        <p class="muted klein-tekst">${tmp.vrouw ? 'Je speelt in het vrouwenvoetbal: de vrouwenteams van dezelfde clubs, met hun eigen competities, toernooien en nationale teams.' : 'Je speelt in het mannenvoetbal.'}</p></div>`;
  if (!tmp.uitSleutel) tmp.uitSleutel = Math.random().toString(36).slice(2, 10);
  const vlak = (lijst, k, label, namen) => `<div class="kleurvlakken" role="group" aria-label="${label}">${lijst.map((kl, i) => `<button class="kleurvlak ${u[k] === i ? 'aan' : ''}" style="--kl:${kl}" aria-pressed="${u[k] === i}" aria-label="${label} ${namen ? namen[i] : `${i + 1} van ${lijst.length}`}" title="${namen ? namen[i] : ''}" data-i="${act(() => { u[k] = i; })}" data-blijf></button>`).join('')}</div>`;
  return `<div class="aanmaken">
    <figure class="portretfoto"><canvas id="pixelVoorbeeld" data-uit="${u.huid},${u.haar},${u.kapsel},${u.lengte},${u.bmi},${tmp.vrouw ? 1 : 0},${u.schoen},${u.baard || ''}" data-sleutel="${tmp.uitSleutel}" role="img" aria-label="Jouw ${tmp.vrouw ? 'speelster' : 'speler'}"></canvas><span class="reellabel" aria-hidden="true"></span></figure>
    <div class="aanmaakkeuzes">
      ${geslacht}
      <div class="invoer"><label class="label" for="naam">Naam van je ${tmp.vrouw ? 'speelster' : 'speler'}</label><input id="naam" maxlength="24" placeholder="bijv. ${tmp.vrouw ? 'Lieke de Raket' : 'Daan de Kanon'}" value="${esc(tmp.naam)}"></div>
      <div><span class="label">Huidskleur</span>${vlak(HUID, 'huid', 'Huidskleur')}</div>
      <div><span class="label">Haarkleur</span>${vlak(HAAR, 'haar', 'Haarkleur', HAAR_NAAM)}</div>
      <div><span class="label">Voetbalschoenen</span>${vlak(SCHOENEN, 'schoen', 'Voetbalschoenen', SCHOEN_NAAM)}</div>
      <div><span class="label">Kapsel</span><div class="kapsels" role="group" aria-label="Kapsel">${KAPSEL_KEUZE.map(([k, l]) => knop(l, () => { u.kapsel = k; }, 'klein' + (u.kapsel === k ? ' aan' : ''), `data-blijf aria-pressed="${u.kapsel === k}"`)).join('')}</div></div>
      ${baardKiezen ? `<div><span class="label">Gezichtshaar</span><div class="kapsels" role="group" aria-label="Gezichtshaar">${BAARD_KEUZE.map(([b, l]) => knop(l, () => { u.baard = b; }, 'klein' + (u.baard === b ? ' aan' : ''), `data-blijf aria-pressed="${u.baard === b}"`)).join('')}</div></div>` : !tmp.vrouw ? `<p class="muted klein-tekst">Gezichtshaar: begin je op je 15e, dan groeit je baard later. Rond je 18e kies je bij de kapper wat je ermee doet.</p>` : ''}
      <div><span class="label">${(tmp.leeftijd || 15) < 23 ? 'Lengte nu' : 'Lengte'} · ${lengteTxt(u.lengte)}</span><div class="kapsels" role="group" aria-label="Lengte">${LENGTES.map(l => knop(lengteTxt(l), () => { u.lengte = l; }, 'klein' + (u.lengte === l ? ' aan' : ''), `data-blijf aria-pressed="${u.lengte === l}"`)).join('')}</div>${(() => { const r = groeiRest(tmp.leeftijd || 15, !!tmp.vrouw); return r >= 1 ? `<p class="muted klein-tekst">Je bent nog in de groei: je wordt waarschijnlijk ongeveer ${lengteTxt(Math.round(u.lengte + r * .6))}–${lengteTxt(Math.round(u.lengte + r * 1.4))} (tot je 23e).</p>` : ''; })()}</div>
      <div><span class="label">Bouw · ${gewichtVan(u.lengte, u.bmi)} kg</span><div class="kapsels" role="group" aria-label="Bouw">${BOUW.map(b => knop(b.n, () => { u.bmi = b.bmi; }, 'klein' + (u.bmi === b.bmi ? ' aan' : ''), `data-blijf aria-pressed="${u.bmi === b.bmi}"`)).join('')}</div>
        <p class="muted klein-tekst">${lichaamSamenvatting({...u, vrouw:!!tmp.vrouw})}. Lang = sterk in de lucht, klein en tenger = snel, zwaar = sterk in duels maar sneller moe.</p></div>
      <div>${knop('🎲 Verras me', () => { tmp.uiterlijk = {...willekeurigUiterlijk(tmp.vrouw), lengte:LENGTES[Math.floor(Math.random() * LENGTES.length)], bmi:BOUW[Math.floor(Math.random() * BOUW.length)].bmi, baard:BAARD_KEUZE[Math.floor(Math.random() * BAARD_KEUZE.length)][0]}; tmp.uitSleutel = Math.random().toString(36).slice(2, 10); }, 'klein', 'data-blijf')}</div>
    </div></div>`;
}
// Wie ben je? Maximaal 3 persoonlijkheden, die bepalen hoe je bent in en buiten het veld
function vPersoonlijkheid(){
  const l = tmp.pers || (tmp.pers = []);
  return `<div><span class="label">Persoonlijkheid · kies er maximaal ${MAX_PERS} (${l.length}/${MAX_PERS})</span>
    <div class="keuzes persoonlijkheden" style="margin-top:6px">${Object.entries(PERS).map(([id, p]) => { const aan = l.includes(id), waarom = kanErBij(l, id);
      return `<button class="keuze pers ${aan ? 'aan' : ''} ${!aan && waarom ? 'geblokt' : ''}" aria-pressed="${aan}" ${!aan && waarom ? `aria-disabled="true" title="${esc(waarom)}"` : ''} data-i="${act(() => { tmp.pers = wisselPers(tmp.pers || [], id); })}" data-blijf><span class="t">${p.i} ${p.n}</span><span class="v"><b>In het veld:</b> ${esc(p.veld)}</span><span class="v"><b>Buiten het veld:</b> ${esc(p.buiten)}</span>${!aan && waarom ? `<span class="s fouttxt">${esc(waarom)}</span>` : ''}</button>`; }).join('')}</div>
    <div class="rij" style="margin-top:6px">${knop('🎲 Verras me', () => { tmp.pers = willekeurigePers(2); }, 'klein', 'data-blijf')}${l.length ? knop('Geen persoonlijkheid', () => { tmp.pers = []; }, 'klein', 'data-blijf') : '<span class="muted klein-tekst">Je mag ook niets kiezen: dan ben je een gewone speler.</span>'}</div></div>`;
}
// Hoe oud ben je? Elke leeftijd is een ander verhaal
function vLeeftijd(){
  return `<div><span class="label">Leeftijd en verhaal</span><div class="keuzes leeftijden" style="margin-top:6px">${LEEFTIJDEN.map(l => { const V = START[l];
    return `<button class="keuze leeftijd ${tmp.leeftijd === l ? 'aan' : ''}" aria-pressed="${tmp.leeftijd === l}" data-i="${act(() => { tmp.leeftijd = l; })}" data-blijf><span class="t"><b>${l}</b> · ${V.titel}</span><span class="v">${V.kort}</span><span class="s">${V.waar}</span></button>`; }).join('')}</div></div>`;
}
// Je carrières: verder spelen of verwijderen (5 opslagplekken)
function vSaves(){
  const l = saves().filter(x => !x.leeg); if (!l.length) return '';
  const verder = slot => () => { const d = laad(slot); if (!d) return; const st = herstel(d); st.slot = slot; setS(st); herstelSeizoenDelen(); };
  return `<div class="paneel"><span class="label">Jouw carrières · ${l.length} van ${SLOTS}</span>${l.map(x => `<div class="eisrij"><span><b>${esc(x.naam)}</b> <span class="muted klein-tekst">${esc([x.rol, x.club, x.leeftijd ? `${x.leeftijd} jaar` : '', x.seizoen, x.einde ? 'carrière voorbij' : ''].filter(Boolean).join(' · '))}</span></span>
    ${knop('Verder', verder(x.slot), 'klein')}${knop('🗑', () => { wis(x.slot); if (tmp.slot === x.slot) tmp.slot = null; }, 'klein', `data-blijf title="Verwijderen" data-bevestig="De carrière van ${esc(x.naam)} wordt verwijderd. Dit kun je niet ongedaan maken." data-ja="Ja, verwijderen"`)}</div>`).join('')}</div>`;
}
// Waar komt de nieuwe carrière? De eerste vrije plek; zijn ze allemaal vol, dan kies je welke je overschrijft
function nieuweSlot(){ const v = vrijeSlot(); if (v) return v; return tmp.slot || null; }
function vSlotKeuze(){
  if (vrijeSlot()) return '';
  return `<div class="paneel"><span class="label">Alle ${SLOTS} plekken zijn vol. Welke carrière mag weg?</span><div class="rij" style="gap:6px;flex-wrap:wrap">${saves().map(x => knop(`${x.slot}. ${esc(x.naam || '')}`, () => { tmp.slot = x.slot; }, 'klein' + (tmp.slot === x.slot ? ' aan' : ''), 'data-blijf')).join('')}</div></div>`;
}
const POS_UITLEG = {SPITS:'Goals maken, schieten, dribbelen', MID:'Passen, counters, vrije trappen', VERD:'Tackles, kopduels, opbouwen', KEEPER:'Reddingen, uittrappen, de baas in de zestien'};
// Je beste vriend(in): naam, positie en of het een jongen of een meisje is (groeit samen met jou op).
// Is het iemand van het andere geslacht, dan speelt die in de andere competitie: nooit met of tegen jou
function vVriend(){
  const vv = tmp.vriendVrouw === undefined ? !!tmp.vrouw : tmp.vriendVrouw, NAMEN = voornamenVoor(vv);
  if (!tmp.vriendVoorbeeld || !NAMEN.includes(tmp.vriendVoorbeeld)) tmp.vriendVoorbeeld = NAMEN[Math.floor(Math.random() * NAMEN.length)];
  const vp = tmp.vriendPos || tmp.pos, wie = vv ? 'vriendin' : 'vriend';
  return `<div><span class="label">Je beste ${wie}</span><div class="kapsels" role="group" aria-label="Vriend of vriendin" style="margin-bottom:6px">${knop('Vriend', () => { tmp.vriendVrouw = false; }, 'klein' + (!vv ? ' aan' : ''), 'data-blijf')}${knop('Vriendin', () => { tmp.vriendVrouw = true; }, 'klein' + (vv ? ' aan' : ''), 'data-blijf')}</div><div class="invoer"><label class="label" for="vriendNaam">Naam (voornaam en eventueel achternaam)</label><input id="vriendNaam" maxlength="24" placeholder="bijv. ${esc(tmp.vriendVoorbeeld)}" value="${esc(tmp.vriendNaam || '')}"></div>
    <div class="rij" style="gap:6px;flex-wrap:wrap;margin-top:6px"><span class="muted klein-tekst">Positie:</span>${Object.keys(POS).map(k => knop(POS[k].n, () => { tmp.vriendPos = k; }, 'klein' + (vp === k ? ' aan' : ''), 'data-blijf')).join('')}${knop('🎲', () => { tmp.vriendNaam = NAMEN[Math.floor(Math.random() * NAMEN.length)]; }, 'klein', 'data-blijf title="Willekeurige naam"')}</div>
    <p class="muted klein-tekst">Jullie groeiden samen op en droomden van dezelfde carrière. ${vv === !!tmp.vrouw ? 'Speel je op een andere plek, dan zitten jullie elkaar niet in de weg als jullie bij dezelfde club spelen.' : `Je ${wie} speelt in het ${vv ? 'vrouwen' : 'mannen'}voetbal: jullie spelen nooit samen of tegen elkaar, maar volgen elkaars carrière van dichtbij.`}</p></div>
    <div><span class="label">De liefde: je valt op</span><div class="kapsels" role="group" aria-label="Je valt op">${knop('Jongens', () => { tmp.valtOp = 'm'; }, 'klein' + (valtOp() === 'm' ? ' aan' : ''), 'data-blijf')}${knop('Meisjes', () => { tmp.valtOp = 'v'; }, 'klein' + (valtOp() === 'v' ? ' aan' : ''), 'data-blijf')}</div></div>`;
}
const valtOp = () => tmp.valtOp || (tmp.vrouw ? 'm' : 'v');
export function vStart(){
  zetWereld(tmp.vrouw ? 'v' : 'm'); zetLand(opgroeiKeuze());
  const posKnop = k => `<button class="keuze ${tmp.pos === k ? 'aan' : ''}" data-i="${act(() => { tmp.pos = k; })}"><span class="t">${POS[k].n}</span><span class="s">${POS_UITLEG[k]}</span></button>`;
  const slot = nieuweSlot(), bezet = slot && saves().find(x => x.slot === slot && !x.leeg);
  return `<div class="verhaal">
      <span class="label">Nieuwe carrière</span>
      <h1>Het Grote Doorbreken</h1>
      <p>Maak je speler en kies hoe je begint: als wonderkind, gewoon als 18-jarige of als laatbloeier die zich moet bewijzen. Je begint met 3 selectiewedstrijden: speel je goed, dan tekent een club uit de hoogste league; speel je slecht, dan begin je bij de O23. Van daaruit klim je misschien wel naar de Europese top.</p>
      <p class="muted">Ook buiten het veld gebeurt van alles: school, feestjes, ongelukjes, de liefde en de media. Jouw keuzes bepalen je reputatie.</p>
    </div>
    ${vSaves()}
    ${opslagKnoppen()}
    <span class="label">Nieuwe carrière</span>
    ${vUiterlijk()}
    ${vLeeftijd()}
    ${vPersoonlijkheid()}
    <div><span class="label">Positie</span><div class="keuzes" style="margin-top:6px">${posKnop('SPITS')}${posKnop('MID')}${posKnop('VERD')}${posKnop('KEEPER')}</div></div>
    ${vVriend()}
    <div style="display:grid;gap:8px"><span class="label">Afkomst</span>${vHerkomstKeuze()}<p class="muted klein-tekst">Hiermee bepaal je voor welke landen je later interlands kunt spelen.</p></div>
    <div style="display:grid;gap:8px"><label class="label" for="opgroei">Waar groei je op?</label><select id="opgroei">${SPEEL_LANDEN.map(n => `<option value="${esc(n)}" ${opgroeiKeuze() === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
      <p class="muted klein-tekst">Hier begin je je carrière. Elk land heeft zijn eigen competitie, clubs en kranten. De nummers 1 en 2 van elke hoogste competitie spelen de Champions League.</p></div>
    ${vSlotKeuze()}
    ${slot ? knop('Start carrière', () => { nieuwSpel((tmp.naam || '').trim() || (tmp.vrouw ? 'Lieke de Raket' : 'Daan de Kanon'), tmp.pos, herkomstUitTmp(), opgroeiKeuze(), {leeftijd:tmp.leeftijd || 15, uiterlijk:tmp.uiterlijk, sleutel:tmp.uitSleutel, pers:tmp.pers || [], slot, vrouw:!!tmp.vrouw, valtOp:valtOp(), vriend:{naam:(tmp.vriendNaam || '').trim(), pos:tmp.vriendPos || tmp.pos, vrouw:tmp.vriendVrouw === undefined ? !!tmp.vrouw : tmp.vriendVrouw}}); }, 'hoofd', bezet ? `data-bevestig="De carrière van ${esc(bezet.naam)} wordt overschreven." data-ja="Ja, overschrijven"` : '') : '<p class="muted">Kies eerst welke carrière mag worden overschreven.</p>'}`;
}
// Spelregels in het kort: op het startscherm en in het hulpvenster (?)
const UITLEG = [
  ['Selectiedagen', 'Je carrière begint met 3 selectiewedstrijden. Gemiddeld een 7,5 of hoger: een club uit de hoogste league. Een 6,5 of hoger: een club uit de league daaronder. Lager: de O23 van een club uit die league. Hoe hoger je cijfer, hoe sterker de club.'],
  ['De week', 'Elke week kies je één ding: trainen, rusten, de trainer imponeren of uitgaan. Daarna speel je een wedstrijd waarin jouw keuzes tellen.'],
  ['Transfers', 'Bij de winterstop en in de zomer kunnen sterkere clubs of clubs uit de hoogste league je halen. Clubs kunnen ook midden in het seizoen een bod op je doen. Jij beslist of je gaat.'],
  ['Status bij je club', 'Je status bij de club groeit als je lang en goed bij een club speelt: van jonkie en bankspeler tot vaste waarde, aanvoerder en clublegende. Speel je slecht, dan zak je terug naar de bank.'],
  ['Interlands', 'Speel je prof en goed, dan kan een bondscoach je oproepen voor een land waar jij of je ouders vandaan komen. Je zaakwaarnemer vertelt je wat je moet laten zien voor je droomclub.'],
  ['O23 en verhuur', 'Speel je een reeks slechte wedstrijden, dan zet de trainer je terug naar de O23. Als prof kun je dan ook verhuurd worden.'],
  ['Focus', 'Focus is belangrijk: hoe hoger, hoe meer er lukt. Vanaf 80 zit je in de flow, onder de 35 gaat het snel mis. Een 6 of lager kost focus, een 7,5 of hoger geeft focus. Je focus opkrikken kan met rust, mentale training, videoanalyse, elke week een extra ontspanningskeuze en spullen uit de winkel.'],
  ['Kaarten en schorsingen', 'Tackelen en opstootjes kunnen een gele of rode kaart opleveren. Vijf keer geel of een rode kaart betekent een schorsing.'],
  ['Uitblinken en sponsors', 'Haal je een 9 of hoger, dan maak je kans op +1 bij een willekeurige eigenschap. Als prof kloppen er ook sponsors bij je aan.'],
  ['School en privé', 'Tot je 18e ga je naar school: elke week een vraag. Slechte cijfers geven ruzie met je ouders. Feesten, ruzie en de liefde kosten focus.'],
];
export const hulpInhoud = () => `<dl class="uitleg">${UITLEG.map(([k, t]) => `<dt>${k}</dt><dd>${t}</dd>`).join('')}</dl>`;
export function vZijStart(){
  return `<div class="kaart"><h3>De weg naar boven</h3>
    <div class="ladder">${DIVS.slice(1).map((d, i) => `<div><span class="label">${NIVEAU[i + 1]}</span><b>${d}</b></div>`).reverse().join('')}<div><span class="label">Europa</span><b>Champions League (nummers 1 en 2)</b></div><div><span class="label">Elke club</span><b>O23</b></div></div>
    <details id="hulpPanel" class="uitlegpanel" ${tmp.hulpOpen ? 'open' : ''}><summary class="label">Hoe werkt het?</summary>${hulpInhoud()}</details>
    <p class="muted klein-tekst">Tip: met de <b>?</b> rechtsboven vind je de sneltoetsen en spelregels.</p></div>`;
}
