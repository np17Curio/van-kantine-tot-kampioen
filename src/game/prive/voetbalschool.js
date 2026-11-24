import { S, mod, seizoenLabel } from '../../core/state.js';
import { clamp, geldTxt, pick, randInt, rnd } from '../../core/utils.js';
import { CLUBS, LAAGSTE, divClubs, geldF } from '../../data/gegevens.js';
import { thuisLand } from '../../data/landen.js';
import { KRANTEN } from '../media/nieuws.js';
import { RODDELBLADEN, krantMelding } from '../media/roddel.js';
import { isProf } from './sponsors.js';
import { modFans } from '../wedstrijd/fans-pers.js';
import { ACHTERNAMEN, POS_NAAM, selectie } from '../competitie/spelers.js';
import { mijnSel } from '../trainer/ploeg.js';
import { vrouwenWereld } from '../../core/geslacht.js';

/* ===================== Eigen voetbalschool en zomerkamp ===================== */
// Ben je prof, dan kun je een eigen voetbalschool beginnen. Elke zomer (de eerste weken van het seizoen) geef je één kamp:
// een gratis clinic bij je oude amateurclub, een betaald zomerkamp of een groot kamp. Dat geeft reputatie, fans en moraal.
// Op elk kamp kun je een talent ontdekken (12 tot 15 jaar, sp.kampTalenten). Rond zijn 17e of 18e tekent dat talent
// bij jouw club (als jeugdspeler, x.kamptalent), of bij jouw ploeg als je dan trainer bent.
export const SCHOOL_PRIJS = () => Math.round(25000 * geldF());
export const KAMP_WEKEN = 4; // de eerste vier weken van het seizoen: dat is je zomer
// De amateurclub waar je school mee samenwerkt: in Nederland een echte amateurclub, in een ander land een kleine club uit dat land
const amateurClub = () => { if (thuisLand() === 'Nederland') return pick(AMATEUR); const l = divClubs(LAAGSTE).filter(i => CLUBS[i]); return l.length ? CLUBS[pick(l)].n : pick(AMATEUR); };
const AMATEUR = ['VV De Zwaluwen', 'SV Kantinezicht', 'RKSV Vooruit', 'VV Oranje Boys', 'SC Het Veldje', 'VV Blauw-Wit \'54', 'SV De Kraaien'];
const JONGENS = ['Sem', 'Daan', 'Milan', 'Jayden', 'Noah', 'Luuk', 'Bram', 'Ryan', 'Thijs', 'Mo', 'Ilias', 'Finn', 'Yusuf', 'Jesse', 'Owen', 'Senna'];
const MEIDEN = ['Lieke', 'Noa', 'Sara', 'Yara', 'Fenna', 'Isa', 'Zoë', 'Lina', 'Jill', 'Amira', 'Roos', 'Femke', 'Nina', 'Esmee', 'Liv', 'Sanne'];
const POS = ['K', 'V', 'V', 'M', 'M', 'M', 'A', 'A'];

export const KAMPEN = [
  {id:'clinic', n:'Gratis clinic bij je oude club', kost:0, kinderen:[40, 70], prijs:0, rep:1, fans:2, moraal:5, fit:-3, kans:.15},
  {id:'kamp', n:'Zomerkamp op je voetbalschool', kost:6000, kinderen:[80, 140], prijs:175, rep:2, fans:3, moraal:2, fit:-4, kans:.25},
  {id:'groot', n:'Groot internationaal kamp', kost:40000, kinderen:[200, 400], prijs:350, rep:4, fans:4, moraal:1, fit:-6, kans:.4, minRep:60},
];
export const school = () => S.sp.vschool || null;
export const kampTalenten = () => S.sp.kampTalenten || [];
export const talentLeeftijd = t => t.lft + (S.jaar - t.jaar);
export const kampKost = k => Math.round(k.kost * geldF());
// Mag je deze week een kamp geven? (null = ja, anders de reden)
export function kampReden(k){
  const sp = S.sp, v = school();
  if (!v) return 'eerst een voetbalschool beginnen';
  if (v.laatste === S.jaar) return 'dit jaar al een kamp gegeven';
  if (S.ronde >= KAMP_WEKEN) return 'alleen in de zomer (de eerste weken van het seizoen)';
  if (k && k.minRep && sp.rep < k.minRep) return `vanaf reputatie ${k.minRep}`;
  if (k && sp.geld < kampKost(k)) return 'te weinig geld';
  return null;
}
export function startSchool(){
  const sp = S.sp; if (sp.vschool || !isProf() || sp.geld < SCHOOL_PRIJS()) return;
  sp.geld -= SCHOOL_PRIJS();
  sp.vschool = {naam:`Voetbalschool ${sp.naam}`, jaar:S.jaar, amateur:amateurClub(), kampen:0, kinderen:0, laatste:null};
  mod('rep', 2); mod('moraal', 4);
  S.car.hist.push(`${seizoenLabel()}: Voetbalschool ${sp.naam} opgericht`);
  krantMelding(`${sp.naam} begint eigen voetbalschool`, `"Ik wil kinderen leren wat ik zelf op het veldje leerde," zegt de prof. Elke zomer komt er een kamp.`, RODDELBLADEN);
  if (S.week) S.week.tekst.push(`Je begint Voetbalschool ${sp.naam}: pionnen, hesjes, een logo en een website. Elke zomer kun je nu een kamp geven.`);
}
export function geefKamp(id){
  const sp = S.sp, v = school(), k = KAMPEN.find(x => x.id === id); if (!k || kampReden(k)) return;
  const kost = kampKost(k), n = randInt(...k.kinderen), inkomst = Math.round(n * k.prijs * geldF() * (.8 + Math.min(sp.rep, 100) / 250));
  sp.geld += inkomst - kost; v.laatste = S.jaar; v.kampen++; v.kinderen += n;
  mod('rep', k.rep); mod('moraal', k.moraal); mod('fit', k.fit); modFans(k.fans);
  const saldo = inkomst - kost, uit = [];
  let t = id === 'clinic' ? `Je geeft een gratis clinic bij ${v.amateur}, je oude club. ${n} kinderen in te grote shirts, en in de kantine hangt nog je oude elftalfoto.`
    : id === 'kamp' ? `Een week zomerkamp op je voetbalschool: ${n} kinderen, elke ochtend een warming-up met jou en 's middags een toernooi.`
    : `Je grote internationale kamp: ${n} kinderen uit het hele land en daarbuiten, met camera's langs het veld.`;
  if (saldo > 0) uit.push(`Het kamp levert je ${geldTxt(saldo)} op.`); else if (saldo < 0) uit.push(`Het kamp kost je ${geldTxt(-saldo)}.`);
  const kop = id === 'clinic' ? `${sp.naam} terug bij ${v.amateur}` : `${n} kinderen op zomerkamp van ${sp.naam}`;
  const tekst = id === 'clinic' ? `De prof gaf een gratis clinic bij de club waar het allemaal begon. "Hier stond ik ook, met veel te grote schoenen."` : `Op het kamp van Voetbalschool ${sp.naam} trainden kinderen een week lang met hun held.`;
  // Een talent ontdekken
  if (rnd() < k.kans + (kampTalenten().length ? 0 : .05)){
    const meid = vrouwenWereld(), voornaam = pick(meid ? MEIDEN : JONGENS), pos = pick(POS);
    const tal = {voornaam, n:pick(ACHTERNAMEN), lft:randInt(12, 15), pos, pot:randInt(72, 90), jaar:S.jaar, kamp:k.id, meid};
    (sp.kampTalenten = sp.kampTalenten || []).push(tal);
    uit.push(`Eén kind valt je meteen op: ${voornaam} ${tal.n} (${tal.lft}), ${POS_NAAM[pos].toLowerCase()}. Die heeft iets. Je schrijft de naam op.`);
  }
  krantMelding(kop, tekst, id === 'clinic' ? KRANTEN[2] : RODDELBLADEN);
  S.week.tekst.push(t, ...uit);
}
// Elke week (week.js en trainer/prive.js): een kamptalent dat oud genoeg is, tekent bij jouw club of jouw ploeg
export function kampTalentWeek(eerste){
  const sp = S.sp, lijst = kampTalenten(); if (eerste || !lijst.length) return;
  const T0 = S.trainer && !S.trainer.gestopt ? S.trainer : null;
  for (const t of lijst){
    if (t.klaar || t.check === S.jaar) continue;
    const lft = talentLeeftijd(t); if (lft < 17) continue;
    t.check = S.jaar;
    if (lft === 17 && rnd() < .5) continue; // (op zijn 17e misschien nog niet, op zijn 18e wel)
    const id = T0 ? T0.club : sp.clubloos ? null : sp.club, c = id != null ? CLUBS[id] : null;
    if (!c || lft > 19){ t.klaar = true; t.elders = true; if (S.week) S.week.tekst.push(`${t.voornaam} ${t.n}, die je ooit ontdekte op je voetbalkamp, tekent bij een andere club. Je stuurt een berichtje: "Trots op je."`); continue; }
    const sel = T0 ? mijnSel() : selectie(id), bezet = new Set(sel.map(x => x.nr)), vrij = Array.from({length:30}, (_, i) => i + 14).filter(nr => !bezet.has(nr));
    const k = clamp(Math.round(c.s - 12 + (t.pot - 80) / 2 + randInt(-2, 2)), 30, 85);
    const x = {v:t.voornaam[0], n:sel.some(y => y.n === t.n) ? `${t.n} jr.` : t.n, pos:t.pos, k, kStart:k, pot:t.pot, lft, basis:false, jeugd:true, sindsWeek:S.weekNr || 0, g:.2, a:.2, fit:100, bles:0, bT:0,
      kamptalent:true, ontdekt:t.jaar, ...(sel.some(y => y.nr) && vrij.length ? {nr:vrij[0]} : {})};
    sel.push(x); t.klaar = true; t.club = id;
    mod('moraal', 4); if (!T0) modFans(2);
    const zin = `${t.voornaam} ${t.n}, die je ooit ontdekte op je voetbalkamp, tekent bij ${c.n}.`;
    if (S.week) S.week.tekst.push(zin, `${T0 ? 'Vanaf nu speelt het talent in jouw ploeg.' : 'Vanaf nu zijn jullie ploeggenoten.'} Op het kamp was het talent ${t.lft}, nu ${lft}.`);
    krantMelding(`Kamptalent ${t.voornaam} ${t.n} tekent bij ${c.n}`, `${sp.naam} ontdekte het talent in ${t.jaar} op het eigen voetbalkamp. "Ik zag het meteen," zegt ${sp.naam}.`, KRANTEN[c.t] || KRANTEN[2]);
  }
}
