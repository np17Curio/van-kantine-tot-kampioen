import { S, club, mod } from '../../core/state.js';
import { clamp, geldTxt, pick } from '../../core/utils.js';
import { CLUBS } from '../../data/gegevens.js';
import { ik, pa, team, vr } from '../../core/geslacht.js';
import { ouders } from '../prive/familie.js';
import { modFans } from '../wedstrijd/fans-pers.js';
import { iedereen, zetBand as kleedBand } from '../team/kleedkamer.js';
import { selectie } from '../competitie/spelers.js';
import { bijJou, opaNaam, zetBand, zetRivaalBand } from './journey.js';

/* ===================== Hoogtepunten: de grote momenten van je carrière, met de mensen om je heen ===================== */
// Bij een hoogtepunt (je debuut, je eerste goal, een transfer, een prijs…) kies je met wie je het viert of deelt: je ouders,
// je partner, je jeugdvriend, opa of je teamgenoten. Dat verandert je band met die persoon en je moraal.
// hoogtepunt(id, data) zet het moment in de wachtrij (S.hoogWacht); aan het begin van de volgende week verschijnt het als
// bericht met keuzes (hoogtepuntWeek, via S.wachtEv). Eén per week: de rest volgt in de weken daarna.

const kap = t => t ? t[0].toUpperCase() + t.slice(1) : t;
const ouderBand = d => { const o = ouders(); o.band = clamp((o.band ?? 70) + d, 0, 100); };
const partnerBand = d => { const r = S.sp.relatie; if (r) r.band = clamp(r.band + d, 0, 100); };
// Een teamgenoot met een naam (niet je vriend of je rivaal)
function teamgenoot(){
  const sp = S.sp; if (sp.clubloos || sp.club == null || !CLUBS[sp.club]) return null;
  let l = []; try { l = selectie(sp.club).filter(x => !x.vriend && !x.rivaal && x.n !== sp.naam); } catch (e){}
  return l.length ? pick(l.slice(0, 11)) : null;
}
// Wie is er nu, in je leven? (alleen wie er echt is: geen partner, of je vriend is je rivaal geworden, dan valt die keuze weg)
function mensen(){
  const sp = S.sp, v = sp.vriend, R = sp.rivaal, m = {ouders:true};
  if (sp.relatie) m.partner = sp.relatie.naam;
  if (v && !v.weg) m.vriend = v.voornaam;
  else if (v && v.weg && R && R.exVriend) m.exVriend = v.voornaam;
  if (sp.opa && !sp.opa.weg) m.opa = kap(opaNaam());
  const tg = teamgenoot(); if (tg) m.team = tg;
  return m;
}

// ---------- de keuzes per persoon: t(d) is het moment in een paar woorden ("je debuut") ----------
// Elk geeft {l, toon, f}. o: het moment (de extra teksten per persoon: o.ouders, o.partner …)
const KEUZE = {
  ouders:(o, d, m) => ({wie:'ouders', toon:'kalm', l:o.oudersL ? o.oudersL(d) : 'Je ouders bellen', f(){ ouderBand(6); mod('moraal', 3);
    return o.ouders ? o.ouders(d) : `Je moeder neemt op voordat de telefoon één keer is overgegaan. "We hebben alles gezien!" Je vader pakt de telefoon over: "Trots op je, ${ik.jongen}." Even ben je weer tien.`; }}),
  partner:(o, d, m) => ({wie:'partner', toon:'kalm', l:o.partnerL ? o.partnerL(d, m.partner) : `Uit eten met ${m.partner}`, f(){ partnerBand(7); mod('moraal', 3); S.sp.geld = Math.max(0, S.sp.geld - 120);
    return o.partner ? o.partner(d, m.partner) : `${m.partner} heeft een tafel gereserveerd bij jullie favoriete restaurant. "Op ${o.wat(d)}," zegt ${pa.ze}, en jullie proosten. Je telefoon blijft de hele avond in je zak.`; }}),
  vriend:(o, d, m) => ({wie:'vriend', toon:'bal', l:o.vriendL ? o.vriendL(d, m.vriend) : `${m.vriend} bellen`, f(){ zetBand(7); mod('moraal', 2);
    return o.vriend ? o.vriend(d, m.vriend) : `${m.vriend} neemt meteen op en schreeuwt zo hard dat je de telefoon van je oor moet houden. "Ik zei het toch! Al sinds we tien waren!" Jullie praten een uur over vroeger.`; }}),
  exVriend:(o, d, m) => ({wie:'exVriend', toon:'kalm', l:`Het berichtje van ${m.exVriend} beantwoorden`, f(){ zetRivaalBand(10); mod('moraal', 1);
    return `Er staat een berichtje van ${m.exVriend} op je telefoon: "Gefeliciteerd met ${o.wat(d)}. Echt." Je kijkt er een tijdje naar en stuurt dan terug: "Dank je. Dat betekent wat." Misschien is het ijs een beetje gebroken.`; }}),
  opa:(o, d, m) => ({wie:'opa', toon:'kalm', l:`Langs bij ${m.opa}`, f(){ mod('moraal', 4); mod('focus', 3);
    return o.opa ? o.opa(d, m.opa) : `${m.opa} zit in zijn stoel, de tv staat nog aan. "Ik heb het gezien," zegt hij, en hij knijpt in je hand. "Veertig jaar geleden droomde ik daarvan. Jij doet het gewoon."`; }}),
  team:(o, d, m) => ({wie:'team', toon:'fel', l:o.teamL ? o.teamL(d) : 'Met de groep de stad in', f(){ iedereen(2); if (m.team) kleedBand(m.team.n, 4); mod('moraal', 5); mod('fit', -6);
    return o.team ? o.team(d, m.team) : `Het wordt laat. ${m.team ? `${m.team.n} staat om twee uur 's nachts op een tafel te zingen` : 'De halve selectie staat om twee uur op een tafel te zingen'}, en jij zingt mee. De volgende ochtend op de training ben je kapot, maar de groep is een stukje hechter.`; }}),
  fans:(o, d, m) => ({wie:'fans', toon:'fel', l:o.fansL ? o.fansL(d) : 'Naar het vak van de fans', f(){ modFans(3); mod('rep', 1); mod('moraal', 3);
    return o.fans ? o.fans(d) : `Je rent naar het vak achter de goal en springt tegen het hek. De fans zingen je naam. Op social media gaat het filmpje rond.`; }}),
};

// ---------- de hoogtepunten ----------
// titel, tekst(d), wat(d) ("je debuut"), volgorde: wie het eerst in aanmerking komt (de eerste twee die er zijn),
// sociaal: de derde keuze (team of fans), en per persoon eventueel een eigen tekst
const nr = n => `${n}e`;
const HOOG = {
  debuut:{titel:'Je debuut', wat:() => 'je debuut',
    tekst:d => `Je hebt je debuut gemaakt in het eerste elftal van ${d.club}${d.zij ? `, tegen ${d.zij}` : ''}! In de kleedkamer klapt de trainer je op je schouder: "Welkom bij de groep." Op je telefoon staan al tientallen berichtjes. Met wie deel je dit moment?`,
    volgorde:['ouders', 'partner', 'vriend', 'exVriend', 'opa'], sociaal:'team',
    ouders:() => `Je ouders zaten op de tribune. Je moeder heeft het hele vak verteld dat jij haar ${ik.zoon} bent, en je vader heeft het wedstrijdprogramma gekocht, drie keer. Jullie eten samen patat bij de snackbar naast het stadion, net als vroeger na de jeugdwedstrijden.`,
    vriend:(d, n) => bijJou() ? `${n} wacht je op bij de spelersbus. "Eindelijk, ${ik.knul}. Nu wij samen, in het eerste." Jullie maken een selfie in het lege stadion.` : `${n} heeft de hele wedstrijd gekeken. "Ik zei het toch! Ooit spelen we tegen elkaar, in een vol stadion." Jullie praten een uur.`},
  eersteGoal:{titel:'Je eerste goal', wat:() => 'je eerste goal',
    tekst:d => `Je eerste goal als prof${d.zij ? `, tegen ${d.zij}` : ''}! De bal gaat erin en even hoor je niks meer, alleen je hart. Daarna het stadion. Wat doe je met dit moment?`,
    volgorde:['vriend', 'partner', 'ouders', 'exVriend', 'opa'], sociaal:'fans',
    vriendL:(d, n) => `Het juichgebaar van vroeger, voor ${n}`, vriend:(d, n) => `Je doet het juichgebaar dat jullie als kinderen bedachten. ${n} ziet het op tv en stuurt een filmpje terug: ${vr.hij} doet het ook, op de bank, in ${vr.zijn} pyjama.`,
    partnerL:(d, n) => `Een kushandje naar ${n} op de tribune`, partner:(d, n) => `Je zoekt ${n} op de tribune en geeft een kushandje. De camera pikt het op. "Je stond op tv," appt ${pa.ze} na afloop, met tien hartjes.`,
    oudersL:() => 'De bal bewaren voor je ouders', ouders:() => 'Na afloop vraag je de wedstrijdbal. Je ouders zetten hem in de vitrinekast, naast je eerste jeugdbeker. Je vader poetst hem elke week.',
    fansL:() => 'Shirt uit, juichen voor het vak', fans:() => 'Je trekt je shirt uit en rent naar het vak. De scheidsrechter kijkt streng, maar laat het gaan. De fans zingen je naam.'},
  eersteNul:{titel:'Je eerste nul', wat:() => 'je eerste nul',
    tekst:d => `Je eerste wedstrijd zonder tegengoal${d.zij ? `, tegen ${d.zij}` : ''}! Bij het laatste fluitsignaal pak je de bal en klem je hem vast. Die geef je niet meer terug.`,
    volgorde:['ouders', 'vriend', 'partner', 'exVriend', 'opa'], sociaal:'team',
    teamL:() => 'De verdedigers trakteren', team:(d, t) => `Je trakteert je verdedigers op een etentje. "Zonder jullie had ik vandaag niks gedaan." ${t ? t.n : 'De centrale verdediger'} houdt een speech. Volgende week staan jullie weer samen achterin.`},
  profContract:{titel:'Je eerste contract', wat:() => 'je eerste contract',
    tekst:d => `Je hebt je eerste contract getekend bij ${d.club}${d.o23 ? ' (bij de O23)' : ''}: ${d.salaris ? `${geldTxt(d.salaris)} per jaar, ` : ''}${d.jaren} ${d.jaren === 1 ? 'jaar' : 'jaar'}. Je bent nu echt ${ik.speler}. Hoe vier je het?`,
    volgorde:['ouders', 'partner', 'vriend', 'opa', 'exVriend'], sociaal:'team',
    oudersL:() => 'Je ouders trakteren op een etentje', ouders:() => `Je trakteert je ouders op het duurste restaurant van de stad. Je vader bestelt kreeft, voor het eerst in zijn leven. "Wij hebben jou al die jaren naar de training gebracht," zegt je moeder. "Nu is het jouw beurt."`,
    opa:(d, n) => `${n} leest je contract twee keer, met zijn leesbril op het puntje van zijn neus. Dan legt hij het neer. "In mijn tijd kregen we een krat bier en een fiets." Hij lacht, maar zijn ogen zijn nat.`,
    teamL:() => 'Taart voor je nieuwe ploeggenoten', team:() => 'Je neemt taart mee naar de eerste training. "Nieuwe jongens trakteren," zegt de aanvoerder streng, en dan lacht hij. Je hoort er meteen een beetje bij.'},
  transfer:{titel:'Een nieuwe club', wat:d => `je overstap naar ${d.club}`,
    tekst:d => `${d.huur ? `Je gaat op huurbasis naar ${d.club}` : `Je tekent bij ${d.club}`}${d.oud ? `, na je tijd bij ${d.oud}` : ''}. ${d.buitenland ? 'Een nieuw land, een nieuwe taal, een nieuw leven.' : 'Een nieuwe kleedkamer, nieuwe ploeggenoten, een nieuw begin.'} Wie helpt je bij de overstap?`,
    volgorde:['partner', 'ouders', 'vriend', 'opa', 'exVriend'], sociaal:'team',
    partnerL:(d, n) => `Samen met ${n} de nieuwe stad verkennen`, partner:(d, n) => `Jij en ${n} lopen een hele zondag door ${d.buitenland ? 'je nieuwe stad' : `de stad van ${d.club}`}. Jullie vinden een koffietentje dat meteen "jullie plek" wordt. "Het voelt al een beetje als thuis," zegt ${pa.ze}.`,
    oudersL:() => 'Je ouders helpen met verhuizen', ouders:() => 'Je vader rijdt met een aanhanger vol dozen achter je aan, je moeder vult je koelkast tot hij niet meer dicht kan. Bij het afscheid geeft ze je een knuffel die net iets te lang duurt.',
    vriendL:(d, n) => `Een afscheidsavond met ${n}`, vriend:(d, n) => `Jij en ${n} eten pizza op het dak, net als vroeger. "Je bent nu een grote ${ik.speler}," zegt ${vr.hij}. "Vergeet me niet." Je belooft elke week te bellen.`,
    teamL:d => 'Afscheid nemen van je oude ploeggenoten', team:d => `Je geeft een afscheidsetentje voor je oude ploeggenoten${d.oud ? ` van ${d.oud}` : ''}. Er wordt gelachen, er worden verhalen verteld, en de aanvoerder geeft je een shirt met alle handtekeningen.`},
  // (verlenging: geen moment meer bij een nieuw contract bij je eigen club, dat kwam elke keer terug. Een die nog in de
  //  wachtrij van een opgeslagen spel staat, valt vanzelf weg: hoogtepuntEvent kent hem niet meer)
  interDebuut:{titel:'Je debuut voor je land', wat:d => `je debuut voor ${d.land}`,
    tekst:d => `Je debuut voor ${d.land}${d.zij ? `, tegen ${d.zij}` : ''}! Het volkslied, je hand op je hart, het shirt met het nationale embleem. Je hebt er als kind van gedroomd.`,
    volgorde:['opa', 'ouders', 'partner', 'vriend', 'exVriend'], sociaal:'fans',
    opa:(d, n) => `${n} heeft het shirt van jouw debuut ingelijst en boven de bank gehangen, naast een foto van hemzelf, veertig jaar geleden. "Twee voetballers in de familie," zegt hij trots. "Maar één in het nationale team."`,
    ouders:d => `Je ouders stonden in het stadion, met sjaals in de kleuren van ${d.land}. Je moeder heeft het hele volkslied meegezongen en huilt nog steeds als je haar belt.`,
    fansL:() => 'Handtekeningen voor de kinderen langs het veld', fans:() => 'Na afloop blijf je een half uur bij het hek staan en zet je handtekeningen voor kinderen in nationale shirts. Eentje vertelt dat hij later net zo wil worden als jij.'},
  interGoal:{titel:'Je eerste interlandgoal', wat:d => `je eerste goal voor ${d.land}`,
    tekst:d => `Je eerste goal voor ${d.land}${d.zij ? `, tegen ${d.zij}` : ''}! Je naam staat voor altijd in de boeken van de bond.`,
    volgorde:['vriend', 'ouders', 'opa', 'partner', 'exVriend'], sociaal:'fans'},
  eersteTitel:{titel:'Je eerste titel', wat:d => `het kampioenschap`,
    tekst:d => `${d.club} is kampioen van de ${d.div}! Je eerste titel als prof. De champagne spuit door de kleedkamer en iemand heeft de schaal al in de douche gezet.`,
    volgorde:['ouders', 'partner', 'vriend', 'opa', 'exVriend'], sociaal:'team',
    ouders:() => 'Je ouders staan beneden bij de spelersingang, allebei met een kampioenssjaal. Je vader heeft een spandoek gemaakt met jouw naam erop. Hij heeft er de hele nacht aan gewerkt.',
    teamL:() => 'Met de groep de hele nacht door', team:() => 'Jullie vieren het tot de zon opkomt. Om zes uur sta je met de schaal in de fontein op het plein, samen met de halve selectie. Op de huldiging de volgende dag zie je eruit als een zombie, maar het is het mooiste dat je ooit hebt meegemaakt.'},
  promotie:{titel:'Promotie!', wat:d => `de promotie naar de ${d.naar}`,
    tekst:d => `${d.club} promoveert naar de ${d.naar}${d.po ? ', via de nacompetitie' : d.plek ? `, als nummer ${d.plek}` : ''}! Geen titel, maar wel een stap omhoog. Volgend seizoen speel je op een hoger niveau. Met wie vier je het?`,
    volgorde:['ouders', 'partner', 'vriend', 'opa', 'exVriend'], sociaal:'team',
    teamL:() => 'Met de groep de stad in', team:() => 'Jullie lopen met de hele groep door de stad, met sjaals en een toeter. Overal wordt getoeterd. In een kroeg zingt iemand het clublied, en de hele zaak zingt mee.',
    fansL:() => 'Een rondje langs de fans', fans:() => 'Je loopt een rondje langs het hek en geeft high fives. Een supporter van zeventig huilt van blijdschap: "Dertig jaar heb ik hierop gewacht."'},
  eersteBeker:{titel:'Je eerste beker', wat:d => `de ${d.beker}`,
    tekst:d => `${d.club} wint de ${d.beker}! Je eerste prijs als prof. Je mag de beker vasthouden en hij is zwaarder dan je dacht.`,
    volgorde:['ouders', 'partner', 'vriend', 'opa', 'exVriend'], sociaal:'fans',
    fansL:() => 'De beker naar het vak brengen', fans:() => 'Je loopt met de beker naar het vak van de fans en tilt hem boven je hoofd. Het geluid is oorverdovend.'},
  hattrick:{titel:'Hattrick!', wat:() => 'je hattrick',
    tekst:d => `${d.n >= 4 ? `${d.n} goals` : 'Drie goals'} in één wedstrijd${d.zij ? `, tegen ${d.zij}` : ''}! Na het laatste fluitsignaal krijg je de wedstrijdbal mee naar huis. Met wie deel je dit?`,
    volgorde:['vriend', 'ouders', 'partner', 'opa', 'exVriend'], sociaal:'fans',
    oudersL:() => 'De wedstrijdbal aan je ouders geven', ouders:() => 'Je geeft de wedstrijdbal aan je ouders. Je vader zet hem in de vitrinekast, met een briefje erbij: datum, tegenstander, drie goals. Je moeder fotografeert hem vanuit tien hoeken.',
    vriendL:(d, n) => `De bal laten signeren voor ${n}`, vriend:(d, n) => `Je laat de bal door de hele selectie signeren en geeft hem aan ${n}. "Die gaat naast mijn bed," zegt ${vr.hij}. "Zodat ik elke ochtend zie wat ik moet halen."`,
    fansL:() => 'De bal het vak in schieten', fans:() => 'Je schiet de wedstrijdbal hoog het vak in. Een jongetje van acht vangt hem en houdt hem boven zijn hoofd alsof hij zelf gescoord heeft. Het filmpje gaat het hele land rond.'},
  vasteWaarde:{titel:'Vaste waarde', wat:d => `je basisplaats bij ${d.club}`,
    tekst:d => `Je bent een vaste waarde bij ${d.club}! Elke week staat je naam als eerste op het bord in de kleedkamer. Je hebt je plek veroverd. Met wie vier je het?`,
    volgorde:['ouders', 'partner', 'vriend', 'opa', 'exVriend'], sociaal:'team',
    teamL:() => 'Je ploeggenoten trakteren', team:() => 'Je neemt na de training gebak mee voor de hele groep. "Vaste waarde, vaste traktatie," roept de keeper. Je hoort er nu echt bij.'},
  fanfavoriet:{titel:'Fanfavoriet', wat:d => `je eigen lied bij ${d.club}`,
    tekst:d => `De fans van ${d.club} hebben een lied over jou gemaakt! Het hele stadion zingt je naam als je de bal krijgt.`,
    volgorde:['ouders', 'vriend', 'partner', 'opa', 'exVriend'], sociaal:'fans',
    fansL:() => 'Naar het vak om mee te zingen', fans:() => 'Na de wedstrijd loop je naar het vak en zing je je eigen lied mee, vals en uit volle borst. De fans lachen en zingen nog harder.'},
  aanvoerder:{titel:'Aanvoerder', wat:d => `de aanvoerdersband van ${d.club}`,
    tekst:d => `De trainer geeft je de aanvoerdersband van ${d.club}. Jij loopt vanaf nu als eerste het veld op. Wie bel je als eerste?`,
    volgorde:['opa', 'ouders', 'partner', 'vriend', 'exVriend'], sociaal:'team',
    teamL:() => 'Een speech in de kleedkamer', team:() => 'Je staat op in de kleedkamer en houdt je eerste speech als aanvoerder. Je stem trilt een beetje, maar iedereen luistert. Daarna klapt de hele groep.'},
  clublegende:{titel:'Clublegende', wat:d => `je plek in de geschiedenis van ${d.club}`,
    tekst:d => `Je bent een clublegende van ${d.club}! Je naam komt op de muur bij de ingang van het stadion, tussen de grootste namen van de club.`,
    volgorde:['ouders', 'opa', 'partner', 'vriend', 'exVriend'], sociaal:'fans'},
  wed100:{titel:'Honderd wedstrijden', wat:() => 'je honderdste wedstrijd',
    tekst:d => `Je ${nr(100)} wedstrijd als prof! Voor de aftrap krijg je bloemen van het bestuur en een ingelijst shirt met het nummer 100.`,
    volgorde:['ouders', 'partner', 'opa', 'vriend', 'exVriend'], sociaal:'team'},
  goal50:{titel:'Vijftig goals', wat:() => 'je vijftigste goal',
    tekst:d => `Doelpunt nummer 50 in je carrière! Het stadion gaat staan voor een applaus.`,
    volgorde:['vriend', 'ouders', 'partner', 'opa', 'exVriend'], sociaal:'fans'},
  nul50:{titel:'Vijftig keer de nul', wat:() => 'je vijftigste nul',
    tekst:d => `Voor de vijftigste keer in je carrière houd je de nul! Je verdedigers tillen je op hun schouders.`,
    volgorde:['ouders', 'vriend', 'partner', 'opa', 'exVriend'], sociaal:'team'},
  terugBlessure:{titel:'Terug op het veld', wat:() => 'je terugkeer',
    tekst:d => `Je bent terug na je ${d.kort}blessure! Wekenlang revalideren, alleen in de sportschool, en nu sta je weer op het gras. Wie wil je bedanken?`,
    volgorde:['partner', 'ouders', 'vriend', 'opa', 'exVriend'], sociaal:'team',
    partnerL:(d, n) => `${n} bedanken`, partner:(d, n) => `${n} was er elke dag: ijszakken, slechte films op de bank, en een schop onder je kont als je geen zin had in je oefeningen. Je neemt ${pa.hem} mee naar zee. "Op naar de volgende goal," zegt ${pa.ze}.`,
    oudersL:() => 'Je ouders bedanken', ouders:() => 'Je moeder kookte elke week je lievelingseten en je vader reed je naar elke afspraak met de fysio. Je stuurt ze een grote bos bloemen met een kaartje: "Zonder jullie stond ik hier niet."',
    teamL:() => 'De fysio en de groep bedanken', team:() => 'Je trakteert de medische staf en de groep op een ontbijt. De fysio krijgt een gesigneerd shirt. "Jij was de zwaarste patiënt ooit," zegt hij lachend. "Maar ook de hardste werker."'},
};
export const HOOG_IDS = Object.keys(HOOG);

// ---------- in de wachtrij zetten ----------
// herhaal: bij een transfer of verlenging telt elk moment (hooguit één per seizoen), de rest gebeurt maar één keer
export function hoogtepunt(id, d = {}, herhaal = false){
  const sp = S && S.sp; if (!sp || !HOOG[id] || S.trainer) return;
  const g = sp.hoogGezien = sp.hoogGezien || {};
  if (herhaal ? g[id] === S.jaar : g[id] != null) return;
  g[id] = S.jaar;
  const q = S.hoogWacht = S.hoogWacht || [];
  if (q.length >= 3) q.shift(); // (er niet te veel laten opstapelen: het oudste valt weg)
  q.push({id, d});
}
// Het bericht met keuzes (op het moment zelf gebouwd: functies worden niet opgeslagen)
export function hoogtepuntEvent(x){
  const H = HOOG[x.id]; if (!H) return null;
  const m = mensen(), d = x.d || {};
  const pers = H.volgorde.filter(w => m[w]).slice(0, 2);
  if (pers.length < 2 && !pers.includes('ouders')) pers.push('ouders');
  const wie = [...pers, m[H.sociaal] || H.sociaal === 'fans' ? H.sociaal : 'fans'];
  if (wie.length < 3) wie.push(H.sociaal === 'team' ? 'fans' : (m.team ? 'team' : 'fans'));
  const opts = [...new Set(wie)].slice(0, 3).map(w => { const o = KEUZE[w](H, d, m); const f = o.f; return {l:o.l, toon:o.toon, f(){ S.hoogNu = null; return f(); }}; });
  return {soort:'hoogtepunt', titel:H.titel, tekst:H.tekst(d), opts};
}
// Aan het begin van de week: een hoogtepunt uit de wachtrij (als er niet al iets anders klaarstaat)
export function hoogtepuntWeek(eerste){
  if (S.trainer || !S.sp) return; // (ook in de eerste week: je eerste contract of een zomertransfer meteen na het tekenen)
  const q = S.hoogWacht; if (!q || !q.length) return;
  const x = q.shift(), ev = hoogtepuntEvent(x); if (!ev) return;
  S.hoogNu = x; // (bij herladen voordat je kiest: terug in de wachtrij, migratie.js)
  // Een hoogtepunt gaat voor: stond er al een ander bericht klaar, dan komt dat direct erna (S.volgEv, gebeurtenissen.js)
  const ander = S.wachtEv;
  if (ander) ev.opts = ev.opts.map(o => ({...o, f(){ const t = o.f(); if (!S.volgEv) S.volgEv = ander; return t; }}));
  S.wachtEv = ev;
}

// ---------- na een wedstrijd die je speelde (competitie, beker, nacompetitie) ----------
export function hoogtepuntenNaWedstrijd(M, debuut){
  const sp = S.sp, c = club(), zij = M.zij ?? (M.opp !== undefined && CLUBS[M.opp] ? CLUBS[M.opp].n : '');
  if (debuut) hoogtepunt('debuut', {club:c.n, zij});
  if (M.goals > 0 && S.car.g - M.goals <= 0) hoogtepunt('eersteGoal', {zij});
  if (sp.pos === 'KEEPER' && M.rol === 'basis' && M.them === 0) hoogtepunt('eersteNul', {zij});
  if (S.car.wed === 100) hoogtepunt('wed100', {});
  if (M.goals >= 3) hoogtepunt('hattrick', {zij, n:M.goals}, true); // (hooguit eens per seizoen)
  if (sp.pos !== 'KEEPER' && S.car.g >= 50 && S.car.g - M.goals < 50) hoogtepunt('goal50', {});
  if (sp.pos === 'KEEPER' && (S.car.nul || 0) === 50 && M.them === 0 && M.rol === 'basis') hoogtepunt('nul50', {});
}
