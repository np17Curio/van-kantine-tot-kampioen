import { S, club, ovr, salarisVoor, waarde } from '../../core/state.js';
import { pick, randInt, rnd } from '../../core/utils.js';
import { CLUBS, CLUBS_BASIS, JEUGD, MIN, zetClubs } from '../../data/gegevens.js';
import { LAND_DATA, NL, SPEEL_LANDEN, thuisLand, zetLand } from '../../data/landen.js';
import { nl } from '../prive/school.js';
import { nieuweTabellen } from '../speler/status.js';
import { transferScore } from './transfers.js';
import { pasSlotsToe } from '../competitie/europa.js';

/* ===================== Verhuizen naar een ander land ===================== */
// Club-sleutel per land: club 12 in Engeland is een andere club dan club 12 in Nederland. De Europese Elite (0-7) is overal dezelfde.
// In Nederland blijft de sleutel het gewone nummer, zodat oude saves blijven werken
export const ck = id => (id < 8 || thuisLand() === 'Nederland') ? id : thuisLand() + '|' + id;
// Een club uit een ander land (voor biedingen uit het buitenland): naam, niveau en sterkte uit de opgeslagen stand van dat land
export function vreemdeClub(land, id){
  const st = S.landen && S.landen[land] && S.landen[land].clubs ? S.landen[land].clubs[id] : CLUBS_BASIS[id], L = LAND_DATA[land];
  const n = land === 'Nederland' ? NL.clubs[id] : L.clubs[id - 8];
  return {n, t:st[0], s:st[1], land, div: st[0] === 0 ? 'Europese Elite' : land === 'Nederland' ? NL.divs[st[0]] : L.divs[st[0] - 1]};
}
export const isBuitenland = o => !!(o && o.land && o.land !== thuisLand());
export const clubInfo = o => isBuitenland(o) ? vreemdeClub(o.land, o.club) : CLUBS[o.club];
export const okey = o => (isBuitenland(o) ? o.land + '|' : '') + o.club;
// In de zomer melden zich soms clubs uit een ander land (vanaf semi-prof, vanaf je 18e)
export function buitenlandseBods(modus){
  const sp = S.sp, eigen = club(), o = ovr(sp), score = transferScore();
  if (!(modus === 'normaal' || modus === 'vrij') || eigen.t === JEUGD || eigen.t === 0 || eigen.t > 3 || sp.leeftijd < 18 || sp.o23 || sp.huur) return [];
  if (rnd() > .18 + Math.min(.15, sp.rep / 300) + (sp.transferlijst ? .2 : 0) - (sp.imago > 0 ? .12 : 0)) return [];
  const landen = SPEEL_LANDEN.filter(l => l !== thuisLand()), uit = [], aantal = rnd() < .3 ? 2 : 1;
  for (let k = 0; k < aantal; k++){
    const land = pick(landen.filter(l => !uit.some(b => b.land === l)));
    const kand = [];
    for (let id = 8; id < 40; id++){ const c = vreemdeClub(land, id); if (c.t >= Math.max(1, eigen.t - 1) && c.t <= Math.min(3, eigen.t) && score >= MIN[c.t] - 2 && c.s <= o + 8) kand.push(id); }
    if (!kand.length) continue;
    const id = pick(kand), c = vreemdeClub(land, id);
    uit.push({club:id, land, salaris:Math.round(salarisVoor(c.t, o) * (1 + rnd() * .3) / 100) * 100, jaren: sp.leeftijd >= 31 ? randInt(1, 2) : randInt(2, 4),
      som: sp.contract > 0 && eigen.t <= 2 ? Math.round(Math.max(waarde(sp), 50000) * (.9 + rnd() * .4) / 10000) * 10000 : 0});
  }
  return uit;
}
// Wisselen van land: de stand van het oude land bewaren (wie in welke divisie speelt) en die van het nieuwe land laden
export function wisselLand(nl){
  const oud = thuisLand(), L = S.landen = S.landen || {};
  L[oud] = {clubs:CLUBS.map(c => [c.t, c.s]), vorig:S.vorig || null, slots:S.slots || null};
  S.land = nl; zetLand(nl);
  const st = L[nl];
  zetClubs(st ? st.clubs : null); S.clubs = st ? st.clubs : null;
  S.vorig = st ? st.vorig : null;
  S.slots = st && st.slots ? st.slots : null; pasSlotsToe(); // de Europese Elite zoals die in dat land bekend is
  S.tab = nieuweTabellen();
}
