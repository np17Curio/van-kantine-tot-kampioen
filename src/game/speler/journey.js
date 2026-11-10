import { S, club, mod, ovr, salarisVoor, seizoenLabel, waarde } from '../../core/state.js';
import { clamp, pick, randInt, rnd } from '../../core/utils.js';
import { AANTAL_RONDES, CLUBS, DIVS, LAAGSTE, liefNamen, clubsLand, divClubs, WINTER, rondeInWeek, weekFactor, LINIE_VAN, POS } from '../../data/gegevens.js';
import { thuisLand } from '../../data/landen.js';
import { andereWereldClub, andereWereldIds, clubPlek, vreemdeClub } from '../transfers/buitenland.js';
import { interDrempel, landenVoor } from '../interlands/interlands.js';
import { OPBOUW, selectie, startElf } from '../competitie/spelers.js';
import { herschik } from '../transfers/markt.js';
import { krantMelding } from '../media/roddel.js';
import { social } from '../prive/social.js';
import { modFans, rivaal as derbyVan } from '../wedstrijd/fans-pers.js';
import { PERS, karakter } from './persoonlijkheid.js';
import { groeiSeizoen, plaats as plaatsRivaal } from './rivaal.js';
import { iedereen, zetBand as kleedBand } from '../team/kleedkamer.js';
import { DELEN, VERVOLG, deelVan } from './journey-delen.js';
import { BLESSURES, ZWAAR } from './blessures.js';
import { eersteSeizoen } from '../transfers/vertrek.js';
import { ik, team, vp, vr, vriendVrouw } from '../../core/geslacht.js';
import { ik as IK } from '../../core/geslacht.js'; // (in hoofdstuk 0 is 'ik' een lokale variabele)
export { DELEN, deelVan };

/* ===================== Jouw verhaal: hoofdstukken zoals in "The Journey" ===================== */
// Een vaste verhaallijn over je eerste seizoen, bovenop het gewone spel: je beste vriend uit de jeugd doet mee met de
// selectiedagen en tekent misschien bij dezelfde club. Halverwege probeert een gladde zaakwaarnemer hem weg te halen: of jullie
// dan rivalen worden of vrienden blijven, hangt af van jullie band (die bouw je elke week op, VRIEND_ACTIES) en van wat je zegt.
// Opa, zelf vroeger spits, kijkt mee. In gesprekken kies je een toon: kalm, gebalanceerd of fel.
// Een hoofdstukkaart wordt bij elke weergave opnieuw opgebouwd uit S.hoofdstuk (functies kun je niet opslaan).
export const HOOFDSTUKKEN = ['Proloog', 'De selectiedagen', 'De keuze', 'Eerste stappen', 'De verleiding', 'Rivalen', 'De laatste confrontatie', 'Einde deel 1',
  // deel 2 tot en met 4 (journey-delen.js): je hele carrière
  'Het tweede seizoen', 'De oproep', 'De blessure', 'Opa', 'Een nieuw hoofdstuk', 'Het weerzien', 'Einde deel 2',
  'Europa', 'De band', 'Het eindtoernooi', 'De storm', 'De afrekening', 'De gala-avond', 'Einde deel 3',
  'Dertig', 'De nieuwe jij', 'Terug naar huis?', 'De laatste dans', 'Epiloog'];
// Bleven jullie vrienden? Dan heten hoofdstuk 5 en 6 anders
const VRIEND_TITELS = {5:'Samen sterker', 6:'De laatste speelronde'};
export const vriendRoute = () => !!(S.sp && S.sp.journey && S.sp.journey.route === 'vriend');
export const hoofdstukTitel = h => (vriendRoute() && VRIEND_TITELS[h]) || HOOFDSTUKKEN[h];
// Is hij (nog) je vriend? Na de breuk kan hij je rivaal zijn (v.weg)
// In welk land speelt hij? De clubplaatsen (CLUBS) wisselen per land, dus zijn club hoort bij zijn eigen land (v.land)
export const vriendLand = () => { const v = S.sp && S.sp.vriend, c0 = S.car && S.car.clubs && S.car.clubs[0]; return (v && v.land) || (c0 && c0.land) || 'Nederland'; };
// Een jeugdvriend(in) van het andere geslacht speelt in de andere wereld (mannen- of vrouwenvoetbal): nooit met of tegen jou
export const vriendApart = () => { const v = S && S.sp && S.sp.vriend; return !!(v && !!v.vrouw !== (S.wereld === 'v')); };
export const vriendHier = () => !vriendApart() && vriendLand() === thuisLand();
// Zijn/haar club: in jouw competitie, in een ander land, of in de andere wereld
export const vriendClubInfo = (id = S.sp.vriend.club) => vriendHier() ? CLUBS[id] : vriendApart() ? andereWereldClub(vriendLand(), id) : vreemdeClub(vriendLand(), id);
export const vriendClubNaam = () => { const v = S.sp && S.sp.vriend; if (!v || v.club == null) return null; const c = vriendClubInfo(v.club); return c ? c.n : null; };
export const bijJou = () => { const v = S.sp && S.sp.vriend; return !!(v && v.club != null && vriendHier() && v.club === S.sp.club); };
// Je voetballand (niet het land van je clubcompetitie): je definitieve keuze, anders het land waarvoor je de meeste
// interlands speelde (een oefeninterland legt je nog niet vast), anders een land waarvoor je mag uitkomen
export function interLand(){
  const sp = S.sp; if (sp && sp.land) return sp.land;
  const meest = Object.entries((S.car && S.car.int) || {}).filter(([, x]) => x.caps > 0).sort((a, b) => b[1].caps - a[1].caps)[0];
  return meest ? meest[0] : landenVoor()[0] || thuisLand();
}
export const vriendActief = () => { const v = S.sp && S.sp.vriend; return !!(v && !v.weg && v.club != null); };
export const KLAAR = HOOFDSTUKKEN.length; // daarna speel je vrij verder
export const journey = () => S && S.sp && S.sp.journey;
export const inVerhaal = () => { const J = journey(); return !!(J && J.h < KLAAR); };
export const VOORNAMEN = ['Sem', 'Daan', 'Milan', 'Jayden', 'Noah', 'Luuk', 'Bram', 'Ryan', 'Thijs', 'Mo'];
export const VOORNAMEN_V = ['Lieke', 'Noor', 'Jill', 'Sanne', 'Fenna', 'Esmee', 'Lotte', 'Yara', 'Romée', 'Damaris'];
export const voornamenVoor = vrouw => vrouw ? VOORNAMEN_V : VOORNAMEN;
const ACHTERNAMEN = ['Walker', 'Brouwers', 'De Ruiter', 'Mertens', 'Bakkali', 'Van Loon', 'Hoekman', 'Pinas', 'Verbeek', 'Smits'];
const OPA = ['Jan', 'Kees', 'Henk', 'Wim', 'Gerrit'];
export const MAKELAAR = 'Max Vos';
export const vriendNaam = () => S.sp.vriend ? S.sp.vriend.voornaam : 'je ' + vr.vriend;
export const opaNaam = () => `opa ${S.sp.opa ? S.sp.opa.naam : 'Jan'}`;

// ---------- toon ----------
export const TOON = {kalm:{n:'Kalm', i:'🧊'}, bal:{n:'Gebalanceerd', i:'⚖️'}, fel:{n:'Fel', i:'🔥'}};
export const toonChip = t => TOON[t] ? `<span class="tag toon toon-${t}">${TOON[t].i} ${TOON[t].n}</span>` : '';
// Alleen de meter (de persconferentie heeft zelf al effecten)
export function toonMeter(t){ const sp = S.sp; if (!sp || !TOON[t]) return; const voor = karakter(); sp.toon = clamp((sp.toon || 0) + (t === 'kalm' ? -8 : t === 'fel' ? 8 : -Math.sign(sp.toon || 0) * Math.min(4, Math.abs(sp.toon || 0))), -100, 100);
  // Je karakter verandert: dat merk je (persoonlijkheid.js)
  const na = karakter(); if (na.id !== voor.id){ const tk = `Je karakter is nu: ${na.i} ${na.n}. In het veld: ${na.veld} Buiten het veld: ${na.buiten}`; if (S.week && S.week.tekst) S.week.tekst.push(tk); } }
// Meter plus een klein effect: kalm bevalt de trainer, fel de fans en je volgers
export function toonEffect(t){
  if (!TOON[t]) return '';
  toonMeter(t);
  if (t === 'kalm'){ mod('vert', 2); return '(Kalm: de trainer waardeert je rust. Vertrouwen +2.)'; }
  if (t === 'fel'){ modFans(2); const n = Math.round(20 + social().volgers * .01); social().volgers += n; return `(Fel: de fans zien vuur in je. Fans +2, +${n} volgers.)`; }
  mod('moraal', 1); return '(Gebalanceerd: je blijft bij jezelf. Moraal +1.)';
}
export const toonLabel = (v = S.sp.toon || 0) => v <= -40 ? 'Rustig' : v <= -12 ? 'Beheerst' : v < 12 ? 'Evenwichtig' : v < 40 ? 'Vurig' : 'Heethoofd';

// Ben jij keeper? Dan vertelt het verhaal over reddingen en de nul houden in plaats van goals
export const isKeeper = () => S.sp.pos === 'KEEPER';
export const nulTxt = n => `${n} keer de nul gehouden`;
// Wat je liet zien: voor een keeper de nul gehouden, anders goals
export const prestatie = (g, nul) => isKeeper() ? nulTxt(nul || 0) : `${g} ${g === 1 ? 'goal' : 'goals'}`;
// De positie van je beste vriend (gekozen bij het begin; oude opslag: dezelfde als jij)
export const vriendPos = () => (S.sp.vriend && S.sp.vriend.pos) || S.sp.pos;
// ---------- begin ----------
// keuze: {naam, pos, vrouw} van het startscherm (je kiest zelf hoe je beste vriend(in) heet, waar die speelt en of het een jongen of een meisje is)
export function maakJourney(sp, keuze = {}){
  const delen = String(keuze.naam || '').trim().split(/\s+/).filter(Boolean), vrouw = keuze.vrouw === undefined ? !!sp.vrouw : !!keuze.vrouw, vn = delen[0] ? delen[0][0].toUpperCase() + delen[0].slice(1) : pick(voornamenVoor(vrouw));
  const rest = delen.slice(1), an = rest.length ? rest.map((w, i) => i === rest.length - 1 ? w[0].toUpperCase() + w.slice(1) : w).join(' ') : pick(ACHTERNAMEN), vpos = POS[keuze.pos] ? keuze.pos : sp.pos;
  sp.vriend = {voornaam:vn, v:vn[0], n:an, ...(vrouw ? {vrouw:true} : {}), pos:vpos, lft:sp.leeftijd, k:clamp(ovr(sp) + randInt(-2, 3), 30, 95), band:60, club:null, o23:false, talentV2:true};
  sp.vriend.pot = clamp(sp.pot + randInt(-5, 3), sp.vriend.k + 4, 95);
  sp.opa = {naam:pick(OPA)};
  sp.toon = 0;
  sp.journey = {h:0, jaar:S ? S.jaar : 2026, v:2};
}
export function openHoofdstuk(h, terug, data = {}){
  const J = journey(); if (!J) return;
  J.h = h; J.vorige = S.weekNr || 0; S.hoofdstuk = {h, terug, keuze:null, uit:null, data}; S.fase = 'hoofdstuk';
}
export const zetBand = d => { const v = S.sp.vriend; v.band = clamp(v.band + d, -100, 100); };

// De inhoud van een hoofdstuk: tekst, een citaat van opa en (soms) een gesprek met een toon per antwoord
export function hoofdstukInhoud(){
  const H = S.hoofdstuk, sp = S.sp, v = sp.vriend, vn = v.voornaam, opa = opaNaam(), d = H.data, land = thuisLand();
  const o = (l, toon, f) => ({l, toon, f});
  if (H.h >= 8) return VERVOLG[H.h] ? VERVOLG[H.h].inhoud(d) : {tekst:[], opa:'', opts:[]}; // deel 2 tot en met 4
  switch (H.h){
    case 0: { const ik = isKeeper(), hij = !ik && vriendPos() === 'KEEPER'; // als keeper sta jij in het doel (of je vriend)
      return {
      tekst:[`Tien jaar geleden. De finale van het regionale jeugdtoernooi, op een veld vol plassen. Jij en ${vn} ${v.n} zijn tien jaar en al sinds de kleuterschool onafscheidelijk.`,
        ik ? `Het wordt strafschoppen. Jij staat in het doel en stopt er twee. Bij 4-4 mag jullie ploeg de laatste nemen. De trainer kijkt naar jou en ${vn}: wie? Langs de lijn staat ${opa}, die veertig jaar geleden zelf spits was, met zijn handen in zijn jaszakken.`
          : `Het wordt strafschoppen.${hij ? ` ${vn} staat in het doel en stopt er twee.` : ''} Bij 4-4 kijkt de trainer naar jullie twee: wie neemt de laatste? Langs de lijn staat ${opa}, die veertig jaar geleden zelf spits was, met zijn handen in zijn jaszakken.`],
      opa:ik ? '"Een keeper die een penalty neemt? Dat durven alleen de echten. Maar een echte ' + IK.vriend + ' weet wanneer ' + IK.hij + ' de bal moet geven."' : '"Een echte spits wil die bal. Maar een echte ' + IK.vriend + ' weet wanneer ' + IK.hij + ' hem moet geven."',
      opts:[
        // De laatste penalty zie je op het veld (penRichting/penKlaar): f krijgt pas daarna te horen of hij erin ging
        {...o(ik ? 'Zelf de laatste nemen, als keeper' : 'Zelf de laatste nemen', 'fel', (raak, p = {}) => { sp.journey.penalty = 'zelf';
          const begin = ik ? `Je loopt uit je doel naar de stip, voordat ${vn} iets kan zeggen. Een keeper die de laatste neemt, dat zie je zelden.` : `Je pakt de bal voordat ${vn} iets kan zeggen.`;
          if (raak){ zetBand(-5); mod('rep', 1); return `${begin} ${p.t || 'Hard, linksboven'}: kampioen! ${vn} juicht mee, maar je ziet dat ${vr.hij} hem zelf ook had willen nemen.`; }
          zetBand(-2); return `${begin} ${p.t || 'Hard, linksboven'}... maar hij gaat er niet in. Het wordt sudden death, en die verliezen jullie. ${vn} slaat een arm om je heen: "${ik ? 'Jij stopte er twee. Zonder jou stonden we hier niet eens.' : 'Volgende keer winnen we hem. Samen.'}" Je zegt niks. Je vergeet dit nooit.`; }), pen:'zelf'},
        {...o(`${vn} hem laten nemen`, 'kalm', raak => { sp.journey.penalty = 'vriend';
          if (raak){ zetBand(10); return ik ? `Je geeft ${vn} de bal. ${vr.Hij} schiet hem keihard in de kruising en rent dwars over het veld naar jouw doel: "Jij stopte er twee, ik maakte hem af. Samen, ${IK.knul}. Altijd samen."` : `Je geeft ${vn} de bal. ${vr.Hij} schiet hem keihard in de kruising. ${vr.Hij} rent meteen naar jou toe: "Samen, ${IK.knul}. Altijd samen."`; }
          zetBand(12); return `Je geeft ${vn} de bal. ${vr.Hij} schiet, maar de keeper heeft hem. Het wordt sudden death, en die verliezen jullie. In de kleedkamer huilt ${vn}. Jij blijft naast ${vr.hem} zitten tot iedereen weg is: "Volgende keer, samen."`; }), pen:'vriend'},
        {...o('Samen beslissen: tossen', 'bal', raak => { sp.journey.penalty = 'samen';
          if (raak){ zetBand(4); return `Jullie tossen. ${vn} wint, neemt hem en scoort. Op de foto in de krant staan jullie samen met de beker${ik ? ', jij nog in je keepershandschoenen' : ''}.`; }
          zetBand(6); return `Jullie tossen. ${vn} wint en neemt hem, maar mist. Het wordt sudden death, en die verliezen jullie. Op de foto in de krant staan jullie toch samen, met de zilveren medaille${ik ? ', jij nog in je keepershandschoenen' : ''}.`; }), pen:'samen'}]}; }
    case 1: return {
      tekst:[`Nu, ${sp.leeftijd} jaar oud. De selectiedagen in ${land}: twintig talenten, drie wedstrijden, en tribunes vol scouts. ${vriendApart() ? `${vn} doet ook mee, bij de selectiedagen voor ${vr.jongens}.` : `Jij en ${vn} zijn er allebei.`}`,
        `Op de scoutingranglijst sta je onderaan bij de ${{SPITS:'spitsen', MID:'middenvelders', VERD:'verdedigers', KEEPER:'keepers'}[sp.pos] || 'talenten'}. Alleen wie hoog eindigt, krijgt een aanbieding van een club uit de hoogste league. ${vn} slaat je op je schouder: "Wij gaan dit samen halen."`],
      opa:'"Kijk niet naar die lijst. Kijk naar de bal. De lijst volgt vanzelf."',
      opts:[
        o('"Samen halen we het."', 'kalm', () => { zetBand(4); return `${vn} grijnst. "Zo ken ik je."`; }),
        o('"Ik ga er gewoon voor."', 'bal', () => 'Je knikt en trekt je schoenen strak. Focus.'),
        o('"Sorry, maar vandaag ben jij ook mijn concurrent."', 'fel', () => { zetBand(-6); return `${vn} lacht, maar het klinkt een beetje geforceerd. "Dan zien we wel wie er hoger eindigt."`; })]};
    case 2: return {
      tekst:[`De selectiedagen zitten erop. Je eindigde op plek ${d.plek} van de ${d.van}${d.meerv ? ` ${d.meerv}` : ''}${d.plek <= (d.meerv ? 3 : 10) ? `, in de top ${d.meerv ? 3 : 10}` : ''}. ${vriendApart() ? `En ${vn}? Die deed het ook goed bij de selectiedagen voor ${vr.jongens}.` : `${vn} eindigde ${d.vriendMeerv && d.vriendMeerv !== d.meerv ? `bij de ${d.vriendMeerv} ` : ''}op plek ${d.vriendPlek}${d.vriendVan ? ` van de ${d.vriendVan}` : ''}.`}`,
        `Je telefoon blijft maar trillen: meerdere clubs willen met je praten. Nu moet jij kiezen welke club het beste bij je past. Speeltijd, salaris, het niveau, de speelstijl: denk goed na.`],
      opa:'"Ik koos ooit voor het geld. Twee jaar op de bank. Kies de club waar je speelt, ' + ik.jongen + '."', opts:[]};
    case 3: return {
      tekst:[`Je eerste week bij ${club().n}${sp.o23 ? ' (bij de O23)' : ''}. ${bijJou() ? `En wie loopt daar de kleedkamer in? ${vn}! Jullie hebben bij dezelfde club getekend.` : `${vn} tekende bij ${vriendClubNaam() || 'een andere club'}. Jullie appen elke avond.`}`,
        'De trainer neemt je apart. "Ik heb gezien wat je kunt. Maar hier begint iedereen weer bij nul."'],
      opa:'"De eerste weken bepalen hoe ze naar je kijken. Train alsof iemand meekijkt. Want dat doet er altijd iemand."',
      opts:[
        o('"Ik ga me elke dag bewijzen, trainer."', 'kalm', () => 'De trainer knikt tevreden.'),
        o('"Ik ben er klaar voor."', 'bal', () => 'De trainer glimlacht. "Dat zien we op het veld."'),
        o('"Ik hoor in de basis, dat ga ik laten zien."', 'fel', () => { mod('vert', -2); return 'De trainer trekt een wenkbrauw op. "Brutaal. Dat mag, als je het waarmaakt."'; })]};
    case 4: {
      // Een vriend(in) in de andere wereld: een grotere club daar. Jullie worden geen rivalen, hooguit groeien jullie wat uit elkaar
      if (d.apart){ const naarN = vriendClubInfo(d.naar).n, zijnN = vriendClubNaam() || 'een andere club';
        return {tekst:[`Midden in de winterstop belt ${vn} je, laat op de avond. Een zaakwaarnemer, ${MAKELAAR}, wil ${vr.hem} van ${zijnN} naar ${naarN} halen. "Ze bieden me twee keer zoveel. Wat moet ik doen?"`,
          `Jullie spelen in een andere competitie, maar jullie dromen zijn hetzelfde gebleven. ${vn} vraagt jou altijd eerst.`],
          opa:`"Zaakwaarnemers als die ${MAKELAAR.split(' ')[1]} heb ik ook gekend. Ze beloven je de wereld en vergeten je naam zodra je geblesseerd bent."`, opts:[
          o(`"Blijf bij ${zijnN}. Daar ben je op je plek."`, 'kalm', () => { zetBand(10); breukUitkomst('blijft'); return `Het is even stil. Dan lacht ${vn}: "Je hebt gelijk." De volgende dag zegt ${vr.hij} nee tegen ${MAKELAAR}.`; }),
          o('"Doe wat goed voelt. Ik sta achter je."', 'bal', () => { zetBand(5); breukUitkomst('vriend'); return `${vn} tekent bij ${naarN}. "Elke zondag bellen, hè?" Vrienden blijven jullie.`; }),
          o('"Geld is niet alles. Maar doe maar wat je wilt."', 'fel', () => { breukUitkomst('rivaal'); modFans(1); return `${vn} tekent toch bij ${naarN}. Jullie spreken elkaar daarna een tijdje een stuk minder.`; })]}; }
      // Spelen jullie bij dezelfde club? (bij het openen vastgelegd; oudere opslag: nu bepalen, hij is nog niet vertrokken)
      const zelfde = d.zelfde ?? v.club === sp.club, zijn = CLUBS[v.club] ? CLUBS[v.club].n : '' + vr.zijn + ' club';
      const naar = CLUBS[d.naar].n, waar = `${naar}${d.derby ? `, de aartsrivaal van ${d.mijnNaam || club().n}` : ''}`, opa4 = `"Zaakwaarnemers als die ${MAKELAAR.split(' ')[1]} heb ik ook gekend. Ze beloven je de wereld en vergeten je naam zodra je geblesseerd bent."`;
      // Hecht: hij belt jou eerst en jouw antwoord beslist
      if (d.band >= 60) return {
        tekst:[`Midden in de winterstop belt ${vn} je, laat op de avond. Een zaakwaarnemer, ${MAKELAAR}, wil ${vr.hem} ${zelfde ? '' : `van ${zijn} `}naar ${waar} halen. "Ze bieden me twee keer zoveel. Maar ik wil eerst weten wat jij ervan vindt. Wat moet ik doen?"`,
          'Jullie kennen elkaar al sinds de kleuterschool. Dit is een gesprek dat je niet vergeet.'],
        opa:opa4, opts:[
        zelfde ? o('"Blijf. Samen maken we het hier."', 'kalm', () => { zetBand(10); breukUitkomst('blijft'); return `Het is even stil. Dan lacht ${vn}: "Je hebt gelijk. ${MAKELAAR} kan de boom in." De volgende dag zegt ${vr.hij} nee. Jullie blijven samen.`; })
          : o(`"Blijf bij ${zijn}. Daar ben je op je plek, en wij blijven gewoon vrienden."`, 'kalm', () => { zetBand(10); breukUitkomst('blijft'); return `Het is even stil. Dan lacht ${vn}: "Je hebt gelijk. ${MAKELAAR} kan de boom in." De volgende dag zegt ${vr.hij} nee. ${vr.Hij} blijft bij ${zijn}.`; }),
        o('"Doe wat goed voelt. Ik blijf je ' + ik.vriend + ', waar je ook speelt."', 'bal', () => { zetBand(5); breukUitkomst('vriend'); return `"Echt?" vraagt ${vr.hij}. "Echt," zeg je. ${vr.Hij} tekent bij ${naar}, maar jullie spreken af: elke zondag bellen. Vrienden blijven jullie.`; }),
        o('"Ga dan maar, als geld belangrijker is."', 'fel', () => { zetBand(-50); breukUitkomst('rivaal', -40); modFans(3); return `"Als jij er zo over denkt..." zegt ${vn}. ${vr.Hij} tekent bij ${naar}. Vanaf nu zijn jullie rivalen.`; })]};
      // Te ver uit elkaar gegroeid: hij is al weg zonder iets te zeggen
      if (d.band < 30) return {
        tekst:[`De winterstop is voorbij en je leest het op social media: ${vn} heeft een nieuwe zaakwaarnemer, ${MAKELAAR}, en tekende op de laatste dag van de transferperiode bij ${waar}.`,
          '' + vr.Hij + ' heeft je niet eens gebeld. Jullie spraken elkaar de laatste tijd ook bijna niet meer.'],
        opa:opa4, opts:[
        o('' + vr.Hem + ' toch succes wensen', 'kalm', () => { breukUitkomst('rivaal', 15); return `Je stuurt een kort berichtje. ${vr.Hij} reageert met een duimpje. Vanaf nu zijn jullie concurrenten.`; }),
        o('Het laten gaan', 'bal', () => { breukUitkomst('rivaal', -15); return 'Je zegt niets. Het voelt alsof er iets voorbij is.'; }),
        o('"Typisch. Altijd al voor zichzelf gekozen."', 'fel', () => { zetBand(-30); breukUitkomst('rivaal', -50); modFans(3); return 'Je zegt het hardop in de kleedkamer. Het staat de volgende dag in de krant. ' + vr.Hij + ' leest het ook.'; })]};
      // Ertussenin: hij heeft al getekend en belt pas daarna
      return {
        tekst:[`De winterstop is voorbij en het nieuws slaat in als een bom: ${vn} heeft een nieuwe zaakwaarnemer, ${MAKELAAR}, en tekende op de laatste dag van de transferperiode bij ${waar}.`,
          `Je leest het eerst op social media. Pas 's avonds belt ${vr.hij}. "${MAKELAAR} zegt dat ik daar meer kan verdienen en sneller kan doorbreken. Je snapt het toch?"`],
        opa:opa4, opts:[
        o('"Ik snap het. Succes, en we blijven vrienden."', 'kalm', () => { zetBand(-5); breukUitkomst('vriend'); return `Het blijft even stil. "Dank je," zegt ${vn} zacht. "Dat betekent veel." ${vr.Hij} speelt nu ergens anders, maar jullie blijven vrienden.`; }),
        o('"Je moet doen wat goed voor je is. Maar dit doet pijn."', 'bal', () => { zetBand(-25); breukUitkomst('rivaal', -15); return `"Ik weet het," zegt ${vn}. "Sorry." Jullie hangen op. Het voelt alsof er iets kapot is gegaan.`; }),
        o('"Je laat me gewoon in de steek. Voor geld."', 'fel', () => { zetBand(-50); breukUitkomst('rivaal', -50); modFans(3); return `"Weet je wat? Zie je op het veld," zegt ${vn}, en ${vr.hij} hangt op. De volgende ochtend staat jullie ruzie in de krant.`; })]};
    }
    case 5: if (vriendRoute()) return {
      tekst:[`${bijJou() ? `${vn} en jij spelen allebei bij ${club().n}` : `${vn} speelt bij ${vriendClubNaam() || 'een andere club'}, jij bij ${club().n}`}, maar jullie zijn nog steeds beste vrienden. De media noemen jullie "het gouden duo".`,
        'Een journalist vraagt: "Hoe overleeft jullie vriendschap de druk van het profvoetbal?"'],
      opa:'"Een echte vriend in het voetbal is zeldzamer dan een hattrick. Zuinig op zijn."',
      opts:[
        o('"Omdat we elkaar alles gunnen."', 'kalm', () => { zetBand(6); return 'Een mooi antwoord. Het interview wordt veel gedeeld.'; }),
        o('"We houden voetbal en vriendschap gescheiden."', 'bal', () => { zetBand(3); return 'Een volwassen antwoord. Je trainer knikt.'; }),
        o('"Op het veld ben ik nog steeds beter dan ' + vr.hij + '."', 'fel', () => { zetBand(-4); return `${vn} stuurt je een appje: "Dat gaan we nog zien 😄". ${vr.Hij} kan er wel om lachen.`; })]};
      return {
      tekst:[`${vn} is nu je rivaal. ${vriendPos() === 'KEEPER' ? 'Elke redding die ' + vr.hij + ' maakt' : 'Elke goal die ' + vr.hij + ' maakt'}, zie je voorbijkomen op je telefoon. De media smullen ervan: "De jeugdvrienden die rivalen werden".`,
        'Een journalist belt je voor een interview. "Wat vind je ervan dat je beste ' + vr.vriend + ' je heeft verlaten?"'],
      opa:isKeeper() ? '"Laat je beste antwoord op het veld zien. Woorden worden vergeten, reddingen niet."' : '"Laat je beste antwoord op het veld zien. Woorden worden vergeten, goals niet."',
      opts:[
        o('"' + vr.Hij + ' is een topspeler. Ik wens ' + vr.hem + ' het beste."', 'kalm', () => { zetRivaalBand(8); return 'Een keurig antwoord. De trainer leest het en knikt.'; }),
        o('"We zien wel wie er aan het eind van het seizoen beter is."', 'bal', () => 'Een eerlijk antwoord. De race is begonnen.'),
        o('"' + vr.Hij + ' koos voor het geld. Dat zegt genoeg."', 'fel', () => { zetRivaalBand(-12); krantMelding(`${sp.naam} haalt uit naar ex-vriend ${vn} ${v.n}`, `"${vr.Hij} koos voor het geld. Dat zegt genoeg," aldus ${sp.naam}.`); return 'Het interview gaat viral. Je rivaal leest het ook, dat weet je zeker.'; })]};
    case 6: if (vriendRoute()) return {
      tekst:[`De laatste speelronde van het seizoen komt eraan. ${bijJou() ? `Op de avond ervoor eten ${vn} en jij samen, zoals jullie al jaren doen voor een belangrijke wedstrijd.` : `${vn} belt: "Morgen de laatste speelronde. Na afloop samen eten, wat er ook gebeurt?"`}`,
        `"Weet je nog, die penalty's toen we tien waren?" vraagt ${vn}. ${sp.journey.penRaak === false
          ? (sp.journey.penalty === 'vriend' ? '"Jij gaf mij toen de bal, en ik miste. Jij bleef naast me zitten tot iedereen weg was. Dat ben ik nooit vergeten."' : sp.journey.penalty === 'zelf' ? '"Jij nam hem toen zelf, en miste. Nu snap ik waarom je altijd zo hard traint."' : '"Die foto met de zilveren medaille hangt nog steeds bij mijn ouders aan de muur."')
          : sp.journey.penalty === 'vriend' ? '"Jij gaf mij toen de bal. Dat ben ik nooit vergeten."' : sp.journey.penalty === 'zelf' ? '"Jij nam hem toen zelf. Nu snap ik waarom: jij wilt altijd winnen."' : '"Die foto hangt nog steeds bij mijn ouders aan de muur."'}`],
      opa:'"Ik had ooit een vriend zoals hij. Ik heb hem laten gaan. Jij niet. Daar ben ik trots op."',
      opts:[
        o('"Wat er ook gebeurt: samen."', 'kalm', () => { zetBand(10); mod('moraal', 8); return 'Jullie proosten met een glas cola. Wat een seizoen.'; }),
        o('"Eerst de wedstrijd, daarna feest."', 'bal', () => { zetBand(4); mod('focus', 4); return '"Deal," zegt ' + vr.hij + '.'; }),
        o('"Morgen laat ik je zien wie de beste is."', 'fel', () => { mod('focus', 6); return `${vn} grijnst: "Dat dacht je maar."`; })]};
      return {
      tekst:[`De laatste speelronde van het seizoen komt eraan. ${d.finale ? `Jullie stonden dit seizoen al tegenover elkaar in de bekerfinale. ` : ''}Op de avond voor de wedstrijd krijg je een bericht van ${vn}.`,
        `"Hé. Ik heb ${sp.journey.penalty === 'vriend' ? 'vaak gedacht aan die penalty die jij mij gaf, toen we tien waren' : sp.journey.penalty === 'zelf' ? 'vaak gedacht aan die finale toen we tien waren, toen jij die laatste penalty nam' : 'vaak gedacht aan die foto in de krant, toen we tien waren'}. ${MAKELAAR} belt me al weken niet meer terug. Kunnen we praten?"`],
      opa:'"Ik heb mijn beste vriend ooit laten gaan om een ruzie over niks. Daar heb ik veertig jaar spijt van gehad."',
      opts:[
        o('' + vr.Hem + ' bellen en het uitpraten', 'kalm', () => { zetRivaalBand(50); mod('moraal', 8); return `Jullie praten tot diep in de nacht. Over vroeger, over ${MAKELAAR}, over alles. Morgen zijn jullie tegenstanders, maar weer vrienden.`; }),
        o('"Na het seizoen. Eerst deze wedstrijd."', 'bal', () => { zetRivaalBand(20); return '"Deal," stuurt ' + vr.hij + ' terug, met een duimpje. Het ijs is gebroken.'; }),
        o('Niet reageren', 'fel', () => { zetRivaalBand(-20); mod('focus', 4); return 'Je legt je telefoon weg. Morgen laat je op het veld zien wat je ervan vindt.'; })]};
    case 7: return {
      tekst:[`Je eerste seizoen zit erop. ${d.samenvatting}`,
        d.bondscoach ? `En dan het mooiste nieuws: je naam staat op de voorlopige lijst van de bondscoach van ${interLand()}.` : `De bondscoach kijkt nog niet naar je. Maar dat kan snel veranderen.`,
        vriendRoute() ? `En ${vn}? Die is nog steeds je beste vriend. Dat had ${MAKELAAR} niet verwacht.` : sp.rivaal && sp.rivaal.exVriend && sp.rivaal.band >= 20 ? `Met ${vn} gaat het weer wat beter. Rivalen, maar met respect.` : `${vn} en jij zijn rivalen gebleven. Misschien komt dat ooit nog goed.`,
        `Je zit met ${opa} op zijn bank, waar je als kind alle wedstrijden met hem keek. Hij pakt een oude foto: hij zelf, veertig jaar geleden, met een beker. "Jij gaat verder komen dan ik ooit kwam."`],
      opa:'"Je verhaal begint nu pas, ' + ik.jongen + '. Maak er wat moois van."', opts:[]};
  }
  return {tekst:[], opa:'', opts:[]};
}
export const zetRivaalBand = d => { const R = S.sp.rivaal; if (R) R.band = clamp(R.band + d, -100, 100); };
export function kiesHoofdstuk(i){
  const H = S.hoofdstuk; if (!H || H.keuze !== null) return;
  const o = hoofdstukInhoud().opts[i]; if (!o) return;
  H.keuze = i;
  // De laatste penalty van de proloog: eerst zie je hem op het veld (zelf kies je eerst waar je schiet)
  if (o.pen){ H.pen = o.pen === 'zelf' ? {wie:'zelf', fase:'richting'} : {wie:o.pen, fase:'speel', anim:vriendPen()}; return; }
  H.uit = o.f() + ' ' + toonEffect(o.toon);
}
// Waar schiet je je penalty (proloog)? kans = de kans dat hij erin gaat
export const PEN_RICHTING = [
  {id:'laagL', l:'↙ Laag links', v:'hoek', kant:'L', kans:.75, t:'Laag in de linkerhoek', s:'Grote kans'},
  {id:'laagR', l:'↘ Laag rechts', v:'hoek', kant:'R', kans:.75, t:'Laag in de rechterhoek', s:'Grote kans'},
  {id:'hoogL', l:'↖ Kruising links', v:'kruising', kant:'L', kans:.65, t:'Hoog in de linkerkruising', s:'Mooi, maar hij kan over'},
  {id:'hoogR', l:'↗ Kruising rechts', v:'kruising', kant:'R', kans:.65, t:'Hoog in de rechterkruising', s:'Mooi, maar hij kan over'},
  {id:'midden', l:'⬆ Door het midden', v:'midden', kans:.65, t:'Keihard door het midden', s:'Blijft de keeper staan?'},
  {id:'panenka', l:'🥄 Panenka', v:'panenka', kans:.55, t:'Een panenka, rustig door het midden', s:'Lef! Maar een gok'}];
const penAnim = (schutter, r, goal) => ({soort:'penalty', type:'penalty', variant:r.v, kant:r.kant || null, goal, ok:false, schutter, verhaal:true, t:r.t, onder:'Jeugdfinale · laatste strafschop'});
// Je vriend schiet: raak gaat keihard in de kruising (zoals het verhaal zegt), mis kan overal
const vriendPen = () => { const raak = rnd() < .75; return penAnim('A', PEN_RICHTING[raak ? randInt(2, 3) : randInt(0, 3)], raak); };
export function penRichting(id){
  const H = S.hoofdstuk, p = H && H.pen; if (!p || p.fase !== 'richting') return;
  const r = PEN_RICHTING.find(x => x.id === id) || PEN_RICHTING[0];
  p.anim = penAnim('J', r, rnd() < r.kans); p.fase = 'speel';
}
// Na de animatie (of overgeslagen): de afloop en het effect
export function penKlaar(){
  const H = S.hoofdstuk, p = H && H.pen; if (!p || p.fase === 'klaar') return;
  if (!p.anim) penRichting(PEN_RICHTING[randInt(0, 1)].id);
  const o = hoofdstukInhoud().opts[H.keuze]; p.fase = 'klaar';
  S.sp.journey.penRaak = !!p.anim.goal;
  H.uit = o.f(p.anim.goal, p.anim) + ' ' + toonEffect(o.toon);
}
// "Verder": terug naar waar je was (of door naar het volgende hoofdstuk)
export function verderHoofdstuk(){
  const H = S.hoofdstuk; if (!H) return;
  const J = journey(); S.hoofdstuk = null;
  if (H.h === 0) return openHoofdstuk(1, 'selectie');
  if (H.h === 7){ J.club1 = S.sp.club; S.car.hist.push(`${seizoenLabel()}: einde van deel 1 van je verhaal`); }
  else if (VERVOLG[H.h] && DELEN.some(x => x.van === H.h + 1)) S.car.hist.push(`${seizoenLabel()}: einde van deel ${deelVan(H.h).nr} van je verhaal`);
  if (H.h === KLAAR - 1){ J.h = KLAAR; S.car.hist.push(`${seizoenLabel()}: het laatste hoofdstuk van je verhaal`); }
  if (H.uit && S.week) S.week.tekst.push(H.uit);
  S.fase = H.terug || 'week';
}

// ---------- je vriend ----------
// Hem in de selectie van een club zetten (bij de O23: op de bank)
export function plaatsVriend(id, o23){
  const v = S.sp.vriend; v.club = id; v.o23 = !!o23; v.land = thuisLand();
  if (vriendApart()) return; // (in de andere wereld: geen selectie)
  const sel = selectie(id), linie = LINIE_VAN[vriendPos()];
  if (sel.some(y => y.vriend)) return;
  const bank = sel.filter(y => y.pos === linie && !y.basis).sort((a, b) => a.k - b.k)[0]; if (bank) sel.splice(sel.indexOf(bank), 1);
  sel.push({v:v.v, n:v.n, pos:linie, basis:!o23, g:linie === 'A' ? 4 : linie === 'M' ? 2.2 : linie === 'K' ? 0 : 1, a:linie === 'M' ? 2.6 : linie === 'K' ? .1 : 1.4, k:v.k, lft:v.lft, vriend:true, bles:v.blessure > 0 ? v.blessure : 0});
}
// Je eigen club: die van je contract (op huur in eigen land: je eigen club, niet de huurclub)
const mijnVasteClub = () => { const sp = S.sp; return sp.huur && (!sp.huur.ouderLand || sp.huur.ouderLand === thuisLand()) ? sp.huur.ouder : sp.club; };
// Speelt je vriend(in) niet in de competitie waar jij nu zit? (een ander land, de andere wereld, of jij bent in het buitenland op huur)
const opAfstand = () => { const sp = S.sp; return vriendApart() || !vriendHier() || !!(sp.huur && sp.huur.ouderLand && sp.huur.ouderLand !== thuisLand()); };
// Alle clubs in de competitie van je vriend(in)
function vriendIds(){
  const land = vriendLand();
  if (vriendApart()) return [1, 2].flatMap(t => andereWereldIds(land, t));
  if (!vriendHier()) return Array.from({length:clubsLand(land) - 8}, (_, i) => 8 + i).filter(i => vreemdeClub(land, i).t >= 1);
  return [1, LAAGSTE].flatMap(t => divClubs(t));
}
// De breuk: hij/zij vertrekt naar een club in de league van je eigen club (het liefst je aartsrivaal) en wordt je vaste rivaal.
// Op afstand (een andere competitie): een grotere club daar, en geen rivalen
export function breukDoel(){
  const sp = S.sp, v = sp.vriend;
  if (opAfstand()){ const cur = vriendClubInfo(v.club), l = vriendIds().filter(i => i !== v.club && !(vriendHier() && i === sp.club)).map(i => [i, vriendClubInfo(i)]).filter(([, c]) => c && c.t >= 1 && cur && c.s > cur.s).sort((a, b) => a[1].s - b[1].s).map(x => x[0]);
    return {naar:l.length ? l[Math.min(l.length - 1, randInt(0, 2))] : null, derby:false, zelfde:false, apart:true}; }
  const mijn = mijnVasteClub(), t = CLUBS[mijn].t, huur = sp.huur ? sp.club : null, derby = derbyVan(mijn), zijn = v ? v.club : null, zelfde = zijn === mijn;
  const mag = i => i !== mijn && i !== zijn && i !== huur, mijnNaam = CLUBS[mijn].n;
  if (derby != null && CLUBS[derby].t === t && mag(derby)) return {naar:derby, derby:true, zelfde, mijnNaam};
  const l = divClubs(t).filter(mag).sort((a, b) => CLUBS[b].s - CLUBS[a].s);
  return {naar:l.length ? l[randInt(0, Math.min(2, l.length - 1))] : null, derby:false, zelfde, mijnNaam};
}
// Wat er gebeurt na het gesprek: 'blijft' (hij zegt nee tegen de zaakwaarnemer), 'vriend' (hij vertrekt, jullie blijven vrienden)
// of 'rivaal' (hij vertrekt en wordt je rivaal)
export function breukUitkomst(soort, band, naar = S.hoofdstuk && S.hoofdstuk.data.naar){
  const sp = S.sp, v = sp.vriend, J = sp.journey;
  if (opAfstand() && soort === 'rivaal'){ soort = 'vriend'; zetBand(-20); } // (in een andere competitie: jullie groeien uit elkaar, maar worden geen rivalen)
  if (J) J.route = soort === 'rivaal' ? 'rivaal' : 'vriend';
  if (soort === 'blijft'){ S.car.hist.push(`${seizoenLabel()}: jeugdvriend ${v.voornaam} ${v.n} zegt nee tegen ${MAKELAAR}`); return; }
  if (soort === 'vriend'){
    if (naar == null) return;
    if (vriendHier()){ const oud = v.club != null ? selectie(v.club) : null; if (oud){ const x = oud.find(y => y.vriend); if (x) oud.splice(oud.indexOf(x), 1); }
      plaatsVriend(naar, false); }
    else v.club = naar; // (in een ander land of de andere wereld: alleen een andere club, het land blijft)
    v.weg = false;
    const nn = vriendClubInfo(naar).n;
    S.car.hist.push(`${seizoenLabel()}: jeugd${vr.vriend} ${v.voornaam} ${v.n} vertrekt naar ${nn}, jullie blijven vrienden`);
    krantMelding(`${v.voornaam} ${v.n} kiest voor ${nn}`, `De ${vr.jeugdvriend} van ${sp.naam} tekende op de laatste dag van de transferperiode. "We blijven beste vrienden," zegt ${vr.hij}.`);
    return;
  }
  vriendWordtRivaal(band, naar);
}
export function vriendWordtRivaal(band, naar = S.hoofdstuk && S.hoofdstuk.data.naar){
  const sp = S.sp, v = sp.vriend; if (naar == null || opAfstand()) return;
  // Had je al een (andere) rivaal, dan neemt je ex-vriend die plaats in
  if (sp.rivaal && !sp.rivaal.exVriend){ const r = sp.rivaal, sel = CLUBS[r.club] ? selectie(r.club) : null; if (sel){ const x = sel.find(y => y.n === r.n && y.v === r.v); if (x) x.rivaal = false; } sp.rivaal = null; }
  if (sp.rivaal) return;
  if (sp.journey) sp.journey.route = 'rivaal'; // (je ex-vriend houdt als rivaal zijn eigen positie: pos)
  const oud = v.club != null ? selectie(v.club) : null; if (oud){ const x = oud.find(y => y.vriend); if (x) oud.splice(oud.indexOf(x), 1); }
  sp.rivaal = {v:v.v, n:v.n, pos:vriendPos(), lft:v.lft, k:v.k, pot:v.pot, kVorig:v.k, club:naar, achtergrond:'Jullie waren beste vrienden, tot ' + vr.hij + ' vertrok.', karakter:pick(Object.keys(PERS)),
    onderling:{w:0, g:0, v:0}, hist:[], seizoen:null, band, race:{}, exVriend:true};
  plaatsRivaal(naar);
  v.club = naar; v.weg = true; v.land = thuisLand();
  S.car.hist.push(`${seizoenLabel()}: jeugdvriend ${v.voornaam} ${v.n} vertrekt naar ${CLUBS[naar].n} en wordt je rivaal`);
  krantMelding(`${v.voornaam} ${v.n} kiest voor ${CLUBS[naar].n}`, `De ${vr.jeugdvriend} van ${sp.naam} tekende op de laatste dag van de transferperiode. ${vr.Zijn} nieuwe zaakwaarnemer ${MAKELAAR} regelde de overstap.`);
}

// ---------- toonmomenten: hoe reageer jij? (tussen de wedstrijden, elk één keer per seizoen) ----------
export function toonEvents(){
  const sp = S.sp; if (!sp || sp.clubloos || S.trainer) return [];
  const gezien = sp.toonGezien = sp.toonGezien || {}, tm = (selectie(sp.club).filter(x => !x.vriend && !x.rivaal)[0] || {n:'Bakker'}).n, c = club().n;
  const ev = (id, tekst, opts) => gezien[id] === S.jaar ? null : {soort:'club', tekst, opts:opts.map(([l, toon, f]) => ({l, toon, f(){ gezien[id] = S.jaar; return f(); }}))};
  const vol = n => { const x = Math.round(n + social().volgers * .01); social().volgers += x; return x; };
  return [
    ev('bank', `De trainer van ${c} zet je deze week op de bank. Na de training vraagt hij: "Wat vind je daarvan?"`, [
      ['"Ik snap het. Ik ga harder werken."', 'kalm', () => { mod('vert', 5); return 'De trainer knikt. "Zo wil ik het horen."'; }],
      ['"Ik ben het er niet mee eens, maar ik accepteer het."', 'bal', () => { mod('moraal', 2); mod('vert', 1); return 'Een eerlijk antwoord. Hij respecteert het.'; }],
      ['"Dit slaat nergens op. Ik hoor in de basis."', 'fel', () => { mod('vert', -6); modFans(2); return 'Hij kijkt je lang aan. "Laat het dan zien." De fans steunen je online.'; }]]),
    ev('kritiek', `Na een nederlaag zegt ${tm} in de kleedkamer dat jij te veel balverlies had.`, [
      ['"Je hebt gelijk. Ik let erop."', 'kalm', () => { iedereen(2); mod('focus', 2); return 'De sfeer ontspant. Je bent de bal in de volgende training extra zuinig.'; }],
      ['"We verloren als team, niet door mij alleen."', 'bal', () => { mod('moraal', 1); return 'Een paar teamgenoten knikken. Het is klaar.'; }],
      ['"Kijk eerst naar jezelf."', 'fel', () => { zetKleedBand(tm, -10); mod('moraal', 2); return `${tm} loopt boos weg. De rest kijkt naar de grond.`; }]]),
    ev('journalist', 'Een bekende journalist schrijft dat je "overschat" bent en "nooit de top haalt".', [
      ['Niet reageren', 'kalm', () => { mod('focus', 4); return 'Je laat je voetbal spreken. Je focus is scherp.'; }],
      ['"Iedereen mag een mening hebben."', 'bal', () => { mod('moraal', 2); return 'Een volwassen reactie. De ophef is snel voorbij.'; }],
      ['"Hij heeft zelf nooit een bal geraakt."', 'fel', () => { const n = vol(80); modFans(3); mod('rep', -1); return `Je reactie gaat viral: +${n} volgers. Niet iedereen vindt het netjes.`; }]]),
    ev('haters', 'Na een slechte wedstrijd krijg je honderden boze berichten op social media.', [
      ['Je telefoon wegleggen', 'kalm', () => { mod('focus', 3); mod('moraal', 1); return 'Je zet je meldingen uit en gaat vroeg slapen.'; }],
      ['"Ik baal ook. Volgende week beter."', 'bal', () => { modFans(2); return 'Veel fans waarderen je eerlijke reactie.'; }],
      ['Hard terugschrijven', 'fel', () => { const n = vol(50); mod('rep', -2); modFans(-2); return `Je reactie wordt gescreenshot en gedeeld. +${n} volgers, maar je reputatie krijgt een deuk.`; }]]),
    ev('scheids', 'De scheidsrechter van vorige week zegt in de krant dat je een "toneelspeler" bent.', [
      ['"Geen commentaar."', 'kalm', () => { mod('vert', 2); return 'Je houdt je mond. De bond waardeert het.'; }],
      ['"Ik ging echt neer. Kijk de beelden maar."', 'bal', () => { mod('moraal', 1); return 'De beelden zijn niet duidelijk. Het blijft bij een discussie.'; }],
      ['"Hij moet zelf eens naar de oogarts."', 'fel', () => { sp.geld = Math.max(0, sp.geld - 500); modFans(3); return 'De bond geeft je een boete van €500. Je fans vinden het prachtig.'; }]]),
    ev('vrijetrap', `${tm} wil voortaan de vrije trappen nemen, terwijl jij die altijd neemt.`, [
      ['"Laten we het om de beurt doen."', 'kalm', () => { zetKleedBand(tm, 6); return '' + team.Hij + ' grijnst. "Deal." De trainer vindt het prima.'; }],
      ['"Laat de trainer het maar beslissen."', 'bal', () => { mod('vert', 1); return 'De trainer kiest voor jou, maar ${tm} mag de volgende keer.'.replace('${tm}', tm); }],
      ['"Vergeet het maar. Die zijn van mij."', 'fel', () => { zetKleedBand(tm, -8); mod('moraal', 2); return 'Jij blijft de vrije trappen nemen. ' + team.Hij + ' praat de rest van de week niet met je.'; }]]),
    ev('nieuweling', 'De aanvoerder vraagt of je de nieuwe ' + team.jongen + ' wilt helpen, terwijl ' + team.hij + ' jouw concurrent is op jouw positie.', [
      ['' + team.Hem + ' helpen', 'kalm', () => { iedereen(3); mod('vert', 3); return 'Je laat ' + team.hem + ' alles zien. De groep waardeert het enorm.'; }],
      ['' + team.Hem + ' een beetje op weg helpen', 'bal', () => { iedereen(1); return 'Je geeft ' + team.hem + ' wat tips, maar niet al je geheimen.'; }],
      ['"' + team.Hij + ' zoekt het zelf maar uit."', 'fel', () => { iedereen(-3); mod('focus', 3); return 'De aanvoerder is teleurgesteld. Jij bent gefocust op je eigen plek.'; }]]),
    ev('uitdaging', 'Een speler van de volgende tegenstander daagt je uit op social media: "Zondag sta jij in mijn zak."', [
      ['Negeren', 'kalm', () => { mod('focus', 4); return 'Je reageert niet. Zondag laat je het op het veld zien.'; }],
      ['"Zie je zondag 👋"', 'bal', () => { const n = vol(30); return `Een kort, cool antwoord. +${n} volgers.`; }],
      ['"Na zondag zit jij in de mijne."', 'fel', () => { const n = vol(90); modFans(3); mod('focus', -2); return `De hele voetbalwereld kijkt mee. +${n} volgers. Zondag moet je het wel waarmaken.`; }]]),
  ].filter(Boolean);
}
const zetKleedBand = (naam, d) => { try { kleedBand(naam, d); } catch (e){} };

// ---------- zijn cijfers: wie is er beter? ----------
// Goals en assists dit seizoen (uit de topscorerslijst, over alle clubs), net als bij de rivaal
export function vriendStats(){
  const v = S.sp && S.sp.vriend; let g = 0, a = 0; if (!v) return {g, a};
  // Speelt hij in een ander land dan jij, dan zit zijn competitie niet in het spel: een schatting uit zijn klasse en de speelronde
  if (!v.weg && !vriendHier() && v.club != null){
    const k = v.k || 60, pos = LINIE_VAN[vriendPos()] || 'M', gemist = v.blesSz && v.blesSz.jaar === S.jaar ? v.blesSz.wk : 0, ronde = Math.max(0, Math.min(S.ronde || 0, 34) - gemist) * .85, vorm = .8 + ((S.jaar * 37 + v.n.length * 11) % 40) / 100;
    const rg = pos === 'A' ? .3 + (k - 65) * .012 : pos === 'M' ? .12 + (k - 65) * .004 : pos === 'K' ? 0 : .04, ra = pos === 'A' ? .12 : pos === 'M' ? .2 + (k - 65) * .004 : pos === 'K' ? .01 : .06;
    return {g:Math.max(0, Math.round(rg * ronde * vorm)), a:Math.max(0, Math.round(ra * ronde * vorm))};
  }
  for (const x of Object.values((S.ss && S.ss.st) || {})) if (!x.jij && x.n === v.n && x.v === v.v){ g += x.g || 0; a += x.a || 0; }
  return {g, a};
}
// Zijn klasse: die van zijn speler in de selectie (groeit elke zomer mee), of als rivaal die van de rivaal
export function vriendKlasse(){
  const sp = S.sp, v = sp && sp.vriend; if (!v) return null;
  if (v.weg && sp.rivaal && sp.rivaal.exVriend) return sp.rivaal.k;
  return v.k;
}
// ---------- hij wordt ook beter ----------
// Net als je rivaal groeit hij tot zijn talent (v.pot): de helft in de winterstop, de rest in de zomer. Raakt hij ver achter
// op jou, dan zet hij een tandje bij. v.k en v.lft zijn de echte waarden; zijn speler in de selectie volgt mee.
const zetVriendK = k => { const v = S.sp.vriend; v.k = clamp(Math.round(k), 30, 95); const x = vriendSpeler(); if (x){ x.k = v.k; x.lft = v.lft; } };
function vriendGroei(n){ const v = S.sp.vriend; if (n > 0) n = Math.min(n, Math.max(0, v.pot - v.k)); zetVriendK(v.k + n); }
// Oude opslag: hij is nooit gegroeid, dus haalt hij de gemiste seizoenen één keer in
function vriendInhalen(){
  const sp = S.sp, v = sp.vriend, J = sp.journey; if (!v || v.groeiTot != null) return;
  const gemist = Math.max(0, S.jaar - ((J && J.jaar) || S.jaar)), x = vriendSpeler();
  if (x && x.k > v.k) v.k = x.k;
  v.lft = Math.max(v.lft || 0, sp.leeftijd - gemist);
  if (!v.weg) for (let i = 0; i < gemist; i++){ vriendGroei(groeiSeizoen(v)); v.lft++; }
  else v.lft = sp.leeftijd;
  v.groeiTot = S.jaar - 1; v.kVorig = v.k; zetVriendK(v.k);
}
export function vriendWinter(){
  const v = S.sp.vriend; if (!v || v.weg || v.groeiJaar === S.jaar) return;
  v.groeiJaar = S.jaar;
  const G = groeiSeizoen(v), half = G > 0 ? Math.ceil(G / 2) : Math.trunc(G / 2), voor = v.k;
  vriendGroei(half); v.groeiRest = G - half;
  if (ovr(S.sp) - v.k >= 8 && v.lft < 30) vriendGroei(1); // ver achter: hij zet een tandje bij
  if (v.k !== voor && S.week) S.week.tekst.push(`${v.voornaam} ${v.k > voor ? 'wordt ook beter' : 'gaat wat achteruit'}: klasse ${voor} → ${v.k}.`);
}
// In de zomer (naSeizoen): de rest van zijn groei, en een jaar ouder. Geeft een regel voor je seizoensoverzicht.
export function vriendOuder(){
  const sp = S.sp, v = sp && sp.vriend; if (!v || S.trainer) return null;
  vriendInhalen();
  if (v.weg){ if (sp.rivaal && sp.rivaal.exVriend){ v.k = sp.rivaal.k; v.lft = sp.rivaal.lft; } v.groeiTot = S.jaar; return null; } // als rivaal groeit hij in rivaal.js
  const voor = v.k, rest = v.groeiJaar === S.jaar ? (v.groeiRest || 0) : groeiSeizoen(v);
  // zijn talent groeit met dat van jou mee: hij is net zo'n groot talent
  v.pot = Math.max(v.pot || 0, (sp.pot || 70) - 3);
  vriendGroei(rest);
  const gat = ovr(sp) - v.k; if (gat >= 6 && v.lft < 30){ zetVriendK(v.k + (gat >= 10 ? 3 : 2)); if (v.k > v.pot) v.pot = v.k; }
  v.groeiRest = 0; v.lft++; v.groeiTot = S.jaar; zetVriendK(v.k);
  if (v.blessure > 0){ v.blessure = Math.max(0, v.blessure - 8); const x = vriendSpeler(); if (x) x.bles = v.blessure; if (!v.blessure) v.blesSoort = null; } // (de zomer telt als 8 weken herstel)
  const begin = v.kVorig ?? voor; v.kVorig = v.k; // (klasse aan het begin van dit seizoen)
  const groei = v.k > begin ? `${v.voornaam} is ook beter geworden: klasse ${begin} → ${v.k}.` : v.k < begin ? `${v.voornaam} gaat wat achteruit: klasse ${begin} → ${v.k}.` : null;
  const tr = vriendTransfer();
  return [groei, tr].filter(Boolean).join(' ') || null;
}
// ---------- zijn carrière: hij wisselt van club als hij te goed (of te zwak) is voor zijn club ----------
export function vriendTransfer(){
  const sp = S.sp, v = sp.vriend; if (!v || !vriendActief() || bijJou() || v.club == null || v.komt) return null;
  const land = vriendLand(), hier = vriendHier(), info = id => vriendClubInfo(id), cur = info(v.club);
  if (!cur) return null;
  const omhoog = v.k >= cur.s + 5, omlaag = v.k <= cur.s - 8; if (!omhoog && !omlaag) return null;
  const ids = hier ? [1, LAAGSTE].flatMap(t => divClubs(t)) : vriendApart() ? [1, 2].flatMap(t => andereWereldIds(land, t)) : Array.from({length:clubsLand(land) - 8}, (_, i) => 8 + i);
  const kand = ids.filter(i => { const c = info(i); return i !== v.club && !(hier && i === sp.club) && c && c.t >= 1 && (omhoog ? c.s >= cur.s + 2 && c.s >= v.k - 6 && c.s <= v.k - 1 : c.s < cur.s && c.s >= v.k - 6); });
  if (!kand.length) return null;
  const naar = pick(kand), nieuw = info(naar), oud = cur.n;
  if (hier){ const sel = selectie(v.club), x = sel.find(y => y.vriend); if (x){ sel.splice(sel.indexOf(x), 1); selectie(v.club); herschik(sel); }
    plaatsVriend(naar, false); const y = vriendSpeler(); if (y){ y.k = v.k; y.lft = v.lft; } herschik(selectie(naar)); }
  else { v.club = naar; v.land = land; }
  const div = hier ? DIVS[nieuw.t] : nieuw.div || '';
  krantMelding(`${v.voornaam} ${v.n} ${omhoog ? 'maakt de stap' : 'vertrekt'} naar ${nieuw.n}`, `De ${vr.jeugdvriend} van ${sp.naam} (klasse ${v.k}) ${omhoog ? `was te goed voor ${oud}` : `kwam bij ${oud} nauwelijks aan spelen toe`}. ${vr.Hij} tekent bij ${nieuw.n}${div ? ` (${div})` : ''}.`);
  return `${v.voornaam} maakt de overstap van ${oud} naar ${nieuw.n}${div ? ` (${div})` : ''}!`;
}
// Oude opslag: zijn talent lag vast en hij bleef ver achter. Eén keer: een even groot talent, en zo nodig een doorbraak
function vriendTalent(){
  const sp = S.sp, v = sp.vriend; if (!v || v.talentV2) return; v.talentV2 = true;
  if (v.weg) return;
  v.pot = Math.max(v.pot || 0, (sp.pot || 70) - 3 + randInt(-1, 2));
  const o = ovr(sp), voor = v.k;
  if (o - v.k >= 10 && v.lft < 31){ zetVriendK(Math.min(Math.max(v.pot, v.k), o - randInt(4, 7)));
    if (v.k > voor){ krantMelding(`Doorbraak voor ${v.voornaam} ${v.n}`, `De ${vr.jeugdvriend} van ${sp.naam} groeit in korte tijd van klasse ${voor} naar ${v.k}. "Ik heb ${ik.hem} altijd achterna gezeten."`); if (S.week) S.week.tekst.push(`${v.voornaam} maakt een enorme sprong: klasse ${voor} → ${v.k}.`); } }
  const t = vriendTransfer(); if (t && S.week) S.week.tekst.push(t);
}
// Einde seizoen: zijn cijfers bij zijn carrière, en een regel in jullie geschiedenis
export function vriendSeizoen(){
  const sp = S.sp, v = sp && sp.vriend; if (!v || S.trainer) return;
  const st = vriendStats(), k = vriendKlasse(), C = v.carriere = v.carriere || {g:0, a:0, seizoenen:0};
  if (v.carriereJaar === S.jaar) return; // al meegeteld
  C.g += st.g; C.a += st.a; C.seizoenen++; v.carriereJaar = S.jaar; if (k) v.k = k;
  const doel = vriendPos() === 'SPITS' || sp.pos === 'SPITS' ? 'g' : 'a', woord = doel === 'g' ? 'goals' : 'assists', jij = S.ss[doel] || 0, hij = st[doel];
  (v.hist = v.hist || []).push(`${seizoenLabel()}: jij ${jij}, ${v.voornaam} ${hij} ${woord} · ${vr.zijn} klasse ${k}`); if (v.hist.length > 12) v.hist.shift();
}

// ---------- samen in het veld ----------
// Speelt je vriend in deze wedstrijd in jouw team? Bij de selectiedagen altijd; bij je club als jullie allebei in het
// eerste elftal (of allebei bij de O23) zitten en hij in de basis staat
export const vriendSpeler = () => { const sp = S.sp, v = sp.vriend; if (!v || v.club == null || !vriendHier()) return null; return selectie(v.club).find(y => y.vriend) || null; };
export function vriendInTeam(M){
  const sp = S.sp, v = sp.vriend; if (!M || !v || v.blessure > 0) return false;
  if (M.inter) return !!(M.vriendMee && M.vriendMee.basis); // samen in het nationale team
  if (M.selectie) return !vriendApart();
  if (!vriendActief() || !bijJou() || !!v.o23 !== !!sp.o23) return false;
  if (sp.o23) return !!vriendSpeler();
  return startElf(sp.club, true).elf.some(x => x.vriend);
}
export const zetVriendBand = d => { if (S.sp.vriend && d) zetBand(d); };
// Speel je tegen je vriend? (hij speelt bij de tegenstander en is geen rivaal)
// Speelt hij bij de tegenstander (en is hij geen rivaal)? En staat hij in hun basiself (zoals in de intro)?
export const vriendBijTegenstander = opp => { const sp = S.sp; return opp != null && !sp.o23 && vriendActief() && vriendHier() && sp.vriend.club === opp && !sp.vriend.o23 && !(sp.vriend.blessure > 0); };
export const speeltTegenVriend = opp => vriendBijTegenstander(opp) && startElf(opp, false, 'M').elf.some(x => x.vriend);
// Vóór de wedstrijd: hij appt je (één keer per week, niet verplicht)
export function vriendDuelVraag(){
  const w = S.week; if (!w) return null; if (w.vriendPers) return w.vriendPers;
  return w.vriendPers = {vraag:`"Zondag sta ik tegenover je 😏 Klaar om te verliezen?"`, klaar:false, opts:[
    {toon:'kalm', l:'"Ik gun je alles, behalve zondag."', e:'focus +3 · band +2'},
    {toon:'bal', l:'"Na afloop samen eten, wie er ook wint."', e:'moraal +2 · band +3'},
    {toon:'fel', l:'"Ik ga je zondag door de benen spelen."', e:'moraal +3 · ' + vr.hij + ' wordt feller · band −2 (met een lach)'}]};
}
export function vriendDuelAntwoord(i){
  const P = vriendDuelVraag(), vn = vriendNaam(); if (!P || P.klaar) return;
  const o = P.opts[i]; P.klaar = true; P.keuze = i; toonMeter(o.toon);
  if (o.toon === 'kalm'){ mod('focus', 3); zetBand(2); P.uit = `${vn} stuurt een hartje terug. "Ik jou ook, behalve zondag."`; }
  else if (o.toon === 'bal'){ mod('moraal', 2); zetBand(3); P.uit = `"Deal," appt ${vn}. "Jij betaalt als je verliest."`; }
  else { mod('moraal', 3); zetBand(-2); S.week.vriendFel = true; P.uit = `${vn} stuurt drie lachende emoji's terug. "Dat wil ik weleens zien."`; }
}
// Na afloop: shirts ruilen, een knuffel, of hem plagen (of boos weglopen)
export function vriendNaOpties(M){
  const gewonnen = M.us > M.them, verloren = M.us < M.them;
  return [{toon:'kalm', l:'Shirts ruilen', e:'band +4'}, {toon:'bal', l:'Een knuffel en samen een foto', e:'band +3 · volgers +'},
    gewonnen ? {toon:'fel', l:'' + vr.Hem + ' plagen met de uitslag', e:'band −2 · fans +2'} : verloren ? {toon:'fel', l:'Boos weglopen', e:'band −5'} : {toon:'fel', l:'"Volgende keer win ik"', e:'band −1 · moraal +2'}];
}
export function vriendNa(i){
  const M = S.M; if (!M || !M.vriendNa || M.vriendNa.keuze != null) return;
  const sp = S.sp, vn = vriendNaam(), o = vriendNaOpties(M)[i]; if (!o) return;
  M.vriendNa.keuze = i; toonMeter(o.toon);
  if (o.toon === 'kalm'){ zetBand(4); S.car.hist.push(`${seizoenLabel()}: shirt geruild met ${vn} ${sp.vriend.n}`); M.vriendNa.uit = `Jullie ruilen shirts in de middencirkel. ${vr.Zijn} shirt krijgt een plek aan je muur.`; }
  else if (o.toon === 'bal'){ zetBand(3); const n = Math.round(40 + social().volgers * .015); social().volgers += n; M.vriendNa.uit = `De foto van jullie knuffel gaat rond: +${n} volgers. "Vrienden voor het leven."`; }
  else if (M.us > M.them){ zetBand(-2); modFans(2); M.vriendNa.uit = `Je wijst lachend naar het scorebord. ${vn} gooit ${vr.zijn} bidon naar je. Je fans vinden het prachtig.`; }
  else if (M.us < M.them){ zetBand(-5); M.vriendNa.uit = `Je loopt zonder iets te zeggen naar binnen. ${vn} kijkt je verbaasd na.`; }
  else { zetBand(-1); mod('moraal', 2); M.vriendNa.uit = `"Volgende keer win ik," zeg je. "Dat zeg je al sinds je tiende," lacht ${vn}.`; }
}

// ---------- elke week iets met je vriend (1 per week) ----------
export const VRIEND_ACTIES = {
  bellen: {n:'Appen en bellen', s:'band +3'},
  trainen:{n:'Samen extra trainen', s:'band +6 · fitheid −6 · kans op groei', zelfde:true},
  chillen:{n:'Samen gamen of chillen', s:'band +5 · moraal +3 · fitheid −2'},
  eten:   {n:'Samen uit eten · €80', s:'band +8', prijs:80},
  advies: {n:'Om advies vragen', s:'band +4 · focus +3'},
  overhalen:{get n(){ return `Vragen of ${vr.hij} bij jouw club komt`; }, get s(){ return `${vr.hij} beslist zelf`; }, komen:true},
  afstand:{n:'Afstand nemen', s:'band −10 · jullie groeien uit elkaar'},
};
export const kanVriendActie = id => { const sp = S.sp, a = VRIEND_ACTIES[id]; return vriendActief() && S.week && !S.week.vriend && !sp.clubloos && (!a.zelfde || bijJou()) && (!a.komen || kanVragen()) && (!a.prijs || sp.geld >= a.prijs); };
export function vriendActie(id){
  if (!kanVriendActie(id)) return;
  const sp = S.sp, v = sp.vriend, vn = v.voornaam, w = S.week; let t;
  if (id === 'bellen'){ zetBand(3); t = pick([`Je belt een uur met ${vn}. Over voetbal, over ${vp.jongens}, over vroeger.`, `${vn} stuurt een filmpje van ${vr.zijn} mislukte rabona. Jullie appen de hele avond.`]); }
  else if (id === 'trainen'){ zetBand(6); mod('fit', -6); const groei = rnd() < .3 * weekFactor() + .05; if (groei){ const k = pick(['afw', 'pas', 'drib', 'verd', 'cond']); sp.a[k] = Math.min(99, sp.a[k] + 1); if (rnd() < .4) vriendGroei(1); }
    t = `Na de training blijven ${vn} en jij nog een uur op het veld.${groei ? ' Je wordt er echt beter van.' : ' Lekker gewerkt.'}`; }
  else if (id === 'chillen'){ zetBand(5); mod('moraal', 3); mod('fit', -2); t = `Jullie gamen tot middernacht. ${vn} wint, zoals altijd. ${vr.Hij} zegt het, zoals altijd.`; }
  else if (id === 'eten'){ sp.geld -= VRIEND_ACTIES.eten.prijs; zetBand(8); t = `Samen uit eten. ${vn} vertelt over ${vr.zijn} familie, jij over je dromen. Net als vroeger.`; }
  else if (id === 'advies'){ zetBand(4); mod('focus', 3); t = `Je vraagt ${vn} wat ${vr.hij} van je laatste wedstrijden vond. ${vr.Hij} is eerlijk, en ${vr.hij} heeft gelijk.`; }
  else if (id === 'overhalen') t = vraagOverkomen();
  else if (id === 'afstand'){ zetBand(-10); t = `Je reageert niet meer op de berichtjes van ${vn}. ${vr.Hij} merkt het wel.`; }
  w.vriend = id; w.tekst.push(t);
}
// ---------- samen in het nationale team ----------
// Hij komt uit hetzelfde land als jij (jullie groeiden samen op). Opgeroepen als zijn klasse rond de drempel van dat land ligt.
export function vriendInterland(land){
  const sp = S.sp, v = sp.vriend; if (!v || S.trainer || vriendApart() || v.blessure > 0) return null;
  const zijnLand = (sp.herkomst && sp.herkomst.geboren) || interLand(); if (land !== zijnLand) return null;
  const d = interDrempel(land); if (v.k + randInt(-2, 2) < d) return null;
  return {basis:v.k >= d + 4, eerste:!(v.int && v.int.caps)};
}
// Na de interland: zijn interlands en goals, en de eerste keer een debuut samen
export function vriendNaInterland(M){
  const sp = S.sp, v = sp.vriend, V = M && M.vriendMee; if (!v || !V) return [];
  const I = v.int = v.int || {caps:0, g:0}, g = M.vriendGoals || 0, uit = [];
  I.caps++; I.g += g;
  if (V.eerste){ zetBand(5); uit.push(`Debuut voor ${v.voornaam}! Samen in het nationale team, net als jullie vroeger droomden.`); S.car.hist.push(`${seizoenLabel()}: samen met jeugdvriend ${v.voornaam} in het nationale team`);
    krantMelding(`Jeugdvrienden samen bij ${M.inter.land}`, `${sp.naam} en ${v.voornaam} ${v.n} speelden als kinderen samen op het pleintje. Vandaag stonden ze samen in het nationale team.`); }
  uit.push(`${v.voornaam}: ${I.caps} ${I.caps === 1 ? 'interland' : 'interlands'}, ${I.g} ${I.g === 1 ? 'goal' : 'goals'}${g ? ` (vandaag ${g})` : ''}.`);
  return uit;
}

// ---------- hem naar jouw club halen ----------
// Hij beslist zelf: welke rol krijgt hij bij jou (op jouw linie, op klasse, met jou erbij), is hij te goed of te slecht
// voor je club, is het een stap omhoog of omlaag, staat hij nu in de basis, en hoe goed is jullie band?
const LINIE = LINIE_VAN, LINIE_NAAM = {A:'aanvallers', M:'middenvelders', V:'verdedigers', K:'keepers'}, ROL_TXT = {basis:'basisspeler', wissel:'wissel', tribune:'tribune'};
const zijnSterkte = () => { const v = S.sp.vriend; if (v.club == null) return 50; const c = vriendClubInfo(v.club); return c ? c.s : 50; };
// Staat je vriend bij zijn club in de basis? In jouw land: zijn plek in de selectie; in het buitenland een schatting
export const vriendInBasis = () => { const x = vriendSpeler(); return x ? !!x.basis : S.sp.vriend.k >= zijnSterkte() - 3; };
export function vriendBijMij(){
  const sp = S.sp, v = sp.vriend, l = LINIE[vriendPos()] || 'M', basis = (OPBOUW[l] || {basis:3}).basis; // (zijn eigen linie; speel jij daar ook, dan telt jij mee)
  const rij = [...selectie(sp.club).filter(x => x.pos === l && !x.vriend && !(x.bles > 0)).map(x => x.k || 0), ...(LINIE[sp.pos] === l ? [ovr(sp)] : [])].sort((a, b) => b - a);
  const plek = rij.filter(k => k > v.k).length, rol = plek < basis ? 'basis' : plek < basis + 2 ? 'wissel' : 'tribune';
  const nuBasis = vriendInBasis();
  return {rol, plek:plek + 1, van:rij.length + 1, linie:LINIE_NAAM[l], teGoed:v.k - CLUBS[sp.club].s >= 10, stap:CLUBS[sp.club].s - zijnSterkte(), nuBasis};
}
export const vriendRolTxt = () => { const b = vriendBijMij(); return `bij jou: ${ROL_TXT[b.rol]} (${b.plek}e van ${b.van} ${b.linie})${b.teGoed ? ' · ' + vr.hij + ' is te goed voor je club' : b.stap <= -5 ? ' · voor ' + vr.hem + ' een stap terug' : b.stap >= 5 ? ' · voor ' + vr.hem + ' een stap omhoog' : ''}`; };
const periode = () => `${S.jaar}-${S.ronde >= WINTER ? 2 : 1}`; // één keer vragen per halfjaar (tot de volgende transferperiode)
export const kanVragen = () => { const sp = S.sp, v = sp.vriend; return !!(v && vriendActief() && !vriendApart() && !bijJou() && !sp.o23 && !sp.clubloos && !v.komt && v.gevraagd !== periode()); };
function vraagOverkomen(){
  const sp = S.sp, v = sp.vriend, vn = v.voornaam, b = vriendBijMij(), zijn = vriendClubNaam() || '' + vr.zijn + ' club', mijn = club().n, wanneer = S.ronde < WINTER ? 'winter' : 'zomer';
  v.gevraagd = periode();
  if (b.rol === 'tribune') return `Je vraagt ${vn} of ${vr.hij} naar ${mijn} komt. ${vr.Hij} lacht een beetje ongemakkelijk: "Ik heb het al nagevraagd. Jullie trainer wil me niet: ik zou bij jullie op de tribune zitten."`;
  const score = (v.band - 40) / 15 + (b.rol === 'basis' ? 3 : 0) + b.stap * .25 - (b.nuBasis && b.rol !== 'basis' ? 2.5 : 0) - (b.teGoed ? 4 : 0);
  if (score >= 3){
    v.komt = {club:sp.club, land:thuisLand(), na:wanneer}; zetBand(5);
    return `Je vraagt ${vn} of ${vr.hij} naar ${mijn} komt. Het blijft even stil, en dan: "Ja! ${b.rol === 'basis' ? 'Jullie trainer ziet me als basisspeler.' : 'Ik moet knokken voor een basisplaats, maar samen met jou is dat het waard.'} In de ${wanneer === 'winter' ? 'winterstop' : 'zomer'} kom ik." Jullie band +5.`;
  }
  const reden = b.teGoed ? `"Sorry, maar ${mijn} is te laag voor mij. Ik wil op een hoger niveau spelen."`
    : b.nuBasis && b.rol !== 'basis' ? `"Bij ${zijn} sta ik in de basis. Bij jullie word ik wissel. Dat doe ik mijn carrière niet aan."`
    : b.stap <= -5 ? `"${zijn} is een grotere club dan ${mijn}. Voor mij zou het een stap terug zijn."`
    : '"Ik weet het niet... Ik heb het hier best naar mijn zin."';
  const goedeReden = b.teGoed || (b.nuBasis && b.rol !== 'basis') || b.stap <= -5;
  if (score >= 1){ zetBand(1); return `Je vraagt ${vn} of ${vr.hij} naar ${mijn} komt. ${vr.Hij} twijfelt. ${reden} "Vraag het me volgende keer nog eens."`; }
  if (!goedeReden) zetBand(-1);
  return `Je vraagt ${vn} of ${vr.hij} naar ${mijn} komt. ${vr.Hij} schudt ${vr.zijn} hoofd. ${reden}`;
}
// In de transferperiode (winterstop of zomer): hij komt echt, als jij daar nog speelt
function vriendKomt(){
  const sp = S.sp, v = sp.vriend, K = v.komt, vn = v.voornaam; v.komt = null;
  if (!vriendActief()) return;
  if (sp.clubloos || sp.club !== K.club || thuisLand() !== K.land){ if (S.week) S.week.tekst.push(`${vn} zou naar jouw oude club komen, maar jij speelt daar niet meer. De overstap gaat niet door.`); return; }
  const oud = vriendClubNaam() || '' + vr.zijn + ' oude club';
  if (vriendHier() && v.club != null){ const sel = selectie(v.club), x = sel.find(y => y.vriend); if (x){ sel.splice(sel.indexOf(x), 1); selectie(v.club); herschik(sel); } }
  plaatsVriend(sp.club, false); const x = vriendSpeler(); if (x){ x.k = v.k; x.lft = v.lft; } herschik(selectie(sp.club));
  const basis = !!(vriendSpeler() || {}).basis;
  S.car.hist.push(`${seizoenLabel()}: jeugdvriend ${vn} ${v.n} komt naar ${club().n}`);
  krantMelding(`${vn} ${v.n} herenigd met ${ik.jeugdvriend} ${sp.naam}`, `${vr.Hij} komt over van ${oud}. "${ik.Hij} vroeg het me zelf. Daar hoefde ik niet lang over na te denken."`);
  if (S.week) S.week.tekst.push(`${vn} is er! ${vr.Hij} komt over van ${oud} en is nu je ploeggenoot${basis ? ', en ' + vr.hij + ' staat meteen in de basis' : ''}.`);
}

// ---------- andersom: hij vraagt jou naar zijn club te komen ----------
// Jouw rol bij zijn club: in jouw land op klasse in zijn selectie (op jouw linie, met hem erbij), in het buitenland op de clubsterkte
const zijnClubInfo = () => vriendClubInfo();
export function rolBijHem(){
  const sp = S.sp, v = sp.vriend, o = ovr(sp), c = zijnClubInfo(), l = LINIE[sp.pos] || 'M', basis = (OPBOUW[l] || {basis:3}).basis;
  if (!vriendHier()) return o >= c.s + 3 ? 'basis' : o >= c.s - 4 ? 'wissel' : 'tribune';
  const rij = selectie(v.club).filter(x => x.pos === l && !x.vriend && !(x.bles > 0)).map(x => x.k || 0);
  if (LINIE[vriendPos()] === l) rij.push(v.k);
  const plek = rij.filter(k => k > o).length;
  return plek < basis ? 'basis' : plek < basis + 2 ? 'wissel' : 'tribune';
}
function vriendLokt(){
  const sp = S.sp, v = sp.vriend, vn = v.voornaam, c = zijnClubInfo(), rol = rolBijHem(), bl = !vriendHier(), stap = c.s - club().s;
  const K = {club:v.club, land:vriendLand()};
  const tekst = `${vn} belt je, helemaal enthousiast. "Onze trainer zoekt nog ${{SPITS:'een spits', MID:'een middenvelder', VERD:'een verdediger', KEEPER:'een keeper'}[sp.pos] || 'een speler'}. Ik heb jouw naam genoemd! ${rol === 'basis' ? 'Bij ons sta je meteen in de basis.' : 'Je moet knokken voor je plek, maar je hoort er echt bij.'} Kom je naar ${c.n}?"`
    + ` (${c.n}: ${clubPlek(bl ? K : {club:K.club})}.)` + (bl ? ` Dan moet je wel verhuizen naar ${vriendLand()}.` : '') + (stap >= 5 ? ' Het zou een stap omhoog zijn.' : stap <= -5 ? ` ${c.n} is wel kleiner dan ${club().n}.` : '');
  const wanneer = () => bl || S.ronde >= WINTER ? 'zomer' : 'winterstop';
  return {soort:'prive', tekst, opts:[
    {l:'"Ja, laten we het doen!"', toon:'bal', f(){ sp.vriendBod = K; zetBand(5); return `${vn} juicht door de telefoon. "Ik ga meteen naar de trainer!" In de ${wanneer()} doet ${c.n} een bod.`; }},
    {l:'"Ik denk erover na."', toon:'kalm', f(){ sp.vriendBod = K; zetBand(2); return `"Prima," zegt ${vn}. "Ik zeg het tegen de trainer. Dan kun je in de ${wanneer()} zelf beslissen."`; }},
    {l:'"Nee, ik blijf bij mijn club."', toon:'fel', f(){ zetBand(-3); modFans(2); return `${vn} is even stil. "Jammer. Maar ik snap het." De fans van ${club().n} horen ervan en waarderen je trouw.`; }}]};
}
// In de transferperiode (openVenster): het bod van zijn club, of null. Een buitenlandse club biedt alleen in de zomer.
export function vriendBodVenster(soort){
  const sp = S.sp, v = sp.vriend, K = sp.vriendBod; if (!K || !v) return null;
  if (!vriendActief() || bijJou() || v.club !== K.club || vriendLand() !== K.land){ sp.vriendBod = null; return {tekst:`${v.voornaam} speelt niet meer bij de club die jou wilde. ${vr.Zijn} verzoek vervalt.`}; }
  const bl = K.land !== thuisLand(); // (een overstap naar het buitenland kan ook in de winterstop)
  sp.vriendBod = null;
  const c = zijnClubInfo();
  const bod = {club:K.club, ...(bl ? {land:K.land} : {}), salaris:Math.round(salarisVoor(c.t, ovr(sp), c.s) / 100) * 100, jaren:sp.leeftijd >= 31 ? randInt(1, 2) : randInt(2, 4), som:waarde(sp), viaVriend:true};
  return {bod, tekst:`${v.voornaam} heeft ${vr.zijn} trainer overgehaald: ${c.n}${bl ? ` uit ${K.land}` : ''} wil je hebben!`};
}

// Is hij je rivaal geworden? Dan kun je het nog uitpraten
export const kanUitpraten = () => { const sp = S.sp, R = sp.rivaal; return !!(sp.vriend && sp.vriend.weg && R && R.exVriend && S.week && !S.week.vriend && !sp.clubloos); };
export function uitpraten(){
  if (!kanUitpraten()) return;
  const sp = S.sp, R = sp.rivaal; R.band = clamp(R.band + 8, -100, 100); S.week.vriend = 'uitpraten';
  S.week.tekst.push(R.band >= 60 ? `Je zoekt ${sp.vriend.voornaam} op. Het voelt bijna weer als vroeger.` : `Je stuurt ${sp.vriend.voornaam} een bericht. Het antwoord is kort, maar vriendelijk.`);
}
// Af en toe een moment met je vriend, met een toon per antwoord
// Elke gebeurtenis heeft een wachttijd (in seizoenen; Infinity = eenmalig) en klopt met de situatie.
// Zijn liefdesleven is een verhaal met fases (v.vriendin): ontmoeten → samenwonen → verloving → bruiloft, of het gaat uit.
export function vriendEvents(){
  if (!vriendActief()) return [];
  const sp = S.sp, v = sp.vriend, vn = v.voornaam, zelfde = bijJou(), gezien = v.evGezien = v.evGezien || {}, j = S.jaar;
  const mag = (id, wacht) => gezien[id] == null || j - gezien[id] >= wacht;
  const ev = (id, tekst, opts, na) => ({soort:'prive', tekst, opts:opts.map(([l, toon, d, uit]) => ({l, toon, f(){ gezien[id] = j; zetBand(d); if (na) na(toon); return uit; }}))});
  const L = [], Vr = v.vriendin, hn = Vr && Vr.naam;
  // ---- zijn liefdesleven ----
  if (!Vr || (Vr.fase === 'single' && j > Vr.sinds)){
    const naam = pick(liefNamen(!vriendVrouw()).filter(n => n !== (sp.relatie && sp.relatie.naam) && n !== (Vr && Vr.oud)));
    L.push(ev('liefde', `${vn} heeft een ${vp.vriend}, ${naam}, en wil dat je ${vp.hem} ontmoet. Vanavond, bij ${vr.hem} thuis.`, [
      ['Natuurlijk, ik neem een cadeautje mee', 'kalm', 6, `${naam} is aardig. ${vn} is zichtbaar trots.`],
      ['Even langs, daarna rust', 'bal', 3, 'Een gezellig uurtje. ' + vr.Hij + ' waardeert dat je kwam.'],
      ['Geen tijd, ik moet aan mezelf denken', 'fel', -6, `${vn} is teleurgesteld. "Volgende keer dan."`]], () => { v.vriendin = {naam, fase:'samen', sinds:j, blijft:rnd() >= .25}; }));
  } else if (Vr.fase === 'samen' && j > Vr.sinds){
    if (Vr.blijft) L.push(ev('liefde', `${vn} en ${hn} gaan samenwonen! Help je zaterdag met verhuizen?`, [
      ['Natuurlijk, ik neem de zware dozen', 'kalm', 6, `Na een lange dag staat alles. ${hn} trakteert op pizza.`],
      ['Een paar uurtjes, dan moet ik weg', 'bal', 3, 'Elke hand helpt. ' + vr.Hij + ' is blij dat je kwam.'],
      ['Huur maar een verhuisbedrijf', 'fel', -5, `"Ook goed," zegt ${vn}. Het klinkt niet zo.`]], () => { Vr.fase = 'wonen'; Vr.sinds = j; }));
    else L.push(ev('liefde', `Het is uit tussen ${vn} en ${hn}. ${vr.Hij} belt je: "Kun je vanavond langskomen?"`, [
      ['Meteen langsgaan, met ijs', 'kalm', 8, 'Jullie praten tot diep in de nacht. ' + vr.Hij + ' is blij dat je er bent.'],
      ['' + vr.Hem + ' een berichtje sturen', 'bal', 2, '"Thanks ' + ik.knul + '," stuurt ' + vr.hij + ' terug.'],
      ['"Er zijn genoeg andere ' + vp.jongens + '"', 'fel', -4, 'Daar heeft ' + vr.hij + ' nu even niks aan.']], () => { v.vriendin = {fase:'single', sinds:j, oud:hn}; }));
  } else if (Vr.fase === 'wonen' && j > Vr.sinds){
    L.push(ev('liefde', `${vn} wil ${hn} ten huwelijk vragen! ${vr.Hij} wil jouw advies over de ring. "Jij bent de enige die ik dit durf te vragen."`, [
      ['Mee naar de juwelier', 'kalm', 6, `Na drie winkels hebben jullie hem. ${hn} zegt ja!`],
      ['"Kies gewoon wat je mooi vindt"', 'bal', 2, `${vr.Hij} kiest zelf. ${hn} zegt ja!`],
      ['"Trouwen? Je bent gek!"', 'fel', -4, `${vr.Hij} lacht ongemakkelijk. ${hn} zegt toch ja.`]], () => { Vr.fase = 'verloofd'; Vr.sinds = j; }));
  } else if (Vr.fase === 'verloofd' && j > Vr.sinds){
    L.push(ev('liefde', `De bruiloft van ${vn} en ${hn}! Jij bent ${vr.zijn} getuige, en straks moet je een speech geven.`, [
      ['Een ontroerende speech', 'kalm', 8, `Halverwege huilt zelfs de vader van ${hn}. ${vn} omhelst je.`],
      ['Een grappige speech', 'bal', 6, 'De hele zaal ligt dubbel. Een topavond.'],
      ['Een gênant verhaal van vroeger', 'fel', 2, `De zaal lacht, ${vn} wordt knalrood. ${hn} wil het hele verhaal horen.`]], () => { Vr.fase = 'getrouwd'; Vr.sinds = j; S.car.hist.push(`${seizoenLabel()}: getuige op de bruiloft van ${vn}`); }));
  }
  // ---- voetbal en vriendschap ----
  const x = vriendSpeler(), bank = x ? !x.basis : false;
  if (bank && mag('bank', 1)) L.push(ev('bank', zelfde ? `${vn} zit al drie wedstrijden op de bank en is gefrustreerd. ${vr.Hij} vraagt of jij iets bij de trainer kunt zeggen.` : `${vn} zit bij ${vr.zijn} club op de bank en is gefrustreerd. ${vr.Hij} belt je om te klagen.`, [
    ['Rustig met ' + vr.hem + ' praten en opbeuren', 'kalm', 7, 'Na een uur praten heeft ' + vr.hij + ' weer zin om te knokken.'],
    ['"Gewoon blijven werken, dan komt het goed."', 'bal', 3, '' + vr.Hij + ' knikt. "Je hebt gelijk."'],
    ['"Misschien ben je gewoon niet goed genoeg."', 'fel', -12, 'Het blijft stil aan de andere kant. Dat had je niet moeten zeggen.']]));
  if (vriendStats().g > 0 && mag('goal', 1)) L.push(ev('goal', `${vn} scoorde het winnende doelpunt en tagt jou in ${vr.zijn} post: "Voor mijn ${ik.broer}."`, [
    ['Een lief bericht terugsturen', 'kalm', 5, 'Jullie volgers vinden het prachtig.'],
    ['Liken en een emoji sturen', 'bal', 2, '' + vr.Hij + ' stuurt een emoji terug.'],
    ['"Mooi, maar mijn goal van vorige week was mooier 😏"', 'fel', 1, '' + vr.Hij + ' lacht. Jullie gaan het hele weekend door met plagen.']]));
  if (mag('ouders', 2)) L.push(ev('ouders', `${vn} vraagt je mee naar ${vr.zijn} ouders. ${vr.Zijn} moeder heeft je lievelingseten gemaakt, net als vroeger.`, [
    ['Gaan, en de afwas doen', 'kalm', 7, '' + vr.Zijn + ' moeder knuffelt je bij de deur. "Je bent hier altijd welkom."'],
    ['Gaan, maar op tijd naar huis', 'bal', 4, 'Een fijne avond.'],
    ['Afzeggen', 'fel', -5, `${vn} zegt dat het niet erg is. ${vr.Zijn} moeder vond het wel jammer.`]]));
  if (mag('verjaardag', 1)) L.push(ev('verjaardag', `${vn} is jarig en geeft een feestje. ${vr.Hij} rekent op je.`, [
    ['Gaan, met een mooi cadeau', 'kalm', 6, `Je geeft ${vr.hem} een ingelijste foto van jullie twee op het jeugdtoernooi. ${vr.Hij} is er stil van.`],
    ['Even langs voor een taartje', 'bal', 3, '' + vr.Hij + ' is blij dat je er even was.'],
    ['Een appje: "Gefeliciteerd!"', 'fel', -4, '' + vr.Hij + ' reageert met een duimpje. Meer niet.']]));
  if ((S.ronde <= 2 || S.ronde >= AANTAL_RONDES - 3) && mag('vakantie', 2)) L.push(ev('vakantie', `${vn} stelt voor: na het seizoen samen een week op vakantie, net als vroeger met jullie ouders.`, [
    ['Ja! Een week zon en zee', 'kalm', 8, 'Een week vol lachen, slechte zonnebrand en goede herinneringen.'],
    ['Een lang weekend', 'bal', 4, 'Kort, maar heerlijk.'],
    ['"Ik heb al andere plannen"', 'fel', -5, `${vn} gaat dan maar met ${vr.zijn} neef.`]]));
  if (mag('blessure', 2) && rnd() < .5) L.push(ev('blessure', `${vn} is geblesseerd en ligt een paar weken thuis op de bank. ${vr.Hij} verveelt zich kapot.`, [
    ['Langsgaan met een spelcomputer', 'kalm', 7, 'Jullie gamen de hele middag. ' + vr.Hij + ' vergeet ' + vr.zijn + ' knie even.'],
    ['Een beterschapskaart sturen', 'bal', 2, '' + vr.Hij + ' zet hem op ' + vr.zijn + ' kast.'],
    ['"Ik heb het druk, sterkte"', 'fel', -5, '' + vr.Hij + ' snapt het, zegt ' + vr.hij + '.']]));
  return L;
}

// ---------- elke week: jullie band, en een nieuwe kans voor de zaakwaarnemer ----------
// ---------- zijn blessures ----------
// Hij ligt eruit: hij speelt niet (startElf laat geblesseerden weg), scoort niet en gaat niet mee naar interlands
export function blesseerVriend(id){
  const v = S.sp.vriend, B = BLESSURES[id]; if (!v || !B) return 0;
  const wk = randInt(B.wk[0], B.wk[1]); v.blessure = wk; v.blesSoort = {id, n:B.n, kort:B.kort, wk};
  if (B.blijvend){ if (B.blijvend.pot) v.pot = Math.max(v.k, (v.pot || v.k) - B.blijvend.pot); zetVriendK(v.k - (B.blijvend.cond || 0)); }
  const x = vriendSpeler(); if (x) x.bles = wk;
  return wk;
}
function vriendBlessureWeek(){
  const sp = S.sp, v = sp.vriend, J = sp.journey;
  // Oude opslag: het verhaal van zijn kruisband was er al, maar hij speelde gewoon door. Nu ligt hij er alsnog uit (de weken die al voorbij zijn tellen mee)
  if (!v.blesV2){ v.blesV2 = true;
    if (J && J.h === 19 && vriendActief() && !(v.blessure > 0)){ const al = Math.max(0, (S.weekNr || 0) - (J.vorige || 0)), wk = (v.kbVerhaal = blesseerVriend('kruisband')) - al;
      if (wk > 0){ v.blessure = wk; const x = vriendSpeler(); if (x) x.bles = wk; if (S.week) S.week.tekst.push(`${v.voornaam} revalideert nog van ${vr.zijn} kruisband: nog ${wk} weken.`); return; } else { v.blessure = 0; v.blesSoort = null; const x = vriendSpeler(); if (x) x.bles = 0; } } }
  if (!(v.blessure > 0)) return;
  v.blessure--; v.blesSz = v.blesSz && v.blesSz.jaar === S.jaar ? v.blesSz : {jaar:S.jaar, wk:0}; v.blesSz.wk++;
  const x = vriendSpeler(); if (x) x.bles = v.blessure;
  if (v.blessure <= 0){ const b = v.blesSoort || {wk:0, kort:''}; v.blesSoort = null;
    if (S.week) S.week.tekst.push(`${v.voornaam} is weer fit${b.kort ? ` na ${vr.zijn} ${b.kort}blessure` : ''}! ${vr.Hij} appt je een foto vanaf het trainingsveld.`);
    if (b.wk >= ZWAAR) krantMelding(`${v.voornaam} ${v.n} terug na ${b.kort}blessure`, `Na ${b.wk} weken revalidatie staat de ${vr.jeugdvriend} van ${sp.naam} weer op het veld.`); }
}
export const vriendGeblesseerd = () => { const v = S.sp && S.sp.vriend; return !!(v && v.blessure > 0); };
export function vriendWeek(eerste){
  const sp = S.sp, v = sp.vriend, J = sp.journey; if (!v || S.trainer) return;
  vriendInhalen(); vriendTalent();
  if (v.komt && (eerste || (v.komt.na === 'winter' && S.ronde >= WINTER))) vriendKomt(); // hij komt naar jouw club
  if (!eerste && S.ronde >= WINTER && !sp.clubloos) vriendWinter();
  if (eerste) return;
  vriendBlessureWeek();
  if (vriendActief()){
    // Zonder contact groeien jullie langzaam uit elkaar; bij dezelfde club zie je elkaar elke dag
    if (!S.week || !S.week.vriend) zetBand(bijJou() && !sp.o23 ? .5 : -1 * weekFactor());
    // Na de verleiding: zijn jullie toch uit elkaar gegroeid, dan probeert de zaakwaarnemer het nog een keer (eens per seizoen, bij de winterstop)
    if (J && J.h >= 5 && v.band < 25 && S.ronde === WINTER && v.vosJaar !== S.jaar && !S.wachtEv){ v.vosJaar = S.jaar; S.wachtEv = vosOpnieuw(); }
    // Hij vraagt of jij naar zijn club komt (hooguit eens per seizoen, als jij daar minstens wissel zou zijn)
    else if ((!J || J.h >= 5) && v.band >= 20 && v.lokJaar !== S.jaar && S.ronde >= 6 && !bijJou() && !vriendApart() && !sp.o23 && !sp.huur && !sp.clubloos && !eersteSeizoen() && !sp.vriendBod && !v.komt && !S.wachtEv && v.club != null && rnd() < .05 && rolBijHem() !== 'tribune'){ v.lokJaar = S.jaar; S.wachtEv = vriendLokt(); }
    return;
  }
  // Een rivaal met wie het weer goed zit, wordt weer je vriend
  const R = sp.rivaal;
  if (v.weg && R && R.exVriend && R.band >= 60 && !S.wachtEv){
    const sel = CLUBS[R.club] ? selectie(R.club) : null, x = sel && sel.find(y => y.n === R.n && y.v === R.v);
    if (x){ x.vriend = true; x.rivaal = false; }
    v.club = R.club; v.land = thuisLand(); v.weg = false; v.k = R.k; v.lft = R.lft; v.band = Math.max(v.band, 60); sp.rivaal = null; if (J) J.route = 'vriend';
    S.car.hist.push(`${seizoenLabel()}: ${v.voornaam} ${v.n} is weer je beste vriend`);
    if (S.week) S.week.tekst.push(`Na alles wat er gebeurd is, staan ${v.voornaam} en jij ineens weer samen te lachen. Jullie zijn weer beste vrienden. (Je krijgt een nieuwe rivaal in de competitie.)`);
  }
}
// De zaakwaarnemer probeert het opnieuw (jullie band is laag)
function vosOpnieuw(){
  const v = S.sp.vriend, d = breukDoel(), vn = v.voornaam; if (d.naar == null || d.naar === v.club || opAfstand()) return null;
  return {soort:'prive', tekst:`${MAKELAAR} belt ${vn} weer. Jullie spreken elkaar bijna niet meer, en ${CLUBS[d.naar].n} wil ${vr.hem} hebben.`, opts:[
    {l:bijJou() ? '' + vr.Hem + ' bellen: "Blijf, ik heb je nodig."' : `${vr.Hem} bellen: "Blijf bij ${vriendClubNaam() || 'je club'}, en laten we elkaar weer vaker zien."`, toon:'kalm', f(){ zetBand(20); return `${vn} is verrast dat je belt. ${vr.Hij} blijft. "Dank je, ${ik.knul}."`; }},
    {l:'Het aan hem laten', toon:'bal', f(){ if (v.band >= 15){ breukUitkomst('vriend', 0, d.naar); return `${vn} vertrekt naar ${CLUBS[d.naar].n}, maar zegt: "Vrienden blijven, toch?"`; } breukUitkomst('rivaal', -10, d.naar); return `${vn} vertrekt naar ${CLUBS[d.naar].n}. Jullie worden rivalen.`; }},
    {l:'"Ga maar, het maakt me niet uit."', toon:'fel', f(){ breukUitkomst('rivaal', -40, d.naar); return `${vn} vertrekt naar ${CLUBS[d.naar].n}. Vanaf nu zijn jullie rivalen.`; }}]};
}

// ---------- elke week: tijd voor een nieuw hoofdstuk? ----------
export function journeyWeek(eerste){
  const J = journey(); if (!J || J.h >= KLAAR || S.trainer) return;
  const sp = S.sp, zelfdeJaar = S.jaar === J.jaar;
  // Liep het verhaal vast (zonder club, of het seizoen is al voorbij)? Dan houdt het hier op en speel je gewoon verder
  // Oude opslag: het verhaal was na hoofdstuk 7 klaar, nu gaat het verder met deel 2
  if (!J.v){ J.v = 2; if (J.h >= 7){ J.h = 7; if (J.club1 == null) J.club1 = sp.club; J.vorige = 0; } }
  if (!zelfdeJaar && J.h < 6){ J.h = 7; if (J.club1 == null) J.club1 = sp.club; return; }
  if (sp.clubloos || S.fase !== 'week') return;
  // Deel 2 tot en met 4: het volgende hoofdstuk komt als het moment daar is (in deel 2 minstens 4 weken na het vorige, daarna 8)
  if (J.h >= 7){
    if (J.h < 21 && sp.leeftijd >= 33) J.h = 21; // al op leeftijd: door naar het afscheid
    const h = J.h + 1, V = VERVOLG[h]; if (!V || (S.weekNr || 0) - (J.vorige || 0) < (h >= 15 ? 8 : 4)) return;
    const d = V.wanneer({sz:S.jaar - J.jaar, eerste}, J); if (d) openHoofdstuk(h, 'week', d);
    return;
  }
  if (J.h === 3 && zelfdeJaar && S.ronde >= WINTER){ const d = breukDoel(); if (d.naar != null && vriendActief()) openHoofdstuk(4, 'week', {...d, band:Math.round(sp.vriend.band)}); else J.h = KLAAR; }
  else if (J.h === 4) openHoofdstuk(5, 'week');
  else if (J.h === 5 && zelfdeJaar && S.ronde >= laatsteWeek()) openHoofdstuk(6, 'week', {finale:finaleTegenRivaal()});
  else if (J.h === 6 && !zelfdeJaar) openHoofdstuk(7, 'week', epiloogData());
}
// Als je stopt: de epiloog van je verhaal (als deel 1 klaar is)
export function verhaalEpiloog(){
  const J = journey(); if (!J || S.trainer || J.h < 7 || J.h >= KLAAR - 1) return;
  openHoofdstuk(KLAAR - 1, S.fase);
}
// De week van de laatste wedstrijd van jouw league
export const laatsteWeek = () => { const t = club().t; for (let w = AANTAL_RONDES - 1; w >= 0; w--) if (rondeInWeek(t, w) != null) return w; return AANTAL_RONDES - 1; };
// Speelde je dit seizoen in een bekerfinale tegen zijn club?
function finaleTegenRivaal(){
  const B = S.ss.bekers, R = S.sp.rivaal; if (!B || !R) return false;
  return Object.values(B).some(b => { const f = b.rondes[b.rondes.length - 1]; return b.winnaar != null && f && f.length === 1 && [f[0].h, f[0].u].includes(S.sp.club) && [f[0].h, f[0].u].includes(R.club); });
}
function epiloogData(){
  const sp = S.sp, sz = (S.car.seizoenen || []).slice(-1)[0];
  const samenvatting = sz ? `${sz.wed} wedstrijden, ${isKeeper() ? `${nulTxt(sz.nul || 0)} en ${S.car.red || 0} reddingen` : `${sz.g} goals en ${sz.a} assists`} bij ${sz.club}${sz.gem ? `, gemiddeld een ${String(sz.gem).replace('.', ',')}` : ''}. Eindstand: plek ${sz.plek}.` : 'Het was een seizoen om nooit te vergeten.';
  const bondscoach = ovr(sp) >= 62 || sp.rep >= 35;
  if (bondscoach) krantMelding(`${sp.naam} op voorlopige lijst van de bondscoach`, `Na een sterk eerste seizoen staat ${sp.naam} (${sp.leeftijd}) op de lijst met mogelijke debutanten.`);
  return {samenvatting, bondscoach};
}
