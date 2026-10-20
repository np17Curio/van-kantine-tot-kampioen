import { S, club, mod, seizoenLabel } from '../../core/state.js';
import { clamp, geldTxt, randInt, rnd } from '../../core/utils.js';
import { ATTR, POS, weekFactor } from '../../data/gegevens.js';
import { krantMelding } from '../media/roddel.js';
import { ouders } from '../prive/familie.js';
import { social, volgersTxt } from '../prive/social.js';
import { isProf } from '../prive/sponsors.js';
import { iedereen } from '../team/kleedkamer.js';
import { plafond, verhoog } from '../week.js';
import { kalmData, onrust } from './kalmte.js';
import { statusPunten } from './status.js';
import { START } from './startverhaal.js';

/* ===================== Jouw verhaal ===================== */
// Elke start (wonderkind van 15, gewone 18-jarige, laatbloeier van 23) heeft eigen weekkeuzes en eigen gebeurtenissen,
// die passen bij die leeftijd en dat talent. Oude carrières zonder startverhaal krijgen er geen.
export const verhaalVan = sp => ['wonder', 'normaal', 'bewijs'].includes(sp.startVerhaal) ? sp.startVerhaal : null;
export const verhaalTitel = sp => { const v = verhaalVan(sp); return v ? Object.values(START).find(x => x.id === v).titel : null; };
const gehad = (sp, id) => (sp.beleefd || []).includes(id);
const beleef = (sp, id) => { (sp.beleefd = sp.beleefd || []).push(id); };
const betaal = (sp, x) => { const b = Math.max(0, Math.min(sp.geld, Math.round(x))); sp.geld -= b; return b; };
const bandOuders = d => { const o = ouders(); o.band = clamp(o.band + d, 0, 100); };
// De eigenschap waar voor jouw positie het meest te winnen valt
function zwakste(sp){
  const w = POS[sp.pos].w; let best = null;
  const winst = k => w[k] * (plafond() - sp.a[k]); // belang voor je positie keer de ruimte tot je plafond
  for (const k in w) if (sp.a[k] < plafond() && (best === null || winst(k) > winst(best))) best = k;
  return best;
}
const SPORTKUNDE = 10; // lessen tot het diploma

// ---------- weekkeuzes ----------
// {id, l (titel), s (wat het doet), als (mag het nu)}
export function verhaalActiviteiten(){
  const sp = S.sp, v = verhaalVan(sp); if (!v) return [];
  const prof = isProf();
  if (v === 'wonder') return [
    {id:'talentcoach', l:'Extra training bij de talentcoach', s:'Grote kans om je zwakste punt te verbeteren · fitheid −8', als:sp.leeftijd < 21 && !!zwakste(sp)},
    {id:'media', l:'Interview of vlog opnemen', s:'Reputatie +3 · meer volgers · focus −4 (de druk)', als:true},
    {id:'toekomst', l:'Met je ouders over je toekomst praten', s:'Moraal +6 · focus +5 · band met je ouders', als:sp.leeftijd < 18},
  ].filter(a => a.als);
  if (v === 'normaal') return [
    {id:'bijbaan', l:'Bijbaantje', s:'Geld €150 tot €250 · fitheid −6', als:!prof},
    {id:'derdehelft', l:'Derde helft met de selectie', s:'Band met de selectie · moraal +6 · fitheid −3', als:true},
    {id:'sportkunde', l:'Avondschool sportkunde', s:`Focus +3 · moraal +2 · les ${(sp.sportkunde || 0) + 1} van ${SPORTKUNDE} tot je diploma`, als:(sp.sportkunde || 0) < SPORTKUNDE},
  ].filter(a => a.als);
  return [
    {id:'fysio', l:'Extra uren bij de fysio', s:'€150 · fitheid +12 · je lichaam onderhouden', als:sp.geld >= 150},
    {id:'magazijn', l:'Bijbaan in het magazijn', s:'Geld €200 tot €300 · fitheid −8', als:!prof},
    {id:'mentor', l:'Jonge spelers helpen', s:'Band met de selectie · vertrouwen +3 · moraal +3', als:true},
  ].filter(a => a.als);
}
export const isVerhaalActiviteit = id => verhaalActiviteiten().some(a => a.id === id);
// Uitvoeren: geeft de tekst terug
export function doeVerhaal(id){
  const sp = S.sp;
  switch (id){
    case 'talentcoach': {
      mod('fit', -8);
      const k = zwakste(sp); if (!k) return 'De talentcoach kijkt je aan: "Op dit moment haal je alles uit je talent wat erin zit."';
      if (rnd() < .75 * weekFactor() + .1){ const voor = sp.a[k]; verhoog(k, rnd() < .35 ? 2 : 1); return `De talentcoach werkt een uur alleen met jou aan je ${ATTR[k].toLowerCase()}. "Zo'n talent zie je zelden." Je ${ATTR[k].toLowerCase()} gaat van ${voor} naar ${sp.a[k]}.`; }
      return `Een zware sessie met de talentcoach op je ${ATTR[k].toLowerCase()}. Je voelt dat het eraan komt, maar het klikt nog net niet.`;
    }
    case 'media': {
      const s = social(), erbij = Math.round(80 + sp.rep * 40 + randInt(0, 200)); s.volgers += erbij;
      mod('rep', 3); mod('focus', -4);
      return `Je neemt een vlog op over een dag uit het leven van een toptalent. ${volgersTxt(erbij)} nieuwe volgers. Leuk, maar al die aandacht maakt je ook onrustig.`;
    }
    case 'toekomst': {
      mod('moraal', 6); mod('focus', 5); bandOuders(6); kalmData().onrust = Math.max(0, kalmData().onrust - 6);
      return 'Aan de keukentafel praat je met je ouders over school, voetbal en wat je wilt. "Wat er ook gebeurt, wij staan achter je." Het lucht op.';
    }
    case 'bijbaan': {
      const g = randInt(150, 250); sp.geld += g; mod('fit', -6);
      return `Je werkt een paar avonden bij de supermarkt en bezorgt op zaterdagochtend pakketjes. Je verdient ${geldTxt(g)}.`;
    }
    case 'derdehelft': {
      iedereen(2); mod('moraal', 6); mod('fit', -3);
      return 'Na de training blijf je hangen in de spelershome. Bitterballen, verhalen van vroeger en een potje klaverjassen met de oudere jongens. Je hoort er echt bij.';
    }
    case 'sportkunde': {
      sp.sportkunde = (sp.sportkunde || 0) + 1; mod('focus', 3); mod('moraal', 2);
      if (sp.sportkunde >= SPORTKUNDE){ mod('moraal', 10); S.car.prijzen.push(`Diploma sportkunde (${seizoenLabel()})`); S.car.hist.push(`${seizoenLabel()}: diploma sportkunde gehaald naast het voetbal`);
        return 'Je laatste les op de avondschool. Je hebt je diploma sportkunde! Wat er ook gebeurt met het voetbal, je hebt een plan B.'; }
      return `Avondschool: je leert over trainingsleer en voeding (les ${sp.sportkunde} van ${SPORTKUNDE}). Je kijkt anders naar je eigen trainingen.`;
    }
    case 'fysio': {
      const b = betaal(sp, 150); mod('fit', 12);
      const groei = sp.a.cond < plafond() && rnd() < .25 * weekFactor(); if (groei) verhoog('cond', 1);
      return `Je betaalt ${geldTxt(b)} voor extra uren bij de fysio. Je lichaam is geen 18 meer en dat merk je. Je benen voelen weer fris${groei ? ', en je conditie gaat zelfs een punt omhoog' : ''}.`;
    }
    case 'magazijn': {
      const g = randInt(200, 300); sp.geld += g; mod('fit', -8);
      return `Drie ochtenden dozen sjouwen in het magazijn. Zwaar, maar de huur moet betaald worden. Je verdient ${geldTxt(g)}.`;
    }
    case 'mentor': {
      iedereen(3); mod('vert', 3); mod('moraal', 3);
      return 'Je neemt de jongste spelers apart en vertelt ze wat jij op hun leeftijd fout deed. De trainer ziet het en knikt.';
    }
  }
  return null;
}

// ---------- verhaalgebeurtenissen ----------
// Dezelfde vorm als in gebeurtenissen.js. Elk één keer (sp.beleefd).
export function verhaalEvents(){
  const sp = S.sp, v = verhaalVan(sp); if (!v) return [];
  const c = club() ? club().n : 'je club', eenmalig = (id, ev) => gehad(sp, id) ? null : {...ev, opts:ev.opts.map(o => ({...o, f(){ beleef(sp, id); return o.f.call(this); }}))};
  let l = [];
  if (v === 'wonder') l = [
    eenmalig('w-toernooi', {soort:'verhaal', tekst:'Een topclub nodigt je uit voor een internationaal jeugdtoernooi in Spanje. Je eigen club speelt die week ook.', opts:[
      {l:'Gaan: dit is je kans', f(){ mod('rep', 5); mod('moraal', 8); mod('fit', -10); mod('vert', -4); return 'Je speelt tegen jongens van de grootste clubs van Europa en scoort twee keer. Scouts schrijven je naam op. Je trainer thuis is minder blij.'; }},
      {l:'Trouw blijven aan je club', f(){ mod('vert', 8); statusPunten(4); mod('moraal', -2); return `Je zegt nee. De trainer van ${c} hoort ervan en zegt: "Dat vergeet ik niet."`; }}]}),
    eenmalig('w-schoenen', {soort:'verhaal', tekst:'Een sportmerk wil je een schoenencontract geven. Je bent 15. Je ouders twijfelen.', opts:[
      {l:'Tekenen', f(){ sp.geld += 750; mod('rep', 4); mod('focus', -5); return `Je krijgt ${geldTxt(750)}, gratis schoenen en een fotoshoot. Op school wil iedereen ineens je vriend zijn.`; }},
      {l:'Je ouders zeggen: eerst school', f(){ bandOuders(8); mod('focus', 4); mod('moraal', -3); return 'Je baalt, maar je ouders hebben een punt. "Als je echt zo goed bent, komen ze terug."'; }}]}),
    eenmalig('w-sterretje', {soort:'verhaal', tekst:'Op school noemen ze je "het sterretje". Een paar klasgenoten doen je na als je langsloopt.', opts:[
      {l:'Negeren', f(){ mod('moraal', -3); mod('focus', 2); return 'Je doet alsof je het niet hoort. Na een paar weken zijn ze het zat.'; }},
      {l:'Erover praten met je mentor', f(){ mod('moraal', 4); kalmData().onrust = Math.max(0, kalmData().onrust - 5); return 'Je mentor neemt het serieus. Het pesten stopt, en jij voelt je lichter.'; }},
      {l:'Een grapje terug maken', f(){ if (rnd() < .6){ mod('moraal', 6); return '"Sterretje heeft tenminste een contract," zeg je. De hele klas lacht, en het is klaar.'; } onrust(5, 'Ruzie op school'); mod('moraal', -4); return 'Het grapje valt verkeerd. Het wordt een ruzie op het schoolplein.'; }}]}),
    eenmalig('w-reportage', {soort:'verhaal', tekst:'Een sportprogramma wil een reportage over je maken: "Het nieuwe toptalent".', opts:[
      {l:'Meedoen', f(){ mod('rep', 5); mod('focus', -6); social().volgers += 1500; krantMelding(`"Het nieuwe toptalent": ${sp.naam} (${sp.leeftijd}) op tv`, `Een camera volgde ${sp.naam} een week lang op school, thuis en bij ${c}.`); return 'De reportage wordt goed bekeken. Iedereen kent je nu, en iedereen verwacht ook meer van je.'; }},
      {l:'Liever niet', f(){ mod('focus', 3); return 'Je wilt eerst gewoon voetballen. De makers vinden het jammer, je trainer vindt het verstandig.'; }}]}),
    eenmalig('w-eerste', {soort:'verhaal', tekst:'Je mag een keer meetrainen met het eerste elftal. Je bent de jongste op het veld, met afstand.', opts:[
      {l:'Vol gas: laat zien wat je kan', f(){ if (rnd() < .2){ sp.blessure = Math.max(sp.blessure, 1); return 'Je gaat er vol in, maar een oudere verdediger zet je hard neer. Je enkel is opgezwollen: een week rust.'; } mod('vert', 6); statusPunten(3); return 'Je draait twee keer een routinier dol. De trainer van het eerste kijkt even op.'; }},
      {l:'Rustig aan en goed kijken', f(){ mod('focus', 6); mod('vert', 2); return 'Je let op hoe de ouderen bewegen en praten. Je leert meer dan je dacht.'; }}]}),
    eenmalig('w-academie', {soort:'verhaal', als:sp.leeftijd < 18, tekst:'Een voetbalacademie in een andere stad wil je hebben: school en voetbal in één, maar je woont dan doordeweeks in een internaat.', opts:[
      {l:'Gaan', f(){ const k = zwakste(sp) || 'cond'; verhoog(k, 2); mod('moraal', -6); bandOuders(-6); return `Elke dag twee trainingen. Je ${ATTR[k].toLowerCase()} gaat met sprongen vooruit, maar 's avonds mis je je ouders.`; }},
      {l:'Thuis blijven', f(){ mod('moraal', 4); bandOuders(6); return 'Je blijft bij je ouders en je vrienden. Je moeder is opgelucht.'; }}]}),
  ];
  if (v === 'normaal') l = [
    eenmalig('n-baas', {soort:'verhaal', als:!isProf(), tekst:'Je baas van je bijbaan vraagt of je zaterdag kunt werken. Precies op de wedstrijddag.', opts:[
      {l:'Werken: je hebt het geld nodig', f(){ sp.geld += 120; mod('vert', -6); return 'Je verdient wat extra, maar de trainer vraagt waarom je er niet was.'; }},
      {l:'Voetballen gaat voor', f(){ if (rnd() < .4){ mod('moraal', -3); return 'Je baas is boos en zoekt iemand anders. Die bijbaan ben je kwijt, maar je voetbalt wel.'; } mod('vert', 2); return 'Je baas mopperde wat, maar je mag blijven. En jij speelt gewoon.'; }}]}),
    eenmalig('n-vakantie', {soort:'verhaal', tekst:'Je vrienden gaan een week naar Spanje. Midden in het seizoen.', opts:[
      {l:'Mee!', f(){ const b = betaal(sp, 350); mod('moraal', 12); mod('fit', -15); mod('vert', -5); return `Zon, strand en veel te weinig slaap. Het kost je ${geldTxt(b)} en je komt bruin, maar kapot terug.`; }},
      {l:'Thuisblijven en trainen', f(){ mod('moraal', -4); mod('vert', 3); return 'Je ziet de foto\'s voorbijkomen. Balen, maar de trainer merkt dat je er staat.'; }}]}),
    eenmalig('n-oudespits', {soort:'verhaal', tekst:'De oude spits van de club (35) neemt je na de training apart. "Ik zie mezelf in jou. Zal ik je wat trucjes leren?"', opts:[
      {l:'Graag', f(){ const k = Object.keys(POS[sp.pos].w).sort((a, b) => POS[sp.pos].w[b] - POS[sp.pos].w[a])[0]; verhoog(k, 1); mod('vert', 3); return `Weken lang blijft hij na de training met je oefenen. Je ${ATTR[k].toLowerCase()} gaat vooruit.`; }},
      {l:'Je gaat liever je eigen weg', f(){ mod('focus', 2); return 'Hij haalt zijn schouders op. "Zoals je wilt, jongen."'; }}]}),
    eenmalig('n-studie', {soort:'verhaal', tekst:'Je moet kiezen: een hbo-opleiding naast het voetbal, of vol voor het voetbal gaan.', opts:[
      {l:'Studeren naast het voetbal', f(){ mod('focus', -4); mod('moraal', 4); bandOuders(6); sp.sportkunde = Math.max(sp.sportkunde || 0, 3); return 'Je ouders zijn blij met je plan B. Het wordt wel puzzelen met je tijd.'; }},
      {l:'Vol voor het voetbal', f(){ mod('fit', 6); mod('vert', 4); mod('moraal', 2); return 'Je zet alles op één kaart. Extra trainingen, op tijd naar bed.'; }}]}),
    eenmalig('n-sponsorbaan', {soort:'verhaal', als:!isProf(), tekst:'De eigenaar van een installatiebedrijf, sponsor van de club, biedt je een parttime baan aan.', opts:[
      {l:'Aannemen', f(){ sp.salaris += 2500; mod('fit', -4); return `Je werkt twee dagen per week bij hem. Het levert ${geldTxt(2500)} per jaar extra op, en hij komt elke zondag kijken.`; }},
      {l:'Bedanken', f(){ mod('focus', 3); return 'Je wilt je tijd aan voetbal besteden. Hij begrijpt het en blijft gewoon sponsor.'; }}]}),
    eenmalig('n-derby', {soort:'verhaal', tekst:'Je eerste derby bij de senioren komt eraan. De aanvoerder zegt: "Ze gaan je uitlokken. Laat je niet gek maken."', opts:[
      {l:'Rustig blijven, dat is het plan', f(){ kalmData().onrust = Math.max(0, kalmData().onrust - 8); mod('focus', 3); return 'Je neemt het je voor. Wat ze ook roepen, jij blijft koel.'; }},
      {l:'"Ik pak ze terug op het veld"', f(){ mod('moraal', 5); onrust(4, 'Spanning voor de derby'); return 'Je hebt er zin in. Misschien iets te veel zin.'; }}]}),
  ];
  if (v === 'bewijs') l = [
    eenmalig('b-oudtrainer', {soort:'verhaal', tekst:'Je oude jeugdtrainer, die je op je 17e wegstuurde, belt je op. "Ik heb je zien spelen. Petje af."', opts:[
      {l:'Het uitpraten', f(){ mod('moraal', 6); kalmData().onrust = Math.max(0, kalmData().onrust - 6); return 'Jullie praten een uur. Hij zegt dat hij het destijds verkeerd zag. Er valt een last van je af.'; }},
      {l:'Kort: "Dank je."', f(){ mod('focus', 5); mod('vert', 2); return 'Je hangt op. Het voelt goed. Je bent gedrevener dan ooit.'; }}]}),
    eenmalig('b-echtebaan', {soort:'verhaal', tekst:'Op een verjaardag vraagt je oom of je niet eens een "echte baan" moet zoeken. "Je wordt ook niet jonger."', opts:[
      {l:'Doorzetten: dit is je droom', f(){ mod('focus', 4); mod('vert', 3); return 'Je glimlacht. "Kom maar eens kijken." Hij komt kijken, en hij is stil.'; }},
      {l:'Toch gaan twijfelen', f(){ mod('moraal', -6); mod('focus', -3); return 'Die nacht lig je wakker. Misschien heeft hij gelijk?'; }}]}),
    eenmalig('b-concurrent', {soort:'verhaal', tekst:'De club haalt een 19-jarige op jouw positie. Snel, brutaal, en de trainer is enthousiast.', opts:[
      {l:'Hem helpen', f(){ iedereen(3); mod('vert', 4); return 'Je neemt hem onder je hoede. De trainer ziet het: "Dat is een leider."'; }},
      {l:'Keihard concurreren', f(){ mod('vert', 5); onrust(5, 'Concurrentie om je plek'); return 'Op elke training ga je er vol in. Hij leert snel wie er de baas is, maar het kost je rust.'; }}]}),
    eenmalig('b-lichaam', {soort:'verhaal', tekst:'Na een zware week voelt je hamstring stijf. Je bent 23, niet 18 meer.', opts:[
      {l:'Een extra fysiosessie betalen', f(){ const b = betaal(sp, 120); mod('fit', 10); return `Je betaalt ${geldTxt(b)}. De fysio vindt een knoop en masseert hem eruit. Op tijd.`; }},
      {l:'Doorspelen', f(){ if (rnd() < .35){ sp.blessure = Math.max(sp.blessure, randInt(1, 2)); return 'In de training schiet het erin. Hamstring. Je ligt er even uit.'; } mod('vert', 2); return 'Het houdt. Deze keer.'; }}]}),
    eenmalig('b-o11', {soort:'verhaal', tekst:'De club vraagt of je de O11 wilt trainen. Twee avonden per week, met een kleine vergoeding.', opts:[
      {l:'Ja, leuk', f(){ sp.geld += 300; mod('moraal', 6); mod('fit', -4); iedereen(1); return `De kinderen kijken tegen je op. Je verdient ${geldTxt(300)} en krijgt er veel energie van.`; }},
      {l:'Nee, ik focus op mezelf', f(){ mod('focus', 3); return 'Je hebt je tijd nodig voor je eigen kansen.'; }}]}),
    eenmalig('b-laatbloeier', {soort:'verhaal', tekst:'Een journalist wil een stuk schrijven over laatbloeiers, met jou als voorbeeld.', opts:[
      {l:'Interview geven', f(){ mod('rep', 4); krantMelding(`Laatbloeier ${sp.naam}: "Ik heb nooit opgegeven"`, `Op zijn 17e weggestuurd, op zijn ${sp.leeftijd}e bij ${c}. "Ik wil laten zien dat het nooit te laat is."`); return 'Het stuk wordt veel gedeeld. Mensen sturen je berichten: "Jij geeft mij moed."'; }},
      {l:'Focus op het voetbal', f(){ mod('focus', 4); return 'Eerst presteren, dan praten.'; }}]}),
  ];
  return l.filter(e => e && e.als !== false);
}
