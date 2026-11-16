import { S, club, mod, ovr, salarisVoor, seizoenLabel, waarde } from '../../core/state.js';
import { clamp, pick, randInt, rnd } from '../../core/utils.js';
import { AANTAL_RONDES, CLUBS, DIVS, LAAGSTE, liefNamen, clubsLand, divClubs, WINTER, rondeInWeek, weekFactor, LINIE_VAN, POS } from '../../data/gegevens.js';
import { thuisLand } from '../../data/landen.js';
import { andereWereldClub, andereWereldIds, clubPlek, vreemdeClub } from '../transfers/buitenland.js';
import { interDrempel, landenVoor } from '../interlands/interlands.js';
import { OPBOUW, selectie, stand, startElf } from '../competitie/spelers.js';
import { BEKERS } from '../competitie/beker.js';
import { herschik } from '../transfers/markt.js';
import { krantMelding } from '../media/roddel.js';
import { social } from '../prive/social.js';
import { modFans, rivaal as derbyVan } from '../wedstrijd/fans-pers.js';
import { PERS, karakter } from './persoonlijkheid.js';
import { groeiSeizoen, plaats as plaatsRivaal, degradeerHoofdRivaal, alleRivalen, rivaalSpeler } from './rivaal.js';
import { iedereen, zetBand as kleedBand } from '../team/kleedkamer.js';
import { BLESSURES, ZWAAR } from './blessures.js';
import { eersteSeizoen } from '../transfers/vertrek.js';
import { ik, team, vp, vr, vriendVrouw } from '../../core/geslacht.js';

/* ===================== Jouw jeugdvriend ===================== */
// Je beste vriend uit de jeugd doet mee met de selectiedagen en tekent misschien bij dezelfde club. In de winter van je eerste
// seizoen probeert een gladde zaakwaarnemer hem weg te halen (de verleiding): of jullie dan rivalen worden of vrienden blijven,
// hangt af van jullie band (die bouw je elke week op, VRIEND_ACTIES) en van wat je zegt. In gesprekken kies je een toon.
export const vriendRoute = () => !!(S.sp && S.sp.journey && S.sp.journey.route === 'vriend');
// De laatbloeier (23): geen selectiedagen maar een telefoontje van je zaakwaarnemer en een proeftraining (proef.js)
export const laatbloeier = () => !!(S && S.sp && S.sp.startVerhaal === 'bewijs');
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
// ---------- jullie band: de drempels (−100..100) ----------
// Onder "schuurt" merk je het (moraal, berichtjes, hij laat je links liggen in het veld), onder "koud" ook je focus.
// Onder "waarschuwing" wil hij je spreken; zakt de band daarna onder "breuk", dan is het voorbij.
export const BAND = {schuurt:25, koud:0, waarschuwing:-40, breuk:-60, top:75};
export const vriendBandLabel = b => b >= 60 ? 'Beste vrienden' : b >= BAND.schuurt ? 'Goede vrienden' : b >= BAND.koud ? 'Het schuurt' : 'IJskoud';
export const vriendBandKlasse = b => b >= 60 ? 'r-veilig' : b >= BAND.schuurt ? 'r-gem' : 'r-riskant';
export const journey = () => S && S.sp && S.sp.journey;
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
  sp.journey = {jaar:S ? S.jaar : 2026, v:3}; // (v3: geen hoofdstukken meer, alleen de verleiding als weekbericht)
}
export const zetBand = d => { const v = S.sp.vriend; v.band = clamp(v.band + d, -100, 100); };

// ---------- De verleiding: in de winter van je eerste seizoen probeert een zaakwaarnemer je vriend weg te halen ----------
// Je antwoord (en jullie band) beslist of jullie vrienden blijven of rivalen worden (breukUitkomst). Een gewoon weekbericht met keuzes.
function verleidingInhoud(d){
  const sp = S.sp, v = sp.vriend, vn = v.voornaam, o = (l, toon, f) => ({l, toon, f}), breuk = (soort, band = 0) => breukUitkomst(soort, band, d.naar);
      // Een vriend(in) in de andere wereld: een grotere club daar. Jullie worden geen rivalen, hooguit groeien jullie wat uit elkaar
      if (d.apart){ const naarN = vriendClubInfo(d.naar).n, zijnN = vriendClubNaam() || 'een andere club';
        return {tekst:[`Midden in de winterstop belt ${vn} je, laat op de avond. Een zaakwaarnemer, ${MAKELAAR}, wil ${vr.hem} van ${zijnN} naar ${naarN} halen. "Ze bieden me twee keer zoveel. Wat moet ik doen?"`,
          `Jullie spelen in een andere competitie, maar jullie dromen zijn hetzelfde gebleven. ${vn} vraagt jou altijd eerst.`], opts:[
          o(`"Blijf bij ${zijnN}. Daar ben je op je plek."`, 'kalm', () => { zetBand(10); breuk('blijft'); return `Het is even stil. Dan lacht ${vn}: "Je hebt gelijk." De volgende dag zegt ${vr.hij} nee tegen ${MAKELAAR}.`; }),
          o('"Doe wat goed voelt. Ik sta achter je."', 'bal', () => { zetBand(5); breuk('vriend'); return `${vn} tekent bij ${naarN}. "Elke zondag bellen, hè?" Vrienden blijven jullie.`; }),
          o('"Geld is niet alles. Maar doe maar wat je wilt."', 'fel', () => { breuk('rivaal'); modFans(1); return `${vn} tekent toch bij ${naarN}. Jullie spreken elkaar daarna een tijdje een stuk minder.`; })]}; }
      // Spelen jullie bij dezelfde club? (bij het openen vastgelegd; oudere opslag: nu bepalen, hij is nog niet vertrokken)
      const zelfde = d.zelfde ?? v.club === sp.club, zijn = CLUBS[v.club] ? CLUBS[v.club].n : '' + vr.zijn + ' club';
      const naar = CLUBS[d.naar].n, waar = `${naar}${d.derby ? `, de aartsrivaal van ${d.mijnNaam || club().n}` : ''}`;
      // Hecht: hij belt jou eerst en jouw antwoord beslist
      if (d.band >= 60) return {
        tekst:[`Midden in de winterstop belt ${vn} je, laat op de avond. Een zaakwaarnemer, ${MAKELAAR}, wil ${vr.hem} ${zelfde ? '' : `van ${zijn} `}naar ${waar} halen. "Ze bieden me twee keer zoveel. Maar ik wil eerst weten wat jij ervan vindt. Wat moet ik doen?"`,
          'Jullie kennen elkaar al sinds de kleuterschool. Dit is een gesprek dat je niet vergeet.'],
        opts:[
        zelfde ? o('"Blijf. Samen maken we het hier."', 'kalm', () => { zetBand(10); breuk('blijft'); return `Het is even stil. Dan lacht ${vn}: "Je hebt gelijk. ${MAKELAAR} kan de boom in." De volgende dag zegt ${vr.hij} nee. Jullie blijven samen.`; })
          : o(`"Blijf bij ${zijn}. Daar ben je op je plek, en wij blijven gewoon vrienden."`, 'kalm', () => { zetBand(10); breuk('blijft'); return `Het is even stil. Dan lacht ${vn}: "Je hebt gelijk. ${MAKELAAR} kan de boom in." De volgende dag zegt ${vr.hij} nee. ${vr.Hij} blijft bij ${zijn}.`; }),
        o('"Doe wat goed voelt. Ik blijf je ' + ik.vriend + ', waar je ook speelt."', 'bal', () => { zetBand(5); breuk('vriend'); return `"Echt?" vraagt ${vr.hij}. "Echt," zeg je. ${vr.Hij} tekent bij ${naar}, maar jullie spreken af: elke zondag bellen. Vrienden blijven jullie.`; }),
        o('"Ga dan maar, als geld belangrijker is."', 'fel', () => { zetBand(-50); breuk('rivaal', -40); modFans(3); return `"Als jij er zo over denkt..." zegt ${vn}. ${vr.Hij} tekent bij ${naar}. Vanaf nu zijn jullie rivalen.`; })]};
      // Te ver uit elkaar gegroeid: hij is al weg zonder iets te zeggen
      if (d.band < 30) return {
        tekst:[`De winterstop is voorbij en je leest het op social media: ${vn} heeft een nieuwe zaakwaarnemer, ${MAKELAAR}, en tekende op de laatste dag van de transferperiode bij ${waar}.`,
          '' + vr.Hij + ' heeft je niet eens gebeld. Jullie spraken elkaar de laatste tijd ook bijna niet meer.'],
        opts:[
        o('' + vr.Hem + ' toch succes wensen', 'kalm', () => { breuk('rivaal', 15); return `Je stuurt een kort berichtje. ${vr.Hij} reageert met een duimpje. Vanaf nu zijn jullie concurrenten.`; }),
        o('Het laten gaan', 'bal', () => { breuk('rivaal', -15); return 'Je zegt niets. Het voelt alsof er iets voorbij is.'; }),
        o('"Typisch. Altijd al voor zichzelf gekozen."', 'fel', () => { zetBand(-30); breuk('rivaal', -50); modFans(3); return 'Je zegt het hardop in de kleedkamer. Het staat de volgende dag in de krant. ' + vr.Hij + ' leest het ook.'; })]};
      // Ertussenin: hij heeft al getekend en belt pas daarna
      return {
        tekst:[`De winterstop is voorbij en het nieuws slaat in als een bom: ${vn} heeft een nieuwe zaakwaarnemer, ${MAKELAAR}, en tekende op de laatste dag van de transferperiode bij ${waar}.`,
          `Je leest het eerst op social media. Pas 's avonds belt ${vr.hij}. "${MAKELAAR} zegt dat ik daar meer kan verdienen en sneller kan doorbreken. Je snapt het toch?"`],
        opts:[
        o('"Ik snap het. Succes, en we blijven vrienden."', 'kalm', () => { zetBand(-5); breuk('vriend'); return `Het blijft even stil. "Dank je," zegt ${vn} zacht. "Dat betekent veel." ${vr.Hij} speelt nu ergens anders, maar jullie blijven vrienden.`; }),
        o('"Je moet doen wat goed voor je is. Maar dit doet pijn."', 'bal', () => { zetBand(-25); breuk('rivaal', -15); return `"Ik weet het," zegt ${vn}. "Sorry." Jullie hangen op. Het voelt alsof er iets kapot is gegaan.`; }),
        o('"Je laat me gewoon in de steek. Voor geld."', 'fel', () => { zetBand(-50); breuk('rivaal', -50); modFans(3); return `"Weet je wat? Zie je op het veld," zegt ${vn}, en ${vr.hij} hangt op. De volgende ochtend staat jullie ruzie in de krant.`; })]};
}
export function verleidingEvent(d){
  const x = verleidingInhoud(d); if (!x) return null;
  return {soort:'verhaal', titel:'De verleiding', tekst:x.tekst.filter(Boolean).join(' '), opts:x.opts};
}
export const zetRivaalBand = d => { const R = S.sp.rivaal; if (R) R.band = clamp(R.band + d, -100, 100); };

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
// Herstel: staat je vriend(in) (nog) bij een club in jouw competitie, dan hoort die precies één keer in de selectie van
// die club. Na een huurperiode (of een oude opslag) kon die plek kwijt zijn: dan zetten we hem er weer in, met zijn klasse
export function vriendInSelectie(){
  const sp = S.sp, v = sp && sp.vriend; if (!v || S.trainer || !vriendActief() || !vriendHier()) return;
  const sel = selectie(v.club), x = sel.find(y => y.vriend);
  // (een achtergebleven markering bij een andere club, van een overstap terwijl jij in het buitenland zat: die speler is weg)
  for (const lijst of Object.values(S.sel || {})) if (lijst !== sel && Array.isArray(lijst)){ const z = lijst.find(y => y.vriend); if (z){ lijst.splice(lijst.indexOf(z), 1); herschik(lijst); } }
  if (x) return;
  // (stond hij er nog zonder markering, bijvoorbeeld na een herstel van een oude opslag: die regel eerst weg)
  const oud = sel.find(y => y.n === v.n && y.v === v.v && !y.rivaal); if (oud) sel.splice(sel.indexOf(oud), 1);
  plaatsVriend(v.club, v.o23);
  const y = vriendSpeler(); if (y){ y.k = v.k; y.lft = v.lft; y.bles = v.blessure > 0 ? v.blessure : 0; }
  if (!v.o23) herschik(sel);
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
export function breukUitkomst(soort, band, naar){
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
export function vriendWordtRivaal(band, naar, breuk = false){
  const sp = S.sp, v = sp.vriend, vanClub = v.club; if (naar == null || opAfstand()) return;
  // Had je al een (andere) rivaal, dan wordt je ex-vriend je hoofdrivaal; de oude blijft (als er plek is) een van je andere rivalen
  if (sp.rivaal && !sp.rivaal.exVriend) degradeerHoofdRivaal();
  if (sp.rivaal) return;
  if (sp.journey) sp.journey.route = 'rivaal'; // (je ex-vriend houdt als rivaal zijn eigen positie: pos)
  const oud = v.club != null ? selectie(v.club) : null; if (oud){ const x = oud.find(y => y.vriend); if (x) oud.splice(oud.indexOf(x), 1); }
  sp.rivaal = {v:v.v, n:v.n, pos:vriendPos(), lft:v.lft, k:v.k, pot:v.pot, kVorig:v.k, club:naar, achtergrond:'Jullie waren beste vrienden, tot ' + vr.hij + ' vertrok.', karakter:pick(Object.keys(PERS)),
    onderling:{w:0, g:0, v:0}, hist:[], seizoen:null, band, race:{}, exVriend:true};
  if (breuk) sp.rivaal.achtergrond = 'Jullie waren beste vrienden, tot jullie uit elkaar groeiden.';
  plaatsRivaal(naar);
  v.club = naar; v.weg = true; v.land = thuisLand();
  if (breuk){ const weg = naar !== vanClub ? ` ${vr.Hij} vertrekt naar ${CLUBS[naar].n}.` : '';
    S.car.hist.push(`${seizoenLabel()}: breuk met jeugd${vr.vriend} ${v.voornaam} ${v.n}, nu je rivaal`);
    krantMelding(`Breuk tussen ${sp.naam} en ${v.voornaam} ${v.n}`, `De jeugdvrienden zijn uit elkaar gegroeid. "We hebben elkaar niets meer te zeggen," zegt ${v.voornaam}.${weg}`); return; }
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
    const rg = pos === 'A' ? .42 + (k - 65) * .015 : pos === 'M' ? .17 + (k - 65) * .005 : pos === 'K' ? 0 : .06, ra = pos === 'A' ? .16 : pos === 'M' ? .26 + (k - 65) * .005 : pos === 'K' ? .01 : .09; // (per gespeelde ronde; net zoveel als een basisspeler in de gesimuleerde competitie)
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
const zetVriendK = k => { const v = S.sp.vriend; v.k = clamp(Math.round(k), 30, 95); const x = vriendSpeler(); if (x){ x.k = v.k; x.lft = v.lft; if (!v.o23) herschik(selectie(v.club)); } }; // (wordt hij beter, dan speelt hij ook: de basis volgt de klasse)
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
// Clubs waar je beste vriend nooit naartoe gaat: jouw aartsrivaal en de clubs van je rivalen (alleen in je eigen land)
function vriendVerboden(){
  const s = new Set(); if (!vriendHier()) return s;
  const d = derbyVan(S.sp.club); if (d != null) s.add(d);
  try { for (const R of alleRivalen()){ const r = rivaalSpeler(R); if (r) s.add(r.id); } } catch (e) {}
  return s;
}
// ---------- zijn carrière: hij wisselt van club als hij te goed (of te zwak) is voor zijn club ----------
export function vriendTransfer(){
  const sp = S.sp, v = sp.vriend; if (!v || !vriendActief() || bijJou() || v.club == null || v.komt) return null;
  // Ben jij verhuurd en speelt hij bij jouw eigen club? Dan blijft hij daar: na je huurperiode zijn jullie weer ploeggenoten
  if (sp.huur && v.club === sp.huur.ouder && vriendLand() === (sp.huur.ouderLand || thuisLand())) return null;
  const land = vriendLand(), hier = vriendHier(), info = id => vriendClubInfo(id), cur = info(v.club);
  if (!cur) return null;
  const omhoog = v.k >= cur.s + 5, omlaag = v.k <= cur.s - 8; if (!omhoog && !omlaag) return null;
  // Hij gaat zijn eigen weg, niet op hetzelfde moment als jij: hooguit eens per twee seizoenen, en ook als hij te goed is
  // voor zijn club niet meteen (een kans die groeit naarmate hij beter is dan zijn club). Ben jij net zelf van club gewisseld,
  // dan blijft hij meestal nog even zitten
  if (v.transferJaar != null && S.jaar - v.transferJaar < 2) return null;
  let kans = omhoog ? clamp((v.k - cur.s - 3) / 10, .2, .75) : .4;
  if ((sp.sindsTransfer ?? 99) < 8) kans *= .3;
  if (rnd() > kans) return null;
  const ids = hier ? [1, LAAGSTE].flatMap(t => divClubs(t)) : vriendApart() ? [1, 2].flatMap(t => andereWereldIds(land, t)) : Array.from({length:clubsLand(land) - 8}, (_, i) => 8 + i);
  const verboden = vriendVerboden();
  const kand = ids.filter(i => { const c = info(i); return i !== v.club && !verboden.has(i) && !(hier && i === sp.club) && c && c.t >= 1 && (omhoog ? c.s >= cur.s + 2 && c.s >= v.k - 6 && c.s <= v.k - 1 : c.s < cur.s && c.s >= v.k - 6); });
  if (!kand.length) return null;
  const naar = pick(kand), nieuw = info(naar), oud = cur.n; v.transferJaar = S.jaar; (v.vorigeClubs = v.vorigeClubs || []).push(oud);
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
  vriendPrijzen(); // (zijn prijzen van dit seizoen: kampioen, een beker)
  const doel = vriendPos() === 'SPITS' || sp.pos === 'SPITS' ? 'g' : 'a', woord = doel === 'g' ? 'goals' : 'assists', jij = S.ss[doel] || 0, hij = st[doel];
  (v.hist = v.hist || []).push(`${seizoenLabel()}: jij ${jij}, ${v.voornaam} ${hij} ${woord} · ${vr.zijn} klasse ${k}`); if (v.hist.length > 12) v.hist.shift();
}

// Zijn prijzen: werd zijn club dit seizoen kampioen, of won die een beker? (alleen bij een club in jouw land: die competities worden gespeeld)
function vriendPrijzen(){
  const v = S.sp.vriend, P = v.prijzen = v.prijzen || []; if (v.weg || v.club == null || !vriendHier() || !CLUBS[v.club]) return;
  const c = CLUBS[v.club], seizoen = seizoenLabel();
  try { if (c.t >= 1 && stand(c.t)[0] === v.club) P.push({s:seizoen, t:`Kampioen van de ${DIVS[c.t]} met ${c.n}`}); } catch (e){}
  const B = S.ss && S.ss.bekers; if (B) for (const k in B) if (B[k].winnaar === v.club) P.push({s:seizoen, t:`${BEKERS[k].naam} met ${c.n}`});
}
// ---------- samen in het veld ----------
// Speelt je vriend in deze wedstrijd in jouw team? Bij de selectiedagen altijd; bij je club als jullie allebei in het
// eerste elftal (of allebei bij de O23) zitten en hij in de basis staat
export const vriendSpeler = () => { const sp = S.sp, v = sp.vriend; if (!v || v.club == null || !vriendHier()) return null; return selectie(v.club).find(y => y.vriend) || null; };
export function vriendInTeam(M){
  const sp = S.sp, v = sp.vriend; if (!M || !v || v.blessure > 0) return false;
  if (M.inter) return !!(M.vriendMee && M.vriendMee.basis); // samen in het nationale team
  if (M.selectie) return !M.proef && !vriendApart(); // (bij de oefenwedstrijd van de laatbloeier speelt hij al bij zijn eigen club)
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
  const L = [], Vr = v.vriendin, hn = Vr && Vr.naam, koud = v.band < BAND.koud;
  // ---- het schuurt: ruzie, roddels, afzeggingen (met een kans om het goed te maken) ----
  if (v.band < BAND.schuurt){
    if (mag('roddel', 1)) L.push(ev('roddel', `In een interview wordt ${vn} naar jou gevraagd. "We spreken elkaar bijna niet meer. Het succes is ${sp.naam} een beetje naar het hoofd gestegen, denk ik."`, [
      [`${vr.Hem} bellen: "Klopt dat, wat je zei?"`, 'kalm', 10, `Jullie praten het uit. "Ik was gewoon boos," geeft ${vn} toe.`],
      ['Er niets over zeggen', 'bal', 2, 'Het nieuws waait vanzelf over.'],
      ['Terugslaan in je eigen interview', 'fel', -8, `"Ik heb niemand nodig die achter mijn rug over me praat," zeg je. Dat komt in de krant.`]],
      toon => { if (toon === 'fel') krantMelding(`${sp.naam} haalt uit naar ${vn} ${v.n}`, `"Ik heb niemand nodig die achter mijn rug over me praat," zegt ${sp.naam} over ${ik.zijn} jeugd${vr.vriend}.`); }));
    if (mag('vergeten', 1)) L.push(ev('vergeten', `${vn} belt je, boos. "Je bent mijn verjaardag vergeten. Weer."`, [
      ['Sorry zeggen en een cadeau langsbrengen', 'kalm', 10, `${vn} doet open en moet toch lachen om je cadeau.`],
      ['"Sorry, het was een drukke week."', 'bal', 2, `"Dat is het altijd," zegt ${vn}.`],
      ['"Jij belt mij ook nooit."', 'fel', -8, `${vn} hangt op.`]]));
    if (mag('afzeggen', 1)) L.push(ev('afzeggen', `${vn} zegt jullie afspraak op het laatste moment af. Al voor de derde keer.`, [
      ['"Geen probleem. Wanneer kun je wel?"', 'kalm', 10, `${vn} stelt zaterdag voor. Jullie zitten weer eens samen op de bank.`],
      ['Een kort "oké" sturen', 'bal', 2, 'Gelezen. Geen antwoord.'],
      ['"Laat maar, ik weet genoeg."', 'fel', -8, `${vn} reageert niet meer.`]]));
  }
  if (koud) return L; // (ijskoud: hij nodigt je nergens meer voor uit)
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
  // Speelt hij/zij in een ander land dan jij: "Kom je langs?" (hooguit eens per seizoen)
  const zijnLand = vriendLand();
  if (zijnLand !== thuisLand() && v.club != null && !sp.clubloos && mag('bezoek', 1) && rnd() < .6){
    const klaar = (d, uit) => { gezien.bezoek = j; zetBand(d); return uit; };
    L.push({soort:'prive', titel:'Kom je langs?', tekst:`${vn} belt je vanuit ${zijnLand}. "Ik mis je, ${ik.knul}. Het is hier mooi, maar ik ken bijna niemand. Kom je een weekend langs?"`, opts:[
      {l:'Ja, ik kom dit weekend naar je toe', toon:'kalm', f(){ mod('moraal', 4);
        if (sp.geld >= 250){ sp.geld -= 250; mod('fit', -5); return klaar(8, `Je vliegt zaterdag na de training naar ${zijnLand}. ${vn} haalt je op van het vliegveld en laat je alles zien. Maandag ben je moe, maar je bent blij dat je ging. (band +8, moraal +4, fitheid −5, −€250)`); }
        sp.geld = Math.max(0, sp.geld - 60); mod('fit', -10); return klaar(8, `Een vlucht is te duur, dus je neemt de nachtbus naar ${zijnLand}. Een lange reis, maar ${vn} staat je op te wachten met een enorme grijns. (band +8, moraal +4, fitheid −10, −€60)`); }},
      {l:`"Kom jij maar naar mij toe!"`, toon:'bal', f(){
        if (rnd() < .6){ sp.geld = Math.max(0, sp.geld - 80); mod('moraal', 3); return klaar(5, `${vn} boekt meteen een ticket. Jullie hebben een heerlijk weekend: gamen, uit eten en praten tot diep in de nacht. Het eten trakteer jij. (band +5, moraal +3, −€80)`); }
        return klaar(1, `"Ik wil wel, maar we spelen zondag," zegt ${vn}. "Ik kom zodra het kan." (band +1)`); }},
      {l:'"Sorry, het past nu echt niet. Na het seizoen?"', toon:'fel', f(){ mod('focus', 2); return klaar(-3, `"Snap ik," zegt ${vn}. "Druk, hè. Na het seizoen dan." Het klinkt een beetje teleurgesteld. (band −3, focus +2)`); }}]});
  }
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
  vriendInhalen(); vriendTalent(); vriendInSelectie(); // (zijn plek in de selectie: na een huurperiode weer terug)
  if (v.komt && (eerste || (v.komt.na === 'winter' && S.ronde >= WINTER))) vriendKomt(); // hij komt naar jouw club
  if (!eerste && S.ronde >= WINTER && !sp.clubloos) vriendWinter();
  if (eerste) return;
  vriendBlessureWeek();
  if (vriendActief()){
    // Zonder contact groeien jullie langzaam uit elkaar; bij dezelfde club zie je elkaar elke dag
    if (!S.week || !S.week.vriend) zetBand(bijJou() && !sp.o23 ? .5 : -1 * weekFactor());
    // Na de verleiding: zijn jullie toch uit elkaar gegroeid, dan probeert de zaakwaarnemer het nog een keer (eens per seizoen, bij de winterstop)
    if (J && J.verleiding && v.band < 25 && S.ronde === WINTER && v.vosJaar !== S.jaar && !S.wachtEv){ v.vosJaar = S.jaar; S.wachtEv = vosOpnieuw(); }
    // Hij vraagt of jij naar zijn club komt (hooguit eens per seizoen, als jij daar minstens wissel zou zijn)
    else if (bandWeek()) return;
    else if ((!J || J.verleiding) && v.band >= 20 && v.lokJaar !== S.jaar && S.ronde >= 6 && !bijJou() && !vriendApart() && !sp.o23 && !sp.huur && !sp.clubloos && !eersteSeizoen() && !sp.vriendBod && !v.komt && !S.wachtEv && v.club != null && !vriendVerboden().has(v.club) && rnd() < .05 && rolBijHem() !== 'tribune'){ v.lokJaar = S.jaar; S.wachtEv = vriendLokt(); }
    return;
  }
  // Geen contact meer (na een breuk op afstand): af en toe een berichtje van hem
  if (v.weg && v.verbroken) return contactWeek();
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
// ---------- jullie band: wat je ervan merkt ----------
// Elke week (als hij je vriend is): een slechte band kost moraal en focus, een hele goede geeft je wat extra. Zakt hij
// te diep, dan wil hij je spreken (de waarschuwing, eens per seizoen), en daarna is het voorbij (de breuk).
// Geeft true als er een bericht klaarstaat (S.wachtEv)
function bandWeek(){
  const sp = S.sp, v = sp.vriend, vn = v.voornaam, b = v.band, w = S.week;
  if (w){
    if (b < BAND.schuurt && rnd() < .35){ mod('moraal', -2); w.tekst.push(pick([`${vn} reageert al dagen niet op je appjes.`, `Op Instagram zie je dat ${vn} een feestje had. Zonder jou.`,
      `Je stuurt ${vn} een filmpje. ${vr.Hij} leest het, maar reageert niet.`, `Je moeder vraagt hoe het met ${vn} gaat. Je weet het eigenlijk niet.`]) + ' (moraal −2)'); }
    if (b < BAND.koud && rnd() < .3){ mod('focus', -3); w.tekst.push((bijJou() ? `Het is ongemakkelijk in de kleedkamer met ${vn}. Jullie ontlopen elkaar.` : `Je ligt 's nachts wakker van de ruzie met ${vn}.`) + ' (focus −3)'); }
    if (b >= BAND.top && rnd() < .25){ mod('moraal', 1); w.tekst.push(pick([`${vn} stuurt je een meme van jullie oude jeugdtrainer. Je ligt dubbel.`, `${vn} appt na je wedstrijd: "Lekker gespeeld, ${ik.knul}!"`,
      `${vn} stuurt een foto van jullie twee op het jeugdtoernooi, van jaren geleden.`]) + ' (moraal +1)'); }
  }
  if (b >= BAND.schuurt) v.gewaarschuwd = false; // (weer goed: een volgende keer eerst weer een waarschuwing)
  if (S.wachtEv || sp.clubloos) return false;
  if (b <= BAND.breuk && v.gewaarschuwd){ S.wachtEv = breukBericht(); return true; }
  if (b <= BAND.waarschuwing && v.waarschuwJaar !== S.jaar){ v.waarschuwJaar = S.jaar; v.gewaarschuwd = true; S.wachtEv = vriendWaarschuwing(); return true; }
  return false;
}
function vriendWaarschuwing(){
  const v = S.sp.vriend, vn = v.voornaam;
  return {soort:'prive', titel:`${vn} wil je spreken`, tekst:`${vn} belt je. "Het gaat al tijden niet goed tussen ons. Je reageert nergens meer op en je bent er nooit. Ben ik je nog iets waard?"`, opts:[
    {l:'"Sorry. Laten we het goedmaken."', toon:'kalm', f(){ v.band = Math.max(v.band + 30, 0); mod('moraal', 2); return `Het is even stil. Dan zegt ${vn}: "Oké. Maar dan meen je het." Jullie spreken af voor zaterdag. (band +30)`; }},
    {l:'"Ik heb even tijd nodig."', toon:'bal', f(){ zetBand(5); return `"Neem die tijd dan," zegt ${vn}. "Maar wacht niet te lang." ${vr.Hij} hangt op. (band +5)`; }},
    {l:'"Misschien zijn we gewoon uit elkaar gegroeid."', toon:'fel', f(){ return vriendBreuk(); }}]};
}
function breukBericht(){
  const v = S.sp.vriend, vn = v.voornaam;
  return {soort:'prive', titel:'Het is voorbij', tekst:`${vn} stuurt je een lang bericht. "Ik heb het geprobeerd. Jij niet. Ik ben er klaar mee."`, opts:[
    {l:`${vr.Hem} nog één keer bellen`, toon:'kalm', f(){ if (rnd() < .35){ v.band = -20; return `${vn} neemt op. Na een lang gesprek zegt ${vr.hij}: "Eén kans nog." (band −20)`; } return `${vn} neemt niet op. ` + vriendBreuk(); }},
    {l:'"Dan niet."', toon:'fel', f(){ return vriendBreuk(); }}]};
}
// De breuk: in jouw competitie wordt hij je rivaal (bij zijn eigen club, of hij vertrekt als hij bij jou speelt);
// speelt hij ergens anders, dan hebben jullie geen contact meer (v.verbroken). Geeft de tekst voor het bericht
export function vriendBreuk(){
  const sp = S.sp, v = sp.vriend, vn = v.voornaam, band = Math.round(Math.max(v.band, -100));
  mod('moraal', -8); v.gewaarschuwd = false;
  if (!opAfstand() && v.club != null){
    const naar = bijJou() ? breukDoel().naar : v.club;
    if (naar != null) vriendWordtRivaal(band, naar, true);
    if (v.weg && sp.rivaal && sp.rivaal.exVriend) return `Het is voorbij tussen jou en ${vn}. Vanaf nu is ${vr.hij} je rivaal. (moraal −8)`;
  }
  v.weg = true; v.verbroken = {week:S.weekNr || 0, contact:0};
  S.car.hist.push(`${seizoenLabel()}: breuk met jeugd${vr.vriend} ${vn} ${v.n}`);
  krantMelding(`Breuk tussen ${sp.naam} en ${vn} ${v.n}`, `De jeugdvrienden zijn uit elkaar gegroeid. "We spreken elkaar niet meer," zegt ${vn}.`);
  return `Het is voorbij tussen jou en ${vn}. Jullie hebben geen contact meer. (moraal −8)`;
}
// Geen contact meer: zelf een bericht sturen (1 per week, zoals de acties met je vriend), of hij stuurt er af en toe een
export const kanContact = () => { const sp = S.sp, v = sp.vriend; return !!(v && v.weg && v.verbroken && S.week && !S.week.vriend && !sp.clubloos); };
export function contactZoeken(){
  if (!kanContact()) return;
  const v = S.sp.vriend, B = v.verbroken, vn = v.voornaam; B.contact = (B.contact || 0) + 8; S.week.vriend = 'contact';
  S.week.tekst.push(B.contact >= 30 ? weerVrienden() : pick([`Je stuurt ${vn} een bericht. Het blijft lang stil, dan komt er een kort "hoi" terug.`, `Je feliciteert ${vn} met ${vr.zijn} wedstrijd. ${vr.Hij} stuurt een duimpje terug.`, `Je stuurt ${vn} een oude foto van jullie. Gelezen, geen antwoord. Maar ${vr.hij} heeft hem wel gezien.`]));
}
function weerVrienden(){
  const sp = S.sp, v = sp.vriend, vn = v.voornaam; v.weg = false; v.verbroken = null; v.band = 30; v.waarschuwJaar = S.jaar;
  if (sp.journey) sp.journey.route = 'vriend';
  S.car.hist.push(`${seizoenLabel()}: ${vn} ${v.n} is weer je vriend`); mod('moraal', 5);
  return `${vn} belt je. Na een paar minuten lachen jullie weer, net als vroeger. Jullie zijn weer vrienden. (moraal +5)`;
}
function contactWeek(){
  const v = S.sp.vriend, B = v.verbroken, vn = v.voornaam;
  if (S.wachtEv || S.sp.clubloos || (S.weekNr || 0) - (B.week || 0) < 19 || B.evJaar === S.jaar || rnd() >= .08) return;
  B.evJaar = S.jaar;
  S.wachtEv = {soort:'prive', titel:`Een bericht van ${vn}`, tekst:`Na lange tijd stuurt ${vn} je een berichtje: "Hé. Ik zag je laatste wedstrijd. Goed gespeeld."`, opts:[
    {l:'Meteen terugbellen', toon:'kalm', f(){ return weerVrienden(); }},
    {l:'Een duimpje terugsturen', toon:'bal', f(){ B.contact = (B.contact || 0) + 10; return 'Een begin. Misschien komt het ooit weer goed.'; }},
    {l:'Niet reageren', toon:'fel', f(){ B.contact = 0; return `${vn} stuurt niets meer.`; }}]};
}

// De zaakwaarnemer probeert het opnieuw (jullie band is laag)
function vosOpnieuw(){
  const v = S.sp.vriend, d = breukDoel(), vn = v.voornaam; if (d.naar == null || d.naar === v.club || opAfstand()) return null;
  return {soort:'prive', tekst:`${MAKELAAR} belt ${vn} weer. Jullie spreken elkaar bijna niet meer, en ${CLUBS[d.naar].n} wil ${vr.hem} hebben.`, opts:[
    {l:bijJou() ? '' + vr.Hem + ' bellen: "Blijf, ik heb je nodig."' : `${vr.Hem} bellen: "Blijf bij ${vriendClubNaam() || 'je club'}, en laten we elkaar weer vaker zien."`, toon:'kalm', f(){ zetBand(20); return `${vn} is verrast dat je belt. ${vr.Hij} blijft. "Dank je, ${ik.knul}."`; }},
    {l:'Het aan hem laten', toon:'bal', f(){ if (v.band >= 15){ breukUitkomst('vriend', 0, d.naar); return `${vn} vertrekt naar ${CLUBS[d.naar].n}, maar zegt: "Vrienden blijven, toch?"`; } breukUitkomst('rivaal', -10, d.naar); return `${vn} vertrekt naar ${CLUBS[d.naar].n}. Jullie worden rivalen.`; }},
    {l:'"Ga maar, het maakt me niet uit."', toon:'fel', f(){ breukUitkomst('rivaal', -40, d.naar); return `${vn} vertrekt naar ${CLUBS[d.naar].n}. Vanaf nu zijn jullie rivalen.`; }}]};
}

// ---------- elke week: de verleiding (winter van je eerste seizoen, als je vriend nog je vriend is) ----------
export function verleidingWeek(eerste){
  const sp = S.sp, J = journey(); if (!J || J.verleiding || S.trainer || eerste || sp.clubloos || !sp.vriend) return;
  if (S.jaar !== J.jaar){ J.verleiding = true; return; } // (het eerste seizoen is voorbij: geen verleiding meer)
  if (S.ronde < WINTER) return;
  if (S.ronde > WINTER){ J.verleiding = true; return; } // (de winterstop is voorbij: dan komt dit gesprek niet meer)
  if (!vriendActief()) return;
  J.verleiding = true;
  const d = breukDoel(); if (d.naar == null) return;
  const ev = verleidingEvent({...d, band:Math.round(sp.vriend.band)}); if (!ev) return;
  // in de winterstop zelf; staat er al iets anders klaar, dan komt dat erna
  const ander = S.wachtEv; // (kiesEvent wist S.volgEv eerst: daarom hangt het andere bericht aan de antwoorden)
  if (ander) ev.opts = ev.opts.map(o => ({...o, f(){ const t = o.f.call(this); if (!S.volgEv) S.volgEv = ander; return t; }}));
  S.wachtEv = ev;
}
