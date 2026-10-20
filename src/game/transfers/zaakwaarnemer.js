import { S, club, gemCijfer, ovr, tmp } from '../../core/state.js';
import { clamp, shuffle } from '../../core/utils.js';
import { CLUBS, CLUBS_LAND, DIVS, ELITE_LAND, MIN, clubsLand, divClubs } from '../../data/gegevens.js';
import { SPEEL_LANDEN, thuisLand } from '../../data/landen.js';
import { vreemdeClub } from './buitenland.js';
import { slotLand } from '../competitie/europa.js';

/* ===================== Zaakwaarnemer ===================== */
export const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
export const kaal = s => norm(s).replace(/^(fc|sv|vv|sc|ac|rksv|asv|kv|ksv|rfc|kfc|sk|rc|vk|cd|ud|sd|cf|us|as|ss|og|sl|gd|fk|tsv|vfb|vfl|sg|ol|og) /, '');
export function afstand(a, b){
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({length:n + 1}, (_, j) => j);
  for (let i = 1; i <= m; i++){ const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
// De seniorenclubs van je land (8-39): niet de jeugdteams, en niet de onzichtbare plaatsen (oude Elite, Europese gasten)
// De clubs van de leagues in je eigen land (de lege plaatsen van een kleiner land tellen niet mee)
export const senior = () => CLUBS.map((c, i) => i).filter(i => i >= 8 && i < CLUBS_LAND && CLUBS[i].t >= 1);
// Een doel is {club, land}: land is null voor een club uit het land waar je nu speelt.
// De Europese Elite (0-7) is in elk land dezelfde, dus die clubs horen altijd bij "hier".
export const doelVan = (id, land) => ({club:id, land: id < 8 || !land || land === thuisLand() ? null : land});
const alsDoel = x => typeof x === 'number' ? doelVan(x) : doelVan(x.club, x.land); // oude opslag: alleen een nummer
export const infoVan = d => d.land ? vreemdeClub(d.land, d.club) : CLUBS[d.club];
export const sleutel = d => (d.land ? d.land + '|' : '') + d.club;
export const doelBod = () => { const ag = S.sp.agent; return ag && ag.doel != null ? doelVan(ag.doel, ag.doelLand) : null; };
export const doelInfo = () => { const d = doelBod(); return d ? infoVan(d) : null; };
export const isDoel = o => { const d = doelBod(); return !!d && sleutel(d) === sleutel(doelVan(o.club, o.land)); };
export const isHier = d => !d.land && d.club === S.sp.club;
// Alle seniorenclubs om in te zoeken: eerst die van je eigen land, dan die van de andere landen (geen jeugdteams)
export function clubIndex(){
  const uit = senior().map(i => ({club:i, land:null, n:CLUBS[i].n}));
  for (const land of SPEEL_LANDEN){ if (land === thuisLand()) continue; for (let id = 8; id < clubsLand(land); id++) uit.push({club:id, land, n:vreemdeClub(land, id).n}); }
  return uit;
}
// Uit welk land komt een club uit de Europese Elite? De vaste topclubs hebben een eigen land, een gepromoveerde club het jouwe
export const eliteLand = d => d.club < 8 ? slotLand(d.club) : d.land || thuisLand();
// De hele Europese Elite (zoals die nu speelt)
export const eliteClubs = () => divClubs(0).map(i => doelVan(i));
// Alle clubs van een niveau in een land (voor de eisen en de clublijst). Niveau 0: de Elite-clubs uit dat land
export function clubsVanNiveau(land, t){
  const l = land || thuisLand();
  if (t === 0){
    const vast = ELITE_LAND.map((x, i) => i).filter(i => CLUBS[i].t === 0 && slotLand(i) === l).map(i => doelVan(i));
    if (l === thuisLand()) return vast.concat(divClubs(0).filter(i => i >= 8).map(i => doelVan(i)));
    const uit = []; for (let id = 8; id < clubsLand(l); id++) if (vreemdeClub(l, id).t === 0) uit.push({club:id, land:l});
    return vast.concat(uit);
  }
  if (l === thuisLand()) return divClubs(t).map(i => doelVan(i));
  const uit = []; for (let id = 8; id < clubsLand(land); id++) if (vreemdeClub(land, id).t === t) uit.push({club:id, land});
  return uit;
}
export function zoekClub(q){
  const n = norm(q), k = kaal(q); if (!n) return {geen:true};
  const idx = clubIndex(), d = x => ({club:x.club, land:x.land});
  const exact = idx.find(x => norm(x.n) === n || kaal(x.n) === k);
  if (exact) return {doel:d(exact)};
  const bevat = idx.filter(x => norm(x.n).includes(n) || (k.length >= 4 && n.includes(kaal(x.n))));
  if (bevat.length === 1) return {doel:d(bevat[0])};
  if (bevat.length > 1) return {sugg:bevat.slice(0, 4).map(d)};
  const grens = Math.max(2, Math.round(k.length * .35));
  // ook per woord vergelijken: "Scheldstad" vindt "Royal Scheldestad"
  const woorden = x => norm(x.n).split(' ').filter(w => w.length >= 4);
  const dichtbij = idx.map(x => ({x, a:Math.min(afstand(n, norm(x.n)), afstand(k, kaal(x.n)), ...woorden(x).map(w => afstand(k, w)))})).filter(y => y.a <= grens).sort((a, b) => a.a - b.a).slice(0, 3).map(y => d(y.x));
  return dichtbij.length ? {sugg:dichtbij} : {geen:true};
}
// Wat moet je dit seizoen laten zien voor deze club? Hoe sterker de club en hoe groter de stap, hoe meer
export function eisenVoor(doel){
  const sp = S.sp, dd = alsDoel(doel), c = infoVan(dd), sprong = club().t - c.t, f = clamp((c.s - 40) / 50, 0, 1);
  const zwaar = sprong >= 2 ? 1.3 : sprong < 0 ? .5 : 1, r = x => Math.round(x * zwaar), gem = gemCijfer(), e = [];
  const voeg = (label, nodig, nu, fmt) => { if (nodig > 0) e.push({label, nodig, nu, fmt, ok: nu !== null && nu >= nodig}); };
  const zwakste = Math.min(...(c.t === 0 ? eliteClubs() : clubsVanNiveau(dd.land, c.t)).map(x => infoVan(x).s));
  voeg('Klasse', Math.round(MIN[c.t] - 2 + (c.s - zwakste) * .5 + (sprong >= 2 ? 2 : 0)), ovr(sp));
  voeg('Wedstrijden gespeeld', sprong > 0 ? 8 : sprong === 0 ? 6 : 0, S.ss.wed);
  if (sprong >= 0) voeg('Gemiddeld cijfer', Math.round((6.4 + f * 1.1 + (sprong >= 2 ? .3 : 0)) * 10) / 10, S.ss.wed ? Math.round(gem * 10) / 10 : null, 'cijfer');
  if (sp.pos === 'SPITS'){ voeg('Goals', r(3 + f * 9), S.ss.g); voeg('Assists', r(1 + f * 3), S.ss.a); }
  else if (sp.pos === 'MID'){ voeg('Goals', r(1 + f * 5), S.ss.g); voeg('Assists', r(2 + f * 6), S.ss.a); }
  else { voeg('Wedstrijden zonder tegengoal', r(2 + f * 4), S.ss.cs || 0); voeg('Assists', r(f * 3), S.ss.a); }
  return e;
}
export function agentReset(t){ const ag = S.sp.agent; ag.doel = null; ag.doelLand = null; ag.gehaald = false; ag.sugg = null; ag.antwoord = t; }
// Een club in het buitenland komt in de zomer: halverwege het seizoen van competitie (en land) wisselen kan niet
export const wanneerBod = d => d.land ? 'in de zomer' : 'in de volgende transferperiode';
export function agentCheck(){
  const ag = S.sp.agent, d = doelBod(); if (!d || ag.gehaald || isHier(d)) return null;
  if (!eisenVoor(d).every(e => e.ok)) return null;
  ag.gehaald = true;
  const c = infoVan(d), uit = d.land ? ` uit ${d.land}` : '';
  ag.antwoord = `Goed nieuws! ${c.n}${uit} heeft je gezien en wil je hebben. Hun bod komt ${wanneerBod(d)}.`;
  return `Je zaakwaarnemer belt: ${c.n}${uit} wil je hebben! Hun bod komt ${wanneerBod(d)}.`;
}
export function vraagAgent(){
  const ag = S.sp.agent, q = (tmp.agentQ || '').trim();
  ag.sugg = null;
  if (!q){ ag.antwoord = 'Typ eerst de naam van een club.'; return; }
  tmp.agentQ = '';
  if (/\bo19\b|\bu19\b|jeugd|youth|juvenil|primavera|juniores/.test(norm(q))){ ag.antwoord = 'Dat is een jeugdteam. Ik regel alleen transfers naar een 1e elftal.'; return; }
  const r = zoekClub(q);
  if (r.doel) return kiesDoel(r.doel);
  if (r.sugg){ ag.sugg = r.sugg; ag.antwoord = `"${q}"? Bedoel je een van deze clubs?`; return; }
  const tip = shuffle(divClubs(Math.max(1, club().t - 1))).slice(0, 2).map(i => CLUBS[i].n);
  ag.antwoord = `"${q}" ken ik niet. Typ een club uit het spel, bijvoorbeeld ${tip.join(' of ')}. Tijdens het typen krijg je suggesties.`;
}
export function kiesDoel(doel){
  const ag = S.sp.agent, d = alsDoel(doel), c = infoVan(d), eigen = club(), sprong = eigen.t - c.t, div = d.land ? c.div : DIVS[c.t];
  ag.sugg = null;
  if (isHier(d)){ ag.antwoord = `Je speelt al bij ${c.n}!`; return; }
  if (d.land && S.sp.leeftijd < 18){ ag.antwoord = `${c.n} uit ${d.land}? Een transfer naar het buitenland kan pas vanaf je 18e. Tot die tijd regel ik alleen clubs in ${thuisLand()}.`; return; }
  if (sprong > 2){
    const stap = clubsVanNiveau(d.land, eigen.t - 1), naam = d.land ? infoVan(stap[0] || d).div : DIVS[eigen.t - 1];
    ag.sugg = shuffle(stap).slice(0, 3);
    ag.antwoord = `${c.n} speelt in de ${div}. Dat is ${sprong} niveaus hoger dan waar jij nu speelt, en zo'n club kijkt nog niet naar je. Maak eerst een stap naar de ${naam}${d.land ? ` in ${d.land}` : ''}, bijvoorbeeld:`;
    return;
  }
  ag.doel = d.club; ag.doelLand = d.land; ag.gehaald = false;
  const wie = d.land ? `${c.n} uit ${d.land}, in de ${div}` : c.n;
  const intro = sprong === 2 ? `${wie}? Dat is twee niveaus hoger dan waar je nu speelt. Dan moet je echt uitblinken.`
    : sprong === 1 ? `${wie}? Mooi doel: een stap omhoog${d.land ? '' : ` naar de ${div}`}.`
    : sprong === 0 && c.s > eigen.s ? `${wie}? Een sterkere club op jouw niveau. Dat kan.`
    : `${wie}? Dat is geen stap omhoog, maar als jij dat wilt, regel ik het.`;
  ag.antwoord = `${intro}${d.land ? ' Een avontuur in het buitenland!' : ''} Dit moet je dit seizoen laten zien. Haal je alles, dan komt ${c.n} ${wanneerBod(d)} met een bod.`;
  agentCheck();
}
