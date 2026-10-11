import { S, resetTmp, seizoenLabel, setS, tmp, wis } from '../../core/state.js';
import { keuzeKnop, knop } from '../../core/ui.js';
import { clamp, esc, geldTxt } from '../../core/utils.js';
import { CLUBS, DIVS, JEUGD } from '../../data/gegevens.js';
import { lidw, startToernooi } from '../../game/interlands/toernooi.js';
import { vKrant } from '../../game/media/nieuws.js';
import { vBekerUitslagen } from '../../game/competitie/beker.js';
import { isProf } from '../../game/prive/sponsors.js';
import { kiesVakantie, vakantieOpties } from '../../game/prive/vakantie.js';
import { besteSeizoen, carriereScore, eindTitel } from '../../game/seizoen/afscheid.js';
import { FEEST, kiesFeest } from '../../game/seizoen/kampioen.js';
import { vRecords } from '../../game/seizoen/records.js';
import { naSeizoen, stoppen } from '../../game/seizoen/seizoen.js';
import { fmt1 } from '../../game/speler/o23.js';
import { startTrainer } from '../../game/trainer.js';
import { openVenster } from '../../game/transfers/transfers.js';
import { vTrainerSamenvatting } from './trainer.js';

// Wie werd Speler van het Seizoen, en hoe deed jij het in de verkiezing
function vSpelerVanHetSeizoen(E){
  const v = E.svs; if (!v) return '';
  if (v.jij) return `<p class="melding">Jij bent de Speler van het Seizoen in de ${E.divisie}!</p>`;
  if (!v.naam) return '';
  const jij = v.plek ? ` Jij werd ${v.plek}e in de verkiezing.` : v.reden ? ` Jij deed niet mee: ${v.reden.charAt(0).toLowerCase()}${v.reden.slice(1)}` : '';
  return `<p class="muted">Speler van het Seizoen in de ${E.divisie}: ${esc(v.naam)} (${esc(v.club)}).${esc(jij)}</p>`;
}
// Nacompetitie zonder wissel: gehandhaafd, of de promotie net gemist
function vPoZonderWissel(E){
  const p = E.po; if (!p || p.w === undefined) return '';
  const mijn = S.sp.club;
  if (p.hoog === mijn && p.w === mijn) return `<div class="kampioen"><span class="label">Gehandhaafd</span><p>${esc(E.clubNaam)} wint de nacompetitie en blijft in de ${DIVS[p.t]}.</p></div>`;
  if (p.laag === mijn && p.w !== mijn) return `<p class="melding">${esc(E.clubNaam)} verliest de nacompetitie van ${esc(CLUBS[p.hoog].n)}. Geen promotie: volgend seizoen weer in de ${DIVS[p.t + 1]}.</p>`;
  return '';
}
export function vSeizoenEinde(){
  const E = S.eind;
  return `<div class="verhaal"><span class="label">Einde seizoen ${seizoenLabel()}</span>
    <h2>${E.plek === 1 ? 'Kampioen!' : `${E.plek}e plaats`}</h2>
    <p>${esc(E.clubNaam)} eindigt als ${E.plek}e in de ${E.divisie}.${E.plek === 1 ? ' Er wordt gefeest tot diep in de nacht.' : E.plek >= 7 ? ' Een seizoen om snel te vergeten.' : ''}</p>
    <p>Jouw seizoen: ${E.wed} wedstrijden, ${E.g} goals, ${E.a} assists, gemiddeld cijfer ${E.gem === null ? '–' : E.gem.toFixed(1).replace('.', ',')}.</p>
    ${E.topscorer ? `<p class="muted">Topscorer van de ${E.divisie}: ${esc(E.topscorer)}.</p>` : ''}
    ${vSpelerVanHetSeizoen(E)}</div>
    ${E.gb && (E.gb.plek <= 10 || E.t <= 2) ? `<div class="paneel"><span class="label">Gouden Bal ${seizoenLabel()} · beste speler van de wereld</span>${E.gb.plek === 1 && E.gb.telt ? `<div class="kampioen"><h2>🏆 Jij wint de Gouden Bal!</h2><p>Je bent de beste speler van de wereld.</p></div>` : ''}
      <ol class="gb">${E.gb.lijst.slice(0, 5).map(x => `<li class="${x.jij ? 'mij' : ''}">${esc(x.naam)} <span class="muted">· ${esc(x.club)}</span></li>`).join('')}</ol>
      ${E.gb.plek > 5 ? `<p class="muted">${E.gb.telt ? `Jij eindigt als ${E.gb.plek}e.` : 'Je speelde te weinig wedstrijden om mee te doen.'}</p>` : ''}</div>` : E.gb ? `<p class="muted">De Gouden Bal gaat dit jaar naar ${esc(E.gb.lijst[0].naam)} (${esc(E.gb.lijst[0].club)}).</p>` : ''}
    ${E.mijnWissel ? (E.mijnWissel.naar < E.mijnWissel.van ? `<div class="kampioen"><span class="label">Promotie!</span><h2>Naar de ${DIVS[E.mijnWissel.naar]}</h2><p>${esc(E.clubNaam)} promoveert${E.mijnWissel.po ? ' via de nacompetitie' : ''}. Volgend seizoen spelen jullie een niveau hoger.</p></div>` : `<p class="melding" style="color:var(--fout);border-color:var(--fout)">${esc(E.clubNaam)} ${E.mijnWissel.po ? 'verliest de nacompetitie' : 'is laatste geworden'} en degradeert naar de ${DIVS[E.mijnWissel.naar]}.</p>`) : vPoZonderWissel(E)}
    ${E.plek === 1 ? (E.feest ? `<p class="moment">${esc(E.feest)}</p>` : `<div><span class="label">Het kampioensfeest! Hoe vier jij het?</span><div class="keuzes" style="margin-top:6px">${FEEST(E.t === JEUGD, isProf()).map((o, i) => keuzeKnop(o.l, '', () => kiesFeest(i))).join('')}</div></div>`) : ''}
    ${E.wissels && E.wissels.length ? `<details class="paneel"><summary class="label" style="cursor:pointer">Promotie en degradatie in alle competities</summary><div class="uitslagen" style="margin-top:8px">${E.wissels.filter(w => w.naar < w.van).map(w => `<div class="pd"><span class="goedtxt">▲ ${esc(CLUBS[w.id].n)}</span><span class="muted">naar de ${DIVS[w.naar]}${w.po ? ' (nacompetitie)' : ''}</span></div>`).join('')}${E.wissels.filter(w => w.naar > w.van).map(w => `<div class="pd"><span class="fouttxt">▼ ${esc(CLUBS[w.id].n)}</span><span class="muted">naar de ${DIVS[w.naar]}${w.po ? ' (nacompetitie)' : ''}</span></div>`).join('')}</div>${E.poAlle && E.poAlle.length ? `<span class="label" style="display:block;margin-top:10px">Nacompetitie</span>${vBekerUitslagen(E.poAlle.filter(x => x.w !== undefined).map(x => ({h:x.hoog, u:x.laag, gh:x.gh, gu:x.gu, pen:x.pen, w:x.w})))}` : ''}</details>` : ''}
    ${E.statusTekst ? `<p class="melding">${esc(E.statusTekst)}</p>` : ''}
    ${E.prijzen.length ? `<div><span class="label">Prijzen</span><div class="prijzen" style="margin-top:6px">${E.prijzen.map(p => `<span class="prijs">${esc(p)}</span>`).join('')}</div></div>` : ''}
    ${vKrant(E.krant)}
    ${E.toernooi && E.toernooi.reden ? `<div class="${E.toernooi.mee ? 'kampioen' : 'paneel'}"><span class="label">${esc(E.toernooi.titel)}</span><p>${esc(E.toernooi.reden)}</p></div>` : ''}
    ${E.plek === 1 && !E.feest ? '' : E.toernooi && E.toernooi.mee && !E.toernooiKlaar ? knop(`Op naar ${lidw(E.toernooi.naam)} ${esc(E.toernooi.titel)}!`, startToernooi) : knop('Naar de zomer', naSeizoen)}`;
}
export function vOntwikkeling(){
  const sp = S.sp;
  return `<div class="verhaal"><span class="label">Zomerstop</span><h2>Je bent nu ${sp.leeftijd}</h2>
    ${S.eind.ontw.map(t => `<p>${esc(t)}</p>`).join('')}
    <p class="muted">${sp.contract <= 0 ? 'Je contract is afgelopen.' : `Je contract loopt nog ${sp.contract} jaar.`}</p></div>
    ${S.eind.vakantie ? `<p class="moment">${esc(S.eind.vakantie)}</p>` : `<div><span class="label">Op vakantie! Waar ga je naartoe? Je hebt ${geldTxt(sp.geld)}</span><div class="keuzes" style="margin-top:6px">${vakantieOpties().map((o, i) => keuzeKnop(o.l, `${o.prijs ? geldTxt(o.prijs) : 'gratis'} · ${o.d}`, () => kiesVakantie(i), sp.geld < o.prijs ? 'disabled' : '')).join('')}</div></div>`}
    ${knop(S.eind.vakantie ? 'Naar de transfermarkt' : 'Geen vakantie, door naar de transfermarkt', () => openVenster('zomer'))}
    ${sp.leeftijd >= 30 ? `<div class="paneel"><span class="label">Je bent ${sp.leeftijd}</span><p>Je mag nu zelf kiezen wanneer je stopt. Op je 35e is het hoe dan ook voorbij. Daarna kun je trainer worden.</p>${tmp.stopVraag ? `<p>Weet je het zeker? Dit is het einde van je spelerscarrière.</p><div class="rij">${knop('Ja, ik stop', () => { tmp.stopVraag = false; stoppen(`Op je ${sp.leeftijd}e kies je zelf het moment. Je speelt je afscheidswedstrijd voor een uitverkocht stadion.`); }, 'klein')}${knop('Nee, nog een seizoen', () => { tmp.stopVraag = false; }, 'klein', 'data-blijf')}</div>` : knop('Stoppen met voetbal', () => { tmp.stopVraag = true; }, 'klein', 'data-blijf')}</div>` : ''}`;
}

export function vEinde(){
  const sp = S.sp, C = S.car;
  const sc = carriereScore(), titel = eindTitel(sc), cijfer = clamp(4 + sc / 30, 4, 10), bs = besteSeizoen(), eer = S.einde.eer || [];
  return `<div class="verhaal"><span class="label">Einde carrière</span><h1>${esc(sp.naam)}</h1><p>${esc(S.einde.reden)}</p>
    <div class="groot" style="font-size:clamp(2.2rem,8vw,3.6rem)">${titel}</div>
    <p>Carrièrecijfer: <b>${fmt1(cijfer)}</b> <span class="muted">· op basis van je prijzen, goals, klasse en interlands</span></p>
    ${bs ? `<p class="muted">Beste seizoen: ${esc(bs.s)} bij ${esc(bs.club)} (${esc(bs.div)}): ${bs.wed} wedstrijden, ${bs.g} goals, ${bs.a} assists${bs.gem ? `, gemiddeld een ${fmt1(bs.gem)}` : ''}.</p>` : ''}</div>
    ${eer.length ? `<div class="kampioen"><span class="label">Afscheid als clublegende</span>${eer.map(e => `<p>${e.soort === 'standbeeld' ? '🗿' : '👕'} ${esc(e.t)}</p>`).join('')}</div>` : ''}
    ${vRecords()}
    <div class="feiten" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">
      <div><span class="label">Wedstrijden</span><b>${C.wed}</b></div><div><span class="label">Goals</span><b>${C.g}</b></div>
      <div><span class="label">Assists</span><b>${C.a}</b></div><div><span class="label">Hoogste klasse</span><b>${C.maxOvr}</b></div>
      <div><span class="label">Hoogste waarde</span><b>${geldTxt(C.maxWaarde)}</b></div><div><span class="label">Spaargeld</span><b>${geldTxt(sp.geld)}</b></div><div><span class="label">Sponsorgeld</span><b>${geldTxt(C.sponsor || 0)}</b></div></div>
    ${Object.keys(C.int || {}).length ? `<div><span class="label">Interlands</span>${Object.entries(C.int).map(([n, st]) => `<p>${esc(n)}: ${st.caps} interlands, ${st.g} goals, ${st.a} assists</p>`).join('')}</div>` : ''}
    <div><span class="label">Prijzenkast</span><div class="prijzen" style="margin-top:6px">${C.prijzen.length ? C.prijzen.map(p => `<span class="prijs">${esc(p)}</span>`).join('') : '<span class="muted">Leeg. Maar de kantine was altijd gezellig.</span>'}</div></div>
    <div class="verhaal"><span class="label">Loopbaan</span>${C.hist.map(h => `<p class="muted">${esc(h)}</p>`).join('')}</div>
    ${S.trainer && S.trainer.gestopt ? vTrainerSamenvatting() : `<div class="paneel"><span class="label">Wat nu?</span><p>Je kent het spel als geen ander. Word je trainer?</p>${knop('Trainer worden', startTrainer)}</div>`}
    ${knop('Nieuwe carrière', () => { wis(); setS(null); resetTmp(); }, 'hoofd', 'data-bevestig="Je opgeslagen carrière wordt gewist." data-ja="Ja, opnieuw beginnen"')}`;
}
