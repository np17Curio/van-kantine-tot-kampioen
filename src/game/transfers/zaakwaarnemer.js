import { S, club, gemCijfer, ovr, tmp } from '../../core/state.js';
import { clamp, shuffle } from '../../core/utils.js';
import { CLUBS, DIVS, JEUGD, MIN, divClubs } from '../../data/gegevens.js';

/* ===================== Zaakwaarnemer ===================== */
export const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
export const kaal = s => norm(s).replace(/^(fc|sv|vv|sc|ac|rksv|asv) /, '');
export function afstand(a, b){
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({length:n + 1}, (_, j) => j);
  for (let i = 1; i <= m; i++){ const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
export const SENIOR = CLUBS.map((c, i) => i).filter(i => CLUBS[i].t !== JEUGD);
export function zoekClub(q){
  const n = norm(q), k = kaal(q); if (!n) return {geen:true};
  const exact = SENIOR.find(i => norm(CLUBS[i].n) === n || kaal(CLUBS[i].n) === k);
  if (exact !== undefined) return {club:exact};
  const bevat = SENIOR.filter(i => norm(CLUBS[i].n).includes(n) || (k.length >= 4 && n.includes(kaal(CLUBS[i].n))));
  if (bevat.length === 1) return {club:bevat[0]};
  if (bevat.length > 1) return {sugg:bevat.slice(0, 4)};
  const grens = Math.max(2, Math.round(k.length * .35));
  const dichtbij = SENIOR.map(i => ({i, d:Math.min(afstand(n, norm(CLUBS[i].n)), afstand(k, kaal(CLUBS[i].n)))})).filter(x => x.d <= grens).sort((a, b) => a.d - b.d).slice(0, 3).map(x => x.i);
  return dichtbij.length ? {sugg:dichtbij} : {geen:true};
}
// Wat moet je dit seizoen laten zien voor deze club? Hoe sterker de club en hoe groter de stap, hoe meer
export function eisenVoor(id){
  const sp = S.sp, c = CLUBS[id], sprong = club().t - c.t, f = clamp((c.s - 40) / 50, 0, 1);
  const zwaar = sprong >= 2 ? 1.3 : sprong < 0 ? .5 : 1, r = x => Math.round(x * zwaar), gem = gemCijfer(), e = [];
  const voeg = (label, nodig, nu, fmt) => { if (nodig > 0) e.push({label, nodig, nu, fmt, ok: nu !== null && nu >= nodig}); };
  const zwakste = Math.min(...divClubs(c.t).map(i => CLUBS[i].s));
  voeg('Klasse', Math.round(MIN[c.t] - 2 + (c.s - zwakste) * .5 + (sprong >= 2 ? 2 : 0)), ovr(sp));
  voeg('Wedstrijden gespeeld', sprong > 0 ? 8 : sprong === 0 ? 6 : 0, S.ss.wed);
  if (sprong >= 0) voeg('Gemiddeld cijfer', Math.round((6.4 + f * 1.1 + (sprong >= 2 ? .3 : 0)) * 10) / 10, S.ss.wed ? Math.round(gem * 10) / 10 : null, 'cijfer');
  if (sp.pos === 'SPITS'){ voeg('Goals', r(3 + f * 9), S.ss.g); voeg('Assists', r(1 + f * 3), S.ss.a); }
  else if (sp.pos === 'MID'){ voeg('Goals', r(1 + f * 5), S.ss.g); voeg('Assists', r(2 + f * 6), S.ss.a); }
  else { voeg('Wedstrijden zonder tegengoal', r(2 + f * 4), S.ss.cs || 0); voeg('Assists', r(f * 3), S.ss.a); }
  return e;
}
export function agentReset(t){ const ag = S.sp.agent; ag.doel = null; ag.gehaald = false; ag.sugg = null; ag.antwoord = t; }
export function agentCheck(){
  const ag = S.sp.agent; if (!ag || ag.doel == null || ag.gehaald || ag.doel === S.sp.club) return null;
  if (!eisenVoor(ag.doel).every(e => e.ok)) return null;
  ag.gehaald = true;
  const c = CLUBS[ag.doel];
  ag.antwoord = `Goed nieuws! ${c.n} heeft je gezien en wil je hebben. Hun bod komt in de volgende transferperiode.`;
  return `Je zaakwaarnemer belt: ${c.n} wil je hebben! Hun bod komt in de volgende transferperiode.`;
}
export function vraagAgent(){
  const ag = S.sp.agent, q = (tmp.agentQ || '').trim();
  ag.sugg = null;
  if (!q){ ag.antwoord = 'Typ eerst de naam van een club.'; return; }
  tmp.agentQ = '';
  if (/\bo19\b|jeugd/.test(norm(q))){ ag.antwoord = 'Dat is een jeugdteam. Ik regel alleen transfers naar een 1e elftal.'; return; }
  const r = zoekClub(q);
  if (r.club !== undefined) return kiesDoel(r.club);
  if (r.sugg){ ag.sugg = r.sugg; ag.antwoord = `"${q}"? Bedoel je een van deze clubs?`; return; }
  const tip = shuffle(divClubs(Math.max(0, club().t - 1))).slice(0, 2).map(i => CLUBS[i].n);
  ag.antwoord = `"${q}" ken ik niet. Typ een club uit het spel, bijvoorbeeld ${tip.join(' of ')}. Tijdens het typen krijg je suggesties.`;
}
export function kiesDoel(id){
  const ag = S.sp.agent, c = CLUBS[id], eigen = club(), sprong = eigen.t - c.t;
  ag.sugg = null;
  if (id === S.sp.club){ ag.antwoord = `Je speelt al bij ${c.n}!`; return; }
  if (sprong > 2){
    ag.sugg = shuffle(divClubs(eigen.t - 1)).slice(0, 3);
    ag.antwoord = `${c.n} speelt in de ${DIVS[c.t]}. Dat is ${sprong} niveaus hoger dan waar jij nu speelt, en zo'n club kijkt nog niet naar je. Maak eerst een stap naar de ${DIVS[eigen.t - 1]}, bijvoorbeeld:`;
    return;
  }
  ag.doel = id; ag.gehaald = false;
  const intro = sprong === 2 ? `${c.n}? Dat is twee niveaus hoger dan waar je nu speelt. Dan moet je echt uitblinken.`
    : sprong === 1 ? `${c.n}? Mooi doel: een stap omhoog naar de ${DIVS[c.t]}.`
    : sprong === 0 && c.s > eigen.s ? `${c.n}? Een sterkere club in jouw eigen competitie. Dat kan.`
    : `${c.n}? Dat is geen stap omhoog, maar als jij dat wilt, regel ik het.`;
  ag.antwoord = `${intro} Dit moet je dit seizoen laten zien. Haal je alles, dan komt ${c.n} in de volgende transferperiode met een bod.`;
  agentCheck();
}
