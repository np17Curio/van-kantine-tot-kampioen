import { CLUBS, ELITE_NAAM, JEUGD, zetClubs } from '../data/gegevens.js';
import { zetLand } from '../data/landen.js';
import { maakSchoolvraag } from '../game/prive/school.js';
import { niveauVoor } from '../game/speler/status.js';

// Na herladen bestaan functies in opgeslagen gebeurtenissen niet meer: zet het spel terug naar een veilige stap
export function herstel(st){
  if (st) zetClubs(st.clubs || null);
  zetLand(st && st.land || 'Nederland');
  for (let i = 0; i < 8; i++) CLUBS[i].n = st && st.slots && st.slots[i] ? st.slots[i].n : ELITE_NAAM[i]; // de Europese Elite
  // Oudere opslag zonder status-gegevens bijwerken
  if (st && st.sp && st.sp.status === undefined) Object.assign(st.sp, {status:10, clubWed:0, clubSz:0, statusNiveau:0, sindsTransfer:10, legendeHier:false});
  // Versie 4: een tiener die net bij de senioren zit, is weer een jonkie
  if (st && st.sp && !st.mig4){
    st.mig4 = true;
    if (CLUBS[st.sp.club].t !== JEUGD && st.sp.leeftijd < 20 && st.sp.clubSz === 0){ st.sp.status = Math.min(st.sp.status, 12); st.sp.statusNiveau = 0; st.sp.vert = Math.min(st.sp.vert, 50); }
  }
  // Versie 5: Bankspeler toegevoegd, statuspunten omrekenen naar de nieuwe schaal
  if (st && st.sp && !st.mig5){
    st.mig5 = true;
    const X = [0, 20, 40, 60, 85, 100], Y = [0, 35, 55, 75, 90, 100], oud = st.sp.status;
    let nw = 0;
    for (let i = 1; i < X.length; i++){ if (oud <= X[i]){ nw = Y[i - 1] + (oud - X[i - 1]) / (X[i] - X[i - 1]) * (Y[i] - Y[i - 1]); break; } }
    if (CLUBS[st.sp.club].t !== JEUGD && (st.sp.clubWed || 0) < 14 && !st.sp.legendeHier) nw = Math.min(nw, 25);
    st.sp.status = nw;
    st.sp.statusNiveau = niveauVoor(nw, st.sp.clubSz, st.sp.clubWed, st.sp.legendeHier, CLUBS[st.sp.club].t, st.sp.leeftijd);
  }
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
  if (st && st.fase === 'event' && !(st.ev && st.ev.opts && typeof st.ev.opts[0].f === 'function')){ st.ev = null; st.fase = 'week'; }
  return st;
}
