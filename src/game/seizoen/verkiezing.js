import { S, club, seizoenLabel } from '../../core/state.js';
import { AANTAL_RONDES, CLUBS, rondesVan } from '../../data/gegevens.js';
import { stand } from '../competitie/spelers.js';
import { metVoorletter } from '../media/nieuws.js';

/* ===================== Speler van het Seizoen ===================== */
// Een echte verkiezing: alle spelers van de competitie krijgen punten, de beste wint.
// Goals en assists tellen het zwaarst, daarna het cijfer (alleen voor wie echt speelde) en hoe de ploeg eindigde.
// (wie het grootste deel van het seizoen geblesseerd was, kan niet de beste van het seizoen zijn: minstens de helft gespeeld)
export const MIN_CIJFER = 7;
// (de helft van de competitiewedstrijden van jouw league; t = de league, standaard die van je club)
export const minWedSeizoen = (t = club().t) => Math.max(8, Math.round((rondesVan(t) || AANTAL_RONDES) * .5));
export const minBasisSeizoen = t => Math.max(6, Math.round(minWedSeizoen(t) * .6));
const ploegBonus = plek => plek === 1 ? 4 : plek === 2 ? 2.5 : plek === 3 ? 1.5 : 0;
const cijferPunten = c => (c - 6.5) * 8;
// Een kleine vaste spreiding per speler en seizoen, zodat niet altijd de topscorer wint
function spreiding(sleutel){ let h = 2166136261; for (let i = 0; i < sleutel.length; i++){ h ^= sleutel.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000 * 2 - 1; }

// Waarom je (niet) mee mag doen
export function magMeedoen(wed, basis, gem){
  const MIN_WED = minWedSeizoen(), MIN_BASIS = minBasisSeizoen(club().t);
  if (wed < MIN_WED) return `Je speelde maar ${wed} wedstrijden (minstens ${MIN_WED} nodig).`;
  if (basis < MIN_BASIS) return `Je stond maar ${basis} keer in de basis (minstens ${MIN_BASIS} nodig).`;
  if (gem === null || gem < MIN_CIJFER) return `Je gemiddelde cijfer was te laag (minstens ${MIN_CIJFER.toFixed(1).replace('.', ',')} nodig).`;
  return null;
}

// t = competitie, gem = jouw gemiddelde cijfer. Geeft {winnaar, top, plek (jouw plek of null), reden (waarom je niet meedeed)}
export function spelerVanHetSeizoen(t, gem){
  const sp = S.sp, ss = S.ss, st = stand(t), plekVan = id => st.indexOf(id) + 1, label = seizoenLabel();
  const wed = ss.wed || 0, basis = ss.basis ?? wed, g = ss.g || 0, a = ss.a || 0;
  const lijst = [];
  // de andere spelers: met goals of assists in deze competitie
  for (const x of Object.values(ss.st || {})){
    if (x.jij || !CLUBS[x.club] || CLUBS[x.club].t !== t || (x.g || 0) + (x.a || 0) === 0) continue;
    const schatting = Math.max(6.2, Math.min(7.8, 6.4 + .06 * x.g + .05 * x.a));
    const punten = x.g * 3 + x.a * 2 + cijferPunten(schatting) + ploegBonus(plekVan(x.club)) + spreiding(x.club + x.n + label) * 1.5;
    lijst.push({naam:metVoorletter(x), club:CLUBS[x.club].n, g:x.g, a:x.a, punten});
  }
  // jij, als je mee mag doen
  const reden = club().t === t ? magMeedoen(wed, basis, gem) : 'Je speelde niet in deze competitie.';
  if (!reden){
    const cs = sp.pos === 'VERD' || sp.pos === 'KEEPER' ? (ss.cs || 0) * (sp.pos === 'KEEPER' ? 1.5 : 1) : 0;
    const punten = g * 3 + a * 2 + cijferPunten(gem) * Math.min(1, basis / 10) + cs + ploegBonus(plekVan(sp.club));
    lijst.push({naam:sp.naam, club:club().n, g, a, punten, jij:true});
  }
  lijst.sort((x, y) => y.punten - x.punten);
  const plek = lijst.findIndex(x => x.jij) + 1 || null;
  return {winnaar:lijst[0] || null, top:lijst.slice(0, 3), plek, reden};
}
