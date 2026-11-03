import { S, tmp } from '../../core/state.js';
import { knop } from '../../core/ui.js';
import { bevestig } from '../../core/feedback.js';
import { esc } from '../../core/utils.js';
import { STANDAARD as STANDAARD_TENUE, clubTenue } from '../../data/tenues.js';
import { BEWEGING_SCHEMA, PROFIELEN, STANDAARD, bewaarBeweging, bw, instellingen, resetProfiel, sanitize, telImport, zetInstellingen, zetVoorbeeldProfiel } from '../beweging-instellingen.js';

/* ===================== Bewegingseditor ===================== */
// Links de schuifjes (uit BEWEGING_SCHEMA), rechts jouw speler in het stadion: dezelfde renderer, hetzelfde model en dezelfde
// bewegingscode als in een wedstrijd. Alles wordt meteen opgeslagen en geldt ook in het spel.
// De schuifjes werken rechtstreeks op de pagina (zonder render()), anders zou het voorbeeld bij elk schuifje opnieuw beginnen.
// (three.js en het 3D-veld worden pas geladen als de editor opent, net als bij de wedstrijd: pitch.js)
const GANG = {stil:['Stil', 0], wandelen:['Wandelen', 1.6], rennen:['Rennen', 4.5], sprinten:['Sprinten', 7.6]};
const CAMS = {zij:['Zij', Math.PI / 2], voor:['Voor', 0], achter:['Achter', Math.PI], schuin:['Schuin', 2.3]};
const ACTIES = {schot:['Schieten', {}], hard:['Hard schot', {hard:true}], chip:['Chip', {soort:'chip'}], binnenkant:['Binnenkant', {soort:'binnenkant'}], hak:['Hakje', {soort:'hak'}], kop:['Kopbal', null]};
const decimalen = step => (String(step).split('.')[1] || '').length;
const fmt = (v, step) => Number(v).toFixed(decimalen(step));
let profiel = null, LUS = null;

function rijHtml(it, w){
  const v = w[it.key], anders = Math.abs(v - it.def) > 1e-9;
  return `<div class="bwrij${anders ? ' anders' : ''}" data-rij="${it.key}"><div class="bwkop"><label for="bw-${it.key}">${esc(it.label)}${it.unit ? ` <span class="bweenh">${esc(it.unit)}</span>` : ''}</label>
    <input type="number" class="bwgetal" data-key="${it.key}" min="${it.min}" max="${it.max}" step="${it.step}" value="${fmt(v, it.step)}" aria-label="${esc(it.label)}">
    <button type="button" class="bwreset" data-reset="${it.key}" title="Standaard (${fmt(it.def, it.step)})" aria-label="${esc(it.label)} terugzetten">↺</button></div>
    <input type="range" id="bw-${it.key}" data-key="${it.key}" min="${it.min}" max="${it.max}" step="${it.step}" value="${v}">${it.help ? `<div class="bwhulp">${esc(it.help)}</div>` : ''}</div>`;
}
function groepenHtml(){
  const w = instellingen().profielen[profiel];
  return BEWEGING_SCHEMA.map((g, i) => { const n = g.items.filter(it => Math.abs(w[it.key] - it.def) > 1e-9).length;
    return `<details class="bwgroep"${i === 0 ? ' open' : ''}><summary>${esc(g.groep)}<span class="bwtel">${n ? `${n} gewijzigd` : ''}</span></summary><div class="bwrijen">${g.items.map(it => rijHtml(it, w)).join('')}</div></details>`; }).join('');
}
const knopjes = (lijst, attr, aan) => Object.entries(lijst).map(([k, [l]]) => `<button type="button" data-${attr}="${k}" aria-pressed="${k === aan}">${l}</button>`).join('');

export function vBeweging(){
  profiel = profiel || (S && S.wereld === 'v' ? 'v' : 'm');
  return `<div class="bweditor" id="bwEditor">
    <aside class="bwpaneel">
      <div class="rij" style="justify-content:space-between;align-items:center"><h2>Beweging</h2>${knop('← Terug', () => { tmp.beweging = false; }, 'klein')}</div>
      <p class="muted klein-tekst">Pas aan hoe de spelers lopen, rennen, schieten en meebewegen. Alles wordt meteen opgeslagen en geldt ook in je wedstrijden.</p>
      <div class="bwtabs" role="tablist">${Object.entries(PROFIELEN).map(([k, l]) => `<button type="button" role="tab" data-profiel="${k}" aria-selected="${k === profiel}">${l}</button>`).join('')}</div>
      <div class="bwopslag" id="bwOpslag" aria-live="polite"></div>
      <div id="bwGroepen">${groepenHtml()}</div>
      <div class="bwacties">
        <button type="button" class="klein" id="bwExport">Exporteer JSON</button><button type="button" class="klein" id="bwImport">Importeer JSON</button>
        <button type="button" class="klein" id="bwReset">Reset ${PROFIELEN[profiel].toLowerCase()}</button>
      </div>
      <input type="file" id="bwBestand" accept="application/json,.json" hidden>
    </aside>
    <div class="bwbeeld pitchvak" id="bwBeeld">
      <canvas aria-label="Voorbeeld van de beweging in 3D"></canvas>
      <div class="bwbalk">
        <div class="bwknopgroep" role="group" aria-label="Gang"><span>Gang</span>${knopjes(GANG, 'gang', 'rennen')}</div>
        <div class="bwknopgroep" role="group" aria-label="Route"><span>Route</span><button type="button" data-route="recht" aria-pressed="true">Recht</button><button type="button" data-route="bocht" aria-pressed="false">Bocht</button></div>
        <div class="bwknopgroep" role="group" aria-label="Acties">${Object.entries(ACTIES).map(([k, [l]]) => `<button type="button" data-actie="${k}">${l}</button>`).join('')}</div>
        <div class="bwknopgroep" role="group" aria-label="Houding"><span>Houding</span><select id="bwHouding" aria-label="Houding"><option value="">geen</option></select></div>
        <div class="bwknopgroep" role="group" aria-label="Tijd"><span>Tempo</span><input type="range" id="bwTempo" min=".05" max="1" step=".05" value="1" aria-label="Afspeelsnelheid"><span id="bwTempoTxt" class="bwtempo">100%</span><button type="button" id="bwPauze">Pauze</button><button type="button" id="bwStap">Stap</button></div>
        <div class="bwknopgroep" role="group" aria-label="Camera"><span>Camera</span>${knopjes(CAMS, 'cam', 'zij')}</div>
      </div>
      <dl class="bwstats"><dt>Snelheid</dt><dd id="bwSnel">–</dd><dt>Gang</dt><dd id="bwGang">–</dd><dt>Stap</dt><dd id="bwPas">–</dd><dt>Cadans</dt><dd id="bwCadans">–</dd></dl>
      <div class="bwtip">Slepen = draaien · scrollen = zoomen<br>Spatie schieten · P pauze · . stap</div>
    </div>
  </div>`;
}

// ---------- na het tekenen: het paneel aansluiten en het voorbeeld laten lopen ----------
export function bewegingNaRender(){
  const root = document.getElementById('bwEditor');
  if (!root){ stop(); return; }
  stop();
  zetVoorbeeldProfiel(profiel);
  const $ = id => document.getElementById(id), beeld = $('bwBeeld');
  paneelAansluiten(root, $);
  import('../veld3d.js').then(V => {
    if (!root.isConnected) return;
    if (!V.beschikbaar()){ beeld.innerHTML = '<p class="muted" style="padding:20px">Het 3D-voorbeeld werkt niet op dit apparaat (geen WebGL). Je kunt de waarden wel aanpassen.</p>'; return; }
    $('bwHouding').insertAdjacentHTML('beforeend', V.POSE_NAMEN.map(p => `<option value="${p}">${p}</option>`).join(''));
    stop(); LUS = voorbeeld(V, beeld, $);
  }).catch(e => { console.warn('3D-voorbeeld kon niet laden', e); });
}
function stop(){ if (LUS){ LUS.stop(); LUS = null; } if (!document.getElementById('bwEditor')) zetVoorbeeldProfiel(null); }

function paneelAansluiten(root, $){
  const opslag = $('bwOpslag'); let timer;
  const melding = (t, ok) => { opslag.className = 'bwopslag ' + (ok ? 'ok' : 'fout'); opslag.textContent = t; };
  const bewaarStraks = () => { clearTimeout(timer); timer = setTimeout(() => bewaarBeweging() ? melding('Opgeslagen ✓', true) : melding('Opslaan mislukt (browseropslag geblokkeerd). Gebruik Exporteer JSON.', false), 250); };
  const item = key => BEWEGING_SCHEMA.flatMap(g => g.items).find(it => it.key === key);
  const zet = (key, ruw) => {
    const it = item(key), v = Math.min(it.max, Math.max(it.min, Number(ruw))); if (!Number.isFinite(v)) return;
    instellingen().profielen[profiel][key] = v;
    const rij = root.querySelector(`[data-rij="${key}"]`);
    rij.querySelector('input[type=range]').value = v; rij.querySelector('.bwgetal').value = fmt(v, it.step); rij.classList.toggle('anders', Math.abs(v - it.def) > 1e-9);
    const g = rij.closest('.bwgroep'), n = g.querySelectorAll('.bwrij.anders').length; g.querySelector('.bwtel').textContent = n ? `${n} gewijzigd` : '';
    bewaarStraks();
  };
  const groepen = $('bwGroepen');
  groepen.addEventListener('input', e => { if (e.target.type === 'range' && e.target.dataset.key) zet(e.target.dataset.key, e.target.value); });
  groepen.addEventListener('change', e => { if (e.target.classList.contains('bwgetal')) zet(e.target.dataset.key, e.target.value); });
  groepen.addEventListener('click', e => { const k = e.target.dataset && e.target.dataset.reset; if (k) zet(k, STANDAARD[k]); });
  const nieuwProfiel = p => { profiel = p; zetVoorbeeldProfiel(p); groepen.innerHTML = groepenHtml(); $('bwReset').textContent = `Reset ${PROFIELEN[p].toLowerCase()}`;
    root.querySelectorAll('[data-profiel]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.profiel === p))); if (LUS) LUS.nieuwModel(); };
  root.querySelectorAll('[data-profiel]').forEach(b => b.addEventListener('click', () => nieuwProfiel(b.dataset.profiel)));
  // exporteren, importeren en terugzetten
  $('bwExport').addEventListener('click', () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(instellingen(), null, 2)], {type:'application/json'})); a.download = 'beweging-spelers.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  const bestand = $('bwBestand');
  $('bwImport').addEventListener('click', () => bestand.click());
  bestand.addEventListener('change', async () => {
    const f = bestand.files[0]; bestand.value = ''; if (!f) return;
    let ruw; try { ruw = JSON.parse(await f.text()); } catch { melding('Dit bestand is geen geldige JSON.', false); return; }
    const schoon = sanitize(ruw), {fout, mist} = telImport(ruw, schoon); zetInstellingen(schoon); nieuwProfiel(profiel); bewaarBeweging();
    const delen = []; if (fout) delen.push(`${fout} waarde(n) waren ongeldig of buiten bereik en zijn gecorrigeerd`); if (mist) delen.push(`${mist} ontbrekende waarde(n) kregen de standaard`);
    melding(delen.length ? `Geïmporteerd. ${delen.join('; ')}.` : 'Geïmporteerd ✓', !fout);
  });
  $('bwReset').addEventListener('click', async () => {
    if (!(await bevestig(`Alle bewegingen van de ${PROFIELEN[profiel].toLowerCase()} terugzetten naar de standaard?`, 'Ja, terugzetten'))) return;
    resetProfiel(profiel); nieuwProfiel(profiel); bewaarStraks();
  });
}

// ---------- het voorbeeld ----------
function uiterlijk(p){
  const sp = S && S.sp, eigen = sp && !!sp.vrouw === (p === 'v') && sp.uiterlijk;
  return {...(eigen || (p === 'v' ? {huid:2, haar:0, kapsel:'staart'} : {huid:1, haar:1, kapsel:'kort'})), vrouw:p === 'v'};
}
function voorbeeld(V, beeld, $){
  const sp = S && S.sp, tenue = sp && sp.club != null && !sp.clubloos ? clubTenue(sp.club) : STANDAARD_TENUE, kleuren = {wij:tenue.shirt};
  const E = {id:'J', rol:'wij', x:40, y:34, z:0, pose:null, poseT0:0}, bal = {x:41, y:34, z:0, vx:0, vy:0, vz:0, vrij:false, t:0};
  const cam = {hoek:CAMS.zij[1], afstand:10.5, hoogte:2.8, kijkHoogte:1.55};
  const T = {ents:{J:E}, bal, trap:null, spelers:'echt', camVrij:cam, tekst:'', ploegen:{}};
  const zetModel = () => { T.ploegen = {jij:'bw' + profiel, jijUit:uiterlijk(profiel), tenues:{wij:tenue}}; };
  zetModel();
  const st = {gang:'rennen', route:'recht', tempo:1, pauze:false, stap:false, v:0, h:0, heen:true, nu:1000, kop:-1};
  let laatst = performance.now(), raf = 0, uit = false;
  // canvas aan de renderer hangen, en opnieuw bij een andere maat
  const maat = () => { const b = Math.max(200, beeld.clientWidth), h = Math.max(200, beeld.clientHeight); V.koppel3D(beeld, b, h, window.devicePixelRatio || 1); };
  maat(); const ro = new ResizeObserver(() => maat()); ro.observe(beeld);
  // knoppen
  const druk = (attr, w) => beeld.querySelectorAll(`[data-${attr}]`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset[attr] === w)));
  beeld.querySelectorAll('[data-gang]').forEach(b => b.addEventListener('click', () => { st.gang = b.dataset.gang; druk('gang', st.gang); }));
  beeld.querySelectorAll('[data-route]').forEach(b => b.addEventListener('click', () => { st.route = b.dataset.route; druk('route', st.route); }));
  beeld.querySelectorAll('[data-cam]').forEach(b => b.addEventListener('click', () => { cam.hoek = CAMS[b.dataset.cam][1]; cam.hoogte = 2.8; druk('cam', b.dataset.cam); }));
  const actie = k => {
    if (k === 'kop'){ if (st.kop < 0) st.kop = 0; return; }
    if (T.trap) return;
    bal.vrij = false; T.trap = {id:'J', t0:st.nu, dur:560, kc:.4, soort:null, hard:false, ...ACTIES[k][1]};
  };
  beeld.querySelectorAll('[data-actie]').forEach(b => b.addEventListener('click', () => actie(b.dataset.actie)));
  $('bwHouding').addEventListener('change', e => { E.pose = e.target.value || null; E.poseT0 = st.nu; });
  $('bwTempo').addEventListener('input', e => { st.tempo = +e.target.value; $('bwTempoTxt').textContent = `${Math.round(st.tempo * 100)}%`; });
  const pauzeKnop = $('bwPauze'), pauze = () => { st.pauze = !st.pauze; pauzeKnop.textContent = st.pauze ? 'Verder' : 'Pauze'; pauzeKnop.setAttribute('aria-pressed', String(st.pauze)); };
  pauzeKnop.addEventListener('click', pauze);
  $('bwStap').addEventListener('click', () => { if (!st.pauze) pauze(); st.stap = true; });
  // slepen draait de camera om de speler, scrollen zoomt
  let sleep = null;
  beeld.addEventListener('pointerdown', e => { if (e.target.tagName !== 'CANVAS') return; sleep = {x:e.clientX, y:e.clientY}; e.target.setPointerCapture(e.pointerId); });
  beeld.addEventListener('pointermove', e => { if (!sleep) return; cam.hoek -= (e.clientX - sleep.x) * .01; cam.hoogte = Math.min(9, Math.max(.4, cam.hoogte + (e.clientY - sleep.y) * .02)); sleep = {x:e.clientX, y:e.clientY}; });
  beeld.addEventListener('pointerup', () => { sleep = null; });
  beeld.addEventListener('wheel', e => { if (e.target.tagName !== 'CANVAS') return; e.preventDefault(); cam.afstand = Math.min(25, Math.max(2.5, cam.afstand * (e.deltaY > 0 ? 1.1 : 1 / 1.1))); }, {passive:false});
  const toets = e => {
    if (e.target.matches('input:not([type=range]), select, textarea') || !document.getElementById('bwEditor')) return;
    if (e.code === 'Space'){ e.preventDefault(); if (!e.repeat) actie('schot'); }
    else if (e.code === 'KeyP' && !e.repeat) pauze();
    else if (e.code === 'Period'){ if (!st.pauze) pauze(); st.stap = true; }
  };
  window.addEventListener('keydown', toets);

  // de speler loopt heen en weer (keert aan het eind) of rondjes; de bal ligt voor zijn voeten tot hij hem wegtrapt
  function beweeg(dt){
    const doel = GANG[st.gang][1];
    st.v += Math.max(-9 * dt, Math.min(6 * dt, doel - st.v));
    let doelH;
    if (st.route === 'recht'){ const tx = st.heen ? 78 : 27; if (Math.abs(E.x - tx) < 3) st.heen = !st.heen; doelH = Math.atan2(34 - E.y, (st.heen ? 78 : 27) - E.x); }
    else { const dx = E.x - 52.5, dy = E.y - 34, r = Math.hypot(dx, dy) || 1, a = Math.atan2(dy, dx); doelH = a + Math.PI / 2 + Math.max(-.6, Math.min(.6, (r - 9) * .15)); }
    if (st.v > .05){ let d = doelH - st.h; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; st.h += Math.max(-2.6 * dt, Math.min(2.6 * dt, d)); }
    E.x += Math.cos(st.h) * st.v * dt; E.y += Math.sin(st.h) * st.v * dt;
    // kopbal: even de lucht in
    if (st.kop >= 0){ st.kop += dt; E.z = Math.max(0, Math.sin(Math.PI * st.kop / .7) * .75); if (st.kop >= .7){ st.kop = -1; E.z = 0; } }
    // de trap: bij het contact vliegt de bal weg (een hakje naar achter)
    const tr = T.trap;
    if (tr && !bal.vrij && st.nu >= tr.t0 + tr.dur * tr.kc){
      const k = tr.soort === 'hak' ? -7 : tr.soort === 'chip' ? 13 : tr.soort === 'binnenkant' ? 15 : tr.hard ? 27 : 20;
      Object.assign(bal, {vrij:true, t:0, vx:Math.cos(st.h) * k, vy:Math.sin(st.h) * k, vz:tr.soort === 'chip' ? 8 : tr.hard ? 3 : tr.soort === 'hak' ? 1 : 1.8});
    }
    if (tr && st.nu > tr.t0 + tr.dur) T.trap = null;
    if (bal.vrij){
      bal.t += dt; bal.vz -= 9.81 * dt; bal.x += bal.vx * dt; bal.y += bal.vy * dt; bal.z += bal.vz * dt;
      if (bal.z < 0){ bal.z = 0; bal.vz = bal.vz < -1 ? -bal.vz * .5 : 0; }
      const f = Math.exp(-(bal.z > 0 ? .1 : 1.2) * dt); bal.vx *= f; bal.vy *= f;
      if (bal.t > 3.5) bal.vrij = false;
    }
    if (!bal.vrij){ bal.x = E.x + Math.cos(st.h) * .75; bal.y = E.y + Math.sin(st.h) * .75; bal.z = 0; }
  }
  const tekst = (id, t) => { const el = $(id); if (el && el.textContent !== t) el.textContent = t; };
  function cijfers(){
    const v = st.v, B = bw(), stap = B.pasBasis + B.pasPerSnelheid * v;
    tekst('bwSnel', `${(v * 3.6).toFixed(1)} km/u`);
    tekst('bwGang', v < .1 ? 'stil' : v < 2.5 ? 'wandelen' : v < B.sprintVanaf - .5 ? 'rennen' : 'sprinten');
    tekst('bwPas', v > .1 ? `${stap.toFixed(2)} m` : '–'); tekst('bwCadans', v > .1 ? `${Math.round(v / stap * 60)} /min` : '–');
  }
  function lus(t){
    if (uit) return;
    if (!document.getElementById('bwEditor') || !beeld.isConnected){ stopLus(); return; }
    const echt = Math.min(.05, (t - laatst) / 1000); laatst = t;
    const dt = st.pauze ? (st.stap ? 1 / 60 : 0) : echt * st.tempo; st.stap = false;
    if (dt > 0){ st.nu += dt * 1000; beweeg(dt); V.teken3D(T, st.nu, kleuren); cijfers(); }
    else V.kijk3D(T); // op pauze: alleen de camera
    raf = requestAnimationFrame(lus);
  }
  function stopLus(){ uit = true; cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('keydown', toets); }
  raf = requestAnimationFrame(lus);
  return {stop:stopLus, nieuwModel:zetModel};
}
