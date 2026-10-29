import { S, club } from '../../core/state.js';
import { randInt, rnd } from '../../core/utils.js';
import { AANTAL_RONDES, CLUBS } from '../../data/gegevens.js';
import { fixture } from '../competitie/competitie.js';
import { RODDELBLADEN, krantMelding } from './roddel.js';
import { isProf } from '../prive/sponsors.js';
import { ik } from '../../core/geslacht.js';

/* ===================== Uitgaan in de krant ===================== */
// Hoe bekender je bent, hoe vaker je uitstapjes in de krant komen: prof in de roddelbladen, lager in de regionale krant of het clubblad
export function uitgaanBronnen(){ return RODDELBLADEN; }
export function uitgaanKans(){ const t = isProf() ? 1 : club().t; return t <= 1 ? .8 : .5; }
export function volgendeTegenstander(){ if (S.ronde >= AANTAL_RONDES || S.sp.o23) return null; try { const f = fixture(S.ronde); return f ? CLUBS[f.opp].n : null; } catch (e){ return null; } }
export const UITGAAN_KOPPEN = {
  uit: [
    (n, c, o) => [`${n} gespot in nachtclub`, `${ik.Hij} stond tot laat aan de bar. "${ik.Hij} was heel gezellig," zegt een andere bezoeker.`],
    (n, c, o) => [`${n} trakteert heel het café op een rondje`, `"${ik.Hij} betaalde de hele rekening," vertelt de barman. Op social media noemen fans ${ik.hem} "de gulste ${ik.speler} van ${c}".`],
    (n, c, o) => [`Selfie met ${n} gaat viral`, `Een fan maakte een foto met ${n} op een terras. "Wat een toffe gast, ${ik.hij} nam echt de tijd."`],
    (n, c, o) => [`${n} danst tot sluitingstijd`, `${o ? `Een paar dagen voor de wedstrijd tegen ${o}` : 'Midden in het seizoen'} ging ${n} los op de dansvloer.`],
    (n, c, o) => [`Avondje uit voor selectie ${c}`, `${n} en een paar teamgenoten werden gezien in een bekende kroeg in de stad.`],
    (n, c, o) => [`${n} zingt karaoke: "${ik.Hij} kan beter voetballen"`, `Bezoekers van een karaokebar filmden ${n}. Het filmpje wordt duizenden keren bekeken.`]],
  feest: [
    (n, c, o) => [`${n} feest tot zonsopgang${o ? `, vlak voor duel met ${o}` : ''}`, `Volgens ooggetuigen verliet ${ik.hij} pas om zes uur 's ochtends de club.`],
    (n, c, o) => [`Foto's: ${n} aan VIP-tafel met champagne`, `De ${ik.speler} van ${c} liet het flink gaan. Bij de club zijn ze er niet blij mee.`],
    (n, c, o) => [`Supporters ${c} boos: "${ik.Hij} moet slapen, niet feesten"`, `Na nieuwe foto's van ${n} in een nachtclub regent het boze reacties op social media.`],
    (n, c, o) => [`"${n} was de laatste die vertrok"`, `De portier van een bekende nachtclub vertelt dat ${n} er bijna elke week staat.`],
    (n, c, o) => [`${n} op huisfeest bij bekende rapper`, `Op beelden is te zien hoe ${n} tot diep in de nacht feest.`],
    (n, c, o) => [`Feestbeest ${n}?`, `Het is al de zoveelste keer dat ${n} laat in de nacht wordt gespot. Hoe lang pikt ${c} dit nog?`]],
  casino: [
    (n, c, o) => [`${n} gespot aan de roulettetafel`, `Volgens ooggetuigen zette ${ik.hij} flink wat geld in.`],
    (n, c, o) => [`Gokt ${n} ${ik.zijn} salaris erdoorheen?`, `De ${ik.speler} van ${c} zou steeds vaker in het casino te vinden zijn.`],
    (n, c, o) => [`${n} uren in het casino na de training`, `"${ik.Hij} zat er tot middernacht," zegt een medewerker.`]],
  casinoWinst: [
    (n, c, o) => [`${n} wint fortuin in het casino`, `Met één gok op één nummer ging ${ik.hij} er met een flinke som geld vandoor. Het hele casino klapte.`]],
  boete: [
    (n, c, o) => [`${c} beboet ${n} na nachtje doorhalen`, `De speler verscheen te laat op de training. De club bevestigt de boete.`],
    (n, c, o) => [`Te laat op de training: ${n} krijgt boete`, `${c} laat weten dat het "een interne zaak" is.`]]
};
export function uitgaanKrant(soort, zeker){
  const sp = S.sp; if (sp.leeftijd < 18 || !(zeker || rnd() < uitgaanKans())) return;
  const l = UITGAAN_KOPPEN[soort], k = S.car.uitKop = S.car.uitKop || {}, i = ((k[soort] ?? randInt(0, l.length - 1)) + 1) % l.length; k[soort] = i;
  const [kop, tekst] = l[i](sp.naam, club().n, volgendeTegenstander());
  krantMelding(kop, tekst, uitgaanBronnen());
}
