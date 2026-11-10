import { S } from '../../core/state.js';
import { pick } from '../../core/utils.js';

/* ===================== Juichdansen ===================== */
// Na een eigen goal kies je hoe je hem viert (wedstrijd.js: dansKies). Alleen show: geen effect op fans, kaarten of moraal.
// De bewegingen staan als houdingen in render/veld3d.js (POSE, dezelfde naam als de id) en het script in render/pitch.js (soort 'dans').
// vanaf: zoveel carrièregoals heb je nodig voor deze dans.
export const DANSEN = [
  {id:'heupwieg',     n:'Heupwieg',     i:'💃', vanaf:0,  s:'Heupen los, armen mee, op de maat van het stadion',
    log:['Je wiegt met je heupen bij de hoekvlag. Het publiek klapt mee.', 'Heupen los! Je teamgenoten lachen en doen een poging mee te doen.']},
  {id:'vliegtuig',    n:'Vliegtuig',    i:'✈️', vanaf:0,  s:'Armen wijd en een rondje langs de zijlijn',
    log:['Armen wijd: je vliegt langs de zijlijn, met een bocht om de hoekvlag.', 'Je maakt een landing langs de reclameborden. Het publiek gaat staan.']},
  {id:'kracht',       n:'Krachtpose',   i:'💪', vanaf:0,  s:'Biceps spannen en een oerkreet naar de tribune',
    log:['Je spant je biceps en brult naar de tribune.', 'Krachtpose bij de hoekvlag. De fotografen kunnen hun geluk niet op.']},
  {id:'knieslide',    n:'Knieslide',    i:'🛷', vanaf:0,  s:'Op je knieën over het gras glijden',
    log:['Je glijdt op je knieën over het natte gras, armen in de lucht.', 'Een knieslide van een meter of vijf. De groundsman is minder blij.']},
  {id:'robot',        n:'Robot',        i:'🤖', vanaf:3,  s:'Stijve armen, schokkerig op de maat',
    log:['Je doet de robot. Stijf, schokkerig en heel serieus.', 'Piep, krak: de robot bij de hoekvlag. Je teamgenoten liggen dubbel.']},
  {id:'kangoeroe',    n:'Kangoeroe',    i:'🦘', vanaf:10, s:'Hoge sprongen met je knieën omhoog',
    log:['Als een kangoeroe spring je langs de zijlijn.', 'Sprong na sprong: je lijkt wel op een trampoline te staan.']},
  {id:'pirouette',    n:'Pirouette',    i:'🌀', vanaf:25, s:'Twee keer rond op je tenen, armen omhoog',
    log:['Een pirouette op je tenen, met de armen sierlijk omhoog. Applaus!', 'Twee keer rond, en dan armen wijd. Het hele stadion staat op.']},
  {id:'boogschutter', n:'Boogschutter', i:'🏹', vanaf:50, s:'Je spant een boog en schiet een pijl de tribune in',
    log:['Je spant een onzichtbare boog en schiet een pijl recht de tribune in.', 'De boogschutter: richten, spannen, los. Raak!']},
  {id:'polonaise',    n:'Teamdans',     i:'🕺', vanaf:80, s:'Je teamgenoten sluiten in een rij achter je aan',
    log:['Een voor een sluiten je teamgenoten achter je aan. Een polonaise bij de hoekvlag!', 'De hele ploeg danst in een rij achter je aan. De scheids kijkt op zijn horloge.']},
];
export const dansVan = id => DANSEN.find(d => d.id === id) || null;
// Carrièregoals tot nu toe (S.car.g telt pas na afloop van de wedstrijd mee)
export const goalsNu = () => ((S.car && S.car.g) || 0) + ((S.M && S.M.goals) || 0);
export const dansVrij = (g = goalsNu()) => DANSEN.filter(d => d.vanaf <= g);
export const volgendeDans = (g = goalsNu()) => DANSEN.find(d => d.vanaf > g) || null;
// Je favoriet (de laatst gekozen dans) eerst, daarna de rest op volgorde
export function dansLijst(){
  const vrij = dansVrij(), fav = S.sp && S.sp.dans && vrij.find(d => d.id === S.sp.dans);
  return fav ? [fav, ...vrij.filter(d => d !== fav)] : vrij;
}
// Welke dansen zijn net vrijgekomen (één keer melden). Bij de eerste keer tellen de startdansen niet als nieuw
export function nieuwVrij(){
  const sp = S.sp; if (!sp) return [];
  const gezien = sp.dansGezien = sp.dansGezien || DANSEN.filter(d => d.vanaf === 0).map(d => d.id);
  const nieuw = dansVrij().filter(d => !gezien.includes(d.id));
  for (const d of nieuw) gezien.push(d.id);
  return nieuw;
}
export const dansTekst = d => pick(d.log);
