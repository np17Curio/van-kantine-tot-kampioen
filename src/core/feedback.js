import { S } from './state.js';
import { esc, geldTxt } from './utils.js';
import { ATTR } from '../data/gegevens.js';

/* ===================== Directe feedback: wat leverde je keuze op? ===================== */
const VELDEN = [['fit', 'Fitheid'], ['focus', 'Focus'], ['moraal', 'Moraal'], ['vert', 'Vertrouwen'], ['rep', 'Reputatie']];

export function momentopname(){
  if (!S || !S.sp) return null;
  const sp = S.sp, m = {S, a: {...sp.a}, geld: sp.geld};
  for (const [k] of VELDEN) m[k] = sp[k];
  return m;
}

// Toont de verschillen sinds de momentopname als één toast met gekleurde chips
export function toonVerschil(voor){
  if (!voor || voor.S !== S || !S.sp) return;
  const sp = S.sp, uit = [];
  for (const k in ATTR) if (k in voor.a && sp.a[k] !== voor.a[k]) uit.push([ATTR[k], sp.a[k] - voor.a[k]]);
  for (const [k, l] of VELDEN){ const d = Math.round(sp[k] ?? 0) - Math.round(voor[k] ?? 0); if (d) uit.push([l, d]); }
  const dg = Math.round(sp.geld - voor.geld);
  const chips = uit.map(([l, d]) => `<span class="eff ${d > 0 ? 'plus' : 'min'}">${d > 0 ? '+' : '−'}${Math.abs(d)}</span> ${esc(l)}`);
  if (dg) chips.push(`<span class="eff ${dg > 0 ? 'plus' : 'min'}">${dg > 0 ? '+' : '−'}${geldTxt(Math.abs(dg))}</span>`);
  if (chips.length) toast(chips.join('<span class="sep">·</span>'));
}

export function toast(html, ms = 3600){
  const box = document.getElementById('toasts'); if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast'; el.innerHTML = html;
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { el.classList.add('weg'); setTimeout(() => el.remove(), 400); }, ms);
}

/* ===================== Modal: bevestigen en hulp ===================== */
let sluitModal = null;
export const modalOpen = () => !!sluitModal;

export function openModal(titel, html, knoppen = [['Sluiten', true]]){
  return new Promise(klaar => {
    const m = document.getElementById('modal'), terugFocus = document.activeElement;
    m.innerHTML = `<div class="modalvak" role="dialog" aria-modal="true" aria-labelledby="modalTitel">
      <h2 id="modalTitel">${titel}</h2><div class="modaltekst">${html}</div>
      <div class="rij modalknoppen">${knoppen.map(([l, w], i) => `<button class="${i === knoppen.length - 1 ? 'hoofd middel' : 'klein'}" data-modal="${i}">${l}</button>`).join('')}</div></div>`;
    m.hidden = false;
    document.body.classList.add('modal-open');
    const klik = e => {
      const b = e.target.closest('[data-modal]');
      if (b) return sluit(knoppen[+b.dataset.modal][1]);
      if (e.target === m) sluit(false);
    };
    function sluit(waarde){
      m.removeEventListener('click', klik);
      m.hidden = true; m.innerHTML = ''; sluitModal = null;
      document.body.classList.remove('modal-open');
      if (terugFocus && terugFocus.focus) terugFocus.focus();
      klaar(waarde);
    }
    m.addEventListener('click', klik);
    sluitModal = sluit;
    const eerste = m.querySelector('.modalknoppen button:last-child'); if (eerste) eerste.focus();
  });
}

export function bevestig(tekst, ja = 'Ja, doorgaan'){
  return openModal('Weet je het zeker?', `<p>${tekst}</p>`, [['Nee, terug', false], [ja, true]]);
}

/* ===================== Sneltoetsen ===================== */
// 1-9: keuzes · Enter: hoofdknop · ←/→: tabbladen · Esc: venster sluiten
export function sneltoetsen(e){
  if (sluitModal){
    if (e.key === 'Escape'){ e.preventDefault(); sluitModal(false); }
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey || e.target.matches('input, select, textarea')) return;
  const zichtbaar = b => b && !b.disabled && b.isConnected && !b.closest('[style*="visibility: hidden"], [style*="visibility:hidden"]');
  let b = null;
  if (/^[1-9]$/.test(e.key)) b = document.querySelector(`#veld [data-sneltoets="${e.key}"]`);
  else if (e.key === 'Enter' && !e.target.closest('button, a, summary')) b = document.querySelector('#veld [data-primair]');
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight'){
    const tabs = [...document.querySelectorAll('#veld .hubtabs .hubtab')], i = tabs.findIndex(t => t.classList.contains('aan'));
    if (tabs.length && i >= 0) b = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
  }
  if (zichtbaar(b)){ e.preventDefault(); b.click(); }
}
