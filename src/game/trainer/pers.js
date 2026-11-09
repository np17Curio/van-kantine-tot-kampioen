import { S } from '../../core/state.js';
import { clamp, pick, rnd } from '../../core/utils.js';
import { CLUBS } from '../../data/gegevens.js';
import { ACHTERNAMEN } from '../competitie/spelers.js';
import { stand } from '../competitie/spelers.js';
import { rivaal } from '../wedstrijd/fans-pers.js';
import { fans } from './drama.js';
import { vrouwenWereld } from '../../core/geslacht.js';

/* ===================== Trainer: pers, rivaliserende trainers en fans ===================== */
const VOORNAMEN = ['Frank', 'Ronald', 'Peter', 'Erik', 'John', 'Dick', 'Louis', 'Arne', 'Pascal', 'Marcel', 'Henk', 'Fred', 'Guus', 'Jürgen', 'Pep', 'Carlo', 'José', 'Diego', 'Mikel', 'Xabi'];
// Elke club heeft een vaste trainer (zolang jij daar niet zelf trainer bent)
// (in het vrouwenvoetbal is ongeveer de helft van de trainers een vrouw)
const VOORNAMEN_V = ['Sarina', 'Emma', 'Andries', 'Vera', 'Mark', 'Jonas', 'Sonia', 'Martina', 'Hesterine', 'Corinne', 'Jill', 'Pia'];
export function trainerVan(id){ let h = id * 7919 + 17; const L = vrouwenWereld() ? VOORNAMEN_V : VOORNAMEN; return `${L[h % L.length]} ${ACHTERNAMEN[(h * 31) % ACHTERNAMEN.length]}`; }
export const rivaalClub = () => { const T0 = S.trainer; if (!T0 || T0.o23) return null; const r = rivaal(T0.club); return r != null && CLUBS[r] && CLUBS[r].t === CLUBS[T0.club].t ? r : null; };
// Een duel tegen een trainer bijhouden (alleen de aartsrivaal krijgt een eigen regel in je prijzenkast)
export function noteerDuel(opp, a, b){
  const T0 = S.trainer, n = trainerVan(opp), D = (T0.duels = T0.duels || {})[n] = (T0.duels[n] || {club:CLUBS[opp].n, w:0, g:0, v:0});
  D.club = CLUBS[opp].n; if (a > b) D.w++; else if (a === b) D.g++; else D.v++;
  return D;
}
// De persconferentie voor de wedstrijd: bij een derby, een topper, de laatste rondes van een beker, of zomaar.
// Eerst de vraag over de wedstrijd, daarna nog een of twee vragen van andere journalisten (bij een derby of finale twee)
export function maakPersVoor(W){
  const T0 = S.trainer; T0.pers = null; if (!W) return;
  const opp = W.opp, n = trainerVan(opp), zij = CLUBS[opp].n, derby = opp === rivaalClub(), top = !T0.o23 && stand(CLUBS[T0.club].t).indexOf(opp) < 3 && stand(CLUBS[T0.club].t).indexOf(opp) >= 0;
  const groot = W.beker && /finale/i.test(W.beker.ronde);
  if (!(derby || top || groot || rnd() < .25)) return;
  const soort = derby ? 'derby' : groot ? 'beker' : top ? 'top' : 'gewoon';
  const drukVraag = 'Er wordt gespeculeerd over uw positie. Voelt u de druk?';
  const vraag = soort === 'derby' ? `Zondag de derby tegen ${zij}. Hun trainer ${n} zei vanochtend: "Wij zijn de beste club van de regio." Uw reactie?`
    : soort === 'beker' ? `${W.beker.naam}, ${W.beker.ronde.toLowerCase()} tegen ${zij}. Is uw ploeg er klaar voor?`
    : soort === 'top' ? `${zij} staat bovenin. Trainer ${n} noemt uw ploeg "een leuke ploeg, maar niet meer dan dat". Wat vindt u?`
    : pick([`Hoe gaat het met de ploeg voor de wedstrijd tegen ${zij}?`, `Trainer ${n} van ${zij} zegt dat hij uw speelwijze heeft ontleed. Bent u bang?`, drukVraag]);
  const eerste = {id:'wedstrijd', vraag, opts:[
    {l:soort === 'derby' ? `"Respect voor ${zij}. Wij doen ons ding."` : '"We nemen het wedstrijd voor wedstrijd. Respect voor de tegenstander."', toon:'kalm', fx:{bestuur:1}},
    {l:soort === 'beker' ? '"Klaar? We hebben hier het hele seizoen naartoe gewerkt."' : '"Mijn spelers zijn klaar. We gaan voor de winst."', toon:'bal', fx:{moraal:3}},
    {l:soort === 'derby' ? `"${n} praat veel. Zondag laten wij zien wie de baas is."` : `"Laat ${n} maar praten. Na zondag is hij stil."`, toon:'fel', fx:{fans:4, fel:true}, s:'mind games: jouw ploeg +1 en fans +, maar zij zijn ook gebrand; verlies komt dubbel hard aan'}]};
  const pool = [
    {id:'druk', vraag:drukVraag, opts:[
      {l:'"Druk hoort bij dit vak. Ik focus op het werk."', toon:'kalm', fx:{bestuur:2}},
      {l:'"Geen druk. Het bestuur en ik zitten op één lijn."', toon:'bal', fx:{moraal:2, bestuur:1}},
      {l:'"Het bestuur moet me gewoon laten werken. Klaar."', toon:'fel', fx:{bestuur:-3, moraal:2, fans:2}}]},
    {id:'fans', vraag:'Wat verwacht u zondag van het publiek?', opts:[
      {l:'"Steun, zoals altijd. Daar zijn we dankbaar voor."', toon:'kalm', fx:{fans:2}},
      {l:'"Een vol stadion. Wij zorgen voor de show."', toon:'bal', fx:{fans:3, moraal:1}},
      {l:'"Lawaai! Ze moeten de tegenstander gek maken."', toon:'fel', fx:{fans:4, moraal:2, bestuur:-1}}]},
    {id:'plan', vraag:`Hoe gaat u ${zij} pakken?`, opts:[
      {l:'"Dat houd ik lekker voor mezelf."', toon:'kalm', fx:{bestuur:1}},
      {l:'"We spelen ons eigen spel. Daar zijn we goed in."', toon:'bal', fx:{moraal:2}},
      {l:`"Ze weten nu al dat ze gaan verliezen."`, toon:'fel', fx:{fans:3, moraal:1, fel:true}}]},
    {id:'groep', vraag:'Hoe is de sfeer in de selectie?', opts:[
      {l:'"Rustig en geconcentreerd. Zo wil ik het hebben."', toon:'kalm', fx:{bestuur:1, moraal:1}},
      {l:'"Uitstekend. Iedereen vecht voor een plek."', toon:'bal', fx:{moraal:3}},
      {l:'"Wie niet honderd procent geeft, zit zondag op de tribune."', toon:'fel', fx:{moraal:-2, bestuur:1, fans:2}}]},
  ].filter(x => x.vraag !== vraag);
  const vragen = [eerste];
  for (let k = derby || groot ? 2 : 1; k > 0 && pool.length; k--) vragen.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  for (const v of vragen){ v.keuze = null; v.uit = null; for (const o of v.opts) o.s = o.s || fxTekst(o.fx); }
  T0.pers = {soort, opp, n, vraag, vragen};
}
const fxTekst = fx => [fx.bestuur && `bestuur ${fx.bestuur > 0 ? '+' : ''}${fx.bestuur}`, fx.moraal && `moraal ${fx.moraal > 0 ? '+' : ''}${fx.moraal}`, fx.fans && `fans ${fx.fans > 0 ? '+' : ''}${fx.fans}`, fx.fel && 'mind games: je moet het waarmaken'].filter(Boolean).join(' · ');
// De vragen (een oude opslag had er maar één, met de keuze in P zelf)
export function persVragenTrainer(P){
  if (!P) return [];
  if (!P.vragen) P.vragen = [{vraag:P.vraag, opts:(P.opts || []).map((o, i) => ({...o, fx:o.fx || [{bestuur:1}, {moraal:3}, {fans:4, fel:true}][i]})), keuze:P.keuze ?? null, uit:P.uit ?? null}];
  return P.vragen;
}
export const persOpenTrainer = P => persVragenTrainer(P).findIndex(v => v.keuze == null);
// Een antwoord op vraag q (standaard de eerste open vraag); latere vragen tellen iets minder zwaar. Geeft de uitkomst als tekst
export function persAntwoord(i, q){
  const T0 = S.trainer, P = T0.pers; if (!P) return null;
  const V = persVragenTrainer(P); if (q == null) q = persOpenTrainer(P);
  const v = V[q], o = v && v.opts[i]; if (!o || v.keuze != null) return null;
  v.keuze = i; P.keuze = P.keuze ?? i;
  const f = [1, .7, .5][q] ?? .5, sc = x => !x ? 0 : Math.sign(x) * Math.max(1, Math.round(Math.abs(x) * f)), fx = o.fx || {};
  const b = sc(fx.bestuur), m = sc(fx.moraal), fa = sc(fx.fans);
  if (b) T0.bestuur = clamp(T0.bestuur + b, 0, 100);
  if (m) T0.moraal = clamp(T0.moraal + m, 20, 100);
  if (fa) fans(fa);
  const delen = [b && `bestuur ${b > 0 ? '+' : '−'}${Math.abs(b)}`, m && `moraal ${m > 0 ? '+' : '−'}${Math.abs(m)}`, fa && `fans ${fa > 0 ? '+' : '−'}${Math.abs(fa)}`].filter(Boolean).join(' · ');
  let uit;
  if (fx.fel && !T0.persEffect){ T0.persEffect = {dT:1, dO:.5, fel:true, n:P.n}; uit = `De krant kopt: "${S.sp.naam} daagt ${P.n} uit!" De fans genieten. Nu moet je het wel waarmaken.`; }
  else uit = o.toon === 'kalm' ? 'Een keurig antwoord. Het bestuur knikt tevreden.' : o.toon === 'bal' ? 'Je spelers lezen het in de krant en groeien ervan.' : 'Stevige taal. De journalisten schrijven driftig mee.';
  v.uit = delen ? `${uit} (${delen})` : uit;
  if (q === 0) P.uit = v.uit;
  return v.uit;
}
// Na de wedstrijd: fans en mind games
export function fansNaWedstrijd(W, a, b, regels){
  const T0 = S.trainer, won = a > b, verl = a < b, derby = W.opp === rivaalClub(), E = T0.persEffect;
  fans((won ? 3 : verl ? -3 : 0) + (derby ? (won ? 6 : verl ? -6 : 0) : 0));
  if (E && E.fel){ if (won){ fans(5); T0.rep = clamp(T0.rep + 1, 0, 100); regels.push(`Je had ${E.n} uitgedaagd, en je hebt het waargemaakt. De fans scanderen je naam.`); }
    else if (verl){ fans(-6); T0.bestuur = clamp(T0.bestuur - 4, 0, 100); regels.push(`Je had ${E.n} uitgedaagd... en verloren. De pers smult ervan (bestuur -4, fans -6).`); } }
  T0.persEffect = null;
  if (derby){ const D = noteerDuel(W.opp, a, b); regels.push(`Duel met ${trainerVan(W.opp)}: ${D.w} gewonnen, ${D.g} gelijk, ${D.v} verloren.`); }
  else if (!T0.o23) noteerDuel(W.opp, a, b);
  const f = T0.fans ?? 50;
  if (f >= 80 && won) regels.push(pick(['De tribunes zingen jouw naam.', `Een spandoek: "${S.sp.naam}, onze trainer!"`]));
  else if (f < 25) regels.push(pick(['Op de tribune hangt een spandoek: "TRAINER WEG".', 'Na het laatste fluitsignaal klinkt een fluitconcert, voor jou.']));
}
// Elke week: blije fans maken het bestuur geduldiger, boze fans juist niet
export function fansWeek(){
  const T0 = S.trainer, f = T0.fans ?? 50;
  if (f >= 80) T0.bestuur = clamp(T0.bestuur + 1, 0, 100); else if (f < 25) T0.bestuur = clamp(T0.bestuur - 1, 0, 100);
}
