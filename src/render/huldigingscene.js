import { S, seizoenLabel } from '../core/state.js';
import { esc } from '../core/utils.js';
import { CLUBS } from '../data/gegevens.js';
import { clubTenue, landTenue } from '../data/tenues.js';
import { logoURL } from '../data/logos.js';
import { ploegen } from './pitch.js';
import { laadPlaatje, maakLaag, draaiLus } from './cutscene-basis.js';
import { H_FPS, H_FRAMES, H_MOMENT, maakHuldiging } from './pixel/huldiging.js';
import { uiterlijkVoor } from './pixel/uiterlijk.js';
import { isAanvoerder } from '../game/team/aanvoerder.js';

/* ===================== Cutscene: de huldiging, jij tilt de prijs boven je hoofd ===================== */
// Een pixelanimatie (render/pixel/huldiging.js, in de stijl van art/chibi_anims.px.js): het team op het podium in een
// juichend stadion, confetti en vuurwerk, en jij met je eigen uiterlijk en tenue vooraan met de prijs. Na het tillen
// blijft het feest doorgaan tot je op Verder klikt (of Esc, Enter of Spatie); Overslaan kan altijd.
// o = {soort:'beker'|'titel'|'toernooi', prijs:'Nationale Beker', lidw?:'het', team?:'FC ...', clubId?, land?}
// (game: zet S.huldiging = o; core/ui.js speelt hem na de wedstrijd af, zie speelHuldigingNu)

let BEZIG = null;
export function speelHuldiging(o = {}){
  if (BEZIG) return BEZIG;
  BEZIG = speel(o).catch(e => { console.warn('Huldiging kon niet spelen', e); }).finally(() => { BEZIG = null; });
  return BEZIG;
}

async function speel(o){
  const sp = S && S.sp; if (!sp) return;
  const land = o.land || null, clubId = land ? null : o.clubId ?? sp.club, c = clubId != null ? CLUBS[clubId] : null;
  const team = o.team || (land || (c ? c.n : ''));
  const laag = maakLaag({tag:'Huldiging', label:`Animatie: de huldiging, ${team} wint ${o.prijs || 'de prijs'}`});
  const tk = teksten(laag);
  try {
    const tenue = land ? landTenue(land) : clubTenue(clubId);
    const logoImg = c ? await laadPlaatje(logoURL(clubId, 256)) : null;
    if (laag.weg) return;
    let sleutel = sp.naam; try { sleutel = ploegen().jij || sleutel; } catch (e){}
    const uit = uiterlijkVoor('jij|' + sleutel, {...(sp.uiterlijk || {}), vrouw:!!sp.vrouw});
    const maten = Array.from({length:4}, (_, i) => { const u = uiterlijkVoor(`maat|${team}|${S.jaar}|${i}`); return {...u, vrouw:!!sp.vrouw}; });
    let band = false; try { band = !land && isAanvoerder(); } catch (e){}
    const {frames, lus} = maakHuldiging({uit, tenue, team:maten, band, naam:team, titel:o.soort === 'titel' ? 'KAMPIOENEN' : o.soort === 'toernooi' ? 'KAMPIOENEN' : 'WINNAARS',
      prijs:o.soort === 'titel' ? 'schaal' : 'beker'});
    const cv = document.createElement('canvas'); cv.width = frames[0].width; cv.height = frames[0].height; cv.className = 'cs-pixel';
    cv.setAttribute('aria-hidden', 'true'); laag.vak.prepend(cv);
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    laag.geladen(); if (logoImg) tk.logo(logoImg);
    const titelTekst = o.soort === 'titel' ? `Kampioen van de ${o.prijs}` : `Winnaar van ${o.lidw || 'de'} ${o.prijs}`;
    const momenten = [
      [.2, () => tk.onderschrift(`🏆 <b>${esc(o.prijs || '')}</b>`, `${team} · ${seizoenLabel()}`)],
      [H_MOMENT.til / H_FPS, () => tk.melding(o.soort === 'titel' ? 'De schaal gaat de lucht in!' : 'De beker gaat de lucht in!')],
      [H_MOMENT.boven / H_FPS, () => laag.flits()],
      [(H_FRAMES - 8) / H_FPS, () => tk.titel(team, titelTekst, logoImg, () => laag.sluit())],
    ];
    let volgende = 0, vorig = -1;
    await draaiLus(laag, tt => {
      while (volgende < momenten.length && momenten[volgende][0] <= tt) momenten[volgende++][1]();
      // na het laatste beeld blijft het slot (juichen, confetti, vuurwerk) doorlopen tot je verder klikt
      const n = Math.max(0, Math.floor(tt * H_FPS)), f = n < H_FRAMES ? n : lus + ((n - H_FRAMES) % (H_FRAMES - lus));
      if (f !== vorig){ g.drawImage(frames[f], 0, 0); vorig = f; }
      laag.tijd(Math.min(1, tt / (H_FRAMES / H_FPS)));
    });
  } finally {
    laag.sluit();
  }
}

// ---------- de teksten over de scène (in de laag uit cutscene-basis.js) ----------
function teksten(laag){
  laag.ui.innerHTML = `<div class="cs-melding" aria-live="polite"></div>
    <div class="cs-onder"><img class="cs-logo" alt=""><div><div class="cs-kop"></div><div class="cs-sub"></div></div></div>
    <div class="cs-titel"></div>`;
  const $ = laag.$;
  let meldTimer = 0;
  return {
    logo(img){ $('.cs-logo').src = img.src; },
    onderschrift(kop, sub){ $('.cs-kop').innerHTML = kop; $('.cs-sub').textContent = sub; $('.cs-onder').classList.add('aan'); },
    melding(html){ const m = $('.cs-melding'); m.innerHTML = html; m.classList.add('aan'); clearTimeout(meldTimer); meldTimer = setTimeout(() => m.classList.remove('aan'), 2600); },
    titel(team, sub, logoImg, verder){ $('.cs-onder').classList.remove('aan'); $('.cs-melding').classList.remove('aan');
      $('.cs-titel').innerHTML = `${logoImg ? `<img src="${logoImg.src}" alt="">` : ''}<div class="cs-t1">${esc(team)}</div><div class="cs-t2">${esc(sub)}</div><div><button class="pc-knop" type="button">Verder <kbd>Enter</kbd></button></div>`;
      $('.cs-titel').classList.add('aan');
      const k = $('.cs-titel .pc-knop'); k.addEventListener('click', verder); try { k.focus({preventScroll:true}); } catch (e){} },
  };
}
