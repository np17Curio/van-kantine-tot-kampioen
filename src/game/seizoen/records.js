import { S, club, mod, seizoenLabel } from '../../core/state.js';
import { esc } from '../../core/utils.js';
import { CLUBS, DIVS } from '../../data/gegevens.js';
import { krantMelding } from '../media/roddel.js';
import { ck } from '../transfers/buitenland.js';
import { modFans } from '../wedstrijd/fans-pers.js';

/* ===================== Records ===================== */
// Competitierecords per divisie (meeste goals in één seizoen) en een clubrecord (meeste goals ooit voor de club)
export const DIV_RECORD = [19, 18, 18, 18, 19, 16];
export const clubRecord = id => Math.round(30 + ((id * 37) % 30) + (5 - Math.min(CLUBS[id].t, 5)) * 12);
export const recs = () => S.car.rec || (S.car.rec = {seizoen:{v:0}, wed:{v:0}, reeks:{v:0}, nu:0, hattricks:0, assistSeizoen:{v:0}, debuut: S.car.wed > 1 ? {lft:null} : null, clubG:{}, gebroken:[]});
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
  if (M.goals && cg > cr && cg - M.goals <= cr){ const p = `Clubtopscorer aller tijden van ${c.n} (${cg} goals)`; R.gebroken.push(p); S.car.prijzen.push(p); S.car.hist.push(`${seizoenLabel()}: clubtopscorer aller tijden van ${c.n}`); mod('rep', 4); modFans(10);
    uit.push(`CLUBRECORD! Met ${cg} goals ben jij de topscorer aller tijden van ${c.n}. Het oude record stond op ${cr}.`); krantMelding(`${naam} is de topscorer aller tijden van ${c.n}`, `Met ${cg} doelpunten breekt hij het clubrecord van ${cr} goals. Het stadion gaat staan.`); }
  // Competitierecord: meeste goals in één seizoen in deze divisie (alleen competitie)
  if (!M.beker && S.ss.g > DIV_RECORD[t] && S.ss.g - M.goals <= DIV_RECORD[t] && !S.ss.recDiv){ S.ss.recDiv = true; const p = `Competitierecord ${DIVS[t]} ${seizoenLabel()} (${S.ss.g} goals)`; R.gebroken.push(p); S.car.prijzen.push(p); mod('rep', 5);
    uit.push(`COMPETITIERECORD! ${S.ss.g} goals in één seizoen: nooit eerder scoorde iemand zo vaak in de ${DIVS[t]}.`); krantMelding(`Historisch: ${naam} breekt het record van de ${DIVS[t]}`, `Doelpunt nummer ${S.ss.g} dit seizoen. Het oude record (${DIV_RECORD[t]}) stond al jaren.`); }
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
    ${cl.map(([id, g]) => { const cr = (R.clubRec || {})[id] ?? clubRecord(+id), nm = (R.clubN || {})[id] || (CLUBS[id] || {}).n || ''; return r(`Goals voor ${esc(nm)}`, g > cr ? `${g} <span class="goedtxt">· het clubrecord is van jou</span>` : `${g} <span class="muted">/ clubrecord ${cr}</span>`); }).join('')}
    ${R.gebroken.length ? `<div class="prijzen" style="margin-top:6px">${R.gebroken.map(p => `<span class="prijs">${esc(p)}</span>`).join('')}</div>` : ''}</div>`;
}
