import { S, club, ovr } from '../../core/state.js';
import { esc } from '../../core/utils.js';
import { CLUBS, DIVS, divClubs } from '../../data/gegevens.js';
import { metVoorletter } from '../../game/media/nieuws.js';
import { netGekocht, netUitJeugd, rugTeam } from '../../game/team/rugnummers.js';
import { clubLogo } from '../../data/logos.js';

/* ===================== Teamoverzicht: de klasse van elke speler ===================== */
// Hoe sterk is je team, wie zijn de besten, en wie groeit of gaat achteruit (ten opzichte van vorig seizoen)
const LINIES = [['K', 'Keepers'], ['V', 'Verdedigers'], ['M', 'Middenvelders'], ['A', 'Aanvallers']];
const MIJN_POS = {SPITS:'A', MID:'M', VERD:'V', KEEPER:'K'};
const NAAM = {K:'keeper', V:'verdediger', M:'middenvelder', A:'aanvaller'}, NAAM_MV = {K:'keepers', V:'verdedigers', M:'middenvelders', A:'aanvallers'};
// Nog geen klasse van vorig seizoen (eerste seizoen, net uit de jeugd of net gekocht): een streepje in plaats van een pijl
const trend = (nu, vorig) => vorig === undefined || vorig === null ? '<span class="muted" title="Nog geen vorig seizoen om mee te vergelijken">–</span>'
  : nu > vorig ? `<span class="goedtxt">▲ +${nu - vorig}</span>` : nu < vorig ? `<span class="fouttxt">▼ ${nu - vorig}</span>` : '<span class="muted">=</span>';
export function vSelectie(){
  const sp = S.sp; if (sp.o23) return '';
  const c = club(), sel = rugTeam(sp.club), t = c.t, ik = ovr(sp), mijnPos = MIJN_POS[sp.pos];
  const basis = sel.filter(x => x.basis), gemBasis = basis.length ? basis.reduce((a, x) => a + x.k, 0) / basis.length : 0;
  const gemLft = sel.reduce((a, x) => a + (x.lft || 25), 0) / sel.length;
  const rang = divClubs(t).sort((a, b) => CLUBS[b].s - CLUBS[a].s).indexOf(sp.club) + 1;
  const hist = (S.teamHist || {})[sp.club] || [], vorig = hist.length >= 2 ? hist[hist.length - 2].s : null;
  const zelfde = sel.filter(x => x.pos === mijnPos), beterDan = zelfde.filter(x => x.k < ik).length;
  const mijnRol = beterDan === zelfde.length ? `de beste ${NAAM[mijnPos]} van het team` : beterDan === 0 ? `de minst sterke ${NAAM[mijnPos]} van het team` : `${zelfde.length - beterDan + 1}e van de ${zelfde.length + 1} ${NAAM_MV[mijnPos]}`;
  const rij = x => `<tr class="${x.jij ? 'mij' : ''}"><td class="muted">${x.nr ? '#' + x.nr : ''}</td><td><span class="rnaam">${x.jij ? esc(sp.naam) + ' (jij)' : esc(metVoorletter(x))}</span>${!x.jij && netUitJeugd(x) ? ' <span class="goedtxt klein-tekst">uit de jeugd</span>' : !x.jij && netGekocht(x) ? ' <span class="klein-tekst" style="color:var(--info)">nieuw</span>' : ''}</td><td class="col-lft">${x.lft ?? ''}</td><td><b>${x.k}</b></td><td>${trend(x.k, x.kVorig)}</td><td class="col-rol muted">${x.jij ? 'Jij' : x.basis ? 'Basis' : 'Bank'}</td></tr>`;
  const ikRij = {jij:true, nr:sp.rug && sp.rug.nr, lft:sp.leeftijd, k:ik, kVorig:sp.ovrVorig, basis:null, pos:mijnPos};
  const linies = LINIES.map(([pos, l]) => {
    const groep = sel.filter(x => x.pos === pos).concat(pos === mijnPos ? [ikRij] : []).sort((a, b) => b.k - a.k);
    return `<tr class="linie"><td colspan="6">${l}</td></tr>${groep.map(rij).join('')}`;
  }).join('');
  return `<section id="selectiePanel" class="paneel sectie"><h3 class="sectiekop selectiekop">${clubLogo(sp.club, 64)}<span>Selectie van ${esc(c.n)}</span></h3>
    <div class="feiten selectiefeiten">
      <div><span class="label">Teamsterkte</span><b>${c.s}</b>${vorig !== null ? ` ${trend(c.s, vorig)}` : ''}</div>
      <div><span class="label">Basiself gemiddeld</span><b>${gemBasis.toFixed(1).replace('.', ',')}</b></div>
      <div><span class="label">In de ${esc(DIVS[t])}</span><b>${rang}e sterkste</b></div>
      <div><span class="label">Gemiddelde leeftijd</span><b>${gemLft.toFixed(1).replace('.', ',')}</b></div>
      <div><span class="label">Jij</span><b>${ik}</b> <span class="muted klein-tekst">${mijnRol}</span></div>
    </div>
    <p class="muted klein-tekst">Elke zomer worden spelers een jaar ouder: jongens groeien, routiniers gaan achteruit en wie 34 is stopt. De beste spelers op elke positie staan in de basis. De pijlen laten zien hoe iemand veranderde sinds vorig seizoen. Een streepje betekent dat er nog geen vorig seizoen is om mee te vergelijken.</p>
    ${sel.some(x => x.kVorig !== undefined) ? '' : '<p class="melding">De trends verschijnen na de eerste zomer, als je teamgenoten een seizoen ouder zijn.</p>'}
    <div class="tabelwrap"><table class="tabel selectietabel"><thead><tr><th>#</th><th>Speler</th><th class="col-lft">Lft</th><th>Klasse</th><th>Trend</th><th class="col-rol">Rol</th></tr></thead><tbody>${linies}</tbody></table></div></section>`;
}
