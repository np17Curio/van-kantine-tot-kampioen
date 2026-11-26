import { S } from '../core/state.js';
import { esc } from '../core/utils.js';
import { CLUBS, attrNaam } from '../data/gegevens.js';
import { clubTenue } from '../data/tenues.js';
import { ploegen } from './pitch.js';
import { maakLaag, speelLus } from './cutscene-basis.js';
import { TH, TW, T_FPS, T_FRAMES, maakTraining } from './pixel/training/index.js';
import { uiterlijkVoor } from './pixel/uiterlijk.js';

/* ===================== Cutscene: de activiteit van de week ===================== */
// Kies je in het weekoverzicht wat je deze week doet, dan zie je dat kort (zo'n 3 seconden) als pixelanimatie
// (render/pixel/training/). o = {soort, attr} uit game/week.js doeActiviteit. Klikken of Esc slaat hem over.
// Titels: wat je ziet bovenin (bij een training op het veld de naam van de eigenschap)
const TITEL = {tactiek:'Tactiektraining', extra:'Extra trainen', rust:'Rustig aan', mentaal:'Mentale training', video:'Videoanalyse', trainer:'Indruk maken op de trainer',
  uit:'Avondje uit', huiswerk:'Huiswerk maken', talentcoach:'Bij de talentcoach', media:'Een vlog opnemen', toekomst:'Praten met je ouders', bijbaan:'Bijbaantje',
  derdehelft:'Derde helft', sportkunde:'Avondschool sportkunde', fysio:'Bij de fysio', magazijn:'Bijbaan in het magazijn', mentor:'Jonge spelers helpen'};

let BEZIG = null;
export function speelTraining(o){
  if (BEZIG) return BEZIG;
  BEZIG = speel(o).catch(e => { console.warn('Trainingsanimatie kon niet spelen', e); }).finally(() => { BEZIG = null; });
  return BEZIG;
}

async function speel(o = {}){
  const sp = S && S.sp; if (!sp) return;
  const id = o.soort === 'train' ? `train-${o.attr}` : o.soort, titel = o.soort === 'train' ? `${attrNaam(o.attr, sp.pos)} trainen` : TITEL[o.soort] || 'Training';
  const laag = maakLaag({tag:'Training', label:`Animatie: ${titel}`});
  try {
    let sleutel = sp.naam; try { sleutel = ploegen().jij || sleutel; } catch (e){}
    const uit = uiterlijkVoor('jij|' + sleutel, {...(sp.uiterlijk || {}), vrouw:!!sp.vrouw});
    const c = CLUBS[sp.club];
    const m = maakTraining(id, {uit, tenue:clubTenue(sp.club), keeper:sp.pos === 'KEEPER', attr:o.attr, club:c && !sp.clubloos ? c.n : '', vrouw:!!sp.vrouw, leeftijd:sp.leeftijd});
    const cv = document.createElement('canvas'); cv.width = TW + 2; cv.height = TH + 2; cv.className = 'cs-pixel'; cv.setAttribute('aria-hidden', 'true');
    laag.vak.prepend(cv);
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    laag.ui.innerHTML = `<div class="cs-onder aan"><div><div class="cs-kop">${esc(titel)}</div></div></div>`;
    // (klikken op het beeld slaat hem ook over: het is maar een kort filmpje)
    laag.vak.addEventListener('click', () => laag.sluit());
    if (laag.weg) return;
    laag.geladen();
    let vorig = -1;
    await speelLus(laag, T_FRAMES / T_FPS, tt => {
      const f = Math.max(0, Math.min(T_FRAMES - 1, Math.floor(tt * T_FPS))); if (f === vorig) return; vorig = f;
      g.fillStyle = '#1a1414'; g.fillRect(0, 0, TW + 2, TH + 2);
      g.save(); g.translate(1, 1); g.beginPath(); g.rect(0, 0, TW, TH); g.clip();
      try { m.teken(g, f); } catch (e){ console.warn('training', id, e); }
      g.restore();
    }, {uitloop:.3});
  } finally {
    laag.sluit();
  }
}
