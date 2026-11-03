import { vrouwenWereld } from '../core/geslacht.js';

/* ===================== Bewegingsinstellingen ===================== */
// Eén bron voor elk bewegingsgetal van de 3D-spelers (veld3d.js en beweging.js lezen ze via bw()).
// De bewegingseditor (views/beweging.js) bouwt zijn schuifjes uit dit schema. De standaardwaarden zijn de getallen
// waarmee het spel altijd al speelde. Er zijn twee profielen: de mannen en de vrouwen (de wereld waarin je speelt).
const P = (key, label, def, min, max, step, unit = '', help = '') => ({key, label, def, min, max, step, unit, help});
export const BEWEGING_SCHEMA = [
  {groep:'Looppas', items:[
    P('pasBasis', 'Paslengte basis', .75, .4, 1.4, .01, 'm', 'Halve cyclus (één stap) bij stilstand. Groter = langere, tragere passen.'),
    P('pasPerSnelheid', 'Paslengte per m/s', .055, 0, .15, .005, 's', 'Hoeveel langer een stap wordt per m/s. Kleiner = snellere, kortere pasjes.'),
    P('sprintVanaf', 'Volle looppas vanaf', 7, 3, 10, .1, 'm/s', 'Bij deze snelheid zwaaien armen en benen het verst.'),
    P('dijZwaai', 'Bovenbeen zwaaien', 1.05, .3, 1.6, .01, 'rad'),
    P('knieZwaai', 'Knie in de zwaaifase', 1.6, .4, 2.4, .01, 'rad', 'Hoe ver de hiel naar de bil komt.'),
    P('knieStand', 'Knie in de standfase', .25, 0, .8, .01, 'rad'),
    P('knieRust', 'Knie in rust', .08, 0, .4, .01, 'rad'),
    P('opEnNeer', 'Op en neer bij rennen', .08, 0, .25, .005, 'm'),
    P('draaiLoop', 'Draaien tijdens lopen', 10, 2, 20, .5, '/s', 'Hoe snel hij de looprichting volgt.'),
    P('draaiStil', 'Draaien in stilstand', 4, 1, 12, .5, '/s', 'Hoe snel hij naar de bal draait.'),
  ]},
  {groep:'Armen', items:[
    P('armZwaai', 'Armzwaai', 1.2, 0, 2, .01, 'rad'),
    P('armOpzij', 'Armen opzij', .14, 0, .6, .01, 'rad'),
    P('armOpzijSprint', 'Extra opzij bij rennen', .1, 0, .5, .01, 'rad'),
    P('elleboogRust', 'Elleboog in rust', .3, 0, 1.2, .01, 'rad'),
    P('elleboogSprint', 'Extra elleboog bij rennen', 1.25, 0, 2, .01, 'rad'),
    P('ademen', 'Ademen in stilstand', .03, 0, .15, .005, 'rad'),
  ]},
  {groep:'Romp', items:[
    P('leunSprint', 'Voorover bij rennen', .12, -.1, .5, .01, 'rad'),
    P('leunAccel', 'Leunen bij versnellen', .03, 0, .1, .005, '', 'Voorover bij optrekken, achterover bij afremmen.'),
    P('leunBocht', 'In de bocht leunen', .015, 0, .05, .001, ''),
    P('bekkenDraai', 'Bekken draait mee', .35, 0, .8, .01, 'rad', 'Het bekken draait mee met het voorste been.'),
    P('bekkenWieg', 'Bekken wiegen', .1, 0, .4, .01, 'rad'),
    P('schouderTegen', 'Schouders tegen de heupen in', .45, 0, 1, .01, 'rad'),
    P('rugVoorover', 'Rug voorover', .25, -.2, .7, .01, 'rad'),
  ]},
  {groep:'Veren', items:[
    P('veerBenen', 'Stijfheid benen', 900, 100, 2500, 10, '', 'Hoger = de benen volgen strakker (lager: ze lopen achter).'),
    P('veerArmen', 'Stijfheid armen', 240, 40, 1200, 10, '', 'Lager = de armen zwaaien losser na.'),
    P('veerEllebogen', 'Stijfheid ellebogen', 280, 40, 1200, 10),
    P('veerRomp', 'Stijfheid romp', 200, 40, 1200, 10),
    P('demping', 'Demping', .6, .2, 1.5, .01, '', 'Onder 1: een beetje doorschieten, zoals een lichaam. Boven 1: geen uitzwaai.'),
  ]},
  {groep:'Schot', items:[
    P('schotUithalen', 'Uithalen', 1.05, .3, 1.8, .01, 'rad'),
    P('schotDoortrap', 'Door de bal', 2.7, 1, 4, .05, 'rad'),
    P('schotUitzwaai', 'Uitzwaaien', 1.65, .5, 2.6, .01, 'rad'),
    P('schotKnie', 'Knie bij het uithalen', 1.5, .5, 2.3, .01, 'rad'),
    P('schotHard', 'Kracht hard schot', 1.4, 1, 2, .05, '×'),
    P('schotChip', 'Kracht chip', .6, .3, 1, .05, '×'),
    P('schotBinnen', 'Kracht binnenkant', .8, .4, 1.2, .05, '×'),
    P('schotLeun', 'Achterover bij uithalen', .14, 0, .4, .01, 'rad'),
    P('standbeen', 'Standbeen buigen', .3, 0, .8, .01, 'rad'),
    P('schotHeup', 'Heupdraai', .5, 0, 1, .01, 'rad'),
  ]},
  {groep:'Hoofd en voeten', items:[
    P('hoofdSnelheid', 'Hoofd draait naar de bal', 6, 1, 15, .5, '/s'),
    P('hoofdMax', 'Hoofd maximaal opzij', .9, 0, 1.4, .01, 'rad'),
    P('voetAfzet', 'Tenen omlaag bij afzetten', .55, 0, 1.2, .01, 'rad'),
  ]},
];
export const STANDAARD = Object.fromEntries(BEWEGING_SCHEMA.flatMap(g => g.items.map(i => [i.key, i.def])));
export const PROFIELEN = {m:'Mannen', v:'Vrouwen'};

/* ---------- opslaan en laden ---------- */
// Opgeslagen of geïmporteerde data vertrouwen we niet blind: alles wordt begrensd en aangevuld met de standaard
export const OPSLAG = 'hgd-beweging-v1';
const ITEMS = BEWEGING_SCHEMA.flatMap(g => g.items);
export function sanitize(data){
  const uit = {versie:1, profielen:{}};
  for (const p in PROFIELEN){
    const src = data && data.profielen && data.profielen[p], w = {};
    for (const it of ITEMS){
      const ruw = src ? src[it.key] : undefined, n = Number(ruw);
      w[it.key] = ruw !== null && ruw !== '' && ruw !== undefined && Number.isFinite(n) ? Math.min(it.max, Math.max(it.min, n)) : it.def;
    }
    uit.profielen[p] = w;
  }
  return uit;
}
// Hoeveel waarden bij een import gecorrigeerd zijn (buiten bereik of ongeldig) en hoeveel ontbraken
export function telImport(ruw, schoon){
  let fout = 0, mist = 0;
  for (const p in PROFIELEN) for (const it of ITEMS){
    const src = ruw && ruw.profielen && ruw.profielen[p];
    if (!src || !(it.key in src)) mist++; else if (Number(src[it.key]) !== schoon.profielen[p][it.key]) fout++;
  }
  return {fout, mist};
}
function laad(){
  try { const s = localStorage.getItem(OPSLAG); return sanitize(s ? JSON.parse(s) : null); } catch { return sanitize(null); } // (kapotte opslag: de standaard)
}
let INST = null;
export const instellingen = () => INST || (INST = laad());
export function zetInstellingen(nieuw){ INST = sanitize(nieuw); return INST; }
export function bewaarBeweging(){ try { localStorage.setItem(OPSLAG, JSON.stringify(instellingen())); return true; } catch { return false; } }
export function resetProfiel(p){ instellingen().profielen[p] = {...STANDAARD}; }

/* ---------- lezen ---------- */
// De editor laat het voorbeeld het gekozen profiel gebruiken; anders telt de wereld waarin je speelt
let VOORBEELD = null;
export const zetVoorbeeldProfiel = p => { VOORBEELD = p; };
export const actiefProfiel = () => VOORBEELD || (vrouwenWereld() ? 'v' : 'm');
export const bw = () => instellingen().profielen[actiefProfiel()];
