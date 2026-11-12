import { S, club } from '../../core/state.js';
import { fotoVan } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { karakterZin } from './persoonlijkheid.js';
import { ik, team } from '../../core/geslacht.js';
import { AGENT } from '../../data/gegevens.js';

/* ===================== Hoe begint je carrière? ===================== */
// Je kiest je leeftijd, en elke leeftijd heeft een eigen verhaal: het wonderkind, de gewone start en de laatbloeier.
// extra: zoveel komt er bij elke eigenschap bij. Zo begin je rond het niveau van de onderste clubs (15 jaar ±49, 18 ±54, 23 ±57; de 2e league is ±52-65)
// Op je 15e en 18e begin je met 3 selectiewedstrijden (selectie.js): die bepalen bij welke club en in welke league je tekent.
// Op je 23e niet: dan regelt je zaakwaarnemer een proeftraining en een oefenwedstrijd bij een club (proef.js).
export const LEEFTIJDEN = [15, 18, 23];
export const START = {
  15:{id:'wonder', titel:'Wonderkind', kort:'Je bent 15 en scouts fluisteren je naam al. Veel talent, maar ook veel druk: iedereen verwacht dat jij het gaat maken.',
    waar:'3 selectiewedstrijden · school · talentcoach, media, scouts', extra:10, pot:[86, 96], rep:8, vert:55, geld:50, woning:'ouders', rijbewijs:false, auto:null},
  18:{id:'normaal', titel:'Gewoon beginnen', kort:'Je bent 18 en net klaar met school. Geen hype, gewoon hard werken: laat op de selectiedagen zien wat je kunt.',
    waar:'3 selectiewedstrijden · avondschool, eerste salaris', extra:15, pot:[72, 90], rep:3, vert:55, geld:600, woning:'ouders', rijbewijs:false, auto:null},
  23:{id:'bewijs', titel:'Laatbloeier', kort:'Je bent 23. Je amateurclub heeft je weggestuurd en je denkt dat je carrière voorbij is. Tot je oude vriend belt: hij is net zaakwaarnemer en heeft een kans voor je geregeld.',
    get waar(){ return 'proeftraining en oefenwedstrijd · fysio, mentor van de ' + team.jongens; }, extra:18, pot:[66, 82], rep:4, vert:45, geld:4000, woning:'studio', rijbewijs:true, auto:'oud'},
};
export const startVoor = lft => START[lft] || START[15];
// Welkomsttekst boven de eerste trainingsweek, per verhaal (oude saves zonder verhaal krijgen de tekst van het wonderkind)
export const WELKOM = {
  wonder:'Je eerste training bij je nieuwe club. Je bent de jongste van de groep en iedereen kijkt naar je: is dat het wonderkind? De droom is groot: ooit speel je in een vol stadion.',
  normaal:'Je eerste training bij je nieuwe club. De kleedkamer ruikt naar diepwarmte en de oudere spelers kijken je even aan: is dat jonkie al klaar voor dit niveau? Tijd om te laten zien wat je kunt.',
  bewijs:'Je eerste training bij je nieuwe club. Je bent ouder dan de meeste nieuwkomers, maar je weet hoe het werkt. Dit is je laatste kans om het te laten zien.',
};
export const welkomTekst = sp => WELKOM[sp.startVerhaal] || WELKOM.wonder;
// Eerste week: wat je meemaakt, en een artikel met een foto van jou in de krant (u: de uitslag van de selectiedagen)
export function startIntro(u){
  const sp = S.sp, c = club().n, V = startVoor(sp.leeftijd), w = S.week.tekst, waar = u && u.o23 ? `de O23 van ${c}` : c;
  const fmt = x => String((x ?? 0).toFixed(1)).replace('.', ',');
  const gem = u ? ` Gemiddeld haalde je een ${String(u.gem.toFixed(1)).replace('.', ',')} in de selectiewedstrijden.` : '';
  if (u && u.proef) w.push(`Het is gelukt! Na de proeftraining (${fmt(u.training)}) en de oefenwedstrijd (${fmt(u.wed)}) biedt ${c} je een contract. Vandaag train je voor het eerst mee met de selectie. ${AGENT} stuurt een appje: "Zie je wel. Nu begint het pas."`);
  else if (u && u.o23) w.push(`De selectiedagen zijn voorbij.${gem} Dat was niet genoeg voor een plek in een selectie, maar ${c} ziet iets in je. Bij de O23 moet je je bewijzen: speel goed en de trainer haalt je naar het eerste.`);
  else if (u) w.push(`De selectiedagen zijn voorbij.${gem} Vandaag train je voor het eerst mee met de selectie van ${c}${club().t === 1 ? ', een club uit de hoogste league' : ''}.`);
  if (V.id === 'wonder'){
    w.push('Je ouders zijn trots, maar je moeder zegt ook: "School gaat voor, ' + ik.jongen + '." Talent heb je genoeg. Nu moet je laten zien dat je de druk aankunt.');
    krantMelding(`Wonderkind (15) tekent bij ${waar}: "Deze ${ik.jongen} gaat ver komen"`, `De scouts van ${c} zijn lyrisch over ${sp.naam}. "Zo'n talent zie je maar eens in de tien jaar."${karakterZin()}`, null, fotoVan('portret', `${sp.naam} (15) op ${ik.zijn} eerste dag bij ${c}.`));
  } else if (V.id === 'normaal'){
    w.push('Niemand verwacht wonderen van je. Dat is ook wel lekker: je kunt rustig groeien. Speel goed, dan komen de grotere clubs vanzelf.');
    krantMelding(`${sp.naam} (18) tekent bij ${waar}`, `De trainer: "Een harde werker. We gaan zien hoe ver ${ik.hij} kan komen."${karakterZin()}`, null, fotoVan('portret', `${sp.naam} (18) bij ${ik.zijn} eerste training bij ${c}.`));
  } else {
    w.push('Je bent ouder dan de meeste ' + team.jongens + ' die hier binnenkomen. Je hebt minder tijd om te groeien, maar je weet wel hoe het werkt.');
    krantMelding(`Laatste kans voor ${sp.naam} (23) bij ${waar}`, `${ik.Hij} werd weggestuurd bij ${ik.zijn} amateurclub en dacht dat het voorbij was. Via een proeftraining overtuigde ${ik.hij} ${c} alsnog.${karakterZin()}`, null, fotoVan('portret', `${sp.naam} (23) tekent bij ${c}.`));
  }
}
