/* ===================== Achtergrondmuziek ===================== */
// Rustige muziek (gemaakt met scripts/maak-muziek.mjs, de mp3's staan in public/muziek). Op het startscherm speelt
// 'menu', in het spel wisselen 'spel-1' en 'spel-2' elkaar af, met een zachte overgang. Aan/uit en het volume
// staan in localStorage (ook op het startscherm, waar nog geen spel is). Browsers spelen pas geluid na een klik
// of toets: daarom begint de muziek bij de eerste klik. Lukt laden of afspelen niet, dan blijft het gewoon stil.

const MAP = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL || '/') + 'muziek/';
const LIJSTEN = {menu:['menu'], spel:['spel-1', 'spel-2']};
const OVERGANG = 2000; // ms
const VERSIE = 6; // (ophogen na nieuwe muziek: anders speelt de browser soms de oude versie uit zijn cache)

const lees = (k, std) => { try { const v = localStorage.getItem(k); return v === null ? std : v; } catch (e){ return std; } };
const schrijf = (k, v) => { try { localStorage.setItem(k, v); } catch (e){} };

let AAN = lees('muziek', 'aan') !== 'uit';
let VOLUME = Math.min(1, Math.max(0, parseFloat(lees('muziekVolume', '0.35')) || 0));
let ontgrendeld = false, lijst = 'menu', idx = 0, speler = null, fadeId = 0;

export const muziekAan = () => AAN;
export const muziekVolume = () => VOLUME;

// Een speler zacht naar een volume brengen (en daarna eventueel pauzeren)
function fade(a, naar, ms, klaar){
  const id = ++fadeId, van = a.volume, t0 = performance.now();
  const stap = () => {
    if (a.__fade !== id) return;
    const t = Math.min(1, (performance.now() - t0) / ms);
    a.volume = Math.max(0, Math.min(1, van + (naar - van) * t));
    if (t < 1) requestAnimationFrame(stap); else if (klaar) klaar();
  };
  a.__fade = id; requestAnimationFrame(stap);
}

function nieuweSpeler(naam){
  const a = new Audio(MAP + naam + '.mp3?v=' + VERSIE);
  a.preload = 'auto'; a.volume = 0; a.__naam = naam;
  a.addEventListener('ended', volgende);
  a.addEventListener('error', () => {}); // (ontbreekt het bestand: stil blijven)
  return a;
}

// Naar een ander nummer: het oude zacht weg, het nieuwe zacht erin
function speel(naam){
  const oud = speler;
  if (oud && oud.__naam === naam && !oud.paused) return;
  if (oud){ fade(oud, 0, OVERGANG, () => { oud.pause(); oud.removeAttribute('src'); oud.load(); }); }
  const a = speler = nieuweSpeler(naam);
  const p = a.play(); if (p && p.catch) p.catch(() => {});
  fade(a, VOLUME, OVERGANG);
}

function volgende(){
  const l = LIJSTEN[lijst]; idx = (idx + 1) % l.length;
  if (l.length === 1 && speler){ speler.currentTime = 0; const p = speler.play(); if (p && p.catch) p.catch(() => {}); return; }
  speel(l[idx]);
}

function startLijst(naam){
  lijst = naam; idx = 0;
  if (AAN && ontgrendeld && !document.hidden) speel(LIJSTEN[naam][0]);
}

// Het menu (geen spel) of het spel: na elke weergave kijken of de lijst moet wisselen
export function muziekNaRender(inSpel){
  const naam = inSpel ? 'spel' : 'menu';
  if (naam !== lijst) startLijst(naam);
}

export function zetMuziek(aan){
  AAN = !!aan; schrijf('muziek', AAN ? 'aan' : 'uit');
  if (!AAN){ if (speler){ const a = speler; fade(a, 0, 600, () => a.pause()); } return; }
  ontgrendeld = true;
  if (speler && speler.__naam && LIJSTEN[lijst].includes(speler.__naam)){ const p = speler.play(); if (p && p.catch) p.catch(() => {}); fade(speler, VOLUME, 600); }
  else speel(LIJSTEN[lijst][idx] || LIJSTEN[lijst][0]);
}

export function zetVolume(v){
  VOLUME = Math.min(1, Math.max(0, +v || 0)); schrijf('muziekVolume', String(VOLUME));
  if (speler && !speler.paused){ speler.__fade = 0; speler.volume = VOLUME; }
}

export function startMuziek(){
  if (typeof document === 'undefined') return;
  // de eerste klik of toets ontgrendelt het geluid
  const ontgrendel = () => {
    if (ontgrendeld) return; ontgrendeld = true;
    window.removeEventListener('pointerdown', ontgrendel, true); window.removeEventListener('keydown', ontgrendel, true);
    if (AAN) speel(LIJSTEN[lijst][idx]);
  };
  window.addEventListener('pointerdown', ontgrendel, true); window.addEventListener('keydown', ontgrendel, true);
  // tabblad weg: zacht stil; terug: verder waar het was
  document.addEventListener('visibilitychange', () => {
    if (!speler || !AAN || !ontgrendeld) return;
    if (document.hidden){ const a = speler; fade(a, 0, 400, () => a.pause()); }
    else { const p = speler.play(); if (p && p.catch) p.catch(() => {}); fade(speler, VOLUME, 800); }
  });
}
