import { S, VERSIE, club, ovr, seizoenLabel, setS } from '../../core/state.js';
import { clamp, pick, randInt } from '../../core/utils.js';
import { AANV, CLUBS, LAAGSTE, LEGENDE, OPST_BASIS, POS, STATUS, divClubs, zetClubs, ELITE_NAAM, landBasis, niveauVan } from '../../data/gegevens.js';
import { SPEEL_LANDEN, zetLand } from '../../data/landen.js';
import { nieuweBekers } from '../competitie/beker.js';
import { opstMax } from '../team/opstelling.js';
import { norm } from '../transfers/zaakwaarnemer.js';
import { LEEFTIJDEN, startVoor } from './startverhaal.js';
import { maakJourney, openHoofdstuk } from './journey.js';
import { fotoVan } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { MAX_PERS, PERS, pers } from './persoonlijkheid.js';
import { zetWereld } from '../../data/gegevens.js';
import { ik } from '../../core/geslacht.js';
import { eindLengte } from './lichaam.js';
import { chemie } from '../team/kleedkamer.js';

/* ===================== Status bij de club ===================== */
// Startstatus bij een nieuwe club: hoe beter je bent dan de club en hoe bekender je bent, hoe hoger
export function startStatus(id, cObj){
  const sp = S.sp, c = cObj || CLUBS[id];
  const st = clamp((ovr(sp) - c.s) * 3 + sp.rep * .45, 0, 62);
  // Een tiener is bij een nieuwe club altijd eerst een jonkie, hoe goed hij ook is
  return sp.leeftijd < 20 ? Math.min(st, 8) : st;
}
// Niveau uit punten, met voorwaarden voor aanvoerder (aanvOk: de eisen hieronder) en clublegende (4 seizoenen)
export function niveauVoor(pt, sz, wed, legende, t, leeftijd, aanvOk = sz >= 1 && leeftijd >= 23){
  if (legende) return LEGENDE;
  let n = 0;
  STATUS.forEach((s, i) => { if (pt >= s.min) n = i; });
  if (n === 0 && wed >= 10 && pt >= 8) n = 1; // na 10 wedstrijden ben je geen nieuwkomer meer, als je niet slecht speelt
  if (n >= LEGENDE && sz < 4) n = AANV;
  if (n >= AANV && !aanvOk) n = AANV - 1;
  return n;
}
// Aanvoerder word je niet zomaar: naast je statuspunten moet de groep achter je staan, de trainer je vertrouwen,
// en heb je ervaring nodig. Onder de 23 kan het ook (vanaf 19), maar dan zijn de eisen strenger: dat gebeurt maar zelden.
export const aanvLeeftijd = () => 19;
export const JONG_AANV = 23;
export function aanvoerderEisen(){
  const sp = S.sp, jong = sp.leeftijd < JONG_AANV, rood = sp.roodBij != null ? S.car.wed - sp.roodBij : 99, groep = Math.round(chemie());
  const eis = (t, nu, doel, eenheid = '') => ({t, nu, doel, eenheid, ok:nu >= doel, voortgang:Math.max(0, Math.min(1, nu / doel))});
  return [
    eis('Statuspunten', Math.floor(sp.status), STATUS[AANV].min),
    eis('Hele seizoenen bij de club', sp.clubSz, 1),
    eis('Wedstrijden voor de club', sp.clubWed, 30),
    {...eis('Vertrouwen van de trainer', Math.round(sp.vert), jong ? 90 : 75), tip:'Train hard, speel goed en blijf uit de problemen.'},
    {...eis('Band met de groep', groep, jong ? 70 : 60), tip:'Doe dingen met je teamgenoten (Team: praten, samen trainen, uitpraten).'},
    eis('Wedstrijden in je carrière', S.car.wed, 80),
    {...eis('Wedstrijden zonder rode kaart', Math.min(rood, 10), 10), t:'Geen rode kaart in je laatste 10 wedstrijden'},
    eis('Leeftijd', sp.leeftijd, aanvLeeftijd(), ' jaar'),
  ];
}
export function statusNiveau(){
  const sp = S.sp;
  // al aanvoerder? Dan hou je de band zolang je statuspunten hoog genoeg blijven. Anders moeten alle eisen gehaald zijn
  const aanvOk = sp.status >= STATUS[AANV].min && ((sp.statusNiveau >= AANV && sp.clubSz >= 1) || aanvoerderEisen().every(e => e.ok));
  return niveauVoor(sp.status, sp.clubSz, sp.clubWed, sp.legendeHier, club().t, sp.leeftijd, aanvOk);
}
export function statusNaam(n){ return n === 0 && S.sp.leeftijd < 21 ? 'Jonkie' : STATUS[n].n; }
export function statusPunten(d){ if (d > 0) d *= pers('status'); S.sp.status = clamp(S.sp.status + d, 0, 100); }
// Punten per wedstrijd: langzaam omhoog, na een slechte wedstrijd hard omlaag
export function wedstrijdPunten(c, goals, assists, gewonnen, rood, inval){
  // Een invaller heeft minder minuten om op te vallen, dus de trainer beoordeelt hem iets milder
  const norm = inval ? 6.0 : 6.3;
  const basis = c >= norm ? (c - norm) * 1.6 : (c - norm) * 4;
  return basis + goals * .8 + assists * .4 + (gewonnen ? .3 : 0) - (rood ? 4 : 0);
}
export function statusDrempel(){
  const sp = S.sp, n = statusNiveau(); if (n >= LEGENDE) return null;
  const doel = n + 1, nodig = [];
  if (sp.status < STATUS[doel].min) nodig.push(`${Math.ceil(STATUS[doel].min - sp.status)} statuspunten`);
  // Bankspeler: verdien het met goede wedstrijden, of hoor er na 10 wedstrijden vanzelf bij (als je niet slecht speelt)
  if (doel === 1 && sp.clubWed < 10) nodig[0] = sp.status >= 8 ? `${nodig[0]} met goede wedstrijden (of nog ${10 - sp.clubWed} wedstrijden spelen)` : `${nodig[0]} met goede wedstrijden (of na ${10 - sp.clubWed} wedstrijden, als je dan minstens 8 statuspunten hebt)`;
  else if (doel === 1) nodig[0] = `${nodig[0]} met goede wedstrijden`;
  if (doel === AANV) for (const e of aanvoerderEisen().slice(1)) if (!e.ok) nodig.push(`${e.t.toLowerCase()} ${e.nu}/${e.doel}`);
  if (doel === LEGENDE && sp.clubSz < 4) nodig.push(`${4 - sp.clubSz} ${4 - sp.clubSz === 1 ? 'seizoen' : 'seizoenen'} meer bij de club`);
  return {naam:STATUS[doel].n, nodig};
}
// Een statuswijziging die het nieuws haalt: basisplaats, fanfavoriet, aanvoerder, clublegende, en terug naar de bank.
// Dezelfde overgang komt pas na 6 speelrondes opnieuw in de krant (anders elke week "weer basis, weer bank")
export const STATUS_KRANT_PAUZE = 6;
export function statusKrant(oud, n){
  const sp = S.sp, c = club().n, naam = sp.naam;
  let sleutel = null, kop, tekst, foto = null;
  if (n > oud){
    if (n === 2){ sleutel = 'basis'; kop = `${naam} verovert een basisplaats bij ${c}`; tekst = 'De trainer rekent elke week op ' + ik.hem + '. "' + ik.Hij + ' heeft het verdiend."'; }
    else if (n === 3){ sleutel = 'fans'; kop = `Fanfavoriet: ${c} zingt de naam van ${naam}`; tekst = 'Op de tribune hangt al een spandoek met ' + ik.zijn + ' naam. De fans hebben een nieuwe ' + ik.held + '.'; }
    else if (n === AANV){ sleutel = 'aanv'; kop = `${naam} is de nieuwe aanvoerder van ${c}`; tekst = `De trainer geeft ${ik.hem} de band. "${ik.Hij} gaat voorop in de strijd, op en naast het veld."`; foto = fotoVan('portret', `${naam}, de nieuwe aanvoerder van ${c}.`); }
    else if (n === LEGENDE){ sleutel = 'legende'; kop = `${naam} is een clublegende van ${c}`; tekst = 'Na jaren trouwe dienst krijgt ' + ik.hij + ' een plek in de eregalerij van de club.'; foto = fotoVan('portret', `Clublegende ${naam}.`); }
  } else if (oud >= AANV && n < AANV && n > 1){ sleutel = 'bandWeg'; kop = `${naam} raakt de aanvoerdersband kwijt`; tekst = `Na een reeks mindere wedstrijden geeft de trainer de band aan een ander. ${naam} moet het vertrouwen terugwinnen.`; }
  else if (oud >= 2 && n === 1){ sleutel = 'bank'; kop = `${naam} kwijt zijn basisplaats bij ${c}`; tekst = 'Na een paar mindere wedstrijden begint ' + ik.hij + ' weer op de bank. ' + ik.Hij + ' moet zich terugknokken.'; }
  if (!sleutel) return null;
  const l = sp.statusKrant || {}, nu = S.jaar * 100 + S.ronde;
  if (l[sleutel] !== undefined && nu - l[sleutel] < STATUS_KRANT_PAUZE) return null;
  (sp.statusKrant = l)[sleutel] = nu;
  const it = krantMelding(kop, tekst, null, foto); it.status = true;
  return it;
}
// Controleert of je status veranderd is en geeft een bericht terug
export function checkStatus(){
  const sp = S.sp, oud = sp.statusNiveau, n = statusNiveau(), c = club().n;
  sp.statusNiveau = n;
  if (n === oud) return null;
  statusKrant(oud ?? 0, n);
  if (n > oud){
    if (n === 1) return `Je bent nu bankspeler bij ${c}. Pak je kansen als invaller, dan verdien je een basisplaats.`;
    if (n === 2) return `Je bent een vaste waarde bij ${c}! De trainer rekent elke week op je.`;
    if (n === 3) return `De fans zingen je naam! Je bent een fanfavoriet bij ${c}.`;
    if (n === AANV){ if (!S.car.hist.some(h => h.endsWith(`aanvoerder van ${c}`))) S.car.hist.push(`${seizoenLabel()}: aanvoerder van ${c}`); return `De trainer geeft je de aanvoerdersband. Jij bent de nieuwe aanvoerder van ${c}!`; }
    if (n === LEGENDE){ sp.legendeHier = true; S.car.hist.push(`${seizoenLabel()}: clublegende van ${c}`); S.car.prijzen.push(`Clublegende van ${c}`); return `Je bent een clublegende van ${c}! In de kantine hangt een grote foto van je.`; }
  }
  if (oud >= AANV && n < AANV && n > 1) return 'Je bent de aanvoerdersband kwijt. Je moet het vertrouwen van de club terugwinnen.';
  if (n === 1) return `Na je slechte spel ben je je basisplaats kwijt. Je bent weer bankspeler bij ${c} en moet je terugknokken.`;
  return `Je status bij ${c} zakt: je bent nu "${statusNaam(n)}".`;
}
// Welke rol zou je hebben bij een club? Gebruikt voor de transfermarkt en biedingen
export function rolBijClub(id, cObj){
  const sp = S.sp, c = cObj || CLUBS[id], hier = id === sp.club && !(cObj && cObj.land);
  const lvl = hier ? statusNiveau() : niveauVoor(startStatus(id, c), 0, 0, false, c.t, sp.leeftijd);
  const sc = opstMax(lvl, OPST_BASIS[lvl] + (hier ? sp.vorm * 9 + (sp.vert - 50) * .25 : -1.25) + clamp(ovr(sp) - c.s, -10, 10) * .8);
  const plek = sc >= 56 ? ['Basisspeler', 'r-veilig'] : sc >= 44 ? ['Strijd om een basisplaats', 'r-gem'] : ['Begint op de bank', 'r-riskant'];
  return {status:statusNaam(lvl), plek};
}

export function nieuweTabellen(){ const tab = {}; CLUBS.forEach((c, i) => tab[i] = {g:0,w:0,gl:0,v:0,dv:0,dt:0,pt:0}); return tab; }

// opties: {leeftijd: 15 | 18 | 23, uiterlijk: {huid, haar, kapsel}, sleutel (voor lengte, bouw en manier van bewegen, net als op het portret)}.
// Zonder opties: een 15-jarige met een toevallig uiterlijk
export function nieuwSpel(naam, pos, herkomst, land, opties = {}){
  land = SPEEL_LANDEN.includes(land) ? land : 'Nederland';
  const wereld = opties.vrouw ? 'v' : 'm'; zetWereld(wereld); // het mannen- of vrouwenvoetbal (vóór de clubs en de namen)
  zetClubs(landBasis(land)); // de startstand van dat land (met zijn topclub uit de oude Elite)
  zetLand(land);
  for (let i = 0; i < 8; i++) CLUBS[i].n = ELITE_NAAM[i]; // nieuwe carrière: de oorspronkelijke Europese Elite
  const lft = LEEFTIJDEN.includes(opties.leeftijd) ? opties.leeftijd : 15, V = startVoor(lft);
  const st = POS[pos].start, a = {};
  // in een sterker land begin je iets hoger (de onderste clubs zijn daar ook sterker; LAND_NIVEAU)
  const landExtra = Math.round((niveauVan(land).t2[1] - 51) * .5);
  for (const k in st) a[k] = st[k] + V.extra + landExtra + randInt(-3, 3);
  // Nog geen club: eerst de selectiewedstrijden (selectie.js). Tot dan staat er een voorlopige club in sp.club (voor de weergave)
  const id = pick(divClubs(LAAGSTE)), klasse = ovr({pos, a});
  const status = 8, niveau = 0;
  const sp = {naam, pos, leeftijd:lft, a, pot:Math.max(randInt(...V.pot), klasse + (V.id === 'bewijs' ? 10 : 6)), fit:90, vorm:0, moraal:60, rep:V.rep + (Array.isArray(opties.pers) ? opties.pers.reduce((a, id) => a + ((PERS[id] && PERS[id].fx.rep) || 0), 0) : 0), vert:V.vert,
    salaris:0, contract:1, club:id, geld:V.geld, blessure:0, items:{}, transferWens:false,
    relatie:null, rijbewijs:V.rijbewijs, rij:{lessen:V.rijbewijs ? 5 : 0, theorie:V.rijbewijs}, woning:V.woning, auto:V.auto, hond:false, status, clubWed:0, clubSz:0, statusNiveau:niveau, sindsTransfer:10, legendeHier:false,
    focus:65, school:{cijfers:[], gehad:[]}, ouders:{boos:false, trots:false},
    herkomst: herkomst || {geboren:'Nederland', vader:'Nederland', moeder:'Nederland'}, land:null, bonds:{}, agent:{doel:null, antwoord:null, gehaald:false, sugg:null},
    pers:Array.isArray(opties.pers) ? opties.pers.filter(p => PERS[p]).slice(0, MAX_PERS) : [], startVerhaal:V.id, ...(opties.uiterlijk ? {uiterlijk:{...opties.uiterlijk}} : {}), ...(opties.sleutel ? {uitSleutel:opties.sleutel} : {})};
  if (opties.vrouw) sp.vrouw = true;
  if (sp.uiterlijk && sp.uiterlijk.lengte) sp.uiterlijk.eind = eindLengte(sp.uiterlijk.lengte, lft, !!opties.vrouw); // (je groeit nog tot je 23e)
  sp.valtOp = opties.valtOp === 'm' || opties.valtOp === 'v' ? opties.valtOp : opties.vrouw ? 'm' : 'v'; // je partner: een vriend ('m') of een vriendin ('v')
  setS({v:VERSIE, mig4:true, mig5:true, mig6:true, niveauV2:true, wereld, land, startLand:land, sp, jaar:2026, ronde:0, tab:nieuweTabellen(), ss:{wed:0,g:0,a:0,c:[],bods:0}, vorigGem:6.5,
    car:{wed:0,g:0,a:0,clubs:[{club:sp.club, van:2026, land}], prijzen:[], hist:[], maxOvr:ovr(sp), maxWaarde:0, int:{}},
    fase:'week', week:null, ev:null, M:null, venster:null, eind:null});
  S.ss.bekers = nieuweBekers();
  S.selectie = {cijfers:[], g:0, a:0, tegen:[], verhaal:V.id};
  S.slot = opties.slot || 1; // de opslagplek van deze carrière
  maakJourney(sp, opties.vriend || {}); // je verhaal: jeugdvriend (met de naam en positie die je koos), opa en de hoofdstukken (journey.js)
  openHoofdstuk(0, 'selectie');
}
