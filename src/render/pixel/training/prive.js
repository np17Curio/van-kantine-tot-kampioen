/* ===================== Trainingsanimaties: herstel en privé ===================== */
// Zie basis.js. Rustig aan (ijsbad en bed), mentale training, een avond uit (of met je vrienden friet halen), huiswerk,
// een vlog opnemen, met je ouders praten, een bijbaantje, de avondschool en het magazijn. Elk: 32 beelden van 220×124 op 10 fps.
// Geen woorden in beeld: alles in plaatjes (ballen, boeken, friet, hartjes, Zzz).
import { GY, KLEUR, TW, TH, T_FPS, bal, frame, frameOp, inkleuren, look, palet, sprite, zet } from './basis.js';
import { uiterlijkVoor } from '../uiterlijk.js';

// ---------- kleuren erbij (sleutels die KLEUR nog niet heeft) ----------
const EXTRA = {a:'#bfe8ff', A:'#6fb6e0', l:'#fff3c4', L:'#e8c36a', f:'#121831', F:'#232b4d', u:'#c08a54', U:'#8a5a32', j:'#2f5d4a', J:'#22463a',
  t:'#b04ae0', T:'#e04ab0', B:'#3ad6e0', H:'#c79a5b', D:'#9a7240', R:'#a3161b', P:'#dfe9f2', N:'#5a6fb0', O:'#3f5090', 4:'#f2e6c8', 5:'#d9c9a3'};
const PAL = {...KLEUR, ...EXTRA};
const R = Math.round;
// een achtergrond (één keer maken)
const beeld = (tenue, ...stappen) => inkleuren(sprite(TW, TH, ...stappen), {...palet(tenue), ...EXTRA});
const klein = (w, h, ...stappen) => inkleuren(sprite(w, h, ...stappen), PAL);

// ---------- tekenhulpjes op het beeld zelf (elke beeld opnieuw) ----------
const vlak = (g, x, y, w, h, k) => { g.fillStyle = PAL[k] || k; g.fillRect(R(x), R(y), R(w), R(h)); };
const doorzicht = (g, a, fn) => { g.save(); g.globalAlpha = Math.max(0, Math.min(1, a)); fn(); g.restore(); };
function ovaal(g, cx, cy, rx, ry, k){ g.fillStyle = PAL[k] || k; cx = R(cx); cy = R(cy); rx = R(rx); ry = R(ry);
  for (let dy = -ry; dy <= ry; dy++){ const b = Math.floor((rx + .5) * Math.sqrt(Math.max(0, 1 - (dy / (ry + .5)) ** 2))); g.fillRect(cx - b, cy + dy, b * 2 + 1, 1); } }
const rondje = (g, cx, cy, r, k) => ovaal(g, cx, cy, r, r, k);
// een ring (alleen de rand)
function ring(g, cx, cy, r, k){ g.fillStyle = PAL[k] || k; cx = R(cx); cy = R(cy); r = R(r); const b = (q, dy) => Math.floor(Math.sqrt(Math.max(0, (q + .5) ** 2 - dy * dy)));
  for (let dy = -r; dy <= r; dy++){ const bu = b(r, dy), bi = Math.abs(dy) <= r - 1 ? b(r - 1, dy) : -1; g.fillRect(cx - bu, cy + dy, bu - bi, 1); g.fillRect(cx + bi + 1, cy + dy, bu - bi, 1); } }
// een lichtbundel: van de punt (x0, y0) naar de rij y1 van xa tot xb, doorzichtig
function kegel(g, x0, y0, xa, xb, y1, k, a){ doorzicht(g, a, () => { g.fillStyle = PAL[k] || k;
  for (let y = R(y0); y <= R(y1); y++){ const t = (y - y0) / Math.max(1, y1 - y0), l = R(x0 + (xa - x0) * t), r = R(x0 + (xb - x0) * t); g.fillRect(l, y, Math.max(1, r - l + 1), 1); } }); }
// een Z (n pixels groot), een hartje, een muzieknootje
function zLetter(g, x, y, n, k){ vlak(g, x, y, n, 1, k); vlak(g, x, y + n - 1, n, 1, k); for (let i = 1; i < n - 1; i++) vlak(g, x + n - 1 - i, y + i, 1, 1, k); }
function hartje(g, x, y, k){ vlak(g, x, y, 2, 1, k); vlak(g, x + 3, y, 2, 1, k); vlak(g, x, y + 1, 5, 1, k); vlak(g, x + 1, y + 2, 3, 1, k); vlak(g, x + 2, y + 3, 1, 1, k); }
function noot(g, x, y, k){ vlak(g, x + 2, y, 1, 5, k); vlak(g, x + 3, y, 2, 1, k); vlak(g, x + 4, y + 1, 1, 1, k); vlak(g, x, y + 4, 3, 2, k); }
// een wolkje (adem, stoom, stof)
function wolkje(g, x, y, r, k, a){ doorzicht(g, a, () => { rondje(g, x, y, r, k); if (r > 1){ rondje(g, x - r, y + 1, r - 1, k); rondje(g, x + r, y + 1, r - 1, k); } }); }
// een tekstballon met een staartje bij staartX (naar wie er praat); de inhoud tekent de aanroeper
function ballon(g, cx, cy, rx, ry, staartX){ ovaal(g, cx, cy, rx + 1, ry + 1, 'k'); ovaal(g, cx, cy, rx, ry, 'w');
  const sx = R(staartX), y = cy + ry, d = sx < cx ? -1 : 1; vlak(g, sx - 2, y - 1, 6, 4, 'k'); vlak(g, sx + d * 2, y + 3, 2, 2, 'k');
  vlak(g, sx - 1, y - 1, 4, 3, 'w'); vlak(g, sx + d, y + 2, 2, 1, 'w'); vlak(g, sx + d * 2 + (d < 0 ? 1 : 0), y + 3, 1, 1, 'w'); }
// een boekje (8×6) en een frietzak (bovenkant van de zak op y), n frietjes
function boekje(g, x, y){ vlak(g, x, y, 9, 7, 'k'); vlak(g, x + 1, y + 1, 7, 5, 'v'); vlak(g, x + 2, y + 2, 5, 1, 'w'); vlak(g, x + 1, y + 5, 7, 1, 'V'); }
function friet(g, x, y, n = 5){ for (let i = 0; i < n; i++) vlak(g, x + 1 + i, y - 4 + (i % 2), 1, 5 - (i % 2), i % 2 ? 'Y' : 'y');
  vlak(g, x, y, 7, 2, 'r'); vlak(g, x + 1, y + 2, 5, 2, 'r'); vlak(g, x + 2, y + 4, 3, 2, 'R'); vlak(g, x + 2, y, 3, 1, 'w'); }
// een doos (16×12)
function doos(g, x, y){ vlak(g, x, y, 16, 12, 'Q'); vlak(g, x + 1, y + 1, 14, 10, 'H'); vlak(g, x + 7, y + 1, 2, 10, 'D'); vlak(g, x + 2, y + 2, 4, 3, 'w'); vlak(g, x + 1, y + 10, 14, 1, 'D'); }

// ---------- figuren ----------
// een speler op beeld f van zijn animatie (t = f / T_FPS, + een verschuiving zodat niet iedereen tegelijk beweegt)
const doe = (g, lk, anim, f, x, opt = {}, dt = 0) => zet(g, lk, anim, frameOp(anim, f / T_FPS + dt), x, opt);
// alleen het stuk boven y = tot (achter een tafel of bureau: de benen vallen weg)
function doeBoven(g, lk, anim, f, x, tot, opt = {}, dt = 0){ g.save(); g.beginPath(); g.rect(0, 0, TW, tot); g.clip(); doe(g, lk, anim, f, x, opt, dt); g.restore(); }
// liggend (in bed): het hoofd links; (x, y) is het midden van het lijf
function liggend(g, lk, x, y){ const cv = frame(lk, 'sta', 0); g.save(); g.translate(R(x), R(y)); g.rotate(-Math.PI / 2); g.drawImage(cv, -47, -42); g.restore(); }
// andere mensen (vrienden, ouders, een docent, een klant) in een eigen jas
const JASSEN = [['#7a4a5a', '#5a3442'], ['#4a5a3a', '#34402a'], ['#2f5f8a', '#214566'], ['#8a6a2a', '#66501f'], ['#5a3a7a', '#422a5a'], ['#a04a2a', '#7a3820'], ['#d63a2f', '#a32820']];
function ander(sleutel, {vrouw = false, jas = 0, haar, kapsel, huid, baard, kleding = 'casual'} = {}){
  const u = {...uiterlijkVoor(sleutel), vrouw}; if (haar !== undefined) u.haar = haar; if (kapsel) u.kapsel = kapsel; if (huid !== undefined) u.huid = huid; if (baard) u.baard = baard;
  const [c, C] = JASSEN[jas % JASSEN.length];
  return look(u, null, kleding, {kleuren:{c, C}});
}
const sleutelVan = info => `${info.club || ''}|${(info.uit && info.uit.huid) ?? 0}|${(info.uit && info.uit.kapsel) || ''}`;
// jij, in je eigen kleren (of met andere jaskleuren: een werkshirt)
const jij = (info, kleding = 'casual', kleuren) => look(info.uit, info.tenue, kleding, kleuren ? {kleuren} : {});

// ---------- stukjes achtergrond ----------
function sterren(c, x0, x1, y0, y1, n = 12){ for (let i = 0; i < n; i++) c.px(x0 + (i * 53 + 17) % (x1 - x0), y0 + (i * 29 + 5) % (y1 - y0), 'M'); }
// silhouetten van gebouwen met verlichte ramen, van x0 tot x1, op de grond y, hoogstens h hoog
function stad(c, x0, x1, y, h){
  let x = x0, i = 0;
  while (x < x1){ const b = Math.min(x1 - x, 14 + (i * 7) % 12), hh = Math.round(h * (.45 + ((i * 13) % 10) / 18)); c.rect(x, y - hh, b - 1, hh, i % 2 ? 'F' : 'K');
    for (let wy = y - hh + 3; wy < y - 3; wy += 5) for (let wx = x + 2; wx < x + b - 3; wx += 4) if (((wx * 7 + wy * 3 + i) % 5) < 2) c.rect(wx, wy, 2, 2, (wx + wy) % 3 ? 'L' : 'y');
    x += b; i++; }
}
function maan(c, x, y, bg = 'f'){ c.circ(x, y, 5, 'M'); c.circ(x + 3, y - 2, 4, bg); }
// een kamer: muur, plint, vloer met planken
function binnen(c, muur, plint, vloer, lijn){ c.rect(0, 0, TW, 92, muur); c.rect(0, 92, TW, 4, plint); c.rect(0, 96, TW, TH - 96, vloer); for (let x = 0; x < TW; x += 22) c.vline(x, 96, TH - 96, lijn); }
// een raam met de avondlucht
function avondraam(c, x, y, w, h, rand = 'm'){ c.rect(x, y, w, h, rand); c.rect(x + 2, y + 2, w - 4, h - 4, 'f'); sterren(c, x + 3, x + w - 3, y + 3, y + h - 3, 5); maan(c, x + w - 10, y + 9); c.vline(x + (w >> 1), y + 2, h - 4, rand); }

// =====================================================================================================
export const ANIMATIES = {
  // Rustig aan: eerst rillend in het ijsbad (adem-wolkjes, ijsblokjes), dan slapen in bed met Zzz
  rust: info => {
    const ik = jij(info, 'training'), slaap = jij(info);
    const bad = beeld(info.tenue, c => {
      c.rect(0, 0, TW, 96, 'P');
      for (let y = 0; y < 96; y += 10){ c.hline(0, y, TW, 'm'); for (let x = (y / 10) % 2 ? 6 : 0; x < TW; x += 12) c.vline(x, y, 10, 'm'); } // tegels
      c.rect(0, 96, TW, TH - 96, 'x'); c.hline(0, 96, TW, 'X'); for (let x = 0; x < TW; x += 16) c.vline(x, 97, TH - 97, 'X');
      c.rect(168, 12, 36, 28, 'm'); c.rect(170, 14, 32, 24, 'a'); c.vline(185, 14, 24, 'm'); c.hline(170, 25, 32, 'm');           // een matglazen raam
      c.rect(27, 26, 3, 3, 'X'); c.rect(20, 29, 17, 28, 'B'); c.rect(20, 32, 17, 1, 'w'); c.rect(20, 52, 17, 2, 'w');             // een handdoek aan een haakje
      c.rect(186, 84, 14, 12, 'v'); c.rect(188, 80, 10, 4, 'v'); c.rect(190, 86, 6, 6, 'w');                                       // een emmer met ijs
      c.rect(189, 78, 3, 3, 'a'); c.rect(193, 77, 3, 3, 'w');
    });
    const kuip = klein(72, 32, c => { c.rect(2, 4, 68, 26, 'x'); c.rect(0, 0, 72, 4, 'm'); c.hline(0, 0, 72, 'w'); c.rect(2, 9, 68, 2, 'X'); c.rect(2, 22, 68, 2, 'X');
      c.vline(8, 5, 24, 'm'); c.rect(6, 30, 8, 2, 'X'); c.rect(58, 30, 8, 2, 'X'); });
    const kamerNacht = beeld(info.tenue, c => {
      binnen(c, 'F', 'K', 'U', 'D');
      avondraam(c, 150, 14, 44, 34, 'D');
      c.rect(20, GY - 28, 24, 22, 'U'); c.hline(20, GY - 28, 24, 'D'); c.rect(22, GY - 6, 3, 6, 'U'); c.rect(39, GY - 6, 3, 6, 'U');  // het nachtkastje
      c.rect(31, GY - 36, 3, 8, 'D'); c.poly([25, GY - 36, 40, GY - 36, 37, GY - 45, 28, GY - 45], 'L');                          // een lampje (uit)
      c.rect(56, GY - 56, 7, 44, 'U'); c.rect(56, GY - 56, 7, 2, 'D');                                                            // het hoofdeinde
      c.rect(60, GY - 30, 112, 5, 'w'); c.hline(60, GY - 26, 112, 'W');                                                          // de matras
      c.rect(72, GY - 56, 30, 26, 'P'); c.hline(72, GY - 56, 30, 'w'); c.vline(72, GY - 55, 25, 'm');                              // het kussen
    });
    const bedrand = klein(118, 20, c => { c.rect(0, 0, 118, 12, 'U'); c.hline(0, 0, 118, 'D'); c.hline(0, 11, 118, 'Q'); c.rect(2, 12, 5, 8, 'U'); c.rect(110, 12, 5, 8, 'U'); });
    return {teken(g, f){
      if (f < 16){
        g.drawImage(bad, 0, 0);
        const tril = f % 2;
        zet(g, ik, 'sta', 0, 110 + tril, {y:GY + 4});
        // het water en de ijsblokjes, de koude damp die eraf komt
        vlak(g, 76, GY - 33, 68, 3, 'A'); vlak(g, 80 + (f % 3) * 2, GY - 33, 6, 1, 'a'); vlak(g, 124 - (f % 3) * 2, GY - 32, 8, 1, 'a');
        for (const [x, ph] of [[82, 0], [128, 3], [137, 6]]){ const y = GY - 35 + (Math.sin((f + ph) / 2) > 0 ? 1 : 0); vlak(g, x, y, 5, 4, 'w'); vlak(g, x + 1, y + 1, 3, 2, 'a'); }
        g.drawImage(kuip, 74, GY - 30);
        for (let i = 0; i < 5; i++){ const op = (f * 1.5 + i * 4) % 12; doorzicht(g, .45 - op * .03, () => vlak(g, 80 + i * 14, GY - 36 - op, 4, 1, 'w')); }
        // brrr: rillende streepjes naast je hoofd en een wolkje adem
        vlak(g, 88 - tril, GY - 54, 1, 4, 'A'); vlak(g, 85 - tril, GY - 50, 1, 3, 'A'); vlak(g, 132 + tril, GY - 54, 1, 4, 'A'); vlak(g, 135 + tril, GY - 50, 1, 3, 'A');
        for (let s = 0; s < 16; s += 5){ const a = f - s; if (a >= 0 && a <= 6) wolkje(g, 117 + a * 2, GY - 41 - a * 2, 1 + (a >> 1), 'w', .75 - a * .1); }
      } else {
        g.drawImage(kamerNacht, 0, 0);
        const n = f - 16, adem = Math.sin(n / 10 * Math.PI * 2) > 0 ? 1 : 0;
        liggend(g, slaap, 110, GY - 40);
        // het dekbed tot aan je kin (gaat zacht op en neer)
        vlak(g, 103, GY - 57 - adem, 54, 33 + adem, 'N'); vlak(g, 103, GY - 57 - adem, 5, 33 + adem, 'w'); vlak(g, 108, GY - 57 - adem, 1, 33 + adem, 'W');
        vlak(g, 120, GY - 48 - adem, 30, 1, 'O'); vlak(g, 128, GY - 38, 26, 1, 'O'); vlak(g, 155, GY - 56 - adem, 2, 32 + adem, 'O');
        g.drawImage(bedrand, 56, GY - 26);
        // Zzz, steeds groter, naar rechtsboven
        for (const [s, m] of [[0, 3], [4, 4], [8, 5]]){ const a = n - s; if (a < 0) continue; const b = a % 12;
          doorzicht(g, b < 9 ? 1 : 1 - (b - 8) * .3, () => zLetter(g, 86 + b * 2 + m, GY - 64 - b * 2 - m, m + (b >> 2), 'w')); }
        // het maanlicht door het raam
        kegel(g, 172, 46, 120, 200, GY - 20, 'a', .07);
      }
      // een korte overgang (even donker)
      if (f >= 14 && f <= 17) doorzicht(g, [.35, .75, .75, .35][f - 14], () => vlak(g, 0, 0, TW, TH, 'k'));
    }};
  },

  // Mentale training: je zit geknield op een matje en ademt rustig, een zachte gloed pulseert; in een denkwolk gaat een bal in het doel
  mentaal: info => {
    const ik = jij(info, 'training');
    const bg = beeld(info.tenue, c => {
      binnen(c, 'b', 'O', 'Q', 'q');
      c.rect(18, 98, 14, 14, 'h'); c.rect(16, 96, 18, 3, 'E');                                                       // een plant
      c.ellipse(20, 86, 3, 10, 'g'); c.ellipse(30, 84, 3, 11, 'G'); c.ellipse(25, 80, 3, 13, 'g'); c.vline(25, 70, 26, 'G');
      c.ellipse(110, GY - 1, 38, 4, 'V'); c.ellipse(110, GY - 1, 35, 3, 't');                                       // het matje
      c.rect(186, 100, 6, 12, 'w'); c.vline(191, 101, 11, 'W'); c.rect(182, 110, 14, 2, 'x');                       // een kaarsje
    });
    // het doeltje in de denkwolk (een paal, de lat en het net)
    const doel = klein(14, 20, c => { for (let y = 2; y < 19; y += 3) c.hline(2, y, 11, 'W'); for (let x = 4; x < 13; x += 3) c.vline(x, 1, 18, 'W'); c.vline(1, 0, 19, 'w'); c.hline(1, 0, 12, 'w'); c.vline(13, 0, 19, 'W'); });
    return {teken(g, f){
      g.drawImage(bg, 0, 0);
      const puls = (Math.sin(f / 16 * Math.PI * 2 - Math.PI / 2) + 1) / 2, adem = puls > .5 ? 1 : 0;
      // het vlammetje van de kaars
      doorzicht(g, .18, () => rondje(g, 189, 97, 6, 'y')); vlak(g, 188, 95 - (f % 3 === 0 ? 1 : 0), 2, 4, 'y'); vlak(g, 188, 97, 2, 2, 'e');
      // de gloed om je heen
      doorzicht(g, .1 + puls * .12, () => rondje(g, 110, GY - 32, 28 + R(puls * 4), 'M'));
      doorzicht(g, .35 + puls * .3, () => ring(g, 110, GY - 32, 34 + R(puls * 4), 'M'));
      doorzicht(g, .15 + puls * .15, () => ring(g, 110, GY - 32, 41 + R(puls * 5), 'l'));
      zet(g, ik, 'kniel', 0, 110, {y:GY - adem});
      // de denkwolk: eerst twee bolletjes, dan de wolk zelf, en daarin de bal die in het doel gaat
      if (f >= 2) { ovaal(g, 121, 53, 2, 2, 'k'); ovaal(g, 121, 53, 1, 1, 'w'); }
      if (f >= 4) { ovaal(g, 128, 47, 3, 3, 'k'); ovaal(g, 128, 47, 2, 2, 'w'); }
      if (f >= 6){
        const s = f === 6 ? .5 : f === 7 ? .8 : 1, cx = 170, cy = 26, rx = R(40 * s), ry = R(20 * s);
        ovaal(g, cx, cy, rx + 1, ry + 1, 'k'); ovaal(g, cx, cy, rx, ry, 'w'); ovaal(g, cx - 4, cy - 3, rx - 6, ry - 4, 'P');
        if (f >= 8){
          vlak(g, 144, 36, 54, 4, 'g'); vlak(g, 144, 36, 54, 1, 'G');
          const bol = f >= 20 && f < 24 ? 1 : 0; g.drawImage(doel, 184 + bol, 17);
          if (f < 10) bal(g, 150, 33, 2);
          else if (f < 20){ const t = (f - 10) / 10; bal(g, 150 + 42 * t, 33 - 12 * Math.sin(Math.PI * t) - 3 * t, 2); }
          else bal(g, 193 + bol, 32, 2);
          if (f >= 20){ const a = f - 20; for (const [x, y] of [[180, 14], [200, 12], [176, 30]]) if ((a + x) % 4 < 2){ vlak(g, x - 1, y, 3, 1, 'y'); vlak(g, x, y - 1, 1, 3, 'y'); } }
        }
      }
    }};
  },

  // Avondje uit: vanaf 18 de dansvloer met discolicht en de stad achter het raam; jonger: met je vrienden friet halen bij de snackbar
  uit: info => {
    const k = sleutelVan(info), v = !!info.vrouw, ik = jij(info);
    const maat1 = ander(`vriend|${k}|0`, {vrouw:v, jas:2}), maat2 = ander(`vriend|${k}|1`, {vrouw:v, jas:4});
    if ((info.leeftijd || 18) < 18){
      const straat = beeld(info.tenue, c => {
        c.rect(0, 0, TW, 96, 'f'); sterren(c, 0, TW, 2, 30, 14); maan(c, 74, 12);
        stad(c, 0, 124, 74, 40); c.rect(0, 74, 124, 22, 'Z'); for (let x = 4; x < 124; x += 16) c.rect(x, 84, 8, 1, 'X');   // de stad in de verte, de weg
        c.rect(124, 26, 96, 70, 'h'); c.rect(124, 26, 96, 2, 'E');                                                       // de snackbar
        c.rect(134, 44, 76, 38, 'U'); c.rect(136, 46, 72, 34, 'l');                                                      // het verlichte raam
        c.rect(136, 70, 72, 10, 'u'); c.hline(136, 70, 72, 'x'); c.rect(144, 58, 16, 12, 'x'); c.rect(146, 56, 3, 2, 'z');  // binnen: de toonbank en de frituur
        c.rect(170, 50, 32, 12, 'n'); c.rect(174, 53, 4, 6, 'y'); c.rect(173, 57, 6, 3, 'r'); c.rect(184, 54, 8, 2, 'D'); c.rect(184, 56, 8, 1, 'g'); c.rect(184, 57, 8, 2, 'D'); c.rect(196, 53, 4, 6, 'B');
        for (let x = 124; x < TW; x += 8){ c.rect(x, 30, 4, 8, 'r'); c.rect(x + 4, 30, 4, 8, 'w'); c.rect(x + 1, 38, 2, 1, 'r'); c.rect(x + 5, 38, 2, 1, 'w'); } // de luifel
        c.rect(158, 4, 28, 22, 'n'); c.rect(160, 6, 24, 18, 'K');                                                        // het bord (de friet erop gloeit)
        c.rect(0, 96, TW, TH - 96, 'x'); c.hline(0, 96, TW, 'm'); c.hline(0, 106, TW, 'X'); for (let x = 7; x < TW; x += 14) c.vline(x, 97, TH - 97, 'X'); // de stoep
        c.rect(19, 24, 2, 72, 'z'); c.rect(14, 20, 12, 4, 'z'); c.rect(15, 24, 10, 2, 'M');                             // een lantaarnpaal
      });
      return {teken(g, f){
        g.drawImage(straat, 0, 0);
        kegel(g, 20, 26, -8, 48, GY, 'l', .12);
        const aan = !(f === 9 || f === 10 || f === 23);
        if (aan) doorzicht(g, .2, () => rondje(g, 172, 15, 15, 'y'));
        doorzicht(g, aan ? 1 : .35, () => friet(g, 168, 15, 5));
        for (let i = 0; i < 2; i++){ const h = f * .5 + i * 3; vlak(g, 20 + R(Math.cos(h) * 7), 30 + R(Math.sin(h * 1.3) * 3), 1, 1, 'w'); } // mugjes om de lamp
        doe(g, maat1, f < 12 ? 'praat' : 'lach', f, 56);
        doe(g, ik, f < 12 ? 'lach' : 'praat', f, 100, {}, .15);
        doe(g, maat2, f < 20 ? 'lach' : 'klap', f, 156, {flip:true}, .3);
        // de statafel met twee zakken friet (de ene raakt leeg)
        vlak(g, 127, GY - 28, 2, 26, 'z'); vlak(g, 120, GY - 2, 16, 2, 'z'); ovaal(g, 128, GY - 30, 12, 2, 'z'); ovaal(g, 128, GY - 31, 11, 1, 'x');
        friet(g, 118, GY - 38, Math.max(1, 5 - (f >> 3))); friet(g, 131, GY - 38, 4);
      }};
    }
    const club = beeld(info.tenue, c => {
      c.rect(0, 0, TW, TH, 'K');
      c.rect(18, 10, 184, 52, 'F'); c.rect(20, 12, 180, 48, 'f'); sterren(c, 20, 200, 13, 30, 10); stad(c, 20, 200, 60, 34);   // het raam met de stad
      for (const x of [66, 110, 156]) c.vline(x, 12, 48, 'F');
      for (const x of [4, 202]){ c.rect(x, 50, 14, 30, 'z'); c.circ(x + 7, 58, 4, 'Z'); c.circ(x + 7, 71, 5, 'Z'); c.circ(x + 7, 71, 2, 'z'); } // de boxen
    });
    const KL = ['t', 'B', 'T', 'y'];
    return {teken(g, f){
      g.drawImage(club, 0, 0);
      // de dansvloer: vakjes die van kleur wisselen
      let y = 80, h = 5, j = 0;
      while (y < TH){ for (let i = 0; i < 11; i++){ if ((i + j) % 2) continue; doorzicht(g, .45, () => vlak(g, i * 20, y, 20, h, KL[(i + j + (f >> 1)) % 4])); } y += h; h += 1; j++; }
      // de discobal en zijn lichtjes
      vlak(g, 110, 0, 1, 3, 'x'); rondje(g, 110, 7, 4, 'x'); vlak(g, 108, 5, 2, 2, 'w');
      for (let i = 0; i < 4; i++){ const a = f * .6 + i * 1.57; if (Math.cos(a) > 0) vlak(g, 110 + R(Math.sin(a) * 3), 6 + (i % 3), 1, 1, 'w'); }
      for (let i = 0; i < 9; i++) vlak(g, (i * 37 + f * 5) % TW, 14 + (i * 23) % 62, 1, 1, i % 2 ? 'w' : 'B');
      // lichtbundels die heen en weer zwaaien
      for (let i = 0; i < 3; i++){ const bx = 110 + 85 * Math.sin(f * .28 + i * 2.1); kegel(g, 110, 10, bx - 14, bx + 14, TH, KL[i], .2); }
      doe(g, maat1, 'robot', f, 52);
      doe(g, ik, f < 20 ? 'heupwieg' : 'juich', f, 110);
      doe(g, maat2, 'heupwieg', f, 168, {flip:true}, .3);
      // muzieknootjes
      for (const [i, x0, kl] of [[0, 30, 'y'], [1, 184, 'B']]){ const a = (f + i * 16) % 32; doorzicht(g, 1 - a / 32, () => noot(g, x0 + R(Math.sin(a / 3) * 3), 76 - a * 1.5, kl)); }
    }};
  },

  // Huiswerk maken: aan je bureau met een lamp, een stapel boeken, schrijven in je schrift, een bladzijde die omslaat
  huiswerk: info => {
    const ik = jij(info), X = 110;
    const bg = beeld(info.tenue, c => {
      binnen(c, 'b', 'O', 'q', 'Q');
      avondraam(c, 18, 12, 42, 38, 'm');
      c.rect(150, 14, 26, 34, 'w'); c.rect(152, 16, 22, 30, 'g'); c.hline(152, 31, 22, 'w'); c.circ(163, 31, 4, 'w'); c.circ(163, 31, 3, 'g'); c.rect(157, 16, 12, 4, 'w'); // een voetbalposter
      c.rect(182, 52, 32, 2, 'U'); for (const [x, b, h, kl] of [[184, 4, 12, 'r'], [188, 3, 10, 'y'], [191, 5, 13, 'v'], [197, 4, 11, 'g'], [202, 3, 12, 'T']]) c.rect(x, 52 - h, b, h, kl); // een plank met boeken
      c.rect(X - 13, GY - 44, 3, 20, 'U'); c.rect(X + 10, GY - 44, 3, 20, 'U'); c.rect(X - 13, GY - 44, 26, 3, 'U');                        // de stoel achter je
      // het bureau: het blad (een beetje van boven) en de voorkant met laatjes
      c.rect(46, GY - 32, 132, 8, 'u'); c.hline(46, GY - 32, 132, 'D'); c.rect(46, GY - 24, 132, 18, 'U'); c.hline(46, GY - 24, 132, 'Q');
      c.rect(50, GY - 21, 40, 12, 'D'); c.rect(134, GY - 21, 40, 12, 'D'); c.rect(68, GY - 16, 4, 2, 'Q'); c.rect(152, GY - 16, 4, 2, 'Q');
      c.rect(48, GY - 6, 5, 6, 'U'); c.rect(171, GY - 6, 5, 6, 'U');
      // een stapel boeken links, de lamp rechts
      c.rect(47, GY - 36, 14, 4, 'v'); c.rect(48, GY - 40, 12, 4, 'r'); c.rect(47, GY - 43, 13, 3, 'g'); c.hline(47, GY - 34, 14, 'w'); c.hline(48, GY - 38, 12, 'w');
      c.rect(158, GY - 33, 12, 3, 'z'); c.line(163, GY - 33, 168, GY - 52, 'z', 2); c.line(168, GY - 52, 154, GY - 57, 'z', 2); c.poly([146, GY - 52, 156, GY - 60, 160, GY - 54, 150, GY - 48], 'r');
      // het schoolboek (open) en je schrift
      c.rect(62, GY - 31, 27, 5, 'w'); c.vline(75, GY - 31, 5, 'W'); c.rect(62, GY - 26, 27, 1, 'v'); for (let x = 64; x < 88; x += 2) if (x !== 75) c.px(x, GY - 29, 'm');
      c.rect(120, GY - 31, 22, 6, 'P'); c.hline(120, GY - 30, 22, 'm'); c.hline(120, GY - 28, 22, 'm'); c.vline(120, GY - 31, 6, 'r');
    });
    return {teken(g, f){
      g.drawImage(bg, 0, 0);
      // wat je al geschreven hebt
      const n = Math.min(40, R(f * 1.4)); for (let i = 0; i < n; i++){ const r = Math.floor(i / 20), kol = i % 20; if ((kol * 7) % 5) vlak(g, 121 + kol, GY - 30 + r * 2, 1, 1, 'k'); }
      doeBoven(g, ik, 'zitSchrijf', f, X, GY - 27);
      // een bladzijde die omslaat (twee keer)
      for (const s of [8, 22]){ const t = (f - s) / 6; if (t < 0 || t > 1) continue; const rand = 75 + 13 * Math.cos(Math.PI * t), op = 8 * Math.sin(Math.PI * t);
        for (let x = Math.min(75, R(rand)); x <= Math.max(75, R(rand)); x++){ const q = Math.abs(x - 75) / Math.max(1, Math.abs(rand - 75)); vlak(g, x, GY - 31 - op * q, 1, 4, q > .8 ? 'W' : 'w'); } }
      kegel(g, 151, GY - 50, 98, 156, GY - 25, 'l', .16);
      doorzicht(g, .5, () => vlak(g, 147, GY - 50, 10, 1, 'y'));
    }};
  },

  // Een vlog opnemen: je praat in je telefoon op een statief met een ringlamp, een rood opname-stipje knippert, er komen hartjes
  media: info => {
    const ik = jij(info), X = 84, TX = 158, TY = GY - 58;
    const bg = beeld(info.tenue, c => {
      binnen(c, 'V', 'K', 'q', 'Q');
      c.rect(0, 0, TW, 3, 't');                                                                                    // een ledstrip langs het plafond
      for (let x = 20; x < 70; x += 8){ c.rect(x, 16, 4, 8, '1'); c.rect(x + 4, 16, 4, 8, '3'); } c.rect(18, 16, 2, 8, 'k'); c.rect(68, 16, 2, 8, 'k'); // je clubsjaal aan de muur
      c.rect(16, 48, 48, 3, 'U'); c.rect(22, 38, 6, 6, 'y'); c.rect(24, 44, 2, 2, 'Y'); c.rect(22, 46, 6, 2, 'Y');   // een plankje met bekers en een bal
      c.rect(36, 36, 8, 8, 'y'); c.rect(39, 44, 2, 2, 'Y'); c.rect(36, 46, 8, 2, 'Y'); c.rect(18, 39, 3, 3, 'y'); c.rect(43, 39, 3, 3, 'y');
      c.circ(54, 43, 4, 'w'); c.rect(53, 42, 2, 2, 'k');
      c.rect(196, 98, 14, 14, 'h'); c.ellipse(200, 88, 3, 10, 'g'); c.ellipse(207, 86, 3, 11, 'G'); c.ellipse(203, 82, 3, 13, 'g');  // een plant
      // het statief
      c.rect(TX, TY + 8, 2, 50 - 18, 'z'); c.line(TX, GY - 18, TX - 12, GY, 'z'); c.line(TX + 1, GY - 18, TX + 13, GY, 'z'); c.vline(TX, GY - 18, 18, 'Z');
    });
    return {teken(g, f){
      g.drawImage(bg, 0, 0);
      doorzicht(g, .18, () => rondje(g, TX + 1, TY, 18, 'l'));
      kegel(g, TX, TY, 60, 112, GY, 'l', .07);
      doorzicht(g, .9, () => { ring(g, TX + 1, TY, 12, 'M'); ring(g, TX + 1, TY, 11, 'w'); });
      vlak(g, TX - 3, TY - 7, 8, 14, 'k'); vlak(g, TX - 2, TY - 6, 6, 12, 'z'); vlak(g, TX, TY - 4, 2, 2, 'x');        // de telefoon (van achteren)
      const anim = f < 8 ? 'wuif' : f < 24 ? 'praat' : 'wijs';
      doe(g, ik, anim, f, X);
      // hartjes die opstijgen
      for (let i = 0; i < 3; i++){ const a = f - 10 - i * 6; if (a < 0 || a > 14) continue; doorzicht(g, 1 - a / 15, () => hartje(g, TX - 2 + R(Math.sin(a / 2 + i) * 4), TY - 16 - a * 2, i % 2 ? 'T' : 'p')); }
      // de zoeker: hoekjes en het rode stipje
      doorzicht(g, .8, () => { for (const [x, y, sx, sy] of [[4, 4, 1, 1], [TW - 5, 4, -1, 1], [4, TH - 5, 1, -1], [TW - 5, TH - 5, -1, -1]]){ vlak(g, Math.min(x, x + sx * 8), y, 9, 1, 'w'); vlak(g, x, Math.min(y, y + sy * 8), 1, 9, 'w'); } });
      if ((f >> 2) % 2 === 0) rondje(g, 12, 12, 3, 'r');
    }};
  },

  // Met je ouders over je toekomst praten: aan de keukentafel, om de beurt praten (een ballon met een bal of een boek), de anderen knikken
  toekomst: info => {
    const k = sleutelVan(info), huid = info.uit ? info.uit.huid : undefined;
    const ik = jij(info), pa = ander(`ouder|pa|${k}`, {jas:1, kapsel:'kort', huid, baard:'stoppels'}), ma = ander(`ouder|ma|${k}`, {vrouw:true, jas:0, kapsel:'bob', huid});
    const bg = beeld(info.tenue, c => {
      binnen(c, '5', 'U', 'q', 'Q');
      c.rect(0, 8, 84, 26, 'u'); for (let x = 0; x < 84; x += 21){ c.vline(x, 8, 26, 'U'); c.rect(x + 16, 26, 2, 4, 'U'); } c.hline(0, 33, 84, 'U');   // de keukenkastjes
      c.rect(0, 46, 84, 14, '4'); for (let x = 0; x < 84; x += 6) c.vline(x, 46, 14, '5'); c.rect(0, 60, 84, 3, 'x'); c.rect(0, 63, 84, 29, 'u'); c.vline(42, 63, 29, 'U');
      avondraam(c, 92, 10, 40, 34, 'w'); c.rect(88, 8, 6, 40, 'r'); c.rect(130, 8, 6, 40, 'r');                     // het raam met gordijnen
      c.rect(186, 14, 30, 78, 'W'); c.hline(186, 40, 30, 'x'); c.rect(190, 30, 2, 8, 'x'); c.rect(190, 44, 2, 12, 'x');      // de koelkast
      c.rect(196, 20, 6, 5, 'y'); c.rect(204, 24, 5, 6, 'T');                                                       // magneetjes
      c.vline(110, 0, 14, 'z'); c.poly([100, 21, 120, 21, 115, 14, 105, 14], 'L');                                 // de lamp boven de tafel
      // de tafel met een geruit kleed
      c.rect(24, GY - 32, 172, 7, 'w'); for (let x = 24; x < 196; x += 8) c.rect(x, GY - 32, 4, 7, 'P');
      c.rect(24, GY - 25, 172, 12, 'r'); for (let x = 24; x < 196; x += 8) c.rect(x, GY - 25, 4, 12, 'w'); for (let y = GY - 23; y < GY - 13; y += 4) c.rect(24, y, 172, 2, 'R');
      c.rect(30, GY - 13, 4, 13, 'U'); c.rect(186, GY - 13, 4, 13, 'U');
    });
    return {teken(g, f){
      g.drawImage(bg, 0, 0);
      kegel(g, 110, 21, 50, 170, GY - 30, 'l', .12);
      const wie = f < 11 ? 0 : f < 22 ? 1 : 2, TOT = GY - 29;
      doeBoven(g, pa, wie === 0 ? 'zitPraat' : 'zit', f, 56, TOT);
      doeBoven(g, ik, wie === 2 ? 'zitPraat' : 'zit', f, 110, TOT, {}, .5);
      doeBoven(g, ma, wie === 1 ? 'zitPraat' : 'zit', f, 164, TOT, {flip:true}, .25);
      // op tafel: twee mokken en een folder van school
      vlak(g, 78, GY - 37, 6, 7, 'B'); vlak(g, 84, GY - 35, 2, 3, 'B'); vlak(g, 79, GY - 37, 4, 1, 'Q');
      vlak(g, 140, GY - 37, 6, 7, 'y'); vlak(g, 138, GY - 35, 2, 3, 'y'); vlak(g, 141, GY - 37, 4, 1, 'Q');
      vlak(g, 102, GY - 32, 14, 3, 'P'); vlak(g, 104, GY - 31, 6, 1, 'v');
      // de ballon van wie er praat: pa over voetbal, ma over school, jij over allebei
      const n = f - [0, 11, 22][wie]; if (n >= 1){
        const [cx, sx] = [[78, 66], [142, 154], [110, 116]][wie];
        ballon(g, cx, 34, 12, 7, sx);
        if (wie === 0) bal(g, cx, 34, 3); else if (wie === 1) boekje(g, cx - 4, 31); else { bal(g, cx - 5, 34, 3); boekje(g, cx, 31); }
      }
    }};
  },

  // Bijbaantje: in de snackbar achter de toonbank; je haalt de friet uit het vet, loopt naar voren en geeft een zak friet aan een klant
  bijbaan: info => {
    const ik = jij(info, 'casual', {c:'#d63a2f', C:'#a32820'}), klant = ander(`klant|snack|${sleutelVan(info)}`, {jas:2, vrouw:!!info.vrouw});
    const bg = beeld(info.tenue, c => {
      c.rect(0, 0, TW, 70, 'P'); for (let y = 0; y < 70; y += 8){ c.hline(0, y, TW, 'm'); for (let x = (y / 8) % 2 ? 5 : 0; x < TW; x += 10) c.vline(x, y, 8, 'm'); }
      c.rect(0, 64, TW, 6, 'x'); c.rect(0, 70, TW, 54, 'X');                                                       // de achterste werkbank
      c.rect(72, 6, 76, 24, 'U'); c.rect(74, 8, 72, 20, 'n');                                                      // het menubord: friet, burger, drinken
      c.rect(84, 14, 2, 8, 'y'); c.rect(87, 13, 2, 9, 'Y'); c.rect(90, 14, 2, 8, 'y'); c.poly([82, 20, 94, 20, 92, 26, 84, 26], 'r');
      c.rect(104, 14, 14, 3, 'D'); c.rect(103, 17, 16, 1, 'g'); c.rect(104, 18, 14, 2, 'Q'); c.rect(104, 20, 14, 2, 'D'); c.px(108, 15, 'M'); c.px(113, 15, 'M');
      c.rect(130, 14, 7, 11, 'B'); c.rect(129, 13, 9, 2, 'w'); c.line(135, 13, 138, 8, 'r');
      c.rect(14, 50, 34, 16, 'm'); c.rect(14, 50, 34, 2, 'w'); c.rect(16, 52, 30, 3, 'Y'); c.rect(18, 58, 26, 2, 'x');                   // de frituur
      c.rect(172, 44, 30, 22, 'W'); c.rect(174, 46, 26, 10, 'k'); c.rect(176, 48, 6, 6, 'y'); c.rect(184, 48, 6, 6, 'D'); c.rect(192, 48, 6, 6, 'r'); // de vitrine met snacks
    });
    const toonbank = klein(TW, 44, c => { c.rect(0, 0, 166, 4, 'm'); c.hline(0, 0, 166, 'w'); c.rect(0, 4, 166, 40, 'r'); c.rect(0, 14, 166, 3, 'w'); c.rect(0, 40, 166, 4, 'R'); });
    return {teken(g, f){
      g.drawImage(bg, 0, 0);
      for (const x of [56, 160]){ vlak(g, x, 0, 1, 4, 'z'); vlak(g, x - 6, 4, 13, 4, 'L'); kegel(g, x, 8, x - 22, x + 22, 80, 'l', .1); }
      // het borrelende vet en de damp
      for (let i = 0; i < 4; i++) if ((f + i) % 3) vlak(g, 18 + i * 7 + (f % 2), 52 + ((f + i) % 2), 2, 1, 'y');
      for (let i = 0; i < 3; i++){ const a = (f * 1.2 + i * 5) % 14; wolkje(g, 22 + i * 9, 48 - a * 2, 1 + (a > 6 ? 1 : 0), 'w', .4 - a * .025); }
      // het mandje: in het vet, eruit (f 4-11) met friet erin
      const uitVet = f >= 4 && f < 12, my = uitVet ? 40 : 50;
      vlak(g, 22, my, 18, 8, 'z'); vlak(g, 23, my + 1, 16, 6, 'X'); if (uitVet) for (let i = 0; i < 7; i++) vlak(g, 24 + i * 2, my - 2 + (i % 2), 1, 4, 'y'); vlak(g, 40, my + 2, 10, 2, 'z');
      let x = 62, anim = 'kalm';
      if (f >= 12 && f < 20){ x = 62 + (128 - 62) * (f - 12) / 8; anim = 'loop'; } else if (f >= 20) { x = 128; anim = f < 28 ? 'praat' : 'wuif'; }
      doe(g, ik, anim, f, x);
      g.drawImage(toonbank, 0, 80);
      // de zak friet op de toonbank, de klant pakt hem aan
      if (f >= 20){ const fx = f < 26 ? 146 : Math.min(176, 146 + (f - 26) * 8); if (fx < 176) friet(g, fx, 74, 5); }
      zet(g, klant, 'loop_achter', 0, 188);
    }};
  },

  // Avondschool sportkunde: een klaslokaal in de avond, de docent wijst naar het bord (een hartslaglijn en staafjes), jij maakt aantekeningen
  sportkunde: info => {
    const k = sleutelVan(info), ik = jij(info), X = 180;
    const docent = ander(`docent|sportkunde|${k}`, {jas:3, haar:5, kapsel:'kort'});
    const bg = beeld(info.tenue, c => {
      binnen(c, '5', 'U', 'q', 'Q');
      c.rect(8, 10, 108, 64, 'U'); c.rect(10, 12, 104, 60, 'j'); c.rect(8, 72, 108, 3, 'D'); c.rect(20, 71, 6, 1, 'w'); c.rect(30, 71, 4, 1, 'y'); // het bord
      c.circ(24, 22, 3, 'W'); c.circ(24, 22, 2, 'j'); c.line(24, 25, 24, 36, 'W'); c.line(24, 28, 18, 33, 'W'); c.line(24, 28, 30, 33, 'W'); c.line(24, 36, 19, 44, 'W'); c.line(24, 36, 29, 44, 'W'); // een poppetje
      c.hline(40, 66, 70, 'W'); c.vline(40, 46, 20, 'W');                                                         // de assen van de staafjes
      c.rect(132, 12, 14, 14, 'k'); c.circ(139, 19, 6, 'w'); c.circ(139, 19, 6, 'w');                             // de klok
      c.rect(152, 10, 54, 36, 'm'); c.rect(154, 12, 50, 32, 'f'); sterren(c, 155, 203, 13, 42, 6); maan(c, 194, 20); c.vline(179, 12, 32, 'm'); // het raam: al donker
      // jouw tafeltje
      c.rect(148, GY - 32, 70, 8, 'u'); c.hline(148, GY - 32, 70, 'D'); c.rect(148, GY - 24, 70, 4, 'U'); c.rect(152, GY - 20, 4, 20, 'U'); c.rect(210, GY - 20, 4, 20, 'U');
      c.rect(188, GY - 31, 22, 6, 'P'); c.hline(188, GY - 30, 22, 'm'); c.hline(188, GY - 28, 22, 'm'); c.vline(188, GY - 31, 6, 'v');
      c.rect(151, GY - 41, 5, 11, 'B'); c.rect(152, GY - 43, 3, 2, 'w'); c.vline(152, GY - 39, 7, 'a');                       // een bidon
    });
    return {teken(g, f){
      g.drawImage(bg, 0, 0);
      // de klok: de grote wijzer loopt
      const a = f / 32 * Math.PI * 2; vlak(g, 139, 16, 1, 4, 'k'); vlak(g, 139 + R(Math.sin(a) * 4), 19 - R(Math.cos(a) * 4), 1, 1, 'k'); vlak(g, 139 + R(Math.sin(a) * 2), 19 - R(Math.cos(a) * 2), 1, 1, 'k');
      // de hartslaglijn die de docent tekent, en de staafjes
      const ver = Math.max(0, Math.min(1, (f - 4) / 20)), HS = [0, 0, 0, -2, 0, 0, 6, -14, 8, 0, 0, -3, 0, 0, 0];
      for (let x = 40; x < 40 + R(66 * ver); x++){ const i = Math.floor((x - 40) / 2) % HS.length, i2 = (i + 1) % HS.length, y1 = 28 + HS[i], y2 = 28 + HS[i2];
        vlak(g, x, Math.min(y1, y2), 1, Math.abs(y2 - y1) + 1, 'w'); }
      for (let i = 0; i < 4; i++) if (f >= 10 + i * 4){ const h = [8, 13, 10, 17][i]; vlak(g, 48 + i * 14, 66 - h, 8, h, i === 3 ? 'y' : 'W'); }
      doe(g, docent, f < 12 ? 'praat' : f < 26 ? 'wijs' : 'praat', f, 126, {flip:true});
      doeBoven(g, ik, 'zitSchrijf', f, X, GY - 27);
      const n = Math.min(36, R(f * 1.2)); for (let i = 0; i < n; i++){ const r = Math.floor(i / 18), kol = i % 18; if ((kol * 7) % 5) vlak(g, 190 + kol, GY - 30 + r * 2, 1, 1, 'k'); }
      // klasgenoten vooraan (van achteren: hun hoofden)
      for (const [x, haar, jas] of [[34, 'n', 'c'], [76, 'h', 'V']]){ vlak(g, x - 13, TH - 6, 26, 6, jas); rondje(g, x, TH - 10, 8, 'k'); rondje(g, x, TH - 10, 7, haar); }
    }};
  },

  // Bijbaan in het magazijn: tussen de stellingen loop je met een doos naar een pallet, zet hem bovenop de stapel, klopt je handen af en spant je spieren
  magazijn: info => {
    const ik = jij(info, 'casual', {c:'#e8a21a', C:'#b87a10'}), STX = 153;
    const bg = beeld(info.tenue, c => {
      c.rect(0, 0, TW, 96, 'X');
      for (const y of [30, 58, 86]){ c.rect(0, y, TW, 3, 'V'); c.hline(0, y + 3, TW, 'O'); }                       // de liggers van de stellingen
      let i = 0; for (const y of [30, 58, 86]) for (let x = 2; x < TW - 10; ){ const b = 12 + (i * 5) % 10, h = 10 + (i * 3) % 12; if ((i * 7) % 6 !== 0){ c.rect(x, y - h, b, h, 'Q'); c.rect(x + 1, y - h + 1, b - 2, h - 2, (i % 3) ? 'H' : 'D'); c.vline(x + (b >> 1), y - h + 1, h - 2, 'D'); } x += b + 2; i++; } // dozen op de planken
      for (let x = 6; x < TW; x += 52){ c.rect(x, 0, 3, 96, 'e'); c.vline(x + 1, 0, 96, 'E'); for (let y = 4; y < 96; y += 6) c.px(x + 1, y, 'K'); } // de staanders
      c.rect(0, 96, TW, TH - 96, 'x'); c.hline(0, 96, TW, 'm'); for (let x = 0; x < TW; x += 12) c.rect(x, 104, 7, 2, 'y');  // de betonvloer met een gele lijn
      c.rect(146, GY - 4, 30, 4, 'u'); c.rect(148, GY - 1, 4, 1, 'U'); c.rect(159, GY - 1, 4, 1, 'U'); c.rect(170, GY - 1, 4, 1, 'U'); // de pallet
    });
    return {teken(g, f){
      g.drawImage(bg, 0, 0);
      for (const x of [50, 170]){ vlak(g, x, 0, 1, 4, 'z'); vlak(g, x - 6, 4, 13, 3, 'z'); kegel(g, x, 7, x - 26, x + 26, GY, 'l', .08); }
      for (let i = 0; i < 6; i++){ const a = (f + i * 5) % 30; vlak(g, (i * 41 + a) % TW, 20 + ((i * 17 + a * 2) % 70), 1, 1, 'M'); }   // stofjes in het licht
      doos(g, STX, GY - 16); doos(g, STX, GY - 28); doos(g, STX + 1, GY - 40);
      if (f < 14){
        const x = 24 + (136 - 24) * f / 13;
        doe(g, ik, 'loop', f, x); doos(g, x + 2, GY - 41 + (f % 2));
      } else if (f < 18){
        const t = (f - 14) / 3; doe(g, ik, 'kalm', f, 136); doos(g, 138 + (STX - 138) * t, GY - 41 - 11 * t);
      } else {
        doos(g, STX, GY - 52);
        doe(g, ik, f < 25 ? 'klap' : 'kracht', f, 136);
        if (f < 22){ const a = f - 18; wolkje(g, STX - 2 - a, GY - 41, 1 + (a >> 1), 'W', .6 - a * .12); wolkje(g, STX + 18 + a, GY - 41, 1 + (a >> 1), 'W', .6 - a * .12); }
      }
    }};
  },
};
