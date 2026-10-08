import { S, mod } from '../../core/state.js';
import { clamp, pick, randInt, rnd, shuffle } from '../../core/utils.js';
import { MEIDEN } from '../../data/gegevens.js';
import { eindRelatie } from '../gebeurtenissen.js';
import { roddel } from '../media/roddel.js';
import { uitgaanKrant } from '../media/uitgaan-krant.js';
import { isProf } from './sponsors.js';
import { ergernis } from '../team/tucht.js';
import { focusBoost } from '../wedstrijd/momenten.js';

/* ===================== Liefde (vanaf 18) ===================== */
export const STAPPEN_PRIJS = 40, DATE_PRIJS = 50;
export const HOBBY = ['houdt van festivals', 'studeert geneeskunde', 'voetbalt zelf ook', 'werkt in een dierenasiel', 'kan heel goed koken', 'reist graag', 'is gek op films', 'zit op dansles', 'studeert rechten', 'heeft een eigen kapsalon'];
// Kans dat het klikt: beter humeur en bekender helpt een beetje, maar je keuze telt het meest
export const liefdeKans = basis => clamp(basis + (S.sp.moraal - 60) / 300 + Math.min(S.sp.rep, 60) / 400, .05, .9);
export function nieuweNaam(){ const sp = S.sp, ex = sp.exen || []; const vrij = MEIDEN.filter(m => !ex.includes(m)); return pick(vrij.length ? vrij : MEIDEN); }
// Stap 3: vragen of ze je vriendin wil zijn
export function vraagEvent(naam){
  return {soort:'prive', tekst:`De date met ${naam} was echt leuk. Bij het afscheid kijkt ze je even aan. Wat doe je?`, opts:[
    {l:`${naam} vragen of ze je vriendin wil zijn`, f(){ if (rnd() < .8){ S.sp.relatie = {naam, band:55, weken:0}; mod('moraal', 12); return `${naam} lacht en zegt ja! Je hebt een vriendin.`; } mod('moraal', -5); return `${naam} vindt het nog te snel. "Laten we eerst nog wat vaker afspreken." Probeer het later nog eens.`; }},
    {l:'Een tweede date voorstellen', f(){ if (rnd() < .65){ S.sp.relatie = {naam, band:50, weken:0}; mod('moraal', 10); return `Na de tweede date is het officieel: jij en ${naam} zijn samen.`; } return `${naam} heeft het druk en het verwatert een beetje. Jammer.`; }},
    {l:'Het bij vrienden houden', f(){ return `Jij en ${naam} blijven goede vrienden.`; }}]};
}
// Stap 2: waar ga je naartoe op de date?
export function dateEvent(naam, extra){
  const sp = S.sp, prof = isProf();
  const uitkomst = (p, goed, slecht) => { if (rnd() < liefdeKans(p + (extra || 0))){ mod('moraal', 4); S.volgEv = vraagEvent(naam); return goed; } mod('moraal', -3); return slecht; };
  return {soort:'prive', tekst:`${naam} wil wel met je afspreken! Waar neem je haar mee naartoe?`, opts:[
    {l:'Naar de bioscoop', f(){ sp.geld = Math.max(0, sp.geld - 25); return uitkomst(.55, 'Jullie lachen allebei op de verkeerde momenten. Het klikt!', 'De film is saai en jullie zeggen bijna niks tegen elkaar. Het klikt niet.'); }},
    {l:'Uit eten', f(){ sp.geld = Math.max(0, sp.geld - 60); return uitkomst(.62, 'Jullie praten uren door. Het restaurant gaat al dicht als jullie opstaan.', 'Je morst saus op je shirt en het gesprek komt niet echt op gang.'); }},
    {l:'Wandelen en een ijsje halen', f(){ sp.geld = Math.max(0, sp.geld - 5); return uitkomst(.55, 'Een simpele middag, maar het voelt goed. Jullie lopen veel te ver door.', 'Het begint te regenen en jullie schuilen zwijgend onder een afdakje.'); }},
    {l:'Ze mag komen kijken bij je wedstrijd', f(){ return uitkomst(.42 + (prof ? .15 : 0), `${naam} staat langs de lijn en vindt het geweldig. Na afloop gaan jullie samen nog wat drinken.`, `${naam} vindt voetbal toch niet zo leuk en vertrekt in de rust.`); }},
    {l:'Gamen bij jou thuis', f(){ return uitkomst(.25, `${naam} wint van je met FIFA en lacht je uit. Het klikt toch!`, `${naam} verveelt zich en gaat vroeg naar huis.`); }}]};
}
// Stap 1a: stappen in de stad
export function gaStappen(){
  const sp = S.sp, w = S.week; if (sp.leeftijd < 18 || sp.relatie || w.liefde || sp.geld < STAPPEN_PRIJS) return;
  sp.geld -= STAPPEN_PRIJS; w.liefde = true; mod('fit', -6); mod('moraal', 4);
  const naam = nieuweNaam(), bekend = isProf();
  // Soms ontmoet je die avond niemand
  if (rnd() < .2){ w.tekst.push('Je gaat stappen in de stad, maar het is rustig. Je danst met je vrienden en gaat om 1 uur naar huis.'); return; }
  S.ev = {soort:'prive', tekst:`In een café in de stad zie je ${naam} aan de bar staan. Ze kijkt even jouw kant op.${bekend ? ' Ze lijkt je te herkennen.' : ''}`, opts:[
    {l:'Gewoon vragen hoe ze heet', f(){ if (rnd() < liefdeKans(.55)){ S.volgEv = dateEvent(naam); return `Ze heet ${naam}. Jullie kletsen de hele avond en wisselen nummers uit.`; } return `${naam} is vriendelijk, maar ze is met vriendinnen en gaat weer verder.`; }},
    {l:'Een grap maken', f(){ if (rnd() < liefdeKans(.45)){ S.volgEv = dateEvent(naam, .05); return `${naam} moet hard lachen. Aan het eind van de avond heb je haar nummer.`; } mod('moraal', -2); return 'Je grap valt helemaal stil. Ongemakkelijk. Je vrienden lachen je uit.'; }},
    {l:'Een drankje aanbieden', f(){ sp.geld = Math.max(0, sp.geld - 10); if (rnd() < liefdeKans(.5)){ S.volgEv = dateEvent(naam); return `${naam} neemt het drankje aan en jullie raken aan de praat. Jullie wisselen nummers uit.`; } return `${naam} zegt "dankjewel" en loopt terug naar haar vriendinnen.`; }},
    {l:'Opscheppen over je voetbal', f(){ if (rnd() < liefdeKans(bekend ? .5 : .15)){ S.volgEv = dateEvent(naam); return bekend ? `${naam} weet wie je bent en vindt het stoer. Je krijgt haar nummer.` : `Tegen alle verwachtingen in werkt het. ${naam} geeft je haar nummer.`; } mod('rep', -1); return `${naam} vindt je een opschepper en draait zich om.`; }},
    {l:'Te verlegen, toch maar niet', f(){ return 'Je kijkt nog een paar keer haar kant op, maar je durft niet. Volgende keer beter.'; }}]};
  S.fase = 'event';
  ergernis(2); if (rnd() < .6) uitgaanKrant('uit');
}
// Stap 1b: datingapp
export function datingApp(){
  const sp = S.sp, w = S.week; if (sp.leeftijd < 18 || sp.relatie || w.liefde) return;
  w.liefde = true;
  const namen = shuffle(MEIDEN.filter(m => !(sp.exen || []).includes(m))).slice(0, 3), hob = shuffle(HOBBY), bekend = isProf();
  const profiel = (naam, i) => ({l:`${naam}, ${randInt(18, Math.max(19, Math.min(sp.leeftijd + 3, 30)))} · ${hob[i]}`, f(){
    if (rnd() < liefdeKans(.5 + (bekend ? .1 : 0))){ S.volgEv = dateEvent(naam); return bekend ? `Het is een match! ${naam} stuurt meteen: "Ben jij echt ${sp.naam}?!"` : `Het is een match! Jullie appen de hele week.`; }
    return pick([`Geen match met ${naam}. Ze heeft je niet teruggeliked.`, `Je stuurt ${naam} een berichtje, maar ze reageert niet.`]); }});
  S.ev = {soort:'prive', tekst:'Je maakt een profiel op een datingapp. Na een uurtje swipen blijven er drie profielen over die je leuk vindt. Wie like je?', opts:[
    ...namen.map(profiel),
    {l:'Toch maar niet, app verwijderen', f(){ return 'Je verwijdert de app weer. Niks voor jou.'; }}]};
  S.fase = 'event';
}
// Met je vriendin
export const cadeauPrijs = () => Math.max(50, Math.min(25000, Math.round(S.sp.salaris * .01 / 10) * 10));
export function relatieActie(id){
  const sp = S.sp, w = S.week, r = sp.relatie; if (!r || w.date) return; let t;
  if (id === 'weekend'){ if (sp.geld < 300) return; sp.geld -= 300; r.band = clamp(r.band + 15, 0, 100); mod('moraal', 6); mod('fit', -3); t = pick([`Een weekendje Ardennen met ${r.naam}: wandelen, open haard, geen telefoon.`, `Jij en ${r.naam} gaan een weekend naar Parijs. Ze wil per se op de foto bij de Eiffeltoren.`, `Een weekend aan zee met ${r.naam}. Jullie lachen de hele tijd.`]); }
  else if (id === 'cadeau'){ const p = cadeauPrijs(); if (sp.geld < p) return; sp.geld -= p; const goed = rnd() < .75; r.band = clamp(r.band + (goed ? 9 : 2), 0, 100); t = goed ? `Je geeft ${r.naam} een ${pick(['ketting', 'mooie tas', 'fotoboek van jullie samen', 'bos rozen met een kaartje'])}. Ze vliegt je om de nek.` : `Je geeft ${r.naam} een strijkijzer. "Eh... dankjewel?" Volgende keer beter.`; }
  else if (id === 'koken'){ r.band = clamp(r.band + 5, 0, 100); focusBoost(2); t = `Jullie koken samen pasta. Het is een rommeltje in de keuken, maar het smaakt heerlijk.`; }
  else if (id === 'familie'){ if (r.familie) return; r.familie = true; if (rnd() < .7){ r.band = clamp(r.band + 10, 0, 100); t = `Je ontmoet de ouders van ${r.naam}. Haar vader blijkt een groot fan van je club. Het klikt meteen.`; } else { r.band = clamp(r.band - 4, 0, 100); t = `Je ontmoet de ouders van ${r.naam}. Haar vader supportert voor jullie grootste rivaal. Ongemakkelijk etentje.`; } }
  else if (id === 'wedstrijd'){ r.band = clamp(r.band + 6, 0, 100); mod('moraal', 3); t = `${r.naam} komt kijken naar je wedstrijd en zit op de tribune met een sjaal van je club. Je speelt met een extra glimlach.`; w.liefSupport = true; }
  else if (id === 'date'){ return dateMetLief(); }
  if (!t) return; w.date = true; w.tekst.push(t);
}
export function dateMetLief(){
  const sp = S.sp, w = S.week, r = sp.relatie; if (!r || w.date || sp.geld < DATE_PRIJS) return;
  sp.geld -= DATE_PRIJS; w.date = true; r.band = clamp(r.band + 10, 0, 100); mod('moraal', 4); mod('focus', -2);
  w.tekst.push(pick([`Je gaat met ${r.naam} uit eten. Jullie hebben het heel gezellig.`, `Jij en ${r.naam} gaan een dagje naar het strand.`, `${r.naam} en jij koken samen. Nou ja, zij kookt, jij snijdt de uien.`, `Je neemt ${r.naam} mee naar de film. Ze valt halverwege in slaap op je schouder.`]));
}
export function uitElkaar(){
  const sp = S.sp; if (!sp.relatie) return;
  const naam = sp.relatie.naam, getrouwd = sp.relatie.getrouwd;
  S.week.tekst.push(eindRelatie(getrouwd ? `Je vraagt de scheiding aan. Het is een zware tijd.` : `Je maakt het uit met ${naam}. Het is even zwaar.`));
  roddel(`Het is uit tussen ${sp.naam} en ${naam}`, 'Volgens vrienden is het in goede harmonie gegaan.');
}
