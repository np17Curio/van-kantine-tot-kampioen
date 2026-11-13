import { CLUBS, ELITE_NAAM, GAST_START, herschaalLand, landBasis, zetClubs, zetWereld } from '../data/gegevens.js';
import { zetLand } from '../data/landen.js';
import { maakSchoolvraag } from '../game/prive/school.js';

// Na herladen bestaan functies in opgeslagen gebeurtenissen niet meer: zet het spel terug naar een veilige stap
export function herstel(st){
  // Het mannen- of vrouwenvoetbal (oude opslag: mannen). Eerst, want de leagues en clubnamen hangen ervan af
  if (st) st.wereld = st.wereld || 'm';
  zetWereld(st && st.wereld);
  // Elk land een eigen niveau (UEFA-ranking): oude opslag eenmalig omrekenen
  if (st && !st.niveauV2){ st.niveauV2 = true; if (st.clubs) st.clubs = herschaalLand(st.clubs, st.land || 'Nederland');
    if (st.landen) for (const l in st.landen) if (st.landen[l] && st.landen[l].clubs) st.landen[l].clubs = herschaalLand(st.landen[l].clubs, l); }
  if (st) zetClubs(st.clubs || landBasis(st.land || 'Nederland'));
  zetLand(st && st.land || 'Nederland');
  if (st && st.gasten) st.gasten.forEach((x, i) => { if (CLUBS[GAST_START + i]) Object.assign(CLUBS[GAST_START + i], x); }); // de Europese gasten van dit seizoen
  for (let i = 0; i < 8; i++) CLUBS[i].n = st && st.slots && st.slots[i] ? st.slots[i].n : ELITE_NAAM[i]; // de Europese Elite
  // Oudere opslag zonder status-gegevens bijwerken
  if (st && st.sp && st.sp.status === undefined) Object.assign(st.sp, {status:10, clubWed:0, clubSz:0, statusNiveau:0, sindsTransfer:10, legendeHier:false});
  // Versie 6: interlands en zaakwaarnemer. Herkomst wordt eenmalig gevraagd in de trainingsweek
  if (st && st.sp && st.sp.bonds === undefined){ st.sp.bonds = {}; st.sp.land = null; st.sp.agent = {doel:null, antwoord:null, gehaald:false, sugg:null}; st.car.int = st.car.int || {}; }
  if (st && st.fase === 'oproep' && !st.oproep) st.fase = 'week';
  // Versie 12: focus, school en ouders
  if (st && st.sp){
    if (st.sp.focus === undefined) st.sp.focus = 65;
    if (!st.sp.school) st.sp.school = {cijfers:[], gehad:[]};
    if (!st.sp.ouders) st.sp.ouders = {boos:false, trots:false};
    if (st.fase === 'week' && st.week && st.sp.leeftijd < 18 && !st.week.school) st.week.school = maakSchoolvraag(st.sp);
  }
  // Versie 19: wonen, auto en rijlessen
  if (st && st.sp && st.sp.hond && !st.sp.huisdier && !st.sp.dieren){ st.sp.dieren = [{soort:'hond', naam:'Penalty', trucs:0, weken:0}]; st.sp.hond = false; }
  if (st && st.sp && st.sp.huisdier){ st.sp.dieren = (st.sp.dieren || []).concat(st.sp.huisdier); st.sp.huisdier = null; }
  if (st && st.sp && !st.sp.ouders) st.sp.ouders = {boos:false, trots:false};
  if (st && st.sp && st.sp.ouders.band === undefined) st.sp.ouders.band = 70;
  if (st && st.sp && st.sp.woning === undefined){
    const it = st.sp.items || {};
    st.sp.woning = it.villa ? 'villa' : it.appartement ? 'penthouse' : 'ouders';
    st.sp.auto = it.auto ? 'sport' : st.sp.rijbewijs ? 'oud' : null;
    st.sp.rij = {lessen:st.sp.rijbewijs ? 20 : 0, theorie:!!st.sp.rijbewijs};
  }
  // Geen hoofdstukken meer: stond je midden in een hoofdstuk, dan ga je door waar het hoofdstuk naartoe ging. De verleiding
  // (vroeger hoofdstuk 4) is nu een weekbericht: was die al geweest, dan komt hij niet nog een keer
  if (st && st.fase === 'hoofdstuk'){ st.fase = (st.hoofdstuk && typeof st.hoofdstuk.terug === 'string' && st.hoofdstuk.terug !== 'hoofdstuk') ? st.hoofdstuk.terug : 'week'; }
  if (st && st.hoofdstuk !== undefined) delete st.hoofdstuk;
  if (st && st.sp && st.sp.journey && st.sp.journey.h !== undefined){ const J = st.sp.journey; J.verleiding = J.h >= 4; delete J.h; J.v = 3; }
  if (st && st.fase === 'event' && !(st.ev && st.ev.opts && typeof st.ev.opts[0].f === 'function')){ st.ev = null; st.fase = 'week';
    if (st.hoogNu){ (st.hoogWacht = st.hoogWacht || []).unshift(st.hoogNu); } } // (een hoogtepunt komt volgende week terug)
  if (st) st.hoogNu = null;
  // Meerdere rivalen: sp.rivaal blijft je hoofdrivaal, sp.rivalen zijn je andere rivalen (oude opslag: nog geen lijst)
  if (st && st.sp){ if (!Array.isArray(st.sp.rivalen)) st.sp.rivalen = []; st.sp.rivalen = st.sp.rivalen.filter(R => R && R.n && !(st.sp.rivaal && R.n === st.sp.rivaal.n && R.v === st.sp.rivaal.v)); }
  return st;
}
