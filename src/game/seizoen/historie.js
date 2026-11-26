import { S, tmp } from '../../core/state.js';
import { knop } from '../../core/ui.js';
import { esc } from '../../core/utils.js';
import { CLUBS, DIVS, LAAGSTE } from '../../data/gegevens.js';
import { thuisLand, cupNaam } from '../../data/landen.js';
import { clubLogo } from '../../data/logos.js';
import { ACHTERNAMEN, VOORL, stand } from '../competitie/spelers.js';
import { ck } from '../transfers/buitenland.js';
import { metVoorletter, ranglijst } from '../media/nieuws.js';

/* ===================== Clubhistorie ===================== */
// Elke club heeft een geschiedenis: een prijzenkast, een topscorer aller tijden, een recordspeler en legendes.
// Die wordt één keer gemaakt (vast per clubnaam, met een eigen dobbelsteen) en bewaard in S.historie[naam];
// daarna komen de echte prijzen uit het spel erbij. De records kun jij breken (records.js).
export const PRIJZEN = [['titel', 'Landstitels'], ['beker', 'Nationale bekers'], ['cl', 'Champions League'], ['eur', 'Europa Cup'], ['div2', 'Kampioen tweede league']];
const prijsNaam = k => k === 'cl' || k === 'eur' ? cupNaam(k) : k === 'titel' ? `Landstitels (${DIVS[1]})` : k === 'div2' ? `Kampioen ${DIVS[LAAGSTE]}` : PRIJZEN.find(p => p[0] === k)[1];
const TYPERING = {K:['de keeper met de gouden handen', 'de held van de penalty’s'], V:['de ijzeren verdediger', 'de beste aanvoerder ooit', 'de rots in de branding'], M:['de regisseur', 'het hart van het middenveld', 'de man van de assists'], A:['de koning van het strafschopgebied', 'de snelste spits ooit', 'de held van de bekerfinale']};
export const jaarTxt = j => `${j}/${String((j + 1) % 100).padStart(2, '0')}`;

// Een vaste dobbelsteen per clubnaam (dezelfde club krijgt altijd dezelfde geschiedenis)
function dobbel(tekst){
  let h = 2166136261; for (let i = 0; i < tekst.length; i++){ h ^= tekst.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = (h + 0x6D2B79F5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// Het clubrecord (meeste goals ooit): zelfde schaal als vroeger (records.js), hoger bij een grotere club
const recordGoals = (r, t) => Math.round(30 + r() * 29 + (5 - Math.min(Math.max(t, 0), 5)) * 12);

function maak(id){
  const c = CLUBS[id], r = dobbel(c.n), t = c.t, s = c.s || 55, nu = S.jaar || 2026;
  const int = (a, b) => a + Math.floor(r() * (b - a + 1)), naam = () => `${VOORL[int(0, VOORL.length - 1)]}. ${ACHTERNAMEN[int(0, ACHTERNAMEN.length - 1)]}`;
  const opgericht = int(1880, 1960);
  // Hoe groot is de club: de elite is wereldtop, een topclub met een hoge sterkte heeft veel gewonnen, een kleine club weinig
  const p = t === LAAGSTE ? Math.max(0, Math.min(1, (s - 50) / 20)) * .2 : Math.max(0, Math.min(1, (s - 62) / 22)); // (buitenlandse topclubs: niveau -1, op sterkte)
  const jaren = n => { const l = new Set(); let poging = 0; while (l.size < n && poging++ < 500) l.add(int(opgericht + 12, nu - 1)); return [...l].sort((a, b) => a - b); };
  const titel = Math.round(p ** 1.7 * (t < 1 ? 32 : 19) * (.7 + r() * .6)), beker = Math.round(titel * .55 + p * int(0, 6));
  const cl = s >= 79 && t < 1 ? int(2, 9) : p > .75 ? int(0, 2) : 0, eur = p > .45 ? int(0, 3) : 0, div2 = t < 1 ? 0 : int(0, p > .6 ? 2 : 6);
  const prijzen = {titel:jaren(titel), beker:jaren(beker), cl:jaren(cl), eur:jaren(eur), div2:jaren(div2)};
  // De topscorer aller tijden: in oude opslag bestaat het record al (R.clubRec), dat getal houden we aan
  const oud = S.car && S.car.rec && S.car.rec.clubRec && S.car.rec.clubRec[ck(id)];
  const periode = lengte => { const van = int(opgericht + 10, nu - lengte - 3); return [van, van + lengte]; };
  const top = {n:naam(), pos:'A', g:oud ?? recordGoals(r, t), p:periode(int(9, 15))};
  top.w = Math.round(top.g * (2.2 + r() * .8));
  const recW = {n:naam(), pos:pickR(r, ['V', 'M', 'K']), w:int(330, 560), p:periode(int(14, 19))};
  recW.g = recW.pos === 'K' ? 0 : Math.round(recW.w * (recW.pos === 'M' ? .12 : .05));
  const legendes = [{...top}, {...recW}];
  for (const pos of ['M', 'V']){ const w = int(180, 420); legendes.push({n:naam(), pos, w, g:Math.round(w * (pos === 'M' ? .15 : .04) * (.6 + r() * .8)), p:periode(int(7, 13))}); }
  legendes.forEach(x => { x.typ = pickR(r, TYPERING[x.pos]); legendeAssists(x); });
  legendes.sort((a, b) => a.p[0] - b.p[0]);
  return {opgericht, prijzen, top, recW, legendes};
}
const pickR = (r, l) => l[Math.floor(r() * l.length)];
// Assists van een legende (en de nul voor een keeper). Oude opslag had ze nog niet: dan nu één keer bepalen, vast per naam.
// De man van de assists geeft er veel meer dan hij scoort; een regisseur ook een hoop
const ASSIST_PER_WED = {A:.14, M:.2, V:.05};
function legendeAssists(x){
  if (x.a != null) return x.a;
  const r = dobbel(x.n + '|a'), f = .75 + r() * .5;
  if (x.pos === 'K'){ x.nul = x.nul ?? Math.round(x.w * (.28 + r() * .1)); return x.a = 0; }
  const per = /assists/.test(x.typ || '') ? .38 : /regisseur/.test(x.typ || '') ? .3 : ASSIST_PER_WED[x.pos] || .1;
  return x.a = Math.round(x.w * per * f);
}
// Het assistrecord van een club (ook voor oude opslag: één keer bepalen, vast per clubnaam). Is er een legende die
// "de man van de assists" is, dan is hij de recordhouder; anders een middenvelder uit de oude doos
function assistRecord(H, c){
  if (H.recA) return H.recA;
  const r = dobbel(c.n + '|assists'), man = H.legendes.find(x => /assists/.test(x.typ || ''));
  const a = Math.max(man ? legendeAssists(man) : 0, Math.round(H.top.g * (.8 + r() * .35)));
  if (man){ man.a = a; return H.recA = {n:man.n, pos:'M', a, p:man.p}; }
  const van = Math.floor(H.opgericht + 15 + r() * Math.max(1, (S.jaar || 2026) - H.opgericht - 35));
  return H.recA = {n:`${VOORL[Math.floor(r() * VOORL.length)]}. ${ACHTERNAMEN[Math.floor(r() * ACHTERNAMEN.length)]}`, pos:'M', a, p:[van, van + 9 + Math.floor(r() * 6)]};
}
const legendeRegel = x => x.pos === 'K' ? `${x.w} wed · ${(legendeAssists(x), x.nul)} keer de nul` : `${x.w} wed · ${x.g} goals · ${legendeAssists(x)} assists`;

export function historie(id){
  const c = CLUBS[id]; if (!c) return null;
  const H = S.historie = S.historie || {};
  return H[c.n] || (H[c.n] = maak(id));
}
// Het record van een club voor de records (records.js)
export const clubRecordVan = id => historie(id).top.g;
export const recordWedVan = id => historie(id).recW.w;

// Einde seizoen (vóór promotie/degradatie): de echte kampioenen en bekerwinnaars gaan in de prijzenkast, en in de erelijst van de league
export function historieSeizoen(){
  const j = S.jaar, land = thuisLand(), E = (S.erelijst = S.erelijst || {})[land] = (S.erelijst || {})[land] || {};
  const zet = (id, k) => { if (id == null || !CLUBS[id]) return; const l = historie(id).prijzen[k]; if (!l.includes(j)) l.push(j); };
  for (let t = 1; t <= LAAGSTE; t++){
    const kamp = stand(t)[0]; if (kamp == null) continue;
    zet(kamp, t === 1 ? 'titel' : 'div2');
    const l = E[t] = E[t] || []; if (!l.some(x => x.j === j)) l.push({j, n:CLUBS[kamp].n}); if (l.length > 40) l.shift();
  }
  competitieSeizoen(j, land);
  const B = S.ss.bekers || {};
  if (B.nat) zet(B.nat.winnaar, 'beker');
  if (B.cl) zet(B.cl.winnaar, 'cl');
  if (B.eur) zet(B.eur.winnaar, 'eur');
}

// ---------- Competitiehistorie: per league per seizoen de kampioen, de topscorer en de assistkoning, plus de ranglijsten aller tijden ----------
// S.compHist[land][t] = {seizoenen:[{j, kamp, top:{n, c, g}, ass:{n, c, a}}], g:{naam:{n, c, g}}, a:{naam:{n, c, a}}} (vanaf het moment dat dit bijgehouden wordt)
const spelerNaam = x => x.jij ? S.sp.naam : metVoorletter(x);
const clubNaam = x => (CLUBS[x.club] || {}).n || '';
function competitieSeizoen(j, land){
  const CH = (S.compHist = S.compHist || {})[land] = (S.compHist || {})[land] || {};
  for (let t = 1; t <= LAAGSTE; t++){
    const kamp = stand(t)[0]; if (kamp == null) continue;
    const L = CH[t] = CH[t] || {seizoenen:[], g:{}, a:{}}; if (L.seizoenen.some(x => x.j === j)) continue;
    let goals = [], assists = []; try { goals = ranglijst(t, 'g'); assists = ranglijst(t, 'a'); } catch (e){}
    const top = goals[0], ass = assists[0];
    L.seizoenen.push({j, kamp:CLUBS[kamp].n, top:top && top.g ? {n:spelerNaam(top), c:clubNaam(top), g:top.g, jij:!!top.jij} : null, ass:ass && ass.a ? {n:spelerNaam(ass), c:clubNaam(ass), a:ass.a, jij:!!ass.jij} : null});
    if (L.seizoenen.length > 60) L.seizoenen.shift();
    // aller tijden: optellen per speler (de 60 besten bewaren, anders groeit je opslag elk seizoen)
    for (const [lijst, k] of [[goals, 'g'], [assists, 'a']]){
      for (const x of lijst){ if (!(x[k] > 0)) continue; const n = spelerNaam(x), sl = x.jij ? 'jij' : n + '|' + clubNaam(x), r = L[k][sl] = L[k][sl] || {n, c:'', [k]:0, jij:!!x.jij}; r[k] += x[k]; r.c = clubNaam(x); } // (sleutel: naam + club, want twee spelers kunnen dezelfde korte naam hebben)
      L[k] = Object.fromEntries(Object.entries(L[k]).sort((a, b) => b[1][k] - a[1][k]).slice(0, 60));
    }
  }
}
function vCompetitie(){
  const land = thuisLand(), CH = (S.compHist && S.compHist[land]) || {}, E = (S.erelijst && S.erelijst[land]) || {};
  const t = tmp.histDiv >= 1 && tmp.histDiv <= LAAGSTE ? tmp.histDiv : 1, L = CH[t] || {seizoenen:[], g:{}, a:{}};
  const tabs = `<div class="rij" style="gap:6px;flex-wrap:wrap">${Array.from({length:LAAGSTE}, (_, i) => i + 1).map(d => knop(DIVS[d], () => { tmp.histDiv = d; }, 'klein' + (d === t ? ' aan' : ''), 'data-blijf')).join('')}</div>`;
  const mij = (txt, jij) => jij ? `<b class="goedtxt">${esc(txt)}</b>` : esc(txt);
  const top = k => Object.values(L[k]).sort((a, b) => b[k] - a[k]).slice(0, 5).map((x, i) => `<div class="landrij"><div>${i + 1}. ${mij(x.n, x.jij)} <span class="muted klein-tekst">${esc(x.c)}</span></div><span class="niv"><b>${x[k]}</b></span></div>`).join('') || '<p class="muted klein-tekst">Nog niets bijgehouden.</p>';
  const titels = {}; for (const x of (E[t] || [])) titels[x.n] = (titels[x.n] || 0) + 1;
  const meesteTitels = Object.entries(titels).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, k], i) => `<div class="landrij"><div>${i + 1}. ${esc(n)}</div><span class="niv"><b>${k}×</b></span></div>`).join('');
  const seizoenen = L.seizoenen.slice().reverse().slice(0, 12).map(x => `<div class="landrij"><div><b>${jaarTxt(x.j)}</b> · 🏆 ${esc(x.kamp)}<br><span class="klein-tekst">⚽ ${x.top ? `${mij(x.top.n, x.top.jij)} (${x.top.g})` : '–'} · 🅰️ ${x.ass ? `${mij(x.ass.n, x.ass.jij)} (${x.ass.a})` : '–'}</span></div></div>`).join('');
  return `${tabs}
    <span class="label">Seizoen na seizoen</span>${seizoenen || '<p class="muted klein-tekst">Na dit seizoen staat hier de eerste kampioen, topscorer en assistkoning.</p>'}
    <span class="label">Meeste goals (sinds je begon)</span>${top('g')}
    <span class="label">Meeste assists (sinds je begon)</span>${top('a')}
    ${meesteTitels ? `<span class="label">Meeste titels</span>${meesteTitels}` : ''}`;
}
// Jij bij deze club: goals en wedstrijden (records.js) en of je er een legende bent
export function jijBij(id){
  const R = S.car && S.car.rec, ky = ck(id), c = CLUBS[id];
  // (vangnet: ook je afgesloten seizoenen bij deze club tellen, ook het deel tot de winter vóór een verhuur. Valt de sleutel
  //  in R.clubG ooit weg, zoals bij oude opslag of een verhuur naar het buitenland, dan zie je je goals toch)
  const uitSeizoenen = ((S.car && S.car.seizoenen) || []).filter(x => x.club === c.n).reduce((n, x) => n + (x.g || 0), 0);
  const g = Math.max((R && R.clubG && R.clubG[ky]) || 0, uitSeizoenen), w = (R && R.clubW && R.clubW[ky]) ?? (id === S.sp.club ? S.sp.clubWed || 0 : 0);
  const legende = (S.car.prijzen || []).includes(`Clublegende van ${c.n}`) || (id === S.sp.club && S.sp.legendeHier);
  const a = ((S.car && S.car.seizoenen) || []).filter(x => x.club === c.n).reduce((n, x) => n + (x.a || 0), 0) + (id === S.sp.club ? (S.ss && S.ss.a) || 0 : 0);
  return {g, a, w, legende:legende || g >= 50 || w >= 150};
}

/* ---------- Het tabblad Historie ---------- */
// Clubs om te bekijken: jouw club, dan de league(s) van jouw land
const clubLijst = () => { const l = [...stand(1), ...stand(LAAGSTE)]; if (S.sp && !S.sp.clubloos && !l.includes(S.sp.club)) l.unshift(S.sp.club); return l; };
// Klik op een club (bijvoorbeeld in de stand): open zijn historie
export const historieKnop = (id, inhoud) => knop(inhoud, () => { tmp.zijTab = 'historie'; tmp.histClub = id; }, 'linkknop', `data-blijf title="Bekijk de historie van ${esc(CLUBS[id].n)}"`);

export function vHistorie(){
  // twee delen: de historie van een club, of die van de competitie (kampioenen, topscorers, assistkoningen)
  const modus = tmp.histModus === 'comp' ? 'comp' : 'club';
  const keuze = `<div class="rij" style="gap:6px;margin-bottom:8px">${knop('Clubs', () => { tmp.histModus = 'club'; }, 'klein' + (modus === 'club' ? ' aan' : ''), 'data-blijf')}${knop('Competitie', () => { tmp.histModus = 'comp'; }, 'klein' + (modus === 'comp' ? ' aan' : ''), 'data-blijf')}</div>`;
  if (modus === 'comp') return `<div class="kaart historie">${keuze}${vCompetitie()}</div>`;
  return vClubHistorie(keuze);
}
function vClubHistorie(keuze){
  const lijst = clubLijst(), eigen = S.sp && !S.sp.clubloos ? S.sp.club : lijst[0];
  const id = lijst.includes(tmp.histClub) ? tmp.histClub : eigen, i = lijst.indexOf(id), c = CLUBS[id], H = historie(id), sp = S.sp;
  const jij = jijBij(id), mijn = id === sp.club && !sp.clubloos, naam = esc(sp.naam);
  const nav = `<div class="rondenav">${knop('‹', () => { tmp.histClub = lijst[(i - 1 + lijst.length) % lijst.length]; }, 'klein', 'data-blijf aria-label="Vorige club"')}<span>${i + 1} / ${lijst.length}</span>${knop('›', () => { tmp.histClub = lijst[(i + 1) % lijst.length]; }, 'klein', 'data-blijf aria-label="Volgende club"')}${mijn ? '' : knop('Mijn club', () => { tmp.histClub = eigen; }, 'klein', 'data-blijf')}</div>`;
  const rij = (l, w) => `<div class="landrij"><div>${l}</div><span class="niv">${w}</span></div>`;
  const kast = PRIJZEN.map(([k]) => [k, H.prijzen[k]]).filter(([, l]) => l.length).map(([k, l]) => rij(`🏆 ${esc(prijsNaam(k))}`, `<b>${l.length}×</b> <span class="muted klein-tekst">${l.slice(-3).reverse().map(jaarTxt).join(', ')}</span>`)).join('');
  // Een record: de houder, en bij jouw club(s) hoe ver jij bent
  const record = (titel, houder, waarde, eenheid, jijW) => {
    const gebroken = jijW > waarde, pct = Math.min(100, Math.round(jijW / waarde * 100));
    return `<div class="histrecord"><span class="label">${titel}</span>
      ${gebroken ? `<p><b class="goedtxt">${naam}</b> · ${jijW} ${eenheid} <span class="muted klein-tekst">(daarvoor ${esc(houder.n)}, ${waarde})</span></p>`
        : `<p><b>${esc(houder.n)}</b> · ${waarde} ${eenheid} <span class="muted klein-tekst">(${houder.p[0]}–${houder.p[1]})</span></p>`}
      ${jijW > 0 || mijn ? `<div class="balk"><span>Jij</span><span class="b"><i style="width:${pct}%"></i></span><span>${jijW}</span></div>
      <p class="muted klein-tekst">${gebroken ? 'Het record is van jou!' : `Nog ${waarde - jijW + 1} ${eenheid} om het record te breken.`}</p>` : ''}</div>`;
  };
  const leg = H.legendes.map(x => `<li><b>${esc(x.n)}</b> <span class="muted">(${x.pos}, ${x.p[0]}–${x.p[1]})</span><br><span class="klein-tekst">${legendeRegel(x)} · <i>${esc(x.typ)}</i></span></li>`);
  if (jij.legende) leg.push(`<li class="mij"><b>${naam}</b> <span class="muted">(jij)</span><br><span class="klein-tekst">${jij.w} wed · ${jij.g} goals · ${jij.a} assists · <i>${jij.g > H.top.g ? 'de topscorer aller tijden' : sp.pos === 'MID' && jij.a > assistRecord(H, c).a ? 'de assistkoning aller tijden' : 'een legende van nu'}</i></span></li>`);
  const E = (S.erelijst && S.erelijst[thuisLand()]) || {}, ere = c.t >= 1 ? (E[c.t] || []).slice(-6).reverse() : [];
  return `<div class="kaart historie">${keuze}${nav}
    <div class="histkop">${clubLogo(id, 44)}<div><h3>${esc(c.n)}</h3><div class="muted klein-tekst">Opgericht in ${H.opgericht} · ${c.t >= 0 ? esc(DIVS[c.t]) : ''}</div></div></div>
    <span class="label">Prijzenkast</span>${kast || '<p class="muted klein-tekst">Nog geen grote prijzen. De eerste kan van jou zijn!</p>'}
    ${sp.pos === 'MID' ? record('Meeste assists', assistRecord(H, c), assistRecord(H, c).a, 'assists', jij.a) : record('Topscorer aller tijden', H.top, H.top.g, 'goals', jij.g)}
    ${record('Meeste wedstrijden', H.recW, H.recW.w, 'wedstrijden', jij.w)}
    <span class="label">Legendes</span><ul class="histleg">${leg.join('')}</ul>
    ${ere.length ? `<span class="label">Laatste kampioenen ${esc(DIVS[c.t])}</span>${ere.map(x => rij(jaarTxt(x.j), `${x.n === c.n ? '<b>' : ''}${esc(x.n)}${x.n === c.n ? '</b>' : ''}`)).join('')}` : ''}
  </div>`;
}
