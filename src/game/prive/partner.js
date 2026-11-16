import { S, club, mod } from '../../core/state.js';
import { clamp, pick, rnd, shuffle } from '../../core/utils.js';
import { AANTAL_RONDES } from '../../data/gegevens.js';
import { thuisLand } from '../../data/landen.js';
import { pa } from '../../core/geslacht.js';
import { roddel } from '../media/roddel.js';
import { social } from './social.js';

/* ===================== Eigenschappen van je partner ===================== */
// Elke partner krijgt 1 of 2 eigenschappen met een echt effect:
// steunend  extra moraal na een slechte wedstrijd
// ambitieus wil dat je naar een grotere club gaat; ontevreden als je te lang bij dezelfde club blijft
// heimwee   wil terug naar het thuisland; een transfer naar het buitenland kost jullie band
// bekend    meer sponsorgeld en volgers, maar ook meer roddels en druk
export const EIGENSCHAPPEN = {
  steunend:{n:'Steunend', uitleg:'Geeft je extra moraal na een slechte wedstrijd.'},
  ambitieus:{n:'Ambitieus', uitleg:'Wil dat je naar een grotere club gaat. Blijf je te lang bij dezelfde club, dan wordt je partner ontevreden.'},
  heimwee:{n:'Heimwee', uitleg:'Wil terug naar het thuisland. Een transfer naar het buitenland kost jullie band.'},
  bekend:{n:'Bekend persoon', uitleg:'Meer sponsorgeld en volgers, maar ook meer roddels en druk.'},
};
const band = (r, d) => { r.band = clamp(r.band + d, 0, 100); };
// (de eerste keer dat je de eigenschappen merkt: één zin per eigenschap)
const KENNIS = {
  steunend:r => `${r.naam} is heel steunend: na een slechte wedstrijd staat ${pa.ze} altijd voor je klaar.`,
  ambitieus:r => `${r.naam} is ambitieus en droomt hardop van een grote club voor jou.`,
  heimwee:r => `${r.naam} is erg gehecht aan ${r.thuis}. Ver weg wonen zou ${pa.haar} zwaar vallen.`,
  bekend:r => `${r.naam} is zelf een bekend persoon. Waar jullie ook komen, er zijn camera's.`,
};

// Geeft de eigenschappen van je partner (en deelt ze uit als dat nog niet gebeurd is: nieuwe relaties en oude saves)
export function partnerEig(){
  const sp = S.sp, r = sp && sp.relatie; if (!r) return [];
  if (!Array.isArray(r.eig)){
    r.eig = shuffle(Object.keys(EIGENSCHAPPEN)).slice(0, rnd() < .4 ? 2 : 1);
    r.thuis = r.thuis || thuisLand(); r.clubId = sp.club; r.clubWeken = 0; r.nieuweEig = true;
  }
  return r.eig;
}
export const heeftEig = id => partnerEig().includes(id);
// Sponsorgeld: een bekende partner maakt jullie samen interessanter voor merken
export const partnerSponsorFactor = () => heeftEig('bekend') ? 1.2 : 1;

// Elke week (na relatieWeek)
export function partnerWeek(eerste){
  const sp = S.sp, r = sp.relatie; if (!r || eerste) return;
  const eig = partnerEig(), tekst = t => S.week.tekst.push(t);
  if (r.nieuweEig){ r.nieuweEig = false; tekst(`Je leert ${r.naam} steeds beter kennen.`); eig.forEach(id => tekst(KENNIS[id](r))); }
  // hoe lang zit je al bij deze club?
  if (r.clubId !== sp.club){ r.clubId = sp.club; r.clubWeken = 0; } else r.clubWeken = (r.clubWeken || 0) + 1;

  if (eig.includes('ambitieus')){
    const c = club(), top = c && c.t === 1 && c.s >= 80;
    if (!top && r.clubWeken > AANTAL_RONDES * 2){
      if (rnd() < .6) band(r, -1);
      if (rnd() < .08){ tekst(pick([`${r.naam} vraagt weer wanneer je eindelijk naar een grotere club gaat. "Je kunt zoveel meer."`, `${r.naam} leest hardop een transfergerucht over een ander voor. "Waarom ben jij dat niet?"`, `"Ga je hier echt nog een seizoen blijven?" vraagt ${r.naam}. Het klinkt niet als een vraag.`])); mod('moraal', -2); }
    }
  }
  if (eig.includes('heimwee') && thuisLand() !== r.thuis){
    if (rnd() < .5) band(r, -1);
    if (rnd() < .08){ tekst(pick([`${r.naam} belt elke avond met familie in ${r.thuis}. "Ik mis het thuis zo."`, `${r.naam} kijkt foto's van ${r.thuis} en wordt er stil van. ${pa.Ze} wil terug.`])); mod('moraal', -2); }
  }
  if (eig.includes('bekend')){
    const so = social(); so.volgers = Math.round(so.volgers * 1.004 + 15);
    if (rnd() < .1){
      mod('focus', -3); mod('moraal', -1);
      const kop = pick([`${sp.naam} en ${r.naam} gespot in de stad`, `Is het nog goed tussen ${sp.naam} en ${r.naam}?`, `${r.naam} deelt foto van ${sp.naam} op het strand`]);
      roddel(kop, pick(['Fotografen volgen het stel overal.', 'Volgens ingewijden is er spanning.', 'Fans reageren massaal.']));
      tekst(`Overal fotografen. Met ${r.naam} aan je zijde sta je weer in de roddelbladen. Dat geeft druk.`);
    }
  }
}

// Na een wedstrijd: een steunende partner vangt je op na een slechte wedstrijd
export function partnerNaWedstrijd(M){
  const r = S.sp.relatie; if (!r || !heeftEig('steunend')) return;
  const verloren = M.us != null && M.them != null && M.us < M.them, slecht = M.cijfer != null && M.cijfer < 6;
  if (!verloren && !slecht) return;
  mod('moraal', 5); band(r, 1);
  M.partnerTekst = pick([`${r.naam} wacht je op met je lievelingseten. "Volgende week beter." Het helpt echt.`, `${r.naam} stuurt meteen een berichtje: "Ik ben trots op je, wat er ook gebeurt."`, `Thuis zegt ${r.naam} niks over de wedstrijd. ${pa.Ze} slaat gewoon een arm om je heen.`]);
}

// Na een transfer: oudLand = het land van je vorige club, oud/nieuw = {t, s} van de clubs
export function partnerTransfer(oudLand, oud, nieuw){
  const r = S.sp.relatie; if (!r) return [];
  const eig = partnerEig(), uit = [], nuLand = thuisLand();
  if (eig.includes('ambitieus')){
    const groter = nieuw.t < oud.t || (nieuw.t === oud.t && nieuw.s > oud.s + 5), kleiner = nieuw.t > oud.t || (nieuw.t === oud.t && nieuw.s < oud.s - 5);
    if (groter){ band(r, 10); uit.push(`${r.naam} is dolblij: "Eindelijk een grotere club! Dit verdien je."`); }
    else if (kleiner){ band(r, -6); uit.push(`${r.naam} begrijpt niet waarom je een stap terug doet.`); }
  }
  if (eig.includes('heimwee') && nuLand !== oudLand){
    if (nuLand === r.thuis){ band(r, 12); uit.push(`${r.naam} huilt van blijdschap: jullie gaan terug naar ${r.thuis}.`); }
    else if (oudLand === r.thuis){ band(r, -15); uit.push(`${r.naam} vindt het heel moeilijk om ${r.thuis} achter te laten.`); }
    else { band(r, -5); uit.push(`Weer een ander land. ${r.naam} mist ${r.thuis} steeds meer.`); }
  }
  return uit;
}
