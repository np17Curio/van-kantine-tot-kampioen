import { S, club, mod, ovr } from '../../core/state.js';
import { CLUBS, WINTER, AANV } from '../../data/gegevens.js';
import { thuisLand } from '../../data/landen.js';
import { krantMelding } from '../media/roddel.js';
import { modFans } from '../wedstrijd/fans-pers.js';
import { statusNiveau } from './status.js';
import { MAKELAAR, bijJou, vriendInBasis, vriendPos, isKeeper, nulTxt, prestatie, interLand, laatsteWeek, opaNaam, vriendActief, vriendClubNaam, zetBand, zetRivaalBand, blesseerVriend } from './journey.js';
import { ik, team, vr } from '../../core/geslacht.js';

/* ===================== Jouw verhaal, deel 2 tot en met 4 ===================== */
// Na je eerste seizoen gaat het verhaal door, over je hele carrière. Een hoofdstuk komt op een moment in je loopbaan
// (een oproep, een blessure, Europees voetbal, de aanvoerdersband, je leeftijd), niet in een vaste week.
// wanneer(ctx) geeft de gegevens voor het hoofdstuk terug (of null: nog niet); inhoud(d) de tekst, opa en de keuzes.
export const DELEN = [{n:'De doorbraak', van:0}, {n:'De bevestiging', van:8}, {n:'De top', van:15}, {n:'Het afscheid', van:22}];
export const deelVan = h => { let i = 0; DELEN.forEach((d, k) => { if (h >= d.van) i = k; }); return {nr:i + 1, ...DELEN[i]}; };

const o = (l, toon, f) => ({l, toon, f});
const caps = () => Object.values((S.car && S.car.int) || {}).reduce((a, x) => a + (x.caps || 0), 0);
// Wie is hij nu voor je? 'vriend' (nog vrienden), 'rivaal' (je ex-vriend is je rivaal) of 'geen'
const rol = () => vriendActief() ? 'vriend' : S.sp.rivaal && S.sp.rivaal.exVriend ? 'rivaal' : 'geen';
const vn = () => S.sp.vriend ? S.sp.vriend.voornaam : 'je ' + vr.jeugdvriend + '';
const zijnClub = () => { const R = S.sp.rivaal; return (rol() === 'rivaal' ? (CLUBS[R.club] && CLUBS[R.club].n) : vriendClubNaam()) || '' + vr.zijn + ' club'; };
const penalty = () => S.sp.journey.penalty === 'vriend' ? 'de penalty die jij ' + vr.hem + ' gaf toen jullie tien waren' : S.sp.journey.penalty === 'zelf' ? 'die laatste penalty die jij toen zelf nam' : `die foto van jullie met ${S.sp.journey.penRaak === false ? 'de zilveren medaille' : 'de beker'}, toen jullie tien waren`;
const opaZin = () => S.sp.journey.opaZiek ? `${opaNaam()}, die na zijn ziekte weer op de been is,` : opaNaam();
function inEuropa(){
  const B = S.ss.bekers || {}, id = S.sp.club;
  return ['cl', 'eur'].find(k => B[k] && ((B[k].levend || []).includes(id) || (B[k].rondes || []).some(r => r.some(m => m.h === id || m.u === id)))) || null;
}

// Het hoeveelste seizoen bij je huidige club (sp.clubSz: afgeronde seizoenen hier, 0 na een transfer)
const clubSeizoen = () => (S.sp.clubSz || 0) + 1;
const RANG = ['eerste', 'tweede', 'derde', 'vierde', 'vijfde', 'zesde', 'zevende', 'achtste', 'negende', 'tiende'];
const seizoenWoord = n => RANG[n - 1] || `${n}e`;

export const VERVOLG = {
  // ---------- Deel 2: De bevestiging ----------
  8: {wanneer:c => c.sz >= 1 ? {} : null, inhoud:() => clubSeizoen() === 1 ? {
    // net van club gewisseld: je tweede seizoen als prof, maar je eerste hier
    tekst:[`Je tweede seizoen als prof, maar je eerste bij ${club().n}. Nieuwe kleedkamer, nieuwe trainer, en niemand die je hier vorig jaar zag spelen.`,
      'De trainer neemt je apart na de eerste training. "We hebben je niet gehaald om te wennen. We hebben je gehaald om het verschil te maken. Wat ga je laten zien?"'],
    opa:'"Een nieuwe club is een schone lei. Schrijf er meteen iets moois op."',
    opts:[o('"Ik ga hier elke dag hard werken."', 'kalm', () => { mod('vert', 4); mod('focus', 3); return 'De trainer knikt. "Dat wilde ik horen."'; }),
      o('"Gewoon mijn spel spelen, zoals vorig jaar."', 'bal', () => { mod('moraal', 4); return 'Hij glimlacht. "Zelfvertrouwen. Goed zo."'; }),
      o('"Ze gaan snel zien waarom jullie mij haalden."', 'fel', () => { modFans(3); mod('vert', -1); return '"Grote woorden," zegt hij. "Maak ze waar."'; })]} : {
    tekst:[`Je ${seizoenWoord(clubSeizoen())} seizoen bij ${club().n} begint. Vorig jaar was je de nieuwe ${ik.jongen}, nu weet iedereen wie je bent. Ook de verdedigers van de tegenstander.`,
      'De trainer neemt je apart na de eerste training. "Het tweede seizoen is het moeilijkste. Iedereen kent je trucjes nu. Wat ga je anders doen?"'],
    opa:'"Het eerste jaar verrast je ze. Het tweede jaar moet je ze verslaan."',
    opts:[o('"Harder werken dan vorig jaar."', 'kalm', () => { mod('vert', 4); mod('focus', 3); return 'De trainer knikt. "Dat wilde ik horen."'; }),
      o('"Gewoon mijn spel spelen."', 'bal', () => { mod('moraal', 4); return 'Hij glimlacht. "Zelfvertrouwen. Goed zo."'; }),
      o('"Dit wordt mijn seizoen. Let maar op."', 'fel', () => { modFans(3); mod('vert', -1); return '"Grote woorden," zegt hij. "Maak ze waar."'; })]}},
  9: {wanneer:c => c.sz >= 1 ? (caps() > 0 ? {debuut:true, land:interLand(), oefen:!S.sp.land} : S.ronde >= WINTER ? {debuut:false, land:interLand()} : null) : null, inhoud:d => d.debuut ? {
    tekst:[`Het is gebeurd: je hebt je eerste interland gespeeld voor ${d.land || interLand()}. Het volkslied, het shirt, het stadion: je krijgt er nog kippenvel van.${d.oefen ? ' Het was een oefeninterland: je kunt nog altijd kiezen voor welk land je uitkomt.' : ''}`,
      `${opaNaam()} zat op de tribune, met een sjaal die hij al dertig jaar bewaart. Na afloop belt een journalist: "Wat betekent dit voor je?"`],
    opa:'"Ik heb dat shirt nooit mogen dragen. Draag het voor ons allebei."',
    opts:[o('"Het is een eer. Ik ga hard werken om te blijven."', 'kalm', () => { mod('vert', 3); mod('moraal', 5); return 'Een keurig antwoord. De bondscoach leest het ook.'; }),
      o('"Dit is voor mijn opa."', 'bal', () => { mod('moraal', 8); modFans(2); return `Het citaat haalt de voorpagina. ${opaNaam()} knipt het uit.`; }),
      o('"Ik wil niet alleen debuteren. Ik wil een vaste basisplaats."', 'fel', () => { modFans(4); mod('rep', 2); return 'Ambitieus. De fans vinden het geweldig.'; })]} : {
    tekst:[`De selectie van ${d.land || interLand()} is bekend. Je naam staat er niet op. Ook deze keer niet.`,
      'Je telefoon blijft stil. Je ploeggenoten feliciteren een andere ' + team.jongen + ' van jouw leeftijd die wel is opgeroepen.'],
    opa:'"Ik ben nooit opgeroepen. Dat heeft me nooit gestopt om de beste van het dorp te zijn. Jouw tijd komt."',
    opts:[o('Het als motivatie gebruiken', 'kalm', () => { mod('focus', 6); return 'Je zet een extra training in je agenda. Elke dag.'; }),
      o('Je ploeggenoot feliciteren', 'bal', () => { mod('moraal', 2); mod('vert', 2); return '' + team.Hij + ' is er blij mee. "Jij bent de volgende," zegt ' + team.hij + '.'; }),
      o('"De bondscoach kijkt niet goed."', 'fel', () => { modFans(3); mod('rep', -2); return 'Je zegt het in een interview. De bondscoach leest het ook. Dat helpt niet.'; })]}},
  10: {wanneer:c => c.sz >= 1 ? (S.sp.blessure >= 2 ? {echt:true, w:S.sp.blessure} : (c.sz >= 2 || S.ronde >= WINTER + 4) ? {echt:false} : null) : null, inhoud:d => d.echt ? {
    tekst:[`Geblesseerd. ${d.w} weken aan de kant. Je zit in de behandelkamer en kijkt naar je been alsof het niet van jou is.`,
      'De fysiotherapeut legt het schema uit. "Het wordt saai en het doet pijn. Maar als je je eraan houdt, kom je sterker terug."'],
    opa:'"Ik heb ooit te vroeg weer gespeeld. Daarna was ik nooit meer de oude. Wees slimmer dan ik."',
    opts:[o('Precies het schema volgen', 'kalm', () => { mod('focus', 5); mod('vert', 3); return 'Elke oefening, elke dag. De fysio is onder de indruk.'; }),
      o('Ook naar de wedstrijden blijven komen', 'bal', () => { mod('moraal', 4); return 'Je zit op de tribune bij elke thuiswedstrijd. De groep waardeert het.'; }),
      o('Zo snel mogelijk terug willen', 'fel', () => { mod('moraal', 3); S.sp.fit = Math.max(0, (S.sp.fit || 80) - 5); return 'Je doet extra oefeningen buiten het schema. De fysio schudt zijn hoofd.'; })]} : {
    tekst:['Een harde tackle op de training. Je ligt op de grond en voelt je enkel. Het hele veld valt stil.',
      'Na tien minuten sta je weer. Het valt mee: een flinke tik, geen blessure. Maar die nacht slaap je slecht. Wat als het wél mis was gegaan?'],
    opa:'"Angst is een slechte trainer. Respect voor je lichaam is een goede."',
    opts:[o('Extra stabiliteitstraining doen', 'kalm', () => { mod('focus', 4); return 'Je enkels worden sterker. En je hoofd ook.'; }),
      o('Het erover hebben met de teampsycholoog', 'bal', () => { mod('moraal', 5); return 'Het gesprek helpt. Je slaapt weer goed.'; }),
      o('Verhaal halen bij de speler die je raakte', 'fel', () => { mod('focus', 2); modFans(1); return 'Het wordt een flinke discussie in de kleedkamer. Daarna is het uitgepraat.'; })]}},
  11: {wanneer:c => c.sz >= 1 && (S.ronde >= laatsteWeek() - 8 || c.sz >= 2) ? {} : null, inhoud:() => ({
    tekst:[`Je moeder belt. ${opaNaam()} ligt in het ziekenhuis. "Het is niet levensbedreigend, zeggen ze. Maar hij is zwak."`,
      'Zaterdag heb je een belangrijke wedstrijd. Het ziekenhuis is drie uur rijden.'],
    opa:'"Speel jij nou maar. Ik kijk wel op dat kleine tv\'tje hier." (door de telefoon, met een zwakke stem)',
    opts:[o('Na de training langsrijden', 'kalm', () => { S.sp.journey.opaZiek = true; mod('moraal', 8); mod('focus', -3); return `Je zit tot laat naast zijn bed. Hij vertelt over zijn beste goal ooit, voor de honderdste keer. Je luistert alsof het de eerste keer is.`; }),
      o('Elke avond bellen', 'bal', () => { S.sp.journey.opaZiek = true; mod('moraal', 4); return 'Elke avond om negen uur. Hij vraagt alleen maar naar voetbal.'; }),
      o('"Deze wedstrijd is voor jou, opa."', 'fel', () => { S.sp.journey.opaZiek = true; mod('focus', 6); modFans(2); return 'Je schrijft zijn naam op je tape om je pols. Na de wedstrijd stuurt hij een appje: "Gezien. Trots."'; })]})},
  12: {wanneer:(c, J) => c.sz >= 2 ? {weg:J.club1 != null && S.sp.club !== J.club1, oud:CLUBS[J.club1] ? CLUBS[J.club1].n : 'je eerste club'} : null, inhoud:d => d.weg ? {
    tekst:[`Een nieuw seizoen bij ${club().n}. ${d.oud || 'Je eerste club'}, waar het allemaal begon, voelt al ver weg.`,
      'Nieuwe kleedkamer, nieuwe trainer, nieuwe fans. Niemand hier heeft je zien opgroeien. Bij de eerste training kijkt de aanvoerder je lang aan.'],
    opa:'"Een nieuwe club is als een nieuwe school. De eerste week bepaalt veel. Zeg goedendag tegen de kantinejuffrouw."',
    opts:[o('Iedereen persoonlijk een hand geven', 'kalm', () => { mod('vert', 4); return 'Ook de materiaalman en de kok. Dat wordt opgemerkt.'; }),
      o('Gewoon je ding doen', 'bal', () => { mod('moraal', 3); return 'Je laat je voetbal spreken.'; }),
      o('Op de eerste training meteen alles geven', 'fel', () => { modFans(3); mod('focus', 3); return 'Je wint elk duel, ook tegen de aanvoerder. ' + team.Hij + ' grijnst. "Oké. Jij bent er klaar voor."'; })]} : {
    tekst:[`Je ${seizoenWoord(clubSeizoen())} seizoen bij ${club().n}. ${clubSeizoen() >= 3 ? 'De fans hebben een spandoek met jouw naam.' : 'De fans kennen je naam al.'}`,
      `Je zaakwaarnemer belt: een grotere club wil met je praten. "Dit is je kans," zegt hij. "Of wil je hier een clubman worden?"`],
    opa:'"Er zijn spelers die overal hebben gespeeld, en spelers die één club nooit zijn vergeten. Allebei goed. Maar kies zelf."',
    opts:[o('"Ik voel me hier thuis."', 'kalm', () => { modFans(6); mod('vert', 3); return 'De fans horen ervan. Bij de volgende thuiswedstrijd zingen ze jouw naam.'; }),
      o('"Laat ze maar een bod doen. Dan zien we wel."', 'bal', () => { mod('moraal', 2); return 'De deur staat op een kier.'; }),
      o('"Ik wil naar de top. Regel het."', 'fel', () => { mod('rep', 2); modFans(-3); return 'Het nieuws lekt uit. Sommige fans fluiten je uit, andere snappen het.'; })]}},
  13: {wanneer:c => c.sz >= 2 && (S.ronde >= 8 || c.sz >= 3) ? {} : null, inhoud:() => {
    const r = rol(), v = vn();
    // (kijk of hij echt op de bank zit: staat hij in de basis, dan gaat het om kritiek van de fans en de kranten)
    if (r === 'vriend'){ const basis = vriendInBasis(), samen = bijJou(), slecht = vriendPos() === 'KEEPER' ? 'een paar dure fouten' : 'een paar slechte wedstrijden';
      const zorg = samen ? `Na de training blijft ${v} in de kleedkamer zitten. ${basis ? `${vr.Hij} staat wel in de basis, maar na ${slecht} fluiten de fans ${vr.hem} uit.` : '' + vr.Hij + ' zit al weken op de bank.'}`
        : `${v} belt je, laat op de avond. Bij ${zijnClub()} ${basis ? `staat ${vr.hij} elke week in de basis, maar het loopt niet. Na ${slecht} schrijven de kranten dat ${vr.hij} ${vr.zijn} plek niet verdient, en bij de laatste wedstrijd floten de fans ${vr.hem} uit.` : 'zit ' + vr.hij + ' al weken op de bank.'}`;
      return {
      tekst:[`${zorg} "Ik twijfel of ik nog wel goed genoeg ben."`,
        `Je hebt ${vr.hem} nog nooit zo stil gehoord. Je denkt terug aan ${penalty()}.`],
      opa:'"Een vriend die je nodig heeft, is belangrijker dan een wedstrijd die je moet winnen."',
      opts:[o(samen ? '"Kom, we blijven na de training nog even samen oefenen."' : '"Kom dit weekend bij me. We trainen samen."', 'kalm', () => { zetBand(10); mod('focus', -2); return 'Jullie trainen twee dagen samen op het oude veldje. ' + vr.Hij + ' lacht weer.'; }),
        o(samen ? '"Vraag de trainer wat je moet verbeteren."' : '"Praat met je trainer. Vraag wat je moet verbeteren."', 'bal', () => { zetBand(5); return '"Goed idee," zegt ' + vr.hij + '. "Je bent slimmer geworden."'; }),
        o('"Stop met klagen en knok ervoor."', 'fel', () => { zetBand(-3); return `Het is even stil. "Oké," zegt ${v}. "Ik zal het je laten zien." ${samen ? '' + vr.Hij + ' pakt ' + vr.zijn + ' tas en loopt weg.' : '' + vr.Hij + ' hangt op.'}`; })]}; }
    if (r === 'rivaal') return {
      tekst:[`Na de wedstrijd tegen ${zijnClub()} staat ${v} ineens bij jullie spelersbus. Jullie hebben elkaar al maanden niet gesproken, alleen op het veld.`,
        '"Mag ik even met je praten?" vraagt ' + vr.hij + '. Je ploeggenoten kijken toe vanuit de bus.'],
      opa:'"Trots is een zware tas. Je kunt hem altijd neerzetten."',
      opts:[o('Even met ' + vr.hem + ' praten', 'kalm', () => { zetRivaalBand(20); return 'Het gesprek is ongemakkelijk, maar eerlijk. Er is iets veranderd.'; }),
        o('"Niet hier. Bel me maar."', 'bal', () => { zetRivaalBand(6); return '' + vr.Hij + ' knikt. Een week later belt ' + vr.hij + '. Het is een begin.'; }),
        o('De bus in stappen', 'fel', () => { zetRivaalBand(-15); modFans(2); return 'Je loopt langs ' + vr.hem + ' heen. Door het raam zie je ' + vr.hem + ' staan. De fans vinden het prachtig.'; })]};
    return {
      tekst:['Je oude jeugdtrainer belt. Hij is gestopt en organiseert een toernooi voor de jeugd van je oude club.', '"Zou je de prijzen willen uitreiken? De kinderen praten alleen maar over jou."'],
      opa:'"Vergeet nooit waar je vandaan komt. Zij vergeten jou ook niet."',
      opts:[o('Ja, en de hele dag blijven', 'kalm', () => { modFans(4); mod('moraal', 5); return 'Je deelt handtekeningen uit tot het donker wordt.'; }),
        o('Even langsgaan', 'bal', () => { modFans(2); return 'Een uurtje, een paar foto\'s. De kinderen zijn blij.'; }),
        o('"Ik heb het te druk."', 'fel', () => { mod('focus', 3); modFans(-2); return 'Je jeugdtrainer zegt dat hij het snapt. Het klinkt teleurgesteld.'; })]};
  }},
  14: {wanneer:c => c.sz >= 3 ? {} : null, inhoud:() => {
    const l = (S.car.seizoenen || []).slice(-2), g = l.reduce((a, x) => a + x.g, 0), w = l.reduce((a, x) => a + x.wed, 0), nul = l.reduce((a, x) => a + (x.nul || 0), 0);
    return {tekst:[`Twee seizoenen verder. ${w} wedstrijden, ${prestatie(g, nul)}. Je bent niet meer "dat talent", je bent een vaste waarde.`,
      rol() === 'vriend' ? `${vn()} en jij zijn nog steeds vrienden. Dat is in het profvoetbal bijzonder.` : rol() === 'rivaal' ? `${vn()} en jij: rivalen. ${S.sp.rivaal.band >= 20 ? 'Maar met respect.' : 'Nog altijd ijzig.'}` : 'Het voetbal heeft je veel gegeven, en ook wat mensen gekost.',
      `${opaZin()} zit op zijn vaste plek op de bank. "Deel twee," zegt hij. "Nu begint het echte werk: de top."`],
      opa:'"Goed is de vijand van geweldig."', opts:[]};
  }},
  // ---------- Deel 3: De top ----------
  15: {wanneer:c => c.sz >= 3 ? (inEuropa() ? {echt:true, k:inEuropa()} : c.sz >= 4 ? {echt:false} : null) : null, inhoud:d => d.echt ? {
    tekst:[`De ${d.k === 'cl' ? 'Champions League' : 'Europa Cup'}. Als je het veld op loopt, klinkt de hymne. Je hebt dit duizend keer op tv gezien.`,
      'Tegenover je staat een wereldster, de ' + team.speler + ' van wie je als kind een poster boven je bed had. Bij de handdruk knipoogt ' + team.hij + '.'],
    opa:'"' + team.Hij + ' heeft ook maar twee benen. Speel tegen de ' + team.speler + ', niet tegen de naam."',
    opts:[o('' + team.Hem + ' met respect behandelen', 'kalm', () => { mod('focus', 5); return 'Na afloop ruilt ' + team.hij + ' ' + team.zijn + ' shirt met jou. "Goed gespeeld, ' + ik.jongen + '."'; }),
      o('Er gewoon een wedstrijd van maken', 'bal', () => { mod('moraal', 4); return 'Een duel als alle andere. Bijna dan.'; }),
      o('' + team.Hem + ' bij de eerste bal keihard aanpakken', 'fel', () => { modFans(4); mod('rep', 2); return 'Het hele stadion ziet het: jij bent niet onder de indruk.'; })]} : {
    tekst:['Je kijkt de Champions League met een paar ploeggenoten. De hymne klinkt. Niemand zegt iets.', '"Ooit," zegt een van hen. "Ooit staan wij daar."'],
    opa:'"Dromen kost niks. Ervoor werken kost alles. Allebei doen."',
    opts:[o('"Daar moeten we keihard voor werken."', 'kalm', () => { mod('focus', 5); return 'Je zet de wekker een halfuur eerder.'; }),
      o('"Misschien met deze club, misschien met een andere."', 'bal', () => { mod('moraal', 2); return 'Je kijkt verder. Je ogen glanzen.'; }),
      o('"Volgend jaar sta ik daar. Wedden?"', 'fel', () => { mod('moraal', 4); modFans(2); return 'Het wordt een weddenschap om een etentje.'; })]}},
  16: {wanneer:c => c.sz >= 3 ? (statusNiveau() >= AANV ? {band:true} : (S.ronde >= WINTER || c.sz >= 4) ? {band:false} : null) : null, inhoud:d => d.band ? {
    tekst:[`De aanvoerdersband van ${club().n}. Hij voelt zwaarder dan hij eruitziet.`, 'Voor de wedstrijd kijkt de hele kleedkamer naar jou. Je eerste toespraak als aanvoerder.'],
    opa:'"Een aanvoerder praat niet het hardst. ' + ik.Hij + ' loopt het hardst."',
    opts:[o('"Wij doen het samen. Iedereen is belangrijk."', 'kalm', () => { mod('vert', 4); return 'Een stil, krachtig verhaal. Iedereen knikt.'; }),
      o('"Plan volgen, en vooral genieten."', 'bal', () => { mod('moraal', 5); return 'Er wordt gelachen. De spanning is weg.'; }),
      o('"Niemand komt hier vandaag winnen!"', 'fel', () => { modFans(3); mod('focus', 3); return 'Je slaat op de deur. De kleedkamer ontploft.'; })]} : {
    tekst:['De trainer heeft een ander aangewezen als aanvoerder. Maar in de kleedkamer kijken de ' + team.jongens + ' steeds vaker naar jou.', 'Na een slechte wedstrijd vraagt een jonge ' + team.speler + ': "Wat moeten we nu?"'],
    opa:'"Je hebt geen band nodig om een leider te zijn."',
    opts:[o('Rustig uitleggen wat er beter kan', 'kalm', () => { mod('vert', 3); return '' + team.Hij + ' luistert aandachtig. De trainer ziet het.'; }),
      o('' + team.Hem + ' een schouderklopje geven', 'bal', () => { mod('moraal', 3); return '"Volgende week beter," zeg je. ' + team.Hij + ' gelooft je.'; }),
      o('De hele groep toespreken', 'fel', () => { mod('vert', -1); modFans(2); return 'De aanvoerder kijkt je schuin aan. Maar het werkt wel.'; })]}},
  17: {wanneer:c => c.sz >= 4 ? (caps() >= 8 ? {land:true} : c.sz >= 5 ? {land:false} : null) : null, inhoud:d => d.land ? {
    tekst:[`Een groot toernooi met ${interLand()}. Het hele land kleurt, de supermarkt verkoopt jouw gezicht op een spaarkaart.`, 'Op de avond voor de eerste wedstrijd vraagt de bondscoach of je iets tegen de groep wilt zeggen.'],
    opa:'"Een heel land kijkt mee. Maar je speelt nog steeds met een bal, op gras, met tien vrienden."',
    opts:[o('"Wedstrijd voor wedstrijd. Niet verder kijken."', 'kalm', () => { mod('focus', 5); return 'De bondscoach knikt. Precies wat hij wilde zeggen.'; }),
      o('"Laten we hiervan genieten. Dit maken we maar een paar keer mee."', 'bal', () => { mod('moraal', 6); return 'Het wordt een mooie avond met de groep.'; }),
      o('"We gaan dit toernooi winnen."', 'fel', () => { modFans(5); mod('rep', 2); return 'De krant zet het de volgende dag op de voorpagina.'; })]} : {
    tekst:[`Het grote toernooi begint. ${interLand()} speelt, en jij zit voor de tv. Naast ${opaZin()}, op zijn bank, zoals vroeger.`, '"Daar had jij moeten staan," zegt hij zacht.'],
    opa:'"Het is nooit te laat, tot het te laat is. En dat is het nog lang niet."',
    opts:[o('"Volgende keer, opa."', 'kalm', () => { mod('focus', 5); return 'Hij pakt je hand. "Dat weet ik."'; }),
      o('Gewoon samen kijken en genieten', 'bal', () => { mod('moraal', 6); return 'Jullie juichen bij elke goal, alsof je tien bent.'; }),
      o('Boos de kamer uit lopen', 'fel', () => { mod('focus', 3); mod('moraal', -2); return 'Je gaat hardlopen in de regen. Opa snapt het wel.'; })]}},
  18: {wanneer:c => c.sz >= 4 && (S.sp.rep >= 50 || S.ronde >= WINTER || c.sz >= 5) ? {} : null, inhoud:() => ({
    tekst:['Een roddelsite zet een verhaal online: je zou ruzie hebben met je trainer en weg willen. Er klopt niets van.', 'Binnen een uur is het overal. Je telefoon ontploft.'],
    opa:'"In mijn tijd stond roddel in de krant van gisteren. Nu staat het in je broekzak. Doe er hetzelfde mee: niks."',
    opts:[o('Niet reageren', 'kalm', () => { mod('focus', 4); mod('vert', 2); return 'Na twee dagen is het verhaal vergeten.'; }),
      o('Een korte, rustige verklaring plaatsen', 'bal', () => { mod('rep', 2); return '"Er klopt niets van. Ik heb het hier naar mijn zin." Klaar.'; }),
      o('De roddelsite publiekelijk aanvallen', 'fel', () => { modFans(4); mod('rep', -2); krantMelding(`${S.sp.naam} haalt hard uit naar roddelsite`, `"Dit is gewoon gelogen," schrijft ${ik.hij} op social media.`); return 'Je fans staan achter je, maar het verhaal leeft nog dagen door.'; })]})},
  19: {wanneer:c => c.sz >= 5 ? {} : null, inhoud:() => {
    const r = rol(), v = vn();
    if (r === 'vriend'){ const V = S.sp.vriend, wk = V.kbVerhaal || (V.kbVerhaal = blesseerVriend('kruisband')); return { // (eenmalig: de inhoud wordt bij elke weergave opnieuw opgebouwd)
      tekst:[`Slecht nieuws: ${v} heeft ${vr.zijn} kruisband afgescheurd. ${vr.Hij} ligt er zeker ${wk} weken uit. De artsen zeggen dat het de vraag is of ${vr.hij} ooit nog op het oude niveau komt.`,
        `Je bezoekt ${vr.hem} in het ziekenhuis. ${vr.Hij} probeert te lachen. "Weet je nog, ${penalty()}? Nu moet jij het voor ons allebei doen."`],
      opa:'"Ik heb nooit iemand zien terugkomen zonder iemand die in hem bleef geloven."',
      opts:[o('"Ik help je terug. Elke week."', 'kalm', () => { zetBand(15); mod('moraal', 3); mod('focus', -2); return 'Je gaat elke maandag langs bij ' + vr.zijn + ' revalidatie. Het wordt jullie vaste afspraak.'; }),
        o('"Je komt terug. Ik weet het zeker."', 'bal', () => { zetBand(8); return '' + vr.Hij + ' knikt. ' + vr.Hij + ' gelooft het een beetje meer.'; }),
        isKeeper() ? o('"Ik houd de volgende nul voor jou."', 'fel', () => { zetBand(6); mod('focus', 5); modFans(3); return 'Na je volgende nul houd je ' + vr.zijn + ' shirt omhoog. Het hele stadion klapt.'; })
          : o('"Ik maak mijn volgende goal voor jou."', 'fel', () => { zetBand(6); mod('focus', 5); modFans(3); return 'Bij je volgende goal laat je ' + vr.zijn + ' rugnummer zien. Het hele stadion klapt.'; })]}; }
    if (r === 'rivaal') return {
      tekst:[`De titelrace komt neer op jou en ${v}. ${isKeeper() ? 'Jij houdt de nul, ' + vr.hij + ' moet erlangs: wie dat duel wint' : 'Wie de meeste goals maakt'}, wint waarschijnlijk alles. De media noemen het "het duel van het decennium".`,
        'Op een galadiner staan jullie ineens naast elkaar bij de bar.'],
      opa:'"Ik heb mijn beste vriend ooit laten gaan om een ruzie over niks. Leer van mijn fout."',
      opts:[o('"Zullen we het na het seizoen uitpraten?"', 'kalm', () => { zetRivaalBand(25); return '' + vr.Hij + ' kijkt je aan. "Ja," zegt ' + vr.hij + '. "Dat wil ik ook."'; }),
        o('' + vr.Hem + ' gewoon een drankje aanbieden', 'bal', () => { zetRivaalBand(12); return 'Jullie praten over vroeger. Een beetje.'; }),
        o('"Ik ga je verslaan. Dit seizoen."', 'fel', () => { zetRivaalBand(-10); mod('focus', 5); return '"Dat zien we nog," zegt ' + vr.hij + '. De fotografen hebben het allemaal vastgelegd.'; })]};
    return {
      tekst:['Een ploeggenoot met wie je jaren samen speelt, vertelt dat ' + team.hij + ' stopt. ' + team.Zijn + ' knie wil niet meer.', '"Ik ga je missen in de kleedkamer," zegt ' + team.hij + '. "Jij bent er nu een van de ouderen."'],
      opa:'"Elke carrière heeft een einde. Zorg dat je er geen spijt van hebt."',
      opts:[o('Een afscheidsetentje voor ' + team.hem + ' organiseren', 'kalm', () => { mod('vert', 2); mod('moraal', 4); return 'De hele groep komt. ' + team.Hij + ' is ontroerd.'; }),
        o('' + team.Hem + ' bedanken', 'bal', () => { mod('moraal', 3); return 'Een stevige omhelzing. Meer hoeft niet.'; }),
        o('Beloven dat je de titel voor ' + team.hem + ' wint', 'fel', () => { mod('focus', 5); return '' + team.Hij + ' lacht. "Dat hou ik je aan."'; })]};
  }},
  20: {wanneer:c => c.sz >= 5 ? (ovr(S.sp) >= 80 ? {nom:true} : (S.ronde >= WINTER || c.sz >= 6) ? {nom:false} : null) : null, inhoud:d => ({
    tekst:[d.nom ? 'Je bent genomineerd voor de Gouden Bal. Je staat op een rode loper, in een pak dat te strak zit.' : 'Je bent uitgenodigd op het gala van de Gouden Bal. Niet als genomineerde, maar als gast.',
      `${opaZin()} zit naast je${S.sp.relatie ? `, en ${S.sp.relatie.naam} ook` : ''}. Hij heeft zijn beste das om. Een journalist steekt een microfoon onder je neus: "Wat betekent zo'n avond voor je?"`],
    opa:'"Prijzen roesten. Herinneringen niet. Geniet van vanavond."',
    opts:[o('"Ik ben dankbaar dat ik hier mag zijn."', 'kalm', () => { mod('rep', 2); mod('moraal', 4); return 'Een bescheiden antwoord dat goed valt.'; }),
      o('"Ik geniet vooral van mijn opa naast me."', 'bal', () => { mod('moraal', 8); modFans(3); return 'De camera draait naar opa. Hij zwaait. Het filmpje gaat de hele wereld rond.'; }),
      o(d.nom ? '"Volgend jaar win ik hem."' : '"Volgend jaar sta ik op die lijst."', 'fel', () => { mod('focus', 5); modFans(3); return 'Een uitspraak die je nog vaak terughoort.'; })]})},
  21: {wanneer:c => c.sz >= 6 || (S.sp.leeftijd >= 29 && c.sz >= 4) ? {} : null, inhoud:() => ({
    tekst:[`Je hebt de top gehaald. ${isKeeper() ? `${nulTxt(S.car.nul || 0)} en ${S.car.red || 0} reddingen` : `${S.car.g} goals`} in je carrière, ${(S.car.prijzen || []).length} prijzen en onderscheidingen.`,
      `Op een zondag zit je bij ${opaZin()}. Hij bladert door een plakboek dat hij over jou bijhoudt. Het is al het derde.`],
    opa:isKeeper() ? '"Weet je wat het mooiste is? Niet de reddingen. Dat je nog steeds elke zondag langskomt."' : '"Weet je wat het mooiste is? Niet de goals. Dat je nog steeds elke zondag langskomt."', opts:[]})},
  // ---------- Deel 4: Het afscheid ----------
  22: {wanneer:() => S.sp.leeftijd >= 30 ? {} : null, inhoud:() => ({
    tekst:['Dertig. Je herstelt trager na een wedstrijd. Bij de sprinttest ben je voor het eerst niet de snelste.', 'De clubarts zegt: "Je kunt nog jaren mee. Als je slim bent."'],
    opa:'"Op mijn dertigste dacht ik dat ik nog alles kon. Mijn knie dacht daar anders over."',
    opts:[o('Een extra herstelprogramma: yoga, slaap, voeding', 'kalm', () => { S.sp.a.cond = Math.min(99, (S.sp.a.cond || 50) + 2); return 'Het voelt suf, maar je benen voelen weer fris.'; }),
      o('Minder trainen, slimmer spelen', 'bal', () => { mod('focus', 4); return 'Je leest het spel beter dan ooit.'; }),
      o('Gewoon doordrukken, zoals altijd', 'fel', () => { mod('moraal', 4); S.sp.fit = Math.max(0, (S.sp.fit || 80) - 4); return 'Niemand vertelt jou wanneer je oud bent.'; })]})},
  23: {wanneer:() => S.sp.leeftijd >= 31 ? {} : null, inhoud:() => ({
    tekst:[`Er traint een ${team.jongen} van zestien mee bij ${club().n}. ${team.Hij} speelt op jouw positie en is snel, brutaal en goed. Het doet je ergens aan denken.`,
      '"Mag ik na de training met je meetrainen?" vraagt ' + team.hij + '.'],
    opa:'"Ooit was jij die ' + ik.jongen + '. Iemand heeft jou toen ook geholpen."',
    opts:[o('' + team.Zijn + ' mentor worden', 'kalm', () => { mod('vert', 4); mod('moraal', 4); return 'Je leert ' + team.hem + ' alles wat je weet. ' + team.Hij + ' leert jou weer wat lachen is.'; }),
      o('' + team.Hem + ' af en toe een tip geven', 'bal', () => { mod('moraal', 2); return 'Kort, maar waardevol. ' + team.Hij + ' hangt aan je lippen.'; }),
      o('"Eerst mijn plek maar eens afpakken."', 'fel', () => { mod('focus', 5); return '' + team.Hij + ' grijnst. "Afgesproken." Jullie gaan elkaar elke training te lijf.'; })]})},
  24: {wanneer:(c, J) => S.sp.leeftijd >= 32 ? {oud:CLUBS[J.club1] ? CLUBS[J.club1].n : 'je eerste club', zelfde:J.club1 === S.sp.club} : null, inhoud:d => d.zelfde ? {
    tekst:[`Je speelt nog altijd bij ${club().n}, de club waar het allemaal begon. Er komt een mooi aanbod uit het buitenland: een laatste avontuur, met zon en veel geld.`, 'Je zaakwaarnemer wacht op je antwoord.'],
    opa:'"Ik heb altijd gedacht dat jij een clubman was. Maar jij weet dat beter dan ik."',
    opts:[o('"Ik eindig waar ik begon."', 'kalm', () => { modFans(8); mod('moraal', 4); return 'De fans maken er een spandoek van: "Eén van ons. Voor altijd."'; }),
      o('"Ik denk erover na."', 'bal', () => { mod('moraal', 2); return 'Je laat het even rusten.'; }),
      o('"Een laatste avontuur. Waarom niet?"', 'fel', () => { mod('moraal', 3); modFans(-3); return 'Het idee laat je niet meer los.'; })]} : {
    tekst:[`Een bekend nummer op je telefoon: de technisch directeur van ${d.oud || 'je eerste club'}, waar je je eerste profcontract tekende.`, '"We willen je terug. Een laatste seizoen, thuis. De fans zouden het geweldig vinden."'],
    opa:'"Thuis is waar ze je naam nog kennen als je hem zelf vergeten bent."',
    opts:[o('"Dat zou mooi zijn. Laten we praten."', 'kalm', () => { mod('moraal', 6); return 'Je mag het rustig overwegen. De deur staat open.'; }),
      o('"Ik kijk eerst hoe dit seizoen gaat."', 'bal', () => { mod('focus', 3); return '"Begrijpelijk. Je weet ons te vinden."'; }),
      o('"Ik ben nog niet klaar om terug te gaan."', 'fel', () => { mod('focus', 5); return 'Je wilt nog één keer laten zien wat je kunt, hier.'; })]}},
  25: {wanneer:() => S.sp.leeftijd >= 34 && S.ronde >= laatsteWeek() - 1 ? {} : null, inhoud:() => {
    const r = rol(), v = vn();
    return {tekst:['Dit wordt waarschijnlijk je laatste wedstrijd. Je weet het, de club weet het, de fans weten het: er hangen spandoeken met je gezicht.',
      `Op de tribune: ${opaZin()}, je ouders${S.sp.relatie ? `, ${S.sp.relatie.naam}` : ''}${(S.sp.kinderen || []).length ? ' en je kinderen' : ''}. ${r === 'vriend' ? `En ${v}, in jouw shirt.` : r === 'rivaal' ? `En, tot je verbazing, ${v}. ${vr.Hij} steekt ${vr.zijn} duim op.` : ''}`],
      opa:'"Het laatste fluitsignaal is niet het einde. Het is het begin van alle verhalen die je gaat vertellen."',
      opts:[o('Rustig van elk moment genieten', 'kalm', () => { mod('moraal', 8); return 'Je kijkt rond in het stadion, en probeert alles te onthouden.'; }),
        o('Het vieren met de fans', 'bal', () => { modFans(6); return 'Je loopt een rondje langs alle tribunes. Iedereen staat.'; }),
        o('"Ik ga er nog één keer alles uithalen."', 'fel', () => { mod('focus', 8); return 'Je wilt winnen. Zoals altijd.'; })]};
  }},
  26: {wanneer:() => null, inhoud:() => {
    const sp = S.sp, r = rol(), v = vn(), clubs = new Set((S.car.clubs || []).map(c => c.club)).size;
    return {tekst:[`Het is voorbij. ${S.car.wed} wedstrijden, ${isKeeper() ? `${nulTxt(S.car.nul || 0)} en ${S.car.red || 0} reddingen` : `${S.car.g} goals en ${S.car.a} assists`}, bij ${clubs} ${clubs === 1 ? 'club' : 'clubs'}.`,
      r === 'vriend' ? `${v} en jij zijn je hele carrière vrienden gebleven. Het begon met ${penalty()}. Dat verhaal vertellen jullie nog steeds op verjaardagen.`
        : r === 'rivaal' ? (sp.rivaal.band >= 30 ? `${v} en jij werden rivalen, maar jullie hebben het uitgepraat. ${vr.Hij} zit naast je op je afscheidsfeest.` : `${v} en jij zijn rivalen gebleven. Soms vraag je je af hoe het anders had kunnen lopen. Misschien bel je ${vr.hem} morgen.`)
        : 'Je ' + vr.jeugdvriend + ' en jij zijn uit elkaar gegroeid, zoals dat gaat. Maar die foto met de beker hangt nog altijd bij je ouders.',
      `Je zit naast ${opaNaam()} op de bank, waar je als kind alle wedstrijden keek. Hij pakt het oude plakboek: het eerste knipsel is van een jeugdtoernooi op een veld vol plassen. ${MAKELAAR} komt er niet in voor.`],
      opa:'"Weet je nog wat ik zei, na je eerste seizoen? Dat je verder zou komen dan ik. Ik had gelijk. Ik heb altijd gelijk."', opts:[]};
  }},
};
