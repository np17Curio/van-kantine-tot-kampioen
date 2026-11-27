/* ===================== Trainingsanimaties: de trainingen op het veld ===================== */
// Vijf oefeningen (zie basis.js): afwerken, passen, dribbelen, verdedigen en conditie. Een keeper krijgt bij dezelfde ids
// zijn eigen oefeningen: positiespel, uittrappen, voetenwerk, reflexen en sprongkracht.
// Jij draagt het trainingspak van de club (een keeper zijn keepertenue met handschoenen). Geen tekst in het beeld.
import { GY, T_FPS, bal, frameOp, look, pion, trainingsveld, zet } from './basis.js';
import { BAL_VOOR } from '../animaties.js';
import { uiterlijkVoor } from '../uiterlijk.js';

// ---------- hulpjes ----------
const L = (a, b, u) => a + (b - a) * Math.max(0, Math.min(1, u));
const vlak = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
const schaduw = (g, x, r = 3) => vlak(g, x - r, GY - 1, r * 2, 2, 'rgba(0,0,0,.22)');
// een teamgenoot in het trainingspak, of met een oranje hesje (de tegenstander op de training)
const maat = (info, nr, hesje = false) => look(uiterlijkVoor('maat|training|' + nr), info.tenue, 'tenue', hesje ? {kleuren:{r:'#ff8a1c', R:'#c4600c'}} : {});
const ikVeld = info => look(info.uit, info.tenue, 'tenue'); // (op het veld in het voetbaltenue: shirt en korte broek, geen trainingspak)
const ikKeeper = info => look(info.uit, info.tenue, 'tenue', {handschoen:true});
// zweetdruppels die van je hoofd spatten (x = het midden van de speler)
function zweet(g, x, f, y = GY){
  for (let i = 0; i < 2; i++){ const t = (f + i * 3) % 6, k = i ? 1 : -1;
    vlak(g, x + k * (7 + t * 2), y - 54 + t * t * .6 - t * 2, 1, 2, '#9fd8ff'); }
}
// stofwolkjes bij je voeten (bij het keren)
function stof(g, x, n){ if (n < 0 || n > 3) return; for (let i = 0; i < 3; i++) vlak(g, x + (i - 1) * (4 + n * 3), GY - 2 - n - (i % 2) * 2, 2, 2, 'rgba(230,230,235,' + (.8 - n * .2) + ')'); }

// ---------- een klein trainingsdoel van opzij (rechts), het net bolt op waar de bal erin vliegt ----------
const PAAL = 180, LAT = GY - 34;
function doeltje(g, bol = 0, bx = 0, by = 0){
  const d = (x, y) => bol ? Math.round(bol * Math.exp(-((x - bx) ** 2 + (y - by) ** 2) / 60)) : 0;
  const boven = x => LAT + Math.round((x - PAAL) * 3 / 20), achter = y => 204 + Math.round((y - LAT) * 8 / (GY - LAT));
  g.fillStyle = '#d4d4de';
  for (let x = PAAL + 5; x < 214; x += 5) for (let y = boven(Math.min(x, 204)); y <= GY; y++) if (x <= achter(y)) g.fillRect(x + d(x, y), y, 1, 1); // verticale mazen
  for (let y = LAT + 5; y < GY; y += 5) for (let x = PAAL + 2; x <= achter(y); x++) if (y >= boven(Math.min(x, 204))) g.fillRect(x + d(x, y), y, 1, 1); // horizontale mazen
  for (let y = LAT; y <= GY; y++) g.fillRect(achter(y) + d(achter(y), y), y, 1, 1);  // de achterkant
  for (let x = PAAL; x <= 204; x++) g.fillRect(x, boven(x), 1, 1);                   // de bovenkant
  vlak(g, PAAL, LAT, 3, GY - LAT + 1, '#ffffff'); vlak(g, PAAL - 1, LAT - 1, 5, 2, '#ffffff'); vlak(g, PAAL + 2, LAT + 1, 1, GY - LAT, '#d4d4de'); // de paal met de lat
}
// ---------- een groot doel van voren (voor de keeper): de palen op GY - 6, de keeper staat ervoor ----------
const DL = 36, DR = 184, DG = GY - 6, DT = DG - 70;
function grootDoel(g){
  const AL = 46, AR = 174, AT = DT + 8, AG = DG - 6, net = 'rgba(212,212,222,.55)';            // de achterkant van het net
  for (let x = AL; x <= AR; x += 6) vlak(g, x, AT, 1, AG - AT, net);
  for (let y = AT; y <= AG; y += 6) vlak(g, AL, y, AR - AL + 1, 1, net);
  for (let y = DT + 3; y <= AG; y += 6){ vlak(g, DL + 3, y, AL - DL - 3, 1, net); vlak(g, AR + 1, y, DR - AR - 1, 1, net); } // de zijnetten
  for (let i = 0; i <= 8; i++){ vlak(g, L(DL, AL, i / 8), L(DG, AG, i / 8), 1, 1, net); vlak(g, L(DR, AR, i / 8), L(DG, AG, i / 8), 1, 1, net); }
  vlak(g, AL, AG, AR - AL + 1, 1, '#d4d4de');
  vlak(g, DL, DT, 3, DG - DT + 1, '#ffffff'); vlak(g, DR, DT, 3, DG - DT + 1, '#ffffff'); vlak(g, DL, DT, DR - DL + 3, 3, '#ffffff'); // palen en lat
  vlak(g, DL + 2, DT + 3, 1, DG - DT - 2, '#d4d4de'); vlak(g, DR + 2, DT + 3, 1, DG - DT - 2, '#d4d4de');
  vlak(g, DL - 20, DG + 1, DR - DL + 43, 1, '#ffffff');                                         // de doellijn
}

// ================= de veldspeler =================
// Afwerken: drie ballen op een rij, je schiet ze één voor één in het trainingsdoel en juicht na de laatste
function afwerken(info){
  const bg = trainingsveld(info.tenue, info.club), ik = ikVeld(info);
  const BALLEN = [76, 94, 112], HOOG = [GY - 18, GY - 10, GY - 24]; // waar de ballen liggen, en hoe hoog ze het net in gaan
  return {teken(g, f){
    g.drawImage(bg, 0, 0); pion(g, 22); pion(g, 38);
    const k = Math.min(2, Math.floor(f / 10)), n = f - k * 10;
    if (n < 8) zet(g, ik, 'schiet', Math.min(7, n), BALLEN[k] - 18);
    else if (k < 2) zet(g, ik, 'ren', frameOp('ren', f / T_FPS), BALLEN[k] - 18 + (n - 7) * 9); // naar de volgende bal
    else zet(g, ik, 'juich', frameOp('juich', (n - 8) / T_FPS), BALLEN[k] - 18);
    let bol = 0, by = 0;
    for (let j = 0; j < 3; j++){
      const t = f - (j * 10 + 4); // beelden sinds het schot (het raakmoment is beeld 4 van 'schiet')
      if (t < 0){ bal(g, BALLEN[j], GY - 3); continue; }
      if (t < 3){ const u = (t + 1) / 3; bal(g, L(BALLEN[j], 202, u), L(GY - 3, HOOG[j], u) - Math.sin(Math.PI * u) * 8); schaduw(g, L(BALLEN[j], 202, u)); }
      else bal(g, 202 - Math.min(t - 2, 4) * 2 - j * 4, Math.min(GY - 3, HOOG[j] + (t - 2) * (t - 2) * 3)); // in het net, en dan op de grond
      if (t >= 2 && t < 6){ bol = [4, 3, 2, 1][t - 2]; by = HOOG[j]; }
    }
    doeltje(g, bol, 204, by);
  }};
}

// Passen: jij en een teamgenoot spelen de bal heen en weer tussen twee pionnen
function passen(info){
  const bg = trainingsveld(info.tenue, info.club), ik = ikVeld(info), hij = maat(info, 1);
  const PX = 62, TX = 158, A = PX + 18, B = TX - 18;
  return {teken(g, f){
    g.drawImage(bg, 0, 0); pion(g, PX - 18); pion(g, TX + 18);
    const n = f % 16;
    zet(g, ik, n < 8 ? 'schiet' : 'sta', n < 8 ? n : frameOp('sta', (n - 8) / T_FPS), PX);
    zet(g, hij, n >= 8 ? 'schiet' : 'sta', n >= 8 ? n - 8 : frameOp('sta', n / T_FPS), TX, {flip:true});
    // de bal: bij jou tot je raakt (beeld 4), dan over de grond naar hem, en weer terug
    const bx = n < 4 ? A : n < 8 ? L(A, B, (n - 3) / 4) : n < 12 ? B : L(B, A, (n - 11) / 4);
    bal(g, bx, GY - 3); schaduw(g, bx);
  }};
}

// Dribbelen: een slalom door een rij pionnen, de bal blijft aan je voet
function dribbelen(info){
  const bg = trainingsveld(info.tenue, info.club), ik = ikVeld(info), PIONNEN = [50, 80, 110, 140, 170];
  return {teken(g, f){
    g.drawImage(bg, 0, 0);
    const x = 14 + Math.min(f, 28) * 6.2, dy = Math.round(4 * Math.sin(Math.PI * (x - 35) / 30)); // (om de pionnen heen: voor en achter ze langs)
    const speler = () => {
      if (f < 28){ const i = frameOp('dribbel', f / T_FPS); zet(g, ik, 'dribbel', i, x, {y:GY + dy}); bal(g, x + BAL_VOOR[i], GY + dy - 3); }
      else { zet(g, ik, 'sta', frameOp('sta', (f - 28) / T_FPS), x, {y:GY + dy}); bal(g, x + 14, GY + dy - 3); } // de bal stilgelegd
    };
    if (dy < 0){ speler(); PIONNEN.forEach(p => pion(g, p)); }
    else { PIONNEN.forEach(p => pion(g, p)); speler(); }
  }};
}

// Verdedigen: een teamgenoot met een hesje dribbelt op je af, jij wacht af (jockey), gaat erin met een sliding en pakt de bal
function verdedigen(info){
  const bg = trainingsveld(info.tenue, info.club), ik = ikVeld(info), hij = maat(info, 2, true), RUST = 160;
  return {teken(g, f){
    g.drawImage(bg, 0, 0);
    // hij: dribbelt naar links, springt over je sliding en klapt daarna voor je actie
    let tx, bx;
    if (f < 13){ const i = frameOp('dribbel', f / T_FPS); tx = 200 - f * 5.5; zet(g, hij, 'dribbel', i, tx, {flip:true}); bx = tx - BAL_VOOR[i]; }
    else if (f < 19){ tx = 130 - (f - 13) * 10; zet(g, hij, 'overspring', f - 13, tx, {flip:true}); }
    else zet(g, hij, 'klap', frameOp('klap', (f - 19) / T_FPS), 70);
    // jij
    let px;
    if (f < 10){ px = 70 + f; zet(g, ik, 'jockey', frameOp('jockey', f / T_FPS), px); }
    else if (f < 19){ px = 80 + Math.min(5, f - 10) * 5; zet(g, ik, 'sliding', 0, px); }
    else if (f < 22){ px = 105; zet(g, ik, 'kniel', 0, px); }                     // weer opstaan
    else { px = 105 + (f - 22) * 7; zet(g, ik, 'dribbel', frameOp('dribbel', (f - 22) / T_FPS), px); }
    // de bal: bij hem, dan weggetikt door je sliding (met een hupje), en daarna aan jouw voet
    if (f >= 13){
      const u = Math.min(1, (f - 12) / 6), van = 200 - 12 * 5.5 - 17;
      bx = L(van, RUST, 1 - (1 - u) * (1 - u));
      if (f >= 22){ const i = frameOp('dribbel', (f - 22) / T_FPS); if (px + BAL_VOOR[i] >= RUST) bx = px + BAL_VOOR[i]; }
      bal(g, bx, GY - 3 - Math.round(Math.sin(Math.PI * Math.min(1, (f - 12) / 3)) * 6)); schaduw(g, bx);
    } else { bal(g, bx, GY - 3); schaduw(g, bx); }
  }};
}

// Conditie: pendelsprints tussen twee pionnen, met zweet en stof bij het keren, en na afloop trots je spierballen
function conditie(info){
  const bg = trainingsveld(info.tenue, info.club), ik = ikVeld(info);
  return {teken(g, f){
    g.drawImage(bg, 0, 0); pion(g, 28); pion(g, 192); pion(g, 110, '#ffd21a');
    const i = frameOp('ren', f / T_FPS);
    let x;
    if (f < 10){ x = L(44, 176, f / 9); zet(g, ik, 'ren', i, x); }
    else if (f < 20){ x = L(176, 44, (f - 10) / 9); zet(g, ik, 'ren', i, x, {flip:true}); }
    else if (f < 28){ x = L(44, 150, (f - 20) / 7); zet(g, ik, 'ren', i, x); }
    else { x = 150; zet(g, ik, 'kracht', frameOp('kracht', (f - 28) / T_FPS), x); }
    stof(g, 176, f - 10); stof(g, 44, f - 20);
    if (f >= 8) zweet(g, x, f);
  }};
}

// ================= de keeper =================
// Positiespel: een bal op verschillende plekken voor het doel, jij schuift steeds mee tussen de palen; dan schiet de trainer hem op je af
function positiespel(info){
  const bg = trainingsveld(info.tenue, info.club), ik = ikKeeper(info), PLEK = [110, 152, 64, 124];
  const balX = f => { const s = Math.min(3, Math.floor(f / 8)); return L(PLEK[s], PLEK[s + 1] ?? PLEK[s], (f - s * 8) / 3); };
  const kx = f => 110 + (balX(Math.max(0, f - 2)) - 110) * .45;   // (de keeper volgt de bal, iets later)
  return {teken(g, f){
    g.drawImage(bg, 0, 0); grootDoel(g);
    const x = kx(Math.min(f, 24)), schuift = Math.abs(kx(f) - kx(f - 1)) > .5 && f < 24;
    if (f < 27) zet(g, ik, 'keeperKlaar', frameOp('keeperKlaar', f / T_FPS), x, {y:GY - (schuift && f % 2 ? 1 : 0)});
    else zet(g, ik, 'vang', 0, x);
    if (f < 24){ const bx = balX(f); bal(g, bx, 118, 4); }
    else if (f < 27){ const u = (f - 23) / 3; bal(g, L(PLEK[3], x, u), L(118, GY - 28, u) - Math.sin(Math.PI * u) * 6, u < .6 ? 4 : 3); } // het schot op je af
    else bal(g, x, GY - 28);                                                                                                 // en gevangen
  }};
}

// Uittrappen: de bal uit je handen laten vallen en ver wegtrappen, een teamgenoot neemt hem aan op zijn borst
function uittrappen(info){
  const bg = trainingsveld(info.tenue, info.club), ik = ikKeeper(info), hij = maat(info, 3), KX = 44, TX = 194;
  return {teken(g, f){
    g.drawImage(bg, 0, 0); pion(g, 24); pion(g, 212);
    if (f < 6) zet(g, ik, 'vang', 0, KX);
    else if (f < 10) zet(g, ik, 'volley', f < 8 ? 0 : 1, KX);
    else if (f < 24) zet(g, ik, 'sta', frameOp('sta', (f - 10) / T_FPS), KX);
    else zet(g, ik, 'wijs', 0, KX);
    if (f >= 18 && f < 25) zet(g, hij, 'borst', 0, TX, {flip:true}); else zet(g, hij, 'sta', frameOp('sta', f / T_FPS), TX, {flip:true});
    let bx, by;
    if (f < 6){ bx = KX; by = GY - 28; }
    else if (f < 8){ bx = KX + (f - 5) * 7; by = GY - 28 + (f - 5) * 8; }      // de bal valt uit je handen
    else if (f < 9){ bx = KX + 20; by = GY - 14; }
    else if (f < 22){ const u = (f - 8) / 13; bx = L(KX + 20, TX - 6, u); by = L(GY - 14, GY - 30, u) - Math.sin(Math.PI * u) * 70; } // de lange boog
    else { const u = Math.min(1, (f - 21) / 3); bx = L(TX - 6, TX - 16, u); by = L(GY - 30, GY - 3, u * u); }                      // van zijn borst op de grond
    schaduw(g, bx); bal(g, bx, by);
  }};
}

// Voetenwerk: snel door een loopladder op de grond, en aan het eind een bal vangen
function voetenwerk(info){
  const bg = trainingsveld(info.tenue, info.club), ik = ikKeeper(info), LA = 46, LB = 176;
  return {teken(g, f){
    g.drawImage(bg, 0, 0); pion(g, 34); pion(g, 200);
    vlak(g, LA, GY - 2, LB - LA, 1, '#e39a0c');                                            // de ladder: verre rail, sporten, voorste rail
    for (let x = LA; x <= LB; x += 10) for (let j = 0; j < 6; j++) vlak(g, x + Math.floor((5 - j) / 2), GY - 2 + j, 1, 1, '#ffd21a');
    vlak(g, LA - 2, GY + 3, LB - LA + 4, 1, '#ffd21a');
    let x;
    if (f < 24){ x = 26 + f * 6.3; zet(g, ik, 'ren', (f * 3) % 8, x, {y:GY + 1}); }       // (snelle voetjes)
    else { x = 26 + 24 * 6.3; zet(g, ik, f < 28 ? 'keeperKlaar' : 'vang', f < 28 ? frameOp('keeperKlaar', (f - 24) / T_FPS) : 0, x, {y:GY + 1}); }
    if (f >= 25){ const u = Math.min(1, (f - 24) / 3); bal(g, L(226, x, u), L(40, GY - 27, u) - Math.sin(Math.PI * u) * 10); } // de bal van de trainer
  }};
}

// Reflexen: twee snelle schoten in de hoeken (een duik naar rechts, een naar links, de bal weggetikt) en een vangbal
function reflexen(info){
  const bg = trainingsveld(info.tenue, info.club), ik = ikKeeper(info);
  // een duik vanaf beeld s naar kant k (1 rechts, -1 links): de positie van de keeper per beeld van 'duik'
  const DX = [0, 0, 6, 10, 12, 12], duik = (g, f, s, k) => { const i = Math.min(5, f - s); zet(g, ik, 'duik', i, 110 + k * DX[i], {flip:k < 0}); };
  const redding = (g, f, s, k, vanX) => {   // de bal: van dichtbij op het doel af, door je handen weggetikt, naast het doel
    const doel = [110 + k * 52, GY - 18], n = f - s;
    if (n < 0) return;
    if (n <= 3){ const u = n / 3; bal(g, L(vanX, doel[0], u), L(126, doel[1], u), u < .5 ? 5 : u < .9 ? 4 : 3); }
    else if (n < 7){ const u = (n - 3) / 3; bal(g, L(doel[0], doel[0] + k * 70, u), L(doel[1], doel[1] - 40, u) + u * u * 20); }
  };
  return {teken(g, f){
    g.drawImage(bg, 0, 0); grootDoel(g);
    if (f < 4) zet(g, ik, 'keeperKlaar', frameOp('keeperKlaar', f / T_FPS), 110);
    else if (f < 10) duik(g, f, 4, 1);
    else if (f < 12) zet(g, ik, 'duik', 1, L(122, 110, (f - 9) / 2));                       // weer op
    else if (f < 14) zet(g, ik, 'keeperKlaar', frameOp('keeperKlaar', f / T_FPS), 110);
    else if (f < 20) duik(g, f, 14, -1);
    else if (f < 22) zet(g, ik, 'duik', 1, L(98, 110, (f - 19) / 2), {flip:true});
    else if (f < 28) zet(g, ik, 'keeperKlaar', frameOp('keeperKlaar', f / T_FPS), 110);
    else zet(g, ik, 'vang', 0, 110);
    redding(g, f, 4, 1, 96); redding(g, f, 14, -1, 126);
    if (f >= 25){ const u = Math.min(1, (f - 25) / 3); bal(g, L(104, 110, u), L(126, GY - 28, u), u < .5 ? 5 : u < 1 ? 4 : 3); } // recht op je af: vast
  }};
}

// Sprongkracht: hoge ballen van links en rechts, je springt en plukt ze uit de lucht
function sprongkracht(info){
  const bg = trainingsveld(info.tenue, info.club), ik = ikKeeper(info), KX = 110, START = [1, 11, 21], VAN = [-1, 1, -1];
  const HOOG = [0, 0, 6, 16, 18, 8, 0, 0]; // hoe hoog je bent per beeld van 'spring'
  const balOp = (f, j) => {                 // waar bal j is op beeld f (of niets)
    const s = START[j], n = f - s, laatste = j === START.length - 1;
    if (n < -3) return null;
    if (n < 3){ const u = (n + 3) / 6, x0 = VAN[j] < 0 ? -6 : 226; return [L(x0, KX, u), L(40, GY - 62 - HOOG[3], u) - Math.sin(Math.PI * u) * 22]; } // de voorzet
    if (n < 5) return [KX, GY - 62 - HOOG[n]];                       // gevangen, boven je hoofd
    if (n < 6) return [KX, GY - 46];
    if (n < 8 || laatste) return [KX, GY - 28];                      // tegen je borst
    const r = n - 7, w = -VAN[j];                                    // weggegooid naar de kant, daar rolt hij uit beeld
    return r < 3 ? [KX + w * r * 14, L(GY - 28, GY - 3, r / 2)] : [KX + w * (28 + (r - 2) * 14), GY - 3];
  };
  return {teken(g, f){
    g.drawImage(bg, 0, 0); grootDoel(g);
    let j = -1; START.forEach((s, k) => { if (f >= s) j = k; });
    const n = j < 0 ? -1 : f - START[j], laatste = j === START.length - 1;
    if (n >= 0 && n < 7) zet(g, ik, 'spring', n, KX);
    else if (n >= 7 && (n < 8 || laatste)) zet(g, ik, 'vang', 0, KX);         // de bal tegen je borst (de laatste houd je vast)
    else zet(g, ik, 'keeperKlaar', frameOp('keeperKlaar', f / T_FPS), KX);
    for (let b = 0; b < START.length; b++){ const p = balOp(f, b); if (p && p[0] > -8 && p[0] < 228){ if (p[1] < GY - 6) schaduw(g, p[0]); bal(g, p[0], p[1]); } }
  }};
}

// ---------- welke oefening bij welke id (een keeper krijgt zijn eigen) ----------
const kies = (veld, keeper) => info => (info.keeper ? keeper : veld)(info);
export const ANIMATIES = {
  'train-afw':kies(afwerken, positiespel),
  'train-pas':kies(passen, uittrappen),
  'train-drib':kies(dribbelen, voetenwerk),
  'train-verd':kies(verdedigen, reflexen),
  'train-cond':kies(conditie, sprongkracht),
};
