import { S, club, seizoenLabel, tmp } from '../../core/state.js';
import { knop } from '../../core/ui.js';
import { clamp, esc, pick, shuffle } from '../../core/utils.js';
import { AMATEUR, CLUBS, DIVS, JEUGD, divClubs } from '../../data/gegevens.js';
import { stand } from '../competitie/spelers.js';
import { fmt1, gemiddelde } from '../speler/o23.js';
import { stand2 } from '../wedstrijd/wedstrijd.js';
import { clubLogo } from '../../data/logos.js';

/* ===================== Het nieuws ===================== */
// Na elke clubwedstrijd verschijnen krantenkoppen over je ploeg en over jou, op basis van wat er echt gebeurde
export const KRANTEN = {5:['Het Clubblad', 'Dorpskrant De Molen', 'Jeugdvoetbal Regio'], 4:['Regionaal Dagblad', 'Het Clubblad', 'Amateurvoetbal Nu'],
  3:['Regionaal Dagblad', 'Voetbal Vandaag', 'De Sportkrant'], 2:['De Sportkrant', 'Voetbal Vandaag', 'Studio Voetbal'],
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
  const hoger = t > 0 ? CLUBS[pick(divClubs(t - 1))].n : null;
  const cijfer = speelde ? fmt1(M.cijfer) : null;

  // --- Over jou ---
  if (speelde){
    if (M.goals >= 3) voeg(10, won ? `Hattrick! ${naam} schiet ${wij} naar de zege` : `Hattrick van ${naam} niet genoeg voor ${wij}`, `${M.goals} goals in ${uit}. Hij krijgt de wedstrijdbal mee naar huis.`, 'hattrick' + nr, fotoVan('hattrick', `${naam} met de wedstrijdbal na zijn hattrick tegen ${zij}.`));
    if (M.rood) voeg(9, verl ? `Rood voor ${naam}: ${wij} verliest met tien man` : `Rood voor ${naam}, maar ${wij} houdt stand`, `${M.roodSoort === 'direct' ? 'Een directe rode kaart' : 'Twee keer geel'} tegen ${zij}. ${naam} is ${M.roodSoort === 'direct' ? '2 wedstrijden' : '1 wedstrijd'} geschorst.`);
    if (M.cijfer >= 8.5 && !M.rood){
      // Man of the Match: met een foto (bij een hattrick staat die foto er al)
      const motm = M.goals >= 3 ? null : fotoVan('motm', `Man of the Match ${naam} met zijn trofee na ${uit}.`), ms = motm ? 'motm' + nr : null;
      if (lft >= 31) voeg(9, `${naam} (${lft}) laat zien dat hij het nog steeds kan`, `Een ${cijfer} tegen ${zij}. "Ouder worden? Daar doet hij niet aan," grapt de trainer.`, ms, motm);
      else if (t === 0) voeg(9, `Wereldklasse van ${naam} tegen ${zij}`, `Een ${cijfer}. Op social media gaan de beelden de hele wereld over.`, ms, motm);
      else voeg(9, pick([`"Deze jongen gaat de top halen"`, `"Zo'n talent zie je maar eens in de tien jaar"`, `${naam} speelt ${zij} helemaal zoek`]), `${pick(['De trainer', 'Een teamgenoot', 'De voorzitter'])} na de wedstrijd tegen ${zij}: "${naam} is te goed voor dit niveau." Hij kreeg een ${cijfer}.`, ms || 'topwedstrijd', motm);
    }
    const r3 = v.c.slice(-3), g3 = r3.length === 3 ? gemiddelde(r3) : null;
    if (g3 !== null && g3 >= 7.5 && M.cijfer >= 7){
      if (hoger) voeg(8, `Scouts van ${hoger} gespot bij ${wij}`, `Ze kwamen kijken naar ${naam}, die al weken uitblinkt (gemiddeld ${fmt1(g3)} in zijn laatste 3 wedstrijden).`, 'scouts');
      else voeg(8, `${naam} op weg naar de Gouden Bal?`, `Gemiddeld een ${fmt1(g3)} in zijn laatste 3 wedstrijden. Europa praat over niemand anders.`, 'goudenbal');
    }
    if (g3 !== null && g3 < 5.5) voeg(7, `Waar is de vorm van ${naam}?`, `Drie matige wedstrijden op rij (gemiddeld ${fmt1(g3)}). Op de tribune wordt gemopperd.`);
    else if (M.cijfer <= 4.5 && !M.rood) voeg(6, `Zwarte dag voor ${naam}`, `Een ${cijfer} tegen ${zij}. Hij zal deze wedstrijd snel willen vergeten.`);
    const gr = reeks(v.g, x => x > 0);
    if (gr >= 3 && M.goals > 0) voeg(8, `${naam} blijft maar scoren: ${gr} wedstrijden op rij raak`, `Ook tegen ${zij} was het weer raak. Wie houdt hem tegen?`);
    if (M.rol === 'invaller' && M.goals > 0 && won && M.goals >= M.us - M.them) voeg(8, `Gouden wissel: invaller ${naam} beslist het duel`, `Hij kwam in de tweede helft in het veld en maakte het verschil tegen ${zij}.`);
    if (sp.clubWed === 1) voeg(7, `Debuut voor ${lft < 18 ? `de ${lft}-jarige ` : ''}${naam} bij ${wij}`, M.goals ? `En hij scoorde meteen! Wat een begin.` : `Hij kreeg een ${cijfer} voor zijn eerste wedstrijd.`);
    const mg = MIJLPAAL_G.find(x => S.car.g >= x && S.car.g - M.goals < x);
    if (mg) voeg(9, `Mijlpaal: doelpunt nummer ${mg} voor ${naam}`, `Het publiek gaat staan voor een applaus.`);
    const mw = MIJLPAAL_W.find(x => S.car.wed === x);
    if (mw) voeg(7, `${naam} speelt zijn ${mw}e wedstrijd`, `Een mooie mijlpaal in de carrière van ${naam}. Het bestuur heeft bloemen klaargezet.`);
  } else {
    if (M.rol === 'geschorst') voeg(6, won ? `${wij} wint ook zonder geschorste ${naam}` : `${wij} mist geschorste ${naam}`, `${naam} zat op de tribune. Uitslag: ${uit}.`);
    else if (M.rol === 'blessure' && sp.statusNiveau >= 2) voeg(4, `${wij} moet het zonder ${naam} doen`, `${naam} is nog geblesseerd. Uitslag: ${uit}.`);
    else if (M.rol === 'tribune' && sp.statusNiveau >= 2) voeg(6, `${naam} op de tribune: is de trainer klaar met hem?`, `Opvallend: ${naam} zat niet eens bij de selectie tegen ${zij}.`);
    else if (M.rol === 'ouders') voeg(5, `${naam} mist wedstrijd: "Eerst school"`, `Zijn ouders hielden hem thuis tot zijn cijfers beter zijn.`);
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
  S.nieuws = items.concat(S.nieuws || []).slice(0, 6);
  return items;
}
// Een foto bij een artikel: jouw speler met de prijs (de foto zelf wordt na de weergave gemaakt, zie render/krantfoto.js)
export const FOTO_ALT = {hattrick:'met de wedstrijdbal', motm:'met de Man of the Match-trofee', svs:'met de bokaal voor Speler van het Seizoen', topscorer:'met de Gouden Schoen'};
export const fotoVan = (soort, onder) => ({soort, onder});
function vFoto(f){
  const door = club() && club().t >= 4 ? 'de clubfotograaf' : 'Studio Kantine';
  return `<figure class="krantfoto"><div class="lijst"><img data-foto="${esc(f.soort)}" alt="${esc(S.sp.naam + ' ' + (FOTO_ALT[f.soort] || ''))}" width="720" height="480"><span class="ontwikkel">Foto wordt ontwikkeld…</span></div><figcaption>${esc(f.onder)} <span>Foto: ${door}</span></figcaption></figure>`;
}
export function vKrant(items){
  if (!items || !items.length) return '';
  return `<div class="krantblok"><span class="label">In de krant</span>${items.map(n => `<article class="krant${n.foto ? ' metfoto' : ''}"><span class="bron">${esc(n.bron)}</span>${n.foto ? vFoto(n.foto) : ''}<h4>${esc(n.kop)}</h4><p>${esc(n.tekst)}</p></article>`).join('')}</div>`;
}
// Ranglijst van de competitie op niveau t: k = 'g' (goals) of 'a' (assists)
export function ranglijst(t, k){
  const o = k === 'g' ? 'a' : 'g';
  const l = Object.values(S.ss.st || {}).filter(x => CLUBS[x.club].t === t && x[k] > 0);
  // Jij staat er altijd in als je in deze competitie speelt, ook met 0
  if (club().t === t && !l.some(x => x.jij && x.club === S.sp.club)) l.push({club:S.sp.club, jij:true, v:'', n:S.sp.naam, g:0, a:0});
  return l.sort((x, y) => y[k] - x[k] || y[o] - x[o] || (x.jij ? -1 : y.jij ? 1 : 0));
}
// Met voorletter schrijf je het tussenvoegsel klein: R. van Leeuwen (zonder voorletter: Van Leeuwen)
export const metVoornaam = (v, n) => `${v} ${n.replace(/^(Van den|Van der|Van|De|Den)(?= )/, m => m.toLowerCase())}`;
export const metVoorletter = x => `${x.v}. ${x.n.replace(/^(Van den|Van der|Van|De|Den)(?= )/, m => m.toLowerCase())}`;
export const kortClub = id => CLUBS[id].n.replace(/ O19$/, '');
export function vRanglijst(t, k){
  const l = ranglijst(t, k), top = l.slice(0, 10), ik = l.findIndex(x => x.jij && x.club === S.sp.club);
  // Gedeelde plaatsen: gelijk aantal = zelfde positie
  const plek = i => { let j = i; while (j > 0 && l[j - 1][k] === l[i][k]) j--; return j + 1; };
  const rij = (x, i) => `<tr class="${x.jij ? 'mij' : ''}"><td>${plek(i)}</td><td><span class="rnaam">${x.jij ? esc(x.n) + ' (jij)' : esc(metVoorletter(x))}</span><span class="rclub">${esc(kortClub(x.club))}</span></td><td>${x[k]}</td></tr>`;
  if (!l.length || !l[0][k]) return `<p class="muted klein-tekst">Nog niemand heeft ${k === 'g' ? 'gescoord' : 'een assist gegeven'} dit seizoen.</p>`;
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
export const ZONES = {prom:'Kampioen: promoveert', po:'Nacompetitie om promotie', pod:'Nacompetitie tegen degradatie', degr:'Degradeert'};
export function zone(t, i, n){
  if (t === JEUGD) return null;
  if (i === 0 && t > 0) return 'prom';
  if (i === 1 && t > 0) return 'po';
  if (t < AMATEUR && i === n - 1) return 'degr';
  if (t < AMATEUR && i === n - 2) return 'pod';
  return null;
}
export function vCompetitieKaart(){
  const sp = S.sp, c = club(), t = c.t, tab = tmp.comp || 'stand';
  const tabs = [['stand', 'Stand'], ['g', 'Topscorers'], ['a', 'Assists'], ['uit', 'Uitslagen']];
  let inhoud;
  if (tab === 'stand'){
    const st = stand(t);
    inhoud = `<div class="tabelwrap"><table class="tabel">
      <thead><tr><th>#</th><th>Club</th><th>G</th><th>DS</th><th>Pt</th></tr></thead>
      <tbody>${st.map((id, i) => { const e = S.tab[id], z = zone(t, i, st.length); return `<tr class="${id === sp.club ? 'mij' : ''}${z ? ' z-' + z : ''}"${z ? ` title="${ZONES[z]}"` : ''}><td>${i + 1}</td><td><span class="clubnaam">${clubLogo(id, 16)}${esc(CLUBS[id].n)}</span></td><td>${e.g}</td><td>${e.dv - e.dt > 0 ? '+' : ''}${e.dv - e.dt}</td><td>${e.pt}</td></tr>`; }).join('')}</tbody>
    </table></div>${t === JEUGD ? '' : `<div class="zones">${Object.entries(ZONES).filter(([k]) => (t > 0 || (k !== 'prom' && k !== 'po')) && (t < AMATEUR || (k !== 'pod' && k !== 'degr'))).map(([k, l]) => `<span class="z-${k}">${l}</span>`).join('')}</div>`}`;
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
  const t = club().t; if (!gespeeldeRondes(t) || !(S.ss.res[t][S.ronde])) return '';
  return `<div class="krantblok"><span class="label">Ook gespeeld · speelronde ${S.ronde + 1}</span>${vUitslagen(t, S.ronde, true)}</div>`;
}
export function vNieuwsKaart(){
  const l = (S.nieuws || []).slice(0, 4); if (!l.length) return '';
  return `<div class="kaart"><h3>Laatste nieuws</h3><div class="nieuwslijst">${l.map(n => `<div><span class="niv">${esc(n.bron)} · ${esc(n.wanneer)}</span><b>${esc(n.kop)}</b></div>`).join('')}</div></div>`;
}
