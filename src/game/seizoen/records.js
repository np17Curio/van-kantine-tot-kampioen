import { S, club, mod, seizoenLabel } from '../../core/state.js';
import { esc } from '../../core/utils.js';
import { CLUBS, DIVS, LAAGSTE, WERELD, rondesVan } from '../../data/gegevens.js';
import { thuisLand } from '../../data/landen.js';
import { metVoorletter, ranglijst } from '../media/nieuws.js';
import { krantMelding } from '../media/roddel.js';
import { ck } from '../transfers/buitenland.js';
import { modFans } from '../wedstrijd/fans-pers.js';
import { clubRecordVan, historie, recordWedVan } from './historie.js';
import { ik, team } from '../../core/geslacht.js';

/* ===================== Records ===================== */
// Competitierecords per league (meeste goals in één seizoen) en een clubrecord (meeste goals ooit voor de club).
// Elke league (per land, en apart bij de vrouwen) heeft een eigen record. Het begint als een historisch record dat past bij het aantal
// speelrondes (ongeveer 0,8 goal per ronde), en wie het breekt (jij, of de topscorer aan het einde van een seizoen) wordt de nieuwe houder.
const recSleutel = (t, land) => `${WERELD}|${land}|${t}`;
export function compRecord(t, land = thuisLand()){
  const R = S.compRec = S.compRec || {}, k = recSleutel(t, land);
  if (!R[k]){ let h = 7; for (const ch of k) h = (h * 31 + ch.charCodeAt(0)) % 1000003;
    R[k] = {g:Math.max(12, Math.round(rondesVan(t) * .8) + h % 4), n:null, club:null, s:null}; }
  return R[k];
}
const oudRecord = r => r.n ? `${r.g}, van ${r.n}${r.s ? ` in ${r.s}` : ''}` : `${r.g}`;
// Aan het einde van het seizoen: haalde de topscorer van een league meer dan het record? Dan is het record van hem/haar
export function recordsSeizoenEinde(){
  const t0 = club().t, uit = [];
  for (let t = 1; t <= LAAGSTE; t++){
    const top = ranglijst(t, 'g')[0], r = compRecord(t); if (!top || top.jij || top.g <= r.g) continue;
    const oud = oudRecord(r); Object.assign(r, {g:top.g, n:metVoorletter(top), club:CLUBS[top.club].n, s:seizoenLabel()});
    if (t === t0) uit.push({kop:`${r.n} schrijft geschiedenis in de ${DIVS[t]}`, tekst:`Met ${r.g} goals breekt de ${r.club}-${team.spits} het competitierecord (${oud}).`});
  }
  for (const k of uit) krantMelding(k.kop, k.tekst);
}
// Oude opslag (een vast record van 16 tot 19 goals): een "record" dat onder het echte record ligt, telt niet. Eenmalig bij het laden
export function herstelRecords(){
  if (!S || !S.sp || S.recV2) return; S.recV2 = true;
  const R = S.car && S.car.rec, nep = [];
  for (let t = 1; t <= LAAGSTE; t++){ const r = compRecord(t), voor = `Competitierecord ${DIVS[t]} `;
    for (const p of S.car.prijzen){ const m = p.startsWith(voor) && /^(\S+) \((\d+) goals\)$/.exec(p.slice(voor.length)); if (m && +m[2] <= r.g) nep.push({p, s:m[1], t}); } }
  if (!nep.length) return;
  S.car.prijzen = S.car.prijzen.filter(p => !nep.some(x => x.p === p));
  if (R && R.gebroken) R.gebroken = R.gebroken.filter(p => !nep.some(x => x.p === p));
  const kop = k => !(k && /breekt het record van de/.test(k.kop || ''));
  S.krantWacht = (S.krantWacht || []).filter(kop); S.nieuws = (S.nieuws || []).filter(kop);
  if (nep.some(x => x.s === seizoenLabel())){ S.ss.recDiv = false; mod('rep', -5); }
}
// Het clubrecord komt uit de clubhistorie (historie.js): daar staat ook wie het nu heeft
export const clubRecord = id => clubRecordVan(id);
export const recs = () => S.car.rec || (S.car.rec = {seizoen:{v:0}, wed:{v:0}, reeks:{v:0}, nu:0, hattricks:0, assistSeizoen:{v:0}, debuut: S.car.wed > 1 ? {lft:null} : null, clubG:{}, gebroken:[]});
// Jouw goals in de competitie van divisie t dit seizoen (zoals in de topscorerslijst: per club, en leeg na een landwissel)
export const competitieGoals = t => Object.values(S.ss.st || {}).reduce((n, x) => n + (x.jij && CLUBS[x.club] && CLUBS[x.club].t === t ? x.g : 0), 0);
export function recordsNaWedstrijd(M){
  const R = recs(), sp = S.sp, c = club(), naam = sp.naam, t = c.t, uit = [], zij = M.zij ?? (M.opp !== undefined ? CLUBS[M.opp].n : '');
  if (R.debuut === null){ R.debuut = {lft:sp.leeftijd, club:c.n, s:seizoenLabel()}; }
  // Doelpunten in één wedstrijd
  if (M.goals >= 3){ R.hattricks++; if (R.hattricks > 1) uit.push(`Hattrick nummer ${R.hattricks} in je carrière!`); }
  if (M.goals > R.wed.v){ const was = R.wed.v; R.wed = {v:M.goals, tegen:zij, s:seizoenLabel()}; if (M.goals >= 3 && was >= 2) uit.push(`Persoonlijk record: ${M.goals} goals in één wedstrijd!`); }
  // Reeks wedstrijden op rij met een goal
  R.nu = M.goals > 0 ? R.nu + 1 : 0;
  if (R.nu > R.reeks.v){ R.reeks = {v:R.nu, s:seizoenLabel()}; if (R.nu >= 4) uit.push(`Persoonlijk record: ${R.nu} wedstrijden op rij gescoord!`); }
  // Goals en assists in dit seizoen (competitie + beker)
  const g = S.ss.g + (S.ss.bg || 0), a = S.ss.a + (S.ss.ba || 0);
  if (g > R.seizoen.v){ const was = R.seizoen.v; R.seizoen = {v:g, s:seizoenLabel(), club:c.n}; if (was >= 5 && !S.ss.recSeizoen){ S.ss.recSeizoen = true; uit.push(`Nieuw persoonlijk record: dit is je beste seizoen ooit qua goals (al ${g})!`); } }
  if (a > R.assistSeizoen.v) R.assistSeizoen = {v:a, s:seizoenLabel()};
  // Clubrecord: meeste goals ooit voor deze club
  const ky = ck(sp.club); (R.clubN = R.clubN || {})[ky] = c.n; (R.clubRec = R.clubRec || {})[ky] = R.clubRec[ky] ?? clubRecord(sp.club);
  const cg = R.clubG[ky] = (R.clubG[ky] || 0) + M.goals, cr = R.clubRec[ky];
  const oudHouder = historie(sp.club).top.n;
  if (M.goals && cg > cr && cg - M.goals <= cr){ const p = `Clubtopscorer aller tijden van ${c.n} (${cg} goals)`; R.gebroken.push(p); S.car.prijzen.push(p); S.car.hist.push(`${seizoenLabel()}: clubtopscorer aller tijden van ${c.n}`); mod('rep', 4); modFans(10);
    uit.push(`CLUBRECORD! Met ${cg} goals ben jij de topscorer aller tijden van ${c.n}. Je passeert clublegende ${oudHouder} (${cr}).`); krantMelding(`${naam} is de topscorer aller tijden van ${c.n}`, `Met ${cg} doelpunten breekt ${ik.hij} het clubrecord van ${oudHouder}, dat op ${cr} goals stond. Het stadion gaat staan.`); }
  // Recordspeler: meeste wedstrijden ooit voor deze club (oude opslag: begint bij je wedstrijden nu)
  const cw = (R.clubW = R.clubW || {})[ky] = (R.clubW[ky] ?? Math.max(0, (sp.clubWed || 1) - 1)) + 1, rw = recordWedVan(sp.club);
  if (cw === rw + 1){ const h = historie(sp.club).recW.n, p = `Recordspeler van ${c.n} (${cw} wedstrijden)`; R.gebroken.push(p); S.car.prijzen.push(p); S.car.hist.push(`${seizoenLabel()}: recordspeler van ${c.n}`); mod('rep', 3); modFans(8);
    uit.push(`CLUBRECORD! Wedstrijd nummer ${cw}: niemand speelde ooit vaker voor ${c.n}. Je passeert ${h} (${rw}).`); krantMelding(`${naam} is de recordspeler van ${c.n}`, `Met ${cw} wedstrijden passeert ${ik.hij} ${h}. Voor de aftrap krijgt ${ik.hij} bloemen en een ingelijst shirt.`); }
  // Competitierecord: meeste goals in één seizoen in deze divisie (alleen competitie)
  // (alleen je goals in deze competitie: na een overstap in de winter tellen je goals in een andere league niet mee)
  const cG = competitieGoals(t);
  const cr = compRecord(t);
  if (!M.beker && cG > cr.g && cG - M.goals <= cr.g && !S.ss.recDiv){ S.ss.recDiv = true; const oud = oudRecord(cr); Object.assign(cr, {g:cG, n:naam, club:c.n, s:seizoenLabel(), jij:true}); const p = `Competitierecord ${DIVS[t]} ${seizoenLabel()} (${cG} goals)`; R.gebroken.push(p); S.car.prijzen.push(p); mod('rep', 5);
    uit.push(`COMPETITIERECORD! ${cG} goals in één seizoen: nooit eerder scoorde iemand zo vaak in de ${DIVS[t]}.`); krantMelding(`Historisch: ${naam} breekt het record van de ${DIVS[t]}`, `Doelpunt nummer ${cG} in de ${DIVS[t]} dit seizoen. Het oude record (${oud}) is gebroken.`); }
  M.recordTekst = uit.length ? uit : null;
}
export function vRecords(){
  const R = S.car.rec; if (!R) return '';
  const r = (l, w) => `<div class="landrij"><div>${l}</div><span class="niv">${w}</span></div>`;
  const cl = Object.entries(R.clubG).filter(([, g]) => g > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return `<div class="paneel"><span class="label">Records</span>
    ${r('Meeste goals in één seizoen', R.seizoen.v ? `${R.seizoen.v} <span class="muted">(${esc(R.seizoen.s)})</span>` : '–')}
    ${r('Meeste assists in één seizoen', R.assistSeizoen.v ? `${R.assistSeizoen.v} <span class="muted">(${esc(R.assistSeizoen.s)})</span>` : '–')}
    ${r('Meeste goals in één wedstrijd', R.wed.v ? `${R.wed.v} <span class="muted">(tegen ${esc(R.wed.tegen)})</span>` : '–')}
    ${r('Langste reeks met een goal', R.reeks.v ? `${R.reeks.v} ${R.reeks.v === 1 ? 'wedstrijd' : 'wedstrijden op rij'}` : '–')}
    ${r('Hattricks', R.hattricks)}
    ${r('Debuut in een 1e elftal', R.debuut && R.debuut.lft ? `${R.debuut.lft} jaar <span class="muted">(${esc(R.debuut.club)})</span>` : '–')}
    ${S.car.derby ? r("Goals in derby's", S.car.derby.goals) : ''}
    ${S.car.tegenOud ? r('Goals tegen je oude clubs', Object.values(S.car.tegenOud).reduce((a, x) => a + x.goals, 0)) : ''}
    ${cl.map(([id, g]) => { const nm = (R.clubN || {})[id] || (CLUBS[id] || {}).n || '', H = S.historie && S.historie[nm], cr = (R.clubRec || {})[id] ?? (H ? H.top.g : clubRecord(+id)); return r(`Goals voor ${esc(nm)}`, g > cr ? `${g} <span class="goedtxt">· het clubrecord is van jou</span>` : `${g} <span class="muted">/ clubrecord ${cr}${H ? ` (${esc(H.top.n)})` : ''}</span>`); }).join('')}
    ${R.gebroken.length ? `<div class="prijzen" style="margin-top:6px">${R.gebroken.map(p => `<span class="prijs">${esc(p)}</span>`).join('')}</div>` : ''}</div>`;
}
