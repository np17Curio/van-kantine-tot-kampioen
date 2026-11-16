/* ===================== Ouder worden: je pixelspeler groeit mee met zijn leeftijd ===================== */
// Alleen voor jouw speler (uiterlijkVoor met een sleutel 'jij|…' zet uit.leeftijd en uit.ouderZaad). lookVan (atlas.js)
// rekent daar een vaste code van en plakt die achter het kapsel: 'kort@01200'. Zo gaat de leeftijd overal mee (het veld,
// de krantenfoto's, de persconferentie, de contractscène, de opkomst) zonder dat elke scène iets extra's hoeft door te geven.
// rig.js tekent het hoofd zoals altijd (kapsels.js kijkt alleen naar het deel vóór de '@') en roept daarna verouder() aan.
// De code: [jong, rimpels, grijs, kaal, bril], elk één cijfer. Allemaal 0 (ongeveer 20-29 jaar) = geen code: precies zoals vroeger.
//   jong    2 = jonger dan 17 (ronder gezicht, nog geen baard), 1 = 17-19 (iets ronder, hooguit stoppels)
//   rimpels 1 = vanaf 30 (kraaienpootjes), 2 = vanaf 42 (lijntjes naast de mond), 3 = vanaf 54 (wallen)
//   grijs   1-6: eerst een paar grijze haren bij de slapen (midden 30), dan de slapen, dan steeds meer peper-en-zout, tot zilver
//   kaal    1 = inhammen, 2 = diepere inhammen (van achteren: een kale kruin), 3 = kaal bovenop (alleen mannen, niet iedereen)
//   bril    1 = een leesbril (sommigen, vanaf eind 40)
// Nieuwe kleursleutels: '=' grijs haar, '+' de schaduw daarvan, '&' het montuur van de bril.

export const basisKapsel = k => String(k || 'model').split('@')[0];

const RUIS = (x, y) => (((x * 73856093) ^ (y * 19349663) ^ (x * y * 83492791)) >>> 0) % 100;
const HAAR = 'hHj';

// De code voor deze leeftijd ('' = niets te zien). zaad = een vast getal per speler (wie kaal wordt en wanneer, wie een bril krijgt)
export function ouderCode(leeftijd, zaad = 0, vrouw = false, kapsel = 'model'){
  const l = +leeftijd; if (!l || !isFinite(l)) return '';
  const z1 = zaad % 100, z2 = (zaad >>> 8) % 100, z3 = (zaad >>> 16) % 100, z4 = (zaad >>> 24) % 7;
  const jong = l < 17 ? 2 : l < 20 ? 1 : 0;
  const rimpels = l >= 54 ? 3 : l >= 42 ? 2 : l >= 30 ? 1 : 0;
  const g = l - (z4 - 3);  // (de een wordt wat eerder grijs dan de ander: tot drie jaar verschil)
  const grijs = g >= 65 ? 6 : g >= 59 ? 5 : g >= 52 ? 4 : g >= 45 ? 3 : g >= 40 ? 2 : g >= 35 ? 1 : 0;
  let kaal = 0;
  if (!vrouw && z1 < 45 && basisKapsel(kapsel) !== 'kaal'){ // (ongeveer de helft van de mannen, vanaf 33-41 jaar)
    const begin = 33 + z2 % 9; kaal = l >= begin + 12 ? 3 : l >= begin + 6 ? 2 : l >= begin ? 1 : 0;
  }
  const bril = (l >= 48 && z3 < 30) || (l >= 60 && z3 < 55) ? 1 : 0;
  const code = [jong, rimpels, grijs, kaal, bril].join('');
  return code === '00000' ? '' : code;
}
export function leesCode(kapsel){
  const s = String(kapsel || '').split('@')[1]; if (!s) return null;
  const [jong, rimpels, grijs, kaal, bril] = [...s].map(Number);
  return {jong, rimpels, grijs, kaal, bril};
}

// De kleuren: grijs haar ('='/'+'), het montuur ('&'), en op hoge leeftijd wordt al het haar zilverachtig
const mengHex = (a, b, t) => { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  return '#' + [16, 8, 0].map(s => Math.round(((x >> s) & 255) + (((y >> s) & 255) - ((x >> s) & 255)) * t).toString(16).padStart(2, '0')).join(''); };
export function ouderKleuren(k, code){
  const o = typeof code === 'string' ? leesCode('@' + code) : code; if (!o) return k;
  const oud = Math.max(0, o.grijs - 3) / 3; // (0 tot 1, vanaf grijs 4)
  k['='] = mengHex('#adadb4', '#e4e4e8', oud); k['+'] = mengHex('#7c7c86', '#a8a8b2', oud);
  k['&'] = '#3b3742';
  if (o.grijs >= 4){ const t = [0, 0, 0, 0, .22, .4, .62][o.grijs]; k.h = mengHex(k.h, k['='], t); k.H = mengHex(k.H, k['+'], t); k.j = mengHex(k.j, '#ececf0', t); }
  return k;
}

// ---------- tekenen (op het hoofd van 38×26, na het haar en het gezicht) ----------
// aanzicht: 'voor' (gezicht x 10-31), 'zij' (naar rechts, gezicht x 15-31) of 'rug' (van achteren)
const isHaar = (c, x, y) => c.is(x, y, HAAR);
const grijzig = (c, x, y) => { if (c.is(x, y, 'hj')) c.px(x, y, '='); else if (c.is(x, y, 'H')) c.px(x, y, '+'); };
const wis = (c, x, y) => c.img.set(x, y, 0);
const opHuid = (c, x, y, k) => { if (c.is(x, y, 's')) c.px(x, y, k); };
const STROOI = [0, 0, 0, 14, 32, 55, 78]; // (hoeveel procent van de andere haren grijs is)

// de koepel van een kaal hoofd (zoals het kapsel 'kaal' in kapsels.js)
const KOEPEL_V = (x, y) => (y >= 5 && x >= 10 && x <= 31) || (y >= 3 && x >= 12 && x <= 29) || (y >= 2 && x >= 15 && x <= 26);
const DAK_Z = x => Math.round(1 + ((x - 20.5) / 11) ** 2 * 4.5);
const KOEPEL_R = (x, y) => (y >= 4 && x >= 10 && x <= 31) || (y >= 2 && x >= 12 && x <= 29);

function kaalVoor(c, n){
  if (n === 3){
    for (let y = 0; y <= 14; y++) for (let x = 0; x < 38; x++){
      if (!isHaar(c, x, y)) continue;
      if ((x <= 10 || x >= 31) && y >= 8) continue;                                   // de krans aan de zijkanten blijft
      if (x >= 10 && x <= 31 && y >= 10) c.px(x, y, x === 31 ? 'S' : 's');            // (pony over het voorhoofd: huid)
      else if (KOEPEL_V(x, y)) c.px(x, y, 's'); else wis(c, x, y);
    }
    for (let y = 2; y < 10; y++) for (let x = 10; x <= 31; x++) if (KOEPEL_V(x, y) && !c.img.get(x, y)) c.px(x, y, 's');
    for (let y = 5; y < 10; y++) for (let x = 29; x <= 31; x++) if (c.is(x, y, 's')) c.px(x, y, 'S'); // schaduw rechts
    c.px(15, 4, 'i'); c.px(16, 4, 'i'); c.px(14, 5, 'i');                              // een glimmende kruin
    return;
  }
  // inhammen: het voorhoofd loopt aan beide kanten hoger door
  const diep = n === 2 ? [[10, 6], [11, 6], [12, 7], [13, 7], [14, 8], [15, 9]] : [[10, 8], [11, 8], [12, 8], [13, 9]];
  for (const [x, y0] of diep) for (let y = y0; y <= 11; y++){ if (isHaar(c, x, y)) c.px(x, y, 's'); const xr = 41 - x; if (isHaar(c, xr, y)) c.px(xr, y, xr >= 30 ? 'S' : 's'); }
}
function kaalZij(c, n){
  if (n === 3){
    for (let y = 0; y <= 14; y++) for (let x = 0; x < 38; x++){
      if (!isHaar(c, x, y)) continue;
      if (x <= 16 && y >= 7) continue;                                                // de krans achter en boven het oor
      if (x >= 15 && y >= 10) c.px(x, y, 's');
      else if (x >= 10 && x <= 31 && y >= DAK_Z(x)) c.px(x, y, 's'); else wis(c, x, y);
    }
    for (let x = 10; x <= 31; x++) for (let y = DAK_Z(x); y < 10; y++) if (!c.img.get(x, y)) c.px(x, y, 's');
    c.px(21, 1, 'i'); c.px(22, 1, 'i'); c.px(20, 2, 'i');
    return;
  }
  const x0 = n === 2 ? 23 : 27, y0 = n === 2 ? 5 : 7;
  for (let y = y0; y <= 11; y++) for (let x = x0; x <= 33; x++) if (isHaar(c, x, y)) c.px(x, y, 's');
}
function kaalRug(c, n){
  if (n === 3){
    for (let y = 0; y <= 8; y++) for (let x = 0; x < 38; x++){
      if (!isHaar(c, x, y)) continue;
      if (KOEPEL_R(x, y)) c.px(x, y, x >= 29 ? 'S' : 's'); else wis(c, x, y);
    }
    for (let y = 2; y <= 8; y++) for (let x = 10; x <= 31; x++) if (KOEPEL_R(x, y) && !c.img.get(x, y)) c.px(x, y, x >= 29 ? 'S' : 's');
    return;
  }
  if (n === 2) for (let y = 2; y <= 7; y++) for (let x = 16; x <= 25; x++){ const dx = (x - 20.5) / 4.5, dy = (y - 4.5) / 2.6; if (isHaar(c, x, y) && dx * dx + dy * dy < 1) c.px(x, y, x >= 23 ? 'S' : 's'); } // een kale plek op de kruin
}

function grijsWorden(c, n, slaap){
  if (!n) return;
  for (let y = 0; y < 26; y++) for (let x = 0; x < 38; x++){
    if (!isHaar(c, x, y)) continue;
    const r = RUIS(x + 3, y), z = slaap(x, y);
    if (z && (n >= 2 ? r < 80 : r < 45 && z === 2)) grijzig(c, x, y);
    else if (r < STROOI[n]) grijzig(c, x, y);
  }
}
// de slapen: 2 = het eerst grijs (bij de oren), 1 = daarna
const SLAAP_V = (x, y) => (x <= 11 || x >= 30) && y >= 6 && y <= 19 ? (y >= 10 ? 2 : 1) : 0;
const SLAAP_Z = (x, y) => x >= 9 && x <= 24 && y >= 7 && y <= 20 ? (x >= 14 && y >= 10 ? 2 : 1) : 0;
const SLAAP_R = (x, y) => (x <= 11 || x >= 30) && y >= 8 ? (y >= 12 ? 2 : 1) : 0;

function rimpelsVoor(c, n){
  if (n >= 1){ opHuid(c, 12, 17, 'S'); opHuid(c, 28, 17, 'S'); }                     // kraaienpootjes
  if (n >= 2){ opHuid(c, 16, 20, 'S'); opHuid(c, 16, 21, 'S'); opHuid(c, 24, 20, 'S'); opHuid(c, 24, 21, 'S'); } // naast de mond
  if (n >= 3){ opHuid(c, 12, 16, 'S'); opHuid(c, 28, 16, 'S'); for (const x of [14, 15, 25, 26]) opHuid(c, x, 19, 'S'); } // wallen
}
function rimpelsZij(c, n){
  if (n >= 1) opHuid(c, 25, 17, 'S');
  if (n >= 2){ opHuid(c, 27, 20, 'S'); opHuid(c, 27, 21, 'S'); }
  if (n >= 3){ opHuid(c, 25, 16, 'S'); opHuid(c, 27, 19, 'S'); opHuid(c, 28, 19, 'S'); }
}
function brilVoor(c){
  for (const x0 of [12, 23]){
    c.hline(x0, 14, 6, '&'); c.hline(x0, 19, 6, '&'); c.vline(x0, 15, 4, '&'); c.vline(x0 + 5, 15, 4, '&');
  }
  c.hline(18, 15, 5, '&'); c.px(10, 15, '&'); c.px(11, 15, '&'); c.px(29, 15, '&'); c.px(30, 15, '&');
}
function brilZij(c){
  c.hline(25, 14, 6, '&'); c.hline(25, 19, 6, '&'); c.vline(25, 15, 4, '&'); c.vline(30, 15, 4, '&');
  c.hline(21, 15, 4, '&'); // (het pootje naar het oor)
}
function jongVoor(c, n){
  // een ronder, zachter gezicht: de hoeken van de kaak eraf
  const weg = n === 2 ? [[10, 24], [11, 24], [10, 23], [31, 24], [30, 24], [31, 23]] : [[10, 24], [31, 24]];
  for (const [x, y] of weg) if (c.is(x, y, 'sS')) wis(c, x, y);
}
function jongZij(c, n){
  const weg = n === 2 ? [[31, 24], [30, 24], [31, 23]] : [[31, 24]];
  for (const [x, y] of weg) if (c.is(x, y, 'sS')) wis(c, x, y);
}

// Het hoofd ouder (of jonger) maken. c = Doek van het hoofd (38×26), kapsel met de code erachter
export function verouder(c, kapsel, aanzicht = 'voor'){
  const o = leesCode(kapsel); if (!o) return;
  if (aanzicht === 'rug'){ if (o.kaal) kaalRug(c, o.kaal); grijsWorden(c, o.grijs, SLAAP_R); return; }
  const zij = aanzicht === 'zij';
  if (o.kaal) (zij ? kaalZij : kaalVoor)(c, o.kaal);
  grijsWorden(c, o.grijs, zij ? SLAAP_Z : SLAAP_V);
  if (o.rimpels) (zij ? rimpelsZij : rimpelsVoor)(c, o.rimpels);
  if (o.jong) (zij ? jongZij : jongVoor)(c, o.jong);
  if (o.bril) (zij ? brilZij : brilVoor)(c);
}
