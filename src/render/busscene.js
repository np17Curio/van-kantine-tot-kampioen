import { S } from '../core/state.js';
import { CLUBS } from '../data/gegevens.js';
import { clubTenue } from '../data/tenues.js';
import { ploegen } from './pitch.js';
import { maakLaag, speelLus } from './cutscene-basis.js';
import { B_FPS, B_MOMENT, maakBus } from './pixel/bus.js';
import { uiterlijkVoor } from './pixel/uiterlijk.js';
import { selectie } from '../game/competitie/spelers.js';
import { rugTeam, rugnummer } from '../game/team/rugnummers.js';
import { wedstrijdWeer } from '../game/wedstrijd/weer.js';

/* ===================== Cutscene: de spelersbus en de kleedkamer ===================== */
// Voor de grote wedstrijden (een derby of een finale): de bus komt aan bij het stadion, de spelers stappen uit langs de fans,
// en in de kleedkamer kleedt iedereen zich om (render/pixel/bus.js). Daarna volgt de gewone opkomst. Overslaan kan altijd.

let BEZIG = null;
export function speelBus(M){
  if (BEZIG) return BEZIG;
  BEZIG = speel(M).catch(e => { console.warn('Bus kon niet spelen', e); }).finally(() => { BEZIG = null; });
  return BEZIG;
}

async function speel(M){
  const sp = S && S.sp; if (!sp || !M) return;
  const finale = !!(M.beker && M.beker.finale), c = CLUBS[sp.club], tegen = M.zij || (CLUBS[M.opp] || {}).n || '';
  const laag = maakLaag({tag:finale ? 'Finale' : 'Derby', label:'Animatie: de spelersbus komt aan bij het stadion, en omkleden in de kleedkamer'});
  try {
    let sleutel = sp.naam; try { sleutel = ploegen().jij || sleutel; } catch (e){}
    const vrouw = !!sp.vrouw, uit = uiterlijkVoor('jij|' + sleutel, {...(sp.uiterlijk || {}), vrouw});
    // vier ploeggenoten uit de basis (met hun eigen naam en nummer op het shirt)
    let basis = []; try { rugTeam(sp.club); basis = selectie(sp.club).filter(x => x.basis && !x.jij).slice(0, 4); } catch (e){}
    const maten = Array.from({length:4}, (_, i) => ({...uiterlijkVoor(`c${sp.club}|bus${i}|${basis[i] ? basis[i].n : i}`), vrouw}));
    const namen = basis.map(x => x.n); namen.splice(2, 0, '');
    let nr = ''; try { nr = rugnummer(); } catch (e){}
    const w = wedstrijdWeer();
    const sc = maakBus({uit, maten, namen, naam:sp.naam, nr, tenue:clubTenue(sp.club), club:c ? c.n : '', tegen, soort:finale ? 'finale' : 'derby', weer:w ? w.soort : null});
    if (laag.weg) return;
    const cv = document.createElement('canvas'); cv.width = sc.W; cv.height = sc.H; cv.className = 'cs-pixel'; cv.setAttribute('aria-hidden', 'true');
    laag.vak.prepend(cv); const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    laag.ui.innerHTML = `<div class="cs-melding" aria-live="polite"></div><div class="cs-onder"><div><div class="cs-kop"></div><div class="cs-sub"></div></div></div>`;
    const $ = laag.$; let meldTimer = 0;
    const melding = t => { const m = $('.cs-melding'); m.textContent = t; m.classList.add('aan'); clearTimeout(meldTimer); meldTimer = setTimeout(() => m.classList.remove('aan'), 2800); };
    laag.geladen();
    const momenten = [
      [.3, () => { $('.cs-kop').textContent = finale ? 'De dag van de finale' : 'Derbydag'; $('.cs-sub').textContent = `${c ? c.n : ''} tegen ${tegen}`; $('.cs-onder').classList.add('aan'); }],
      [B_MOMENT.stop / B_FPS, () => { $('.cs-onder').classList.remove('aan'); melding('De spelersbus komt aan. De fans staan al uren te wachten.'); }],
      [B_MOMENT.jij / B_FPS, () => melding('Jij stapt uit. Je hoort je naam. De camera\'s flitsen.')],
      [B_MOMENT.kleed / B_FPS, () => melding('In de kleedkamer hangt je shirt al klaar.')],
      [B_MOMENT.jijOm / B_FPS, () => melding('Shirt aan. Nu gaat het gebeuren.')],
      [B_MOMENT.klaar / B_FPS, () => melding('Klaar voor de strijd!')],
    ];
    let volgende = 0, vorig = -1;
    await speelLus(laag, sc.frames / B_FPS, tt => {
      while (volgende < momenten.length && momenten[volgende][0] <= tt) momenten[volgende++][1]();
      const f = Math.max(0, Math.min(sc.frames - 1, Math.floor(tt * B_FPS)));
      if (f === vorig) return;
      sc.teken(g, f); vorig = f;
      if (sc.flitsen(f)) laag.flits();
    });
    clearTimeout(meldTimer);
  } finally {
    laag.sluit();
  }
}
