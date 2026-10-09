import * as THREE from 'three';
import { draaiBot, lijnBotUit } from './spelermodel.js';

/* ===================== Losse beweging ===================== */
// Het hulpskelet (de eenvoudige pop met heupen, knieën, schouders en ellebogen) bepaalt wát een speler doet.
// Deze laag maakt het natuurlijk: veren op elk gewricht (vertraging en uitzwaai), en bij het echte model
// bewegen bekken, rug, nek, hoofd, voeten en handen mee. Staat een speler stil, dan speelt de rustige
// animatie uit het model (ademen, gewicht verplaatsen) en vloeit die over in de eigen bewegingen.

// Hoe stijf elke veer is: benen strak (anders lopen ze achter), armen en romp losser (die zwaaien na)
const STIJF = {dL:900, dR:900, kL:900, kR:900, aL:240, aR:240, uL:240, uR:240, eL:280, eR:280, leun:200, rol:240, hoogte:520};
const DEMPING = .6; // onder 1: een beetje doorschieten, zoals een lichaam dat doet
export function veer(s, doel, dt, losheid = 1){
  if (!s.veer || !dt){ s.veer = {x:{...doel}, v:{}}; for (const k in doel) s.veer.v[k] = 0; return s.veer.x; }
  const X = s.veer.x, V = s.veer.v, n = Math.min(12, Math.ceil(dt / .008)), h = dt / n;
  for (const k in doel){
    if (X[k] === undefined){ X[k] = doel[k]; V[k] = 0; continue; }
    const kk = (STIJF[k] || 400) / losheid, c = 2 * DEMPING * Math.sqrt(kk);
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
const _lq = new THREE.Quaternion();
const klem = (v, a) => Math.max(-a, Math.min(a, v));

// c: {dt, v, sprint, fase, h (hoeken na de veren), actief (houding), trap (trapt hij nu), keeper, z, naarBal (hoek), kijk, balHoogte, balAfstand}
export function volgModel(s, c){
  const m = s.model, B = m.botten, st = m.stijl || {arm:1, pas:1, houding:0};
  if (!m.qa){ m.qa = {}; for (const n in B) m.qa[n] = new THREE.Quaternion(); }
  // 1. stilstaan: de animatie uit het model. Lopen, een houding of een trap nemen het over
  const rust = c.v < .5 && !c.actief && !c.trap && c.z < .1;
  m.wIdle = m.wIdle === undefined ? (rust ? 1 : 0) : m.wIdle + ((rust ? 1 : 0) - m.wIdle) * Math.min(1, c.dt * 4);
  const w = m.idle ? m.wIdle : 0;
  if (m.mixer) m.mixer.update(c.dt);
  for (const n in B) m.qa[n].copy(B[n].quaternion);
  // 2. romp en voeten: ruststand gemengd met de animatie, en daar bovenop de loopbeweging
  for (const n of ROMP) if (B[n]) B[n].quaternion.copy(B[n].userData.rust).slerp(m.qa[n], w);
  s.root.updateMatrixWorld(true);
  m.obj.getWorldQuaternion(_lq);
  const f = c.fase, sp = c.sprint * (1 - w), sn = Math.sin(f), cs = Math.cos(f);
  draaiBot(B.pelvis, _lq, 0, 1, 0, .2 * sn * sp * st.pas);           // heupen draaien mee met het voorste been
  draaiBot(B.pelvis, _lq, 0, 0, 1, .07 * cs * sp);                     // en wiegen naar het standbeen
  const tegen = -.32 * sn * sp * st.arm, buig = (.16 * sp + st.houding * .25) * (1 - w);
  [['spine_01', .3], ['spine_02', .3], ['spine_03', .4]].forEach(([n, d]) => { draaiBot(B[n], _lq, 0, 1, 0, tegen * d); draaiBot(B[n], _lq, 1, 0, 0, buig * d); }); // schouders tegen de heupen in, iets voorover
  // kijken naar de bal (begrensd), zachtjes: nek een deel, hoofd de rest
  const rel = klem(hoekVerschil(c.kijk, c.naarBal), 1.15), omlaag = klem(Math.atan2(1.6 - c.balHoogte, Math.max(1, c.balAfstand)) * .6, .5);
  m.kijkY = m.kijkY === undefined ? rel : m.kijkY + (rel - m.kijkY) * Math.min(1, c.dt * 5);
  m.kijkX = m.kijkX === undefined ? omlaag : m.kijkX + (omlaag - m.kijkX) * Math.min(1, c.dt * 5);
  const kijkGewicht = c.actief === 'val' || c.actief === 'sliding' || c.actief === 'omhaal' ? .3 : 1;
  draaiBot(B.neck_01, _lq, 0, 1, 0, m.kijkY * .4 * kijkGewicht); draaiBot(B.head, _lq, 0, 1, 0, m.kijkY * .6 * kijkGewicht);
  draaiBot(B.neck_01, _lq, 1, 0, 0, m.kijkX * .4 * kijkGewicht); draaiBot(B.head, _lq, 1, 0, 0, m.kijkX * .6 * kijkGewicht);
  // sleutelbeenderen gaan een beetje mee met de armzwaai
  draaiBot(B.clavicle_l, _lq, 1, 0, 0, -.12 * c.h.aR); draaiBot(B.clavicle_r, _lq, 1, 0, 0, -.12 * c.h.aL);
  // 3. armen en benen volgen het hulpskelet (en bij stilstaan de animatie)
  for (const [bot, hulp] of KOPPEL){ const b = B[bot]; if (!b) continue; lijnBotUit(b, hulp(s), b.userData.rust); if (w > .002){ b.quaternion.slerp(m.qa[bot], w); b.updateMatrixWorld(true); } }
  // 4. voeten: tenen omlaag als het been achter is (afzetten), hiel eerst bij het neerzetten; bij een trap de wreef gestrekt
  const voet = (n, d, schop) => draaiBot(B[n], _lq, 1, 0, 0, ((schop ? .75 : Math.max(0, -d) * .55 - Math.max(0, d) * .25) * (1 - w)));
  voet('foot_l', c.h.dR, c.trap === 'R'); voet('foot_r', c.h.dL, c.trap === 'L');
}
function hoekVerschil(a, b){ let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
