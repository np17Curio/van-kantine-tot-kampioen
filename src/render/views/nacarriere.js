import { S, seizoenLabel } from '../../core/state.js';
import { act, keuzeKnop, knop } from '../../core/ui.js';
import { esc, geldTxt } from '../../core/utils.js';
import { CLUBS, DIVS } from '../../data/gegevens.js';
import { clubLogo } from '../../data/logos.js';
import { vKrant } from '../../game/media/nieuws.js';
import { STIJL, VOORSPEL, WEKEN, analistNieuwSeizoen, analistVerder, analyseer, basisKijkers, kiesEvent, stopAnalist } from '../../game/nacarriere/analist.js';
import { TICKET, clubWaarde, eigenaarVolgend, failliet, goedkoopste, vastgelopen, kanSpelen, koopClub, koopbaar, kosten, speelSeizoen, stopEigenaar, totaalKosten, verkoopClub } from '../../game/nacarriere/eigenaar.js';

const k = n => `${Math.round(n / 1000)}k`;
const ploeg = id => `${clubLogo(id, 22)}<b>${esc(CLUBS[id].n)}</b>`;
/* ---------- Commentator ---------- */
export function vAnalist(){
  const A = S.analist, kz = A.keuze;
  if (A.event) return `<div class="verhaal"><span class="label">${esc(A.zender)} · week ${A.week + 1} van ${WEKEN}</span><h2>In de studio</h2><p>${esc(A.event.tekst)}</p></div>
    <div class="keuzes">${A.event.opts.map((o, i) => keuzeKnop(o.l, '', () => kiesEvent(i))).join('')}</div>`;
  const keuzes = (obj, sleutel) => `<div class="keuzes" style="margin-top:6px">${Object.entries(obj).map(([id, x]) => `<button class="keuze ${kz[sleutel] === id ? 'aan' : ''}" data-i="${act(() => { kz[sleutel] = id; })}" data-blijf aria-pressed="${kz[sleutel] === id}"><span class="t">${typeof x === 'string' ? x : x.n}</span>${x.d ? `<span class="s">${x.d}</span>` : ''}</button>`).join('')}</div>`;
  return `<div class="verhaal"><span class="label">Analist bij ${esc(A.zender)} · seizoen ${A.seizoen} · week ${A.week + 1} van ${WEKEN}</span><h2>Welke wedstrijd bespreek je?</h2>
    ${A.eventTekst ? `<p class="melding">${esc(A.eventTekst)}</p>` : ''}<p class="muted">Je reputatie als analist: <b>${A.rep}</b> · verwachte kijkers: ±${k(basisKijkers(A))}</p></div>
    <div class="keuzes">${A.wedstrijden.map((w, i) => `<button class="keuze ${kz.w === i ? 'aan' : ''}" data-i="${act(() => { kz.w = i; })}" data-blijf aria-pressed="${kz.w === i}"><span class="t">${esc(CLUBS[w.h].n)} – ${esc(CLUBS[w.u].n)}</span><span class="s">sterkte ${CLUBS[w.h].s} tegen ${CLUBS[w.u].s}</span></button>`).join('')}</div>
    <div><span class="label">Jouw voorspelling</span>${keuzes(VOORSPEL, 'voorspel')}</div>
    <div><span class="label">Hoe breng je het?</span>${keuzes(STIJL, 'stijl')}</div>
    ${knop(kz.voorspel ? 'Live in de uitzending' : 'Kies eerst een voorspelling', () => { if (kz.voorspel) analyseer(); }, kz.voorspel ? 'hoofd' : 'hoofd tweede', kz.voorspel ? '' : 'data-blijf')}
    <div class="rij">${knop('Stoppen als analist', () => stopAnalist(), 'klein')}</div>`;
}
export function vAnalistUitslag(){
  const A = S.analist, L = A.laatste;
  return `<div class="score"><div class="team">${esc(CLUBS[L.h].n)}</div><div class="stand">${L.gh}-${L.gu}<span class="min">EINDE</span></div><div class="team r">${esc(CLUBS[L.u].n)}</div></div>
    <div class="verhaal"><span class="label">Jouw analyse · ${STIJL[L.stijl].n.toLowerCase()}</span>
      <p>${L.goed ? `Je voorspelde ${VOORSPEL[L.voorspel].toLowerCase()}, en dat klopte! De kijkers zien een kenner aan het werk.` : `Je voorspelde ${VOORSPEL[L.voorspel].toLowerCase()}, maar het liep anders. Op sociale media wordt er om gelachen.`}</p>
      ${L.rel ? '<p class="fouttxt">Je uitspraak in de uitzending zorgt voor een rel. Je reputatie krijgt een deuk, maar iedereen keek.</p>' : ''}
      <p><b>${k(L.kijk)}</b> kijkers · reputatie ${A.rep}</p></div>
    ${vKrant(S.krantWacht)}${knop(A.week >= WEKEN ? 'Het seizoen afsluiten' : 'Volgende week', () => { S.krantWacht = []; analistVerder(); })}`;
}
export function vAnalistSeizoen(){
  const A = S.analist, E = A.eind;
  return `<div class="verhaal"><span class="label">Einde seizoen ${seizoenLabel()} · ${esc(A.zender)}</span><h2>${E.blijft ? 'Contract verlengd!' : 'Je contract wordt niet verlengd'}</h2>
    <p>Gemiddeld <b>${k(E.gem)}</b> kijkers (de zender hoopte op ${k(E.doel)}). Je voorspelde ${E.goed} van de ${WEKEN} wedstrijden goed${E.rels ? ` en veroorzaakte ${E.rels} ${E.rels === 1 ? 'rel' : 'rellen'}` : ''}. Salaris: ${geldTxt(E.salaris)}.</p>
    ${E.wk ? '<p class="melding">De bond vraagt je als commentator bij het WK. Een droom!</p>' : ''}</div>
    ${E.blijft ? knop('Nog een seizoen', analistNieuwSeizoen) : ''}${knop(E.blijft ? 'Stoppen als analist' : 'Afsluiten', () => stopAnalist(E.blijft ? null : 'De zender zoekt een ander gezicht. Je loopbaan als analist zit erop.'), E.blijft ? 'hoofd tweede' : 'hoofd')}`;
}
/* ---------- Clubeigenaar ---------- */
export function vEigenaarAanbod(){
  const l = koopbaar();
  return `<div class="verhaal"><span class="label">Clubeigenaar worden</span><h2>Welke club koop je?</h2><p>Je spaargeld: <b>${geldTxt(S.sp.geld)}</b>. Hoe sterker de club, hoe duurder.</p></div>
    <div class="aanbod">${l.length ? l.map(x => `<div class="bod"><div class="club">${clubLogo(x.id, 40)}<span>${esc(CLUBS[x.id].n)}</span></div><span class="niv">${DIVS[CLUBS[x.id].t]} · sterkte ${CLUBS[x.id].s} · ${geldTxt(x.prijs)}${x.eerste ? ' · je eerste club (korting!)' : ''}</span>${keuzeKnop('Kopen', '', () => koopClub(x.id, x.prijs))}</div>`).join('') : `<p class="muted">Je hebt niet genoeg geld. De goedkoopste club kost ${geldTxt(goedkoopste())}.</p>`}</div>
    ${knop('Toch niet', () => { S.fase = 'einde'; }, 'klein')}`;
}
export function vEigenaar(){
  const E = S.eigenaar, c = CLUBS[E.club], b = E.beleid, kk = kosten(), tot = totaalKosten();
  const knopRij = (lijst, huidig, zet) => `<div class="keuzes" style="margin-top:6px">${lijst.map(([id, t, s]) => `<button class="keuze ${huidig === id ? 'aan' : ''}" data-i="${act(() => zet(id))}" data-blijf aria-pressed="${huidig === id}"><span class="t">${t}</span><span class="s">${s}</span></button>`).join('')}</div>`;
  return `<div class="verhaal"><span class="label">Eigenaar van ${esc(c.n)} · ${DIVS[c.t]} · seizoen ${E.seizoenen + 1}</span><h2>Het beleid voor dit seizoen</h2>
    <p>${clubLogo(E.club, 28)} Sterkte <b>${c.s}</b> · fans ${Math.round(E.fans)} · stadion niveau ${E.stadion} · jeugdopleiding niveau ${E.jeugd} · clubwaarde ${geldTxt(clubWaarde(E.club))}</p><p class="muted">Je geld: <b>${geldTxt(S.sp.geld)}</b></p></div>
    <div><span class="label">Spelersbudget (${geldTxt(kk.spelers)})</span>${knopRij([[.5, 'Bezuinigen', 'De selectie wordt iets zwakker'], [1, 'Normaal', 'Alles blijft ongeveer gelijk'], [1.5, 'Investeren', 'Betere spelers: sterker'], [2, 'Alles erin', 'Veel sterker, heel duur']], b.budget, id => { b.budget = id; })}</div>
    <div><span class="label">Trainer</span>${knopRij(E.trainers.map((t, i) => [i, `${'★'.repeat(t.k)} ${esc(t.n)}`, `salaris ${geldTxt(t.salaris)}`]), b.trainer, id => { b.trainer = id; })}</div>
    <div><span class="label">Investeringen</span>${knopRij([['stadion', b.stadion ? '✓ Stadion uitbreiden' : 'Stadion uitbreiden', 'meer ticketinkomsten in de toekomst'], ['jeugd', b.jeugd ? '✓ Jeugdopleiding' : 'Jeugdopleiding', 'talent dat de club langzaam sterker maakt']], null, id => { b[id] = !b[id]; })}</div>
    <div><span class="label">Ticketprijs</span>${knopRij(Object.entries(TICKET).map(([id, t]) => [id, t.n, t.d]), b.ticket, id => { b.ticket = id; })}</div>
    <p class="opst"><span class="label">Kosten dit seizoen</span><b>${geldTxt(tot)}</b><span class="muted">spelers ${geldTxt(kk.spelers)} · trainer ${geldTxt(kk.trainer)}${kk.stadion ? ` · stadion ${geldTxt(kk.stadion)}` : ''}${kk.jeugd ? ` · jeugd ${geldTxt(kk.jeugd)}` : ''}</span></p>
    ${vastgelopen() ? `<div class="melding fouttxt">Je hebt niet genoeg geld meer voor zelfs het goedkoopste seizoen. Verkoop de club, of laat hem failliet gaan.<div class="rij" style="margin-top:6px">${knop(`Club verkopen (${geldTxt(clubWaarde(E.club))})`, verkoopClub, 'klein')}${knop('Failliet laten gaan', failliet, 'klein')}</div></div>` : ''}
    ${b.trainer == null ? '<p class="melding">Kies eerst een trainer.</p>' : tot > S.sp.geld ? '<p class="melding">Dit beleid kun je niet betalen. Bezuinig of investeer minder.</p>' : ''}
    ${knop('Speel het seizoen', () => { if (kanSpelen()) speelSeizoen(); }, kanSpelen() ? 'hoofd' : 'hoofd tweede', kanSpelen() ? '' : 'data-blijf')}
    <div class="rij">${knop(`Club verkopen (${geldTxt(clubWaarde(E.club))})`, verkoopClub, 'klein')}</div>`;
}
export function vEigenaarSeizoen(){
  const E = S.eigenaar, L = E.laatste, c = CLUBS[E.club];
  return `<div class="verhaal"><span class="label">Einde seizoen ${seizoenLabel()} · eigenaar</span><h2>${L.plek === 1 ? 'Kampioen!' : `${L.plek}e plaats`}</h2>
    <p>${esc(c.n)} eindigt als ${L.plek}e in de ${DIVS[L.t]} (${L.w}W ${L.g}G ${L.v}V, ${L.pt} punten) onder trainer ${esc(L.trainer)}. Sterkte ${L.sVoor} → ${L.sNa}.</p>
    ${L.mijn ? (L.mijn.naar < L.mijn.van ? `<p class="melding">Promotie naar de ${DIVS[L.mijn.naar]}!</p>` : `<p class="melding fouttxt">Degradatie naar de ${DIVS[L.mijn.naar]}.</p>`) : ''}</div>
    <div class="paneel"><span class="label">Financiën</span>
      <p>Inkomsten: tickets ${geldTxt(L.ticket)} · tv ${geldTxt(L.tv)} · prijzengeld ${geldTxt(L.prijs)} = <b>${geldTxt(L.inkomsten)}</b></p>
      <p>Kosten: <b>${geldTxt(Object.values(L.kosten).reduce((a, b) => a + b, 0))}</b> · saldo <b class="${L.saldo >= 0 ? 'goedtxt' : 'fouttxt'}">${geldTxt(L.saldo)}</b> · je geld nu: <b>${geldTxt(S.sp.geld)}</b></p>
      ${L.failliet ? '<p class="fouttxt">Je geld is op. De club gaat failliet.</p>' : ''}</div>
    ${vKrant(S.krantWacht)}
    ${knop(L.failliet ? 'Afsluiten' : 'Volgend seizoen', () => { S.krantWacht = []; eigenaarVolgend(); })}${L.failliet ? '' : knop('Stoppen als eigenaar', () => stopEigenaar(`Je draagt ${c.n} over en geniet van je pensioen.`), 'hoofd tweede')}`;
}
/* ---------- Zijbalk en samenvatting ---------- */
export function vZijNa(){
  if (S.analist && /^analist/.test(S.fase)){ const A = S.analist; return `<div class="kaart"><span class="label">Analist</span><div class="naam">${esc(S.sp.naam)}</div><p class="muted">${S.sp.leeftijd} jaar · ${esc(A.zender)}</p><div class="feiten"><div><span class="label">Reputatie</span><b>${A.rep}</b></div><div><span class="label">Dit seizoen goed</span><b>${A.goed} van ${A.week}</b></div><div><span class="label">Geld</span><b>${geldTxt(S.sp.geld)}</b></div></div></div>`; }
  if (S.eigenaar && /^eigenaar/.test(S.fase) && S.fase !== 'eigenaarAanbod'){ const E = S.eigenaar, c = CLUBS[E.club]; return `<div class="kaart"><span class="label">Clubeigenaar</span><div class="naam">${esc(S.sp.naam)}</div><p class="muted">${S.sp.leeftijd} jaar · ${esc(c.n)}</p><div class="feiten"><div><span class="label">Geld</span><b>${geldTxt(S.sp.geld)}</b></div><div><span class="label">Clubsterkte</span><b>${c.s}</b></div><div><span class="label">Fans</span><b>${Math.round(E.fans)}</b></div><div><span class="label">Seizoenen</span><b>${E.seizoenen}</b></div></div></div>`; }
  return '';
}
export function vNaSamenvatting(){
  let h = '';
  if (S.analist && S.analist.gestopt) h += `<div class="paneel"><span class="label">Loopbaan als analist</span>${S.analist.hist.map(x => `<p class="muted">${esc(x)}</p>`).join('')}</div>`;
  if (S.eigenaar && S.eigenaar.gestopt) h += `<div class="paneel"><span class="label">Loopbaan als clubeigenaar</span>${S.eigenaar.hist.map(x => `<p class="muted">${esc(x)}</p>`).join('')}</div>`;
  return h;
}
