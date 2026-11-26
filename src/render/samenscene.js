import { S, seizoenLabel } from '../core/state.js';
import { esc } from '../core/utils.js';
import { CLUBS } from '../data/gegevens.js';
import { clubTenue } from '../data/tenues.js';
import { ploegen } from './pitch.js';
import { maakLaag, draaiLus } from './cutscene-basis.js';
import { S_FPS, S_FRAMES, S_MOMENT, maakSamen } from './pixel/samen.js';
import { uiterlijkVoor } from './pixel/uiterlijk.js';
import { vriendNaam } from '../game/speler/journey.js';

/* ===================== Cutscene: samen bij dezelfde club met je jeugdvriend(in) ===================== */
// Een pixelanimatie (render/pixel/samen.js): jullie rennen op elkaar af en springen samen, dan een herinnering aan vroeger
// (het veldje achter de kantine) en tot slot de tribune met een spandoek. Eén keer per club (core/ui.js samenCheck).

let BEZIG = null;
export function speelSamen(){
  if (BEZIG) return BEZIG;
  BEZIG = speel().catch(e => { console.warn('Samen-animatie kon niet spelen', e); }).finally(() => { BEZIG = null; });
  return BEZIG;
}

async function speel(){
  const sp = S && S.sp, v = sp && sp.vriend; if (!sp || !v) return;
  const c = CLUBS[sp.club], club = c ? c.n : '', vn = vriendNaam();
  const laag = maakLaag({tag:'Samen', label:`Animatie: jij en ${vn} spelen samen bij ${club}`});
  const tk = teksten(laag);
  try {
    let sleutel = sp.naam; try { sleutel = ploegen().jij || sleutel; } catch (e){}
    const jij = uiterlijkVoor('jij|' + sleutel, {...(sp.uiterlijk || {}), vrouw:!!sp.vrouw});
    const vriend = uiterlijkVoor('vriend|' + v.voornaam, {vrouw:!!v.vrouw}); // (dezelfde sleutel als op het veld en in de krant)
    const m = maakSamen({jij, vriend, tenue:clubTenue(sp.club), naam:club, jijNaam:sp.naam.split(' ')[0], vriendNaam:vn});
    const cv = document.createElement('canvas'); cv.width = m.W; cv.height = m.H; cv.className = 'cs-pixel';
    cv.setAttribute('aria-hidden', 'true'); laag.vak.prepend(cv);
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    if (laag.weg) return;
    laag.geladen();
    const momenten = [
      [.2, () => tk.onderschrift(`🤝 <b>Eindelijk samen</b>`, `Jij en ${vn} · ${club} · ${seizoenLabel()}`)],
      [S_MOMENT.botsen / S_FPS, () => { laag.flits(); tk.melding('Jullie vliegen elkaar in de armen!'); }],
      [S_MOMENT.vroeger / S_FPS, () => tk.melding('Vroeger, op het veldje achter de kantine…')],
      [(S_MOMENT.vroeger + 14) / S_FPS, () => tk.melding(`…droomden jullie hier al van. Samen in één ploeg.`)],
      [S_MOMENT.nu / S_FPS, () => { laag.flits(); tk.melding('De fans zingen jullie namen!'); }],
      [(S_FRAMES - 6) / S_FPS, () => tk.titel(`Samen bij ${club}!`, `Jij en ${vn}: van de kantine tot hier`, () => laag.sluit())],
    ];
    let volgende = 0, vorig = -1;
    await draaiLus(laag, tt => {
      while (volgende < momenten.length && momenten[volgende][0] <= tt) momenten[volgende++][1]();
      const f = Math.max(0, Math.floor(tt * S_FPS));
      if (f !== vorig){ m.teken(g, f); vorig = f; }
      laag.tijd(Math.min(1, tt / (S_FRAMES / S_FPS)));
    });
  } finally {
    laag.sluit();
  }
}

// ---------- de teksten over de scène (zoals de mijlpaalgoal) ----------
function teksten(laag){
  laag.ui.innerHTML = `<div class="cs-melding" aria-live="polite"></div>
    <div class="cs-onder"><div><div class="cs-kop"></div><div class="cs-sub"></div></div></div>
    <div class="cs-titel"></div>`;
  const $ = laag.$;
  let meldTimer = 0;
  return {
    onderschrift(kop, sub){ $('.cs-kop').innerHTML = kop; $('.cs-sub').textContent = sub; $('.cs-onder').classList.add('aan'); },
    melding(html){ const m = $('.cs-melding'); m.innerHTML = esc(html); m.classList.add('aan'); clearTimeout(meldTimer); meldTimer = setTimeout(() => m.classList.remove('aan'), 2600); },
    titel(t1, t2, verder){ $('.cs-onder').classList.remove('aan'); $('.cs-melding').classList.remove('aan');
      $('.cs-titel').innerHTML = `<div class="cs-t1">${esc(t1)}</div><div class="cs-t2">${esc(t2)}</div><div><button class="pc-knop" type="button">Verder <kbd>Enter</kbd></button></div>`;
      $('.cs-titel').classList.add('aan');
      const k = $('.cs-titel .pc-knop'); k.addEventListener('click', verder); try { k.focus({preventScroll:true}); } catch (e){} },
  };
}
