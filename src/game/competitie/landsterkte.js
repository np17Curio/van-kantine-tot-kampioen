import { S } from '../../core/state.js';
import { clamp, randInt } from '../../core/utils.js';
import { CLUBS, GAST_START, GASTEN, landBasis } from '../../data/gegevens.js';
import { SPEEL_LANDEN, thuisLand, EUROPA_LANDEN } from '../../data/landen.js';
import { leagueInfo } from '../speler/niveau.js';
import { hervormStand } from '../transfers/buitenland.js';
import { BEKERS, bekerRondeNaam } from './beker.js';

/* ===================== De sterkte van een land verandert ===================== */
// In je eigen land groeien en krimpen de clubs met hun spelers (markt.js). De andere landen ontwikkelen zich hier, één keer per seizoen:
// een trend per land (goede en slechte generaties), wat toeval per club, Europese successen, en een rem richting de startsterkte.
export const landSterkte = land => { const L = leagueInfo(land, 1); return L ? L.gem : 0; };
// (alle: ook Mexico en de VS, voor het overzicht; zonder: alleen Europa, voor de plaatsen in de Europese bekers)
export const landenRanking = (alle = false) => (alle ? SPEEL_LANDEN : EUROPA_LANDEN).map(land => ({land, gem:landSterkte(land)})).sort((a, b) => b.gem - a.gem).map((x, i) => ({...x, plek:i + 1}));
// Europese bonus voor de gastclubs van dit seizoen: halve finale +1, finale +2, winst +3 (geld en aanzien)
function europaBonus(){
  const B = S.ss && S.ss.bekers, uit = {}; if (!B) return uit;
  for (let g = GAST_START; g < GAST_START + GASTEN; g++){
    const gast = CLUBS[g] && CLUBS[g].gast; if (!gast) continue;
    let b = 0;
    for (const k in BEKERS){ if (!BEKERS[k].europa || !B[k]) continue;
      B[k].rondes.forEach((r, i) => { if (!r.some(m => m.h === g || m.u === g)) return; const n = bekerRondeNaam(k, i); b = Math.max(b, n === 'Finale' ? 2 : n === 'Halve finale' ? 1 : 0); });
      if (B[k].winnaar === g) b = 3; }
    if (b) uit[`${gast.land}|${gast.id}`] = b;
  }
  return uit;
}
export function ontwikkelLanden(){
  if (S.landJaar === S.jaar) return [];
  S.landJaar = S.jaar;
  const voor = landenRanking(true), bonus = europaBonus(), T = S.landTrend = S.landTrend || {}, L = S.landen = S.landen || {};
  for (const land of SPEEL_LANDEN){
    if (land === thuisLand()) continue; // daar bepalen de spelers de sterkte
    const basis = landBasis(land), lijst = (L[land] && L[land].clubs ? hervormStand(L[land].clubs, land) : basis).map(x => x.slice());
    T[land] = Math.round(((T[land] || 0) * .6 + randInt(-2, 2)) * 10) / 10;
    lijst.forEach((x, i) => { if (i < 8 || i >= GAST_START || !(x[0] >= 1)) return;
      const rem = ((basis[i] ? basis[i][1] : x[1]) - x[1]) * .15;
      x[1] = clamp(Math.round(x[1] + T[land] * .5 + randInt(-2, 2) + rem + (bonus[`${land}|${i}`] || 0)), 30, 95); });
    L[land] = {...(L[land] || {}), clubs:lijst};
  }
  const na = landenRanking(true);
  S.landRank = {vorig:voor, nu:na};
  // de krant: wie passeert wie (je eigen land altijd)
  const krant = [], thuis = thuisLand();
  for (const x of na){ const v = voor.find(y => y.land === x.land); if (!v || v.plek <= x.plek) continue;
    const gepasseerd = voor.find(y => y.plek === x.plek), gp = gepasseerd && na.find(y => y.land === gepasseerd.land); if (!gp || gp.gem >= x.gem) continue; // (bij gelijke stand geen bericht)
    krant.push({land:x.land, kop:`${x.land} passeert ${gepasseerd.land} op de landenranking`, tekst:`De clubs uit ${x.land} werden sterker dit seizoen. De competitie staat nu ${x.plek}e van Europa (gemiddeld ${x.gem}).`}); }
  const mijn = na.find(x => x.land === thuis), mv = voor.find(x => x.land === thuis);
  if (mijn && mv && mijn.plek > mv.plek && na.some(x => x.plek < mijn.plek && x.gem > mijn.gem && voor.find(y => y.land === x.land).plek > mv.plek)) krant.push({land:thuis, kop:`${thuis} zakt naar plek ${mijn.plek} op de landenranking`, tekst:`Andere landen gingen harder vooruit. De ${leagueInfo(thuis, 1).naam} is nu gemiddeld ${mijn.gem}.`});
  return krant.sort((a, b) => (b.land === thuis) - (a.land === thuis));
}
