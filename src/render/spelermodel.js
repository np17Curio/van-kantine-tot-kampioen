import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as kloonSkelet } from 'three/examples/jsm/utils/SkeletonUtils.js';

/* ===================== Spelersmodel (GLB) ===================== */
// 3D-model: "pallone da calcio+giocatore" door rosaliarenda (Sketchfab), CC-BY-4.0.
// Aangepast voor dit spel (scripts/model-verkleinen.mjs): bal en wimpers weggelaten, texturen verkleind.
// De spijkerbroek wordt hier een korte broek met knieën en voetbalsokken (het lichaam heeft onder de broek geen benen).
// Elke speler is een kloon met een eigen uiterlijk: huid, kapsel, haarkleur, lengte, bouw, en het tenue van zijn club.
export const MODEL_BRON = {titel:'pallone da calcio+giocatore', maker:'rosaliarenda', licentie:'CC-BY-4.0', url:'https://sketchfab.com/3d-models/pallone-da-calciogiocatore-3016826bcb984b02869f8dcc296120e0'};
const MODEL_URL = new URL('../../Models/speler.glb', import.meta.url).href;
// Welk materiaal is welk deel van de speler
const ONDERDEEL = {t_shirt_basic_tucked:'shirt', 'male-classic-jeans':'broek', short02:'haar', shoes05:'schoenen', male_generic:'huid', eyebrow008:'wenkbrauw', 'high-poly':'ogen'};
// Hoogtes (model 1 m hoog, voeten op 0): onder de broek komt de knie, daaronder de sok
const BROEK_ONDER = .41, SOK_BOVEN = .35;
// De botten die het spel aanstuurt (Unreal-namen; GLTFLoader haalt leestekens weg en zet er een volgnummer achter)
export const BOTTEN = ['pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01', 'head', 'clavicle_l', 'clavicle_r', 'upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r', 'hand_l', 'hand_r', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r', 'foot_l', 'foot_r'];
const VINGER = /^(index|middle|pinky|ring|thumb)_0[123]_[lr]$/;

let BASIS = null, BELOFTE = null;
export const modelKlaar = () => !!BASIS;
export function laadModel(){
  if (!BELOFTE) BELOFTE = (async () => {
    const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
    const scene = gltf.scene, bron = {};
    scene.traverse(o => { if (o.isMesh){ o.frustumCulled = false; const m = o.material; if (m && m.map && m.map.image) bron[m.name] = naarCanvas(m.map.image); o.userData.deel = ONDERDEEL[m && m.name]; } });
    // maat: voeten op 0, 1 meter hoog, midden op x = z = 0 (de speler schaalt daarna naar zijn lengte)
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene, true), maat = box.getSize(new THREE.Vector3()), s = 1 / maat.y;
    const houder = new THREE.Group(); houder.add(scene);
    scene.scale.multiplyScalar(s); scene.position.set(0, -box.min.y * s, 0);
    houder.updateMatrixWorld(true);
    // midden tussen de heupen op x = z = 0
    let bekken = null; scene.traverse(o => { if (o.isBone && naamVan(o) === 'pelvis') bekken = o; });
    if (bekken){ const p = bekken.getWorldPosition(new THREE.Vector3()); scene.position.x -= p.x; scene.position.z -= p.z; houder.updateMatrixWorld(true); }
    scene.traverse(o => { if (o.isMesh && o.userData.deel === 'broek') deelBroek(o); });
    // animatie: zonder de verplaatsing van de wortel. Ontspannen handen nemen we uit het begin van de animatie
    const clip = gltf.animations[0] || null;
    if (clip) clip.tracks = clip.tracks.filter(t => !/Game_engine|Root_|_rootJoint/.test(t.name));
    const handen = {};
    if (clip){
      const rust = []; scene.traverse(o => { if (o.isBone) rust.push([o, o.quaternion.clone(), o.position.clone()]); });
      const mixer = new THREE.AnimationMixer(scene), act = mixer.clipAction(clip); act.play(); mixer.setTime(.4);
      scene.traverse(o => { if (o.isBone && VINGER.test(naamVan(o))) handen[naamVan(o)] = o.quaternion.clone(); });
      act.stop(); mixer.uncacheRoot(scene);
      for (const [o, q, p] of rust){ o.quaternion.copy(q); o.position.copy(p); } // het model terug in zijn ruststand
    }
    // hoofd: waar de schedel zit (voor de kapsels), in houder-ruimte
    let hoofd = null; scene.traverse(o => { if (o.isBone && naamVan(o) === 'head') hoofd = o; });
    houder.updateMatrixWorld(true);
    const schedel = hoofd ? hoofd.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(0, .93, 0);
    BASIS = {houder, bron, clip, handen, schedel, tex:{}, mat:{}, geo:{}};
    return BASIS;
  })().catch(e => { console.warn('Spelersmodel kon niet laden, de eenvoudige spelers blijven', e); BASIS = null; throw e; });
  return BELOFTE;
}
// De driehoeken van de spijkerbroek in drie groepen zetten: korte broek (0), knie (1) en sok (2), op de hoogte in rusthouding
function deelBroek(mesh){
  const g = mesh.geometry, pos = g.attributes.position, m = mesh.matrixWorld, v = new THREE.Vector3();
  const idx = g.index ? g.index.array : Array.from({length:pos.count}, (_, i) => i), groepen = [[], [], []];
  for (let t = 0; t < idx.length; t += 3){
    // getVertexPosition rekent het skelet mee (de geometrie zelf staat niet in dezelfde ruimte als de wereld)
    let y = 0; for (let k = 0; k < 3; k++){ (mesh.isSkinnedMesh ? mesh.getVertexPosition(idx[t + k], v) : v.fromBufferAttribute(pos, idx[t + k])).applyMatrix4(m); y += v.y / 3; }
    groepen[y > BROEK_ONDER ? 0 : y > SOK_BOVEN ? 1 : 2].push(idx[t], idx[t + 1], idx[t + 2]);
  }
  const nieuw = new (pos.count > 65535 ? Uint32Array : Uint16Array)(idx.length); let o = 0;
  g.clearGroups();
  groepen.forEach((lijst, i) => { nieuw.set(lijst, o); g.addGroup(o, lijst.length, i); o += lijst.length; });
  g.setIndex(new THREE.BufferAttribute(nieuw, 1));
}
export const naamVan = o => o.name.replace(/^mixamorig:?/, '').replace(/_\d+$/, '');
function naarCanvas(img){
  const w = Math.min(1024, img.width), h = Math.round(img.height * w / img.width), c = document.createElement('canvas');
  c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); return c;
}
const tex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; return t; };

// Grijze versie van een textuur (vouwen en schaduw blijven), die per speler met een kleur wordt vermenigvuldigd.
// strepen: verticale banen in het shirt (in textuur-ruimte), voor clubs met een gestreept tenue
function grijs(naam, opties = {}){
  const key = 'grijs|' + naam + '|' + (opties.strepen || '') + '|' + (opties.doel || '') + '|' + (opties.contrast || '');
  if (BASIS.tex[key]) return BASIS.tex[key];
  const bron = BASIS.bron[naam]; if (!bron) return null;
  const c = document.createElement('canvas'); c.width = bron.width; c.height = bron.height;
  const g = c.getContext('2d'); g.drawImage(bron, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  let som = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 20){ som += (d[i] + d[i + 1] + d[i + 2]) / 3; n++; }
  const gem = som / Math.max(1, n), doel = opties.doel || 235, w = c.width;
  for (let i = 0; i < d.length; i += 4){
    let v = Math.min(255, (d[i] + d[i + 1] + d[i + 2]) / 3 / gem * doel);
    if (opties.contrast !== undefined) v = doel + (v - doel) * opties.contrast; // minder contrast: naden en zakken vervagen
    if (opties.strepen){ const x = (i / 4) % w; if (Math.floor(x / (w / opties.strepen)) % 2) v *= .32; }
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  g.putImageData(img, 0, 0);
  return BASIS.tex[key] = tex(c);
}
const materiaal = (key, maak) => BASIS.mat[key] || (BASIS.mat[key] = maak());

// ---------- uiterlijk ----------
export const HUID = ['#f2d1b3', '#e5b893', '#c99366', '#a46a43', '#7b4a2c', '#5a3420'];
export const HAAR = ['#1a1410', '#3b2516', '#6b4527', '#c9a15a', '#9a4a22', '#9b9b9b'];
export const SCHOENEN = ['#111111', '#f2f2f2', '#d8ff3a', '#ff5a2a', '#2f6bff'];
export const KAPSELS = ['model', 'model', 'kort', 'kuif', 'krul', 'staart', 'lang', 'kaal'];
export function hashGetal(s){ let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
// Een vaste dobbelsteen: dezelfde sleutel geeft altijd hetzelfde uiterlijk, en ook dezelfde manier van bewegen
export function uiterlijkVoor(sleutel){
  let h = hashGetal(sleutel); const d = n => { h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; return h % n; };
  const huid = d(HUID.length);
  return {huid, haar: huid >= 4 && d(3) ? 0 : d(HAAR.length), kapsel:KAPSELS[d(KAPSELS.length)], lengte:.93 + d(15) / 100, bouw:.9 + d(21) / 100, schoen:d(SCHOENEN.length),
    stijl:{arm:.8 + d(41) / 100, pas:.9 + d(26) / 100, houding:d(11) / 100, veer:.85 + d(31) / 100}};
}
// Tenue van een club: jullie limoen, keepers en scheids vast, de rest volgens de club (soms gestreept)
const CLUBKLEUR = [['#d42a2a', '#ffffff', 0], ['#1e5bd6', '#ffffff', 0], ['#f2f2f2', '#1b2a52', 0], ['#ff7a1a', '#111111', 0], ['#6d2bd1', '#ffffff', 0], ['#3fa9ff', '#ffffff', 0],
  ['#1f9d55', '#ffffff', 0], ['#d42a2a', '#111111', 8], ['#1e5bd6', '#111111', 8], ['#f5c400', '#111111', 10], ['#8a1538', '#ffffff', 0], ['#f2f2f2', '#d42a2a', 0]];
export function tenueVoor(rol, club){
  if (rol === 'wij') return {shirt:'#c6f432', broek:'#141720', sok:'#c6f432', strepen:0};
  if (rol === 'K') return {shirt:'#8a5cf0', broek:'#141720', sok:'#8a5cf0', strepen:0};
  if (rol === 'k') return {shirt:'#2fbf71', broek:'#141720', sok:'#2fbf71', strepen:0};
  if (rol === 'R') return {shirt:'#15161c', broek:'#15161c', sok:'#15161c', strepen:0};
  const [shirt, broek, strepen] = CLUBKLEUR[hashGetal('club' + (club ?? 'x')) % CLUBKLEUR.length];
  return {shirt, broek, sok:strepen ? broek : shirt, strepen};
}
const tenueKey = t => t.shirt + t.broek + t.sok + t.strepen;
function tenueMaterialen(t){
  return {
    shirt:materiaal('shirt|' + tenueKey(t), () => new THREE.MeshLambertMaterial({map:grijs('t_shirt_basic_tucked', {strepen:t.strepen}), color:new THREE.Color(t.shirt)})),
    broek:materiaal('broek|' + t.broek, () => new THREE.MeshLambertMaterial({map:grijs('male-classic-jeans', {doel:225, contrast:.3}), color:new THREE.Color(t.broek)})),
    sok:materiaal('sok|' + t.sok, () => new THREE.MeshLambertMaterial({map:grijs('male-classic-jeans', {doel:235, contrast:.25}), color:new THREE.Color(t.sok)})),
  };
}

// ---------- kapsels: kleine meshes aan het hoofdbot ----------
function kapselGeo(soort){
  if (BASIS.geo[soort]) return BASIS.geo[soort];
  const r = .062; let g;
  if (soort === 'krul'){ g = new THREE.IcosahedronGeometry(r * 1.32, 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++){ const v = new THREE.Vector3().fromBufferAttribute(p, i); const k = 1 + .08 * Math.sin(v.x * 140) * Math.sin(v.y * 160) * Math.sin(v.z * 150); if (v.y < -r * .25) v.y = -r * .25 + (v.y + r * .25) * .25; v.multiplyScalar(k); p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); }
  else {
    g = new THREE.SphereGeometry(r * 1.07, 18, 12, 0, Math.PI * 2, 0, Math.PI * (soort === 'lang' ? .66 : .5));
    if (soort === 'kuif'){ const k = new THREE.SphereGeometry(r * .55, 10, 8); k.scale(1.2, .6, 1); k.translate(0, r * .9, r * .55); g = samen([g, k]); }
    if (soort === 'staart'){ const s = new THREE.CylinderGeometry(r * .18, r * .1, r * 1.6, 8); s.rotateX(.5); s.translate(0, -r * .2, -r * 1.1); g = samen([g, s]); }
    if (soort === 'lang') g.scale(1, 1.15, 1.08);
  }
  return BASIS.geo[soort] = g;
}
function samen(lijst){ const pos = [], norm = []; for (const g of lijst){ const n = g.index ? g.toNonIndexed() : g; pos.push(...n.attributes.position.array); norm.push(...n.attributes.normal.array); } const u = new THREE.BufferGeometry(); u.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); u.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3)); return u; }

// Een nieuwe speler: kloon van het model met materialen voor dit uiterlijk en tenue
export function maakModelSpeler(uit, tenue){
  if (!BASIS) return null;
  const obj = kloonSkelet(BASIS.houder), huidKl = new THREE.Color(HUID[uit.huid]), haarKl = new THREE.Color(HAAR[uit.haar]);
  const t = tenueMaterialen(tenue);
  const huid = materiaal('huid|' + uit.huid, () => new THREE.MeshLambertMaterial({map:grijs('male_generic'), color:huidKl}));
  const schoen = materiaal('schoen|' + uit.schoen, () => new THREE.MeshLambertMaterial({map:grijs('shoes05', {doel:200}), color:new THREE.Color(SCHOENEN[uit.schoen])}));
  const wenk = materiaal('wenk|' + uit.haar, () => new THREE.MeshLambertMaterial({map:grijs('eyebrow008', {doel:120}), color:haarKl, alphaTest:.4}));
  const knie = materiaal('knie|' + uit.huid, () => new THREE.MeshLambertMaterial({color:huidKl.clone().multiplyScalar(.85)}));
  const modelHaar = materiaal('mhaar|' + uit.haar, () => new THREE.MeshLambertMaterial({map:grijs('short02', {doel:170}), color:haarKl, alphaTest:.45, side:THREE.DoubleSide}));
  const ogen = materiaal('ogen', () => new THREE.MeshLambertMaterial({map:BASIS.bron['high-poly'] ? tex(BASIS.bron['high-poly']) : null, alphaTest:.3}));
  const meshes = [];
  obj.traverse(o => {
    if (!o.isMesh) return;
    o.frustumCulled = false; meshes.push(o);
    const deel = o.userData.deel;
    o.material = deel === 'shirt' ? t.shirt : deel === 'broek' ? [t.broek, knie, t.sok] : deel === 'schoenen' ? schoen : deel === 'huid' ? huid : deel === 'wenkbrauw' ? wenk : deel === 'ogen' ? ogen : deel === 'haar' ? modelHaar : o.material;
    if (deel === 'haar') o.visible = uit.kapsel === 'model';
  });
  obj.scale.set(uit.bouw, uit.lengte, uit.bouw);
  // botten opzoeken; vingers in een ontspannen houding; ruststand en richting (naar het volgende gewricht) onthouden
  const botten = {};
  obj.traverse(o => { if (!o.isBone) return; const n = naamVan(o); if (BOTTEN.includes(n)) botten[n] = o; if (BASIS.handen[n]) o.quaternion.copy(BASIS.handen[n]); });
  for (const naam in botten){ const b = botten[naam], kind = b.children.find(c => c.isBone && !VINGER.test(naamVan(c)) && !/thumb|index|middle|ring|pinky/.test(naamVan(c))) || b.children.find(c => c.isBone);
    b.userData.rust = b.quaternion.clone(); b.userData.richting = kind ? kind.position.clone().normalize() : new THREE.Vector3(0, 1, 0); }
  // kapsel aan het hoofdbot, zo geplaatst dat het in de rusthouding precies op de schedel zit
  if (uit.kapsel !== 'kaal' && uit.kapsel !== 'model' && botten.head){
    const haar = new THREE.Mesh(kapselGeo(uit.kapsel), materiaal('haar|' + uit.haar, () => new THREE.MeshLambertMaterial({color:haarKl})));
    obj.updateMatrixWorld(true);
    const wereld = new THREE.Matrix4().compose(BASIS.schedel.clone().add(new THREE.Vector3(0, .028, -.012)).applyMatrix4(obj.matrixWorld), new THREE.Quaternion(), new THREE.Vector3(uit.bouw, uit.lengte, uit.bouw));
    haar.matrix.copy(botten.head.matrixWorld.clone().invert().multiply(wereld)); haar.matrix.decompose(haar.position, haar.quaternion, haar.scale);
    botten.head.add(haar); meshes.push(haar);
  }
  // stilstaan: het rustige eerste deel van de modelanimatie, per speler op een ander moment begonnen
  let mixer = null, idle = null;
  if (BASIS.clip){ mixer = new THREE.AnimationMixer(obj); idle = mixer.clipAction(THREE.AnimationUtils.subclip(BASIS.clip, 'rust', 0, 130, 30)); idle.play(); mixer.setTime((hashGetal(JSON.stringify(uit)) % 400) / 100); }
  return {obj, botten, meshes, mixer, idle, tenueKey:tenueKey(tenue), stijl:uit.stijl};
}
// Ander tenue (bijvoorbeeld bij strafschoppen wisselt de rol), zonder de kloon opnieuw te maken
export function zetTenue(m, tenue){
  const key = tenueKey(tenue); if (m.tenueKey === key) return;
  const t = tenueMaterialen(tenue);
  for (const o of m.meshes){ if (o.userData.deel === 'shirt') o.material = t.shirt; else if (o.userData.deel === 'broek') o.material = [t.broek, o.material[1], t.sok]; }
  m.tenueKey = key;
}
// Een bot zo draaien dat het in dezelfde richting wijst als het hulpbot (de kleinste draaiing vanuit zijn ruststand).
// basis: de quaternion om vanuit te beginnen (meestal de ruststand; bij stilstaan de stand uit de animatie)
const _q = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _v = new THREE.Vector3(), _d = new THREE.Vector3(), _qd = new THREE.Quaternion();
export function lijnBotUit(bot, hulp, basis){
  if (!bot || !hulp) return;
  bot.quaternion.copy(basis || bot.userData.rust); bot.updateMatrixWorld(true);
  bot.getWorldQuaternion(_q);
  _v.copy(bot.userData.richting).applyQuaternion(_q).normalize();
  _d.set(0, -1, 0).applyQuaternion(hulp.getWorldQuaternion(_qd)).normalize();
  _qd.setFromUnitVectors(_v, _d).multiply(_q);
  bot.parent.getWorldQuaternion(_qp);
  bot.quaternion.copy(_qp.invert().multiply(_qd));
  bot.updateMatrixWorld(true);
}
// Een bot extra draaien om een as in de ruimte van de speler (x = opzij, y = omhoog, z = vooruit), bovenop zijn huidige stand
const _as = new THREE.Vector3(), _qr = new THREE.Quaternion();
export function draaiBot(bot, lijfQ, ax, ay, az, hoek){
  if (!bot || !hoek) return;
  _as.set(ax, ay, az).applyQuaternion(lijfQ).normalize();
  _qr.setFromAxisAngle(_as, hoek);
  bot.getWorldQuaternion(_q); _qd.copy(_qr).multiply(_q);
  bot.parent.getWorldQuaternion(_qp);
  bot.quaternion.copy(_qp.invert().multiply(_qd));
  bot.updateMatrixWorld(true);
}
