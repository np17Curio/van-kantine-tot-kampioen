/* ===================== Je speler aanmaken: een levende pixelspeler ===================== */
// Op het aanmaakscherm (views/start.js: canvas#pixelVoorbeeld) staat je speler in een klein pixelstadion en laat hij een
// korte showreel zien: stilstaan, dribbelen, schieten, juichen. Elke keuze (huid, haar, kapsel, jongen of meisje, lengte,
// bouw) zie je meteen terug, met dezelfde rig als op het veld (pixel/rig.js). Geen three.js.
import { STANDAARD } from '../../data/tenues.js';
import { BAL_VOOR, ANKER_X } from './animaties.js';
import { frame, frameOp, lookVan } from './atlas.js';
import { BAL, GROND, inkleuren } from './rig.js';
import { uiterlijkVoor } from './uiterlijk.js';

const BW = 160, BH = 200, VLOER = 172; // het interne beeld (pixels) en waar de voeten staan
// [animatie, duur in seconden, wat eronder staat]
const REEL = [['sta', 1.6, 'klaar voor de aftrap'], ['ren', 1.4, 'rent opzij'], ['ren_voor', 1.4, 'rent naar je toe'], ['ren_achter', 1.4, 'rent van je af'],
  ['dribbel', 1.4, 'dribbelt'], ['schiet', .8, 'schiet'], ['juich', 1.4, 'juicht']];
const REEL_DUUR = REEL.reduce((s, [, d]) => s + d, 0);
let LUS = null, ACHTER = null, BALCV = null;

// Het stadion achter je speler: avondlucht, tribune vol lichtjes en een grasmat met banen (één keer getekend)
function achtergrond(){
  if (ACHTER) return ACHTER;
  const c = document.createElement('canvas'); c.width = BW; c.height = BH; const g = c.getContext('2d');
  const lucht = ['#0b1020', '#0e1428', '#111a33', '#15203d'];
  lucht.forEach((k, i) => { g.fillStyle = k; g.fillRect(0, i * 16, BW, 16); });
  g.fillStyle = '#1a2238'; g.fillRect(0, 64, BW, 70);                         // de tribune
  const kl = ['#c6f432', '#e8ecf5', '#38bdf8', '#e05252', '#8c97b0', '#f5c84c'];
  let h = 7; const d = n => { h = (h * 1103515245 + 12345) >>> 0; return (h >>> 8) % n; };
  for (let i = 0; i < 520; i++){ g.fillStyle = kl[d(kl.length)]; g.globalAlpha = .35 + d(5) / 10; g.fillRect(d(BW), 66 + d(64), 1, 1); }
  g.globalAlpha = 1;
  g.fillStyle = '#10172a'; g.fillRect(0, 58, BW, 6);                          // de dakrand
  for (const x of [18, 142]){ g.fillStyle = '#2a3654'; g.fillRect(x, 8, 2, 50); g.fillStyle = '#fff6d8'; g.fillRect(x - 5, 4, 12, 5); } // lichtmasten
  g.fillStyle = '#172036'; g.fillRect(0, 130, BW, 6);                         // reclameborden
  for (let x = 0; x < BW; x += 20){ g.fillStyle = (x / 20) % 2 ? '#c6f432' : '#38bdf8'; g.fillRect(x + 3, 132, 12, 2); }
  for (let x = 0; x < BW; x += 16){ g.fillStyle = (x / 16) % 2 ? '#2f7d3f' : '#378c48'; g.fillRect(x, 136, 16, BH - 136); } // gras met banen
  g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(0, 142, BW, 1);           // de zijlijn
  return (ACHTER = c);
}

// Welk stuk van de showreel op tijd t (seconden)
function moment(t){
  let r = t % REEL_DUUR;
  for (const [naam, duur, tekst] of REEL){ if (r < duur) return {naam, t:r, tekst}; r -= duur; }
  return {naam:'sta', t:0, tekst:''};
}

export function voorbeeldNaRender(){
  const cv = document.getElementById('pixelVoorbeeld');
  if (LUS){ cancelAnimationFrame(LUS); LUS = null; }
  if (!cv) return;
  // het uiterlijk zoals op het veld: lengte en bmi worden de factoren lengte en bouw
  const [huid, haar, kapsel, lengte, bmi, vrouw] = (cv.dataset.uit || '').split(',');
  const eigen = {huid:+huid, haar:+haar, kapsel, lengte:+lengte || undefined, bmi:+bmi || undefined, vrouw:vrouw === '1'};
  const look = lookVan(uiterlijkVoor('jij|' + (cv.dataset.sleutel || 'x'), eigen), STANDAARD);
  cv.width = BW; cv.height = BH;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  if (!BALCV) BALCV = inkleuren(BAL);
  const sx = 2 * (look.bouw || 1), sy = 2 * (look.lengte || 1), label = cv.parentElement && cv.parentElement.querySelector('.reellabel');
  const teken = nu => {
    if (!cv.isConnected){ LUS = null; return; }
    const {naam, t, tekst} = moment(nu / 1000), i = frameOp(naam, t), f = frame(look, naam, i, false);
    if (label && label.textContent !== tekst) label.textContent = tekst;
    g.drawImage(achtergrond(), 0, 0);
    // schaduw onder de voeten
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(BW / 2 - 18, VLOER - 1, 36, 3); g.fillRect(BW / 2 - 13, VLOER - 2, 26, 5);
    // de speler: het ankerpunt (heup boven de voeten) midden in beeld, de voeten op de vloer
    const ax = ANKER_X + 1, ay = GROND + 1, x0 = BW / 2 - ax * sx, y0 = VLOER - ay * sy;
    g.drawImage(f, x0, y0, f.width * sx, f.height * sy);
    // de bal: aan de voet bij het dribbelen, vóór de voet bij het schieten en daarna weg
    let b = null;
    if (naam === 'dribbel') b = [ax + BAL_VOOR[i], ay - 6];
    else if (naam === 'schiet') b = i < 4 ? [ax + 13, ay - 6] : [ax + 13 + (i - 3) * 22, ay - 6 - (i - 3) * 9];
    if (b) g.drawImage(BALCV, x0 + (b[0] - 5) * sx, y0 + (b[1] - 5) * sy, BALCV.width * 2, BALCV.height * 2);
    LUS = requestAnimationFrame(teken);
  };
  LUS = requestAnimationFrame(teken);
}
