import * as THREE from 'three';

/* ===================== Cutscenes: wat elke scène deelt ===================== */
// Een laag over het hele spel (filmbalken, Overslaan, voortgang), een tijdelijke eigen WebGL-renderer en de afspeellus.
// Het canvas van het veld hangt in de pagina eronder en blijft daar; de eigen renderer wordt na afloop helemaal
// opgeruimd (ook de WebGL-context), zodat er niets blijft openstaan.

// De laag. tag = het labeltje linksboven; label = voor schermlezers. Scène-eigen HTML gaat in laag.ui
// interactief: alleen Esc sluit (Enter en Spatie zijn dan voor de knoppen in de scène); andere toetsen gaan naar laag.opToets(e)
export function maakLaag({tag = '', label = 'Animatie', interactief = false} = {}){
  const el = document.createElement('div'); el.className = 'cutscene'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', label);
  el.innerHTML = `<div class="cs-vak"></div><div class="cs-flits"></div>
    <div class="cs-top">${tag ? `<span class="cs-tag">${tag}</span>` : '<span></span>'}<button class="cs-skip" type="button">Overslaan <kbd>Esc</kbd></button></div>
    <div class="cs-ui"></div><div class="cs-balk"><i></i></div><div class="cs-laden">Laden…</div>`;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('aan'));
  const $ = s => el.querySelector(s);
  let klaar = null;
  const L = {
    el, $, vak:$('.cs-vak'), ui:$('.cs-ui'), weg:false, opToets:null,
    opKlaar(f){ klaar = f; if (L.weg) f(); },
    geladen(){ const l = $('.cs-laden'); if (l) l.remove(); },
    sluit(){ if (L.weg) return; L.weg = true; removeEventListener('keydown', toets, true); el.classList.remove('aan'); el.classList.add('uit'); setTimeout(() => el.remove(), 450); if (klaar) klaar(); },
    flits(){ const f = $('.cs-flits'); f.classList.remove('aan'); void f.offsetWidth; f.classList.add('aan'); },
    tijd(p){ $('.cs-balk i').style.width = (Math.min(1, p) * 100).toFixed(1) + '%'; },
  };
  // zolang de scène loopt gaan toetsen niet naar het spel eronder (Enter zou anders de hoofdknop indrukken)
  const toets = e => { e.stopImmediatePropagation();
    if (e.key === 'Escape' || (!interactief && [' ', 'Enter'].includes(e.key))){ e.preventDefault(); L.sluit(); return; }
    if (interactief && L.opToets) L.opToets(e); };
  addEventListener('keydown', toets, true);
  $('.cs-skip').addEventListener('click', () => L.sluit());
  return L;
}

// Een eigen renderer in de laag. Geeft {renderer, camera, opruim(), reg(x)}; reg onthoudt iets om op te ruimen (dispose)
export function maakRenderer(laag, {fov = 40, ver = 60, pixels = 2} = {}){
  const lijst = [], reg = x => { lijst.push(x); return x; };
  const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, pixels));
  laag.vak.prepend(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(fov, 16 / 9, .05, ver);
  // smalle schermen (telefoon rechtop): camera.userData.zoom < 1, de scène zet de camera dan iets verder weg
  const maat = () => { const b = laag.vak.clientWidth || innerWidth, h = laag.vak.clientHeight || innerHeight; renderer.setSize(b, h, false); camera.aspect = b / h;
    camera.userData.zoom = Math.min(1, camera.aspect / (16 / 9)); camera.updateProjectionMatrix(); };
  maat(); const ro = new ResizeObserver(maat); ro.observe(laag.vak);
  return {renderer, camera, reg, opruim(){
    ro.disconnect();
    for (const x of lijst) try { x.dispose(); } catch (e){}
    renderer.dispose(); try { renderer.forceContextLoss(); } catch (e){} renderer.domElement.remove();
  }};
}

// Om te testen: ?cutsceneT=15 begint op 15 s, &cutscenePauze blijft daar staan
export function testTijd(){
  const z = new URLSearchParams(location.search);
  return {start:Number(z.get('cutsceneT') || z.get('contractT')) || 0, pauze:z.has('cutscenePauze') || z.has('contractPauze')};
}

// De afspeellus: stap(t, dt) per beeld, tot duur (+ een korte uitloop) of tot de laag dicht is. Geeft een Promise
export function speelLus(laag, duur, stap, {uitloop = .6} = {}){
  const {start, pauze} = testTijd();
  let t = Math.min(start, duur - .05), vorige = performance.now(), frame = 0;
  return new Promise(klaar => {
    laag.opKlaar(() => { cancelAnimationFrame(frame); klaar(); });
    const lus = (nu) => {
      if (laag.weg) return;
      // (het tijdstempel van requestAnimationFrame kan net vóór performance.now() liggen: nooit terug in de tijd)
      const dt = pauze ? 0 : Math.max(0, Math.min(.1, (nu - vorige) / 1000)); vorige = nu; t += dt;
      if (t >= duur + uitloop){ laag.sluit(); return; }
      const tt = Math.min(t, duur);
      stap(tt, dt);
      laag.tijd(tt / duur);
      frame = requestAnimationFrame(lus);
    };
    stap(t, 0);
    frame = requestAnimationFrame(lus);
  });
}

// Een lus zonder vaste duur (voor scènes waarin je iets kiest): stap(t, dt) per beeld, tot de laag dicht is. Geeft een Promise
export function draaiLus(laag, stap){
  let t = testTijd().start, vorige = performance.now(), frame = 0;
  return new Promise(klaar => {
    laag.opKlaar(() => { cancelAnimationFrame(frame); klaar(); });
    const lus = (nu) => {
      if (laag.weg) return;
      const dt = Math.max(0, Math.min(.1, (nu - vorige) / 1000)); vorige = nu; t += dt;
      stap(t, dt);
      if (!laag.weg) frame = requestAnimationFrame(lus);
    };
    stap(0, 0);
    frame = requestAnimationFrame(lus);
  });
}

export const GLAD = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const laadPlaatje = src => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
export function canvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
export function tex(c, reg){ const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return reg ? reg(t) : t; }
export const licht = hex => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114) > 150; };
