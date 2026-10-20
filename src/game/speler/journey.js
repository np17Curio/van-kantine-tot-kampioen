import { S, club, mod, ovr, seizoenLabel } from '../../core/state.js';
import { clamp, pick, randInt, rnd } from '../../core/utils.js';
import { AANTAL_RONDES, CLUBS, divClubs, WINTER, rondeInWeek, weekFactor } from '../../data/gegevens.js';
import { thuisLand } from '../../data/landen.js';
import { selectie } from '../competitie/spelers.js';
import { krantMelding } from '../media/roddel.js';
import { social } from '../prive/social.js';
import { modFans, rivaal as derbyVan } from '../wedstrijd/fans-pers.js';
import { PERS } from './persoonlijkheid.js';
import { plaats as plaatsRivaal } from './rivaal.js';

/* ===================== Jouw verhaal: hoofdstukken zoals in "The Journey" ===================== */
// Een vaste verhaallijn over je eerste seizoen, bovenop het gewone spel: je beste vriend uit de jeugd doet mee met de
// selectiedagen en tekent misschien bij dezelfde club. Halverwege probeert een gladde zaakwaarnemer hem weg te halen: of jullie
// dan rivalen worden of vrienden blijven, hangt af van jullie band (die bouw je elke week op, VRIEND_ACTIES) en van wat je zegt.
// Opa, zelf vroeger spits, kijkt mee. In gesprekken kies je een toon: kalm, gebalanceerd of fel.
// Een hoofdstukkaart wordt bij elke weergave opnieuw opgebouwd uit S.hoofdstuk (functies kun je niet opslaan).
export const HOOFDSTUKKEN = ['Proloog', 'De selectiedagen', 'De keuze', 'Eerste stappen', 'De verleiding', 'Rivalen', 'De laatste confrontatie', 'Epiloog'];
// Bleven jullie vrienden? Dan heten hoofdstuk 5 en 6 anders
const VRIEND_TITELS = {5:'Samen sterker', 6:'De laatste speelronde'};
export const vriendRoute = () => !!(S.sp && S.sp.journey && S.sp.journey.route === 'vriend');
export const hoofdstukTitel = h => (vriendRoute() && VRIEND_TITELS[h]) || HOOFDSTUKKEN[h];
// Is hij (nog) je vriend? Na de breuk kan hij je rivaal zijn (v.weg)
export const vriendActief = () => { const v = S.sp && S.sp.vriend; return !!(v && !v.weg && v.club != null); };
export const KLAAR = HOOFDSTUKKEN.length; // daarna speel je vrij verder
export const journey = () => S && S.sp && S.sp.journey;
export const inVerhaal = () => { const J = journey(); return !!(J && J.h < KLAAR); };
const VOORNAMEN = ['Sem', 'Daan', 'Milan', 'Jayden', 'Noah', 'Luuk', 'Bram', 'Ryan', 'Thijs', 'Mo'];
const ACHTERNAMEN = ['Walker', 'Brouwers', 'De Ruiter', 'Mertens', 'Bakkali', 'Van Loon', 'Hoekman', 'Pinas', 'Verbeek', 'Smits'];
const OPA = ['Jan', 'Kees', 'Henk', 'Wim', 'Gerrit'];
export const MAKELAAR = 'Max Vos';
export const vriendNaam = () => S.sp.vriend ? S.sp.vriend.voornaam : 'je vriend';
export const opaNaam = () => `opa ${S.sp.opa ? S.sp.opa.naam : 'Jan'}`;

// ---------- toon ----------
export const TOON = {kalm:{n:'Kalm', i:'🧊'}, bal:{n:'Gebalanceerd', i:'⚖️'}, fel:{n:'Fel', i:'🔥'}};
export const toonChip = t => TOON[t] ? `<span class="tag toon toon-${t}">${TOON[t].i} ${TOON[t].n}</span>` : '';
// Alleen de meter (de persconferentie heeft zelf al effecten)
export function toonMeter(t){ const sp = S.sp; if (!sp || !TOON[t]) return; sp.toon = clamp((sp.toon || 0) + (t === 'kalm' ? -8 : t === 'fel' ? 8 : -Math.sign(sp.toon || 0) * Math.min(4, Math.abs(sp.toon || 0))), -100, 100); }
// Meter plus een klein effect: kalm bevalt de trainer, fel de fans en je volgers
export function toonEffect(t){
  if (!TOON[t]) return '';
  toonMeter(t);
  if (t === 'kalm'){ mod('vert', 2); return '(Kalm: de trainer waardeert je rust. Vertrouwen +2.)'; }
  if (t === 'fel'){ modFans(2); const n = Math.round(20 + social().volgers * .01); social().volgers += n; return `(Fel: de fans zien vuur in je. Fans +2, +${n} volgers.)`; }
  mod('moraal', 1); return '(Gebalanceerd: je blijft bij jezelf. Moraal +1.)';
}
export const toonLabel = (v = S.sp.toon || 0) => v <= -40 ? 'Rustig' : v <= -12 ? 'Beheerst' : v < 12 ? 'Evenwichtig' : v < 40 ? 'Vurig' : 'Heethoofd';

// ---------- begin ----------
export function maakJourney(sp){
  const vn = pick(VOORNAMEN);
  sp.vriend = {voornaam:vn, v:vn[0], n:pick(ACHTERNAMEN), lft:sp.leeftijd, k:clamp(ovr(sp) + randInt(-2, 3), 30, 95), band:60, club:null, o23:false};
  sp.vriend.pot = clamp(sp.pot + randInt(-5, 3), sp.vriend.k + 4, 95);
  sp.opa = {naam:pick(OPA)};
  sp.toon = 0;
  sp.journey = {h:0, jaar:S ? S.jaar : 2026};
}
export function openHoofdstuk(h, terug, data = {}){
  const J = journey(); if (!J) return;
  J.h = h; S.hoofdstuk = {h, terug, keuze:null, uit:null, data}; S.fase = 'hoofdstuk';
}
const zetBand = d => { const v = S.sp.vriend; v.band = clamp(v.band + d, -100, 100); };

// De inhoud van een hoofdstuk: tekst, een citaat van opa en (soms) een gesprek met een toon per antwoord
export function hoofdstukInhoud(){
  const H = S.hoofdstuk, sp = S.sp, v = sp.vriend, vn = v.voornaam, opa = opaNaam(), d = H.data, land = thuisLand();
  const o = (l, toon, f) => ({l, toon, f});
  switch (H.h){
    case 0: return {
      tekst:[`Tien jaar geleden. De finale van het regionale jeugdtoernooi, op een veld vol plassen. Jij en ${vn} ${v.n} zijn tien jaar en al sinds de kleuterschool onafscheidelijk.`,
        `Het wordt strafschoppen. Bij 4-4 kijkt de trainer naar jullie twee: wie neemt de laatste? Langs de lijn staat ${opa}, die veertig jaar geleden zelf spits was, met zijn handen in zijn jaszakken.`],
      opa:'"Een echte spits wil die bal. Maar een echte vriend weet wanneer hij hem moet geven."',
      opts:[
        o('Zelf de laatste nemen', 'fel', () => { zetBand(-5); sp.journey.penalty = 'zelf'; mod('rep', 1); return `Je pakt de bal voordat ${vn} iets kan zeggen. Hard, linksboven: kampioen! ${vn} juicht mee, maar je ziet dat hij hem zelf ook had willen nemen.`; }),
        o(`${vn} hem laten nemen`, 'kalm', () => { zetBand(10); sp.journey.penalty = 'vriend'; return `Je geeft ${vn} de bal. Hij schiet hem keihard in de kruising. Hij rent meteen naar jou toe: "Samen, man. Altijd samen."`; }),
        o('Samen beslissen: tossen', 'bal', () => { zetBand(4); sp.journey.penalty = 'samen'; return `Jullie tossen. ${vn} wint, neemt hem en scoort. Op de foto in de krant staan jullie samen met de beker.`; })]};
    case 1: return {
      tekst:[`Nu, ${sp.leeftijd} jaar oud. De selectiedagen in ${land}: twintig talenten, drie wedstrijden, en tribunes vol scouts. Jij en ${vn} zijn er allebei.`,
        `Je begint op plek 15 van de scoutingranglijst. Alleen wie hoog eindigt, krijgt een aanbieding van een club uit de hoogste league. ${vn} slaat je op je schouder: "Wij gaan dit samen halen."`],
      opa:'"Kijk niet naar die lijst. Kijk naar de bal. De lijst volgt vanzelf."',
      opts:[
        o('"Samen halen we het."', 'kalm', () => { zetBand(4); return `${vn} grijnst. "Zo ken ik je."`; }),
        o('"Ik ga er gewoon voor."', 'bal', () => 'Je knikt en trekt je schoenen strak. Focus.'),
        o('"Sorry, maar vandaag ben jij ook mijn concurrent."', 'fel', () => { zetBand(-6); return `${vn} lacht, maar het klinkt een beetje geforceerd. "Dan zien we wel wie er hoger eindigt."`; })]};
    case 2: return {
      tekst:[`De selectiedagen zitten erop. Je eindigde op plek ${d.plek} van de ${d.van}${d.plek <= 10 ? ', in de top 10' : ''}. ${vn} eindigde op plek ${d.vriendPlek}.`,
        `Je telefoon blijft maar trillen: meerdere clubs willen met je praten. Nu moet jij kiezen welke club het beste bij je past. Speeltijd, salaris, het niveau, de speelstijl: denk goed na.`],
      opa:'"Ik koos ooit voor het geld. Twee jaar op de bank. Kies de club waar je speelt, jongen."', opts:[]};
    case 3: return {
      tekst:[`Je eerste week bij ${club().n}${sp.o23 ? ' (bij de O23)' : ''}. ${v.club === sp.club ? `En wie loopt daar de kleedkamer in? ${vn}! Jullie hebben bij dezelfde club getekend.` : `${vn} tekende bij ${CLUBS[v.club] ? CLUBS[v.club].n : 'een andere club'}. Jullie appen elke avond.`}`,
        'De trainer neemt je apart. "Ik heb gezien wat je kunt. Maar hier begint iedereen weer bij nul."'],
      opa:'"De eerste weken bepalen hoe ze naar je kijken. Train alsof iemand meekijkt. Want dat doet er altijd iemand."',
      opts:[
        o('"Ik ga me elke dag bewijzen, trainer."', 'kalm', () => 'De trainer knikt tevreden.'),
        o('"Ik ben er klaar voor."', 'bal', () => 'De trainer glimlacht. "Dat zien we op het veld."'),
        o('"Ik hoor in de basis, dat ga ik laten zien."', 'fel', () => { mod('vert', -2); return 'De trainer trekt een wenkbrauw op. "Brutaal. Dat mag, als je het waarmaakt."'; })]};
    case 4: {
      // Spelen jullie bij dezelfde club? (bij het openen vastgelegd; oudere opslag: nu bepalen, hij is nog niet vertrokken)
      const zelfde = d.zelfde ?? v.club === sp.club, zijn = CLUBS[v.club] ? CLUBS[v.club].n : 'zijn club';
      const naar = CLUBS[d.naar].n, waar = `${naar}${d.derby ? `, de aartsrivaal van ${club().n}` : ''}`, opa4 = `"Zaakwaarnemers als die ${MAKELAAR.split(' ')[1]} heb ik ook gekend. Ze beloven je de wereld en vergeten je naam zodra je geblesseerd bent."`;
      // Hecht: hij belt jou eerst en jouw antwoord beslist
      if (d.band >= 60) return {
        tekst:[`Midden in de winterstop belt ${vn} je, laat op de avond. Een zaakwaarnemer, ${MAKELAAR}, wil hem ${zelfde ? '' : `van ${zijn} `}naar ${waar} halen. "Ze bieden me twee keer zoveel. Maar ik wil eerst weten wat jij ervan vindt. Wat moet ik doen?"`,
          'Jullie kennen elkaar al sinds de kleuterschool. Dit is een gesprek dat je niet vergeet.'],
        opa:opa4, opts:[
        zelfde ? o('"Blijf. Samen maken we het hier."', 'kalm', () => { zetBand(10); breukUitkomst('blijft'); return `Het is even stil. Dan lacht ${vn}: "Je hebt gelijk. ${MAKELAAR} kan de boom in." De volgende dag zegt hij nee. Jullie blijven samen.`; })
          : o(`"Blijf bij ${zijn}. Daar ben je op je plek, en wij blijven gewoon vrienden."`, 'kalm', () => { zetBand(10); breukUitkomst('blijft'); return `Het is even stil. Dan lacht ${vn}: "Je hebt gelijk. ${MAKELAAR} kan de boom in." De volgende dag zegt hij nee. Hij blijft bij ${zijn}.`; }),
        o('"Doe wat goed voelt. Ik blijf je vriend, waar je ook speelt."', 'bal', () => { zetBand(5); breukUitkomst('vriend'); return `"Echt?" vraagt hij. "Echt," zeg je. Hij tekent bij ${naar}, maar jullie spreken af: elke zondag bellen. Vrienden blijven jullie.`; }),
        o('"Ga dan maar, als geld belangrijker is."', 'fel', () => { zetBand(-50); breukUitkomst('rivaal', -40); modFans(3); return `"Als jij er zo over denkt..." zegt ${vn}. Hij tekent bij ${naar}. Vanaf nu zijn jullie rivalen.`; })]};
      // Te ver uit elkaar gegroeid: hij is al weg zonder iets te zeggen
      if (d.band < 30) return {
        tekst:[`De winterstop is voorbij en je leest het op social media: ${vn} heeft een nieuwe zaakwaarnemer, ${MAKELAAR}, en tekende op de laatste dag van de transferperiode bij ${waar}.`,
          'Hij heeft je niet eens gebeld. Jullie spraken elkaar de laatste tijd ook bijna niet meer.'],
        opa:opa4, opts:[
        o('Hem toch succes wensen', 'kalm', () => { breukUitkomst('rivaal', 15); return `Je stuurt een kort berichtje. Hij reageert met een duimpje. Vanaf nu zijn jullie concurrenten.`; }),
        o('Het laten gaan', 'bal', () => { breukUitkomst('rivaal', -15); return 'Je zegt niets. Het voelt alsof er iets voorbij is.'; }),
        o('"Typisch. Altijd al voor zichzelf gekozen."', 'fel', () => { zetBand(-30); breukUitkomst('rivaal', -50); modFans(3); return 'Je zegt het hardop in de kleedkamer. Het staat de volgende dag in de krant. Hij leest het ook.'; })]};
      // Ertussenin: hij heeft al getekend en belt pas daarna
      return {
        tekst:[`De winterstop is voorbij en het nieuws slaat in als een bom: ${vn} heeft een nieuwe zaakwaarnemer, ${MAKELAAR}, en tekende op de laatste dag van de transferperiode bij ${waar}.`,
          `Je leest het eerst op social media. Pas 's avonds belt hij. "${MAKELAAR} zegt dat ik daar meer kan verdienen en sneller kan doorbreken. Je snapt het toch?"`],
        opa:opa4, opts:[
        o('"Ik snap het. Succes, en we blijven vrienden."', 'kalm', () => { zetBand(-5); breukUitkomst('vriend'); return `Het blijft even stil. "Dank je," zegt ${vn} zacht. "Dat betekent veel." Hij speelt nu ergens anders, maar jullie blijven vrienden.`; }),
        o('"Je moet doen wat goed voor je is. Maar dit doet pijn."', 'bal', () => { zetBand(-25); breukUitkomst('rivaal', -15); return `"Ik weet het," zegt ${vn}. "Sorry." Jullie hangen op. Het voelt alsof er iets kapot is gegaan.`; }),
        o('"Je laat me gewoon in de steek. Voor geld."', 'fel', () => { zetBand(-50); breukUitkomst('rivaal', -50); modFans(3); return `"Weet je wat? Zie je op het veld," zegt ${vn}, en hij hangt op. De volgende ochtend staat jullie ruzie in de krant.`; })]};
    }
    case 5: if (vriendRoute()) return {
      tekst:[`${v.club === sp.club ? `${vn} en jij spelen allebei bij ${club().n}` : `${vn} speelt bij ${CLUBS[v.club] ? CLUBS[v.club].n : 'een andere club'}, jij bij ${club().n}`}, maar jullie zijn nog steeds beste vrienden. De media noemen jullie "het gouden duo".`,
        'Een journalist vraagt: "Hoe overleeft jullie vriendschap de druk van het profvoetbal?"'],
      opa:'"Een echte vriend in het voetbal is zeldzamer dan een hattrick. Zuinig op zijn."',
      opts:[
        o('"Omdat we elkaar alles gunnen."', 'kalm', () => { zetBand(6); return 'Een mooi antwoord. Het interview wordt veel gedeeld.'; }),
        o('"We houden voetbal en vriendschap gescheiden."', 'bal', () => { zetBand(3); return 'Een volwassen antwoord. Je trainer knikt.'; }),
        o('"Op het veld ben ik nog steeds beter dan hij."', 'fel', () => { zetBand(-4); return `${vn} stuurt je een appje: "Dat gaan we nog zien 😄". Hij kan er wel om lachen.`; })]};
      return {
      tekst:[`${vn} is nu je rivaal. Elke goal die hij maakt, zie je voorbijkomen op je telefoon. De media smullen ervan: "De jeugdvrienden die rivalen werden".`,
        'Een journalist belt je voor een interview. "Wat vind je ervan dat je beste vriend je heeft verlaten?"'],
      opa:'"Laat je beste antwoord op het veld zien. Woorden worden vergeten, goals niet."',
      opts:[
        o('"Hij is een topspeler. Ik wens hem het beste."', 'kalm', () => { zetRivaalBand(8); return 'Een keurig antwoord. De trainer leest het en knikt.'; }),
        o('"We zien wel wie er aan het eind van het seizoen beter is."', 'bal', () => 'Een eerlijk antwoord. De race is begonnen.'),
        o('"Hij koos voor het geld. Dat zegt genoeg."', 'fel', () => { zetRivaalBand(-12); krantMelding(`${sp.naam} haalt uit naar ex-vriend ${vn} ${v.n}`, `"Hij koos voor het geld. Dat zegt genoeg," aldus ${sp.naam}.`); return 'Het interview gaat viral. Je rivaal leest het ook, dat weet je zeker.'; })]};
    case 6: if (vriendRoute()) return {
      tekst:[`De laatste speelronde van het seizoen komt eraan. ${v.club === sp.club ? `Op de avond ervoor eten ${vn} en jij samen, zoals jullie al jaren doen voor een belangrijke wedstrijd.` : `${vn} belt: "Morgen de laatste speelronde. Na afloop samen eten, wat er ook gebeurt?"`}`,
        `"Weet je nog, die penalty's toen we tien waren?" vraagt ${vn}. ${sp.journey.penalty === 'vriend' ? '"Jij gaf mij toen de bal. Dat ben ik nooit vergeten."' : sp.journey.penalty === 'zelf' ? '"Jij nam hem toen zelf. Nu snap ik waarom: jij wilt altijd winnen."' : '"Die foto hangt nog steeds bij mijn ouders aan de muur."'}`],
      opa:'"Ik had ooit een vriend zoals hij. Ik heb hem laten gaan. Jij niet. Daar ben ik trots op."',
      opts:[
        o('"Wat er ook gebeurt: samen."', 'kalm', () => { zetBand(10); mod('moraal', 8); return 'Jullie proosten met een glas cola. Wat een seizoen.'; }),
        o('"Eerst de wedstrijd, daarna feest."', 'bal', () => { zetBand(4); mod('focus', 4); return '"Deal," zegt hij.'; }),
        o('"Morgen laat ik je zien wie de beste is."', 'fel', () => { mod('focus', 6); return `${vn} grijnst: "Dat dacht je maar."`; })]};
      return {
      tekst:[`De laatste speelronde van het seizoen komt eraan. ${d.finale ? `Jullie stonden dit seizoen al tegenover elkaar in de bekerfinale. ` : ''}Op de avond voor de wedstrijd krijg je een bericht van ${vn}.`,
        `"Hé. Ik heb ${sp.journey.penalty === 'vriend' ? 'vaak gedacht aan die penalty die jij mij gaf, toen we tien waren' : sp.journey.penalty === 'zelf' ? 'vaak gedacht aan die finale toen we tien waren, toen jij die laatste penalty nam' : 'vaak gedacht aan die foto in de krant, toen we tien waren'}. ${MAKELAAR} belt me al weken niet meer terug. Kunnen we praten?"`],
      opa:'"Ik heb mijn beste vriend ooit laten gaan om een ruzie over niks. Daar heb ik veertig jaar spijt van gehad."',
      opts:[
        o('Hem bellen en het uitpraten', 'kalm', () => { zetRivaalBand(50); mod('moraal', 8); return `Jullie praten tot diep in de nacht. Over vroeger, over ${MAKELAAR}, over alles. Morgen zijn jullie tegenstanders, maar weer vrienden.`; }),
        o('"Na het seizoen. Eerst deze wedstrijd."', 'bal', () => { zetRivaalBand(20); return '"Deal," stuurt hij terug, met een duimpje. Het ijs is gebroken.'; }),
        o('Niet reageren', 'fel', () => { zetRivaalBand(-20); mod('focus', 4); return 'Je legt je telefoon weg. Morgen laat je op het veld zien wat je ervan vindt.'; })]};
    case 7: return {
      tekst:[`Je eerste seizoen zit erop. ${d.samenvatting}`,
        d.bondscoach ? `En dan het mooiste nieuws: je naam staat op de voorlopige lijst van de bondscoach van ${land}.` : `De bondscoach kijkt nog niet naar je. Maar dat kan snel veranderen.`,
        vriendRoute() ? `En ${vn}? Die is nog steeds je beste vriend. Dat had ${MAKELAAR} niet verwacht.` : sp.rivaal && sp.rivaal.exVriend && sp.rivaal.band >= 20 ? `Met ${vn} gaat het weer wat beter. Rivalen, maar met respect.` : `${vn} en jij zijn rivalen gebleven. Misschien komt dat ooit nog goed.`,
        `Je zit met ${opa} op zijn bank, waar je als kind alle wedstrijden met hem keek. Hij pakt een oude foto: hij zelf, veertig jaar geleden, met een beker. "Jij gaat verder komen dan ik ooit kwam."`],
      opa:'"Je verhaal begint nu pas, jongen. Maak er wat moois van."', opts:[]};
  }
  return {tekst:[], opa:'', opts:[]};
}
const zetRivaalBand = d => { const R = S.sp.rivaal; if (R) R.band = clamp(R.band + d, -100, 100); };
export function kiesHoofdstuk(i){
  const H = S.hoofdstuk; if (!H || H.keuze !== null) return;
  const o = hoofdstukInhoud().opts[i]; if (!o) return;
  H.keuze = i; H.uit = o.f() + ' ' + toonEffect(o.toon);
}
// "Verder": terug naar waar je was (of door naar het volgende hoofdstuk)
export function verderHoofdstuk(){
  const H = S.hoofdstuk; if (!H) return;
  const J = journey(); S.hoofdstuk = null;
  if (H.h === 0) return openHoofdstuk(1, 'selectie');
  if (H.h === 7){ J.h = KLAAR; S.car.hist.push(`${seizoenLabel()}: einde van het eerste hoofdstuk van je verhaal`); }
  if (H.uit && S.week) S.week.tekst.push(H.uit);
  S.fase = H.terug || 'week';
}

// ---------- je vriend ----------
// Hem in de selectie van een club zetten (bij de O23: op de bank)
export function plaatsVriend(id, o23){
  const v = S.sp.vriend, sel = selectie(id), linie = {SPITS:'A', MID:'M', VERD:'V'}[S.sp.pos];
  v.club = id; v.o23 = !!o23;
  if (sel.some(y => y.vriend)) return;
  const bank = sel.filter(y => y.pos === linie && !y.basis).sort((a, b) => a.k - b.k)[0]; if (bank) sel.splice(sel.indexOf(bank), 1);
  sel.push({v:v.v, n:v.n, pos:linie, basis:!o23, g:linie === 'A' ? 4 : linie === 'M' ? 2.2 : 1, a:linie === 'M' ? 2.6 : 1.4, k:v.k, lft:v.lft, vriend:true});
}
// De breuk: hij vertrekt naar een club in jouw league (het liefst je aartsrivaal) en wordt je vaste rivaal
export function breukDoel(){
  const sp = S.sp, t = club().t, derby = derbyVan(sp.club), zijn = sp.vriend ? sp.vriend.club : null, zelfde = zijn === sp.club;
  if (derby != null && CLUBS[derby].t === t && derby !== sp.club && derby !== zijn) return {naar:derby, derby:true, zelfde};
  const l = divClubs(t).filter(i => i !== sp.club && i !== zijn).sort((a, b) => CLUBS[b].s - CLUBS[a].s);
  return {naar:l.length ? l[randInt(0, Math.min(2, l.length - 1))] : null, derby:false, zelfde};
}
// Wat er gebeurt na het gesprek: 'blijft' (hij zegt nee tegen de zaakwaarnemer), 'vriend' (hij vertrekt, jullie blijven vrienden)
// of 'rivaal' (hij vertrekt en wordt je rivaal)
export function breukUitkomst(soort, band, naar = S.hoofdstuk && S.hoofdstuk.data.naar){
  const sp = S.sp, v = sp.vriend, J = sp.journey;
  if (J) J.route = soort === 'rivaal' ? 'rivaal' : 'vriend';
  if (soort === 'blijft'){ S.car.hist.push(`${seizoenLabel()}: jeugdvriend ${v.voornaam} ${v.n} zegt nee tegen ${MAKELAAR}`); return; }
  if (soort === 'vriend'){
    if (naar == null) return;
    const oud = v.club != null ? selectie(v.club) : null; if (oud){ const x = oud.find(y => y.vriend); if (x) oud.splice(oud.indexOf(x), 1); }
    plaatsVriend(naar, false); v.weg = false;
    S.car.hist.push(`${seizoenLabel()}: jeugdvriend ${v.voornaam} ${v.n} vertrekt naar ${CLUBS[naar].n}, jullie blijven vrienden`);
    krantMelding(`${v.voornaam} ${v.n} kiest voor ${CLUBS[naar].n}`, `De jeugdvriend van ${sp.naam} tekende op de laatste dag van de transferperiode. "We blijven beste vrienden," zegt hij.`);
    return;
  }
  vriendWordtRivaal(band, naar);
}
export function vriendWordtRivaal(band, naar = S.hoofdstuk && S.hoofdstuk.data.naar){
  const sp = S.sp, v = sp.vriend; if (naar == null) return;
  // Had je al een (andere) rivaal, dan neemt je ex-vriend die plaats in
  if (sp.rivaal && !sp.rivaal.exVriend){ const r = sp.rivaal, sel = CLUBS[r.club] ? selectie(r.club) : null; if (sel){ const x = sel.find(y => y.n === r.n && y.v === r.v); if (x) x.rivaal = false; } sp.rivaal = null; }
  if (sp.rivaal) return;
  if (sp.journey) sp.journey.route = 'rivaal';
  const oud = v.club != null ? selectie(v.club) : null; if (oud){ const x = oud.find(y => y.vriend); if (x) oud.splice(oud.indexOf(x), 1); }
  sp.rivaal = {v:v.v, n:v.n, lft:v.lft, k:v.k, pot:v.pot, kVorig:v.k, club:naar, achtergrond:'Jullie waren beste vrienden, tot hij vertrok.', karakter:pick(Object.keys(PERS)),
    onderling:{w:0, g:0, v:0}, hist:[], seizoen:null, band, race:{}, exVriend:true};
  plaatsRivaal(naar);
  v.club = naar; v.weg = true;
  S.car.hist.push(`${seizoenLabel()}: jeugdvriend ${v.voornaam} ${v.n} vertrekt naar ${CLUBS[naar].n} en wordt je rivaal`);
  krantMelding(`${v.voornaam} ${v.n} kiest voor ${CLUBS[naar].n}`, `De jeugdvriend van ${sp.naam} tekende op de laatste dag van de transferperiode. Zijn nieuwe zaakwaarnemer ${MAKELAAR} regelde de overstap.`);
}

// ---------- samen in het veld ----------
// Speelt je vriend in deze wedstrijd in jouw team? Bij de selectiedagen altijd; bij je club als jullie allebei in het
// eerste elftal (of allebei bij de O23) zitten en hij in de basis staat
export const vriendSpeler = () => { const sp = S.sp, v = sp.vriend; if (!v || v.club == null) return null; return selectie(v.club).find(y => y.vriend) || null; };
export function vriendInTeam(M){
  const sp = S.sp, v = sp.vriend; if (!M || !v || M.inter) return false;
  if (M.selectie) return true;
  if (!vriendActief() || v.club !== sp.club || !!v.o23 !== !!sp.o23) return false;
  const x = vriendSpeler(); return !!(x && (x.basis || sp.o23) && !(x.bles > 0));
}
export const zetVriendBand = d => { if (S.sp.vriend && d) zetBand(d); };

// ---------- elke week iets met je vriend (1 per week) ----------
export const VRIEND_ACTIES = {
  bellen: {n:'Appen en bellen', s:'band +3'},
  trainen:{n:'Samen extra trainen', s:'band +6 · fitheid −6 · kans op groei', zelfde:true},
  chillen:{n:'Samen gamen of chillen', s:'band +5 · moraal +3 · fitheid −2'},
  eten:   {n:'Samen uit eten · €80', s:'band +8', prijs:80},
  advies: {n:'Om advies vragen', s:'band +4 · focus +3'},
  afstand:{n:'Afstand nemen', s:'band −10 · jullie groeien uit elkaar'},
};
export const kanVriendActie = id => { const sp = S.sp, a = VRIEND_ACTIES[id]; return vriendActief() && S.week && !S.week.vriend && !sp.clubloos && (!a.zelfde || sp.vriend.club === sp.club) && (!a.prijs || sp.geld >= a.prijs); };
export function vriendActie(id){
  if (!kanVriendActie(id)) return;
  const sp = S.sp, v = sp.vriend, vn = v.voornaam, w = S.week; let t;
  if (id === 'bellen'){ zetBand(3); t = pick([`Je belt een uur met ${vn}. Over voetbal, over meiden, over vroeger.`, `${vn} stuurt een filmpje van zijn mislukte rabona. Jullie appen de hele avond.`]); }
  else if (id === 'trainen'){ zetBand(6); mod('fit', -6); const groei = rnd() < .3 * weekFactor() + .05; if (groei){ const k = pick(['afw', 'pas', 'drib', 'verd', 'cond']); sp.a[k] = Math.min(99, sp.a[k] + 1); }
    t = `Na de training blijven ${vn} en jij nog een uur op het veld.${groei ? ' Je wordt er echt beter van.' : ' Lekker gewerkt.'}`; }
  else if (id === 'chillen'){ zetBand(5); mod('moraal', 3); mod('fit', -2); t = `Jullie gamen tot middernacht. ${vn} wint, zoals altijd. Hij zegt het, zoals altijd.`; }
  else if (id === 'eten'){ sp.geld -= VRIEND_ACTIES.eten.prijs; zetBand(8); t = `Samen uit eten. ${vn} vertelt over zijn familie, jij over je dromen. Net als vroeger.`; }
  else if (id === 'advies'){ zetBand(4); mod('focus', 3); t = `Je vraagt ${vn} wat hij van je laatste wedstrijden vond. Hij is eerlijk, en hij heeft gelijk.`; }
  else if (id === 'afstand'){ zetBand(-10); t = `Je reageert niet meer op de berichtjes van ${vn}. Hij merkt het wel.`; }
  w.vriend = id; w.tekst.push(t);
}
// Is hij je rivaal geworden? Dan kun je het nog uitpraten
export const kanUitpraten = () => { const sp = S.sp, R = sp.rivaal; return !!(sp.vriend && sp.vriend.weg && R && R.exVriend && S.week && !S.week.vriend && !sp.clubloos); };
export function uitpraten(){
  if (!kanUitpraten()) return;
  const sp = S.sp, R = sp.rivaal; R.band = clamp(R.band + 8, -100, 100); S.week.vriend = 'uitpraten';
  S.week.tekst.push(R.band >= 60 ? `Je zoekt ${sp.vriend.voornaam} op. Het voelt bijna weer als vroeger.` : `Je stuurt ${sp.vriend.voornaam} een bericht. Het antwoord is kort, maar vriendelijk.`);
}
// Af en toe een moment met je vriend, met een toon per antwoord
export function vriendEvents(){
  if (!vriendActief()) return [];
  const sp = S.sp, v = sp.vriend, vn = v.voornaam, zelfde = v.club === sp.club;
  const ev = (tekst, opts) => ({soort:'prive', tekst, opts:opts.map(([l, toon, d, uit]) => ({l, toon, f(){ zetBand(d); return uit; }}))});
  return [
    ev(`${vn} heeft een vriendin en wil dat je haar ontmoet. Vanavond, bij hem thuis.`, [
      ['Natuurlijk, ik neem een cadeautje mee', 'kalm', 6, `Ze is aardig. ${vn} is zichtbaar trots.`],
      ['Even langs, daarna rust', 'bal', 3, 'Een gezellig uurtje. Hij waardeert dat je kwam.'],
      ['Geen tijd, ik moet aan mezelf denken', 'fel', -6, `${vn} is teleurgesteld. "Volgende keer dan."`]]),
    ev(zelfde ? `${vn} zit al drie wedstrijden op de bank en is gefrustreerd. Hij vraagt of jij iets bij de trainer kunt zeggen.` : `${vn} zit bij zijn club op de bank en is gefrustreerd. Hij belt je om te klagen.`, [
      ['Rustig met hem praten en opbeuren', 'kalm', 7, 'Na een uur praten heeft hij weer zin om te knokken.'],
      ['"Gewoon blijven werken, dan komt het goed."', 'bal', 3, 'Hij knikt. "Je hebt gelijk."'],
      ['"Misschien ben je gewoon niet goed genoeg."', 'fel', -12, 'Het blijft stil aan de andere kant. Dat had je niet moeten zeggen.']]),
    ev(`${vn} scoorde het winnende doelpunt en tagt jou in zijn post: "Voor mijn broer."`, [
      ['Een lief bericht terugsturen', 'kalm', 5, 'Jullie volgers vinden het prachtig.'],
      ['Liken en een emoji sturen', 'bal', 2, 'Hij stuurt een emoji terug.'],
      ['"Mooi, maar mijn goal van vorige week was mooier 😏"', 'fel', 1, 'Hij lacht. Jullie gaan het hele weekend door met plagen.']]),
    ev(`${vn} vraagt je mee naar zijn ouders. Zijn moeder heeft je lievelingseten gemaakt, net als vroeger.`, [
      ['Gaan, en de afwas doen', 'kalm', 7, 'Zijn moeder knuffelt je bij de deur. "Je bent hier altijd welkom."'],
      ['Gaan, maar op tijd naar huis', 'bal', 4, 'Een fijne avond.'],
      ['Afzeggen', 'fel', -5, `${vn} zegt dat het niet erg is. Zijn moeder vond het wel jammer.`]]),
  ];
}

// ---------- elke week: jullie band, en een nieuwe kans voor de zaakwaarnemer ----------
export function vriendWeek(eerste){
  const sp = S.sp, v = sp.vriend, J = sp.journey; if (!v || eerste || S.trainer) return;
  if (vriendActief()){
    // Zonder contact groeien jullie langzaam uit elkaar; bij dezelfde club zie je elkaar elke dag
    if (!S.week || !S.week.vriend) zetBand(v.club === sp.club && !sp.o23 ? .5 : -1 * weekFactor());
    // Na de verleiding: zijn jullie toch uit elkaar gegroeid, dan probeert de zaakwaarnemer het nog een keer (eens per seizoen, bij de winterstop)
    if (J && J.h >= 5 && v.band < 25 && S.ronde === WINTER && v.vosJaar !== S.jaar && !S.wachtEv){ v.vosJaar = S.jaar; S.wachtEv = vosOpnieuw(); }
    return;
  }
  // Een rivaal met wie het weer goed zit, wordt weer je vriend
  const R = sp.rivaal;
  if (v.weg && R && R.exVriend && R.band >= 60 && !S.wachtEv){
    const sel = CLUBS[R.club] ? selectie(R.club) : null, x = sel && sel.find(y => y.n === R.n && y.v === R.v);
    if (x){ x.vriend = true; x.rivaal = false; }
    v.club = R.club; v.weg = false; v.band = Math.max(v.band, 60); sp.rivaal = null; if (J) J.route = 'vriend';
    S.car.hist.push(`${seizoenLabel()}: ${v.voornaam} ${v.n} is weer je beste vriend`);
    if (S.week) S.week.tekst.push(`Na alles wat er gebeurd is, staan ${v.voornaam} en jij ineens weer samen te lachen. Jullie zijn weer beste vrienden. (Je krijgt een nieuwe rivaal in de competitie.)`);
  }
}
// De zaakwaarnemer probeert het opnieuw (jullie band is laag)
function vosOpnieuw(){
  const v = S.sp.vriend, d = breukDoel(), vn = v.voornaam; if (d.naar == null || d.naar === v.club) return null;
  return {soort:'prive', tekst:`${MAKELAAR} belt ${vn} weer. Jullie spreken elkaar bijna niet meer, en ${CLUBS[d.naar].n} wil hem hebben.`, opts:[
    {l:v.club === S.sp.club ? 'Hem bellen: "Blijf, ik heb je nodig."' : `Hem bellen: "Blijf bij ${CLUBS[v.club] ? CLUBS[v.club].n : 'je club'}, en laten we elkaar weer vaker zien."`, toon:'kalm', f(){ zetBand(20); return `${vn} is verrast dat je belt. Hij blijft. "Dank je, man."`; }},
    {l:'Het aan hem laten', toon:'bal', f(){ if (v.band >= 15){ breukUitkomst('vriend', 0, d.naar); return `${vn} vertrekt naar ${CLUBS[d.naar].n}, maar zegt: "Vrienden blijven, toch?"`; } breukUitkomst('rivaal', -10, d.naar); return `${vn} vertrekt naar ${CLUBS[d.naar].n}. Jullie worden rivalen.`; }},
    {l:'"Ga maar, het maakt me niet uit."', toon:'fel', f(){ breukUitkomst('rivaal', -40, d.naar); return `${vn} vertrekt naar ${CLUBS[d.naar].n}. Vanaf nu zijn jullie rivalen.`; }}]};
}

// ---------- elke week: tijd voor een nieuw hoofdstuk? ----------
export function journeyWeek(eerste){
  const J = journey(); if (!J || J.h >= KLAAR || S.trainer) return;
  const sp = S.sp, zelfdeJaar = S.jaar === J.jaar;
  // Liep het verhaal vast (zonder club, of het seizoen is al voorbij)? Dan houdt het hier op en speel je gewoon verder
  if (!zelfdeJaar && J.h < 6){ J.h = KLAAR; return; }
  if (sp.clubloos || S.fase !== 'week') return;
  if (J.h === 3 && zelfdeJaar && S.ronde >= WINTER){ const d = breukDoel(); if (d.naar != null && vriendActief()) openHoofdstuk(4, 'week', {...d, band:Math.round(sp.vriend.band)}); else J.h = KLAAR; }
  else if (J.h === 4) openHoofdstuk(5, 'week');
  else if (J.h === 5 && zelfdeJaar && S.ronde >= laatsteWeek()) openHoofdstuk(6, 'week', {finale:finaleTegenRivaal()});
  else if (J.h === 6 && !zelfdeJaar && eerste) openHoofdstuk(7, 'week', epiloogData());
}
// De week van de laatste wedstrijd van jouw league
const laatsteWeek = () => { const t = club().t; for (let w = AANTAL_RONDES - 1; w >= 0; w--) if (rondeInWeek(t, w) != null) return w; return AANTAL_RONDES - 1; };
// Speelde je dit seizoen in een bekerfinale tegen zijn club?
function finaleTegenRivaal(){
  const B = S.ss.bekers, R = S.sp.rivaal; if (!B || !R) return false;
  return Object.values(B).some(b => { const f = b.rondes[b.rondes.length - 1]; return b.winnaar != null && f && f.length === 1 && [f[0].h, f[0].u].includes(S.sp.club) && [f[0].h, f[0].u].includes(R.club); });
}
function epiloogData(){
  const sp = S.sp, sz = (S.car.seizoenen || []).slice(-1)[0];
  const samenvatting = sz ? `${sz.wed} wedstrijden, ${sz.g} goals en ${sz.a} assists bij ${sz.club}${sz.gem ? `, gemiddeld een ${String(sz.gem).replace('.', ',')}` : ''}. Eindstand: plek ${sz.plek}.` : 'Het was een seizoen om nooit te vergeten.';
  const bondscoach = ovr(sp) >= 62 || sp.rep >= 35;
  if (bondscoach) krantMelding(`${sp.naam} op voorlopige lijst van de bondscoach`, `Na een sterk eerste seizoen staat ${sp.naam} (${sp.leeftijd}) op de lijst met mogelijke debutanten.`);
  return {samenvatting, bondscoach};
}
