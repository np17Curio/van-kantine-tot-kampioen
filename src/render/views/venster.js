import { S, club, salarisLabel, tmp } from '../../core/state.js';
import { knop } from '../../core/ui.js';
import { esc, geldTxt } from '../../core/utils.js';
import { DIVS, NIVEAU } from '../../data/gegevens.js';
import { stoppen } from '../../game/seizoen/seizoen.js';
import { gaHuren } from '../../game/speler/o23.js';
import { rolBijClub } from '../../game/speler/status.js';
import { clubInfo, isBuitenland, okey } from '../../game/transfers/buitenland.js';
import { blijfVoorPartner, praatMetPartner } from '../../game/prive/buitenland-leven.js';
import { kinderen } from '../../game/prive/gezin.js';
import { thuisLand } from '../../data/landen.js';
import { ohStart, vOnderhandel } from '../../game/transfers/onderhandelen.js';
import { blijf, blijfWachten, teken, zonderClub } from '../../game/transfers/transfers.js';
import { vMarkt } from '../../game/transfers/markt.js';
import { clubLogo } from '../../data/logos.js';
import { vriendNaam } from '../../game/speler/journey.js';

export function rolRij(id, cObj){
  const hier = id === S.sp.club && !(cObj && cObj.land);
  if (hier && S.sp.o23) return `<div class="rol"><span class="label">Jouw rol hier</span><b>Bij de O23</b><span class="risico r-riskant">Speelt niet in het eerste elftal</span></div>`;
  const r = rolBijClub(id, cObj);
  return `<div class="rol"><span class="label">${hier ? 'Jouw rol hier' : 'Jouw rol daar'}</span><b>${r.status}</b><span class="risico ${r.plek[1]}">${r.plek[0]}</span></div>`;
}
// Wat er gebeurt als je toch gaat terwijl je partner niet mee wil
function partnerWaarschuwing(o){ const r = S.sp.relatie, k = kinderen(); return `${r.naam} wil niet mee naar ${o.land}. Ga je toch, dan gaan jullie uit elkaar${r.getrouwd ? `: jullie scheiden en ${r.naam} krijgt de helft van je spaargeld` : ''}${k.length ? `, en ${k.length === 1 ? k[0].naam + ' blijft' : 'je kinderen blijven'} bij ${r.naam} in ${thuisLand()}` : ''}. Toch gaan?`; }
export function bodKaart(o, label){
  const c = clubInfo(o), V = S.venster, bl = isBuitenland(o);
  const kanVragen = V.modus === 'normaal' && !o.gevraagd && (o.verlenging || c.t <= 3);
  return `<div class="bod ${o.club === S.sp.club && !bl ? 'huidig' : ''} ${o.viaAgent || o.viaVriend ? 'door' : ''}"><span class="label">${o.huurKoop ? 'Je huurclub wil je definitief overnemen' : o.viaVriend ? `Via je jeugdvriend ${esc(vriendNaam())}${bl ? ` · 🌍 ${esc(o.land)}` : ''}` : o.viaAgent ? 'Droomclub · geregeld door je zaakwaarnemer' : o.doorstroom ? '1e elftal van je eigen club' : o.verlenging ? 'Je huidige club · nieuw contract' : bl ? `🌍 ${esc(o.land)} · ${NIVEAU[c.t]} · ${esc(c.div)}` : `${NIVEAU[c.t]} · ${DIVS[c.t]}`}</span><div class="club">${bl ? '' : clubLogo(o.club, 40)}<span>${esc(c.n)}</span></div>
    <dl><dt>Clubsterkte</dt><dd>${c.s}</dd><dt>${salarisLabel(c.t)}</dt><dd>${geldTxt(o.salaris)}</dd><dt>Contract</dt><dd>${o.jaren} jaar</dd>${o.som ? `<dt>Bod op jou</dt><dd>${geldTxt(o.som)}</dd>` : ''}</dl>
    ${rolRij(o.club, bl ? c : null)}
    ${bl ? `<p class="muted klein-tekst">Je verhuist naar ${esc(o.land)}: nieuwe competitie, nieuwe clubs, nieuwe kranten, een nieuwe taal.</p>` : ''}
    ${bl && S.sp.relatie && o.partnerMee !== undefined ? (o.partnerMee ? `<p class="goedtxt klein-tekst">💕 ${esc(S.sp.relatie.naam)} gaat met je mee naar ${esc(o.land)}.</p>` : `<p class="fouttxt klein-tekst">⚠ ${esc(S.sp.relatie.naam)} wil niet verhuizen naar ${esc(o.land)}.</p><div class="rij">${o.partnerGepraat ? '' : knop(`Met ${esc(S.sp.relatie.naam)} praten`, () => praatMetPartner(o), 'klein', 'data-blijf')}${knop(`Blijven voor ${esc(S.sp.relatie.naam)}`, () => blijfVoorPartner(o), 'klein', 'data-blijf')}</div>`) : ''}
    ${o.akkoord ? `<p class="goedtxt klein-tekst">Uitonderhandeld${o.tekengeld ? ` · tekengeld ${geldTxt(o.tekengeld)}` : ''}${o.clausule ? ` · afkoopclausule ${geldTxt(o.clausule)}` : ''}</p>` : ''}
    <div class="rij">${knop(label, () => teken(o), 'hoofd', `style="font-size:1.05rem;padding:10px 16px"${bl && S.sp.relatie && o.partnerMee === false ? ` data-bevestig="${esc(partnerWaarschuwing(o))}" data-ja="Ja, ik ga toch"` : ''}`)}${kanVragen && !(tmp.oh && tmp.oh.key === okey(o)) ? knop('Onderhandelen', () => ohStart(o), 'klein', 'data-blijf') : ''}</div>
    ${kanVragen && tmp.oh && tmp.oh.key === okey(o) ? vOnderhandel(o) : ''}</div>`;
}
export function huidigKaart(){
  const c = club(), sp = S.sp, V = S.venster;
  return `<div class="bod huidig"><span class="label">Je huidige club · ${NIVEAU[c.t]}</span><div class="club">${clubLogo(sp.club, 40)}<span>${esc(c.n)}</span></div>
    <dl><dt>Clubsterkte</dt><dd>${c.s}</dd><dt>${salarisLabel(c.t)}</dt><dd>${geldTxt(sp.salaris)}</dd><dt>Contract</dt><dd>nog ${Math.max(sp.contract, 0)} jaar</dd></dl>
    ${rolRij(sp.club)}
    <div class="rij">${knop(V.huurOpties && V.huurOpties.length ? (V.eigenHuur ? 'Ik bedenk me: ik blijf' : 'Nee, ik blijf en vecht voor mijn plek') : V.bods.length ? 'Nee, ik blijf hier' : 'Verder', blijf, V.bods.length || (V.huurOpties && V.huurOpties.length) ? 'hoofd tweede' : 'hoofd', 'style="font-size:1.05rem;padding:10px 16px"')}</div></div>`;
}
export function huurKaart(x){
  const o = typeof x === 'number' ? {club:x} : x, bl = isBuitenland(o), c = clubInfo(o);
  return `<div class="bod huur"><span class="label">Huur tot de zomer · ${bl ? `🌍 ${esc(o.land)} · ${NIVEAU[c.t]} · ${esc(c.div)}` : `${NIVEAU[c.t]} · ${DIVS[c.t]}`}</span><div class="club">${bl ? '' : clubLogo(o.club, 40)}<span>${esc(c.n)}</span></div>
    <dl><dt>Clubsterkte</dt><dd>${c.s}</dd><dt>Salaris</dt><dd>betaalt je eigen club</dd><dt>Daarna</dt><dd>terug naar ${esc(club().n)}</dd></dl>
    <div class="rol"><span class="label">Jouw rol daar</span><b>Vaste waarde</b><span class="risico r-veilig">Basisspeler</span></div>
    ${bl ? `<p class="muted klein-tekst">Je verhuist een seizoen naar ${esc(o.land)}: nieuwe competitie, nieuwe clubs, een nieuwe taal. In de zomer ga je terug naar ${esc(club().n)}.</p>` : ''}
    <div class="rij">${knop(`Op huur naar ${esc(c.n)}`, () => gaHuren(o), 'hoofd middel')}</div></div>`;
}
export function vVenster(){
  const V = S.venster, sp = S.sp;
  let html = `<div class="verhaal"><span class="label">Transfermarkt · ${sp.ontbonden ? 'zonder club' : V.soort === 'winter' ? 'winterstop' : 'zomer'}</span><h2>${V.modus === 'huur' ? 'Verhuurd' : V.huurOpties && V.huurOpties.length ? (V.eigenHuur ? 'Op zoek naar een huurclub' : 'Je club wil je verhuren') : V.modus === 'weg' ? (sp.ontbonden ? 'Contract ontbonden!' : 'Weggestuurd!') : V.modus === 'vrij' ? 'Transfervrij' : V.modus === 'clubloos' ? (V.bods.length ? 'Eindelijk interesse!' : 'Nog steeds zonder club') : V.modus === 'jeugdKlaar' ? 'Klaar voor de senioren' : V.bods.length ? 'Er is interesse!' : 'Stil op de markt'}</h2><p>${esc(V.intro)}</p></div>`;
  if (V.melding) html += `<p class="melding">${esc(V.melding)}</p>`;
  if (V.huurOpties && V.huurOpties.length) html += `<div class="aanbod">${V.huurOpties.map(huurKaart).join('')}</div>`;
  const kaarten = [];
  if (V.blijven) kaarten.push(huidigKaart());
  if (V.verlenging) kaarten.push(bodKaart(V.verlenging, 'Verlengen'));
  V.bods.forEach(o => kaarten.push(bodKaart(o, clubInfo(o).t <= 3 ? 'Ja, ik wil hierheen' : 'Tekenen')));
  if (kaarten.length) html += `<div class="aanbod">${kaarten.join('')}</div>`;
  if (V.modus === 'weg' || V.modus === 'vrij') html += V.bods.length
    ? knop('Geen van deze clubs: ik wacht op iets beters', zonderClub, 'klein', 'data-bevestig="Je zit dan zonder club en zonder salaris, tot er een club belt." data-ja="Ja, ik wacht"')
    : knop('Verder zonder club', zonderClub);
  if (V.modus === 'clubloos') html += knop(V.bods.length ? 'Nee, ik blijf wachten' : 'Verder zonder club', blijfWachten, V.bods.length ? 'klein' : 'hoofd');
  html += vMarkt();
  if (V.soort === 'zomer' && sp.leeftijd >= 33) html += knop('Stoppen met voetbal', () => stoppen(`Op je ${sp.leeftijd}e kies je zelf het moment: je stopt als voetballer.`), 'klein', 'data-bevestig="Dit is het einde van je spelerscarrière. Dit kun je niet terugdraaien." data-ja="Ja, ik stop"');
  return html;
}
