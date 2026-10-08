import { S, club } from '../../core/state.js';
import { pick, rnd, shuffle } from '../../core/utils.js';
import { CLUBS, DIVS, ROUNDS, divClubs } from '../../data/gegevens.js';
import { simGoals, teamUitslag } from './competitie.js';
import { ck } from '../transfers/buitenland.js';

/* ===================== Spelers van alle clubs ===================== */
// Elke club heeft een vaste selectie (verzonnen namen). Spitsen scoren vaker, middenvelders geven vaker assists
export const VOORL = 'ABCDEFGHJKLMNOPRSTVWY';
export const ACHTERNAMEN = ['De Vries','Bakker','El Amrani','Jansen','Mulder','Bosman','Kaya','Visser','Smit','Mendes','Van Dijkhuizen','Okafor','Hendriks','Yilmaz',
  'Van Leeuwen','Hoekstra','Dekker','Brouwer','Peters','Willems','Koster','Postma','Lindqvist','Moreno','Rossi','Kowalski','Haddad','Fischer','Nkosi','Carvalho',
  'Van den Berg','Meijer','De Boer','Vos','Jacobs','Kramer','Schouten','De Graaf','Huisman','Boukhari','Özdemir','Achterberg','Wouters','Blom','Van Wijk',
  'Sanchez','Ferreira','Novak','Andersen','Dubois','Müller','Okoro','Santos','Bianchi','Nowak','Laurent','Ibrahim','Pereira','Jovanović','Hansen','Martins','Kuipers',
  'Van Rijn','Sneijders','Dijkman','Boateng','Mertens','Lambert','Silva','Costa','Ramos','Keller','Berger','Schmidt','Ouali','Aksoy','Tahiri','Verbeek','Groen'];
export const ROL_G = [5, 4, 2.6, 2, 1.6, 1.1, .7, .45, .3], ROL_A = [2, 2.4, 3, 2.6, 2.2, 1.6, 1.1, .8, .5];
export function selectie(id){
  const sel = S.sel = S.sel || {}, id0 = id; id = ck(id);
  if (!sel[id]){
    const namen = shuffle(ACHTERNAMEN).slice(0, ROL_G.length);
    sel[id] = namen.map((n, i) => ({v:pick(VOORL), n, g:ROL_G[i], a:ROL_A[i]}));
  }
  return sel[id];
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
export function speelRonde(r, mijnVoor, mijnTegen, doelen){
  const res = S.ss.res = S.ss.res || {};
  for (let t = 0; t < DIVS.length; t++){
    const lijst = divClubs(t), ronde = (res[t] = res[t] || [])[r] = [];
    for (const [h, u] of ROUNDS[r]){
      const H = lijst[h], U = lijst[u];
      let gh, gu;
      const mijn = H === S.sp.club || U === S.sp.club;
      if (H === S.sp.club){ gh = mijnVoor; gu = mijnTegen; }
      else if (U === S.sp.club){ gh = mijnTegen; gu = mijnVoor; }
      else [gh, gu] = simGoals(CLUBS[H].s, CLUBS[U].s, true);
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
