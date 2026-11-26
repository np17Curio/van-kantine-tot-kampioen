/* ===================== Trainingsanimaties bij de club ===================== */
// Zie basis.js voor de afspraken (TW × TH pixels, T_FPS, T_FRAMES, de hulpjes). Hier: tactiek, extra trainen, indruk maken op de
// trainer, videoanalyse, de talentcoach, de derde helft, jonge spelers helpen en de fysio. Geen woorden in het beeld.
import { uiterlijkVoor } from '../uiterlijk.js';
import { GY, KLEUR, TH, TW, T_FPS, bal, frame, frameOp, inkleuren, kamer, look, palet, pion, sprite, trainingsveld, zet } from './basis.js';

// ---------- hulpjes ----------
const R = Math.round;
const kleur = k => KLEUR[k] || k;
const blok = (g, x, y, w, h, k) => { g.fillStyle = kleur(k); g.fillRect(R(x), R(y), w, h); };
const tussen = (a, b, u) => a + (b - a) * Math.max(0, Math.min(1, u));
// een ander (de trainer, een ploeggenoot, de fysio): een vaste look per rol en club
const ander = (info, rol, kleding = 'training', tenue = info.tenue) => look(uiterlijkVoor(`${rol}|${info.club || 'club'}`), tenue, kleding);
// een lijn die getekend wordt: u = hoe ver hij al is (0 … 1)
function streep(g, x0, y0, x1, y1, u, k){
  const n = Math.max(1, R(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))), m = Math.floor(n * Math.max(0, Math.min(1, u)));
  g.fillStyle = kleur(k); for (let i = 0; i <= m; i++) g.fillRect(R(x0 + (x1 - x0) * i / n), R(y0 + (y1 - y0) * i / n), 1, 1);
}
// een pijl (de punt komt erbij als de lijn af is)
function pijl(g, x0, y0, x1, y1, u, k){
  streep(g, x0, y0, x1, y1, u, k); if (u < 1) return;
  const a = Math.atan2(y1 - y0, x1 - x0);
  for (const z of [.6, -.6]) streep(g, x1, y1, x1 - Math.cos(a + z) * 4, y1 - Math.sin(a + z) * 4, 1, k);
}
function ring(g, cx, cy, r, k){ g.fillStyle = kleur(k); const n = Math.ceil(r * 8); for (let i = 0; i < n; i++){ const a = i / n * Math.PI * 2; g.fillRect(R(cx + Math.cos(a) * r), R(cy + Math.sin(a) * r), 1, 1); } }
// een stip met een donker randje (een speler op het bord of het scherm)
const stip = (g, x, y, k) => { blok(g, x - 2, y - 2, 5, 5, 'k'); blok(g, x - 1, y - 1, 3, 3, k); };
// een doel van voren (x, y = linksboven; de palen staan op y + h): het net en de palen met een donker randje
function doel(g, x, y, w, h){
  for (let xx = x + 3; xx < x + w - 2; xx += 3) blok(g, xx, y + 2, 1, h - 2, 'W');
  for (let yy = y + 4; yy < y + h; yy += 3) blok(g, x + 2, yy, w - 4, 1, 'W');
  blok(g, x - 1, y - 1, w + 2, 4, 'k'); blok(g, x - 1, y, 4, h, 'k'); blok(g, x + w - 3, y, 4, h, 'k');
  blok(g, x, y, w, 2, 'w'); blok(g, x, y, 2, h, 'w'); blok(g, x + w - 2, y, 2, h, 'w');
}
// een stoel van opzij (de leuning links: wie erop zit kijkt naar rechts, 'zit' met de heup op x)
function stoel(g, x){ blok(g, x - 10, GY - 28, 3, 28, 'X'); blok(g, x - 10, GY - 12, 17, 3, 'x'); blok(g, x + 4, GY - 9, 2, 9, 'X'); blok(g, x - 8, GY - 9, 2, 9, 'X'); }
// liggend op de rug, het hoofd links: het beeld van de speler een kwartslag gedraaid, het midden van het lijf op (cx, cy).
// d: hoeveel de heup in dit beeld naar voren staat (anders schuift het lijf op en neer)
function liggend(g, lk, anim, i, cx, cy, d = 0){ g.save(); g.translate(R(cx), R(cy + d)); g.rotate(-Math.PI / 2); g.drawImage(frame(lk, anim, i), -47, -47); g.restore(); }
// een klembord (in de hand van de trainer)
function klembord(g, x, y){ blok(g, x - 1, y - 1, 12, 14, 'k'); blok(g, x, y, 10, 12, 'Q'); blok(g, x + 1, y + 2, 8, 9, 'w'); blok(g, x + 3, y - 1, 4, 2, 'x');
  for (let i = 0; i < 3; i++) blok(g, x + 2, y + 4 + i * 2, 5 - (i % 2) * 2, 1, 'X'); }
// blije sterretjes
const ster = (g, x, y) => { blok(g, x, y - 1, 1, 3, 'y'); blok(g, x - 1, y, 3, 1, 'y'); };

export const ANIMATIES = {
  // Tactiektraining: de trainer tekent pijlen op het bord (een pass, een loopactie, het schot) en wijst; jij en een ploeggenoot knikken
  tactiek: info => {
    const bg = kamer(info.tenue, {muur:'b', vloer:'q', plint:'Q'}), BX = 74, BY = 24;
    const c = bg.getContext('2d'); blok(c, BX + 10, BY + 52, 2, GY - BY - 52, 'X'); blok(c, BX + 72, BY + 52, 2, GY - BY - 52, 'X'); // de poten van het bord
    const bord = inkleuren(sprite(84, 54, c => {
      c.rect(0, 0, 84, 50, 'X'); c.rect(2, 2, 80, 46, 'w'); c.rect(4, 50, 76, 2, 'X'); c.rect(10, 49, 6, 1, 'r'); c.rect(18, 49, 6, 1, 'V'); // de lijst, het bord, het gootje met stiften
      c.hline(6, 5, 72, 'm'); c.hline(6, 44, 72, 'm'); c.vline(6, 5, 40, 'm'); c.vline(77, 5, 40, 'm'); c.vline(42, 5, 40, 'm'); // het veld in lijntjes
      c.circ(42, 25, 6, 'm'); c.circ(42, 25, 5, 'w'); c.vline(42, 19, 13, 'm');
      c.hline(6, 16, 9, 'm'); c.hline(6, 34, 9, 'm'); c.vline(14, 16, 19, 'm'); c.hline(69, 16, 9, 'm'); c.hline(69, 34, 9, 'm'); c.vline(69, 16, 19, 'm');
      for (const [x, y] of [[59, 17], [61, 31], [68, 23]]) for (const [a, b] of [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]]) c.px(x + a, y + b, 'r'); // de tegenstanders: kruisjes
    }), palet(info.tenue)), club = palet(info.tenue)[1];
    const ONS = [[11, 25], [23, 15], [23, 35], [34, 25], [50, 13], [51, 38]];
    const ik = look(info.uit, info.tenue, 'training'), coach = ander(info, 'trainer'), maat = ander(info, 'maat|1');
    return {teken(g, f){
      const t = f / T_FPS; g.drawImage(bg, 0, 0); g.drawImage(bord, BX, BY);
      for (const [x, y] of ONS) stip(g, BX + x, BY + y, club);
      pijl(g, BX + 36, BY + 24, BX + 49, BY + 15, (f - 6) / 6, 'V');                       // de pass
      pijl(g, BX + 53, BY + 37, BX + 65, BY + 31, (f - 12) / 6, 'V');                      // de loopactie
      pijl(g, BX + 66, BY + 30, BX + 76, BY + 25, (f - 18) / 4, 'r');                      // en het schot
      if (f >= 22 && f % 4 < 3) ring(g, BX + 65, BY + 31, 4, 'r');
      // de trainer: eerst praten, dan met de arm omhoog tekenen op het bord, dan wijst hij naar jullie
      zet(g, coach, f < 6 ? 'praat' : f < 22 ? 'kaart' : 'wijs', f < 6 ? frameOp('praat', t) : 0, 166, {flip:true});
      zet(g, maat, f < 14 ? 'sta' : 'kalm', frameOp(f < 14 ? 'sta' : 'kalm', t + .4), 20);
      zet(g, ik, f < 10 ? 'sta' : 'kalm', frameOp(f < 10 ? 'sta' : 'kalm', t), 46);   // (kalm: de armen over elkaar, knikken)
    }};
  },

  // Extra trainen na de training: 's avonds onder de lampen, alleen op het veld, de ene bal na de andere in het doel
  extra: info => {
    const bg = trainingsveld(info.tenue, info.club), c = bg.getContext('2d');
    c.fillStyle = 'rgba(10,14,40,.55)'; c.fillRect(0, 0, TW, TH);                       // het is avond
    c.fillStyle = '#121833'; c.fillRect(0, 0, TW, 34);
    for (let i = 0; i < 14; i++) blok(c, (i * 53 + 7) % TW, (i * 17 + 3) % 30, 1, 1, i % 3 ? '#8f9bb0' : '#ffffff'); // sterren
    for (const mx of [14, 150]){                                                           // de lichtmasten met hun licht
      blok(c, mx, 6, 2, 46, 'X'); blok(c, mx - 6, 1, 14, 7, 'k'); for (let i = 0; i < 3; i++) blok(c, mx - 5 + i * 4, 2, 3, 5, 'M');
      c.fillStyle = 'rgba(255,233,168,.07)'; for (let y = 8; y < TH; y++){ const h = R((y - 8) * .5); c.fillRect(mx + 1 - h, y, h * 2, 1); }
    }
    c.fillStyle = 'rgba(255,240,190,.1)'; for (let dy = -6; dy <= 6; dy++){ const w = R(Math.sqrt(1 - (dy / 7) ** 2) * 80); c.fillRect(110 - w, GY + dy, w * 2, 1); }
    doel(c, 168, 80, 40, 32);
    const ik = look(info.uit, info.tenue, 'training'), X = 96, voet = X + 18;
    const STAPEL = [[34, GY - 3], [41, GY - 3], [48, GY - 3], [37, GY - 8], [44, GY - 8]], DOEL = [[183, 92], [197, 100]], RUST = [[182, GY - 3], [196, GY - 3]];
    return {teken(g, f){
      g.drawImage(bg, 0, 0);
      const n = f % 16, k = f >> 4, rollen = (f >= 10) + (f >= 26);
      for (let i = 0; i < 5 - rollen; i++) bal(g, ...STAPEL[i]);                          // de stapel ballen
      for (let j = 0; j < 2; j++) if (f >= j * 16 + 10) bal(g, ...RUST[j]);               // de ballen die al in het doel liggen
      zet(g, ik, n < 8 ? 'schiet' : 'sta', n < 8 ? n : frameOp('sta', (n - 8) / T_FPS), X);
      if (n < 4) bal(g, voet, GY - 3);                                                      // de bal van dit schot
      else if (n < 8){ const u = (n - 4) / 4; bal(g, tussen(voet, DOEL[k][0], u), tussen(GY - 3, DOEL[k][1], u) - Math.sin(Math.PI * u) * 10); }
      else if (n < 10) bal(g, DOEL[k][0], tussen(DOEL[k][1], RUST[k][1], (n - 7) / 2));
      if (n >= 10){ const u = (n - 10) / 5, [sx, sy] = STAPEL[5 - rollen]; bal(g, tussen(sx, voet, u), tussen(sy, GY - 3, u * 3)); } // de volgende bal naar je voet
    }};
  },

  // Indruk maken op de trainer: jij dribbelt op topsnelheid langs de pionnen en schiet raak; de trainer kijkt met zijn klembord en klapt
  trainer: info => {
    const bg = trainingsveld(info.tenue, info.club), c = bg.getContext('2d');
    doel(c, 140, 88, 30, 24); for (const x of [26, 50, 74]) pion(c, x);
    const ik = look(info.uit, info.tenue, 'training'), coach = ander(info, 'trainer'), X = 98, CX = 196, voet = X + 18;
    return {teken(g, f){
      const t = f / T_FPS; g.drawImage(bg, 0, 0);
      // de trainer: kijkt (het klembord voor zich), en klapt als het raak is (het klembord onder zijn arm)
      if (f >= 20) klembord(g, CX - 4, 80);
      zet(g, coach, f < 20 ? 'kalm' : 'klap', frameOp(f < 20 ? 'kalm' : 'klap', t), CX, {flip:true});
      if (f < 20) klembord(g, CX - 20, 73);
      if (f < 14){ const x = tussen(-12, X, f / 13);
        for (let i = 0; i < 3; i++) blok(g, x - 24 - i * 3, GY - 46 + i * 10, 7 - i, 1, 'w');  // snelheidsstreepjes
        zet(g, ik, 'dribbel', frameOp('dribbel', t), x); bal(g, x + 16, GY - 3 - (f % 4 === 0 ? 2 : 0)); }
      else if (f < 22){ zet(g, ik, 'schiet', f - 14, X); }
      else { zet(g, ik, 'juich', frameOp('juich', (f - 22) / T_FPS), X); ster(g, X - 14 + (f % 3), GY - 70); ster(g, X + 16, GY - 66 + (f % 2)); }
      if (f >= 14 && f < 18) bal(g, voet, GY - 3);
      else if (f >= 18 && f < 22){ const u = (f - 18) / 3; bal(g, tussen(voet, 156, u), tussen(GY - 3, 98, u) - Math.sin(Math.PI * u) * 8); }
      else if (f >= 22) bal(g, 156, tussen(98, GY - 3, (f - 21) / 2));
    }};
  },

  // Videoanalyse: een donkere ruimte, een groot scherm met de beelden van de wedstrijd (stipjes op een veldje). Het beeld staat stil,
  // de trainer wijst met een laserpen de speler aan en tekent het schot; jij zit ernaast en knikt
  video: info => {
    const bg = kamer(info.tenue, {muur:'C', vloer:'c', plint:'K'}), c = bg.getContext('2d');
    blok(c, 98, 8, 116, 68, 'k'); blok(c, 100, 10, 112, 64, 'Z'); blok(c, 102, 12, 108, 60, 'g');      // het scherm
    for (let i = 0; i < 6; i++) blok(c, 102 + i * 18, 12, 9, 60, 'G');                                  // gemaaide banen
    blok(c, 104, 14, 104, 1, 'w'); blok(c, 104, 69, 104, 1, 'w'); blok(c, 104, 14, 1, 56, 'w'); blok(c, 207, 14, 1, 56, 'w'); blok(c, 156, 14, 1, 56, 'w');
    ring(c, 156, 42, 7, 'w'); blok(c, 104, 30, 12, 1, 'w'); blok(c, 104, 54, 12, 1, 'w'); blok(c, 116, 30, 1, 25, 'w');
    blok(c, 196, 30, 11, 1, 'w'); blok(c, 196, 54, 11, 1, 'w'); blok(c, 196, 30, 1, 25, 'w');
    c.fillStyle = 'rgba(120,220,150,.07)'; for (let y = 76; y < TH; y++){ const h = R(60 + (y - 76) * 1.2); c.fillRect(156 - h, y, h * 2, 1); } // het licht van het scherm
    const club = palet(info.tenue)[1];
    const ONS = [[[122, 34], [142, 28]], [[128, 56], [150, 58]], [[146, 22], [176, 24]], [[150, 46], [184, 40]]];
    const ZIJ = [[[168, 30], [176, 34]], [[178, 52], [186, 48]], [[204, 42], [203, 40]]];
    const ik = look(info.uit, info.tenue, 'training'), coach = ander(info, 'trainer');
    return {teken(g, f){
      const t = f / T_FPS, u = Math.min(1, f / 16), op = ([a, b]) => [tussen(a[0], b[0], u), tussen(a[1], b[1], u)];
      g.drawImage(bg, 0, 0);
      for (const p of ZIJ) stip(g, ...op(p), 'y'); for (const p of ONS) stip(g, ...op(p), club);
      const A = u < .5 ? op(ONS[0]) : [tussen(ONS[0][0][0], ONS[0][1][0], .5), tussen(ONS[0][0][1], ONS[0][1][1], .5)];
      const bx = u < .5 ? A[0] + 3 : tussen(A[0] + 3, ONS[3][1][0] + 3, (u - .5) * 2), by = u < .5 ? A[1] + 1 : tussen(A[1] + 1, ONS[3][1][1] + 1, (u - .5) * 2);
      blok(g, bx - 1, by - 1, 2, 2, 'w');                                                     // de bal
      if (f >= 16){ blok(g, 106, 17, 2, 6, 'w'); blok(g, 110, 17, 2, 6, 'w'); }               // het beeld staat stil
      if (f >= 18 && f % 4 < 3) ring(g, 184, 40, 5, 'r');
      if (f >= 20) pijl(g, 189, 39, 205, 36, (f - 20) / 5, 'r');
      if (f >= 16) blok(g, 183 + (f % 2), 44, 2, 2, '#ff4040');                               // de laserpen
      stoel(g, 32); stoel(g, 72);
      zet(g, ik, 'zit', frameOp('zit', t), 32);
      zet(g, coach, 'zitPraat', f < 16 ? frameOp('zitPraat', t) : 1, 72);
      if (f >= 16) blok(g, 94, 82, 4, 1, 'z');                                                // de pen in zijn hand
    }};
  },

  // Extra training bij de talentcoach: hij speelt je aan, jij neemt aan en schiet raak, hij klapt
  talentcoach: info => {
    const bg = trainingsveld(info.tenue, info.club), c = bg.getContext('2d'); doel(c, 172, 80, 36, 32);
    const ik = look(info.uit, info.tenue, 'training'), coach = ander(info, 'talentcoach', 'training', {shirt:'#3c4a6e', accent:'#ffd21a', broek:'#1d1f2c', sok:'#3c4a6e'});
    const KX = 30, X = 112, voet = X + 18;
    return {teken(g, f){
      const t = f / T_FPS; g.drawImage(bg, 0, 0);
      zet(g, coach, f < 8 ? 'schiet' : f < 22 ? 'praat' : 'klap', f < 8 ? f : frameOp(f < 22 ? 'praat' : 'klap', t), KX);
      let bx, by = GY - 3, achter = false;
      if (f < 4) bx = KX + 18;
      else if (f < 12){ bx = tussen(KX + 18, voet, (f - 4) / 8); achter = bx > X - 14 && bx < X + 12; } // (de pass rolt achter je benen langs)
      else if (f < 18) bx = voet;
      else if (f < 22){ const u = (f - 18) / 4; bx = tussen(voet, 192, u); by = tussen(GY - 3, 94, u) - Math.sin(Math.PI * u) * 8; }
      else { bx = 192; by = tussen(94, GY - 3, (f - 21) / 3); }
      if (achter) bal(g, bx, by);
      zet(g, ik, f < 14 ? 'sta' : f < 22 ? 'schiet' : 'juich', f < 14 ? frameOp('sta', t) : f < 22 ? f - 14 : frameOp('juich', (f - 22) / T_FPS), X);
      if (!achter) bal(g, bx, by);
    }};
  },

  // Derde helft met de selectie: in de kantine na de training, drankjes op tafel, iedereen lacht, en dan proosten jullie
  derdehelft: info => {
    const pal = palet(info.tenue);
    const bg = inkleuren(sprite(TW, TH, c => {
      c.rect(0, 0, TW, 92, 'q'); for (let y = 6; y < 92; y += 8) c.hline(0, y, TW, 'i');                 // de houten wand
      c.rect(0, 92, TW, 4, 'Q'); c.rect(0, 96, TW, TH - 96, 'd'); for (let x = 0; x < TW; x += 22) c.vline(x, 96, TH - 96, 'Q');
      c.rect(12, 18, 54, 36, 'Q'); c.rect(14, 20, 50, 32, 'x'); c.rect(14, 40, 50, 12, 'g'); c.hline(14, 40, 50, 'w'); // het raam met het veld
      c.hline(46, 34, 12, 'w'); c.vline(46, 34, 6, 'w'); c.vline(57, 34, 6, 'w'); c.vline(39, 20, 32, 'Q');
      c.rect(80, 14, 52, 14, '2'); c.rect(81, 15, 50, 12, '1'); c.rect(81, 19, 50, 4, '3');              // een vlag van de club
      c.rect(152, 30, 66, 2, 'I'); ['g', 'Y', 'r', 'v', 'y', 'e', 'g'].forEach((k, i) => { c.rect(156 + i * 9, 22, 4, 8, k); c.rect(157 + i * 9, 18, 2, 4, k); }); // flessen op de plank
      c.rect(148, 62, 72, 3, 'I'); c.rect(150, 65, 70, 27, 'Q'); c.rect(164, 53, 16, 2, 'W'); c.rect(166, 55, 2, 7, 'W'); c.rect(176, 55, 2, 7, 'W'); // de bar met de tap
      c.hline(0, 4, TW, 'k'); for (let x = 2; x < TW; x += 10) c.poly([x, 4, x + 8, 4, x + 4, 11], (x / 10) % 2 < 1 ? '1' : '3');   // vlaggetjes
    }), pal);
    const ik = look(info.uit, info.tenue, 'casual'), M = [1, 2, 3, 4].map(i => ander(info, 'maat|' + i, 'casual'));
    const GLAS = [[84, 'y'], [98, 'e'], [118, 'y'], [132, 'y']];
    return {teken(g, f){
      const t = f / T_FPS, proost = f >= 16 && f < 28; g.drawImage(bg, 0, 0);
      const doe = (lk, a, x, d, flip = false) => zet(g, lk, proost ? 'juich' : a, frameOp(proost ? 'juich' : a, t + d), x, {flip});
      doe(M[2], 'lach', 28, .3); doe(M[3], 'praat', 192, .1, true);
      doe(M[0], 'lach', 82, 0); doe(M[1], 'lach', 138, .2, true);
      doe(ik, f < 8 ? 'praat' : 'lach', 110, .1);
      blok(g, 70, 92, 80, 3, 'I'); blok(g, 70, 95, 80, 2, 'Q'); blok(g, 74, 97, 3, GY - 97, 'Q'); blok(g, 143, 97, 3, GY - 97, 'Q'); // de tafel
      GLAS.forEach(([x, k], i) => { const op = proost && (f + i) % 4 < 2 ? 2 : 0;                     // de glazen (bij het proosten even omhoog)
        blok(g, x - 1, 82 - op, 7, 10, 'k'); blok(g, x, 83 - op, 5, 9, k); blok(g, x, 83 - op, 5, 2, 'w'); blok(g, x + 1, 86 - op, 1, 4, 'M');
        if (proost) blok(g, x + (f * 3 + i) % 5, 80 - op - (f * 2 + i * 3) % 6, 1, 1, 'w'); });
      if (proost) for (let i = 0; i < 3; i++) ster(g, 70 + i * 40 + (f + i) % 3, 36 + ((f * 2 + i * 5) % 8));
    }};
  },

  // Jonge spelers helpen: jij houdt de bal hoog, speelt hem naar een jonge speler, hij doet het je na en juicht; jij klapt
  mentor: info => {
    const bg = trainingsveld(info.tenue, info.club), c = bg.getContext('2d'); for (const x of [14, 206]) pion(c, x);
    const ik = look(info.uit, info.tenue, 'training'), klein = ander(info, 'jeugd', 'tenue'), X = 76, JX = 150, s = .8;
    return {teken(g, f){
      const t = f / T_FPS, kl = {flip:true, s}; g.drawImage(bg, 0, 0);
      if (f < 12){ const p = (f % 6) / 6; zet(g, ik, f % 6 === 0 ? 'volley' : 'sta', 0, X); bal(g, X + 11, GY - 14 - Math.sin(Math.PI * p) * 22); }
      else zet(g, ik, f < 26 ? 'wijs' : 'klap', f < 26 ? 0 : frameOp('klap', t), X);
      if (f < 16){ zet(g, klein, 'sta', frameOp('sta', t), JX, kl);
        if (f >= 12){ const u = (f - 12) / 4; bal(g, tussen(X + 11, JX - 9, u), tussen(GY - 14, GY - 12, u) - Math.sin(Math.PI * u) * 14); } }
      else if (f < 26){ const n = (f - 16) % 5; zet(g, klein, n === 0 ? 'volley' : 'sta', 0, JX, kl); bal(g, JX - 9, GY - 12 - Math.sin(Math.PI * n / 5) * 16); }
      else { zet(g, klein, 'juich', frameOp('juich', (f - 26) / T_FPS), JX, kl); bal(g, JX - 9 - (f - 26) * 2, tussen(GY - 12, GY - 3, (f - 25) / 2));
        ster(g, JX - 16, GY - 58 + (f % 2)); ster(g, JX + 14 + (f % 3), GY - 62); }
    }};
  },

  // Extra uren bij de fysio: jij ligt op de behandeltafel, de fysio rekt je been op en houdt het even vast
  fysio: info => {
    const bg = kamer(info.tenue, {muur:'m', vloer:'W', plint:'x'}), c = bg.getContext('2d');
    blok(c, 160, 34, 44, 40, 'X'); blok(c, 162, 36, 40, 36, 'w'); blok(c, 181, 36, 1, 36, 'X'); blok(c, 168, 48, 8, 2, 'g'); blok(c, 171, 45, 2, 8, 'g'); // de kast met een groen kruis
    blok(c, 20, 40, 38, 2, 'Q'); blok(c, 22, 34, 10, 6, 'v'); blok(c, 34, 34, 10, 6, 'e'); blok(c, 46, 34, 10, 6, 'p');                      // handdoeken op een plank
    const ik = look(info.uit, info.tenue, 'training'), fysio = ander(info, 'fysio', 'training', {shirt:'#ffffff', accent:'#2f62d6', broek:'#2f62d6', sok:'#ffffff'});
    const CX = 84, CY = 86, FX = 114;
    // welk beeld van 'schiet' (het been omhoog) en hoe ver de heup in dat beeld naar voren staat
    const BEEN = [0, 0, 0, 0, 0, 0, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4, 3, 3, 0, 0, 0, 0, 0, 0], HEUP = {0:0, 3:2, 4:4, 5:4};
    return {teken(g, f){
      const t = f / T_FPS, b = BEEN[f]; g.drawImage(bg, 0, 0);
      // de fysio staat achter de tafel: hij duwt je been omhoog
      zet(g, fysio, b === 0 ? 'praat' : 'duw', b === 0 ? frameOp('praat', t) : b === 5 ? 1 : 0, FX, {flip:true});
      blok(g, 52, 97, 3, GY - 97, 'X'); blok(g, 114, 97, 3, GY - 97, 'X'); blok(g, 46, 95, 76, 2, 'X');   // de tafel
      blok(g, 44, 91, 80, 4, 'v'); blok(g, 44, 91, 80, 1, '#5b86e8'); blok(g, 46, 89, 14, 2, 'w');        // het kussen
      liggend(g, ik, 'schiet', b, CX, CY, HEUP[b]);
      blok(g, CX - 12, 91, 124 - CX + 12, 4, 'v'); blok(g, CX - 12, 91, 124 - CX + 12, 1, '#5b86e8');     // (de rand van de tafel voor je lijf langs)
      if (b === 5 && f % 4 < 2){ blok(g, CX + 2, CY - 24, 1, 3, 'w'); blok(g, CX + 14, CY - 24, 1, 3, 'w'); } // rekken!
    }};
  },
};
