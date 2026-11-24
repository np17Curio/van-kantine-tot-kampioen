import { vertaalPixel } from '../../core/taal.js';
/* ===================== De spelersbus komt aan, en omkleden in de kleedkamer ===================== */
// Voor de grote wedstrijden (derby's en finales), in de stijl van de andere pixelscènes: langs de gevel van het stadion staan de
// fans achter een hek met sjaals in de clubkleuren, de spelersbus (in de clubkleuren, met de clubnaam op de zijkant) rijdt het
// beeld in en stopt voor de ingang. De deur gaat open en de spelers stappen één voor één uit, in het trainingspak, en lopen naar
// binnen; jij krijgt een pijltje boven je hoofd. Fotografen flitsen. Dan de kleedkamer: de shirts hangen aan de haken (met naam
// en nummer), en iedereen kleedt zich om, van trainingspak naar wedstrijdtenue (het shirt over je hoofd). Tot slot de vuisten omhoog.
// 205 beelden van 220×124 op 10 fps.
import { Doek, GROND, Img, inkleuren, speler, sprite } from './rig.js';
import { donker, lookVan } from './atlas.js';
import { loopCyclus } from './animaties.js';
import { tekst, zonderAccent } from './font.js';

export const BW = 220, BH = 124, B_FPS = 10, B_FRAMES = 205;
// Belangrijke beelden (voor de teksten en flitsen in busscene.js)
export const B_MOMENT = {stop:36, deur:42, uit:48, jij:72, binnen:122, zwart:128, kleed:136, omkleden:144, jijOm:176, klaar:186};
const VOET = 112, BUS_STOP = -136, DEUR_X = 98, INGANG_X = 198, UIT_TUSSEN = 12, KLEED_X = [34, 70, 106, 142, 178], JIJ_PLEK = 2;
const K = s => s.charCodeAt(0);
const KORREL = n => { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; return (h ^ (h >>> 13)) >>> 0; };

// ---------- kleuren (1/2/3: de clubkleuren; L en 4: de lucht; 5-7: huidskleuren van de fans) ----------
const STIJL = {k:'#1a1414', K:'#0b1022', w:'#ffffff', W:'#cfd3dc', g:'#5b616e', G:'#3d424d', b:'#9fb4c8', B:'#6c8197', c:'#2b2e3e', C:'#1d1f2c',
  s:'#c8b8a0', S:'#a8977f', t:'#8a6a4a', T:'#6b5038', y:'#ffd21a', Y:'#e39a0c', o:'#ffd84a', r:'#e0262b', v:'#7fa6c4', V:'#4f6f8c', z:'#26262e', l:'#fff6b0'};
const LUCHT = {zon:['#78b4ea', '#a9d2f5'], bewolkt:['#8a96a6', '#a7b1be'], regen:['#525d6b', '#6b7684'], sneeuw:['#a3abb5', '#c3c9d1'], geen:['#2a3556', '#3c4a6e']};

// ---------- buiten: de gevel van het stadion en de stoep ----------
function buiten(naam){
  return sprite(BW, BH, c => {
    c.rect(0, 0, BW, 40, 'L'); c.rect(0, 26, BW, 14, '4');                                                    // lucht (twee banden)
    // de gevel: een grote wand met ramen, een band in de clubkleur met de naam van de club, rechts de spelersingang
    c.rect(0, 30, BW, 72, 'g'); c.rect(0, 30, BW, 3, 'G'); c.rect(0, 98, BW, 4, 'G');
    for (let x = 6; x < BW - 30; x += 22){ c.rect(x, 44, 14, 22, 'G'); c.rect(x + 2, 46, 10, 20, 'c'); c.rect(x + 2, 46, 10, 2, 'C'); }
    c.rect(0, 36, BW, 6, '1'); c.rect(0, 41, BW, 1, '2');
    tekst(c, 92, 37, naam.slice(0, 20), '3', {align:'c'});
    c.rect(INGANG_X - 8, 60, 26, 42, 'C'); c.rect(INGANG_X - 6, 62, 22, 40, 'K'); c.rect(INGANG_X - 8, 56, 26, 4, '1');
    tekst(c, INGANG_X + 5, 57, 'SPELERS', 'w', {align:'c'});
    c.rect(0, 102, BW, BH - 102, 's'); for (let x = 0; x < BW; x += 12) c.vline(x, 103, BH - 103, 'S');       // stoep met tegels
    c.rect(0, 116, BW, 8, 'S');
  });
}
// de fans achter het dranghek langs de gevel: koppen, shirts en sjaals in de clubkleuren
function fansVak(){
  return sprite(BW, 30, c => {
    for (let i = 0; i < 26; i++){
      const x = 4 + i * 8 + (KORREL(i) % 3), y = 8 + (KORREL(i + 30) % 4), huid = ['5', '6', '7'][KORREL(i + 7) % 3];
      c.rect(x, y, 6, 6, huid); c.rect(x, y - 1, 6, 2, KORREL(i + 3) % 2 ? 'n' : 'N');
      c.rect(x - 1, y + 6, 8, 10, KORREL(i + 11) % 3 ? '1' : '3');
      c.rect(x - 1, y + 6, 8, 2, KORREL(i + 5) % 2 ? '3' : '2');
      if (KORREL(i + 21) % 3 === 0) c.rect(x + (KORREL(i) % 2 ? -2 : 7), y - 4, 2, 8, huid);                     // een arm omhoog
    }
    c.rect(0, 20, BW, 2, 'W'); for (let x = 0; x < BW; x += 6) c.vline(x, 20, 10, 'W'); c.rect(0, 28, BW, 2, 'W');
  });
}
// de spelersbus van opzij (neus naar rechts), veel groter dan een speler (BS keer de basismaat), in de clubkleuren met de naam erop
const BS = 1.45;
function busSprite(naam, deurOpen){
  const r = v => Math.round(v * BS);
  return sprite(r(200), r(74), c => {
    const R = (x, y, w, h, k) => c.rect(r(x), r(y), Math.max(1, r(w)), Math.max(1, r(h)), k);
    R(2, 4, 190, 58, '1'); R(2, 56, 190, 6, '2'); c.poly([r(182), r(4), r(196), r(14), r(196), r(62), r(182), r(62)], '1');
    R(2, 4, 190, 3, '2');
    R(6, 11, 140, 20, 'v'); for (let x = 6; x < 146; x += 18){ c.rect(r(x), r(11), 1, r(20), 'V'); c.rect(r(x) + 2, r(12), r(6), 1, 'W'); } // (de ramen stoppen voor de deur)
    c.poly([r(170), r(11), r(186), r(11), r(195), r(22), r(195), r(34), r(170), r(34)], 'v'); c.line(r(174), r(13), r(184), r(22), 'W');
    R(2, 36, 190, 4, '3'); tekst(c, r(90), r(42), naam.slice(0, 22), '3', {align:'c', scale:2});
    R(2, 53, 190, 2, '3');
    // de deur: over de hele hoogte (groter dan een speler), net achter de voorruit, met twee glazen panelen en een opstapje
    R(148, 9, 22, 54, 'K');                                                                    // de deuropening met een zwarte rand
    if (deurOpen){ R(150, 11, 18, 51, 'c'); R(150, 11, 18, 3, 'C'); R(146, 11, 3, 51, 'W'); R(149, 58, 20, 3, 'G'); R(151, 61, 16, 2, 'W'); } // open: het donkere interieur, de deur opzij geklapt
    else { R(150, 11, 18, 51, '2'); c.rect(r(159), r(11), 1, r(51), 'K'); R(151, 13, 7, 26, 'v'); R(160, 13, 7, 26, 'v'); R(151, 42, 7, 18, '2'); R(160, 42, 7, 18, '2'); R(152, 14, 2, 10, 'W'); }
    R(192, 46, 4, 5, 'l'); R(2, 46, 3, 6, 'r');
    for (const x of [34, 128]){ c.circ(r(x), r(64), r(9), 'z'); c.circ(r(x), r(64), r(4), 'W'); c.circ(r(x), r(64), 1, 'z'); }
  }).outline(K('k'));
}
// een sporttas in de clubkleuren (met twee hengsels, een streep en een logootje); hij hangt aan de hand
const TAS = sprite(15, 11, c => { c.line(4, 0, 4, 3, 'k'); c.line(10, 0, 10, 3, 'k'); c.hline(4, 0, 7, 'k');
  c.rect(0, 3, 15, 8, '1'); c.rect(0, 9, 15, 2, '2'); c.rect(0, 5, 15, 1, '3'); c.rect(6, 6, 3, 2, '3'); }).outline(K('k'));
// ---------- binnen: de kleedkamer ----------
function kleedkamer(){
  return sprite(BW, BH, c => {
    c.rect(0, 0, BW, BH, 'b'); c.rect(0, 0, BW, 6, 'B'); for (let y = 10; y < 84; y += 8) c.hline(0, y, BW, 'B');
    c.rect(0, 84, BW, 6, 't'); c.rect(0, 90, BW, 4, 'T');
    for (let x = 4; x < BW; x += 36) c.rect(x, 90, 4, 12, 'T');
    c.rect(0, 102, BW, BH - 102, 'g'); for (let x = 0; x < BW; x += 10) c.vline(x, 102, BH - 102, 'G');
    c.rect(196, 14, 20, 16, 'W'); c.rect(198, 16, 16, 12, 'w'); c.line(200, 20, 210, 24, 'r'); c.px(204, 18, 'K'); c.px(208, 25, 'K');
    for (const x of KLEED_X) c.rect(x - 1, 30, 3, 3, 'Y');
  });
}
// een shirt aan de haak (van achteren: naam en nummer), in de clubkleuren
function shirtAanHaak(nr, naam){
  return sprite(22, 22, c => {
    c.poly([4, 0, 17, 0, 22, 6, 18, 9, 17, 6, 17, 22, 4, 22, 4, 6, 3, 9, 0, 6], '1'); c.rect(8, 0, 6, 1, '2');
    const nm = zonderAccent(naam || '').toUpperCase().split(/\s+/).pop().slice(0, 4); if (nm) tekst(c, 11, 3, nm, '3', {align:'c'});
    if (nr) tekst(c, 11, 11, String(nr).slice(0, 2), '3', {align:'c'});
  }).outline(K('k'));
}

// ---------- de figuren ----------
const POSE = {
  staan:{x:35, lL:[-4, 4], lR:[4, 4], aL:[-8, 10], aR:[8, 10]},
  over:{x:35, lL:[-4, 4], lR:[4, 4], aL:[-160, 30], aR:[160, -30]},                 // het shirt over je hoofd trekken
  vuist:{x:35, lL:[-4, 4], lR:[4, 4], aL:[-150, 10], aR:[150, -10]},
};
const LOOP = loopCyclus(35); LOOP.forEach((p, k) => { POSE['l' + k] = {...p, zij:true}; });
function figuur(look){
  const v = {kapsel:look.kapsel, vrouw:look.vrouw, baard:look.baard, kleding:look.kleding, patroon:look.patroon, nr:look.rugnummer, rugnaam:look.rugnaam}, cache = new Map();
  // (geeft het plaatje en de plek van de voorste hand: daar hangt de tas aan)
  return naam => {
    let r = cache.get(naam); if (r) return r;
    const img = new Img(70, 90), c = new Doek(img), [hx, hy] = speler(c, POSE[naam], v);
    r = {cv:inkleuren(img.outline(K('k')), look.kleuren), hand:[hx + 1, hy + 1]}; cache.set(naam, r); return r;
  };
}
const zet = (g, fig, x, voet = VOET) => g.drawImage(fig.cv, Math.round(x) - 36, voet - GROND - 1);
const metTas = (g, fig, x, voet, tas) => { zet(g, fig, x, voet); g.drawImage(tas, Math.round(x) - 36 + fig.hand[0] - 7, voet - GROND - 1 + fig.hand[1] - 1); }; // (de tas aan de hand)
const PIJL = sprite(9, 7, c => { c.poly([0, 0, 9, 0, 4.5, 6], 'y'); }).outline(K('k'));

// info = {naam (jouw naam), nr, uit (jouw uiterlijk), maten: [uiterlijk × 4], namen: [5 namen, de jouwe leeg], tenue (het clubtenue),
//   club (naam), tegen (naam), soort ('derby'|'finale'), weer ('zon'|'bewolkt'|'regen'|'sneeuw')}
// Geeft {teken(g, f): beeld f op een context van (BW+2)×(BH+2), flitsen(f), W, H, frames}
export function maakBus(info = {}){
  const t = info.tenue || {shirt:'#e0262b', accent:'#ffffff', patroon:'strepen', broek:'#16171c', sok:'#e0262b'};
  const [l1, l2] = LUCHT[info.weer] || LUCHT.geen;
  const pal = {...STIJL, 1:t.shirt, 2:donker(t.shirt, .3), 3:t.accent || '#ffffff', L:l1, 4:l2, 5:'#f1c7a5', 6:'#c98d62', 7:'#7a4a2e', n:'#2a1f1c', N:'#8a5a2b'};
  const club = zonderAccent(info.club || 'FC'), tegen = zonderAccent(info.tegen || '');
  const achterBuiten = inkleuren(buiten(club), pal), fans = inkleuren(fansVak(), pal), binnenCv = inkleuren(kleedkamer(), pal);
  const bus = [inkleuren(busSprite(club, false), pal), inkleuren(busSprite(club, true), pal)];
  const pijl = inkleuren(PIJL, STIJL), tas = inkleuren(TAS, pal);
  // de spelers: in het trainingspak van de club, en later in het tenue (jij met je eigen naam en nummer)
  const trainingT = {...t, broek:'#262b36', sok:'#262b36'};
  const team = [...(info.maten || []).slice(0, 4)]; while (team.length < 4) team.push({}); team.splice(JIJ_PLEK, 0, info.uit || {});
  const nrs = team.map((_, i) => i === JIJ_PLEK ? info.nr || '' : [1, 4, 8, 9, 10, 7][i] || 5 + i);
  const namen = team.map((_, i) => i === JIJ_PLEK ? (info.naam || '') : (info.namen || [])[i] || '');
  const pak = team.map(u => figuur(lookVan(u, trainingT, {kleding:'training'})));
  const tenue = team.map((u, i) => figuur(lookVan(u, t, {rugnummer:nrs[i], rugnaam:namen[i]})));
  const shirts = team.map((_, i) => inkleuren(shirtAanHaak(nrs[i], namen[i]), pal));
  const titel = zonderAccent(`${vertaalPixel(info.soort === 'finale' ? 'FINALE' : 'DERBY')}  ${club} - ${tegen}`); // (het woord vertaald, de clubnamen niet)
  const titelCv = inkleuren(sprite(BW, 11, c => { c.rect(0, 0, BW, 11, 'K'); c.hline(0, 10, BW, '1'); tekst(c, BW / 2, 3, titel.slice(0, 40), 'w', {align:'c'}); }), pal);
  const flits = inkleuren(sprite(9, 9, c => { c.line(4, 0, 4, 8, 'w'); c.line(0, 4, 8, 4, 'w'); c.rect(3, 3, 3, 3, 'w'); c.px(4, 4, 'y'); }), STIJL);
  const M = B_MOMENT, weer = info.weer;
  const uitstap = i => M.uit + i * UIT_TUSSEN;              // wanneer speler i uit de bus stapt (met ruimte ertussen)
  const omkleed = i => i === JIJ_PLEK ? M.jijOm : M.omkleden + i * 6 + (i > JIJ_PLEK ? -6 : 0);
  function teken(g, f){
    g.clearRect(0, 0, BW + 2, BH + 2); g.fillStyle = STIJL.k; g.fillRect(1, 0, BW, BH + 2); g.fillRect(0, 1, BW + 2, BH);
    const b = g; b.save(); b.translate(1, 1); b.imageSmoothingEnabled = false;
    if (f < M.zwart){
      b.drawImage(achterBuiten, 0, 0);
      b.drawImage(fans, 0, 74);                                                          // de fans achter het hek langs de gevel
      // de bus rijdt binnen en remt af
      const bw = bus[0].width, p = Math.min(1, f / M.stop), bx = -bw - 10 + (BUS_STOP + bw + 10) * (1 - (1 - p) * (1 - p)), bob = f < M.stop && f % 4 < 2 ? 1 : 0;
      b.drawImage(bus[f >= M.deur ? 1 : 0], Math.round(bx), VOET + 4 - bus[0].height + bob);
      // de spelers stappen uit en lopen naar de ingang
      team.forEach((_, i) => {
        const a = f - uitstap(i); if (a < 0) return;
        const x = DEUR_X + a * 2.4; if (x > INGANG_X + 4) return;
        metTas(b, pak[i]('l' + (a % 8)), x, VOET + 2, tas);
        if (i === JIJ_PLEK) b.drawImage(pijl, Math.round(x) - 4, VOET - 74 + (f % 6 < 3 ? 0 : 1));
      });
      // fotografen flitsen als de spelers uitstappen
      if (f >= M.uit && f < M.binnen) for (let k = 0; k < 2; k++){ const h = KORREL(f * 13 + k); if (h % 4 === 0) b.drawImage(flits, 10 + h % 180, 52 + (h >> 9) % 30); }
      // het weer: regen of sneeuw
      if (weer === 'regen'){ b.fillStyle = 'rgba(220,230,245,.55)'; for (let k = 0; k < 70; k++){ const h = KORREL(k + 500), x = (h % BW + f * 3) % BW, y = ((h >> 8) % BH + f * 9) % BH; b.fillRect(x, y, 1, 4); } }
      if (weer === 'sneeuw'){ b.fillStyle = '#ffffff'; for (let k = 0; k < 60; k++){ const h = KORREL(k + 900), x = (h % BW + Math.round(Math.sin((f + k) * .2) * 2) + BW) % BW, y = ((h >> 8) % BH + f * 1.5) % BH; b.fillRect(Math.round(x), Math.round(y), 2, 2); } }
      if (f < M.binnen) b.drawImage(titelCv, 0, 0);
      if (f >= M.binnen){ b.fillStyle = `rgba(11,16,34,${Math.min(1, (f - M.binnen) / (M.zwart - M.binnen))})`; b.fillRect(0, 0, BW, BH); } // naar zwart
    } else {
      b.drawImage(binnenCv, 0, 0);
      team.forEach((_, i) => {
        const x = KLEED_X[i], a = f - omkleed(i);
        if (a < 0) b.drawImage(shirts[i], x - 11, 34);                                  // het shirt hangt nog aan de haak
        // trainingspak → shirt over het hoofd (4 beelden) → tenue; aan het eind de vuisten omhoog
        const kl = a < 0 ? pak[i]('staan') : a < 4 ? pak[i]('over') : f >= M.klaar && (f + i) % 6 < 4 ? tenue[i]('vuist') : tenue[i]('staan');
        b.drawImage(tas, x + 8, VOET - 11);                                               // de tas staat naast hem op de grond
        zet(b, kl, x, VOET);
        if (i === JIJ_PLEK && f < M.klaar) b.drawImage(pijl, x - 4, VOET - 74 + (f % 6 < 3 ? 0 : 1));
      });
      if (f < M.kleed){ b.fillStyle = `rgba(11,16,34,${1 - (f - M.zwart) / (M.kleed - M.zwart)})`; b.fillRect(0, 0, BW, BH); }
    }
    b.restore();
  }
  const flitsen = f => f === M.stop + 1 || f === M.jij + 4 || f === M.klaar;
  return {teken, flitsen, W:BW + 2, H:BH + 2, frames:B_FRAMES};
}
