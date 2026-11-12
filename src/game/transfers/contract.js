import { hoogtepunt } from '../speler/hoogtepunten.js';
import { S, club, gemCijfer, mod, ovr, salarisLabel, salarisVoor, seizoenLabel, tmp } from '../../core/state.js';
import { knop } from '../../core/ui.js';
import { clamp, esc, geldTxt, rnd } from '../../core/utils.js';
import { agentNaam } from './zaakwaarnemer.js';
import { krantMelding } from '../media/roddel.js';
import { statusNiveau, statusPunten } from '../speler/status.js';
import { OH_SAL, OH_TEKEN, clausuleBedrag, ohLabel } from './onderhandelen.js';
import { ik } from '../../core/geslacht.js';

/* ===================== Contract openbreken midden in het seizoen ===================== */
// Bij je eigen club om meer geld of een langer contract vragen. Hoe beter je speelt en hoe belangrijker je bent,
// hoe groter de kans dat de club ja zegt. Wie te veel vraagt, wordt hebberig gevonden.
export const CONTRACT_NA = 4, CONTRACT_WACHT = 5;
// null als het mag, anders de reden waarom niet
export function kanContractVragen(){
  const sp = S.sp, c = club();
  if (sp.o23) return 'Bij de O23 is er niets te onderhandelen. Eerst terug in de selectie.';
  if (sp.huur) return 'Je bent verhuurd. Over je contract praat je met je eigen club, na de huurperiode.';
  if (sp.transferlijst) return 'Je staat op de transferlijst. De club gaat geen nieuw contract met je bespreken.';
  if (S.ss.contractRond) return 'Je hebt dit seizoen al een nieuw contract getekend. Volgend seizoen kun je het opnieuw vragen.';
  if ((sp.clubWed || 0) < CONTRACT_NA) return `Speel eerst ${CONTRACT_NA - (sp.clubWed || 0)} ${CONTRACT_NA - (sp.clubWed || 0) === 1 ? 'wedstrijd' : 'wedstrijden'} meer voor ${c.n}. Dan heb je iets om over te praten.`;
  const wacht = (S.ss.contractWacht ?? -99) - S.ronde;
  if (wacht > 0) return `Het laatste gesprek liep niet goed. Over ${wacht} ${wacht === 1 ? 'week' : 'weken'} kun je het opnieuw proberen.`;
  return null;
}
// Waar de club mee begint
export function clubVoorstel(){
  const sp = S.sp, t = club().t, max = 4;
  return {salaris:Math.max(sp.salaris, Math.round(salarisVoor(t, ovr(sp), club().s) / 100) * 100), jaren:clamp(Math.max(sp.contract, 0) + 1, 1, max)};
}
export function contractKans(x){
  const sp = S.sp, c = club(), b = clubVoorstel(), g = gemCijfer();
  let k = .55 + Math.max(0, statusNiveau() - 1) * .06 + (g === null ? 0 : (g - 6.5) * .12) + (sp.vert - 50) / 250 + clamp((ovr(sp) - c.s) * .012, -.12, .15)
    + (sp.contract <= 1 ? .08 : 0) + .08; // je zaakwaarnemer praat mee
  k -= OH_SAL[x.sal][2] + OH_TEKEN[x.teken][2] + (x.clausule ? .12 : 0);
  const dj = x.jaren - b.jaren; if (dj > 0) k -= dj * (sp.leeftijd >= 30 ? .15 : .05); else if (dj < 0) k -= -dj * .04;
  return clamp(k, .05, .95);
}
export function contractStart(){ if (kanContractVragen()) return; const b = clubVoorstel(); tmp.contract = {sal:0, teken:0, jaren:b.jaren, clausule:false, poging:0}; S.ss.contractMelding = null; }
export function contractVoorstel(){
  const sp = S.sp, x = tmp.contract, c = club(); if (!x || kanContractVragen()) return;
  const b = clubVoorstel(), k = contractKans(x);
  x.poging++;
  if (rnd() < k){
    const sal = Math.round(b.salaris * (1 + OH_SAL[x.sal][0]) / 100) * 100, teken = x.teken ? Math.round(sal * OH_TEKEN[x.teken][0] / 100) * 100 : 0;
    sp.salaris = sal; sp.contract = x.jaren; sp.clausule = x.clausule ? {bedrag:clausuleBedrag(), club:sp.club} : null;
    if (teken) sp.geld += teken;
    mod('moraal', 6); statusPunten(1); S.ss.contractRond = true; tmp.contract = null;
    const tot = S.jaar + x.jaren;
    S.car.hist.push(`${seizoenLabel()}: nieuw contract bij ${c.n} tot ${tot} (${geldTxt(sal)} per jaar)`);
    hoogtepunt('verlenging', {club:c.n, tot}, true);
    if (c.t <= 3) krantMelding(`${sp.naam} verlengt bij ${c.n} tot ${tot}`, `De club en de speler zijn het eens over een nieuw contract.${sal > b.salaris ? ' ' + ik.Hij + ' gaat er flink op vooruit.' : ''}`);
    S.ss.contractMelding = {goed:true, t:`${c.n} gaat akkoord! Je nieuwe contract: ${geldTxt(sal)} per jaar, ${x.jaren} jaar${teken ? `, plus ${geldTxt(teken)} tekengeld` : ''}${sp.clausule ? `, met een afkoopclausule van ${geldTxt(sp.clausule.bedrag)}` : ''}.`};
    return;
  }
  if (x.poging < 2){ mod('vert', -2); S.ss.contractMelding = {goed:false, t:`${c.n} gaat niet akkoord met dit voorstel. Je mag nog één voorstel doen. Misschien iets minder vragen?`}; return; }
  const hebberig = OH_SAL[x.sal][0] >= .5 || x.teken === 2;
  mod('vert', -5); mod('moraal', -4); if (hebberig) statusPunten(-2);
  S.ss.contractWacht = S.ronde + CONTRACT_WACHT; tmp.contract = null;
  S.ss.contractMelding = {goed:false, t:`${c.n} zegt nee. Het gesprek is voorbij${hebberig ? ': de club vindt je hebberig' : ''}. Over ${CONTRACT_WACHT} weken kun je het opnieuw proberen.`};
}
export function vContract(){
  const sp = S.sp, c = club(); if (sp.huur || sp.o23) return '';
  const reden = kanContractVragen(), m = S.ss.contractMelding, x = tmp.contract;
  let h = `<section id="contractPanel" class="paneel sectie"><h3 class="sectiekop">Je contract bij ${esc(c.n)}</h3>
    <div class="rij contractfeiten" style="gap:18px;flex-wrap:wrap"><div><span class="label">${salarisLabel(c.t)}</span><b>${geldTxt(sp.salaris)}</b></div><div><span class="label">Looptijd</span><b>nog ${Math.max(sp.contract, 0)} jaar</b></div>${sp.clausule && sp.clausule.club === sp.club ? `<div><span class="label">Afkoopclausule</span><b>${geldTxt(sp.clausule.bedrag)}</b></div>` : ''}</div>`;
  if (m) h += `<p class="${m.goed ? 'goedtxt' : 'fouttxt'}">${esc(m.t)}</p>`;
  if (x && !reden){
    const b = clubVoorstel(), k = contractKans(x), [lab, cls] = ohLabel(k), sal = Math.round(b.salaris * (1 + OH_SAL[x.sal][0]) / 100) * 100;
    const rij = (titel, opties, cur, zet) => `<div style="display:grid;gap:4px"><span class="label">${titel}</span><div class="rij" style="gap:6px;flex-wrap:wrap">${opties.map((t, i) => knop(t, () => zet(i), cur === i ? 'klein aan' : 'klein', 'data-blijf')).join('')}</div></div>`;
    h += `<div class="paneel" style="gap:10px"><span class="label">Gesprek met de technisch directeur${x.poging ? ' · laatste kans' : ''}</span>
      <p class="muted klein-tekst">De club biedt ${geldTxt(b.salaris)} per jaar voor ${b.jaren} jaar. Wat vraag jij?</p>
      ${rij(`Salaris · ${geldTxt(sal)} per jaar`, OH_SAL.map(v => v[1]), x.sal, i => { x.sal = i; })}
      ${rij(`Tekengeld · ${x.teken ? geldTxt(Math.round(sal * OH_TEKEN[x.teken][0] / 100) * 100) + ' in één keer' : 'geen'}`, OH_TEKEN.map(v => v[1]), x.teken, i => { x.teken = i; })}
      ${rij(`Contractduur · zij bieden ${b.jaren} jaar`, [1, 2, 3, 4, 5].map(j => `${j} jaar`), x.jaren - 1, i => { x.jaren = i + 1; })}
      ${rij(`Afkoopclausule${x.clausule ? ` · ${geldTxt(clausuleBedrag())}` : ''}`, ['Nee', 'Ja'], x.clausule ? 1 : 0, i => { x.clausule = i === 1; })}
      <p>Kans dat ze akkoord gaan: <span class="risico ${cls}" style="white-space:nowrap">${lab} · ${Math.round(k * 100)}%</span></p>
      <p class="muted klein-tekst">Goede cijfers, een hoge status en vertrouwen van de trainer helpen. Je zaakwaarnemer ${agentNaam()} praat mee.${sp.leeftijd >= 30 ? ' Op jouw leeftijd geven clubs niet graag lange contracten.' : ''}</p>
      <div class="rij">${knop('Voorstel doen', contractVoorstel, 'hoofd middel', 'data-blijf')}${knop('Annuleren', () => { tmp.contract = null; }, 'klein', 'data-blijf')}</div></div>`;
  } else if (reden) h += `<p class="muted">${esc(reden)}</p>`;
  else h += `<p class="muted klein-tekst">Je kunt de club vragen om meer geld of een langer contract. Hoe beter je speelt, hoe groter de kans op een ja. Vraag je te veel, dan vindt de club je hebberig.</p><div class="rij">${knop('Om een nieuw contract vragen', contractStart, 'klein', 'data-blijf')}</div>`;
  return h + `</section>`;
}
