import { S } from '../../core/state.js';
import { clamp, geldTxt, pick, rnd } from '../../core/utils.js';
import { CLUBS, JEUGD, divClubs } from '../../data/gegevens.js';
import { POS_NAAM, selectie } from '../competitie/spelers.js';
import { metVoorletter } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { herschik, noteerDeal } from '../transfers/markt.js';
import { mijnSel, opst, pasToe, refKracht } from './ploeg.js';

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
function herbereken(voor){ const c = CLUBS[S.trainer.club]; c.s = clamp(Math.round(c.s + (refKracht() - voor) * .8), 30, 95); }

// De markt van dit venster: 10 spelers van clubs rond jouw niveau, vooral op plekken waar je basis zwak is
export function maakMarkt(){
  const T0 = S.trainer, mijn = T0.club, t = CLUBS[mijn].t, sel = mijnSel(), ref = refKracht();
  const zwak = pos => { const b = sel.filter(x => x.pos === pos && x.basis).map(x => x.k); return b.length ? Math.min(...b) : 0; };
  const clubs = [t - 1, t, t + 1].filter(x => x >= 0 && x < JEUGD).flatMap(x => divClubs(x)).filter(i => i !== mijn);
  const kand = clubs.flatMap(i => selectie(i).filter(x => x.pos !== 'K' || rnd() < .3).map(x => ({x, van:i})))
    .filter(({x}) => x.k >= ref - 8 && x.k <= ref + 9 && !sel.some(y => y.n === x.n));
  const uit = [], gewicht = ({x}) => 1 + Math.max(0, x.k - zwak(x.pos)) / 3;
  for (let i = 0; i < 10 && kand.length; i++){
    let tot = kand.reduce((a, k) => a + gewicht(k), 0), r = rnd() * tot, j = 0;
    for (; j < kand.length - 1; j++){ r -= gewicht(kand[j]); if (r <= 0) break; }
    const {x, van} = kand.splice(j, 1)[0];
    uit.push({n:x.n, v:x.v, pos:x.pos, k:x.k, lft:x.lft, van, basis:!!x.basis, prijs:Math.round(prijs(x) * (x.basis ? 1.15 : 1) / 1000) * 1000});
  }
  T0.markt = uit.sort((a, b) => b.k - a.k);
}
// Kopen: lukt het? Hoe beter je naam en hoe sterker jouw club, hoe eerder een club meewerkt
export function koop(i){
  const T0 = S.trainer, m = T0.markt && T0.markt[i], sel = mijnSel();
  if (!m || !vensterOpen()) return 'Het transfervenster is dicht.';
  if (sel.length >= MAX_SEL) return `Je selectie is vol (${MAX_SEL} spelers). Verkoop eerst iemand.`;
  const som = m.tegenbod || m.prijs;
  if (som > T0.budget) return `Daar heb je het budget niet voor (${geldTxt(T0.budget)} over).`;
  const kans = m.tegenbod ? .95 : clamp(.55 + (T0.rep - 50) / 200 + (CLUBS[T0.club].s - CLUBS[m.van].s) / 40 - (m.basis ? .15 : 0), .1, .9);
  if (rnd() >= kans){
    if (m.tegenbod){ T0.markt.splice(i, 1); return `${CLUBS[m.van].n} trekt zich terug. ${metVoorletter(m)} blijft waar hij is.`; }
    m.tegenbod = Math.round(m.prijs * 1.2 / 1000) * 1000; return `${CLUBS[m.van].n} wil ${metVoorletter(m)} niet voor ${geldTxt(m.prijs)} kwijt. Ze vragen ${geldTxt(m.tegenbod)}.`;
  }
  const selV = selectie(m.van), x = selV.find(y => y.n === m.n);
  if (!x){ T0.markt.splice(i, 1); return `${metVoorletter(m)} is al naar een andere club.`; }
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
// Verkopen: een andere club doet een bod, dat jij aanneemt of weigert
export function biedAan(naam){
  const T0 = S.trainer, sel = mijnSel(), x = sel.find(y => y.n === naam);
  if (!x || !vensterOpen()) return 'Het transfervenster is dicht.';
  if (x.pos === 'K' && sel.filter(y => y.pos === 'K').length <= MIN_KEEPERS) return `Je hebt minimaal ${MIN_KEEPERS} keepers nodig.`;
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
