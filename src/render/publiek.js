import * as THREE from 'three';
import { qmul, qrot } from './anim/voetbal-anim.js';
import { maakRetarget } from './anim/retarget.js';
import { hashGetal, maakModelSpeler, uiterlijkVoor } from './spelermodel.js';
import { GLAD } from './cutscene-basis.js';

/* ===================== Publiek bij de cutscenes: journalisten, fotografen en clubmensen ===================== */
// Voor de persconferentie (persscene.js) en de contractondertekening (contractscene.js). Beide gebruiken
// anim/contract_tekenen.json; daaruit komen twee vaste poses die we per persoon verplaatsen en draaien:
//   zittend: de speler aan tafel (t = 8,4 s), heup op (−0,6 / −0,85), kijkt naar +z;
//   staand:  de speler bij de deur (t = 1 s), heup op (−4,6 / −0,48), kijkt naar +x.
// Wie stilzit wordt één keer gezet; alleen wie beweegt (hand omhoog, klappen) wordt per beeld bijgewerkt.

export const ZIT_T = 8.4, STA_T = 1.0;
const ZIT = {spil:[-.6, -.85], richting:0}, STA = {spil:[-4.6, -.48], richting:Math.PI / 2};
const KLEDING = ['#3b4a6b', '#7a2e2e', '#2f5d50', '#8d99a8', '#4a4a52', '#1f3a5f', '#6b4f7a', '#8a6a3a', '#5a6b3b', '#2b2f3a'];

const draaiQ = h => [0, Math.sin(h / 2), 0, Math.cos(h / 2)];
// Een punt uit de bronpose (bron = ZIT of STA) naar een plek [x, z] met kijkrichting h (0 = naar +z)
export function verplaatsPunt(p, bron, plek, h){
  const r = qrot(draaiQ(h - bron.richting), [p[0] - bron.spil[0], p[1], p[2] - bron.spil[1]]);
  return [plek[0] + r[0], r[1], plek[1] + r[2]];
}
export function verplaatsPose(pose, bron, plek, h){
  const q = draaiQ(h - bron.richting), uit = {};
  for (const n in pose) uit[n] = {t:verplaatsPunt(pose[n].t, bron, plek, h), r:qmul(q, pose[n].r)};
  return uit;
}
const V3 = a => new THREE.Vector3(a[0], a[1], a[2]);
// Het model heeft een korte broek met blote knieën: voor een lange broek ook de knie in de broekkleur
export function langeBroek(m){
  for (const o of m.meshes) if (o.userData.deel === 'broek' && Array.isArray(o.material)) o.material = [o.material[0], o.material[0], o.material[2]];
}

// Handen (in de ruimte van de bronpose)
const SCHOOT = {l:[-.45, .62, -.56], r:[-.75, .62, -.56]}, OMHOOG_R = [-.84, 1.58, -.78], KLAP = [-.6, .95, -.55];
const CAMERA = [-4.36, 1.52, -.48], CAM_HAND = {l:[-4.43, 1.49, -.57], r:[-4.43, 1.49, -.39]};

// plekken: [{x, z, rol:'pers'|'club'|'fotograaf'|'cameraman', kijk:[x, z]}]
// stoel(p, h): zet een stoel neer (p = [x, y, z] van de zitting-midden op de vloer, h = kijkrichting)
export function maakPubliek({scene, anim, reg, stoel, plekken, sleutel = '', tenue}){
  const zitPose = anim.wereldPose('Speler', ZIT_T), staPose = anim.wereldPose('Speler', STA_T);
  const wit = reg(new THREE.MeshStandardMaterial({color:0xf4f1e8, roughness:.8})), zwart = reg(new THREE.MeshStandardMaterial({color:0x17191f, roughness:.4, metalness:.4}));
  const glas = reg(new THREE.MeshStandardMaterial({color:0x2a3550, roughness:.1, metalness:.6}));
  const blocGeo = reg(new THREE.BoxGeometry(.15, .012, .21)), camGeo = reg(new THREE.BoxGeometry(.11, .09, .14)), lensGeo = reg(new THREE.CylinderGeometry(.035, .04, .11, 14));
  const leden = [];
  plekken.forEach((pl, i) => {
    const staan = pl.rol === 'fotograaf' || pl.rol === 'cameraman', bron = staan ? STA : ZIT, plek = [pl.x, pl.z];
    const kijk = pl.kijk || [0, 0], h = Math.atan2(kijk[0] - pl.x, kijk[1] - pl.z);
    const uit = uiterlijkVoor(`publiek|${sleutel}|${pl.rol}|${i}`);
    const kl = pl.rol === 'club' ? tenue.shirt : staan ? '#23262e' : KLEDING[hashGetal(`pk|${sleutel}|${i}`) % KLEDING.length];
    const m = maakModelSpeler(uit, pl.rol === 'club' ? {shirt:tenue.shirt, accent:tenue.accent || tenue.shirt, patroon:'effen', broek:'#20232c', sok:'#15171d'}
      : {shirt:kl, accent:kl, patroon:'effen', broek:staan ? '#1b1d24' : '#2a2d36', sok:'#1a1c22'});
    if (!m) return;
    langeBroek(m);
    const r = maakRetarget(m); scene.add(r.houder);
    const P = p => V3(verplaatsPunt(p, bron, plek, h));
    const lid = {i, rol:pl.rol, staan, r, h, w:0, doel:0, klapW:0, klapDoel:0, fase:(hashGetal('kf' + i) % 628) / 100, tempo:9 + hashGetal('kt' + i) % 5, beeld:i,
      pose:verplaatsPose(staan ? staPose : zitPose, bron, plek, h),
      hoofd:P(staan ? [-4.6, 1.55, -.48] : [-.6, 1.12, -.78]), heup:P(staan ? [-4.6, .95, -.48] : [-.6, .53, -.85])};
    if (staan){
      lid.handen = {hand_l:P(CAM_HAND.l), hand_r:P(CAM_HAND.r)};
      if (pl.rol === 'fotograaf'){
        const cam = new THREE.Group(); cam.position.copy(P(CAMERA)); cam.rotation.y = h; // (de lens wijst de kijkrichting in)
        cam.add(new THREE.Mesh(camGeo, zwart)); const lens = new THREE.Mesh(lensGeo, glas); lens.rotation.x = Math.PI / 2; lens.position.z = .1; cam.add(lens);
        scene.add(cam); lid.camera = cam;
      }
    } else {
      lid.schoot = {hand_l:P(SCHOOT.l), hand_r:P(SCHOOT.r)}; lid.omhoog = P(OMHOOG_R); lid.klap = P(KLAP);
      lid.zij = new THREE.Vector3(Math.cos(h), 0, -Math.sin(h)); // (links van wie op de stoel zit, gezien vanuit de persoon: +x bij kijkrichting +z)
      if (pl.rol === 'pers'){ const b = new THREE.Mesh(blocGeo, wit); b.position.copy(P([-.6, .64, -.56])); b.rotation.y = h; scene.add(b); }
      if (stoel) stoel(verplaatsPunt([-.6, 0, -.88], ZIT, plek, h), h);
    }
    lid.zet = (t = 0) => {
      if (staan){ r.zet(lid.pose, {doel:lid.handen}); return; }
      const w = GLAD(0, 1, lid.w), k = lid.klapW;
      const L = lid.schoot.hand_l.clone(), R = lid.schoot.hand_r.clone().lerp(lid.omhoog, w);
      if (k > 0){ const d = .03 + .07 * (.5 + .5 * Math.sin(t * lid.tempo + lid.fase));
        L.lerp(lid.klap.clone().addScaledVector(lid.zij, d), k); if (w < .5) R.lerp(lid.klap.clone().addScaledVector(lid.zij, -d), k * (1 - 2 * w)); }
      r.zet(lid.pose, {doel:{hand_l:L, hand_r:R}});
    };
    lid.zet();
    leden.push(lid);
  });
  const fotografen = leden.filter(l => l.camera);
  let beeld = 0;
  return {
    leden, fotografen,
    zittend:leden.filter(l => !l.staan),
    // klap = 0..1 hoe hard er geklapt wordt (clubmensen alles, pers de helft van de mensen en minder)
    stap(t, dt, {klap = 0} = {}){
      beeld++;
      const bewegers = [];
      for (const l of leden){
        if (l.staan) continue;
        const kd = l.rol === 'club' ? klap : l.rol === 'pers' && l.i % 2 === 0 ? klap * .7 : 0;
        const wOud = l.w, kOud = l.klapW;
        l.w = l.doel > l.w ? Math.min(l.doel, l.w + dt * 1.6) : Math.max(l.doel, l.w - dt * 1.2);
        l.klapW = kd > l.klapW ? Math.min(kd, l.klapW + dt * 3) : Math.max(kd, l.klapW - dt * 2);
        if (l.w !== wOud || l.klapW !== kOud || l.klapW > 0) bewegers.push(l);
      }
      // veel bewegers: om en om bijwerken (IK voor iedereen is veel rekenwerk)
      const om = bewegers.length > 8;
      for (const l of bewegers) if (!om || (beeld + l.i) % 2 === 0 || l.w !== l.doel) l.zet(t);
    },
    // waar een flits vandaan komt: de camera van een fotograaf (of null)
    flitsPlek(v){
      const f = fotografen[Math.floor(Math.random() * fotografen.length)]; if (!f) return null;
      return v.copy(f.camera.position).add(new THREE.Vector3(Math.sin(f.h), 0, Math.cos(f.h)).multiplyScalar(.15));
    },
    weg(){ for (const l of leden) scene.remove(l.r.houder); },
  };
}
