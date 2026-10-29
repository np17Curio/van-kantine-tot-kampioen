import { S, club, gemCijfer, mod, ovr, salarisVoor, waarde } from '../../core/state.js';
import { pick, randInt, rnd } from '../../core/utils.js';
import { CLUBS, CLUBS_LAND, DIVS, ELITE_ID, ELITE_THUIS, GAST_START, MIN, NL_CLUBS, WERELD, WINTER, clubNaam, clubsLand, divClubs, landBasis, zetClubs, zetWereld } from '../../data/gegevens.js';
import { speelRonde, stand } from '../competitie/spelers.js';
import { bekerSchema, nieuweBekers, speelBekerRonde } from '../competitie/beker.js';
import { LAND_DATA, SPEEL_LANDEN, divNaam, thuisLand, zetLand } from '../../data/landen.js';
import { nl } from '../prive/school.js';
import { nieuweTabellen } from '../speler/status.js';
import { transferScore } from './transfers.js';
import { pasSlotsToe, slotLand } from '../competitie/europa.js';
import { modFans } from '../wedstrijd/fans-pers.js';

/* ===================== Verhuizen naar een ander land ===================== */
// Club-sleutel per land: club 12 in Engeland is een andere club dan club 12 in Nederland. De Europese Elite (0-7) is overal dezelfde.
// In Nederland blijft de sleutel het gewone nummer, zodat oude saves blijven werken
export const ck = id => (id < 8 || thuisLand() === 'Nederland') ? id : thuisLand() + '|' + id;
// Een club uit een ander land (voor biedingen uit het buitenland): naam, niveau en sterkte uit de opgeslagen stand van dat land
export function vreemdeClub(land, id){
  const st = (S.landen && S.landen[land] && S.landen[land].clubs ? hervormStand(S.landen[land].clubs, land) : landBasis(land))[id] || [-1, 50], L = LAND_DATA[land];
  const n = id === ELITE_ID && ELITE_THUIS[land] && WERELD !== 'v' ? ELITE_THUIS[land].n : clubNaam((land === 'Nederland' ? NL_CLUBS[id - 8] : L.clubs[id - 8]) || 'Lege plaats');
  return {n, t:st[0], s:st[1], land, div: st[0] < 1 ? '' : divNaam(land, st[0])};
}
export const isBuitenland = o => !!(o && o.land && o.land !== thuisLand());
export const clubInfo = o => isBuitenland(o) ? vreemdeClub(o.land, o.club) : CLUBS[o.club];
export const okey = o => (isBuitenland(o) ? o.land + '|' : '') + o.club;
// In de transferperiode melden zich soms clubs uit een ander land (vanaf je 18e); in de winter minder vaak en hooguit één
export function buitenlandseBods(modus, winter){
  const sp = S.sp, eigen = club(), o = ovr(sp), score = transferScore();
  if (!(modus === 'normaal' || modus === 'vrij') || eigen.t < 1 || sp.leeftijd < 18 || sp.o23 || sp.huur) return [];
  const gem = gemCijfer() ?? S.vorigGem ?? 6.5, uit = [];
  const past = (land, id) => { const c = vreemdeClub(land, id); return c.t >= Math.max(1, eigen.t - 1) && c.t <= eigen.t && score >= MIN[c.t] - 2 && c.s <= o + 8; };
  // Scouts van een buitenlandse club volgden je dit seizoen: dat bod komt er zeker (als je nog goed genoeg bent)
  const sc = sp.scout; if (sc && sc.land !== thuisLand() && past(sc.land, sc.club)) uit.push(bodVan(sc.land, sc.club, true));
  const kans = .35 + Math.min(.2, sp.rep / 200) + (gem >= 7 ? .15 : gem >= 6.5 ? .07 : 0) + (sp.transferlijst ? .2 : 0) - (sp.imago > 0 ? .12 : 0);
  if (rnd() > kans * (winter ? .5 : 1)) return uit;
  const landen = SPEEL_LANDEN.filter(l => l !== thuisLand()), aantal = winter ? (uit.length ? 0 : 1) : rnd() < .15 ? 3 : rnd() < .4 ? 2 : 1;
  for (let k = 0; k < aantal; k++){
    const vrij = landen.filter(l => !uit.some(b => b.land === l)); if (!vrij.length) break;
    const land = pick(vrij);
    const kand = [];
    for (let id = 8; id < clubsLand(land); id++) if (past(land, id)) kand.push(id);
    if (!kand.length) continue;
    uit.push(bodVan(land, pick(kand)));
  }
  return uit;
}
function bodVan(land, id, gescout){
  const sp = S.sp, eigen = club(), o = ovr(sp), c = vreemdeClub(land, id);
  return {club:id, land, ...(gescout ? {gescout:true} : {}), salaris:Math.round(salarisVoor(c.t, o, c.s) * (1 + rnd() * .3) / 100) * 100, jaren: sp.leeftijd >= 31 ? randInt(1, 2) : randInt(2, 4),
      som: sp.contract > 0 && eigen.t <= 2 ? Math.round(Math.max(waarde(sp), 50000) * (.9 + rnd() * .4) / 10000) * 10000 : 0};
}
// Een club in de andere wereld (het mannen- of vrouwenvoetbal) van dat land: voor je jeugdvriend(in) van het andere geslacht.
// Altijd de startstand van die wereld (die competities spelen we niet)
export function andereWereldClub(land, id){
  const g = WERELD; zetWereld(g === 'v' ? 'm' : 'v');
  try { const st = landBasis(land)[id] || [-1, 50], L = LAND_DATA[land]; const n = clubNaam((land === 'Nederland' ? NL_CLUBS[id - 8] : L.clubs[id - 8]) || 'Lege plaats');
    return {n, t:st[0], s:st[1], land, div: st[0] < 1 ? '' : divNaam(land, st[0])}; }
  finally { zetWereld(g); }
}
// De club-ids van league t (1 of 2) in de andere wereld
export function andereWereldIds(land, t){ const g = WERELD; zetWereld(g === 'v' ? 'm' : 'v'); try { return landBasis(land).map((x, i) => i >= 8 && i < GAST_START && x[0] === t ? i : null).filter(i => i != null); } finally { zetWereld(g); } }
// De oude Europese Elite (niveau 0) omzetten: alle clubs van een land (8-39) opnieuw over niveau 1-4 (8 per niveau),
// wie in de Elite zat bovenaan; de plaatsen 0-7 doen nergens meer mee. Een stand in de nieuwe vorm blijft hetzelfde.
// De oude Elite-club van het land (Real Montclaro in Spanje, …) komt op plaats ELITE_ID in de hoogste competitie.
export function hervormStand(lijst, land){
  if (!lijst || !lijst.slice(0, 8).some(x => x[0] === 0)) return lijst;
  const uit = lijst.map(x => x.slice()), ids = []; for (let i = 8; i < CLUBS_LAND; i++) ids.push(i);
  const e = ELITE_THUIS[land]; if (e) uit[ELITE_ID] = [0, Math.max(uit[ELITE_ID][1], e.s)];
  ids.sort((a, b) => (uit[a][0] - uit[b][0]) || (uit[b][1] - uit[a][1]));
  ids.forEach((id, k) => { uit[id][0] = 1 + Math.floor(k / 8); });
  for (let i = 0; i < 8; i++) uit[i][0] = -1;
  return uit;
}
// Eenmalig voor een bestaande carrière (aan het einde van een seizoen): de Elite opheffen, hier en in de bewaarde andere landen
export function hervormEuropa(){
  S.mig6 = true;
  const nu = CLUBS.map(c => [c.t, c.s]), had = nu.slice(0, 8).some(x => x[0] === 0), oudT = S.sp && S.sp.club != null ? CLUBS[S.sp.club].t : 1;
  if (had){ const n = hervormStand(nu, thuisLand()); zetClubs(n); S.clubs = n; }
  if (S.landen) for (const l in S.landen) if (S.landen[l] && S.landen[l].clubs) S.landen[l].clubs = hervormStand(S.landen[l].clubs, l);
  if (had) verhuisEigenClub(oudT);
  if (had){ (S.krantWacht = S.krantWacht || []).push({bron:'De Sportkrant', kop:'De Europese Elite bestaat niet meer', tekst:'De beste clubs van Europa spelen voortaan in hun eigen competitie. De nummers 1 en 2 van elk land strijden in de Champions League.', wanneer:'zomer'}); if (S.car) S.car.hist.push(`${S.jaar}: de Europese Elite is opgeheven, de Champions League is het nieuwe Europese toernooi`); }
  return had;
}
// Speelde je bij een van de plaatsen 0-7 (een buitenlandse Elite-club)? Die club speelt nu in zijn eigen land: je gaat mee.
// Kan dat niet (een land zonder competitie in het spel, of een fusieclub die verdwijnt), dan neemt de sterkste club
// van (ongeveer) jouw niveau je over.
function verhuisEigenClub(oudT){
  const sp = S.sp, oud = sp && sp.club; if (oud == null || oud >= 8) return;
  const naam = CLUBS[oud].n, land = slotLand(oud), e = ELITE_THUIS[land];
  let nieuw, tekst;
  if (e && e.n === naam && SPEEL_LANDEN.includes(land)){ if (land !== thuisLand()) wisselLand(land); nieuw = ELITE_ID; tekst = `${naam} speelt voortaan in de hoogste competitie van ${land}. Jij gaat mee.`; }
  else { nieuw = divClubs(Math.min(Math.max(1, oudT), 4)).sort((a, b) => CLUBS[b].s - CLUBS[a].s)[0]; tekst = `${naam} doet niet meer mee. Je contract gaat over naar ${CLUBS[nieuw].n}.`; }
  sp.club = nieuw;
  if (S.trainer && S.trainer.club === oud) S.trainer.club = nieuw;
  if (S.eigenaar && S.eigenaar.club === oud) S.eigenaar.club = nieuw;
  if (S.sel) delete S.sel[ck(nieuw)];
  (S.krantWacht = S.krantWacht || []).push({bron:'De Sportkrant', kop:`Nieuwe competitie voor ${naam}`, tekst, wanneer:'zomer'});
  if (S.car) S.car.hist.push(`${S.jaar}: ${tekst}`);
}
// Wisselen van land: de stand van het oude land bewaren (wie in welke divisie speelt) en die van het nieuwe land laden
export function wisselLand(nl){
  const oud = thuisLand(), L = S.landen = S.landen || {};
  L[oud] = {clubs:CLUBS.map(c => [c.t, c.s]), vorig:S.vorig || null, slots:S.slots || null};
  S.land = nl; zetLand(nl);
  const st = L[nl];
  const lijst = st ? hervormStand(st.clubs, nl) : landBasis(nl); zetClubs(lijst); S.clubs = lijst;
  S.vorig = st ? st.vorig : null;
  S.slots = st && st.slots ? st.slots : null; pasSlotsToe(); // de Europese Elite zoals die in dat land bekend is
  S.tab = nieuweTabellen();
}

// Overstap naar een ander land in de winterstop: de nieuwe competitie is dan al halverwege. Die eerste helft wordt in één keer
// gespeeld (met jouw nieuwe club erbij), zodat er een echte stand is. Jouw eigen cijfers van dit seizoen lopen door.
// De nationale beker van je oude land is voorbij voor je; de Europese bekers houden alleen clubs die er nog zijn.
export function winterInhalen(){
  const sp = S.sp, los = sp.clubloos;
  S.ss.res = {}; S.ss.st = {}; S.ss.uitslagen = []; S.tab = nieuweTabellen();
  sp.clubloos = {tijdelijk:true}; // ook de wedstrijden van jouw nieuwe club worden gespeeld
  for (let w = 0; w < WINTER; w++) speelRonde(w, 0, 0, null);
  sp.clubloos = los;
  S.ronde = WINTER;
  const B = S.ss.bekers || {};
  // de nationale beker van het nieuwe land: opnieuw geloot, en de rondes tot nu toe ingehaald (jouw nieuwe club doet gewoon mee)
  if (B.nat){ B.nat = nieuweBekers().nat; for (const w of bekerSchema('nat').filter(w => w <= WINTER)){ if (B.nat.winnaar !== null || B.nat.levend.length < 2) break; S.ronde = w; speelBekerRonde('nat', false); } S.ronde = WINTER; }
  for (const k of ['cl', 'eur']) if (B[k]) B[k].levend = (B[k].levend || []).filter(id => id < 8 || id >= GAST_START);
  const l = stand(club().t), plek = l.indexOf(sp.club) + 1;
  return `De ${DIVS[club().t]} is al halverwege: ${club().n} staat ${plek}e van de ${l.length}.`;
}
// Tijdens het seizoen: scouts van een buitenlandse club op de tribune (de overstap zelf kan in de winterstop of de zomer)
export function scoutEvent(){
  if (!S.ss || !S.ss.c) return null;
  const sp = S.sp, eigen = club(), gem = gemCijfer();
  if (sp.scout || sp.clubloos || sp.o23 || sp.huur || eigen.t < 1 || sp.leeftijd < 18 || !((gem !== null && gem >= 6.8) || sp.rep >= 40)) return null;
  const o = ovr(sp), score = transferScore(), land = pick(SPEEL_LANDEN.filter(l => l !== thuisLand())), kand = [];
  for (let id = 8; id < clubsLand(land); id++){ const c = vreemdeClub(land, id); if (c.t >= Math.max(1, eigen.t - 1) && c.t <= eigen.t && score >= MIN[c.t] - 4 && c.s <= o + 8) kand.push(id); }
  if (!kand.length) return null;
  const id = pick(kand), c = vreemdeClub(land, id);
  return {soort:'transfer', tekst:`Scouts van ${c.n} (${land}, ${c.div}) zaten bij je laatste wedstrijd op de tribune. Ze zijn onder de indruk. Je zaakwaarnemer belt: "Als je wilt, komen ze deze zomer met een bod."`, opts:[
    {l:'Interesse tonen', f(){ sp.scout = {land, club:id}; return `Je zaakwaarnemer laat ${c.n} weten dat je openstaat voor een avontuur in ${land}. In de zomer komen ze met een bod, als je zo blijft spelen.`; }},
    {l:'Ik blijf hier', f(){ mod('vert', 2); modFans(2); return `Je laat weten dat je je thuis voelt bij ${club().n}. De trainer en de fans horen het graag.`; }}]};
}
