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
// helpers voor de nieuwere kapsels: een kaal hoofd, stoppels over de huid, een gevlochten streng, een dreadlock, een knot
const KAAL = c => { c.rect(10, 5, 22, 6, 's'); c.rect(12, 3, 18, 2, 's'); c.rect(15, 2, 12, 1, 's'); c.rect(29, 5, 3, 6, 'S'); };
// (een vaste "willekeur" per pixel: elke keer hetzelfde, maar zonder het ruitjespatroon van een netje)
const RUIS = (x, y) => (((x * 73856093) ^ (y * 19349663) ^ (x * y * 83492791)) >>> 0) % 100;
const STOPPELS = (c, x0, y0, x1, y1, k = 'h') => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (RUIS(x, y) < 42 && c.is(x, y, 'sS')) c.px(x, y, k); };
// Een buzzcut: een dicht, kort laagje haar over de schedel. Donker langs de rand (de haargrens), één rustige glans
// bovenop (licht van linksboven) en een paar donkere korreltjes voor de textuur. Geen ruitjes: dan lijkt het een netje.
const BUZZ = (c, x0, y0, x1, y1, glans = [14, 3]) => {
  const vak = new Set();
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (c.is(x, y, 'sS')) vak.add(x + ',' + y);
  const in_ = (x, y) => vak.has(x + ',' + y);
  for (const p of vak){
    const [x, y] = p.split(',').map(Number), r = RUIS(x, y);
    const rand = !in_(x, y + 1); // (alleen de haargrens onderaan: een donkere rand rondom maakt er een helm van)
    const dx = x - glans[0], dy = y - glans[1], licht = dx * dx * .3 + dy * dy * 1.6 < 7;
    c.px(x, y, rand ? (r < 70 ? 'H' : 'h') : licht ? 'j' : r < 9 ? 'H' : 'h');
  }
};
// Een fade: van boven naar beneden steeds korter. Bovenaan (vlak onder het lange haar) nog kort haar, dan een
// overgang naar huid met stoppels, onderaan bijna kaal. Losse korreltjes (nooit twee naast elkaar), geen vlekken.
const FADE = (c, x0, y0, x1, y1) => {
  for (let x = x0; x <= x1; x++){
    const rand = y0 + Math.round((y1 - y0) * .3) + RUIS(x, 7) % 2; // (waar het haar ophoudt: per kolom één pixel verschil, een rafelige maar gesloten rand)
    for (let y = y0; y <= y1; y++){
      if (!c.is(x, y, 'sS')) continue;
      const d = y - rand, kans = d <= 0 ? 100 : Math.max(4, 34 - d * 9), buur = c.is(x - 1, y, 'h') && d > 0;
      c.px(x, y, d <= 0 || (!buur && RUIS(x, y) < kans) ? 'h' : 'S'); // (onder de rand steeds minder losse stoppels, nooit twee naast elkaar)
    }
  }
};
// Kaalgeschoren (de zijkanten van een hanenkam): de huid net iets donkerder, met hier en daar een stoppeltje
const GESCHOREN = (c, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (c.is(x, y, 'sS')) c.px(x, y, RUIS(x, y) < 6 && !c.is(x - 1, y, 'h') ? 'h' : 'S'); };
const STRENG = (c, x, y0, y1) => { for (let y = y0; y < y1; y += 2) c.rect(x, y, 3, 2, (y >> 1) % 2 ? 'h' : 'H'); };
// Dreadlocks als rij strengen naast elkaar: elke loc is 3 breed (licht, haar, donkere naad), begint met een rond kopje op de
// bolling van het hoofd (KOP: hoe lager naar de zijkanten) en eindigt in een rond puntje. Om de 4 pixels een draai in de loc.
const KOP = x => Math.round(1 + ((x + 1 - 21) / 14) ** 2 * 7);
const LOC = (c, x, y0, y1) => {
  for (let y = y0; y <= y1; y++){
    const kop = y === y0, punt = y === y1, d = y - y0;
    if (kop){ c.px(x, y, 'h'); c.px(x + 1, y, 'h'); continue; } // (een breed kopje: de bovenrand blijft rond, niet stekelig)
    if (punt){ c.px(x + 1, y, 'h'); continue; }
    c.px(x, y, d <= 3 ? 'j' : 'h'); c.px(x + 1, y, d % 4 === 2 ? 'H' : 'h'); c.px(x + 2, y, 'H');
  }
};
// een hele rij locs van links naar rechts; lang(x) zegt tot waar de loc op x hangt
const LOCS = (c, x0, x1, lang, kop = KOP) => { for (let x = x0; x <= x1; x += 3) LOC(c, x, kop(x), lang(x)); };
// Een echte knot: een ronde bol (r = 4) met glans linksboven, schaduw rechtsonder en een donker elastiekje waar hij op het hoofd zit
const KNOT2 = (c, x, y, r = 4, voet = 'onder') => { c.circ(x, y, r, 'h'); c.circ(x + 1, y + 1, r - 1, 'h'); c.px(x - 1, y - 2, 'j'); c.px(x - 2, y - 1, 'j'); c.px(x - 2, y, 'j');
  c.line(x + 1, y + r - 1, x + r - 1, y + 1, 'H'); c.px(x + r, y, 'H'); c.px(x, y, 'H');
  if (voet === 'onder') c.hline(x - 2, y + r, 5, 'H'); else if (voet === 'zij') c.vline(x + r, y - 2, 5, 'H'); };
const KNOT = (c, x, y, r = 3) => { c.circ(x, y, r, 'h'); c.px(x - 1, y - 1, 'j'); c.px(x - 2, y, 'j'); c.px(x + 1, y + 1, 'H'); c.px(x + 2, y, 'H'); };
// Surferhaar: golvende plukken (een donkere groef die heen en weer slingert), ongelijke punten die naar buiten krullen,
// en door de zon gebleekte (lichtere) uiteinden
const GOLF = (c, x, y0, y1, fase = 0) => { for (let y = y0; y <= y1; y++){ const xx = x + Math.round(Math.sin((y + fase) * .75)); if (c.is(xx, y, 'hj')) c.px(xx, y, 'H'); } };
const PUNTEN = (c, x0, x1, y, naarBuiten = 0) => { const L = [2, 3, 3, 1, 3, 2]; // (plukjes van twee pixels breed, ongelijk lang; losse strengen van één pixel leken stro)
  for (let x = x0; x <= x1; x++){ const n = L[Math.floor((x - x0) / 2) % L.length]; c.rect(x, y, 1, n, 'h'); c.px(x, y + n - 1, 'j'); }
  if (naarBuiten){ const x = naarBuiten < 0 ? x0 - 1 : x1 + 1; c.px(x, y, 'h'); c.px(x, y + 1, 'j'); } };
const ZONGEBLEEKT = (c, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (c.is(x, y, 'h') && RUIS(x, y) < 6 + (y - y0) * 4) c.px(x, y, 'j'); }; // (een paar lichte puntjes, meer naar onderen: geen lichte band)
// de bovenkant: een middenscheiding met plukken die in een boog naar de zijkanten vallen
const SURF_TOP = c => {
  c.rect(8, 3, 26, 9, 'h'); c.rect(10, 1, 22, 2, 'h'); c.rect(13, 0, 16, 1, 'h');
  c.vline(21, 0, 3, 'H');
  c.line(20, 2, 15, 4, 'H'); c.line(15, 4, 11, 9, 'H'); c.line(22, 2, 27, 4, 'H'); c.line(27, 4, 31, 9, 'H');
  c.rect(14, 1, 5, 1, 'j'); c.rect(24, 1, 5, 1, 'j'); c.px(12, 3, 'j'); c.px(30, 3, 'j');
};

const ACHTER = {
  model: MODEL,
  kort: KORT,
  kuif: c => { // de haren van het voorhoofd omhoog en naar achteren geborsteld, tot een ronde rol (rechts het hoogst)
    c.rect(9, 4, 24, 6, 'h'); c.rect(8, 7, 2, 3, 'h'); c.rect(32, 7, 2, 3, 'h');            // het haar op het hoofd, korte zijkanten
    c.ellipse(23, 2, 10, 2, 'h'); c.rect(12, 2, 21, 3, 'h'); c.rect(10, 3, 2, 1, 'h');       // de rol
    c.line(13, 6, 22, 5, 'H'); c.line(22, 5, 31, 4, 'H');                                     // één schaduw onder de krul
    c.line(15, 2, 22, 1, 'j'); c.line(22, 1, 30, 1, 'j');                                     // glans bovenop
    c.line(14, 9, 16, 7, 'H'); c.line(21, 9, 23, 7, 'H'); },                                  // twee opgeborstelde lokjes
  krul: c => {
    c.rect(9, 5, 24, 6, 'h');
    for (const [x, y] of [[10, 6], [15, 4], [21, 3], [27, 4], [32, 6], [8, 10], [34, 10]]){ c.circ(x, y, 3, 'h'); c.px(x - 1, y - 1, 'j'); c.px(x + 1, y + 1, 'H'); }
  },
  staart: c => { MODEL(c); c.line(8, 7, 3, 13, 'h', 4); c.line(3, 13, 2, 20, 'h', 3); c.line(3, 14, 2, 19, 'H'); c.rect(6, 7, 2, 3, 'H'); },
  // lang haar: een ronde bovenkant met een scheiding in het midden en een glansband, aan de zijkanten tot op de schouders,
  // onderaan iets uitwaaierend en in punten (geen rechte rand: dan wordt het een helm)
  lang: c => { c.ellipse(21, 6, 14, 6, 'h'); c.rect(7, 6, 28, 6, 'h');
    c.rect(4, 8, 6, 15, 'h'); c.rect(32, 8, 6, 15, 'h');                                                    // de zijkanten
    for (const [x, y] of [[3, 23], [4, 24], [6, 23], [7, 25], [9, 23], [32, 23], [34, 25], [35, 23], [37, 24], [38, 23]]) c.rect(x, y - 1, 2, 2, 'h'); // de puntjes
    c.line(21, 0, 21, 9, 'H'); for (const [a, b] of [[[17, 1], [9, 9]], [[14, 2], [6, 13]], [[25, 1], [33, 9]], [[28, 2], [36, 13]]]) c.line(a[0], a[1], b[0], b[1], 'H');
    c.vline(6, 12, 11, 'H'); c.vline(35, 12, 11, 'H'); c.vline(8, 15, 8, 'H'); c.vline(33, 15, 8, 'H');   // lokken naar beneden
    c.line(11, 4, 17, 1, 'j'); c.line(12, 5, 18, 2, 'j'); c.line(25, 2, 29, 4, 'j'); },                  // glans
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
  kuif: () => {}, // (een kuif laat het voorhoofd vrij: geen donkere rand, die leek een pet)
  krul: c => { for (let x = 10; x < 32; x += 2) c.px(x, 10 + (x % 4 === 0 ? 1 : 0), 'h'); c.hline(10, 10, 22, 'h'); },
  staart: PONY,
  // (van voren: gordijntjes vanaf de scheiding over het voorhoofd, en lange lokken vóór de oren langs tot op de schouders)
  lang: c => { c.poly([10, 9, 21, 9, 21, 10, 15, 12, 10, 13], 'h'); c.poly([21, 9, 32, 9, 32, 13, 27, 12, 21, 10], 'h');
    c.line(20, 10, 14, 12, 'H'); c.line(21, 10, 27, 12, 'H');
    c.rect(6, 10, 4, 12, 'h'); c.rect(32, 10, 4, 12, 'h'); c.rect(6, 22, 3, 1, 'h'); c.rect(33, 22, 3, 1, 'h'); c.px(7, 23, 'h'); c.px(34, 23, 'h');
    c.vline(8, 11, 11, 'H'); c.vline(33, 11, 11, 'H'); c.vline(6, 13, 6, 'j'); c.vline(35, 13, 6, 'H'); },
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
// ----- de nieuwere kapsels (van voren) -----
Object.assign(ACHTER, {
  stekels: c => { c.rect(9, 5, 24, 6, 'h'); c.rect(8, 8, 2, 5, 'h'); c.rect(32, 8, 2, 5, 'h');
    for (let x = 9; x < 31; x += 4){ c.poly([x, 6, x + 2, 0, x + 4, 6], 'h'); c.px(x + 2, 2, 'j'); c.vline(x + 3, 3, 4, 'H'); } },
  hanenkam: c => { KAAL(c); GESCHOREN(c, 10, 2, 31, 9); c.rect(17, 0, 8, 11, 'h'); c.rect(16, 3, 10, 8, 'h'); c.vline(16, 3, 8, 'H'); c.vline(25, 3, 8, 'H'); c.vline(23, 1, 9, 'H'); c.rect(18, 0, 3, 4, 'j'); },
  fade: c => { KAAL(c); c.rect(8, 7, 3, 5, 's'); c.rect(31, 7, 3, 5, 's'); FADE(c, 8, 6, 10, 12); FADE(c, 31, 6, 33, 12); // (alleen de slapen: het voorhoofd blijft schoon)
    c.rect(10, 2, 22, 7, 'h'); c.rect(9, 4, 1, 3, 'h'); c.rect(32, 4, 1, 3, 'h'); c.hline(11, 9, 20, 'H'); c.rect(12, 1, 18, 1, 'h'); for (const x of [14, 19, 24, 29]) c.line(x - 3, 3, x, 7, 'H'); c.rect(12, 2, 5, 1, 'j'); },
  millimeter: c => { KAAL(c); c.rect(8, 8, 2, 4, 's'); c.rect(32, 8, 2, 4, 's'); BUZZ(c, 8, 2, 33, 11, [15, 4]); },
  scheiding: c => { KORT(c); c.rect(15, 1, 17, 4, 'h'); c.rect(9, 4, 4, 6, 'h'); c.rect(13, 1, 2, 9, 's'); c.px(14, 0, 's'); c.line(16, 3, 31, 7, 'H'); c.line(17, 6, 31, 10, 'H'); c.line(16, 1, 26, 1, 'j'); c.line(10, 5, 12, 5, 'j'); },
  // middenscheiding: een dunne scheiding bovenop, en de lokken buigen van daaruit naar beide kanten (met glans erop)
  midden: c => { c.rect(8, 3, 26, 9, 'h'); c.rect(10, 1, 22, 2, 'h'); c.rect(13, 0, 16, 1, 'h'); c.rect(7, 8, 3, 9, 'h'); c.rect(32, 8, 3, 9, 'h');
    c.vline(21, 0, 3, 'S'); c.vline(21, 3, 3, 'H');
    c.line(17, 5, 10, 10, 'H'); c.line(25, 5, 32, 10, 'H');
    c.line(19, 1, 12, 5, 'j'); c.line(23, 1, 30, 5, 'j'); },
  knot: c => { // strak naar achteren gekamd naar één knot, die boven het hoofd uitsteekt
    c.rect(9, 4, 24, 7, 'h'); c.rect(11, 3, 20, 1, 'h'); c.rect(8, 8, 2, 4, 'h'); c.rect(32, 8, 2, 4, 'h');
    c.line(12, 9, 17, 4, 'H'); c.line(30, 9, 25, 4, 'H');                                   // twee lokken die naar het midden trekken
    c.rect(13, 4, 3, 1, 'j'); c.rect(26, 4, 3, 1, 'j');
    KNOT2(c, 21, 0, 4); c.hline(18, 3, 7, 'H'); },                                            // de knot, met het elastiekje op de rand
  surfer: c => { SURF_TOP(c); c.rect(5, 7, 5, 12, 'h'); c.rect(32, 7, 5, 12, 'h'); PUNTEN(c, 5, 9, 19, -1); PUNTEN(c, 32, 36, 19, 1);
    GOLF(c, 7, 8, 20); GOLF(c, 34, 8, 20, 2); ZONGEBLEEKT(c, 5, 15, 9, 23); ZONGEBLEEKT(c, 32, 15, 37, 23); },
  // (van voren: naar achteren gebonden; de wortels bovenop en alleen de puntjes van de locks in de nek, achter de oren)
  // dreadlocks: een rij locs over de hele bolling; naast het gezicht hangen ze door tot op de schouders (niet allemaal even lang)
  dreads: c => { LOCS(c, 2, 35, x => x < 10 || x > 30 ? [24, 22, 25, 23][x % 4] : 11); },
  bob: c => { MODEL(c); c.rect(6, 8, 4, 13, 'h'); c.rect(32, 8, 4, 13, 'h'); },
  vlecht: c => { KORT(c); c.rect(10, 3, 22, 1, 'h'); for (const x of [15, 21, 27]) c.vline(x, 3, 6, 'H'); },
  knotjes: c => { KORT(c); KNOT(c, 10, 4, 4); KNOT(c, 32, 4, 4); },
});
Object.assign(VOOR, {
  stekels: c => { c.hline(10, 10, 22, 'h'); for (let x = 10; x < 32; x += 3){ c.px(x, 10, 'H'); c.px(x + 1, 11, 'h'); } },
  hanenkam: c => c.hline(18, 10, 6, 'H'),
  fade: RECHTE_PONY,
  millimeter: c => { c.hline(11, 10, 20, 'H'); c.px(10, 9, 'H'); c.px(31, 9, 'H'); }, // (een strakke haargrens, recht over het voorhoofd)
  scheiding: c => { c.hline(10, 10, 22, 'H'); c.line(15, 10, 31, 12, 'h', 2); c.line(16, 10, 31, 11, 'H'); },
  // twee gordijntjes over het voorhoofd: in het midden open (een omgekeerde V), naar de zijkanten lager
  midden: c => { c.poly([10, 9, 21, 9, 21, 10, 14, 13, 10, 14], 'h'); c.poly([21, 9, 32, 9, 32, 14, 28, 13, 21, 10], 'h');
    c.line(20, 10, 14, 13, 'H'); c.line(21, 10, 27, 13, 'H'); c.px(13, 10, 'j'); c.px(28, 10, 'j');
    c.rect(7, 10, 3, 7, 'h'); c.rect(32, 10, 3, 7, 'h'); c.vline(8, 11, 5, 'H'); c.vline(33, 11, 5, 'H'); },
  knot: () => {}, // (naar achteren gekamd: geen pony en geen donkere rand over het voorhoofd)
  surfer: c => { // gordijntjes: vanaf de scheiding in een boog opzij over het voorhoofd, met een V in het midden
    for (const [y, a, b] of [[10, 10, 19], [11, 10, 16], [12, 10, 13], [13, 10, 11]]){ c.rect(a, y, b - a + 1, 1, 'h'); c.rect(41 - b, y, b - a + 1, 1, 'h'); }
    for (const [x, y] of [[19, 10], [17, 11], [16, 11], [14, 12], [13, 12], [12, 13], [11, 13]]){ c.px(x, y, 'H'); c.px(41 - x, y, 'H'); }
    c.rect(12, 10, 4, 1, 'j'); c.rect(26, 10, 4, 1, 'j');
    c.rect(6, 10, 4, 9, 'h'); c.rect(32, 10, 4, 9, 'h'); PUNTEN(c, 6, 9, 19, -1); PUNTEN(c, 32, 35, 19, 1); GOLF(c, 8, 10, 20); GOLF(c, 33, 10, 20, 2); },
  // (van voren: de locs boven het gezicht vallen met hun ronde puntjes net over de haarlijn)
  dreads: c => { LOCS(c, 9, 30, x => (x % 2 ? 12 : 11)); },
  bob: c => { c.rect(10, 10, 22, 2, 'h'); c.hline(10, 12, 22, 'H'); c.rect(6, 10, 4, 11, 'h'); c.rect(32, 10, 4, 11, 'h'); c.hline(6, 21, 4, 'H'); c.hline(32, 21, 4, 'H'); c.vline(8, 11, 10, 'H'); c.vline(33, 11, 10, 'H'); },
  vlecht: RECHTE_PONY,
  knotjes: PONY,
});
// (achter het kapsel kan een leeftijdscode staan, 'kort@01200': die tekent pixel/leeftijd.js er daarna overheen)
const B = k => String(k || 'model').split('@')[0];
export const haarAchter = (c, k) => (ACHTER[B(k)] || MODEL)(c);
export const haarVoor = (c, k) => (VOOR[B(k)] || PONY)(c);

/* ---------- van opzij (profiel, naar rechts) en van achteren ---------- */
// Van opzij (hoofdZij in rig.js, stijlbron _hoofd_zij): gezicht x 15-31, oor x 17-21, achterhoofd x 8-16.
// haarZijAchter komt vóór het gezicht (schedel, achterhoofd, een staart, lang haar), haarZijVoor erna (de pony).
const ZIJ_MODEL = c => {
  c.rect(9, 3, 24, 9, 'h'); c.rect(11, 1, 19, 2, 'h'); c.rect(14, 0, 12, 1, 'h');
  c.rect(8, 8, 9, 10, 'h'); c.rect(9, 18, 8, 1, 'h'); c.rect(10, 19, 7, 1, 'h'); c.rect(12, 20, 5, 1, 'h'); // (onderaan schuin naar de nek, geen blok)
  for (const x of [14, 19, 24]) c.line(x, 2, x - 2, 8, 'H');
  for (const x of [12, 17]) c.rect(x, 2, 3, 1, 'j');
};
const ZIJ_PONY = c => { for (let x = 17; x < 32; x++) c.px(x, 10 + (x % 3 === 0 ? 1 : 0), 'H'); };
// Het achterhoofd van opzij: rond, en onderaan schuin naar de nek toe (een rechthoek stak als een blok naar achteren uit)
const ACHTERHOOFD = (c, k, y0, y1) => { for (let y = y0; y <= y1; y++){ const x = y === y1 ? 13 : y === y1 - 1 ? 11 : y === y1 - 2 ? 10 : 9; c.rect(x, y, 16 - x, 1, k); } };
// De bovenkant van het hoofd van opzij: een boog, het hoogst in het midden en aflopend naar voorhoofd en achterhoofd
// (van voren is het hoofd rond, van opzij was het een platte streep). top = de hoogste rij, val = hoeveel hij afloopt
const ZIJ_DAK = (c, k, top = 1, val = 4.5) => { for (let x = 10; x <= 31; x++){ const y = Math.round(top + ((x - 20.5) / 11) ** 2 * val); c.rect(x, y, 1, 11 - y, k); } };
const ZIJ_KORT = c => { ZIJ_DAK(c, 'h', 2, 4); ACHTERHOOFD(c, 'h', 8, 16); for (const x of [16, 22]) c.line(x, 4, x - 1, 7, 'H'); c.rect(13, 4, 3, 1, 'j'); };
const ZIJ_RECHT = c => c.hline(17, 10, 15, 'H');
const ZIJ_CORN = c => { ZIJ_KORT(c); for (const y of [4, 6, 8]) c.hline(10, y, 21, 'H'); };
const ZIJ_ACHTER = {
  model: ZIJ_MODEL,
  kort: ZIJ_KORT,
  kuif: c => { ZIJ_KORT(c);
    c.ellipse(26, 2, 7, 2, 'h'); c.rect(20, 2, 13, 5, 'h'); c.rect(33, 2, 1, 3, 'h');      // de rol, vooraan het hoogst
    c.line(11, 8, 21, 3, 'H'); c.line(14, 10, 24, 5, 'H');                                     // lokken die schuin omhoog naar voren lopen
    c.line(22, 6, 32, 5, 'H'); c.px(33, 5, 'H');                                               // de krul eronder
    c.line(21, 1, 31, 0, 'j'); c.px(24, 2, 'j'); c.px(29, 2, 'j'); },
  // krullen van opzij: eerst een ronde schedel vol haar (boog bovenop, rond achterhoofd), dan bolletjes langs de rand zodat de
  // omtrek hobbelig is, en overal kleine krulletjes (een licht- en een schaduwpuntje) die de ronding van het hoofd volgen
  krul: c => {
    ZIJ_DAK(c, 'h', 0, 4.5); ACHTERHOOFD(c, 'h', 6, 19); c.rect(8, 7, 3, 11, 'h');
    for (const [x, y] of [[12, 3], [16, 1], [21, 0], [26, 1], [30, 4], [9, 7], [7, 11], [7, 15], [9, 18], [12, 20]]) c.circ(x, y, 2, 'h');
    for (const [x, y] of [[13, 4], [18, 3], [23, 3], [28, 5], [10, 8], [15, 7], [20, 7], [25, 8], [9, 12], [13, 11], [9, 16], [12, 15], [12, 18]]){
      c.px(x, y, 'j'); c.px(x + 1, y + 2, 'H'); } // (elk krulletje: een lichtpuntje en schuin eronder een schaduwpuntje, net als van voren)
    for (const [x, y] of [[17, 1], [22, 0], [11, 5]]) c.px(x, y, 'j');
    // inkepingen tussen de bolletjes: zo wordt de omtrek hobbelig (net als van voren), bovenop en aan de achterkant
    for (const x of [14, 19, 24, 28]){ let y = 0; while (y < 10 && !c.is(x, y, 'hHj')) y++; if (y < 10) c.img.set(x, y, 0); }
    for (const y of [9, 13, 17]){ let x = 0; while (x < 15 && !c.is(x, y, 'hHj')) x++; if (x < 15) c.img.set(x, y, 0); }
  },
  staart: c => { ZIJ_MODEL(c); c.line(9, 9, 3, 14, 'h', 4); c.line(3, 14, 2, 21, 'h', 3); c.line(3, 15, 2, 20, 'H'); c.rect(8, 8, 2, 3, 'H'); },
  // (van opzij: een ronde bovenkant met glans, het haar valt achter het oor langs tot op de schouders en loopt in punten uit)
  lang: c => { ZIJ_MODEL(c); c.rect(5, 8, 12, 15, 'h'); for (const [x, y] of [[4, 23], [6, 24], [9, 25], [12, 24], [15, 23]]) c.rect(x, y - 1, 2, 2, 'h');
    c.line(18, 1, 8, 12, 'H'); c.vline(7, 13, 11, 'H'); c.vline(11, 12, 12, 'H'); c.vline(14, 14, 9, 'H'); c.line(13, 3, 20, 1, 'j'); c.line(14, 4, 21, 2, 'j'); },
  kaal: c => { ZIJ_DAK(c, 's', 1, 4.5); ACHTERHOOFD(c, 's', 8, 19); c.px(10, 17, 'S'); c.px(11, 18, 'S'); c.rect(13, 19, 3, 1, 'S'); }, // (alleen een schaduw onder de bolling: een donkere band achterop leek haar)
  afro: c => { c.ellipse(19, 8, 15, 9, 'h'); c.rect(6, 8, 10, 13, 'h'); for (let y = 0; y < 21; y += 3) for (let x = 5; x < 35; x += 4){ const xx = x + (y % 2) * 2; if (c.is(xx, y, 'h')) c.px(xx, y, 'H'); } c.rect(14, 1, 3, 1, 'j'); },
  kroes: c => { ZIJ_KORT(c); for (let y = 4; y < 16; y += 2) for (let x = 9 + (y % 4 ? 1 : 0); x < 32; x += 3) if (c.is(x, y, 'h')) c.px(x, y, 'H'); },
  cornrows: ZIJ_CORN,
  vlechten: c => { ZIJ_CORN(c); for (let y = 12; y < 26; y += 2){ c.rect(8, y, 3, 2, (y >> 1) % 2 ? 'h' : 'H'); c.rect(12, y + 1, 3, 2, (y >> 1) % 2 ? 'H' : 'h'); } },
};
const ZIJ_VOOR = {model:ZIJ_PONY, staart:ZIJ_PONY, kort:ZIJ_RECHT, kuif:ZIJ_RECHT, kroes:ZIJ_RECHT, cornrows:ZIJ_RECHT, vlechten:ZIJ_RECHT,
  // (de krullen hangen vooraan als kleine plukjes over het voorhoofd; de voorste krult een beetje naar voren)
  krul: c => { c.hline(17, 10, 15, 'h'); for (const x of [18, 22, 26, 30]){ c.px(x, 11, 'h'); c.px(x + 1, 11, 'h'); c.px(x, 12, 'H'); } c.px(32, 9, 'h'); c.px(32, 10, 'H'); },
  // (lang haar van opzij: een gordijntje dat schuin over het voorhoofd naar voren valt, boven het oog langs)
  lang: c => { c.poly([16, 9, 31, 9, 31, 11, 26, 12, 20, 13, 16, 14], 'h'); c.line(18, 10, 29, 11, 'H'); c.line(17, 12, 23, 11, 'j'); },
  afro: c => c.hline(17, 10, 15, 'h'), kaal: c => c.rect(15, 10, 1, 9, 's'), // (kaal: de achterrand van het gezicht loopt niet als een streep over de schedel)
  stekels: ZIJ_RECHT, hanenkam: () => {}, fade: ZIJ_RECHT, millimeter: c => { c.hline(18, 10, 13, 'H'); },
  scheiding: c => { ZIJ_RECHT(c); c.line(18, 10, 31, 12, 'h', 2); }, midden: c => { ZIJ_RECHT(c); c.line(17, 10, 31, 13, 'h', 2); }, knot: ZIJ_RECHT, surfer: c => { for (let x = 17; x <= 31; x++){ const d = x >= 29 ? 3 : x >= 25 ? 2 : 1; c.rect(x, 10, 1, d, 'h'); c.px(x, 9 + d, 'H'); } c.rect(20, 10, 5, 1, 'j'); }, // (de pluk die over het voorhoofd naar voren valt)
  dreads: c => { LOCS(c, 17, 30, () => 11, x => Math.round(1 + ((x - 19) / 13) ** 2 * 7)); },
  bob: c => { c.rect(17, 10, 15, 2, 'h'); c.hline(17, 12, 15, 'H'); }, vlecht: ZIJ_RECHT, knotjes: ZIJ_PONY};
Object.assign(ZIJ_ACHTER, {
  stekels: c => { ZIJ_KORT(c); for (let x = 10; x < 30; x += 4){ c.poly([x, 6, x + 1, 0, x + 4, 5], 'h'); c.px(x + 1, 2, 'j'); } },
  hanenkam: c => { ZIJ_ACHTER.kaal(c); GESCHOREN(c, 9, 3, 31, 19); c.rect(11, 1, 20, 4, 'h'); c.rect(13, 0, 16, 1, 'h'); for (const x of [15, 20, 25]) c.line(x, 1, x - 2, 4, 'H'); c.rect(14, 1, 4, 1, 'j'); },
  fade: c => { ZIJ_ACHTER.kaal(c); FADE(c, 9, 6, 31, 19); c.rect(11, 2, 21, 5, 'h'); c.rect(13, 1, 17, 1, 'h'); for (const x of [17, 22, 27]) c.line(x - 3, 3, x, 6, 'H'); c.rect(15, 2, 5, 1, 'j'); },
  millimeter: c => { ZIJ_ACHTER.kaal(c); BUZZ(c, 9, 1, 31, 19, [17, 3]); },
  scheiding: c => { ZIJ_KORT(c); c.rect(13, 1, 19, 3, 'h'); c.hline(15, 1, 14, 'j'); c.line(18, 4, 30, 8, 'H'); c.line(16, 6, 25, 9, 'H'); },
  midden: c => { ZIJ_MODEL(c); c.rect(8, 8, 9, 9, 'h'); c.line(14, 3, 24, 9, 'H'); c.hline(9, 16, 7, 'H'); },
  knot: c => { ZIJ_KORT(c); for (const [a, b] of [[27, 15], [23, 12], [19, 11]]) c.line(a, 4, b, 9, 'H'); c.rect(14, 2, 6, 1, 'j'); // (lokken naar achteren)
    KNOT2(c, 9, 4, 4, 'zij'); c.vline(13, 2, 5, 'H'); },                                      // de knot achterop, elastiekje tegen het hoofd
  surfer: c => { ZIJ_DAK(c, 'h', 0, 4); c.rect(9, 3, 3, 8, 'h'); c.rect(6, 8, 10, 12, 'h'); PUNTEN(c, 6, 15, 20, -1); GOLF(c, 8, 9, 22); GOLF(c, 11, 6, 22, 2); GOLF(c, 14, 8, 21, 4);
    c.line(28, 2, 18, 5, 'H'); c.line(24, 5, 15, 9, 'H'); c.rect(18, 1, 6, 1, 'j'); ZONGEBLEEKT(c, 6, 16, 15, 24); },
  dreads: c => { LOCS(c, 0, 16, x => [22, 25, 24, 23, 25, 21][Math.floor(x / 3) % 6], x => Math.round(1 + ((x - 19) / 13) ** 2 * 7)); },
  bob: c => { ZIJ_MODEL(c); c.hline(8, 20, 9, 'H'); },
  vlecht: c => { ZIJ_KORT(c); c.rect(8, 9, 3, 3, 'h'); STRENG(c, 8, 12, 26); c.hline(8, 11, 3, 'H'); },
  knotjes: c => { ZIJ_KORT(c); KNOT(c, 14, 3, 4); },
});
export const haarZijAchter = (c, k) => (ZIJ_ACHTER[B(k)] || ZIJ_MODEL)(c);
export const haarZijVoor = (c, k) => (ZIJ_VOOR[B(k)] || ZIJ_PONY)(c);

// Van achteren (hoofdRug in rig.js): het achterhoofd, met de oren aan beide kanten en onderin de nek
const RUG_VOL = c => { c.rect(8, 3, 26, 19, 'h'); c.rect(10, 1, 22, 2, 'h'); c.rect(13, 0, 16, 1, 'h'); for (const x of [13, 18, 23, 28]) c.line(x, 3, x - 1, 20, 'H'); c.rect(14, 2, 3, 1, 'j'); c.rect(21, 2, 3, 1, 'j'); };
const RUG_KORT = c => { c.rect(9, 4, 24, 15, 'h'); c.rect(11, 3, 20, 1, 'h'); for (const x of [14, 20, 26]) c.line(x, 4, x, 16, 'H'); c.rect(15, 4, 3, 1, 'j'); };
const RUG_CORN = c => { c.rect(9, 4, 24, 15, 'h'); c.rect(11, 3, 20, 1, 'h'); for (const x of [11, 14, 17, 20, 23, 26, 29]) c.vline(x, 3, 16, 'H'); };
const RUG = {
  model: RUG_VOL,
  kort: RUG_KORT,
  kuif: c => { RUG_KORT(c); c.ellipse(21, 1, 9, 2, 'h'); c.rect(13, 1, 16, 3, 'h');
    c.line(15, 0, 27, 0, 'j'); },
  krul: c => { c.rect(9, 5, 24, 13, 'h'); for (const [x, y] of [[10, 6], [15, 4], [21, 3], [27, 4], [32, 6], [9, 12], [33, 12], [14, 15], [21, 16], [28, 15]]){ c.circ(x, y, 3, 'h'); c.px(x - 1, y - 1, 'j'); c.px(x + 1, y + 1, 'H'); } },
  staart: c => { RUG_VOL(c); c.rect(19, 18, 4, 7, 'h'); c.vline(21, 19, 6, 'H'); c.rect(19, 17, 4, 1, 'H'); },
  // (van achteren: één glanzende massa tot op de schouders, met lokken en een gepunte onderrand)
  lang: c => { RUG_VOL(c); c.rect(6, 10, 30, 13, 'h'); for (let x = 5; x <= 36; x++) c.rect(x, 22, 1, [2, 3, 2, 1, 2, 3, 3, 2, 1][x % 9], 'h'); // (een golvende onderrand, zonder gaten)
    for (const x of [10, 15, 21, 27, 32]) c.line(x, 6, x + (x < 21 ? -1 : x > 21 ? 1 : 0), 23, 'H'); c.line(13, 3, 19, 1, 'j'); c.line(14, 4, 20, 2, 'j'); },
  kaal: c => { c.rect(10, 4, 22, 18, 's'); c.rect(12, 2, 18, 2, 's'); c.rect(29, 5, 3, 17, 'S'); c.rect(13, 5, 4, 1, 'S'); },
  afro: c => { c.ellipse(21, 9, 16, 10, 'h'); for (let y = 0; y < 20; y += 3) for (let x = 6; x < 37; x += 4){ const xx = x + (y % 2) * 2; if (c.is(xx, y, 'h')) c.px(xx, y, 'H'); } },
  kroes: c => { RUG_KORT(c); for (let y = 4; y < 18; y += 2) for (let x = 9 + (y % 4 ? 1 : 0); x < 33; x += 3) c.px(x, y, 'H'); },
  cornrows: RUG_CORN,
  vlechten: c => { RUG_CORN(c); for (let y = 14; y < 26; y += 2){ c.rect(11, y, 3, 2, (y >> 1) % 2 ? 'h' : 'H'); c.rect(28, y, 3, 2, (y >> 1) % 2 ? 'H' : 'h'); } },
};
Object.assign(RUG, {
  stekels: c => { RUG_KORT(c); for (let x = 9; x < 31; x += 4){ c.poly([x, 6, x + 2, 0, x + 4, 6], 'h'); c.px(x + 2, 2, 'j'); } },
  hanenkam: c => { RUG.kaal(c); GESCHOREN(c, 10, 2, 31, 21); c.rect(18, 0, 6, 22, 'h'); c.vline(22, 1, 20, 'H'); c.rect(19, 0, 2, 3, 'j'); },
  fade: c => { RUG.kaal(c); FADE(c, 9, 9, 32, 22); c.rect(9, 3, 24, 7, 'h'); c.rect(11, 2, 20, 1, 'h'); for (const x of [14, 20, 26]) c.vline(x, 3, 6, 'H'); c.rect(15, 3, 3, 1, 'j'); },
  millimeter: c => { RUG.kaal(c); BUZZ(c, 10, 2, 31, 20, [17, 4]); },
  scheiding: RUG_KORT,
  midden: c => { RUG_VOL(c); c.hline(8, 21, 26, 'H'); },
  knot: c => { c.rect(9, 4, 24, 15, 'h'); c.rect(11, 3, 20, 1, 'h'); for (const [a, b] of [[12, 18], [18, 20], [24, 22], [30, 24]]) c.line(a, 16, b, 7, 'H'); // (glad, met lokken naar de knot)
    KNOT2(c, 21, 2, 4, 'geen'); },
  surfer: c => { RUG_VOL(c); c.rect(7, 10, 28, 12, 'h'); PUNTEN(c, 7, 34, 22, 1); for (const [x, f] of [[10, 0], [15, 2], [20, 4], [25, 1], [30, 3]]) GOLF(c, x, 4, 23, f); ZONGEBLEEKT(c, 7, 20, 35, 26); },
  // (van achteren: de hele rij locs hangt door tot in de nek, niet allemaal even lang)
  dreads: c => { LOCS(c, 2, 35, x => [24, 22, 25, 23, 25][Math.floor(x / 3) % 5]); },
  bob: c => { RUG_VOL(c); c.rect(8, 10, 26, 11, 'h'); c.hline(8, 21, 26, 'H'); for (const x of [13, 18, 23, 28]) c.vline(x, 10, 11, 'H'); },
  vlecht: c => { RUG_KORT(c); for (const x of [16, 21, 26]) c.line(x, 3, 21, 15, 'H'); STRENG(c, 19, 15, 26); c.px(20, 25, 'j'); },
  knotjes: c => { RUG_KORT(c); KNOT(c, 10, 4, 4); KNOT(c, 32, 4, 4); },
});
export const haarRug = (c, k) => (RUG[B(k)] || RUG_VOL)(c);
