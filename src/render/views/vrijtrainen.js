import { S, tmp } from '../../core/state.js';
import { knop } from '../../core/ui.js';
import { STANDAARD as STANDAARD_TENUE, clubTenue } from '../../data/tenues.js';

/* ===================== Vrij trainen: zelf je speler besturen ===================== */
// Naar voetballers.html en voetbal-kern.js: je loopt met je eigen 3D-speler over het veld (versnellen, afremmen, draaien),
// dribbelt met de bal, schiet op het doel (met een keeper) en neemt de bal aan op je borst. Alles in veldmeters
// (x 0-105 in de lengte, y 0-68 in de breedte, z = hoogte); het 3D-veld tekent het met dezelfde code als een wedstrijd.
// Het telt niet als activiteit van de week: het is gewoon om te spelen. Je beste score bij de oefening wordt bewaard.
const DOEL = {x:105, y1:30.34, y2:37.66, lat:2.44}, OEFENING = 60;
const klem = (v, a, b) => Math.min(b, Math.max(a, v));
let LUS = null;

export function vVrijTrainen(){
  const rec = S && S.sp && S.sp.vrijRecord;
  return `<div class="vrij" id="vrijTrainen">
    <div class="rij" style="justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h2>⚽ Vrij trainen</h2>
      <div class="rij" style="gap:6px"><button type="button" class="klein" id="vtStart">⏱ Oefening: zoveel mogelijk goals in ${OEFENING} s</button>${knop('← Terug', () => { tmp.vrijTrainen = false; }, 'klein')}</div></div>
    <div class="bwbeeld pitchvak vtbeeld" id="vtBeeld" tabindex="0" aria-label="Het trainingsveld. Bestuur je speler met het toetsenbord.">
      <canvas aria-label="Het trainingsveld in 3D"></canvas>
      <div class="vtstand"><div><b id="vtGoals">0</b> goals</div><div id="vtTijd">vrij spelen</div><div class="muted">${rec ? `record: ${rec}` : 'nog geen record'}</div><div class="muted" id="vtSnel">0 km/u</div></div>
      <div class="vtknoppen"><button type="button" data-vt="sprint">Sprint</button><button type="button" data-vt="schiet">Schiet</button><button type="button" data-vt="borst">Borst</button></div>
      <div class="bwtip vttip"><b>WASD / pijltjes</b> lopen · <b>Shift</b> sprinten · <b>Q</b> wandelen<br><b>Spatie</b> schieten · <b>E</b> bal op de borst · <b>Esc</b> terug</div>
    </div>
    <p class="muted klein-tekst">Op een telefoon: sleep met je duim over het veld om te lopen. Vrij trainen telt niet als je activiteit van de week.</p>
  </div>`;
}

export function vrijNaRender(){
  const root = document.getElementById('vrijTrainen');
  if (LUS){ LUS.stop(); LUS = null; }
  if (!root) return;
  import('../veld3d.js').then(V => {
    if (!root.isConnected) return;
    const beeld = document.getElementById('vtBeeld');
    if (!V.beschikbaar()){ beeld.innerHTML = '<p class="muted" style="padding:20px">Vrij trainen werkt niet op dit apparaat (geen WebGL).</p>'; return; }
    if (LUS) LUS.stop();
    LUS = speel(V, root, beeld);
  }).catch(e => console.warn('Vrij trainen kon niet laden', e));
}

function speel(V, root, beeld){
  const $ = id => document.getElementById(id), sp = S && S.sp, a = (sp && sp.a) || {};
  const tenue = sp && sp.club != null && !sp.clubloos ? clubTenue(sp.club) : STANDAARD_TENUE;
  // snelheden en schotkracht uit je eigen eigenschappen
  const SNEL = {wandel:1.8, ren:4.6, sprint:6.6 + ((a.cond || 50) + (a.drib || 50)) / 100}, KRACHT = 15 + (a.afw || 50) / 100 * 12;
  const E = {id:'J', rol:'wij', x:80, y:34, z:0, pose:null, poseT0:0}, K = {id:'K', rol:'K', x:104.3, y:34, z:0};
  const bal = {x:81, y:34, z:0, vx:0, vy:0, vz:0};
  const cam = {wereld:true, hoek:-Math.PI / 2, afstand:10, hoogte:5, kijkHoogte:1.2, vooruit:4, dt:0};
  const T = {ents:{J:E, K}, bal, trap:null, spelers:'echt', camVrij:cam, tekst:'', nr:sp ? '' : '',
    ploegen:{jij:sp ? sp.uitSleutel || 'vrij' : 'vrij', jijUit:sp ? {...(sp.uiterlijk || {}), vrouw:!!sp.vrouw} : null, tenues:{wij:tenue}}};
  const kleuren = {wij:tenue.shirt, K:'#8a5cf0'};
  const st = {vx:0, vy:0, h:0, nu:1000, goals:0, oef:null, borst:null, keeperDuik:null, reset:null, keeperV:0};
  const toets = new Set(), touch = {dir:null, sprint:false};
  let laatst = performance.now(), raf = 0, uit = false;
  const maat = () => V.koppel3D(beeld, Math.max(200, beeld.clientWidth), Math.max(200, beeld.clientHeight), window.devicePixelRatio || 1);
  maat(); const ro = new ResizeObserver(maat); ro.observe(beeld);

  // ---------- acties ----------
  const vooruit = () => ({x:Math.cos(st.h), y:Math.sin(st.h)});
  function schiet(hard){
    if (T.trap) return;
    T.trap = {id:'J', t0:st.nu, dur:560, kc:.4, hard:!!hard, soort:null};
  }
  function borst(){
    if (st.borst || T.trap) return;
    // de bal komt met een boog aanvliegen van 6 meter voor je, naar borsthoogte (de borst zit op ~1,45 m: de spelers zijn groter dan echt)
    const f = vooruit(), van = {x:E.x + f.x * 6, y:E.y + f.y * 6}, duur = .9, doelZ = 1.45;
    Object.assign(bal, {x:van.x, y:van.y, z:.5, vx:(E.x + f.x * .3 - van.x) / duur, vy:(E.y + f.y * .3 - van.y) / duur, vz:(doelZ - .5) / duur + .5 * 9.81 * duur});
    st.borst = {t:0, geraakt:false}; E.pose = 'borst'; E.poseT0 = st.nu;
  }
  const melding = (t, kl) => { T.tekst = t; T.tekstKleur = kl || '#fff'; T.tekstT = 0; st.tekstTot = st.nu + 1400; };
  function oefening(){ st.goals = 0; st.oef = {tot:st.nu + OEFENING * 1000}; $('vtGoals').textContent = '0'; melding('Start!', '#c6f432'); }

  // ---------- invoer ----------
  const rondom = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
  const neer = e => {
    if (!document.getElementById('vrijTrainen')) return;
    if (e.target.matches && e.target.matches('input, select, textarea')) return;
    if (rondom.includes(e.code)) e.preventDefault();
    if (e.code === 'Escape'){ tmp.vrijTrainen = false; import('../../core/ui.js').then(u => u.render()); return; }
    if (e.code === 'Space' && !e.repeat) schiet(toets.has('ShiftLeft') || toets.has('ShiftRight'));
    if (e.code === 'KeyE' && !e.repeat) borst();
    toets.add(e.code);
  };
  const op = e => toets.delete(e.code), weg = () => toets.clear();
  window.addEventListener('keydown', neer); window.addEventListener('keyup', op); window.addEventListener('blur', weg);
  $('vtStart').addEventListener('click', () => { oefening(); beeld.focus(); });
  beeld.querySelectorAll('[data-vt]').forEach(b => {
    const k = b.dataset.vt;
    if (k === 'sprint'){ b.addEventListener('pointerdown', () => { touch.sprint = true; }); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { touch.sprint = false; }); }
    else b.addEventListener('click', () => (k === 'schiet' ? schiet(touch.sprint) : borst()));
  });
  // joystick: slepen op het veld (omhoog = richting het doel, opzij = opzij)
  let duim = null;
  beeld.addEventListener('pointerdown', e => { if (e.target.tagName !== 'CANVAS') return; duim = {x:e.clientX, y:e.clientY}; e.target.setPointerCapture(e.pointerId); beeld.focus(); });
  beeld.addEventListener('pointermove', e => { if (!duim) return; const dx = e.clientX - duim.x, dy = e.clientY - duim.y, l = Math.hypot(dx, dy);
    touch.dir = l > 12 ? {x:-dy / l, y:-dx / l, kracht:Math.min(1, l / 70)} : null; });
  const loslaten = () => { duim = null; touch.dir = null; };
  beeld.addEventListener('pointerup', loslaten); beeld.addEventListener('pointercancel', loslaten);
  beeld.focus();

  // ---------- de wereld ----------
  function beweeg(dt){
    const t = c => toets.has(c);
    let dx = (t('KeyW') || t('ArrowUp') ? 1 : 0) - (t('KeyS') || t('ArrowDown') ? 1 : 0), dy = (t('KeyA') || t('ArrowLeft') ? 1 : 0) - (t('KeyD') || t('ArrowRight') ? 1 : 0), kracht = 1;
    if (!dx && !dy && touch.dir){ dx = touch.dir.x; dy = touch.dir.y; kracht = touch.dir.kracht; }
    const l = Math.hypot(dx, dy); if (l){ dx /= l; dy /= l; }
    const sprint = t('ShiftLeft') || t('ShiftRight') || touch.sprint, top = (t('KeyQ') ? SNEL.wandel : sprint ? SNEL.sprint : SNEL.ren) * kracht;
    const bezig = T.trap ? .25 : st.borst ? 0 : 1, doelVx = dx * top * bezig, doelVy = dy * top * bezig;
    // versnellen en afremmen (niet meteen op topsnelheid), zoals in voetbal-kern.js
    const v0 = Math.hypot(st.vx, st.vy), wil = Math.hypot(doelVx, doelVy), rate = wil > v0 + .01 ? 7 : 10;
    let ddx = doelVx - st.vx, ddy = doelVy - st.vy; const dl = Math.hypot(ddx, ddy); if (dl > rate * dt){ ddx *= rate * dt / dl; ddy *= rate * dt / dl; }
    // draaien gaat bij hoge snelheid trager: de richting van de snelheid draait hooguit zo snel
    let nvx = st.vx + ddx, nvy = st.vy + ddy; const v = Math.hypot(nvx, nvy);
    if (v > .3 && v0 > .3){ const h0 = Math.atan2(st.vy, st.vx); let dh = Math.atan2(nvy, nvx) - h0; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI;
      const max = (9 + (3.5 - 9) * Math.min(1, v / SNEL.sprint)) * dt, h1 = h0 + klem(dh, -max, max); nvx = Math.cos(h1) * v; nvy = Math.sin(h1) * v; }
    st.vx = nvx; st.vy = nvy; if (v > .3) st.h = Math.atan2(st.vy, st.vx);
    E.x = klem(E.x + st.vx * dt, -2, 107); E.y = klem(E.y + st.vy * dt, -2, 70);
    // de trap: bij het contactmoment vertrekt de bal (als hij voor je voeten ligt)
    const tr = T.trap;
    if (tr && !tr.raak && st.nu >= tr.t0 + tr.dur * tr.kc){ tr.raak = true; const f = vooruit(), bx = bal.x - E.x, by = bal.y - E.y;
      if (Math.hypot(bx, by) < 1.7 && bx * f.x + by * f.y > -.2 && bal.z < 1.2){ const k = KRACHT + (tr.hard ? 6 : 0) + Math.hypot(st.vx, st.vy) * .8;
        Object.assign(bal, {vx:f.x * k, vy:f.y * k, vz:tr.hard ? 5.5 : 3.2}); st.schot = true; } }
    if (tr && st.nu > tr.t0 + tr.dur) T.trap = null;
    // borst-aanname: de bal valt voor je voeten als hij je borst raakt
    if (st.borst){ st.borst.t += dt; const f = vooruit();
      if (!st.borst.geraakt && Math.hypot(bal.x - E.x, bal.y - E.y) < .9 && bal.z > 1.2 && bal.z < 2.3){ st.borst.geraakt = true; Object.assign(bal, {vx:f.x * 1.2, vy:f.y * 1.2, vz:1.2}); melding('Aangenomen!', '#b9ff9c'); }
      if (st.borst.t > 1.65){ st.borst = null; E.pose = null; } }
    // bal: zwaartekracht, stuiteren en wrijving (exact geïntegreerd, zoals in voetbal-kern.js)
    const vorigX = bal.x;
    bal.x += bal.vx * dt; bal.y += bal.vy * dt; bal.z += bal.vz * dt - .5 * 9.81 * dt * dt; bal.vz -= 9.81 * dt;
    if (bal.z < 0){ bal.z = 0; bal.vz = bal.vz < -.8 ? -bal.vz * .55 : 0; }
    const fr = Math.exp(-(bal.z <= .001 ? 1.1 : .08) * dt); bal.vx *= fr; bal.vy *= fr;
    // dribbelen: de bal licht voor je voeten uit tikken; en je lichaam duwt hem weg
    const sp0 = Math.hypot(st.vx, st.vy), f = vooruit();
    if (!T.trap && !st.borst && bal.z < .5){ const fx = E.x + f.x * .65, fy = E.y + f.y * .65;
      if (Math.hypot(bal.x - fx, bal.y - fy) < .6 && sp0 > .4 && bal.vx * f.x + bal.vy * f.y < sp0 * 1.1){ bal.vx = f.x * sp0 * 1.35; bal.vy = f.y * sp0 * 1.35; } }
    { const bx = bal.x - E.x, by = bal.y - E.y, bl = Math.hypot(bx, by); if (!st.borst && bal.z < 2 && bl < .45 && bl > 1e-4){ const nx = bx / bl, ny = by / bl; bal.x = E.x + nx * .45; bal.y = E.y + ny * .45; const vn = bal.vx * nx + bal.vy * ny; if (vn < 0){ bal.vx -= 1.6 * vn * nx; bal.vy -= 1.6 * vn * ny; } } }
    // de keeper: schuift mee met de bal, en duikt als een schot op zijn doel komt
    keeper(dt);
    // goal, naast of over
    if (vorigX <= DOEL.x && bal.x > DOEL.x && !st.reset){
      if (bal.y > DOEL.y1 && bal.y < DOEL.y2 && bal.z < DOEL.lat){ st.goals++; $('vtGoals').textContent = st.goals; melding('GOAL!', '#ffd84a'); T.netKant = 'R'; st.net = 1; }
      else melding(bal.z >= DOEL.lat ? 'Over!' : 'Naast!', '#fff');
      st.reset = st.nu + 1300; st.schot = false;
    }
    if (st.net){ st.net = Math.max(0, st.net - dt * 1.5); T.netBol = st.net; }
    if (!st.reset && (bal.x < -3 || bal.x > 110 || bal.y < -3 || bal.y > 71)) st.reset = st.nu + 600;
    if (st.reset && st.nu > st.reset){ st.reset = null; T.netKant = null; T.netBol = 0; Object.assign(bal, {x:E.x + f.x * 1.2, y:E.y + f.y * 1.2, z:0, vx:0, vy:0, vz:0}); }
  }
  function keeper(dt){
    let doelY = klem(bal.y, DOEL.y1 + .8, DOEL.y2 - .8), duikt = st.keeperDuik;
    // komt er een schot aan? voorspel waar hij de lijn kruist; is het binnen bereik, dan duikt hij (en houdt hem soms)
    if (!duikt && bal.vx > 8 && bal.x > 80 && bal.x < 104){ const tLijn = (104.3 - bal.x) / bal.vx, py = bal.y + bal.vy * tLijn, pz = bal.z + bal.vz * tLijn - 4.9 * tLijn * tLijn;
      if (py > DOEL.y1 - .5 && py < DOEL.y2 + .5){ const bereik = 2.6 - Math.min(1.4, Math.abs(bal.vx) / 30); st.keeperDuik = duikt = {y:py, t:0, houdt:Math.abs(py - K.y) < bereik && pz < 2.3 && Math.random() < .55}; } }
    if (duikt){ duikt.t += dt; doelY = duikt.y; K.z = Math.max(0, Math.sin(Math.PI * Math.min(1, duikt.t / .7)) * .8);
      if (duikt.houdt && Math.abs(bal.x - K.x) < 1 && Math.abs(bal.y - K.y) < 1.4 && bal.z < 2.4){ Object.assign(bal, {vx:-Math.abs(bal.vx) * .25, vy:(Math.random() - .5) * 6, vz:2}); duikt.houdt = false; melding('Redding!', '#b9ff9c'); }
      if (duikt.t > .9){ st.keeperDuik = null; K.z = 0; } }
    const snel = duikt ? 9 : 4; K.y += klem(doelY - K.y, -snel * dt, snel * dt); K.x = 104.3;
  }
  function stand(){
    const v = Math.hypot(st.vx, st.vy), sn = $('vtSnel'); if (sn) sn.textContent = `${(v * 3.6).toFixed(1)} km/u`;
    const tijd = $('vtTijd'); if (!tijd) return;
    if (st.oef){ const rest = Math.max(0, (st.oef.tot - st.nu) / 1000); tijd.textContent = `nog ${rest.toFixed(0)} s`;
      if (rest <= 0){ const n = st.goals, oud = (sp && sp.vrijRecord) || 0; st.oef = null; tijd.textContent = 'klaar!';
        if (sp && n > oud){ sp.vrijRecord = n; melding(`Record: ${n}!`, '#ffd84a'); } else melding(`${n} goals`, '#fff'); } }
  }
  function lus(t){
    if (uit) return;
    if (!document.getElementById('vrijTrainen') || !beeld.isConnected){ stop(); return; }
    const dt = Math.min(.05, (t - laatst) / 1000); laatst = t;
    if (dt > 0){ st.nu += dt * 1000; cam.dt = dt; beweeg(dt);
      if (T.tekst){ T.tekstT = Math.min(1, (T.tekstT || 0) + dt * 2.5); if (st.nu > st.tekstTot) T.tekst = ''; }
      V.teken3D(T, st.nu, kleuren); stand(); }
    raf = requestAnimationFrame(lus);
  }
  function stop(){ uit = true; cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('keydown', neer); window.removeEventListener('keyup', op); window.removeEventListener('blur', weg); }
  raf = requestAnimationFrame(lus);
  // voor de automatische test (net als window.__S)
  window.__vrij = {E, bal, K, st, T, toets, schiet, borst};
  return {stop};
}
