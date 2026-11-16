import { S, seizoenLabel } from '../core/state.js';
import { esc } from '../core/utils.js';
import { ploegen } from './pitch.js';
import { maakLaag, draaiLus } from './cutscene-basis.js';
import { G_FPS, G_FRAMES, G_MOMENT, maakGala } from './pixel/gala.js';
import { uiterlijkVoor } from './pixel/uiterlijk.js';

/* ===================== Cutscene: het gala van de Gouden Bal ===================== */
// Een pixelanimatie (render/pixel/gala.js, in de stijl van de huldiging): een feestzaal met een rode loper en sterspelers aan
// ronde tafels, de presentator opent de envelop ("En de winnaar is..."), de spot valt op jou, en jij (eigen uiterlijk, in
// smoking) loopt het podium op en tilt de Gouden Bal boven je hoofd. Daarna blijft het applaus doorgaan tot je op Verder
// klikt (of Esc, Enter of Spatie); Overslaan kan altijd.
// (game: core/ui.js speelt hem één keer af op het eindscherm van het seizoen, als S.eind.gala er is; zie galaCheck)

let BEZIG = null;
export function speelGala(o = {}){
  if (BEZIG) return BEZIG;
  BEZIG = speel(o).catch(e => { console.warn('Gala kon niet spelen', e); }).finally(() => { BEZIG = null; });
  return BEZIG;
}

async function speel(o){
  const sp = S && S.sp; if (!sp) return;
  const naam = o.naam || sp.naam || '';
  const laag = maakLaag({tag:'Gouden Bal', label:'Animatie: het gala van de Gouden Bal'});
  const tk = teksten(laag);
  try {
    await new Promise(ok => requestAnimationFrame(() => setTimeout(ok, 0))); // (eerst de laag in beeld, dan het tekenwerk)
    if (laag.weg) return;
    let sleutel = sp.naam; try { sleutel = ploegen().jij || sleutel; } catch (e){}
    const uit = uiterlijkVoor('jij|' + sleutel, {...(sp.uiterlijk || {}), vrouw:!!sp.vrouw});
    const {frames, lus} = maakGala({uit, naam, presentator:uiterlijkVoor(`presentator|gala|${S.jaar || ''}`)});
    if (laag.weg) return;
    const cv = document.createElement('canvas'); cv.width = frames[0].width; cv.height = frames[0].height; cv.className = 'cs-pixel';
    cv.setAttribute('aria-hidden', 'true'); laag.vak.prepend(cv);
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    laag.geladen();
    const momenten = [
      [.2, () => tk.onderschrift('🏆 <b>Gouden Bal</b>', `Parijs · ${seizoenLabel()}`)],
      [G_MOMENT.envelop / G_FPS, () => tk.melding('De presentator opent de envelop...')],
      [G_MOMENT.naam / G_FPS, () => { laag.flits(); tk.melding(`De Gouden Bal gaat naar ${esc(naam)}!`); }],
      [G_MOMENT.podium / G_FPS, () => tk.melding('Een staande ovatie in de zaal.')],
      [G_MOMENT.boven / G_FPS, () => { laag.flits(); tk.melding('De Gouden Bal gaat de lucht in!'); }],
      [(G_FRAMES - 4) / G_FPS, () => tk.titel(naam, `Beste speler van de wereld · ${seizoenLabel()}`, () => laag.sluit())],
    ];
    let volgende = 0, vorig = -1;
    await draaiLus(laag, tt => {
      while (volgende < momenten.length && momenten[volgende][0] <= tt) momenten[volgende++][1]();
      // na het laatste beeld blijft het slot (de bal boven je hoofd, applaus, flitsen, confetti) doorlopen tot je verder klikt
      const n = Math.max(0, Math.floor(tt * G_FPS)), f = n < G_FRAMES ? n : lus + ((n - G_FRAMES) % (G_FRAMES - lus));
      if (f !== vorig){ g.drawImage(frames[f], 0, 0); vorig = f; }
      laag.tijd(Math.min(1, tt / (G_FRAMES / G_FPS)));
    });
  } finally {
    laag.sluit();
  }
}

// ---------- de teksten over de scène (in de laag uit cutscene-basis.js; dezelfde klassen als de huldiging) ----------
function teksten(laag){
  laag.ui.innerHTML = `<div class="cs-melding" aria-live="polite"></div>
    <div class="cs-onder"><div><div class="cs-kop"></div><div class="cs-sub"></div></div></div>
    <div class="cs-titel"></div>`;
  const $ = laag.$;
  let meldTimer = 0;
  return {
    onderschrift(kop, sub){ $('.cs-kop').innerHTML = kop; $('.cs-sub').textContent = sub; $('.cs-onder').classList.add('aan'); },
    melding(html){ const m = $('.cs-melding'); m.innerHTML = html; m.classList.add('aan'); clearTimeout(meldTimer); meldTimer = setTimeout(() => m.classList.remove('aan'), 2600); },
    titel(naam, sub, verder){ $('.cs-onder').classList.remove('aan'); $('.cs-melding').classList.remove('aan');
      $('.cs-titel').innerHTML = `<div class="cs-t1">🏆 ${esc(naam)}</div><div class="cs-t2">${esc(sub)}</div><div><button class="pc-knop" type="button">Verder <kbd>Enter</kbd></button></div>`;
      $('.cs-titel').classList.add('aan');
      const k = $('.cs-titel .pc-knop'); k.addEventListener('click', verder); try { k.focus({preventScroll:true}); } catch (e){} },
  };
}
