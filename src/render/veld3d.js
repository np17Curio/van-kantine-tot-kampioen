import * as THREE from 'three';
import { laadModel, maakModelSpeler, modelKlaar, tenueVoor, uiterlijkVoor, zetBand, zetTenue } from './spelermodel.js';
import { veer, volgModel } from './beweging.js';

/* ===================== 3D-veld ===================== */
// Tekent dezelfde toestand als het 2D-veld (spelers en bal in meters: x 0-105, y 0-68, z = hoogte), maar dan in 3D.
// Er is één WebGL-renderer met één canvas. Bij elke weergave wordt dat canvas in het nieuwe veld gehangen:
// browsers staan maar een handvol WebGL-contexten toe, dus elke keer een nieuwe maken zou het spel laten vastlopen.
const SCHAAL = 1.45;          // spelers iets groter dan echt, anders zijn ze vanaf de tribune te klein
const BAL_R = .2;
const HUID = 0xe8c39e, BROEK = 0x15161c, SCHOEN = 0x0b0b0b;
let R = null;                  // null = nog niet geprobeerd, false = geen WebGL
const wx = x => x - 52.5, wz = y => 34 - y; // veldmeters naar wereld

export function beschikbaar(){
  if (R === null){ try { R = maak(); } catch (e){ console.warn('3D-veld niet beschikbaar, terug naar 2D', e); R = false; } }
  return !!R;
}

function canvasTex(w, h, teken){
  const c = document.createElement('canvas'); c.width = w; c.height = h; teken(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// Gras met banen en alle lijnen, op één textuur (4 meter uitloop rondom)
function veldTex(max){
  const M = 4, PX = 18, W = (105 + 2 * M) * PX, H = (68 + 2 * M) * PX;
  const t = canvasTex(W, H, (g) => {
    for (let i = -1; i < 15; i++){ g.fillStyle = (i + 20) % 2 ? '#2f7d3f' : '#378c48'; g.fillRect((M + i * 7.5) * PX, 0, 7.5 * PX, H); }
    const p = (x, y) => [(M + x) * PX, (M + 68 - y) * PX];
    g.strokeStyle = 'rgba(255,255,255,.88)'; g.lineWidth = .12 * PX; g.lineCap = 'round';
    const lijn = pts => { g.beginPath(); pts.forEach(([x, y], i) => { const [a, b] = p(x, y); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.stroke(); };
    lijn([[0, 0], [105, 0], [105, 68], [0, 68], [0, 0]]); lijn([[52.5, 0], [52.5, 68]]);
    g.beginPath(); g.arc(...p(52.5, 34), 9.15 * PX, 0, Math.PI * 2); g.stroke();
    for (const [x0, dx] of [[0, 1], [105, -1]]){
      lijn([[x0, 13.84], [x0 + dx * 16.5, 13.84], [x0 + dx * 16.5, 54.16], [x0, 54.16]]);
      lijn([[x0, 24.84], [x0 + dx * 5.5, 24.84], [x0 + dx * 5.5, 43.16], [x0, 43.16]]);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(...p(x0 + dx * 11, 34), .2 * PX, 0, Math.PI * 2); g.fill();
      // halve cirkel buiten het strafschopgebied
      const [cx, cy] = p(x0 + dx * 11, 34), a = Math.acos(5.5 / 9.15);
      g.beginPath(); dx > 0 ? g.arc(cx, cy, 9.15 * PX, -a, a) : g.arc(cx, cy, 9.15 * PX, Math.PI - a, Math.PI + a); g.stroke();
    }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(...p(52.5, 34), .25 * PX, 0, Math.PI * 2); g.fill();
  });
  t.anisotropy = max; return {t, w:105 + 2 * M, h:68 + 2 * M};
}
// Publiek op de tribune: een zee van gekleurde stipjes
function publiekTex(){
  return canvasTex(512, 128, (g, w, h) => {
    g.fillStyle = '#1a2238'; g.fillRect(0, 0, w, h);
    const kl = ['#c6f432', '#e8ecf5', '#38bdf8', '#e05252', '#8c97b0', '#f5c84c', '#2a3654'];
    for (let i = 0; i < 2600; i++){ g.fillStyle = kl[(i * 7 + (i >> 3)) % kl.length]; g.globalAlpha = .35 + ((i * 13) % 10) / 20; g.fillRect((i * 37) % w, (i * 53 % h), 2, 2); }
    g.globalAlpha = 1;
  });
}
function netTex(){
  return canvasTex(128, 128, (g, w, h) => { g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2; for (let i = 0; i <= 8; i++){ g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); } });
}
export function balTex(){
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, w, h); g.fillStyle = '#1b1b1b';
    for (let i = 0; i < 12; i++){ const x = (i % 6) * w / 6 + (i < 6 ? 0 : w / 12), y = i < 6 ? h * .3 : h * .72; g.beginPath(); for (let k = 0; k < 5; k++){ const a = k / 5 * Math.PI * 2; g.lineTo(x + Math.cos(a) * 13, y + Math.sin(a) * 13); } g.fill(); }
  });
}

function maak(){
  const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'low-power'});
  renderer.setClearColor(0x0b1020);
  const cv = renderer.domElement; cv.setAttribute('aria-label', 'Het veld in 3D, gezien vanaf de tribune');
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); R = false; });
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0b1020, 90, 190);
  const camera = new THREE.PerspectiveCamera(25, 2, .5, 400);
  scene.add(new THREE.HemisphereLight(0xe6eeff, 0x2a4a2e, 1.15));
  const zon = new THREE.DirectionalLight(0xffffff, 1.5); zon.position.set(-20, 60, 40); scene.add(zon);
  // omgeving: donker gras rondom, veld, tribunes, lichtmasten
  const rand = new THREE.Mesh(new THREE.PlaneGeometry(260, 200), new THREE.MeshLambertMaterial({color:0x23552f})); rand.rotation.x = -Math.PI / 2; rand.position.y = -.02; scene.add(rand);
  const vt = veldTex(renderer.capabilities.getMaxAnisotropy());
  const veld = new THREE.Mesh(new THREE.PlaneGeometry(vt.w, vt.h), new THREE.MeshLambertMaterial({map:vt.t})); veld.rotation.x = -Math.PI / 2; scene.add(veld);
  const pub = publiekTex(); pub.wrapS = THREE.RepeatWrapping;
  const tribune = (lengte, x, z, ry) => {
    const g = new THREE.Group(), tex = pub.clone(); tex.needsUpdate = true; tex.repeat.set(lengte / 30, 1);
    const vlak = new THREE.Mesh(new THREE.PlaneGeometry(lengte, 16), new THREE.MeshLambertMaterial({map:tex}));
    vlak.rotation.x = -.62; vlak.position.y = 7; g.add(vlak);
    const dak = new THREE.Mesh(new THREE.BoxGeometry(lengte, .6, 9), new THREE.MeshLambertMaterial({color:0x10172a})); dak.position.set(0, 15.5, -4); g.add(dak);
    const reclame = new THREE.Mesh(new THREE.BoxGeometry(lengte, 1, .2), new THREE.MeshBasicMaterial({color:0x172036})); reclame.position.set(0, .5, 6.5); g.add(reclame);
    g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  };
  tribune(150, 0, -50, 0); tribune(100, -66, 0, Math.PI / 2); tribune(100, 66, 0, -Math.PI / 2);
  for (const [x, z] of [[-62, -46], [62, -46], [-62, 46], [62, 46]]){
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(.35, .5, 34, 6), new THREE.MeshLambertMaterial({color:0x2a3654})); mast.position.set(x, 17, z); scene.add(mast);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(5, 2.4, .6), new THREE.MeshBasicMaterial({color:0xfff6d8})); lamp.position.set(x, 34, z); lamp.lookAt(0, 0, 0); scene.add(lamp);
  }
  // doelen met een net dat naar achter bolt bij een goal
  const wit = new THREE.MeshLambertMaterial({color:0xffffff}), netM = new THREE.MeshBasicMaterial({map:netTex(), transparent:true, opacity:.55, side:THREE.DoubleSide, depthWrite:false});
  netM.map.wrapS = netM.map.wrapT = THREE.RepeatWrapping; netM.map.repeat.set(6, 2);
  const doelen = {};
  for (const [kant, x0, dx] of [['L', 0, -1], ['R', 105, 1]]){
    const g = new THREE.Group(), X = wx(x0);
    const paal = (z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 2.44, 8), wit); m.position.set(X, 1.22, z); g.add(m); };
    paal(wz(30.34)); paal(wz(37.66));
    const lat = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 7.32, 8), wit); lat.rotation.x = Math.PI / 2; lat.position.set(X, 2.44, 0); g.add(lat);
    const achter = new THREE.Mesh(new THREE.PlaneGeometry(7.32, 2.44), netM); achter.rotation.y = Math.PI / 2; achter.position.set(X + dx * 1.8, 1.22, 0); g.add(achter);
    const dak = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 7.32), netM); dak.rotation.x = Math.PI / 2; dak.position.set(X + dx * .9, 2.44, 0); g.add(dak);
    for (const z of [wz(30.34), wz(37.66)]){ const zij = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.44), netM); zij.position.set(X + dx * .9, 1.22, z); g.add(zij); }
    scene.add(g); doelen[kant] = {achter, X, dx};
  }
  // bal en schaduwen
  const schaduwM = new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:.32, depthWrite:false});
  const bal = new THREE.Mesh(new THREE.SphereGeometry(BAL_R, 20, 14), new THREE.MeshLambertMaterial({map:balTex()}));
  const balSchaduw = new THREE.Mesh(new THREE.CircleGeometry(BAL_R * 1.2, 16), schaduwM.clone()); balSchaduw.rotation.x = -Math.PI / 2;
  scene.add(bal, balSchaduw);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.95, 1.15, 32), new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.9, depthWrite:false}));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .02; scene.add(ring);
  const kaartM = new THREE.MeshBasicMaterial({color:0xffd400, side:THREE.DoubleSide});
  const kaart = new THREE.Mesh(new THREE.PlaneGeometry(.45, .62), kaartM); kaart.visible = false; scene.add(kaart);
  laadModel().then(() => { if (R) R.modelNieuw = true; }).catch(() => {});
  return {renderer, scene, camera, doelen, bal, balSchaduw, ring, kaart, kaartM, schaduwM, spelers:{}, vorigeBal:null, vorigeNu:0, nr:null, nrSprite:null, camX:null};
}

// Een poppetje: heupen en knieën, schouders en ellebogen kunnen buigen. Kijkt standaard naar +z
function maakSpeler(kleur){
  const shirt = new THREE.MeshLambertMaterial({color:kleur}), huid = new THREE.MeshLambertMaterial({color:HUID}), broek = new THREE.MeshLambertMaterial({color:BROEK}), schoen = new THREE.MeshLambertMaterial({color:SCHOEN});
  const sok = new THREE.MeshLambertMaterial({color:kleur});
  const root = new THREE.Group(), lijf = new THREE.Group(); root.add(lijf);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.19, .34, 4, 10), shirt); torso.scale.z = .68; torso.position.y = 1.27; lijf.add(torso);
  const heup = new THREE.Mesh(new THREE.BoxGeometry(.4, .24, .25), broek); heup.position.y = .96; lijf.add(heup);
  const hoofd = new THREE.Mesh(new THREE.SphereGeometry(.13, 14, 10), huid); hoofd.position.y = 1.72; lijf.add(hoofd);
  const haar = new THREE.Mesh(new THREE.SphereGeometry(.135, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({color:BROEK})); haar.position.y = 1.735; haar.rotation.x = -.25; lijf.add(haar);
  const been = (x) => {
    const dij = new THREE.Group(); dij.position.set(x, .92, 0); lijf.add(dij);
    const bo = new THREE.Mesh(new THREE.CylinderGeometry(.085, .075, .44, 8), huid); bo.position.y = -.22; dij.add(bo);
    const knie = new THREE.Group(); knie.position.y = -.44; dij.add(knie);
    const onder = new THREE.Mesh(new THREE.CylinderGeometry(.075, .06, .42, 8), sok); onder.position.y = -.21; knie.add(onder);
    const voet = new THREE.Mesh(new THREE.BoxGeometry(.11, .07, .26), schoen); voet.position.set(0, -.44, .06); knie.add(voet);
    return {dij, knie};
  };
  const arm = (x) => {
    const sch = new THREE.Group(); sch.position.set(x, 1.47, 0); lijf.add(sch);
    const bo = new THREE.Mesh(new THREE.CylinderGeometry(.06, .055, .3, 8), shirt); bo.position.y = -.15; sch.add(bo);
    const elleboog = new THREE.Group(); elleboog.position.y = -.3; sch.add(elleboog);
    const onder = new THREE.Mesh(new THREE.CylinderGeometry(.05, .045, .28, 8), huid); onder.position.y = -.14; elleboog.add(onder);
    return {sch, elleboog};
  };
  const L = been(-.11), Rb = been(.11), LA = arm(-.27), RA = arm(.27);
  // de aanvoerdersband (alleen bij jou als aanvoerder zichtbaar)
  const bandM = new THREE.Mesh(new THREE.CylinderGeometry(.068, .066, .07, 12, 1, true), new THREE.MeshLambertMaterial({color:'#f3c44f', side:THREE.DoubleSide})); bandM.position.y = -.12; bandM.visible = false; bandM.userData.band = true; LA.sch.add(bandM);
  root.scale.setScalar(SCHAAL);
  return {root, lijf, L, R:Rb, LA, RA, shirt, sok, broekM:broek, bandM, kleur, fase:Math.random() * 6, kijk:0, x:null, y:null, duik:1};
}
function schaduw(){ const m = new THREE.Mesh(new THREE.CircleGeometry(.62 * SCHAAL, 18), R.schaduwM); m.rotation.x = -Math.PI / 2; m.position.y = .015; R.scene.add(m); return m; }
function nummerSprite(nr){
  const tex = canvasTex(128, 64, (g, w, h) => { g.font = '900 52px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,.7)'; g.strokeText(String(nr), w / 2, h / 2 + 2); g.fillStyle = '#fff'; g.fillText(String(nr), w / 2, h / 2 + 2); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, depthTest:false, transparent:true})); s.scale.set(1.3, .65, 1); return s;
}

// Het canvas in het veld hangen (vervangt het lege canvas uit de HTML) en de tekstlagen klaarzetten
export function koppel3D(el, b, h, dpr){
  if (!beschikbaar()) return null;
  const vak = el.querySelector('.pitchvak') || el, oud = vak.querySelector('canvas'), cv = R.renderer.domElement;
  if (oud !== cv){ if (oud) oud.replaceWith(cv); else vak.prepend(cv); }
  for (const k of ['pitchfx', 'pitchonder']) if (!vak.querySelector('.' + k)){ const d = document.createElement('div'); d.className = k; d.setAttribute('aria-hidden', 'true'); cv.after(d); }
  R.dpr = dpr; R.renderer.setPixelRatio(Math.min(dpr, KWALITEIT[R.kwaliteit || 0].dpr)); R.renderer.setSize(b, h);
  R.camera.aspect = b / h; R.camera.updateProjectionMatrix();
  R.sceneNr = (R.sceneNr || 0) + 1; // elke nieuwe scène (de spelers staan dan opnieuw opgesteld)
  R.vak = vak; R.vorigeNu = 0; R.camX = null; R.kijkZ = null; R.vorigeBal = null;
  for (const id in R.spelers) R.spelers[id].x = null;
  cv._3d = true; return cv;
}

// Houdingen uit de animatiescripts (namen staan ook in POSES in pitch.js). f(k, t) geeft doelhoeken:
// d = bovenbeen naar voren, k = knie buigen, a = arm naar voren, u = arm naar buiten, e = elleboog, leun = voorover, rol = opzij, hoogte in meters.
// boven: alleen het bovenlichaam (de benen blijven lopen) · vast: niet meedraaien · duur: na zoveel ms weer normaal
const BENEN = new Set(['dL', 'dR', 'kL', 'kR']);
const POSE = {
  duw:      {duur:650, f:() => ({aL:1.45, aR:1.45, uL:.15, uR:.15, eL:-.1, eR:-.1, leun:.3, dL:.5, kL:.25, dR:-.25, kR:.2})},
  struikel: {f:() => ({leun:-.4, aL:-.5, aR:-.3, uL:1, uR:1.1, eL:-.3, eR:-.3, dL:.55, kL:.5, dR:-.35, kR:.3})},
  val:      {vast:true, f:k => { const p = Math.min(1, k * 2.2); return {leun:-1.45 * p, aL:-.3 * p, aR:-.3 * p, uL:1.3 * p, uR:1.3 * p, eL:-.2, eR:-.2, dL:.35 * p, dR:.15 * p, kL:.2 + .4 * p, kR:.2, hoogte:.16 * p}; }},
  sliding:  {vast:true, f:() => ({leun:-1.15, dR:1.45, kR:.05, dL:.75, kL:1.5, aL:-.7, aR:.3, uL:1, uR:.4, eL:-.1, eR:-.6, hoogte:.14})},
  steek:    {duur:600, f:() => ({dR:1.25, kR:.1, dL:-.15, kL:.45, leun:-.25, uL:.7, uR:.45, aL:.2, aR:-.2})},
  schouder: {boven:true, f:() => ({rol:.4, leun:.15, aL:.25, aR:-.35, uL:.35, uR:.1})},
  trek:     {boven:true, f:() => ({aR:1.35, eR:-.2, uR:.1, leun:.3, aL:.3})},
  borst:    {boven:true, f:() => ({leun:-.28, aL:-.45, aR:-.45, uL:.5, uR:.5, eL:-.5, eR:-.5})},
  kopstoot: {duur:500, boven:true, f:() => ({leun:.6, aL:-.3, aR:-.3, uL:.4, uR:.4})},
  lach:     {boven:true, f:() => ({aL:.25, aR:.25, uL:1.15, uR:1.15, eL:-.7, eR:-.7, leun:-.08})},
  roep:     {boven:true, f:(k, t) => ({aR:1.5 + Math.sin(t * 9) * .15, eR:-.1, uR:.15, aL:.3, uL:.45, eL:-.6, leun:.12})},
  kalm:     {boven:true, f:() => ({aL:.05, aR:.05, uL:.12, uR:.12, eL:-.15, eR:-.15})},
  wijs:     {boven:true, f:(k, t) => ({aR:1.75 + Math.sin(t * 6) * .12, eR:0, uR:.1, uL:.65, eL:-1.5, aL:.1})},
  protest:  {boven:true, f:(k, t) => ({aL:.45 + Math.sin(t * 8) * .25, aR:.45 + Math.sin(t * 8 + 1) * .25, uL:1.35, uR:1.35, eL:-.9, eR:-.9, leun:.05})},
  wuif:     {boven:true, f:(k, t) => ({aR:1 + Math.sin(t * 7) * .45, uR:.8, eR:-.4, aL:0, uL:.15})},
  kaart:    {boven:true, f:() => ({uR:2.95, eR:0, aR:0, uL:.2})},
  sorry:    {boven:true, vast:true, f:() => ({aL:.85, aR:.85, uL:.9, uR:.9, eL:-1.25, eR:-1.25, leun:-.05})},
  kniel:    {vast:true, f:() => ({dL:0, dR:0, kL:1.55, kR:1.55, leun:-.5, uL:2.6, uR:2.6, aL:0, aR:0, eL:-.2, eR:-.2, hoogte:-.68})},
  ssst:     {boven:true, vast:true, f:() => ({aR:2.05, eR:-2.25, uR:.3, aL:.1, uL:.5, eL:-.4, leun:.06})},
  juich:    {boven:true, f:(k, t) => ({uL:2.6, uR:2.6, aL:.1, aR:.1, eL:-.3, eR:-.3, hoogte:Math.abs(Math.sin(t * 6)) * .2})},
  klap:     {boven:true, f:(k, t) => { const c = Math.sin(t * 13); return {aL:1.15, aR:1.15, uL:.35 + c * .28, uR:.35 + c * .28, eL:-.55, eR:-.55}; }},
  praat:    {boven:true, f:(k, t) => ({aR:.9 + Math.sin(t * 3) * .35, aL:.6 + Math.sin(t * 3 + 1.3) * .3, eL:-1, eR:-1, uL:.3, uR:.3})},
  vang:     {boven:true, f:() => ({aL:2.5, aR:2.5, uL:.3, uR:.3, eL:-.25, eR:-.25})},
  blok:     {f:() => ({uL:1.2, uR:1.2, aL:.35, aR:.35, eL:-.4, eR:-.4, leun:.12, dL:.35, kL:.3, dR:-.3, kR:.3})},
  omhaal:   {vast:true, f:() => ({leun:-2.45, dR:1.9, kR:.1, dL:.5, kL:1.3, uL:1.45, uR:1.45, aL:0, aR:0})},
  volley:   {duur:700, f:() => ({rol:-.45, dR:1.2, kR:.2, dL:-.1, kL:.3, uL:1.1, uR:.6, leun:-.15})},
  spreid:   {vast:true, f:() => ({kL:.7, kR:.7, dL:.35, dR:.35, uL:.9, uR:.9, aL:.4, aR:.4, leun:.25, hoogte:-.12})},
  jockey:   {boven:true, f:() => ({leun:.25, uL:.5, uR:.5, aL:.2, aR:.2, eL:-.6, eR:-.6})},
};
export const POSE_NAMEN = Object.keys(POSE);
// ---------- echte spelersmodellen ----------
// Wie is dit (voor een vast uiterlijk): jij, of een speler van een club. Het hulpskelet (de eenvoudige pop) blijft de bewegingen bepalen, onzichtbaar
function sleutelVan(e, T){
  const p = T.ploegen || {};
  if (e.id === 'J' && (e.rol === 'wij' || !e.rol)) return 'jij|' + (p.jij || 'x') + (p.jijUit ? '|' + p.jijUit.huid + p.jijUit.haar + p.jijUit.kapsel + (p.jijUit.lengte || '') + (p.jijUit.bmi || '') + '|' + (p.jijUit.schoen ?? '') : '') + (p.band ? '|C' : '');
  if (e.rol === 'R') return 'scheids|' + (p.zij ?? '');
  const club = e.rol === 'wij' || e.rol === 'k' ? p.wij : p.zij;
  return 'c' + club + '|' + e.id;
}
function kleedAan(s, e, T){
  const sleutel = sleutelVan(e, T), tenue = tenueVoor(e.rol, (T.ploegen || {}).tenues);
  if (s.model && s.modelSleutel === sleutel){ zetTenue(s.model, tenue); return; }
  if (s.modelHouder) s.lijf.remove(s.modelHouder);
  const jij = sleutel.startsWith('jij|'), m = maakModelSpeler(uiterlijkVoor(jij ? 'jij|' + ((T.ploegen || {}).jij || 'x') : sleutel, jij ? (T.ploegen || {}).jijUit : null), tenue); if (!m) return;
  if (jij && (T.ploegen || {}).band) zetBand(m); // aanvoerder: de band om je arm
  const houder = new THREE.Group(); houder.scale.setScalar(1.86); houder.add(m.obj); s.lijf.add(houder);
  s.model = m; s.modelHouder = houder; s.modelSleutel = sleutel;
  if (m.botten.head && m.botten.neck_01) m.hoofdRust = m.botten.neck_01.userData.rust.clone().multiply(m.botten.head.userData.rust);
  s.procMeshes = []; s.lijf.traverse(o => { if (o.isMesh && !m.meshes.includes(o) && !o.userData.band){ o.visible = false; s.procMeshes.push(o); } }); s.ver = false;
}
// Verder dan zoveel meter van de camera: de eenvoudige pop (scheelt veel rekenwerk; van die afstand zie je het verschil niet)
// (gemeten vanaf het punt waar de camera op richt: alles wat in beeld is, is het echte model)
const VER_EXTRA = 30;
// ---------- automatische kwaliteit ----------
// Haalt het veld geen vloeiend beeld (bijvoorbeeld een computer zonder grafische kaart), dan stap voor stap lichter:
// eerst minder pixels, daarna de eenvoudige spelers. Een snelle computer blijft op de hoogste stand.
const KWALITEIT = [{dpr:2}, {dpr:1}, {dpr:.75}, {dpr:.75, eenvoudig:true}];
const TRAAG = 1 / 18, MEETTIJD = 3;
function meetSnelheid(dt){
  if (!(dt > 0 && dt < .25)) return;                      // pauzes, losse haperingen en het eerste beeld tellen niet mee
  R.ft = R.ft ? R.ft * .92 + dt * .08 : dt; R.tMeting = (R.tMeting || 0) + dt;
  if (R.tMeting < MEETTIJD || R.ft < TRAAG || (R.kwaliteit || 0) >= KWALITEIT.length - 1) return;
  R.kwaliteit = (R.kwaliteit || 0) + 1; R.tMeting = 0; R.ft = 0;
  const k = KWALITEIT[R.kwaliteit], maat = R.renderer.getSize(new THREE.Vector2());
  R.renderer.setPixelRatio(Math.min(R.dpr || 1, k.dpr)); R.renderer.setSize(maat.x, maat.y);
  if (k.eenvoudig){ R.modelNieuw = true; R.melding = performance.now(); } // spelers opnieuw opbouwen, nu zonder model (en dat even melden)
}
// Een foto (voor de krant) met dezelfde renderer, maar in een eigen buffer: het canvas van het veld blijft ongemoeid
// en er komt geen tweede WebGL-context bij. Geeft een 2D-canvas terug (of null zonder WebGL).
export const renderer3D = () => beschikbaar() ? R.renderer : null;
export function fotoRender(scene, camera, w, h){
  if (!beschikbaar()) return null;
  const r = R.renderer, rt = new THREE.WebGLRenderTarget(w, h, {samples:4});
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const oud = r.getRenderTarget();
  try {
    r.setRenderTarget(rt); r.clear(); r.render(scene, camera);
    const px = new Uint8Array(w * h * 4); r.readRenderTargetPixels(rt, 0, 0, w, h, px);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'), img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) img.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4); // WebGL leest van onder naar boven
    g.putImageData(img, 0, 0);
    return c;
  } finally { r.setRenderTarget(oud); rt.dispose(); }
}
export const kwaliteit = () => R ? (R.kwaliteit || 0) : 0;
// Handig bij debuggen en voor de automatische speltest (net als window.__S): hoeveel spelers in beeld zijn het echte model
if (typeof window !== 'undefined') window.__veld3d = () => { if (!R) return null; let model = 0, pop = 0;
  for (const id in R.spelers){ const sp = R.spelers[id]; if (!sp.root.visible) continue; if (sp.model && !sp.ver && sp.modelHouder.visible) model++; else pop++; }
  // per speler: hoe ver het hoofd gedraaid staat ten opzichte van de borst, vergeleken met de ruststand (radialen)
  const hoofden = {};
  for (const id in R.spelers){ const sp = R.spelers[id], m = sp.model; if (!m || sp.ver || !sp.root.visible || !m.botten.head || !m.botten.spine_03) continue;
    // nek x hoofd (lokaal): de draaiing van het hoofd ten opzichte van de borst, zonder last van de schaal van de speler
    const rel = m.botten.neck_01.quaternion.clone().multiply(m.botten.head.quaternion);
    if (!m.hoofdRust) continue; const d = m.hoofdRust.clone().invert().multiply(rel); hoofden[id] = {hoek:2 * Math.acos(Math.min(1, Math.abs(d.w))), q:[d.x, d.y, d.z, d.w], kijkY:m.kijkY, kijkX:m.kijkX, wIdle:m.wIdle, pose:sp.pose || null}; }
  return {model, pop, kwaliteit:R.kwaliteit || 0, modus:R.modus, scene:R.sceneNr || 0, hoofden, jij:R.spelers.J ? R.spelers.J.modelSleutel : null}; };
const hoekVerschil = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
export function teken3D(T, nu, kleuren){
  if (!R) return;
  const echtDt = R.vorigeNu ? (nu - R.vorigeNu) / 1000 : 0;
  const dt = Math.min(.1, Math.max(0, echtDt)); R.vorigeNu = nu;
  // Spelers: 'echt' = altijd het model, 'simpel' = altijd de eenvoudige pop, 'auto' = zelf terugschakelen als het beeld te traag is
  const modus = T.spelers || 'auto';
  if (modus !== R.modus){
    if (R.modus !== undefined) R.modelNieuw = true;
    if (modus === 'echt' && R.kwaliteit){ R.kwaliteit = 0; const maat = R.renderer.getSize(new THREE.Vector2()); R.renderer.setPixelRatio(Math.min(R.dpr || 1, KWALITEIT[0].dpr)); R.renderer.setSize(maat.x, maat.y); }
    R.modus = modus; R.tMeting = 0; R.ft = 0;
  }
  if (modus === 'auto') meetSnelheid(echtDt);
  const simpel = modus === 'simpel' || (modus === 'auto' && KWALITEIT[R.kwaliteit || 0].eenvoudig);
  if (R.modelNieuw){ R.modelNieuw = false; for (const id in R.spelers){ const sp = R.spelers[id]; R.scene.remove(sp.root, sp.schaduw); } R.spelers = {}; }
  const tijd = nu / 1000, bal = T.bal, gezien = new Set();
  const juichWij = T.tekst === 'GOAL!' || /^Raak/.test(T.tekst || ''), juichZij = T.tekst === 'Tegengoal';
  for (const e of Object.values(T.ents)){
    const kl = kleuren[e.rol] || '#cccccc';
    let s = R.spelers[e.id];
    if (!s){ s = R.spelers[e.id] = maakSpeler(kl); s.schaduw = schaduw(); R.scene.add(s.root); }
    if (s.kleur !== kl){ s.shirt.color.set(kl); s.sok.color.set(kl); s.kleur = kl; }
    { const tn = (T.ploegen || {}).tenues, br = tn && tn[e.rol] ? tn[e.rol].broek : null; if (br && s.broekKl !== br){ s.broekM.color.set(br); s.broekKl = br; } }
    if (modelKlaar() && !simpel) kleedAan(s, e, T);
    // de band op de eenvoudige pop: alleen bij jou als aanvoerder, en alleen als het echte model niet zichtbaar is
    s.bandM.visible = e.id === 'J' && (e.rol === 'wij' || !e.rol) && !!(T.ploegen || {}).band && (simpel || !s.model || !s.modelHouder.visible);
    s.root.visible = s.schaduw.visible = true; gezien.add(e.id);
    const keeper = e.rol === 'K' || e.rol === 'k', z = e.z || 0;
    const nieuw = s.x === null, vx = nieuw || !dt ? 0 : (e.x - s.x) / dt, vy = nieuw || !dt ? 0 : (e.y - s.y) / dt;
    s.x = e.x; s.y = e.y;
    const v = Math.hypot(vx, vy);
    // houding uit het script: duurt hij maar even (duw, tackle), dan valt hij na 'duur' ms vanzelf weg
    const P0 = e.pose && POSE[e.pose] ? POSE[e.pose] : null;
    const actief = P0 && !(P0.duur && nu - (e.poseT0 || 0) > P0.duur) ? e.pose : null;
    if (actief !== s.pose){ if (s.pose) { s.uit = s.pose; s.uitT0 = nu; s.uitK = (nu - s.poseStart) / 1000; } s.pose = actief; s.poseStart = e.poseT0 && actief ? Math.min(nu, e.poseT0) : nu; }
    const vast = actief && POSE[actief].vast;
    // kijkrichting: waar hij heen loopt, anders naar de bal (in wereldassen: x = x, z = -y)
    // keepers blijven het veld in kijken, ook als ze opzij duiken; bij sommige houdingen draait hij niet
    const naarBal = Math.atan2(bal.x - e.x, -(bal.y - e.y));
    const doel = keeper ? (e.rol === 'K' ? -Math.PI / 2 : Math.PI / 2) : actief === 'jockey' ? naarBal : v > .6 ? Math.atan2(vx, -vy) : naarBal;
    if (nieuw) s.kijk = doel;
    if (!vast) s.kijk += hoekVerschil(s.kijk, doel) * Math.min(1, dt * (v > .6 ? 10 : 4));
    s.root.rotation.y = s.kijk;
    const sprint = vast ? 0 : Math.min(1, v / 7);
    // looppas op afgelegde afstand (anders glijden de voeten): een hele cyclus is twee passen
    const st = s.model ? s.model.stijl : null, sp = st ? st.pas : 1, sa = st ? st.arm : 1;
    s.fase += v > .2 ? Math.PI * v * dt / (.75 + .055 * v) : 0;
    const sw = Math.sin(s.fase), cw = Math.cos(s.fase);
    // basishouding: lopen of stilstaan (ademen). u = arm naar buiten, a = arm naar voren, d = bovenbeen naar voren, k = knie
    // knie buigt veel in de zwaaifase en weinig in de standfase; ellebogen meer gebogen naarmate hij harder loopt
    // versnellen: extra voorover, afremmen: even achterover; in een bocht naar binnen leunen
    const acc = nieuw || !dt ? 0 : (v - (s.vVorig ?? v)) / dt, draai = nieuw || !dt ? 0 : hoekVerschil(s.kijkVorig ?? s.kijk, s.kijk) / dt; s.vVorig = v; s.kijkVorig = s.kijk;
    s.acc = (s.acc || 0) + (acc - (s.acc || 0)) * Math.min(1, dt * 8);
    const h = {dL:sw * 1.05 * sprint * sp, dR:-sw * 1.05 * sprint * sp, kL:(Math.max(0, -cw) * 1.6 + Math.max(0, sw) * .25) * sprint * sp + .08, kR:(Math.max(0, cw) * 1.6 + Math.max(0, -sw) * .25) * sprint * sp + .08,
      aL:-sw * 1.2 * sprint * sa, aR:sw * 1.2 * sprint * sa, uL:.14 + .1 * sprint, uR:.14 + .1 * sprint, eL:-.3 - 1.25 * sprint, eR:-.3 - 1.25 * sprint,
      leun:sprint * (s.model ? .12 : .2) + Math.max(-.25, Math.min(.3, s.acc * .03)), rol:Math.max(-.3, Math.min(.3, -draai * v * .015)), hoogte:0};
    if (!sprint){ const adem = Math.sin(tijd * 2.2 + s.fase) * .03; h.aL = adem; h.aR = -adem; }
    // trappen: schieten of passen (zwaai naar achter, dan door de bal); een hakje gaat juist naar achter
    if (T.trap && T.trap.id === e.id){
      const k = (nu - T.trap.t0) / T.trap.dur, soort = T.trap.soort;
      if (k >= 0 && k <= 1){
        if (soort === 'hak'){ const z2 = k < .4 ? (k / .4) * .4 : .4 - ((k - .4) / .6) * 1.6; h.dR = z2; h.kR = k < .4 ? .3 : 1.5 * Math.sin(Math.min(1, (k - .4) / .4) * Math.PI / 2); h.leun = .2; }
        else {
          // aanzet tot het contact (kc), dan door de bal en hoog uitzwaaien, daarna terug
          const kracht = soort === 'chip' ? .6 : soort === 'binnenkant' ? .8 : T.trap.hard ? 1.4 : 1, kc = T.trap.kc || .4;
          const zwaai = k < kc ? (k / kc) * 1.05 * kracht : k < kc + .3 ? 1.05 * kracht - ((k - kc) / .3) * 2.7 * kracht : -1.65 * kracht * (1 - (k - kc - .3) / (.7 - kc));
          h.dR = -zwaai; h.kR = k < kc ? 1.5 * (k / kc) : k < kc + .12 ? 1.5 * (1 - (k - kc) / .12) : .15;
          h.leun = k < kc ? -.14 * kracht : k < kc + .3 ? .06 : -.12 * kracht; if (soort === 'binnenkant' || soort === 'volley') h.rol = soort === 'volley' ? -.45 : -.18;
        }
        // standbeen licht gebogen, armen wijd voor evenwicht: de arm aan de kant van het schopbeen naar achter, de andere naar voren
        const kc2 = T.trap.kc || .4, mee = Math.min(1, k / kc2);
        h.dL = -.15; h.kL = .25 + .3 * Math.sin(Math.min(1, k / (kc2 + .15)) * Math.PI); h.uL = .55 + .55 * mee; h.uR = .45 + .65 * mee; h.aL = .2 + .6 * mee; h.aR = -.2 - .7 * mee; h.eL = h.eR = -.5;
      }
    }
    if (keeper && z > .25){
      // keeper duikt opzij, armen gestrekt; de zijwaartse snelheid bepaalt naar welke kant hij valt
      const zij = vx * Math.cos(s.kijk) + vy * Math.sin(s.kijk);
      if (Math.abs(zij) > .3) s.duik = Math.sign(zij);
      Object.assign(h, {rol:-s.duik * Math.min(1.35, z * 2.8), hoogte:z * .9, uL:2.6, uR:2.6, aL:0, aR:0, eL:0, eR:0, dL:.3, dR:-.2, kL:.3, kR:.3, leun:0});
    } else if (!keeper && z > .25 && actief !== 'omhaal'){
      // springen voor een kopbal
      Object.assign(h, {hoogte:z * 1.1, dL:-.55, dR:-.55, kL:1.2, kR:1.2, uL:1.2, uR:1.2, aL:-.2, aR:-.2, leun:-.15});
    } else if (z > .25) h.hoogte = z * 1.1;
    // houding van het script eroverheen, met een zachte overgang erin en eruit
    const leg = (naam, w, k) => { const p = POSE[naam], d = p.f(k, tijd); for (const key in d){ if (p.boven && BENEN.has(key)) continue; h[key] += (d[key] - h[key]) * w; } };
    if (s.uit && nu - s.uitT0 < 220) leg(s.uit, 1 - (nu - s.uitT0) / 220, s.uitK);
    if (actief) leg(actief, Math.min(1, (nu - s.poseStart) / 180), (nu - s.poseStart) / 1000);
    if (!actief && ((juichWij && e.rol === 'wij') || (juichZij && e.rol === 'zij')) && z < .2 && !keeper) leg('juich', 1, 0);
    // veren: elk gewricht volgt zijn doel met een beetje vertraging en uitzwaai (een nieuw opgestelde speler begint direct goed)
    if (nieuw) s.veer = null;
    const g = veer(s, h, dt, st ? st.veer : 1);
    s.L.dij.rotation.x = -g.dL; s.R.dij.rotation.x = -g.dR; s.L.knie.rotation.x = g.kL; s.R.knie.rotation.x = g.kR;
    s.LA.sch.rotation.x = -g.aL; s.RA.sch.rotation.x = -g.aR; s.LA.sch.rotation.z = -g.uL; s.RA.sch.rotation.z = g.uR; s.LA.elleboog.rotation.x = g.eL; s.RA.elleboog.rotation.x = g.eR;
    s.lijf.rotation.x = g.leun; s.lijf.rotation.z = g.rol;
    const hoogte = g.hoogte;
    s.lijf.position.y = hoogte / SCHAAL + (sprint ? Math.abs(Math.cos(s.fase)) * .08 * sprint : 0); // twee keer per pas op en neer
    s.root.position.set(wx(e.x), 0, wz(e.y));
    if (s.model){
      // met een marge van 3 m, anders wisselt een speler die precies op de grens staat steeds tussen model en pop
      const afst = R.camera.position.distanceTo(s.root.position), grens = R.camAfstand + VER_EXTRA, ver = s.ver ? afst > grens - 3 : afst > grens + 3;
      if (ver !== s.ver){ s.ver = ver; s.modelHouder.visible = !ver; for (const o of s.procMeshes) o.visible = ver;
        // weer dichtbij: het hoofd begint meteen goed (anders draait het vanuit een oude stand), en de rustanimatie ook
        if (!ver){ s.model.kijkY = s.model.kijkX = undefined; s.model.wIdle = undefined; s.verT = nu; } }
      if (!ver){ const tk = T.trap && T.trap.id === e.id && nu >= T.trap.t0 && nu <= T.trap.t0 + T.trap.dur ? {k:(nu - T.trap.t0) / T.trap.dur, kc:T.trap.kc || .4, kracht:T.trap.soort === 'chip' ? .6 : T.trap.soort === 'binnenkant' ? .8 : T.trap.hard ? 1.4 : 1, soort:T.trap.soort} : null;
        volgModel(s, {dt, v, sprint, fase:s.fase, h:g, actief, trap:tk, keeper, z, naarBal, kijk:s.kijk, balHoogte:bal.z || 0, balAfstand:Math.hypot(bal.x - e.x, bal.y - e.y)}); }
    }
    s.schaduw.position.set(wx(e.x), .015, wz(e.y)); s.schaduw.scale.setScalar(1 - Math.min(.5, hoogte * .3));
    if (e.id === 'J'){ R.ring.visible = true; R.ring.position.set(wx(e.x), .02, wz(e.y));
      if (T.nr && R.nr !== T.nr){ if (R.nrSprite){ R.scene.remove(R.nrSprite); R.nrSprite.material.map.dispose(); R.nrSprite.material.dispose(); } R.nrSprite = nummerSprite(T.nr); R.scene.add(R.nrSprite); R.nr = T.nr; }
      if (R.nrSprite){ R.nrSprite.visible = !!T.nr; R.nrSprite.position.set(wx(e.x), 2.95 * SCHAAL + hoogte, wz(e.y)); } }
  }
  for (const id in R.spelers) if (!gezien.has(id)){ R.spelers[id].root.visible = false; R.spelers[id].schaduw.visible = false; }
  if (!gezien.has('J')){ R.ring.visible = false; if (R.nrSprite) R.nrSprite.visible = false; }
  // kaart: de scheidsrechter (of anders de speler) houdt hem omhoog
  if (T.kaart){ const wie = T.ents.R || T.ents[T.kaartOp || 'J']; if (wie){ R.kaart.visible = true; R.kaartM.color.set(T.kaart === 'rood' ? 0xe23b3b : 0xffd400); R.kaart.position.set(wx(wie.x) + .5, 2.75 * SCHAAL, wz(wie.y)); R.kaart.lookAt(R.camera.position); } } else R.kaart.visible = false;
  // bal: rolt mee met de beweging
  const bx = wx(bal.x), bz = wz(bal.y), by = BAL_R + (bal.z || 0);
  if (R.vorigeBal){ const dx = bx - R.vorigeBal.x, dz = bz - R.vorigeBal.z, d = Math.hypot(dx, dz);
    if (d > 1e-4 && d < 20){ const as = new THREE.Vector3(dz, 0, -dx).normalize(); R.bal.rotateOnWorldAxis(as, d / BAL_R); } }
  R.vorigeBal = {x:bx, z:bz};
  R.bal.position.set(bx, by, bz);
  R.balSchaduw.position.set(bx, .016, bz); R.balSchaduw.material.opacity = .32 * Math.max(.25, 1 - (bal.z || 0) / 4);
  // net bolt na een doelpunt
  for (const k of ['L', 'R']){ const d = R.doelen[k], b = k === T.netKant ? (T.netBol || 0) : 0; d.achter.position.x = d.X + d.dx * (1.8 + b * 1.1); }
  // camera: schuin vanaf de tribune, volgt de bal rustig
  // ingezoomd zoals een tv-camera; bij een doel schuift het beeld iets op zodat het doel in beeld blijft
  // Ver weg (normaal): volgt de bal en schuift bij een doel iets op, zodat het doel in beeld blijft.
  // Dichtbij (duels, tackles, juichen, toespraak): volgt jou, ook in de diepte
  const zoom = T.zoom || 1, J = zoom < 1 && T.ents.J;
  const cam = T.cam ?? 52.5, doelX = J ? wx(J.x) : wx(cam) + (cam > 70 ? (cam - 70) * .25 : cam < 35 ? -(35 - cam) * .25 : 0);
  // T.cam is in pitch.js al afgevlakt; hier alleen nog een klein beetje, en een stukje vooruit kijken naar waar de bal heen gaat
  const vooruit = J || R.vorigeBalX === undefined || !dt ? 0 : Math.max(-6, Math.min(6, (bx - R.vorigeBalX) / dt * .25)); R.vorigeBalX = bx;
  R.camX = R.camX === null ? doelX : R.camX + (doelX + vooruit - R.camX) * Math.min(1, dt * (J ? 3 : 7));
  const kijkDoel = J ? wz(J.y) : 2;
  R.kijkZ = R.kijkZ === undefined || R.kijkZ === null || !dt ? kijkDoel : R.kijkZ + (kijkDoel - R.kijkZ) * Math.min(1, dt * 3);
  R.zoom = R.zoom === undefined || !dt ? zoom : R.zoom + (zoom - R.zoom) * Math.min(1, dt * 3);
  R.camera.position.set(R.camX, 14 * R.zoom, R.kijkZ + 40 * R.zoom); R.camera.lookAt(R.camX, 0, R.kijkZ);
  R.camAfstand = Math.hypot(14, 40) * R.zoom;
  // teksten als HTML-laag: scherp en in de stijl van het spel
  if (R.vak){
    const fx = R.vak.querySelector('.pitchfx'), on = R.vak.querySelector('.pitchonder');
    if (fx){ const t = T.tekst || ''; if (fx.textContent !== t){ fx.textContent = t; fx.classList.toggle('lang', t.length > 12); } fx.style.color = T.tekstKleur || '#fff'; fx.style.opacity = t ? Math.min(1, (T.tekstT ?? 1) * 2) : 0; fx.style.transform = `translate(-50%,-50%) scale(${.85 + Math.min(1, (T.tekstT ?? 1)) * .15})`; }
    if (on){ const t = T.onder || ''; if (on.textContent !== t) on.textContent = t; on.style.display = t ? '' : 'none'; }
    let ml = R.vak.querySelector('.pitchmelding'); const toon = R.melding && modus === 'auto' && performance.now() - R.melding < 9000;
    if (toon && !ml){ ml = document.createElement('div'); ml.className = 'pitchmelding'; ml.textContent = 'Spelers vereenvoudigd voor een vloeiend beeld · kies Spelers: Echt om de 3D-spelers te houden'; R.vak.appendChild(ml); }
    if (ml && !toon) ml.remove();
  }
  R.renderer.render(R.scene, R.camera);
}
