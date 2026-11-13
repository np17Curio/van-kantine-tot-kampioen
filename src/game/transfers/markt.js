import { S, club, mod, ovr } from '../../core/state.js';
import { clamp, esc, geldTxt, pick, randInt, rnd } from '../../core/utils.js';
import { BASE, CLUBS, DIVS, LAAGSTE, NL_CLUBS, divClubs, ligaVan } from '../../data/gegevens.js';
import { LAND_DATA, SPEEL_LANDEN, thuisLand } from '../../data/landen.js';
import { ACHTERNAMEN, OPBOUW, POS_NAAM, VOORL, selectie } from '../competitie/spelers.js';
import { kortClub, metVoorletter } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { onrust } from '../speler/kalmte.js';
import { statusPunten } from '../speler/status.js';
import { isAanvoerder, teamUitjePrijs } from '../team/aanvoerder.js';
import { band, kleedkamer, zetBand } from '../team/kleedkamer.js';
import { geldF } from '../../data/gegevens.js';
import { clubNaam } from '../../data/gegevens.js';
import { team } from '../../core/geslacht.js';

/* ===================== De transfermarkt van de andere clubs ===================== */
// In elke transferperiode kopen en verkopen de clubs uit jouw competitie spelers. Een koper wordt sterker, een verkoper
// zwakker. Jouw eigen club doet meestal ook mee: nieuwe teamgenoten komen binnen, of een maat vertrekt. Alles komt in de krant.
const MAX_DELTA = 2; // per club per periode hooguit ±2 sterkte
// Over welke competitie gaat het: jouw niveau
const isRivaal = x => !!(S.sp && [S.sp.rivaal, ...(S.sp.rivalen || [])].some(R => R && x.n === R.n && x.v === R.v)); // (al je rivalen)
export function marktComp(){
  return {t:club().t, mijn:S.sp.club, jeugd:false};
}
const naamVrij = (lijst, n) => !lijst.some(x => x.n === n);
// Eén speler van club `van` naar club `naar`
function doeDeal(van, naar, speler, hoger, delta, soort){
  const selV = selectie(van), selN = selectie(naar);
  // verkoper: de speler gaat weg, de beste bankspeler op die plek neemt zijn rol over, de jeugd vult aan
  const i = selV.indexOf(speler); if (i < 0) return null;
  selV.splice(i, 1);
  const opvolger = selV.filter(x => x.pos === speler.pos && !x.basis).sort((a, b) => b.g + b.a - a.g - a.a)[0];
  if (opvolger && speler.basis){ opvolger.basis = true; [opvolger.g, opvolger.a] = [Math.max(opvolger.g, speler.g * .8), Math.max(opvolger.a, speler.a * .8)]; }
  selectie(van); // aanvullen tot 21
  neemOp(naar, speler);
  if (selN[0] && selN[0].k !== undefined) herschik(selectie(van));
  // sterkte
  const plus = hoger ? 2 : 1, kan = (id, d) => Math.abs((delta[id] || 0) + d) <= MAX_DELTA;
  if (kan(naar, plus)){ CLUBS[naar].s = clamp(CLUBS[naar].s + plus, 30, 95); delta[naar] = (delta[naar] || 0) + plus; }
  if (kan(van, -1)){ CLUBS[van].s = clamp(CLUBS[van].s - 1, 30, 95); delta[van] = (delta[van] || 0) - 1; }
  return noteerDeal(van, naar, speler, soort);
}
// De koper: de nieuweling in de basis, de zwakste basisspeler naar de bank, de zwakste bankspeler vertrekt
function neemOp(naar, speler){
  const selN = selectie(naar);
  const zelfde = selN.filter(x => x.pos === speler.pos);
  const zwakBasis = zelfde.filter(x => x.basis).sort((a, b) => a.g + a.a - b.g - b.a)[0];
  const zwakBank = zelfde.filter(x => !x.basis && !x.vriend && !isRivaal(x)).sort((a, b) => a.g + a.a - b.g - b.a)[0];
  if (zwakBank) selN.splice(selN.indexOf(zwakBank), 1);
  if (zwakBasis){ zwakBasis.basis = false; [zwakBasis.g, zwakBasis.a] = [zwakBasis.g * .5, zwakBasis.a * .5]; }
  selN.push({v:speler.v, n:speler.n, pos:speler.pos, basis:true, nieuwWeek:S.weekNr || 0, k:speler.k, lft:speler.lft, kVorig:speler.kVorig, jeugd:speler.jeugd, sindsWeek:speler.sindsWeek, g:Math.max(speler.g, zwakBasis ? zwakBasis.g * 2 : 0), a:Math.max(speler.a, zwakBasis ? zwakBasis.a * 2 : 0)});
  if (selN[0] && selN[0].k !== undefined) herschik(selN);
}
// van = null: een transfervrije speler uit het buitenland
export function noteerDeal(van, naar, speler, soort, extra = {}){
  const tv = van == null ? null : CLUBS[van].t, som = tv != null && tv <= 3 ? Math.round(BASE[tv] * (.12 + rnd() * .35) / 1000) * 1000 : 0;
  const d = {jaar:S.jaar, soort, van, naar, v:speler.v, n:speler.n, pos:speler.pos, som, ...extra};
  (S.transfers = S.transfers || []).push(d);
  if (S.transfers.length > 120) S.transfers = S.transfers.slice(-120);
  return d;
}
// Kies een speler van de verkoper die de koper nog niet heeft (meestal een veldspeler uit de basis)
function kiesSpeler(van, naar){
  const selN = selectie(naar), kand = selectie(van).filter(x => x.basis && !x.vriend && !isRivaal(x) && naamVrij(selN, x.n) && (x.pos !== 'K' || rnd() < .15));
  // liefst iemand die de basis van de koper echt versterkt (beter dan zijn zwakste basisspeler op die plek)
  const zwakste = pos => Math.min(...selN.filter(x => x.pos === pos && x.basis).map(x => x.k ?? 0));
  const goed = kand.filter(x => (x.k ?? 0) >= zwakste(x.pos) - 2);
  return goed.length ? pick(goed) : kand.length && rnd() < .3 ? pick(kand) : null;
}
const gewogenClub = (lijst, w) => { let tot = 0; const g = lijst.map(i => (tot += w(i), tot)); const r = rnd() * tot; return lijst[g.findIndex(x => x >= r)]; };
// zonderMijn: in de trainersmodus doet jouw club niet automatisch mee (jij koopt en verkoopt zelf)
export function clubTransfers(soort, {zonderMijn = false} = {}){
  const sleutel = `${S.jaar}-${soort}`; if (S.marktKlaar === sleutel) return [];
  S.marktKlaar = sleutel;
  const {t, mijn, jeugd} = marktComp(), comp = divClubs(t), sMax = Math.max(...comp.map(i => CLUBS[i].s));
  const onder = t < LAAGSTE ? divClubs(t + 1).sort((a, b) => CLUBS[b].s - CLUBS[a].s).slice(0, 3) : [];
  const boven = t > 1 ? divClubs(t - 1).sort((a, b) => CLUBS[a].s - CLUBS[b].s).slice(0, 4) : [];
  const jeugdStart = (S.jeugdIn || []).length;
  const gestopt = soort === 'zomer' ? ontwikkelSpelers(divClubs(t).includes(mijn) ? divClubs(t) : divClubs(t).concat(mijn), mijn) : [];
  const delta = {}, deals = [], n = soort === 'zomer' ? randInt(5, 8) : randInt(3, 5);
  const koperOk = i => CLUBS[i].s <= sMax + 2 && !(zonderMijn && i === mijn);
  let mijnMee = !zonderMijn && rnd() < .7;
  for (let poging = 0; poging < n * 4 && deals.length < n; poging++){
    let koper, verkoper, hoger = false;
    if (mijnMee){
      mijnMee = false;
      if (rnd() < .55){ koper = mijn; const k = comp.filter(i => i !== mijn && CLUBS[i].s < CLUBS[mijn].s).concat(onder); verkoper = k.length ? pick(k) : null; }
      else { verkoper = mijn; const k = comp.filter(i => i !== mijn && CLUBS[i].s > CLUBS[mijn].s).concat(boven); koper = k.length ? pick(k) : null; hoger = boven.includes(koper); }
    } else if (boven.length && rnd() < .2){ verkoper = pick(comp); koper = pick(boven); hoger = false; }
    else {
      const kopers = comp.filter(koperOk); if (!kopers.length) break;
      koper = gewogenClub(kopers, i => Math.pow(Math.max(1, CLUBS[i].s - 25), 2));
      const k = comp.filter(i => i !== koper && CLUBS[i].s < CLUBS[koper].s).concat(onder.filter(() => rnd() < .5));
      verkoper = k.length ? pick(k) : null; hoger = false;
    }
    if (koper == null || verkoper == null || koper === verkoper) continue;
    if (zonderMijn && (koper === mijn || verkoper === mijn)) continue;
    if (deals.some(d => d.van === verkoper && d.naar === koper)) continue;
    const speler = kiesSpeler(verkoper, koper); if (!speler) continue;
    const d = doeDeal(verkoper, koper, speler, hoger, delta, soort); if (d) deals.push(d);
  }
  deals.push(...buitenlandAankopen(comp, soort, mijn, zonderMijn, delta));
  const succes = soort === 'zomer' && t <= 2 ? succesAankopen(comp, mijn, zonderMijn) : {deals:[], clubs:[]};
  deals.push(...succes.deals);
  const inhaal = inhaalAankopen(zonderMijn ? comp.filter(i => i !== mijn) : comp, onder, soort);
  deals.push(...inhaal.deals);
  if (soort === 'zomer') jeugdDoorstroom(comp.includes(mijn) ? comp : comp.concat(mijn));
  S.clubs = CLUBS.map(c => [c.t, c.s]);
  const opgekomen = (S.jeugdIn || []).slice(jeugdStart).filter(x => x.club === mijn);
  markNieuws(deals, t, mijn, jeugd, opgekomen, gestopt, inhaal.clubs, succes.clubs);
  return deals;
}
// ---------- Aankopen in het buitenland ----------
// Clubs halen ook spelers bij clubs uit andere landen. In de hoogste league kan dat een echte versterking zijn,
// en een topclub haalt soms een ster. De speler komt in de basis (neemOp) en de club wordt iets sterker (binnen MAX_DELTA).
const VER_LANDEN = ['Brazilië', 'Argentinië', 'Kroatië', 'Servië', 'Nigeria', 'Marokko', 'Japan', 'Mexico'];
const LAND_NAMEN = {
  Nederland:['De Jong', 'Van den Berg', 'Bakker', 'Visser', 'Smit', 'Meijer', 'De Boer', 'Mulder'],
  'België':['Peeters', 'Janssens', 'Maes', 'Claes', 'Goossens', 'Wouters', 'De Smet', 'Lambert'],
  Engeland:['Smith', 'Walker', 'Taylor', 'Wright', 'Hughes', 'Clarke', 'Bennett', 'Hall'],
  Duitsland:['Müller', 'Schmidt', 'Wagner', 'Becker', 'Hoffmann', 'Krüger', 'Neumann', 'Werner'],
  Frankrijk:['Martin', 'Bernard', 'Dubois', 'Laurent', 'Moreau', 'Girard', 'Fontaine', 'Mbemba'],
  Spanje:['García', 'Fernández', 'López', 'Martínez', 'Navarro', 'Ruiz', 'Morales', 'Ortega'],
  'Italië':['Rossi', 'Bianchi', 'Romano', 'Ferrari', 'Esposito', 'Colombo', 'Ricci', 'Greco'],
  Portugal:['Silva', 'Santos', 'Ferreira', 'Pereira', 'Costa', 'Oliveira', 'Rodrigues', 'Almeida'],
  Turkije:['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Aydın', 'Öztürk', 'Arslan'], 'Tsjechië':['Novák', 'Svoboda', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák'],
  Griekenland:['Papadopoulos', 'Georgiou', 'Nikolaidis', 'Vlachos', 'Dimitriou', 'Andreou', 'Christodoulou', 'Samaras'], Polen:['Nowak', 'Kowalski', 'Wiśniewski', 'Zieliński', 'Kamiński', 'Szymański', 'Wójcik', 'Lewandowski'],
  Denemarken:['Jensen', 'Nielsen', 'Hansen', 'Pedersen', 'Andersen', 'Christensen', 'Larsen', 'Sørensen'], Noorwegen:['Johansen', 'Olsen', 'Berg', 'Haugen', 'Solberg', 'Strand', 'Lie', 'Bakke'],
  Zwitserland:['Meier', 'Schmid', 'Keller', 'Weber', 'Huber', 'Favre', 'Bernasconi', 'Brunner'],
  'Brazilië':['Souza', 'Lima', 'Carvalho', 'Ribeiro', 'Alves', 'Barbosa', 'Gomes', 'Nascimento'],
  'Argentinië':['González', 'Romero', 'Acosta', 'Benítez', 'Sosa', 'Medina', 'Herrera', 'Paredes'],
  'Kroatië':['Kovačić', 'Horvat', 'Babić', 'Marić', 'Jurić', 'Perić'], 'Servië':['Jovanović', 'Petrović', 'Nikolić', 'Marković', 'Đorđević'],
  Nigeria:['Okafor', 'Adeyemi', 'Okonkwo', 'Eze', 'Balogun', 'Nwosu'], Marokko:['El Idrissi', 'Benali', 'Ziyech', 'Amrabat', 'Haddadi', 'Tahiri'],
  Japan:['Tanaka', 'Suzuki', 'Kamada', 'Ito', 'Nakamura', 'Yamada'], Mexico:['Hernández', 'Ramírez', 'Guzmán', 'Lozano', 'Corona', 'Vega'],
};
// Een club uit dat land (de speelbare landen hebben echte clubnamen; een ster komt van een van de grotere clubs)
function vanClub(land, ster){
  if (VER_LANDEN.includes(land)) return null;
  const lijst = land === 'Nederland' ? NL_CLUBS : (LAND_DATA[land] || {}).clubs || [], n1 = ligaVan(land).n[0];
  const l = lijst.slice(0, ster ? Math.min(6, n1) : n1); return l.length ? clubNaam(pick(l)) : null;
}
function transferSom(k, ster){
  const [lo, hi] = ster ? [1e7, 3e7] : k >= 85 ? [5e6, 15e6] : k >= 75 ? [2e6, 6e6] : k >= 65 ? [6e5, 2e6] : [1e5, 6e5];
  return Math.round((lo + rnd() * (hi - lo)) * geldF() / 1e4) * 1e4;
}
export function buitenlandAankopen(comp, soort, mijn, zonderMijn, delta = {}){
  const deals = [], hier = thuisLand(), landen = SPEEL_LANDEN.filter(l => l !== hier).concat(VER_LANDEN);
  for (const id of comp){
    if (zonderMijn && id === mijn) continue;
    const c = CLUBS[id], top = c.t === 1, kans = top ? clamp(.18 + (c.s - 65) * .012, .1, .4) : .08;
    const n = (rnd() < (soort === 'zomer' ? kans : kans / 3) ? 1 : 0) + (soort === 'zomer' && top && c.s >= 78 && rnd() < .2 ? 1 : 0);
    for (let i = 0; i < n; i++){
      const sel = selectie(id), zwak = sel.filter(x => x.basis && x.k !== undefined && (x.pos !== 'K' || rnd() < .15)).sort((a, b) => a.k - b.k)[0]; if (!zwak) break;
      const ster = top && c.s >= 76 && rnd() < .15;
      const k = clamp(ster ? c.s + randInt(3, 6) : top ? c.s + randInt(-1, 3) : c.s + randInt(-2, 1), 30, 92);
      if (k < zwak.k + 2) continue; // alleen kopen als hij echt beter is dan wie er nu staat
      const land = pick(landen), namen = (LAND_NAMEN[land] || ACHTERNAMEN).filter(a => naamVrij(sel, a)), nm = namen.length ? pick(namen) : pick(ACHTERNAMEN.filter(a => naamVrij(sel, a))) || 'Novak';
      const nieuw = {v:pick(VOORL), n:nm, pos:zwak.pos, basis:true, k, lft:ster ? randInt(23, 28) : randInt(21, 29), g:zwak.g, a:zwak.a};
      neemOp(id, nieuw);
      const plus = ster ? 1 : 0, kan = Math.max(0, MAX_DELTA - (delta[id] || 0)), d0 = Math.min(plus, kan);
      if (d0 > 0){ c.s = clamp(c.s + d0, 30, 95); delta[id] = (delta[id] || 0) + d0; }
      deals.push(noteerDeal(null, id, nieuw, soort, {buitenland:true, land, vanNaam:vanClub(land, ster), som:transferSom(k, ster), ster, k}));
    }
  }
  return deals;
}
// ---------- Versterking door succes ----------
// Een club die vorig seizoen kampioen werd of in de top 3 eindigde (of een Europese beker won) heeft geld en aantrekkingskracht:
// in de zomer haalt hij spelers die écht beter zijn dan zijn zwakste basisspelers. Ben jij een topspeler bij je club, dan willen
// spelers naast jou spelen. Grenzen: hooguit +2 per zomer, niet meer dan 3 boven de op één na sterkste club, nooit boven 93.
export const SUCCES = {kampioen:2, top3:1, europa:1, ster:1, maxPlus:2, voorsprong:3, plafond:93};
export function succesRedenen(id, mijn){
  const v = (S.vorig || {})[id], B = (S.ss && S.ss.bekers) || {}, r = [];
  if (v && v.plek === 1) r.push({n:SUCCES.kampioen, t:'het kampioenschap'});
  else if (v && v.plek <= 3) r.push({n:SUCCES.top3, t:`de ${v.plek}e plaats`});
  if (['cl', 'eur'].some(k => B[k] && B[k].winnaar === id)) r.push({n:SUCCES.europa, t:'de Europese beker'});
  if (id === mijn && S.sp && !S.sp.clubloos && !S.sp.o23 && ovr(S.sp) >= CLUBS[id].s + 6) r.push({n:SUCCES.ster, t:'jouw naam (spelers willen naast jou spelen)'});
  return r;
}
export function succesAankopen(comp, mijn, zonderMijn){
  const deals = [], clubs = [], landen = SPEEL_LANDEN.filter(l => l !== thuisLand()).concat(VER_LANDEN);
  for (const id of comp){
    if (zonderMijn && id === mijn) continue;
    const redenen = succesRedenen(id, mijn), n = redenen.reduce((a, r) => a + r.n, 0); if (!n) continue;
    const c = CLUBS[id], tweede = Math.max(30, ...comp.filter(i => i !== id).map(i => CLUBS[i].s)), plafond = Math.min(SUCCES.plafond, tweede + SUCCES.voorsprong);
    let erbij = 0; const l = [];
    for (let i = 0; i < n + 2 && l.length < n && erbij < SUCCES.maxPlus && c.s < plafond; i++){
      const sel = selectie(id), zwak = sel.filter(x => x.basis && x.k !== undefined && !x.vriend && !isRivaal(x) && (x.pos !== 'K' || rnd() < .15)).sort((a, b) => a.k - b.k)[0]; if (!zwak) break;
      const k = clamp(c.s + randInt(1, 4), 30, 94); if (k < zwak.k + 2) continue; // alleen iemand die echt beter is
      const land = pick(landen), namen = (LAND_NAMEN[land] || ACHTERNAMEN).filter(a => naamVrij(sel, a)), nm = namen.length ? pick(namen) : pick(ACHTERNAMEN.filter(a => naamVrij(sel, a))) || 'Novak';
      const nieuw = {v:pick(VOORL), n:nm, pos:zwak.pos, basis:true, k, lft:randInt(23, 28), g:zwak.g, a:zwak.a};
      neemOp(id, nieuw);
      const plus = Math.min(k - zwak.k >= 5 ? 2 : 1, SUCCES.maxPlus - erbij, plafond - c.s);
      if (plus > 0){ c.s = clamp(c.s + plus, 30, 95); erbij += plus; }
      const d = noteerDeal(null, id, nieuw, 'zomer', {buitenland:true, succes:true, land, vanNaam:vanClub(land, false), som:transferSom(k, false), k});
      deals.push(d); l.push(d);
    }
    if (l.length){ clubs.push({id, n:l.length, erbij, reden:redenen.map(r => r.t)}); if (id === mijn) S.succesInv = {jaar:S.jaar, club:id, n:l.length, erbij, reden:redenen.map(r => r.t), s:c.s}; }
  }
  return {deals, clubs};
}
// Waar komt een buitenlandse aankoop vandaan: "Real Montaña (Spanje)" of "Brazilië"
export const buitenlandBron = d => d.vanNaam ? `${d.vanNaam} (${d.land})` : d.land;

// Inhaalaankopen: een club die duidelijk onder de rest van zijn competitie zit (zoals een promovendus) haalt gericht
// spelers die beter zijn dan wat er staat. Geen sterren: de spelers hooguit net onder het gemiddelde van de competitie,
// en de club zelf komt niet verder dan net boven de zwakste andere club.
export const INHAAL = {gat:3, zomer:5, winter:2}; // hoeveel onder de zwakste andere club, en hoeveel sterkte erbij per periode
export const zwaksteZonder = (comp, id) => Math.min(...comp.filter(i => i !== id).map(i => CLUBS[i].s));
export const divGemZonder = (comp, id) => { const r = comp.filter(i => i !== id); return r.reduce((a, i) => a + CLUBS[i].s, 0) / Math.max(1, r.length); };
export function inhaalAankopen(comp, onder, soort){
  const deals = [], clubs = [];
  for (const id of comp){
    const gem = divGemZonder(comp, id), bodem = zwaksteZonder(comp, id), gat = bodem - CLUBS[id].s;
    if (gat <= INHAAL.gat) continue;
    const max = soort === 'zomer' ? INHAAL.zomer : INHAAL.winter, n = Math.min(soort === 'zomer' ? randInt(2, 4) : randInt(1, 2), Math.ceil(gat / 3));
    const plafond = bodem + 1, hoogst = Math.floor(gem - 1); let erbij = 0;
    const l = [];
    for (let i = 0; i < n + 2 && l.length < n && CLUBS[id].s < plafond && erbij < max; i++){
      const sel = selectie(id);
      // de positie met de zwakste basisspeler (keepers zelden)
      const zwak = sel.filter(x => x.basis && (x.pos !== 'K' || rnd() < .15)).sort((a, b) => a.k - b.k)[0];
      if (!zwak) break;
      const laag = zwak.k + 2; if (laag > hoogst) continue;
      const past = x => !x.vriend && !isRivaal(x) && x.pos === zwak.pos && x.k >= laag && x.k <= hoogst && naamVrij(sel, x.n);
      // (a) een reservespeler van een sterkere club uit de competitie, (b) een basisspeler uit de top van de divisie eronder
      const reserves = comp.filter(j => j !== id && CLUBS[j].s > CLUBS[id].s).flatMap(j => selectie(j).filter(x => !x.basis && past(x)).map(x => ({x, van:j, reserve:true})));
      const lager = onder.flatMap(j => selectie(j).filter(x => x.basis && past(x)).map(x => ({x, van:j, reserve:false})));
      const kand = reserves.length ? reserves : lager;
      let d, nieuw;
      if (kand.length){
        const {x, van, reserve} = pick(kand), selV = selectie(van);
        selV.splice(selV.indexOf(x), 1); selectie(van); herschik(selectie(van));
        if (!reserve) CLUBS[van].s = clamp(CLUBS[van].s - 1, 30, 95);
        nieuw = x; neemOp(id, x);
        d = noteerDeal(van, id, x, soort, {inhaal:true, reserve});
      } else {
        // (c) transfervrij uit het buitenland
        const nm = pick(ACHTERNAMEN.filter(a => naamVrij(sel, a))) || 'Novak';
        nieuw = {v:pick(VOORL), n:nm, pos:zwak.pos, basis:true, k:randInt(laag, hoogst), lft:randInt(24, 30), g:zwak.g, a:zwak.a};
        neemOp(id, nieuw);
        d = noteerDeal(null, id, nieuw, soort, {inhaal:true, vrij:true});
      }
      // sterkte: +1, of +2 als hij veel beter is dan de speler die hij vervangt
      const plus = Math.min(nieuw.k - zwak.k >= 5 ? 2 : 1, max - erbij, plafond - CLUBS[id].s);
      if (plus > 0){ CLUBS[id].s += plus; erbij += plus; }
      deals.push(d); l.push(d);
    }
    if (l.length) clubs.push({id, n:l.length, erbij});
  }
  return {deals, clubs};
}
// Elke zomer worden alle spelers een jaar ouder: jongens groeien, routiniers gaan achteruit, wie 34 is stopt.
// Daarna bepaalt de klasse wie er in de basis staat, en schuift de clubsterkte mee met het niveau van de basisspelers.
const GROEI = lft => lft <= 21 ? [0, 4] : lft <= 25 ? [0, 2] : lft <= 29 ? [-1, 1] : lft <= 32 ? [-3, 0] : [-4, -1];
export function ontwikkelSpelers(clubs, mijn){
  const gestopt = [];
  for (const id of clubs){
    const sel = selectie(id), v = (S.vorig || {})[id], winnaars = id === mijn && v && v.plek === 1 ? .7 : .5; // (een winnende groep groeit samen)
    for (const x of sel){
      if (isRivaal(x) || x.vriend) continue; // je rivaal en je jeugdvriend groeien zelf (rivaal.js, journey.js)
      x.lft = (x.lft || 25) + 1; x.kVorig = x.k;
      const [lo, hi] = GROEI(x.lft); x.k = clamp(x.k + randInt(lo, hi) + (x.basis && x.lft <= 25 && rnd() < winnaars ? 1 : 0), 25, 95);
    }
    // stoppen: 34 jaar en ouder (de keeper mag tot 36)
    for (const x of sel.filter(x => !isRivaal(x) && !x.vriend && x.lft >= (x.pos === 'K' ? 36 : 34))){ sel.splice(sel.indexOf(x), 1); if (id === mijn){ gestopt.push(x); delete kleedkamer().rel[x.n]; } }
    selectie(id); // aanvullen met jeugd
    herschik(sel);
    // clubsterkte richting het niveau van de basiself
    const basis = sel.filter(x => x.basis), gem = basis.reduce((a, x) => a + x.k, 0) / Math.max(1, basis.length);
    CLUBS[id].s = clamp(Math.round(CLUBS[id].s + clamp((gem - CLUBS[id].s) * .3, -2, 2)), 30, 95);
    (S.teamHist = S.teamHist || {})[id] = (S.teamHist[id] || []).concat({jaar:S.jaar, s:CLUBS[id].s, gem:Math.round(gem * 10) / 10}).slice(-12);
  }
  return gestopt;
}
// Per positie: de besten (op klasse) in de basis, en wie het meest scoort en aangeeft gaat mee met de rangorde
export function herschik(sel){
  for (const [pos, o] of Object.entries(OPBOUW)){
    sel.filter(x => x.pos === pos).sort((a, b) => b.k - a.k).forEach((x, i) => { x.basis = i < o.basis; x.g = o.g[Math.min(i, o.g.length - 1)]; x.a = o.a[Math.min(i, o.a.length - 1)]; });
  }
}
// Elke zomer: per club stoppen 1 of 2 van de zwakste bankspelers, en jongens uit de eigen jeugd nemen hun plek in
export function jeugdDoorstroom(clubs){
  for (const id of clubs){
    const sel = selectie(id), weg = randInt(1, 2);
    const bank = sel.filter(x => !x.basis && x.pos !== 'K' && !x.vriend && !isRivaal(x)).sort((a, b) => (a.k ?? 0) - (b.k ?? 0)).slice(0, weg);
    for (const x of bank){ sel.splice(sel.indexOf(x), 1); if (id === S.sp.club) delete kleedkamer().rel[x.n]; }
    selectie(id); // aanvullen: de jeugdspelers
  }
}
// Wat het voor jou betekent, en de krant
function markNieuws(deals, t, mijn, jeugd, opgekomen = [], gestopt = [], inhaal = [], succes = []){
  const sp = S.sp, cn = id => id == null ? 'het buitenland' : CLUBS[id].n, naam = d => metVoorletter(d), prijs = d => d.som ? ` voor ${geldTxt(d.som)}` : '';
  const herkomst = d => d.buitenland ? `van ${buitenlandBron(d)}` : d.vrij ? 'transfervrij uit het buitenland' : d.reserve ? `reservespeler bij ${cn(d.van)}` : `van ${cn(d.van)}`;
  const erin = deals.filter(d => d.naar === mijn), eruit = deals.filter(d => d.van === mijn), rest = deals.filter(d => d.naar !== mijn && d.van !== mijn && !d.inhaal);
  const tekst = [];
  const en = l => l.length > 1 ? l.slice(0, -1).join(', ') + ' en ' + l[l.length - 1] : l[0];
  // clubs die na hun succes investeren (bij jouw club staan de namen ook in de aankopen hieronder)
  for (const c of succes.filter(c => c.id !== mijn)){ const l = deals.filter(d => d.succes && d.naar === c.id);
    krantMelding(`${cn(c.id)} investeert na ${en(c.reden)}`, `${cn(c.id)} haalt ${l.map(d => `${naam(d)} (${POS_NAAM[d.pos].toLowerCase()}, klasse ${d.k}, ${herkomst(d)})`).join(', ')}. De rest van de ${DIVS[t]} is gewaarschuwd.`); }
  // clubs die achterlopen en zich gericht versterken
  for (const c of inhaal){ const l = deals.filter(d => d.inhaal && d.naar === c.id);
    krantMelding(`${cn(c.id)} slaat toe op de transfermarkt: ${l.length} ${l.length === 1 ? 'versterking' : 'versterkingen'}`, `${cn(c.id)} wil niet achterblijven in de ${DIVS[t]} en haalt ${l.map(d => `${naam(d)} (${POS_NAAM[d.pos].toLowerCase()}, ${herkomst(d)})`).join(', ')}. Geen grote namen, wel spelers die het team beter maken.`); }
  for (const d of erin.filter(d => !d.inhaal && !d.buitenland).slice(0, 2)) krantMelding(`${cn(mijn)} haalt ${naam(d)} bij ${cn(d.van)}`, `De ${POS_NAAM[d.pos].toLowerCase()} komt over${prijs(d)}. Een versterking voor de selectie.`);
  // aankopen in het buitenland: jouw club altijd, een ster bij een andere club ook
  for (const d of erin.filter(d => d.buitenland)) krantMelding(d.ster ? `Grote naam voor ${cn(mijn)}: ${naam(d)}!` : `${cn(mijn)} haalt ${naam(d)} uit ${d.land}`, `De ${POS_NAAM[d.pos].toLowerCase()} komt${prijs(d)} over van ${buitenlandBron(d)}.${d.ster ? ` Een echte top${team.speler}: de concurrentie op ${team.zijn} plek wordt moordend.` : ' Een versterking voor de selectie.'}`);
  for (const d of deals.filter(d => d.buitenland && d.ster && d.naar !== mijn).slice(0, 2)) krantMelding(`${cn(d.naar)} haalt ster ${naam(d)} uit ${d.land}`, `${cn(d.naar)} betaalt${prijs(d)} voor de ${POS_NAAM[d.pos].toLowerCase()} van ${buitenlandBron(d)}. Een signaal aan de rest van de ${DIVS[t]}.`);
  for (const d of eruit.slice(0, 2)) krantMelding(`${cn(mijn)} verkoopt ${naam(d)} aan ${cn(d.naar)}`, `De ${POS_NAAM[d.pos].toLowerCase()} vertrekt${prijs(d)}. Een gat in de selectie.`);
  if (rest.length) krantMelding(`Transfers in de ${DIVS[t]}`, rest.slice(0, 5).map(d => `${kortClub(d.naar)} haalt ${naam(d)} (${d.buitenland ? d.land : kortClub(d.van)})`).join(' · ') + '.');
  if (!jeugd){
    if (erin.length) tekst.push(`Nieuw bij ${cn(mijn)}: ${erin.map(d => `${naam(d)} (${POS_NAAM[d.pos].toLowerCase()}, ${herkomst(d)}${d.ster ? ', een ster' : ''})`).join(', ')}.`);
    const sc = succes.find(c => c.id === mijn); if (sc) tekst.push(`Dankzij ${en(sc.reden)} kan de club investeren: ${sc.n} ${sc.n === 1 ? 'versterking' : 'versterkingen'}. De clubsterkte gaat omhoog naar ${CLUBS[mijn].s}.`);
    const ik = inhaal.find(c => c.id === mijn); if (ik) tekst.push(`De club wil niet achterblijven in de ${DIVS[t]}: met de nieuwe spelers gaat de clubsterkte omhoog naar ${CLUBS[mijn].s}.`);
    for (const d of eruit){
      const b = band(d.n); delete kleedkamer().rel[d.n];
      if (b >= 80){ mod('moraal', -4); tekst.push(`Je maatje ${naam(d)} vertrekt naar ${cn(d.naar)}. Je gaat hem missen in de kleedkamer.`); }
      else tekst.push(`${naam(d)} vertrekt naar ${cn(d.naar)}.`);
    }
  } else if (erin.length || eruit.length) tekst.push(`Het eerste elftal van je club is bezig op de transfermarkt: ${[...erin.map(d => `${naam(d)} komt`), ...eruit.map(d => `${naam(d)} vertrekt`)].join(', ')}.`);
  if (!jeugd) for (const x of gestopt) tekst.push(`${metVoorletter(x)} (${x.lft}) stopt met voetballen. In de kleedkamer krijgt hij een staande ovatie.`);
  // jongens uit de eigen jeugd die naar de selectie komen
  if (opgekomen.length){
    const lijst = opgekomen.map(x => `${metVoorletter(x)} (${POS_NAAM[x.pos].toLowerCase()})`).join(', ');
    if (opgekomen.length === 1) krantMelding(`Jeugdspeler ${metVoorletter(opgekomen[0])} naar de selectie van ${cn(mijn)}`, `De ${POS_NAAM[opgekomen[0].pos].toLowerCase()} uit de eigen jeugd mag aansluiten bij het eerste elftal.`);
    else krantMelding(`${cn(mijn)} laat ${opgekomen.length} talenten doorstromen uit de eigen jeugd`, `Naar de selectie: ${lijst}.`);
    tekst.push(jeugd ? `Bij het eerste elftal van je club komen ${team.jongens} uit de jeugd: ${lijst}.` : `Uit de eigen jeugd naar de selectie: ${lijst}.`);
  }
  S.markt = {club:sp.club, tekst, nieuw:jeugd ? [] : erin.map(d => ({v:d.v, n:d.n})), jeugd:jeugd ? [] : opgekomen.map(x => ({v:x.v, n:x.n})), welkom:!jeugd && (erin.length > 0 || opgekomen.length > 0)};
}
// Na de transferperiode: de meldingen in je week, en als aanvoerder verwelkom je de nieuwe spelers
export function naMarkt(){
  const m = S.markt; S.markt = null; if (!m || m.club !== S.sp.club) return;
  m.tekst.forEach(t => S.week.tekst.push(t));
  if (m.welkom && isAanvoerder() && !S.wachtEv && !S.ev) S.ev = welkomEvent(m.nieuw, m.jeugd || []), S.fase = 'event';
}
// namen: wie er gekocht is, jeugd: wie er uit de eigen jeugd doorstroomt ({v, n}, of alleen een achternaam)
export function welkomEvent(namen, jeugd = []){
  const sp = S.sp, c = club().n, prijs = Math.round(teamUitjePrijs() / 2), toon = x => typeof x === 'string' ? x : metVoorletter(x);
  const en = l => { const t = l.map(toon); return t.length > 1 ? t.slice(0, -1).join(', ') + ' en ' + t[t.length - 1] : t[0]; };
  const band = (l, d) => l.forEach(x => zetBand(typeof x === 'string' ? x : x.n, d));
  // Alleen jongens uit de jeugd: zij kijken tegen je op
  if (!namen.length) return {soort:'club', tekst:`Uit de eigen jeugd komen ${en(jeugd)} bij de selectie van ${c}. Ze kijken een beetje schuchter rond in de kleedkamer. Als aanvoerder ben jij de eerste die ze begroet. Hoe ontvang je ze?`, opts:[
    {l:'Ze onder je hoede nemen', f(){ band(jeugd, 15); mod('moraal', 3); mod('vert', 2); return `Je laat ze zien hoe het werkt, waar ze moeten zitten en wie ze moeten kennen. "Vraag maar alles." De trainer ziet het en knikt tevreden.`; }},
    {l:'Een onschuldige ontgroening: zingen in de kantine', f(){ band(jeugd, 6); mod('moraal', 4); if (rnd() < .2){ onrust(3, 'Een ontgroening die uit de hand liep'); return 'Ze moeten op een stoel een lied zingen. Iemand gaat er net te ver in en een van de ' + team.jongens + ' vindt het niet leuk meer. Het blijft even ongemakkelijk.'; } return 'Ze moeten op een stoel het clublied zingen. Vals, maar met overgave. De hele kleedkamer ligt dubbel: ze horen er meteen bij.'; }},
    {l:'Ze laten merken dat ze nog niks zijn', f(){ band(jeugd, -10); statusPunten(1); return '"Eerst maar laten zien dat je hier hoort." De ' + team.jongens + ' knikken zenuwachtig. De oudere spelers grijnzen.'; }}]};
  const wie = en(namen) + (jeugd.length ? `, en uit de eigen jeugd ${en(jeugd)}` : '');
  return {soort:'club', tekst:`Nieuw bij ${c}: ${wie}. Als aanvoerder ben jij de eerste die ze ontmoet. Hoe verwelkom je ze?`, opts:[
    {l:`Rondleiding en samen uit eten (${geldTxt(prijs)})`, f(){ const b = Math.min(sp.geld, prijs); sp.geld -= b; band(namen, 20); band(jeugd, 15); mod('moraal', 3); return `Je laat ze de club zien, van de kantine tot de wasruimte, en trakteert daarna op een etentje. Iedereen voelt zich meteen thuis.`; }},
    {l: jeugd.length ? 'De nieuwe ' + team.jongens + ' een stevige hand, de jeugd onder je hoede' : 'Een stevige hand en de regels uitleggen', f(){ band(namen, 8); band(jeugd, 12); mod('vert', 2); return '"Op tijd komen, hard werken, en we doen het samen." De nieuwe spelers knikken, en de ' + team.jongens + ' uit de jeugd lopen de hele week achter je aan.'; }},
    {l:'Laten zien wie hier de baas is', f(){ band(namen, -10); band(jeugd, -8); onrust(4, 'Gedoe met de nieuwe spelers'); statusPunten(2); return 'Je zegt dat ze eerst maar moeten laten zien wat ze kunnen. De oude garde grijnst, de nieuwelingen kijken je koel aan.'; }}]};
}
// Voor het transferscherm: wat er in deze periode in jouw competitie gebeurde
export function vMarkt(){
  const {t} = marktComp(), l = (S.transfers || []).filter(d => `${d.jaar}-${d.soort}` === S.marktKlaar);
  if (!l.length) return '';
  return `<details class="paneel" open><summary class="label" style="cursor:pointer">Transfers in de ${DIVS[t]} (${l.length})</summary><div class="uitslagen" style="margin-top:8px">${l.map(d =>
    `<div class="pd"><span><span class="goedtxt">▲ ${esc(kortClub(d.naar))}</span> haalt <b>${esc(metVoorletter(d))}</b> <span class="muted klein-tekst">(${POS_NAAM[d.pos].toLowerCase()})</span></span><span class="muted">${d.buitenland ? `🌍 ${esc(buitenlandBron(d))}${d.ster ? ' ⭐' : ''}` : d.van == null ? 'transfervrij' : `<span class="fouttxt">▼ ${esc(kortClub(d.van))}</span>${d.reserve ? ' (reserve)' : ''}`}${d.som ? ` · ${geldTxt(d.som)}` : ''}</span></div>`).join('')}</div></details>`;
}
