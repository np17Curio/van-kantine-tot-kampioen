import { S, seizoenLabel } from '../core/state.js';
import { landTenue } from '../data/tenues.js';
import { vertaal } from '../core/taal.js';
import { ploegen } from './pitch.js';
import { maakLaag, speelLus } from './cutscene-basis.js';
import { D_FPS, D_MOMENT, maakDebuut } from './pixel/debuut.js';
import { uiterlijkVoor } from './pixel/uiterlijk.js';

/* ===================== Cutscene: je debuut voor het nationale team ===================== */
// Een pixelanimatie (render/pixel/debuut.js): het team op een rij in het landentenue, de vlaggen van beide landen wapperen,
// het volkslied met je hand op je hart (en muzieknoten), en dan schudt de bondscoach je de hand. Eén keer: bij je eerste
// interland (M.debuut, gezet in startInterland). Overslaan kan altijd (Esc, Enter, Spatie of de knop).

let BEZIG = null;
// M = S.M (een interland). Geeft een Promise die klaar is als de scène af is of overgeslagen
export function speelDebuut(M){
  if (BEZIG) return BEZIG;
  BEZIG = speel(M).catch(e => { console.warn('Debuut kon niet spelen', e); }).finally(() => { BEZIG = null; });
  return BEZIG;
}

async function speel(M){
  const sp = S && S.sp; if (!sp || !M || !M.inter) return;
  const land = M.inter.land, opp = M.zij;
  const laag = maakLaag({tag:'Interland', label:`Animatie: je debuut voor ${land}`});
  try {
    let sleutel = sp.naam; try { sleutel = ploegen().jij || sleutel; } catch (e){}
    const vrouw = !!sp.vrouw, uit = uiterlijkVoor('jij|' + sleutel, {...(sp.uiterlijk || {}), vrouw});
    const team = Array.from({length:5}, (_, i) => ({...uiterlijkVoor(`inter|${land}|${S.jaar}|${i}`), vrouw}));
    const coach = uiterlijkVoor('bondscoach|' + land); if (coach.huid % 2 === 0) coach.haar = 5; // (vaak al grijs)
    const sc = maakDebuut({uit, team, coach, tenue:landTenue(land), land, opp, landNaam:vertaal(land), oppNaam:vertaal(opp), oppTenue:landTenue(opp), naam:sp.naam, nr:sp.wensNr || ''});
    if (laag.weg) return;
    const cv = document.createElement('canvas'); cv.width = sc.W; cv.height = sc.H; cv.className = 'cs-pixel'; cv.setAttribute('aria-hidden', 'true');
    laag.vak.prepend(cv); const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    laag.ui.innerHTML = `<div class="cs-melding" aria-live="polite"></div><div class="cs-onder"><div><div class="cs-kop"></div><div class="cs-sub"></div></div></div>`;
    const $ = laag.$; let meldTimer = 0;
    const melding = t => { const m = $('.cs-melding'); m.textContent = t; m.classList.add('aan'); clearTimeout(meldTimer); meldTimer = setTimeout(() => m.classList.remove('aan'), 2800); };
    laag.geladen();
    const momenten = [
      [.3, () => { $('.cs-kop').textContent = `Debuut voor ${land}`; $('.cs-sub').textContent = `${M.inter.type} tegen ${opp} · ${seizoenLabel()}`; $('.cs-onder').classList.add('aan'); }],
      [D_MOMENT.hart / D_FPS, () => melding('Het volkslied klinkt. Je hand op je hart.')],
      [D_MOMENT.balk / D_FPS, () => $('.cs-onder').classList.remove('aan')],
      [D_MOMENT.coach / D_FPS, () => melding('De bondscoach komt je persoonlijk feliciteren.')],
    ];
    let volgende = 0, vorig = -1;
    await speelLus(laag, sc.frames / D_FPS, tt => {
      while (volgende < momenten.length && momenten[volgende][0] <= tt) momenten[volgende++][1]();
      const f = Math.max(0, Math.min(sc.frames - 1, Math.floor(tt * D_FPS)));
      if (f === vorig) return;
      sc.teken(g, f); vorig = f;
      if (sc.flitsen(f)) laag.flits();
    });
    clearTimeout(meldTimer);
  } finally {
    laag.sluit();
  }
}
