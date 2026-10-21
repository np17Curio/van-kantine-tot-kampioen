import { S } from '../../core/state.js';
import { keuzeKnop, knop } from '../../core/ui.js';
import { esc } from '../../core/utils.js';
import { HOOFDSTUKKEN, TOON, deelVan, hoofdstukTitel, hoofdstukInhoud, kiesHoofdstuk, opaNaam, toonLabel, verderHoofdstuk } from '../../game/speler/journey.js';

// Een hoofdstukkaart van jouw verhaal: titel, tekst, een citaat van opa en (soms) een gesprek waarin je een toon kiest
export function vHoofdstuk(){
  const H = S.hoofdstuk, I = hoofdstukInhoud(), opa = opaNaam();
  const keuzes = I.opts.length && H.keuze === null
    ? `<div class="keuzes">${I.opts.map((o, i) => keuzeKnop(`${TOON[o.toon].i} ${esc(o.l)}`, TOON[o.toon].n + (o.toon === 'kalm' ? ' · de trainer waardeert rust' : o.toon === 'fel' ? ' · de fans houden van vuur' : ' · blijf bij jezelf'), () => kiesHoofdstuk(i), 'data-blijf')).join('')}</div>`
    : '';
  const uit = H.uit ? `<p class="melding">${esc(H.uit)}</p>` : '';
  const verder = !I.opts.length || H.keuze !== null ? knop(H.h === 0 ? 'Naar de selectiedagen' : H.h === 2 ? 'Bekijk de aanbiedingen' : 'Verder', verderHoofdstuk) : '';
  return `<div class="verhaal hoofdstuk"><span class="label">Deel ${deelVan(H.h).nr}: ${esc(deelVan(H.h).n)} · hoofdstuk ${H.h} van ${HOOFDSTUKKEN.length - 1}</span>
      <h2>${esc(hoofdstukTitel(H.h))}</h2>
      ${I.tekst.map(t => `<p>${esc(t)}</p>`).join('')}
      ${I.opa ? `<p class="quote">${esc(I.opa)} <span class="muted">· ${esc(opa)}</span></p>` : ''}
      ${uit}
      ${S.sp.toon ? `<p class="muted klein-tekst">Jouw karakter tot nu toe: <b>${toonLabel()}</b>.</p>` : ''}
    </div>${keuzes}${verder}`;
}
