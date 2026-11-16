import { S, seizoenLabel } from '../core/state.js';
import { esc } from '../core/utils.js';
import { CLUBS } from '../data/gegevens.js';
import { clubTenue, uitTenue } from '../data/tenues.js';
import { logoURL } from '../data/logos.js';
import { ploegen } from './pitch.js';
import { laadPlaatje, maakLaag, draaiLus } from './cutscene-basis.js';
import { A_FPS, A_FRAMES, A_MOMENT, maakAfscheid } from './pixel/afscheid.js';
import { uiterlijkVoor } from './pixel/uiterlijk.js';
import { isAanvoerder } from '../game/team/aanvoerder.js';
import { rugnummer } from '../game/team/rugnummers.js';
import { RUGNUMMER } from '../game/seizoen/afscheid.js';

/* ===================== Cutscene: je afscheidswedstrijd, de erehaag en je shirt aan de muur ===================== */
// Een pixelanimatie (render/pixel/afscheid.js): beide teams vormen een erehaag en klappen terwijl jij er met je eigen
// uiterlijk en tenue tussendoor loopt, het publiek houdt spandoeken met je naam en nummer omhoog, en tot slot wordt je
// shirt (nummer, naam, kleuren van je laatste club) ingelijst aan de muur gehangen. Daarna blijft het slot doorlopen
// tot je op Verder klikt (of Esc, Enter of Spatie); Overslaan kan altijd.
// o = {clubId?, club?, team?: [naam], vrienden?: [naam]} (views/afscheid.js speelt hem af bij het laatste fluitsignaal)

let BEZIG = null;
export function speelAfscheid(o = {}){
  if (BEZIG) return BEZIG;
  BEZIG = speel(o).catch(e => { console.warn('Afscheid kon niet spelen', e); }).finally(() => { BEZIG = null; });
  return BEZIG;
}

async function speel(o){
  const sp = S && S.sp; if (!sp) return;
  const clubId = o.clubId ?? sp.club, c = CLUBS[clubId], clubNaam = o.club || (c ? c.n : '');
  const laag = maakLaag({tag:'Afscheid', label:`Animatie: je afscheid bij ${clubNaam}`});
  const tk = teksten(laag);
  try {
    const tenue = clubTenue(clubId);
    const logoImg = c ? await laadPlaatje(logoURL(clubId, 256)) : null;
    if (laag.weg) return;
    let sleutel = sp.naam; try { sleutel = ploegen().jij || sleutel; } catch (e){}
    const uit = uiterlijkVoor('jij|' + sleutel, {...(sp.uiterlijk || {}), vrouw:!!sp.vrouw});
    const metV = u => ({...u, vrouw:!!sp.vrouw});
    const team = Array.from({length:5}, (_, i) => metV(uiterlijkVoor(o.team && o.team[i] ? `speler|${o.team[i]}` : `maat|${clubNaam}|${S.jaar}|${i}`)));
    const vrienden = Array.from({length:8}, (_, i) => metV(uiterlijkVoor(o.vrienden && o.vrienden[i] ? `vriend|${o.vrienden[i]}` : `vriend|${clubNaam}|${i}`)));
    let band = false; try { band = isAanvoerder(); } catch (e){}
    let nr = null; try { nr = rugnummer(); } catch (e){}
    nr = nr || RUGNUMMER[sp.pos] || 10;
    const sc = maakAfscheid({uit, tenue, band, nr, naam:sp.naam, club:clubNaam, team, vrienden, vriendTenue:uitTenue(tenue)});
    const cv = document.createElement('canvas'); cv.width = sc.w; cv.height = sc.h; cv.className = 'cs-pixel';
    cv.setAttribute('aria-hidden', 'true'); laag.vak.prepend(cv);
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    laag.geladen(); if (logoImg) tk.logo(logoImg);
    const momenten = [
      [.2, () => tk.onderschrift(`👏 <b>${esc(`Bedankt, ${sp.naam}`)}</b>`, `${clubNaam} · ${seizoenLabel()}`)],
      [A_MOMENT.zwaai / A_FPS, () => tk.melding('Het hele stadion zingt je naam')],
      [A_MOMENT.armen / A_FPS, () => tk.melding('Een laatste keer de armen omhoog')],
      [A_MOMENT.donker / A_FPS, () => tk.weg()],
      [A_MOMENT.spot / A_FPS, () => { laag.flits(); tk.melding(`Je shirt met nummer ${nr} krijgt een ereplek aan de muur`); }],
      [(A_FRAMES - 10) / A_FPS, () => tk.titel(sp.naam, `Nummer ${nr} · ${clubNaam} · Bedankt voor alles`, () => laag.sluit())],
    ];
    let volgende = 0, vorig = -1;
    await draaiLus(laag, tt => {
      while (volgende < momenten.length && momenten[volgende][0] <= tt) momenten[volgende++][1]();
      // na het laatste beeld blijft het slot (het glas glimt, stofjes in de spot) doorlopen tot je verder klikt
      const n = Math.max(0, Math.floor(tt * A_FPS)), f = n < A_FRAMES ? n : sc.lus + ((n - A_FRAMES) % (A_FRAMES - sc.lus));
      if (f !== vorig){ sc.teken(g, f); vorig = f; }
      laag.tijd(Math.min(1, tt / (A_FRAMES / A_FPS)));
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
    melding(html){ const m = $('.cs-melding'); m.innerHTML = html; m.classList.add('aan'); clearTimeout(meldTimer); meldTimer = setTimeout(() => m.classList.remove('aan'), 2800); },
    weg(){ $('.cs-onder').classList.remove('aan'); $('.cs-melding').classList.remove('aan'); },
    titel(naam, sub, verder){ this.weg();
      $('.cs-titel').innerHTML = `<div class="cs-t1">${esc(naam)}</div><div class="cs-t2">${esc(sub)}</div><div><button class="pc-knop" type="button">Verder <kbd>Enter</kbd></button></div>`;
      $('.cs-titel').classList.add('aan');
      const k = $('.cs-titel .pc-knop'); k.addEventListener('click', verder); try { k.focus({preventScroll:true}); } catch (e){} },
  };
}
