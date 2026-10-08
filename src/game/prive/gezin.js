import { S, mod, seizoenLabel } from '../../core/state.js';
import { clamp, geldTxt, pick, rnd, shuffle } from '../../core/utils.js';
import { AANTAL_RONDES } from '../../data/gegevens.js';
import { eindRelatie } from '../gebeurtenissen.js';
import { roddel } from '../media/roddel.js';
import { woning } from './wonen-auto.js';
import { kans } from '../wedstrijd/momenten.js';

/* ===================== Samen verder: samenwonen, verloven, trouwen, kinderen ===================== */
export const JONGENS = ['Sem', 'Noah', 'Liam', 'Luuk', 'Finn', 'Milan', 'Levi', 'Adam', 'Mees', 'Jesse', 'Bram', 'Ayoub'];
export const MEISJES = ['Emma', 'Julia', 'Tess', 'Sophie', 'Nora', 'Saar', 'Liv', 'Fenna', 'Nina', 'Amira', 'Isa', 'Evi'];
export const kinderen = () => S.sp.kinderen || (S.sp.kinderen = []);
export const kindLeeftijd = k => Math.max(0, S.jaar - k.jaar);
// Wat kan er nu? Elke stap heeft eisen, zodat het niet allemaal in een paar weken gebeurt
export function relatieEisen(){
  const sp = S.sp, r = sp.relatie; if (!r) return {};
  const eigen = woning().prijs > 0;
  return {
    samen: r.samen ? null : r.weken < 10 ? `Samenwonen kan als jullie 10 weken samen zijn (nu ${r.weken}).` : r.band < 50 ? 'Samenwonen: het moet eerst beter gaan tussen jullie.' : '',
    aanzoek: r.verloofd || r.getrouwd ? null : r.weken < 20 ? `Een aanzoek kan na 20 weken samen (nu ${r.weken}).` : r.band < 60 ? 'Aanzoek: het moet eerst nog beter gaan tussen jullie.' : '',
    trouwen: !r.verloofd || r.getrouwd ? null : r.weken - (r.verloofdOp || 0) < 6 ? `Een bruiloft regel je niet zomaar: nog ${6 - (r.weken - (r.verloofdOp || 0))} weken voorbereiden.` : '',
    kind: r.zwanger ? null : kinderen().length >= 4 ? null : !r.samen ? 'Kinderen: eerst samenwonen.' : sp.leeftijd < 21 ? 'Kinderen: daar zijn jullie nog wat jong voor (vanaf 21).' : r.band < 55 ? 'Kinderen: het moet eerst beter gaan tussen jullie.' : r.babyRust > 0 ? 'Jullie willen eerst even genieten van de kleine.' : '',
    eigen
  };
}
export function samenwonen(){
  const sp = S.sp, r = sp.relatie, e = relatieEisen(); if (!r || e.samen !== '') return;
  r.samen = true; r.band = clamp(r.band + 10, 0, 100); mod('moraal', 8);
  let t;
  if (e.eigen) t = `${r.naam} trekt bij je in. Haar spullen staan binnen een dag overal.`;
  else { sp.woning = 'huurhuis'; t = `Jij en ${r.naam} huren samen een huis (€120 per week). Eindelijk een eigen plek voor jullie twee.`; }
  S.week.tekst.push(t); S.car.hist.push(`${seizoenLabel()}: samenwonen met ${r.naam}`);
  roddel(`${sp.naam} en ${r.naam} gaan samenwonen`, 'Het stel is gespot bij een woonwinkel. "Ze zijn heel verliefd," zegt een verkoper.');
}
export const RING = () => Math.max(1500, Math.min(50000, Math.round(S.sp.salaris * .05 / 100) * 100));
export function aanzoek(){
  const sp = S.sp, r = sp.relatie, e = relatieEisen(); if (!r || e.aanzoek !== '' || sp.geld < RING()) return;
  sp.geld -= RING();
  const kans = b => clamp(.35 + (r.band - 50) / 60 + b, .1, .95);
  const uitkomst = (b, ja) => () => {
    if (rnd() < kans(b)){ r.verloofd = true; r.verloofdOp = r.weken; r.band = clamp(r.band + 15, 0, 100); mod('moraal', 15); S.car.hist.push(`${seizoenLabel()}: verloofd met ${r.naam}`);
      roddel(`${sp.naam} verloofd met ${r.naam}!`, 'Een fan maakte een foto van het moment. Binnen een uur stond hij overal online.');
      return `${ja} ${r.naam} zegt JA! Jullie zijn verloofd.`; }
    r.band = clamp(r.band - 15, 0, 100); mod('moraal', -12); sp.geld += Math.round(RING() * .5);
    return `${r.naam} schrikt. "Ik vind het nog te vroeg." Ongemakkelijk... De ring breng je terug (je krijgt de helft terug).`;
  };
  S.ev = {soort:'prive', tekst:`Je hebt een ring gekocht (${geldTxt(RING())}). Hoe vraag je ${r.naam} ten huwelijk?`, opts:[
    {l:'Op één knie op het voetbalveld', f: uitkomst(.05, 'Na de training, in de middencirkel. Je teamgenoten kijken stiekem vanaf de tribune.')},
    {l:'Tijdens een romantisch diner', f: uitkomst(.05, 'Bij het toetje zak je door je knieën. Het hele restaurant valt stil.')},
    {l:'Op het strand bij zonsondergang', f: uitkomst(.1, 'De zon gaat onder, de golven ruisen. Perfect.')},
    {l:'De ring in haar ijsje verstoppen', f: uitkomst(-.1, 'Ze slikt hem bijna in, maar vindt hem net op tijd.')}]};
  S.fase = 'event';
}
export function trouwen(){
  const sp = S.sp, r = sp.relatie, e = relatieEisen(); if (!r || e.trouwen !== '') return;
  const bruiloft = (prijs, tekst, extra) => () => { if (sp.geld < prijs) return `Daar heb je niet genoeg geld voor (${geldTxt(prijs)}). Jullie stellen de bruiloft nog even uit.`;
    sp.geld -= prijs; r.getrouwd = true; r.verloofd = false; r.band = clamp(r.band + 15, 0, 100); mod('moraal', 18); mod('fit', -5); if (extra) extra();
    S.car.hist.push(`${seizoenLabel()}: getrouwd met ${r.naam}`); S.car.prijzen.push(`Getrouwd met ${r.naam}`);
    roddel(`${sp.naam} en ${r.naam} zijn getrouwd`, prijs >= 200000 ? 'Een sprookjesbruiloft in Italië. De halve selectie was erbij.' : 'Een mooie dag, met veel familie en vrienden.');
    return tekst; };
  S.ev = {soort:'prive', tekst:`De grote dag komt eraan! Wat voor bruiloft willen jij en ${r.naam}?`, opts:[
    {l:`Klein, met familie (${geldTxt(5000)})`, f: bruiloft(5000, `Een kleine, warme bruiloft. Je opa houdt een speech en iedereen huilt. Jij en ${r.naam} zijn getrouwd!`)},
    {l:`Groot feest met het hele team (${geldTxt(30000)})`, f: bruiloft(30000, `Wat een feest! Je teamgenoten zingen een clublied op de dansvloer. Jij en ${r.naam} zijn getrouwd!`, () => mod('vert', 3))},
    {l:`Sprookjeshuwelijk in Italië (${geldTxt(250000)})`, f: bruiloft(250000, `Een kasteel in Toscane, een orkest en vuurwerk. Jij en ${r.naam} zijn getrouwd!`, () => mod('rep', 4))},
    {l:'Toch nog even wachten', f(){ return 'Jullie stellen het nog even uit. Geen haast.'; }}]};
  S.fase = 'event';
}
export function overKinderen(){
  const sp = S.sp, r = sp.relatie, e = relatieEisen(); if (!r || e.kind !== '') return;
  S.ev = {soort:'prive', tekst:`Op een avond op de bank begint ${r.naam} erover: "Zouden wij niet een kindje willen?"`, opts:[
    {l:'Ja, dat willen we!', f(){ if (rnd() < clamp(.55 + (r.band - 55) / 80, .3, .9)){ r.zwanger = AANTAL_RONDES; mod('moraal', 10); return `Een paar weken later laat ${r.naam} je een test zien: ze is zwanger! Over ongeveer ${AANTAL_RONDES} weken is het zover.`; } return 'Jullie willen het allebei. Het lukt alleen nog niet meteen. Volgende keer misschien.'; }},
    {l:'Liever nog even wachten', f(){ r.band = clamp(r.band - 4, 0, 100); return `${r.naam} snapt het, maar je ziet dat ze het jammer vindt.`; }}]};
  S.fase = 'event';
}
export function geefNaam(naam){
  const sp = S.sp, g = sp.geboorte; if (!g) return;
  kinderen().push({naam, jongen:g.jongen, jaar:S.jaar}); sp.geboorte = null;
  if (sp.relatie){ sp.relatie.babyRust = 10; sp.relatie.band = clamp(sp.relatie.band + 10, 0, 100); }
  sp.slaap = 6; mod('moraal', 20); mod('rep', 2);
  S.car.hist.push(`${seizoenLabel()}: ${g.jongen ? 'zoon' : 'dochter'} ${naam} geboren`);
  S.week.tekst.push(`Welkom op de wereld, ${naam}! Je bent ${kinderen().length === 1 ? 'vader' : 'weer vader'}. Een paar weken slaap je wat minder, maar je bent de gelukkigste man van de wereld.`);
  roddel(`${sp.naam} ${kinderen().length === 1 ? 'voor het eerst ' : 'weer '}vader`, `Een ${g.jongen ? 'zoon' : 'dochter'}, ${naam}. "Misschien wordt ${g.jongen ? 'hij' : 'zij'} ook voetballer," grapt de trotse vader.`);
}
// Elke week: band zakt langzaam als je niks samen doet, zwangerschap telt af, baby houdt je wakker
export function relatieWeek(eerste){
  const sp = S.sp, r = sp.relatie;
  if (sp.slaap > 0 && !eerste){ sp.slaap--; mod('fit', -4); if (rnd() < .4) S.week.tekst.push(pick(['De baby heeft de hele nacht gehuild. Je gaapt op de training.', 'Om 4 uur een fles geven, om 7 uur naar de training. Zwaar, maar mooi.'])); }
  // Zwanger van je ex: het kindje komt gewoon
  if (sp.exZw && !eerste){ sp.exZw.weken--; if (sp.exZw.weken <= 0){ const jongen = rnd() < .5; sp.geboorte = {jongen, opties:shuffle((jongen ? JONGENS : MEISJES).filter(n => n !== sp.naam && n !== sp.exZw.naam && !kinderen().some(k => k.naam === n))).slice(0, 4)}; S.week.tekst.push(`${sp.exZw.naam} is bevallen van een gezonde ${jongen ? 'zoon' : 'dochter'}. Je bent erbij.`); sp.exZw = null; } }
  if (!r || eerste) return;
  if (r.babyRust > 0) r.babyRust--;
  if (r.weken > 0 && r.weken % 52 === 0 && !eerste){ const jaar = r.weken / 52; S.ev = {soort:'prive', tekst:`Jij en ${r.naam} zijn vandaag ${jaar} ${jaar === 1 ? 'jaar' : 'jaar'} samen! Hoe vier je het?`, opts:[
    {l:'Een romantisch diner (€150)', f(){ sp.geld = Math.max(0, sp.geld - 150); r.band = clamp(r.band + 12, 0, 100); mod('moraal', 5); return 'Kaarslicht, een goed glas en jullie praten over het eerste jaar. Wat een avond.'; }},
    {l:'Een zelfgemaakt fotoboek geven', f(){ r.band = clamp(r.band + 10, 0, 100); return `${r.naam} krijgt tranen in haar ogen als ze de foto's ziet.`; }},
    {l:'Vergeten...', f(){ r.band = clamp(r.band - 20, 0, 100); mod('moraal', -5); return `Je bent het vergeten. ${r.naam} niet. Het blijft de hele avond stil.`; }}]}; S.wachtEv = S.ev; S.ev = null; }
  r.band = clamp(r.band - (r.weken > 4 ? 1 : 0), 0, 100);
  if (r.zwanger > 0){ r.zwanger--; if (r.zwanger === 0){ const jongen = rnd() < .5; sp.geboorte = {jongen, opties:shuffle((jongen ? JONGENS : MEISJES).filter(n => n !== sp.naam && n !== r.naam && !kinderen().some(k => k.naam === n))).slice(0, 4)}; S.week.tekst.push(`Het is zover! ${r.naam} bevalt van een gezonde ${jongen ? 'zoon' : 'dochter'}.`); } }
  if (r.band <= 0){ S.week.tekst.push(eindRelatie(`${r.naam} is er klaar mee. Ze maakt het uit.`)); }
}
// Uit elkaar: getrouwd betekent scheiden (ze krijgt de helft van je spaargeld)
export function scheidingKosten(){ const sp = S.sp; if (!sp.relatie || !sp.relatie.getrouwd) return 0; return Math.round(sp.geld * .5); }
