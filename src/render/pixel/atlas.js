/* ===================== Pixelspelers: uiterlijk, kleuren en een cache van frames ===================== */
// Een 'look' = alles wat bepaalt hoe een figuur eruitziet: {kapsel, vrouw, kleding, patroon, handschoen, kleuren:{sleutel:'#hex'}}.
// frame(look, anim, i, flip) geeft een canvas (98×92 met de omlijning); dezelfde look + animatie + frame wordt één keer getekend.
import { MERKEN } from '../../data/merken.js';
import { kleurAfstand } from '../../data/tenues.js';
import { HAAR, HUID, SCHOENEN } from '../../data/uiterlijk.js';
import { ANIMS, ANKER_X, tekenFrame } from './animaties.js';
import { GROND, inkleuren } from './rig.js';
import { ouderCode, ouderKleuren } from './leeftijd.js';
import { tattooKleuren } from './tattoo.js';

// ---------- kleuren ----------
const hex2 = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const naarHex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const meng = (a, b, t) => { const x = hex2(a), y = hex2(b); return naarHex(x.map((v, i) => v + (y[i] - v) * t)); };
export const donker = (h, t) => meng(h, '#0b0d18', t);
export const licht = (h, t) => meng(h, '#ffffff', t);
const helder = h => { const [r, g, b] = hex2(h); return r * .299 + g * .587 + b * .114; };

// Pakken en dassen voor journalisten en clubmensen
const PAKKEN = ['#2a2f3d', '#3b3f48', '#1d2a44', '#4a3b2f', '#2f3a2c', '#53565e'];
const DASSEN = ['#a3161b', '#1e5bd6', '#d4a72c', '#1f9d55', '#6d2bd1', '#16171c'];
const KEEPERHANDSCHOEN = ['#7ed957', '#4fa83a'];

// uit = {huid, haar, kapsel, schoen, vrouw, lengte, bouw} (pixel/uiterlijk.js: uiterlijkVoor, of je eigen keuze)
// tenue = {shirt, accent, patroon, broek, sok} (data/tenues.js). opties: {kleding, handschoen, band (aanvoerder), nr (welk pak/das)}
export function lookVan(uit = {}, tenue = null, opties = {}){
  const kleding = opties.kleding || 'tenue', t = tenue || {shirt:'#e0262b', accent:'#ffffff', patroon:'strepen', broek:'#2f62d6', sok:'#e0262b'};
  const s = HUID[uit.huid] || HUID[0], h = HAAR[uit.haar] || HAAR[0], schoen = SCHOENEN[uit.schoen] || '#16171c';
  const zwartHaar = helder(h) < 40;
  const k = {
    s, S:donker(s, .13), _:donker(s, .3), p:meng(s, '#ff6f6f', .35),
    h, H:zwartHaar ? licht(h, .12) : donker(h, .35), j:zwartHaar ? licht(h, .3) : licht(h, .28),
    r:t.shirt, R:donker(t.shirt, .3), w:t.accent, W:donker(t.accent, .16),
    o:t.sok || t.shirt, O:donker(t.sok || t.shirt, .3), u:t.broek, U:donker(t.broek, .3),
    y:schoen, Y:donker(schoen, .22), q:KEEPERHANDSCHOEN[0], Q:KEEPERHANDSCHOEN[1],
  };
  // pak (stijlbron: BAAS): nette bruine schoenen; vrijetijdskleding (CASUAL): jas, spijkerbroek en witte schoenen
  if (kleding === 'pak'){ const pk = opties.pak || PAKKEN[(opties.nr || 0) % PAKKEN.length]; k.c = pk; k.C = opties.pak2 || donker(pk, .3); k.t = opties.das || DASSEN[((opties.nr || 0) >> 3) % DASSEN.length]; k.y = '#7a4a2a'; k.Y = '#6f4630'; k.a = k.A = '#3b2a22'; }
  if (kleding === 'casual'){ Object.assign(k, {c:'#34343e', C:'#22222a', e:'#4a6fb0', E:'#33508a', y:'#f4f4f8', Y:'#c4c4d0', a:'#3a3a44', A:'#24242c'}); }
  if (kleding === 'training'){ k.u = t.broek || '#16171c'; k.U = donker(k.u, .3); }
  // (een donkere schoen op een donkere omlijning: iets lichter, anders zie je hem niet)
  if (helder(k.y) < 30){ k.y = '#2b2d36'; k.Y = '#1f2028'; }
  if (!k.a){ k.a = donker(k.y, .35); k.A = donker(k.y, .5); } // de zolen
  // jouw speler wordt ouder (uit.leeftijd, alleen bij 'jij|…' in uiterlijkVoor): een code achter het kapsel, grijs in het palet
  const oud = uit.leeftijd ? ouderCode(uit.leeftijd, uit.ouderZaad || 0, !!uit.vrouw, uit.kapsel) : '';
  if (oud) ouderKleuren(k, oud);
  // jouw tattoos (uit.tattoo, pixel/tattoo.js): een tweede code achter het kapsel, de inkt in het palet
  const tat = uit.tattoo || '';
  if (tat) tattooKleuren(k);
  if (opties.kleuren) Object.assign(k, opties.kleuren); // (eigen kleuren, zoals de eigenaar in de contractscène)
  // het kledingmerk op de borst (data/merken.js): als code achter het patroon ('strepen#vortiq'), het logo in kleur '|'
  const merk = kleding === 'tenue' && t.merk && MERKEN[t.merk] ? t.merk : '';
  const patroon = kleding === 'tenue' ? (t.patroon || 'effen') + (merk ? '#' + merk : '') : 'effen';
  if (merk){ const kies = [MERKEN[merk].goud ? '#ffd23a' : null, '#ffffff', '#16171c'].filter(Boolean), afst = c => kleurAfstand(c, t.shirt); // (het logo staat op een vlakje in de shirtkleur)
    k['|'] = kies.find(c => afst(c) > 150) || kies.sort((a, b) => afst(b) - afst(a))[0]; }
  let baard = opties.snor ? 'snor' : !uit.vrouw && uit.baard && uit.baard !== 'geen' ? uit.baard : '';
  if (!opties.snor && uit.leeftijd && baard){ if (uit.leeftijd < 17) baard = ''; else if (uit.leeftijd < 19 && baard === 'baard') baard = 'stoppels'; } // (op je vijftiende nog geen baard)
  const kapsel = (uit.kapsel || 'model') + (oud || tat ? '@' + (oud || '00000') : '') + (tat ? '~' + tat : '');
  const sleutel = [kapsel, uit.vrouw ? 'v' : '', opties.snor ? 'snor' : baard, kleding, patroon, opties.handschoen ? 'q' : '', opties.band ? 'C' : '', opties.rugnummer || '', opties.rugnaam || '', ...Object.values(k)].join('|');
  return {kapsel, vrouw:!!uit.vrouw, snor:!!opties.snor, baard, kleding, patroon, handschoen:!!opties.handschoen, band:!!opties.band, rugnummer:opties.rugnummer || '', rugnaam:opties.rugnaam || '', kleuren:k, sleutel,
    lengte:uit.lengte || 1, bouw:uit.bouw || 1};
}

// ---------- frames ----------
const SLEUTELS = new Map(), CANVAS = new Map();
const MAX = 2500; // canvassen in de cache (daarna de oudste weg)
export function anim(naam){ return ANIMS[naam] || ANIMS.sta; }
export const aantal = naam => anim(naam).frames.length;
// Welk frame na t seconden (loop: rond; anders blijft het laatste staan)
export function frameOp(naam, t){ const a = anim(naam), n = a.frames.length, i = Math.floor(Math.max(0, t) * a.fps); return a.loop ? i % n : Math.min(n - 1, i); }
export function frame(look, naam, i, flip = false){
  const a = anim(naam), vorm = [look.kapsel, look.vrouw ? 'v' : '', look.kleding, look.patroon, look.handschoen ? 'q' : '', look.band ? 'C' : '', look.rugnummer || '', look.rugnaam || '', look.snor ? 's' : look.baard || '', naam, i].join('|');
  let img = SLEUTELS.get(vorm);
  if (!img){ img = tekenFrame(a, i, {kapsel:look.kapsel, vrouw:look.vrouw, kleding:look.kleding, patroon:look.patroon, handschoen:look.handschoen, band:look.band, nr:look.rugnummer, rugnaam:look.rugnaam, snor:look.snor, baard:look.baard, bal:false}); SLEUTELS.set(vorm, img); }
  const sl = look.sleutel + '#' + naam + '#' + i + (flip ? 'f' : '');
  let cv = CANVAS.get(sl);
  if (!cv){
    cv = inkleuren(flip ? img.flipX() : img, look.kleuren);
    CANVAS.set(sl, cv);
    if (CANVAS.size > MAX) CANVAS.delete(CANVAS.keys().next().value);
  } else { CANVAS.delete(sl); CANVAS.set(sl, cv); } // (net gebruikt: achteraan)
  return cv;
}
// Het ankerpunt (de voeten op de grond) in het frame, als fractie van links en van onder (zoals THREE.Sprite.center)
export const anker = (naam, flip = false) => { const w = (anim(naam).w || 96) + 2, x = (ANKER_X + 1) / w; return {x:flip ? 1 - x : x, y:(92 - (GROND + 1)) / 92, w, h:92}; };
// Hoe hoog de figuur in pixels is (van de voeten tot de bovenkant van het haar), voor de schaal in de wereld
export const FIGUUR_PX = 56;
