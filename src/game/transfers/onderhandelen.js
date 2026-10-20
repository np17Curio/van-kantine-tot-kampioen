import { S, mod, ovr, tmp, waarde } from '../../core/state.js';
import { knop } from '../../core/ui.js';
import { clamp, esc, geldTxt, rnd } from '../../core/utils.js';
import { AGENT } from '../../data/gegevens.js';
import { statusNiveau } from '../speler/status.js';
import { clubInfo, okey } from './buitenland.js';

/* ===================== Contract onderhandelen ===================== */
export const OH_SAL = [[0, 'Zoals geboden', 0], [.1, '+10%', .1], [.25, '+25%', .28], [.5, '+50%', .55]];
export const OH_TEKEN = [[0, 'Geen', 0], [.1, 'Klein', .08], [.3, 'Groot', .22]];
export function ohStart(o){ tmp.oh = {club:o.club, key:okey(o), verl:!!o.verlenging, sal:0, teken:0, jaren:o.jaren, clausule:false}; S.venster.melding = null; }
export const clausuleBedrag = () => Math.max(100000, Math.round(waarde(S.sp) * 1.8 / 100000) * 100000);
export function ohKans(o, x){
  const sp = S.sp, c = clubInfo(o);
  let k = .92 - OH_SAL[x.sal][2] - OH_TEKEN[x.teken][2] - (x.clausule ? (c.t === 1 && c.s >= 80 ? .2 : .12) : 0);
  const dj = x.jaren - o.jaren; if (dj > 0) k -= dj * (sp.leeftijd >= 30 ? .15 : .04); else if (dj < 0) k -= -dj * .05;
  k += clamp((ovr(sp) - c.s) * .01, -.1, .15); // ben je beter dan de club, dan willen ze je graag
  k += .08; // je zaakwaarnemer onderhandelt mee
  if (o.verlenging) k += statusNiveau() * .03;
  else if (S.venster && S.venster.bods.length >= 2) k += .05; // er zijn meer clubs: dat geeft je een sterke positie
  return clamp(k, .05, .95);
}
export const ohLabel = k => k >= .7 ? ['hoog', 'r-veilig'] : k >= .4 ? ['gemiddeld', 'r-gem'] : ['laag', 'r-riskant'];
export function ohVoorstel(o){
  const x = tmp.oh, V = S.venster, c = clubInfo(o); if (!x || x.key !== okey(o)) return;
  const k = ohKans(o, x);
  o.pogingen = (o.pogingen || 0) + 1;
  if (rnd() < k){
    o.salaris = Math.round(o.salaris * (1 + OH_SAL[x.sal][0]) / 100) * 100;
    o.tekengeld = x.teken ? Math.round(o.salaris * OH_TEKEN[x.teken][0] / 100) * 100 : 0;
    o.jaren = x.jaren; o.clausule = x.clausule ? clausuleBedrag() : null; o.akkoord = true; o.gevraagd = true; tmp.oh = null;
    V.melding = `${c.n} gaat akkoord! ${geldTxt(o.salaris)} per jaar, ${o.jaren} jaar${o.tekengeld ? `, ${geldTxt(o.tekengeld)} tekengeld` : ''}${o.clausule ? `, afkoopclausule ${geldTxt(o.clausule)}` : ''}. Je moet nog wel tekenen.`;
    return;
  }
  if (!o.verlenging && (o.pogingen >= 2 || (k < .3 && rnd() < .5))){ V.bods = V.bods.filter(b => b !== o); tmp.oh = null; V.melding = `${c.n} vindt je eisen veel te hoog en trekt het bod in.`; return; }
  if (o.verlenging && o.pogingen >= 2){ o.gevraagd = true; tmp.oh = null; mod('vert', -3); V.melding = `${c.n} blijft bij het eerste voorstel. Verder praten heeft geen zin. De trainer vindt je wel een beetje hebberig (vertrouwen −3).`; return; }
  V.melding = `${c.n} gaat niet akkoord met dit voorstel. Je mag nog één voorstel doen. Misschien iets minder vragen?`;
}
export function vOnderhandel(o){
  const x = tmp.oh, k = ohKans(o, x), [lab, cls] = ohLabel(k), sal = Math.round(o.salaris * (1 + OH_SAL[x.sal][0]) / 100) * 100;
  const rij = (titel, opties, cur, zet) => `<div style="display:grid;gap:4px"><span class="label">${titel}</span><div class="rij" style="gap:6px;flex-wrap:wrap">${opties.map((t, i) => knop(t, () => zet(i), cur === i ? 'klein aan' : 'klein', 'data-blijf')).join('')}</div></div>`;
  return `<div class="paneel" id="ohPanel" style="gap:10px"><span class="label">Onderhandelen met ${esc(clubInfo(o).n)}${o.pogingen ? ' · laatste kans' : ''}</span>
    ${rij(`Salaris · ${geldTxt(sal)} per jaar`, OH_SAL.map(v => v[1]), x.sal, i => { x.sal = i; })}
    ${rij(`Tekengeld · ${x.teken ? geldTxt(Math.round(sal * OH_TEKEN[x.teken][0] / 100) * 100) + ' in één keer' : 'geen'}`, OH_TEKEN.map(v => v[1]), x.teken, i => { x.teken = i; })}
    ${rij(`Contractduur · zij bieden ${o.jaren} jaar`, [1, 2, 3, 4, 5].map(j => `${j} jaar`), x.jaren - 1, i => { x.jaren = i + 1; })}
    ${rij(`Afkoopclausule${x.clausule ? ` · ${geldTxt(clausuleBedrag())}` : ''}`, ['Nee', 'Ja'], x.clausule ? 1 : 0, i => { x.clausule = i === 1; })}
    <p class="muted klein-tekst">Met een afkoopclausule mag je altijd weg als een andere club dat bedrag betaalt. Je club kan dan geen nee zeggen.${S.sp.leeftijd >= 30 ? ' Let op: op jouw leeftijd geven clubs niet graag lange contracten.' : ''}</p>
    <p>Kans dat ze akkoord gaan: <span class="risico ${cls}" style="white-space:nowrap">${lab} · ${Math.round(k * 100)}%</span></p>
    <p class="muted klein-tekst">Je zaakwaarnemer ${AGENT} onderhandelt mee. Dat helpt.</p>
    <div class="rij">${knop('Voorstel doen', () => ohVoorstel(o), 'hoofd middel', 'data-blijf')}${knop('Annuleren', () => { tmp.oh = null; }, 'klein', 'data-blijf')}</div></div>`;
}
