import * as THREE from 'three';
import { hashGetal, jijLeeftijd, jijTattoo, tenueVoor, uiterlijkVoor } from './pixel/uiterlijk.js';
import { anker, FIGUUR_PX, frame, frameOp, lookVan } from './pixel/atlas.js';
import { BAL_VOOR } from './pixel/animaties.js';
import { BAL as BAL_PX, inkleuren } from './pixel/rig.js';

/* ===================== 3D-veld ===================== */
// Tekent dezelfde toestand als het 2D-veld (spelers en bal in meters: x 0-105, y 0-68, z = hoogte), maar dan in 3D.
// Er is één WebGL-renderer met één canvas. Bij elke weergave wordt dat canvas in het nieuwe veld gehangen:
// browsers staan maar een handvol WebGL-contexten toe, dus elke keer een nieuwe maken zou het spel laten vastlopen.
const SCHAAL = 1.45;          // spelers iets groter dan echt, anders zijn ze vanaf de tribune te klein
const BAL_R = .2, BAL_S = .62; // (de bal is een pixelsprite van BAL_S meter, iets groter dan echt: anders zie je hem niet)
let R = null;                  // null = nog niet geprobeerd, false = geen WebGL
const wx = x => x - 52.5, wz = y => 34 - y; // veldmeters naar wereld

export function beschikbaar(){
  if (R === null){ try { R = maak(); } catch (e){ console.warn('3D-veld niet beschikbaar, terug naar 2D', e); R = false; } }
  return !!R;
}

export function canvasTex(w, h, teken){
  const c = document.createElement('canvas'); c.width = w; c.height = h; teken(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// Gras met banen en alle lijnen, op één textuur (4 meter uitloop rondom)
export function veldTex(max){
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
export function publiekTex(){
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
  // de bal: dezelfde pixelvoetbal als in de animaties (rig.js BAL); hij draait mee als hij rolt
  const balTex = new THREE.CanvasTexture(inkleuren(BAL_PX.outline(107), {}));
  balTex.colorSpace = THREE.SRGBColorSpace; balTex.magFilter = THREE.NearestFilter; balTex.minFilter = THREE.NearestFilter;
  const bal = new THREE.Sprite(new THREE.SpriteMaterial({map:balTex, alphaTest:.5})); bal.scale.set(BAL_S, BAL_S, 1); // (rolt via material.rotation)
  const balSchaduw = new THREE.Mesh(new THREE.CircleGeometry(BAL_R * 1.2, 16), schaduwM.clone()); balSchaduw.rotation.x = -Math.PI / 2;
  scene.add(bal, balSchaduw);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.95, 1.15, 32), new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.9, depthWrite:false}));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .02; scene.add(ring);
  const kaartM = new THREE.MeshBasicMaterial({color:0xffd400, side:THREE.DoubleSide});
  const kaart = new THREE.Mesh(new THREE.PlaneGeometry(.45, .62), kaartM); kaart.visible = false; scene.add(kaart);
  // twee dug-outs langs de zijlijn (wij links, zij rechts van de middenlijn): een schot aan de voorkant (daar vallen de benen van wie zit
  // achter weg), een achterwand, stoeltjes en een plexiglas dakje
  const dugM = {frame:new THREE.MeshLambertMaterial({color:0x2b3140}), stoel:new THREE.MeshLambertMaterial({color:0x3a4a6a}),
    glas:new THREE.MeshLambertMaterial({color:0xcfe6ff, transparent:true, opacity:.28, depthWrite:false}), wand:new THREE.MeshLambertMaterial({color:0x1d2230})};
  for (const x0 of [44, 54]){
    const g = new THREE.Group(), L = 7, cx = wx(x0 + L / 2), zv = wz(72.0), za = wz(73.7);
    const doos = (w, h, d, m, x, y, z) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); g.add(me); return me; };
    doos(L, .62, .08, dugM.wand, cx, .31, zv);                                // het schot aan de voorkant: dicht (daar vallen de benen achter weg)
    doos(L, .3, .08, dugM.glas, cx, .77, zv);                                 // met plexiglas erboven
    doos(L, .08, .1, dugM.frame, cx, .94, zv);                                 // en een rand erop
    doos(L, 2.5, .1, dugM.wand, cx, 1.25, za);                                 // de achterwand
    for (const dx of [-L / 2, L / 2]) doos(.1, 2.5, za - zv, dugM.frame, cx + dx, 1.25, (zv + za) / 2); // de zijkanten
    const dak = doos(L + .2, .06, za - zv + .5, dugM.glas, cx, 2.5, (zv + za) / 2 + .2); dak.rotation.x = -.12;
    doos(L - .2, .12, .5, dugM.stoel, cx, .5, wz(73.05));                      // de bank (de zitting; wie zit, staat er vóór: veld3d tekent sprites plat)
    doos(L - .2, .6, .08, dugM.stoel, cx, .85, wz(73.4));                      // de rugleuning
    scene.add(g);
  }
  return {renderer, scene, camera, doelen, bal, balSchaduw, bankjes:{}, ring, kaart, kaartM, schaduwM, spelers:{}, vorigeBal:null, vorigeNu:0, nr:null, nrSprite:null, camX:null};
}

// Een speler: een platte pixelsprite (pixel/rig.js, in de stijl van art/chibi_anims.px.js) die altijd naar de camera kijkt,
// met de voeten op het gras. Welk plaatje hij laat zien, kiest teken3D (lopen, schieten, duiken, een houding uit het script).
const HOOGTE = 1.8 * SCHAAL;   // zo hoog is een figuur van FIGUUR_PX pixels (bij lengte 1)
const TEX = new WeakMap(), V1 = new THREE.Vector3(), V2 = new THREE.Vector3();
function texVan(cv){
  let t = TEX.get(cv);
  if (!t){ t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; TEX.set(cv, t); }
  return t;
}
function maakSpeler(){
  const mat = new THREE.SpriteMaterial({alphaTest:.5, transparent:false}), sprite = new THREE.Sprite(mat);
  return {root:sprite, sprite, mat, look:null, sleutel:null, x:null, y:null, kijk:0, flip:false, fase:0, pose:null, poseStart:0, rust:0, naam:null, i:0};
}
function schaduw(){ const m = new THREE.Mesh(new THREE.CircleGeometry(.62 * SCHAAL, 18), R.schaduwM); m.rotation.x = -Math.PI / 2; m.position.y = .015; R.scene.add(m); return m; }
// Het wisselbord van de vierde official: een zwart lichtbord met boven in rood het nummer dat eruit gaat (▼)
// en onder in groen het nummer dat erin komt (▲), zoals bij echt voetbal
function bordSprite(uit, erin){
  const tex = canvasTex(192, 224, (g, w, h) => {
    g.fillStyle = '#2a2d33'; g.fillRect(0, 0, w, h); g.fillStyle = '#07080a'; g.fillRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#2a2d33'; g.fillRect(8, h / 2 - 3, w - 16, 6); // (de rand tussen de twee helften)
    const rij = (txt, y, kleur, pijl) => {
      g.font = '900 78px ui-monospace,Consolas,monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = kleur; g.shadowBlur = 14; g.fillStyle = kleur; g.fillText(txt, w / 2 + 14, y);
      g.font = '900 34px system-ui,sans-serif'; g.fillText(pijl, 30, y); g.shadowBlur = 0;
    };
    rij(uit != null ? String(uit) : '–', h * .27, '#ff3b30', '▼');
    rij(erin != null ? String(erin) : '–', h * .75, '#3cff5a', '▲');
  });
  tex.magFilter = THREE.LinearFilter;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, transparent:true})); s.scale.set(1.3, 1.52, 1); return s;
}
// Boven je rivaal: een oranje ster met zijn naam, zodat je meteen ziet dat hij het is
function rivaalSprite(naam, icoon = '★ ', kleur = '#ff8a3d'){
  const t = icoon + naam, w = Math.min(1024, 60 + t.length * 34);
  const tex = canvasTex(w, 72, (g, W, H) => { g.font = '900 50px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 9; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText(t, W / 2, H / 2 + 2); g.fillStyle = kleur; g.fillText(t, W / 2, H / 2 + 2); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, depthTest:false, transparent:true})); s.scale.set(w / 72 * .85, .85, 1); s.renderOrder = 5; return s;
}
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
  R.dpr = dpr; R.renderer.setPixelRatio(Math.min(dpr, 2)); R.renderer.setSize(b, h);
  R.camera.aspect = b / h; R.camera.updateProjectionMatrix();
  R.sceneNr = (R.sceneNr || 0) + 1; // elke nieuwe scène (de spelers staan dan opnieuw opgesteld)
  R.vak = vak; R.vorigeNu = 0; R.camX = null; R.kijkZ = null; R.vorigeBal = null;
  for (const id in R.spelers) R.spelers[id].x = null;
  cv._3d = true; return cv;
}

// Houdingen uit de animatiescripts (namen staan ook in POSES in pitch.js; de plaatjes in pixel/animaties.js, met dezelfde naam).
// boven: een houding van het bovenlichaam (rent hij hard, dan zie je gewoon het rennen) · loopt: de animatie heeft zelf lopende benen
// vast: niet omdraaien · camera: naar de kijker (niet gespiegeld) · duur: na zoveel ms weer normaal
const POSE = {
  duw:{duur:650}, struikel:{}, val:{vast:true}, sliding:{vast:true}, steek:{duur:600}, schouder:{boven:true}, trek:{boven:true}, borst:{boven:true},
  kopstoot:{duur:500, boven:true}, lach:{boven:true}, roep:{boven:true}, kalm:{boven:true}, wijs:{boven:true}, protest:{boven:true}, wuif:{boven:true},
  kaart:{boven:true}, sorry:{boven:true, vast:true}, kniel:{vast:true}, ssst:{boven:true, vast:true}, juich:{boven:true}, klap:{boven:true}, praat:{boven:true},
  vang:{boven:true}, blok:{}, omhaal:{vast:true}, volley:{duur:700}, spreid:{vast:true}, jockey:{boven:true},
  // juichdansen (game/wedstrijd/dansen.js; script in pitch.js, soort 'dans')
  zit:{vast:true, camera:true},
  heupwieg:{camera:true}, vliegtuig:{loopt:true}, kracht:{camera:true}, knieslide:{vast:true}, robot:{camera:true}, kangoeroe:{camera:true},
  pirouette:{camera:true}, boogschutter:{camera:true}, polonaise:{loopt:true},
  // voorbij dribbelen (stijlbron 'voorbij'): over de sliding springen, en de verdediger die balend blijft liggen
  overspring:{vast:true}, balen:{vast:true},
};
export const POSE_NAMEN = Object.keys(POSE);
// ---------- wie is wie ----------
// Wie is dit (voor een vast uiterlijk): jij, of een speler van een club
function sleutelVan(e, T){
  const p = T.ploegen || {};
  if (e.id === 'J' && (e.rol === 'wij' || e.rol === 'k' || !e.rol)) return 'jij|' + (p.jij || 'x') + (p.jijUit ? '|' + [p.jijUit.huid, p.jijUit.haar, p.jijUit.kapsel, p.jijUit.lengte || '', p.jijUit.bmi || '', p.jijUit.schoen ?? '', p.jijUit.baard || ''].join(',') : '') + (p.band ? '|C' : '') + '|L' + jijLeeftijd() + '|T' + jijTattoo(); // (ouder worden: pixel/leeftijd.js; tattoos: pixel/tattoo.js)
  if (e.rol === 'R') return 'scheids|' + (p.zij ?? '');
  if (T.rivaal && e.id === T.rivaal.id) return 'rivaal|' + T.rivaal.naam; // (je rivaal ziet er altijd hetzelfde uit)
  if (T.vriend && e.id === T.vriend.id) return 'vriend|' + T.vriend.naam; // (en je jeugdvriend ook)
  const club = e.rol === 'wij' || e.rol === 'k' ? p.wij : p.zij;
  return 'c' + club + '|' + e.id;
}
// Het uiterlijk en tenue van deze speler (een vaste dobbelsteen per sleutel: dezelfde speler ziet er altijd hetzelfde uit)
function kleed(s, e, T){
  const p = T.ploegen || {}, sl = sleutelVan(e, T), tenue = tenueVoor(e.rol, p.tenues);
  const sleutel = sl + '#' + e.rol + '#' + [tenue.shirt, tenue.accent, tenue.patroon, tenue.broek, tenue.sok].join(',') + (e.id === 'J' ? '#' + (T.nr || '') : '');
  if (s.sleutel === sleutel) return;
  const jij = sl.startsWith('jij|'), keeper = e.rol === 'K' || e.rol === 'k';
  const uit = uiterlijkVoor(jij ? 'jij|' + (p.jij || 'x') : sl, jij ? p.jijUit : null);
  s.look = lookVan(uit, tenue, {handschoen:keeper, band:jij && !!p.band, rugnummer:jij ? T.nr : ''}); s.sleutel = sleutel; s.rust = (hashGetal(sleutel) % 1000) / 250;
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
// De wisselspelers in de dug-outs (zittend), en de trainers langs de lijn bij hun dug-out
const BANK_Z = 72.5; // (net vóór de zitting: een sprite is plat, anders snijdt de bank door hem heen)
function tekenBanken(T, tijd){
  const p = T.ploegen || {};
  const sprite = (cv, look, naam) => { const ank = anker(naam), mpp = HOOGTE * (look.lengte || 1) / FIGUUR_PX;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map:texVan(cv), alphaTest:.5})); s.center.set(ank.x, ank.y); s.scale.set(ank.w * mpp, ank.h * mpp, 1); R.scene.add(s); return s; };
  for (const [kant, x0, rol] of [['wij', 44, 'wij'], ['zij', 54, 'zij']]){
    const club = p[kant], tenue = tenueVoor(rol, p.tenues), sl = kant + '|' + club + '|' + JSON.stringify(tenue);
    let b = R.bankjes[kant];
    if (!b || b.sl !== sl){
      if (b){ b.sprites.forEach(s => R.scene.remove(s)); R.scene.remove(b.trainer); }
      const sprites = [0, 1, 2, 3].map(i => { const look = lookVan(uiterlijkVoor('bank|' + club + '|' + i), tenue); return sprite(frame(look, 'zit', 0, false), look, 'zit'); });
      // de trainer: in pak, met een das in de clubkleur
      const tl = lookVan(uiterlijkVoor('trainer|' + club), null, {kleding:'pak', nr:hashGetal('tr' + club) % 6, das:tenue.shirt});
      b = R.bankjes[kant] = {sl, sprites, tlook:tl, trainer:sprite(frame(tl, 'sta', 0, false), tl, 'sta'), rust:(hashGetal('trr' + club) % 100) / 10};
    }
    const zicht = club != null;
    // vier plekken; in het midden (x0 + 3, pitch.js DUGOUT) blijft een stoeltje vrij voor jou
    [.8, 1.7, 4.3, 5.2].forEach((d, i) => { const s = b.sprites[i]; s.visible = zicht; s.position.set(wx(x0 + d), -.42, wz(BANK_Z)); });
    // de trainer staat in zijn vak langs de lijn: meestal rustig, af en toe roept of wijst hij
    const t = tijd + b.rust, fase = t % 9, naam = fase > 7.4 ? 'roep' : fase > 6 ? 'wijs' : 'sta', cv = frame(b.tlook, naam, frameOp(naam, t), kant === 'zij');
    const tex = texVan(cv); if (b.trainer.material.map !== tex){ b.trainer.material.map = tex; const ank = anker(naam, kant === 'zij'); b.trainer.center.set(ank.x, ank.y); }
    b.trainer.visible = zicht; b.trainer.position.set(wx(x0 + (kant === 'wij' ? 1.2 : 5.8)), 0, wz(70.2)); // (aan de buitenkant van zijn dug-out: in het midden staat de vierde official)
  }
}
export const kwaliteit = () => 0; // (er is geen automatische kwaliteit meer: pixelsprites zijn licht)
// Handig bij debuggen en voor de automatische speltest (net als window.__S): welk plaatje elke speler nu laat zien
if (typeof window !== 'undefined') window.__veld3d = () => { if (!R) return null; const spelers = {};
  for (const id in R.spelers){ const sp = R.spelers[id]; if (sp.root.visible) spelers[id] = {anim:sp.naam, frame:sp.i, flip:sp.flip, rot:+sp.mat.rotation.toFixed(2), pos:[+sp.root.position.x.toFixed(2), +sp.root.position.y.toFixed(2), +sp.root.position.z.toFixed(2)]}; }
  return {scene:R.sceneNr || 0, spelers}; };
const hoekVerschil = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
// De bewegingseditor: een camera die om jouw speler draait (hoek ten opzichte van zijn kijkrichting, afstand en hoogte in meters)
function vrijeCamera(T){
  const cv = T.camVrij, sj = R.spelers.J; if (!cv || !T.ents.J || !sj) return;
  // cv.wereld: een vaste kijkrichting (vrij trainen: altijd richting het doel), die de speler rustig volgt
  const px = wx(T.ents.J.x), pz = wz(T.ents.J.y), a = cv.wereld ? cv.hoek : sj.kijk + cv.hoek;
  const doel = [px + Math.sin(a) * cv.afstand, cv.hoogte, pz + Math.cos(a) * cv.afstand, px + (cv.vooruit || 0) * -Math.sin(a), pz + (cv.vooruit || 0) * -Math.cos(a)];
  const c = R.vrijCam = cv.wereld && R.vrijCam && cv.dt !== undefined ? R.vrijCam.map((x, i) => x + (doel[i] - x) * Math.min(1, cv.dt * 5)) : doel;
  R.camera.position.set(c[0], c[1], c[2]); R.camera.lookAt(c[3], cv.kijkHoogte ?? 1.4, c[4]); R.camAfstand = cv.afstand;
}
// Alleen de camera bijwerken en opnieuw tekenen (de editor op pauze: de spelers blijven staan zoals ze stonden)
export function kijk3D(T){ if (!R) return; vrijeCamera(T); R.renderer.render(R.scene, R.camera); }
export function teken3D(T, nu){
  if (!R) return;
  const echtDt = R.vorigeNu ? (nu - R.vorigeNu) / 1000 : 0;
  const dt = Math.min(.1, Math.max(0, echtDt)); R.vorigeNu = nu;
  const tijd = nu / 1000, bal = T.bal, gezien = new Set();
  const juichWij = T.tekst === 'GOAL!' || /^Raak/.test(T.tekst || ''), juichZij = T.tekst === 'Tegengoal';
  // de rechterkant van het beeld, in de wereld: daarmee weten we of een speler naar links of naar rechts in beeld kijkt
  const m = R.camera.matrixWorld.elements, rechtsX = m[0], rechtsZ = m[2];
  let balAanVoet = null; // (dribbelen: de bal ligt dan per frame op de afstand uit de stijlbron)
  for (const e of Object.values(T.ents)){
    let s = R.spelers[e.id];
    if (!s){ s = R.spelers[e.id] = maakSpeler(); s.schaduw = schaduw(); R.scene.add(s.root); }
    kleed(s, e, T);
    s.root.visible = s.schaduw.visible = true; gezien.add(e.id);
    const keeper = e.rol === 'K' || e.rol === 'k', z = e.z || 0;
    const nieuw = s.x === null, vx = nieuw || !dt ? 0 : (e.x - s.x) / dt, vy = nieuw || !dt ? 0 : (e.y - s.y) / dt;
    s.x = e.x; s.y = e.y;
    const v = Math.hypot(vx, vy);
    // houding uit het script: duurt hij maar even (duw, tackle), dan valt hij na 'duur' ms vanzelf weg
    const P0 = e.pose && POSE[e.pose] ? POSE[e.pose] : null;
    const actief = P0 && !(P0.duur && nu - (e.poseT0 || 0) > P0.duur) ? e.pose : null;
    if (actief !== s.pose){ s.pose = actief; s.poseStart = e.poseT0 && actief ? Math.min(nu, e.poseT0) : nu; }
    const info = actief ? POSE[actief] : {};
    // kijkrichting in de wereld (x = x, z = -y): waar hij heen loopt, anders naar de bal; keepers kijken het veld in
    const naarBal = Math.atan2(bal.x - e.x, -(bal.y - e.y));
    const doel = keeper ? (e.rol === 'K' ? -Math.PI / 2 : Math.PI / 2) : v > .6 ? Math.atan2(vx, -vy) : naarBal;
    if (nieuw) s.kijk = doel; else if (!info.vast) s.kijk += hoekVerschil(s.kijk, doel) * Math.min(1, dt * 8);
    // naar links of rechts in beeld (het plaatje kijkt naar rechts; een beetje marge, anders flikkert hij als hij naar de camera kijkt)
    const opzij = Math.sin(s.kijk) * rechtsX + Math.cos(s.kijk) * rechtsZ;
    // loopt hij vooral naar de camera toe of ervan af, dan zie je hem van voren of van achteren (met een marge tegen flikkeren)
    const naarCamera = Math.sin(s.kijk) * m[8] + Math.cos(s.kijk) * m[10], drempel = s.richting && s.richting !== 'zij' ? 1 : 1.3;
    s.richting = Math.abs(naarCamera) > drempel * Math.abs(opzij) ? (naarCamera > 0 ? 'voor' : 'achter') : 'zij';
    if (keeper && z > .25) s.flip = false; // (een duik: het plaatje wordt gedraaid in plaats van gespiegeld, zie hieronder)
    else if (info.camera) s.flip = false;
    else if (!info.vast && Math.abs(opzij) > .15) s.flip = opzij < 0;
    // welk plaatje
    const tr = T.trap && T.trap.id === e.id && nu >= T.trap.t0 && nu <= T.trap.t0 + T.trap.dur ? (nu - T.trap.t0) / T.trap.dur : null;
    let naam, i = 0, lift = z, rot = 0;
    if (actief && !(info.boven && v > 2.5)){ naam = actief; i = frameOp(naam, (nu - s.poseStart) / 1000); }
    else if (tr !== null){ const kc = T.trap.kc || .4; naam = 'schiet'; i = tr < kc ? Math.min(3, Math.floor(tr / kc * 4)) : Math.min(7, 4 + Math.floor((tr - kc) / (1 - kc) * 4)); }
    else if (keeper && z > .25){
      // Duiken: meestal langs de doellijn, dus vanuit de tv-camera de diepte in. Het gestrekte lichaam kantelt vanaf de voeten
      // naar de kant waar hij op het scherm heen springt, platter naarmate hij hoger in de lucht is
      naam = 'duikStrek'; lift = z * .9;
      const nv = Math.hypot(vx, vy); if (nv > .3) s.duikDir = [vx / nv, -vy / nv];
      const d = s.duikDir || [0, 1], px = wx(e.x), pz = wz(e.y);
      const a = V1.set(px, lift + .8, pz).project(R.camera), b = V2.set(px + d[0], lift + .8, pz + d[1]).project(R.camera);
      const sx = (b.x - a.x) * R.camera.aspect, sy = b.y - a.y;
      // (hoogstens iets voorbij horizontaal: recht naar de camera toe zou hem anders ondersteboven zetten)
      rot = Math.max(-1.75, Math.min(1.75, Math.atan2(-sx, sy))) * Math.min(1, z / .5);
    }
    else if (keeper && z > .04){ naam = 'duik'; i = 1; } // (afzetten en neerkomen)
    else if (z > .25){ naam = 'kop'; i = z < .7 ? 2 : z < 1.2 ? 3 : 4; lift = Math.max(0, z * 1.1 - .55); }
    else if (v > .25){
      // rennen of wandelen, met de beeldjes op de afgelegde afstand (anders glijden de voeten)
      s.fase += v * dt; const ren = v > 2.6, pas = ren ? 2.2 + v * .1 : 1.5;
      naam = actief === 'juich' || (!actief && ((juichWij && e.rol === 'wij') || (juichZij && e.rol === 'zij')) && !keeper && !(T.geenJuichJ && e.id === 'J')) ? 'renJuich' : T.balVolg === e.id ? 'dribbel' : ren ? 'ren' : 'loop';
      i = Math.floor(s.fase / pas * 8) % 8;
      if (s.richting !== 'zij'){ naam += '_' + s.richting; s.flip = false; }
    }
    else if (!actief && ((juichWij && e.rol === 'wij') || (juichZij && e.rol === 'zij')) && !keeper && !(T.geenJuichJ && e.id === 'J')){ naam = 'juich'; i = frameOp(naam, tijd + s.rust); } // (na jouw goal kies je zelf je juichdans)
    else { naam = keeper ? 'keeperKlaar' : 'sta'; i = frameOp(naam, tijd + s.rust); }
    if (naam === 'zit') lift = -.42;
    s.naam = naam; s.i = i; s.mat.rotation = rot;
    if (naam.startsWith('dribbel')){ const d = BAL_VOOR[i] * HOOGTE * (s.look.lengte || 1) / FIGUUR_PX; balAanVoet = {x:wx(e.x) + Math.sin(s.kijk) * d, z:wz(e.y) + Math.cos(s.kijk) * d}; }
    const cv = frame(s.look, naam, i, s.flip), tex = texVan(cv);
    if (s.mat.map !== tex){ const eerst = !s.mat.map; s.mat.map = tex; if (eerst) s.mat.needsUpdate = true; }
    const ank = anker(naam, s.flip), mpp = HOOGTE * (s.look.lengte || 1) / FIGUUR_PX;
    s.sprite.center.set(ank.x, ank.y); s.sprite.scale.set(ank.w * mpp * (s.look.bouw || 1), ank.h * mpp, 1);
    s.sprite.position.set(wx(e.x), lift, wz(e.y));
    s.schaduw.position.set(wx(e.x), .015, wz(e.y)); s.schaduw.scale.setScalar(1 - Math.min(.5, lift * .3));
    if (e.id === 'J'){ R.ring.visible = true; R.ring.position.set(wx(e.x), .02, wz(e.y));
      if (T.nr && R.nr !== T.nr){ if (R.nrSprite){ R.scene.remove(R.nrSprite); R.nrSprite.material.map.dispose(); R.nrSprite.material.dispose(); } R.nrSprite = nummerSprite(T.nr); R.scene.add(R.nrSprite); R.nr = T.nr; }
      if (R.nrSprite){ R.nrSprite.visible = !!T.nr; R.nrSprite.position.set(wx(e.x), lift + HOOGTE * (s.look.lengte || 1) + .45, wz(e.y)); } }
  }
  for (const id in R.spelers) if (!gezien.has(id)){ R.spelers[id].root.visible = false; R.spelers[id].schaduw.visible = false; }
  tekenBanken(T, tijd);
  if (!gezien.has('J')){ R.ring.visible = false; if (R.nrSprite) R.nrSprite.visible = false; }
  // je rivaal (oranje ster) en je jeugdvriend (blauw hartje): de naam boven zijn hoofd
  R.labels = R.labels || {};
  for (const [sl, info, icoon, kleur] of [['rivaal', T.rivaal, '★ ', '#ff8a3d'], ['vriend', T.vriend, '♥ ', '#5be7ff']]){
    const L = R.labels[sl] = R.labels[sl] || {}, sp = info && gezien.has(info.id) ? R.spelers[info.id] : null;
    if (!sp){ if (L.sprite) L.sprite.visible = false; continue; }
    if (L.naam !== info.naam){ if (L.sprite){ R.scene.remove(L.sprite); L.sprite.material.map.dispose(); L.sprite.material.dispose(); } L.sprite = rivaalSprite(info.naam, icoon, kleur); R.scene.add(L.sprite); L.naam = info.naam; }
    const ligt = ['sliding', 'balen', 'val', 'duikStrek', 'kniel'].includes(sp.naam); // (ligt hij op de grond, dan zakt de naam mee)
    L.sprite.visible = true; L.sprite.position.set(sp.sprite.position.x, sp.sprite.position.y + (ligt ? 1.3 : HOOGTE * (sp.look.lengte || 1) + .45), sp.sprite.position.z);
  }
  // wisselbord: de vierde official (R) houdt het omhoog zolang hij in de houding 'kaart' staat (pitch.js, soort 'wissel')
  const Rf = T.bord && T.ents.R, bordOp = !!(Rf && Rf.pose === 'kaart');
  if (bordOp){ const sl = `${T.bord.uit}|${T.bord.in}`;
    if (R.bordSl !== sl){ if (R.bord){ R.scene.remove(R.bord); R.bord.material.map.dispose(); R.bord.material.dispose(); } R.bord = bordSprite(T.bord.uit, T.bord.in); R.scene.add(R.bord); R.bordSl = sl; }
    const op = Math.min(1, (nu - (Rf.poseT0 || nu)) / 250); // (het bord gaat omhoog)
    R.bord.position.set(wx(Rf.x) + .85, 2.75 - (1 - op) * .7, wz(Rf.y) + .1); R.bord.visible = true; } // (de onderkant in zijn opgestoken hand)
  else if (R.bord) R.bord.visible = false;
  // kaart: de scheidsrechter (of anders de speler) houdt hem omhoog
  if (T.kaart){ const wie = T.ents.R || T.ents[T.kaartOp || 'J']; if (wie){ R.kaart.visible = true; R.kaartM.color.set(T.kaart === 'rood' ? 0xe23b3b : 0xffd400); R.kaart.position.set(wx(wie.x) + .5, 2.75 * SCHAAL, wz(wie.y)); R.kaart.lookAt(R.camera.position); } } else R.kaart.visible = false;
  // bal: rolt mee met de beweging
  const bx = balAanVoet ? balAanVoet.x : wx(bal.x), bz = balAanVoet ? balAanVoet.z : wz(bal.y), by = BAL_S / 2 + (bal.z || 0);
  if (R.vorigeBal){ const dx = bx - R.vorigeBal.x, dz = bz - R.vorigeBal.z, d = Math.hypot(dx, dz);
    // rollen: de bal draait precies zo ver als hij over het gras gaat (afstand / straal); naar rechts met de klok mee
    if (d > 1e-4 && d < 20 && !(bal.z > .3)){ const naarRechts = Math.abs(dx) > Math.abs(dz) * .25 ? dx >= 0 : dz < 0; R.bal.material.rotation -= Math.min(.35, d / (BAL_S / 2)) * (naarRechts ? 1 : -1); } } // (hooguit .35 per beeld: sneller zie je het niet meer draaien, alleen flikkeren)
  R.vorigeBal = {x:bx, z:bz};
  R.bal.position.set(bx, by, bz);
  R.balSchaduw.position.set(bx, .016, bz); R.balSchaduw.material.opacity = .32 * Math.max(.25, 1 - (bal.z || 0) / 4);
  // net bolt na een doelpunt
  for (const k of ['L', 'R']){ const d = R.doelen[k], b = k === T.netKant ? (T.netBol || 0) : 0; d.achter.position.x = d.X + d.dx * (1.8 + b * 1.1); }
  // camera: schuin vanaf de tribune, volgt de bal rustig
  // ingezoomd zoals een tv-camera; bij een doel schuift het beeld iets op zodat het doel in beeld blijft
  // Ver weg (normaal): volgt de bal en schuift bij een doel iets op, zodat het doel in beeld blijft.
  // Dichtbij (duels, tackles, juichen, toespraak): volgt jou, ook in de diepte
  // In de herhaling: eerst op jou, maar zodra de bal bij je weg is (het schot) volgt de camera de bal tot in het doel
  const zoom = T.zoom || 1, Jent = zoom < 1 && T.ents.J, J = Jent && T.herhaling && T.bal && Math.hypot(T.bal.x - Jent.x, T.bal.y - Jent.y) > 3 ? T.bal : Jent;
  const cam = T.cam ?? 52.5, doelX = J ? wx(J.x) : wx(cam) + (cam > 70 ? (cam - 70) * .25 : cam < 35 ? -(35 - cam) * .25 : 0);
  // T.cam is in pitch.js al afgevlakt; hier alleen nog een klein beetje, en een stukje vooruit kijken naar waar de bal heen gaat
  const vooruit = J || R.vorigeBalX === undefined || !dt ? 0 : Math.max(-6, Math.min(6, (bx - R.vorigeBalX) / dt * .25)); R.vorigeBalX = bx;
  R.camX = R.camX === null ? doelX : R.camX + (doelX + vooruit - R.camX) * Math.min(1, dt * (J ? 3 : 7));
  const kijkDoel = J ? wz(J.y) : 2;
  R.kijkZ = R.kijkZ === undefined || R.kijkZ === null || !dt ? kijkDoel : R.kijkZ + (kijkDoel - R.kijkZ) * Math.min(1, dt * 3);
  R.zoom = R.zoom === undefined || !dt ? zoom : R.zoom + (zoom - R.zoom) * Math.min(1, dt * 3);
  R.camera.position.set(R.camX, 14 * R.zoom, R.kijkZ + 40 * R.zoom); R.camera.lookAt(R.camX, 0, R.kijkZ);
  R.camAfstand = Math.hypot(14, 40) * R.zoom;
  vrijeCamera(T);
  // teksten als HTML-laag: scherp en in de stijl van het spel
  if (R.vak){
    const fx = R.vak.querySelector('.pitchfx'), on = R.vak.querySelector('.pitchonder');
    if (fx){ const t = T.tekst || ''; if (fx.textContent !== t){ fx.textContent = t; fx.classList.toggle('lang', t.length > 12); fx.classList.toggle('goal', t === 'GOAL!'); } fx.style.color = T.tekstKleur || '#fff'; fx.style.opacity = t ? Math.min(1, (T.tekstT ?? 1) * 2) : 0; fx.style.transform = `translate(-50%,-50%) scale(${.85 + Math.min(1, (T.tekstT ?? 1)) * .15})`; }
    if (on){ const t = T.onder || ''; if (on.textContent !== t){ on.textContent = t; on.classList.toggle('herhaling', t.startsWith('⟲')); } on.style.display = t ? '' : 'none'; }
  }
  R.renderer.render(R.scene, R.camera);
}
