import { S } from '../../core/state.js';
import { clamp, pick, randInt, rnd } from '../../core/utils.js';
import { CLUBS, DIVS, ELITE_LAND, ELITE_NAAM, divClubs } from '../../data/gegevens.js';
import { NIEUWE_CLUBS, SPEEL_LANDEN, thuisLand } from '../../data/landen.js';
import { simGoals } from './competitie.js';
import { clubNaam } from '../../data/gegevens.js';

/* ===================== De Europese Elite: één competitie met clubs uit heel Europa ===================== */
// De Elite heeft 8 vaste plaatsen (club-id 0-7). Elke plaats heeft een identiteit (naam en land) die kan wisselen:
// een gedegradeerde buitenlandse club gaat terug naar zijn eigen land, en kampioenen uit andere landen kunnen erin komen.
// Een plaats die in jouw eigen competitie terechtkomt, wordt een club uit jouw land (een fusieclub).
export const europaLanden = () => [...new Set([...SPEEL_LANDEN, 'Denemarken', 'Oekraïne'])];
export const slots = () => S.slots || (S.slots = ELITE_NAAM.map((n, i) => ({n, land:ELITE_LAND[i]})));
// De namen van de plaatsen in CLUBS zetten (na laden, een nieuw spel of een verhuizing)
export function pasSlotsToe(){ const l = S && S.slots; for (let i = 0; i < 8; i++) CLUBS[i].n = l && l[i] ? l[i].n : ELITE_NAAM[i]; }
export const slotLand = i => i < 8 ? slots()[i].land : thuisLand();
export const isBuitenlandsePlaats = i => i < 8 && slotLand(i) !== thuisLand();
// Een naam die nog nergens in gebruik is, uit de lijst van dat land (ook niet al gekozen in deze ronde van wissels)
const gereserveerd = new Set();
function vrijeNaam(land){
  const bezet = new Set(CLUBS.map(c => c.n).concat(slots().map(x => x.n), [...gereserveerd]));
  const l = (NIEUWE_CLUBS[land] || []).filter(n => !bezet.has(n));
  const n = clubNaam(l.length ? pick(l) : `${land === thuisLand() ? 'FC' : 'Club'} ${land} ${randInt(2, 99)}`);
  gereserveerd.add(n); return n;
}
const beschermd = () => new Set([S.sp && S.sp.club, S.trainer && S.trainer.club].filter(x => x != null));
// Een plaats krijgt een nieuwe identiteit: nieuwe naam, land en sterkte, en een nieuwe selectie
export function nieuweIdentiteit(id, {n, land, s}){
  slots()[id] = {n, land}; CLUBS[id].n = n; CLUBS[id].s = s;
  if (S.sel) delete S.sel[id];
  if (S.teamHist) delete S.teamHist[id];
  const sp = S.sp; if (sp){ if (sp.fans) delete sp.fans[id]; if (sp.oudeClubs) delete sp.oudeClubs[id]; }
}
// Een kampioen uit een ander land (niet jouw land: die promoveert via de Topdivisie)
function uitdager(){
  const land = pick(europaLanden().filter(l => l !== thuisLand()));
  return {n:vrijeNaam(land), land, s:randInt(78, 84)};
}
// Wedstrijd op neutraal terrein; bij gelijkspel strafschoppen
function speel(a, b){
  const [ga, gb] = simGoals(a, b, false), wint = ga > gb || (ga === gb && rnd() < .5);
  return {ga, gb, pen:ga === gb, wint};
}
// Bij de wissels van de Elite (uit bepaalPromotie) de Europese kant toevoegen. wissels wordt aangevuld.
export function europeseWissels(wissels, eliteStand){
  const thuis = thuisLand(), vast = beschermd(), inWissel = id => wissels.some(w => w.id === id);
  gereserveerd.clear();
  // a. Een buitenlandse club die uit de Elite degradeert, gaat terug naar zijn land; zijn plaats in de Topdivisie wordt een fusieclub
  for (const w of wissels){
    if (w.van !== 0 || w.naar !== 1 || !isBuitenlandsePlaats(w.id) || vast.has(w.id)) continue;
    const top = divClubs(1).filter(i => i !== w.id).map(i => CLUBS[i].s), s = Math.round(top.reduce((a, b) => a + b, 0) / Math.max(1, top.length)) - 2;
    w.terug = slotLand(w.id); w.oud = CLUBS[w.id].n; w.nieuw = {n:vrijeNaam(thuis), land:thuis, s:clamp(s, 30, 95)};
    w.tekst = `${w.oud} degradeert uit de ${DIVS[0]} en keert terug naar ${w.terug}. In de ${DIVS[1]} komt nieuwe fusieclub ${w.nieuw.n}.`;
  }
  // b. Europese play-off: de kampioen van een ander land tegen de laagst geëindigde buitenlandse club die blijft
  const u = uitdager();
  const kand = eliteStand.slice().reverse().filter(i => isBuitenlandsePlaats(i) && !inWissel(i) && !vast.has(i));
  if (kand.length){
    const id = kand[0], m = speel(u.s, CLUBS[id].s), uitslag = `${m.ga}-${m.gb}${m.pen ? ' (na strafschoppen)' : ''}`;
    const po = {id, van:0, naar:0, europa:true, oud:CLUBS[id].n, oudLand:slotLand(id), uitdager:u, uitslag, gewonnen:m.wint};
    if (m.wint){ po.nieuw = u; po.tekst = `Europese play-off: ${u.n} (kampioen van ${u.land}) wint met ${uitslag} van ${po.oud} en speelt volgend seizoen in de ${DIVS[0]}. ${po.oud} gaat terug naar ${po.oudLand}.`; }
    else po.tekst = `Europese play-off: ${po.oud} houdt ${u.n} (kampioen van ${u.land}) af met ${uitslag} en blijft in de ${DIVS[0]}.`;
    wissels.push(po);
    return wissels;
  }
  // d. Geen buitenlandse club meer in de Elite: de uitdager speelt tegen de laagste club uit jouw land.
  //    Wint hij, dan degradeert die club, en een plaats uit de Topdivisie wordt de buitenlandse kampioen.
  const h = eliteStand.slice().reverse().find(i => !inWissel(i) && !vast.has(i));
  const plaats = divClubs(1).find(i => i < 8 && !inWissel(i) && !vast.has(i));
  if (h == null || plaats == null) return wissels;
  const m = speel(u.s, CLUBS[h].s), uitslag = `${m.ga}-${m.gb}${m.pen ? ' (na strafschoppen)' : ''}`;
  if (!m.wint){ wissels.push({id:h, van:0, naar:0, europa:true, uitdager:u, uitslag, gewonnen:false, tekst:`Europese play-off: ${CLUBS[h].n} houdt ${u.n} (kampioen van ${u.land}) af met ${uitslag}.`}); return wissels; }
  wissels.push({id:h, van:0, naar:1, europa:true, tekst:`Europese play-off: ${u.n} (kampioen van ${u.land}) wint met ${uitslag} van ${CLUBS[h].n}, dat degradeert naar de ${DIVS[1]}.`},
    {id:plaats, van:1, naar:0, europa:true, verborgen:true, oud:CLUBS[plaats].n, nieuw:u});
  return wissels;
}
// Krantenberichten over de Elite (aan het einde van het seizoen)
export function europaKrant(wissels){
  const uit = [];
  for (const w of wissels){
    if (w.verborgen) continue;
    if (w.terug) uit.push({kop:`${w.oud} degradeert en keert terug naar ${w.terug}`, tekst:w.tekst});
    else if (w.europa && w.gewonnen) uit.push({kop:`${w.uitdager.n} uit ${w.uitdager.land} verovert een plek in de ${DIVS[0]}`, tekst:w.tekst});
    else if (w.europa) uit.push({kop:`Europese play-off: ${CLUBS[w.id].n} blijft in de ${DIVS[0]}`, tekst:w.tekst});
    else if (w.naar === 0 && w.van === 1) uit.push({kop:`${CLUBS[w.id].n} promoveert naar de ${DIVS[0]}`, tekst:`${CLUBS[w.id].n} speelt volgend seizoen tussen de grootste clubs van Europa${w.po ? ', na winst in de nacompetitie' : ''}.`});
  }
  return uit;
}
