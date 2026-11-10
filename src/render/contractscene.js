import { ploegen } from './pitch.js';
import { S } from '../core/state.js';
import { esc, geldTxt } from '../core/utils.js';
import { CLUBS } from '../data/gegevens.js';
import { clubTenue } from '../data/tenues.js';
import { logoURL } from '../data/logos.js';
import { rugnummer } from '../game/team/rugnummers.js';
import { laadPlaatje, maakLaag, speelLus } from './cutscene-basis.js';
import { FLITS, FPS, FRAMES, MOMENT, maakContract } from './pixel/contract.js';
import { hashGetal, uiterlijkVoor } from './pixel/uiterlijk.js';

/* ===================== Cutscene: je tekent bij je nieuwe club ===================== */
// Een pixelanimatie (render/pixel/contract.js, naar de stijlbron art/chibi_anims.px.js): je komt de zaal binnen, zet je
// handtekening, schudt de hand van de voorzitter en laat het shirt van je nieuwe club zien, met je rugnummer. Vooraan zit
// publiek en de fotografen flitsen. Jij hebt je eigen uiterlijk; de zaal, het tafelkleed en het shirt hebben de clubkleuren.

const VOORNAAM = ['J.', 'H.', 'P.', 'W.', 'R.', 'M.', 'A.', 'C.', 'F.', 'G.', 'K.', 'L.', 'E.', 'T.'];
const ACHTERNAAM = ['Van der Meer', 'Hoekstra', 'De Ruyter', 'Verbeek', 'Kramer', 'Van Dijk', 'Brandsma', 'Lindqvist', 'Moreau', 'Ferreira', 'Rossi', 'Novak', 'Hartmann', 'Okafor', 'Schouten', 'De Lange', 'Bakker', 'Sanders', 'Castelli', 'Van Rijn'];
const NA = 2; // zoveel seconden blijft het slot (shirt en flitsen) nog doorlopen

let BEZIG = null;
// o = {clubId, jaren?, salaris?, som?, o23?, huur?}. Geeft een Promise die klaar is als de scène af is of overgeslagen.
export function speelContractScene(o = {}){
  if (BEZIG) return BEZIG;
  BEZIG = speel(o).catch(e => { console.warn('Transfer-animatie kon niet spelen', e); }).finally(() => { BEZIG = null; });
  return BEZIG;
}

async function speel(o){
  const sp = S && S.sp; if (!sp) return;
  const clubId = o.clubId ?? sp.club, c = CLUBS[clubId]; if (!c) return;
  const laag = maakLaag({tag:'Officieel', label:'Animatie: je tekent bij je nieuwe club'});
  const tk = teksten(laag);
  try {
    const tenue = clubTenue(clubId), logoImg = await laadPlaatje(logoURL(clubId, 256));
    if (laag.weg) return;
    const o23 = !!(o.o23 || sp.o23); // (bij de O23 nog geen rugnummer van het eerste elftal)
    let nr = null; if (!o23) try { nr = rugnummer(); } catch (e){}
    const info = {club:c.n, naam:sp.naam, nr, tenue, logoImg, jaren:o.huur ? null : o.jaren ?? sp.contract, salaris:o.salaris ?? sp.salaris, o23, huur:!!o.huur,
      voorzitter:`${VOORNAAM[hashGetal('vzv|' + c.n) % VOORNAAM.length]} ${ACHTERNAAM[hashGetal('vza|' + c.n) % ACHTERNAAM.length]}`};

    // de beelden: jouw uiterlijk (zoals op het veld), de kleuren van de club en je nummer
    let sleutel = sp.naam; try { sleutel = ploegen().jij || sleutel; } catch (e){}
    const uit = uiterlijkVoor('jij|' + sleutel, {...(sp.uiterlijk || {}), vrouw:!!sp.vrouw});
    // op het shirt: je achternaam (alles na je voornaam) en je rugnummer
    const delen = String(sp.naam || '').trim().split(/\s+/), rugnaam = delen.length > 1 ? delen.slice(1).join(' ') : delen[0] || '';
    const {frames} = maakContract({uit, tenue, nr, naam:rugnaam});
    const cv = document.createElement('canvas'); cv.width = frames[0].width; cv.height = frames[0].height; cv.className = 'cs-pixel';
    cv.setAttribute('aria-hidden', 'true'); laag.vak.prepend(cv);
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;

    // teksten bij de gebeurtenissen (in seconden: beeld / FPS)
    laag.geladen(); tk.zetInfo(info);
    const momenten = [
      [MOMENT.binnen / FPS, () => tk.onderschrift(`Welkom bij <b>${esc(info.club)}</b>`, info.huur ? 'Huurperiode tot het einde van het seizoen'
        : `${info.o23 ? 'Je tekent bij de O23' : 'Transfer rond'} · ${info.jaren ? `contract voor ${info.jaren} jaar` : 'contract getekend'}${o.som ? ` · ${geldTxt(o.som)}` : ''}`)],
      [MOMENT.zwaai / FPS, () => tk.melding(`${esc(info.voorzitter)}, voorzitter: "Fijn dat je er bent!"`)],
      [MOMENT.tekenStart / FPS, () => tk.melding('Je zet je handtekening…')],
      [MOMENT.tekenEind / FPS, () => tk.melding('✍️ Getekend!')],
      [MOMENT.hand / FPS, () => tk.melding('🤝 Een stevige handdruk met de voorzitter')],
      [MOMENT.shirt / FPS, () => tk.titel(info)],
    ];
    let volgende = 0, vorig = -1;
    const duur = FRAMES / FPS + NA;
    await speelLus(laag, duur, tt => {
      while (volgende < momenten.length && momenten[volgende][0] <= tt) momenten[volgende++][1]();
      // het beeld; na het laatste beeld blijven de laatste acht (shirt omhoog, klappen, flitsen) doorlopen
      const n = Math.max(0, Math.floor(tt * FPS)), f = n < FRAMES ? n : FRAMES - 8 + ((n - FRAMES) % 8);
      if (f !== vorig){ g.drawImage(frames[f], 0, 0); if (FLITS[f]) laag.flits(); vorig = f; }
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
    zetInfo(info){ if (info.logoImg) $('.cs-logo').src = info.logoImg.src; },
    onderschrift(kop, sub){ $('.cs-kop').innerHTML = kop; $('.cs-sub').textContent = sub; $('.cs-onder').classList.add('aan'); },
    melding(html){ const m = $('.cs-melding'); m.innerHTML = html; m.classList.add('aan'); clearTimeout(meldTimer); meldTimer = setTimeout(() => m.classList.remove('aan'), 2600); },
    titel(info){ $('.cs-onder').classList.remove('aan'); $('.cs-melding').classList.remove('aan');
      $('.cs-titel').innerHTML = `${info.logoImg ? `<img src="${info.logoImg.src}" alt="">` : ''}<div class="cs-t1">${esc(info.naam)}${info.nr ? ` <span>#${info.nr}</span>` : ''}</div><div class="cs-t2">${info.huur ? `Gehuurd door ${esc(info.club)}` : info.o23 ? `Nieuwe speler van de O23 van ${esc(info.club)}` : `Nieuwe speler van ${esc(info.club)}`}</div>`;
      $('.cs-titel').classList.add('aan'); },
  };
}
