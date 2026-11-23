/* ===================== Animaties van de pixelspeler ===================== */
// Elke animatie is een lijst frames in het pose-formaat van de stijlbron (art/chibi_anims.px.js):
//   x (heup), y of hoog, lL/lR [dij, kniebuiging], aL/aR [bovenarm, elleboog], hd [dx, dy], hand, arm, bal
// Extra per frame: lig {rot, cx, cy} (de hele speler gedraaid, bijvoorbeeld liggend), flip (gespiegeld), extra(c, o) (iets erbij tekenen).
// Of een functie (c, v) die zelf tekent. fps: beelden per seconde; loop: steeds opnieuw, anders blijft het laatste beeld staan.
//
// ORIGINEEL: de vijf animaties van de stijlbron, letterlijk (met de bal en de verplaatsing in het beeld): alleen om te vergelijken.
// De rest is voor het spel: de heup staat steeds op x = ANKER_X (de speler beweegt zelf in de 3D-wereld) en er is geen bal
// (de echte bal vliegt in 3D).
import { GROND, Img, Doek, speler, sprite } from './rig.js';

export const ANKER_X = 46;
const sta = {x:40, lL:[-5, 10], lR:[10, 15], aL:[-25, 30], aR:[25, 30]};
const hurk = {x:40, lL:[45, 90], lR:[50, 95], aL:[-30, 40], aR:[30, 40], hd:[0, 1]};
const klaar = {x:36, lL:[30, 70], lR:[35, 75], aL:[-50, 70], aR:[50, 70], hand:'q', hd:[0, 1]};

// ---------- de stijlbron, letterlijk ----------
// Wandelen (stijlbron, contract: 'loop'): rustiger dan rennen, zonder veertje
export function loopCyclus(x){
  const loop = [];
  for (let i = 0; i < 8; i++){ const t = i / 8 * Math.PI * 2, been = f => [24 * Math.sin(f), 10 + 30 * Math.max(0, Math.cos(f))];
    loop.push({x, lL:[-4, 4], lR:been(t), aR:[-25 * Math.sin(t), 30], aL:[25 * Math.sin(t), 30], zij:true}); loop[i].lL = been(t + Math.PI); }
  return loop;
}
function renCyclus(x, amp = 38, knie = 60, arm = 45, basis = 20){
  const ren = [];
  for (let i = 0; i < 8; i++){
    const t = i / 8 * Math.PI * 2, been = f => [amp * Math.sin(f), basis + knie * Math.max(0, Math.cos(f))];
    ren.push({x, lR:been(t), lL:been(t + Math.PI), aR:[-arm * Math.sin(t), 70], aL:[arm * Math.sin(t), 70], hoog:Math.abs(Math.sin(t)) < .4 ? 1 : 0, zij:true}); // (zijaanzicht: het lijf draait mee met de looprichting)
  }
  return ren;
}
const B0 = [58, GROND - 5];
const SCHIET = ([
  {...sta, bal:B0},
  {x:38, lL:[-5, 15], lR:[-40, 70], aL:[-60, 20], aR:[35, 40], bal:B0},
  {x:37, lL:[0, 25], lR:[-65, 95], aL:[-80, 10], aR:[50, 40], hd:[-1, 1], bal:B0},
  {x:42, lL:[-10, 20], lR:[35, 15], aL:[-90, 0], aR:[10, 50], hd:[1, 0], bal:B0},
  {x:44, lL:[-15, 10], lR:[75, 5], aL:[-100, 0], aR:[-10, 60], hd:[2, 0], bal:[74, GROND - 14]},
  {x:44, lL:[-15, 10], lR:[95, 10], aL:[-95, 10], aR:[-20, 60], hd:[2, -1], bal:[90, GROND - 24]},
  {x:43, lL:[-10, 15], lR:[40, 40], aL:[-60, 20], aR:[10, 40], hd:[1, 0]},
  {...sta},
]).map(P => ({...P, zij:true})); // (stijlbron: schieten in zijaanzicht)
const SPRING = [
  {...sta}, {...hurk},
  {x:40, lL:[-5, 5], lR:[0, 5], aL:[-150, 10], aR:[150, 10], hoog:6, hd:[0, -1]},
  {x:40, lL:[55, 100], lR:[60, 105], aL:[-165, 0], aR:[165, 0], hoog:16},
  {x:40, lL:[50, 95], lR:[55, 100], aL:[-160, 0], aR:[160, 0], hoog:18},
  {x:40, lL:[20, 40], lR:[25, 45], aL:[-120, 20], aR:[120, 20], hoog:8},
  {...hurk}, {...sta},
];
const kopLucht = (hoog, hd, bal) => ({x:38, lL:[30, 80], lR:[20, 60], aL:[-110, 10], aR:[110, 10], hoog, hd, bal});
const KOP = [
  {...sta, bal:[92, 16]}, {...hurk, bal:[82, 20]},
  kopLucht(8, [0, 0], [72, 23]), kopLucht(14, [-2, 0], [62, 25]), kopLucht(16, [4, 1], [54, 27]), kopLucht(14, [3, 1], [72, 16]),
  {x:38, lL:[20, 40], lR:[25, 45], aL:[-80, 20], aR:[80, 20], hoog:6, bal:[90, 8]},
  {...hurk},
  // de kopbeweging zelf (het veld kiest ze op de afstand tot de bal, veld3d): 8 aanspannen (hoofd en rug naar achteren, de benen
  // opgetrokken, de armen naar voren voor de balans), 9 de klap (het hoofd vooruit en omlaag tegen de bal, de armen zwaaien
  // naar achteren, de benen schieten naar voren) en 10 uitkomen (het hoofd blijft voor, het lijf ontspant)
  // (van opzij, zoals bij schieten: dan zie je het hoofd echt naar achteren en naar voren gaan)
  {x:36, lL:[-10, 95], lR:[-20, 85], aL:[50, 40], aR:[80, 30], hoog:15, hd:[-4, -2], zij:true},
  {x:39, lL:[40, 50], lR:[25, 40], aL:[-80, 25], aR:[-55, 35], hoog:15, hd:[6, 3], zij:true},
  {x:39, lL:[30, 65], lR:[15, 55], aL:[-45, 20], aR:[-25, 30], hoog:12, hd:[4, 3], zij:true},
];
// de gestrekte duikhouding (70×90), zoals de stijlbron hem stempelt
const DUIK_P = {x:35, y:58, lL:[-6, 0], lR:[6, 5], aL:[-172, 0], aR:[172, 0], hand:'q', arm:2.2, hd:[0, 5]};
const duikhouding = v => sprite(70, 90, c => speler(c, DUIK_P, v));
// De duik in vier fasen, minder stijf dan één gestrekte plank (hoeken: 0 = omlaag, 180 = omhoog; tweede getal = hoe ver de knie/elleboog buigt):
// afzetten (het afzetbeen gestrekt, het andere been opgetrokken, de armen gaan omhoog), vliegen (een knie opgetrokken, de armen
// gestrekt naar de bal), het hoogste punt (helemaal uitgestrekt, de benen iets uit elkaar) en landen (knieën gebogen, de armen trekken de bal in)
const DUIK_FASEN = [
  {...DUIK_P, lL:[-14, 45], lR:[8, 2], aL:[-162, 14], aR:[166, -8], hd:[0, 4]},
  {...DUIK_P, lL:[-18, 55], lR:[10, 18], aL:[-170, 6], aR:[174, -4], hd:[1, 4]},
  {...DUIK_P, lL:[-12, 14], lR:[14, 28], aL:[-176, 0], aR:[178, 0], hd:[1, 5]},
  {...DUIK_P, lL:[-22, 60], lR:[12, 70], aL:[-166, 34], aR:[168, -34], arm:1.8, hd:[0, 4]}, // (de armen blijven boven het hoofd: plat op de grond zou een arm anders in het gras steken)
  // geland met de bal: hij klemt hem tegen zijn borst, de ellebogen gebogen, de knieën iets opgetrokken (de bal wordt erbij getekend)
  {...DUIK_P, lL:[-16, 40], lR:[10, 50], aL:[-30, 125], aR:[30, -125], arm:1, hd:[0, 4], vang:true},
  // geland zonder bal (naast, of erin): de armen komen terug langs het lijf, het lichaam ontspant
  {...DUIK_P, lL:[-14, 30], lR:[12, 45], aL:[-18, 25], aR:[22, -30], arm:1, hd:[0, 4]},
];
const duikFase = (P, v) => sprite(70, 90, c => { speler(c, P, v); if (P.vang){ c.stamp(BAL, 30, 45); vuist(c, 29, 51, 'q'); vuist(c, 42, 51, 'q'); } }); // (de gevangen bal tegen zijn borst, de handschoenen er aan weerszijden om)
const DUIK_LUCHT = [[45, 22, 2, [116, 32]], [75, 34, -4, [114, 36]], [90, 46, -6, [117, 30]], [95, 52, 6, [122, 47]], [90, 50, 18, [121, 55]], [90, 50, 19, [121, 56]]];
import { BAL, vuist } from './rig.js';

// ---------- dribbelen en voorbij (stijlbron, deel 6 en 7) ----------
// balVoor: de afstand van de bal tot de heup per frame (bij frame 2 tikt de rechtervoet hem aan). Het veld zet de 3D-bal ook op die afstand.
export const BAL_VOOR = [15, 14, 13, 17, 20, 21, 19, 17];
const REN = renCyclus(40);
// De tegenstander in de stijlbron heeft eigen kleuren (UIT). Hier: zijn sleutels omzetten naar cijfers, die in rig.js ORIGINEEL de UIT-kleuren zijn.
// (sokken en mouwen in de shirtkleur, het accent geel, de broek wit, zwart haar en zwarte schoenen; het oogwit blijft wit)
const UIT = {r:'1', R:'2', o:'1', O:'2', w:'3', W:'4', u:'5', U:'6', h:'7', H:'8', j:'9', y:'5', Y:'6', a:'0', A:'!'}; // (witte schoenen, donkere zolen)
const UIT_MAP = new Uint8Array(128); for (const k in UIT) UIT_MAP[k.charCodeAt(0)] = UIT[k].charCodeAt(0);
const alsUit = img => { const o = new Img(img.w, img.h); for (let i = 0; i < img.d.length; i++) o.d[i] = UIT_MAP[img.d[i]] || img.d[i]; return o; };
// de houdingen van de verdediger (70×90, naar rechts kijkend; de stijlbron stempelt ze gespiegeld)
const VERD = {
  klaar:{x:35, lL:[30, 70], lR:[35, 75], aL:[-50, 60], aR:[50, 60], hd:[0, 1]},
  sliding:{x:35, y:64, lL:[10, 110], lR:[10, 0], aL:[-20, 20], aR:[60, 30], hd:[0, 2]},
  balen:{x:35, y:64, lL:[10, 110], lR:[10, 10], aL:[-150, 40], aR:[150, 40], hd:[0, 3]},
};
const verdediger = (naam, v) => sprite(70, 90, c => speler(c, VERD[naam], v));
// de sprong over de sliding (frames 6-11 van 'voorbij'): inzet, afzet, twee keer hoog in de lucht, landen, neerkomen
const SPRONG = [
  {lL:[45, 90], lR:[30, 60], aL:[-40, 40], aR:[40, 40], hd:[0, 1]},
  {lL:[-5, 5], lR:[20, 40], aL:[-140, 10], aR:[140, 10], hoog:8},
  {lL:[50, 100], lR:[60, 100], aL:[-160, 0], aR:[160, 0], hoog:18},
  {lL:[50, 95], lR:[55, 100], aL:[-150, 0], aR:[150, 0], hoog:18},
  {lL:[25, 45], lR:[30, 50], aL:[-110, 20], aR:[110, 20], hoog:8},
  {lL:[45, 90], lR:[50, 95], aL:[-30, 40], aR:[30, 40], hd:[0, 1]},
];
const VD = [50, 22]; // halve breedte en y van de gedraaide verdediger
function voorbijFrame(c, v, i){
  const x = 18 + i * 9;
  if (i < 5) c.stamp(alsUit(verdediger('klaar', v)), 128 - 35, 0, {flip:true});
  else { const vx = i < 9 ? 147 - (i - 4) * 13 : 82; c.stamp(alsUit(verdediger(i < 9 ? 'sliding' : 'balen', v)), vx - VD[0], VD[1], {flip:true, rot:80}); }
  let pose, bal;
  if (i < 6 || i > 11){ pose = {...REN[i % 8], x}; const na = i > 11 ? i - 12 : i; bal = [x + BAL_VOOR[na % 8], GROND - 5]; }
  else { pose = {...SPRONG[i - 6], x}; const u = (i - 6) / 5, bx = (18 + 6 * 9 + 15) + u * ((18 + 11 * 9 + 22) - (18 + 6 * 9 + 15)); bal = [bx, GROND - 5 - Math.sin(u * Math.PI) * 30]; }
  speler(c, {...pose, bal, balRot:(i % 4) * 90, zij:true}, v);
}
export const ORIGINEEL = {
  ren:{fps:12, loop:true, frames:renCyclus(40)},
  schiet:{fps:10, frames:SCHIET},
  spring:{fps:10, frames:SPRING},
  kop:{fps:10, frames:KOP},
  duik:{fps:10, w:128, frames:[{...klaar}, {...klaar, x:38, lL:[45, 95], lR:[50, 100], aR:[80, 40], hd:[1, 2]},
    ...DUIK_LUCHT.map(([rot, x, y, b]) => (c, v) => { c.stamp(duikhouding(v), x, y, {rot}); if (v.bal !== false) c.stamp(BAL, b[0] - 5, b[1] - 5); })]},
  dribbel:{fps:12, loop:true, frames:REN.map((P, i) => ({...P, x:34, bal:[34 + BAL_VOOR[i], GROND - 5], balRot:(i % 4) * 90}))},
  voorbij:{fps:12, w:200, frames:Array.from({length:18}, (_, i) => (c, v) => voorbijFrame(c, v, i))},
};

// ---------- hulpjes voor de animaties van het spel ----------
const dx = ANKER_X - 40; // de stijlbron staat op x 40, het spel op ANKER_X
const schuif = (P, d = dx) => ({...P, x:P.x + d, bal:undefined});
const S0 = {x:ANKER_X, lL:[-5, 10], lR:[10, 15], aL:[-25, 30], aR:[25, 30]};
const met = (o) => ({...S0, ...o});
// Een stuk tekst-, pen- of camerawerk in de hand
const pen = (c, o) => { const hx = o.ox + 30 + 8, hy = o.oy + 28 + 4; c.line(hx, hy - 3, hx + 2, hy + 1, 'k'); };

// ---------- de animaties van het spel ----------
const SPEL = {
  // basis
  // zitten op de bank (van voren, de handen op de knieën; de benen vallen weg achter het schot van de dug-out: veld3d.js)
  zit:{fps:1, loop:true, frames:[met({aL:[-28, 70], aR:[28, 70], hd:[0, 1]})]},
  sta:{fps:3, loop:true, frames:[met({}), met({aL:[-20, 34], aR:[20, 34]}), met({aL:[-18, 36], aR:[18, 36], hd:[0, 1]}), met({aL:[-20, 34], aR:[20, 34]})]},
  keeperKlaar:{fps:4, loop:true, frames:[{...klaar, x:ANKER_X}, {...klaar, x:ANKER_X, hoog:1, hd:[0, 0]}]},
  ren:{fps:12, loop:true, frames:renCyclus(ANKER_X)},
  // dribbelen: dezelfde passen als rennen; de echte bal ligt per frame op BAL_VOOR (veld3d)
  dribbel:{fps:12, loop:true, frames:renCyclus(ANKER_X)},
  // over een sliding heen springen (stijlbron: 'voorbij', frames 6-11)
  overspring:{fps:12, frames:SPRONG.map(P => ({...P, x:ANKER_X, zij:true}))},
  renJuich:{fps:12, loop:true, frames:renCyclus(ANKER_X).map(P => ({...P, aL:[-125, -25], aR:[125, 25], arm:1.3}))}, // (juichend naar de hoekvlag)
  loop:{fps:8, loop:true, frames:loopCyclus(ANKER_X)},
  schiet:{fps:10, frames:SCHIET.map(P => schuif(P))},
  spring:{fps:10, frames:SPRING.map(P => schuif(P))},
  kop:{fps:10, frames:KOP.map(P => schuif(P, ANKER_X - 38))},
  // de duik, gecentreerd: 0 klaar, 1 afzetten, 2-4 steeds platter in de lucht, 5 geland
  duik:{fps:10, frames:[{...klaar, x:ANKER_X}, {...klaar, x:ANKER_X + 2, lL:[45, 95], lR:[50, 100], aR:[80, 40], hd:[1, 2]},
    ...[[45, -6], [75, -2], [90, 0], [92, 8]].map(([rot, oy]) => (c, v) => { const d = duikhouding(v).rot(rot); c.stamp(d, ANKER_X + 2 - d.w / 2, GROND - 14 + oy - d.h / 2); })]},
  // de gestrekte duikhouding uit de stijlbron, rechtop (heup op ANKER_X, voeten op de grond): het veld draait hem in de richting
  // waarin de keeper op het scherm duikt, ook als dat de diepte in is (veld3d: s.mat.rotation)
  // vier beelden, die het veld kiest naar hoe ver hij in de sprong is (veld3d: 0 afzetten, 1 vliegen, 2 het hoogste punt, 3 landen)
  duikStrek:{fps:1, frames:DUIK_FASEN.map(P => (c, v) => c.stamp(duikFase(P, v), ANKER_X - 35, 0))},
  // (armen omhoog: schuin en wat langer, anders verdwijnen ze achter het grote hoofd)
  juich:{fps:8, loop:true, frames:[met({aL:[-125, -25], aR:[125, 25], arm:1.3}), met({aL:[-118, -30], aR:[118, 30], arm:1.35, hoog:3, lL:[20, 40], lR:[25, 45]}),
    met({aL:[-130, -20], aR:[130, 20], arm:1.35, hoog:5, lL:[25, 50], lR:[30, 55], hd:[0, -1]}), met({aL:[-118, -30], aR:[118, 30], arm:1.35, hoog:3, lL:[20, 40], lR:[25, 45]})]},
  klap:{fps:6, loop:true, frames:[met({aL:[45, 70], aR:[40, 75]}), met({aL:[25, 60], aR:[60, 55]})]},
  // duels en overtredingen
  duw:{fps:6, frames:[met({lL:[-25, 15], lR:[30, 30], aL:[60, 30], aR:[65, 30], hd:[1, 0]}), met({lL:[-30, 15], lR:[30, 25], aL:[85, 5], aR:[88, 5], hd:[2, 0]})]},
  struikel:{fps:6, loop:true, frames:[met({lL:[-40, 40], lR:[40, 20], aL:[120, 20], aR:[-60, 30], hd:[3, 2], lig:{rot:20, cx:ANKER_X + 4, cy:GROND - 28}}),
    met({lL:[30, 50], lR:[-30, 30], aL:[-50, 30], aR:[130, 20], hd:[3, 2], lig:{rot:28, cx:ANKER_X + 6, cy:GROND - 27}})]},
  val:{fps:7, frames:[met({lL:[-30, 30], lR:[30, 20], aL:[120, 20], aR:[100, 20], hd:[2, 1], lig:{rot:30, cx:ANKER_X + 4, cy:GROND - 27}}),
    met({lL:[-10, 20], lR:[10, 10], aL:[150, 10], aR:[140, 10], hd:[2, 2], lig:{rot:65, cx:ANKER_X + 6, cy:GROND - 18}}),
    met({lL:[-5, 10], lR:[5, 15], aL:[160, 0], aR:[150, 10], hd:[0, 3], lig:{rot:90, cx:ANKER_X + 6, cy:GROND - 11}})]},
  // sliding en daarna balend blijven liggen: de verdediger uit de stijlbron ('voorbij'). Daar gespiegeld en 80° gedraaid (naar links);
  // hier ongespiegeld en -80° (naar rechts), het veld spiegelt hem zelf naar de kant waar hij heen kijkt
  sliding:{fps:8, frames:[(c, v) => { const d = verdediger('sliding', v).rot(-80); c.stamp(d, ANKER_X - d.w / 2, VD[1]); }]},
  balen:{fps:8, frames:[(c, v) => { const d = verdediger('balen', v).rot(-80); c.stamp(d, ANKER_X - d.w / 2, VD[1]); }]},
  steek:{fps:8, frames:[met({lL:[-10, 20], lR:[40, 30], aL:[-60, 20], aR:[40, 30], hd:[1, 1]}), met({lL:[-15, 20], lR:[70, 5], aL:[-70, 20], aR:[40, 30], hd:[2, 1]})]},
  schouder:{fps:6, frames:[met({lL:[-20, 20], lR:[25, 25], aL:[20, 60], aR:[-20, 60], hd:[2, 1]}), met({lL:[-25, 20], lR:[25, 20], aL:[30, 60], aR:[-30, 60], hd:[3, 1]})]},
  trek:{fps:6, loop:true, frames:[met({lL:[-15, 15], lR:[15, 20], aL:[-30, 40], aR:[85, 10], hd:[-1, 0]}), met({lL:[-20, 15], lR:[15, 20], aL:[-35, 40], aR:[80, 25], hd:[-2, 0]})]},
  borst:{fps:6, frames:[met({lL:[-5, 20], lR:[15, 30], aL:[-70, 10], aR:[-50, 20], hd:[-2, -1]})]},
  kopstoot:{fps:8, frames:[met({aL:[-40, 20], aR:[-30, 30], hd:[-2, 0]}), met({aL:[-40, 20], aR:[-30, 30], hd:[4, 1], lL:[-10, 15], lR:[20, 20]})]},
  lach:{fps:6, loop:true, frames:[met({aL:[-15, 20], aR:[20, 110], hd:[-1, -1]}), met({aL:[-15, 20], aR:[20, 110], hd:[-1, 0]})]},
  roep:{fps:3, loop:true, frames:[met({aL:[-160, -80], aR:[160, 80], hd:[0, -1]}), met({aL:[-160, -80], aR:[160, 80], hd:[1, -1]})]},
  kalm:{fps:3, loop:true, frames:[met({aL:[50, 30], aR:[60, 30]}), met({aL:[42, 30], aR:[50, 30], hd:[0, 1]})]},
  wijs:{fps:4, frames:[met({aL:[-15, 20], aR:[100, 0]})]},
  protest:{fps:3, loop:true, frames:[met({aL:[-110, -40], aR:[110, 40], hd:[0, -1]}), met({aL:[-130, -40], aR:[130, 40], hd:[0, -1]})]},
  wuif:{fps:4, loop:true, frames:[met({aL:[-15, 20], aR:[120, 30], arm:1.25}), met({aL:[-15, 20], aR:[120, -5], arm:1.25})]},
  kaart:{fps:4, frames:[met({aL:[-15, 20], aR:[135, 20], arm:1.35})]},
  sorry:{fps:3, loop:true, frames:[met({aL:[40, 90], aR:[50, 90], hd:[0, 1]}), met({aL:[45, 95], aR:[55, 85], hd:[0, 2]})]},
  kniel:{fps:4, frames:[met({lL:[0, 90], lR:[5, 90], aL:[10, 40], aR:[20, 40], hd:[0, 2]})]},
  ssst:{fps:4, frames:[met({aL:[-15, 20], aR:[160, 80]})]},
  praat:{fps:4, loop:true, frames:[met({aL:[-15, 20], aR:[40, 60]}), met({aL:[-15, 20], aR:[60, 40], hd:[0, 1]})]},
  // keeper en verdedigen
  vang:{fps:6, frames:[met({aL:[80, 40], aR:[85, 35], hand:'q', lL:[10, 30], lR:[20, 35]})]},
  blok:{fps:6, frames:[met({aL:[-90, 0], aR:[90, 0], lL:[-25, 10], lR:[25, 10]})]},
  omhaal:{fps:8, frames:[met({lL:[-30, 40], lR:[60, 10], aL:[-120, 0], aR:[-60, 0], lig:{rot:-60, cx:ANKER_X, cy:GROND - 30}}),
    met({lL:[-40, 40], lR:[150, 10], aL:[-130, 0], aR:[-70, 0], hd:[-2, 0], lig:{rot:-100, cx:ANKER_X, cy:GROND - 32}})]},
  volley:{fps:8, frames:[met({lL:[-10, 15], lR:[60, 40], aL:[-90, 0], aR:[30, 30]}), met({lL:[-15, 10], lR:[95, 10], aL:[-95, 10], aR:[-20, 60], hd:[2, -1]})]},
  spreid:{fps:6, frames:[met({aL:[-118, 0], aR:[118, 0], arm:1.3, lL:[-30, 0], lR:[30, 0], hoog:2})]},
  jockey:{fps:4, loop:true, frames:[met({lL:[30, 60], lR:[35, 65], aL:[-30, 30], aR:[40, 30], hd:[1, 1]}), met({lL:[35, 65], lR:[30, 60], aL:[-35, 30], aR:[35, 30], hd:[1, 1], hoog:1})]},
  // ---------- juichdansen (dansen.js) ----------
  heupwieg:{fps:5, loop:true, frames:[met({x:ANKER_X - 1, aL:[-40, 60], aR:[40, 90], hd:[1, 0], lL:[-10, 10], lR:[15, 20]}), met({x:ANKER_X + 1, aL:[-60, 90], aR:[20, 60], hd:[-1, 0], lL:[-15, 20], lR:[10, 10]})]},
  vliegtuig:{fps:10, loop:true, frames:renCyclus(ANKER_X, 30, 40, 0, 15).map((P, i) => ({...P, aL:[-95, 0], aR:[95, 0], lig:{rot:i < 4 ? -8 : 8, cx:ANKER_X, cy:GROND - 28}}))},
  kracht:{fps:4, loop:true, frames:[met({aL:[-90, -80], aR:[90, 80], hd:[0, -1], lL:[-15, 10], lR:[15, 10]}), met({aL:[-95, -95], aR:[95, 95], hd:[0, -2], lL:[-15, 10], lR:[15, 10]})]},
  knieslide:{fps:4, loop:true, frames:[met({lL:[0, 90], lR:[5, 90], aL:[-120, -20], aR:[120, 20], arm:1.3, hd:[-1, -1]}), met({lL:[0, 90], lR:[5, 90], aL:[-128, -15], aR:[128, 15], arm:1.35, hd:[-1, -2]})]},
  robot:{fps:3, loop:true, frames:[met({lL:[0, 0], lR:[0, 0], aL:[-90, -90], aR:[90, 0], hd:[1, 0]}), met({lL:[0, 0], lR:[0, 0], aL:[-90, 0], aR:[90, 90], hd:[-1, 0]}),
    met({lL:[0, 0], lR:[0, 0], aL:[0, 90], aR:[0, -90], hd:[0, 1]}), met({lL:[0, 0], lR:[0, 0], aL:[-90, 90], aR:[90, -90], hd:[0, 0]})]},
  kangoeroe:{fps:8, loop:true, frames:[{...hurk, x:ANKER_X, aL:[40, 80], aR:[45, 80]}, met({hoog:10, lL:[60, 110], lR:[65, 115], aL:[40, 80], aR:[45, 80]}),
    met({hoog:14, lL:[70, 120], lR:[75, 125], aL:[40, 80], aR:[45, 80], hd:[0, -1]}), met({hoog:6, lL:[40, 70], lR:[45, 75], aL:[40, 80], aR:[45, 80]})]},
  pirouette:{fps:6, loop:true, frames:[met({aL:[-125, -30], aR:[125, 30], arm:1.3, lR:[60, 130]}), met({aL:[-118, -35], aR:[118, 35], arm:1.3, lR:[60, 130], hd:[1, 0]}),
    met({aL:[-125, -30], aR:[125, 30], arm:1.3, lR:[60, 130], flip:true}), met({aL:[-118, -35], aR:[118, 35], arm:1.3, lR:[60, 130], hd:[1, 0], flip:true})]},
  boogschutter:{fps:3, loop:true, frames:[0, 1, 2, 2].map(i => met({lL:[-25, 10], lR:[25, 10], aR:[90, 0], aL:i === 0 ? [80, -120] : i === 1 ? [85, -160] : [-60, 30], hd:[1, 0],
    voor:true, extra:(c, o) => { const bx = o.ox + 30 + 11, by = o.oy + 28; c.line(bx, by - 8, bx + 3, by, 'n', 2); c.line(bx + 3, by, bx, by + 8, 'n', 2);
      if (i < 2) { c.line(bx, by - 8, bx - (i ? 9 : 6), by, 'm'); c.line(bx - (i ? 9 : 6), by, bx, by + 8, 'm'); c.line(bx - (i ? 9 : 6), by, bx + 6, by, 'N'); } else c.line(bx, by - 8, bx, by + 8, 'm'); }}))},
  polonaise:{fps:6, loop:true, frames:renCyclus(ANKER_X, 18, 30, 0, 10).map(P => ({...P, aL:[80, 0], aR:[85, 0]}))},
  // ---------- buiten het veld (cutscenes) ----------
  zit:{fps:2, loop:true, frames:[met({lL:[88, 88], lR:[92, 92], aL:[20, 60], aR:[30, 60]}), met({lL:[88, 88], lR:[92, 92], aL:[20, 62], aR:[30, 62], hd:[0, 1]})]},
  zitPraat:{fps:4, loop:true, frames:[met({lL:[88, 88], lR:[92, 92], aL:[20, 60], aR:[60, 60]}), met({lL:[88, 88], lR:[92, 92], aL:[20, 60], aR:[80, 30], hd:[0, 1]})]},
  zitSchrijf:{fps:5, loop:true, frames:[met({lL:[88, 88], lR:[92, 92], aL:[60, 40], aR:[70, 30], hd:[1, 2], voor:true, extra:pen}), met({lL:[88, 88], lR:[92, 92], aL:[60, 40], aR:[75, 25], hd:[1, 2], voor:true, extra:pen})]},
  opstaan:{fps:4, frames:[met({lL:[88, 88], lR:[92, 92], aL:[20, 60], aR:[30, 60]}), met({lL:[50, 60], lR:[55, 65], aL:[30, 40], aR:[40, 40], hd:[2, 1]}), met({})]},
  handdruk:{fps:4, loop:true, frames:[met({aL:[-15, 20], aR:[75, 25]}), met({aL:[-15, 20], aR:[85, 15]})]},
  shirtOmhoog:{fps:3, loop:true, frames:[0, 1].map(i => met({aL:[150, 20], aR:[150, -20], hd:[0, -1 + i], hoog:i, voor:true, extra:(c, o) => {
    const x = o.ox + 14, y = o.oy + 2 + i; // het shirt van de club tussen je handen
    for (let xx = 0; xx < 18; xx++) c.rect(x + xx, y + 2, 1, 12, ((xx >> 1) % 2) ? 'w' : 'r');
    c.rect(x - 4, y + 2, 4, 5, 'r'); c.rect(x + 18, y + 2, 4, 5, 'r'); c.rect(x + 7, y + 2, 4, 2, 'R'); }}))},
  klapZit:{fps:6, loop:true, frames:[met({lL:[88, 88], lR:[92, 92], aL:[45, 70], aR:[40, 75]}), met({lL:[88, 88], lR:[92, 92], aL:[25, 60], aR:[60, 55]})]},
  klapSta:{fps:6, loop:true, frames:[met({aL:[45, 70], aR:[40, 75]}), met({aL:[25, 60], aR:[60, 55]})]},
  fotograaf:{fps:2, loop:true, frames:[0, 1].map(i => met({aL:[60, 100], aR:[140, 95], hd:[1, 0], lL:[-10, 15], lR:[20, 25], voor:true, extra:(c, o) => {
    const x = o.ox + 25, y = o.oy + 11 + i; c.rect(x, y, 11, 8, 'e'); c.rect(x + 2, y - 2, 4, 2, 'E'); c.circ(x + 8, y + 4, 2, 'm'); c.px(x + 8, y + 4, 'E'); }}))},
  cameraman:{fps:2, loop:true, frames:[met({aL:[60, 80], aR:[150, 100], lL:[-15, 15], lR:[20, 25], voor:true, extra:(c, o) => {
    const x = o.ox + 22, y = o.oy + 6; c.rect(x, y, 18, 10, 'e'); c.rect(x + 18, y + 2, 4, 6, 'E'); c.rect(x + 2, y - 3, 8, 3, 'E'); c.px(x + 16, y + 2, 'r'); }})]},
  zwaai:{fps:4, loop:true, frames:[met({aL:[-15, 20], aR:[120, 30], arm:1.25}), met({aL:[-15, 20], aR:[120, -5], arm:1.25})]},
};
// De keepersduik en vangbal: altijd met handschoenen (zie rig: v.handschoen)
// Rennen, lopen en dribbelen in drie aanzichten (rig.js: P.richting): van opzij (de gewone naam), naar je toe (_voor) en van je af (_achter).
// Dezelfde passen; van voren en achteren valt de diepte weg, zodat hoofd, romp en benen dezelfde kant op kijken
for (const naam of ['ren', 'loop', 'dribbel', 'renJuich']){
  const d = SPEL[naam], met = r => ({...d, frames:d.frames.map(P => typeof P === 'function' ? P : {...P, richting:r})});
  SPEL[naam] = met('zij'); SPEL[naam + '_voor'] = met('voor'); SPEL[naam + '_achter'] = met('achter');
}
export const LOOP_FAMILIE = new Set(['ren', 'loop', 'dribbel', 'renJuich']);
export const ANIMS = SPEL;
export const ANIM_NAMEN = Object.keys(SPEL);

// ---------- één frame tekenen (in sleutels, met omlijning) ----------
// v = {kapsel, vrouw, kleding, patroon, handschoen, bal}
export function tekenFrame(def, i, v = {}){
  const f = def.frames[Math.max(0, Math.min(def.frames.length - 1, i))], w = def.w || 96, img = new Img(w, 90), c = new Doek(img);
  if (typeof f === 'function') f(c, v);
  else {
    const P = v.handschoen && !f.hand ? {...f, hand:'q'} : f;
    if (P.lig){ const tmp = new Img(96, 90); speler(new Doek(tmp), P, v); const r = tmp.rot(P.lig.rot); c.stamp(r, P.lig.cx - r.w / 2, P.lig.cy - r.h / 2); }
    else speler(c, P, v);
  }
  let uit = img.outline('k'.charCodeAt(0));
  if (f && f.flip) uit = uit.flipX();
  return uit;
}
