import { S, club } from '../../core/state.js';
import { pick } from '../../core/utils.js';
import { AMATEUR, CLUBS, JEUGD, divClubs } from '../../data/gegevens.js';
import { fotoVan } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';

/* ===================== Hoe begint je carrière? ===================== */
// Je kiest je leeftijd, en elke leeftijd heeft een eigen verhaal: het wonderkind, de gewone start en de laatbloeier
export const LEEFTIJDEN = [15, 18, 23];
export const START = {
  15:{id:'wonder', titel:'Wonderkind', kort:'Je bent 15 en scouts fluisteren je naam al. Veel talent, maar ook veel druk: iedereen verwacht dat jij het gaat maken.',
    waar:'O19 (jeugd) · school · talentcoach, media, scouts', extra:0, pot:[86, 96], rep:8, vert:55, t:JEUGD, geld:50, woning:'ouders', rijbewijs:false, auto:null},
  18:{id:'normaal', titel:'Gewoon beginnen', kort:'Je bent 18, net klaar met school en uit de jeugd. Je mag mee met het eerste elftal. Geen hype, gewoon hard werken.',
    waar:'Amateurklasse · 1e elftal · bijbaan, derde helft, avondschool', extra:7, pot:[72, 90], rep:3, vert:55, t:AMATEUR, geld:600, woning:'ouders', rijbewijs:false, auto:null},
  23:{id:'bewijs', titel:'Jezelf bewijzen', kort:'Je bent 23. Als tiener werd je weggestuurd bij een profjeugd. Nu krijg je een proefcontract bij een semi-profclub: je laatste kans.',
    waar:'Tweede Divisie · proefcontract · fysio, bijbaan, mentor van de jongens', extra:12, pot:[66, 82], rep:4, vert:40, t:3, geld:4000, woning:'studio', rijbewijs:true, auto:'oud'},
};
export const startVoor = lft => START[lft] || START[15];
// Welkomsttekst boven de eerste trainingsweek, per verhaal (oude saves zonder verhaal krijgen de jeugdtekst)
export const WELKOM = {
  wonder:'Je eerste training bij de jeugd. De trainer is ook de vader van de keeper en fluit op een theelepeltje. De ballen zijn half lek, maar de droom is groot: ooit speel je in een vol stadion.',
  normaal:'Je eerste training met het eerste elftal. De kleedkamer ruikt naar diepwarmte en de oudere spelers kijken je even aan: is dat jonkie al klaar voor de senioren? Op zondag staan er meer mensen langs de lijn dan je gewend bent. Tijd om te laten zien wat je kunt.',
  bewijs:'Je eerste training als semi-prof. Er staan camera\'s langs het veld, de trainer werkt met video-analyse en iedereen is superfit. Het tempo ligt hoger dan je gewend bent, en je weet: dit is je laatste kans om het te laten zien.',
};
export const welkomTekst = sp => WELKOM[sp.startVerhaal] || WELKOM.wonder;
// De club waar je begint. De laatbloeier begint bij een van de zwakkere clubs van zijn divisie
export function startClub(V){
  const lijst = divClubs(V.t);
  if (V.id !== 'bewijs') return pick(lijst);
  const zwak = [...lijst].sort((a, b) => CLUBS[a].s - CLUBS[b].s);
  return pick(zwak.slice(0, Math.max(1, Math.ceil(zwak.length / 2))));
}
// Eerste week: wat je meemaakt, en een artikel met een foto van jou in de krant
export function startIntro(){
  const sp = S.sp, c = club().n, V = startVoor(sp.leeftijd), w = S.week.tekst;
  if (V.id === 'wonder'){
    w.push(`Je eerste training bij ${c}. Er staan al twee scouts langs het veld, en ze kijken alleen naar jou. "Dat is hem," hoor je iemand fluisteren.`);
    w.push('Je ouders zijn trots, maar je moeder zegt ook: "School gaat voor, jongen." Talent heb je genoeg. Nu moet je laten zien dat je de druk aankunt.');
    krantMelding(`Wonderkind (15) tekent bij ${c}: "Deze jongen gaat ver komen"`, `De jeugdtrainer van ${c} is lyrisch over ${sp.naam}. "Zo'n talent zie je maar eens in de tien jaar."`, null, fotoVan('portret', `${sp.naam} (15) op zijn eerste dag bij ${c}.`));
  } else if (V.id === 'normaal'){
    w.push(`Je hebt je diploma op zak en vandaag train je voor het eerst mee met het eerste elftal van ${c}. De oudere spelers kijken je even aan: wie is dat jonkie?`);
    w.push('Niemand verwacht wonderen van je. Dat is ook wel lekker: je kunt rustig groeien. Speel goed, dan komen de clubs vanzelf.');
    krantMelding(`${sp.naam} (18) maakt de stap naar het eerste van ${c}`, `De trainer: "Een harde werker. We gaan zien hoe ver hij kan komen."`, null, fotoVan('portret', `${sp.naam} (18) bij zijn eerste training met het eerste van ${c}.`));
  } else {
    w.push(`Je tekent een proefcontract bij ${c}. De trainer is eerlijk: "Ik geef je een kans omdat je ervaring hebt. Laat tot de winterstop zien dat je dit niveau aankunt, anders houdt het op."`);
    w.push('Je bent ouder dan de meeste jongens in de kleedkamer. Je hebt minder tijd om te groeien, maar je weet wel hoe het werkt. Dit is je laatste kans.');
    krantMelding(`Laatste kans voor ${sp.naam} (23): proefcontract bij ${c}`, `Jaren speelde hij in de lagere amateurs. Nu krijgt ${sp.naam} een kans bij ${c}. "Tot de winterstop moet hij zich bewijzen," zegt de trainer.`, null, fotoVan('portret', `${sp.naam} (23) tekent zijn proefcontract bij ${c}.`));
  }
}
