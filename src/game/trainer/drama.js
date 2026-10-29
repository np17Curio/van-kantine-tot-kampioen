import { S } from '../../core/state.js';
import { clamp, pick, randInt, rnd } from '../../core/utils.js';
import { CLUBS, divClubs } from '../../data/gegevens.js';
import { selectie } from '../competitie/spelers.js';
import { metVoorletter } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { herschik, noteerDeal } from '../transfers/markt.js';
import { mijnSel, opst, pasToe, refKracht } from './ploeg.js';
import { herbereken, prijs } from './transfers.js';
import { team } from '../../core/geslacht.js';

/* ===================== Trainer: drama in de kleedkamer ===================== */
// Elke week een kans op een voorval met spelers uit je selectie. Het staat als data in S.trainer.drama (soort + namen),
// de keuzes en hun gevolgen staan hier in de tabel, zodat het opslaan overleeft.
const vind = n => mijnSel().find(x => x.n === n) || null;
const naam = n => { const x = vind(n); return x ? metVoorletter(x) : n; };
const moraal = d => { const T0 = S.trainer; T0.moraal = clamp(T0.moraal + d, 20, 100); };
const bestuur = d => { const T0 = S.trainer; T0.bestuur = clamp(T0.bestuur + d, 0, 100); };
export const fans = d => { const T0 = S.trainer; T0.fans = clamp((T0.fans ?? 50) + d, 0, 100); };
const ontevreden = (n, w) => { const x = vind(n); if (x) x.ontevreden = Math.max(x.ontevreden || 0, w); };
const tevreden = n => { const x = vind(n); if (x) x.ontevreden = 0; };

export const DRAMA = {
  speeltijd:{
    tekst:D => `${naam(D.a)} komt je kantoor binnen. "Trainer, ik zit al weken op de bank. Ik ben beter dan dit. Ik wil spelen."`,
    opts:[
      {l:'"Je krijgt een basisplaats, beloofd."', toon:'bal', f(D){ S.trainer.belofte = {n:D.a, wed:3}; tevreden(D.a); return `${naam(D.a)} glundert. Maar let op: de komende 3 wedstrijden moet hij in de basis staan, anders voelt hij zich bedrogen.`; }},
      {l:'Een eerlijk gesprek over zijn rol', toon:'kalm', f(D){ if (rnd() < .6){ tevreden(D.a); moraal(2); return `${naam(D.a)} knikt. "Duidelijk, trainer. Ik ga ervoor knokken."`; } ontevreden(D.a, 3); return `${naam(D.a)} loopt boos weg. Hij is niet overtuigd.`; }},
      {l:'"Dan moet je harder werken op de training."', toon:'fel', f(D){ ontevreden(D.a, 4); moraal(2); return `${naam(D.a)} slaat de deur dicht. De rest van de groep ziet dat jij de baas bent (moraal +2), maar hij is ontevreden.`; }}]},
  telaat:{
    tekst:D => `${naam(D.a)} komt voor de derde keer deze maand te laat op de training. De groep kijkt naar jou: wat ga je doen?`,
    opts:[
      {l:'Een boete', toon:'bal', f(D){ bestuur(1); ontevreden(D.a, 2); return `${naam(D.a)} betaalt mopperend. De regels zijn de regels.`; }},
      {l:'Door de vingers zien', toon:'kalm', f(D){ moraal(-3); return `${naam(D.a)} is opgelucht, maar sommige spelers vinden het niet eerlijk (moraal -3).`; }},
      {l:'Een wedstrijd uit de selectie', toon:'fel', f(D){ const x = vind(D.a); if (x) x.schors = 1; moraal(3); ontevreden(D.a, 3); return `${naam(D.a)} mist de volgende wedstrijd. De groep snapt het signaal (moraal +3).`; }}]},
  ruzie:{
    tekst:D => `Op de training vliegen ${naam(D.a)} en ${naam(D.b)} elkaar in de haren. Ze moeten uit elkaar worden gehaald.`,
    opts:[
      {l:'Ze samen laten praten', toon:'kalm', f(D){ if (rnd() < .7){ moraal(3); return `Na een uur praten geven ze elkaar een hand. De sfeer is beter dan ooit (moraal +3).`; } ontevreden(D.a, 2); ontevreden(D.b, 2); return 'Het gesprek loopt uit op nog meer ruzie. Ze zijn allebei ontevreden.'; }},
      {l:'Allebei een boete', toon:'bal', f(){ moraal(-1); bestuur(1); return 'Allebei een boete. Niemand is blij, maar het is wel duidelijk.'; }},
      {l:D => `Partij kiezen voor ${naam(D.a)}`, toon:'fel', f(D){ ontevreden(D.b, 5); tevreden(D.a); return `${naam(D.a)} voelt zich gesteund. ${naam(D.b)} praat al weken niet meer met je.`; }}]},
  bod:{
    tekst:D => `${CLUBS[D.club].n} biedt ${Math.round(D.som / 1000).toLocaleString('nl-NL')}k euro voor ${naam(D.a)}, je beste ${team.speler}. ${team.Hij} wil zelf graag.`,
    opts:[
      {l:'Verkopen', toon:'bal', f(D){ return verkoop(D); }},
      {l:'Weigeren: hij is niet te koop', toon:'fel', f(D){ ontevreden(D.a, 6); fans(4); return `${naam(D.a)} is woedend: "Dit was mijn droomtransfer." De fans zijn blij dat hij blijft.`; }},
      {l:'Weigeren, met een beter contract', toon:'kalm', f(D){ const T0 = S.trainer, k = Math.round(D.som * .1 / 1000) * 1000; T0.budget = Math.max(0, T0.budget - k); tevreden(D.a); bestuur(-2); return `${naam(D.a)} blijft, met een flinke loonsverhoging (${Math.round(k / 1000)}k van je budget).`; }}]},
  media:{
    tekst:D => `In de krant: "${naam(D.a)} kritisch op trainer: 'Ik snap zijn keuzes niet.'" Iedereen wacht op jouw reactie.`,
    opts:[
      {l:'Publiekelijk terugpakken', toon:'fel', f(D){ ontevreden(D.a, 5); fans(3); moraal(-2); krantMelding(`Trainer ${S.sp.naam} haalt uit naar ${naam(D.a)}`, '"Wie kritiek heeft, komt maar naar mij. Niet naar de krant."'); return `De fans vinden het geweldig. In de kleedkamer is het onrustig.`; }},
      {l:'Intern oplossen', toon:'kalm', f(D){ if (rnd() < .65){ tevreden(D.a); moraal(1); return `Een goed gesprek. ${naam(D.a)} biedt zijn excuses aan bij de groep.`; } ontevreden(D.a, 3); return `${naam(D.a)} blijft bij zijn mening.`; }},
      {l:'Negeren', toon:'bal', f(){ bestuur(-2); return 'Je zegt er niets over. Het bestuur vindt dat je je gezag laat ondermijnen.'; }}]},
  uitje:{
    tekst:D => `${naam(D.a)} is jarig, en de groep vraagt of er na de training iets leuks kan.`,
    opts:[
      {l:'Een teamuitje regelen', toon:'bal', f(){ const T0 = S.trainer, k = T0.o23 ? 0 : Math.min(T0.budget, 25000); T0.budget -= k; moraal(6); return `Karten en daarna samen eten. De groep is hechter dan ooit (moraal +6)${k ? `, kosten ${Math.round(k / 1000)}k` : ''}.`; }},
      {l:'Taart op de training', toon:'kalm', f(D){ moraal(3); tevreden(D.a); return `Iedereen zingt voor ${naam(D.a)}. Klein gebaar, groot effect (moraal +3).`; }},
      {l:'"We zijn hier om te werken."', toon:'fel', f(){ moraal(-3); return 'De groep druipt teleurgesteld af (moraal -3).'; }}]},
};
// Verkopen aan de club die biedt
function verkoop(D){
  const T0 = S.trainer, sel = mijnSel(), x = sel.find(y => y.n === D.a); if (!x) return 'Hij is al weg.';
  const voor = refKracht();
  sel.splice(sel.indexOf(x), 1); selectie(T0.club); opst().ids = opst().ids.filter(n => n !== x.n);
  const sk = selectie(D.club); sk.push({...x, basis:false, ontevreden:0}); herschik(sk);
  T0.budget += D.som; T0.sz.saldo += D.som; herbereken(voor); pasToe(); fans(-5); bestuur(3);
  noteerDeal(T0.club, D.club, x, 'trainer', {som:D.som});
  krantMelding(`${CLUBS[T0.club].n} verkoopt ${metVoorletter(x)} aan ${CLUBS[D.club].n}`, `Een recordbedrag voor de club. De fans zijn er niet blij mee.`);
  return `${metVoorletter(x)} vertrekt. Er komt ${Math.round(D.som / 1000).toLocaleString('nl-NL')}k bij in je budget, maar de fans morren (fans -5).`;
}
// Elke week: een kans op een nieuw voorval (niet als er nog een openstaat)
export function maakDrama(){
  const T0 = S.trainer; if (T0.drama && !T0.drama.klaar) return;
  T0.drama = null; if (rnd() > .3) return;
  const sel = mijnSel().filter(x => !(x.bles > 0)), basis = sel.filter(x => x.basis), bank = sel.filter(x => !x.basis).sort((a, b) => b.k - a.k);
  const soorten = ['telaat', 'ruzie', 'media', 'uitje']; if (bank.length && bank[0].k >= Math.min(...basis.map(x => x.k)) - 1) soorten.push('speeltijd', 'speeltijd');
  if (!T0.o23 && basis.length) soorten.push('bod');
  const soort = pick(soorten), D = {soort};
  if (soort === 'speeltijd') D.a = bank[0].n;
  else if (soort === 'bod'){ const ster = basis.slice().sort((a, b) => b.k - a.k)[0], t = CLUBS[T0.club].t, kopers = divClubs(Math.max(1, t - 1)).concat(divClubs(t)).filter(i => i !== T0.club && CLUBS[i].s > CLUBS[T0.club].s);
    if (!kopers.length) return; D.a = ster.n; D.club = pick(kopers); D.som = Math.round(prijs(ster) * (1.4 + rnd() * .4) / 1000) * 1000; }
  else { const l = (soort === 'uitje' ? sel : basis).slice(); const a = l.splice(randInt(0, l.length - 1), 1)[0]; D.a = a && a.n; if (soort === 'ruzie' && l.length) D.b = pick(l).n; if (!D.a || (soort === 'ruzie' && !D.b)) return; }
  T0.drama = D;
}
export const dramaTekst = D => DRAMA[D.soort].tekst(D);
export const dramaOpties = D => DRAMA[D.soort].opts.map(o => ({l:typeof o.l === 'function' ? o.l(D) : o.l, toon:o.toon}));
export function dramaKeuze(i){
  const T0 = S.trainer, D = T0.drama; if (!D || D.klaar) return;
  D.uit = DRAMA[D.soort].opts[i].f(D); D.klaar = true; D.keuze = i;
}
// Wordt niet gekozen (snel spelen): de middelste, rustige weg
export function dramaAuto(){ const D = S.trainer.drama; if (D && !D.klaar) dramaKeuze(1); }
// Na de wedstrijd: een belofte nagekomen? Ontevredenheid zakt elke week een beetje
export function dramaNaWedstrijd(regels){
  const T0 = S.trainer, B = T0.belofte;
  if (B){ const x = vind(B.n);
    if (!x){ T0.belofte = null; }
    else if (!opst().ids.includes(B.n) && !(x.bles > 0)){ x.ontevreden = 4; moraal(-4); regels.push(`${metVoorletter(x)} zat niet in de basis, terwijl je het had beloofd. Hij voelt zich bedrogen (moraal -4).`); T0.belofte = null; }
    else if (--B.wed <= 0){ regels.push(`Je hield je belofte aan ${metVoorletter(x)}. Hij is weer helemaal blij.`); T0.belofte = null; } }
  for (const x of mijnSel()) if (x.ontevreden > 0) x.ontevreden--;
}
