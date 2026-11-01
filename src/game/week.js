import { S, mod, ovr, attr as attrN } from '../core/state.js';
import { clamp, rnd } from '../core/utils.js';
import { AANTAL_RONDES, TRAINBAAR, weekFactor } from '../data/gegevens.js';
import { maakEvent } from './gebeurtenissen.js';
import { uitgaanKrant } from './media/uitgaan-krant.js';
import { buitenWeek } from './prive/buiten-week.js';
import { dieren } from './prive/dieren.js';
import { familieWeek } from './prive/familie.js';
import { relatieWeek } from './prive/gezin.js';
import { haalFoutWeg, maakSchoolvraag } from './prive/school.js';
import { isProf, maakSponsorEvent } from './prive/sponsors.js';
import { woning, woningMoraal } from './prive/wonen-auto.js';
import { kalmData, kalmWeek, kroegEvent, kroegKans } from './speler/kalmte.js';
import { checkStatus, statusPunten } from './speler/status.js';
import { kleedWeek } from './team/kleedkamer.js';
import { rugnummer } from './team/rugnummers.js';
import { tactiekTraining } from './team/tactiek.js';
import { ergernis, tuchtWeek } from './team/tucht.js';
import { ck } from './transfers/buitenland.js';
import { maakBodEvent } from './transfers/transferbod.js';
import { focusBoost } from './wedstrijd/momenten.js';
import { doeVerhaal, isVerhaalActiviteit } from './speler/verhaal.js';
import { talentDoorbraak } from './speler/talent.js';
import { pers } from './speler/persoonlijkheid.js';
import { ouders } from './prive/familie.js';
import { maakRivaal, raceWeek, rivaalPrikkel } from './speler/rivaal.js';
import { clubloosWeek } from './speler/clubloos.js';
import { gbMoment } from './seizoen/gouden-bal.js';
import { buitenlandWeek } from './prive/buitenland-leven.js';
import { journeyWeek, vriendWeek } from './speler/journey.js';

/* ===================== Week ===================== */
export function nieuweWeek(eerste){
  const sp = S.sp; S.weekNr = (S.weekNr || 0) + 1;
  if (!sp.rivaal && !S.trainer && !(sp.journey && sp.journey.h < 4)) maakRivaal(); // je vaste rivaal (in je verhaal pas na de verleiding: misschien wordt je jeugdvriend het)
  if (!eerste){
    const deals = sp.sponsors || [];
    sp.herstel = weekHerstel(sp.fit); // ben je moe, dan herstel je meer (anders zak je in een lang seizoen weg)
    sp.fit = clamp(sp.fit + sp.herstel + (sp.items.fysio ? 8 : 0) + (sp.items.hoogtekamer ? 4 : 0) + (sp.items.jet ? 2 : 0) + (deals.some(d => d.cat === 'drank') ? 2 : 0), 0, 100);
    sp.moraal = clamp(sp.moraal + (60 - sp.moraal) * .08 + woningMoraal() + (sp.relatie && sp.relatie.samen ? 1 : 0) + ((sp.kinderen || []).length ? 1 : 0) + (sp.items.school ? 1 : 0) + (sp.relatie ? 1 : 0) + Math.min(2, dieren().length) + (sp.statusNiveau >= 3 ? 1 : 0), 0, 100);
    if (sp.relatie) sp.relatie.weken++;
    if (pers('familie')){ const o = ouders(); o.band = clamp(o.band + 1, 0, 100); if (sp.relatie) sp.relatie.band = clamp(sp.relatie.band + 1, 0, 100); if (sp.moraal < 50) sp.moraal = clamp(sp.moraal + 2, 0, 100); }
    sp.sindsTransfer = (sp.sindsTransfer || 0) + 1;
    if (sp.woning === 'villa') mod('fit', 2);
    if (sp.items.matras) mod('fit', 2);
  }
  sp.geld += sp.salaris / AANTAL_RONDES;
  if (!eerste){
    sp.focus = clamp(sp.focus + (65 - sp.focus) * (sp.focus < 50 || sp.focus > 80 ? .2 : .1) + (sp.focus < 75 ? (sp.items.meditatie ? 1 : 0) + (sp.items.matras ? 1 : 0) : 0) - (sp.leeftijd < 18 && sp.ouders.boos ? 2 : 0), 0, 100); // laag? dan herstel je sneller
  }
  S.week = {gedaan:false, tekst:[], school: sp.leeftijd < 18 ? maakSchoolvraag(sp) : null};
  const huur = woning().huur;
  if (!eerste && huur){
    if (sp.geld >= huur) sp.geld -= huur;
    else { const was = woning().n.toLowerCase(); sp.woning = 'ouders'; mod('moraal', -6); if (sp.relatie) sp.relatie.samen = false; S.week.tekst.push(`Je kunt de huur van je ${was} niet meer betalen. Je trekt weer in bij je ouders.`); }
  }
  if (!sp.o23 && !sp.clubloos && !(sp.rug && sp.rug.club === ck(sp.club))) rugnummer();
  if (sp.rugMelding){ S.week.tekst.push(sp.rugMelding); sp.rugMelding = null; }
  kalmWeek(eerste);
  if (!sp.clubloos) tuchtWeek(eerste);
  relatieWeek(eerste);
  raceWeek(eerste); // je rivaal: de race en zijn blessure
  buitenlandWeek(eerste); // in het buitenland: taal en heimwee
  if (!eerste) gbMoment(); // Gouden Bal: wat veranderde er sinds vorige week
  buitenWeek(eerste);
  if (!sp.clubloos) kleedWeek(eerste);
  familieWeek(eerste);
  S.fase = sp.clubloos ? 'clubloos' : 'week';
  clubloosWeek(eerste); // zonder club: weken tellen, moraal en fitheid zakken
  // Sponsorgeld komt per week binnen. Een merk stopt als je reputatie te ver zakt of als je geen prof meer bent
  const stop = [];
  sp.sponsors = (sp.sponsors || []).filter(d => {
    if (!isProf()){ stop.push(`Je speelt niet meer als prof. ${d.merk} stopt de samenwerking.`); return false; }
    if (sp.rep < d.minRep){ stop.push(`${d.merk} stopt de samenwerking: je reputatie is te ver gezakt.`); return false; }
    return true;
  });
  const sGeld = sp.sponsors.reduce((a, d) => a + d.bedrag, 0) / AANTAL_RONDES;
  sp.geld += sGeld; S.car.sponsor = (S.car.sponsor || 0) + sGeld;
  stop.forEach(t => S.week.tekst.push(t));
  if (!eerste && sp.relatie && sp.relatie.band < 25 && rnd() < .35){ mod('focus', -4); S.week.tekst.push(`Je hebt vaak ruzie met ${sp.relatie.naam}. Dat kost je concentratie.`); }
  if (!eerste && sp.items.console && rnd() < .12){ mod('fit', -6); S.week.tekst.push('Je hebt tot 2 uur \'s nachts gegamed. Je bent een beetje moe.'); }
  const st = sp.clubloos ? null : checkStatus(); if (st) S.week.tekst.push(st);
  // Een gebeurtenis die deze week klaarstaat (zoals een jubileum) verschijnt nu
  vriendWeek(eerste); // je jeugdvriend: jullie band, en misschien probeert de zaakwaarnemer het opnieuw
  if (S.wachtEv){ S.ev = S.wachtEv; S.wachtEv = null; S.fase = 'event'; }
  journeyWeek(eerste); // tijd voor een nieuw hoofdstuk van je verhaal?
}
// Herstel tussen twee wedstrijden: hoe vermoeider, hoe meer. Elke week trainen en spelen komt zo uit rond 70 fitheid
export const weekHerstel = fit => Math.round(20 + (100 - fit) * .2);
// Elke training telt: je bouwt voortgang op per eigenschap (de trainkans, met een minimum), en bij 100% krijg je +1.
// Zo groei je per seizoen ongeveer even snel als met een kans per training, maar train je nooit voor niets
export const TRAIN_MIN = .1;
const pct = x => `${Math.round(x * 100)}%`;
export const trainXP = k => (S.sp.trainXP && S.sp.trainXP[k]) || 0;
export function trainVoortgang(attr, f = 1){
  const sp = S.sp, xp = sp.trainXP = sp.trainXP || {}, voor = xp[attr] || 0;
  let na = voor + Math.max(TRAIN_MIN * f, trainKans() * f * (.8 + rnd() * .4)), plus = 0;
  if (na >= 1){ const v0 = sp.a[attr]; verhoog(attr, (sp.leeftijd < 18 && rnd() < .15) ? 2 : 1); plus = sp.a[attr] - v0; na -= 1; }
  xp[attr] = na;
  return {plus, voor, na};
}
// Hoe jonger, hoe sneller je groeit: tot 21 jaar het snelst, daarna steeds langzamer
export const leeftijdGroei = () => { const l = S.sp.leeftijd; return l <= 21 ? 1.2 : l <= 24 ? .9 : l <= 27 ? .6 : .4; };
export function trainKans(){ const sp = S.sp; return weekFactor() * leeftijdGroei() * (clamp((sp.pot - ovr(sp)) / 20, .1, .7) + (sp.items.trainer ? .15 : 0) + pers('train') + rivaalPrikkel()); } // (weekFactor: per seizoen even snel, hoe lang het seizoen ook is)
// Plafond per eigenschap: met jouw talent kun je een eigenschap niet eindeloos opkrikken
export const PLAFOND_MARGE = 10;
export const plafond = () => Math.min(99, S.sp.pot + PLAFOND_MARGE);
export function verhoog(k, n){
  const sp = S.sp;
  // Groei stopt bij het plafond. Ligt een eigenschap er al boven (oude opslag), dan blijft die staan
  if (n > 0) sp.a[k] = Math.max(sp.a[k], Math.min(sp.a[k] + n, plafond()));
  else sp.a[k] = clamp(sp.a[k] + n, 1, 99);
}

export function doeActiviteit(soort, attr){
  const sp = S.sp, w = S.week; let t;
  if (soort === 'train'){
    mod('fit', sp.items.fitness ? -5 : -8); mod('vert', 1);
    if (sp.a[attr] >= plafond()){
      const d = talentDoorbraak();
      t = d ? `Je traint keihard op ${attrN(attr).toLowerCase()}. ${d} Je plafond ligt nu op ${plafond()}.` : `Je ${attrN(attr).toLowerCase()} zit aan je plafond (${plafond()}). Train liever iets anders, of laat in wedstrijden zien dat er meer in je zit: sterke wedstrijden laten je talent groeien.`;
    } else {
      const g = trainVoortgang(attr), naam = attrN(attr).toLowerCase();
      t = g.plus ? `Je traint keihard op ${naam}. Het werpt z'n vruchten af: +${g.plus} ${naam}.` : `Je traint op ${naam}. Je wordt beter: voortgang ${pct(g.voor)} → ${pct(g.na)} naar +1.`;
    }
  } else if (soort === 'tactiek'){
    t = tactiekTraining();
  } else if (soort === 'rust'){
    mod('fit', 22); focusBoost(8); sp.vorm = clamp(sp.vorm + .3, -3, 3); kalmData().onrust *= .7;
    t = 'Je doet rustig aan: ijsbad, massage, vroeg naar bed. Je benen voelen weer fris.';
  } else if (soort === 'mentaal'){
    const n = focusBoost(12); mod('moraal', 2); mod('fit', 4); kalmData().onrust = Math.max(0, kalmData().onrust - 10);
    t = `Mentale training: je oefent met ademhaling en visualiseert je acties op het veld. Focus +${n}.`;
  } else if (soort === 'video'){
    const n = focusBoost(7); mod('vert', 4); mod('fit', -2);
    t = `Je bekijkt met de trainer beelden van je vorige wedstrijd. Je ziet precies wat er beter kan. Focus +${n}, en de trainer waardeert je inzet.`;
  } else if (soort === 'trainer'){
    mod('fit', -12); mod('vert', 7);
    t = 'Je blijft na de training hangen en vraagt de trainer om extra oefeningen. Hij knikt goedkeurend.';
  } else if (soort === 'extra'){
    // Voetbalgek: nog een uur doorgaan als de rest al onder de douche staat
    mod('fit', -6); mod('vert', 1);
    const k = TRAINBAAR.filter(x => sp.a[x] < plafond()).sort((a, b) => sp.a[a] - sp.a[b])[0];
    if (k && rnd() < .25 * weekFactor() * leeftijdGroei()){ const voor = sp.a[k]; verhoog(k, 1); t = `Als iedereen al naar huis is, sta jij nog op het veld. Je ${attrN(k).toLowerCase()} gaat van ${voor} naar ${sp.a[k]}.`; }
    else t = 'Je blijft na de training nog een uur ballen. Moe maar voldaan ga je naar huis.';
  } else if (soort === 'uit'){
    mod('moraal', 10 + pers('uitMoraal')); mod('fit', -6); mod('focus', -3 + pers('uitFocus'));
    if (rnd() < .3){ mod('rep', -3); mod('vert', -6); statusPunten(-3);
      t = sp.leeftijd < 18 ? 'Je hangt tot laat met vrienden in het dorp. Je komt te laat op de training en de trainer is niet blij.' : isProf() ? 'Gezellig avondje met de selectie... tot er een foto van jou op een tafel in de krant staat. De trainer is niet blij.' : 'Gezellig avondje met de selectie... maar je komt veel te laat thuis en verslaapt je voor de training. De trainer is niet blij.';
      if (sp.leeftijd >= 18){ ergernis(10); uitgaanKrant(rnd() < .5 ? 'feest' : 'boete', true); }
    } else { t = sp.leeftijd < 18 ? 'Je gaat met je vrienden naar de film en daarna patat halen. Even geen voetbal in je hoofd.' : 'Gezellig avondje uit met de selectie. De sfeer in de kleedkamer is top.'; if (sp.leeftijd >= 18){ ergernis(4); uitgaanKrant('uit'); } }
  } else if (soort === 'huiswerk'){
    mod('focus', 6); mod('fit', 6); S.week.huiswerk = true;
    const v = S.week.school; if (v && !v.klaar) haalFoutWeg(v);
    t = sp.ouders.boos ? 'Je zit de hele avond met je boeken. Je ouders zien het, en de onderwijscoach van de club ook: iedereen is tevreden.' : 'Je maakt al je huiswerk. Je bent goed voorbereid op school (één fout antwoord valt af).';
  } else if (soort === 'revalidatie'){
    mod('fit', 20);
    t = 'Revalidatie bij de fysio. Saai, maar nodig.';
  } else if (isVerhaalActiviteit(soort)) t = doeVerhaal(soort); // de keuzes van jouw startverhaal (speler/verhaal.js)
  w.gedaan = true; w.tekst.push(t);
  if (soort === 'uit' && sp.leeftijd >= 18 && rnd() < kroegKans()){ S.ev = kroegEvent(); S.fase = 'event'; return; }
  if (soort !== 'revalidatie'){
    const bod = maakBodEvent() || maakSponsorEvent();
    if (bod){ S.ev = bod; S.fase = 'event'; }
    else if (rnd() < .8){ S.ev = maakEvent(); if (S.ev) S.fase = 'event'; }
  }
}
