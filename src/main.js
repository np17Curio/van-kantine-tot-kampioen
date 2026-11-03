import './styles/index.css';
import { bevestig, momentopname, openModal, sneltoetsen, toonVerschil } from './core/feedback.js';
import { S, SLOTS, bewaar, exporteer, importeer, resetTmp, setS, tmp } from './core/state.js';
import { herstel } from './core/migratie.js';
import { herstelSeizoenDelen } from './game/seizoen/seizoen.js';
import { ACTS, render } from './core/ui.js';
import { instel } from './render/pitch.js';
import { suggHtml } from './render/views/agent.js';
import { HERKOMST_IDS, hulpInhoud, opslagKnoppen } from './render/views/start.js';

/* ===================== Invoer ===================== */
document.addEventListener('click', async e => {
  if (e.target.closest('[data-hulp]')) return toonHulp();
  const b = e.target.closest('[data-i]'); if (!b || b.disabled) return;
  const fn = ACTS[+b.dataset.i]; if (!fn) return;
  // Onomkeerbare acties eerst laten bevestigen
  if (b.dataset.bevestig && !(await bevestig(b.dataset.bevestig, b.dataset.ja))) return;
  const naar = b.dataset.naar, voor = momentopname();
  fn(); render();
  toonVerschil(voor);
  if (naar){ const el = document.getElementById(naar); if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({block:'start'}); }
  else if (!b.hasAttribute('data-blijf')) window.scrollTo({top: Math.min(window.scrollY, document.getElementById('veld').offsetTop - 16)});
});
document.addEventListener('input', e => {
  const id = e.target.id;
  if (id === 'naam') tmp.naam = e.target.value;
  else if (id === 'vriendNaam') tmp.vriendNaam = e.target.value;
  else if (id === 'agentInput'){ tmp.agentQ = e.target.value; const box = document.getElementById('agentSugg'); if (box) box.innerHTML = suggHtml(tmp.agentQ); }
  else if (HERKOMST_IDS.includes(id)) tmp[id] = e.target.value;
});
document.addEventListener('change', e => { if (e.target.id === 'opgroei'){ tmp.opgroei = e.target.value; if (!S) render(); } if (HERKOMST_IDS.includes(e.target.id)){ tmp[e.target.id] = e.target.value; if (e.target.id === 'geboren' && !S && !tmp.opgroei) render(); } if (e.target.id === 'wensNr'){ tmp.wensNr = +e.target.value || null; if (S && S.sp) S.sp.wensNr = tmp.wensNr; render(); } });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'agentInput'){ e.preventDefault(); const b = document.getElementById('agentVraag'); if (b) b.click(); } });
document.addEventListener('keydown', sneltoetsen);
// Opslag downloaden en laden (de knoppen staan op het startscherm en in "Hoe werkt het?")
document.addEventListener('click', e => {
  if (!e.target.closest || !e.target.closest('#opslagDown')) return;
  const t = exporteer(); if (!t){ alert('Er is nog geen opgeslagen carrière.'); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], {type:'application/json'})); a.download = 'doorbreken-carriere.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
// Naar het hoofdmenu: bewaren en terug naar het startscherm (daar kies je een andere carrière of begin je een nieuwe)
document.addEventListener('click', e => {
  if (!e.target.closest || !e.target.closest('#naarMenu')) return;
  if (S) bewaar(); setS(null); resetTmp(); const m = document.getElementById('modal'); if (m && m.open) m.close(); render();
});
// De bewegingseditor (render/views/beweging.js): hoe de 3D-spelers lopen, rennen en schieten
document.addEventListener('click', e => {
  if (!e.target.closest || !e.target.closest('#naarBeweging')) return;
  const m = document.getElementById('modal'); if (m && m.open) m.close(); tmp.beweging = true; tmp.stats = false; render(); window.scrollTo(0, 0);
});
document.addEventListener('change', async e => {
  if (e.target.id !== 'opslagLaad' || !e.target.files || !e.target.files[0]) return;
  const tekst = await e.target.files[0].text(); e.target.value = '';
  if (S && !(await bevestig('Je huidige carrière wordt vervangen door die uit het bestand.', 'Ja, laden'))) return;
  const r = importeer(tekst); if (r.fout){ alert(r.fout); return; }
  const m = document.getElementById('modal'); if (m && m.open) m.close();
  const st = herstel(r.d); st.slot = r.slot; setS(st); herstelSeizoenDelen(); render();
});
document.addEventListener('toggle', e => { if (e.target.id === 'clubLijstPanel') tmp.clubLijstOpen = e.target.open; if (e.target.id === 'hulpPanel') tmp.hulpOpen = e.target.open; if (e.target.id === 'programmaPanel') tmp.programmaOpen = e.target.open; if (e.target.id === 'focusPanel' && tmp.focusOpen !== e.target.open){ tmp.focusOpen = e.target.open; render(); } }, true);
window.addEventListener('resize', () => { const h = document.getElementById('hud'); if (h) document.documentElement.style.setProperty('--hud-h', h.offsetHeight + 'px'); });

/* ===================== Hulp en instellingen ===================== */
async function toonHulp(){
  const anim = S ? instel().anim : null;
  const instellingen = S ? `<h3>Animaties in de wedstrijd</h3><div class="rij">${['normaal', 'snel', 'uit'].map(v => `<label class="radio"><input type="radio" name="anim" value="${v}" ${anim === v ? 'checked' : ''}> ${v[0].toUpperCase() + v.slice(1)}</label>`).join('')}</div>` : '';
  const p = openModal('Hoe werkt het?', `${instellingen}
    <h3>Sneltoetsen</h3>
    <ul class="toetsen"><li><kbd>1</kbd>–<kbd>9</kbd> kies de genummerde keuze</li><li><kbd>Enter</kbd> hoofdknop (verder, speel, volgende week)</li><li><kbd>←</kbd> <kbd>→</kbd> wissel van tabblad</li><li><kbd>Esc</kbd> sluit dit venster</li></ul>
    ${hulpInhoud()}
    <h3>Opslag</h3>
    <p class="muted klein-tekst">Je carrière wordt in deze browser bewaard, bij dit adres (tot ${SLOTS} carrières naast elkaar). Download hem als bestand om hem mee te nemen of veilig te bewaren.</p>${opslagKnoppen()}
    <h3>Beweging van de spelers</h3>
    <p class="muted klein-tekst">Pas aan hoe de 3D-spelers lopen, rennen, schieten en meebewegen, met een live voorbeeld.</p>
    <p><button class="klein" id="naarBeweging" type="button">🏃 Bewegingseditor openen</button></p>
    ${S ? '<p><button class="klein" id="naarMenu" type="button">🏠 Naar het hoofdmenu (andere carrière)</button></p>' : ''}
    <h3>Bronnen</h3>
    <p class="muted klein-tekst">3D-spelersmodel: <a href="https://sketchfab.com/3d-models/pallone-da-calciogiocatore-3016826bcb984b02869f8dcc296120e0" target="_blank" rel="noopener" style="color:var(--info)">"pallone da calcio+giocatore"</a> door rosaliarenda (Sketchfab), licentie <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener" style="color:var(--info)">CC-BY-4.0</a>. Aangepast voor dit spel: spijkerbroek, bal en wimpers weggelaten, texturen verkleind, eigen tenues, huidskleur, kapsels, lengte, bouw en bewegingen.</p>`);
  const m = document.getElementById('modal');
  const wissel = e => { if (e.target.name === 'anim' && S){ instel().anim = e.target.value; render(); } };
  m.addEventListener('change', wissel);
  await p;
  m.removeEventListener('change', wissel);
}

/* ===================== Start ===================== */
render();

// Handig bij debuggen en voor de automatische speltest
window.__S = () => S;
