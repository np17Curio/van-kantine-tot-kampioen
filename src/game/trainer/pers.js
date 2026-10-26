import { S } from '../../core/state.js';
import { clamp, pick, rnd } from '../../core/utils.js';
import { CLUBS } from '../../data/gegevens.js';
import { ACHTERNAMEN } from '../competitie/spelers.js';
import { stand } from '../competitie/spelers.js';
import { rivaal } from '../wedstrijd/fans-pers.js';
import { fans } from './drama.js';

/* ===================== Trainer: pers, rivaliserende trainers en fans ===================== */
const VOORNAMEN = ['Frank', 'Ronald', 'Peter', 'Erik', 'John', 'Dick', 'Louis', 'Arne', 'Pascal', 'Marcel', 'Henk', 'Fred', 'Guus', 'Jürgen', 'Pep', 'Carlo', 'José', 'Diego', 'Mikel', 'Xabi'];
// Elke club heeft een vaste trainer (zolang jij daar niet zelf trainer bent)
export function trainerVan(id){ let h = id * 7919 + 17; return `${VOORNAMEN[h % VOORNAMEN.length]} ${ACHTERNAMEN[(h * 31) % ACHTERNAMEN.length]}`; }
export const rivaalClub = () => { const T0 = S.trainer; if (!T0 || T0.o23) return null; const r = rivaal(T0.club); return r != null && CLUBS[r] && CLUBS[r].t === CLUBS[T0.club].t ? r : null; };
// Een duel tegen een trainer bijhouden (alleen de aartsrivaal krijgt een eigen regel in je prijzenkast)
export function noteerDuel(opp, a, b){
  const T0 = S.trainer, n = trainerVan(opp), D = (T0.duels = T0.duels || {})[n] = (T0.duels[n] || {club:CLUBS[opp].n, w:0, g:0, v:0});
  D.club = CLUBS[opp].n; if (a > b) D.w++; else if (a === b) D.g++; else D.v++;
  return D;
}
// De persconferentie voor de wedstrijd: bij een derby, een topper, de laatste rondes van een beker, of zomaar
export function maakPersVoor(W){
  const T0 = S.trainer; T0.pers = null; if (!W) return;
  const opp = W.opp, n = trainerVan(opp), zij = CLUBS[opp].n, derby = opp === rivaalClub(), top = !T0.o23 && stand(CLUBS[T0.club].t).indexOf(opp) < 3 && stand(CLUBS[T0.club].t).indexOf(opp) >= 0;
  const groot = W.beker && /finale/i.test(W.beker.ronde);
  if (!(derby || top || groot || rnd() < .25)) return;
  const soort = derby ? 'derby' : groot ? 'beker' : top ? 'top' : 'gewoon';
  const vraag = soort === 'derby' ? `Zondag de derby tegen ${zij}. Hun trainer ${n} zei vanochtend: "Wij zijn de beste club van de regio." Uw reactie?`
    : soort === 'beker' ? `${W.beker.naam}, ${W.beker.ronde.toLowerCase()} tegen ${zij}. Is uw ploeg er klaar voor?`
    : soort === 'top' ? `${zij} staat bovenin. Trainer ${n} noemt uw ploeg "een leuke ploeg, maar niet meer dan dat". Wat vindt u?`
    : pick([`Hoe gaat het met de ploeg voor de wedstrijd tegen ${zij}?`, `Trainer ${n} van ${zij} zegt dat hij uw speelwijze heeft ontleed. Bent u bang?`, `Er wordt gespeculeerd over uw positie. Voelt u de druk?`]);
  T0.pers = {soort, opp, n, vraag, opts:[
    {l:soort === 'derby' ? `"Respect voor ${zij}. Wij doen ons ding."` : '"We nemen het wedstrijd voor wedstrijd. Respect voor de tegenstander."', toon:'kalm', s:'bestuur +1'},
    {l:soort === 'beker' ? '"Klaar? We hebben hier het hele seizoen naartoe gewerkt."' : '"Mijn spelers zijn klaar. We gaan voor de winst."', toon:'bal', s:'moraal +3'},
    {l:soort === 'derby' ? `"${n} praat veel. Zondag laten wij zien wie de baas is."` : `"Laat ${n} maar praten. Na zondag is hij stil."`, toon:'fel', s:'mind games: jouw ploeg +1 en fans +, maar zij zijn ook gebrand; verlies komt dubbel hard aan'}], keuze:null};
}
export function persAntwoord(i){
  const T0 = S.trainer, P = T0.pers; if (!P || P.keuze != null) return;
  P.keuze = i;
  if (i === 0){ T0.bestuur = clamp(T0.bestuur + 1, 0, 100); P.uit = 'Een keurig antwoord. Het bestuur knikt tevreden.'; T0.persEffect = null; }
  else if (i === 1){ T0.moraal = clamp(T0.moraal + 3, 20, 100); P.uit = 'Je spelers lezen het in de krant en groeien ervan (moraal +3).'; T0.persEffect = null; }
  else { fans(4); T0.persEffect = {dT:1, dO:.5, fel:true, n:P.n}; P.uit = `De krant kopt: "${S.sp.naam} daagt ${P.n} uit!" De fans genieten. Nu moet je het wel waarmaken.`; }
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
