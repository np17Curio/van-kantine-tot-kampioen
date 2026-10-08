import { S, club, mod, ovr, seizoenLabel } from '../../core/state.js';
import { geldTxt, pick, randInt, rnd } from '../../core/utils.js';
import { ATTR, CLUBS, SPONSOR_CAT, TRAINBAAR, WINKEL } from '../../data/gegevens.js';
import { ouders } from './familie.js';
import { social } from './social.js';
import { fmt1 } from '../speler/o23.js';
import { teken } from '../transfers/transfers.js';
import { plafond, verhoog } from '../week.js';

/* ===================== Sponsors ===================== */
export const isProf = () => (S.sp.huur ? CLUBS[S.sp.huur.ouder].t : club().t) <= 2;
export function sponsorBedrag(cat){
  const sp = S.sp, t = sp.huur ? CLUBS[sp.huur.ouder].t : club().t;
  return Math.round((5000 + sp.rep * sp.rep * 15) * ([5, 2.5, 1][t] || 1) * SPONSOR_CAT[cat].f * (.85 + rnd() * .3) / 1000) * 1000;
}
export function sponsorPerk(cat){
  if (cat === 'schoenen'){ verhoog('afw', 1); verhoog('drib', 1); }
  else if (cat === 'kleding') mod('rep', 2);
  else if (cat === 'horloge') mod('moraal', 3);
  else if (cat === 'auto') mod('rep', 3);
  else if (cat === 'audio') mod('moraal', 2);
  else if (cat === 'verzorging') mod('rep', 1);
}
// Hoe bekender je bent, hoe vaker een merk aanklopt. Eén deal per soort product
export function maakSponsorEvent(){
  const sp = S.sp; if (!isProf() || sp.o23) return null;
  const deals = sp.sponsors = sp.sponsors || [];
  const vrij = Object.keys(SPONSOR_CAT).filter(c => !deals.some(d => d.cat === c) && (!SPONSOR_CAT[c].rijbewijs || sp.rijbewijs));
  if (!vrij.length || rnd() > .05 + sp.rep / 500 + Math.min(.05, Math.max(0, Math.log10(social().volgers + 1) - 3) * .02)) return null;
  const cat = pick(vrij), C = SPONSOR_CAT[cat], merk = pick(C.merken), jaren = randInt(1, 3);
  const deal = {cat, merk, bedrag:sponsorBedrag(cat), jaren, minRep:Math.max(3, Math.round(sp.rep - 15))};
  const seiz = j => `${j} ${j === 1 ? 'seizoen' : 'seizoenen'}`;
  const teken = () => { deals.push(deal); sponsorPerk(cat); S.car.hist.push(`${seizoenLabel()}: sponsordeal met ${merk} (${C.n.toLowerCase()})`); return `Getekend! ${merk} betaalt je ${geldTxt(deal.bedrag)} per jaar, ${seiz(jaren)} lang. Extra: ${C.perk}.`; };
  return {soort:'sponsor', tekst:`${merk} (${C.n.toLowerCase()}) wil jou als gezicht van hun nieuwe campagne. Ze bieden ${geldTxt(deal.bedrag)} per jaar, ${seiz(jaren)} lang. Extra: ${C.perk}.`, opts:[
    {l:`Tekenen (${geldTxt(deal.bedrag)} per jaar)`, f(){ return teken(); }},
    {l:'Meer geld vragen', f(){ if (rnd() < .55){ deal.bedrag = Math.round(deal.bedrag * 1.3 / 1000) * 1000; return 'Ze gaan akkoord met 30% meer. ' + teken(); } return `${merk} vindt je te duur en kiest voor een andere speler.`; }},
    {l:'Nee bedankt', f(){ return `Je bedankt ${merk} vriendelijk.`; }}]};
}

// Een 9 of hoger: +3 bij een willekeurige eigenschap (binnen je talentplafond)
export function topBonus(M){
  if (M.cijfer === null || M.cijfer < 9) return null;
  const sp = S.sp, vrij = TRAINBAAR.filter(k => sp.a[k] < plafond());
  // Net als gewone groei: tot je talent op is (klasse = talent + 3)
  if (ovr(sp) >= sp.pot + 3) return {tekst:`Topwedstrijd met een ${fmt1(M.cijfer)}! Je zit aan het maximum van je talent, dus er kan niets meer bij.`};
  if (!vrij.length) return {tekst:`Topwedstrijd met een ${fmt1(M.cijfer)}! Al je eigenschappen zitten aan je plafond, dus er kan niets meer bij.`};
  const k = pick(vrij), voor = sp.a[k];
  verhoog(k, 3);
  return {k, n:sp.a[k] - voor, tekst:`Topwedstrijd met een ${fmt1(M.cijfer)}! Bonus: +${sp.a[k] - voor} ${ATTR[k].toLowerCase()}.`};
}
export function koop(id){
  const sp = S.sp, it = WINKEL.find(x => x.id === id);
  if (!it || sp.items[id] || sp.geld < it.prijs) return;
  sp.geld -= it.prijs; sp.items[id] = true;
  if (id === 'schoenen'){ verhoog('afw', 2); verhoog('drib', 1); }
  if (id === 'kok') verhoog('cond', 3);
  if (id === 'auto'){ mod('rep', 6); mod('vert', -5); }
  if (id === 'villa') mod('moraal', 15);
  if (id === 'console') mod('moraal', 4);
  if (id === 'telefoon') mod('moraal', 3);
  if (id === 'kleding') mod('rep', 2);
  if (id === 'horloge') mod('rep', 3);
  if (id === 'appartement') mod('moraal', 8);
  if (id === 'ouders'){ mod('moraal', 15); ouders().band = 100; }
  if (id === 'school') mod('rep', 8);
  if (id === 'jacht'){ mod('rep', 5); mod('moraal', 10); }
  if (id === 'jet') mod('rep', 8);
  S.week.tekst.push(`Gekocht: ${it.n}.`);
}
