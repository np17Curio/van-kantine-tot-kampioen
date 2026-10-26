import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as kloonSkelet } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { HAAR, HUID, KAPSELS, SCHOENEN, KROES_KAPSELS } from '../data/uiterlijk.js';
import { STANDAARD } from '../data/tenues.js';

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
    // het haar van het model: alle kapsels worden hieruit gemaakt (zie haarGeo)
    let haar = null; scene.traverse(o => { if (o.isMesh && o.userData.deel === 'haar') haar = o.geometry; });
    // welke botten de animatie zelf beweegt (de andere, zoals het hoofd en het bekken, hebben geen spoor)
    const metSpoor = new Set(clip ? clip.tracks.filter(t => t.name.endsWith('.quaternion')).map(t => naamVan({name:t.name.slice(0, t.name.lastIndexOf('.'))})) : []);
    BASIS = {houder, bron, clip, handen, haar:haar ? haarMaten(haar) : null, metSpoor, tex:{}, mat:{}, geo:{}};
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
export { HAAR, HUID, KAPSELS, SCHOENEN }; // de lijsten staan in data/uiterlijk.js
export function hashGetal(s){ let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
// Een vaste dobbelsteen: dezelfde sleutel geeft altijd hetzelfde uiterlijk, en ook dezelfde manier van bewegen.
// eigen = wat je zelf koos bij het aanmaken van je speler (huid, haar, kapsel); de rest blijft van de dobbelsteen
const GEWOON = KAPSELS.filter(k => !KROES_KAPSELS.includes(k)); // de andere kapsels (met 'model' dubbel)
export function uiterlijkVoor(sleutel, eigen){
  let h = hashGetal(sleutel); const d = n => { h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; return h % n; };
  const huid = d(HUID.length);
  // (een donkere huid: vaker kroeshaar-kapsels, zoals een afro, cornrows of vlechten)
  const u = {huid, haar: huid >= 4 && d(3) ? 0 : d(HAAR.length), kapsel:huid >= 3 && d(5) < 3 ? KROES_KAPSELS[d(KROES_KAPSELS.length)] : d(25) === 0 ? 'vlechten' : GEWOON[d(GEWOON.length)], lengte:.93 + d(15) / 100, bouw:.9 + d(21) / 100, schoen:d(SCHOENEN.length),
    stijl:{arm:.8 + d(41) / 100, pas:.9 + d(26) / 100, houding:d(11) / 100, veer:.85 + d(31) / 100}};
  if (eigen){ if (HUID[eigen.huid]) u.huid = eigen.huid; if (HAAR[eigen.haar]) u.haar = eigen.haar; if (KAPSELS.includes(eigen.kapsel)) u.kapsel = eigen.kapsel; if (SCHOENEN[eigen.schoen]) u.schoen = eigen.schoen;
    // gekozen lengte (165-200 cm) en bouw (bmi 20-27,5)
    if (eigen.lengte) u.lengte = .93 + Math.max(0, Math.min(35, eigen.lengte - 165)) / 35 * .14; if (eigen.bmi) u.bouw = .9 + Math.max(0, Math.min(7.5, eigen.bmi - 20)) / 7.5 * .2; }
  return u;
}
// Tenue voor een rol in de wedstrijd: uit de tenues van deze wedstrijd (data/tenues.js), anders een vaste kleur per rol
export function tenueVoor(rol, tenues){
  if (tenues && tenues[rol]) return tenues[rol];
  if (rol === 'K') return {shirt:'#8a5cf0', accent:'#141720', patroon:'effen', broek:'#141720', sok:'#8a5cf0'};
  if (rol === 'k') return {shirt:'#2fbf71', accent:'#141720', patroon:'effen', broek:'#141720', sok:'#2fbf71'};
  if (rol === 'R') return {shirt:'#15161c', accent:'#15161c', patroon:'effen', broek:'#15161c', sok:'#15161c'};
  return STANDAARD;
}
const tenueKey = t => [t.shirt, t.accent, t.patroon, t.broek, t.sok, t.sponsor ? t.sponsor.naam : '', t.logoImg ? 'L' + (t.logoId ?? '') : ''].join('|');
// Welk deel van het shirt krijgt de accentkleur? u en v zijn plaatsen op de shirttextuur (0 tot 1)
const PATROON = {
  effen: () => false,
  strepen: (u) => Math.floor(u * 9) % 2 === 1,
  banen: (u, v) => Math.floor(v * 9) % 2 === 1,
  helften: (u) => (u % .5) < .25,
  sjerp: (u, v) => Math.abs(((u * 2) % 1) - v) < .11,
  blokken: (u, v) => (Math.floor(u * 10) + Math.floor(v * 10)) % 2 === 1,
  bies: (u, v) => v < .09 || (v < .3 && ((u * 2) % 1 < .07 || (u * 2) % 1 > .93)),
};
// Waar op de shirttextuur de voorkant zit (gemeten met een testraster in de fotostudio): het midden van de borst,
// de hoogte van de sponsor, en het logo links op de borst (voor wie kijkt: rechts)
const VOOR = {u:.382, sponsor:.775, breed:.235, letter:.075, logoU:.455, logoV:.86, logo:.058};
// Gekleurde shirttextuur: de vouwen en schaduw van het model, in de kleuren en het design van het tenue
function shirtTex(t){
  const key = 'shirt|' + t.shirt + t.accent + t.patroon + (t.sponsor ? '|' + t.sponsor.naam : '') + (t.logoImg ? '|L' + (t.logoId ?? '') : '');
  if (BASIS.tex[key]) return BASIS.tex[key];
  const bron = BASIS.bron['t_shirt_basic_tucked']; if (!bron) return null;
  const c = document.createElement('canvas'), w = c.width = bron.width, h = c.height = bron.height;
  const g = c.getContext('2d'); g.drawImage(bron, 0, 0);
  const img = g.getImageData(0, 0, w, h), d = img.data, mask = PATROON[t.patroon] || PATROON.effen;
  let som = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 20){ som += (d[i] + d[i + 1] + d[i + 2]) / 3; n++; }
  const gem = som / Math.max(1, n), hex = x => [parseInt(x.slice(1, 3), 16), parseInt(x.slice(3, 5), 16), parseInt(x.slice(5, 7), 16)];
  const c1 = hex(t.shirt), c2 = hex(t.accent || t.shirt);
  for (let i = 0, p = 0; i < d.length; i += 4, p++){
    const x = p % w, y = (p - x) / w, v = Math.min(1.1, (d[i] + d[i + 1] + d[i + 2]) / 3 / gem * .92);
    const kl = mask(x / w, y / h) ? c2 : c1;
    d[i] = Math.min(255, kl[0] * v); d[i + 1] = Math.min(255, kl[1] * v); d[i + 2] = Math.min(255, kl[2] * v);
  }
  g.putImageData(img, 0, 0);
  // Clublogo links op de borst en de sponsor midden op de borst (alleen in de krantenfoto's).
  // De textuur staat verticaal gespiegeld op het model (hoger op het shirt = lager op de textuur): daarom scale(1, -1)
  if (t.sponsor || t.logoImg){
    const licht = c1[0] * .299 + c1[1] * .587 + c1[2] * .114 > 150;
    if (t.sponsor){ g.save(); g.translate(VOOR.u * w, VOOR.sponsor * h); g.scale(1, -1);
      // groot over de borst; past een lange naam niet, dan op twee regels (en pas daarna kleiner)
      const font = f => `900 ${f}px Arial Black, Arial, sans-serif`, max = VOOR.breed * w, naam = t.sponsor.naam;
      let f = Math.round(w * VOOR.letter); g.font = font(f); let regels = [naam];
      if (g.measureText(naam).width > max && naam.includes(' ')){ const wd = naam.split(' '); let best = null;
        for (let k = 1; k < wd.length; k++){ const r = [wd.slice(0, k).join(' '), wd.slice(k).join(' ')], b = Math.max(...r.map(x => g.measureText(x).width)); if (!best || b < best.b) best = {r, b}; }
        regels = best.r; f = Math.round(f * .85); g.font = font(f); }
      const mw = Math.max(...regels.map(x => g.measureText(x).width)); if (mw > max){ f = Math.floor(f * max / mw); g.font = font(f); }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      regels.forEach((r, i) => { const y = (i - (regels.length - 1) / 2) * f * 1.05; // (de eerste regel bovenaan op het shirt)
        // een randje in de tegenkleur: ook leesbaar op strepen en blokken
        g.globalAlpha = 1; g.lineWidth = Math.max(2, f * .14); g.strokeStyle = licht ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.55)'; g.strokeText(r, 0, y);
        g.fillStyle = licht ? '#15161c' : '#ffffff'; g.globalAlpha = .95; g.fillText(r, 0, y); });
      g.restore(); }
    if (t.logoImg){ const s = VOOR.logo * w; g.save(); g.translate(VOOR.logoU * w, VOOR.logoV * h); g.scale(1, -1); g.drawImage(t.logoImg, -s / 2, -s / 2, s, s); g.restore(); }
  }
  return BASIS.tex[key] = tex(c);
}
function tenueMaterialen(t){
  return {
    shirt:materiaal('shirt|' + tenueKey(t), () => new THREE.MeshLambertMaterial({map:shirtTex(t), color:0xffffff})),
    broek:materiaal('broek|' + t.broek, () => new THREE.MeshLambertMaterial({map:grijs('male-classic-jeans', {doel:225, contrast:.3}), color:new THREE.Color(t.broek)})),
    sok:materiaal('sok|' + t.sok, () => new THREE.MeshLambertMaterial({map:grijs('male-classic-jeans', {doel:235, contrast:.25}), color:new THREE.Color(t.sok)})),
  };
}

// ---------- kapsels: allemaal gemaakt van het echte haar van het model ----------
// Het haar is een mesh met losse plukjes en een doorzichtige textuur. Voor elk kapsel wordt een kopie vervormd:
// korter tegen het hoofd, een kuif omhoog, langer in de nek, voller voor krullen, of een staart. Zo houdt elk kapsel
// dezelfde echte plukjes en schaduw, en beweegt het met het hoofd mee (de koppeling met het skelet blijft gelijk).
// In de ruimte van het haar-mesh is z omhoog en -y voor.
function haarMaten(g){
  g.computeBoundingBox(); const b = g.boundingBox, c = b.getCenter(new THREE.Vector3()), h = b.getSize(new THREE.Vector3()).multiplyScalar(.5);
  const s = new THREE.Vector3(c.x, c.y, c.z - h.z * .35), pos = g.attributes.position, v = new THREE.Vector3(), d = [];
  for (let i = 0; i < pos.count; i++) d.push(v.fromBufferAttribute(pos, i).distanceTo(s));
  d.sort((a, b) => a - b);
  // s: ongeveer het midden van de schedel; huid: de afstand waarop de binnenste plukjes op de hoofdhuid liggen
  return {geo:g, c, h, s, huid:d[Math.floor(d.length * .15)]};
}
const glad = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function haarGeo(kapsel){
  const H = BASIS.haar; if (!H || kapsel === 'model' || kapsel === 'kaal') return H ? H.geo : null;
  if (BASIS.geo['haar|' + kapsel]) return BASIS.geo['haar|' + kapsel];
  const g = H.geo.clone(), pos = g.attributes.position, {c, h, s, huid} = H, p = new THREE.Vector3();
  // korter: niet naar binnen drukken (dan zakt het haar in de schedel), maar de lengte eraf halen:
  // nek en zijkant omhoog, de pony iets omhoog en naar achteren, en het volume een fractie kleiner
  const kort = (p, w, v) => {
    const k = 1 - .15 * (1 - glad(-.1, .5, v)); // aan de achterkant niet: daar ligt het haar al dicht tegen het hoofd
    const q = p.clone().sub(s), d = q.length(); if (d > huid) p.copy(s).add(q.multiplyScalar((huid + (d - huid) * k) / d));
    if (w < -.45) p.z += (-.45 - w) * h.z * .35; // alleen de punten in de nek, anders wordt het achterhoofd kaal
    const pony = glad(-.35, -1, v) * glad(-.6, .3, w); p.z += pony * h.z * .1; p.y += pony * h.y * .1;
  };
  for (let i = 0; i < pos.count; i++){
    p.fromBufferAttribute(pos, i);
    const u = (p.x - c.x) / h.x, v = (p.y - c.y) / h.y, w = (p.z - c.z) / h.z; // opzij, voor (-) / achter (+), hoogte
    if (kapsel === 'kort') kort(p, w, v);
    else if (kapsel === 'kuif'){
      kort(p, w, v);
      const t = glad(0, .8, w) * glad(.4, -.6, v); // bovenop en voor
      p.z += t * h.z * .42; p.y -= t * h.y * .22;
    } else if (kapsel === 'krul'){
      const q = p.clone().sub(s), golf = Math.sin(p.x / h.x * 9) * Math.sin(p.y / h.y * 8) * Math.sin(p.z / h.z * 10);
      p.copy(s).add(q.multiplyScalar(1.13 + .05 * golf));
    } else if (kapsel === 'lang'){
      // zij- en achterkant onder de oren naar beneden, de pony voor blijft kort
      const lager = Math.max(0, -.1 - w), achter = glad(-.6, .1, v);
      p.z -= lager * h.z * 2.2 * achter; p.y += lager * h.y * .25 * achter;
      p.x += Math.sign(u) * lager * h.x * .12 * achter;
    } else if (kapsel === 'afro'){
      // een ronde bol rondom het hoofd; boven de ogen en bij het gezicht minder, zodat het gezicht vrij blijft
      kort(p, w, v); kort(p, w, v); // eerst de lengte eraf (geen pony, geen nek): dan wordt het een ronde bol
      // opbollen vanuit een punt hoog in het hoofd; aan de voorkant (voorhoofd) en onderaan (oren, nek) blijft het kort
      const voor = glad(-.15, -.75, v), onder = glad(-.05, -.55, w), groei = (1 - .85 * voor * glad(.5, -.2, w)) * (1 - .85 * onder);
      const top = s.clone(); top.z += h.z * .45;
      const q = p.clone().sub(top), d = q.length(), golf = Math.sin(p.x / h.x * 23) * Math.sin(p.y / h.y * 21) * Math.sin(p.z / h.z * 25);
      const rond = huid * (1.78 + .06 * golf) + (d - huid) * .25, nd = d + (Math.max(d, rond) - d) * groei;
      p.copy(top).add(q.multiplyScalar(nd / d)); p.z += voor * h.z * .15; p.y += voor * h.y * .1; // de haarlijn iets omhoog en naar achteren
    } else if (kapsel === 'kroes'){
      // kort, met wat meer volume en een fijne kroesstructuur
      kort(p, w, v); const q = p.clone().sub(s), golf = Math.sin(p.x / h.x * 27) * Math.sin(p.y / h.y * 25) * Math.sin(p.z / h.z * 29);
      p.copy(s).add(q.multiplyScalar(1.05 + .025 * golf));
    } else if (kapsel === 'cornrows' || kapsel === 'vlechten'){
      // strak tegen het hoofd, met evenwijdige ribbels van voor naar achter
      kort(p, w, v); kort(p, w, v); // extra kort: strak tegen het hoofd
      const q = p.clone().sub(s), d = q.length(), rib = Math.pow(Math.abs(Math.sin(u * Math.PI * 4.5)), 4);
      p.copy(s).add(q.multiplyScalar((d + huid * .15 * rib) / d)); // ribbels naar buiten (nooit de schedel in)
      if (kapsel === 'vlechten'){
        // lange vlechten: aan de zij- en achterkant in losse strengen naar beneden
        const lager = Math.max(0, .05 - w), achter = glad(-.5, .15, v), baan = Math.round(u * 5) / 5;
        if (lager > 0){ const g = glad(0, .1, lager) * achter; // (hoe lager, hoe meer losse vlechten)
          p.z -= lager * h.z * 3.4 * achter; p.y += lager * h.y * .3 * achter;
          p.x = c.x + (u + (baan - u) * .9 * g) * h.x + Math.sign(u) * lager * h.x * .15 * achter + Math.sin(lager * 45 + baan * 9) * h.x * .04 * g; // strengen met een vlechtpatroon
          p.y += Math.cos(lager * 45 + baan * 9) * h.y * .05 * g + Math.abs(u - baan) * h.y * .25 * g; }
      }
    } else if (kapsel === 'staart'){
      // voor en bovenop kort; de achterkant bij elkaar gebonden en als een staart naar beneden
      // alleen het onderste deel van de achterkant wordt de staart; de rest blijft het hoofd bedekken
      const staart = glad(.15, .6, v) * glad(-.1, -.55, w);
      if (staart < 1) kort(p, w, v);
      if (staart > 0){ const onder = Math.max(0, -.1 - w);
        p.x = c.x + (p.x - c.x) * (1 - .7 * staart);
        p.y += staart * onder * h.y * .35;
        p.z -= staart * onder * h.z * 1.3; }
    }
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  pos.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere();
  return BASIS.geo['haar|' + kapsel] = g;
}

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
    if (deel === 'haar'){ const hg = haarGeo(uit.kapsel); if (hg) o.geometry = hg; o.visible = uit.kapsel !== 'kaal'; }
  });
  obj.scale.set(uit.bouw, uit.lengte, uit.bouw);
  // botten opzoeken; vingers in een ontspannen houding; ruststand en richting (naar het volgende gewricht) onthouden
  const botten = {};
  obj.traverse(o => { if (!o.isBone) return; const n = naamVan(o); if (BOTTEN.includes(n)) botten[n] = o; if (BASIS.handen[n]) o.quaternion.copy(BASIS.handen[n]); });
  for (const naam in botten){ const b = botten[naam], kind = b.children.find(c => c.isBone && !VINGER.test(naamVan(c)) && !/thumb|index|middle|ring|pinky/.test(naamVan(c))) || b.children.find(c => c.isBone);
    b.userData.rust = b.quaternion.clone(); b.userData.richting = kind ? kind.position.clone().normalize() : new THREE.Vector3(0, 1, 0); }
  // stilstaan: het rustige eerste deel van de modelanimatie, per speler op een ander moment begonnen
  let mixer = null, idle = null;
  if (BASIS.clip){ mixer = new THREE.AnimationMixer(obj); idle = mixer.clipAction(THREE.AnimationUtils.subclip(BASIS.clip, 'rust', 0, 130, 30)); idle.play(); mixer.setTime((hashGetal(JSON.stringify(uit)) % 400) / 100); }
  return {obj, botten, meshes, mixer, idle, metSpoor:BASIS.metSpoor, tenueKey:tenueKey(tenue), stijl:uit.stijl};
}
// De aanvoerdersband: een gele ring om de linkerbovenarm, vast aan het bot (zo beweegt hij mee met elke animatie).
// Maat en stand uit het bot zelf: de lengte tot de elleboog, de ring iets dikker dan de mouw, langs de richting van de arm.
export function zetBand(m){
  const bot = m && m.botten.upperarm_l; if (!bot || m.band) return;
  const elleboog = m.botten.lowerarm_l, lengte = elleboog && elleboog.parent === bot ? elleboog.position.length() : bot.children.reduce((a, c) => Math.max(a, c.position.length()), 0) || 25;
  const r = lengte * .23, hoog = lengte * .16, groep = new THREE.Group();
  const geel = materiaal('band|geel', () => new THREE.MeshLambertMaterial({color:new THREE.Color('#f3c44f'), side:THREE.DoubleSide}));
  const rand = materiaal('band|rand', () => new THREE.MeshLambertMaterial({color:new THREE.Color('#2a2a2a'), side:THREE.DoubleSide}));
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r, hoog, 18, 1, true), geel); groep.add(ring);
  for (const y of [-hoog / 2, hoog / 2]){ const rd = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.01, r * 1.01, hoog * .14, 18, 1, true), rand); rd.position.y = y; groep.add(rd); }
  const richting = (bot.userData.richting || new THREE.Vector3(0, 1, 0)).clone().normalize();
  groep.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), richting);
  groep.position.copy(richting).multiplyScalar(lengte * .45);
  groep.traverse(o => { if (o.isMesh){ o.frustumCulled = false; o.userData.band = true; m.meshes.push(o); } });
  bot.add(groep); m.band = groep;
}
// Ander tenue (bijvoorbeeld bij strafschoppen wisselt de rol), zonder de kloon opnieuw te maken
export function zetTenue(m, tenue){
  const key = tenueKey(tenue); if (m.tenueKey === key) return;
  const t = tenueMaterialen(tenue);
  for (const o of m.meshes){ if (o.userData.deel === 'shirt') o.material = t.shirt; else if (o.userData.deel === 'broek') o.material = [t.broek, o.material[1], t.sok]; }
  m.tenueKey = key;
}
// Botten draaien. Alles wordt uitgerekend in de ruimte van het model zelf (onder de schaal van de speler): elke speler is
// anders geschaald in breedte en lengte, en bij zo'n ongelijke schaal zijn wereldrotaties niet zuiver. Dat gaf kleine,
// steeds wisselende fouten in nek en hoofd (trillende, rollende hoofden). Binnen het model is alle schaal gelijk en klopt het precies.
const _q = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _v = new THREE.Vector3(), _d = new THREE.Vector3(), _qd = new THREE.Quaternion(), _m = new THREE.Matrix4();
// draaiing van een bot ten opzichte van het model (product van de lokale draaiingen van het model tot en met het bot)
function inModel(bot, obj, uit){ uit.identity(); const keten = []; for (let o = bot; o && o !== obj; o = o.parent) keten.push(o); for (let i = keten.length - 1; i >= 0; i--) uit.multiply(keten[i].quaternion); return uit; }
// Een bot zo draaien dat het in dezelfde richting wijst als het hulpbot (de kleinste draaiing vanuit zijn ruststand)
export function lijnBotUit(bot, hulp, basis, obj){
  if (!bot || !hulp) return;
  bot.quaternion.copy(basis || bot.userData.rust);
  inModel(bot, obj, _q);
  _v.copy(bot.userData.richting).applyQuaternion(_q).normalize();                       // waar het bot nu naartoe wijst (modelruimte)
  _d.set(0, -1, 0).applyQuaternion(hulp.getWorldQuaternion(_qd));                       // waar het heen moet (wereld; het hulpskelet heeft geen ongelijke schaal)
  _d.transformDirection(_m.copy(obj.matrixWorld).invert());                             // ... naar modelruimte
  _qd.setFromUnitVectors(_v, _d).multiply(_q);
  inModel(bot.parent, obj, _qp);
  bot.quaternion.copy(_qp.invert().multiply(_qd));
}
// Een bot extra draaien om een as in de ruimte van het model (x = opzij, y = omhoog, z = vooruit), bovenop zijn huidige stand
const _as = new THREE.Vector3();
export function draaiBot(bot, obj, ax, ay, az, hoek){
  if (!bot || !hoek) return;
  _qd.setFromAxisAngle(_as.set(ax, ay, az).normalize(), hoek).multiply(inModel(bot, obj, _q));
  inModel(bot.parent, obj, _qp);
  bot.quaternion.copy(_qp.invert().multiply(_qd));
}
