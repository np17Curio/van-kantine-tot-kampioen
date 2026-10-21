import { S, seizoenLabel } from '../../core/state.js';
import { act, keuzeKnop, knop } from '../../core/ui.js';
import { esc, geldTxt } from '../../core/utils.js';
import { CLUBS, DIVS } from '../../data/gegevens.js';
import { clubLogo } from '../../data/logos.js';
import { vKrant } from '../../game/media/nieuws.js';
import { STIJL, VOORSPEL, WEKEN, analistNieuwSeizoen, analistVerder, analyseer, basisKijkers, kiesEvent, stopAnalist } from '../../game/nacarriere/analist.js';

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
/* ---------- Clubeigenaar: zie eigenaar.js ---------- */
export { vEigenaar, vEigenaarAanbod, vEigenaarSeizoen } from './eigenaar.js';
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
