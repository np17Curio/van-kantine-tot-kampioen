import { S, club } from '../../core/state.js';
import { clamp, pick, randInt, rnd, shuffle } from '../../core/utils.js';
import { CLUBS, DIVS, divClubs, rondeInWeek } from '../../data/gegevens.js';
import { rondeParen, simGoals, speelLijst, teamUitslag } from './competitie.js';
import { ck } from '../transfers/buitenland.js';
import { vormBonus } from './vorm.js';

/* ===================== Spelers van alle clubs ===================== */
// Elke club heeft een vaste selectie (verzonnen namen). Spitsen scoren vaker, middenvelders geven vaker assists
export const VOORL = 'ABCDEFGHJKLMNOPRSTVWY';
export const ACHTERNAMEN = ['De Vries','Bakker','El Amrani','Jansen','Mulder','Bosman','Kaya','Visser','Smit','Mendes','Van Dijkhuizen','Okafor','Hendriks','Yilmaz',
  'Van Leeuwen','Hoekstra','Dekker','Brouwer','Peters','Willems','Koster','Postma','Lindqvist','Moreno','Rossi','Kowalski','Haddad','Fischer','Nkosi','Carvalho',
  'Van den Berg','Meijer','De Boer','Vos','Jacobs','Kramer','Schouten','De Graaf','Huisman','Boukhari','Özdemir','Achterberg','Wouters','Blom','Van Wijk',
  'Sanchez','Ferreira','Novak','Andersen','Dubois','Müller','Okoro','Santos','Bianchi','Nowak','Laurent','Ibrahim','Pereira','Jovanović','Hansen','Martins','Kuipers',
  'Van Rijn','Sneijders','Dijkman','Boateng','Mertens','Lambert','Silva','Costa','Ramos','Keller','Berger','Schmidt','Ouali','Aksoy','Tahiri','Verbeek','Groen'];
// Een selectie van 21 teamgenoten (met jou erbij 22): per positie hoe vaak iemand scoort (g) en een assist geeft (a).
// De eersten per positie zijn vaste basisspelers, de rest zit meestal op de bank
export const OPBOUW = {
  K:{g:[0, 0], a:[0, 0], basis:1},
  V:{g:[1.1, .7, .45, .3, .25, .2, .15], a:[1.6, 1.1, .8, .5, .4, .3, .3], basis:4},
  M:{g:[2.6, 2, 1.6, .7, .5, .4, .3], a:[3, 2.6, 2.2, 1, .8, .6, .5], basis:3},
  A:{g:[5, 4, 1.2, .8, .5], a:[2, 2.4, .8, .6, .4], basis:2},
};
export const POS_NAAM = {K:'Keeper', V:'Verdediger', M:'Middenvelder', A:'Aanvaller'};
// Wie er echt op het veld staat (geen keeper, geen reserve): voor kansen en kaarten in het verslag
export const inVeld = P => P.filter(x => x.basis && x.pos !== 'K');
export function selectie(id){
  const sel = S.sel = S.sel || {}, club = id; id = ck(id);
  if (!sel[id]) sel[id] = [];
  const lijst = sel[id];
  // Oude opslag had 9 spelers zonder positie: die houden naam, nummer en band, en de groep wordt aangevuld
  if (lijst.length && !lijst[0].pos) lijst.forEach((x, i) => { x.pos = i < 2 ? 'A' : i < 6 ? 'M' : 'V'; x.basis = true; });
  // Aanvullen van een bestaande selectie (na een verkoop of als er spelers stoppen): dat zijn jongens uit de eigen jeugd
  if (lijst.length < 21) vulAan(lijst, lijst.length >= 15 ? club : null);
  // Elke speler heeft een klasse en een leeftijd (oude opslag: nu uitdelen, rond de sterkte van de club)
  if (lijst.some(x => x.k === undefined)){ const s = CLUBS[club] ? CLUBS[club].s : 50; lijst.forEach(x => { if (x.k === undefined) geefKlasse(x, s); }); }
  return lijst;
}
// Klasse (zelfde schaal als jouw klasse) en leeftijd: basisspelers rond de clubsterkte, de bank wat lager, de jeugd jong en nog laag
export function geefKlasse(x, s){
  if (x.jeugd){ x.k = s + randInt(-12, -5); x.lft = randInt(17, 19); }
  else if (x.basis){ x.k = s + randInt(-4, 4); x.lft = randInt(22, 31); }
  else { x.k = s + randInt(-10, -2); x.lft = randInt(19, 32); }
  x.k = clamp(x.k, 25, 95);
}
function vulAan(lijst, jeugdVan){
  const vrij = shuffle(ACHTERNAMEN.filter(n => !lijst.some(x => x.n === n)));
  for (const [pos, o] of Object.entries(OPBOUW)){
    for (let i = lijst.filter(x => x.pos === pos).length; i < o.g.length; i++){
      const basis = i < o.basis;
      const x = {v:pick(VOORL), n:vrij.pop(), g:o.g[i], a:o.a[i], pos, basis};
      if (jeugdVan != null){ x.jeugd = true; x.sindsWeek = S.weekNr || 0; (S.jeugdIn = S.jeugdIn || []).push({club:jeugdVan, v:x.v, n:x.n, pos, week:x.sindsWeek}); if (S.jeugdIn.length > 80) S.jeugdIn = S.jeugdIn.slice(-80); }
      lijst.push(x);
    }
  }
}
// De basiself van een club voor een wedstrijd: altijd precies 11 (met jou erbij als metJou), en de wissels.
// Je vriend en je rivaal gaan voor; speel jij mee, dan maakt de zwakste op jouw linie plaats; te weinig: de sterkste wissel vult aan
const MIJN_LINIE = {SPITS:'A', MID:'M', VERD:'V'};
export function startElf(id, metJou, vulPos){
  const sel = selectie(id).filter(x => !(x.bles > 0)), ik = MIJN_LINIE[S.sp.pos], plek = metJou ? 10 : 11, speciaal = x => x.vriend || x.rivaal;
  const basis = sel.filter(x => x.basis).sort((a, b) => (speciaal(b) ? 1 : 0) - (speciaal(a) ? 1 : 0) || b.k - a.k), bank = sel.filter(x => !x.basis).sort((a, b) => b.k - a.k);
  const valAf = filter => { const kand = basis.filter(x => !speciaal(x) && filter(x)).sort((a, b) => a.k - b.k)[0] || basis.filter(filter).sort((a, b) => a.k - b.k)[0]; if (kand){ basis.splice(basis.indexOf(kand), 1); bank.unshift(kand); return true; } return false; };
  if (metJou && basis.filter(x => x.pos === ik).length >= (OPBOUW[ik] ? OPBOUW[ik].basis : 2) && basis.length >= plek) valAf(x => x.pos === ik);
  while (basis.length > plek && valAf(x => x.pos !== 'K')) {}
  const elf = basis.slice();
  while (elf.length < plek && bank.length){ const i = Math.max(0, bank.findIndex(x => x.pos === (vulPos || ik))); elf.push(bank.splice(i, 1)[0]); }
  return {elf, bank};
}
export function gewogen(lijst, k){ let tot = 0; for (const x of lijst) tot += x[k]; let r = rnd() * tot; for (const x of lijst){ r -= x[k]; if (r <= 0) return x; } return lijst[lijst.length - 1]; }
export const vindSpeler = (id, n) => selectie(id).find(x => x.n === n) || null;
// Statistieken van dit seizoen: per club en speler (jij staat erin als 'JIJ')
export function noteer(club, scorer, gever){
  const st = S.ss.st = S.ss.st || {};
  const rij = sp => { if (sp === 'JIJ'){ const k = 'JIJ|' + club; return st[k] = st[k] || {club, jij:true, v:'', n:S.sp.naam, g:0, a:0}; }
    const k = club + '|' + sp.n; return st[k] = st[k] || {club, v:sp.v, n:sp.n, g:0, a:0}; };
  if (scorer) rij(scorer).g++;
  if (gever) rij(gever).a++;
}
// Willekeurige maker en aangever (70% van de goals heeft een assist)
export function willekeurigDoel(club, zonderJij){
  const sel = selectie(club), s = gewogen(sel, 'g');
  return {s, a: rnd() < .7 ? gewogen(sel.filter(x => x !== s), 'a') : null};
}
// Week w: elke league speelt de ronde die in die week valt (een kortere league heeft soms een speelvrije week)
export function speelRonde(w, mijnVoor, mijnTegen, doelen){
  const res = S.ss.res = S.ss.res || {};
  for (let t = 1; t < DIVS.length; t++){
    const r = rondeInWeek(t, w), lijst = speelLijst(t); if (r == null || lijst.length < 2) continue;
    const ronde = (res[t] = res[t] || [])[r] = [];
    for (const [h, u] of rondeParen(t, r)){
      const H = lijst[h], U = lijst[u];
      let gh, gu;
      const ik = S.sp.clubloos ? null : S.sp.club, mijn = H === ik || U === ik; // zonder club speelt je vorige club gewoon
      if (H === ik){ gh = mijnVoor; gu = mijnTegen; }
      else if (U === ik){ gh = mijnTegen; gu = mijnVoor; }
      else [gh, gu] = simGoals(CLUBS[H].s + vormBonus(H), CLUBS[U].s + vormBonus(U), true); // teamvorm: winnen geeft vertrouwen
      teamUitslag(H, gh, gu); teamUitslag(U, gu, gh);
      ronde.push([H, U, gh, gu]);
      // Wie scoorde er? Bij jouw wedstrijd staat dat in het verslag, anders wordt het verdeeld
      if (mijn && doelen) doelen.forEach(d => noteer(d.club, d.s, d.a));
      else {
        for (let i = 0; i < gh; i++){ const d = willekeurigDoel(H); noteer(H, d.s, d.a); }
        for (let i = 0; i < gu; i++){ const d = willekeurigDoel(U); noteer(U, d.s, d.a); }
      }
    }
  }
}
// Doelpunten in een clubwedstrijd bijhouden (niet bij O23 en interlands)
export const telt = M => M && !M.o23 && !M.inter;
export function doelOns(M, s, a){ if (telt(M)) (M.doelen = M.doelen || []).push({club:S.sp.club, s, a}); }
export function doelHun(M, s, a){ if (telt(M)) (M.doelen = M.doelen || []).push({club:M.opp, s, a}); }
export const ploeg = M => telt(M) ? selectie(S.sp.club) : null;
export const tegenPloeg = M => telt(M) ? selectie(M.opp) : null;
export function stand(t){
  return divClubs(t).slice().sort((x, y) => {
    const a = S.tab[x], b = S.tab[y];
    return b.pt - a.pt || (b.dv - b.dt) - (a.dv - a.dt) || b.dv - a.dv;
  });
}
