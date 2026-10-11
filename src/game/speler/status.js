import { S, VERSIE, club, ovr, salarisVoor, seizoenLabel, setS } from '../../core/state.js';
import { clamp, randInt } from '../../core/utils.js';
import { AANV, BASE, CLUBS, JEUGD, LEGENDE, OPST_BASIS, POS, STATUS, zetClubs } from '../../data/gegevens.js';
import { SPEEL_LANDEN, zetLand } from '../../data/landen.js';
import { nieuweBekers } from '../competitie/beker.js';
import { opstMax } from '../team/opstelling.js';
import { norm } from '../transfers/zaakwaarnemer.js';
import { nieuweWeek } from '../week.js';
import { LEEFTIJDEN, startClub, startIntro, startVoor } from './startverhaal.js';

/* ===================== Status bij de club ===================== */
// Startstatus bij een nieuwe club: hoe beter je bent dan de club en hoe bekender je bent, hoe hoger
export function startStatus(id, cObj){
  const sp = S.sp, c = cObj || CLUBS[id];
  const st = clamp((ovr(sp) - c.s) * 3 + sp.rep * .45, 0, 62);
  // Een tiener bij de senioren is altijd eerst een jonkie, hoe goed hij ook is
  return c.t !== JEUGD && sp.leeftijd < 20 ? Math.min(st, 8) : st;
}
// Niveau uit punten, met voorwaarden voor aanvoerder (1 seizoen, leeftijd) en clublegende (4 seizoenen)
export function niveauVoor(pt, sz, wed, legende, t, leeftijd){
  if (legende) return LEGENDE;
  let n = 0;
  STATUS.forEach((s, i) => { if (pt >= s.min) n = i; });
  if (n === 0 && wed >= 10) n = 1; // na 10 wedstrijden ben je geen nieuwkomer meer
  if (n >= LEGENDE && sz < 4) n = AANV;
  if (n >= AANV && (sz < 1 || leeftijd < (t === JEUGD ? 16 : 21))) n = AANV - 1;
  return n;
}
export const aanvLeeftijd = () => club().t === JEUGD ? 16 : 21;
export function statusNiveau(){ const sp = S.sp; return niveauVoor(sp.status, sp.clubSz, sp.clubWed, sp.legendeHier, club().t, sp.leeftijd); }
export function statusNaam(n){ return n === 0 && S.sp.leeftijd < 21 ? 'Jonkie' : STATUS[n].n; }
export function statusPunten(d){ S.sp.status = clamp(S.sp.status + d, 0, 100); }
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
  if (sp.status < STATUS[doel].min) nodig.push(`${Math.ceil(STATUS[doel].min - sp.status)} punten`);
  if (doel === 1 && sp.clubWed < 10) nodig[0] = `${nodig[0] || '0 punten'} (of ${10 - sp.clubWed} wedstrijden spelen)`;
  if (doel === AANV){ if (sp.clubSz < 1) nodig.push('1 heel seizoen bij de club'); if (sp.leeftijd < aanvLeeftijd()) nodig.push(`minimaal ${aanvLeeftijd()} jaar`); }
  if (doel === LEGENDE && sp.clubSz < 4) nodig.push(`${4 - sp.clubSz} ${4 - sp.clubSz === 1 ? 'seizoen' : 'seizoenen'} meer bij de club`);
  return {naam:STATUS[doel].n, nodig};
}
// Controleert of je status veranderd is en geeft een bericht terug
export function checkStatus(){
  const sp = S.sp, oud = sp.statusNiveau, n = statusNiveau(), c = club().n;
  sp.statusNiveau = n;
  if (n === oud) return null;
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
  zetClubs(null);
  land = SPEEL_LANDEN.includes(land) ? land : 'Nederland';
  zetLand(land);
  const lft = LEEFTIJDEN.includes(opties.leeftijd) ? opties.leeftijd : 15, V = startVoor(lft);
  const st = POS[pos].start, a = {};
  for (const k in st) a[k] = st[k] + V.extra + randInt(-3, 3);
  const id = startClub(V), jeugd = V.t === JEUGD, klasse = ovr({pos, a});
  // In de jeugd een bankspeler; bij de senioren eerst een jonkie of nieuwkomer
  const status = jeugd ? 28 : V.id === 'bewijs' ? 10 : 8, niveau = jeugd ? 1 : 0;
  const sp = {naam, pos, leeftijd:lft, a, pot:Math.max(randInt(...V.pot), klasse + 6), fit:90, vorm:0, moraal:60, rep:V.rep, vert:V.vert,
    salaris:jeugd ? BASE[JEUGD] : Math.round(salarisVoor(V.t, klasse) * (V.id === 'bewijs' ? .7 : 1)), contract:1, club:id, geld:V.geld, blessure:0, items:{}, transferWens:false,
    relatie:null, rijbewijs:V.rijbewijs, rij:{lessen:V.rijbewijs ? 5 : 0, theorie:V.rijbewijs}, woning:V.woning, auto:V.auto, hond:false, status, clubWed:0, clubSz:0, statusNiveau:niveau, sindsTransfer:10, legendeHier:false,
    focus:65, school:{cijfers:[], gehad:[]}, ouders:{boos:false, trots:false},
    herkomst: herkomst || {geboren:'Nederland', vader:'Nederland', moeder:'Nederland'}, land:null, bonds:{}, agent:{doel:null, antwoord:null, gehaald:false, sugg:null},
    startVerhaal:V.id, ...(opties.uiterlijk ? {uiterlijk:{...opties.uiterlijk}} : {}), ...(opties.sleutel ? {uitSleutel:opties.sleutel} : {}), ...(V.id === 'bewijs' ? {bewijs:{klaar:null}} : {})};
  setS({v:VERSIE, mig4:true, mig5:true, land, startLand:land, sp, jaar:2026, ronde:0, tab:nieuweTabellen(), ss:{wed:0,g:0,a:0,c:[],bods:0}, vorigGem:6.5,
    car:{wed:0,g:0,a:0,clubs:[{club:sp.club, van:2026, land}], prijzen:[], hist:[], maxOvr:ovr(sp), maxWaarde:0, int:{}},
    fase:'week', week:null, ev:null, M:null, venster:null, eind:null});
  const wie = V.id === 'wonder' ? 'als wonderkind van 15' : V.id === 'normaal' ? 'als 18-jarige' : 'als 23-jarige laatbloeier, met een proefcontract,';
  S.car.hist.push(`${seizoenLabel()}: begonnen ${wie} bij ${CLUBS[sp.club].n}${land !== 'Nederland' ? ` (${land})` : ''}`);
  S.ss.bekers = nieuweBekers();
  nieuweWeek(true);
  if (opties.leeftijd) startIntro();
}
