import { S, tmp } from '../../core/state.js';
import { knop } from '../../core/ui.js';
import { esc } from '../../core/utils.js';
import { CLUBS, DIVS, LAAGSTE } from '../../data/gegevens.js';
import { thuisLand } from '../../data/landen.js';
import { clubLogo } from '../../data/logos.js';
import { ACHTERNAMEN, VOORL, stand } from '../competitie/spelers.js';
import { ck } from '../transfers/buitenland.js';

/* ===================== Clubhistorie ===================== */
// Elke club heeft een geschiedenis: een prijzenkast, een topscorer aller tijden, een recordspeler en legendes.
// Die wordt één keer gemaakt (vast per clubnaam, met een eigen dobbelsteen) en bewaard in S.historie[naam];
// daarna komen de echte prijzen uit het spel erbij. De records kun jij breken (records.js).
export const PRIJZEN = [['titel', 'Landstitels'], ['beker', 'Nationale bekers'], ['cl', 'Champions League'], ['eur', 'Europa Cup'], ['div2', 'Kampioen tweede league']];
const prijsNaam = k => k === 'titel' ? `Landstitels (${DIVS[1]})` : k === 'div2' ? `Kampioen ${DIVS[LAAGSTE]}` : PRIJZEN.find(p => p[0] === k)[1];
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
  legendes.forEach(x => { x.typ = pickR(r, TYPERING[x.pos]); });
  legendes.sort((a, b) => a.p[0] - b.p[0]);
  return {opgericht, prijzen, top, recW, legendes};
}
const pickR = (r, l) => l[Math.floor(r() * l.length)];

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
  const B = S.ss.bekers || {};
  if (B.nat) zet(B.nat.winnaar, 'beker');
  if (B.cl) zet(B.cl.winnaar, 'cl');
  if (B.eur) zet(B.eur.winnaar, 'eur');
}

// Jij bij deze club: goals en wedstrijden (records.js) en of je er een legende bent
export function jijBij(id){
  const R = S.car && S.car.rec, ky = ck(id), c = CLUBS[id];
  const g = (R && R.clubG && R.clubG[ky]) || 0, w = (R && R.clubW && R.clubW[ky]) ?? (id === S.sp.club ? S.sp.clubWed || 0 : 0);
  const legende = (S.car.prijzen || []).includes(`Clublegende van ${c.n}`) || (id === S.sp.club && S.sp.legendeHier);
  return {g, w, legende:legende || g >= 50 || w >= 150};
}

/* ---------- Het tabblad Historie ---------- */
// Clubs om te bekijken: jouw club, dan de league(s) van jouw land
const clubLijst = () => { const l = [...stand(1), ...stand(LAAGSTE)]; if (S.sp && !S.sp.clubloos && !l.includes(S.sp.club)) l.unshift(S.sp.club); return l; };
// Klik op een club (bijvoorbeeld in de stand): open zijn historie
export const historieKnop = (id, inhoud) => knop(inhoud, () => { tmp.zijTab = 'historie'; tmp.histClub = id; }, 'linkknop', `data-blijf title="Bekijk de historie van ${esc(CLUBS[id].n)}"`);

export function vHistorie(){
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
  const leg = H.legendes.map(x => `<li><b>${esc(x.n)}</b> <span class="muted">(${x.pos}, ${x.p[0]}–${x.p[1]})</span><br><span class="klein-tekst">${x.w} wed · ${x.g} goals · <i>${esc(x.typ)}</i></span></li>`);
  if (jij.legende) leg.push(`<li class="mij"><b>${naam}</b> <span class="muted">(jij)</span><br><span class="klein-tekst">${jij.w} wed · ${jij.g} goals · <i>${jij.g > H.top.g ? 'de topscorer aller tijden' : 'een legende van nu'}</i></span></li>`);
  const E = (S.erelijst && S.erelijst[thuisLand()]) || {}, ere = c.t >= 1 ? (E[c.t] || []).slice(-6).reverse() : [];
  return `<div class="kaart historie">${nav}
    <div class="histkop">${clubLogo(id, 44)}<div><h3>${esc(c.n)}</h3><div class="muted klein-tekst">Opgericht in ${H.opgericht} · ${c.t >= 0 ? esc(DIVS[c.t]) : ''}</div></div></div>
    <span class="label">Prijzenkast</span>${kast || '<p class="muted klein-tekst">Nog geen grote prijzen. De eerste kan van jou zijn!</p>'}
    ${record('Topscorer aller tijden', H.top, H.top.g, 'goals', jij.g)}
    ${record('Meeste wedstrijden', H.recW, H.recW.w, 'wedstrijden', jij.w)}
    <span class="label">Legendes</span><ul class="histleg">${leg.join('')}</ul>
    ${ere.length ? `<span class="label">Laatste kampioenen ${esc(DIVS[c.t])}</span>${ere.map(x => rij(jaarTxt(x.j), `${x.n === c.n ? '<b>' : ''}${esc(x.n)}${x.n === c.n ? '</b>' : ''}`)).join('')}` : ''}
  </div>`;
}
