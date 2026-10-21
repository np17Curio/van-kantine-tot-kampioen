import { S, seizoenLabel, tmp } from '../../core/state.js';
import { act, keuzeKnop, knop, tabBalk } from '../../core/ui.js';
import { esc, geldTxt } from '../../core/utils.js';
import { CLUBS, DIVS } from '../../data/gegevens.js';
import { clubLogo } from '../../data/logos.js';
import { POS_NAAM } from '../../game/competitie/spelers.js';
import { metVoorletter, vKrant } from '../../game/media/nieuws.js';
import { TICKET, alleClubs, clubWaarde, eigenaarVolgend, eisOk, failliet, goedkoopste, kanSpelen, koopClub, kosten, speelSeizoen, stopEigenaar, totaalKosten, vastgelopen, verkoopClub, zorgEigenaar } from '../../game/nacarriere/eigenaar.js';
import { ASSISTENTEN, BUDGET_NAAM, EIS, PLEKKEN, TB, TR_TXT, VOORWAARDEN, accepteerBod, adviesIndex, budgetVoor, advies, afkoop, budgetOver, koopSpeler, maxSterren, neemAssistent, neemTrainer, ontslaAssistent, ontslaTrainer, tekenSponsor, trainerModus, transferBudget, verlengTrainer, weigerBod, winst } from '../../game/nacarriere/eigenaar-staf.js';

/* ===================== Clubeigenaar: de schermen ===================== */
const sterren = k => '★'.repeat(k) + '☆'.repeat(5 - k);
// Welke club koop je? Alle clubs van je land: wat je kunt betalen, en wat je nog tekort komt voor de rest
export function vEigenaarAanbod(){
  const l = alleClubs(), kan = l.filter(x => x.kan);
  return `<div class="verhaal"><span class="label">Clubeigenaar worden</span><h2>Welke club koop je?</h2><p>Je spaargeld: <b>${geldTxt(S.sp.geld)}</b>. Hoe sterker de club, hoe duurder. Je moet na de koop ook nog een seizoen kunnen betalen.</p>
    ${kan.length ? '' : `<p class="melding">Je hebt niet genoeg geld voor een club. De goedkoopste kost (met een seizoen erbij) ${geldTxt(goedkoopste())}.</p>`}</div>
    <div class="aanbod">${l.map(x => `<div class="bod" style="${x.kan ? '' : 'opacity:.55'}"><div class="club">${clubLogo(x.id, 40)}<span>${esc(CLUBS[x.id].n)}</span></div><span class="niv">${DIVS[CLUBS[x.id].t]} · sterkte ${CLUBS[x.id].s} · ${geldTxt(x.prijs)}${x.eerste ? ' · je eerste club (korting!)' : ''}</span>
      ${x.kan ? keuzeKnop('Kopen', '', () => koopClub(x.id, x.prijs)) : `<p class="muted klein-tekst">Nog ${geldTxt(x.tekort)} tekort</p>`}</div>`).join('')}</div>
    ${knop('Toch niet', () => { S.fase = 'einde'; }, 'klein')}`;
}

const knopRij = (lijst, huidig, zet) => `<div class="keuzes" style="margin-top:6px">${lijst.map(([id, t, s]) => `<button class="keuze ${huidig === id ? 'aan' : ''}" data-i="${act(() => zet(id))}" data-blijf aria-pressed="${huidig === id}"><span class="t">${t}</span><span class="s">${s}</span></button>`).join('')}</div>`;
function tabClub(){
  const E = S.eigenaar, b = E.beleid, T = E.trainer;
  return `<div><span class="label">Spelersbudget (salarissen, ${geldTxt(kosten().spelers)})</span>${knopRij([[.5, 'Bezuinigen', 'De selectie wordt iets zwakker'], [1, 'Normaal', 'Alles blijft ongeveer gelijk'], [1.5, 'Investeren', 'Betere spelers: sterker'], [2, 'Alles erin', 'Veel sterker, heel duur']], b.budget, id => { b.budget = id; })}
      ${T && !eisOk() ? `<p class="melding fouttxt">${esc(T.n)} eist minstens "${BUDGET_NAAM[EIS[T.k].min]}". Zo wordt hij ontevreden${T.boos ? ', en dan vertrekt hij na dit seizoen' : ''}.</p>` : ''}</div>
    <div><span class="label">Investeringen</span>${knopRij([['stadion', b.stadion ? '✓ Stadion uitbreiden' : 'Stadion uitbreiden', 'meer ticketinkomsten en een aantrekkelijkere club'], ['jeugd', b.jeugd ? '✓ Jeugdopleiding' : 'Jeugdopleiding', 'talent dat de club langzaam sterker maakt']], null, id => { b[id] = !b[id]; })}</div>
    <div><span class="label">Ticketprijs</span>${knopRij(Object.entries(TICKET).map(([id, t]) => [id, t.n, t.d]), b.ticket, id => { b.ticket = id; })}</div>`;
}
function tabTrainer(){
  const E = S.eigenaar, T = E.trainer;
  const huidig = T ? `<div class="paneel"><span class="label">Je trainer</span><p><b>${esc(T.n)}</b> ${sterren(T.k)} · ${esc(T.stijl)}</p>
      <p class="klein-tekst">${TR_TXT[EIS[T.k].tr]} · salaris ${geldTxt(T.salaris)} · ${T.verlopen ? '<b class="fouttxt">contract afgelopen</b>' : `nog ${T.jaren} ${T.jaren === 1 ? 'seizoen' : 'seizoenen'} contract`}${EIS[T.k].min ? ` · eist spelersbudget "${BUDGET_NAAM[EIS[T.k].min]}"` : ''}</p>
      <div class="rij">${T.verlopen ? knop(`Verlengen (salaris +15%)`, verlengTrainer, 'klein', 'data-blijf') : ''}${knop(T.verlopen ? 'Laten gaan' : `Ontslaan (afkoop ${geldTxt(afkoop())})`, () => ontslaTrainer(), 'klein', `data-blijf data-bevestig="${T.verlopen ? `${esc(T.n)} laten gaan?` : `${esc(T.n)} ontslaan? Je betaalt ${geldTxt(afkoop())} afkoop.`}" data-ja="Ja"`)}</div></div>` : '';
  const kand = E.kandidaten && E.kandidaten.length ? `<span class="label">Trainers die naar ${esc(CLUBS[E.club].n)} willen komen</span>
    <p class="muted klein-tekst">Hoe aantrekkelijker je club (sterkte, league, fans, stadion), hoe beter de trainers. Nu kun je trainers tot ${maxSterren()} ${maxSterren() === 1 ? 'ster' : 'sterren'} krijgen. Een goede trainer bepaalt zelf de transfers.</p>
    <div class="keuzes">${E.kandidaten.map((t, i) => keuzeKnop(`${sterren(t.k)} ${esc(t.n)}`, `${esc(t.stijl)} · ${TR_TXT[EIS[t.k].tr].toLowerCase()} · salaris ${geldTxt(t.salaris)} · ${t.jaren} jaar${EIS[t.k].min ? ` · eist spelersbudget "${BUDGET_NAAM[EIS[t.k].min]}"` : ''}`, () => neemTrainer(i), 'data-blijf')).join('')}</div>` : '';
  return huidig + kand + (!T && !kand ? '<p class="muted">Geen trainers beschikbaar.</p>' : '');
}
function tabSponsors(){
  const E = S.eigenaar;
  const lopend = E.sponsors.length ? `<div class="paneel"><span class="label">Je sponsors</span>${E.sponsors.map(s => `<p>${esc(PLEKKEN[s.plek].n)}: <b>${esc(s.merk)}</b> · ${geldTxt(s.bedrag)} per seizoen · nog ${s.jaren} ${s.jaren === 1 ? 'seizoen' : 'seizoenen'}${s.voorwaarde ? ` <span class="muted">(${VOORWAARDEN[s.voorwaarde]})</span>` : ''}</p>`).join('')}</div>` : '<p class="muted">Je hebt nog geen sponsors. Sponsors betalen elk seizoen, en daarmee financier je je club.</p>';
  const open = Object.entries(E.sponsorAanbod || {}).map(([p, l]) => `<span class="label">${esc(PLEKKEN[p].n)}</span><div class="keuzes">${l.map((o, i) => keuzeKnop(`${esc(o.merk)} · ${geldTxt(o.bedrag)} per seizoen`, `${o.jaren} ${o.jaren === 1 ? 'seizoen' : 'seizoenen'}${o.voorwaarde ? ` · ${VOORWAARDEN[o.voorwaarde]}` : ''}`, () => tekenSponsor(p, i), 'data-blijf')).join('')}</div>`).join('');
  return lopend + (open || '<p class="muted klein-tekst">Alle sponsorplekken zijn bezet.</p>');
}
function tabTransfers(){
  const E = S.eigenaar, modus = trainerModus(), adv = modus === 'samen' ? adviesIndex() : -1;
  const budget = `<div><span class="label">Transferbudget (${geldTxt(transferBudget())}, nog ${geldTxt(budgetOver())})</span>${knopRij(TB.map(([f, n]) => [f, n, f ? geldTxt(budgetVoor(f)) : 'niemand kopen']), E.tb, f => { E.tb = f; })}</div>`;
  const bod = E.bod ? `<div class="paneel"><span class="label">Bod op een speler</span><p>${esc(CLUBS[E.bod.naar].n)} biedt <b>${geldTxt(E.bod.som)}</b> voor ${esc(metVoorletter(E.bod))} (${POS_NAAM[E.bod.pos].toLowerCase()}, klasse ${E.bod.k}). Verkopen levert geld op, maar je club wordt zwakker.</p><div class="rij">${knop('Verkopen', accepteerBod, 'klein', 'data-blijf')}${knop('Weigeren', weigerBod, 'klein', 'data-blijf')}</div></div>` : '';
  if (modus === 'trainer') return budget + `<p class="melding">Trainer ${esc(E.trainer.n)} bepaalt zelf de transfers. Bij de start van het seizoen geeft hij het transferbudget uit aan de beste spelers voor je zwakste plekken.</p>` + bod;
  const markt = (E.markt || []).map((m, i) => `<div class="pd"><span>${i === adv ? '⭐ ' : ''}${m.talent ? '💎 ' : ''}<b>${esc(metVoorletter(m))}</b> <span class="muted klein-tekst">(${POS_NAAM[m.pos].toLowerCase()}, ${m.lft} jaar, klasse ${m.k}${winst(m) ? `, +${winst(m)} op je zwakste basisspeler` : ''}) · ${esc(CLUBS[m.van].n)}</span></span>
    <span>${geldTxt(m.prijs)} ${knop('Kopen', () => { tmp.eMelding = koopSpeler(i); }, 'klein', `data-blijf ${m.prijs > budgetOver() ? 'disabled' : ''}`)}</span></div>`).join('');
  return budget + (modus === 'samen' ? `<p class="muted klein-tekst">Trainer ${esc(E.trainer.n)} geeft advies: de speler met ⭐ wil hij het liefst.</p>` : '<p class="muted klein-tekst">Jij bepaalt de transfers. Een speler die beter is dan je zwakste basisspeler op zijn plek, maakt je club sterker.</p>')
    + (tmp.eMelding ? `<p class="melding">${esc(tmp.eMelding)}</p>` : '') + `<div class="uitslagen">${markt || '<p class="muted">Geen spelers op de markt.</p>'}</div>` + bod;
}
function tabAssistent(){
  const E = S.eigenaar, a = E.assistent;
  if (a) return `<div class="paneel"><span class="label">Je assistent</span><p>${ASSISTENTEN[a.id].i} <b>${esc(a.n)}</b>, ${ASSISTENTEN[a.id].n.toLowerCase()} · salaris ${geldTxt(a.salaris)}</p><p class="klein-tekst">${ASSISTENTEN[a.id].d}</p>${knop('Ontslaan', ontslaAssistent, 'klein', 'data-blijf')}</div>`;
  return `<p class="muted">Een assistent helpt je met de club en geeft je advies.</p><div class="keuzes">${E.assKand.map((k, i) => keuzeKnop(`${ASSISTENTEN[k.id].i} ${esc(k.n)} · ${ASSISTENTEN[k.id].n}`, `${ASSISTENTEN[k.id].d} Salaris ${geldTxt(k.salaris)}.`, () => neemAssistent(i), 'data-blijf')).join('')}</div>`;
}
export function vEigenaar(){
  zorgEigenaar();
  const E = S.eigenaar, c = CLUBS[E.club], kk = kosten(), tot = totaalKosten(), T = E.trainer, adv = advies(tot);
  const tabs = {club:['Club', tabClub], trainer:['Trainer', tabTrainer, !T || T.verlopen ? '!' : ''], sponsors:['Sponsors', tabSponsors, Object.keys(E.sponsorAanbod || {}).length || ''], transfers:['Transfers', tabTransfers, E.bod ? '!' : ''], assistent:['Assistent', tabAssistent]};
  const tab = tabs[tmp.eTab] ? tmp.eTab : (!T || T.verlopen ? 'trainer' : 'club');
  return `<div class="verhaal"><span class="label">Eigenaar van ${esc(c.n)} · ${DIVS[c.t]} · seizoen ${E.seizoenen + 1}</span><h2>Voorbereiding op het seizoen</h2>
    <p>${clubLogo(E.club, 28)} Sterkte <b>${c.s}</b> · fans ${Math.round(E.fans)} · stadion niveau ${E.stadion} · jeugd niveau ${E.jeugd} · clubwaarde ${geldTxt(clubWaarde(E.club))}</p>
    <p class="muted">Je geld: <b>${geldTxt(S.sp.geld)}</b>${T ? ` · trainer ${esc(T.n)} ${sterren(T.k)}` : ' · <b class="fouttxt">nog geen trainer</b>'}${E.assistent ? ` · assistent ${esc(E.assistent.n)}` : ''}</p>
    ${adv ? `<p class="melding">${ASSISTENTEN[E.assistent.id].i} ${esc(E.assistent.n)}: "${esc(adv)}"</p>` : ''}</div>
    ${tabBalk(Object.entries(tabs).map(([k, [l, , badge]]) => [k, l, badge]), tab, k => { tmp.eTab = k; tmp.eMelding = null; })}
    <div class="trinhoud">${tabs[tab][1]()}</div>
    <p class="opst"><span class="label">Kosten dit seizoen</span><b>${geldTxt(tot)}</b><span class="muted">spelers ${geldTxt(kk.spelers)} · trainer ${geldTxt(kk.trainer)}${kk.assistent ? ` · assistent ${geldTxt(kk.assistent)}` : ''}${kk.stadion ? ` · stadion ${geldTxt(kk.stadion)}` : ''}${kk.jeugd ? ` · jeugd ${geldTxt(kk.jeugd)}` : ''}${E.uitgegeven ? ` · al uitgegeven aan transfers ${geldTxt(E.uitgegeven)}` : ''}</span></p>
    ${vastgelopen() ? `<div class="melding fouttxt">Je hebt niet genoeg geld meer voor zelfs het goedkoopste seizoen. Verkoop de club, of laat hem failliet gaan.<div class="rij" style="margin-top:6px">${knop(`Club verkopen (${geldTxt(clubWaarde(E.club))})`, verkoopClub, 'klein')}${knop('Failliet laten gaan', failliet, 'klein')}</div></div>` : ''}
    ${!T || T.verlopen ? '<p class="melding">Kies eerst een trainer (tabblad Trainer).</p>' : tot > S.sp.geld ? '<p class="melding">Dit beleid kun je niet betalen. Bezuinig of investeer minder.</p>' : ''}
    ${knop('Speel het seizoen', () => { if (kanSpelen()){ tmp.eTab = null; tmp.eMelding = null; speelSeizoen(); } }, kanSpelen() ? 'hoofd' : 'hoofd tweede', kanSpelen() ? '' : 'data-blijf')}
    <div class="rij">${knop(`Club verkopen (${geldTxt(clubWaarde(E.club))})`, verkoopClub, 'klein')}</div>`;
}
export function vEigenaarSeizoen(){
  const E = S.eigenaar, L = E.laatste, c = CLUBS[E.club], N = L.trNa || {};
  const kostTot = Object.values(L.kosten).reduce((a, b) => a + b, 0);
  return `<div class="verhaal"><span class="label">Einde seizoen ${seizoenLabel()} · eigenaar</span><h2>${L.plek === 1 ? 'Kampioen!' : `${L.plek}e plaats`}</h2>
    <p>${esc(c.n)} eindigt als ${L.plek}e in de ${DIVS[L.t]} (${L.w}W ${L.g}G ${L.v}V, ${L.pt} punten) onder trainer ${esc(L.trainer)}. Sterkte ${L.sVoor} → ${L.sNa}.</p>
    ${L.mijn ? (L.mijn.naar < L.mijn.van ? `<p class="melding">Promotie naar de ${DIVS[L.mijn.naar]}!</p>` : `<p class="melding fouttxt">Degradatie naar de ${DIVS[L.mijn.naar]}.</p>`) : ''}
    ${N.weg ? `<p class="melding fouttxt">${esc(N.weg)}</p>` : N.verlopen ? `<p class="melding">${esc(N.verlopen)}</p>` : N.boosTxt ? `<p class="melding fouttxt">${esc(N.boosTxt)}</p>` : ''}</div>
    ${L.gekocht && L.gekocht.length ? `<div class="paneel"><span class="label">Transfers${L.zelf ? ` (door trainer ${esc(L.trainer)})` : ''}</span>${L.gekocht.map(g => `<p class="muted klein-tekst">${esc(g)}</p>`).join('')}</div>` : ''}
    <div class="paneel"><span class="label">Financiën</span>
      <p>Inkomsten: tickets ${geldTxt(L.ticket)} · tv ${geldTxt(L.tv)} · prijzengeld ${geldTxt(L.prijs)}${L.sponsors != null ? ` · sponsors ${geldTxt(L.sponsors)}` : ''}${L.verkocht ? ` · verkochte spelers ${geldTxt(L.verkocht)}` : ''} = <b>${geldTxt(L.inkomsten)}</b></p>
      ${(L.sponsorRegels || []).length ? `<p class="muted klein-tekst">${L.sponsorRegels.map(esc).join(' · ')}</p>` : ''}
      <p>Kosten: <b>${geldTxt(kostTot)}</b> <span class="muted klein-tekst">(${Object.entries(L.kosten).filter(([, v]) => v).map(([k, v]) => `${k} ${geldTxt(v)}`).join(' · ')})</span> · saldo <b class="${L.saldo >= 0 ? 'goedtxt' : 'fouttxt'}">${geldTxt(L.saldo)}</b> · je geld nu: <b>${geldTxt(S.sp.geld)}</b></p>
      ${L.failliet ? '<p class="fouttxt">Je geld is op. De club gaat failliet.</p>' : ''}</div>
    ${vKrant(S.krantWacht)}
    ${knop(L.failliet ? 'Afsluiten' : 'Volgend seizoen', () => { S.krantWacht = []; eigenaarVolgend(); })}${L.failliet ? '' : knop('Stoppen als eigenaar', () => stopEigenaar(`Je draagt ${c.n} over en geniet van je pensioen.`), 'hoofd tweede')}`;
}
