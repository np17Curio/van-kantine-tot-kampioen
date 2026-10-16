import { S, club, gemCijfer, mod, ovr, salarisVoor, seizoenLabel, tmp, waarde } from '../../core/state.js';
import { geldTxt, pick, randInt, rnd, shuffle } from '../../core/utils.js';
import { AANV, AGENT, AMATEUR, CLUBS, DIVS, JEUGD, LEGENDE, MIN, NIVEAU, divClubs } from '../../data/gegevens.js';
import { thuisLand } from '../../data/landen.js';
import { eindRelatie } from '../gebeurtenissen.js';
import { KRANTEN } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { kinderen } from '../prive/gezin.js';
import { social } from '../prive/social.js';
import { startNieuwSeizoen } from '../seizoen/seizoen.js';
import { doorstroomEisen } from '../speler/doorstroom.js';
import { huurClubs, huurNodig, terugVanHuur } from '../speler/o23.js';
import { startStatus, statusNaam, statusNiveau, statusPunten } from '../speler/status.js';
import { buitenlandseBods, ck, clubInfo, isBuitenland, wisselLand } from './buitenland.js';
import { agentReset, doelBod, doelInfo, doelVan, infoVan, isDoel, isHier, sleutel } from './zaakwaarnemer.js';
import { fans, modFans, rivaal, zetFans } from '../wedstrijd/fans-pers.js';
import { bewaarVertrek } from '../wedstrijd/reunie.js';
import { nieuweWeek } from '../week.js';
import { clubTransfers, naMarkt } from './markt.js';
import { pers } from '../speler/persoonlijkheid.js';
import { rivaalVenster } from '../speler/rivaal.js';
import { wordClubloos } from '../speler/clubloos.js';

/* ===================== Transfers ===================== */
export function transferScore(){
  const sp = S.sp, gem = gemCijfer() ?? S.vorigGem;
  return ovr(sp) + (sp.rep - 30) * .08 + (gem - 6.5) * 3 + (sp.transferWens ? 2 : 0) + Math.min(1.5, Math.max(0, Math.log10(social().volgers + 1) - 4) * .75) - (sp.imago > 0 ? 5 : 0);
}
// Clubs die je willen hebben: één niveau hoger, of een sterkere club op je eigen niveau
export function kandidaatClubs(){
  const sp = S.sp, eigen = club(), score = transferScore();
  if (sp.clubWed < 10) return []; // eerst jezelf bewijzen bij je huidige club
  return CLUBS.map((c, i) => i).filter(i => {
    if (i === sp.club) return false;
    if (eigen.t === JEUGD && sp.leeftijd < 17) return false;
    const c = CLUBS[i];
    // Net goed genoeg voor een hoger niveau? Dan bieden vooral de kleinere clubs daar. Topclubs willen meer
    if (c.t < eigen.t) return c.t >= eigen.t - 1 && score >= MIN[c.t] && score >= c.s - 3;
    if (c.t === eigen.t) return c.s > eigen.s && score >= c.s + 1 && (c.t !== JEUGD || sp.leeftijd < 19);
    return false;
  });
}
// Wil deze club jou? Je moet goed genoeg zijn voor het niveau en voor de club zelf (een sterke club haalt geen veel zwakkere speler)
export function wilJou(i, marge = 5){
  const c = CLUBS[i], o = ovr(S.sp);
  return c.t >= 1 && c.t !== JEUGD && o >= MIN[c.t] - 4 && o >= c.s - marge;
}
// Hoeveel clubs zich melden als je een nieuwe club zoekt: minder als je slecht speelt of al wat ouder bent
function aantalBelangstellend(basis){
  const sp = S.sp, gem = gemCijfer() ?? S.vorigGem ?? 6.5;
  let n = basis;
  if (gem < 6 && rnd() < .6) n--;
  if (gem < 5.5 && rnd() < .5) n--;
  if (sp.leeftijd >= 33 && rnd() < .5) n--;
  if (sp.leeftijd >= 35) n--;
  return Math.max(0, n);
}
export function maakAanbiedingen(modus){
  const sp = S.sp, eigen = club(), o = ovr(sp), score = transferScore();
  const magJeugd = i => CLUBS[i].t !== JEUGD || sp.leeftijd < 19;
  const omhoog = kandidaatClubs();
  let ids = [];
  if (modus === 'normaal' || modus === 'vrij' || modus === 'jeugdKlaar'){
    const k = (rnd() < .6 ? 1 : 0) + (rnd() < .35 ? 1 : 0) + (sp.transferWens ? 1 : 0) + (eigen.t > 1 && score >= MIN[eigen.t - 1] + 4 ? 1 : 0);
    ids = shuffle(omhoog).slice(0, Math.min(3, k, omhoog.length));
    // Op de transferlijst: je club werkt mee, dus er melden zich altijd een paar clubs (ook van je eigen niveau of net lager)
    if (sp.transferlijst && ids.length < 2){
      const extra = CLUBS.map((c, i) => i).filter(i => i !== sp.club && !ids.includes(i) && CLUBS[i].t !== JEUGD && (CLUBS[i].t === eigen.t || CLUBS[i].t === eigen.t + 1 || (eigen.t === JEUGD && CLUBS[i].t === AMATEUR)) && wilJou(i, 6));
      ids = ids.concat(shuffle(extra).slice(0, 2 - ids.length));
    }
  }
  // Doorstromen naar het eerste elftal van je eigen club
  if (eigen.t === JEUGD){
    const ouder = eigen.ouder;
    const klaar = modus === 'jeugdKlaar' || doorstroomEisen(sp.leeftijd).every(x => x.ok);
    if (klaar && modus !== 'weg'){ ids = ids.filter(i => i !== ouder); ids.unshift(ouder); }
    if (modus === 'jeugdKlaar'){
      const extra = shuffle(divClubs(AMATEUR).filter(i => !ids.includes(i))).slice(0, randInt(1, 2));
      ids = ids.concat(extra);
    }
  }
  if (modus === 'weg' || modus === 'vrij' || modus === 'clubloos'){
    // Met een slechte naam (contract ontbonden) willen alleen clubs van een lager niveau je hebben (of, als je al amateur bent, andere amateurclubs)
    const slecht = sp.ontbonden || sp.imago > 0;
    if (slecht) ids = ids.filter(i => CLUBS[i].t > eigen.t);
    const past = i => { const t = CLUBS[i].t;
      if (slecht) return eigen.t === AMATEUR ? t === AMATEUR : t > eigen.t && t <= eigen.t + 2;
      return t > eigen.t || (t === eigen.t && (modus === 'clubloos' || CLUBS[i].s <= eigen.s)); };
    const omlaag = CLUBS.map((c, i) => i).filter(i => i !== sp.club && !ids.includes(i) && magJeugd(i) && past(i) && wilJou(i));
    const n = aantalBelangstellend(slecht ? randInt(1, 2) : modus === 'weg' ? randInt(2, 3) : randInt(1, 2));
    ids = ids.concat(shuffle(omlaag).slice(0, n));
    // Geen club die je wil? Dan zit je straks zonder club. Alleen een jeugdspeler vindt altijd een jeugdteam
    if (!ids.length && eigen.t === JEUGD){
      const zelfde = divClubs(eigen.t).filter(i => i !== sp.club && magJeugd(i));
      ids.push(pick(zelfde.length ? zelfde : divClubs(AMATEUR)));
    }
  }
  return ids.map(i => {
    const c = CLUBS[i];
    return {club:i, salaris:Math.round(salarisVoor(c.t, o, c.s) * (.9 + rnd() * .3) / 100) * 100,
      jaren: c.t >= AMATEUR ? 1 : sp.leeftijd >= 31 ? randInt(1, 2) : randInt(2, 4),
      ...(modus === 'clubloos' ? {salaris:Math.round(salarisVoor(c.t, o, c.s) * .8 / 100) * 100, jaren:1} : {}),
      som: (modus === 'normaal' && eigen.t < AMATEUR) ? waarde(sp) : 0,
      doorstroom: eigen.t === JEUGD && i === eigen.ouder};
  }).sort((a, b) => (b.doorstroom ? 1 : 0) - (a.doorstroom ? 1 : 0) || CLUBS[a.club].t - CLUBS[b.club].t || CLUBS[b.club].s - CLUBS[a.club].s);
}

// De droomclub van je zaakwaarnemer: alleen als die club je nu nog wil (na een slecht seizoen niet meer)
const wilJouDoel = dd => { const c = infoVan(dd); return ovr(S.sp) >= c.s - 8; };
export function openVenster(soort){
  const sp = S.sp;
  clubTransfers(soort); // de andere clubs (en die van jou) kopen en verkopen ook
  const rvTekst = rivaalVenster(soort);
  let terug = null;
  if (sp.huur){
    if (soort === 'winter'){
      S.venster = {soort, modus:'huur', intro:`Je bent verhuurd aan ${club().n} tot het einde van het seizoen. Daarna ga je terug naar ${CLUBS[sp.huur.ouder].n}.`, bods:[], verlenging:null, blijven:true, agentBod:null};
      S.fase = 'venster';
      return;
    }
    terug = terugVanHuur();
  }
  const jeugd = club().t === JEUGD;
  let modus = 'normaal', intro;
  if (sp.clubloos){
    modus = 'clubloos';
    intro = `Je zit al ${sp.clubloos.weken} ${sp.clubloos.weken === 1 ? 'week' : 'weken'} zonder club. ${soort === 'winter' ? 'De winterstop' : 'De zomer'} is je kans: je zaakwaarnemer belt iedereen.`;
  } else if (sp.ontbonden){
    modus = 'weg';
    intro = `Je contract bij ${club().n} is ontbonden. Je zaakwaarnemer heeft rondgebeld, maar door je slechte naam willen alleen een paar kleinere clubs je een kans geven.`;
  } else if (sp.bewijs && sp.bewijs.klaar === false && !sp.bewijs.weg){
    // De laatbloeier haalde zijn proeftijd niet: het proefcontract wordt niet omgezet, hij moet weg
    modus = 'weg'; sp.bewijs.weg = true;
    intro = `Je proeftijd bij ${club().n} zit erop, en de trainer is niet overtuigd: je proefcontract wordt niet omgezet. Je moet een nieuwe club zoeken.`;
  } else if (sp.vert < 15 && statusNiveau() < AANV){
    modus = 'weg';
    intro = jeugd ? `De jeugdtrainer zegt dat je niet meer bij ${club().n} past. Je moet een andere club zoeken.`
                  : `De trainer roept je bij zich: "Je past niet meer in mijn plannen." ${club().n} stuurt je weg. Je moet een nieuwe club zoeken.`;
  } else if (soort === 'zomer' && jeugd && sp.leeftijd >= 19){
    modus = 'jeugdKlaar';
    intro = 'Je bent te oud voor de jeugd. Tijd voor het echte werk bij de senioren!';
  } else if (soort === 'zomer' && sp.contract <= 0){
    if (sp.vert >= 40 || statusNiveau() >= 2){ modus = 'normaal'; intro = jeugd ? `Nog een jaar bij de ${club().n}? Of ga je verder?` : `Je contract loopt af. ${club().n} wil graag verlengen.`; }
    else { modus = 'vrij'; intro = `Je contract loopt af en ${club().n} verlengt niet. Je moet een nieuwe club vinden.`; }
  } else {
    intro = soort === 'winter' ? 'Winterstop! De transfermarkt is open.' : 'Zomer! De transfermarkt is open.';
  }
  if (sp.transferlijst && modus === 'normaal') intro += ' Je staat op de transferlijst: je club laat je gaan als je een club kiest.';
  let bods = maakAanbiedingen(modus), agentBod = null;
  // De droomclub van je zaakwaarnemer (een club in het buitenland komt in de zomer, met een overstap naar dat land)
  const ag = sp.agent, dd = doelBod();
  if (dd && ag.gehaald && !isHier(dd) && (!dd.land || soort === 'zomer') && wilJouDoel(dd)){
    const dc = infoVan(dd), key = sleutel(dd);
    bods = bods.filter(b => sleutel(doelVan(b.club, b.land)) !== key);
    bods.unshift({club:dd.club, ...(dd.land ? {land:dd.land} : {}), salaris:Math.round(salarisVoor(dc.t, ovr(sp), dc.s) * 1.05 / 100) * 100, jaren: dc.t >= AMATEUR ? 1 : sp.leeftijd >= 31 ? randInt(1, 2) : randInt(2, 4), som: club().t < AMATEUR && dc.t < AMATEUR ? waarde(sp) : 0, viaAgent:true});
    agentBod = key;
  }
  if (terug && terug.koop != null && !bods.some(b => b.club === terug.koop)){
    const hc = CLUBS[terug.koop];
    bods.unshift({club:terug.koop, salaris:Math.round(salarisVoor(hc.t, ovr(sp), hc.s) / 100) * 100, jaren:randInt(2, 3), som:waarde(sp), huurKoop:true});
  }
  let verlenging = null, blijven = false;
  if (modus === 'normaal'){
    if (soort === 'zomer' && sp.contract <= 0) verlenging = {club:sp.club, salaris:Math.round(salarisVoor(club().t, ovr(sp), club().s) * (statusNiveau() >= LEGENDE ? 1.2 : 1) / 100) * 100, jaren: club().t >= AMATEUR ? 1 : sp.leeftijd >= 31 ? 1 : randInt(2, 3), verlenging:true};
    else blijven = true;
  }
  if ((modus === 'weg' || modus === 'vrij' || modus === 'clubloos') && !bods.length) intro += modus === 'clubloos' ? ' Maar er is nog steeds geen club die je wil hebben. Blijf trainen en houd je fit.' : ' Je zaakwaarnemer belt rond, maar geen enkele club wil je hebben. Je zit zonder club.';
  else if (modus === 'clubloos') intro += ' Deze clubs willen je een kans geven:';
  if (bods.some(b => b.doorstroom)) intro += ` De trainer van het 1e elftal van ${CLUBS[club().ouder].n} heeft je zien spelen en wil je erbij hebben!`;
  else if (modus === 'normaal' && !bods.length && !huurNodig()) intro += jeugd && sp.leeftijd < 16 ? ' Je bent nog jong. Blijf je ontwikkelen in de jeugd.' : ' Er meldt zich geen enkele club. Gewoon doorwerken en laten zien wat je kan!';
  if (agentBod != null) intro += ` Je zaakwaarnemer heeft goed nieuws: ${doelInfo().n}${dd.land ? ` uit ${dd.land}` : ''} wil je hebben!`;
  const huurOpties = modus === 'normaal' && huurNodig() && !sp.transferlijst ? huurClubs() : null;
  if (huurOpties && huurOpties.length) intro = `${club().n} wil je verhuren, zodat je elders wedstrijden speelt en jezelf kunt bewijzen. ` + intro;
  if (terug) intro = terug.tekst + (terug.koop != null ? ` ${CLUBS[terug.koop].n} wil je definitief overnemen!` : '') + ' ' + intro;
  if (soort === 'zomer' && modus !== 'clubloos'){ const bl = buitenlandseBods(modus); if (bl.length){ bods = bods.concat(bl); const gs = bl.find(b => b.gescout); intro += `${gs ? ` ${clubInfo(gs).n} uit ${gs.land} heeft je het hele seizoen gevolgd en doet een bod!` : ''} Er is ook interesse uit het buitenland: ${[...new Set(bl.map(b => b.land))].join(' en ')}!`; } sp.scout = null; }
  if (rvTekst) intro += ' ' + rvTekst;
  S.venster = {soort, modus, intro, bods, verlenging, blijven, agentBod, huurOpties};
  sp.transferWens = false;
  S.fase = 'venster';
}

// Voert een clubwissel uit en geeft een tekst terug over wat er gebeurt
export function wissel(o, hoe){
  const sp = S.sp, oc = club(), oud = {n:oc.n, t:oc.t, s:oc.s}, oudStatus = sp.status, teksten = [], oudId = sp.club, oudLand = thuisLand(), landWissel = isBuitenland(o);
  const los = sp.clubloos, naarRivaal = !los && !landWissel && rivaal(oudId) === o.club && oud.t !== JEUGD, naarDoel = isDoel(o); // vóór de landwissel bepalen
  if (hoe === 'geforceerd') modFans(-20, oudId);
  if (!los) bewaarVertrek(oudId, hoe, naarRivaal); // zonder club: het vertrek is al bewaard toen je club je liet gaan
  sp.clubloos = null;
  if (naarRivaal){ zetFans(oudId, 5); if (sp.fans[ck(o.club)] === undefined) zetFans(o.club, 35); }
  if (landWissel) wisselLand(o.land);
  const nieuw = CLUBS[o.club], terugNaar = (sp.oudeClubs || {})[ck(o.club)];
  sp.transferlijst = false;
  sp.club = o.club; sp.vert = sp.imago > 0 ? 35 : 45; mod('moraal', 10); sp.clausule = null;
  if (sp.ontbonden){ sp.ontbonden = false; sp.naOntbinding = true; krantMelding(`Nieuwe kans voor ${sp.naam} bij ${nieuw.n}`, `Na de ontbinding bij ${oud.n} krijgt hij een tweede kans. "Hij weet dat dit zijn laatste kans is," zegt de trainer.`); }
  sp.salaris = o.salaris; sp.contract = o.jaren; sp.sindsTransfer = 0;
  S.car.clubs.push({club:o.club, van:S.jaar, land:thuisLand(), n:nieuw.n});
  if (landWissel){ S.car.hist.push(`${seizoenLabel()}: verhuisd van ${oudLand} naar ${o.land}`); teksten.push(`Je verhuist naar ${o.land}! Je speelt voortaan in de ${DIVS[nieuw.t]}.`);
    if (pers('heimwee')){ mod('moraal', -pers('heimwee')); teksten.push('Je mist je familie nu al. De eerste weken in een nieuw land zijn zwaar.'); }
    if (o.land === (S.startLand || 'Nederland')) krantMelding(`${sp.naam} keert terug naar ${o.land}`, `Na zijn avontuur in ${oudLand} speelt hij weer in eigen land, bij ${nieuw.n}.`, KRANTEN[0]);
    else krantMelding(`${sp.naam} kiest voor avontuur in ${o.land}`, `De speler van ${oud.n} tekent bij ${nieuw.n}. "Ik wil een nieuwe uitdaging," zegt hij.`, KRANTEN[0]);
    if (sp.agent && sp.agent.doel != null && !naarDoel) agentReset(`Je speelt nu in ${o.land}. Heb je hier een droomclub? Zeg het maar.`); }
  const prijs = o.som ? ` voor ${geldTxt(o.som)}` : '';
  if (los) S.car.hist.push(`${seizoenLabel()}: na ${los.weken} ${los.weken === 1 ? 'week' : 'weken'} zonder club tekent hij bij ${nieuw.n}`);
  else if (hoe === 'doorstroom') S.car.hist.push(`${seizoenLabel()}: doorgestroomd naar het 1e elftal van ${nieuw.n}`);
  else if (hoe === 'weg') S.car.hist.push(`${seizoenLabel()}: weggestuurd bij ${oud.n} → ${nieuw.n}`);
  else if (hoe === 'gekocht' || hoe === 'geforceerd') S.car.hist.push(`${seizoenLabel()}: gekocht door ${nieuw.n}${prijs} (van ${oud.n})`);
  else if (hoe === 'droom') S.car.hist.push(`${seizoenLabel()}: droomtransfer naar ${nieuw.n}${prijs}, geregeld door je zaakwaarnemer`);
  else S.car.hist.push(`${seizoenLabel()}: vertrek bij ${oud.n} → ${nieuw.n}${prijs}`);
  if (nieuw.t < oud.t) S.car.hist.push(`${seizoenLabel()}: stap omhoog naar ${NIVEAU[nieuw.t].toLowerCase()} (${DIVS[nieuw.t]})`);
  // Nieuwe status: eigen jeugd neemt een deel mee, anders hangt het af van hoe goed en bekend je bent
  sp.clubWed = 0; sp.clubSz = 0; sp.legendeHier = false;
  sp.status = hoe === 'doorstroom' ? Math.min(15, startStatus(o.club) + 5) : startStatus(o.club);
  sp.statusNiveau = statusNiveau();
  teksten.push(`Je bent nu speler van ${nieuw.n}.${o.som ? ` De transfersom is ${geldTxt(o.som)}.` : ''}`);
  if (sp.naOntbinding) sp.naOntbinding = false;
  else if (los) krantMelding(`${sp.naam} heeft weer een club`, `Na ${los.weken} ${los.weken === 1 ? 'week' : 'weken'} zonder club tekent hij bij ${nieuw.n} (${DIVS[nieuw.t]}). "Ik heb elke dag alleen getraind. Nu wil ik laten zien dat ik er nog ben."`, KRANTEN[Math.min(nieuw.t, 4)]);
  else transferNieuws(hoe, oud, nieuw, o);
  if (terugNaar){ const f = fans(o.club);
    if (f >= 55){ teksten.push(`Je keert terug bij ${nieuw.n}! De fans zijn dolblij.`); krantMelding(`De verloren zoon keert terug: ${sp.naam} weer bij ${nieuw.n}`, `De supporters hangen al een spandoek op: "Welkom thuis!"`); }
    else { teksten.push(`Je keert terug bij ${nieuw.n}. Niet iedereen is daar blij mee.`); krantMelding(`Omstreden terugkeer van ${sp.naam} bij ${nieuw.n}`, `Een deel van de supporters is zijn vertrek nog niet vergeten.`); } }
  if (naarRivaal){ teksten.push(`Je stapt over naar de aartsrivaal! De fans van ${oud.n} verbranden je shirt. Bij ${nieuw.n} moeten ze je ook nog leren vertrouwen.`); krantMelding(`Verrader! ${sp.naam} kiest voor aartsrivaal ${nieuw.n}`, `Bij ${oud.n} zijn ze woedend. Supporters hingen een spandoek op: "Nooit meer welkom".`); }
  if (sp.statusNiveau >= 3) teksten.push('De fans kennen je al: je bent meteen een fanfavoriet!');
  else if (sp.statusNiveau === 2) teksten.push('De trainer ziet je meteen als vaste waarde.');
  else teksten.push(`Je begint als ${statusNaam(sp.statusNiveau).toLowerCase()}: je moet je basisplaats nog verdienen.`);
  if (sp.relatie && ((nieuw.t === 1 && nieuw.s >= 80 && !(oud.t === 1 && oud.s >= 80)) || landWissel)){
    const naam = sp.relatie.naam;
    if (sp.relatie.getrouwd || sp.relatie.samen || rnd() < .3 + sp.relatie.band / 200) teksten.push(`${naam} verhuist mee naar het buitenland!${kinderen().length ? ' De kinderen gaan er naar een internationale school.' : ''}`);
    else teksten.push(eindRelatie(`${naam} wil niet mee naar het buitenland. Jullie gaan uit elkaar.`));
  }
  if (sp.agent && naarDoel) agentReset(`Gelukt! Je speelt nu bij ${nieuw.n}${landWissel ? ` in ${o.land}` : ''}. Heb je een nieuw doel? Zeg het maar.`);
  return teksten.join(' ');
}
export function transferNieuws(hoe, oud, nieuw, o){
  const sp = S.sp, naam = sp.naam, som = o.som ? geldTxt(o.som) : null, jaren = o.jaren ? `${o.jaren} jaar` : 'onbepaalde tijd';
  const prof = nieuw.t <= 2 && oud.t > 2 ? ` Het is zijn eerste profcontract.` : '';
  let kop, tekst;
  if (hoe === 'doorstroom'){ kop = `${naam} (${sp.leeftijd}) naar het eerste van ${nieuw.n}`; tekst = `Het talent uit de eigen jeugd maakt de stap naar de senioren.`; }
  else if (hoe === 'geforceerd'){ kop = `${naam} forceert transfer naar ${nieuw.n}`; tekst = `${oud.n} gaf uiteindelijk toe${som ? ` voor ${som}` : ''}. De supporters van ${oud.n} zijn woedend.`; }
  else if (hoe === 'gekocht'){ kop = som ? `${nieuw.n} betaalt ${som} voor ${naam}` : `${nieuw.n} haalt ${naam} bij ${oud.n}`; tekst = `${naam} komt over van ${oud.n}${o.jaren ? ` en tekent voor ${jaren}` : ''}.${prof}`; }
  else if (hoe === 'droom'){ kop = `Droomtransfer: ${naam} tekent bij ${nieuw.n}`; tekst = `Zijn zaakwaarnemer ${AGENT} regelde de overstap van ${oud.n}${som ? ` voor ${som}` : ''}.${prof}`; }
  else if (hoe === 'weg'){ kop = `${oud.n} zet ${naam} op straat`; tekst = `Hij vindt een nieuwe club: ${nieuw.n} (${DIVS[nieuw.t]}).`; }
  else { kop = `${naam} verruilt ${oud.n} voor ${nieuw.n}`; tekst = `${o.jaren ? `Hij tekent voor ${jaren}` : 'Hij tekent een contract'}${som ? `, de transfersom is ${som}` : ''}.${prof}`; }
  krantMelding(kop, tekst, KRANTEN[Math.min(nieuw.t, oud.t)]);
}
export function teken(o){
  const sp = S.sp, V = S.venster;
  if (V.agentBod != null && !isDoel(o) && doelInfo()) agentReset(`Je koos niet voor ${doelInfo().n}. Zeg het maar als je een nieuw doel hebt.`);
  if (o.club !== sp.club || isBuitenland(o) || sp.clubloos) S.verhuisTekst = wissel(o, o.viaAgent ? 'droom' : o.doorstroom ? 'doorstroom' : V.modus === 'weg' ? 'weg' : 'vertrek');
  else {
    mod('vert', 5); sp.transferlijst = false; sp.transferWens = false;
    sp.salaris = o.salaris; sp.contract = o.jaren;
    S.car.hist.push(`${seizoenLabel()}: ${club().t === JEUGD ? 'nog een jaar in de' : 'contract verlengd bij'} ${club().n}`);
    S.verhuisTekst = `Je contract bij ${club().n} loopt nu nog ${o.jaren} jaar (tot ${S.jaar + 1 + o.jaren}).`;
  }
  sp.clausule = o.clausule ? {bedrag:o.clausule, club:o.club} : null;
  if (o.tekengeld){ sp.geld += o.tekengeld; S.verhuisTekst = (S.verhuisTekst ? S.verhuisTekst + ' ' : '') + `Je krijgt ${geldTxt(o.tekengeld)} tekengeld op je rekening.`; }
  sluitVenster();
}
// In de transferperiode: meer salaris vragen bij een aanbod
export function vraagMeer(o){
  const V = S.venster, c = clubInfo(o);
  o.gevraagd = true;
  if (rnd() < (o.verlenging ? .45 + statusNiveau() * .08 : .55)){ o.salaris = Math.round(o.salaris * 1.2 / 100) * 100; V.melding = `${c.n} gaat akkoord: ${geldTxt(o.salaris)} per jaar.`; }
  else if (o.verlenging) V.melding = `${c.n} blijft bij het eerste voorstel.`;
  else { V.bods = V.bods.filter(b => b !== o); V.melding = `${c.n} vindt je te duur en trekt het bod in.`; }
}
// Blijven terwijl er clubs aan je trokken: de fans waarderen dat
export function blijf(){
  const V = S.venster;
  if (S.sp.transferlijst){ S.sp.transferlijst = false; S.sp.transferWens = false; S.verhuisTekst = `Je blijft toch bij ${club().n}. De club haalt je van de transferlijst.`; mod('vert', 2); sluitVenster(); return; }
  if (V.huurOpties && V.huurOpties.length){ mod('vert', -8); statusPunten(-3); S.verhuisTekst = `Je weigert de verhuur. De trainer is er niet blij mee: je moet knokken voor je plek bij ${club().n}.`; sluitVenster(); return; }
  if (V.agentBod != null && doelInfo()) agentReset(`Je zei nee tegen ${doelInfo().n}. Zeg het maar als je een nieuw doel hebt.`);
  if (V.bods.length){ statusPunten(3); S.verhuisTekst = `Je blijft bij ${club().n}. De fans waarderen je trouw.`; }
  sluitVenster();
}
// Geen club (of geen van de clubs die je willen): verder zonder club
export function zonderClub(){ const V = S.venster; wordClubloos(V.modus === 'weg' ? 'weg' : 'vrij'); sluitVenster(); }
// Al zonder club en (nog) niet tekenen
export function blijfWachten(){ S.verhuisTekst = S.venster.bods.length ? 'Je zegt nee tegen de clubs die zich meldden. Je wacht op iets beters.' : 'Er is nog steeds geen club. Je blijft alleen trainen.'; sluitVenster(); }
export function sluitVenster(){
  const soort = S.venster.soort; S.venster = null; tmp.oh = null;
  if (soort === 'winter') nieuweWeek();
  else startNieuwSeizoen();
  if (!S.sp.clubloos) naMarkt(); // nieuwe en vertrokken teamgenoten, en als aanvoerder de verwelkoming
  if (S.verhuisTekst){ S.week.tekst.unshift(S.verhuisTekst); S.verhuisTekst = null; }
}
