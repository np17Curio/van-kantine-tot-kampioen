/* ===================== Het afscheid in pixels: de erehaag, de spandoeken en je shirt aan de muur ===================== */
// In de stijl van de huldiging en de opkomst (stijlbron art/chibi_anims.px.js). Deel 1: 's avonds in een uitverkocht stadion
// vormen beide teams een erehaag. Achter: de Vrienden (van voren, klappend); voor: je eigen ploeg (van achteren, met
// rugnummers). Jij loopt er in je eigen tenue tussendoor, zwaait naar het publiek en steekt aan het eind je armen omhoog.
// Op de tribune gaan de spandoeken omhoog: BEDANKT + je naam, je rugnummer, LEGENDE. Deel 2: in de bestuurskamer wordt je
// shirt (je nummer en naam, in de kleuren van je laatste club) ingelijst aan de muur gehangen.
// 200 beelden van 320×180 op 10 fps; daarna lopen de laatste 24 (het glas glimt, stofjes in de spot) door tot je verder klikt.
// Elk beeld wordt pas getekend als het nodig is (teken(g, f)), van vooraf ingekleurde onderdelen.
import { Doek, Img, inkleuren, speler, sprite } from './rig.js';
import { loopCyclus } from './animaties.js';
import { donker, lookVan } from './atlas.js';
import { fans } from './opkomst.js';
import { regelBreedte, tekst, zonderAccent } from './font.js';

export const AW = 320, AH = 180, A_FRAMES = 200, A_FPS = 10, A_LUS = 24;
// Belangrijke beelden (voor de teksten en de flits in afscheidscene.js)
export const A_MOMENT = {start:0, zwaai:58, verder:78, armen:124, donker:140, muur:150, hang:156, spot:168, glans:172};
const ACHTER = 130, JIJ = 146, VOOR = 192; // de voeten van de achterste rij, van jou en van de voorste rij

// ---------- kleuren ----------
const STIJL = {K:'#0b1022', k:'#1a1414', b:'#3c4a6e', M:'#ffe9a8', w:'#ffffff', C:'#1d1f2c', c:'#2b2e3e', g:'#2f7d3f', G:'#378c48',
  s:'#f7c9a8', S:'#e3a07e', h:'#b5541c', r:'#e0262b', R:'#a3161b', v:'#2b3f9e', i:'#a8744f', n:'#2a1f1c', o:'#ffd84a', d:'#7a4a2a', D:'#4e2e18', y:'#ffd21a',
  '<':'#f3c44f', '>':'#b58a25', '^':'#fff2b0', '~':'#15161c', L:'#e9e2cf', l:'#cfc6ae',
  // de bestuurskamer: behang (q/Q), lambrisering (e/E), vloer (f)
  q:'#3a2a33', Q:'#33242c', e:'#5a3a22', E:'#472c18', f:'#2a1c14', m:'#141622'};

// ---------- vaste "willekeur" (elke keer hetzelfde) ----------
const KORREL = n => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; return (h ^ (h >>> 13)) >>> 0; };

// ---------- het stadion (twee versies: de fans juichen om en om) ----------
function stadion(naam, nr, juich){
  return sprite(AW, AH, c => {
    c.rect(0, 0, AW, 18, 'K');
    for (let i = 0; i < 26; i++) c.px((i * 53 + 7) % AW, (i * 11 + 2) % 14, 'w');                                       // sterren
    for (const x of [24, 160, 296]){ c.rect(x, 0, 2, 16, 'b'); c.rect(x - 7, 1, 16, 5, 'M'); c.hline(x - 7, 1, 16, 'w'); } // lichtmasten
    c.rect(0, 14, AW, 82, 'C'); for (let y = 22; y < 96; y += 9) c.hline(0, y, AW, 'c');
    fans(c, juich ? 1 : 0, 0, 15, AW, 81, 5); fans(c, juich ? 0 : 1, 0, 15, AW, 81, 13);                                   // de volle tribune
    // de reclameborden: je naam en je nummer, in de clubkleuren
    c.rect(0, 96, AW, 9, '1'); c.hline(0, 96, AW, '2'); c.hline(0, 104, AW, '2');
    { const t = naam + '  ' + nr, w = regelBreedte(t) + 18; for (let x = 6; x < AW; x += w) tekst(c, x, 98, t, '3'); }
    let y = 105, h = 5, i = 0; while (y < AH){ c.rect(0, y, AW, h, i % 2 ? 'G' : 'g'); y += h; h += 3; i++; }              // gras met banen
    c.hline(0, 112, AW, 'w');                                                                                                // de zijlijn
  });
}

// ---------- de spandoeken (aan stokken, met handjes eronder) ----------
function doek(regels, {scale = 1, vlak = '1', inkt = '3', rand = '2', pad = 3} = {}){
  const bw = Math.max(...regels.map(r => regelBreedte(r, {scale}))) + pad * 2 + 2, bh = regels.length * (5 * scale + 2) + pad * 2;
  return sprite(bw, bh + 5, c => {
    c.vline(1, 0, bh + 4, 'd'); c.vline(bw - 2, 0, bh + 4, 'd');                                                             // stokken
    c.rect(0, 0, bw, bh, vlak); c.hline(0, 0, bw, rand); c.hline(0, bh - 1, bw, rand); c.vline(0, 0, bh, rand); c.vline(bw - 1, 0, bh, rand);
    regels.forEach((r, j) => tekst(c, Math.floor(bw / 2), pad + 1 + j * (5 * scale + 2), r, inkt, {scale, align:'c'}));
    c.rect(0, bh + 2, 3, 3, 's'); c.rect(bw - 3, bh + 2, 3, 3, 's');                                                         // de handen die hem vasthouden
  });
}

// ---------- de figuren ----------
// De Vrienden (achterste rij, van voren): klappen, de handen om en om samen en uit elkaar
const KLAP = [{aL:[30, 80], aR:[-30, -80], arm:1.3}, {aL:[-10, 70], aR:[10, -70], arm:1.3}];
function klapBeeld(v, i){
  const img = new Img(44, 90), c = new Doek(img);
  speler(c, {x:22, lL:[-5, 10], lR:[10, 15], ...KLAP[i]}, v);
  return img.outline(107); // ('k')
}
// Je ploeg (voorste rij, van achteren, met rugnummer): de armen naar voren, om en om iets hoger (klappen)
const KLAP_RUG = [{aL:[70, 40], aR:[70, 40]}, {aL:[50, 30], aR:[50, 30]}];
function rugBeeld(v, i){
  const img = new Img(44, 90), c = new Doek(img);
  speler(c, {x:22, lL:[-4, 4], lR:[4, 4], ...KLAP_RUG[i], richting:'achter'}, v);
  return img.outline(107);
}
// Jij: lopen (zijaanzicht), zwaaien naar het publiek (van voren) en de armen omhoog
const LOOP = loopCyclus(35);
const ZWAAI = [{x:35, lL:[-5, 10], lR:[10, 15], aL:[-25, 40], aR:[150, 20], arm:1.35}, {x:35, lL:[-5, 10], lR:[10, 15], aL:[-25, 40], aR:[125, 30], arm:1.35}];
const ARMEN = [{x:35, lL:[-5, 10], lR:[10, 15], aL:[-155, -15], aR:[155, 15], arm:1.3}, {x:35, lL:[-5, 10], lR:[10, 15], aL:[-130, -25], aR:[130, 25], arm:1.3}];
function jijBeeld(P, v){ const img = new Img(70, 90), c = new Doek(img); speler(c, P, v); return img.outline(107); }

// ---------- het ingelijste shirt (van achteren: naam en nummer) ----------
const PATROON = {
  effen: () => false, strepen: x => Math.floor((x - 14) / 6) % 2 === 1, banen: (x, y) => Math.floor(y / 6) % 2 === 1, helften: x => x >= 36,
  sjerp: (x, y) => Math.abs((x - 10) - (y - 2) * .9 - 6) < 6, blokken: (x, y) => (Math.floor(x / 6) + Math.floor(y / 6)) % 2 === 1,
  bies: (x, y) => y < 4 || x < 18 || x > 53,
};
function shirt(achternaam, nr, patroon){
  const acc = PATROON[patroon] || PATROON.effen;
  const img = sprite(72, 66, c => {
    c.poly([14, 4, 26, 0, 46, 0, 58, 4, 72, 18, 63, 29, 57, 24, 57, 66, 15, 66, 15, 24, 9, 29, 0, 18], 'r');                // romp en mouwen
    for (let y = 0; y < 66; y++) for (let x = 0; x < 72; x++) if (c.is(x, y, 'r')){ const a = acc(x, y), sch = x >= 52; c.px(x, y, a ? (sch ? 'W' : 'w') : sch ? 'R' : 'r'); }
    c.line(0, 18, 9, 29, 'w', 2); c.line(72, 18, 63, 29, 'w', 2);                                                            // de boorden van de mouwen
    c.hline(26, 0, 20, 'w'); c.hline(25, 1, 22, 'w'); c.hline(27, 2, 18, 'R');                                               // de kraag
    c.hline(15, 63, 42, 'R');
    // naam en nummer op een vlak in de shirtkleur, zodat ze ook op strepen leesbaar zijn
    const n = achternaam, nb = regelBreedte(n);
    c.rect(36 - Math.floor(nb / 2) - 2, 8, nb + 4, 9, 'r'); tekst(c, 36, 10, n, 'w', {align:'c'});
    const cijfers = String(nr || '').replace(/[^0-9]/g, '').slice(0, 2) || '10', b = regelBreedte(cijfers, {scale:3, gap:1});
    c.rect(36 - Math.floor(b / 2) - 3, 20, b + 6, 21, 'r'); tekst(c, 36, 23, cijfers, 'w', {scale:3, gap:1, align:'c'});
  });
  return img.outline(107);
}
// De lijst: goud, met een passe-partout in de donkere clubkleur
const LW = 100, LH = 104;
function lijst(achternaam, nr, patroon){
  return sprite(LW, LH, c => {
    c.rect(0, 0, LW, LH, '>'); c.rect(1, 1, LW - 2, LH - 2, '<'); c.rect(4, 4, LW - 8, LH - 8, '>'); c.hline(1, 1, LW - 2, '^'); c.vline(1, 1, LH - 2, '^');
    c.rect(6, 6, LW - 12, LH - 12, '2'); c.rect(9, 9, LW - 18, LH - 18, 'm');
    c.stamp(shirt(achternaam, nr, patroon), 13, 20);
    for (const [x, y] of [[2, 2], [LW - 3, 2], [2, LH - 3], [LW - 3, LH - 3]]) c.px(x, y, '^');                                // glans op de hoeken
  });
}
// De bestuurskamer: behang, lambrisering, een lamp boven de lijst, een spijker met een draad
function muur(){
  return sprite(AW, AH, c => {
    for (let x = 0; x < AW; x++) c.vline(x, 0, 132, (x >> 3) % 2 ? 'q' : 'Q');
    c.rect(0, 132, AW, 34, 'e'); for (let x = 6; x < AW; x += 52){ c.rect(x, 138, 44, 22, 'E'); c.rect(x + 2, 140, 40, 18, 'e'); }
    c.hline(0, 132, AW, 'D'); c.hline(0, 133, AW, '<'); c.rect(0, 166, AW, 14, 'f'); c.hline(0, 166, AW, 'D');
    c.rect(150, 0, 20, 4, '~'); c.rect(154, 4, 12, 3, '>'); c.hline(155, 6, 10, '^');                                        // de spot
  });
}
// Het licht van de spot: een lichtere kegel op de muur (in sleutels, daarna doorschijnend erover)
function kegel(){ return sprite(AW, AH, c => c.poly([152, 7, 168, 7, 238, 132, 82, 132], 'M')); }
function plaatje(naam, club){
  const n = zonderAccent(naam).slice(0, 22), cl = zonderAccent(club).slice(0, 26), w = Math.max(regelBreedte(n), regelBreedte(cl)) + 12;
  return sprite(w, 18, c => { c.rect(0, 0, w, 18, '>'); c.rect(1, 1, w - 2, 16, '<'); c.hline(1, 1, w - 2, '^'); tekst(c, w >> 1, 3, n, '~', {align:'c'}); tekst(c, w >> 1, 10, cl, 'D', {align:'c'}); });
}

// ---------- confetti (club en goud) en flitsen van camera's ----------
const CONFETTI = Array.from({length:70}, (_, i) => ({x:KORREL(i) % AW, y:KORREL(i + 500) % AH, v:2 + KORREL(i + 900) % 3, k:['1', '3', '<', 'w'][KORREL(i + 77) % 4], fase:KORREL(i + 33) % 8}));
const STOF = Array.from({length:18}, (_, i) => ({x:110 + KORREL(i + 40) % 100, y:20 + KORREL(i + 60) % 100, fase:KORREL(i + 80) % 24}));

// info = {uit (jouw uiterlijk), tenue (je club), band, nr, naam (je naam), club (clubnaam), team: [uiterlijk × 5] (je ploeg),
//   vrienden: [uiterlijk × 8], vriendTenue}. Geeft {w, h, frames, lus, teken(g, f)}: g = 2d-context van (w × h)
export function maakAfscheid(info = {}){
  const t = info.tenue || {shirt:'#e0262b', accent:'#ffffff', patroon:'strepen', broek:'#2f62d6', sok:'#e0262b'};
  const club = {1:t.shirt, 2:donker(t.shirt, .35), 3:t.accent || '#ffffff', r:t.shirt, R:donker(t.shirt, .3), w:t.accent || '#ffffff', W:donker(t.accent || '#ffffff', .16)};
  const pal = {...STIJL, ...club};
  const nr = String(info.nr || 10).replace(/[^0-9]/g, '').slice(0, 2) || '10';
  const naam = zonderAccent(info.naam || 'LEGENDE'), delen = naam.split(/\s+/).filter(Boolean);
  const achternaam = (delen.length > 1 ? delen.slice(1).join(' ') : naam).slice(0, 10), roep = (delen[0] || naam).slice(0, 12);
  const achter = [0, 1].map(j => inkleuren(stadion(naam.slice(0, 20), nr, j), pal));
  // de spandoeken op de tribune: [canvas, x, y, fase]
  const DOEKEN = [
    [doek(['BEDANKT', roep]), 10, 30, 0], [doek([nr], {scale:3, vlak:'3', inkt:'1'}), 96, 22, 1], [doek(['LEGENDE'], {vlak:'3', inkt:'1'}), 140, 44, 2],
    [doek(['BEDANKT', achternaam], {scale:1}), 196, 26, 3], [doek([nr], {scale:2}), 276, 40, 0], [doek([nr]), 62, 60, 2], [doek(['LEGENDE']), 250, 66, 1],
  ].map(([img, x, y, fase]) => [inkleuren(img, pal), x, y, fase]);
  // jij, in je eigen tenue
  const ik = lookVan(info.uit || {}, t, {band:!!info.band});
  const vIk = {kapsel:ik.kapsel, vrouw:ik.vrouw, kleding:'tenue', patroon:ik.patroon, band:ik.band, baard:ik.baard};
  const loop = LOOP.map(P => inkleuren(jijBeeld(P, vIk), ik.kleuren)), zwaai = ZWAAI.map(P => inkleuren(jijBeeld(P, vIk), ik.kleuren)), armen = ARMEN.map(P => inkleuren(jijBeeld(P, vIk), ik.kleuren));
  // de Vrienden (achter, van voren) en je ploeg (voor, van achteren, met rugnummers)
  const vt = info.vriendTenue || {shirt:'#f4f4f8', accent:'#16171c', patroon:'effen', broek:'#16171c', sok:'#f4f4f8'};
  const figuur = (u, tenue, maak, extra = {}) => { const l = lookVan(u || {}, tenue, {}), v = {kapsel:l.kapsel, vrouw:l.vrouw, kleding:'tenue', patroon:l.patroon, baard:l.baard, ...extra};
    return [0, 1].map(j => inkleuren(maak(v, j), l.kleuren)); };
  const vrienden = Array.from({length:8}, (_, i) => ({x:50 + i * 32, cv:figuur((info.vrienden || [])[i], vt, klapBeeld)}));
  const vrij = [2, 3, 4, 5, 6, 7, 8, 11, 14, 17, 19, 21, 22].filter(n => String(n) !== nr);
  const ploeg = Array.from({length:5}, (_, i) => ({x:28 + i * 66, cv:figuur((info.team || [])[i], t, rugBeeld, {nr:String(vrij[KORREL(i + 7) % vrij.length])})}));
  // deel 2
  const kamer = inkleuren(muur(), pal), licht1 = inkleuren(kegel(), pal), ingelijst = inkleuren(lijst(achternaam, nr, t.patroon), pal);
  const bord = inkleuren(plaatje(info.naam || naam, info.club || ''), pal);
  const deeltjes = f => inkleuren(sprite(AW, AH, c => CONFETTI.forEach((p, i) => { const y = Math.round((p.y + f * p.v) % (AH + 4)) - 2, x = Math.round(p.x + Math.sin((f + p.fase) * .7) * 2); c.px(x, y, p.k); if ((f + i) % 2) c.px(x + 1, y, p.k); })), pal);

  // waar ben jij (x van je midden) in beeld f
  const jijX = f => f < A_MOMENT.zwaai ? -10 + f * 2.4 : f < A_MOMENT.verder ? -10 + A_MOMENT.zwaai * 2.4 : Math.min(-10 + A_MOMENT.zwaai * 2.4 + (f - A_MOMENT.verder) * 2.4, 240);
  const HANG = [-150, -118, -84, -52, -24, -4, 4, 1, -1, 0];
  const LX = (AW - LW) >> 1, LY = 16;

  function deel1(g, f){
    g.drawImage(achter[(f >> 1) % 2], 0, 0);
    for (const [cv, x, y, fase] of DOEKEN){ const op = (f + fase * 3) % 8 < 4 ? 0 : -2, zij = (f + fase) % 6 < 3 ? 0 : 1; g.drawImage(cv, x + zij, y + op); }
    // flitsen van camera's en telefoons op de tribune
    g.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++){ const k = KORREL(f * 7 + i); if (k % 3) continue; const x = k % AW, y = 18 + (k >> 9) % 74; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
    vrienden.forEach((m, i) => g.drawImage(m.cv[((f >> 1) + i) % 2], m.x - 23, ACHTER - 75));
    const x = Math.round(jijX(f));
    let cv;
    if (f >= A_MOMENT.armen) cv = armen[(f >> 1) % 2];
    else if (f >= A_MOMENT.zwaai && f < A_MOMENT.verder) cv = zwaai[(f >> 1) % 2];
    else cv = loop[f % 8];
    g.drawImage(cv, x - 36, JIJ - 75 - (f >= A_MOMENT.armen && (f >> 1) % 2 ? 2 : 0));
    ploeg.forEach((m, i) => g.drawImage(m.cv[((f >> 1) + i) % 2], m.x - 23, VOOR - 75));
    if (f >= A_MOMENT.armen - 6) g.drawImage(deeltjes(f), 0, 0);
    if (f >= A_MOMENT.donker){ g.fillStyle = `rgba(8,8,14,${Math.min(1, (f - A_MOMENT.donker + 1) / 9)})`; g.fillRect(0, 0, AW, AH); }
  }
  function deel2(g, f){
    const t2 = f - A_MOMENT.muur, aan = f >= A_MOMENT.spot;
    g.drawImage(kamer, 0, 0);
    if (aan){ g.globalAlpha = .16 + ((f >> 2) % 2) * .02; g.drawImage(licht1, 0, 0); g.globalAlpha = 1; }
    const h = f < A_MOMENT.hang ? HANG[0] : HANG[Math.min(HANG.length - 1, f - A_MOMENT.hang)], y = LY + h;
    // de spijker en de draad
    g.fillStyle = '#b58a25'; g.fillRect(159, 8, 2, 2);
    if (h > -40){ g.fillStyle = '#15161c'; for (let i = 0; i <= 16; i++){ const p = i / 16; g.fillRect(Math.round(160 + (LX + 8 - 160) * p), Math.round(9 + (y + 2 - 9) * p), 1, 1); g.fillRect(Math.round(160 + (LX + LW - 8 - 160) * p), Math.round(9 + (y + 2 - 9) * p), 1, 1); } }
    // schaduw achter de lijst, de lijst zelf
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(LX + 3, y + 4, LW, LH);
    g.drawImage(ingelijst, LX, y);
    // het glas glimt: een schuine baan licht die over de lijst schuift
    if (f >= A_MOMENT.glans){ const p = (f - A_MOMENT.glans) % A_LUS; if (p < 12){ g.save(); g.beginPath(); g.rect(LX + 9, y + 9, LW - 18, LH - 18); g.clip(); g.fillStyle = 'rgba(255,255,255,.28)';
      const gx = LX - 30 + p * 14; g.beginPath(); g.moveTo(gx, y + LH); g.lineTo(gx + 14, y + LH); g.lineTo(gx + 44, y); g.lineTo(gx + 30, y); g.closePath(); g.fill(); g.restore(); } }
    // het naambordje eronder
    if (aan) g.drawImage(bord, (AW - bord.width) >> 1, LY + LH + 6);
    // stofjes in het licht
    if (aan){ g.fillStyle = 'rgba(255,233,168,.7)'; for (const s of STOF){ const yy = Math.round(s.y + ((f + s.fase) % 24) * .5), xx = s.x + ((f + s.fase) >> 3) % 2; g.fillRect(xx, yy, 1, 1); } }
    else { g.fillStyle = 'rgba(8,8,14,.55)'; g.fillRect(0, 0, AW, AH); }
    if (t2 < 6){ g.fillStyle = `rgba(8,8,14,${1 - t2 / 6})`; g.fillRect(0, 0, AW, AH); }
  }
  const binnen = document.createElement('canvas'); binnen.width = AW; binnen.height = AH;
  const gb = binnen.getContext('2d'); gb.imageSmoothingEnabled = false;
  function teken(g, f){
    f = Math.max(0, Math.min(A_FRAMES - 1, f));
    gb.clearRect(0, 0, AW, AH);
    if (f < A_MOMENT.muur) deel1(gb, f); else deel2(gb, f);
    g.imageSmoothingEnabled = false;
    g.fillStyle = STIJL.k; g.fillRect(0, 0, AW + 2, AH + 2); g.drawImage(binnen, 1, 1);
  }
  return {w:AW + 2, h:AH + 2, frames:A_FRAMES, lus:A_FRAMES - A_LUS, teken};
}
