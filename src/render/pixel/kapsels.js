/* ===================== Kapsels voor de pixelspeler ===================== */
// Het hoofd is 38×26 (gezicht x 10-31, y 10-24; oren x 5-7 en 34-36, y 14-18). 'model' is het haar uit de stijlbron
// (art/chibi_anims.px.js). haarAchter komt vóór het gezicht, haarVoor erna (de pony, en haar dat over de oren valt).
// Sleutels: h = haar, H = donker haar, j = licht haar, s/S = huid (een kaal hoofd).

const MODEL = c => {
  c.rect(8, 3, 26, 9, 'h');
  c.rect(7, 8, 3, 9, 'h'); c.rect(32, 8, 3, 9, 'h');
  c.rect(10, 1, 22, 2, 'h'); c.rect(13, 0, 16, 1, 'h');
  for (const x of [13, 18, 23, 28]) c.line(x, 2, x - 2, 8, 'H');
  for (const x of [11, 16, 21]) c.rect(x, 2, 3, 1, 'j');
};
const PONY = c => { for (let x = 10; x < 32; x++) c.px(x, 10 + (x % 3 === 0 ? 1 : 0), 'H'); };
const KORT = c => {
  c.rect(9, 4, 24, 7, 'h'); c.rect(11, 3, 20, 1, 'h');
  c.rect(8, 8, 2, 5, 'h'); c.rect(32, 8, 2, 5, 'h');
  for (const x of [14, 20, 26]) c.line(x, 4, x - 1, 8, 'H');
  c.rect(12, 4, 3, 1, 'j'); c.rect(18, 4, 3, 1, 'j');
};
const RECHTE_PONY = c => c.hline(10, 10, 22, 'H');

const ACHTER = {
  model: MODEL,
  kort: KORT,
  kuif: c => { KORT(c); c.rect(19, 1, 13, 4, 'h'); c.rect(22, 0, 9, 1, 'h'); c.rect(21, 1, 8, 1, 'j'); c.line(19, 4, 31, 2, 'H'); },
  krul: c => {
    c.rect(9, 5, 24, 6, 'h');
    for (const [x, y] of [[10, 6], [15, 4], [21, 3], [27, 4], [32, 6], [8, 10], [34, 10]]){ c.circ(x, y, 3, 'h'); c.px(x - 1, y - 1, 'j'); c.px(x + 1, y + 1, 'H'); }
  },
  staart: c => { MODEL(c); c.line(8, 7, 3, 13, 'h', 4); c.line(3, 13, 2, 20, 'h', 3); c.line(3, 14, 2, 19, 'H'); c.rect(6, 7, 2, 3, 'H'); },
  lang: c => { MODEL(c); c.rect(5, 8, 5, 17, 'h'); c.rect(32, 8, 5, 17, 'h'); },
  kaal: c => { c.rect(10, 5, 22, 6, 's'); c.rect(12, 3, 18, 2, 's'); c.rect(15, 2, 12, 1, 's'); c.rect(29, 5, 3, 6, 'S'); c.rect(14, 4, 3, 1, 'S'); },
  afro: c => {
    c.ellipse(21, 7, 15, 8, 'h');
    for (let y = 0; y < 15; y += 3) for (let x = 7; x < 36; x += 4){ const xx = x + (y % 2) * 2; if (c.is(xx, y, 'h')) c.px(xx, y, 'H'); }
    c.rect(13, 1, 3, 1, 'j'); c.rect(18, 0, 3, 1, 'j');
  },
  kroes: c => { c.rect(9, 4, 24, 7, 'h'); c.rect(11, 3, 20, 1, 'h'); c.rect(8, 8, 2, 4, 'h'); c.rect(32, 8, 2, 4, 'h');
    for (let y = 3; y < 11; y += 2) for (let x = 9 + (y % 4 === 1 ? 1 : 0); x < 33; x += 3) c.px(x, y, 'H'); },
  cornrows: c => { c.rect(9, 4, 24, 7, 'h'); c.rect(11, 3, 20, 1, 'h'); for (const x of [11, 14, 17, 20, 23, 26, 29]) c.vline(x, 3, 8, 'H'); },
  vlechten: c => { c.rect(9, 4, 24, 7, 'h'); c.rect(11, 3, 20, 1, 'h'); for (const x of [11, 14, 17, 20, 23, 26, 29]) c.vline(x, 3, 8, 'H'); },
};
const VOOR = {
  model: PONY,
  kort: RECHTE_PONY,
  kuif: RECHTE_PONY,
  krul: c => { for (let x = 10; x < 32; x += 2) c.px(x, 10 + (x % 4 === 0 ? 1 : 0), 'h'); c.hline(10, 10, 22, 'h'); },
  staart: PONY,
  lang: c => { PONY(c); c.rect(5, 10, 5, 15, 'h'); c.rect(32, 10, 5, 15, 'h'); c.vline(7, 11, 13, 'H'); c.vline(34, 11, 13, 'H'); },
  kaal: () => {},
  afro: c => { c.ellipse(7, 12, 3, 6, 'h'); c.ellipse(35, 12, 3, 6, 'h'); c.hline(10, 10, 22, 'h'); c.px(6, 9, 'H'); c.px(36, 11, 'H'); },
  kroes: RECHTE_PONY,
  cornrows: RECHTE_PONY,
  // lange vlechten: van de kruin schuin naar beneden over de oren, gevlochten (schuine schakels), met een kraaltje onderaan;
  // een donkere naad tussen vlecht en gezicht, anders lijken ze op bakkebaarden
  vlechten: c => { RECHTE_PONY(c);
    for (let y = 4; y < 24; y += 2){
      const L = Math.round(8 - (y - 4) * 3 / 21) - 2, Rx = 41 - L;           // linkerrand links, rechts gespiegeld om het midden van het gezicht (x 10-31)
      for (const x0 of [L, Rx - 3]){ c.rect(x0, y, 3, 1, 'h'); c.px(x0 + 3, y, 'H'); c.px(x0, y + 1, 'H'); c.rect(x0 + 1, y + 1, 3, 1, 'h'); }
      if (y >= 10){ c.vline(L + 4, y, 2, 'H'); c.vline(Rx - 4, y, 2, 'H'); }  // de naad
    }
    const L = Math.round(8 - 20 * 3 / 21) - 2, Rx = 41 - L;
    c.rect(L + 1, 24, 2, 2, 'j'); c.rect(Rx - 2, 24, 2, 2, 'j');           // kraaltjes
  },
};
export const haarAchter = (c, k) => (ACHTER[k] || MODEL)(c);
export const haarVoor = (c, k) => (VOOR[k] || PONY)(c);

/* ---------- van opzij (profiel, naar rechts) en van achteren ---------- */
// Van opzij (hoofdZij in rig.js, stijlbron _hoofd_zij): gezicht x 15-31, oor x 17-21, achterhoofd x 8-16.
// haarZijAchter komt vóór het gezicht (schedel, achterhoofd, een staart, lang haar), haarZijVoor erna (de pony).
const ZIJ_MODEL = c => {
  c.rect(9, 3, 24, 9, 'h'); c.rect(11, 1, 19, 2, 'h'); c.rect(14, 0, 12, 1, 'h');
  c.rect(8, 8, 9, 13, 'h');
  for (const x of [14, 19, 24]) c.line(x, 2, x - 2, 8, 'H');
  for (const x of [12, 17]) c.rect(x, 2, 3, 1, 'j');
};
const ZIJ_PONY = c => { for (let x = 17; x < 32; x++) c.px(x, 10 + (x % 3 === 0 ? 1 : 0), 'H'); };
const ZIJ_KORT = c => { c.rect(10, 4, 22, 7, 'h'); c.rect(12, 3, 18, 1, 'h'); c.rect(9, 8, 7, 9, 'h'); for (const x of [16, 22]) c.line(x, 4, x - 1, 7, 'H'); c.rect(13, 4, 3, 1, 'j'); };
const ZIJ_RECHT = c => c.hline(17, 10, 15, 'H');
const ZIJ_CORN = c => { ZIJ_KORT(c); for (const y of [4, 6, 8]) c.hline(10, y, 21, 'H'); };
const ZIJ_ACHTER = {
  model: ZIJ_MODEL,
  kort: ZIJ_KORT,
  kuif: c => { ZIJ_KORT(c); c.rect(22, 1, 12, 4, 'h'); c.rect(25, 0, 8, 1, 'h'); c.rect(24, 1, 7, 1, 'j'); },
  krul: c => { c.rect(10, 4, 22, 7, 'h'); for (const [x, y] of [[11, 5], [16, 3], [22, 3], [28, 5], [9, 11], [10, 17]]){ c.circ(x, y, 3, 'h'); c.px(x - 1, y - 1, 'j'); c.px(x + 1, y + 1, 'H'); } },
  staart: c => { ZIJ_MODEL(c); c.line(9, 9, 3, 14, 'h', 4); c.line(3, 14, 2, 21, 'h', 3); c.line(3, 15, 2, 20, 'H'); c.rect(8, 8, 2, 3, 'H'); },
  lang: c => { ZIJ_MODEL(c); c.rect(6, 8, 10, 17, 'h'); c.vline(8, 10, 14, 'H'); c.vline(12, 12, 12, 'H'); },
  kaal: c => { c.rect(10, 4, 22, 7, 's'); c.rect(12, 2, 18, 2, 's'); c.rect(9, 8, 7, 13, 's'); c.rect(9, 9, 2, 11, 'S'); c.rect(13, 4, 6, 1, 'S'); },
  afro: c => { c.ellipse(19, 8, 15, 9, 'h'); c.rect(6, 8, 10, 13, 'h'); for (let y = 0; y < 21; y += 3) for (let x = 5; x < 35; x += 4){ const xx = x + (y % 2) * 2; if (c.is(xx, y, 'h')) c.px(xx, y, 'H'); } c.rect(14, 1, 3, 1, 'j'); },
  kroes: c => { ZIJ_KORT(c); for (let y = 4; y < 16; y += 2) for (let x = 9 + (y % 4 ? 1 : 0); x < 32; x += 3) if (c.is(x, y, 'h')) c.px(x, y, 'H'); },
  cornrows: ZIJ_CORN,
  vlechten: c => { ZIJ_CORN(c); for (let y = 12; y < 26; y += 2){ c.rect(8, y, 3, 2, (y >> 1) % 2 ? 'h' : 'H'); c.rect(12, y + 1, 3, 2, (y >> 1) % 2 ? 'H' : 'h'); } },
};
const ZIJ_VOOR = {model:ZIJ_PONY, staart:ZIJ_PONY, lang:ZIJ_PONY, kort:ZIJ_RECHT, kuif:ZIJ_RECHT, kroes:ZIJ_RECHT, cornrows:ZIJ_RECHT, vlechten:ZIJ_RECHT,
  krul: c => { for (let x = 17; x < 32; x += 2) c.px(x, 10 + (x % 4 === 1 ? 1 : 0), 'h'); c.hline(17, 10, 15, 'h'); },
  afro: c => c.hline(17, 10, 15, 'h'), kaal: () => {}};
export const haarZijAchter = (c, k) => (ZIJ_ACHTER[k] || ZIJ_MODEL)(c);
export const haarZijVoor = (c, k) => (ZIJ_VOOR[k] || ZIJ_PONY)(c);

// Van achteren (hoofdRug in rig.js): het achterhoofd, met de oren aan beide kanten en onderin de nek
const RUG_VOL = c => { c.rect(8, 3, 26, 19, 'h'); c.rect(10, 1, 22, 2, 'h'); c.rect(13, 0, 16, 1, 'h'); for (const x of [13, 18, 23, 28]) c.line(x, 3, x - 1, 20, 'H'); c.rect(14, 2, 3, 1, 'j'); c.rect(21, 2, 3, 1, 'j'); };
const RUG_KORT = c => { c.rect(9, 4, 24, 15, 'h'); c.rect(11, 3, 20, 1, 'h'); for (const x of [14, 20, 26]) c.line(x, 4, x, 16, 'H'); c.rect(15, 4, 3, 1, 'j'); };
const RUG_CORN = c => { c.rect(9, 4, 24, 15, 'h'); c.rect(11, 3, 20, 1, 'h'); for (const x of [11, 14, 17, 20, 23, 26, 29]) c.vline(x, 3, 16, 'H'); };
const RUG = {
  model: RUG_VOL,
  kort: RUG_KORT,
  kuif: c => { RUG_KORT(c); c.rect(15, 1, 12, 3, 'h'); c.rect(17, 1, 7, 1, 'j'); },
  krul: c => { c.rect(9, 5, 24, 13, 'h'); for (const [x, y] of [[10, 6], [15, 4], [21, 3], [27, 4], [32, 6], [9, 12], [33, 12], [14, 15], [21, 16], [28, 15]]){ c.circ(x, y, 3, 'h'); c.px(x - 1, y - 1, 'j'); c.px(x + 1, y + 1, 'H'); } },
  staart: c => { RUG_VOL(c); c.rect(19, 18, 4, 7, 'h'); c.vline(21, 19, 6, 'H'); c.rect(19, 17, 4, 1, 'H'); },
  lang: c => { RUG_VOL(c); c.rect(7, 10, 28, 15, 'h'); for (const x of [11, 17, 24, 30]) c.vline(x, 12, 13, 'H'); },
  kaal: c => { c.rect(10, 4, 22, 18, 's'); c.rect(12, 2, 18, 2, 's'); c.rect(29, 5, 3, 17, 'S'); c.rect(13, 5, 4, 1, 'S'); },
  afro: c => { c.ellipse(21, 9, 16, 10, 'h'); for (let y = 0; y < 20; y += 3) for (let x = 6; x < 37; x += 4){ const xx = x + (y % 2) * 2; if (c.is(xx, y, 'h')) c.px(xx, y, 'H'); } },
  kroes: c => { RUG_KORT(c); for (let y = 4; y < 18; y += 2) for (let x = 9 + (y % 4 ? 1 : 0); x < 33; x += 3) c.px(x, y, 'H'); },
  cornrows: RUG_CORN,
  vlechten: c => { RUG_CORN(c); for (let y = 14; y < 26; y += 2){ c.rect(11, y, 3, 2, (y >> 1) % 2 ? 'h' : 'H'); c.rect(28, y, 3, 2, (y >> 1) % 2 ? 'H' : 'h'); } },
};
export const haarRug = (c, k) => (RUG[k] || RUG_VOL)(c);
