import { S, club, mod } from '../../core/state.js';
import { clamp, geldTxt, pick, rnd } from '../../core/utils.js';
import { thuisLand } from '../../data/landen.js';
import { krantMelding } from '../media/roddel.js';
import { pers } from '../speler/persoonlijkheid.js';
import { selectie } from '../competitie/spelers.js';
import { zetBand as teamBand } from '../team/kleedkamer.js';
import { modFans } from '../wedstrijd/fans-pers.js';
import { social } from './social.js';
import { kinderen } from './gezin.js';
import { ik, vr } from '../../core/geslacht.js';

/* ===================== Leven in het buitenland: taal, heimwee, gezin ===================== */
export const TAAL = {Spanje:'Spaans', 'Italië':'Italiaans', Frankrijk:'Frans', Portugal:'Portugees', Duitsland:'Duits', Engeland:'Engels', 'België':'Nederlands en Frans', Nederland:'Nederlands',
  Turkije:'Turks', 'Tsjechië':'Tsjechisch', Griekenland:'Grieks', Polen:'Pools', Denemarken:'Deens', Mexico:'Spaans', 'Verenigde Staten':'Engels', Noorwegen:'Noors', Zwitserland:'Duits en Frans'};
export const thuis = () => S.startLand || 'Nederland';
export const inBuitenland = () => !!(S.sp && S.sp.buitenland && S.sp.buitenland.land === thuisLand() && thuisLand() !== thuis());
const taal = () => (S.sp.talen || {})[thuisLand()] ?? 0;
const zetTaal = v => { const sp = S.sp; sp.talen = sp.talen || {}; sp.talen[thuisLand()] = clamp(v, 0, 100); };
export const taalNiveau = () => taal();
export const taalLabel = v => v < 30 ? 'Je verstaat bijna niets' : v < 60 ? 'Je redt je' : v < 85 ? 'Goed' : 'Vloeiend';
const heimwee = d => { const sp = S.sp; sp.heimwee = clamp((sp.heimwee || 0) + d, 0, 100); };
const kidsBijJou = () => (S.sp.relatie && S.sp.relatie.samen) ? kinderen().filter(k => S.jaar - k.jaar >= 4) : [];
// Teambonus omlaag als je de trainer en je teamgenoten (nog) niet verstaat
export function taalStraf(){ if (!inBuitenland()) return 0; const t = taal(); return t < 30 ? .5 : t < 60 ? .25 : 0; }
// Bij aankomst in een nieuw land (of terug naar huis)
export function startBuitenland(land){
  const sp = S.sp;
  if (land === thuis()){ if (sp.buitenland){ sp.buitenland = null; sp.heimwee = 0; return 'Terug thuis. Het eten, de taal, je familie om de hoek.'; } return null; }
  sp.talen = sp.talen || {};
  if (sp.talen[land] === undefined){
    const h = sp.herkomst || {}, ouder = h.vader === land || h.moeder === land;
    // (spreek je de taal al uit een ander land, zoals Spaans uit Spanje in Mexico, dan neem je dat mee)
    const zelfde = Object.keys(sp.talen).filter(l => l !== land && TAAL[l] && TAAL[l] === TAAL[land]).map(l => sp.talen[l]);
    sp.talen[land] = Math.max(ouder ? 60 : land === 'België' && thuis() === 'Nederland' ? 50 : land === 'Engeland' || land === 'Verenigde Staten' ? 35 : 5, ...zelfde, TAAL[land] && TAAL[land] === TAAL[thuis()] ? 100 : 0);
  }
  sp.buitenland = {land, sinds:S.jaar, weken:0, mijlpalen:{}};
  sp.heimwee = 30 + (pers('heimwee') ? 15 : 0);
  return `Je woont nu in ${land}. Jouw ${TAAL[land] || 'taal'}: ${taalLabel(sp.talen[land]).toLowerCase()}.${sp.talen[land] < 30 ? ' Dat wordt nog lastig: je mist veel van wat de trainer zegt.' : ' Dat scheelt een hoop.'}`;
}
// Elke week
export function buitenlandWeek(eerste){
  // Oude opslag: je woonde al in het buitenland (je spreekt de taal dan al een beetje)
  if (S.sp && !S.sp.buitenland && thuisLand() !== thuis() && !S.trainer){ startBuitenland(thuisLand()); S.sp.talen[thuisLand()] = Math.max(S.sp.talen[thuisLand()], 40); S.sp.heimwee = 25; }
  const sp = S.sp, B = sp.buitenland; if (!inBuitenland() || eerste || sp.clubloos || S.trainer) return;
  B.weken++;
  zetTaal(taal() + 1 + (B.weken <= 14 && taal() < 40 ? 1 : 0));
  let d = B.weken <= 20 ? 2 : -1; if (sp.relatie && sp.relatie.samen) d -= 1; if (kidsBijJou().length) d -= 1;
  if (d > 0 && pers('heimwee')) d *= 1.5; heimwee(d);
  if (sp.heimwee > 60) mod('moraal', -2);
  if (sp.heimwee > 80){ mod('focus', -2); S.week.tekst.push(`Je hebt last van heimwee. Je mist ${thuis()}.`); }
  const M = B.mijlpalen, T = TAAL[B.land] || 'de taal';
  if (taal() >= 40 && !M.t40){ M.t40 = true; S.week.tekst.push(`Je kunt je verstaanbaar maken in het ${T}. De uitleg van de trainer gaat je steeds beter af.`); }
  if (taal() >= 70 && !M.t70){ M.t70 = true; modFans(5); krantMelding(`${sp.naam} geeft ${ik.zijn} eerste interview in het ${T}`, `De fans van ${club().n} zijn trots: "${ik.Hij} hoort bij ons."`); S.week.tekst.push(`Je geeft je eerste interview in het ${T}. De fans zijn trots.`); }
  if (sp.heimwee < 20 && B.weken > 10 && !M.thuis){ M.thuis = true; S.week.tekst.push(`Je voelt je thuis in ${B.land}.`); }
}
// Eén actie per week (paneel in Privé)
export const BUITENLAND_ACTIES = {
  les:{n:'Taalles nemen', s:'Taal +6'},
  bellen:{n:'Videobellen met je familie', s:'Heimwee −8 · gratis'},
  huis:{n:'Een weekend naar huis vliegen', s:'Heimwee −25 · fitheid −8 · je mist een training (vertrouwen −2)'},
  stad:{n:'De stad ontdekken met teamgenoten', s:'Taal +2 · heimwee −5 · band met een teamgenoot +5'},
};
export const lesPrijs = () => clamp(Math.round(Math.max(150, S.sp.salaris * .01) / 10) * 10, 150, 2000);
export const vluchtPrijs = () => ({Mexico:1100, 'Verenigde Staten':900, Engeland:400, 'België':150, Duitsland:300, Frankrijk:350, Spanje:600, 'Italië':550, Portugal:700, Turkije:450, 'Tsjechië':300, Griekenland:450, Polen:300, Denemarken:250, Noorwegen:400, Zwitserland:350})[thuisLand()] ?? 500;
export const kanBuitenlandActie = () => inBuitenland() && S.week && !S.week.buitenlandActie && !S.sp.clubloos;
export function doeBuitenlandActie(id){
  const sp = S.sp, w = S.week; if (!kanBuitenlandActie()) return;
  const T = TAAL[thuisLand()] || 'de taal'; let t;
  if (id === 'les'){ const p = lesPrijs(); if (sp.geld < p){ w.tekst.push('Je hebt niet genoeg geld voor taalles.'); return; } sp.geld -= p; zetTaal(taal() + 6); t = `Je volgt een les ${T} (${geldTxt(p)}). Je leert de woorden die je op het veld nodig hebt.`; }
  else if (id === 'bellen'){ heimwee(-8); t = 'Je videobelt met je familie. Je moeder houdt de telefoon veel te dichtbij, maar het doet je goed.'; }
  else if (id === 'huis'){ const p = vluchtPrijs(); if (sp.geld < p){ w.tekst.push('Een vlucht naar huis is te duur.'); return; } sp.geld -= p; heimwee(-25); mod('fit', -8); mod('vert', -2); t = `Je vliegt een weekend naar ${thuis()} (${geldTxt(p)}). Even thuis. Maandag ben je moe, en de trainer merkt dat je een training miste.`; }
  else if (id === 'stad'){ zetTaal(taal() + 2); heimwee(-5); const x = pick(selectie(sp.club)); if (x) teamBand(x.n, 5); t = `${x ? x.n : 'Een teamgenoot'} laat je de stad zien: de beste koffie, de markt, het strand. Je leert ook wat woorden.`; }
  w.buitenlandActie = id; w.tekst.push(t);
}
// Gebeurtenissen (vanuit maakEvent)
export function buitenlandKans(){ if (!inBuitenland() || S.sp.clubloos || S.trainer) return 0; return S.sp.buitenland.weken <= 14 ? .18 : .08; }
export function buitenlandEvents(){
  if (!inBuitenland()) return [];
  const sp = S.sp, land = thuisLand(), T = TAAL[land] || 'de taal', t = taal(), tm = (pick(selectie(sp.club)) || {n:'een teamgenoot'}).n, uit = [];
  uit.push({soort:'prive', tekst:`In de kleedkamer maken je teamgenoten grappen in het ${T}. Iedereen lacht. Jij verstaat er niets van.`, opts:[
    {l:'Gewoon meelachen', f(){ zetTaal(taal() + 2); teamBand(tm, 3); return `Je lacht mee. ${tm} slaat je op je schouder en legt het later uit.`; }},
    {l:'Om uitleg vragen', f(){ zetTaal(taal() + 4); if (rnd() < .3){ mod('moraal', -1); return 'Ze leggen het uit... de grap ging over jou. Je moet er zelf ook om lachen. Een beetje.'; } return 'Ze leggen het geduldig uit. Je leert er meteen drie nieuwe woorden bij.'; }},
    {l:'Negeren', f(){ mod('moraal', -2); return 'Je doet alsof je het niet hoort. Je voelt je een buitenstaander.'; }}]});
  if (t < 50) uit.push({soort:'prive', tekst:`De trainer legt de tactiek uit in het ${T}. Je mist de helft.`, opts:[
    {l:'Nablijven met een tolk', f(){ mod('fit', -4); mod('vert', 3); zetTaal(taal() + 3); return 'Je blijft na de training met een tolk. De trainer waardeert je inzet.'; }},
    {l:`${tm} om hulp vragen`, f(){ teamBand(tm, 4); return `${tm} legt alles nog eens uit, met handen en voeten.`; }},
    {l:'Doen alsof je het snapt', f(){ if (rnd() < .4){ mod('vert', -4); return 'In de wedstrijd sta je op de verkeerde plek. De trainer kijkt je boos aan.'; } return 'Je kijkt goed naar de anderen en doet ze na. Het gaat net goed.'; }}]});
  uit.push({soort:'prive', tekst:`Een journalist stelt na de training een vraag in het ${T}.`, opts:[
    {l:`Antwoorden in het ${T}`, f(){ if (t >= 50){ mod('rep', 3); modFans(3); return 'Je antwoordt in het ' + T + '. De fans vinden het geweldig dat je de moeite neemt.'; } social().volgers = Math.round(social().volgers * 1.03 + 40); mod('rep', -1); return 'Je antwoord bevat een grappige fout. Het fragment gaat viraal. Iedereen lacht, jij ook maar een beetje.'; }},
    {l:'Via een tolk', f(){ return 'De tolk vertaalt netjes. Een saai, maar veilig antwoord.'; }},
    {l:'In het Engels', f(){ mod('rep', 1); return 'Je antwoordt in het Engels. Prima, maar de lokale fans hadden liever hun eigen taal gehoord.'; }}]});
  if ((sp.heimwee || 0) >= 40) uit.push({soort:'prive', tekst:pick([`Je moeder belt: oma is jarig. De hele familie is er, behalve jij.`, `Je mist het eten van thuis. Hier smaakt alles anders.`, `Je beste ${vr.vriend} uit ${thuis()} gaat trouwen. ${vr.Hij} hoopt dat je er bent.`]), opts:[
    {l:'Naar huis vliegen', f(){ const p = vluchtPrijs(); sp.geld = Math.max(0, sp.geld - p); heimwee(-30); mod('vert', -3); return `Je vliegt naar huis (${geldTxt(p)}). Het voelt goed, maar je mist wel een training.`; }},
    {l:'Videobellen', f(){ heimwee(-10); return 'Je videobelt. Het is niet hetzelfde, maar het helpt.'; }},
    {l:'Doorbijten', f(){ mod('moraal', -3); heimwee(5); return 'Je bijt door. Maar je ligt die avond lang wakker.'; }}]});
  const kids = kidsBijJou();
  if (kids.length){ const k = pick(kids); uit.push({soort:'prive', tekst:`${k.naam} heeft het moeilijk op de nieuwe school in ${land}. ${k.jongen ? 'Hij' : 'Ze'} spreekt de taal nog niet en voelt zich alleen.`, opts:[
    {l:'Naar een internationale school (€3.000)', f(){ sp.geld = Math.max(0, sp.geld - 3000); heimwee(-5); return `${k.naam} gaat naar de internationale school. Na een week heeft ${k.jongen ? 'hij' : 'ze'} al vriendjes.`; }},
    {l:'Thuis samen de taal oefenen', f(){ zetTaal(taal() + 3); mod('fit', -3); return `Elke avond oefen je met ${k.naam}. Jullie leren allebei snel.`; }},
    {l:'Geduld hebben', f(){ heimwee(5); return `Het duurt even. ${k.naam} huilt soms bij het slapengaan.`; }}]});
    if (S.sp.buitenland.weken > 20) uit.push({soort:'prive', tekst:`${k.naam} verbetert je uitspraak aan de ontbijttafel. ${k.jongen ? 'Hij' : 'Ze'} spreekt al beter ${T} dan jij!`, opts:[
      {l:'Lachen en leren', f(){ mod('moraal', 4); zetTaal(taal() + 2); return 'Je moet er hard om lachen. Thuis praten jullie nu vaak ' + T + '.'; }}]}); }
  else if (kinderen().length && !(sp.relatie && sp.relatie.samen)){ const k = pick(kinderen()); uit.push({soort:'prive', tekst:`Je mist ${k.naam}. ${k.jongen ? 'Hij' : 'Ze'} woont in ${thuis()}.`, opts:[
    {l:'Videobellen', f(){ heimwee(-8); return `${k.naam} laat trots een tekening zien. Jij hangt hem straks op.`; }},
    {l:'Een weekend naar huis vliegen', f(){ const p = vluchtPrijs(); sp.geld = Math.max(0, sp.geld - p); heimwee(-20); mod('vert', -2); return `Je vliegt naar huis en brengt een weekend door met ${k.naam}.`; }}]}); }
  if (sp.relatie && sp.relatie.samen){ const n = sp.relatie.naam; uit.push({soort:'prive', tekst:`${n} voelt zich eenzaam in ${land}. Jij hebt je team, maar ${n} kent hier bijna niemand.`, opts:[
    {l:'Samen op pad', f(){ sp.geld = Math.max(0, sp.geld - 300); sp.relatie.band = clamp(sp.relatie.band + 8, 0, 100); return `Jullie gaan een weekend samen weg. ${n} lacht weer.`; }},
    {l:`Een taalcursus voor ${n}`, f(){ sp.geld = Math.max(0, sp.geld - 400); sp.relatie.band = clamp(sp.relatie.band + 4, 0, 100); return `${n} gaat op taalcursus en leert daar nieuwe mensen kennen.`; }},
    {l:'"Het komt wel goed"', f(){ sp.relatie.band = clamp(sp.relatie.band - 8, 0, 100); return sp.relatie.band < 25 ? `${n} zegt niets meer. Het gaat niet goed tussen jullie.` : `${n} knikt, maar je ziet dat het niet goed gaat.`; }}]}); }
  uit.push({soort:'prive', tekst:`Je teamgenoten nemen je mee naar een lokaal feest in ${land}.`, opts:[
    {l:'Meegaan', f(){ zetTaal(taal() + 3); heimwee(-6); teamBand(tm, 3); return 'Muziek, eten, dansen. Je voelt je even een van hen.'; }},
    {l:'Thuisblijven en uitrusten', f(){ mod('fit', 4); return 'Je blijft thuis. Lekker rustig, maar je hoort later hoe leuk het was.'; }}]});
  if (S.sp.buitenland.weken > 14 && t >= 60) uit.push({soort:'prive', tekst:`Na de wedstrijd roepen de fans je naam, en jij bedankt ze in het ${T}.`, opts:[
    {l:'Genieten', f(){ mod('moraal', 6); modFans(3); heimwee(-5); return 'Het stadion juicht. Je bent een van hen geworden.'; }}]});
  return uit;
}
// Je partner en een overstap naar het buitenland
export function partnerKans(){
  const r = S.sp.relatie; if (!r) return 1;
  return clamp(.35 + (r.band || 50) / 200 + (r.getrouwd ? .1 : 0) + (r.samen ? .05 : 0) - (kinderen().length ? .1 : 0), .1, .9);
}
export function praatMetPartner(o){
  const r = S.sp.relatie; if (!r || o.partnerMee !== false || o.partnerGepraat) return;
  o.partnerGepraat = true;
  if (rnd() < .25 + (r.band || 50) / 250){ o.partnerMee = true; S.venster.melding = `Jullie praten de hele avond. ${r.naam} denkt erover na... en zegt dan: "Oké. We doen het samen."`; }
  else { r.band = clamp(r.band - 3, 0, 100); S.venster.melding = `${r.naam} blijft erbij: "Ik ga niet mee. Mijn leven is hier."`; }
}
export function blijfVoorPartner(o){
  const r = S.sp.relatie, V = S.venster; if (!r) return;
  V.bods = V.bods.filter(b => b !== o); r.band = clamp(r.band + 10, 0, 100);
  V.melding = `Je zegt nee tegen het buitenland. ${r.naam} is je dankbaar.`;
}
