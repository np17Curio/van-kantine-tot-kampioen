import './styles/index.css';
import { bevestig, momentopname, openModal, sneltoetsen, toonVerschil } from './core/feedback.js';
import { S, SLOTS, bewaar, exporteer, importeer, resetTmp, setS, tmp } from './core/state.js';
import { krantNaRender } from './render/krantfoto.js';
import { startVertaler, taal, zetTaal } from './core/taal.js';
import { muziekAan, muziekVolume, startMuziek, zetMuziek, zetVolume } from './core/muziek.js';
import { herstel } from './core/migratie.js';
import { herstelSeizoenDelen } from './game/seizoen/seizoen.js';
import { ACTS, render, speelOndertekening } from './core/ui.js';
import { instel } from './render/pitch.js';
import { suggHtml } from './render/views/agent.js';
import { HERKOMST_IDS, hulpInhoud, opslagKnoppen } from './render/views/start.js';

/* ===================== Invoer ===================== */
// De taalknop (bovenbalk): Nederlands of Engels (core/taal.js vertaalt de tekst op het scherm)
document.addEventListener('click', e => { const k = e.target.closest('[data-taal]'); if (!k) return; e.preventDefault(); e.stopPropagation(); const naar = taal() === 'en' ? 'nl' : 'en'; zetTaal(naar); render(); }, true); // (niet herladen: je blijft op hetzelfde scherm; zetTaal zet ook een open venster terug naar het Nederlands)
startVertaler();
// De muziekknop (bovenbalk): achtergrondmuziek aan of uit (core/muziek.js)
document.addEventListener('click', e => { const k = e.target.closest('[data-muziek]'); if (!k) return; e.preventDefault(); e.stopPropagation(); zetMuziek(!muziekAan()); render(); }, true);
startMuziek();
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
// De transfer-animatie bekijken (vanuit "Hoe werkt het?"), met je huidige club
document.addEventListener('click', e => {
  if (!e.target.closest || !e.target.closest('#bekijkTransfer') || !S || !S.sp) return;
  const sluit = document.querySelector('#modal [data-modal]'); if (sluit) sluit.click(); // het hulpvenster dicht
  speelOndertekening({clubId:S.sp.club});
});
document.addEventListener('change', async e => {
  if (e.target.id !== 'opslagLaad' || !e.target.files || !e.target.files[0]) return;
  const tekst = await e.target.files[0].text(); e.target.value = '';
  if (S && !(await bevestig('Je huidige carrière wordt vervangen door die uit het bestand.', 'Ja, laden'))) return;
  const r = importeer(tekst); if (r.fout){ alert(r.fout); return; }
  const m = document.getElementById('modal'); if (m && m.open) m.close();
  const st = herstel(r.d); st.slot = r.slot; setS(st); herstelSeizoenDelen(); render();
});
document.addEventListener('toggle', e => { if (e.target.dataset && e.target.dataset.meer){ (tmp.meer || (tmp.meer = {}))[e.target.dataset.meer] = e.target.open; if (e.target.open) try { krantNaRender(); } catch (x){} } if (e.target.id === 'clubLijstPanel') tmp.clubLijstOpen = e.target.open; if (e.target.id === 'hulpPanel') tmp.hulpOpen = e.target.open; if (e.target.id === 'programmaPanel') tmp.programmaOpen = e.target.open; if (e.target.id === 'focusPanel' && tmp.focusOpen !== e.target.open){ tmp.focusOpen = e.target.open; render(); } }, true);
window.addEventListener('resize', () => { const h = document.getElementById('hud'); if (h) document.documentElement.style.setProperty('--hud-h', h.offsetHeight + 'px'); });

/* ===================== Hulp en instellingen ===================== */
async function toonHulp(){
  const anim = S ? instel().anim : null;
  const ta = S ? instel().transferAnim || 'aan' : null, magBekijken = S && S.sp && !S.sp.clubloos && !S.trainer;
  const instellingen = S ? `<h3>Animaties in de wedstrijd</h3><div class="rij">${['normaal', 'snel', 'uit'].map(v => `<label class="radio"><input type="radio" name="anim" value="${v}" ${anim === v ? 'checked' : ''}> ${v[0].toUpperCase() + v.slice(1)}</label>`).join('')}</div>
    <h3>Animatie bij een transfer</h3><p class="muted klein-tekst">Je tekent je contract bij de voorzitter, geeft hem een hand en houdt je nieuwe shirt omhoog.</p>
    <div class="rij">${['aan', 'uit'].map(v => `<label class="radio"><input type="radio" name="transferAnim" value="${v}" ${ta === v ? 'checked' : ''}> ${v[0].toUpperCase() + v.slice(1)}</label>`).join('')}</div>
    ${magBekijken ? '<p><button class="klein" id="bekijkTransfer" type="button">✍️ Bekijk de animatie (bij je huidige club)</button></p>' : ''}
    <h3>Huldiging na een prijs</h3><p class="muted klein-tekst">Na een titel, een beker of een toernooi staat het team op het podium en til jij de prijs boven je hoofd.</p>
    <div class="rij">${['aan', 'uit'].map(v => `<label class="radio"><input type="radio" name="huldigingAnim" value="${v}" ${(instel().huldigingAnim || 'aan') === v ? 'checked' : ''}> ${v[0].toUpperCase() + v.slice(1)}</label>`).join('')}</div>
    <h3>Opkomst vóór de wedstrijd</h3><p class="muted klein-tekst">De teams komen het veld op en je ziet beide opstellingen. Op het scherm vóór de aftrap kun je hem ook altijd zelf starten (🎬).</p>
    <div class="rij">${[['belangrijk', 'Belangrijke duels'], ['altijd', 'Altijd'], ['uit', 'Uit']].map(([v, l]) => `<label class="radio"><input type="radio" name="opkomst" value="${v}" ${(instel().opkomst || 'belangrijk') === v ? 'checked' : ''}> ${l}</label>`).join('')}</div>` : '';
  const muziek = `<h3>Muziek</h3><p class="muted klein-tekst">Rustige achtergrondmuziek terwijl je speelt. Je kunt hem ook met de 🎵-knop bovenin aan of uit zetten.</p>
    <div class="rij">${[['aan', 'Aan'], ['uit', 'Uit']].map(([v, l]) => `<label class="radio"><input type="radio" name="muziek" value="${v}" ${(muziekAan() ? 'aan' : 'uit') === v ? 'checked' : ''}> ${l}</label>`).join('')}
    <label class="radio" style="gap:8px">Volume <input type="range" id="muziekVolume" min="0" max="1" step="0.05" value="${muziekVolume()}" style="width:140px"></label></div>`;
  const p = openModal('Hoe werkt het?', `${instellingen}${muziek}
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
  const wissel = e => { if (e.target.name === 'muziek'){ zetMuziek(e.target.value === 'aan'); render(); } if (e.target.name === 'anim' && S){ instel().anim = e.target.value; render(); } if (e.target.name === 'transferAnim' && S){ instel().transferAnim = e.target.value; bewaar(); } if (e.target.name === 'opkomst' && S){ instel().opkomst = e.target.value; bewaar(); } if (e.target.name === 'huldigingAnim' && S){ instel().huldigingAnim = e.target.value; bewaar(); } };
  const volume = e => { if (e.target.id === 'muziekVolume') zetVolume(e.target.value); };
  m.addEventListener('change', wissel); m.addEventListener('input', volume);
  await p;
  m.removeEventListener('change', wissel); m.removeEventListener('input', volume);
}

/* ===================== Start ===================== */
render();

// Handig bij debuggen en voor de automatische speltest
window.__S = () => S;
