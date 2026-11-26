/* ===================== Samen bij dezelfde club: jij en je jeugdvriend(in) ===================== */
// In de stijl van de mijlpaalgoal (pixel/mijlpaal.js), 220×124 op 10 fps. Drie delen:
//  A (beeld 0-35)  jullie zien elkaar in het stadion, rennen op elkaar af en springen samen in de lucht
//  B (beeld 36-61) vroeger: twee kinderen op het veldje achter de kantine, twee jassen als doel (in sepia, zoals een oude foto)
//  C (beeld 62-95) de tribune: een spandoek SAMEN! met jullie namen, jullie staan er juichend voor
// Daarna lopen de laatste 16 beelden van de tribune door tot je verder klikt (zoals de mijlpaalgoal).
import { inkleuren, sprite } from './rig.js';
import { donker, frame, frameOp, lookVan } from './atlas.js';
import { MH, MW, STIJL, tribune, veldB } from './mijlpaal.js';
import { tekst, zonderAccent } from './font.js';

export const S_FPS = 10, S_FRAMES = 96, S_LUS = 16;
export const S_MOMENT = {botsen:18, vroeger:36, nu:62};
const GY = 112; // de voeten op het gras
// extra kleuren voor het veldje van vroeger: een grijze lucht, de kantine, twee jassen
const EXTRA = {x:'#8f9bb0', X:'#6f7b90', q:'#9b7653', Q:'#5e3b26', j:'#3b5bd6', J:'#c0392b', u:'#2f7d3f', U:'#378c48'};

// het veldje achter de kantine: een grijze lucht, de kantine met een bordje, een hek en twee jassen als doel
function veldje(){
  return sprite(MW, MH, c => {
    c.rect(0, 0, MW, 62, 'x'); for (let i = 0; i < 6; i++) c.rect((i * 41 + 9) % MW, 6 + (i * 7) % 18, 22, 4, 'X'); // de wolken
    c.rect(12, 24, 74, 36, 'q'); c.poly([8, 26, 49, 10, 90, 26], 'Q');                                     // de kantine met het dak
    c.rect(20, 34, 14, 10, 'M'); c.rect(42, 34, 14, 10, 'M'); c.rect(66, 40, 12, 20, 'd');                  // ramen en de deur
    c.rect(30, 26, 38, 7, 'Q'); tekst(c, 49, 27, 'KANTINE', 'w', {align:'c'});
    for (let x = 90; x < MW; x += 10) c.vline(x, 48, 14, 'W'); c.hline(90, 50, MW - 90, 'W'); c.hline(90, 56, MW - 90, 'W'); // het hek
    let y = 62, h = 4, i = 0; while (y < MH){ c.rect(0, y, MW, h, i % 2 ? 'U' : 'u'); y += h; h += 2; i++; }        // het gras
    c.rect(150, GY - 4, 9, 4, 'j'); c.rect(151, GY - 6, 7, 2, 'j'); c.rect(196, GY - 4, 9, 4, 'J'); c.rect(197, GY - 6, 7, 2, 'J'); // de jassen als palen
  });
}

// info = {jij, vriend (uiterlijk), tenue (van de club), naam (club), jijNaam, vriendNaam}. Geeft {W, H, teken(g, f)}
export function maakSamen(info = {}){
  const t = info.tenue || {shirt:'#e0262b', accent:'#ffffff', patroon:'strepen', broek:'#2f62d6', sok:'#e0262b'};
  const pal = {...STIJL, ...EXTRA, 1:t.shirt, 2:donker(t.shirt, .3), 3:t.accent || '#ffffff'};
  const naam = zonderAccent(info.naam || 'FC').slice(0, 24);
  const namen = zonderAccent(`${info.jijNaam || ''} & ${info.vriendNaam || ''}`).toUpperCase().slice(0, 30);
  const ik = lookVan(info.jij || {}, t, {}), hij = lookVan(info.vriend || {}, t, {});
  // vroeger: in een simpel groen shirtje van de amateurclub
  const amateur = {shirt:'#2f7d3f', accent:'#ffffff', patroon:'effen', broek:'#16171c', sok:'#2f7d3f'};
  const ikKlein = lookVan(info.jij || {}, amateur, {}), hijKlein = lookVan(info.vriend || {}, amateur, {});
  const bgA = [0, 1].map(j => inkleuren(veldB(naam, j), pal)), bgB = inkleuren(veldje(), pal);
  const vroegerLabel = inkleuren(sprite(52, 9, c => tekst(c, 2, 2, 'VROEGER', 'w')), pal);
  const TRIB = []; const trib = f => TRIB[f % 8] || (TRIB[f % 8] = tribune(f % 8, 'SAMEN!', namen).map(im => inkleuren(im, pal)));
  const zet = (g, look, anim, i, x, flip = false, s = 1, y = GY) => { const cv = frame(look, anim, i, flip);
    g.drawImage(cv, Math.round(x - (flip ? 50 : 47) * s), Math.round(y - 75 * s), Math.round(cv.width * s), Math.round(cv.height * s)); };
  // flitsjes van fotografen
  const flits = (g, f, n = 3) => { g.fillStyle = '#ffffff'; for (let i = 0; i < n; i++){ const k = ((f * 7 + i) * 2654435761) >>> 0; if (k % 3) continue; const x = k % MW, y = 8 + (k >> 8) % 40; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } };

  // A: jullie zien elkaar, rennen op elkaar af en springen samen
  function delA(g, f){
    g.drawImage(bgA[(f >> 2) % 2], 0, 0);
    const B = S_MOMENT.botsen;
    if (f < B){ const u = f / B;
      zet(g, ik, 'renJuich', f % 8, -24 + (100 + 24) * u); zet(g, hij, 'renJuich', (f + 3) % 8, 244 - (244 - 122) * u, true); }
    else if (f < B + 8){ const i = f - B;                       // samen de lucht in (een sprong van een paar pixels)
      const op = Math.round(Math.sin(Math.PI * i / 7) * 10);
      zet(g, ik, 'juich', frameOp('juich', i / S_FPS), 100, false, 1, GY - op); zet(g, hij, 'juich', frameOp('juich', i / S_FPS + .2), 122, true, 1, GY - op); }
    else { const tt = (f - B - 8) / S_FPS;                     // en daarna nog even juichen
      zet(g, ik, 'juich', frameOp('juich', tt), 100); zet(g, hij, 'juich', frameOp('juich', tt + .2), 122, true); }
    if (f >= B) flits(g, f);
  }
  // B: vroeger, op het veldje achter de kantine: hij geeft de bal, jij schiet tussen de jassen door, en jullie juichen
  function delB(g, f){
    const n = f - S_MOMENT.vroeger, s = .62, kx = 110, vx = 70;
    g.drawImage(bgB, 0, 0);
    if (n < 10) zet(g, ikKlein, 'sta', frameOp('sta', n / S_FPS), kx, false, s);
    else if (n < 16) zet(g, ikKlein, 'schiet', Math.min(7, n - 10), kx, false, s);
    else zet(g, ikKlein, 'juich', frameOp('juich', (n - 16) / S_FPS), kx + Math.min(20, (n - 16) * 3), false, s);
    if (n < 16) zet(g, hijKlein, 'wijs', 0, vx, false, s); else zet(g, hijKlein, 'renJuich', n % 8, vx + Math.min(56, (n - 16) * 5), false, s);
    // de bal: van hem naar jou, en dan tussen de jassen door
    g.fillStyle = '#ffffff';
    if (n < 10){ const u = n / 10; g.fillRect(Math.round(vx + 8 + (kx + 6 - vx - 8) * u), GY - 3, 3, 3); }
    else if (n < 22){ const u = Math.max(0, n - 13) / 9; g.fillRect(Math.round(kx + 10 + (178 - kx - 10) * u), Math.round(GY - 3 - Math.sin(Math.PI * u) * 8), 3, 3); }
    // als een oude foto: sepia, met een donkere rand
    g.save(); g.globalCompositeOperation = 'color'; g.fillStyle = '#8a5a2b'; g.fillRect(0, 0, MW, MH); g.restore();
    g.save(); const v = g.createRadialGradient(MW / 2, MH / 2, 40, MW / 2, MH / 2, 130); v.addColorStop(0, 'rgba(40,24,10,0)'); v.addColorStop(1, 'rgba(40,24,10,.55)'); g.fillStyle = v; g.fillRect(0, 0, MW, MH); g.restore();
    if ((n >> 2) % 2 === 0) g.drawImage(vroegerLabel, 4, 3);
  }
  // C: de tribune met het spandoek, jullie juichend ervoor
  function delC(g, f){
    const n = f - S_MOMENT.nu, [a, v, d, p] = trib(n);
    g.drawImage(a, 0, 0); g.drawImage(v, -1, -1); g.drawImage(d, 0, 0); g.drawImage(p, 0, 0);
    zet(g, ik, 'juich', frameOp('juich', n / S_FPS), 28); zet(g, hij, 'juich', frameOp('juich', n / S_FPS + .2), 192, true);
  }
  function teken(g, f){
    if (f >= S_FRAMES) f = S_FRAMES - S_LUS + ((f - S_FRAMES) % S_LUS);
    g.imageSmoothingEnabled = false;
    g.fillStyle = STIJL.k; g.fillRect(0, 0, MW + 2, MH + 2);
    g.save(); g.translate(1, 1); g.beginPath(); g.rect(0, 0, MW, MH); g.clip();
    if (f < S_MOMENT.vroeger) delA(g, f); else if (f < S_MOMENT.nu) delB(g, f); else delC(g, f);
    g.restore();
  }
  return {W:MW + 2, H:MH + 2, teken};
}
