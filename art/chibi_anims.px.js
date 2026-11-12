// Chibi-voetballer met vijf animaties: rennen, schieten, springen, koppen en duiken (keeper).
// Opbouw als een "rig": hoofd en romp zijn vaste onderdelen (sprites), armen en benen worden
// per frame als dikke lijnen getekend op hoeken uit een pose-tabel.
// Hoeken in graden: 0 = recht naar beneden, + = naar rechts (looprichting), 180 = recht omhoog.
//
// (Dit is de stijlbron. Het spel tekent dezelfde rig zelf, met jouw uiterlijk en tenue: src/render/pixel/.
//  Bouwen ter vergelijking: node ~/.pxl/bin/pxl.js build art/chibi_anims.px.js)

pal({
  k: "#1a1414",
  s: "#f7c9a8", S: "#e3a07e", p: "#f19a8f",
  h: "#b5541c", H: "#7e3410", j: "#dc7a3c",
  r: "#e0262b", R: "#a3161b",
  w: "#ffffff", W: "#d4d4de",
  u: "#2f62d6", U: "#1d3c8f",
  y: "#ffd21a", Y: "#e39a0c",
  g: "#1f8a5a", G: "#13603e",
  q: "#7ed957", Q: "#4fa83a",                    // keepershandschoenen
  v: "#2b3f9e", V: "#1a2563", o: "#ffd84a", O: "#d9a91c",   // tegenstander: blauw-geel shirt, blauwe kousen
  n: "#2a1f1c", N: "#140e0c", m: "#4a3a34",      // tegenstander: zwart haar
  x: "#f4f4f8", X: "#c4c4d0", z: "#3a3a44", Z: "#24242c",   // witte broek + schoenen tegenstander, donkere zolen
  a: "#b8650a", A: "#8a4a08",                    // zool gele schoenen (voor / achter)
})

// ── Onderdelen in de coördinaten van de originele sprite (heup-midden = 21, 39) ──────────
sprite("_hoofd", { w: 38, h: 26 },
  rect(8, 3, 26, 9, "h"),
  rect(7, 8, 3, 9, "h"), rect(32, 8, 3, 9, "h"),
  rect(10, 1, 22, 2, "h"), rect(13, 0, 16, 1, "h"),
  (c) => {
    for (const x of [13, 18, 23, 28]) c.line(x, 2, x - 2, 8, "H")
    for (const x of [11, 16, 21]) c.rect(x, 2, 3, 1, "j")
  },
  rect(10, 10, 22, 15, "s"),
  (c) => { for (let x = 10; x < 32; x++) c.px(x, 10 + (x % 3 === 0 ? 1 : 0), "H") },
  rect(10, 23, 22, 2, "S"), rect(31, 12, 1, 11, "S"),
  rect(5, 14, 3, 5, "s"), px(5, 16, "S"), rect(34, 14, 3, 5, "S"),
  line(12, 12, 17, 14, "k", 2), line(29, 12, 24, 14, "k", 2),
  rect(13, 15, 4, 4, "w"), rect(15, 16, 2, 3, "k"),
  rect(24, 15, 4, 4, "w"), rect(26, 16, 2, 3, "k"),
  rect(11, 20, 3, 1, "p"), rect(28, 20, 3, 1, "p"),
  px(20, 19, "S"), hline(18, 22, 5, "k"),
)

sprite("_romp", { w: 31, h: 41 },
  rect(18, 25, 6, 2, "S"),
  (c) => {
    for (let x = 12; x < 30; x++) c.rect(x, 26, 1, 10, ((x - 12) >> 1) % 2 ? "w" : "r")
    for (let x = 27; x < 30; x++) for (let y = 26; y < 36; y++) c.px(x, y, c.is(x, y, "w") ? "W" : "R")
    c.rect(12, 34, 18, 1, "W")
    c.px(21, 26, "w"); c.px(20, 27, "w"); c.px(22, 27, "w")
  },
  rect(12, 35, 18, 5, "u"), rect(12, 39, 18, 1, "U"), rect(20, 37, 1, 3, "U"),
)

// Zijaanzicht (kijkt naar rechts) voor loop-, ren- en schietbewegingen. Zelfde coördinaten als
// het vooraanzicht, zodat de onderdelen op dezelfde plek gestempeld worden.
sprite("_hoofd_zij", { w: 38, h: 26 },
  rect(9, 3, 24, 9, "h"), rect(11, 1, 19, 2, "h"), rect(14, 0, 12, 1, "h"),   // schedel
  rect(8, 8, 9, 13, "h"),                                                    // haar achterhoofd
  (c) => {
    for (const x of [14, 19, 24]) c.line(x, 2, x - 2, 8, "H")               // lokken
    for (const x of [12, 17]) c.rect(x, 2, 3, 1, "j")                       // glans
  },
  rect(15, 10, 17, 15, "s"),                                                 // gezicht
  (c) => { for (let x = 17; x < 32; x++) c.px(x, 10 + (x % 3 === 0 ? 1 : 0), "H") },   // pony
  rect(32, 15, 2, 3, "s"), px(33, 17, "S"),                                  // neus steekt uit
  rect(15, 23, 17, 2, "S"), rect(15, 10, 1, 13, "S"),                        // kaak / achterkant
  rect(17, 13, 4, 6, "s"), rect(18, 15, 2, 2, "S"), vline(21, 14, 4, "S"), hline(18, 19, 2, "S"),   // oor in het midden, met schaduwrand
  line(25, 12, 30, 13, "k", 2),                                              // wenkbrauw
  rect(26, 15, 4, 4, "w"), rect(28, 16, 2, 3, "k"),                          // oog kijkt vooruit
  rect(23, 20, 3, 1, "p"),                                                   // blos
  hline(28, 22, 3, "k"),                                                     // mond
)
sprite("_romp_zij", { w: 31, h: 41 },
  rect(19, 25, 5, 2, "S"),
  (c) => {
    for (let x = 15; x < 28; x++) c.rect(x, 26, 1, 10, ((x - 15) >> 1) % 2 ? "w" : "r")
    for (let x = 15; x < 17; x++) for (let y = 26; y < 36; y++) c.px(x, y, c.is(x, y, "w") ? "W" : "R")   // rug in de schaduw
    c.rect(15, 34, 13, 1, "W")
    c.rect(24, 26, 3, 1, "w")                                               // kraag aan de voorkant
  },
  rect(15, 35, 13, 5, "u"), rect(15, 39, 13, 1, "U"),
)

sprite("_bal", { w: 11, h: 11 },
  circ(5, 5, 5, "w"),
  rect(4, 3, 3, 4, "g"), rect(3, 4, 5, 2, "g"),
  rect(1, 1, 2, 2, "G"), rect(8, 1, 2, 2, "G"), rect(1, 7, 2, 2, "G"), rect(8, 7, 2, 2, "G"),
  px(9, 5, "W"), px(8, 8, "W"), px(5, 10, "W"),
)

// ── De rig ──────────────────────────────────────────────────────────────────────────────
const GROND = 74                                  // y van de grond (onderkant schoenen)
const rad = (d) => (d * Math.PI) / 180
const R = Math.round
const L = { boven: 6, onder: 5, dij: 6, scheen: 6 }

// Punt op afstand len in richting hoek (0 = omlaag, + = naar rechts).
const stap = (x, y, hoek, len) => [x + Math.sin(rad(hoek)) * len, y + Math.cos(rad(hoek)) * len]

// Been: [dijhoek, kniebuiging]; de scheen buigt naar achteren.
function beenPunten(hx, hy, [a, buig]) {
  const [kx, ky] = stap(hx, hy, a, L.dij)
  const [fx, fy] = stap(kx, ky, a - buig, L.scheen)
  return { kx, ky, fx, fy }
}
// Arm: [bovenarmhoek, elleboogbuiging]; de onderarm buigt naar voren.
function armPunten(sx, sy, [a, buig], f = 1) {
  const [ex, ey] = stap(sx, sy, a, L.boven * f)
  const [hx, hy] = stap(ex, ey, a + buig, L.onder * f)
  return { ex, ey, hx, hy }
}

// Lijn met eigen omlijning eronder, zodat ledematen ook loskomen als ze over het lijf vallen.
function dik(c, x0, y0, x1, y1, kleur, b) {
  c.line(R(x0), R(y0), R(x1), R(y1), "k", b + 2)
  c.line(R(x0), R(y0), R(x1), R(y1), kleur, b)
}

// Voetbalschoen, neus naar rechts. Rijen ten opzichte van de voet (fx, fy):
// enkelrand, wreef, voet met ronde neus, zool. Eerst een zwarte rand rondom, dan de kleuren.
const SCHOEN = [
  [-2, -1, 1, "b"],          // rij -2: enkelrand
  [-1, -2, 3, "b"],          // rij -1: wreef
  [0, -2, 5, "b"],           // rij  0: voet tot in de neus
  [1, -2, 4, "z"],           // rij  1: zool (neus iets afgerond)
]
function schoen(c, fx, fy, kleur, zool) {
  for (const [dy, x0, x1] of SCHOEN) for (let x = x0; x <= x1; x++) c.rect(fx + x - 1, fy + dy - 1, 3, 3, "k")
  for (const [dy, x0, x1, deel] of SCHOEN) for (let x = x0; x <= x1; x++) c.px(fx + x, fy + dy, deel === "z" ? zool : kleur)
  c.px(fx + 4, fy, zool)                                       // neus: schaduw onderaan de punt
}

// Vuist: breder dan de onderarm, met zwarte rand, schaduw rechtsonder en een duim linksboven.
const VUIST_DONKER = { s: "S", S: "S", q: "Q", Q: "Q", i: "I", I: "I", d: "B", B: "B" }
function vuist(c, x, y, kleur) {
  const d = VUIST_DONKER[kleur]
  c.circ(x, y, 3, "k")
  c.circ(x, y, 2, kleur)
  c.px(x + 1, y + 2, d); c.px(x + 2, y + 1, d); c.px(x + 2, y + 2, "k")   // schaduw / ronding
  c.px(x - 1, y - 1, d)                                        // duimlijn
}

function tekenBeen(c, hx, hy, pose, voor, T) {
  const { kx, ky, fx, fy } = beenPunten(hx, hy, pose)
  dik(c, hx, hy, kx, ky, voor ? T.dij ?? "s" : T.dij2 ?? "S", 4)        // dij (huid, of broek)
  dik(c, kx, ky, fx, fy, voor ? T.kous ?? T.r : T.kous2 ?? T.R, 4)      // scheen (kous, of broek)
  schoen(c, R(fx), R(fy), voor ? T.y : T.Y, voor ? T.zool : T.zool2)
}

function tekenArm(c, sx, sy, pose, voor, hand, f, T) {
  const { ex, ey, hx, hy } = armPunten(sx, sy, pose, f)
  dik(c, sx, sy, ex, ey, voor ? T.mouw ?? T.r : T.mouw2 ?? T.R, 4)     // mouw
  if (voor && T.band) c.line(R(sx + (ex - sx) * 0.55), R(sy + (ey - sy) * 0.55), R(sx + (ex - sx) * 0.85), R(sy + (ey - sy) * 0.85), T.band, 4)   // aanvoerdersband
  dik(c, ex, ey, hx, hy, voor ? T.onder ?? "s" : T.onder2 ?? "S", 3)   // onderarm (huid, of lange mouw)
  vuist(c, R(hx), R(hy), hand)
  return [R(hx), R(hy)]
}

// Zet de heup zo hoog dat de laagste voet op de grond staat.
function opGrond(P) {
  const l = beenPunten(0, 0, P.lL).fy, r = beenPunten(0, 0, P.lR).fy
  return GROND - 3 - Math.max(l, r) - 1
}

// Teams: welke onderdelen en kleuren de rig gebruikt.
const THUIS = { romp: "_romp", hoofd: "_hoofd", zijRomp: "_romp_zij", zijHoofd: "_hoofd_zij", r: "r", R: "R", y: "y", Y: "Y", zool: "a", zool2: "A" }
const UIT = { romp: "_romp_uit", hoofd: "_hoofd_uit", r: "v", R: "V", y: "x", Y: "X", zool: "z", zool2: "Z" }

// Tekent de hele speler in pose P op canvas c.
function speler(c, P) {
  // P.look (optioneel): huidskleur, haar en keeperstenue per speler
  const Lk = P.look
  const T = Lk ? { ...(P.team ?? THUIS), dij: (P.team ?? THUIS).dij ?? Lk.s, dij2: (P.team ?? THUIS).dij2 ?? Lk.S,
    onder: (P.team ?? THUIS).onder ?? Lk.s, onder2: (P.team ?? THUIS).onder2 ?? Lk.S, ...(Lk.T ?? {}) } : P.team ?? THUIS
  const Tb = P.band ? { ...T, band: P.band } : T
  const kopSwap = Lk ? { swap: { s: Lk.s, S: Lk.S, h: Lk.h, H: Lk.H, j: Lk.j } } : undefined
  const rompSwap = Lk ? { swap: { S: Lk.S, ...(Lk.kit ?? {}) } } : undefined
  const hy = P.y ?? opGrond(P) - (P.hoog ?? 0)
  const ox = R(P.x - 21), oy = R(hy - 39 + (P.dy ?? 0))
  const hand = P.hand ?? (Lk ? Lk.s : "s")
  // Vooraanzicht: schouders en heupen links en rechts. Zijaanzicht: alles uit één punt.
  const zij = !!P.zij
  const sL = zij ? [21, 28] : [11, 28], sR = zij ? [21, 28] : [30, 28]
  const hL = zij ? [20, 39] : [16, 39], hR = zij ? [22, 39] : [26, 39]
  tekenArm(c, ox + sL[0], oy + sL[1], P.aL, false, VUIST_DONKER[hand], P.arm, T)
  tekenBeen(c, ox + hL[0], oy + hL[1], P.lL, false, T)
  tekenBeen(c, ox + hR[0], oy + hR[1], P.lR, true, T)
  c.stamp(zij ? T.zijRomp : T.romp, ox, oy, rompSwap)
  const [dx, dy] = P.hd ?? [0, 0]
  c.stamp(zij ? T.zijHoofd : T.hoofd, ox + dx, oy + dy, kopSwap)
  const voorHand = tekenArm(c, ox + sR[0], oy + sR[1], P.aR, true, hand, P.arm, Tb)
  if (P.bal) c.stamp("_bal", R(P.bal[0]) - 5, R(P.bal[1]) - 5, { rot: P.balRot ?? 0 })
  return voorHand
}

const W = 96, H = 90
function animatie(naam, fps, poses, extra = {}) {
  anim(naam, { w: W, h: H, frames: poses.length, fps, outline: "k", ...extra }, (c) => speler(c, poses[c.frame]))
}

// ── 1. Rennen: procedurele cyclus van 8 frames ──────────────────────────────────────────
const ren = []
for (let i = 0; i < 8; i++) {
  const t = (i / 8) * Math.PI * 2
  const been = (f) => [38 * Math.sin(f), 20 + 60 * Math.max(0, Math.cos(f))]
  ren.push({
    x: 40, lR: been(t), lL: been(t + Math.PI),
    aR: [-45 * Math.sin(t), 70], aL: [45 * Math.sin(t), 70],
    hoog: Math.abs(Math.sin(t)) < 0.4 ? 1 : 0,          // klein veertje bij de passeerstand
    zij: true,                                          // zijaanzicht: lijf draait mee met de looprichting
  })
}
animatie("ren", 12, ren)

// ── 2. Schieten: aanleggen, uithalen, doortrekken; de bal vliegt rechts het beeld uit ──
const B0 = [58, GROND - 5]
const sta = { x: 40, lL: [-5, 10], lR: [10, 15], aL: [-25, 30], aR: [25, 30] }
animatie("schiet", 10, ([
  { ...sta, bal: B0 },
  { x: 38, lL: [-5, 15], lR: [-40, 70], aL: [-60, 20], aR: [35, 40], bal: B0 },
  { x: 37, lL: [0, 25], lR: [-65, 95], aL: [-80, 10], aR: [50, 40], hd: [-1, 1], bal: B0 },
  { x: 42, lL: [-10, 20], lR: [35, 15], aL: [-90, 0], aR: [10, 50], hd: [1, 0], bal: B0 },
  { x: 44, lL: [-15, 10], lR: [75, 5], aL: [-100, 0], aR: [-10, 60], hd: [2, 0], bal: [74, GROND - 14] },
  { x: 44, lL: [-15, 10], lR: [95, 10], aL: [-95, 10], aR: [-20, 60], hd: [2, -1], bal: [90, GROND - 24] },
  { x: 43, lL: [-10, 15], lR: [40, 40], aL: [-60, 20], aR: [10, 40], hd: [1, 0] },
  { ...sta },
]).map((P) => ({ ...P, zij: true })))

// ── 3. Springen: hurken, afzetten, opgetrokken knieën in de lucht, landen ──────────────
const hurk = { x: 40, lL: [45, 90], lR: [50, 95], aL: [-30, 40], aR: [30, 40], hd: [0, 1] }
animatie("spring", 10, [
  { ...sta },
  { ...hurk },
  { x: 40, lL: [-5, 5], lR: [0, 5], aL: [-150, 10], aR: [150, 10], hoog: 6, hd: [0, -1] },
  { x: 40, lL: [55, 100], lR: [60, 105], aL: [-165, 0], aR: [165, 0], hoog: 16 },
  { x: 40, lL: [50, 95], lR: [55, 100], aL: [-160, 0], aR: [160, 0], hoog: 18 },
  { x: 40, lL: [20, 40], lR: [25, 45], aL: [-120, 20], aR: [120, 20], hoog: 8 },
  { ...hurk },
  { ...sta },
], { fps: 10 })

// ── 4. Koppen: opspringen, de bal komt van rechtsboven, kopstoot, bal vliegt terug ──────
const kopLucht = (hoog, hd, bal) => ({ x: 38, lL: [30, 80], lR: [20, 60], aL: [-110, 10], aR: [110, 10], hoog, hd, bal })
animatie("kop", 10, [
  { ...sta, bal: [92, 16] },
  { ...hurk, bal: [82, 20] },
  kopLucht(8, [0, 0], [72, 23]),
  kopLucht(14, [-2, 0], [62, 25]),                       // hoofd naar achteren: aanloop
  kopLucht(16, [4, 1], [54, 27]),                        // contact: hoofd schiet naar voren
  kopLucht(14, [3, 1], [72, 16]),
  { x: 38, lL: [20, 40], lR: [25, 45], aL: [-80, 20], aR: [80, 20], hoog: 6, bal: [90, 8] },
  { ...hurk },
])

// ── 5. Duiken als keeper: klaarstaan, afzetten, horizontaal door de lucht, landen ───────
// De gestrekte duikhouding is een eigen sprite die gedraaid wordt gestempeld.
sprite("_duikhouding", { w: 70, h: 90 },
  (c) => speler(c, { x: 35, y: 58, lL: [-6, 0], lR: [6, 5], aL: [-172, 0], aR: [172, 0], hand: "q", arm: 2.2, hd: [0, 5] }))   // gestrekte armen, hoofd tussen de schouders

const klaar = { x: 36, lL: [30, 70], lR: [35, 75], aL: [-50, 70], aR: [50, 70], hand: "q", hd: [0, 1] }
anim("duik", { w: 128, h: H, frames: 8, fps: 10, outline: "k" }, (c) => {
  const f = c.frame
  if (f === 0) return speler(c, { ...klaar })
  if (f === 1) return speler(c, { ...klaar, x: 38, lL: [45, 95], lR: [50, 100], aR: [80, 40], hd: [1, 2] })
  // in de lucht: [rotatie, x, y] van de gedraaide duikhouding, plus de bal
  const lucht = [
    [45, 22, 2, [116, 32]],
    [75, 34, -4, [114, 36]],
    [90, 46, -6, [117, 30]],                              // bal gevangen tegen de handschoenen
    [95, 52, 6, [122, 47]],
    [90, 50, 18, [121, 55]],
    [90, 50, 19, [121, 56]],
  ][f - 2]
  c.stamp("_duikhouding", lucht[1], lucht[2], { rot: lucht[0] })
  c.stamp("_bal", lucht[3][0] - 5, lucht[3][1] - 5)
})


// ── Tegenstander: zelfde onderdelen, andere kleuren ─────────────────────────────────────
sprite("_romp_uit", { base: "_romp", swap: { r: "v", R: "V", w: "o", W: "O", u: "x", U: "X" } })
sprite("_hoofd_uit", { base: "_hoofd", swap: { h: "n", H: "N", j: "m" } })

// ── 6. Dribbelen: rennen met de bal aan de voet (loopt naadloos rond) ──────────────────
// Bij frame 2 tikt de rechtervoet de bal aan; daarna rolt hij vooruit en haalt de speler hem weer in.
const balVoor = [15, 14, 13, 17, 20, 21, 19, 17]              // afstand bal ↔ heup per frame
animatie("dribbel", 12, ren.map((P, i) => ({
  ...P, x: 34, bal: [34 + balVoor[i], GROND - 5], balRot: (i % 4) * 90,
})))

// ── 7. Voorbij dribbelen: tegenstander komt met een sliding, bal erover, eroverheen springen ─
// Tegenstander-houdingen als sprites (getekend naar rechts kijkend, gestempeld gespiegeld).
sprite("_verdediger_klaar", { w: 70, h: 90 },
  (c) => speler(c, { x: 35, lL: [30, 70], lR: [35, 75], aL: [-50, 60], aR: [50, 60], hd: [0, 1], team: UIT }))
// Sliding: rechtop getekend met het been iets naar voren (10°); gestempeld met flip + 80° draaiing
// ligt het lichaam achterover en schuift het been horizontaal over de grond.
sprite("_verdediger_sliding", { w: 70, h: 90 },
  (c) => speler(c, { x: 35, y: 64, lL: [10, 110], lR: [10, 0], aL: [-20, 20], aR: [60, 30], hd: [0, 2], team: UIT }))
sprite("_verdediger_balen", { w: 70, h: 90 },
  (c) => speler(c, { x: 35, y: 64, lL: [10, 110], lR: [10, 10], aL: [-150, 40], aR: [150, 40], hd: [0, 3], team: UIT }))

const VW = 200
const VD = [50, 22]                                         // halve breedte, y-positie van de gedraaide verdediger
anim("voorbij", { w: VW, h: H, frames: 18, fps: 12, outline: "k" }, (c) => {
  const i = c.frame
  // aanvaller: x schuift op; frames 7..10 in de lucht (springt over de sliding)
  const x = 18 + i * 9
  // verdediger: staat klaar, glijdt naar links, blijft liggen en baalt
  if (i < 5) c.stamp("_verdediger_klaar", 128 - 35, 0, { flip: "x" })
  else {
    const vx = i < 9 ? 147 - (i - 4) * 13 : 82                 // midden van de gedraaide sprite
    c.stamp(i < 9 ? "_verdediger_sliding" : "_verdediger_balen", vx - VD[0], VD[1], { flip: "x", rot: 80 })
  }

  let pose, bal
  if (i < 6 || i > 11) {
    pose = { ...ren[i % 8], x }
    const na = i > 11 ? i - 12 : i
    bal = [x + balVoor[na % 8], GROND - 5]
  } else {
    // 6: inzet (bal wordt opgewipt), 7-10: sprong, 11: landing
    const sprong = [
      { lL: [45, 90], lR: [30, 60], aL: [-40, 40], aR: [40, 40], hd: [0, 1] },
      { lL: [-5, 5], lR: [20, 40], aL: [-140, 10], aR: [140, 10], hoog: 8 },
      { lL: [50, 100], lR: [60, 100], aL: [-160, 0], aR: [160, 0], hoog: 18 },
      { lL: [50, 95], lR: [55, 100], aL: [-150, 0], aR: [150, 0], hoog: 18 },
      { lL: [25, 45], lR: [30, 50], aL: [-110, 20], aR: [110, 20], hoog: 8 },
      { lL: [45, 90], lR: [50, 95], aL: [-30, 40], aR: [30, 40], hd: [0, 1] },
    ][i - 6]
    pose = { ...sprong, x }
    // bal in een boog over de verdediger: van x(6)+15 naar x(11)+22
    const u = (i - 6) / 5
    const bx = (18 + 6 * 9 + 15) + u * ((18 + 11 * 9 + 22) - (18 + 6 * 9 + 15))
    bal = [bx, GROND - 5 - Math.sin(u * Math.PI) * 30]
  }
  speler(c, { ...pose, bal, balRot: (i % 4) * 90, zij: true })
})

sheet("chibi_animaties", ["ren", "schiet", "spring", "kop", "duik", "dribbel", "voorbij"], { pad: 2 })

// ═══════════════════════════════════════════════════════════════════════════════════════
// 8. CONTRACT: binnenkomen, tekenen, hand schudden met de eigenaar, shirt tonen. Met publiek.
// ═══════════════════════════════════════════════════════════════════════════════════════
pal({
  c: "#34343e", C: "#22222a",                    // jas speler (vrijetijdskleding)
  e: "#4a6fb0", E: "#33508a",                    // spijkerbroek
  P: "#2b3452", D: "#1b2138",                    // pak eigenaar (marine)
  l: "#c4c4cc", L: "#8e8e9a",                    // grijs haar eigenaar
  t: "#c8302c",                                  // stropdas
  f: "#efe4cc", F: "#dccdae",                    // muur
  J: "#c79f6e", T: "#a9824f",                    // houten vloer
  i: "#a8744f", I: "#6f4630",                    // tafel
  d: "#7a4a2a",                                  // deur / nette schoenen
  B: "#3b2a22",                                  // donkere deuropening
})

// ── Kleding van de onderdelen ───────────────────────────────────────────────────────────
// Speler in vrijetijdskleding: donkere jas over een wit T-shirt, spijkerbroek.
sprite("_romp_casual", { w: 31, h: 41 },
  stamp("_romp", 0, 0, { swap: { r: "c", R: "C", w: "c", W: "C", u: "e", U: "E" } }),
  poly([18, 26, 24, 26, 21, 31], "w"),           // wit shirt in de V van de jas
  vline(21, 32, 3, "C"),                          // rits
)
// Eigenaar: marineblauw pak, wit overhemd, rode das; grijs haar en een snor.
sprite("_romp_pak", { w: 31, h: 41 },
  rect(18, 25, 6, 2, "S"),
  rect(12, 26, 18, 10, "P"), rect(27, 26, 3, 10, "D"),
  poly([17, 26, 25, 26, 21, 33], "w"),
  line(17, 26, 21, 33, "D"), line(25, 26, 21, 33, "D"),        // revers
  rect(21, 27, 1, 6, "t"), rect(20, 27, 3, 1, "t"),           // das
  px(21, 34, "D"),                                             // knoop
  rect(12, 36, 18, 4, "P"), rect(12, 36, 18, 1, "D"),
)
sprite("_hoofd_baas", { w: 38, h: 26 },
  stamp("_hoofd", 0, 0, { swap: { h: "l", H: "L", j: "w" } }),
  rect(17, 20, 8, 2, "L"),                        // snor
)

const CASUAL = { romp: "_romp_casual", hoofd: "_hoofd", zijRomp: "_romp_zij_casual", zijHoofd: "_hoofd_zij", mouw: "c", mouw2: "C", onder: "c", onder2: "C",
  dij: "e", dij2: "E", kous: "e", kous2: "E", y: "x", Y: "X", zool: "z", zool2: "Z" }
sprite("_romp_zij_casual", { w: 31, h: 41 },
  stamp("_romp_zij", 0, 0, { swap: { r: "c", R: "C", w: "c", W: "C", u: "e", U: "E" } }),
  rect(24, 26, 3, 2, "w"))                        // wit shirt bij de hals
const BAAS = { romp: "_romp_pak", hoofd: "_hoofd_baas", mouw: "P", mouw2: "D", onder: "P", onder2: "D",
  dij: "P", dij2: "D", kous: "P", kous2: "D", y: "d", Y: "I", zool: "B", zool2: "B" }

// ── Rekwisieten ─────────────────────────────────────────────────────────────────────────
sprite("_logo", { w: 16, h: 13 }, `
  ..RRRRRRRRR
  ..RrwrwrwrR
  ..RrwrwrwrR
  ..RrwrwrwrR
  ..RrwrwrwrR
  ...RrwrwrR.
  ....RrwrR..
  .....RrR...
  ......R....`)                                 // clubschild: rood-wit gestreept
sprite("_shirt_toon", { w: 26, h: 20 },           // het nieuwe shirt, achterkant met nummer 10
  rect(5, 0, 16, 20, "r"),
  (c) => { for (let x = 5; x < 21; x++) if (((x - 5) >> 1) % 2) c.rect(x, 0, 1, 20, "w") },
  rect(0, 1, 5, 6, "r"), rect(21, 1, 5, 6, "r"),   // mouwen
  rect(0, 6, 5, 1, "R"), rect(21, 6, 5, 1, "R"),
  rect(10, 0, 6, 1, "R"),                          // kraag
  rect(7, 6, 12, 9, "r"),                          // vlak achter het nummer
  text(8, 8, "10", "w", { gap: 1 }),
  rect(5, 19, 16, 1, "R"),
)
sprite("_flits", { w: 9, h: 9 }, line(4, 0, 4, 8, "w"), line(0, 4, 8, 4, "w"), rect(3, 3, 3, 3, "w"), px(4, 4, "y"),
  px(2, 2, "y"), px(6, 2, "y"), px(2, 6, "y"), px(6, 6, "y"))

// Publiek gezien op de rug: achterhoofd + schouders. Fotografen houden een camera omhoog.
sprite("_publiek", { w: 20, h: 18 },
  ellipse(10, 15, 9, 5, "v"), rect(1, 15, 19, 3, "v"),
  circ(10, 6, 5, "h"), px(8, 3, "j"), px(9, 3, "j"))
sprite("_fotograaf", { w: 20, h: 26 },
  stamp("_publiek", 0, 8),
  rect(5, 0, 10, 6, "z"), rect(9, 1, 3, 3, "k"), rect(6, 1, 2, 1, "X"),   // camera met lens
  rect(4, 5, 3, 6, "s"), rect(14, 5, 3, 6, "s"))                           // handen
const RIJ = [   // [sprite, x, haar, kleding]
  ["_publiek", -4, "n", "u"], ["_fotograaf", 14, "h", "c"], ["_publiek", 32, "l", "V"],
  ["_publiek", 50, "j", "R"], ["_fotograaf", 70, "n", "E"], ["_publiek", 88, "h", "o"],
  ["_publiek", 106, "N", "c"], ["_publiek", 124, "l", "r"], ["_fotograaf", 142, "j", "P"],
  ["_publiek", 160, "n", "e"], ["_publiek", 178, "h", "D"], ["_fotograaf", 196, "n", "C"],
]

// ── De zaal (achtergrond) ───────────────────────────────────────────────────────────────
const ZW = 220, ZH = 124, VLOER = 100
sprite("_zaal", { w: ZW, h: ZH },
  rect(0, 0, ZW, VLOER, "f"), rect(0, 64, ZW, VLOER - 64, "F"), hline(0, 64, ZW, "T"),
  rect(0, VLOER, ZW, ZH - VLOER, "J"),
  (c) => { for (let y = VLOER + 5; y < ZH; y += 6) c.hline(0, y, ZW, "T") },     // planken
  // sponsorwand met clublogo's
  rect(44, 6, 170, 56, "w"), box(44, 6, 170, 56, "W"),
  pattern("_logo", 46, 8, 166, 52),
  // deur links, open
  rect(6, 40, 26, VLOER - 40, "d"), rect(9, 43, 20, VLOER - 43, "B"),
  rect(29, 43, 4, VLOER - 43, "i"),                                             // opengezwaaide deur
  // tafel met kleed, contract en vlaggetjes
  rect(70, 76, 84, 5, "i"), rect(70, 76, 84, 1, "f"),
  rect(70, 81, 84, 3, "I"),
  rect(70, 84, 84, 9, "r"), (c) => { for (let x = 72; x < 154; x += 4) c.rect(x, 84, 2, 9, "w") },   // tafelkleed in clubkleuren
  rect(74, 93, 3, 7, "I"), rect(147, 93, 3, 7, "I"),
  rect(100, 77, 16, 3, "w"), hline(102, 79, 12, "W"),                           // contract
  vline(76, 62, 14, "L"), rect(77, 62, 7, 5, "r"), rect(79, 62, 2, 5, "w"),      // vlaggetjes
  vline(148, 62, 14, "L"), rect(149, 62, 7, 5, "r"), rect(151, 62, 2, 5, "w"),
)

// ── Draaiboek ───────────────────────────────────────────────────────────────────────────
// Lopen: rustiger dan rennen (kleinere hoeken).
const loop = []
for (let i = 0; i < 8; i++) {
  const t = (i / 8) * Math.PI * 2
  const been = (f) => [24 * Math.sin(f), 10 + 30 * Math.max(0, Math.cos(f))]
  loop.push({ lR: been(t), lL: been(t + Math.PI), aR: [-25 * Math.sin(t), 30], aL: [25 * Math.sin(t), 30] })
}
const staan = { lL: [-4, 4], lR: [4, 4], aL: [-12, 15], aR: [12, 15] }
const SX = 88, BX = 128, DY = VLOER - GROND                 // eindpositie speler, eigenaar; verschuiving naar de zaal

// Eigenaar: houdingen (naar rechts getekend, gespiegeld gestempeld zodat hij naar links kijkt).
const baas = (naam, P) => sprite(naam, { w: 70, h: 90, outline: "k" }, (c) => speler(c, { x: 35, ...staan, ...P, team: BAAS }))
baas("_baas_staan", {})
baas("_baas_hand1", { aR: [62, 25] })
baas("_baas_hand2", { aR: [72, 25] })
baas("_baas_klap1", { aL: [-20, 120], aR: [20, 110] })
baas("_baas_klap2", { aL: [-35, 100], aR: [35, 95] })

const FRAMES = 52
// Welke fotograaf (index in RIJ) flitst in welk frame.
const FLITS = { 30: [4], 31: [1], 33: [8], 35: [11], 38: [4, 8], 40: [1], 41: [11], 43: [4], 44: [8], 46: [1, 11], 48: [4], 50: [8] }

// Speler per frame: x-positie en tekening (binnen een sprite met omlijning).
const spelerX = (f) => f < 16 ? Math.round(14 + f * ((SX - 14) / 15)) : SX
function spelerTekenen(c, f) {
  const B = { ...staan, x: 40, team: CASUAL }
  if (f < 16) return speler(c, { ...B, ...loop[f % 8], zij: true })              // binnenlopen (zijaanzicht)
  if (f < 18) return speler(c, { ...B, aR: [40, 30] })                            // pakt de pen
  if (f < 28) {                                                                   // tekenen
    const hand = speler(c, { ...B, aR: [44 + ((f - 18) % 2) * 6, 22], hd: [1, 2] })
    c.line(hand[0] + 1, hand[1] - 1, hand[0] + 3, hand[1] - 5, "k")               // pen
    c.line(hand[0] + 2, hand[1] - 2, hand[0] + 3, hand[1] - 4, "w")
    return
  }
  if (f < 30) return speler(c, B)                                                 // klaar
  if (f < 38) return speler(c, { ...B, aR: [f % 2 ? 62 : 72, 25] })               // hand schudden
  // shirt voor de borst; armen omhoog naar de schouders van het shirt, vuisten er bovenop
  const op = f === 38 ? 4 : 0                                                     // eerste frame: komt omhoog
  // heup ligt op y = 58 in deze sprite, schouders op 47: korte armen (0,4×) wijzen naar de shirtschouders
  speler(c, { ...B, aL: [-154, 0], aR: [154, 0], arm: 0.4 })
  const sy = 42 + op                                                              // bovenkant shirt (borsthoogte)
  c.stamp("_shirt_toon", 40 - 13, sy)
  vuist(c, 40 - 12, sy + 1, "S"); vuist(c, 40 + 12, sy + 1, "s")
}
for (let f = 0; f < 52; f++) sprite("_sp_" + f, { w: 80, h: 90, outline: "k" }, (c) => spelerTekenen(c, f))

anim("contract", { w: ZW, h: ZH, frames: FRAMES, fps: 8, outline: "k" }, (c) => {
  const f = c.frame
  c.stamp("_zaal", 0, 0)

  // eigenaar
  const bh = f >= 30 && f < 38 ? (f % 2 ? "_baas_hand1" : "_baas_hand2")
    : f >= 38 ? (f % 2 ? "_baas_klap1" : "_baas_klap2") : "_baas_staan"
  c.stamp(bh, BX - 35 - 1, DY - 1, { flip: "x" })              // -1: de omlijning maakt de sprite 1 px groter

  // speler (per frame een eigen sprite, zie hieronder)
  c.stamp("_sp_" + f, spelerX(f) - 40 - 1, DY - 1)

  // handtekening groeit tijdens het tekenen en blijft daarna staan
  const n = Math.max(0, Math.min(10, f - 17))
  const krabbel = [[102, 78], [103, 77], [104, 78], [105, 78], [106, 77], [107, 78], [108, 77], [109, 78], [110, 78], [111, 77]]
  for (let i = 0; i < n; i++) c.px(krabbel[i][0], krabbel[i][1], "D")

  // publiek op de voorgrond + flitsen
  RIJ.forEach(([naam, x, haar, kleding], i) => {
    const y = naam === "_fotograaf" ? ZH - 26 + 2 : ZH - 18 + 2
    c.stamp(naam, x, y, { swap: { h: haar, j: haar === "h" ? "j" : haar, v: kleding } })
    if ((FLITS[f] ?? []).includes(i)) c.stamp("_flits", x + 6, y - 7)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// 9. OPKOMST: beide teams lopen uit de spelerstunnel, stellen zich op, daarna de opstellingen.
// ═══════════════════════════════════════════════════════════════════════════════════════
pal({ K: "#0f1424", M: "#ffe9a8", b: "#3c4a6e" })   // nachtlucht, lichtmast, tribunerand

// Zijaanzicht van de tegenstander-romp
sprite("_romp_zij_uit", { w: 31, h: 41 }, stamp("_romp_zij", 0, 0, { swap: { r: "v", R: "V", w: "o", W: "O", u: "x", U: "X" } }))
const UIT2 = { ...UIT, hoofd: "_hoofd", zijRomp: "_romp_zij_uit", zijHoofd: "_hoofd_zij" }   // haar komt uit de look
const THUIS2 = { ...THUIS }

// Uiterlijk per speler: huid (s/S), haar (h/H/j). Keepers krijgen een eigen tenue.
const HUID = { licht: ["s", "S"], getint: ["i", "I"], donker: ["d", "B"] }
const HAAR = { rood: ["h", "H", "j"], zwart: ["n", "N", "m"], blond: ["y", "Y", "w"], bruin: ["i", "I", "h"] }
const look = (huid, haar, extra = {}) => ({ s: HUID[huid][0], S: HUID[huid][1], h: HAAR[haar][0], H: HAAR[haar][1], j: HAAR[haar][2], ...extra })
const KEEPER_THUIS = { kit: { r: "g", R: "G", w: "q", W: "Q", u: "k", U: "k" }, T: { r: "g", R: "G", kous: "k", kous2: "k" } }
const KEEPER_UIT = { kit: { v: "X", V: "x", o: "z", O: "Z", x: "k", X: "k" }, T: { r: "X", R: "x", kous: "z", kous2: "Z" } }
const SELECTIE = {
  thuis: { team: THUIS2, nummers: [1, 2, 4, 5, 3, 8, 6, 10, 7, 9, 11], looks: [
    look("licht", "bruin", KEEPER_THUIS), look("getint", "zwart"), look("licht", "blond"), look("donker", "zwart"),
    look("licht", "rood"), look("getint", "bruin"), look("licht", "zwart"), look("licht", "rood"),
    look("donker", "zwart"), look("licht", "blond"), look("getint", "zwart")] },
  uit: { team: UIT2, nummers: [1, 2, 4, 5, 3, 7, 6, 8, 11, 9, 10], looks: [
    look("licht", "zwart", KEEPER_UIT), look("licht", "blond"), look("donker", "zwart"), look("getint", "zwart"),
    look("licht", "bruin"), look("licht", "zwart"), look("donker", "zwart"), look("licht", "rood"),
    look("getint", "bruin"), look("licht", "zwart"), look("licht", "blond")] },
}

// Opbouw zoals bij een tv-uitzending / FIFA-intro:
//   1. tunnel: scheidsrechters voorop, aanvoerders met band vooraan hun rij
//   2. opstelling: iedereen in één rij, camera schuift langs met een naambalk
//   3. handjes schudden: het uitteam loopt langs het thuisteam
//   4. opstellingsscherm met formaties

// Namen (verzonnen, veelvoorkomende achternamen) en aanvoerders.
const NAMEN = {
  thuis: ["JANSEN", "DE VRIES", "BAKKER", "VISSER", "SMIT", "MEIJER", "MULDER", "DE BOER", "BOS", "VOS", "PETERS"],
  uit: ["HENDRIKS", "DEKKER", "BROUWER", "DE WIT", "DIJKSTRA", "SMITS", "DE GRAAF", "VAN DAM", "KOK", "JACOBS", "VERMEULEN"],
}
const AANVOERDER = { thuis: 7, uit: 3 }          // index in SELECTIE (thuis: nr. 10, uit: nr. 5)

// Scheidsrechters: geel shirt, zwarte broek en kousen. De twee assistenten dragen een vlag.
const SCHEIDS_KIT = { kit: { r: "o", R: "O", w: "o", W: "O", u: "z", U: "Z" },
  T: { r: "o", R: "O", kous: "z", kous2: "Z", y: "z", Y: "Z", zool: "k", zool2: "k" } }
const SCHEIDS = [
  { naam: "SCHEIDSRECHTER", look: look("licht", "zwart", SCHEIDS_KIT), vlag: false },
  { naam: "ASSISTENT 1", look: look("getint", "bruin", SCHEIDS_KIT), vlag: true },
  { naam: "ASSISTENT 2", look: look("licht", "blond", SCHEIDS_KIT), vlag: true },
]
function vlag(c, [hx, hy]) {                     // vlaggetje in de hand
  c.line(hx, hy - 9, hx, hy + 2, "W")
  c.rect(hx + 1, hy - 9, 6, 5, "o"), c.rect(hx + 1, hy - 9, 3, 3, "r"), c.rect(hx + 4, hy - 7, 3, 3, "r")
}

// Iedereen die meedoet: sleutel → { team, look, band, vlag }
const MENSEN = {}
for (const kant of ["thuis", "uit"]) SELECTIE[kant].looks.forEach((lk, i) =>
  MENSEN[`${kant}${i}`] = { team: SELECTIE[kant].team, look: lk, band: i === AANVOERDER[kant] ? "y" : undefined })
SCHEIDS.forEach((r, i) => MENSEN[`ref${i}`] = { team: THUIS2, look: r.look, vlag: r.vlag })

// Sprites per persoon (allemaal met eigen omlijning):
//   _op_<id>_<k>   lopen in zijaanzicht (8 frames)
//   _op_<id>_staan stilstaan in vooraanzicht
//   _op_<id>_hand  vooraanzicht met uitgestoken hand (handjes schudden)
//   _op_<id>_hl<k> lopen met uitgestoken hand (zijaanzicht), voor wie langs de rij loopt
for (const [id, M] of Object.entries(MENSEN)) {
  const basis = { x: 35, team: M.team, look: M.look, band: M.band }
  const metVlag = (P) => (c) => { const h = speler(c, P); if (M.vlag) vlag(c, h) }
  for (let k = 0; k < 8; k++) {
    sprite(`_op_${id}_${k}`, { w: 70, h: 90, outline: "k" }, metVlag({ ...basis, ...loop[k], zij: true }))
    sprite(`_op_${id}_hl${k}`, { w: 70, h: 90, outline: "k" }, metVlag({ ...basis, ...loop[k], aR: [80, 5], zij: true }))
  }
  sprite(`_op_${id}_staan`, { w: 70, h: 90, outline: "k" }, metVlag({ ...basis, ...staan, aL: [-8, 10], aR: [8, 10] }))
  sprite(`_op_${id}_hand`, { w: 70, h: 90, outline: "k" }, metVlag({ ...basis, ...staan, aL: [-8, 10], aR: [72, 8] }))
  sprite(`_op_${id}_zstaan`, { w: 70, h: 90, outline: "k" }, metVlag({ ...basis, ...staan, aL: [-4, 8], aR: [4, 8], zij: true }))   // wachten in de tunnel
  sprite(`_op_${id}_zhand`, { w: 70, h: 90, outline: "k" }, metVlag({ ...basis, ...staan, aL: [-5, 10], aR: [80, 5], zij: true }))   // zijaanzicht, hand vooruit
}

// ── Stadion (breedte instelbaar: de opstellingsrij is breder dan het beeld) ─────────────
const SW = 380, SH = 200
sprite("_fan", { w: 7, h: 9 },
  rect(2, 0, 3, 1, "h"), rect(2, 1, 3, 3, "s"), rect(1, 4, 5, 5, "r"))
sprite("_fan_juich", { w: 7, h: 9 },
  stamp("_fan", 0, 0), px(0, 1, "s"), px(6, 1, "s"), px(0, 2, "r"), px(6, 2, "r"), px(1, 3, "r"), px(5, 3, "r"))
const FAN_KLEUR = [{}, { r: "w" }, { r: "R" }, { r: "v", s: "i", h: "n" }, { r: "o", h: "n" }, { r: "c", s: "d", h: "n" }, { h: "y" }, { r: "w", s: "i" }]
const RECLAME = [["PIXEL CUP 2026", "y"], ["CHIBI SPORT", "o"], ["GOAL!", "w"]]

function stadion(naam, w, tunnel) {
  sprite(naam, { w, h: SH },
    rect(0, 0, w, 22, "K"),
    (c) => { for (let x = 40; x < w; x += 290) { c.rect(x, 0, 3, 22, "b"); c.rect(x - 8, 2, 19, 7, "M"); c.rect(x - 8, 2, 19, 1, "w") } },
    rect(0, 20, w, 88, "C"),
    (c) => { for (let y = 28; y < 106; y += 10) c.hline(0, y, w, "c") },
    pattern("_fan", 0, 19, w, 88, { rswap: FAN_KLEUR, seed: 3 }),
    pattern("_fan_juich", 0, 19, w, 88, { rswap: FAN_KLEUR, seed: 9 }),
    rect(0, 106, w, 3, "b"),
    rect(0, 109, w, 13, "K"), rect(0, 109, w, 1, "b"), rect(0, 121, w, 1, "b"),
    (c) => { let x = 8, i = 0; while (x < w) { const [t, k] = RECLAME[i % 3]; c.text(x, 113, t, k); x += t.length * 4 + 24; i++ } },
    (c) => { let y = 122, h = 7, i = 0; while (y < SH) { c.rect(0, y, w, h, i % 2 ? "G" : "g"); y += h; h += 3; i++ } },
    hline(0, 126, w, "w"),
    ...(tunnel ? [rect(0, 58, 52, 66, "I"), rect(0, 58, 52, 4, "i"), rect(0, 66, 46, 58, "B"), rect(46, 62, 6, 62, "i"),
      text(6, 61, "TUNNEL", "M")] : []),
  )
}
stadion("_stadion", SW, true)

// Tunnelwereld: links de gang als doorsnede, rechts het stadion. De camera volgt de spelers naar buiten.
const TG = 300                                   // lengte van de gang (x 0..TG)
const TW = TG + 380                              // breedte van de hele wereld
stadion("_stadion_open", TW - TG, false)
sprite("_tunnel_wereld", { w: TW, h: SH },
  stamp("_stadion_open", TG, 0),
  // plafond met balken en lampen
  rect(0, 0, TG, 34, "b"), (c) => { for (let x = 0; x < TG; x += 25) c.rect(x, 0, 3, 34, "K") },
  (c) => { for (let x = 20; x < TG - 20; x += 55) { c.rect(x, 31, 18, 3, "M"); c.rect(x + 2, 34, 14, 1, "w") } },
  // achterwand (beton) met panelen, plint in clubkleuren, logo en tekst
  rect(0, 34, TG, 88, "c"), (c) => { for (let x = 0; x < TG; x += 40) c.vline(x, 34, 82, "C") },
  rect(0, 116, TG, 6, "r"), rect(0, 116, TG, 1, "R"),
  stamp("_logo", 60, 52), stamp("_logo", 200, 52),
  text(130, 56, "ROOD-WIT FC", "w"), text(130, 66, "DIT IS ONS HUIS", "M"),
  text(236, 92, "VELD", "y"), line(254, 94, 262, 94, "y"), px(261, 93, "y"), px(261, 95, "y"),   // bordje met pijl
  // vloer met rubberen mat
  rect(0, 122, TG, SH - 122, "z"), (c) => { for (let y = 130; y < SH; y += 12) c.hline(0, y, TG, "Z") },
  // uitgang: zware lijst bovenaan, pilaar tegen de achterwand, licht van buiten
  rect(TG - 14, 0, 22, 46, "I"), rect(TG - 14, 0, 22, 3, "i"), rect(TG - 8, 46, 10, 76, "I"), rect(TG - 8, 46, 2, 76, "i"),
  text(TG - 11, 18, "OUT", "M"),
)

// Opstellingsscherm (achtergrond zonder spelers)
const VELD = { thuis: [12, 46], uit: [198, 46] }, VB = 170, VH = 146
sprite("_opstelling", { w: SW, h: SH },
  rect(0, 0, SW, SH, "K"), rect(0, 0, SW, 2, "y"), rect(0, SH - 2, SW, 2, "y"),
  text(SW / 2, 6, "OPSTELLING", "w", { scale: 2, align: "c" }),
  text(VELD.thuis[0] + VB / 2, 26, "ROOD-WIT FC", "r", { align: "c" }),
  text(VELD.thuis[0] + VB / 2, 35, "4-3-3", "y", { align: "c" }),
  text(VELD.uit[0] + VB / 2, 26, "BLAUW-GEEL", "o", { align: "c" }),
  text(VELD.uit[0] + VB / 2, 35, "4-4-2", "y", { align: "c" }),
  (c) => {
    for (const [x0, y0] of Object.values(VELD)) {
      for (let y = 0; y < VH; y += 16) c.rect(x0, y0 + y, VB, 8, "g"), c.rect(x0, y0 + y + 8, VB, Math.min(8, VH - y - 8), "G")
      c.box(x0, y0, VB, VH, "w")
      c.box(x0 + 45, y0 + VH - 32, 80, 32, "w"), c.box(x0 + 67, y0 + VH - 12, 36, 12, "w")   // strafschopgebied + doelgebied
      c.rect(x0 + 75, y0 + VH - 1, 20, 1, "W")                                              // doel
      c.clip([x0, y0, VB, VH], () => {})
      for (let a = 0; a <= 180; a += 3) {                                                   // middencirkel (halve)
        const r = 20, px = Math.round(x0 + VB / 2 + Math.cos((a * Math.PI) / 180) * r), py = Math.round(y0 + Math.sin((a * Math.PI) / 180) * r)
        c.px(px, py, "w")
      }
    }
  },
)

const FORMATIE = {
  thuis: [[85, 132], [22, 104], [63, 108], [107, 108], [148, 104], [40, 72], [85, 76], [130, 72], [28, 34], [85, 26], [142, 34]],
  uit: [[85, 132], [22, 104], [63, 108], [107, 108], [148, 104], [20, 70], [63, 74], [107, 74], [150, 70], [60, 32], [110, 32]],
}

// ── Deel 2: de lange rij (thuis | scheidsrechters | uit) als één brede sprite ────────────
const RIJ_AFSTAND = 28, RIJ_VOET = 170, RIJ_MARGE = 40
const OPRIJ = [
  ...[0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 7].map((i) => `thuis${i}`),        // aanvoerder naast de scheidsrechters
  "ref1", "ref0", "ref2",
  ...[3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10].map((i) => `uit${i}`),          // aanvoerder naast de scheidsrechters
]
const RIJ_W = RIJ_MARGE * 2 + (OPRIJ.length - 1) * RIJ_AFSTAND + 40
stadion("_stadion_breed", RIJ_W, false)
sprite("_rij", { w: RIJ_W, h: SH },
  stamp("_stadion_breed", 0, 0),
  (c) => OPRIJ.forEach((id, j) => c.stamp(`_op_${id}_staan`, RIJ_MARGE + 20 + j * RIJ_AFSTAND - 35 - 1, RIJ_VOET - GROND - 1)))
const naamVan = (id) => id.startsWith("ref") ? [SCHEIDS[+id[3]].naam, "", "o"]
  : (([, kant, i]) => [NAMEN[kant][+i], String(SELECTIE[kant].nummers[+i]), kant === "thuis" ? "r" : "v"])(id.match(/(thuis|uit)(\d+)/))

// ── Draaiboek ───────────────────────────────────────────────────────────────────────────
const T1 = 0, T2 = 78, T3 = 140, T4 = 176, OP_FRAMES = 216       // begin van elk deel
const WACHT = 12                                  // frames dat ze stilstaan in de tunnel
const STAP = 6, AFSTAND = 30
// Volgorde in de tunnel: achterste baan = scheidsrechters + uitteam, voorste baan = thuisteam.
const BAAN = {
  achter: { voet: 142, start: 270, ids: ["ref0", "ref1", "ref2", `uit${AANVOERDER.uit}`, ...[0, 1, 2, 4, 5, 6, 7, 8, 9, 10].map((i) => `uit${i}`)] },
  voor: { voet: 194, start: 252, ids: [`thuis${AANVOERDER.thuis}`, ...[0, 1, 2, 3, 4, 5, 6, 8, 9, 10].map((i) => `thuis${i}`)] },
}
const FLITS3 = [[56, 60, 40], [60, 220, 55], [64, 130, 30], [68, 300, 70], [73, 80, 75]]   // pas als de camera buiten is

function naambalk(c, id) {                        // onderin beeld, zoals een tv-graphic
  const [naam, nr, kleur] = naamVan(id)
  c.rect(0, 176, SW, 18, "K"), c.rect(0, 176, SW, 1, "y")
  c.rect(10, 179, 26, 12, kleur)
  c.text(23, 183, nr || "-", kleur === "o" ? "k" : "w", { align: "c" })
  c.text(44, 181, naam, "w", { scale: 2 })
}

anim("opkomst", { w: SW, h: SH, frames: OP_FRAMES, fps: 10, outline: "k" }, (c) => {
  const f = c.frame

  if (f < T2) {
    // 1. TUNNEL: eerst wachten in de gang, dan naar buiten; de camera volgt de kop van de stoet
    const gelopen = Math.max(0, f - WACHT) * STAP
    const camX = Math.max(0, Math.min(TW - SW, BAAN.achter.start + gelopen - 200))
    c.stamp("_tunnel_wereld", -camX, 0)
    for (const baan of [BAAN.achter, BAAN.voor]) baan.ids.forEach((id, i) => {
      const x = baan.start - i * AFSTAND + gelopen - camX
      if (x < -40 || x > SW + 40) return
      const naam = f < WACHT ? `_op_${id}_zstaan` : `_op_${id}_${(f + i * 3) % 8}`
      c.stamp(naam, Math.round(x) - 36, baan.voet - GROND - 1)
    })
    for (const [ff, x, y] of FLITS3) if (ff === f || ff + 1 === f) c.stamp("_flits", x, y)
    if (f < WACHT) { c.rect(0, 0, SW, 14, "K"); c.text(SW / 2, 4, "ROOD-WIT FC  -  BLAUW-GEEL", "w", { align: "c" }) }   // titel bovenin

  } else if (f < T3) {
    // 2. OPSTELLING: camera schuift langs de rij; naambalk toont wie in het midden staat
    const u = (f - T2) / (T3 - T2 - 1)
    const camX = Math.round(u * (RIJ_W - SW))
    c.stamp("_rij", -camX, 0)
    const midden = camX + SW / 2
    const j = Math.max(0, Math.min(OPRIJ.length - 1, Math.round((midden - RIJ_MARGE - 20) / RIJ_AFSTAND)))
    naambalk(c, OPRIJ[j])

  } else if (f < T4) {
    // 3. HANDJES SCHUDDEN: thuisteam staat met de hand uit, uitteam loopt van rechts naar links langs
    c.stamp("_stadion_breed", 0, 0)
    const t = f - T3
    for (let i = 0; i < 11; i++) c.stamp(`_op_thuis${i}_zhand`, 14 + i * 34 - 36, 158 - GROND - 1)   // thuis kijkt naar rechts
    for (let i = 0; i < 11; i++) {
      const x = SW + 30 + i * 34 - t * 14
      if (x < -40 || x > SW + 40) continue
      c.stamp(`_op_uit${i}_hl${(t + i * 3) % 8}`, Math.round(x) - 36, 166 - GROND - 1, { flip: "x" })   // uit loopt naar links (iets ervoor), handen op gelijke hoogte
    }
    c.rect(0, 0, SW, 14, "K"); c.text(SW / 2, 4, "FAIR PLAY", "y", { align: "c" })
  }

  if (f >= T4 - 4) {
    // 4. OPSTELLINGSSCHERM schuift in beeld, spelers verschijnen één voor één
    const dx = f < T4 ? Math.round(SW * (1 - (f - (T4 - 5)) / 5)) : 0
    c.stamp("_opstelling", dx, 0)
    if (f >= T4) {
      const zichtbaar = f - T4 + 1
      for (const [k, kant] of ["thuis", "uit"].entries()) FORMATIE[kant].forEach(([px, py], i) => {
        if (k * 11 + i >= zichtbaar) return
        const [x0, y0] = VELD[kant], x = x0 + px, y = y0 + py
        const keeper = i === 0
        const kleur = kant === "thuis" ? (keeper ? "y" : "r") : (keeper ? "X" : "v")
        const cijfer = kant === "thuis" ? (keeper ? "k" : "w") : (keeper ? "k" : "o")
        c.circ(x, y, 7, i === AANVOERDER[kant] ? "y" : "k"); c.circ(x, y, 6, kleur)
        c.text(x + 1, y - 2, String(SELECTIE[kant].nummers[i]), cijfer, { align: "c" })
      })
    }
  }
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// 10. KRANT: voorpagina over de transfer, met de persfoto uit de contract-scène.
// ═══════════════════════════════════════════════════════════════════════════════════════
const KW = 200, KH = 272
// Persfoto = uitsnede van de contract-scène (zaal + speler met shirt + klappende eigenaar).
const FOTO = [10, 116, 180, 72]                   // x, y, b, h op de krant
const FOTO_BRON = [20, 28]                        // linksboven van de uitsnede in de zaal
sprite("_krant", { w: KW, h: KH },
  rect(0, 0, KW, KH, "f"),
  // kop van de krant
  text(KW / 2, 6, "DE PIXEL KRANT", "k", { scale: 2, align: "c" }),
  hline(6, 22, KW - 12, "k"), hline(6, 24, KW - 12, "k"),
  text(8, 27, "DINSDAG 10 NOVEMBER 2026", "L"), text(KW - 8, 27, "EUR 2.50", "L", { align: "r" }),
  hline(6, 33, KW - 12, "k"),
  // rubriek
  rect(6, 37, 74, 9, "r"), text(9, 39, "TRANSFERNIEUWS", "w"),
  text(KW - 8, 39, "SPORT", "r", { align: "r" }),
  // hoofdkop
  text(KW / 2, 52, "DE BOER", "k", { scale: 3, align: "c" }),
  text(KW / 2, 72, "TEKENT BIJ", "k", { scale: 3, align: "c" }),
  text(KW / 2, 92, "ROOD-WIT!", "r", { scale: 3, align: "c" }),
  hline(30, 110, KW - 60, "L"),
  // foto met lijst
  rect(FOTO[0] - 2, FOTO[1] - 2, FOTO[2] + 4, FOTO[3] + 4, "k"),
  clip([FOTO[0], FOTO[1], FOTO[2], FOTO[3]],
    stamp("_zaal", FOTO[0] - FOTO_BRON[0], FOTO[1] - FOTO_BRON[1]),
    stamp("_baas_klap1", FOTO[0] - FOTO_BRON[0] + BX - 36, FOTO[1] - FOTO_BRON[1] + DY - 1, { flip: "x" }),
    stamp("_sp_44", FOTO[0] - FOTO_BRON[0] + SX - 41, FOTO[1] - FOTO_BRON[1] + DY - 1)),
  // onderschrift
  text(8, 193, "DE BOER TOONT ZIJN NIEUWE SHIRT MET", "k"),
  text(8, 200, "RUGNUMMER 10. FOTO: PIXEL PERS", "L"),
  hline(6, 208, KW - 12, "L"),
  // artikel (twee kolommen 'tekst') en een kader met de feiten
  text(8, 213, "PIXELSTAD -", "k"),
  (c) => {
    const regels = [38, 52, 56, 44, 54, 50, 30, 54, 48, 56, 40, 22]
    regels.forEach((l, i) => { const x = i < 6 ? 8 : 70, y = (i < 6 ? 221 : 213) + (i % 6) * 8 + (i < 6 ? 0 : 0); c.rect(x, y, l, 2, "L") })
    c.rect(52, 213, 10, 2, "L")
  },
  rect(130, 212, 64, 52, "w"), box(130, 212, 64, 52, "k"), rect(130, 212, 64, 9, "k"),
  text(162, 214, "DE DEAL", "y", { align: "c" }),
  text(134, 225, "DUUR", "L"), text(190, 225, "4 JAAR", "k", { align: "r" }),
  text(134, 235, "NUMMER", "L"), text(190, 235, "10", "k", { align: "r" }),
  text(134, 245, "BEDRAG", "L"), text(190, 245, "25 MLN", "k", { align: "r" }),
  text(134, 255, "CLUB", "L"), text(190, 255, "ROOD-WIT", "r", { align: "r" }),
  // gevouwen hoek
  poly([KW - 10, 0, KW, 0, KW, 10], "F"), line(KW - 10, 0, KW, 10, "L"),
)

// Animatie: de krant draait het beeld in en komt tot stilstand (zoals in oude films).
const KA_W = 300, KA_H = 300
anim("krant", { w: KA_W, h: KA_H, frames: 24, fps: 12 }, (c) => {
  c.rect(0, 0, KA_W, KA_H, "K")
  const t = Math.min(1, c.frame / 15)
  const hoek = Math.round(690 * (1 - t) * (1 - t) / 15) * 15     // afremmend draaien (start schuin: 690° = 330°), stappen van 15°
  if (hoek === 0) {
    c.rect(KA_W / 2 - KW / 2 + 4, KA_H / 2 - KH / 2 + 4, KW, KH, "k")   // schaduw
    c.stamp("_krant", KA_W / 2 - KW / 2, KA_H / 2 - KH / 2)
  } else {
    // gedraaid: het canvas groeit, dus centreren op het midden van de gedraaide sprite
    const r = (hoek * Math.PI) / 180, bw = Math.abs(KW * Math.cos(r)) + Math.abs(KH * Math.sin(r)), bh = Math.abs(KW * Math.sin(r)) + Math.abs(KH * Math.cos(r))
    c.stamp("_krant", Math.round(KA_W / 2 - bw / 2), Math.round(KA_H / 2 - bh / 2), { rot: hoek })
  }
})
