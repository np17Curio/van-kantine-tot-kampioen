import { S, seizoenLabel } from '../../core/state.js';
import { clamp, geldTxt, pick, randInt, rnd } from '../../core/utils.js';
import { CLUBS, LAAGSTE, divClubs } from '../../data/gegevens.js';
import { POS_NAAM, selectie } from '../competitie/spelers.js';
import { metVoorletter } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { herschik, noteerDeal } from '../transfers/markt.js';
import { prijs } from '../trainer/transfers.js';
import { BUDGET_REF } from './eigenaar.js';

/* ===================== Clubeigenaar: trainer, assistent, sponsors en transfers ===================== */
const r1k = x => Math.round(x / 1000) * 1000;
const E0 = () => S.eigenaar, mijnClub = () => CLUBS[S.eigenaar.club], ref = () => BUDGET_REF[mijnClub().t];

// ---------- Trainers ----------
// Hoe aantrekkelijk is je club voor een trainer: sterkte, de hoogste league, de fans en het stadion.
// Een topclub krijgt 4- en 5-sterrentrainers, een kleine club 1 tot 3 sterren.
const TR_NAMEN = ['T. de Boer', 'R. Willems', 'M. Jansen', 'K. Vos', 'P. van Dam', 'L. Mertens', 'H. Bakker', 'S. Smit', 'J. Koeman', 'A. Ricci', 'F. Becker', 'D. Moreau', 'C. Ortega', 'B. Lindqvist', 'E. Kaya', 'N. Petrović'];
const TR_STIJL = ['speelt aanvallend voetbal', 'staat bekend om een sterke verdediging', 'werkt graag met jonge spelers', 'is een echte motivator', 'is een tacticus', 'houdt van discipline'];
// Eisen per aantal sterren: wie bepaalt de transfers, en welk spelersbudget wil hij minstens
export const EIS = {1:{tr:'jij', min:0}, 2:{tr:'jij', min:0}, 3:{tr:'samen', min:0}, 4:{tr:'trainer', min:1}, 5:{tr:'trainer', min:1.5}};
export const TR_TXT = {jij:'Jij bepaalt de transfers', samen:'Jullie bepalen de transfers samen (hij geeft advies)', trainer:'Hij bepaalt zelf de transfers'};
export const BUDGET_NAAM = {.5:'Bezuinigen', 1:'Normaal', 1.5:'Investeren', 2:'Alles erin'};
export function aantrek(){ const E = E0(), c = mijnClub(); return c.s + (c.t === 1 ? 4 : 0) + (E.fans - 50) / 5 + E.stadion * 1.5; }
export const maxSterren = () => clamp(Math.round((aantrek() - 48) / 7), 1, 5);
export function trainerKandidaten(){
  const m = maxSterren(), namen = TR_NAMEN.slice().sort(() => rnd() - .5);
  const sterren = [m, Math.max(1, m - 1), Math.max(1, m - 2), ...(rnd() < .5 ? [Math.max(1, m - randInt(0, 2))] : [])];
  return sterren.map((k, i) => ({n:namen[i], k, stijl:pick(TR_STIJL), salaris:r1k(ref() * (.04 + k * .05) * (k >= 4 ? 1.3 : 1) * (.9 + rnd() * .2)), jaren:k >= 4 ? randInt(2, 3) : randInt(1, 2)}));
}
export function neemTrainer(i){
  const E = E0(), t = E.kandidaten[i]; if (!t) return;
  if (E.trainer && !E.trainer.verlopen) ontslaTrainer(true);
  E.trainer = {...t, boos:0}; E.kandidaten = [];
  E.hist.push(`${seizoenLabel()}: trainer ${t.n} (${'★'.repeat(t.k)}) aangesteld`);
  krantMelding(`${mijnClub().n} stelt ${t.n} aan als trainer`, `De nieuwe trainer (${t.k} ${t.k === 1 ? 'ster' : 'sterren'}) tekent voor ${t.jaren} jaar. "${t.k >= 4 ? 'Ik ben hier om prijzen te winnen.' : 'Ik ga hard werken voor deze club.'}"`);
}
// Ontslaan: de rest van zijn contract betaal je uit
export const afkoop = () => { const T = E0().trainer; return T && !T.verlopen ? T.salaris * Math.max(0, T.jaren) : 0; };
export function ontslaTrainer(stil){
  const E = E0(), T = E.trainer; if (!T) return;
  S.sp.geld -= afkoop();
  if (!stil) krantMelding(`${mijnClub().n} ontslaat trainer ${T.n}`, `Eigenaar ${S.sp.naam} betaalt zijn contract af (${geldTxt(afkoop())}).`);
  E.trainer = null; if (!E.kandidaten.length) E.kandidaten = trainerKandidaten();
}
export function verlengTrainer(){ const T = E0().trainer; if (!T || !T.verlopen) return; T.verlopen = false; T.jaren = T.k >= 4 ? 2 : 1; T.salaris = r1k(T.salaris * 1.15); T.boos = 0; }
export const trainerModus = () => { const T = E0().trainer; return T ? EIS[T.k].tr : 'jij'; };

// ---------- Assistent ----------
export const ASSISTENTEN = {
  commercieel:{n:'Commercieel directeur', i:'💼', d:'Sponsors betalen 20% meer en voor elke plek komt er een aanbieding bij.'},
  scout:{n:'Scout', i:'🔎', d:'Op de transfermarkt 2 spelers extra en een verborgen talent, en kopen is 10% goedkoper.'},
  financieel:{n:'Financieel directeur', i:'📊', d:'Alle kosten 10% lager, en hij waarschuwt als je beleid te duur is.'},
};
const AS_NAMEN = ['Sanne de Wit', 'Yusuf Demir', 'Lotte Hermans', 'Bram Verhoef', 'Imane Ziani', 'Ruben Kok', 'Eva Lambert', 'Tim Schouten'];
export function assistentKandidaten(){ const namen = AS_NAMEN.slice().sort(() => rnd() - .5); return Object.keys(ASSISTENTEN).map((id, i) => ({id, n:namen[i], salaris:r1k(ref() * (.04 + rnd() * .03))})); }
export const heeftAss = id => !!(E0().assistent && E0().assistent.id === id);
export function neemAssistent(i){ const E = E0(), a = E.assKand[i]; if (!a) return; E.assistent = {...a}; if (a.id === 'scout') maakMarkt(); if (a.id === 'commercieel') sponsorAanbod(); }
export function ontslaAssistent(){ E0().assistent = null; }

// ---------- Sponsors ----------
export const PLEKKEN = {shirt:{n:'Hoofdsponsor (shirt)', f:1}, stadion:{n:'Stadionnaam', f:.6}, kleding:{n:'Kledingsponsor', f:.45}};
const MERKEN = {shirt:['Veltex', 'NordBank', 'Zuiderzee Energie', 'Kroonverzekeringen', 'TelNova', 'Aurora Air', 'Polderbier', 'Brightline'], stadion:['Lumen Arena', 'Delta Park', 'Vesta Stadion', 'Horizon Dome', 'Kroon Arena', 'Nova Park'], kleding:['Strider', 'Kelvo', 'Mavra', 'Pulse Sport', 'Orka', 'Vantage']};
export const VOORWAARDEN = {top3:'+50% bij een plek in de top 3', degr:'de helft bij degradatie', laag:'alleen met een lage ticketprijs'};
const bezet = p => E0().sponsors.some(s => s.plek === p && s.jaren > 0);
export function sponsorAanbod(){
  const E = E0(), c = mijnClub(), L = E.laatste, vorm = L && L.plek ? 1 + (9 - Math.min(L.plek, 18)) / 25 : 1, extra = heeftAss('commercieel');
  E.sponsorAanbod = {};
  for (const [p, P] of Object.entries(PLEKKEN)){
    if (bezet(p)) continue;
    const merken = MERKEN[p].slice().sort(() => rnd() - .5), n = randInt(1, 3) + (extra ? 1 : 0);
    E.sponsorAanbod[p] = merken.slice(0, n).map(merk => { const vw = rnd() < .45 ? pick(Object.keys(VOORWAARDEN)) : null;
      return {merk, jaren:randInt(1, 3), voorwaarde:vw, bedrag:r1k(ref() * .4 * P.f * (c.s / 70) ** 2 * (E.fans / 55) * vorm * (.8 + rnd() * .4) * (vw === 'laag' ? 1.2 : vw ? 1.1 : 1) * (extra ? 1.2 : 1))}; });
  }
}
export function tekenSponsor(p, i){
  const E = E0(), o = (E.sponsorAanbod[p] || [])[i]; if (!o || bezet(p)) return;
  E.sponsors = E.sponsors.filter(s => s.plek !== p); E.sponsors.push({plek:p, ...o}); delete E.sponsorAanbod[p];
  krantMelding(`${o.merk} nieuwe ${PLEKKEN[p].n.toLowerCase().replace(' (shirt)', '')} van ${mijnClub().n}`, `De club tekent een contract van ${o.jaren} jaar, goed voor ${geldTxt(o.bedrag)} per seizoen.`);
}
// Na het seizoen: wat leveren de sponsors op (met hun voorwaarden), en een jaar eraf
export function sponsorInkomsten(plek, degradeerde, ticket){
  const E = E0(); let tot = 0; const regels = [];
  for (const s of E.sponsors.filter(s => s.jaren > 0)){
    let b = s.bedrag, opm = '';
    if (s.voorwaarde === 'top3' && plek <= 3){ b *= 1.5; opm = ' (top 3: +50%)'; }
    if (s.voorwaarde === 'degr' && degradeerde){ b *= .5; opm = ' (degradatie: de helft)'; }
    if (s.voorwaarde === 'laag' && ticket !== 'laag'){ b = 0; opm = ' (geen lage ticketprijs: niets)'; }
    b = r1k(b); tot += b; regels.push(`${s.merk}${opm}: ${geldTxt(b)}`); s.jaren--;
  }
  E.sponsors = E.sponsors.filter(s => s.jaren > 0);
  return {tot, regels};
}

// ---------- Transfers ----------
export const TB = [[0, 'Geen'], [.25, 'Klein'], [.5, 'Normaal'], [1, 'Groot'], [2, 'Alles erin']];
export const budgetVoor = f => r1k(ref() * 4 * f); // (spelers zijn duur: een normaal transferbudget is twee keer het spelersbudget)
export const transferBudget = () => budgetVoor(E0().tb || 0);
// Het niveau van je basisspelers (de clubsterkte schuift mee als je beter of slechter wordt)
const basisGem = sel => { const b = sel.filter(x => x.basis && x.k !== undefined); return b.length ? b.reduce((a, x) => a + x.k, 0) / b.length : mijnClub().s; };
const zwakste = (sel, pos) => { const b = sel.filter(x => x.pos === pos && x.basis).map(x => x.k || 0); return b.length ? Math.min(...b) : 0; };
const korting = () => (heeftAss('scout') ? .9 : 1) * (E0().trainer && E0().trainer.k === 5 ? .9 : 1);
export function maakMarkt(){
  const E = E0(), id = E.club, t = mijnClub().t, sel = selectie(id), gem = basisGem(sel), scout = heeftAss('scout');
  const clubs = [t - 1, t, t + 1].filter(x => x >= 1 && x <= LAAGSTE).flatMap(x => divClubs(x)).filter(i => i !== id);
  const kand = clubs.flatMap(i => selectie(i).filter(x => (x.pos !== 'K' || rnd() < .3) && !x.vriend && !x.rivaal).map(x => ({x, van:i}))).filter(({x}) => x.k >= gem - 8 && x.k <= gem + 9 && !sel.some(y => y.n === x.n));
  const uit = [];
  for (let i = 0; i < (scout ? 10 : 8) && kand.length; i++){ const {x, van} = kand.splice(randInt(0, kand.length - 1), 1)[0]; uit.push({n:x.n, v:x.v, pos:x.pos, k:x.k, lft:x.lft, van, prijs:r1k(prijs(x) * (x.basis ? 1.15 : 1) * korting())}); }
  // de scout vindt een verborgen talent: jong, goedkoop, en hij groeit nog
  if (scout && kand.length){ const {x, van} = kand.sort((a, b) => (a.x.lft || 25) - (b.x.lft || 25))[0]; uit.push({n:x.n, v:x.v, pos:x.pos, k:x.k, lft:Math.min(x.lft || 20, 19), van, prijs:r1k(prijs(x) * .5), talent:true}); }
  E.markt = uit.sort((a, b) => b.k - a.k);
}
// Hoeveel beter maakt hij je basis (voor het advies van een ★3-trainer, en voor de trainer die zelf koopt)
export const winst = m => Math.max(0, m.k - zwakste(selectie(E0().club), m.pos));
export const adviesIndex = () => { const l = E0().markt || []; let b = -1, w = 0; l.forEach((m, i) => { const s = winst(m) / Math.max(1, m.prijs / 1e5); if (winst(m) > 0 && s > w && m.prijs <= transferBudget() - (E0().uitgegeven || 0)){ w = s; b = i; } }); return b; };
export const budgetOver = () => Math.max(0, transferBudget() - (E0().uitgegeven || 0));
export function koopSpeler(i, doorTrainer){
  const E = E0(), m = (E.markt || [])[i]; if (!m) return 'Die speler is er niet meer.';
  if (m.prijs > budgetOver()) return `Daar is je transferbudget te klein voor (nog ${geldTxt(budgetOver())}).`;
  if (m.prijs > S.sp.geld) return 'Daar heb je het geld niet voor.';
  const selV = selectie(m.van), x = selV.find(y => y.n === m.n && y.v === m.v);
  E.markt.splice(i, 1);
  if (!x) return `${metVoorletter(m)} is al naar een andere club.`;
  const sel = selectie(E.club), voor = basisGem(sel), c = mijnClub();
  selV.splice(selV.indexOf(x), 1); selectie(m.van); herschik(selectie(m.van));
  if (x.basis) CLUBS[m.van].s = clamp(CLUBS[m.van].s - 1, 30, 95);
  sel.push({...x, lft:m.talent ? m.lft : x.lft, basis:false, nieuwWeek:S.weekNr || 0}); herschik(sel);
  c.s = clamp(Math.round(c.s + (basisGem(sel) - voor) * .8), 30, 95);
  S.sp.geld -= m.prijs; E.uitgegeven = (E.uitgegeven || 0) + m.prijs;
  (E.gekocht = E.gekocht || []).push(`${metVoorletter(x)} (${POS_NAAM[x.pos].toLowerCase()}, klasse ${x.k}) van ${CLUBS[m.van].n} voor ${geldTxt(m.prijs)}`);
  noteerDeal(m.van, E.club, x, 'eigenaar', {som:m.prijs});
  if (!doorTrainer) krantMelding(`${c.n} haalt ${metVoorletter(x)} bij ${CLUBS[m.van].n}`, `De ${POS_NAAM[x.pos].toLowerCase()} (${x.lft}, klasse ${x.k}) komt over voor ${geldTxt(m.prijs)}.`);
  return `Gelukt! ${metVoorletter(x)} komt voor ${geldTxt(m.prijs)}. De clubsterkte is nu ${c.s}.`;
}
// Een trainer die zelf de transfers doet: hij koopt de beste spelers per euro op je zwakste plekken, tot het budget op is
export function trainerKoopt(){
  const E = E0(); let n = 0;
  for (let p = 0; p < 6; p++){
    const l = (E.markt || []).map((m, i) => ({i, w:winst(m), s:winst(m) / Math.max(1, m.prijs / 1e5)})).filter(x => x.w > 0 && E.markt[x.i].prijs <= Math.min(budgetOver(), S.sp.geld)).sort((a, b) => b.s - a.s);
    if (!l.length) break; koopSpeler(l[0].i, true); n++;
  }
  if (n) krantMelding(`Trainer ${E.trainer.n} versterkt ${mijnClub().n}`, `Hij haalt ${n} ${n === 1 ? 'speler' : 'spelers'}: ${E.gekocht.slice(-n).join(', ')}.`);
  return n;
}
// Een bod op een van jouw spelers (eens per zomer): aannemen geeft geld, maar de club wordt zwakker
export function maakBod(){
  const E = E0(), sel = selectie(E.club).filter(x => x.basis && x.k !== undefined && !x.vriend), x = sel.sort((a, b) => b.k - a.k)[randInt(0, Math.min(2, sel.length - 1))];
  const kopers = divClubs(mijnClub().t).filter(i => i !== E.club && CLUBS[i].s >= mijnClub().s - 2).concat(mijnClub().t > 1 ? divClubs(mijnClub().t - 1) : []);
  E.bod = x && kopers.length && rnd() < .7 ? {n:x.n, v:x.v, pos:x.pos, k:x.k, naar:pick(kopers), som:r1k(prijs(x) * (1.05 + rnd() * .3))} : null;
}
export function accepteerBod(){
  const E = E0(), b = E.bod; if (!b) return; E.bod = null;
  const sel = selectie(E.club), x = sel.find(y => y.n === b.n && y.v === b.v); if (!x) return;
  const voor = basisGem(sel), c = mijnClub();
  sel.splice(sel.indexOf(x), 1); selectie(E.club); herschik(sel);
  c.s = clamp(Math.round(c.s + (basisGem(sel) - voor) * .8), 30, 95);
  selectie(b.naar).push({...x, basis:false}); herschik(selectie(b.naar));
  S.sp.geld += b.som; E.verkocht = (E.verkocht || 0) + b.som;
  noteerDeal(E.club, b.naar, x, 'eigenaar', {som:b.som});
  krantMelding(`${c.n} verkoopt ${metVoorletter(x)} aan ${CLUBS[b.naar].n}`, `De ${POS_NAAM[x.pos].toLowerCase()} vertrekt voor ${geldTxt(b.som)}.`);
}
export const weigerBod = () => { E0().bod = null; };

// ---------- Advies van je assistent ----------
export function advies(totaal){
  const E = E0(), a = E.assistent; if (!a) return null;
  if (a.id === 'commercieel'){
    const best = Object.entries(E.sponsorAanbod || {}).flatMap(([p, l]) => l.map(o => ({p, o}))).sort((x, y) => y.o.bedrag - x.o.bedrag)[0];
    return best ? `Neem ${best.o.merk} als ${PLEKKEN[best.p].n.toLowerCase()}: die betaalt het meest (${geldTxt(best.o.bedrag)} per seizoen).` : 'Alle sponsorplekken zijn bezet. Goed bezig!';
  }
  if (a.id === 'scout'){ const i = adviesIndex(), m = i >= 0 ? E.markt[i] : null, tal = (E.markt || []).find(x => x.talent);
    return m ? `${metVoorletter(m)} (${POS_NAAM[m.pos].toLowerCase()}, klasse ${m.k}) is het meest waard voor zijn geld.${tal ? ` En let op ${metVoorletter(tal)}: een verborgen talent.` : ''}` : 'Ik zie op de markt niemand die ons beter maakt voor dit budget.'; }
  if (totaal > S.sp.geld) return 'Pas op: dit beleid kun je niet betalen.';
  if (totaal > S.sp.geld * .6) return `Pas op: dit seizoen kost ${geldTxt(totaal)}, meer dan de helft van je geld. Een slecht seizoen en je komt in de problemen.`;
  return 'De financiën zijn gezond. Je kunt dit beleid aan.';
}
