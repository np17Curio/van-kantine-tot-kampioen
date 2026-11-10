import { S } from '../../core/state.js';
import { keuzeKnop, knop, render } from '../../core/ui.js';
import { instel, pitchSpeel, pitchStatisch } from '../pitch.js';
import { esc } from '../../core/utils.js';
import { karakter } from '../../game/speler/persoonlijkheid.js';
import { HOOFDSTUKKEN, TOON, deelVan, hoofdstukTitel, hoofdstukInhoud, kiesHoofdstuk, opaNaam, PEN_RICHTING, penKlaar, penRichting, toonLabel, verderHoofdstuk } from '../../game/speler/journey.js';

// Een hoofdstukkaart van jouw verhaal: titel, tekst, een citaat van opa en (soms) een gesprek waarin je een toon kiest
export function vHoofdstuk(){
  const H = S.hoofdstuk, I = hoofdstukInhoud(), opa = opaNaam();
  const keuzes = I.opts.length && H.keuze === null
    ? `<div class="keuzes">${I.opts.map((o, i) => keuzeKnop(`${TOON[o.toon].i} ${esc(o.l)}`, TOON[o.toon].n + (o.toon === 'kalm' ? ' · de trainer waardeert rust' : o.toon === 'fel' ? ' · de fans houden van vuur' : ' · blijf bij jezelf'), () => kiesHoofdstuk(i), 'data-blijf')).join('')}</div>`
    : '';
  const uit = H.uit ? `<p class="melding">${esc(H.uit)}</p>` : '';
  // De laatste penalty van de proloog op het veld: eerst kies je (als je zelf schiet) waar, dan zie je hem
  const p = H.pen, bezig = !!(p && p.fase !== 'klaar');
  const veld = bezig ? `<div id="pitchVerhaal" class="pitch25"><div class="pitchvak"><canvas aria-label="De laatste strafschop van de jeugdfinale"></canvas>${p.fase === 'richting'
      ? `<div class="pitchkeuze"><p class="moment">De laatste strafschop. Waar schiet je hem?</p><div class="keuzes">${PEN_RICHTING.map(r => keuzeKnop(esc(r.l), r.s, () => penRichting(r.id), 'data-blijf')).join('')}</div></div>` : ''}</div>
      <div class="rij pitchknop" style="justify-content:flex-end">${knop('Overslaan ⏭', penKlaar, 'klein', 'data-blijf')}</div></div>` : '';
  const verder = (!I.opts.length || H.keuze !== null) && !bezig ? knop(H.h === 0 ? 'Naar de selectiedagen' : H.h === 2 ? 'Bekijk de aanbiedingen' : 'Verder', verderHoofdstuk) : '';
  return `<div class="verhaal hoofdstuk"><span class="label">Deel ${deelVan(H.h).nr}: ${esc(deelVan(H.h).n)} · hoofdstuk ${H.h} van ${HOOFDSTUKKEN.length - 1}</span>
      <h2>${esc(hoofdstukTitel(H.h))}</h2>
      ${I.tekst.map(t => `<p>${esc(t)}</p>`).join('')}
      ${I.opa ? `<p class="quote">${esc(I.opa)} <span class="muted">· ${esc(opa)}</span></p>` : ''}
      ${uit}
      ${S.sp.toon ? `<p class="muted klein-tekst" title="${esc(karakter().veld + ' ' + karakter().buiten)}">Jouw karakter tot nu toe: <b>${karakter().i} ${toonLabel()}</b>. ${esc(karakter().buiten)}</p>` : ''}
    </div>${veld}${keuzes}${verder}`;
}
// Na het tekenen (ui.js): het veld van de proloogpenalty stil laten staan of de penalty afspelen
export function hoofdstukNaRender(){
  const el = document.getElementById('pitchVerhaal'), p = S && S.hoofdstuk && S.hoofdstuk.pen; if (!el || !p) return;
  if (instel().anim === 'uit' && p.fase === 'speel'){ penKlaar(); return setTimeout(render); }
  if (p.fase === 'richting') pitchStatisch(el, 'penalty');
  else if (p.fase === 'speel') pitchSpeel(el, p.anim, () => { penKlaar(); render(); });
}
