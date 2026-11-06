import * as THREE from 'three';
import { naamVan, richtBot } from '../spelermodel.js';
import { qrot } from './voetbal-anim.js';

/* ===================== Animatiedata op het spelersmodel zetten ===================== */
// De animaties (anim/*.json) hebben een eigen skelet in T-houding; ons model (speler.glb) heeft Unreal-botten en een
// andere ruststand. Daarom nemen we geen draaiingen over, maar richtingen: elk bot gaat in dezelfde richting wijzen als
// het bot in de animatie (in de data wijst elk bot langs zijn eigen +Y). Armen en benen gaan met IK naar de plek van
// de hand en de voet uit de animatie, met de elleboog en de knie als richtpunt: zo kloppen de contactmomenten
// (pen op papier, handdruk, shirt omhoog) en blijven de voeten op de vloer, ook al zijn de verhoudingen anders.
// De hele speler hangt in een houder op de schaal van de animatie (heup op 0,95 m), dus props en camera passen zo.

const ROMP = [ // [bot in de animatie, bot in het model, kind in het model (voor de richting)]
  ['Hips', 'pelvis', 'spine_01'], ['Spine', 'spine_01', 'spine_02'], ['Spine1', 'spine_02', 'spine_03'], ['Spine1', 'spine_03', 'neck_01'],
  ['Neck', 'neck_01', 'head'], ['Head', 'head', null],
  ['LeftShoulder', 'clavicle_l', 'upperarm_l'], ['RightShoulder', 'clavicle_r', 'upperarm_r'],
];
const LEDEN = [ // two-bone-IK: [boven, onder, eind] in de animatie en in het model
  [['LeftArm', 'LeftForeArm', 'LeftHand'], ['upperarm_l', 'lowerarm_l', 'hand_l']],
  [['RightArm', 'RightForeArm', 'RightHand'], ['upperarm_r', 'lowerarm_r', 'hand_r']],
  [['LeftUpLeg', 'LeftLeg', 'LeftFoot'], ['thigh_l', 'calf_l', 'foot_l']],
  [['RightUpLeg', 'RightLeg', 'RightFoot'], ['thigh_r', 'calf_r', 'foot_r']],
];
const EIND_KIND = {hand_l:/^middle_01/, hand_r:/^middle_01/, foot_l:/^ball/, foot_r:/^ball/};
const ANIM_HEUP = .95;

const _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _y = new THREE.Vector3(0, 1, 0);
function inModel(bot, obj, uit){ uit.identity(); const keten = []; for (let o = bot; o && o !== obj; o = o.parent) keten.push(o); for (let i = keten.length - 1; i >= 0; i--) uit.multiply(keten[i].quaternion); return uit; }
const V = a => new THREE.Vector3(a[0], a[1], a[2]);

// m = maakModelSpeler(...). Geeft {houder, zet(pose, extra)} terug; pose = anim.wereldPose(naam, t)
export function maakRetarget(m){
  const {obj, botten} = m, houder = new THREE.Group();
  houder.add(obj);
  // vaste kinderen voor de richting (het model kiest anders soms een vinger of een been als kind)
  const alle = {}; obj.traverse(o => { if (o.isBone) alle[naamVan(o)] = o; });
  const zetRichting = (b, kind) => { if (b && kind) b.userData.richting = kind.position.clone().normalize(); };
  for (const [, mb, kb] of ROMP) if (kb) zetRichting(botten[mb], alle[kb]);
  for (const [, [b, o, e]] of LEDEN){ zetRichting(botten[b], botten[o]); zetRichting(botten[o], botten[e]);
    const eind = botten[e], kind = eind && eind.children.find(c => c.isBone && EIND_KIND[e].test(naamVan(c))); if (kind) zetRichting(eind, kind); }
  // het hoofd heeft geen kind: zijn "richting" is omhoog in de ruststand (net als het hoofd in de animatie)
  const rustAlles = () => { for (const n in botten) botten[n].quaternion.copy(botten[n].userData.rust); };
  rustAlles();
  if (botten.head) botten.head.userData.richting = _y.clone().applyQuaternion(inModel(botten.head, obj, _q).invert()).normalize();
  // schaal: de heup van het model op de heuphoogte van de animatie
  houder.updateMatrixWorld(true);
  const heup = botten.pelvis.getWorldPosition(new THREE.Vector3()).y || .5;
  houder.scale.setScalar(ANIM_HEUP / heup);
  m.mixer = null; // (de rustanimatie van het model zou alles overschrijven)

  const naarModel = (wereld) => wereld.clone().transformDirection(_m.copy(obj.matrixWorld).invert());
  const richt = (bot, wereldRichting) => { if (bot) richtBot(bot, naarModel(wereldRichting), obj); };
  const wp = b => b.getWorldPosition(new THREE.Vector3());
  // IK: boven-, onderbot en eind; doel (eindplek) en pool (knie/elleboog) in de wereld
  function ik(boven, onder, eind, doel, pool){
    obj.updateMatrixWorld(true);
    const S = wp(boven), E0 = wp(onder), H0 = wp(eind);
    const a = S.distanceTo(E0), b = E0.distanceTo(H0), naar = doel.clone().sub(S);
    const d = Math.min(Math.max(naar.length(), 1e-4), (a + b) * .999), dir = naar.normalize();
    const x = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - x * x));
    const p = pool.clone().sub(S); p.addScaledVector(dir, -p.dot(dir));
    if (p.lengthSq() < 1e-8) p.copy(E0).sub(S).addScaledVector(dir, -E0.clone().sub(S).dot(dir));
    p.normalize();
    const E = S.clone().addScaledVector(dir, x).addScaledVector(p, h), H = S.clone().addScaledVector(dir, d);
    richt(boven, E.clone().sub(S));
    richt(onder, H.sub(E));
  }
  // extra: {doel:{hand_r: Vector3, ...}} om een hand op een prop te zetten (anders de plek uit de animatie)
  function zet(pose, extra = {}){
    rustAlles();
    const h = pose.Hips, f = qrot(h.r, [0, 0, 1]);
    houder.position.set(h.t[0], h.t[1] - ANIM_HEUP, h.t[2]);
    houder.rotation.set(0, Math.atan2(f[0], f[2]), 0);
    houder.updateMatrixWorld(true);
    for (const [ab, mb] of ROMP) richt(botten[mb], V(qrot(pose[ab].r, [0, 1, 0])));
    for (const [[ab, ao, ae], [b, o, e]] of LEDEN){
      if (!botten[b] || !botten[o] || !botten[e]) continue;
      const doel = (extra.doel && extra.doel[e]) || V(pose[ae].t);
      ik(botten[b], botten[o], botten[e], doel, V(pose[ao].t));
      richt(botten[e], V(qrot(pose[ae].r, [0, 1, 0])));
    }
    houder.updateMatrixWorld(true);
  }
  return {houder, zet, botten};
}
