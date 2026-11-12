import { S, mod, ovr, salarisVoor } from '../../core/state.js';
import { clamp, pick, randInt, rnd } from '../../core/utils.js';
import { AGENT, CLUBS, LAAGSTE, TRAINBAAR, divClubs } from '../../data/gegevens.js';
import { thuisLand } from '../../data/landen.js';
import { teamKracht } from '../team/kleedkamer.js';
import { focusNaWedstrijd } from '../wedstrijd/focus.js';
import { staminaNaWedstrijd } from '../wedstrijd/stamina.js';
import { planWedstrijd, verderSpelen } from '../wedstrijd/wedstrijd.js';
import { weekHerstel } from '../week.js';
import { fmt1, gemiddelde } from './o23.js';
import { tekenSelectie } from './selectie.js';
import { plaatsVriend, vriendApart } from './journey.js';
import { andereWereldClub, andereWereldIds } from '../transfers/buitenland.js';

/* ===================== De laatbloeier (23): proeftraining en oefenwedstrijd ===================== */
// Wie op zijn 23e begint (startverhaal 'bewijs'), doet geen selectiedagen. Je bent weggestuurd bij je amateurclub en zit
// thuis, tot je oude vriend en kersverse zaakwaarnemer (AGENT) belt: hij heeft een kans geregeld bij een club. Daar doe je
// een proeftraining (5 oefeningen, elk veilig of met risico) en een oefenwedstrijd. Haal je voor allebei minstens een
// PROEF_GRENS, dan tekent de club je. Zo niet, dan train je een paar weken thuis tot hij met een nieuwe club komt.
// De stand staat in S.selectie.proef (zolang S.selectie bestaat, zijn de zijbalk en de hud nog verborgen, net als bij
// de selectiedagen).
export const PROEF_GRENS = 6.5;
export const OEF_AANTAL = 5;
export const proefStand = () => (S && S.selectie && S.selectie.proef) || null;
export const isProefStart = () => !!(S && S.sp && S.sp.startVerhaal === 'bewijs' && S.selectie && S.selectie.proef);

// ---------- de oefeningen ----------
// a: de eigenschap (of per positie), anim: de pixelanimatie (pixel/animaties.js), v/r: wat je kiest (veilig of risico),
// ok/mis: wat er gebeurt (veilig en risico apart), pos: voor welke posities (een keeper schiet niet op de keeper)
export const OEFENINGEN = {
  // ----- veldspelers -----
  afwerken:{pos:['SPITS'], n:'Afwerken op de keeper', a:'afw', anim:'schiet', u:'Tien ballen vanaf de rand van de zestien, tegen de eerste keeper van de club.',
    v:'Laag en hard in de hoek', r:'Vol op de slof, in de kruising',
    ok:['Acht van de tien. De keeper schudt zijn hoofd.', 'Twee keer kruising, één keer via de paal erin. De spitsen van de club kijken elkaar aan.'],
    mis:['Je schiet te zacht, de keeper pakt ze makkelijk.', 'Drie ballen gaan over de goal en belanden in de sloot naast het veld.']},
  afstand:{pos:['MID'], n:'Afstandsschot', a:'afw', anim:'schiet', u:'Een teruggelegde bal op de rand van de zestien: schieten, in één keer.',
    v:'Op doel, met binnenkant voet', r:'Vol op de wreef, vanaf 25 meter',
    ok:['Bijna elk schot op doel. "Daar kunnen we wat mee," zegt de trainer.', 'Een knal vanaf 25 meter, in de kruising. Het wordt even stil op het trainingsveld.'],
    mis:['Je schoten zijn te slap: makkelijk voor de keeper.', 'De bal vliegt hoog over, tot achter het hek.']},
  passen:{pos:['SPITS', 'MID'], n:'Kaatsen en passen', a:'pas', anim:'schiet', u:'Een rondo en daarna lange ballen naar de vleugel, op tempo.',
    v:'Kort en zuiver, niks forceren', r:'De lange bal over veertig meter',
    ok:['Geen bal mis. De assistent-trainer zet een vinkje.', 'Je lange bal valt precies in de loop van de vleugelspeler. "Wie is dat?" hoor je iemand vragen.'],
    mis:['Twee passes te zacht: onderschept.', 'De lange bal zeilt over iedereen heen de zijlijn uit.']},
  opbouw:{pos:['VERD'], n:'Opbouwen van achteruit', a:'pas', anim:'schiet', u:'Je krijgt de bal van de keeper, met een spits die vol druk zet.',
    v:'De korte bal naar de vrije man', r:'Een lange bal achter de verdediging',
    ok:['Rustig aan de bal, steeds de vrije man gevonden.', 'Je lange bal snijdt door de hele defensie. De spits staat alleen voor de keeper.'],
    mis:['Je speelt de bal in de voeten van de spits die druk zet.', 'De lange bal is te lang: doeltrap.']},
  sprint:{pos:['SPITS', 'MID', 'VERD'], n:'Sprint over 30 meter', a:'cond', anim:'ren', u:'Vijf sprints met korte rust. De fitnesstrainer staat met de stopwatch klaar.',
    v:'Rustig opbouwen, elke sprint even snel', r:'Alles geven vanaf de eerste',
    ok:['Steeds dezelfde tijd. "Die is fit," zegt de fitnesstrainer.', 'De snelste tijd van de hele groep. Je longen branden, maar dat is het waard.'],
    mis:['Je bent te voorzichtig: de langzaamste tijden van de groep.', 'Na drie sprints zit je erdoorheen en moet je stoppen.']},
  een:{pos:['SPITS', 'MID'], n:'Eén tegen één', a:'drib', anim:'dribbel', u:'Een verdediger van de club tegenover je. Kom langs hem en speel de bal breed.',
    v:'Een simpele schijnbeweging en dan breed', r:'Een stepover en de panna',
    ok:['Je komt er keer op keer langs. Niet mooi, wel effectief.', 'Panna! De hele groep joelt. De verdediger kan er zelf ook om lachen.'],
    mis:['Je blijft steeds hangen in zijn benen.', 'De stepover lukt, de panna niet: hij pakt de bal en jij ligt op de grond.']},
  kop:{pos:['SPITS', 'VERD'], n:'Kopduel', a:{SPITS:'afw'}, aStd:'verd', anim:'kop', u:'Hoge voorzetten van links en rechts, met een tegenstander in je rug.',
    v:'Op tijd staan en de bal goed raken', r:'Vol de lucht in, met een snoekduik',
    ok:['Je wint bijna elk duel in de lucht.', 'Een snoekduik, keihard tegen de bal. Applaus langs de lijn.'],
    mis:['Je springt steeds net te laat.', 'Je duikt mis en landt met je gezicht in het gras.']},
  sliding:{pos:['VERD'], n:'Sliding en duel', a:'verd', anim:'sliding', u:'Een snelle aanvaller komt op je af. Pak de bal af, zonder overtreding.',
    v:'Op de been blijven en je tijd nemen', r:'Een volle sliding',
    ok:['Je blijft staan en pakt de bal netjes af. De trainer knikt.', 'Een perfecte sliding: bal, geen man. De aanvaller kijkt verbaasd om.'],
    mis:['Hij is je steeds te snel af.', 'Je sliding komt te laat. Fluitje, en een boze blik van de trainer.']},
  positie:{pos:['MID'], n:'Positiespel', a:'pas', anim:'loop', u:'Elf tegen elf op een half veld. De trainer let op waar je staat zonder bal.',
    v:'Op je plek blijven, het team helpen', r:'Overal opduiken waar de bal is',
    ok:['Je staat steeds goed. "Slim," zegt de trainer.', 'Je bent overal, en het werkt: twee keer win je de bal en maak je een kans.'],
    mis:['Je staat te vaak in de weg.', 'Je loopt overal, maar je laat een gat achter: twee keer scoort de andere ploeg.']},
  linie:{pos:['VERD'], n:'De linie dicht houden', a:'verd', anim:'loop', u:'Vier verdedigers tegen zes aanvallers. Samen schuiven, en de buitenspelval zetten.',
    v:'In de linie blijven en coachen', r:'Vroeg uitstappen om de bal te veroveren',
    ok:['Je linie staat als een huis. Je coacht de anderen alsof je hier al jaren speelt.', 'Je stapt op het goede moment uit en pakt de bal. Meteen een aanval.'],
    mis:['Je zakt steeds te ver in en heft de buitenspelval op.', 'Je stapt uit en mist: de spits loopt alleen op de keeper af.']},
  // ----- keepers: zij schieten niet, er wordt op hén geschoten -----
  reddingen:{pos:['KEEPER'], n:'Reddingen', a:'verd', anim:'vang', u:'De spitsen van de club schieten van alle kanten op jou, van dichtbij en van ver.',
    v:'Goed staan en de bal klemvast', r:'Naar elke bal duiken, ook de onhoudbare',
    ok:['Bijna alles klemvast. De keeperstrainer is tevreden.', 'Je duikt naar de goede hoek en tikt hem met één hand om de paal. Iedereen stopt even met spelen.'],
    mis:['Te veel ballen glippen door je handen.', 'Je duikt te vroeg en de bal gaat door het midden erin.']},
  penalty:{pos:['KEEPER'], n:'Penalty\'s stoppen', a:'verd', anim:'duik', u:'Vijf strafschoppen van de spitsen van de club. Wie kiest de goede hoek?',
    v:'Lang blijven staan en reageren', r:'Gokken en vroeg naar een hoek',
    ok:['Je blijft staan en pakt er twee. De spitsen kijken elkaar aan.', 'Drie keer de goede hoek gegokt! De keeperstrainer klapt in zijn handen.'],
    mis:['Je reageert steeds net te laat: vijf keer raak.', 'Je gokt elke keer verkeerd. Vijf keer raak, en de spitsen lachen.']},
  uitkomen:{pos:['KEEPER'], n:'Uitkomen bij hoge ballen', a:'cond', anim:'spring', u:'Hoekschoppen en voorzetten, met spitsen die je in de weg staan.',
    v:'Alleen uitkomen als het zeker is', r:'Elke bal uit de lucht plukken',
    ok:['Je komt op het goede moment uit en blijft staan. Rustig.', 'Je plukt alles uit de lucht. "Dat is een keeper," zegt de trainer.'],
    mis:['Je blijft te vaak op je lijn en de spitsen koppen raak.', 'Je komt uit en mist de bal: hij gaat in het lege doel.']},
  eenKeeper:{pos:['KEEPER'], n:'Eén tegen één', a:'afw', anim:'duik', u:'Een spits komt alleen op je af. Jij bepaalt wanneer je uitkomt.',
    v:'Groot maken en wachten op zijn beweging', r:'Vol uitkomen en aan zijn voeten duiken',
    ok:['Je maakt je groot en hij schiet tegen je aan.', 'Je duikt aan zijn voeten en hebt de bal. Moedig, zegt de trainer.'],
    mis:['Hij wacht je af en schuift hem rustig langs je heen.', 'Je komt te laat uit: hij tikt de bal over je heen.']},
  uittrap:{pos:['KEEPER'], n:'Uittrap en opbouw', a:'pas', anim:'schiet', u:'Opbouwen van achteruit, en lange uittrappen naar de spits.',
    v:'De korte bal naar de verdediger', r:'De lange uittrap op de borst van de spits',
    ok:['Rustig aan de bal. Je speelt steeds de vrije man.', 'Je uittrap komt precies op de borst van de spits. Dat zie je niet vaak.'],
    mis:['Je speelt de bal twee keer recht in de voeten van een tegenstander.', 'De uittrap gaat zo de zijlijn uit.']},
};
const PER_POS = {
  SPITS:['afwerken', 'een', 'sprint', 'kop', 'passen'],
  MID:['passen', 'positie', 'een', 'afstand', 'sprint'],
  VERD:['sliding', 'kop', 'linie', 'opbouw', 'sprint'],
  KEEPER:['reddingen', 'penalty', 'uitkomen', 'eenKeeper', 'uittrap'],
};
// De oefeningen voor jouw positie: alleen wat bij je positie hoort, en elke oefening één keer
export function oefeningenVoor(pos){
  const p = PER_POS[pos] ? pos : 'MID';
  return [...new Set(PER_POS[p])].filter(id => OEFENINGEN[id] && OEFENINGEN[id].pos.includes(p));
}
export const oefAttr = (id, pos = S.sp.pos) => { const o = OEFENINGEN[id]; return typeof o.a === 'string' ? o.a : o.a[pos] || o.aStd; };
// Wat de club vraagt: het niveau van de club. Ben je op die eigenschap net zo goed, dan lukt veilig in 6 van de 10
// keer en risico in 35 van de 100; elke 4 punten beter of slechter is 10% erbij of eraf
const eis = P => CLUBS[P.club].s;
export function oefKans(id, veilig){
  const P = proefStand(), w = S.sp.a[oefAttr(id)] ?? ovr(S.sp);
  return clamp((veilig ? .6 : .35) + (w - eis(P)) / 40, .1, .95);
}

// ---------- een nieuwe kans: Rik belt met een club ----------
// Rond je eigen klasse; na elke mislukte poging zakt het niveau een beetje. Nooit twee keer dezelfde club, en niet de club van je vriend.
export function nieuweKans(){
  const sp = S.sp, Sel = S.selectie, oud = Sel.proef || {};
  const poging = (oud.poging || 0) + 1, geprobeerd = (oud.geprobeerd || []).slice(), o = ovr(sp);
  let lijst = [...divClubs(1), ...divClubs(LAAGSTE)].filter(i => !geprobeerd.includes(i) && !(sp.vriend && sp.vriend.club === i && !vriendApart()));
  if (!lijst.length){ geprobeerd.length = 0; lijst = divClubs(LAAGSTE); }
  const doel = o - 1 - (poging - 1) * 2;
  lijst.sort((a, b) => Math.abs(CLUBS[a].s - doel) - Math.abs(CLUBS[b].s - doel));
  const club = pick(lijst.slice(0, 3)); geprobeerd.push(club);
  const oef = oefeningenVoor(sp.pos);
  Sel.proef = {poging, geprobeerd, club, stap:'training', oef:oef.slice(0, OEF_AANTAL), i:0, punten:[], laatste:null, training:null, wed:null, wacht:null};
  S.fase = 'proef';
  return club;
}

// ---------- de proeftraining ----------
// Kies je aanpak voor de huidige oefening: veilig (grote kans, een 6,5 tot 7,2) of risico (kleinere kans, maar een 8 tot 9)
export function doeOefening(veilig){
  const P = proefStand(); if (!P || P.stap !== 'training' || P.laatste) return;
  const id = P.oef[P.i], o = OEFENINGEN[id], gelukt = rnd() < oefKans(id, veilig);
  const r = (a, b) => Math.round((a + rnd() * (b - a)) * 10) / 10;
  const cijfer = gelukt ? (veilig ? r(6.5, 7.2) : r(8, 9)) : (veilig ? r(5.5, 6) : r(5, 5.5));
  P.punten.push(cijfer);
  P.laatste = {id, veilig, gelukt, cijfer, tekst:(gelukt ? o.ok : o.mis)[veilig ? 0 : 1]};
}
// Na de uitslag van een oefening: de volgende, of de uitslag van de hele training
export function volgendeOefening(){
  const P = proefStand(); if (!P || !P.laatste) return;
  P.laatste = null; P.i++;
  if (P.i >= P.oef.length){ P.training = Math.round(gemiddelde(P.punten) * 10) / 10; P.stap = 'naTraining'; }
}

// ---------- de oefenwedstrijd (net als een selectiewedstrijd, maar dan met de club van je proeftraining) ----------
const TEGEN = ['VV De Zwaluwen', 'SV Noordkust', 'FC Polderland', 'RKSV De Hoeve', 'VV Oranjewit', 'SC Lindenoord'];
export function startProefWed(){
  const sp = S.sp, P = proefStand(); if (!P) return;
  const c = CLUBS[P.club], wijS = c.s - 2 + randInt(0, 2), oppS = c.s - 4 + randInt(0, 4), thuis = true;
  const T = teamKracht(wijS, {speelt:true, thuis, bonus:false}), O = oppS;
  P.stap = 'wed';
  // (vlag selectie: alles wat voor een selectiewedstrijd geldt, geldt hier ook: geen opdrachten, geen opkomst, geen clublogo's)
  const M = {o23:true, selectie:true, proef:true, oppS, wij:c.n, zij:pick(TEGEN), thuis, rol:'basis', us:0, them:0, min:0, ev:[], idx:0, log:[], cijfer:sp.pos === 'VERD' || sp.pos === 'KEEPER' ? 6.3 : 6.0, goals:0, assists:0, geel:false, rood:false, pending:null, klaar:false};
  S.M = M;
  planWedstrijd(M, T, O);
  M.log.push({m:"1'", t:`Oefenwedstrijd bij ${c.n}. De trainer en de technisch directeur staan langs de lijn met hun armen over elkaar. ${AGENT} zit op de tribune en steekt zijn duim op.`, k:''});
  S.fase = 'match';
  verderSpelen();
}
// (eindeSelectie stuurt een oefenwedstrijd hierheen)
export function eindeProefWed(){
  const sp = S.sp, M = S.M, P = proefStand();
  M.klaar = true;
  if (M.us > M.them) M.cijfer += .3; else if (M.us < M.them) M.cijfer -= .3;
  if ((sp.pos === 'VERD' || sp.pos === 'KEEPER') && M.them === 0) M.cijfer += sp.pos === 'KEEPER' ? .7 : .5;
  M.cijfer = Math.round(clamp(M.cijfer, 3, 10) * 10) / 10;
  sp.vorm = clamp(sp.vorm * .5 + (M.cijfer - 6.5) * .7, -3, 3);
  staminaNaWedstrijd(M); focusNaWedstrijd(M);
  P.wed = M.cijfer; P.stap = 'naWed';
  const gehaald = geslaagd(P);
  M.proefTekst = `Proeftraining ${fmt1(P.training)}, oefenwedstrijd ${fmt1(P.wed)} (nodig: ${fmt1(PROEF_GRENS)} voor allebei). `
    + (gehaald ? `De trainer komt naar je toe en steekt zijn hand uit: "Welkom bij ${CLUBS[P.club].n}."` : `De trainer schudt je de hand: "Bedankt dat je er was. Het is net niet genoeg." ${AGENT} slaat een arm om je heen: "Kop op. Ik zoek iets nieuws."`);
  S.fase = 'matchEnd';
}
export const geslaagd = P => P.training >= PROEF_GRENS && P.wed >= PROEF_GRENS;
// Na het eindscherm van de oefenwedstrijd: tekenen, of naar huis en wachten op de volgende kans
export function naProefWed(){
  const P = proefStand(); S.M = null; if (!P) return;
  S.sp.fit = clamp(S.sp.fit + weekHerstel(S.sp.fit), 0, 100);
  if (geslaagd(P)) return tekenProef();
  P.stap = 'wacht'; P.wacht = {week:1, van:randInt(1, 3), gedaan:null};
  S.fase = 'proef';
}
function tekenProef(){
  const sp = S.sp, Sel = S.selectie, P = Sel.proef, c = CLUBS[P.club], o = ovr(sp);
  const salaris = Math.round(salarisVoor(c.t, o, c.s) * (.85 + rnd() * .2) / 100) * 100;
  Sel.cijfers = [P.training, P.wed];
  Sel.bods = [{club:P.club, o23:false, soort:'past', salaris, jaren:randInt(1, 2), proef:true, training:P.training, wed:P.wed, quote:'"Je hebt het laten zien. Hier krijg je je kans."'}];
  return tekenSelectie(0);
}

// ---------- thuis wachten op de volgende kans ----------
// Elke week één ding: trainen (een eigenschap +1 of +2), je conditie op peil houden, of rust (moraal)
export const THUIS = {
  trainen:{n:'Alleen trainen', d:'een eigenschap naar keuze +1 à +2'},
  conditie:{n:'Hardlopen in het park', d:'fitheid omhoog'},
  rust:{n:'Rust en vrienden zien', d:'moraal omhoog'},
};
export function doeThuis(soort, attr){
  const sp = S.sp, P = proefStand(); if (!P || P.stap !== 'wacht' || P.wacht.gedaan) return;
  let t;
  if (soort === 'trainen' && TRAINBAAR.includes(attr)){ const d = randInt(1, 2); sp.a[attr] = clamp(sp.a[attr] + d, 20, 99); t = `Elke ochtend op het trapveldje: +${d}.`; }
  else if (soort === 'conditie'){ sp.fit = clamp(sp.fit + 15, 0, 100); t = 'Je loopt elke dag je rondjes. Je voelt je fitter.'; }
  else if (soort === 'rust'){ mod('moraal', 8); t = 'Even niet aan voetbal denken. Het doet je goed.'; }
  else return;
  P.wacht.gedaan = {soort, attr, t};
}
export function volgendeThuisWeek(){
  const P = proefStand(); if (!P || P.stap !== 'wacht') return;
  S.sp.fit = clamp(S.sp.fit + 5, 0, 100);
  if (P.wacht.week < P.wacht.van){ P.wacht.week++; P.wacht.gedaan = null; return; }
  const vorige = P.club; nieuweKans(); S.selectie.proef.vorige = vorige;
}

// ---------- je vriend speelt al ergens (bij de start op je 23e) ----------
export function vriendAlBijClub(){
  const sp = S.sp, v = sp.vriend; if (!v || v.club != null) return;
  if (vriendApart()){
    const l = [1, 2].flatMap(t => andereWereldIds(thuisLand(), t)).map(i => [i, andereWereldClub(thuisLand(), i).s]).sort((a, b) => Math.abs(a[1] - v.k - 2) - Math.abs(b[1] - v.k - 2));
    if (l.length) plaatsVriend(pick(l.slice(0, 3))[0], false);
    return;
  }
  const l = [...divClubs(1), ...divClubs(LAAGSTE)].sort((a, b) => Math.abs(CLUBS[a].s - v.k - 2) - Math.abs(CLUBS[b].s - v.k - 2));
  plaatsVriend(pick(l.slice(0, 3)), false);
}
