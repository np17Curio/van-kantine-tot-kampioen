import { S } from '../../core/state.js';
import { clamp, pick, randInt, rnd } from '../../core/utils.js';
import { thuisLand } from '../../data/landen.js';
import { krantMelding } from '../media/roddel.js';
import { ik } from '../../core/geslacht.js';

/* ===================== Verhuurd, en dan tegen je eigen club ===================== */
// Je bent uitgeleend en je huurclub speelt tegen de club die jou verhuurde. Soms staat in je huurcontract dat je dan niet mag
// spelen (één keer per huurperiode bepaald). Mag het wel, dan zit de trainer van je eigen club op de tribune en kijkt alleen naar
// jou, staan je ploeggenoten van elke week tegenover je, en krijg je een grote kans tegen hun keeper. Een goal tegen je eigen club
// haalt de krant. Hoe je het doet onthoudt je eigen club (sp.huur.indruk): als je terugkomt, helpt (of schaadt) dat je status.

export const HUUR_CLAUSULE_KANS = .3;
// Speel je nu tegen de club die jou verhuurde? (alleen als die in dezelfde competitie speelt)
export const tegenEigenClub = opp => { const h = S.sp && S.sp.huur; return !!(h && h.ouder === opp && (!h.ouderLand || h.ouderLand === thuisLand())); };
// Mag je niet spelen? Dan zet het spel je op de tribune (met de reden erbij)
export function huurClausule(opp){
  const h = S.sp.huur; if (!tegenEigenClub(opp)) return null;
  if (h.clausule === undefined) h.clausule = rnd() < HUUR_CLAUSULE_KANS;
  return h.clausule ? ` In je huurcontract staat dat je niet tegen ${h.ouderNaam} mag spelen. Je kijkt vanaf de tribune, met je eigen club aan de overkant.` : null;
}
// Bij de aftrap (je speelt mee): een regel in het verslag, wat momenten met je eigen club, en een grote kans tegen hun keeper
export function huurAftrap(M, start = 1){
  const h = S.sp.huur; if (!tegenEigenClub(M.opp)) return;
  M.huurduel = {ouder:h.ouder, naam:h.ouderNaam};
  M.log.push({m:"1'", t:`Vandaag tegen ${h.ouderNaam}, de club die jou uitleende. De trainer van ${h.ouderNaam} zit op de tribune, en kijkt maar naar één speler: jou.`, k:'info'});
  const zinnen = [
    `Een ploeggenoot van ${h.ouderNaam}, met wie je normaal elke dag traint, zet je stevig onder druk. "Rustig aan, hè," grijnst ${ik.hij === 'zij' ? 'ze' : 'hij'}. "In de zomer ben je gewoon weer van ons."`,
    `Je ziet de trainer van ${h.ouderNaam} op de tribune iets opschrijven. Over jou, dat weet je zeker.`,
    `De fans van ${h.ouderNaam} herkennen je. Sommigen klappen, anderen fluiten: jij speelt vandaag tegen hen.`,
  ];
  for (const t of zinnen.sort(() => rnd() - .5).slice(0, 2)) M.ev.push({type:'huurInfo', min:randInt(start + 2, 85), t});
  const kans = randInt(Math.max(start + 5, 20), 82);
  M.ev.push({type:'huurInfo', min:kans, t:`Daar is je kans: alleen op de keeper van ${h.ouderNaam}. Je kent zijn hoeken van de training.`});
  M.ev.push({type:'moment', min:kans, m:'eenOpEen'});
}
// Een goal van jou tegen je eigen club (één keer per wedstrijd een regel, plus de krant na afloop)
export function huurGoal(M, m){
  if (!M.huurduel) return;
  M.huurduel.goals = (M.huurduel.goals || 0) + 1;
  if (M.huurduel.goals === 1) M.log.push({m, t:pick([`Je scoort tegen de club die je uitleende. Je juicht ingetogen, met je handen omhoog als excuus naar het uitvak.`, `Raak, tegen je eigen club! Op de tribune legt de trainer van ${M.huurduel.naam} zijn pen neer.`]), k:'info'});
}
// Na afloop: wat je eigen club ervan vond (sp.huur.indruk telt mee als je terugkomt)
export function huurNaWedstrijd(M, speelde){
  const h = S.sp.huur; if (!h || !M.huurduel || !speelde) return;
  const d = clamp(Math.round((M.cijfer - 6.5) * 6 + (M.goals || 0) * 3 + (M.assists || 0) * 2), -8, 12);
  h.indruk = clamp((h.indruk || 0) + d, -10, 15);
  M.log.push({m:'', t:d >= 4 ? `De trainer van ${h.ouderNaam} komt na afloop naar je toe: "Zo wil ik je zien. Volgend seizoen reken ik op je."` : d <= -3 ? `De trainer van ${h.ouderNaam} loopt na afloop zonder iets te zeggen langs je heen. Dit was niet je beste dag.` : `De trainer van ${h.ouderNaam} knikt je na afloop kort toe. Hij heeft genoeg gezien.`, k:d >= 4 ? 'ok' : d <= -3 ? 'mis' : 'info'});
  if (M.goals) krantMelding(`Huurling ${S.sp.naam} scoort tegen eigen club ${h.ouderNaam}`, `${S.sp.naam}, door ${h.ouderNaam} verhuurd, maakte ${M.goals === 1 ? 'een goal' : M.goals + ' goals'} tegen de club die ${ik.hem} uitleende. De trainer van ${h.ouderNaam} zag het vanaf de tribune.`);
}
// Bij de terugkeer (o23.js terugVanHuur): de indruk van dat duel telt mee voor je status bij je eigen club
export function huurIndrukBijTerugkeer(h){
  const d = h && h.indruk; if (!d) return '';
  S.sp.status = clamp(S.sp.status + Math.round(d * .8), 0, 100);
  return d > 0 ? ` En ze zijn niet vergeten hoe je het tegen hen deed: dat telt mee.` : ` Je wedstrijd tegen ${h.ouderNaam} hebben ze ook nog in hun hoofd.`;
}
