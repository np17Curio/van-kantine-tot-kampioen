import { S, club, mod, ovr, seizoenLabel } from '../../core/state.js';
import { clamp, geldTxt, randInt, rnd } from '../../core/utils.js';
import { HAAR, HAAR_NAAM, HUID, KAPSELS, KAPSEL_KEUZE, SCHOENEN } from '../../data/uiterlijk.js';
import { krantMelding } from '../media/roddel.js';
import { social, volgersTxt } from './social.js';
import { verhoog } from '../week.js';
import { huurOuder } from '../speler/o23.js';

/* ===================== Kapper en voetbalschoenen ===================== */
// ---------- Je uiterlijk (zonder eigen keuze: hetzelfde als het 3D-model het met de dobbelsteen maakt) ----------
function hashGetal(s){ let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function mijnUiterlijk(){
  const sp = S.sp;
  if (!sp.uiterlijk){
    if (!sp.uitSleutel) sp.uitSleutel = Math.random().toString(36).slice(2, 10);
    let h = hashGetal('jij|' + sp.uitSleutel); const d = n => { h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; return h % n; };
    const huid = d(HUID.length), haar = huid >= 4 && d(3) ? 0 : d(HAAR.length);
    sp.uiterlijk = {huid, haar, kapsel:KAPSELS[d(KAPSELS.length)]};
  }
  return sp.uiterlijk;
}

// ---------- Kapper: één keer per week ----------
export const KAPPER = {knippen:50, verven:150};
export const kanKapper = () => !!(S.week && !S.week.kapper && !S.sp.clubloos);
export function naarKapper(kapsel, haar){
  const sp = S.sp, u = mijnUiterlijk(); if (!kanKapper()) return;
  const verven = haar != null && haar !== u.haar, prijs = verven ? KAPPER.verven : KAPPER.knippen;
  if (sp.geld < prijs) return;
  if (kapsel && KAPSEL_KEUZE.some(([k]) => k === kapsel)) u.kapsel = kapsel;
  if (verven && HAAR[haar]) u.haar = haar;
  sp.geld -= prijs; S.week.kapper = true;
  const naam = (KAPSEL_KEUZE.find(([k]) => k === u.kapsel) || [, 'nieuw'])[1].toLowerCase(), product = (sp.sponsors || []).some(d => d.cat === 'verzorging');
  let t = `Bij de kapper: ${naam}${verven ? `, en je haar is nu ${HAAR_NAAM[u.haar].toLowerCase()}` : ''} (${geldTxt(prijs)}).`;
  if (rnd() < (product ? .6 : .3)){ const n = Math.round(30 + social().volgers * .01); social().volgers += n; t += ` Je nieuwe look valt op: +${volgersTxt(n)} volgers.`; if (product){ mod('moraal', 2); t += ' Je sponsor deelt de foto.'; } }
  S.week.tekst.push(t);
}

// ---------- Voetbalschoenen: van een klein merk tot de wereldtop ----------
// De grote merken nemen je alleen als je goed genoeg bent. Eén schoenendeal tegelijk; een groter merk mag een kleiner vervangen.
export const MERKEN = [
  {id:'kickz', n:'Kickz', min:0, basis:5000, kleur:'#ff5a2a', perk:{}, perkTxt:'geen extra', tekst:'een jong merk dat talent zoekt'},
  {id:'nordstep', n:'Nordstep', min:58, basis:20000, kleur:'#2f6bff', perk:{drib:1}, perkTxt:'+1 dribbelen', tekst:'een degelijk merk voor de gewone prof'},
  {id:'kapstone', n:'Kapstone', min:66, basis:80000, kleur:'#d8ff3a', perk:{afw:1}, perkTxt:'+1 afwerken', tekst:'een bekend merk in de hoogste leagues'},
  {id:'volta', n:'Volta Boots', min:73, basis:300000, kleur:'#ff4fa3', perk:{afw:1, drib:1}, perkTxt:'+1 afwerken, +1 dribbelen', tekst:'het merk van de internationals'},
  {id:'strikr', n:'Strikr', min:79, basis:1000000, kleur:'#d4af37', perk:{afw:1, drib:1, rep:3}, perkTxt:'+1 afwerken, +1 dribbelen, +3 reputatie', tekst:'het merk van de wereldsterren'},
];
export const merkVan = naam => MERKEN.find(m => m.n === naam);
const niveau = naam => { const m = merkVan(naam); return m ? MERKEN.indexOf(m) : -1; };
export const schoenDeal = () => (S.sp.sponsors || []).find(d => d.cat === 'schoenen') || null;
const periode = () => `${S.jaar}-${S.ronde >= 19 ? 2 : 1}`;
export const prof = () => { const sp = S.sp; return !sp.clubloos && !sp.o23 && (sp.huur ? huurOuder().t : club().t) <= 2; };
export function schoenBedrag(m){
  const sp = S.sp, t = sp.huur ? huurOuder().t : club().t, volg = Math.min(.5, Math.max(0, Math.log10(social().volgers + 1) - 3) * .12);
  return Math.round(m.basis * (t === 1 ? 1 : .6) * (1 + sp.rep / 100 + volg) * (.85 + rnd() * .3) / 1000) * 1000;
}
// Kans dat ze je nemen (null: geen kans, je bent te zwak)
export function schoenKans(m){
  const sp = S.sp, gat = ovr(sp) - m.min; if (m.min && gat < -4) return null;
  const volg = Math.min(.08, Math.max(0, Math.log10(social().volgers + 1) - 3) * .03);
  return clamp(.45 + gat * .08 + sp.rep / 1000 + volg, .05, .95);
}
export const kansTxt = k => k === null ? 'geen kans' : k >= .68 ? 'grote kans' : k >= .4 ? 'redelijke kans' : 'kleine kans';
export function kanAanvragen(m){
  const sp = S.sp, d = schoenDeal();
  if (!prof()) return 'Pas als je prof bent in een van de leagues.';
  if (d && d.levenslang) return `Je hebt een levenslang contract met ${d.merk}.`;
  if (d && niveau(d.merk) >= MERKEN.indexOf(m)) return d.merk === m.n ? 'Dit is jouw merk.' : 'Je hebt al een groter merk.';
  if ((sp.schoenAanvraag || {})[m.id] === periode()) return 'Al gevraagd: probeer het in de volgende transferperiode opnieuw.';
  return null;
}
function teken(m, bedrag, jaren){
  const sp = S.sp, oud = schoenDeal(), deals = sp.sponsors = sp.sponsors || [];
  if (oud) deals.splice(deals.indexOf(oud), 1);
  deals.push({cat:'schoenen', merk:m.n, bedrag, jaren, minRep:Math.max(3, Math.round(sp.rep - 15))});
  for (const [k, n] of Object.entries(m.perk)) if (k === 'rep') mod('rep', n); else verhoog(k, n);
  const u = mijnUiterlijk(), i = SCHOENEN.indexOf(m.kleur); if (i >= 0) u.schoen = i;
  S.car.hist.push(`${seizoenLabel()}: schoenendeal met ${m.n}`);
  if (MERKEN.indexOf(m) >= 3) krantMelding(`${sp.naam} tekent bij ${m.n}`, `Het schoenenmerk betaalt hem ${geldTxt(bedrag)} per jaar. ${m.n} werkt alleen met de beste spelers.`);
  return `${oud ? `Je verruilt ${oud.merk} voor ${m.n}. ` : ''}Getekend! ${m.n} betaalt je ${geldTxt(bedrag)} per jaar, ${jaren} ${jaren === 1 ? 'seizoen' : 'seizoenen'} lang. Extra: ${m.perkTxt}. Je speelt voortaan op hun schoenen.`;
}
// Zelf aanvragen bij een merk
export function vraagAan(id){
  const sp = S.sp, m = MERKEN.find(x => x.id === id); if (!m || kanAanvragen(m) || !S.week) return;
  (sp.schoenAanvraag = sp.schoenAanvraag || {})[m.id] = periode();
  const k = schoenKans(m);
  if (k === null){ S.week.tekst.push(`${m.n} werkt alleen met ${m.min >= 79 ? 'de allerbeste spelers' : 'spelers van een hoger niveau'}. "Kom terug als je klasse ${m.min} bent."`); return; }
  if (rnd() >= k){ S.week.tekst.push(`${m.n} kiest voor een andere speler. ${ovr(sp) < m.min ? `Je moet nog wat beter worden (ze zoeken klasse ${m.min}).` : 'Volgende keer beter.'}`); return; }
  // twijfel: een lager bedrag, of een kort contract
  const twijfel = k < .55, bedrag = Math.round(schoenBedrag(m) * (twijfel ? .75 : 1) / 1000) * 1000, jaren = twijfel ? 1 : randInt(2, 3);
  S.week.tekst.push((twijfel ? `${m.n} wil het proberen, maar voorzichtig: een korter contract en een lager bedrag. ` : '') + teken(m, bedrag, jaren));
}
// Een merk klopt zelf aan (vanuit maakSponsorEvent): het beste merk waarvoor je bijna goed genoeg bent, als dat beter is dan je huidige
export function schoenEvent(){
  if (!prof()) return null;
  const sp = S.sp, o = ovr(sp), d = schoenDeal(), nu = d ? niveau(d.merk) : -1; if (d && d.levenslang) return null;
  const m = MERKEN.filter((x, i) => i > nu && o >= x.min - 2).pop(); if (!m) return null;
  const bedrag = schoenBedrag(m), jaren = randInt(1, 3);
  return {soort:'sponsor', tekst:`Schoenenmerk ${m.n} (${m.tekst}) wil dat je op hun schoenen speelt. Ze bieden ${geldTxt(bedrag)} per jaar, ${jaren} ${jaren === 1 ? 'seizoen' : 'seizoenen'} lang. Extra: ${m.perkTxt}.${d ? ` Je contract met ${d.merk} vervalt dan.` : ''}`, opts:[
    {l:`Tekenen (${geldTxt(bedrag)} per jaar)`, f(){ return teken(m, bedrag, jaren); }},
    {l:'Meer geld vragen', f(){ if (rnd() < .5) return 'Ze gaan akkoord met 25% meer. ' + teken(m, Math.round(bedrag * 1.25 / 1000) * 1000, jaren); return `${m.n} vindt je te duur en kiest voor een andere speler.`; }},
    {l:'Nee bedankt', f(){ return `Je bedankt ${m.n} vriendelijk.`; }}]};
}
