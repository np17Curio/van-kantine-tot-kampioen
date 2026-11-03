import * as THREE from 'three';
import { draaiBot, lijnBotUit, richtBot } from './spelermodel.js';
import { POP } from './looppas.js';
import { bw } from './beweging-instellingen.js';

/* ===================== Losse beweging ===================== */
// Het hulpskelet (de eenvoudige pop met heupen, knieën, schouders en ellebogen) bepaalt wát een speler doet.
// Deze laag maakt het natuurlijk: veren op elk gewricht (vertraging en uitzwaai), en bij het echte model
// bewegen bekken, rug, nek, hoofd, voeten en handen mee. Staat een speler stil, dan speelt de rustige
// animatie uit het model (ademen, gewicht verplaatsen) en vloeit die over in de eigen bewegingen.

// Hoe stijf elke veer is: benen strak (anders lopen ze achter), armen en romp losser (die zwaaien na).
// De getallen staan in beweging-instellingen.js (Veren); de demping onder 1 geeft een beetje doorschieten, zoals een lichaam dat doet
const STIJF_GROEP = {dL:'veerBenen', dR:'veerBenen', kL:'veerBenen', kR:'veerBenen', aL:'veerArmen', aR:'veerArmen', uL:'veerArmen', uR:'veerArmen', eL:'veerEllebogen', eR:'veerEllebogen', leun:'veerRomp'};
const stijf = (k, B) => k === 'hoogte' ? 520 : k === 'rol' ? B.veerRomp * 1.2 : B[STIJF_GROEP[k]] || 400;
export function veer(s, doel, dt, losheid = 1){
  if (!s.veer || !dt){ s.veer = {x:{...doel}, v:{}}; for (const k in doel) s.veer.v[k] = 0; return s.veer.x; }
  const X = s.veer.x, V = s.veer.v, n = Math.min(12, Math.ceil(dt / .008)), h = dt / n, B = bw();
  for (const k in doel){
    if (X[k] === undefined){ X[k] = doel[k]; V[k] = 0; continue; }
    const kk = stijf(k, B) / losheid, c = 2 * B.demping * Math.sqrt(kk);
    let x = X[k], v = V[k];
    for (let i = 0; i < n; i++){ v += (kk * (doel[k] - x) - c * v) * h; x += v * h; }
    X[k] = x; V[k] = v;
  }
  return X;
}

// Welk hulpbot hoort bij welk echt bot (de linkerkant van het model zit aan +x, waar de hulppop zijn 'R'-ledematen heeft)
export const KOPPEL = [['thigh_l', s => s.R.dij], ['calf_l', s => s.R.knie], ['thigh_r', s => s.L.dij], ['calf_r', s => s.L.knie],
  ['upperarm_l', s => s.RA.sch], ['lowerarm_l', s => s.RA.elleboog], ['upperarm_r', s => s.LA.sch], ['lowerarm_r', s => s.LA.elleboog]];
const ROMP = ['pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01', 'head', 'clavicle_l', 'clavicle_r', 'foot_l', 'foot_r'];
// Houdingen waarbij het hoofd niet naar de bal draait
const GEEN_KIJKEN = new Set(['val', 'struikel', 'sliding', 'omhaal', 'kniel', 'kopstoot', 'spreid', 'volley', 'juich']);
const klem = (v, a) => Math.max(-a, Math.min(a, v));

// c: {dt, v, sprint, fase, h (hoeken na de veren), actief (houding), trap ({k: 0-1 door de trap, kc: moment van contact, kracht} of null), keeper, z, naarBal, kijk, balHoogte, balAfstand}
export function volgModel(s, c){
  const m = s.model, B = m.botten, st = m.stijl || {arm:1, pas:1, houding:0}, W = bw();
  if (!m.qa){ m.qa = {}; for (const n in B) m.qa[n] = new THREE.Quaternion(); }
  // 1. stilstaan: de animatie uit het model. Lopen, een houding of een trap nemen het over
  const rust = c.v < .5 && !c.actief && !c.trap && c.z < .1;
  m.wIdle = m.wIdle === undefined ? (rust ? 1 : 0) : m.wIdle + ((rust ? 1 : 0) - m.wIdle) * Math.min(1, c.dt * 4);
  const w = m.idle ? m.wIdle : 0;
  if (m.mixer) m.mixer.update(c.dt);
  // Alleen botten met een eigen spoor in de animatie nemen die stand over. De andere (hoofd, bekken) houden hier
  // anders de stand van het vorige beeld vast, en dan stapelt elke draaiing zich op (rollende hoofden).
  for (const n in B) m.qa[n].copy(m.metSpoor && m.metSpoor.has(n) ? B[n].quaternion : B[n].userData.rust);
  // 2. romp en voeten: ruststand gemengd met de animatie, en daar bovenop de loopbeweging
  for (const n of ROMP) if (B[n]) B[n].quaternion.copy(B[n].userData.rust).slerp(m.qa[n], w);
  s.root.updateMatrixWorld(true); // voor de richting van het hulpskelet en de stand van het model in de wereld
  const f = c.fase, sp = c.sprint * (1 - w), sn = Math.sin(f), cs = Math.cos(f);
  // trap: de heup van het schopbeen (links, +x) draait in de aanzet naar achter en zwaait door de bal heen; de schouders gaan tegen
  // de heupen in, de romp leunt in de aanzet achterover en komt in de doorzwaai mee
  let heupTrap = 0, rompTrap = 0;
  if (c.trap){ const {k, kc, kracht} = c.trap; heupTrap = (k < kc ? (k / kc) : k < kc + .3 ? 1 - ((k - kc) / .3) * 2.2 : -1.2 * (1 - (k - kc - .3) / (.7 - kc))) * W.schotHeup * kracht;
    rompTrap = (k < kc ? -.12 * (k / kc) : k < kc + .3 ? -.12 + ((k - kc) / .3) * .3 : .18 * (1 - (k - kc - .3) / (.7 - kc))) * kracht; }
  draaiBot(B.pelvis, m.obj, 0, 1, 0, W.bekkenDraai * sn * sp * st.pas + heupTrap);  // heupen draaien mee met het voorste been
  draaiBot(B.pelvis, m.obj, 0, 0, 1, W.bekkenWieg * cs * sp);                       // en wiegen naar het standbeen
  const tegen = -W.schouderTegen * sn * sp * st.arm - heupTrap * .75, buig = (W.rugVoorover * sp + st.houding * .25) * (1 - w) + rompTrap;
  [['spine_01', .3], ['spine_02', .3], ['spine_03', .4]].forEach(([n, d]) => { draaiBot(B[n], m.obj, 0, 1, 0, tegen * d); draaiBot(B[n], m.obj, 1, 0, 0, buig * d); }); // schouders tegen de heupen in, iets voorover
  // Kijken naar de bal, ten opzichte van de borst (die draait zelf al mee met de looppas). Ligt de bal achter hem,
  // dan kijkt hij gewoon vooruit (anders zwiept het hoofd van schouder naar schouder); ligt de bal vlakbij, dan alleen
  // iets omlaag. Bij liggen, duiken, koppen en trappen volgt het hoofd de romp.
  const borstDraai = W.bekkenDraai * sn * sp * st.pas + heupTrap + tegen;
  const ruw = hoekVerschil(c.kijk + borstDraai, c.naarBal), dichtbij = c.balAfstand < 2;
  const geenKijken = GEEN_KIJKEN.has(c.actief) || c.z > .25 || !!c.trap;
  // met een marge rond 'achter hem' (wel onder 1,5 rad, niet meer boven 1,9), anders springt hij steeds tussen kijken en niet kijken
  m.kijkt = !geenKijken && (m.kijkt ? Math.abs(ruw) < 1.9 : Math.abs(ruw) < 1.5);
  const kijkt = m.kijkt;
  const doelY = kijkt && !dichtbij ? klem(ruw, W.hoofdMax) : 0, doelX = !kijkt ? 0 : dichtbij ? .35 : klem(Math.atan2(1.6 - c.balHoogte, c.balAfstand) * .6, .45);
  // de echte draaiing van het hoofd gaat er zacht naartoe, hoogstens 2 rad/s per richting
  const stap = (huidig, doel) => huidig === undefined ? doel : huidig + klem((doel - huidig) * Math.min(1, c.dt * W.hoofdSnelheid), 2 * c.dt);
  m.kijkY = stap(m.kijkY, doelY); m.kijkX = stap(m.kijkX, doelX);
  draaiBot(B.neck_01, m.obj, 0, 1, 0, m.kijkY * .4); draaiBot(B.head, m.obj, 0, 1, 0, m.kijkY * .6);
  draaiBot(B.neck_01, m.obj, 1, 0, 0, m.kijkX * .4); draaiBot(B.head, m.obj, 1, 0, 0, m.kijkX * .6);
  // sleutelbeenderen gaan een beetje mee met de armzwaai
  draaiBot(B.clavicle_l, m.obj, 1, 0, 0, -.12 * c.h.aR); draaiBot(B.clavicle_r, m.obj, 1, 0, 0, -.12 * c.h.aL);
  // 3. armen en benen volgen het hulpskelet (en bij stilstaan de animatie)
  for (const [bot, hulp] of KOPPEL){ const b = B[bot]; if (!b) continue; lijnBotUit(b, hulp(s), b.userData.rust, m.obj); if (w > .002) b.quaternion.slerp(m.qa[bot], w); }
  // 3b. voeten vast op de grond: de benen van het model met hun eigen lengtes naar de enkel van het hulpskelet (looppas.js)
  const wIK = (c.wIK || 0) * (1 - w);
  if (wIK > .01){ beenIK(s, m, 'thigh_l', 'calf_l', 'foot_l', s.R, wIK); beenIK(s, m, 'thigh_r', 'calf_r', 'foot_r', s.L, wIK); }
  // 4. voeten: in de looppas de kanteling uit looppas.js (hiel eerst, tenen afzetten); anders tenen omlaag als het been achter is.
  // Bij een trap de wreef gestrekt
  const voet = (n, d, schop, lp) => draaiBot(B[n], m.obj, 1, 0, 0, ((schop ? .75 : (Math.max(0, -d) * W.voetAfzet - Math.max(0, d) * .25) * (1 - wIK) + (lp || 0) * W.voetAfzet / .55) * (1 - w)));
  voet('foot_l', c.h.dR, c.trap && c.trap.k > c.trap.kc - .1, c.voet && c.voet.R); voet('foot_r', c.h.dL, false, c.voet && c.voet.L);
}
// Two-bone IK op de botten van het model, in de ruimte van het model (daar is de schaal overal gelijk).
// De enkel moet op de enkel van het hulpskelet; de knie in het vlak van heup, enkel en de knie van het hulpskelet.
// Is het been van het model langer of korter, dan staat het heupgewricht ook zoveel hoger of lager: verschuif het doel mee.
const _H = new THREE.Vector3(), _K = new THREE.Vector3(), _F = new THREE.Vector3(), _pH = new THREE.Vector3(), _pK = new THREE.Vector3(), _pA = new THREE.Vector3(), _t = new THREE.Vector3(), _n = new THREE.Vector3();
const _q0 = new THREE.Quaternion(), _q1 = new THREE.Quaternion();
function beenIK(s, m, dij, kuit, voet, hulp, gewicht){
  const B = m.botten, obj = m.obj, b1 = B[dij], b2 = B[kuit], b3 = B[voet]; if (!b1 || !b2 || !b3) return;
  const inM = (o, v) => obj.worldToLocal(o.getWorldPosition(v));
  obj.updateMatrixWorld(true);
  inM(b1, _H); inM(b2, _K); inM(b3, _F);
  const a = m.beenA || (m.beenA = {}), lA = a[dij] || (a[dij] = _H.distanceTo(_K)), lB = a[kuit] || (a[kuit] = _K.distanceTo(_F));
  // het hulpskelet: heup, knie en enkel (in de ruimte van het model)
  obj.worldToLocal(hulp.dij.getWorldPosition(_pH)); obj.worldToLocal(hulp.knie.getWorldPosition(_pK)); obj.worldToLocal(hulp.knie.localToWorld(_pA.set(0, -POP.scheen, 0)));
  const popLen = _pH.distanceTo(_pK) + _pK.distanceTo(_pA);
  _t.copy(_pA).sub(_pH).add(_H); _t.y -= (lA + lB) - popLen;                         // het enkeldoel voor dit model
  const naar = _t.clone().sub(_H), d = Math.min(lA + lB - 1e-4, Math.max(Math.abs(lA - lB) + 1e-4, naar.length())), dir = naar.normalize();
  const pool = _n.copy(_pK).sub(_pH), loodrecht = pool.sub(dir.clone().multiplyScalar(pool.dot(dir)));
  if (loodrecht.lengthSq() < 1e-8) loodrecht.set(0, 0, 1); loodrecht.normalize();
  const langs = (lA * lA - lB * lB + d * d) / (2 * d), hoog = Math.sqrt(Math.max(0, lA * lA - langs * langs));
  const knie = _H.clone().addScaledVector(dir, langs).addScaledVector(loodrecht, hoog), enkel = _H.clone().addScaledVector(dir, d);
  _q0.copy(b1.quaternion); richtBot(b1, knie.clone().sub(_H), obj); _q1.copy(b1.quaternion); b1.quaternion.copy(_q0).slerp(_q1, gewicht);
  obj.updateMatrixWorld(true); inM(b2, _K);
  _q0.copy(b2.quaternion); richtBot(b2, enkel.sub(_K), obj); _q1.copy(b2.quaternion); b2.quaternion.copy(_q0).slerp(_q1, gewicht);
}
function hoekVerschil(a, b){ let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
