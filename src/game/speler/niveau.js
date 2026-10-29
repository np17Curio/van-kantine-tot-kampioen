import { S, club, ovr } from '../../core/state.js';
import { CLUBS, DIVS, divClubs, landBasis } from '../../data/gegevens.js';
import { SPEEL_LANDEN, divNaam, thuisLand } from '../../data/landen.js';
import { hervormStand } from '../transfers/buitenland.js';

/* ===================== Welke competitie past bij jou? ===================== */
// Per league: de naam, de sterkste en de zwakste club en het gemiddelde. In jouw land de stand van nu,
// in andere landen de bewaarde stand (als je daar eerder speelde) of de startstand.
export function leagueInfo(land, t){
  let sterktes;
  if (land === thuisLand()) sterktes = divClubs(t).map(i => CLUBS[i].s);
  else { const L = S.landen && S.landen[land] && S.landen[land].clubs ? hervormStand(S.landen[land].clubs, land) : landBasis(land); sterktes = L.filter((x, i) => i >= 8 && x && x[0] === t).map(x => x[1]); }
  const naam = land === thuisLand() ? DIVS[t] : divNaam(land, t) || `${t}e league`;
  if (!sterktes.length) return null;
  return {land, t, naam, top:Math.max(...sterktes), bodem:Math.min(...sterktes), gem:Math.round(sterktes.reduce((a, b) => a + b, 0) / sterktes.length)};
}
export const OORDEEL = {
  tegoed:{n:'Te goed', d:'je bent beter dan iedereen hier', cls:'r-gem'},
  top:{n:'Topspeler', d:'je hoort bij de besten van deze league', cls:'r-veilig'},
  past:{n:'Past goed', d:'een vaste basisplaats is haalbaar', cls:'r-veilig'},
  zwaar:{n:'Zwaar', d:'je moet knokken voor je plek', cls:'r-gem'},
  tehoog:{n:'Te hoog gegrepen', d:'hier ben je (nog) niet goed genoeg voor', cls:'r-riskant'},
};
export function oordeel(o, L){
  if (o > L.top + 3) return 'tegoed';
  if (o >= L.gem + 3) return 'top';
  if (o >= L.gem - 4) return 'past';
  if (o >= L.bodem - 3) return 'zwaar';
  return 'tehoog';
}
// Alle leagues, de best passende eerst: ideaal is net boven het gemiddelde (basisplaats, en toch uitdagend genoeg om te groeien)
export function alleLeagues(){ return SPEEL_LANDEN.flatMap(l => [1, 2].map(t => leagueInfo(l, t))).filter(Boolean); }
export function besteLeagues(o = ovr(S.sp)){ return alleLeagues().map(L => ({...L, afstand:Math.abs(o - (L.gem + 2))})).sort((a, b) => a.afstand - b.afstand); }
// Jouw league nu (null bij de O23, zonder club of na je carrière)
export function mijnLeague(){
  const sp = S.sp; if (!sp || sp.clubloos || sp.o23 || S.trainer || S.eigenaar) return null;
  const t = club().t; if (!(t >= 1)) return null;
  const L = leagueInfo(thuisLand(), t); return L ? {...L, oordeel:oordeel(ovr(sp), L)} : null;
}
