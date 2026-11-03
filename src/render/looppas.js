/* ===================== Looppas met voeten op de grond ===================== */
// Naar de looppas uit voetbal-kern.js: de voeten worden op de grond GEPLAND en daarna rekent een two-bone IK de hoeken van
// dij en knie uit. In de steunfase schuift de voet (in het frame van de speler) precies zo snel naar achteren als het lichaam
// vooruit gaat: dan staat hij stil op de grond. Alles in de maten van het hulpskelet (veld3d.js: dij en scheen .44, heup op .92).
export const POP = {dij:.44, scheen:.44, heup:.92, enkel:.04};
const klem = (v, a, b) => Math.min(b, Math.max(a, v));
const zacht = (a, b, x) => { if (b <= a) return x >= a ? 1 : 0; const t = klem((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const golf = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// fase: de looppas van de speler (2π per twee stappen; bij π/2 staat het linkerbeen voor, zoals de armzwaai in veld3d.js)
// v: snelheid in veldmeters per seconde, schaal: hoeveel keer groter de speler is dan het hulpskelet, B: de bewegingsgetallen
export function looppas(fase, v, schaal, B){
  const stap = B.pasBasis + B.pasPerSnelheid * v, cyclus = 2 * stap / schaal; // (een hele cyclus, in maten van het hulpskelet)
  const g = zacht(.05, 1, v), run = zacht(2.2, 4.5, v), spr = zacht(5.5, 7.6, v);
  const zHalf = Math.min(cyclus * lerp(B.dutyWandel, B.dutyRennen, run) / 2, B.contactMax), duty = Math.min(.85, 2 * zHalf / cyclus);
  const lift = lerp(B.tilWandel, B.tilRennen, run) + B.tilSprint * spr;
  const voet = p => {
    if (p < duty){ const u = p / duty; return {stand:true, u, z:zHalf * (1 - 2 * u) * g, lift:0, hoek:(-.15 * (1 - u) ** 4 + .3 * u ** 4) * g}; }
    const u = (p - duty) / (1 - duty), e = golf(u);
    return {stand:false, u, z:zHalf * (2 * e - 1) * g, lift:lift * Math.sin(Math.PI * Math.pow(u, .75)) * g, hoek:lerp(.3, -.15, e) * g};
  };
  const pL = (((fase / (2 * Math.PI) - .25) % 1) + 1) % 1, pR = (pL + .5) % 1, L = voet(pL), R = voet(pR);
  // heuphoogte: het steunbeen als omgekeerde slinger (en het veert in bij rennen); geen steunbeen = de zweeffase
  const reik = (POP.dij + POP.scheen) * .985, door = B.doorKnieen * run;
  let heup = POP.heup - door, steun = false;
  for (const t of [L, R]) if (t.stand){ steun = true; heup = Math.min(heup, POP.enkel + Math.sqrt(Math.max(0, reik * reik - t.z * t.z)) - run * B.inveren * Math.sin(Math.PI * t.u)); }
  if (!steun){ const f = klem(((pL % .5) - duty) / (.5 - duty), 0, 1);
    heup = Math.min(POP.heup - door, POP.enkel + Math.sqrt(Math.max(0, reik * reik - (zHalf * g) ** 2))) + run * B.zweef * Math.sin(Math.PI * f); }
  return {L, R, heup, duty, zHalf};
}
// Two-bone IK in het vlak van het been: het doel (z vooruit, y omhoog) ten opzichte van het heupgewricht.
// Geeft d (bovenbeen naar voren) en k (knie buigen), zoals de hoeken van het hulpskelet
export function ikBeen(z, y){
  const a = POP.dij, b = POP.scheen, d = klem(Math.hypot(z, y), Math.abs(a - b) + 1e-3, a + b - 1e-4);
  const naar = Math.atan2(z, -y), alfa = Math.acos(klem((a * a + d * d - b * b) / (2 * a * d), -1, 1)), knie = Math.acos(klem((a * a + b * b - d * d) / (2 * a * b), -1, 1));
  return {d:naar + alfa, k:Math.PI - knie};
}
// De hoeken van beide benen bij deze looppas. leun: het lichaam leunt voorover (het hulpskelet draait om de grond onder de speler)
export function beenHoeken(lp, leun){
  const c = Math.cos(-leun), s = Math.sin(-leun), uit = {};
  for (const [k, t] of [['L', lp.L], ['R', lp.R]]){
    // enkel iets hoger als de voet kantelt (hiel of tenen omlaag), anders zakt de zool door de grond
    const y0 = POP.enkel + t.lift + (t.hoek > 0 ? .1 * Math.sin(t.hoek) : .04 * Math.sin(-t.hoek)), z0 = t.z;
    // naar het frame van het lijf (dat staat lp.heup - POP.heup hoger en leunt om zijn eigen oorsprong), dan ten opzichte van het heupgewricht
    const yy = y0 - (lp.heup - POP.heup), y = yy * c - z0 * s, z = yy * s + z0 * c, r = ikBeen(z, y - POP.heup);
    uit['d' + k] = r.d; uit['k' + k] = r.k; uit['v' + k] = t.hoek;
  }
  return uit;
}
