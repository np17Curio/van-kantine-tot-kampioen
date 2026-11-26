import { S, club, seizoenLabel, tmp } from '../../core/state.js';
import { knop } from '../../core/ui.js';
import { clamp, esc, pick, shuffle } from '../../core/utils.js';
import { CLUBS, DIVS, LAAGSTE, divClubs, ligaVan, rondeInWeek, AANTAL_RONDES } from '../../data/gegevens.js';
import { thuisLand, cupNaam } from '../../data/landen.js';
import { stand } from '../competitie/spelers.js';
import { fmt1, gemiddelde } from '../speler/o23.js';
import { stand2 } from '../wedstrijd/wedstrijd.js';
import { clubLogo } from '../../data/logos.js';
import { vormBolletjes } from '../competitie/vorm.js';
import { historieKnop } from '../seizoen/historie.js';
import { ik } from '../../core/geslacht.js';
import { registreer } from '../../render/pixel/krant.js';

/* ===================== Het nieuws ===================== */
// Na elke clubwedstrijd verschijnen krantenkoppen over je ploeg en over jou, op basis van wat er echt gebeurde
export const KRANTEN = {2:['De Sportkrant', 'Voetbal Vandaag', 'Studio Voetbal'],
  1:['De Sportkrant', 'Voetbal Vandaag', 'Studio Voetbal'], 0:['Kickoff International', 'De Sportkrant', 'Europees Voetbalnieuws']};
export const MIJLPAAL_G = [10, 25, 50, 100, 150, 200, 300], MIJLPAAL_W = [50, 100, 200, 300, 400, 500];
// Hoeveel keer op rij (tot en met nu) geldt f voor de uitslagen van dit seizoen
export function reeks(lijst, f){ let n = 0; for (let i = lijst.length - 1; i >= 0 && f(lijst[i]); i--) n++; return n; }
export function maakNieuws(M, speelde){
  const sp = S.sp, c = club(), t = c.t, wij = c.n, zij = CLUBS[M.opp].n, naam = sp.naam, lft = sp.leeftijd;
  const won = M.us > M.them, verl = M.us < M.them, uit = M.thuis ? `${wij} - ${zij} ${stand2()}` : `${zij} - ${wij} ${stand2()}`;
  const res = (S.ss.uitslagen || []).filter(Boolean).map(x => x.r);
  // Eigen vorm per club bijhouden (ook over seizoenen heen)
  const v = sp.nieuwsVorm && sp.nieuwsVorm.club === sp.club ? sp.nieuwsVorm : (sp.nieuwsVorm = {club:sp.club, c:[], g:[]});
  if (speelde){ v.c = v.c.concat(M.cijfer).slice(-5); v.g = v.g.concat(M.goals).slice(-6); }
  const k = [];
  // Dezelfde soort kop komt niet elke week terug: in de 5 wedstrijden daarna telt hij veel minder zwaar
  const nr = S.car.nieuwsNr = (S.car.nieuwsNr || 0) + 1, laatst = S.car.nieuwsLaatst = S.car.nieuwsLaatst || {};
  const voeg = (p, kop, tekst, sleutel, foto) => { const sl = sleutel || kop.replace(/\d+/g, ''); k.push({p: laatst[sl] !== undefined && nr - laatst[sl] <= 5 ? p - 9 : p, kop, tekst, sl, foto}); };
  const hoger = t > 1 ? CLUBS[pick(divClubs(t - 1))].n : null; // boven de hoogste competitie is niets meer
  const cijfer = speelde ? fmt1(M.cijfer) : null;

  // --- Over jou ---
  if (speelde){
    if (M.goals >= 3) voeg(10, won ? `Hattrick! ${naam} schiet ${wij} naar de zege` : `Hattrick van ${naam} niet genoeg voor ${wij}`, `${M.goals} goals in ${uit}. ${ik.Hij} krijgt de wedstrijdbal mee naar huis.`, 'hattrick' + nr, fotoVan('hattrick', `${naam} met de wedstrijdbal na ${ik.zijn} hattrick tegen ${zij}.`));
    if (M.rood) voeg(9, verl ? `Rood voor ${naam}: ${wij} verliest met tien man` : `Rood voor ${naam}, maar ${wij} houdt stand`, `${M.roodSoort === 'direct' ? 'Een directe rode kaart' : 'Twee keer geel'} tegen ${zij}. ${naam} is ${M.roodSoort === 'direct' ? '2 wedstrijden' : '1 wedstrijd'} geschorst.`);
    if (M.cijfer >= 8.5 && !M.rood){
      // Man of the Match: met een foto (bij een hattrick staat die foto er al)
      const motm = M.goals >= 3 ? null : fotoVan('motm', `${ik.Speler} van de Wedstrijd ${naam} met ${ik.zijn} trofee na ${uit}.`), ms = motm ? 'motm' + nr : null;
      if (lft >= 31) voeg(9, `${naam} (${lft}) laat zien dat ${ik.hij} het nog steeds kan`, `Een ${cijfer} tegen ${zij}. "Ouder worden? Daar doet ${ik.hij} niet aan," grapt de trainer.`, ms, motm);
      else if (t === 1 && CLUBS[sp.club].s >= 80) voeg(9, `Wereldklasse van ${naam} tegen ${zij}`, `Een ${cijfer}. Op social media gaan de beelden de hele wereld over.`, ms, motm);
      else voeg(9, pick([`"Deze ${ik.jongen} gaat de top halen"`, `"Zo'n talent zie je maar eens in de tien jaar"`, `${naam} speelt ${zij} helemaal zoek`]), `${pick(['De trainer', 'Een teamgenoot', 'De voorzitter'])} na de wedstrijd tegen ${zij}: "${naam} is te goed voor dit niveau." ${ik.Hij} kreeg een ${cijfer}.`, ms || 'topwedstrijd', motm);
    }
    const r3 = v.c.slice(-3), g3 = r3.length === 3 ? gemiddelde(r3) : null;
    if (g3 !== null && g3 >= 7.5 && M.cijfer >= 7){
      if (hoger) voeg(8, `Scouts van ${hoger} gespot bij ${wij}`, `Ze kwamen kijken naar ${naam}, die al weken uitblinkt (gemiddeld ${fmt1(g3)} in ${ik.zijn} laatste 3 wedstrijden).`, 'scouts');
      else voeg(8, `${naam} op weg naar de Gouden Bal?`, `Gemiddeld een ${fmt1(g3)} in ${ik.zijn} laatste 3 wedstrijden. Europa praat over niemand anders.`, 'goudenbal');
    }
    if (g3 !== null && g3 < 5.5) voeg(7, `Waar is de vorm van ${naam}?`, `Drie matige wedstrijden op rij (gemiddeld ${fmt1(g3)}). Op de tribune wordt gemopperd.`);
    else if (M.cijfer <= 4.5 && !M.rood) voeg(6, `Zwarte dag voor ${naam}`, `Een ${cijfer} tegen ${zij}. ${ik.Hij} zal deze wedstrijd snel willen vergeten.`);
    const gr = reeks(v.g, x => x > 0);
    if (gr >= 3 && M.goals > 0) voeg(8, `${naam} blijft maar scoren: ${gr} wedstrijden op rij raak`, `Ook tegen ${zij} was het weer raak. Wie houdt ${ik.hem} tegen?`);
    if (M.rol === 'invaller' && M.goals > 0 && won && M.goals >= M.us - M.them) voeg(8, `Gouden wissel: invaller ${naam} beslist het duel`, `${ik.Hij} kwam in de tweede helft in het veld en maakte het verschil tegen ${zij}.`);
    if (sp.clubWed === 1) voeg(7, `Debuut voor ${lft < 18 ? `de ${lft}-jarige ` : ''}${naam} bij ${wij}`, M.goals ? `En ${ik.hij} scoorde meteen! Wat een begin.` : `${ik.Hij} kreeg een ${cijfer} voor ${ik.zijn} eerste wedstrijd.`);
    const mg = MIJLPAAL_G.find(x => S.car.g >= x && S.car.g - M.goals < x);
    if (mg) voeg(9, `Mijlpaal: doelpunt nummer ${mg} voor ${naam}`, `Het publiek gaat staan voor een applaus.`);
    const mw = MIJLPAAL_W.find(x => S.car.wed === x);
    if (mw) voeg(7, `${naam} speelt ${ik.zijn} ${mw}e wedstrijd`, `Een mooie mijlpaal in de carrière van ${naam}. Het bestuur heeft bloemen klaargezet.`);
  } else {
    if (M.rol === 'geschorst') voeg(6, won ? `${wij} wint ook zonder geschorste ${naam}` : `${wij} mist geschorste ${naam}`, `${naam} zat op de tribune. Uitslag: ${uit}.`);
    else if (M.rol === 'blessure' && sp.statusNiveau >= 2) voeg(4, `${wij} moet het zonder ${naam} doen`, `${naam} is nog geblesseerd. Uitslag: ${uit}.`);
    else if (M.rol === 'tribune' && sp.statusNiveau >= 2) voeg(6, `${naam} op de tribune: is de trainer klaar met ${ik.hem}?`, `Opvallend: ${naam} zat niet eens bij de selectie tegen ${zij}.`);
    else if (M.rol === 'ouders') voeg(5, `${naam} mist wedstrijd: "Eerst school"`, `${ik.Zijn} ouders hielden ${ik.hem} thuis tot ${ik.zijn} cijfers beter zijn.`);
  }

  // --- Derby ---
  if (M.derby){
    if (won) voeg(9.5, speelde && M.goals && !M.rood ? `${naam} schiet ${wij} langs aartsrivaal ${zij}` : `${wij} wint de derby van ${zij}!`, speelde && M.goals && !M.rood ? `Eindstand: ${uit}. De hele stad is trots: ${naam} is de held.` : `Eindstand: ${uit}. De supporters vieren feest tot diep in de nacht.`, 'derbyW');
    else if (verl) voeg(9.5, `Derbydrama: ${wij} onderuit tegen aartsrivaal ${zij}`, `Eindstand: ${uit}. Een pijnlijke middag voor alles wat ${wij} is.`, 'derbyV');
    else voeg(8, `Geen winnaar in de derby`, `${uit} tussen ${wij} en ${zij}. Een hete middag zonder winnaar.`, 'derbyG');
  }

  // --- Over de ploeg ---
  const w = reeks(res, x => x === 'W'), l = reeks(res, x => x === 'V'), zw = reeks(res, x => x !== 'W'), onv = reeks(res, x => x !== 'V');
  if (l >= 3) voeg(7 + (l >= 5 ? 1 : 0), pick([`Crisis bij ${wij}: ${l}e nederlaag op rij`, `${wij} in de put: al ${l} keer op rij verloren`]), `De trainer staat onder druk. "We moeten ons herpakken," zegt de aanvoerder.`);
  else if (zw >= 5) voeg(5, `${wij} al ${zw} wedstrijden zonder zege`, `Het wil maar niet lukken. De supporters worden ongeduldig.`);
  if (w >= 5) voeg(7, `Niemand houdt ${wij} tegen: ${w} zeges op rij`, `${wij} is bezig aan een geweldige reeks.`);
  else if (w >= 3) voeg(6, `${wij} blijft winnen: ${w} zeges op rij`, `Ook ${zij} kon er niks tegen doen (${uit}).`);
  else if (won && res.length >= 4 && reeks(res.slice(0, -1), x => x !== 'W') >= 3) voeg(6, `Eindelijk! ${wij} wint weer`, `Na ${reeks(res.slice(0, -1), x => x !== 'W')} wedstrijden zonder zege is de opluchting groot.`);
  if (onv >= 6 && !(w >= 3)) voeg(5, `${wij} al ${onv} wedstrijden ongeslagen`, `De ploeg is moeilijk te verslaan.`);
  if (M.us - M.them >= 4) voeg(6, `${wij} walst over ${zij} heen`, `Eindstand: ${uit}. Een middag om nooit te vergeten.`);
  if (M.them - M.us >= 4) voeg(6, `Pak slaag voor ${wij}`, `${zij} was veel te sterk: ${uit}.`);
  // Stand: alleen nieuws als de positie bovenaan of onderaan verandert
  if (res.length >= 3){
    const lijst = stand(t), plek = lijst.indexOf(sp.club) + 1, oud = S.ss.nieuwsPlek;
    if (plek === 1 && oud !== 1) voeg(6, `${wij} nieuwe koploper in de ${DIVS[t]}`, `Na de wedstrijd tegen ${zij} staat ${wij} bovenaan.`);
    if (plek === lijst.length && oud !== plek) voeg(5, `${wij} bungelt onderaan`, `De ploeg is laatste geworden in de ${DIVS[t]}.`);
    S.ss.nieuwsPlek = plek;
  }
  // Altijd minstens een wedstrijdverslag
  voeg(1, won ? `${wij} wint van ${zij}` : verl ? `${wij} verliest van ${zij}` : `${wij} speelt gelijk tegen ${zij}`, `Eindstand: ${uit}.${speelde ? ` ${naam} kreeg een ${cijfer}.` : ''}`, 'verslag' + nr);
  k.sort((a, b) => b.p - a.p);
  // Koppen die net al in de krant stonden vallen weg; het wedstrijdverslag (p 1) staat er dan
  const top = k.filter(x => x.p >= 1).slice(0, 2);
  top.forEach(x => laatst[x.sl] = nr);
  const bronnen = shuffle(KRANTEN[t]);
  const items = top.map((x, i) => ({bron:bronnen[i % bronnen.length], kop:x.kop, tekst:x.tekst, wanneer:`week ${S.ronde + 1}, ${seizoenLabel()}`, ...(x.foto ? {foto:x.foto} : {})}));
  S.nieuws = items.concat(S.nieuws || []).slice(0, 12);
  return items;
}
// Een foto bij een artikel: jouw speler met de prijs (de foto zelf wordt na de weergave gemaakt, zie render/krantfoto.js)
export const FOTO_ALT = {hattrick:'met de wedstrijdbal', get motm(){ return `met de ${ik.Speler} van de Wedstrijd-trofee`; }, svs:'met de bokaal voor Speler van het Seizoen', topscorer:'met de Gouden Schoen', goudenbal:'met de Gouden Bal', aanvoerder:'met de aanvoerdersband', get ererondje(){ return `tijdens ${ik.zijn} ererondje`; }};
export const fotoVan = (soort, onder) => ({soort, onder});
function vFoto(f){
  const door = 'Studio Doorbraak';
  return `<figure class="krantfoto"><div class="lijst"><img data-foto="${esc(f.soort)}" alt="${esc(S.sp.naam + ' ' + (FOTO_ALT[f.soort] || ''))}" width="720" height="480"><span class="ontwikkel">Foto wordt ontwikkeld…</span></div><figcaption>${esc(f.onder)} <span>Foto: ${door}</span></figcaption></figure>`;
}
// Elk artikel als een voorpagina in pixels (render/pixel/krant.js, naar de stijlbron deel 10). De pagina zelf wordt na de
// weergave getekend (render/krantfoto.js: krantNaRender); de tekst staat er ook in gewone letters bij, voor schermlezers.
export function vKrant(items, titel = 'In de krant'){
  if (!items || !items.length) return '';
  return `<div class="krantblok"><span class="label">${esc(titel)}</span><div class="pixelkranten">${items.map(n => `<figure class="pixelkrant" data-krant="${registreer(n)}"><canvas aria-hidden="true"></canvas><figcaption class="sr-only">${esc(n.bron || '')}: <b>${esc(n.kop)}</b>. ${esc(n.tekst || '')}${n.foto ? ` (Foto: ${esc(n.foto.onder || '')})` : ''}</figcaption></figure>`).join('')}</div></div>`;
}
// Ranglijst van de competitie op niveau t: k = 'g' (goals) of 'a' (assists)
// bron: de lijst van dit seizoen (S.ss.st) of de bewaarde eindstand van vorig seizoen (S.vorigeSt.st, met de divisie erbij)
const divVan = x => x.t ?? (CLUBS[x.club] ? CLUBS[x.club].t : null);
export function ranglijst(t, k, bron = S.ss.st){
  const o = k === 'g' ? 'a' : 'g', alle = Object.values(bron || {}).filter(x => divVan(x) === t);
  const l = alle.filter(x => !x.jij && x[k] > 0);
  // Jij: al je rijen in deze competitie samen. Na een verhuur of transfer in de winter heb je er één per club; los telde
  // alleen de rij van je huidige club, en stond je na een verhuur ineens met 0 goals in de lijst
  const mijn = alle.filter(x => x.jij), hier = bron === S.ss.st && club().t === t;
  if (mijn.length){
    const basis = mijn.find(x => x.club === S.sp.club) || mijn[mijn.length - 1];
    const samen = {...basis, g:mijn.reduce((n, x) => n + (x.g || 0), 0), a:mijn.reduce((n, x) => n + (x.a || 0), 0), clubs:[...new Set(mijn.map(x => x.club))]};
    if (samen[k] > 0 || hier) l.push(samen);
  } else if (hier) l.push({club:S.sp.club, jij:true, v:'', n:S.sp.naam, g:0, a:0}); // (jij staat er altijd in als je in deze competitie speelt, ook met 0)
  return l.sort((x, y) => y[k] - x[k] || y[o] - x[o] || (x.jij ? -1 : y.jij ? 1 : 0));
}
// Met voorletter schrijf je het tussenvoegsel klein: R. van Leeuwen (zonder voorletter: Van Leeuwen)
export const metVoornaam = (v, n) => `${v} ${n.replace(/^(Van den|Van der|Van|De|Den)(?= )/, m => m.toLowerCase())}`;
export const metVoorletter = x => `${x.v}. ${x.n.replace(/^(Van den|Van der|Van|De|Den)(?= )/, m => m.toLowerCase())}`;
export const kortClub = id => CLUBS[id].n.replace(/ O19$/, '');
export function vRanglijst(t, k){
  // In de zomer en aan het begin van een seizoen is de lijst van dit seizoen nog leeg: dan de eindstand van vorig seizoen
  // (met daarin ook je goals voor je eigen club, als je in de winter verhuurd was)
  const V = S.vorigeSt, leeg = !Object.values(S.ss.st || {}).some(x => divVan(x) === t && x[k] > 0);
  if (leeg && V && V.st){
    const mijnT = Object.values(V.st).filter(x => x.jij).map(divVan), tv = mijnT.length && !mijnT.includes(t) && club().t === t ? mijnT[0] : t;
    const lv = ranglijst(tv, k, V.st);
    if (lv.length && lv[0][k]) return `<p class="muted klein-tekst">Vorig seizoen ${esc(V.s)}${tv !== t ? ` · ${esc(DIVS[tv])}` : ''}</p>` + tabelRang(lv, k);
  }
  const l = ranglijst(t, k);
  if (!l.length || !l[0][k]) return `<p class="muted klein-tekst">Nog niemand heeft ${k === 'g' ? 'gescoord' : 'een assist gegeven'} dit seizoen.</p>`;
  return tabelRang(l, k);
}
function tabelRang(l, k){
  const top = l.slice(0, 10), ik = l.findIndex(x => x.jij);
  // Gedeelde plaatsen: gelijk aantal = zelfde positie
  const plek = i => { let j = i; while (j > 0 && l[j - 1][k] === l[i][k]) j--; return j + 1; };
  const clubTxt = x => x.clubs && x.clubs.length > 1 ? x.clubs.map(kortClub).join(' / ') : kortClub(x.club); // (na een verhuur in de winter: beide clubs)
  const rij = (x, i) => `<tr class="${x.jij ? 'mij' : ''}"><td>${plek(i)}</td><td><span class="rnaam">${x.jij ? esc(x.n) + ' (jij)' : esc(metVoorletter(x))}</span><span class="rclub">${esc(clubTxt(x))}</span></td><td>${x[k]}</td></tr>`;
  return `<table class="tabel rang"><thead><tr><th>#</th><th>Speler</th><th>${k === 'g' ? 'Goals' : 'Assists'}</th></tr></thead><tbody>
    ${top.map((x, i) => rij(x, i)).join('')}${ik >= 10 ? `<tr class="gat"><td colspan="3">…</td></tr>${rij(l[ik], ik)}` : ''}</tbody></table>`;
}
// Uitslagen van een speelronde in competitie t
export function vUitslagen(t, r, zonderMijn){
  const ronde = S.ss.res && S.ss.res[t] && S.ss.res[t][r];
  if (!ronde) return '<p class="muted klein-tekst">Nog geen uitslagen.</p>';
  return `<div class="uitslagen">${ronde.filter(([h, u]) => !(zonderMijn && (h === S.sp.club || u === S.sp.club))).map(([h, u, gh, gu]) => {
    const mijn = h === S.sp.club || u === S.sp.club;
    return `<div class="uit ${mijn ? 'mij' : ''}"><span class="th ${gh > gu ? 'w' : ''}">${esc(kortClub(h))}</span><b>${gh} - ${gu}</b><span class="tu ${gu > gh ? 'w' : ''}">${esc(kortClub(u))}</span></div>`; }).join('')}</div>`;
}
export const gespeeldeRondes = t => (S.ss.res && S.ss.res[t] ? S.ss.res[t].length : 0);
// Wat betekent een plek in de stand? Kampioen promoveert, de nummer 2 en de een-na-laatste spelen nacompetitie, de laatste degradeert
export const ZONES = {cl:'Champions League', eur:'Europa Cup', prom:'Promoveert direct', po:'Nacompetitie om promotie', pod:'Nacompetitie tegen degradatie', degr:'Degradeert direct'};
// Wat betekent plek i (van n) in league t? Volgens de regels van je land (LIGA in gegevens.js)
export function zone(t, i, n){
  const L = ligaVan(thuisLand()), po = L.po, dicht = po.soort === 'geen'; // (dicht: een gesloten competitie zonder promotie en degradatie)
  if (dicht) return t === 1 ? (i <= 1 ? 'cl' : i <= 3 ? 'eur' : null) : null;
  if (t === 1) return i <= 1 ? 'cl' : i <= 3 ? 'eur' : i >= n - L.omlaag ? 'degr' : po.soort === 'barrage' && i === po.boven - 1 ? 'pod' : null; // de hoogste competitie
  if (i < L.omhoog) return 'prom';
  if (po.soort === 'barrage' ? i === po.onder - 1 : i >= po.van - 1 && i <= po.tot - 1) return 'po';
  if (t < LAAGSTE && i >= n - L.omlaag) return 'degr';
  return null;
}
// De uitleg onder de stand
export const zoneNaam = k => { const po = ligaVan(thuisLand()).po; return k === 'po' && po.soort === 'playoff' ? `Play-offs om promotie (nr. ${po.van}-${po.tot})` : k === 'cl' || k === 'eur' ? cupNaam(k) : ZONES[k]; };
// Gepromoveerd (▲), gedegradeerd (▼) of nieuw in de competitie, alleen in het eerste deel van het nieuwe seizoen
const wisselTeken = id => { const w = S.nieuwInDiv; if (!w || w.jaar !== S.jaar || S.ronde > AANTAL_RONDES * .3) return ''; return w.nieuw.includes(id) ? ' <span class="wt nieuw" title="Nieuw in deze competitie">nieuw</span>' : w.op.includes(id) ? ' <span class="wt op" title="Gepromoveerd">▲</span>' : w.neer.includes(id) ? ' <span class="wt neer" title="Gedegradeerd">▼</span>' : ''; };
export function vCompetitieKaart(){
  const sp = S.sp, c = club(), t = c.t, tab = tmp.comp || 'stand';
  const tabs = [['stand', 'Stand'], ['g', 'Topscorers'], ['a', 'Assists'], ['uit', 'Uitslagen']];
  let inhoud;
  if (tab === 'stand'){
    const st = stand(t);
    inhoud = `<div class="tabelwrap"><table class="tabel">
      <thead><tr><th>#</th><th>Club</th><th>G</th><th>DS</th><th>Pt</th><th class="vk">Vorm</th></tr></thead>
      <tbody>${st.map((id, i) => { const e = S.tab[id], z = zone(t, i, st.length); return `<tr class="${id === sp.club ? 'mij' : ''}${z ? ' z-' + z : ''}"${z ? ` title="${zoneNaam(z)}"` : ''}><td>${i + 1}</td><td><span class="clubnaam">${historieKnop(id, clubLogo(id, 16) + esc(CLUBS[id].n))}${wisselTeken(id)}</span></td><td>${e.g}</td><td>${e.dv - e.dt > 0 ? '+' : ''}${e.dv - e.dt}</td><td>${e.pt}</td><td class="vk">${vormBolletjes(id)}</td></tr>`; }).join('')}</tbody>
    </table></div>${`<div class="zones">${Object.entries(ZONES).filter(([k]) => (t > 1 || (k !== 'prom' && k !== 'po')) && (t === 1 || (k !== 'cl' && k !== 'eur')) && (t < LAAGSTE || (k !== 'pod' && k !== 'degr')) && (k !== 'pod' || ligaVan(thuisLand()).po.soort === 'barrage') && (ligaVan(thuisLand()).po.soort !== 'geen' || k === 'cl' || k === 'eur')).map(([k]) => `<span class="z-${k}">${zoneNaam(k)}</span>`).join('')}</div>`}`;
  } else if (tab === 'uit'){
    const n = gespeeldeRondes(t);
    if (!n) inhoud = '<p class="muted klein-tekst">Er is nog geen speelronde gespeeld.</p>';
    else {
      const r = clamp(tmp.compRonde ?? n - 1, 0, n - 1);
      inhoud = `<div class="rondenav">${knop('‹', () => { tmp.compRonde = r - 1; }, 'klein', `data-blijf ${r <= 0 ? 'disabled' : ''} aria-label="Vorige speelronde"`)}<span>Speelronde ${r + 1}</span>${knop('›', () => { tmp.compRonde = r + 1; }, 'klein', `data-blijf ${r >= n - 1 ? 'disabled' : ''} aria-label="Volgende speelronde"`)}</div>${vUitslagen(t, r)}`;
    }
  } else inhoud = vRanglijst(t, tab);
  return `<div class="kaart"><h3>${DIVS[t]}</h3>
    <div class="comptabs" role="tablist">${tabs.map(([k, l]) => knop(l, () => { tmp.comp = k; if (k === 'uit') tmp.compRonde = null; }, 'comptab' + (k === tab ? ' aan' : ''), `data-blijf role="tab" aria-selected="${k === tab}"`)).join('')}</div>
    ${inhoud}</div>`;
}
export function vOokGespeeld(){
  const t = club().t, r = rondeInWeek(t, S.ronde); if (r == null || !gespeeldeRondes(t) || !(S.ss.res[t][r])) return '';
  return `<div class="krantblok"><span class="label">Ook gespeeld · speelronde ${r + 1}</span>${vUitslagen(t, r, true)}</div>`;
}
export function vNieuwsKaart(){
  const l = (S.nieuws || []).slice(0, 8); if (!l.length) return '';
  const label = n => n.comp ? '<span class="risico r-gem">Competitie</span> ' : '<span class="risico r-veilig">Jij</span> '; // (competitienieuws of nieuws over jou en je club)
  return `<div class="kaart"><h3>Laatste nieuws</h3><div class="nieuwslijst">${l.map(n => `<div><span class="niv">${label(n)}${esc(n.bron)} · ${esc(n.wanneer)}</span><b>${esc(n.kop)}</b>${n.comp && n.tekst ? `<span class="muted klein-tekst">${esc(n.tekst)}</span>` : ''}</div>`).join('')}</div></div>`;
}
