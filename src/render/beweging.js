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
// Houdingen waarbij het hoofd niet naar de bal draait
const GEEN_KIJKEN = new Set(['val', 'struikel', 'sliding', 'omhaal', 'kniel', 'kopstoot', 'spreid', 'volley', 'juich']);
const klem = (v, a) => Math.max(-a, Math.min(a, v));

// c: {dt, v, sprint, fase, h (hoeken na de veren), actief (houding), trap ({k: 0-1 door de trap, kc: moment van contact, kracht} of null), keeper, z, naarBal, kijk, balHoogte, balAfstand}
export function volgModel(s, c){
  const m = s.model, B = m.botten, st = m.stijl || {arm:1, pas:1, houding:0};
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
  if (c.trap){ const {k, kc, kracht} = c.trap; heupTrap = (k < kc ? .5 * (k / kc) : k < kc + .3 ? .5 - ((k - kc) / .3) * 1.1 : -.6 * (1 - (k - kc - .3) / (.7 - kc))) * kracht;
    rompTrap = (k < kc ? -.12 * (k / kc) : k < kc + .3 ? -.12 + ((k - kc) / .3) * .3 : .18 * (1 - (k - kc - .3) / (.7 - kc))) * kracht; }
  draaiBot(B.pelvis, m.obj, 0, 1, 0, .35 * sn * sp * st.pas + heupTrap);  // heupen draaien mee met het voorste been
  draaiBot(B.pelvis, m.obj, 0, 0, 1, .1 * cs * sp);                       // en wiegen naar het standbeen
  const tegen = -.45 * sn * sp * st.arm - heupTrap * .75, buig = (.25 * sp + st.houding * .25) * (1 - w) + rompTrap;
  [['spine_01', .3], ['spine_02', .3], ['spine_03', .4]].forEach(([n, d]) => { draaiBot(B[n], m.obj, 0, 1, 0, tegen * d); draaiBot(B[n], m.obj, 1, 0, 0, buig * d); }); // schouders tegen de heupen in, iets voorover
  // Kijken naar de bal, ten opzichte van de borst (die draait zelf al mee met de looppas). Ligt de bal achter hem,
  // dan kijkt hij gewoon vooruit (anders zwiept het hoofd van schouder naar schouder); ligt de bal vlakbij, dan alleen
  // iets omlaag. Bij liggen, duiken, koppen en trappen volgt het hoofd de romp.
  const borstDraai = .35 * sn * sp * st.pas + heupTrap + tegen;
  const ruw = hoekVerschil(c.kijk + borstDraai, c.naarBal), dichtbij = c.balAfstand < 2;
  const geenKijken = GEEN_KIJKEN.has(c.actief) || c.z > .25 || !!c.trap;
  // met een marge rond 'achter hem' (wel onder 1,5 rad, niet meer boven 1,9), anders springt hij steeds tussen kijken en niet kijken
  m.kijkt = !geenKijken && (m.kijkt ? Math.abs(ruw) < 1.9 : Math.abs(ruw) < 1.5);
  const kijkt = m.kijkt;
  const doelY = kijkt && !dichtbij ? klem(ruw, .9) : 0, doelX = !kijkt ? 0 : dichtbij ? .35 : klem(Math.atan2(1.6 - c.balHoogte, c.balAfstand) * .6, .45);
  // de echte draaiing van het hoofd gaat er zacht naartoe, hoogstens 2 rad/s per richting
  const stap = (huidig, doel) => huidig === undefined ? doel : huidig + klem((doel - huidig) * Math.min(1, c.dt * 6), 2 * c.dt);
  m.kijkY = stap(m.kijkY, doelY); m.kijkX = stap(m.kijkX, doelX);
  draaiBot(B.neck_01, m.obj, 0, 1, 0, m.kijkY * .4); draaiBot(B.head, m.obj, 0, 1, 0, m.kijkY * .6);
  draaiBot(B.neck_01, m.obj, 1, 0, 0, m.kijkX * .4); draaiBot(B.head, m.obj, 1, 0, 0, m.kijkX * .6);
  // sleutelbeenderen gaan een beetje mee met de armzwaai
  draaiBot(B.clavicle_l, m.obj, 1, 0, 0, -.12 * c.h.aR); draaiBot(B.clavicle_r, m.obj, 1, 0, 0, -.12 * c.h.aL);
  // 3. armen en benen volgen het hulpskelet (en bij stilstaan de animatie)
  for (const [bot, hulp] of KOPPEL){ const b = B[bot]; if (!b) continue; lijnBotUit(b, hulp(s), b.userData.rust, m.obj); if (w > .002) b.quaternion.slerp(m.qa[bot], w); }
  // 4. voeten: tenen omlaag als het been achter is (afzetten), hiel eerst bij het neerzetten; bij een trap de wreef gestrekt
  const voet = (n, d, schop) => draaiBot(B[n], m.obj, 1, 0, 0, ((schop ? .75 : Math.max(0, -d) * .55 - Math.max(0, d) * .25) * (1 - w)));
  voet('foot_l', c.h.dR, c.trap && c.trap.k > c.trap.kc - .1); voet('foot_r', c.h.dL, false);
}
function hoekVerschil(a, b){ let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
