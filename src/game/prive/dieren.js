import { S, mod, seizoenLabel } from '../../core/state.js';
import { pick, rnd, shuffle } from '../../core/utils.js';
import { roddel } from '../media/roddel.js';
import { postGroei, social, volgerMijlpaal, volgersTxt } from './social.js';
import { focusBoost } from '../wedstrijd/momenten.js';

/* ===================== Huisdieren ===================== */
// Tot drie huisdieren, elk met een eigen naam, kosten en dingen die je ermee kunt doen
export const DIERNAMEN = {
  hond:['Penalty', 'Bal', 'Max', 'Buddy', 'Kees', 'Lola', 'Rocky', 'Pip'], kat:['Messi', 'Minoes', 'Tijger', 'Luna', 'Snor', 'Pluis', 'Oscar', 'Nala'],
  konijn:['Flappie', 'Snuffel', 'Wortel', 'Pluk', 'Dribbel', 'Hop'], papegaai:['Kapitein', 'Rio', 'Kiki', 'Coco', 'Pelé', 'Polly'], hamster:['Nibbles', 'Turbo', 'Pinda', 'Bolletje', 'Sprintje', 'Koekje']};
export const DIEREN = {
  hond:    {n:'hond',     prijs:400, kost:15, hij:true,  d:'€400 · €15 per week · past niet in een studio'},
  kat:     {n:'kat',      prijs:150, kost:8,  hij:false, d:'€150 · €8 per week'},
  konijn:  {n:'konijn',   prijs:60,  kost:4,  hij:true,  d:'€60 · €4 per week'},
  papegaai:{n:'papegaai', prijs:800, kost:6,  hij:true,  d:'€800 · €6 per week · leert praten'},
  hamster: {n:'hamster',  prijs:30,  kost:2,  hij:true,  d:'€30 · €2 per week'}
};
export const MAX_DIEREN = 3;
export const dieren = () => S.sp.dieren || (S.sp.dieren = []);
export function neemDier(soort){
  const sp = S.sp, D = DIEREN[soort]; if (!D || dieren().length >= MAX_DIEREN || sp.geld < D.prijs) return;
  if (soort === 'hond' && sp.woning === 'studio') return;
  sp.geld -= D.prijs;
  const al = dieren().map(d => d.naam), namen = shuffle(DIERNAMEN[soort].filter(n => !al.includes(n))).slice(0, 4);
  S.ev = {soort:'prive', tekst:`Je haalt een ${D.n} op${soort === 'hond' || soort === 'kat' ? ' bij het asiel' : ' bij de dierenwinkel'}. Hoe ga je ${D.hij ? 'hem' : 'haar'} noemen?`, opts:namen.map(naam => ({l:naam, f(){
    dieren().push({soort, naam, trucs:0, weken:0}); mod('moraal', 6); S.car.hist.push(`${seizoenLabel()}: ${D.n} ${naam} in huis genomen`);
    roddel(`${sp.naam} heeft een nieuwe ${D.n}: ${naam}`, 'De eerste foto heeft al duizenden likes.'); return `Welkom thuis, ${naam}! ${dieren().length > 1 ? `De andere ${dieren().length > 2 ? 'dieren kijken' : 'dier kijkt'} nieuwsgierig toe.` : ''}`; }}))};
  S.fase = 'event';
}
export function herplaats(i){ const sp = S.sp, d = dieren()[i]; if (!d) return; dieren().splice(i, 1); mod('moraal', -6); S.week.tekst.push(`Met pijn in je hart breng je ${d.naam} naar een nieuw thuis. Daar heeft ${DIEREN[d.soort].hij ? 'hij' : 'ze'} meer ruimte.`); }
export const DIER_ACTIES = {
  hond:    [['uitlaten', 'Uitlaten in het park', 'moraal +2 · focus +2'], ['trucje', 'Trucjes leren', 'kans op een nieuw trucje'], ['strand', 'Naar het strand', '€20 · moraal +5']],
  kat:     [['knuffel', 'Knuffelen op de bank', 'moraal +3 · focus +2'], ['trucje', 'Trucjes leren', 'katten doen wat ze willen'], ['speeltje', 'Nieuw speeltje kopen', '€10 · moraal +3']],
  konijn:  [['knuffel', 'Knuffelen', 'moraal +3 · focus +2'], ['tuin', 'Laten rennen in de tuin', 'moraal +3'], ['speeltje', 'Een nieuw hok kopen', '€40 · moraal +4']],
  papegaai:[['praten', 'Woordjes leren', 'kans dat hij iets nieuws zegt'], ['knuffel', 'Op je schouder zetten', 'moraal +3 · focus +1'], ['speeltje', 'Nieuw speeltje kopen', '€10 · moraal +2']],
  hamster: [['rad', 'Een groter rad kopen', '€15 · moraal +2'], ['knuffel', 'Even vasthouden', 'moraal +2 · focus +2'], ['speeltje', 'Een tunnel bouwen', 'moraal +3']]
};
export const PAPEGAAI = ['"GOAL! GOAL!"', '"Scheids, kijk dan!"', '"Buitenspel!"', `"Hup, hup, hup!"`, '"Penalty!"', '"Wat een redding!"'];
export function dierActie(id, i){
  const sp = S.sp, w = S.week, d = dieren()[i || 0]; if (!d || w.dier) return; let t;
  if (id === 'uitlaten'){ mod('moraal', 2); focusBoost(2); t = `Je laat ${d.naam} uit door het park. Even helemaal niks aan je hoofd.`; }
  else if (id === 'trucje'){ mod('moraal', 3); if (rnd() < (d.soort === 'kat' ? .25 : .5)){ d.trucs++; t = `${d.naam} heeft een nieuw trucje geleerd!`; if (d.trucs === 3){ const n = postGroei(4); social().volgers += n; t += ` Je filmt hoe ${d.naam} een bal hooghoudt. Het filmpje gaat viraal: +${volgersTxt(n)} volgers.`; const m = volgerMijlpaal(); if (m) t += ' ' + m; } } else t = `${d.naam} kijkt je schuin aan en gaat liggen. Morgen weer proberen.`; }
  else if (id === 'strand'){ sp.geld = Math.max(0, sp.geld - 20); mod('moraal', 5); mod('fit', -2); t = `Een dag met ${d.naam} naar het strand. Hij rent als een gek achter de meeuwen aan.`; }
  else if (id === 'knuffel'){ mod('moraal', 3); focusBoost(d.soort === 'papegaai' ? 1 : 2); t = d.soort === 'papegaai' ? `${d.naam} zit op je schouder en knabbelt aan je oor.` : `${d.naam} ligt heerlijk bij je. Rustiger word je niet.`; }
  else if (id === 'speeltje'){ const prijs = d.soort === 'konijn' ? 40 : 10; sp.geld = Math.max(0, sp.geld - prijs); mod('moraal', d.soort === 'konijn' ? 4 : 3); t = d.soort === 'kat' ? `${d.naam} negeert het speeltje en speelt met de doos.` : `${d.naam} is helemaal blij met het nieuwe ${d.soort === 'konijn' ? 'hok' : 'speeltje'}.`; }
  else if (id === 'tuin'){ mod('moraal', 3); t = `${d.naam} maakt rondjes door de tuin en springt van blijdschap.`; }
  else if (id === 'praten'){ mod('moraal', 2); if (rnd() < .5){ d.trucs++; const z = pick(PAPEGAAI); t = `${d.naam} zegt ineens: ${z} Je ligt dubbel.`; if (d.trucs === 3){ const n = postGroei(5); social().volgers += n; t += ` Het filmpje van je pratende papegaai gaat de hele wereld over: +${volgersTxt(n)} volgers.`; } } else t = `${d.naam} kijkt je aan en zegt... niks.`; }
  else if (id === 'rad'){ sp.geld = Math.max(0, sp.geld - 15); mod('moraal', 2); t = `${d.naam} rent de hele nacht in het nieuwe rad. Jij hoort het ook.`; }
  if (!t) return; w.dier = id; w.tekst.push(t);
}
