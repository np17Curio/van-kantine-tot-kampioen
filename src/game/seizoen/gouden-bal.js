import { S, club, gemCijfer, ovr } from '../../core/state.js';
import { pick, randInt, rnd } from '../../core/utils.js';
import { AANTAL_RONDES, CLUBS, DIVS, JEUGD, divClubs, GAST_START, GASTEN } from '../../data/gegevens.js';
import { ACHTERNAMEN, stand } from '../competitie/spelers.js';
import { metVoornaam } from '../media/nieuws.js';

/* ===================== Gouden Bal ===================== */
// De beste speler van de wereld. Je strijdt tegen verzonnen wereldsterren die ook ouder worden
export const STER_VOOR = ['Mateo', 'Lucas', 'Kai', 'Rafael', 'Theo', 'Jamal', 'Enzo', 'Viktor', 'Yusuf', 'Leon', 'Andrés', 'Ousmane', 'Marco', 'Dani', 'Ilyas', 'Nico'];
// Topclubs: de Champions League-gasten van dit seizoen en de top 3 van de hoogste competitie van jouw land
export const topClubs = () => { const l = divClubs(1).sort((a, b) => CLUBS[b].s - CLUBS[a].s).slice(0, 3); for (let i = GAST_START; i < GAST_START + GASTEN; i++) if (CLUBS[i].gast) l.push(i); return l; };
const isTopClub = id => topClubs().includes(id);
export function nieuweSter(jong){ return {v:pick(STER_VOOR), n:pick(ACHTERNAMEN), club:pick(topClubs()), basis:jong ? randInt(58, 70) : randInt(62, 80), lft:jong ? randInt(19, 21) : randInt(20, 31)}; }
export const wereldSterren = () => S.sterren || (S.sterren = Array.from({length:12}, () => nieuweSter(false)));
// Hoeveel je seizoen telt: de hoogste competitie (Topdivisie) helemaal, daaronder steeds minder
export const GB_NIVEAU = {1:1, 2:.5, 3:.25, 4:.1, [JEUGD]:.03};
// Jouw punten voor de Gouden Bal (dezelfde formule aan het einde van het seizoen en in de race tijdens het seizoen)
export function goudenBalScore({gem, g, a, kamp, beker, cl, o, t, tb = 0}){
  const f = GB_NIVEAU[t] ?? 0;
  return Math.round(f * ((gem - 6) * 18 + g * 1.3 + a * .8 + (kamp ? 10 : 0) + (beker ? 6 : 0) + (cl ? 10 : 0) + Math.max(0, o - 70) * .65) + tb);
}
// De opbouw van je punten: per onderdeel de echte bijdrage (al met de factor van je niveau), ook de minpunten
const c1 = x => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
export function goudenBalOnderdelen({gem, g, a, kamp, beker, cl, o, t, tb = 0, eerder = 0, prognose = false}){
  const f = GB_NIVEAU[t] ?? 0, dr = prognose ? ' (doorgerekend naar een heel seizoen)' : '';
  const rij = [
    {k:'cijfer', l:`Gemiddeld cijfer ${c1(gem)} (een 6,0 telt als 0, lager kost punten)`, v:(gem - 6) * 18 * f},
    {k:'goals', l:`Goals: ${g}${dr}`, v:g * 1.3 * f},
    {k:'assists', l:`Assists: ${a}${dr}`, v:a * .8 * f},
    {k:'kamp', l:kamp ? 'Kampioen (je staat nu bovenaan)' : 'Niet bovenaan: geen kampioensbonus', v:kamp ? 10 * f : 0},
  ];
  if (beker) rij.push({k:'beker', l:'Beker gewonnen', v:6 * f});
  if (cl) rij.push({k:'cl', l:'Champions League gewonnen', v:10 * f});
  rij.push({k:'klasse', l:`Klasse ${o} (alles boven de 70 telt)`, v:Math.max(0, o - 70) * .65 * f});
  if (tb) rij.push({k:'tb', l:'Bonus van het WK of EK van afgelopen zomer', v:tb});
  if (eerder) rij.push({k:'eerder', l:`${eerder} eerder gewonnen Gouden ${eerder === 1 ? 'Bal' : 'Ballen'} (de jury wil ook wel eens een ander)`, v:-Math.min(12, eerder * 3)});
  return {rij, f, totaal:Math.round(rij.filter(r => r.k !== 'eerder').reduce((s, r) => s + r.v, 0)) + (eerder ? -Math.min(12, eerder * 3) : 0)};
}
const GB_NAAM = {cijfer:'Gemiddeld cijfer', goals:'Goals', assists:'Assists', kamp:'Kampioensbonus', klasse:'Klasse', beker:'Beker', cl:'Champions League', tb:'WK/EK-bonus', eerder:'Eerdere Gouden Ballen'};
export const fmtPunt = v => (v > 0 ? '+' : v < 0 ? '−' : '') + c1(Math.abs(v));
const eerdereGB = () => S.car.prijzen.filter(p => /^Gouden Bal/.test(p)).length;
export function goudenBal(gem){
  const sp = S.sp, t = club().t, st = stand(t), kamp = !sp.clubloos && st[0] === sp.club;
  const g = S.ss.g + (S.ss.bg || 0), a = S.ss.a + (S.ss.ba || 0);
  const tb = sp.tGB || 0; sp.tGB = 0; // bonus van het WK/EK van afgelopen zomer
  const mijn = S.ss.wed >= 8 && gem !== null ? goudenBalScore({gem, g, a, kamp, beker:S.ss.bekerWinst, cl:S.ss.clWinst, o:ovr(sp), t, tb}) : 0;
  wereldSterren().forEach(x => { if (!isTopClub(x.club)) x.club = pick(topClubs()); });
  const lijst = wereldSterren().map(x => ({naam:metVoornaam(x.v, x.n), club:CLUBS[x.club].n, score:Math.round(x.basis + rnd() * 18 + (stand(1)[0] === x.club || (CLUBS[x.club].gast && CLUBS[x.club].gast.rang === 1) ? 8 : 0))}));
  // De jury wil ook wel eens een ander: elke eerder gewonnen Gouden Bal telt licht tegen je mee
  const eerder = eerdereGB();
  lijst.push({naam:sp.naam, club:club().n, score:mijn ? mijn - Math.min(12, eerder * 3) : 0, jij:true});
  lijst.sort((x, y) => y.score - x.score || (x.jij ? -1 : 1));
  // Sterren worden ouder: beter tot 26, daarna langzaam minder, rond 34 stoppen ze
  S.sterren = wereldSterren().map(x => { x.lft++; if (!isTopClub(x.club)) x.club = pick(topClubs()); x.basis += x.lft < 26 ? randInt(0, 3) : x.lft < 30 ? randInt(-1, 1) : -randInt(2, 4); return x.lft >= 34 || x.basis < 55 ? nieuweSter(true) : x; });
  const onderdelen = mijn ? goudenBalOnderdelen({gem, g, a, kamp, beker:S.ss.bekerWinst, cl:S.ss.clWinst, o:ovr(sp), t, tb, eerder}) : null;
  return {lijst, plek:lijst.findIndex(x => x.jij) + 1, telt:mijn > 0, onderdelen};
}

// De race tijdens het seizoen: jouw verwachte punten (goals en assists doorgerekend naar een heel seizoen) tegen die van de sterren
export function goudenBalStand(){
  const sp = S.sp, t = club().t, wed = S.ss.wed || 0, gem = gemCijfer(), los = !!sp.clubloos;
  const kamp = !los && stand(t)[0] === sp.club, schaal = wed >= 3 ? Math.max(1, AANTAL_RONDES / wed) : 1;
  const g = S.ss.g + (S.ss.bg || 0), a = S.ss.a + (S.ss.ba || 0), gP = Math.round(g * schaal), aP = Math.round(a * schaal);
  const basis = {gem:gem ?? 6, g:gP, a:aP, kamp, beker:S.ss.bekerWinst, cl:S.ss.clWinst, o:ovr(sp), t, tb:sp.tGB || 0};
  const onderdelen = goudenBalOnderdelen({...basis, eerder:eerdereGB(), prognose:wed >= 3});
  const mijn = los || gem === null ? 0 : onderdelen.totaal;
  wereldSterren().forEach(x => { if (!isTopClub(x.club)) x.club = pick(topClubs()); });
  const lijst = wereldSterren().map(x => ({naam:metVoornaam(x.v, x.n), club:CLUBS[x.club].n, score:Math.round(x.basis + 9 + (stand(1)[0] === x.club || (CLUBS[x.club].gast && CLUBS[x.club].gast.rang === 1) ? 8 : 0))}));
  lijst.push({naam:sp.naam, club:los ? 'zonder club' : club().n, score:mijn, jij:true});
  lijst.sort((x, y) => y.score - x.score || (x.jij ? -1 : 1));
  const plek = lijst.findIndex(x => x.jij) + 1, top = lijst[0].jij ? lijst[1] : lijst[0], gat = Math.max(0, top.score - mijn + 1);
  // Wat levert wat op (met jouw niveau erbij)
  const f = GB_NIVEAU[t] ?? 0, r1 = x => String(Math.round(x * 10) / 10).replace('.', ',');
  const tips = [];
  if (wed < 8) tips.push(`Speel minstens 8 wedstrijden: nu ${wed}. Anders tel je niet mee.`);
  if (t > 1 && t !== JEUGD) tips.push(`In de ${DIVS[t]} telt je seizoen maar voor ${Math.round(f * 100)}%. Speel in de hoogste competitie (${DIVS[1]}) om echt mee te doen.`);
  if (t === JEUGD || t >= 3) tips.push('Bij de jeugd en de amateurs maak je geen kans: word eerst prof.');
  if (f > 0){
    tips.push(`Elke 0,1 hoger gemiddeld cijfer: +${r1(1.8 * f)} punten${gem !== null ? ` (nu ${c1(gem)})` : ''}.`);
    tips.push(`Elke goal +${r1(1.3 * f)}, elke assist +${r1(.8 * f)}.`);
    if (!kamp) tips.push(`Kampioen worden: +${Math.round(10 * f)}.`);
    if (!S.ss.clWinst) tips.push(`De Champions League winnen: +${Math.round(10 * f)}. De beker: +${Math.round(6 * f)}.`);
    tips.push(`Elk punt klasse boven de 70: +${r1(.65 * f)}.`);
  }
  // Wat veranderde er sinds vorige week (ten opzichte van de momentopname van een week eerder)
  const V = S.ss.gbVorig, verschil = [];
  if (V && gem !== null){
    for (const r of onderdelen.rij){ const oud = (V.rij.find(x => x.k === r.k) || {v:0}).v, d = r.v - oud; if (Math.abs(d) < 1) continue;
      const waarom = r.k === 'cijfer' ? `je gemiddelde ging van ${c1(V.gem)} naar ${c1(gem)}` : r.k === 'goals' ? (d < 0 ? 'je scoorde minder dan je gemiddelde, dus je doorgerekende goals dalen' : 'je scoorde, dus je doorgerekende goals stijgen')
        : r.k === 'assists' ? (d < 0 ? 'minder assists dan je gemiddelde' : 'je gaf assists') : r.k === 'kamp' ? (d < 0 ? 'je staat niet meer bovenaan' : 'je staat nu bovenaan') : r.k === 'klasse' ? 'je klasse veranderde' : '';
      verschil.push({l:GB_NAAM[r.k] || r.k, d, waarom}); }
    for (const x of V.rij) if (!onderdelen.rij.some(r => r.k === x.k) && Math.abs(x.v) >= 1) verschil.push({l:GB_NAAM[x.k] || x.k, d:-x.v, waarom:''});
  }
  return {lijst, plek, mijn, gat, top, tips, prognose:{g:gP, a:aP}, telt:wed >= 8, onderdelen, verschil, delta:V && gem !== null ? mijn - V.mijn : null};
}
// Elke week een momentopname, zodat je ziet wat er veranderde
export function gbMoment(){
  const sp = S.sp; if (!sp || S.trainer || sp.clubloos || sp.o23 || !S.ss || !S.ss.c) return;
  const gem = gemCijfer(); if (gem === null){ S.ss.gbNu = null; return; }
  const R = goudenBalStand(); S.ss.gbVorig = S.ss.gbNu || null; S.ss.gbNu = {mijn:R.mijn, gem, rij:R.onderdelen.rij.map(r => ({k:r.k, v:r.v}))};
}
