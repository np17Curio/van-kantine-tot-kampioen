import { S, seizoenLabel } from '../core/state.js';
import { esc } from '../core/utils.js';
import { CLUBS } from '../data/gegevens.js';
import { clubTenue } from '../data/tenues.js';
import { ploegen } from './pitch.js';
import { maakLaag, draaiLus } from './cutscene-basis.js';
import { M_FPS, M_FRAMES, M_MOMENT, maakMijlpaal } from './pixel/mijlpaal.js';
import { uiterlijkVoor } from './pixel/uiterlijk.js';
import { dansVan } from '../game/wedstrijd/dansen.js';
import { isAanvoerder } from '../game/team/aanvoerder.js';

/* ===================== Cutscene: een mijlpaalgoal (je 1e, 50e en 100e carrièregoal) ===================== */
// Een pixelanimatie (render/pixel/mijlpaal.js): de herhaling van de goal, dan jouw eigen juichdans (S.sp.dans) en tot slot
// de tribune met sjaals en een spandoek. Het juichen blijft doorgaan tot je op Verder klikt (of Esc, Enter of Spatie); Overslaan kan altijd.
// o = {n:1|50|100, zij (tegenstander), clubId, soort:'schot'|'kop'|'pen'} (game/speler/mijlpaalgoal.js zet S.mijlpaalGoal; core/ui.js speelt hem na de wedstrijd af)

let BEZIG = null;
export function speelMijlpaal(o = {}){
  if (BEZIG) return BEZIG;
  BEZIG = speel(o).catch(e => { console.warn('Mijlpaalgoal kon niet spelen', e); }).finally(() => { BEZIG = null; });
  return BEZIG;
}

async function speel(o){
  const sp = S && S.sp; if (!sp) return;
  const n = o.n || 1, clubId = o.clubId ?? sp.club, c = CLUBS[clubId], team = c ? c.n : '';
  const laag = maakLaag({tag:'Mijlpaal', label:n === 1 ? 'Animatie: mijlpaal, je eerste goal' : `Animatie: mijlpaal, goal nummer ${n}`});
  const tk = teksten(laag);
  try {
    let sleutel = sp.naam; try { sleutel = ploegen().jij || sleutel; } catch (e){}
    const uit = uiterlijkVoor('jij|' + sleutel, {...(sp.uiterlijk || {}), vrouw:!!sp.vrouw});
    const maten = Array.from({length:3}, (_, i) => ({...uiterlijkVoor(`maat|${team}|${S.jaar}|${i}`), vrouw:!!sp.vrouw}));
    let band = false; try { band = isAanvoerder(); } catch (e){}
    const m = maakMijlpaal({uit, tenue:clubTenue(clubId), team:maten, keeper:{...uiterlijkVoor('keeper|' + (o.zij || '')), vrouw:!!sp.vrouw}, band,
      naam:team, speler:sp.naam, n, dans:sp.dans, soort:o.soort});
    const cv = document.createElement('canvas'); cv.width = m.W; cv.height = m.H; cv.className = 'cs-pixel';
    cv.setAttribute('aria-hidden', 'true'); laag.vak.prepend(cv);
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    if (laag.weg) return;
    laag.geladen();
    const d = dansVan(sp.dans);
    const momenten = [
      [.2, () => tk.onderschrift(`⚽ <b>${n === 1 ? 'Je eerste officiële goal' : `Goal nummer ${n}`}</b>`, `${team}${o.zij ? ` · tegen ${o.zij}` : ''} · ${seizoenLabel()}`)],
      [M_MOMENT.goal / M_FPS, () => { laag.flits(); tk.melding('De bal ligt erin!'); }],
      [M_MOMENT.dans / M_FPS + .3, () => { if (d) tk.melding(`${d.i} <b>${esc(d.n)}</b>`); }],
      [M_MOMENT.tribune / M_FPS, () => { laag.flits(); tk.melding('Het hele stadion zingt je naam!'); }],
      [(M_FRAMES - 6) / M_FPS, () => tk.titel(n === 1 ? 'Je eerste goal!' : `${n} goals!`, 'Een mijlpaal in je carrière', () => laag.sluit())],
    ];
    let volgende = 0, vorig = -1;
    await draaiLus(laag, tt => {
      while (volgende < momenten.length && momenten[volgende][0] <= tt) momenten[volgende++][1]();
      const f = Math.max(0, Math.floor(tt * M_FPS)); // (na het laatste beeld loopt de tribune door: maakMijlpaal regelt de lus)
      if (f !== vorig){ m.teken(g, f); vorig = f; }
      laag.tijd(Math.min(1, tt / (M_FRAMES / M_FPS)));
    });
  } finally {
    laag.sluit();
  }
}

// ---------- de teksten over de scène (zoals de huldiging) ----------
function teksten(laag){
  laag.ui.innerHTML = `<div class="cs-melding" aria-live="polite"></div>
    <div class="cs-onder"><div><div class="cs-kop"></div><div class="cs-sub"></div></div></div>
    <div class="cs-titel"></div>`;
  const $ = laag.$;
  let meldTimer = 0;
  return {
    onderschrift(kop, sub){ $('.cs-kop').innerHTML = kop; $('.cs-sub').textContent = sub; $('.cs-onder').classList.add('aan'); },
    melding(html){ const m = $('.cs-melding'); m.innerHTML = html; m.classList.add('aan'); clearTimeout(meldTimer); meldTimer = setTimeout(() => m.classList.remove('aan'), 2400); },
    titel(t1, t2, verder){ $('.cs-onder').classList.remove('aan'); $('.cs-melding').classList.remove('aan');
      $('.cs-titel').innerHTML = `<div class="cs-t1">${esc(t1)}</div><div class="cs-t2">${esc(t2)}</div><div><button class="pc-knop" type="button">Verder <kbd>Enter</kbd></button></div>`;
      $('.cs-titel').classList.add('aan');
      const k = $('.cs-titel .pc-knop'); k.addEventListener('click', verder); try { k.focus({preventScroll:true}); } catch (e){} },
  };
}
