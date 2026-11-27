/* ===================== Trainingsanimaties: de gedeelde basis ===================== */
// Kies je in het weekoverzicht wat je deze week doet (game/week.js doeActiviteit), dan speelt er een korte pixelanimatie
// van die activiteit (render/trainingscene.js). Elke animatie staat in een van de bestanden naast dit bestand:
//   veld.js   de trainingen op het veld (afwerken, passen, dribbelen, verdedigen, conditie; voor een keeper zijn eigen oefeningen)
//   club.js   de rest bij de club (tactiek, extra trainen, de trainer, video, de talentcoach, de selectie, de fysio)
//   prive.js  herstel en privé (rustig aan, mentale training, uitgaan, huiswerk, media, een bijbaantje, school)
// Elk bestand exporteert ANIMATIES = {id: info => ({teken(g, f)})}. Het beeld is TW × TH pixels op T_FPS beelden per seconde,
// T_FRAMES beelden lang (ongeveer 3 seconden). teken(g, f) tekent beeld f (0 … T_FRAMES - 1) op een 2D-context g.
// info = {uit (jouw uiterlijk, pixel/uiterlijk.js), tenue (je clubtenue), keeper (true als je keeper bent), attr (bij 'train':
//   afw, pas, drib, verd of cond), id, club (naam), vrouw, leeftijd}.
// Gebruik de hulpjes hieronder: spelers (zet), achtergronden en kleuren. Alles in pixels, scherp (geen anti-aliasing).
import { Doek, Img, inkleuren, sprite } from '../rig.js';
import { donker, frame, frameOp, lookVan } from '../atlas.js';
import { regelBreedte, tekst, zonderAccent } from '../font.js';
export { Doek, Img, inkleuren, sprite, donker, frame, frameOp, lookVan, regelBreedte, tekst, zonderAccent };

export const TW = 220, TH = 124, T_FPS = 10, T_FRAMES = 32;
export const GY = 112; // de voeten op de grond

// Kleuren (sleutels van één teken, zoals overal in de pixelcode). '1' '2' '3' zijn de clubkleuren (shirt, donker, accent)
export const KLEUR = {K:'#0b1022', k:'#1a1414', b:'#3c4a6e', M:'#ffe9a8', w:'#ffffff', W:'#d4d4de', C:'#1d1f2c', c:'#2b2e3e', g:'#2f7d3f', G:'#378c48',
  s:'#f7c9a8', S:'#e3a07e', i:'#a8744f', I:'#6f4630', d:'#5a3a24', n:'#2a1f1c', h:'#b5541c', y:'#ffd21a', Y:'#e39a0c', r:'#e0262b', o:'#ffd84a',
  x:'#8f9bb0', X:'#6f7b90', q:'#9b7653', Q:'#5e3b26', v:'#2f62d6', V:'#1d3c8f', e:'#ff8a1c', E:'#c4600c', z:'#3a3a44', Z:'#24242c', m:'#c9d3e0', p:'#f19a8f'};
export const palet = tenue => { const t = tenue || {shirt:'#e0262b', accent:'#ffffff'}; return {...KLEUR, 1:t.shirt, 2:donker(t.shirt, .3), 3:t.accent || '#ffffff'}; };

// Jouw speler (en anderen): een look uit atlas.js. kleding: 'tenue' (op het veld), 'training' (trainingspak), 'casual', 'pak'
export const look = (uit, tenue, kleding = 'tenue', opties = {}) => lookVan(uit || {}, tenue, {...opties, kleding});
// Een speler tekenen. anim: een animatie uit pixel/animaties.js ('sta', 'loop', 'ren', 'renJuich', 'dribbel', 'schiet', 'kop',
// 'spring', 'duik', 'keeperKlaar', 'vang', 'juich', 'klap', 'sliding', 'steek', 'schouder', 'blok', 'jockey', 'zit', 'praat', 'wijs',
// 'kalm', 'kniel', 'lach', 'wuif', 'volley', 'spreid', 'robot', 'heupwieg', 'kracht', …). i = het beeld van die animatie
// (frameOp(anim, seconden) rekent dat voor je uit). x = het midden van de speler, y = waar zijn voeten staan, s = schaal (1 = normaal)
export function zet(g, lk, anim, i, x, {flip = false, s = 1, y = GY} = {}){
  const cv = frame(lk, anim, i, flip);
  g.drawImage(cv, Math.round(x - (flip ? 50 : 47) * s), Math.round(y - 75 * s), Math.round(cv.width * s), Math.round(cv.height * s));
}
// Een bal (pixel) op (x, y) = het midden, op de grond: y = GY - 3
export function bal(g, x, y, r = 3){ g.fillStyle = '#ffffff'; g.fillRect(Math.round(x - r), Math.round(y - r + 1), r * 2, r * 2 - 2); g.fillRect(Math.round(x - r + 1), Math.round(y - r), r * 2 - 2, r * 2);
  g.fillStyle = '#1a1414'; g.fillRect(Math.round(x - 1), Math.round(y - 1), 2, 2); }
// Een pion (kegel) op de grond
export function pion(g, x, kleur = '#ff8a1c'){ g.fillStyle = kleur; for (let i = 0; i < 6; i++) g.fillRect(Math.round(x - Math.floor(i / 2) - 1), GY - 6 + i, Math.floor(i / 2) * 2 + 2, 1); g.fillStyle = '#ffffff'; g.fillRect(Math.round(x - 1), GY - 4, 2, 1); }
// Snelle tekst op het beeld (de tekst wordt in het Engels vertaald als dat in core/taal.js PIXEL staat)
export function opschrift(g, x, y, t, kleur = '#ffffff', {schaal = 1, midden = true} = {}){
  const cv = inkleuren(sprite(Math.max(8, regelBreedte(String(t)) * schaal + 4), 7 * schaal + 2, c => tekst(c, 1, 1, String(t), 'w', {scale:schaal})), {w:kleur});
  g.drawImage(cv, Math.round(midden ? x - cv.width / 2 : x), Math.round(y));
}

// ---------- achtergronden (één keer maken, dan steeds tekenen met g.drawImage) ----------
// Het trainingsveld van de club: een lucht, een hek met reclame, gras met lijnen
export function trainingsveld(tenue, naam = ''){
  return inkleuren(sprite(TW, TH, c => {
    c.rect(0, 0, TW, 40, 'x'); for (let i = 0; i < 5; i++) c.rect((i * 47 + 12) % TW, 6 + (i * 9) % 20, 26, 4, 'm');      // lucht met wolken
    c.rect(0, 34, TW, 14, 'X'); for (let x = 0; x < TW; x += 9) c.rect(x, 36, 6, 10, 'W');                                  // bomen/gebouw in de verte en het hek
    c.rect(0, 46, TW, 6, '1'); if (naam) tekst(c, TW / 2, 47, zonderAccent(naam).slice(0, 26).toUpperCase(), '3', {align:'c'}); // een doek in de clubkleuren
    let y = 52, h = 4, i = 0; while (y < TH){ c.rect(0, y, TW, h, i % 2 ? 'G' : 'g'); y += h; h += 2; i++; }
    c.hline(0, 70, TW, 'w');
  }), palet(tenue));
}
// Een ruimte binnen (kleedkamer, videoruimte, kamer): een muur, een plint en een vloer. muur/vloer: kleursleutels
export function kamer(tenue, {muur = 'c', vloer = 'q', plint = 'Q'} = {}){
  return inkleuren(sprite(TW, TH, c => {
    c.rect(0, 0, TW, 92, muur); c.rect(0, 92, TW, 4, plint);
    c.rect(0, 96, TW, TH - 96, vloer); for (let x = 0; x < TW; x += 22) c.vline(x, 96, TH - 96, plint);
  }), palet(tenue));
}

// Een simpele animatie als voorbeeld én als reserve (een activiteit zonder eigen animatie): je staat op het trainingsveld en juicht
export function reserve(info){
  const bg = trainingsveld(info.tenue, info.club), ik = look(info.uit, info.tenue, 'tenue');
  return {teken(g, f){ g.drawImage(bg, 0, 0); zet(g, ik, f < 12 ? 'sta' : 'juich', frameOp(f < 12 ? 'sta' : 'juich', (f % 12) / T_FPS), TW / 2); }};
}
