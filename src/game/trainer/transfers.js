import { S } from '../../core/state.js';
import { clamp, geldTxt, pick, rnd } from '../../core/utils.js';
import { CLUBS, LAAGSTE, divClubs } from '../../data/gegevens.js';
import { POS_NAAM, selectie } from '../competitie/spelers.js';
import { metVoorletter } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { herschik, noteerDeal } from '../transfers/markt.js';
import { mijnSel, opst, pasToe, refKracht } from './ploeg.js';
import { trainerNiveau } from './loopbaan.js';

/* ===================== Trainer: kopen en verkopen ===================== */
export const BUDGET = [40e6, 6e6, 1.2e6, 250e3, 25e3, 5e3]; // per seizoen, per niveau
export const MAX_SEL = 25, MIN_KEEPERS = 2;
// Wat is een speler waard? Klasse en leeftijd
export function prijs(x){
  const lft = x.lft || 25, f = lft < 23 ? 1.3 : lft < 28 ? 1 : lft < 31 ? .7 : .4;
  return Math.max(1000, Math.round(Math.pow(1.16, x.k - 50) * 50000 * f / 1000) * 1000);
}
export const vensterOpen = () => !!(S.trainer && S.trainer.venster);
// De clubsterkte schuift mee met de beste elf die je kunt opstellen
export function herbereken(voor){ const c = CLUBS[S.trainer.club]; c.s = clamp(Math.round(c.s + (refKracht() - voor) * .8), 30, 95); }

// De markt van dit venster: 10 spelers van clubs rond jouw niveau, vooral op plekken waar je basis zwak is
export function maakMarkt(){
  const T0 = S.trainer, mijn = T0.club, t = CLUBS[mijn].t, sel = mijnSel(), ref = refKracht();
  const zwak = pos => { const b = sel.filter(x => x.pos === pos && x.basis).map(x => x.k); return b.length ? Math.min(...b) : 0; };
  const clubs = [t - 1, t, t + 1].filter(x => x >= 1 && x <= LAAGSTE).flatMap(x => divClubs(x)).filter(i => i !== mijn);
  const kand = clubs.flatMap(i => selectie(i).filter(x => x.pos !== 'K' || rnd() < .3).map(x => ({x, van:i})))
    .filter(({x}) => x.k >= ref - 8 && x.k <= ref + 9 && !sel.some(y => y.n === x.n));
  const uit = [], gewicht = ({x}) => 1 + Math.max(0, x.k - zwak(x.pos)) / 3;
  for (let i = 0; i < 10 && kand.length; i++){
    let tot = kand.reduce((a, k) => a + gewicht(k), 0), r = rnd() * tot, j = 0;
    for (; j < kand.length - 1; j++){ r -= gewicht(kand[j]); if (r <= 0) break; }
    const {x, van} = kand.splice(j, 1)[0];
    uit.push({n:x.n, v:x.v, pos:x.pos, k:x.k, lft:x.lft, van, basis:!!x.basis, prijs:Math.round(prijs(x) * (x.basis ? 1.15 : 1) / 1000) * 1000});
  }
  // Een toptrainer trekt een ster aan: de beste speler (boven jouw niveau) van een club een league hoger, of van een andere topclub
  if (trainerNiveau().ster){
    const hoger = (t > 1 ? divClubs(t - 1) : divClubs(t).filter(i => i !== mijn));
    const st = hoger.flatMap(i => selectie(i).filter(x => x.basis && x.k >= ref + 3 && !sel.some(y => y.n === x.n)).map(x => ({x, van:i}))).sort((a, b) => b.x.k - a.x.k)[0];
    if (st && !uit.some(m => m.n === st.x.n)){ const {x, van} = st; uit.push({n:x.n, v:x.v, pos:x.pos, k:x.k, lft:x.lft, van, basis:true, ster:true, prijs:Math.round(prijs(x) * 1.3 / 1000) * 1000}); }
  }
  T0.markt = uit.sort((a, b) => b.k - a.k);
}
// Wat mag je op jouw trainersniveau? (null = mag)
export function magKopen(som){
  const T0 = S.trainer, N = trainerNiveau();
  if (N.k === 'beginnend') return 'Als beginnende trainer doet de technisch directeur de transfers. Je kunt hem wel om een versterking vragen.';
  if (N.maxKoop && (T0.gekochtVenster || 0) >= N.maxKoop) return `Als ervaren trainer mag je ${N.maxKoop} spelers per transferperiode kopen. Meer zeggenschap krijg je vanaf reputatie 60.`;
  if (N.maxDeel && som != null && som > (T0.vensterBudget ?? T0.budget) * N.maxDeel) return `Als ervaren trainer mag een aankoop hooguit de helft van je budget kosten. Die beslissing ligt bij het bestuur.`;
  return null;
}
// Kopen: lukt het? Hoe beter je naam en hoe sterker jouw club, hoe eerder een club meewerkt
export function koop(i){
  const T0 = S.trainer, m = T0.markt && T0.markt[i], sel = mijnSel();
  if (!m || !vensterOpen()) return 'Het transfervenster is dicht.';
  if (sel.length >= MAX_SEL) return `Je selectie is vol (${MAX_SEL} spelers). Verkoop eerst iemand.`;
  const som = m.tegenbod || m.prijs, mag = magKopen(som); if (mag) return mag;
  if (som > T0.budget) return `Daar heb je het budget niet voor (${geldTxt(T0.budget)} over).`;
  const kans = m.tegenbod ? .95 : clamp(.55 + (T0.rep - 50) / 200 + (CLUBS[T0.club].s - CLUBS[m.van].s) / 40 - (m.basis ? .15 : 0), .1, .9);
  if (rnd() >= kans){
    if (m.tegenbod){ T0.markt.splice(i, 1); return `${CLUBS[m.van].n} trekt zich terug. ${metVoorletter(m)} blijft waar hij is.`; }
    m.tegenbod = Math.round(m.prijs * 1.2 / 1000) * 1000; return `${CLUBS[m.van].n} wil ${metVoorletter(m)} niet voor ${geldTxt(m.prijs)} kwijt. Ze vragen ${geldTxt(m.tegenbod)}.`;
  }
  return voerKoopUit(i, som);
}
function voerKoopUit(i, som){
  const T0 = S.trainer, m = T0.markt[i], sel = mijnSel();
  const selV = selectie(m.van), x = selV.find(y => y.n === m.n);
  if (!x){ T0.markt.splice(i, 1); return `${metVoorletter(m)} is al naar een andere club.`; }
  T0.gekochtVenster = (T0.gekochtVenster || 0) + 1;
  const voor = refKracht();
  selV.splice(selV.indexOf(x), 1); selectie(m.van); herschik(selectie(m.van));
  if (m.basis) CLUBS[m.van].s = clamp(CLUBS[m.van].s - 1, 30, 95);
  sel.push({...x, basis:false, fit:100, bles:0, bT:0, nieuwWeek:S.weekNr || 0, gekochtSz:S.jaar});
  T0.budget -= som; T0.sz.saldo -= som; T0.sz.gekocht.push(x.k);
  herbereken(voor); pasToe();
  noteerDeal(m.van, T0.club, x, 'trainer', {som});
  T0.markt.splice(i, 1);
  krantMelding(`${CLUBS[T0.club].n} haalt ${metVoorletter(x)} bij ${CLUBS[m.van].n}`, `De ${POS_NAAM[x.pos].toLowerCase()} (${x.lft}, klasse ${x.k}) komt over voor ${geldTxt(som)}. Trainer ${S.sp.naam}: "Precies wat we zochten."`);
  return `Gelukt! ${metVoorletter(x)} komt voor ${geldTxt(som)}. Zet hem in de opstelling als je hem wilt laten spelen.`;
}
// Een beginnende trainer vraagt de technisch directeur om een versterking: hij kiest zelf wie (de beste betaalbare op je zwakste plek)
export function vraagVersterking(){
  const T0 = S.trainer, sel = mijnSel();
  if (!vensterOpen()) return 'Het transfervenster is dicht.';
  if (T0.versterkingGevraagd) return 'Je hebt deze transferperiode al om een versterking gevraagd.';
  if (sel.length >= MAX_SEL) return `Je selectie is vol (${MAX_SEL} spelers).`;
  T0.versterkingGevraagd = true;
  if (rnd() >= clamp(.4 + (T0.bestuur - 50) / 100, .15, .85)) return 'De technisch directeur ziet geen noodzaak: "We hebben genoeg spelers. Laat eerst maar zien wat je met deze groep kunt."';
  const zwak = pos => { const b = sel.filter(x => x.pos === pos && x.basis).map(x => x.k); return b.length ? Math.min(...b) : 0; };
  const kand = (T0.markt || []).map((m, i) => ({m, i, winst:m.k - zwak(m.pos)})).filter(o => o.m.prijs <= T0.budget && o.winst > 0).sort((a, b) => b.winst - a.winst);
  if (!kand.length) return 'De technisch directeur vindt niemand die beter is en binnen het budget past.';
  return 'De technisch directeur regelt het. ' + voerKoopUit(kand[0].i, kand[0].m.prijs);
}
// Verkopen: een andere club doet een bod, dat jij aanneemt of weigert
export function biedAan(naam){
  const T0 = S.trainer, sel = mijnSel(), x = sel.find(y => y.n === naam);
  if (!x || !vensterOpen()) return 'Het transfervenster is dicht.';
  if (x.pos === 'K' && sel.filter(y => y.pos === 'K').length <= MIN_KEEPERS) return `Je hebt minimaal ${MIN_KEEPERS} keepers nodig.`;
  if (trainerNiveau().k === 'beginnend') return 'Verkopen gaat via de technisch directeur. Als ervaren trainer (reputatie 45) mag je zelf spelers aanbieden.';
  const t = CLUBS[T0.club].t, kopers = [t - 1, t].filter(y => y >= 0).flatMap(y => divClubs(y)).filter(i => i !== T0.club);
  const koper = pick(kopers), som = Math.round(prijs(x) * (.8 + rnd() * .3) / 1000) * 1000;
  T0.bod = {naam, koper, som};
  return `${CLUBS[koper].n} biedt ${geldTxt(som)} voor ${metVoorletter(x)}.`;
}
export function accepteerBod(){
  const T0 = S.trainer, b = T0.bod; T0.bod = null; if (!b || !vensterOpen()) return null;
  const sel = mijnSel(), x = sel.find(y => y.n === b.naam); if (!x) return null;
  const voor = refKracht();
  sel.splice(sel.indexOf(x), 1); selectie(T0.club); // de jeugd vult aan
  const selK = selectie(b.koper); selK.push({...x, basis:false}); herschik(selK);
  T0.budget += b.som; T0.sz.saldo += b.som;
  opst().ids = opst().ids.filter(n => n !== x.n);
  herbereken(voor); pasToe();
  noteerDeal(T0.club, b.koper, x, 'trainer', {som:b.som});
  krantMelding(`${CLUBS[T0.club].n} verkoopt ${metVoorletter(x)} aan ${CLUBS[b.koper].n}`, `De ${POS_NAAM[x.pos].toLowerCase()} vertrekt voor ${geldTxt(b.som)}.`);
  return `${metVoorletter(x)} is verkocht aan ${CLUBS[b.koper].n} voor ${geldTxt(b.som)}.`;
}
export function weigerBod(){ S.trainer.bod = null; }
