import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { balTex, fotoRender, renderer3D } from './veld3d.js';
import { draaiBot, laadModel, maakModelSpeler, tenueVoor, uiterlijkVoor, zetBand } from './spelermodel.js';
import { logoURL } from '../data/logos.js';

/* ===================== Fotostudio: jouw speler met een award, voor de krant ===================== */
// Dezelfde speler als op het veld (zelfde uiterlijk en tenue), voor een persmuur, met de prijs in zijn handen.
// Er wordt gerenderd met de renderer van het veld in een eigen buffer: geen extra WebGL-context.
export const FOTO_B = 720, FOTO_H = 480;
let STUDIO = null;

// ---------- de prijzen ----------
function gouden(env){ return new THREE.MeshStandardMaterial({color:0xf3c44f, metalness:.9, roughness:.22, envMap:env, envMapIntensity:1.3}); }
function zwart(env){ return new THREE.MeshStandardMaterial({color:0x0b0b0e, metalness:.1, roughness:.6, envMap:env, envMapIntensity:.25}); }
// Een beker gedraaid uit een profiel: [straal, hoogte] van onder naar boven
const draai = (punten, mat) => new THREE.Mesh(new THREE.LatheGeometry(punten.map(([r, y]) => new THREE.Vector2(r, y)), 40), mat);
function prijs(soort, env){
  const g = new THREE.Group(), goud = gouden(env);
  if (soort === 'hattrick'){
    const bal = new THREE.Mesh(new THREE.SphereGeometry(.062, 32, 20), new THREE.MeshStandardMaterial({map:balTex(), roughness:.5, envMap:env, envMapIntensity:.4}));
    bal.rotation.set(.4, .8, 0); g.add(bal);
  } else if (soort === 'motm'){
    // een kleine trofee op een zwarte voet
    const voet = new THREE.Mesh(new THREE.BoxGeometry(.07, .04, .07), zwart(env)); voet.position.y = .02; g.add(voet);
    const beker = draai([[0, 0], [.022, 0], [.022, .006], [.007, .02], [.006, .06], [.016, .07], [.04, .11], [.042, .14], [.036, .14], [.03, .115], [0, .1]], goud);
    beker.position.y = .04; g.add(beker);
    g.position.y = -.08;
  } else if (soort === 'goudenbal'){
    // de Gouden Bal: een gouden voetbal op een zwarte sokkel
    const voet = draai([[0, 0], [.05, 0], [.05, .03], [.035, .045], [0, .045]], zwart(env)); g.add(voet);
    const bal = new THREE.Mesh(new THREE.SphereGeometry(.07, 40, 28), goud); bal.position.y = .115; g.add(bal);
    g.position.y = -.075;
  } else if (soort === 'svs'){
    // een grote bokaal met twee oren
    const voet = draai([[0, 0], [.06, 0], [.06, .02], [.045, .03], [.02, .05], [0, .05]], zwart(env)); g.add(voet);
    const beker = draai([[0, 0], [.018, 0], [.013, .05], [.016, .09], [.045, .12], [.075, .2], [.08, .27], [.07, .27], [.064, .21], [0, .19]], goud);
    beker.position.y = .05; g.add(beker);
    for (const k of [-1, 1]){ const oor = new THREE.Mesh(new THREE.TorusGeometry(.04, .007, 10, 24, Math.PI * 1.2), goud); oor.position.set(k * .085, .26, 0); oor.rotation.z = k > 0 ? -Math.PI * .55 : Math.PI * 1.55; g.add(oor); }
    g.position.y = -.075;
  } else {
    // de Gouden Schoen, op een zwarte sokkel
    const v = new THREE.Shape(); v.moveTo(-.075, 0); v.lineTo(.07, 0); v.quadraticCurveTo(.098, .004, .095, .022); v.quadraticCurveTo(.09, .036, .06, .042);
    v.quadraticCurveTo(.02, .05, -.01, .072); v.lineTo(-.03, .1); v.quadraticCurveTo(-.06, .108, -.078, .098); v.quadraticCurveTo(-.09, .05, -.085, .015); v.quadraticCurveTo(-.083, 0, -.075, 0);
    const schoen = new THREE.Mesh(new THREE.ExtrudeGeometry(v, {depth:.045, bevelEnabled:true, bevelSize:.008, bevelThickness:.008, bevelSegments:3, curveSegments:10}), goud);
    schoen.position.set(0, .035, -.022); g.add(schoen);
    for (let i = 0; i < 4; i++){ const nop = new THREE.Mesh(new THREE.CylinderGeometry(.006, .008, .012, 8), goud); nop.position.set(-.05 + i * .035, .029, 0); g.add(nop); }
    const sok = new THREE.Mesh(new THREE.BoxGeometry(.15, .03, .07), zwart(env)); sok.position.y = .0; g.add(sok);
    g.position.y = -.03; g.scale.setScalar(.85);
  }
  const houder = new THREE.Group(); houder.add(g); return houder;
}

// ---------- de houdingen ----------
// [bot, as x, as y, as z, hoek] in de ruimte van het model (x = opzij, y = omhoog, z = naar voren), bovenop de rusthouding
const POSES = {
  // beide handen voor de borst (trofee of schoen)
  borst:[['upperarm_l', 1, 0, 0, -.55], ['upperarm_r', 1, 0, 0, -.55], ['upperarm_l', 0, 0, 1, -.25], ['upperarm_r', 0, 0, 1, .25],
    ['lowerarm_l', 1, 0, 0, -1.05], ['lowerarm_r', 1, 0, 0, -1.05], ['lowerarm_l', 0, 1, 0, -.75], ['lowerarm_r', 0, 1, 0, .75]],
  // beide armen omhoog, de bokaal boven het hoofd
  omhoog:[['upperarm_l', 1, 0, 0, -2.7], ['upperarm_r', 1, 0, 0, -2.7], ['upperarm_l', 0, 0, 1, .35], ['upperarm_r', 0, 0, 1, -.35],
    ['lowerarm_l', 1, 0, 0, -.5], ['lowerarm_r', 1, 0, 0, -.5]],
  // de bal in de rechterhand, naast het gezicht
  een:[['upperarm_r', 1, 0, 0, -.9], ['upperarm_r', 0, 0, 1, .55], ['lowerarm_r', 1, 0, 0, -1.7], ['lowerarm_r', 0, 1, 0, -.4],
    ['upperarm_l', 0, 0, 1, -.15]],
};
const POSE_VAN = {hattrick:'een', motm:'borst', svs:'omhoog', goudenbal:'borst', topscorer:'borst', portret:null};
// Waar de prijs komt: tussen beide handen, of in de rechterhand. Een beetje naar voren (de handen houden hem vast, niet erin)
const HAND = {hattrick:'r', motm:'beide', svs:'beide', topscorer:'beide'};

// ---------- de persmuur ----------
function muurTex(ctx){
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
  g.fillStyle = ctx.muur; g.fillRect(0, 0, 1024, 512);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.filter = 'blur(1.2px)'; // achtergrond net niet scherp, zoals bij een echte persfoto
  for (let r = 0; r < 6; r++) for (let k = -1; k < 5; k++){
    const x = k * 256 + (r % 2 ? 128 : 0) + 128, y = r * 88 + 44;
    if (ctx.logoImg && (r + k + 2) % 4 === 1){ g.drawImage(ctx.logoImg, x - 38, y - 38, 76, 76); continue; } // het clublogo op de persmuur
    if ((r + k) % 2){ g.fillStyle = ctx.accent; g.font = '800 26px "Arial Narrow", Impact, sans-serif'; g.fillText(ctx.club.toUpperCase().slice(0, 18), x, y, 230); }
    else { g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '700 18px "Arial Narrow", Impact, sans-serif'; g.fillText('HET GROTE', x, y - 10, 230); g.fillText('DOORBREKEN', x, y + 10, 230); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function bouwStudio(){
  const r = renderer3D(); if (!r) return null;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(r), env = pmrem.fromScene(new RoomEnvironment(), .04).texture; pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xf2f4ff, 0x30303a, 1.1));
  const flits = new THREE.DirectionalLight(0xffffff, 1.6); flits.position.set(.4, 1.2, 3); scene.add(flits);
  const rand = new THREE.DirectionalLight(0xbfd8ff, .9); rand.position.set(-2, 1.6, -1.5); scene.add(rand);
  const muur = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), new THREE.MeshLambertMaterial({color:0xffffff})); muur.position.set(0, .95, -.6); scene.add(muur);
  const camera = new THREE.PerspectiveCamera(30, FOTO_B / FOTO_H, .05, 20);
  return {scene, camera, env, muur, muurKey:null};
}

// soort: hattrick | motm | svs | topscorer | portret (zonder prijs). ctx: {sleutel, uiterlijk, club, muur, accent}. Geeft een JPEG-dataURL, of null zonder WebGL
export async function maakFoto(soort, ctx){
  if (!renderer3D()) return null;
  await laadModel();
  if (!STUDIO) STUDIO = bouwStudio(); if (!STUDIO) return null;
  const {scene, camera, env, muur} = STUDIO;
  // het clublogo (SVG) eerst als plaatje laden, zodat het op de muur getekend kan worden
  if (ctx.clubId != null && !ctx.logoImg) ctx.logoImg = await new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = logoURL(ctx.clubId, 256); });
  const mk = ctx.club + ctx.muur + ctx.accent + (ctx.logoImg ? 'L' : '');
  if (STUDIO.muurKey !== mk){ if (muur.material.map) muur.material.map.dispose(); muur.material.map = muurTex(ctx); muur.material.needsUpdate = true; STUDIO.muurKey = mk; }
  // het tenue met het clublogo en de shirtsponsor (een profclub heeft er allebei een)
  const tenue = ctx.tenue ? {...ctx.tenue, ...(ctx.clubId != null && ctx.logoImg ? {logoImg:ctx.logoImg, logoId:ctx.clubId} : {}), ...(ctx.sponsor ? {sponsor:ctx.sponsor} : {})} : null;
  const uit = uiterlijkVoor('jij|' + ctx.sleutel, ctx.uiterlijk), m = maakModelSpeler(uit, tenueVoor('wij', tenue ? {wij:tenue} : null));
  if (!m) return null;
  if (ctx.band) zetBand(m); // aanvoerder: de band om je arm
  // rusthouding uit het begin van de modelanimatie, daarna de pose erop
  if (m.mixer) m.mixer.setTime(.2); // (niet stoppen: dan springt het skelet terug naar de T-houding)
  for (const [bot, ax, ay, az, hoek] of POSES[POSE_VAN[soort]] || []) draaiBot(m.botten[bot], m.obj, ax, ay, az, hoek);
  draaiBot(m.botten.head, m.obj, 1, 0, 0, .06); // kin iets omlaag, naar de camera
  const speler = new THREE.Group(); speler.add(m.obj); scene.add(speler);
  speler.rotation.y = ctx.draai ?? (soort === 'hattrick' ? -.25 : .15); // ctx.draai: om te testen (bijv. van achteren)
  speler.updateMatrixWorld(true);
  // de prijs in de handen (een portret heeft er geen)
  const p = soort === 'portret' ? new THREE.Group() : prijs(soort, env), hl = new THREE.Vector3(), hr = new THREE.Vector3();
  m.botten.hand_l.getWorldPosition(hl); m.botten.hand_r.getWorldPosition(hr);
  const plek = HAND[soort] === 'r' ? hr : hl.clone().add(hr).multiplyScalar(.5);
  p.position.copy(plek).add(new THREE.Vector3(0, .01, .035)); p.rotation.y = speler.rotation.y; scene.add(p);
  // camera: half-totaal, op de hoogte van de borst (bij de bokaal boven het hoofd iets ruimer)
  const hoog = soort === 'svs';
  const portret = soort === 'portret', kijk = new THREE.Vector3(0, (hoog ? 1 : portret ? .87 : .79) * uit.lengte, 0);
  camera.position.set(.1, kijk.y + .02, hoog ? 1.95 : portret ? 1.02 : 1.25);
  if (ctx.dichtbij){ kijk.y = .97 * uit.lengte; camera.position.set(.04, kijk.y + .02, .55); } // (om te testen: alleen het hoofd)
  camera.lookAt(kijk); camera.updateProjectionMatrix();
  const cv = fotoRender(scene, camera, FOTO_B, FOTO_H);
  scene.remove(speler); scene.remove(p);
  p.traverse(o => { if (o.isMesh){ o.geometry.dispose(); if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
  if (!cv) return null;
  krantenruis(cv);
  return cv.toDataURL('image/jpeg', .86);
}
// Een beetje als een krantenfoto: lichte vignet en korrel
function krantenruis(cv){
  const g = cv.getContext('2d'), w = cv.width, h = cv.height;
  const v = g.createRadialGradient(w / 2, h * .45, h * .35, w / 2, h / 2, w * .7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.35)');
  g.fillStyle = v; g.fillRect(0, 0, w, h);
  const img = g.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4){ const n = (Math.random() - .5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
}
